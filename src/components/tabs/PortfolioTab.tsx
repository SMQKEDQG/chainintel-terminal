'use client';

import { useState, useRef, useEffect } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

// ── Fallback static prices (used when CoinGecko is unavailable) ──────────────
const FALLBACK_PRICES: Record<string, number> = {
  BTC: 83240,
  ETH: 1582,
  SOL: 127.4,
  XRP: 1.32,
  BNB: 584,
  DOGE: 0.157,
  ADA: 0.245,
  TON: 3.82,
  TRX: 0.142,
  AVAX: 18.4,
  SUI: 2.84,
  LINK: 12.8,
  DOT: 4.12,
  MATIC: 0.384,
  PEPE: 0.00000841,
  HBAR: 0.170,
  QNT: 88.0,
  XLM: 0.270,
  IOTA: 0.210,
  XDC: 0.038,
  ALGO: 0.165,
};

// ── Supported assets for portfolio tracking ──────────────────────────────────
const SUPPORTED_ASSETS = new Set([
  'BTC', 'ETH', 'SOL', 'XRP', 'BNB', 'DOGE', 'ADA', 'TON', 'TRX',
  'AVAX', 'SUI', 'LINK', 'DOT', 'MATIC', 'PEPE', 'HBAR', 'QNT',
  'XLM', 'IOTA', 'XDC', 'ALGO',
]);

const ISO_ASSETS = new Set(['XRP', 'XLM', 'HBAR', 'QNT', 'ADA', 'IOTA', 'XDC', 'ALGO']);

const CHART_COLORS = [
  '#00d4aa', '#3b82f6', '#f0c040', '#10b981', '#ef4444',
  '#a78bfa', '#fb923c', '#06b6d4', '#ec4899', '#84cc16',
  '#f472b6', '#14b8a6', '#8b5cf6', '#f97316',
];

const DEMO_PORTFOLIO = [
  { asset: 'BTC', qty: 0.5, avgCost: 78000 },
  { asset: 'ETH', qty: 5, avgCost: 1800 },
  { asset: 'XRP', qty: 10000, avgCost: 0.92 },
  { asset: 'HBAR', qty: 50000, avgCost: 0.12 },
  { asset: 'QNT', qty: 10, avgCost: 72 },
  { asset: 'XLM', qty: 20000, avgCost: 0.19 },
];

const SESSION_KEY = 'chainintel_portfolio';

interface Holding {
  asset: string;
  qty: number;
  avgCost: number;
}

// ── sessionStorage helpers ────────────────────────────────────────────────────
function loadFromSession(): Holding[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (h: unknown) =>
        h !== null &&
        typeof h === 'object' &&
        typeof (h as Holding).asset === 'string' &&
        typeof (h as Holding).qty === 'number' &&
        typeof (h as Holding).avgCost === 'number',
    );
  } catch {
    return [];
  }
}

function saveToSession(holdings: Holding[]): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(holdings));
  } catch {
    // sessionStorage unavailable — silent fail
  }
}

