import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

// ─── Stripe Checkout Session creation ────────────────────────────────────────
// Creates a Stripe Checkout Session with the customer's email pre-filled.
// Falls back to payment links if the API key is missing or invalid.

const PAYMENT_LINKS: Record<string, string> = {
  'price_1TL36uLb8GrBRxdXWMHCqJrP': 'https://buy.stripe.com/fZufZi0xL2hg0lUaBsbwk03',  // Pro
  'price_1TL36uLb8GrBRxdXz92Wem2T': 'https://buy.stripe.com/dRmbJ2bcpg864Ca6lcbwk02',  // Enterprise
};

const VALID_PRICES = new Set(Object.keys(PAYMENT_LINKS));

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { priceId, email, returnUrl } = body as {
    priceId?: string;
    email?: string;
    returnUrl?: string;
  };

  if (!priceId || !VALID_PRICES.has(priceId)) {
    return NextResponse.json({ error: 'Invalid price ID' }, { status: 400 });
  }

  // Always have the payment link ready as fallback
  const fallbackUrl = PAYMENT_LINKS[priceId];

  try {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) throw new Error('STRIPE_SECRET_KEY not set');

    const stripe = new Stripe(secretKey);
    const origin = returnUrl || req.nextUrl.origin;

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}?checkout=success`,
      cancel_url: `${origin}?checkout=cancelled`,
      allow_promotion_codes: true,
    };

    if (email) {
      sessionParams.customer_email = email;
    }

    const session = await stripe.checkout.sessions.create(sessionParams);
    return NextResponse.json({ url: session.url });
  } catch (err) {
    // Any Stripe failure → gracefully return the payment link instead
    console.error('[checkout] Stripe session failed, using payment link fallback:', err instanceof Error ? err.message : err);
    return NextResponse.json({ url: fallbackUrl });
  }
}
