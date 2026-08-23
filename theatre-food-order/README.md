# Reel Bites — Theatre Food Ordering (Prototype)

A minimal, serverless demo: customers order food from their seat via a QR
code, pay with Razorpay (test mode), and theatre staff see live orders on a
dashboard with batching by item and by row — with sound + vibration alerts
for new orders.

**Stack:** Vite + React (frontend) · Cloudflare Pages Functions (serverless
backend) · Neon Postgres (serverless DB) · Razorpay (test mode payments).

👉 **Start here: `setup.txt`** — a full, no-terminal-required walkthrough for
getting this from a zip file on your phone to a live deployed URL.

## Project layout

```
src/               React frontend (customer, tracking, staff, admin pages)
functions/api/     Serverless API routes (Cloudflare Pages Functions)
db/schema.sql       Database tables — run once in Neon
db/seed.sql          Demo theatre/screens/menu — run once in Neon
setup.txt          Full step-by-step setup guide (read this first)
```
