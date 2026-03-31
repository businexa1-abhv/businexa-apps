# Businexa API

Node.js + Express REST API for **Businexa**, a QR code advertisement platform connecting shop owners and customers. Authentication uses **Firebase** (OTP flow with server-side hashing), persistence uses **MongoDB** (Mongoose), and subscriptions use **Razorpay**.

## Requirements

- Node.js 18+
- MongoDB (Atlas or local)
- Firebase project with Admin SDK credentials (for verifying ID tokens and custom tokens after OTP)
- Razorpay keys (for payments)

## Quick start

This package lives in the **Businexa monorepo**. From the repo root (`web-app-businexa`):

```bash
npm install
npm run dev:api
```

Or work only in this folder:

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Environment**

   Copy `.env.example` to `.env` and set at least:

   - `MONGODB_URI`
   - `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` (newline escapes as `\n` in `.env`)
   - `RAZORPAY_KEY_ID`, `RAZORPAY_SECRET` (for subscription orders)
   - `CORS_ORIGIN` (comma-separated allowed origins)

3. **Run**

   ```bash
   npm run dev
   ```

   Server defaults to `http://localhost:5000` (override with `PORT`).

4. **Health check**

   ```http
   GET /health
   ```

## Project layout

| Path | Purpose |
|------|---------|
| `server.js` | Process entry: loads env, connects MongoDB, listens |
| `src/app.js` | Express app: security headers, CORS, JSON body, `/api/*` routes |
| `src/config/` | MongoDB, Firebase Admin, Razorpay clients |
| `src/models/` | Mongoose schemas (`User`, `Shop`, `Product`, `Subscription`, etc.) |
| `src/routes/` | Route modules mounted under `/api/auth`, `/api/shops`, … |
| `src/controllers/` | HTTP handlers |
| `src/services/` | OTP, auth, shops, subscriptions, QR, email |
| `src/middleware/` | Auth, rate limits, validation (Joi), errors |
| `src/utils/` | Logging (Winston), crypto helpers, validators, cloud storage stubs |

See `NODEJS_API_GENERATION_PROMPT.md` in the repo for full endpoint and schema specifications.

## API overview

- **Auth** — `POST /api/auth/send-otp`, `POST /api/auth/verify-otp`, `GET /api/auth/me`, …
- **Shops** — CRUD, metrics, QR URL generation (requires active subscription)
- **Products** — CRUD, search, categories (multipart `image` supported; upload wiring to S3/Cloudinary is pluggable in `src/utils/cloudStorage.js`)
- **Subscriptions** — plans, Razorpay order/create/verify, webhooks
- **Users** — profile, preferences, notifications, account deletion
- **QR** — public tracking and shop payload endpoints
- **Analytics** — dashboard and per-shop summaries (when `ENABLE_ANALYTICS=true`)

## Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Production start (`node server.js`) |
| `npm run dev` | Development with nodemon |
| `npm test` | Jest (add tests under `__tests__` or `*.test.js`) |
| `npm run format` | Prettier |

## Security notes

- OTPs are hashed (PBKDF2) before storage; development mode may log OTP to the console for testing only.
- Razorpay webhooks should verify `X-Razorpay-Signature` against the **raw** request body in production; the included handler is a starting point—confirm Razorpay’s signing requirements for your integration.
- Never commit `.env` or service account JSON files.

## License

Proprietary / UNLICENSED unless otherwise specified by the project owner.
