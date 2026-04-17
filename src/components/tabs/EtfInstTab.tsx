'use client';

import { useEffect, useState, useCallback } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

interface EtfFund {
  ticker: string;
  issuer: string;
  fund_name: string;
  flow: number;
  aum: number;
}

interface EtfAggregate {
  dailyFlows: { date: string; net: number }[];
  fundBreakdown: EtfFund[];
  latestDate: string | null;
  streak: number;
  sevenDayNet: number;
  totalRows: number;
  totalAum: number;
  latestNetFlow: number;
}

interface EtfFlowsResponse extends EtfAggregate {
  assets?: {
    btc?: EtfAggregate;
    eth?: EtfAggregate;
  };
}

interface AltcoinEtfFund {
  ticker: string;
  issuer: string;
  fundName: string;
  expRatio: string;
  launchDate: string;
  staking?: string;
  todayFlow: number | null;
  aum: number | null;
  sinceInception: number | null;
  volume24h: number | null;
}

interface AltcoinEtfAsset {
  asset: string;
  assetPrice: number;
  priceChange24h: number;
  totalAum: number | null;
  cumulativeInflows: number | null;
  todayNetFlow: number | null;
  weekNetFlow: number | null;
  inflowStreak: number | null;
  fundCount: number;
  funds: AltcoinEtfFund[];
  live: boolean;
  sourceLabel: string;
  feedNote?: string;
  asOf?: string | null;
}

interface AltcoinEtfData {
  xrp: AltcoinEtfAsset;
  sol: AltcoinEtfAsset;
  pending: { asset: string; issuer: string; status: string; filed: string; deadline: string }[];
  totalAltcoinEtfAum: number;
  totalAltcoinNetFlowToday: number;
  milestones: { date: string; event: string }[];
  updatedAt: number;
}

function buildEtfFlowChartData(labels: string[], data: number[]) {
  return {
    labels,
    datasets: [{
      label: 'Net Flow ($M)',
      data,
      backgroundColor: data.map((v) => v >= 0 ? 'rgba(52,211,153,0.7)' : 'rgba(248,113,113,0.7)'),
      borderColor: data.map((v) => v >= 0 ? '#34D399' : '#F87171'),
      borderWidth: 1,
    }],
  };
}

const etfFlowChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx: any) => ` $${ctx.parsed.y}M` } } },
  scales: {
    y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#4a6a8c', font: { size: 9 }, callback: (v: unknown) => `$${v}M` } },
    x: { grid: { display: false }, ticks: { color: '#4a6a8c', font: { size: 8 } } },
  },
};

function fmtFlow(v: number | null | undefined): string {
  if (v === null || v === undefined || !Number.isFinite(v)) return '—';
  const sign = v >= 0 ? '+' : '−';
  const abs = Math.abs(v);
  if (abs >= 1000) return `${sign}$${(abs / 1000).toFixed(2)}B`;
  return `${sign}$${abs.toFixed(1)}M`;
}

function fmtAum(v: number | null | undefined): string {
  if (v === null || v === undefined || !Number.isFinite(v)) return '—';
  if (v >= 1e9) return `$${(v / 1e9).toFixed(1)}B`;
  if (v >= 1e6) return `$${(v / 1e6).toFixed(0)}M`;
  return `$${v.toLocaleString()}`;
}

