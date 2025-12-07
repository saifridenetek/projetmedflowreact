Stripe local testing and webhook setup
=====================================

This file explains how to install and run the Stripe CLI on Windows and how to obtain/set the `STRIPE_WEBHOOK_SECRET` so the local backend can receive webhook events (needed to mark payments as paid).

Prerequisites
-------------
- Node.js and npm installed
- Your backend running locally (default: http://localhost:3002)

Install the Stripe CLI (Windows)
-------------------------------
You have several options. Pick the one that works best for you.

1) Recommended: Official Windows installer
   - Download and run the Stripe CLI installer from the Stripe docs (use the URL shown in the Stripe docs for the latest installer).
   - After installation, open a new PowerShell window and run:

     stripe version

   - If the command returns the Stripe version, the CLI is installed.

2) npm global (quick, sometimes requires PATH fix)
   - Install globally:

     npm install -g stripe

   - If PowerShell says `stripe: command not found`, you may need to add npm global binaries to your PATH. By default on Windows the global npm bin is:

     %APPDATA%\npm

   - Add that directory to your PATH or open a new shell so the change takes effect.

3) Package managers (Scoop / Chocolatey)
   - If you use Scoop or Chocolatey you can install via those tools; check their docs for the exact package name.

Log in with the Stripe CLI
--------------------------
Once installed, log in to your Stripe account (in test mode):

  stripe login

This opens a browser and connects the CLI to your account.

Forward webhooks to your local backend
-------------------------------------
Start listening and forward checkout/session events to your webhook endpoint:

  stripe listen --forward-to http://localhost:3002/payments/webhook

When you run this, the CLI will print a line that includes a webhook secret that looks like `whsec_...`. Save that value.

4242 4242 4242 4242
12/34
123

Set the webhook secret in your backend environment
-------------------------------------------------
Add the following to your `backend/.env` (or set as environment variables in your shell):

  STRIPE_SECRET_KEY=sk_test_your_test_secret_here
  STRIPE_WEBHOOK_SECRET=whsec_from_stripe_listen
  FRONTEND_URL=http://localhost:5173

Restart your backend after changing environment variables.

Notes about EventSource and local testing
----------------------------------------
- The backend exposes an SSE endpoint at `/notifications/stream`. The receptionist frontend connects there and will receive events when payments succeed or appointment statuses change.
- If you can't install the Stripe CLI, you can still test without webhooks by manually calling the webhook endpoint with a simulated payload. However, Stripe's CLI makes local testing easy and provides the real `checkout.session.completed` events.

Troubleshooting
---------------
- If `stripe` is not recognized after npm global install, ensure `%APPDATA%\npm` is in your PATH and open a new shell.
- If `stripe listen` shows events but your backend doesn't react, confirm `STRIPE_WEBHOOK_SECRET` matches the secret printed by `stripe listen` and your backend is reachable at the forwarded URL.
- On Windows, if a process already listens on port 3002, stop it or change the backend port in `src/main.ts`.
