import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from './payment.entity';
import { Appointment } from '../appointments/appointment.entity';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    @InjectRepository(Appointment)
    private appointmentRepository: Repository<Appointment>,
    private notificationsService: NotificationsService,
  ) {}

  async createRecord(appointmentId: number, amount: number, stripeSessionId?: string) {
    try {
      const appt = await this.appointmentRepository.findOne({ where: { id: appointmentId } });
      if (!appt) throw new Error('Appointment not found');
      const p = this.paymentRepository.create({ appointment: appt, amount, stripeSessionId, status: 'pending' });
      return await this.paymentRepository.save(p);
    } catch (error) {
      throw new InternalServerErrorException(error.message || 'Could not create payment');
    }
  }

  async updateSession(paymentId: number, stripeSessionId: string) {
    const p = await this.paymentRepository.findOne({ where: { id: paymentId } });
    if (!p) throw new Error('Payment not found');
    p.stripeSessionId = stripeSessionId;
    return this.paymentRepository.save(p);
  }

  async markSucceededBySession(sessionId: string) {
    const p = await this.paymentRepository.findOne({ where: { stripeSessionId: sessionId } });
    if (!p) throw new Error('Payment not found');
    p.status = 'succeeded';
    await this.paymentRepository.save(p);

    // mark appointment paid
    const appt = await this.appointmentRepository.findOne({ where: { id: p.appointment.id } });
    if (appt) {
      appt.paid = true;
      await this.appointmentRepository.save(appt);
    }

    // emit notification for real-time clients
    try {
      this.notificationsService.emit({
        type: 'payment_succeeded',
        paymentId: p.id,
        appointmentId: appt?.id,
        paid: true,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      console.warn('Could not emit payment_succeeded notification', err?.message || err);
    }

    return p;
  }

  async findByAppointment(appointmentId: number) {
    return this.paymentRepository.find({ where: { appointment: { id: appointmentId } }, order: { createdAt: 'DESC' } });
  }
}