function fmtPrice(v: number | null | undefined): string {
  if (v === null || v === undefined || !Number.isFinite(v)) return '—';
  if (v >= 1000) return `$${v.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  if (v >= 1) return `$${v.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  return `$${v.toFixed(3)}`;
}

function PulseBox({ height = '18px' }: { height?: string }) {
  return (
    <div
      style={{
        height,
        background: 'linear-gradient(90deg, var(--s1) 25%, var(--s2) 50%, var(--s1) 75%)',
        backgroundSize: '200% 100%',
        animation: 'pulseShimmer 1.4s infinite linear',
        borderRadius: '2px',
      }}
    />
  );
}

function formatChartDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function EtfTable({
  title,
  sourceLabel,
  funds,
  totalNetFlow,
  totalAum,
  loading,
  emptyMessage,
  latestDate,
  includeSinceLaunch = false,
}: {
  title: string;
  sourceLabel: string;
  funds: EtfFund[];
  totalNetFlow: number | null;
  totalAum: number | null;
  loading: boolean;
  emptyMessage: string;
  latestDate?: string | null;
  includeSinceLaunch?: boolean;
}) {
  return (
    <div className="panel">
      <div className="ph">
        <div className="pt">{title}</div>
        <div className="tag tag-live">{sourceLabel}</div>
      </div>
      <table className="dt">
        <thead>
          <tr>
            <th style={{ textAlign: 'left' }}>Product</th>
            <th style={{ textAlign: 'left' }}>Issuer</th>
            <th>Today&apos;s Flow</th>
            <th>AUM</th>
            {includeSinceLaunch && <th>Flow Share</th>}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={includeSinceLaunch ? 5 : 4} style={{ padding: 24 }}><PulseBox height="80px" /></td></tr>
          ) : funds.length === 0 ? (
            <tr><td colSpan={includeSinceLaunch ? 5 : 4} style={{ textAlign: 'center', padding: 24, color: 'var(--muted)' }}>{emptyMessage}</td></tr>
          ) : (
            <>
              {funds.map((fund) => (
                <tr key={fund.ticker}>
                  <td><span className="aname">{fund.fund_name}</span><span className="asym">{fund.ticker}</span></td>
                  <td style={{ textAlign: 'left' }}><span style={{ fontFamily: 'var(--mono)', fontSize: '8px', color: 'var(--muted)' }}>{fund.issuer.toUpperCase()}</span></td>
                  <td className={fund.flow >= 0 ? 'up' : 'dn'}>{fmtFlow(fund.flow)}</td>
                  <td>{fmtAum(fund.aum)}</td>
                  {includeSinceLaunch && (
                    <td style={{ color: 'var(--text2)' }}>
                      {totalNetFlow && totalNetFlow !== 0 ? `${((fund.flow / totalNetFlow) * 100).toFixed(0)}% of day` : '—'}
                    </td>
                  )}
                </tr>
              ))}
              <tr style={{ borderTop: '1px solid var(--b3)' }}>
                <td colSpan={2}><strong style={{ fontSize: '10px' }}>Total Net {latestDate ? `· ${formatChartDate(latestDate)}` : ''}</strong></td>
                <td className={(totalNetFlow || 0) >= 0 ? 'up' : 'dn'}><strong>{fmtFlow(totalNetFlow)}</strong></td>
                <td><strong>{fmtAum(totalAum)}</strong></td>
                {includeSinceLaunch && <td></td>}
              </tr>
            </>
          )}
        </tbody>
      </table>
    </div>
  );
}

