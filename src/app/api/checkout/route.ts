import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

// ─── Stripe Checkout Session creation ────────────────────────────────────────
// Creates a Stripe Checkout Session with the customer's email pre-filled,
// so Stripe links the subscription to the correct account.

function getStripe(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY env var not set');
  }
  return new Stripe(secretKey);
}

const VALID_PRICES = new Set([
  'price_1TL36uLb8GrBRxdXWMHCqJrP',  // Pro $49/mo
  'price_1TL36uLb8GrBRxdXz92Wem2T',  // Enterprise $499/mo
]);

export async function POST(req: NextRequest) {
  try {
    const stripe = getStripe();
    const body = await req.json();

    const { priceId, email, returnUrl } = body as {
      priceId?: string;
      email?: string;
      returnUrl?: string;
    };

    if (!priceId || !VALID_PRICES.has(priceId)) {
      return NextResponse.json({ error: 'Invalid price ID' }, { status: 400 });
    }

    const origin = returnUrl || req.nextUrl.origin;

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}?checkout=success`,
      cancel_url: `${origin}?checkout=cancelled`,
      allow_promotion_codes: true,
    };

    // Pre-fill customer email if provided (from authenticated user)
    if (email) {
      sessionParams.customer_email = email;
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    return NextResponse.json({ url: session.url });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Internal error';
    console.error('[checkout]', msg);

    // If Stripe isn't configured, return a fallback
    if (msg.includes('STRIPE_SECRET_KEY')) {
      return NextResponse.json(
        { error: 'Payments not configured', fallback: true },
        { status: 503 }
      );
    }

    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
