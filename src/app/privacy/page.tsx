'use client';

import Link from 'next/link';

/* ─── ChainIntel SVG Logo ──────────────────────────────────────────── */
function ChainIntelLogo() {
  return (
    <Link href="/" style={{ textDecoration: 'none', display: 'inline-flex', flexDirection: 'column', alignItems: 'center' }}>
      <svg
        width="180"
        height="36"
        viewBox="0 0 180 36"
        fill="none"
        aria-label="ChainIntel Terminal"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Chain-link icon mark */}
        <rect x="0" y="8" width="10" height="6" rx="3" fill="#00d4aa" />
        <rect x="6" y="8" width="10" height="6" rx="3" fill="none" stroke="#00d4aa" strokeWidth="1.5" />
        <rect x="12" y="8" width="10" height="6" rx="3" fill="none" stroke="#4a6a8c" strokeWidth="1.5" />

        {/* Vertical connector dots */}
        <circle cx="5" cy="22" r="1.5" fill="#00d4aa" />
        <circle cx="11" cy="22" r="1.5" fill="#4a6a8c" />
        <circle cx="17" cy="22" r="1.5" fill="#1f3550" />

        {/* CHAIN text */}
        <text
          x="28"
          y="20"
          fontFamily="'JetBrains Mono', monospace"
          fontSize="16"
          fontWeight="600"
          letterSpacing="0.06em"
          fill="#e4eaf4"
        >
          CHAIN
        </text>
        {/* INTEL text in cyan */}
        <text
          x="93"
          y="20"
          fontFamily="'JetBrains Mono', monospace"
          fontSize="16"
          fontWeight="600"
          letterSpacing="0.06em"
          fill="#00d4aa"
        >
          INTEL
        </text>

        {/* Sub-label */}
        <text
          x="28"
          y="31"
          fontFamily="'JetBrains Mono', monospace"
          fontSize="6.5"
          letterSpacing="0.14em"
          fill="#4a6a8c"
        >
          DIGITAL ASSET INTELLIGENCE
        </text>
      </svg>
    </Link>
  );
}

/* ─── Section Header ────────────────────────────────────────────────── */
function SectionHeader({ number, title }: { number: string; title: string }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      marginBottom: '16px',
      paddingBottom: '12px',
      borderBottom: '1px solid var(--b1)',
    }}>
      <span style={{
        fontFamily: 'var(--mono)',
        fontSize: '9px',
        color: 'var(--cyan)',
        letterSpacing: '0.16em',
        background: 'rgba(0,212,170,0.08)',
        border: '1px solid rgba(0,212,170,0.2)',
        padding: '3px 8px',
        flexShrink: 0,
      }}>
        §{number}
      </span>
      <h2 style={{
        fontFamily: 'var(--mono)',
        fontSize: '13px',
        fontWeight: 600,
        color: 'var(--text)',
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        margin: 0,
      }}>
        {title}
      </h2>
    </div>
  );
}

/* ─── Body text styles ───────────────────────────────────────────────── */
const bodyText: React.CSSProperties = {
  fontFamily: 'var(--sans)',
  fontSize: '14px',
  color: 'var(--text2)',
  lineHeight: 1.75,
  margin: '0 0 14px 0',
};

const bodyTextLast: React.CSSProperties = {
  ...bodyText,
  margin: 0,
};

const subHeading: React.CSSProperties = {
  fontFamily: 'var(--mono)',
  fontSize: '10px',
  fontWeight: 600,
  color: 'var(--text)',
  letterSpacing: '0.10em',
  textTransform: 'uppercase',
  margin: '18px 0 8px 0',
};

/* ─── Data Category Row ─────────────────────────────────────────────── */
function DataRow({ category, examples, purpose, legal }: {
  category: string;
  examples: string;
  purpose: string;
  legal: string;
}) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '160px 1fr 1fr 120px',
      gap: '12px',
      padding: '12px 16px',
      background: 'var(--s2)',
      border: '1px solid var(--b1)',
      borderTop: 'none',
      alignItems: 'start',
    }}>
      <span style={{
        fontFamily: 'var(--mono)',
        fontSize: '9px',
        fontWeight: 600,
        color: 'var(--cyan)',
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        paddingTop: '2px',
      }}>{category}</span>
      <span style={{ fontFamily: 'var(--sans)', fontSize: '12px', color: 'var(--text2)', lineHeight: 1.5 }}>{examples}</span>
      <span style={{ fontFamily: 'var(--sans)', fontSize: '12px', color: 'var(--muted)', lineHeight: 1.5 }}>{purpose}</span>
      <span style={{
        fontFamily: 'var(--mono)',
        fontSize: '8px',
        color: 'var(--text2)',
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        paddingTop: '2px',
      }}>{legal}</span>
    </div>
  );
}

