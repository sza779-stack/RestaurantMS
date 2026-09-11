# Payment Gateway Setup Guide

This guide explains how to obtain and configure API keys for various payment providers supported by the RestaurantMS system.

## 💳 Stripe Setup

1. **Create an Account**: Go to [Stripe.com](https://stripe.com) and create an account.
2. **Obtain API Keys** (stay in **Test mode** in the Dashboard):
   - Navigate to **Developers** > **API keys**.
   - Copy your **Publishable key** (`pk_test_...`).
   - Copy your **Secret key** (`sk_test_...` — click “Reveal test key”).
3. **Apply keys** (either path works — store settings override `scaffold/api` env when both are set for the secret key):
   - **Admin UI**: In **Admin** > **Settings** > **General** > **Payments** > **Stripe**, paste **Publishable key**, **Secret key**, and (optional) **Webhook secret**. Click **Save** so keys are stored in `store_settings.paymentConfigs` for the current store.
   - **API environment**: Alternatively or as a fallback for all stores, set in `scaffold/api/.env` (see `.env.example`):
     `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, and optionally `STRIPE_CHECKOUT_SUCCESS_URL` / `STRIPE_CHECKOUT_CANCEL_URL` (defaults redirect to web-online on port 3002).
4. **Webhooks for local testing**: Stripe cannot reach `localhost`. Use the [Stripe CLI](https://stripe.com/docs/stripe-cli):
   - `stripe login`
   - `stripe listen --forward-to localhost:3000/api/v1/payments/webhook/stripe`
   - Copy the CLI **webhook signing secret** (`whsec_...`) into `STRIPE_WEBHOOK_SECRET` (or paste it in Admin » Stripe » Webhook Secret and save — the API verifies using env first, then the store-specific secret).
5. **Dashboard webhooks for a public dev URL**: If your API has a reachable URL:
   - **Developers** > **Webhooks** > **Add endpoint**.
   - URL: `https://your-api-domain.com/api/v1/payments/webhook/stripe`.
   - Events: **`checkout.session.completed`**, **`payment_intent.succeeded`**.
   - Copy **Signing secret** into `STRIPE_WEBHOOK_SECRET` (or Admin → Stripe → Webhook Secret).

## 🅿️ PayPal Setup (v2 Checkout)

1. **Developer Portal**: Log in to the [PayPal Developer Portal](https://developer.paypal.com/).
2. **Create App**:
   - Go to **Apps & Credentials**.
   - Select **Sandbox** or **Live**.
   - Click **Create App**.
3. **Copy Credentials**:
   - Copy the **Client ID**.
   - Copy the **Secret**.
4. **Enter in Admin**: Paste these into **Settings > General > Payment > PayPal Configuration**. Set the mode to **Sandbox** for testing or **Live** for production.
5. **Web ordering**: PayPal Hosted Checkout (`/api/v1/payments/paypal/create-order` + `/paypal/capture`) is wired in **web-online** when PayPal credentials are saved and **Accept online payments** is enabled — no webhook required for MVP (capture occurs on redirect).

## ⬛ Square Setup

1. **Developer Console**: Log in to the [Square Developer Portal](https://developer.squareup.com/).
2. **Create Application**: Click **+ New Application**.
3. **Copy Credentials**:
   - Navigate to **Credentials** in the sidebar.
   - Copy the **Application ID**.
   - Copy the **Access Token**.
4. **Obtain Location ID**:
   - Navigate to **Locations** in the sidebar.
   - Copy the **Location ID** for your specific store.
5. **Enter in Admin**: Paste these into **Settings > General > Payment > Square Configuration**. Toggle **Sandbox / test credentials** unless you’re on production keys.
6. **Web ordering**: The customer site loads **Square Web Payments** (`https://web.squarecdn.com`) and charges via `POST /api/v1/payments/square/charge` with the browser token (`source_id`).

---

### 🚀 Usage in POS

Once configured, these payment methods will become active for online orders and POS transactions. The system automatically routes payments to the correct provider based on your configuration.

> [!TIP]
> Always use **Sandbox/Test** mode initially to ensure everything is working correctly before switching to **Live** production keys.
