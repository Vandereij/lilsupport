// lib/stripe.ts
import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe() {
  if (_stripe) return _stripe;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    // Don't throw at import time; throw here and let the route catch & JSON it.
    throw new Error("Missing STRIPE_SECRET_KEY");
  }
  _stripe = new Stripe(key, { apiVersion: "2024-06-20" });
  return _stripe;
}
