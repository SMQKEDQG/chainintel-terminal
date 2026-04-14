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
        <rect x="0" y="8" width="10" height="6" rx="3" fill="#E8A534" />
        <rect x="6" y="8" width="10" height="6" rx="3" fill="none" stroke="#E8A534" strokeWidth="1.5" />
        <rect x="12" y="8" width="10" height="6" rx="3" fill="none" stroke="#4a6a8c" strokeWidth="1.5" />

        {/* Vertical connector dots */}
        <circle cx="5" cy="22" r="1.5" fill="#E8A534" />
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
          fill="#E8A534"
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
        color: 'var(--accent)',
        letterSpacing: '0.16em',
        background: 'rgba(232,165,52,0.08)',
        border: '1px solid rgba(232,165,52,0.2)',
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

/* ─── Pricing Row ───────────────────────────────────────────────────── */
function PricingRow({ tier, price, description }: { tier: string; price: string; description: string }) {
  const isFree = tier === 'Free';
  const isEnterprise = tier === 'Enterprise';
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '100px 130px 1fr',
      gap: '16px',
      padding: '12px 16px',
      background: 'var(--s2)',
      border: '1px solid var(--b1)',
      marginBottom: '8px',
      alignItems: 'center',
    }}>
      <span style={{
        fontFamily: 'var(--mono)',
        fontSize: '10px',
        fontWeight: 600,
        color: isFree ? 'var(--text2)' : isEnterprise ? 'var(--gold)' : 'var(--accent)',
        letterSpacing: '0.10em',
        textTransform: 'uppercase',
      }}>
        {tier}
      </span>
      <span style={{
        fontFamily: 'var(--mono)',
        fontSize: '12px',
        color: 'var(--text)',
        fontWeight: 500,
      }}>
        {price}
      </span>
      <span style={{
        fontFamily: 'var(--sans)',
        fontSize: '12px',
        color: 'var(--muted)',
        lineHeight: 1.5,
      }}>
        {description}
      </span>
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────────────────────── */
export default function TermsOfServicePage() {
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
          <Link href="/privacy" style={{
            fontFamily: 'var(--mono)',
            fontSize: '9px',
            letterSpacing: '0.12em',
            color: 'var(--muted)',
            textDecoration: 'none',
            textTransform: 'uppercase',
          }}>
            Privacy Policy
          </Link>
          <Link href="/" style={{
            fontFamily: 'var(--mono)',
            fontSize: '9px',
            letterSpacing: '0.12em',
            color: 'var(--accent)',
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
            color: 'var(--accent)',
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
            Terms of Service
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
            background: 'rgba(232,165,52,0.04)',
            border: '1px solid rgba(232,165,52,0.15)',
          }}>
            <p style={{
              ...bodyTextLast,
              fontSize: '13px',
              color: 'var(--text2)',
            }}>
              These Terms of Service govern your use of the ChainIntel Terminal platform and all associated services operated by ChainIntel Inc. ("ChainIntel," "we," "our," or "us"), accessible at chainintelterminal.com. Please read these terms carefully. By accessing or using our services, you agree to be legally bound by these terms.
            </p>
          </div>
        </div>

        {/* ── Section divider ── */}
        <div style={{ borderTop: '1px solid var(--b1)', marginBottom: '40px' }} />

        {/* § 1 — Acceptance of Terms */}
        <section style={{ marginBottom: '48px' }}>
          <SectionHeader number="1" title="Acceptance of Terms" />
          <p style={bodyText}>
            By creating an account, accessing, or using the ChainIntel Terminal platform ("the Service"), you confirm that you are at least 18 years of age, have the legal capacity to enter into binding contracts, and agree to be bound by these Terms of Service and our Privacy Policy, which is incorporated herein by reference.
          </p>
          <p style={bodyText}>
            If you are accessing the Service on behalf of an organization, you represent and warrant that you have the authority to bind that organization to these Terms, and all references to "you" shall apply to both you individually and the organization.
          </p>
          <p style={bodyTextLast}>
            ChainIntel reserves the right to update or modify these Terms at any time. Continued use of the Service following notice of any changes constitutes your acceptance of those changes. Material changes will be communicated via email to the address associated with your account or via a prominent notice on the platform.
          </p>
        </section>

        {/* § 2 — User Accounts */}
        <section style={{ marginBottom: '48px' }}>
          <SectionHeader number="2" title="User Accounts" />
          <p style={bodyText}>
            To access most features of the Service, you must register for an account. You agree to provide accurate, current, and complete information during registration and to keep your account information updated at all times.
          </p>
          <p style={subHeading}>Account Security</p>
          <p style={bodyText}>
            You are solely responsible for maintaining the confidentiality of your account credentials, including your password, and for all activity that occurs under your account. You must immediately notify ChainIntel of any unauthorized use of your account or any other security breach. ChainIntel will not be liable for any loss or damage arising from your failure to comply with these security obligations.
          </p>
          <p style={subHeading}>Account Eligibility</p>
          <p style={bodyText}>
            You may not create an account if you have previously been suspended or removed from the Service. Each individual or entity may maintain only one account unless explicitly authorized by ChainIntel in writing. Accounts are non-transferable.
          </p>
          <p style={subHeading}>Account Termination by User</p>
          <p style={bodyTextLast}>
            You may close your account at any time by contacting us at support@chainintelterminal.com. Upon account closure, your right to access the Service ceases immediately. Data deletion is handled in accordance with our Privacy Policy and applicable data retention obligations.
          </p>
        </section>

        {/* § 3 — Subscription Tiers & Fees */}
        <section style={{ marginBottom: '48px' }}>
          <SectionHeader number="3" title="Subscription Tiers & Fees" />
          <p style={bodyText}>
            ChainIntel offers the following subscription tiers. Access to features is determined by your active subscription tier at the time of use.
          </p>

          <div style={{ marginBottom: '24px' }}>
            <PricingRow
              tier="Free"
              price="$0 / month"
              description="Market dashboard, Fear & Greed index, ETF flows, market heatmap, DeFi TVL overview, regulatory news feed. No credit card required."
            />
            <PricingRow
              tier="Pro"
              price="$49 / month"
              description="All Free features plus: on-chain analytics, whale tracking, AI synthesis briefs, derivatives data, sentiment analysis, portfolio tracking, and full data export."
            />
            <PricingRow
              tier="Enterprise"
              price="$499 / month"
              description="All Pro features plus: API access, team seats (up to 10 users), dedicated data delivery, custom alerts, SLA guarantees, and priority support."
            />
          </div>

          <p style={bodyText}>
            ChainIntel reserves the right to modify subscription pricing with at least 30 days' written notice. Price changes take effect at the start of the next billing cycle following the notice period.
          </p>
          <p style={subHeading}>Free Tier Limitations</p>
          <p style={bodyTextLast}>
            The Free tier is provided as-is without any service level guarantees. ChainIntel may modify, restrict, or discontinue Free tier features at any time. Data refresh rates on the Free tier may be limited compared to paid tiers.
          </p>
        </section>

        {/* § 4 — Payment Terms */}
        <section style={{ marginBottom: '48px' }}>
          <SectionHeader number="4" title="Payment Terms" />
          <p style={subHeading}>Billing & Processing</p>
          <p style={bodyText}>
            All paid subscriptions are billed on a recurring monthly basis. Payments are processed securely through Stripe, Inc. ("Stripe"), a third-party payment processor. By subscribing to a paid tier, you authorize ChainIntel to charge your designated payment method on a recurring basis until you cancel your subscription. ChainIntel does not store your full payment card details on our servers; all payment data is handled directly by Stripe in accordance with PCI-DSS standards.
          </p>
          <p style={subHeading}>Billing Cycle</p>
          <p style={bodyText}>
            Subscriptions renew automatically on the same calendar day each month as the date of your initial subscription (or the next business day if that date does not exist in the renewal month). If your payment fails, ChainIntel may suspend your access to paid features until payment is successfully processed. We may retry failed payments up to three times within a seven-day period before downgrading your account.
          </p>
          <p style={subHeading}>Cancellation Policy</p>
          <p style={bodyText}>
            You may cancel your paid subscription at any time through your account settings or by contacting support@chainintelterminal.com. Cancellation takes effect at the end of the current billing period. You will retain access to paid features through the end of the period for which you have already been charged. ChainIntel does not provide prorated refunds for partial billing periods unless required by applicable law.
          </p>
          <p style={subHeading}>Taxes</p>
          <p style={bodyTextLast}>
            Subscription fees are exclusive of all applicable taxes. You are responsible for all taxes, levies, or duties imposed by taxing authorities applicable to your subscription, excluding taxes on ChainIntel's net income. Where required by law, ChainIntel or Stripe may collect and remit applicable sales tax or VAT on your behalf.
          </p>
        </section>

        {/* § 5 — Data Sources & Disclaimer */}
        <section style={{ marginBottom: '48px' }}>
          <SectionHeader number="5" title="Data Sources & No Financial Advice" />
          <div style={{
            padding: '14px 16px',
            background: 'rgba(240,192,64,0.04)',
            border: '1px solid rgba(240,192,64,0.2)',
            marginBottom: '20px',
          }}>
            <p style={{
              ...bodyTextLast,
              fontSize: '13px',
              color: 'var(--text2)',
            }}>
              <strong style={{ color: '#f0c040', fontFamily: 'var(--mono)', fontSize: '9px', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Important Disclaimer: </strong>
              ChainIntel Terminal is an information and analytics platform. Nothing on this platform constitutes financial, investment, trading, or legal advice. All data is provided for informational purposes only.
            </p>
          </div>
          <p style={bodyText}>
            ChainIntel aggregates data from multiple third-party providers and APIs, including but not limited to: CoinGecko, DefiLlama, Glassnode, The Block, Dune Analytics, alternative.me (Fear & Greed Index), on-chain data providers, regulatory news feeds, and other public and licensed data sources. ChainIntel does not independently verify all data and makes no representations regarding the accuracy, completeness, timeliness, or reliability of any data displayed on the platform.
          </p>
          <p style={bodyText}>
            Market data, price quotes, on-chain metrics, sentiment indicators, and all other information presented on the platform may be delayed, inaccurate, or incomplete. You acknowledge that digital asset markets are highly volatile and that past performance is not indicative of future results.
          </p>
          <p style={bodyText}>
            You expressly acknowledge that any investment or trading decisions you make are solely your own responsibility. ChainIntel and its officers, directors, employees, partners, and licensors shall have no liability for any investment losses, trading losses, or other financial harm resulting from your use of or reliance on information displayed on the platform.
          </p>
          <p style={bodyTextLast}>
            ChainIntel is not registered as a broker-dealer, investment advisor, commodity trading advisor, or any other regulated financial entity with any financial regulatory authority in any jurisdiction. The Service does not constitute an offer to buy or sell any securities or digital assets.
          </p>
        </section>

        {/* § 6 — Acceptable Use */}
        <section style={{ marginBottom: '48px' }}>
          <SectionHeader number="6" title="Acceptable Use" />
          <p style={bodyText}>
            You agree to use the Service only for lawful purposes and in accordance with these Terms. You agree not to:
          </p>
          <div style={{
            padding: '16px 20px',
            background: 'var(--s1)',
            border: '1px solid var(--b1)',
            marginBottom: '16px',
          }}>
            {[
              'Use the Service to engage in any activity that violates applicable laws or regulations, including securities laws, anti-money laundering laws, or sanctions regulations;',
              'Reverse engineer, decompile, or attempt to extract the source code of any portion of the platform;',
              'Systematically scrape, harvest, or collect data from the platform through automated means without ChainIntel\'s prior written consent, except as explicitly permitted through API access on qualifying subscription tiers;',
              'Use the platform to develop or train competing data products or AI models;',
              'Attempt to gain unauthorized access to any systems or networks connected to the platform;',
              'Transmit any viruses, malware, or other harmful code;',
              'Share your account credentials with unauthorized third parties or use a single account for multiple users (except Enterprise team seats);',
              'Use the Service in any manner that could impair, overburden, or damage ChainIntel\'s infrastructure.',
            ].map((item, i) => (
              <div key={i} style={{
                display: 'flex',
                gap: '12px',
                marginBottom: i < 7 ? '10px' : 0,
                alignItems: 'flex-start',
              }}>
                <span style={{
                  fontFamily: 'var(--mono)',
                  fontSize: '9px',
                  color: 'var(--accent)',
                  flexShrink: 0,
                  marginTop: '3px',
                }}>◆</span>
                <span style={{
                  fontFamily: 'var(--sans)',
                  fontSize: '13px',
                  color: 'var(--text2)',
                  lineHeight: 1.65,
                }}>{item}</span>
              </div>
            ))}
          </div>
          <p style={bodyTextLast}>
            ChainIntel reserves the right to investigate and take appropriate action, including termination of your account, against any use of the Service that violates these Terms or that ChainIntel determines, in its sole discretion, to be harmful to other users, third parties, or the platform.
          </p>
        </section>

        {/* § 7 — Intellectual Property */}
        <section style={{ marginBottom: '48px' }}>
          <SectionHeader number="7" title="Intellectual Property" />
          <p style={subHeading}>ChainIntel's Intellectual Property</p>
          <p style={bodyText}>
            The Service, including all software, algorithms, user interfaces, design, text, graphics, logos, icons, images, audio clips, data compilations, AI models, and all other content and materials on the platform ("ChainIntel IP"), are the exclusive property of ChainIntel Inc. or its licensors and are protected by United States and international copyright, trademark, patent, trade secret, and other intellectual property laws.
          </p>
          <p style={bodyText}>
            Subject to your compliance with these Terms and payment of applicable fees, ChainIntel grants you a limited, non-exclusive, non-transferable, non-sublicensable, revocable license to access and use the Service solely for your personal or internal business purposes during the term of your subscription.
          </p>
          <p style={subHeading}>Restrictions</p>
          <p style={bodyText}>
            You may not copy, reproduce, modify, distribute, sell, resell, transmit, publish, or create derivative works based on any ChainIntel IP without prior written authorization from ChainIntel. The ChainIntel name, logo, "ChainIntel Terminal," and all related names, marks, and logos are trademarks of ChainIntel Inc. and may not be used without express written permission.
          </p>
          <p style={subHeading}>User Content</p>
          <p style={bodyTextLast}>
            If you submit any feedback, suggestions, ideas, or other content to ChainIntel, you grant ChainIntel a perpetual, irrevocable, worldwide, royalty-free license to use, reproduce, modify, and incorporate such content for any purpose, without compensation to you.
          </p>
        </section>

        {/* § 8 — Limitation of Liability */}
        <section style={{ marginBottom: '48px' }}>
          <SectionHeader number="8" title="Limitation of Liability" />
          <div style={{
            padding: '14px 16px',
            background: 'var(--s1)',
            border: '1px solid var(--b2)',
            marginBottom: '20px',
          }}>
            <p style={{
              fontFamily: 'var(--mono)',
              fontSize: '9px',
              color: 'var(--text2)',
              letterSpacing: '0.06em',
              lineHeight: 1.7,
              margin: 0,
              textTransform: 'uppercase',
            }}>
              THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, NON-INFRINGEMENT, OR UNINTERRUPTED OR ERROR-FREE OPERATION.
            </p>
          </div>
          <p style={bodyText}>
            To the maximum extent permitted by applicable law, ChainIntel, its affiliates, officers, directors, employees, agents, suppliers, and licensors shall not be liable for any indirect, incidental, special, consequential, punitive, or exemplary damages, including but not limited to loss of profits, loss of data, loss of goodwill, business interruption, or financial losses, arising out of or in connection with your use of or inability to use the Service, regardless of the theory of liability and even if ChainIntel has been advised of the possibility of such damages.
          </p>
          <p style={bodyText}>
            In no event shall ChainIntel's total aggregate liability to you for all claims arising out of or relating to these Terms or your use of the Service exceed the greater of (a) the total amount paid by you to ChainIntel in the twelve (12) months immediately preceding the event giving rise to the claim, or (b) one hundred United States dollars (US$100).
          </p>
          <p style={bodyTextLast}>
            Some jurisdictions do not allow the exclusion of certain warranties or limitation of liability for certain damages. In such jurisdictions, ChainIntel's liability shall be limited to the maximum extent permitted by law.
          </p>
        </section>

        {/* § 9 — Indemnification */}
        <section style={{ marginBottom: '48px' }}>
          <SectionHeader number="9" title="Indemnification" />
          <p style={bodyTextLast}>
            You agree to defend, indemnify, and hold harmless ChainIntel and its affiliates, officers, directors, employees, agents, and licensors from and against any claims, liabilities, damages, judgments, awards, losses, costs, expenses, and fees (including reasonable attorneys' fees) arising out of or relating to your violation of these Terms, your use of the Service, your violation of any applicable law or the rights of any third party, or any content you submit to the platform.
          </p>
        </section>

        {/* § 10 — Termination */}
        <section style={{ marginBottom: '48px' }}>
          <SectionHeader number="10" title="Termination" />
          <p style={subHeading}>Termination by ChainIntel</p>
          <p style={bodyText}>
            ChainIntel reserves the right to suspend or terminate your account and access to the Service, with or without notice, if we determine in our sole discretion that you have violated these Terms, engaged in fraudulent or illegal activity, or that your use of the Service poses a risk to ChainIntel, other users, or third parties.
          </p>
          <p style={subHeading}>Effect of Termination</p>
          <p style={bodyText}>
            Upon termination of your account for any reason, your right to access and use the Service ceases immediately. ChainIntel has no obligation to refund any prepaid fees, except as required by applicable law. Provisions of these Terms that by their nature should survive termination will survive, including but not limited to Sections 5, 7, 8, 9, 11, and 12.
          </p>
          <p style={subHeading}>Termination for Convenience</p>
          <p style={bodyTextLast}>
            ChainIntel may discontinue the Service or any portion thereof at any time for any reason. In the event of service discontinuation affecting paid subscribers, ChainIntel will provide at least 30 days' advance notice and refund any prepaid subscription fees for the remaining unused period.
          </p>
        </section>

        {/* § 11 — Governing Law & Dispute Resolution */}
        <section style={{ marginBottom: '48px' }}>
          <SectionHeader number="11" title="Governing Law & Dispute Resolution" />
          <p style={bodyText}>
            These Terms shall be governed by and construed in accordance with the laws of the State of Delaware, United States of America, without regard to its conflict of law provisions.
          </p>
          <p style={subHeading}>Informal Resolution</p>
          <p style={bodyText}>
            Before initiating any formal dispute, you agree to first contact ChainIntel at support@chainintelterminal.com and provide a written description of the dispute, your proposed resolution, and your contact information. The parties will attempt to resolve the dispute informally for a period of thirty (30) days.
          </p>
          <p style={subHeading}>Arbitration</p>
          <p style={bodyText}>
            If informal resolution fails, any dispute, claim, or controversy arising out of or relating to these Terms or the Service shall be settled by binding arbitration administered by the American Arbitration Association (AAA) under its Commercial Arbitration Rules. The arbitration shall be conducted in English, and the arbitral award shall be final and binding. The parties waive any right to a jury trial and any right to participate in a class action lawsuit or class-wide arbitration.
          </p>
          <p style={subHeading}>Jurisdiction</p>
          <p style={bodyTextLast}>
            For any matters not subject to arbitration, you consent to the exclusive jurisdiction of the federal and state courts located in the State of Delaware, United States of America.
          </p>
        </section>

        {/* § 12 — General Provisions */}
        <section style={{ marginBottom: '48px' }}>
          <SectionHeader number="12" title="General Provisions" />
          <p style={subHeading}>Entire Agreement</p>
          <p style={bodyText}>
            These Terms, together with the Privacy Policy and any other agreements expressly incorporated by reference, constitute the entire agreement between you and ChainIntel with respect to the Service and supersede all prior agreements, understandings, and representations.
          </p>
          <p style={subHeading}>Severability</p>
          <p style={bodyText}>
            If any provision of these Terms is held invalid or unenforceable, that provision shall be modified to the minimum extent necessary to make it enforceable, and all remaining provisions shall remain in full force and effect.
          </p>
          <p style={subHeading}>Waiver</p>
          <p style={bodyText}>
            ChainIntel's failure to enforce any right or provision of these Terms shall not constitute a waiver of that right or provision. Any waiver must be in writing and signed by an authorized representative of ChainIntel.
          </p>
          <p style={subHeading}>Assignment</p>
          <p style={bodyText}>
            You may not assign or transfer these Terms or any rights or obligations hereunder without ChainIntel's prior written consent. ChainIntel may assign these Terms in connection with a merger, acquisition, sale of assets, or operation of law.
          </p>
          <p style={subHeading}>Force Majeure</p>
          <p style={bodyTextLast}>
            ChainIntel shall not be liable for any failure or delay in performance resulting from causes beyond its reasonable control, including natural disasters, acts of government, blockchain network outages, internet infrastructure failures, or third-party API unavailability.
          </p>
        </section>

        {/* § 13 — Contact */}
        <section style={{ marginBottom: '48px' }}>
          <SectionHeader number="13" title="Contact Information" />
          <p style={bodyText}>
            If you have any questions about these Terms of Service, please contact us:
          </p>
          <div style={{
            padding: '20px 24px',
            background: 'var(--s1)',
            border: '1px solid var(--b2)',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '20px',
          }}>
            <div>
              <div style={{
                fontFamily: 'var(--mono)',
                fontSize: '8px',
                color: 'var(--muted)',
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                marginBottom: '6px',
              }}>Legal Entity</div>
              <div style={{
                fontFamily: 'var(--sans)',
                fontSize: '13px',
                color: 'var(--text)',
              }}>ChainIntel Inc.</div>
            </div>
            <div>
              <div style={{
                fontFamily: 'var(--mono)',
                fontSize: '8px',
                color: 'var(--muted)',
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                marginBottom: '6px',
              }}>Email</div>
              <a href="mailto:support@chainintelterminal.com" style={{
                fontFamily: 'var(--mono)',
                fontSize: '11px',
                color: 'var(--accent)',
                textDecoration: 'none',
              }}>
                support@chainintelterminal.com
              </a>
            </div>
            <div>
              <div style={{
                fontFamily: 'var(--mono)',
                fontSize: '8px',
                color: 'var(--muted)',
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                marginBottom: '6px',
              }}>Website</div>
              <a href="https://chainintelterminal.com" style={{
                fontFamily: 'var(--mono)',
                fontSize: '11px',
                color: 'var(--accent)',
                textDecoration: 'none',
              }}>
                chainintelterminal.com
              </a>
            </div>
            <div>
              <div style={{
                fontFamily: 'var(--mono)',
                fontSize: '8px',
                color: 'var(--muted)',
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                marginBottom: '6px',
              }}>Governing Law</div>
              <div style={{
                fontFamily: 'var(--sans)',
                fontSize: '13px',
                color: 'var(--text)',
              }}>State of Delaware, USA</div>
            </div>
          </div>
        </section>

        {/* Footer divider */}
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
              <Link href="/privacy" style={{
                fontFamily: 'var(--mono)',
                fontSize: '8px',
                color: 'var(--muted)',
                textDecoration: 'none',
                letterSpacing: '0.10em',
              }}>
                Privacy Policy
              </Link>
              <Link href="/" style={{
                fontFamily: 'var(--mono)',
                fontSize: '8px',
                color: 'var(--accent)',
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