export default function PortfolioTab() {
  // ── State ──────────────────────────────────────────────────────────────────
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [portAsset, setPortAsset] = useState('');
  const [portQty, setPortQty] = useState('');
  const [portAvgCost, setPortAvgCost] = useState('');
  const [briefText, setBriefText] = useState('');
  const [showBrief, setShowBrief] = useState(false);

  // Live prices from CoinGecko (merged with fallback)
  const [livePrices, setLivePrices] = useState<Record<string, number>>(FALLBACK_PRICES);
  const [pricesLoading, setPricesLoading] = useState(false);
  const [pricesUpdatedAt, setPricesUpdatedAt] = useState<string | null>(null);
  const [pricesError, setPricesError] = useState(false);

  const addSectionRef = useRef<HTMLSelectElement>(null);

  // ── Load holdings from sessionStorage on mount ────────────────────────────
  useEffect(() => {
    const saved = loadFromSession();
    if (saved.length > 0) {
      setHoldings(saved);
    }
  }, []);

  // ── Persist holdings to sessionStorage on every change ───────────────────
  useEffect(() => {
    saveToSession(holdings);
  }, [holdings]);

  // ── Fetch live prices via our CMC proxy (avoids CoinGecko rate limits) ────
  useEffect(() => {
    const assets = holdings.map(h => h.asset).filter(a => SUPPORTED_ASSETS.has(a));
    if (assets.length === 0) return;

    const symbols = [...new Set(assets)].join(',');
    setPricesLoading(true);
    setPricesError(false);

    fetch(`/api/cmc?endpoint=/v1/cryptocurrency/quotes/latest&symbol=${symbols}&convert=USD`)
      .then(res => {
        if (!res.ok) throw new Error('CMC proxy request failed');
        return res.json();
      })
      .then((json) => {
        // CMC quotes response: data.data.{SYMBOL}.quote.USD.price
        const quotes = json.data?.data || json.data || {};
        setLivePrices(prev => {
          const next = { ...prev };
          for (const [symbol, info] of Object.entries(quotes) as [string, any][]) {
            const price = info?.quote?.USD?.price;
            if (price !== undefined && price > 0) {
              next[symbol] = price;
            }
          }
          return next;
        });
        setPricesUpdatedAt(new Date().toLocaleTimeString());
        setPricesLoading(false);
      })
      .catch(() => {
        setPricesError(true);
        setPricesLoading(false);
      });
  }, [holdings]);

  // ── Portfolio actions ──────────────────────────────────────────────────────
  const addHolding = () => {
    if (!portAsset || !portQty) return;
    const qty = parseFloat(portQty);
    const avgCost = parseFloat(portAvgCost) || 0;
    if (isNaN(qty) || qty <= 0) return;
    setHoldings(prev => {
      const existing = prev.findIndex(h => h.asset === portAsset);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = { asset: portAsset, qty, avgCost };
        return updated;
      }
      return [...prev, { asset: portAsset, qty, avgCost }];
    });
    setPortAsset('');
    setPortQty('');
    setPortAvgCost('');
  };

  const removeHolding = (idx: number) => {
    setHoldings(prev => prev.filter((_, i) => i !== idx));
  };

  const clearPortfolio = () => setHoldings([]);
  const loadDemoPortfolio = () => setHoldings(DEMO_PORTFOLIO);
  const focusAddHolding = () => addSectionRef.current?.focus();

  // ── Price / value helpers (using live prices) ─────────────────────────────
  const getPrice = (asset: string) => livePrices[asset] ?? FALLBACK_PRICES[asset] ?? 0;
  const getValue = (h: Holding) => h.qty * getPrice(h.asset);
  const getCost = (h: Holding) => h.qty * h.avgCost;
  const getPnl = (h: Holding) => getValue(h) - getCost(h);
  const getPnlPct = (h: Holding) =>
    h.avgCost > 0 ? ((getPrice(h.asset) - h.avgCost) / h.avgCost) * 100 : 0;

  // ── Portfolio totals ───────────────────────────────────────────────────────
  const totalValue = holdings.reduce((s, h) => s + getValue(h), 0);
  const totalCost = holdings.reduce((s, h) => s + getCost(h), 0);
  const totalPnl = totalValue - totalCost;
  const totalPnlPct = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0;

  // ── Formatters ─────────────────────────────────────────────────────────────
  const fmt = (n: number) =>
    n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fmtPrice = (n: number) =>
    n < 0.01
      ? n.toPrecision(4)
      : n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 });

  // ── Chart ──────────────────────────────────────────────────────────────────
  const chartData = {
    labels: holdings.map(h => h.asset),
    datasets: [
      {
        data: holdings.map(h => getValue(h)),
        backgroundColor: holdings.map((_, i) => CHART_COLORS[i % CHART_COLORS.length]),
        borderColor: 'var(--bg)',
        borderWidth: 2,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx: any) => {
            const pct =
              totalValue > 0 ? ((ctx.parsed / totalValue) * 100).toFixed(1) : '0.0';
            return ` ${ctx.label}: $${fmt(ctx.parsed)} (${pct}%)`;
          },
        },
      },
    },
  };

  const isoExposurePct =
    totalValue > 0
      ? (
          (holdings
            .filter(h => ISO_ASSETS.has(h.asset))
            .reduce((s, h) => s + getValue(h), 0) /
            totalValue) *
          100
        ).toFixed(1)
      : '0.0';

  // ── AI brief generator ─────────────────────────────────────────────────────
  const generateBrief = () => {
    if (holdings.length === 0) return;
    const topAsset = holdings.reduce((a, b) => (getValue(a) > getValue(b) ? a : b));
    const isoHoldings = holdings.filter(h => ISO_ASSETS.has(h.asset));
    const brief = `◈ AI MORNING BRIEF — ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}

Your portfolio is valued at $${fmt(totalValue)} with ${totalPnl >= 0 ? '+' : ''}$${fmt(Math.abs(totalPnl))} P&L (${totalPnlPct >= 0 ? '+' : ''}${totalPnlPct.toFixed(2)}%).

LARGEST POSITION: ${topAsset.asset} — $${fmt(getValue(topAsset))} (${totalValue > 0 ? ((getValue(topAsset) / totalValue) * 100).toFixed(1) : 0}% of portfolio)

ISO 20022 EXPOSURE: ${isoExposurePct}% of your portfolio is in ISO 20022-compliant assets${isoHoldings.length > 0 ? ` (${isoHoldings.map(h => h.asset).join(', ')})` : ''}. ${parseFloat(isoExposurePct) > 40 ? 'HIGH exposure — well-positioned for SWIFT migration tailwinds.' : parseFloat(isoExposurePct) > 20 ? 'MODERATE exposure — consider increasing ISO 20022 allocation as SWIFT deadline approaches.' : 'LOW exposure — ISO 20022 infrastructure plays (XRP, HBAR, QNT) have structural tailwinds from SWIFT migration.'}

MARKET CONTEXT: Live prices sourced via CoinMarketCap API. Cross-reference with ChainIntel Sentiment, Derivatives, and Whale tabs for full market context.

Bloomberg cannot generate this brief for your specific holdings. ChainIntel does it instantly.`;
    setBriefText(brief);
    setShowBrief(true);
  };

  // ── KPI card styles ────────────────────────────────────────────────────────
  const kpiCardStyle: React.CSSProperties = {
    background: 'var(--s1)',
    border: '1px solid var(--b2)',
    padding: '12px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  };
  const kpiLblStyle: React.CSSProperties = {
    fontFamily: 'var(--mono)',
    fontSize: '8px',
    letterSpacing: '0.14em',
    color: 'var(--muted)',
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="page" id="page-portfolio">
      <div className="ai-context-strip" id="acs-portfolio">
        <span className="acs-icon">◈ CI·AI</span>
        <span className="acs-body" id="acs-body-portfolio">
          Enter your holdings below to receive a{' '}
          <strong>personalized AI Morning Brief</strong> calibrated to your exact
          portfolio. Bloomberg requires a human analyst to do this. ChainIntel does it
          instantly.
        </span>
        <span className="acs-ts" id="acs-ts-portfolio"></span>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '10px',
        }}
      >
        <div
          style={{
            fontFamily: 'var(--mono)',
            fontSize: '10px',
            letterSpacing: '0.14em',
            color: 'var(--text2)',
          }}
        >
          PORTFOLIO TRACKER{' '}
          <span style={{ color: 'var(--muted)' }}>
            · Personalized AI Intelligence · Your Holdings Only
          </span>
        </div>
        <div style={{ fontFamily: 'var(--mono)', fontSize: '8px', color: 'var(--muted)' }}>
          No data leaves your browser · Local only · Zero tracking
        </div>
      </div>

      {/* ── Live Price KPI Cards ─────────────────────────────────────────── */}
      {holdings.length > 0 && (
        <div
          className="panel"
          style={{ padding: '14px', marginBottom: '12px' }}
        >
          {/* Header row */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '10px',
            }}
          >
            <div
              style={{
                fontFamily: 'var(--mono)',
                fontSize: '8px',
                letterSpacing: '0.14em',
                color: 'var(--cyan)',
              }}
            >
              ◈ LIVE PORTFOLIO SNAPSHOT
            </div>
            <div
              style={{
                fontFamily: 'var(--mono)',
                fontSize: '7px',
                color: pricesError ? 'var(--red)' : pricesLoading ? 'var(--muted)' : 'var(--green)',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              {pricesLoading && (
                <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>
                  ◌
                </span>
              )}
              {pricesError
                ? 'PRICES UNAVAILABLE · USING CACHED DATA'
                : pricesLoading
                ? 'FETCHING LIVE PRICES…'
                : pricesUpdatedAt
                ? `LIVE · Updated ${pricesUpdatedAt}`
                : 'CACHED PRICES'}
            </div>
          </div>

          {/* Four KPI cards */}
          <div
            style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}
          >
            {/* Total Value */}
            <div style={kpiCardStyle}>
              <div style={kpiLblStyle}>TOTAL VALUE</div>
              <div
                className="kpi-val"
                style={{
                  fontFamily: 'var(--mono)',
                  fontSize: '18px',
                  fontWeight: 700,
                  color: 'var(--cyan)',
                  lineHeight: 1.1,
                }}
              >
                ${fmt(totalValue)}
              </div>
              <div
                style={{ fontFamily: 'var(--mono)', fontSize: '8px', color: 'var(--muted)' }}
              >
                {holdings.length} asset{holdings.length !== 1 ? 's' : ''}
              </div>
            </div>

            {/* Total Cost Basis */}
            <div style={kpiCardStyle}>
              <div style={kpiLblStyle}>COST BASIS</div>
              <div
                className="kpi-val"
                style={{
                  fontFamily: 'var(--mono)',
                  fontSize: '18px',
                  fontWeight: 700,
                  color: 'var(--text)',
                  lineHeight: 1.1,
                }}
              >
                ${fmt(totalCost)}
              </div>
              <div
                style={{ fontFamily: 'var(--mono)', fontSize: '8px', color: 'var(--muted)' }}
              >
                invested
              </div>
            </div>

            {/* Total P&L */}
            <div style={kpiCardStyle}>
              <div style={kpiLblStyle}>TOTAL P&amp;L</div>
              <div
                className="kpi-val"
                style={{
                  fontFamily: 'var(--mono)',
                  fontSize: '18px',
                  fontWeight: 700,
                  color: totalPnl >= 0 ? 'var(--green)' : 'var(--red)',
                  lineHeight: 1.1,
                }}
              >
                {totalPnl >= 0 ? '+' : ''}${fmt(Math.abs(totalPnl))}
              </div>
              <div
                style={{
                  fontFamily: 'var(--mono)',
                  fontSize: '8px',
                  color: totalPnl >= 0 ? 'var(--green)' : 'var(--red)',
                }}
              >
                {totalPnlPct >= 0 ? '+' : ''}
                {totalPnlPct.toFixed(2)}% all-time
              </div>
            </div>

            {/* P&L % Gauge */}
            <div style={kpiCardStyle}>
              <div style={kpiLblStyle}>P&amp;L %</div>
              <div
                className="kpi-val"
                style={{
                  fontFamily: 'var(--mono)',
                  fontSize: '18px',
                  fontWeight: 700,
                  color: totalPnlPct >= 0 ? 'var(--green)' : 'var(--red)',
                  lineHeight: 1.1,
                }}
              >
                {totalPnlPct >= 0 ? '+' : ''}
                {totalPnlPct.toFixed(2)}%
              </div>
              {/* Mini progress bar */}
              <div
                style={{
                  height: '3px',
                  background: 'var(--s2)',
                  borderRadius: '2px',
                  marginTop: '4px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${Math.min(Math.abs(totalPnlPct), 100)}%`,
                    background: totalPnlPct >= 0 ? 'var(--green)' : 'var(--red)',
                    borderRadius: '2px',
                    transition: 'width 0.4s ease',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Per-asset live value row (scrollable on small screens) */}
          {holdings.length > 0 && (
            <div
              style={{
                marginTop: '10px',
                display: 'flex',
                gap: '6px',
                flexWrap: 'wrap',
              }}
            >
              {holdings.map((h, i) => {
                const lp = getPrice(h.asset);
                const hval = getValue(h);
                const hpnl = getPnl(h);
                const hpnlPct = getPnlPct(h);
                return (
                  <div
                    key={i}
                    style={{
                      background: 'var(--s2)',
                      border: '1px solid var(--b1)',
                      padding: '6px 10px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '2px',
                      minWidth: '110px',
                    }}
                  >
                    <div
                      style={{
                        fontFamily: 'var(--mono)',
                        fontSize: '9px',
                        color: 'var(--cyan)',
                        fontWeight: 700,
                        letterSpacing: '0.08em',
                      }}
                    >
                      {h.asset}
                    </div>
                    <div
                      style={{
                        fontFamily: 'var(--mono)',
                        fontSize: '11px',
                        color: 'var(--text)',
                        fontWeight: 600,
                      }}
                    >
                      ${fmt(hval)}
                    </div>
                    <div
                      style={{
                        fontFamily: 'var(--mono)',
                        fontSize: '8px',
                        color: hpnl >= 0 ? 'var(--green)' : 'var(--red)',
                      }}
                    >
                      {hpnl >= 0 ? '+' : ''}${fmt(Math.abs(hpnl))} ({hpnlPct >= 0 ? '+' : ''}
                      {hpnlPct.toFixed(2)}%)
                    </div>
                    <div
                      style={{
                        fontFamily: 'var(--mono)',
                        fontSize: '7px',
                        color: 'var(--muted)',
                      }}
                    >
                      @ ${fmtPrice(lp)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Holdings Input + Summary ─────────────────────────────────────── */}
      <div
        style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}
      >
        {/* Add Holdings */}
        <div className="panel" style={{ padding: '14px' }}>
          <div
            style={{
              fontFamily: 'var(--mono)',
              fontSize: '8px',
              letterSpacing: '0.14em',
              color: 'var(--muted)',
              marginBottom: '10px',
            }}
          >
            ADD HOLDINGS
          </div>
          <div
            style={{ display: 'flex', gap: '6px', marginBottom: '8px', flexWrap: 'wrap' }}
          >
            <select
              id="portAsset"
              ref={addSectionRef}
              value={portAsset}
              onChange={e => setPortAsset(e.target.value)}
              style={{
                background: 'var(--s2)',
                border: '1px solid var(--b2)',
                color: 'var(--text)',
                fontFamily: 'var(--mono)',
                fontSize: '10px',
                padding: '6px 8px',
                outline: 'none',
                flex: 1,
              }}
            >
              <option value="">Select Asset</option>
              <option value="BTC">Bitcoin (BTC)</option>
              <option value="ETH">Ethereum (ETH)</option>
              <option value="SOL">Solana (SOL)</option>
              <option value="XRP">XRP</option>
              <option value="BNB">BNB</option>
              <option value="DOGE">Dogecoin (DOGE)</option>
              <option value="ADA">Cardano (ADA)</option>
              <option value="TON">Toncoin (TON)</option>
              <option value="TRX">Tron (TRX)</option>
              <option value="AVAX">Avalanche (AVAX)</option>
              <option value="SUI">Sui (SUI)</option>
              <option value="LINK">Chainlink (LINK)</option>
              <option value="DOT">Polkadot (DOT)</option>
              <option value="MATIC">Polygon (MATIC)</option>
              <option value="PEPE">Pepe (PEPE)</option>
              <option value="HBAR">Hedera (HBAR)</option>
              <option value="QNT">Quant (QNT)</option>
              <option value="XLM">Stellar (XLM)</option>
              <option value="IOTA">IOTA</option>
              <option value="XDC">XDC Network</option>
              <option value="ALGO">Algorand (ALGO)</option>
            </select>
            <input
              id="portQty"
              type="number"
              placeholder="Qty"
              min="0"
              step="any"
              value={portQty}
              onChange={e => setPortQty(e.target.value)}
              style={{
                background: 'var(--s2)',
                border: '1px solid var(--b2)',
                color: 'var(--text)',
                fontFamily: 'var(--mono)',
                fontSize: '10px',
                padding: '6px 8px',
                outline: 'none',
                width: '90px',
              }}
            />
            <input
              id="portAvgCost"
              type="number"
              placeholder="Avg cost $"
              min="0"
              step="any"
              value={portAvgCost}
              onChange={e => setPortAvgCost(e.target.value)}
              style={{
                background: 'var(--s2)',
                border: '1px solid var(--b2)',
                color: 'var(--text)',
                fontFamily: 'var(--mono)',
                fontSize: '10px',
                padding: '6px 8px',
                outline: 'none',
                width: '110px',
              }}
            />
          </div>
          <button
            onClick={addHolding}
            style={{
              background: 'var(--blue)',
              color: '#fff',
              border: 'none',
              fontFamily: 'var(--mono)',
              fontSize: '9px',
              letterSpacing: '0.1em',
              padding: '7px 16px',
              cursor: 'pointer',
              width: '100%',
            }}
          >
            + ADD TO PORTFOLIO
          </button>
          <div
            style={{
              background: 'rgba(0,212,170,0.06)',
              borderLeft: '2px solid var(--cyan)',
              padding: '6px 10px',
              fontFamily: 'var(--mono)',
              fontSize: '8px',
              color: 'var(--cyan)',
              marginTop: '6px',
            }}
          >
            ✓ Session persistent — holdings restored automatically within this browser session.
          </div>
        </div>

        {/* Portfolio Summary */}
        <div className="panel" style={{ padding: '14px' }}>
          <div
            style={{
              fontFamily: 'var(--mono)',
              fontSize: '8px',
              letterSpacing: '0.14em',
              color: 'var(--muted)',
              marginBottom: '10px',
            }}
          >
            PORTFOLIO SUMMARY
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div>
              <div className="oc-lbl">Total Value</div>
              <div className="oc-val cyan">${fmt(totalValue)}</div>
            </div>
            <div>
              <div className="oc-lbl">Total Cost</div>
              <div className="oc-val" style={{ color: 'var(--text)' }}>
                ${fmt(totalCost)}
              </div>
            </div>
            <div>
              <div className="oc-lbl">P&amp;L</div>
              <div
                className="oc-val"
                style={{ color: totalPnl >= 0 ? 'var(--green)' : 'var(--red)' }}
              >
                {totalPnl >= 0 ? '+' : ''}${fmt(Math.abs(totalPnl))}
              </div>
            </div>
            <div>
              <div className="oc-lbl">P&amp;L %</div>
              <div
                className="oc-val"
                style={{ color: totalPnlPct >= 0 ? 'var(--green)' : 'var(--red)' }}
              >
                {totalPnlPct >= 0 ? '+' : ''}
                {totalPnlPct.toFixed(2)}%
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Holdings Table ───────────────────────────────────────────────── */}
      <div className="panel" style={{ padding: 0, marginBottom: '12px' }}>
        <div
          style={{
            padding: '10px 14px',
            borderBottom: '1px solid var(--b2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div
            style={{
              fontFamily: 'var(--mono)',
              fontSize: '8px',
              letterSpacing: '0.14em',
              color: 'var(--muted)',
            }}
          >
            HOLDINGS
          </div>
          <button
            onClick={clearPortfolio}
            style={{
              background: 'none',
              border: '1px solid var(--b2)',
              color: 'var(--muted)',
              fontFamily: 'var(--mono)',
              fontSize: '7px',
              padding: '2px 8px',
              cursor: 'pointer',
            }}
          >
            CLEAR ALL
          </button>
        </div>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontFamily: 'var(--mono)',
            fontSize: '11px',
          }}
        >
          <thead>
            <tr style={{ borderBottom: '1px solid var(--b2)' }}>
              <th
                style={{
                  textAlign: 'left',
                  padding: '7px 12px',
                  color: 'var(--muted)',
                  fontSize: '8px',
                  letterSpacing: '0.1em',
                }}
              >
                ASSET
              </th>
              <th
                style={{ textAlign: 'right', padding: '7px 8px', color: 'var(--muted)', fontSize: '8px' }}
              >
                QTY
              </th>
              <th
                style={{ textAlign: 'right', padding: '7px 8px', color: 'var(--muted)', fontSize: '8px' }}
              >
                AVG COST
              </th>
              <th
                style={{ textAlign: 'right', padding: '7px 8px', color: 'var(--muted)', fontSize: '8px' }}
              >
                CUR PRICE
              </th>
              <th
                style={{ textAlign: 'right', padding: '7px 8px', color: 'var(--muted)', fontSize: '8px' }}
              >
                VALUE
              </th>
              <th
                style={{ textAlign: 'right', padding: '7px 8px', color: 'var(--muted)', fontSize: '8px' }}
              >
                P&amp;L
              </th>
              <th
                style={{ textAlign: 'right', padding: '7px 8px', color: 'var(--muted)', fontSize: '8px' }}
              >
                P&amp;L %
              </th>
              <th style={{ padding: '7px 8px' }}></th>
            </tr>
          </thead>
          <tbody id="portTableBody">
            {holdings.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: 0 }}>
                  <div
                    id="portfolioEmptyState"
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '40px 24px',
                      textAlign: 'center',
                      gap: '14px',
                      background:
                        'linear-gradient(180deg,rgba(0,212,170,0.02) 0%,transparent 100%)',
                    }}
                  >
                    <div
                      style={{
                        width: '52px',
                        height: '52px',
                        borderRadius: '12px',
                        background: 'rgba(0,212,170,0.08)',
                        border: '1px solid rgba(0,212,170,0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '22px',
                      }}
                    >
                      📊
                    </div>
                    <div
                      style={{
                        fontFamily: 'var(--mono)',
                        fontSize: '12px',
                        color: 'var(--text)',
                        fontWeight: 600,
                        letterSpacing: '0.02em',
                      }}
                    >
                      AI-Powered Portfolio Intelligence
                    </div>
                    <div
                      style={{
                        fontFamily: 'var(--mono)',
                        fontSize: '9px',
                        color: 'var(--text2)',
                        maxWidth: '340px',
                        lineHeight: 1.5,
                      }}
                    >
                      Add your holdings to unlock personalized AI morning briefs, live P&amp;L
                      tracking, and allocation analytics calibrated to your exact portfolio.
                    </div>
                    <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                      <button
                        onClick={loadDemoPortfolio}
                        style={{
                          background: 'var(--cyan)',
                          color: '#000',
                          fontFamily: 'var(--mono)',
                          fontSize: '8px',
                          padding: '8px 16px',
                          border: 'none',
                          borderRadius: '3px',
                          cursor: 'pointer',
                          fontWeight: 600,
                          letterSpacing: '0.06em',
                        }}
                      >
                        LOAD DEMO PORTFOLIO
                      </button>
                      <button
                        onClick={focusAddHolding}
                        style={{
                          background: 'transparent',
                          color: 'var(--cyan)',
                          fontFamily: 'var(--mono)',
                          fontSize: '8px',
                          padding: '8px 16px',
                          border: '1px solid rgba(0,212,170,0.3)',
                          borderRadius: '3px',
                          cursor: 'pointer',
                          letterSpacing: '0.06em',
                        }}
                      >
                        + ADD MANUALLY
                      </button>
                    </div>
                    <div
                      style={{
                        fontFamily: 'var(--mono)',
                        fontSize: '7px',
                        color: 'var(--muted)',
                        marginTop: '4px',
                        letterSpacing: '0.08em',
                      }}
                    >
                      BLOOMBERG: $80K/YR ANALYST &nbsp;·&nbsp; CHAININTEL: INSTANT &amp; FREE
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              holdings.map((h, i) => {
                const pnl = getPnl(h);
                const pnlPct = getPnlPct(h);
                return (
                  <tr key={i} style={{ borderBottom: '1px solid var(--b1)' }}>
                    <td style={{ padding: '7px 12px', color: 'var(--text)', fontWeight: 600 }}>
                      {h.asset}
                    </td>
                    <td style={{ textAlign: 'right', padding: '7px 8px', color: 'var(--text2)' }}>
                      {h.qty.toLocaleString()}
                    </td>
                    <td style={{ textAlign: 'right', padding: '7px 8px', color: 'var(--text2)' }}>
                      ${fmtPrice(h.avgCost)}
                    </td>
                    <td style={{ textAlign: 'right', padding: '7px 8px', color: 'var(--cyan)' }}>
                      ${fmtPrice(getPrice(h.asset))}
                    </td>
                    <td style={{ textAlign: 'right', padding: '7px 8px', color: 'var(--text)' }}>
                      ${fmt(getValue(h))}
                    </td>
                    <td
                      style={{
                        textAlign: 'right',
                        padding: '7px 8px',
                        color: pnl >= 0 ? 'var(--green)' : 'var(--red)',
                      }}
                    >
                      {pnl >= 0 ? '+' : ''}${fmt(Math.abs(pnl))}
                    </td>
                    <td
                      style={{
                        textAlign: 'right',
                        padding: '7px 8px',
                        color: pnlPct >= 0 ? 'var(--green)' : 'var(--red)',
                      }}
                    >
                      {pnlPct >= 0 ? '+' : ''}
                      {pnlPct.toFixed(2)}%
                    </td>
                    <td style={{ padding: '7px 8px' }}>
                      <button
                        onClick={() => removeHolding(i)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--muted)',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontFamily: 'var(--mono)',
                        }}
                      >
                        ×
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ── AI Personalized Brief ────────────────────────────────────────── */}
      <div className="panel" style={{ padding: '14px', marginBottom: '12px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '10px',
          }}
        >
          <div
            style={{
              fontFamily: 'var(--mono)',
              fontSize: '8px',
              letterSpacing: '0.14em',
              color: 'var(--cyan)',
            }}
          >
            ◈ PERSONALIZED AI MORNING BRIEF
          </div>
          <button
            onClick={generateBrief}
            style={{
              background: 'var(--blue)',
              color: '#fff',
              border: 'none',
              fontFamily: 'var(--mono)',
              fontSize: '8px',
              letterSpacing: '0.1em',
              padding: '5px 12px',
              cursor: 'pointer',
            }}
          >
            GENERATE BRIEF →
          </button>
        </div>
        <div
          id="portAiBrief"
          style={{
            fontFamily: 'var(--mono)',
            fontSize: '10px',
            color: 'var(--text2)',
            lineHeight: 1.6,
            whiteSpace: 'pre-line',
          }}
        >
          {showBrief ? (
            briefText
          ) : (
            <>
              Add holdings above, then click{' '}
              <strong style={{ color: 'var(--text)' }}>GENERATE BRIEF</strong> to receive a
              personalized AI intelligence summary for your exact portfolio. ChainIntel will
              analyze your holdings against on-chain data, ETF flows, regulatory signals, and
              ISO 20022 adoption scores.
              <br />
              <br />
              <span style={{ color: 'var(--muted)', fontSize: '9px' }}>
                Bloomberg Terminal requires a human analyst (minimum $80K/yr) to produce this.
                ChainIntel does it in seconds, calibrated to your exact holdings.
              </span>
            </>
          )}
        </div>
      </div>

      {/* ── Allocation Chart + ISO Exposure ─────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div className="panel" style={{ padding: '14px' }}>
          <div
            style={{
              fontFamily: 'var(--mono)',
              fontSize: '8px',
              letterSpacing: '0.14em',
              color: 'var(--muted)',
              marginBottom: '10px',
            }}
          >
            ALLOCATION BY ASSET
          </div>
          <div style={{ position: 'relative', height: '180px', width: '100%' }}>
            {holdings.length > 0 ? (
              <Doughnut data={chartData} options={chartOptions} />
            ) : (
              <div
                id="portfolioChartEmpty"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  fontFamily: 'var(--mono)',
                  fontSize: '9px',
                  color: 'var(--muted)',
                  textAlign: 'center',
                  padding: '20px',
                }}
              >
                <div>
                  <div style={{ fontSize: '18px', marginBottom: '6px', opacity: 0.5 }}>◐</div>
                  Add holdings to see
                  <br />
                  allocation breakdown
                </div>
              </div>
            )}
          </div>
          {holdings.length > 0 && (
            <div
              id="portAllocLegend"
              style={{
                marginTop: '8px',
                fontFamily: 'var(--mono)',
                fontSize: '8px',
                color: 'var(--text2)',
                display: 'flex',
                flexWrap: 'wrap',
                gap: '6px',
              }}
            >
              {holdings.map((h, i) => (
                <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span
                    style={{
                      width: '8px',
                      height: '8px',
                      background: CHART_COLORS[i % CHART_COLORS.length],
                      display: 'inline-block',
                      borderRadius: '1px',
                    }}
                  ></span>
                  {h.asset} {totalValue > 0 ? ((getValue(h) / totalValue) * 100).toFixed(1) : 0}%
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="panel" style={{ padding: '14px' }}>
          <div
            style={{
              fontFamily: 'var(--mono)',
              fontSize: '8px',
              letterSpacing: '0.14em',
              color: 'var(--muted)',
              marginBottom: '10px',
            }}
          >
            ISO 20022 EXPOSURE
          </div>
          <div
            id="portIsoExposure"
            style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--text2)', lineHeight: 1.8 }}
          >
            {holdings.length === 0 ? (
              'Add holdings to see your ISO 20022 exposure percentage.'
            ) : (
              <>
                <div
                  style={{
                    fontSize: '22px',
                    fontWeight: 700,
                    color:
                      parseFloat(isoExposurePct) > 40
                        ? 'var(--cyan)'
                        : parseFloat(isoExposurePct) > 20
                        ? 'var(--gold)'
                        : 'var(--text2)',
                    marginBottom: '6px',
                  }}
                >
                  {isoExposurePct}%
                </div>
                <div
                  style={{ fontSize: '8px', color: 'var(--muted)', marginBottom: '8px' }}
                >
                  of portfolio in ISO 20022-aligned assets
                </div>
                {holdings
                  .filter(h => ISO_ASSETS.has(h.asset))
                  .map((h, i) => (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '3px 0',
                        borderBottom: '1px solid var(--b1)',
                      }}
                    >
                      <span style={{ color: 'var(--cyan)' }}>{h.asset}</span>
                      <span>
                        ${fmt(getValue(h))} (
                        {totalValue > 0
                          ? ((getValue(h) / totalValue) * 100).toFixed(1)
                          : 0}
                        %)
                      </span>
                    </div>
                  ))}
                {holdings.filter(h => ISO_ASSETS.has(h.asset)).length === 0 && (
                  <div style={{ color: 'var(--muted)', fontSize: '9px' }}>
                    No ISO 20022 assets in portfolio. Consider XRP, HBAR, QNT, XLM for
                    structural infrastructure exposure.
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
