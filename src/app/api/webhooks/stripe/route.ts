import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// ─── Price ID → tier mapping ────────────────────────────────────────────────
const PRICE_TIER_MAP: Record<string, 'pro' | 'enterprise'> = {
  price_1TL36uLb8GrBRxdXWMHCqJrP: 'pro',        // $49/mo
  price_1TL36uLb8GrBRxdXz92Wem2T: 'enterprise',  // $499/mo
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getStripe(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY env var not set');
  }
  return new Stripe(secretKey);
}

function getSupabaseAdmin() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    'https://xrcszfaqxgiodewznpwk.supabase.co';
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    '';
  return createClient(url, serviceKey);
}

function tierFromPriceId(priceId: string): 'pro' | 'enterprise' | null {
  return PRICE_TIER_MAP[priceId] ?? null;
}

// Resolve a Stripe customer ID to the Supabase user ID via email lookup.
async function resolveUserId(
  stripe: Stripe,
  supabase: ReturnType<typeof getSupabaseAdmin>,
  customerId: string
): Promise<string | null> {
  try {
    const customer = await stripe.customers.retrieve(customerId);
    if (customer.deleted) return null;
    const email = (customer as Stripe.Customer).email;
    if (!email) return null;

    // Try looking up by email in the auth.users view via service role
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (error || !data) return null;
    return data.id as string;
  } catch {
    return null;
  }
}

async function setUserTier(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  userId: string,
  tier: 'free' | 'pro' | 'enterprise'
): Promise<void> {
  await supabase
    .from('users')
    .update({ subscription_tier: tier })
    .eq('id', userId);
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get('stripe-signature') ?? '';
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let stripe: Stripe;
  try {
    stripe = getStripe();
  } catch {
    // Stripe not configured — return 200 to avoid Stripe retries in dev
    return NextResponse.json({ received: true, note: 'stripe not configured' }, { status: 200 });
  }

  // ── Verify signature ──────────────────────────────────────────────────────
  let event: Stripe.Event;
  if (webhookSecret && signature) {
    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'invalid signature';
      return NextResponse.json({ error: msg }, { status: 400 });
    }
  } else {
    // No secret configured (local dev) — parse the body directly
    try {
      event = JSON.parse(rawBody) as Stripe.Event;
    } catch {
      return NextResponse.json({ error: 'invalid json' }, { status: 400 });
    }
  }

  const supabase = getSupabaseAdmin();

  // ── Event dispatch ────────────────────────────────────────────────────────
  try {
    switch (event.type) {
      // ── checkout.session.completed ──────────────────────────────────────
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const customerId = session.customer as string | null;
        if (!customerId) break;

        // Determine tier from line items / subscription
        let tier: 'pro' | 'enterprise' | null = null;

        if (session.subscription) {
          const sub = await stripe.subscriptions.retrieve(session.subscription as string);
          const priceId = sub.items.data[0]?.price?.id;
          if (priceId) tier = tierFromPriceId(priceId);
        }

        if (!tier) break;

        const userId = await resolveUserId(stripe, supabase, customerId);
        if (userId) await setUserTier(supabase, userId, tier);
        break;
      }

      // ── customer.subscription.updated ──────────────────────────────────
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = sub.customer as string;
        const priceId = sub.items.data[0]?.price?.id;
        const tier = priceId ? tierFromPriceId(priceId) : null;
        if (!tier) break;

        const userId = await resolveUserId(stripe, supabase, customerId);
        if (userId) await setUserTier(supabase, userId, tier);
        break;
      }

      // ── customer.subscription.deleted ──────────────────────────────────
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = sub.customer as string;

        const userId = await resolveUserId(stripe, supabase, customerId);
        if (userId) await setUserTier(supabase, userId, 'free');
        break;
      }

      default:
        // Unhandled event — return 200 so Stripe doesn't retry
        break;
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'internal error';
    console.error('[stripe-webhook]', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