function AltcoinFundTable({
  data,
  title,
}: {
  data: AltcoinEtfAsset;
  title: string;
}) {
  return (
    <div className="panel">
      <div className="ph">
        <div className="pt">{title}</div>
        <div className={`tag ${data.live ? 'tag-live' : 'tag-pro'}`}>{data.sourceLabel}</div>
      </div>
      <table className="dt">
        <thead>
          <tr>
            <th style={{ textAlign: 'left' }}>Product</th>
            <th style={{ textAlign: 'left' }}>Issuer</th>
            <th>Fee</th>
            <th>{data.live ? "Today's Flow" : 'Launch'}</th>
            <th>AUM</th>
            <th>{data.live ? 'Total Net Flow' : 'Status'}</th>
          </tr>
        </thead>
        <tbody>
          {data.funds.map((fund) => (
            <tr key={fund.ticker}>
              <td><span className="aname">{fund.fundName}</span><span className="asym">{fund.ticker}</span></td>
              <td style={{ textAlign: 'left' }}><span style={{ fontFamily: 'var(--mono)', fontSize: '8px', color: 'var(--muted)' }}>{fund.issuer.toUpperCase()}</span></td>
              <td style={{ color: parseFloat(fund.expRatio) > 1 ? 'var(--red)' : 'var(--muted)' }}>{fund.expRatio}</td>
              <td className={(fund.todayFlow || 0) >= 0 ? 'up' : 'dn'}>{data.live ? fmtFlow(fund.todayFlow) : fund.launchDate}</td>
              <td>{fmtAum(fund.aum)}</td>
              <td style={{ color: 'var(--text2)' }}>{data.live ? fmtFlow(fund.sinceInception) : 'Issuer watchlist'}</td>
            </tr>
          ))}
          <tr style={{ borderTop: '1px solid var(--b3)' }}>
            <td colSpan={2}><strong style={{ fontSize: '10px', color: 'var(--text)' }}>{data.asset} Monitor</strong></td>
            <td></td>
            <td className={(data.todayNetFlow || 0) >= 0 ? 'up' : 'dn'}><strong>{fmtFlow(data.todayNetFlow)}</strong></td>
            <td><strong>{fmtAum(data.totalAum)}</strong></td>
            <td className={(data.cumulativeInflows || 0) >= 0 ? 'up' : 'dn'}><strong>{fmtFlow(data.cumulativeInflows)}</strong></td>
          </tr>
        </tbody>
      </table>
      {data.feedNote && (
        <div style={{ fontFamily: 'var(--mono)', fontSize: '7px', color: 'var(--muted)', marginTop: '8px' }}>
          {data.feedNote}
        </div>
      )}
    </div>
  );
}