function DataTableHeader() {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '160px 1fr 1fr 120px',
      gap: '12px',
      padding: '8px 16px',
      background: 'var(--s1)',
      border: '1px solid var(--b1)',
    }}>
      {['Data Category', 'Examples', 'Purpose', 'Legal Basis'].map((col) => (
        <span key={col} style={{
          fontFamily: 'var(--mono)',
          fontSize: '8px',
          color: 'var(--muted)',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
        }}>{col}</span>
      ))}
    </div>
  );
}

/* ─── Rights Row ────────────────────────────────────────────────────── */
function RightRow({ right, description }: { right: string; description: string }) {
  return (
    <div style={{
      display: 'flex',
      gap: '16px',
      padding: '12px 16px',
      background: 'var(--s2)',
      border: '1px solid var(--b1)',
      borderTop: 'none',
      alignItems: 'flex-start',
    }}>
      <span style={{
        fontFamily: 'var(--mono)',
        fontSize: '9px',
        fontWeight: 600,
        color: 'var(--cyan)',
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        minWidth: '160px',
        paddingTop: '2px',
        flexShrink: 0,
      }}>{right}</span>
      <span style={{ fontFamily: 'var(--sans)', fontSize: '13px', color: 'var(--text2)', lineHeight: 1.6 }}>
        {description}
      </span>
    </div>
  );
}

