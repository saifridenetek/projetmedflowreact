import { Controller, Post, Body, UseGuards, Request, Res, Headers, HttpCode, HttpStatus, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { PaymentsService } from './payments.service';
import type { Response } from 'express';

// NOTE: you must set STRIPE_SECRET_KEY in env and install 'stripe' package

@Controller('payments')
export class PaymentsController {
  private stripe: any;
  constructor(private paymentsService: PaymentsService) {
    try {
      // lazy require so server doesn't crash if stripe isn't installed yet
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const Stripe = require('stripe');
      this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');
    } catch (err) {
      this.stripe = null;
      console.warn('Stripe module not found or not configured; payments disabled until configured.');
    }
  }

  @Post('create-session')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin','receptionist')
  async createSession(@Body() body: any, @Request() req) {
    // body: { appointmentId, amount, currency }
    const domain = process.env.FRONTEND_URL || 'http://localhost:5173';
    const { appointmentId, amount, currency = 'eur' } = body;
    // create payment record first
    const payment = await this.paymentsService.createRecord(Number(appointmentId), Number(amount));

  if (!this.stripe) throw new Error('Stripe not configured. Install stripe and set STRIPE_SECRET_KEY.');

  const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: currency,
            product_data: { name: `Consultation #${appointmentId}` },
            unit_amount: Math.round(Number(amount) * 100),
          },
          quantity: 1,
        }
      ],
      mode: 'payment',
      success_url: `${domain}/payments/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${domain}/payments/cancel`,
      metadata: { appointmentId: String(appointmentId), paymentId: String(payment.id) }
    });

    // save session id on payment (update the existing record)
    try {
      await this.paymentsService.updateSession(payment.id, session.id);
    } catch (err) {
      console.warn('Unable to update payment session id on record', err.message || err);
    }

    // return session url to frontend
    return { url: session.url, id: session.id };
  }

  // Webhook endpoint (public) — Stripe will call this
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async webhook(@Req() req: any, @Res() res: Response) {
    const signature = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    let event: any = null;
    let payload = req.body; // raw body (Buffer) because main.ts registers bodyParser.raw for this route
    try {
      if (webhookSecret) {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || '');
        event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
      } else {
        // If no webhook secret provided, try to parse the body as JSON
        event = JSON.parse(payload.toString());
      }
    } catch (err) {
      console.error('Webhook signature verification failed.', err?.message || err);
      return res.status(400).send(`Webhook Error: ${err?.message || err}`);
    }

    // Handle the checkout.session.completed event
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const sessionId = session.id;
      try {
        await this.paymentsService.markSucceededBySession(sessionId);
      } catch (err) {
        console.error('Error marking payment succeeded', err);
      }
    }

    res.json({ received: true });
  }
}
