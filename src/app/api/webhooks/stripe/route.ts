import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { sendEmail, getWelcomeEmailHtml } from '@/lib/email';

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
): Promise<{ userId: string | null; email: string | null }> {
  try {
    const customer = await stripe.customers.retrieve(customerId);
    if (customer.deleted) return { userId: null, email: null };
    const email = (customer as Stripe.Customer).email;
    if (!email) return { userId: null, email: null };

    // Try looking up by email in the users table
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (error || !data) return { userId: null, email };
    return { userId: data.id as string, email };
  } catch {
    return { userId: null, email: null };
  }
}

async function setUserTier(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  userId: string,
  tier: 'free' | 'pro' | 'enterprise',
  stripeCustomerId?: string,
  stripeSubscriptionId?: string
): Promise<void> {
  const update: Record<string, unknown> = {
    subscription_tier: tier,
    subscription_status: tier === 'free' ? 'inactive' : 'active',
    updated_at: new Date().toISOString(),
  };

  if (stripeCustomerId) {
    update.stripe_customer_id = stripeCustomerId;
  }
  if (stripeSubscriptionId) {
    update.stripe_subscription_id = stripeSubscriptionId;
  }
  if (tier !== 'free') {
    update.subscription_started_at = new Date().toISOString();
  }

  await supabase
    .from('users')
    .update(update)
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
        let subscriptionId: string | null = null;

        if (session.subscription) {
          subscriptionId = session.subscription as string;
          const sub = await stripe.subscriptions.retrieve(subscriptionId);
          const priceId = sub.items.data[0]?.price?.id;
          if (priceId) tier = tierFromPriceId(priceId);
        }

        if (!tier) break;

        const { userId, email: customerEmail } = await resolveUserId(stripe, supabase, customerId);
        if (userId) {
          await setUserTier(supabase, userId, tier, customerId, subscriptionId || undefined);
          console.log(`[stripe-webhook] checkout.session.completed: user=${userId} tier=${tier}`);

          // Send welcome email
          if (customerEmail) {
            const html = getWelcomeEmailHtml(tier, customerEmail);
            await sendEmail({
              to: customerEmail,
              subject: tier === 'enterprise'
                ? 'Welcome to ChainIntel Enterprise — Your Terminal is Ready'
                : 'Welcome to ChainIntel Pro — Your Terminal is Ready',
              html,
            });
          }
        } else {
          // User hasn't signed up yet — store in subscriptions table for later matching
          const customer = await stripe.customers.retrieve(customerId);
          const email = !customer.deleted ? (customer as Stripe.Customer).email : null;
          if (email) {
            await supabase.from('subscriptions').upsert({
              email,
              stripe_customer_id: customerId,
              stripe_subscription_id: subscriptionId,
              plan: tier,
              status: 'active',
              updated_at: new Date().toISOString(),
            }, { onConflict: 'email' });
            console.log(`[stripe-webhook] Stored pending subscription for ${email} (no user account yet)`);
          }
        }
        break;
      }

      // ── customer.subscription.updated ──────────────────────────────────
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = sub.customer as string;
        const priceId = sub.items.data[0]?.price?.id;
        const tier = priceId ? tierFromPriceId(priceId) : null;
        if (!tier) break;

        const { userId } = await resolveUserId(stripe, supabase, customerId);
        if (userId) {
          await setUserTier(supabase, userId, tier, customerId, sub.id);
          console.log(`[stripe-webhook] subscription.updated: user=${userId} tier=${tier}`);
        }
        break;
      }

      // ── customer.subscription.deleted ──────────────────────────────────
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = sub.customer as string;

        const { userId, email } = await resolveUserId(stripe, supabase, customerId);
        if (userId) {
          await supabase
            .from('users')
            .update({
              subscription_tier: 'free',
              subscription_status: 'cancelled',
              subscription_ends_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('id', userId);
          console.log(`[stripe-webhook] subscription.deleted: user=${userId} → free`);
        }
        // Also update subscriptions table
        if (email) {
          await supabase.from('subscriptions').upsert({
            email,
            stripe_customer_id: customerId,
            stripe_subscription_id: sub.id,
            plan: 'free',
            status: 'cancelled',
            updated_at: new Date().toISOString(),
          }, { onConflict: 'email' });
        }
        break;
      }

      // ── invoice.payment_succeeded ──────────────────────────────────────
      case 'invoice.payment_succeeded': {
        // Renewal confirmation — keep tier active
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string | null;
        if (!customerId) break;

        const { userId } = await resolveUserId(stripe, supabase, customerId);
        if (userId) {
          await supabase
            .from('users')
            .update({
              subscription_status: 'active',
              updated_at: new Date().toISOString(),
            })
            .eq('id', userId);
        }
        break;
      }

      // ── invoice.payment_failed ─────────────────────────────────────────
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string | null;
        if (!customerId) break;

        const { userId } = await resolveUserId(stripe, supabase, customerId);
        if (userId) {
          await supabase
            .from('users')
            .update({
              subscription_status: 'past_due',
              updated_at: new Date().toISOString(),
            })
            .eq('id', userId);
          console.log(`[stripe-webhook] invoice.payment_failed: user=${userId} → past_due`);
        }
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