function RightTableHeader() {
  return (
    <div style={{
      display: 'flex',
      gap: '16px',
      padding: '8px 16px',
      background: 'var(--s1)',
      border: '1px solid var(--b1)',
    }}>
      <span style={{
        fontFamily: 'var(--mono)',
        fontSize: '8px',
        color: 'var(--muted)',
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        minWidth: '160px',
      }}>Right</span>
      <span style={{
        fontFamily: 'var(--mono)',
        fontSize: '8px',
        color: 'var(--muted)',
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
      }}>Description</span>
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────────────────────── */
export default function PrivacyPolicyPage() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      fontFamily: 'var(--sans)',
    }}>
      {/* Top nav bar */}
      <div style={{
        borderBottom: '1px solid var(--b1)',
        background: 'var(--s1)',
        padding: '0 40px',
        height: '48px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}>
        <ChainIntelLogo />
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <Link href="/tos" style={{
            fontFamily: 'var(--mono)',
            fontSize: '9px',
            letterSpacing: '0.12em',
            color: 'var(--muted)',
            textDecoration: 'none',
            textTransform: 'uppercase',
          }}>
            Terms of Service
          </Link>
          <Link href="/" style={{
            fontFamily: 'var(--mono)',
            fontSize: '9px',
            letterSpacing: '0.12em',
            color: 'var(--cyan)',
            textDecoration: 'none',
            textTransform: 'uppercase',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
          }}>
            ← Terminal
          </Link>
        </div>
      </div>

      {/* Page body */}
      <div style={{
        maxWidth: '820px',
        margin: '0 auto',
        padding: '56px 40px 100px',
      }}>

        {/* Page title block */}
        <div style={{ marginBottom: '48px' }}>
          <div style={{
            fontFamily: 'var(--mono)',
            fontSize: '9px',
            color: 'var(--cyan)',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            marginBottom: '12px',
          }}>
            Legal Documentation
          </div>
          <h1 style={{
            fontFamily: 'var(--mono)',
            fontSize: '28px',
            fontWeight: 600,
            color: '#fff',
            letterSpacing: '0.04em',
            margin: '0 0 12px 0',
            lineHeight: 1.2,
          }}>
            Privacy Policy
          </h1>
          <div style={{
            display: 'flex',
            gap: '24px',
            flexWrap: 'wrap',
          }}>
            <span style={{
              fontFamily: 'var(--mono)',
              fontSize: '9px',
              color: 'var(--muted)',
              letterSpacing: '0.10em',
            }}>
              LAST UPDATED: APRIL 1, 2026
            </span>
            <span style={{
              fontFamily: 'var(--mono)',
              fontSize: '9px',
              color: 'var(--muted)',
              letterSpacing: '0.10em',
            }}>
              EFFECTIVE: APRIL 1, 2026
            </span>
            <span style={{
              fontFamily: 'var(--mono)',
              fontSize: '9px',
              color: 'var(--muted)',
              letterSpacing: '0.10em',
            }}>
              ENTITY: CHAININTEL INC.
            </span>
          </div>
          <div style={{
            marginTop: '20px',
            padding: '14px 16px',
            background: 'rgba(0,212,170,0.04)',
            border: '1px solid rgba(0,212,170,0.15)',
          }}>
            <p style={{
              ...bodyTextLast,
              fontSize: '13px',
              color: 'var(--text2)',
            }}>
              ChainIntel Inc. ("ChainIntel," "we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, store, share, and protect information about you when you use the ChainIntel Terminal platform ("the Service") at chainintelterminal.com. By using the Service, you consent to the practices described in this policy.
            </p>
          </div>
        </div>

        {/* ── Section divider ── */}
        <div style={{ borderTop: '1px solid var(--b1)', marginBottom: '40px' }} />

        {/* § 1 — Data We Collect */}
        <section style={{ marginBottom: '48px' }}>
          <SectionHeader number="1" title="Data We Collect" />
          <p style={bodyText}>
            We collect the following categories of personal and usage data when you use ChainIntel Terminal:
          </p>

          <div style={{ marginBottom: '20px' }}>
            <DataTableHeader />
            <DataRow
              category="Account Data"
              examples="Email address, hashed password, account creation date, subscription tier"
              purpose="Account management, authentication, service delivery"
              legal="Contract"
            />
            <DataRow
              category="Usage Analytics"
              examples="Pages visited, tabs opened, feature interactions, session duration, terminal commands"
              purpose="Product improvement, performance optimization, abuse prevention"
              legal="Legitimate interest"
            />
            <DataRow
              category="Payment Data"
              examples="Billing email, last 4 digits of card, Stripe customer ID, transaction history"
              purpose="Processing payments, managing subscriptions, fraud prevention"
              legal="Contract"
            />
            <DataRow
              category="Technical Data"
              examples="IP address, browser type, operating system, timezone, device type, referrer URL"
              purpose="Security, fraud prevention, service optimization"
              legal="Legitimate interest"
            />
            <DataRow
              category="Communication Data"
              examples="Support emails, in-app feedback, survey responses"
              purpose="Customer support, product improvement"
              legal="Legitimate interest"
            />
            <DataRow
              category="Preference Data"
              examples="Terminal layout preferences, watchlist settings, alert configurations"
              purpose="Personalizing your terminal experience"
              legal="Contract"
            />
          </div>

          <p style={subHeading}>Data We Do Not Collect</p>
          <p style={bodyTextLast}>
            We do not collect your full payment card numbers (handled exclusively by Stripe), your government-issued identification, your investment portfolio holdings outside what you voluntarily input, or your private cryptographic wallet keys or seed phrases. We are not a custodial service.
          </p>
        </section>

        {/* § 2 — How We Use Your Data */}
        <section style={{ marginBottom: '48px' }}>
          <SectionHeader number="2" title="How We Use Your Data" />
          <p style={bodyText}>
            We use the data we collect for the following purposes:
          </p>
          <div style={{
            padding: '16px 20px',
            background: 'var(--s1)',
            border: '1px solid var(--b1)',
            marginBottom: '16px',
          }}>
            {[
              { label: 'Service Delivery', desc: 'To authenticate your account, process your subscription, and provide you with access to the features included in your subscription tier.' },
              { label: 'Platform Improvement', desc: 'To analyze usage patterns, identify performance issues, build new features, and improve the overall terminal experience.' },
              { label: 'Security & Fraud Prevention', desc: 'To detect and prevent unauthorized access, abuse, scraping, and other malicious activity on the platform.' },
              { label: 'Communications', desc: 'To send you transactional emails (account confirmations, payment receipts, subscription changes), product updates, and security alerts. You may opt out of non-essential communications at any time.' },
              { label: 'Legal Compliance', desc: 'To comply with applicable laws, regulations, court orders, and other legal obligations, including tax and financial reporting requirements.' },
              { label: 'Customer Support', desc: 'To respond to your inquiries, troubleshoot issues, and provide technical assistance.' },
            ].map((item, i, arr) => (
              <div key={i} style={{
                display: 'flex',
                gap: '12px',
                marginBottom: i < arr.length - 1 ? '14px' : 0,
                alignItems: 'flex-start',
              }}>
                <span style={{
                  fontFamily: 'var(--mono)',
                  fontSize: '8px',
                  color: 'var(--cyan)',
                  flexShrink: 0,
                  marginTop: '4px',
                  letterSpacing: '0.10em',
                  textTransform: 'uppercase',
                  minWidth: '140px',
                }}>{item.label}</span>
                <span style={{
                  fontFamily: 'var(--sans)',
                  fontSize: '13px',
                  color: 'var(--text2)',
                  lineHeight: 1.65,
                }}>{item.desc}</span>
              </div>
            ))}
          </div>
          <p style={bodyTextLast}>
            We do not use your data for automated decision-making or profiling that produces legal or similarly significant effects without your consent.
          </p>
        </section>

        {/* § 3 — Third-Party Services & Sub-Processors */}
        <section style={{ marginBottom: '48px' }}>
          <SectionHeader number="3" title="Third-Party Services & Sub-Processors" />
          <p style={bodyText}>
            ChainIntel works with trusted third-party service providers to operate the platform. Below are our primary sub-processors and their roles:
          </p>

          {/* Supabase */}
          <div style={{
            padding: '16px 20px',
            background: 'var(--s1)',
            border: '1px solid var(--b1)',
            marginBottom: '12px',
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '8px',
              flexWrap: 'wrap',
              gap: '8px',
            }}>
              <span style={{ fontFamily: 'var(--mono)', fontSize: '11px', fontWeight: 600, color: 'var(--text)', letterSpacing: '0.06em' }}>
                Supabase
              </span>
              <span style={{
                fontFamily: 'var(--mono)',
                fontSize: '8px',
                color: 'var(--text2)',
                letterSpacing: '0.10em',
                textTransform: 'uppercase',
                background: 'var(--s2)',
                border: '1px solid var(--b2)',
                padding: '2px 8px',
              }}>Authentication · Database · Storage</span>
            </div>
            <p style={{ ...bodyTextLast, fontSize: '13px' }}>
              We use Supabase as our authentication and database platform. Supabase stores your account data, preferences, and platform settings. Your email address and hashed password are stored in Supabase-hosted PostgreSQL databases. Supabase is SOC 2 Type II compliant and processes data in accordance with GDPR. Data may be stored in US-East AWS regions unless otherwise configured.
            </p>
          </div>

          {/* Stripe */}
          <div style={{
            padding: '16px 20px',
            background: 'var(--s1)',
            border: '1px solid var(--b1)',
            marginBottom: '12px',
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '8px',
              flexWrap: 'wrap',
              gap: '8px',
            }}>
              <span style={{ fontFamily: 'var(--mono)', fontSize: '11px', fontWeight: 600, color: 'var(--text)', letterSpacing: '0.06em' }}>
                Stripe, Inc.
              </span>
              <span style={{
                fontFamily: 'var(--mono)',
                fontSize: '8px',
                color: 'var(--text2)',
                letterSpacing: '0.10em',
                textTransform: 'uppercase',
                background: 'var(--s2)',
                border: '1px solid var(--b2)',
                padding: '2px 8px',
              }}>Payment Processing · Billing</span>
            </div>
            <p style={{ ...bodyTextLast, fontSize: '13px' }}>
              All payment processing is handled by Stripe, Inc. ChainIntel does not store or process your full payment card details. Stripe is PCI-DSS Level 1 certified. When you subscribe to a paid plan, your payment information is collected directly by Stripe and governed by Stripe's Privacy Policy (stripe.com/privacy). ChainIntel receives only a tokenized customer ID, transaction status, and non-sensitive billing details (e.g., last 4 digits, card brand).
            </p>
          </div>

          {/* Data APIs */}
          <div style={{
            padding: '16px 20px',
            background: 'var(--s1)',
            border: '1px solid var(--b1)',
            marginBottom: '12px',
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '8px',
              flexWrap: 'wrap',
              gap: '8px',
            }}>
              <span style={{ fontFamily: 'var(--mono)', fontSize: '11px', fontWeight: 600, color: 'var(--text)', letterSpacing: '0.06em' }}>
                Data API Providers
              </span>
              <span style={{
                fontFamily: 'var(--mono)',
                fontSize: '8px',
                color: 'var(--text2)',
                letterSpacing: '0.10em',
                textTransform: 'uppercase',
                background: 'var(--s2)',
                border: '1px solid var(--b2)',
                padding: '2px 8px',
              }}>Market & On-Chain Data</span>
            </div>
            <p style={{ ...bodyText, fontSize: '13px' }}>
              ChainIntel fetches market data, on-chain metrics, and analytics from various third-party APIs including CoinGecko, DefiLlama, Glassnode, The Block, Dune Analytics, alternative.me, and other public data providers. These calls are made from ChainIntel's backend servers; your personal information is not transmitted to these providers.
            </p>
            <p style={{ ...bodyTextLast, fontSize: '13px' }}>
              Your IP address may be visible in server logs if requests are proxied through our infrastructure, but we do not share identifiable user data with data API providers.
            </p>
          </div>

          {/* Analytics */}
          <div style={{
            padding: '16px 20px',
            background: 'var(--s1)',
            border: '1px solid var(--b1)',
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '8px',
              flexWrap: 'wrap',
              gap: '8px',
            }}>
              <span style={{ fontFamily: 'var(--mono)', fontSize: '11px', fontWeight: 600, color: 'var(--text)', letterSpacing: '0.06em' }}>
                Analytics Providers
              </span>
              <span style={{
                fontFamily: 'var(--mono)',
                fontSize: '8px',
                color: 'var(--text2)',
                letterSpacing: '0.10em',
                textTransform: 'uppercase',
                background: 'var(--s2)',
                border: '1px solid var(--b2)',
                padding: '2px 8px',
              }}>Usage Analytics</span>
            </div>
            <p style={{ ...bodyTextLast, fontSize: '13px' }}>
              We may use privacy-respecting analytics tools (such as Vercel Analytics or PostHog, configured in privacy-preserving mode) to collect aggregated usage telemetry. These tools do not track individual users across websites and do not use third-party advertising cookies. All analytics data is aggregated and anonymized where possible.
            </p>
          </div>
        </section>

        {/* § 4 — No Sale of Data */}
        <section style={{ marginBottom: '48px' }}>
          <SectionHeader number="4" title="No Sale of Personal Data" />
          <div style={{
            padding: '16px 20px',
            background: 'rgba(0,212,170,0.04)',
            border: '1px solid rgba(0,212,170,0.2)',
            marginBottom: '16px',
          }}>
            <p style={{
              fontFamily: 'var(--mono)',
              fontSize: '11px',
              color: 'var(--cyan)',
              letterSpacing: '0.06em',
              fontWeight: 600,
              margin: '0 0 8px 0',
            }}>
              We do not sell your personal data. Ever.
            </p>
            <p style={{ ...bodyTextLast, fontSize: '13px' }}>
              ChainIntel does not sell, rent, lease, or trade your personal information to any third party for their marketing or advertising purposes. Our business model is based on subscription fees, not the monetization of your data.
            </p>
          </div>
          <p style={bodyText}>
            We may share your data with third parties only in the following limited circumstances:
          </p>
          <div style={{
            padding: '14px 20px',
            background: 'var(--s1)',
            border: '1px solid var(--b1)',
          }}>
            {[
              'With sub-processors listed in Section 3, solely to provide the Service;',
              'With legal authorities when required by valid legal process (court orders, subpoenas, regulatory requests);',
              'With a successor entity in the event of a merger, acquisition, or sale of substantially all assets, with advance notice to users;',
              'To protect the rights, property, or safety of ChainIntel, our users, or the public.',
            ].map((item, i) => (
              <div key={i} style={{
                display: 'flex',
                gap: '12px',
                marginBottom: i < 3 ? '10px' : 0,
                alignItems: 'flex-start',
              }}>
                <span style={{ fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--cyan)', flexShrink: 0, marginTop: '3px' }}>◆</span>
                <span style={{ fontFamily: 'var(--sans)', fontSize: '13px', color: 'var(--text2)', lineHeight: 1.65 }}>{item}</span>
              </div>
            ))}
          </div>
        </section>

        {/* § 5 — Cookie Policy */}
        <section style={{ marginBottom: '48px' }}>
          <SectionHeader number="5" title="Cookie Policy" />
          <p style={bodyText}>
            ChainIntel uses a minimal cookie footprint. We believe in respecting your browser and your privacy.
          </p>
          <p style={subHeading}>Cookies We Use</p>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 80px',
            gap: '0',
            marginBottom: '16px',
          }}>
            <div style={{
              display: 'contents',
            }}>
              {/* Header */}
              <div style={{ padding: '8px 16px', background: 'var(--s1)', border: '1px solid var(--b1)', fontFamily: 'var(--mono)', fontSize: '8px', color: 'var(--muted)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Cookie / Storage Key</div>
              <div style={{ padding: '8px 16px', background: 'var(--s1)', border: '1px solid var(--b1)', borderLeft: 'none', fontFamily: 'var(--mono)', fontSize: '8px', color: 'var(--muted)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Purpose</div>
              <div style={{ padding: '8px 16px', background: 'var(--s1)', border: '1px solid var(--b1)', borderLeft: 'none', fontFamily: 'var(--mono)', fontSize: '8px', color: 'var(--muted)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Required</div>
              {/* Rows */}
              {[
                { name: 'sb-[project]-auth-token', purpose: 'Supabase authentication session — keeps you logged in across page reloads', req: 'Yes' },
                { name: 'stripe.js cookies', purpose: 'Stripe payment processing fraud prevention; only active during checkout flow', req: 'Yes' },
                { name: 'ci_preferences (localStorage)', purpose: 'Stores your terminal layout, tab order, and display preferences locally', req: 'No' },
                { name: 'ci_session (sessionStorage)', purpose: 'Temporary session state; cleared when browser tab is closed', req: 'No' },
              ].map((row, i) => (
                <>
                  <div key={`name-${i}`} style={{ padding: '10px 16px', background: 'var(--s2)', border: '1px solid var(--b1)', borderTop: 'none', fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--text2)', letterSpacing: '0.04em', wordBreak: 'break-all' }}>{row.name}</div>
                  <div key={`purpose-${i}`} style={{ padding: '10px 16px', background: 'var(--s2)', border: '1px solid var(--b1)', borderTop: 'none', borderLeft: 'none', fontFamily: 'var(--sans)', fontSize: '12px', color: 'var(--muted)', lineHeight: 1.5 }}>{row.purpose}</div>
                  <div key={`req-${i}`} style={{ padding: '10px 16px', background: 'var(--s2)', border: '1px solid var(--b1)', borderTop: 'none', borderLeft: 'none', fontFamily: 'var(--mono)', fontSize: '9px', color: row.req === 'Yes' ? 'var(--cyan)' : 'var(--muted)', letterSpacing: '0.08em' }}>{row.req}</div>
                </>
              ))}
            </div>
          </div>
          <p style={bodyText}>
            We do not use tracking cookies, advertising cookies, or any cookies that follow you across third-party websites. We do not participate in cross-site tracking or retargeting advertising networks.
          </p>
          <p style={subHeading}>Cookie Control</p>
          <p style={bodyTextLast}>
            You can configure your browser to refuse cookies or to alert you when cookies are being sent. However, disabling the authentication cookie will prevent you from accessing your account. Disabling localStorage will cause your terminal preferences to reset on each visit.
          </p>
        </section>

        {/* § 6 — Data Security */}
        <section style={{ marginBottom: '48px' }}>
          <SectionHeader number="6" title="Data Security" />
          <p style={bodyText}>
            ChainIntel implements industry-standard security measures to protect your personal data against unauthorized access, alteration, disclosure, or destruction. These measures include:
          </p>
          <div style={{
            padding: '16px 20px',
            background: 'var(--s1)',
            border: '1px solid var(--b1)',
            marginBottom: '16px',
          }}>
            {[
              { label: 'Encryption in Transit', desc: 'All data transmitted between your browser and ChainIntel\'s servers is encrypted using TLS 1.2 or higher.' },
              { label: 'Encryption at Rest', desc: 'Sensitive data stored in our Supabase databases is encrypted at rest using AES-256.' },
              { label: 'Password Security', desc: 'Passwords are never stored in plaintext. Supabase uses bcrypt hashing with salting for password storage.' },
              { label: 'Access Controls', desc: 'Database access is restricted to authorized ChainIntel personnel on a need-to-know basis, with audit logging enabled.' },
              { label: 'API Security', desc: 'All API endpoints are protected by authentication tokens with short expiry windows and automatic rotation.' },
            ].map((item, i, arr) => (
              <div key={i} style={{
                display: 'flex',
                gap: '12px',
                marginBottom: i < arr.length - 1 ? '12px' : 0,
                alignItems: 'flex-start',
              }}>
                <span style={{ fontFamily: 'var(--mono)', fontSize: '8px', color: 'var(--cyan)', flexShrink: 0, marginTop: '4px', letterSpacing: '0.10em', textTransform: 'uppercase', minWidth: '140px' }}>{item.label}</span>
                <span style={{ fontFamily: 'var(--sans)', fontSize: '13px', color: 'var(--text2)', lineHeight: 1.65 }}>{item.desc}</span>
              </div>
            ))}
          </div>
          <p style={bodyTextLast}>
            No method of data transmission over the internet or electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your data, we cannot guarantee absolute security. In the event of a data breach affecting your personal information, we will notify you as required by applicable law.
          </p>
        </section>

        {/* § 7 — Data Retention */}
        <section style={{ marginBottom: '48px' }}>
          <SectionHeader number="7" title="Data Retention" />
          <p style={bodyText}>
            We retain your personal data for as long as necessary to provide the Service and fulfill the purposes described in this policy, unless a longer retention period is required or permitted by law.
          </p>
          <div style={{
            padding: '14px 20px',
            background: 'var(--s1)',
            border: '1px solid var(--b1)',
            marginBottom: '16px',
          }}>
            {[
              { type: 'Active Account Data', period: 'Retained for the duration of your account' },
              { type: 'Usage Analytics', period: 'Aggregated data retained indefinitely; raw logs deleted after 90 days' },
              { type: 'Payment Records', period: '7 years from transaction date (tax & legal compliance)' },
              { type: 'Support Communications', period: '3 years from last interaction' },
              { type: 'Deleted Account Data', period: 'Purged within 30 days of account deletion, except where legally required' },
              { type: 'Server Access Logs', period: 'Deleted after 30 days' },
            ].map((row, i, arr) => (
              <div key={i} style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: '20px',
                padding: i === 0 ? '0 0 10px 0' : '10px 0',
                borderBottom: i < arr.length - 1 ? '1px solid var(--b1)' : 'none',
                flexWrap: 'wrap',
              }}>
                <span style={{ fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--text2)', letterSpacing: '0.06em' }}>{row.type}</span>
                <span style={{ fontFamily: 'var(--sans)', fontSize: '12px', color: 'var(--muted)' }}>{row.period}</span>
              </div>
            ))}
          </div>
          <p style={bodyTextLast}>
            After the applicable retention period, data is either securely deleted or anonymized such that it can no longer reasonably be associated with you.
          </p>
        </section>

        {/* § 8 — GDPR / CCPA Rights */}
        <section style={{ marginBottom: '48px' }}>
          <SectionHeader number="8" title="Your Privacy Rights (GDPR & CCPA)" />
          <p style={bodyText}>
            Depending on your location, you may have the following rights regarding your personal data. We honor these rights for all users regardless of jurisdiction, to the extent technically feasible.
          </p>

          <p style={subHeading}>Rights Under GDPR (EU/EEA/UK Residents)</p>
          <div style={{ marginBottom: '20px' }}>
            <RightTableHeader />
            <RightRow right="Right to Access" description="You may request a copy of the personal data we hold about you, including information about how it is processed." />
            <RightRow right="Right to Rectification" description="You may request correction of any inaccurate or incomplete personal data we hold about you." />
            <RightRow right="Right to Erasure" description="You may request deletion of your personal data ('right to be forgotten'), subject to legal retention obligations." />
            <RightRow right="Right to Restriction" description="You may request that we restrict processing of your data in certain circumstances (e.g., while accuracy is contested)." />
            <RightRow right="Right to Portability" description="You may request a machine-readable export of your personal data for transfer to another controller." />
            <RightRow right="Right to Object" description="You may object to processing based on our legitimate interests, including for direct marketing purposes." />
            <RightRow right="Automated Decisions" description="You have the right not to be subject to solely automated decisions that produce significant legal effects." />
            <RightRow right="Withdraw Consent" description="Where processing is based on consent, you may withdraw consent at any time without affecting prior lawful processing." />
          </div>

          <p style={subHeading}>Rights Under CCPA (California Residents)</p>
          <p style={bodyText}>
            California residents have the following rights under the California Consumer Privacy Act (CCPA) and the California Privacy Rights Act (CPRA):
          </p>
          <div style={{ marginBottom: '16px' }}>
            <RightTableHeader />
            <RightRow right="Right to Know" description="You have the right to know what personal information we collect, use, disclose, and sell (we don't sell)." />
            <RightRow right="Right to Delete" description="You have the right to request deletion of personal information we have collected, subject to certain exceptions." />
            <RightRow right="Right to Correct" description="You have the right to correct inaccurate personal information we maintain about you." />
            <RightRow right="Right to Opt-Out" description="You have the right to opt out of the 'sale' or 'sharing' of your personal information. We do not sell or share data." />
            <RightRow right="Non-Discrimination" description="We will not discriminate against you for exercising any of your CCPA/CPRA rights." />
          </div>

          <p style={subHeading}>Exercising Your Rights</p>
          <p style={bodyTextLast}>
            To exercise any of the above rights, please contact us at support@chainintelterminal.com with the subject line "Privacy Request." We will respond within 30 days (GDPR) or 45 days (CCPA) of receiving a verifiable request. We may need to verify your identity before processing your request. There is no cost for submitting a privacy rights request.
          </p>
        </section>

        {/* § 9 — Children's Privacy */}
        <section style={{ marginBottom: '48px' }}>
          <SectionHeader number="9" title="Children's Privacy" />
          <p style={bodyTextLast}>
            The ChainIntel Terminal platform is not directed to individuals under the age of 18. We do not knowingly collect personal information from minors. If you believe we have inadvertently collected information from a minor, please contact us immediately at support@chainintelterminal.com and we will take prompt steps to delete the information.
          </p>
        </section>

        {/* § 10 — International Data Transfers */}
        <section style={{ marginBottom: '48px' }}>
          <SectionHeader number="10" title="International Data Transfers" />
          <p style={bodyText}>
            ChainIntel is based in the United States. If you access the Service from outside the United States, your data may be transferred to and processed in the United States and other countries where our sub-processors operate, which may have different data protection laws than your country of residence.
          </p>
          <p style={bodyText}>
            For transfers of personal data from the European Economic Area (EEA), United Kingdom, or Switzerland to the United States, we rely on appropriate legal transfer mechanisms, including Standard Contractual Clauses (SCCs) as adopted by the European Commission, or other lawful transfer mechanisms as applicable.
          </p>
          <p style={bodyTextLast}>
            By using the Service, you acknowledge that your data may be transferred to and processed in the United States and other jurisdictions.
          </p>
        </section>

        {/* § 11 — Changes to This Policy */}
        <section style={{ marginBottom: '48px' }}>
          <SectionHeader number="11" title="Changes to This Privacy Policy" />
          <p style={bodyText}>
            ChainIntel reserves the right to update this Privacy Policy at any time. When we make material changes, we will notify you by email (to the address associated with your account) and/or by displaying a prominent notice on the platform at least 14 days before the changes take effect.
          </p>
          <p style={bodyTextLast}>
            For non-material changes (e.g., clarifications, typo corrections), we may update the policy without prior notice. The "Last Updated" date at the top of this page will always reflect the most recent revision. Your continued use of the Service after any changes take effect constitutes your acceptance of the revised policy.
          </p>
        </section>

        {/* § 12 — Contact / DPO */}
        <section style={{ marginBottom: '48px' }}>
          <SectionHeader number="12" title="Contact & Data Protection" />
          <p style={bodyText}>
            If you have any questions, concerns, or requests regarding this Privacy Policy or the handling of your personal data, please contact us:
          </p>
          <div style={{
            padding: '20px 24px',
            background: 'var(--s1)',
            border: '1px solid var(--b2)',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '20px',
            marginBottom: '16px',
          }}>
            <div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: '8px', color: 'var(--muted)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '6px' }}>Legal Entity</div>
              <div style={{ fontFamily: 'var(--sans)', fontSize: '13px', color: 'var(--text)' }}>ChainIntel Inc.</div>
            </div>
            <div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: '8px', color: 'var(--muted)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '6px' }}>Privacy Contact</div>
              <a href="mailto:support@chainintelterminal.com" style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--cyan)', textDecoration: 'none' }}>
                support@chainintelterminal.com
              </a>
            </div>
            <div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: '8px', color: 'var(--muted)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '6px' }}>Subject Line</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--text2)' }}>"Privacy Request"</div>
            </div>
            <div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: '8px', color: 'var(--muted)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '6px' }}>Response Time</div>
              <div style={{ fontFamily: 'var(--sans)', fontSize: '13px', color: 'var(--text)' }}>Within 30 days</div>
            </div>
          </div>
          <p style={bodyText}>
            EU/EEA users who believe their GDPR rights have not been honored may also lodge a complaint with their local data protection supervisory authority.
          </p>
          <p style={bodyTextLast}>
            If you are a California resident and would like to submit a privacy request under CCPA, please include "CCPA Privacy Request" in the subject line of your email and specify which right(s) you wish to exercise.
          </p>
        </section>

        {/* Footer */}
        <div style={{ borderTop: '1px solid var(--b1)', paddingTop: '32px' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
          }}>
            <div style={{
              fontFamily: 'var(--mono)',
              fontSize: '8px',
              color: 'var(--muted)',
              letterSpacing: '0.10em',
            }}>
              © 2026 ChainIntel Inc. — chainintelterminal.com — All rights reserved.
            </div>
            <div style={{ display: 'flex', gap: '20px' }}>
              <Link href="/tos" style={{
                fontFamily: 'var(--mono)',
                fontSize: '8px',
                color: 'var(--muted)',
                textDecoration: 'none',
                letterSpacing: '0.10em',
              }}>
                Terms of Service
              </Link>
              <Link href="/" style={{
                fontFamily: 'var(--mono)',
                fontSize: '8px',
                color: 'var(--cyan)',
                textDecoration: 'none',
                letterSpacing: '0.10em',
              }}>
                ← Back to Terminal
              </Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