export default function EtfInstTab() {
  const [dateStr, setDateStr] = useState('');
  const [btcEtf, setBtcEtf] = useState<EtfAggregate | null>(null);
  const [ethEtf, setEthEtf] = useState<EtfAggregate | null>(null);
  const [etfLoading, setEtfLoading] = useState(true);
  const [altcoinData, setAltcoinData] = useState<AltcoinEtfData | null>(null);
  const [altcoinLoading, setAltcoinLoading] = useState(true);
  const [etfFlowChartData, setEtfFlowChartData] = useState(() => buildEtfFlowChartData([], []));

  useEffect(() => {
    setDateStr(new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }));
  }, []);

  const fetchEtfs = useCallback(async () => {
    try {
      const res = await fetch('/api/etf-flows');
      if (!res.ok) throw new Error(`${res.status}`);
      const json: EtfFlowsResponse = await res.json();
      const btc = json.assets?.btc || json;
      const eth = json.assets?.eth || null;
      setBtcEtf(btc);
      setEthEtf(eth && eth.fundBreakdown.length > 0 ? eth : null);
      if (btc.dailyFlows.length > 0) {
        setEtfFlowChartData(buildEtfFlowChartData(
          btc.dailyFlows.map((d) => formatChartDate(d.date)),
          btc.dailyFlows.map((d) => d.net)
        ));
      } else {
        setEtfFlowChartData(buildEtfFlowChartData([], []));
      }
    } catch {
      setBtcEtf(null);
      setEthEtf(null);
      setEtfFlowChartData(buildEtfFlowChartData([], []));
    } finally {
      setEtfLoading(false);
    }
  }, []);

  const fetchAltcoinEtfs = useCallback(async () => {
    try {
      const res = await fetch('/api/altcoin-etfs');
      if (!res.ok) throw new Error(`${res.status}`);
      const json = await res.json();
      setAltcoinData(json);
    } catch {
      setAltcoinData(null);
    } finally {
      setAltcoinLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEtfs();
    fetchAltcoinEtfs();
    const etfInterval = setInterval(fetchEtfs, 5 * 60 * 1000);
    const altInterval = setInterval(fetchAltcoinEtfs, 5 * 60 * 1000);
    return () => {
      clearInterval(etfInterval);
      clearInterval(altInterval);
    };
  }, [fetchEtfs, fetchAltcoinEtfs]);

  const topBtcFund = btcEtf?.fundBreakdown.slice().sort((a, b) => b.aum - a.aum)[0];
  const btcLatestDirection = (btcEtf?.latestNetFlow || 0) >= 0 ? 'inflow' : 'outflow';
  const sol = altcoinData?.sol;
  const xrp = altcoinData?.xrp;

  return (
    <div className="page" id="page-etfinst">
      <style>{`@keyframes pulseShimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>

      <div className="ai-context-strip" id="acs-etfinst">
        <span className="acs-icon">◈ CI·AI</span>
        <span className="acs-body" id="acs-body-etfinst">
          {btcEtf ? (
            <>
              US spot Bitcoin ETFs printed <strong>{fmtFlow(btcEtf.latestNetFlow)}</strong> on the latest session with a {btcEtf.streak}-day {btcLatestDirection} streak.
              {sol && (
                <> Solana ETF monitor shows <strong>{fmtFlow(sol.todayNetFlow)}</strong> on {sol.asOf || 'the latest update'} with {fmtAum(sol.totalAum)} tracked AUM.</>
              )}
              {xrp && (
                <> XRP is shown as an issuer watchlist with live market pricing at <strong>{fmtPrice(xrp.assetPrice)}</strong> because this stack does not have a trustworthy free public server-side flow feed for XRP ETFs.</>
              )}
            </>
          ) : (
            'Connecting to ETF flow and issuer watchlist feeds...'
          )}
        </span>
        <span className="acs-ts" id="acs-ts-etfinst"></span>
      </div>

      <div style={{ background: 'var(--s1)', border: '1px solid var(--b2)', margin: '1px 0' }}>
        <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--b2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: 'var(--mono)', fontSize: '8px', letterSpacing: '0.14em', color: 'var(--accent)' }}>
            ◈ ETF PIPELINE — LIVE BTC FEED · LIVE SOL TRACKER · XRP WATCHLIST
          </span>
          <span style={{ fontFamily: 'var(--mono)', fontSize: '7px', color: 'var(--muted)' }}>
            Source: ChainIntel ETF DB · SolanaFloor · CoinPaprika
          </span>
        </div>
        <div id="etfAppsFeed" style={{ overflowX: 'auto', padding: '8px 12px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: '6px' }}>
            <div style={{ background: 'var(--s2)', border: '1px solid var(--b2)', padding: '8px 10px' }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: '7px', color: 'var(--muted)', letterSpacing: '0.1em', marginBottom: '2px' }}>
                {xrp ? `${xrp.fundCount} ISSUERS` : 'WATCHLIST'}
              </div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--text)', marginBottom: '3px' }}>XRP ETF Roster</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: '7px', color: 'var(--gold)', letterSpacing: '0.08em' }}>
                {xrp?.feedNote ? 'WATCHLIST · PRICE LIVE' : 'LOADING...'}
              </div>
            </div>
            <div style={{ background: 'var(--s2)', border: '1px solid var(--b2)', padding: '8px 10px' }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: '7px', color: 'var(--muted)', letterSpacing: '0.1em', marginBottom: '2px' }}>
                {sol ? `${sol.fundCount} ISSUERS` : 'TRACKER'}
              </div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--text)', marginBottom: '3px' }}>SOL ETF Monitor</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: '7px', color: 'var(--green)', letterSpacing: '0.08em' }}>
                {sol?.live ? `LIVE · ${sol.asOf || 'Latest update'}` : 'LOADING...'}
              </div>
            </div>
            {(altcoinData?.pending || []).slice(0, 3).map((app) => (
              <div key={app.issuer + app.asset} style={{ background: 'var(--s2)', border: '1px solid var(--b2)', padding: '8px 10px' }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: '7px', color: 'var(--muted)', letterSpacing: '0.1em', marginBottom: '2px' }}>{app.issuer}</div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--text)', marginBottom: '3px' }}>{app.asset} ETF</div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: '7px', color: app.status === 'FILED' ? 'var(--gold)' : 'var(--muted)', letterSpacing: '0.08em' }}>
                  {app.status} · {app.filed}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="section-h">
        <div className="section-h-label">Bitcoin ETF Flow Intelligence</div>
        <div className="section-h-line"></div>
        <div className="tag tag-live">ChainIntel ETF DB · Supabase</div>
      </div>

      <div className="g5">
        <div className="kpi"><div className="kpi-label">Net Flow · Latest</div><div className="kpi-val" style={{ color: (btcEtf?.latestNetFlow || 0) >= 0 ? 'var(--green)' : 'var(--red)' }}>{etfLoading ? <PulseBox height="20px" /> : fmtFlow(btcEtf?.latestNetFlow)}</div><div className={`kpi-chg ${(btcEtf?.latestNetFlow || 0) >= 0 ? 'up' : 'dn'}`}>{btcEtf?.latestDate ? formatChartDate(btcEtf.latestDate) : 'Awaiting feed'}</div><div className="kpi-src">ChainIntel ETF DB</div></div>
        <div className="kpi"><div className="kpi-label">7-Day Net Flow</div><div className="kpi-val" style={{ color: (btcEtf?.sevenDayNet || 0) >= 0 ? 'var(--green)' : 'var(--red)' }}>{etfLoading ? <PulseBox height="20px" /> : fmtFlow(btcEtf?.sevenDayNet)}</div><div className={`kpi-chg ${(btcEtf?.sevenDayNet || 0) >= 0 ? 'up' : 'dn'}`}>Rolling 7 sessions</div><div className="kpi-src">ChainIntel ETF DB</div></div>
        <div className="kpi"><div className="kpi-label">Tracked AUM · BTC ETFs</div><div className="kpi-val" style={{ color: 'var(--text)' }}>{etfLoading ? <PulseBox height="20px" /> : fmtAum(btcEtf?.totalAum)}</div><div className="kpi-chg">Latest issuer snapshot</div><div className="kpi-src">ChainIntel ETF DB</div></div>
        <div className="kpi"><div className="kpi-label">Inflow / Outflow Streak</div><div className="kpi-val" style={{ color: 'var(--accent)' }}>{etfLoading ? <PulseBox height="20px" /> : btcEtf ? `${btcEtf.streak} Days` : '—'}</div><div className={`kpi-chg ${(btcEtf?.latestNetFlow || 0) >= 0 ? 'up' : 'dn'}`}>{btcEtf ? `${btcLatestDirection.toUpperCase()} regime` : 'Awaiting feed'}</div><div className="kpi-src">ChainIntel ETF DB</div></div>
        <div className="kpi"><div className="kpi-label">Largest AUM Holder</div><div className="kpi-val gold">{etfLoading ? <PulseBox height="20px" /> : topBtcFund?.ticker || '—'}</div><div className="kpi-chg">{topBtcFund ? topBtcFund.issuer : 'Awaiting feed'}</div><div className="kpi-src">Live issuer ranking</div></div>
      </div>

      <div className="g2">
        <EtfTable
          title="Bitcoin ETF Daily Flows — Latest Session"
          sourceLabel={dateStr}
          funds={btcEtf?.fundBreakdown || []}
          totalNetFlow={btcEtf?.latestNetFlow ?? null}
          totalAum={btcEtf?.totalAum ?? null}
          loading={etfLoading}
          emptyMessage="No live Bitcoin ETF flow records available right now."
          latestDate={btcEtf?.latestDate}
          includeSinceLaunch
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: 'var(--b1)' }}>
          <div className="panel">
            <div className="ph"><div className="pt">14-Day Flow History · Net BTC ETF</div><div className="tag tag-live">ChainIntel ETF DB</div></div>
            <div className="chart-wrap" style={{ height: '130px' }}>
              {btcEtf && btcEtf.dailyFlows.length > 0 ? (
                <Bar id="etfFlowChart" data={etfFlowChartData} options={etfFlowChartOptions as any} />
              ) : (
                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', fontFamily: 'var(--mono)', fontSize: '8px' }}>
                  {etfLoading ? 'Connecting to ETF flow feed...' : 'No historical BTC ETF flow data available.'}
                </div>
              )}
            </div>
          </div>
          <div className="panel">
            <div className="ph"><div className="pt">Current AUM by Issuer</div><div className="tag tag-live">Latest Snapshot</div></div>
            {(btcEtf?.fundBreakdown || []).length > 0 ? (
              <>
                {btcEtf!.fundBreakdown.slice().sort((a, b) => b.aum - a.aum).map((fund) => (
                  <div className="etf-row" key={fund.ticker}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}><div className="etf-name">{fund.ticker}</div><div className="etf-issuer">{fund.issuer}</div></div>
                    <div className="etf-flow up">{fmtAum(fund.aum)}</div>
                  </div>
                ))}
              </>
            ) : (
              <div style={{ padding: 16, fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--muted)' }}>
                {etfLoading ? 'Connecting to AUM feed...' : 'No live issuer AUM data available.'}
              </div>
            )}
          </div>
        </div>
      </div>

      <EtfTable
        title="Ethereum ETF Flows"
        sourceLabel={ethEtf?.latestDate ? formatChartDate(ethEtf.latestDate) : 'Standby'}
        funds={ethEtf?.fundBreakdown || []}
        totalNetFlow={ethEtf?.latestNetFlow ?? null}
        totalAum={ethEtf?.totalAum ?? null}
        loading={etfLoading}
        emptyMessage="No live ETH ETF rows are currently available from the free feed backing this tab."
        latestDate={ethEtf?.latestDate}
      />

      <div className="section-h">
        <div className="section-h-label">Altcoin ETF Monitor · SOL Live · XRP Watchlist</div>
        <div className="section-h-line"></div>
        <div className="tag tag-live">SolanaFloor · CoinPaprika</div>
      </div>

      <div className="g5">
        <div className="kpi">
          <div className="kpi-label">Tracked Altcoin ETF AUM</div>
          <div className="kpi-val" style={{ color: 'var(--accent)' }}>{altcoinLoading ? <PulseBox height="20px" /> : fmtAum(altcoinData?.totalAltcoinEtfAum)}</div>
          <div className="kpi-chg up">Live-tracked capital only</div>
          <div className="kpi-src">SolanaFloor</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">SOL ETF · Net Today</div>
          <div className="kpi-val" style={{ color: (sol?.todayNetFlow || 0) >= 0 ? 'var(--green)' : 'var(--red)' }}>{altcoinLoading ? <PulseBox height="20px" /> : fmtFlow(sol?.todayNetFlow)}</div>
          <div className={`kpi-chg ${(sol?.todayNetFlow || 0) >= 0 ? 'up' : 'dn'}`}>{sol?.asOf || 'Live tracker'}</div>
          <div className="kpi-src">SolanaFloor</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">SOL ETF AUM</div>
          <div className="kpi-val" style={{ color: 'var(--text)' }}>{altcoinLoading ? <PulseBox height="20px" /> : fmtAum(sol?.totalAum)}</div>
          <div className="kpi-chg">{sol?.fundCount || 0} tracked issuers</div>
          <div className="kpi-src">SolanaFloor</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">XRP Spot Price</div>
          <div className="kpi-val" style={{ color: 'var(--accent)' }}>{altcoinLoading ? <PulseBox height="20px" /> : fmtPrice(xrp?.assetPrice)}</div>
          <div className={`kpi-chg ${(xrp?.priceChange24h || 0) >= 0 ? 'up' : 'dn'}`}>{xrp ? `${xrp.priceChange24h >= 0 ? '+' : ''}${xrp.priceChange24h.toFixed(2)}% 24h` : 'Live market feed'}</div>
          <div className="kpi-src">CoinPaprika</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Open ETF Filings</div>
          <div className="kpi-val gold">{altcoinLoading ? <PulseBox height="20px" /> : altcoinData?.pending.length || 0}</div>
          <div className="kpi-chg">DOGE · LTC · ADA · AVAX · DOT</div>
          <div className="kpi-src">Watchlist</div>
        </div>
      </div>

      {altcoinLoading ? (
        <div className="panel" style={{ padding: '20px' }}><PulseBox height="120px" /></div>
      ) : xrp ? (
        <AltcoinFundTable data={xrp} title="XRP ETF Issuer Watchlist" />
      ) : null}

      {altcoinLoading ? (
        <div className="panel" style={{ padding: '20px' }}><PulseBox height="120px" /></div>
      ) : sol ? (
        <AltcoinFundTable data={sol} title="SOL ETF Daily Monitor" />
      ) : null}

      {altcoinData?.milestones && (
        <div className="panel">
          <div className="ph">
            <div className="pt">Altcoin ETF Milestones & Filing Watch</div>
            <div className="tag tag-live">Issuer Roster · Filing Calendar</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '4px 0' }}>
              {altcoinData.milestones.map((m, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent)', flexShrink: 0, marginTop: '4px' }} />
                  <div style={{ display: 'flex', gap: '8px', flex: 1, alignItems: 'baseline' }}>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: '8px', color: 'var(--muted)', flex: '0 0 72px' }}>{m.date}</span>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--text)' }}>{m.event}</span>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '4px 0' }}>
              {altcoinData.pending.map((item) => (
                <div key={item.asset + item.issuer} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: item.status === 'FILED' ? 'var(--gold)' : 'var(--muted)', flexShrink: 0, marginTop: '4px' }} />
                  <div style={{ display: 'flex', gap: '8px', flex: 1, alignItems: 'baseline' }}>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: '8px', color: 'var(--muted)', flex: '0 0 72px' }}>{item.deadline}</span>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--text)' }}>{item.asset} · {item.issuer} · {item.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="ai-box">
        <div className="ai-label"><span className="ai-pulse"></span>ETF Flow Signal</div>
        <div className="ai-text">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}><span style={{ color: (btcEtf?.latestNetFlow || 0) >= 0 ? 'var(--green)' : 'var(--red)', flexShrink: 0 }}>▸</span><span>{btcEtf ? <><strong>BTC ETFs {fmtFlow(btcEtf.latestNetFlow)} on the latest session</strong> — {btcEtf.streak}-day {btcLatestDirection} streak with {fmtAum(btcEtf.totalAum)} in tracked AUM.</> : 'BTC ETF flow feed is still loading.'}</span></div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}><span style={{ color: 'var(--blue)', flexShrink: 0 }}>▸</span><span>{sol ? <><strong>SOL ETFs {fmtFlow(sol.todayNetFlow)} on {sol.asOf || 'the latest update'}</strong> — live monitored via SolanaFloor with {fmtAum(sol.totalAum)} tracked AUM and {sol.inflowStreak ?? 0}-session streak.</> : 'SOL ETF live tracker is still loading.'}</span></div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}><span style={{ color: 'var(--accent)', flexShrink: 0 }}>▸</span><span>{xrp ? <><strong>XRP is running in issuer-watchlist mode</strong> — {xrp.fundCount} tracked ETF products and live market pricing at {fmtPrice(xrp.assetPrice)}. ChainIntel deliberately avoids fabricated XRP ETF AUM/flow numbers until a dependable free public endpoint is available.</> : 'XRP issuer watchlist is still loading.'}</span></div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}><span style={{ color: 'var(--gold)', flexShrink: 0 }}>▸</span><span><strong>Pipeline remains active:</strong> {altcoinData?.pending.map((p) => p.asset).join(', ') || 'watching open filings'} are still on the calendar, so the tab now separates live-tracked ETF capital from roster and filing intelligence instead of blending them into placeholder flow numbers.</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
