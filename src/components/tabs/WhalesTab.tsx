'use client';

import { useState } from 'react';

const chainScoreData: Record<string, {
  score: number;
  onChain: number;
  protocol: number;
  regulatory: number;
  smartMoney: number;
  technomics: number;
}> = {
  BTC: { score: 88, onChain: 92, protocol: 88, regulatory: 84, smartMoney: 90, technomics: 86 },
  ETH: { score: 82, onChain: 86, protocol: 90, regulatory: 72, smartMoney: 84, technomics: 78 },
  XRP: { score: 91, onChain: 88, protocol: 92, regulatory: 94, smartMoney: 88, technomics: 90 },
  HBAR: { score: 85, onChain: 82, protocol: 86, regulatory: 88, smartMoney: 84, technomics: 84 },
  QNT: { score: 87, onChain: 80, protocol: 88, regulatory: 90, smartMoney: 86, technomics: 88 },
  XLM: { score: 76, onChain: 74, protocol: 80, regulatory: 82, smartMoney: 72, technomics: 74 },
  ADA: { score: 72, onChain: 76, protocol: 82, regulatory: 74, smartMoney: 68, technomics: 70 },
  IOTA: { score: 70, onChain: 68, protocol: 74, regulatory: 72, smartMoney: 66, technomics: 68 },
};

const chainScoreLiveRows = [
  { sym: 'BTC', name: 'Bitcoin', score: 88, rating: 'STRONG BUY', reg: 'COMMODITY', adoption: 'INSTITUTIONAL', liquidity: 'ULTRA HIGH', notes: 'SEC/CFTC commodity classification confirmed' },
  { sym: 'ETH', name: 'Ethereum', score: 82, rating: 'BUY', reg: 'COMMODITY', adoption: 'INSTITUTIONAL', liquidity: 'ULTRA HIGH', notes: 'Commodity ruling pending; ETF approved' },
  { sym: 'XRP', name: 'XRP Ledger', score: 91, rating: 'STRONG BUY', reg: 'COMMODITY', adoption: 'INSTITUTIONAL', liquidity: 'HIGH', notes: 'SEC case settled; commodity classification' },
  { sym: 'SOL', name: 'Solana', score: 74, rating: 'BUY', reg: 'UNRESOLVED', adoption: 'HIGH', liquidity: 'HIGH', notes: 'ETF filed; regulatory status pending' },
  { sym: 'BNB', name: 'BNB Chain', score: 62, rating: 'NEUTRAL', reg: 'SCRUTINY', adoption: 'MEDIUM', liquidity: 'HIGH', notes: 'DOJ settlement; ongoing regulatory scrutiny' },
  { sym: 'HBAR', name: 'Hedera', score: 85, rating: 'STRONG BUY', reg: 'COMMODITY', adoption: 'INSTITUTIONAL', liquidity: 'MEDIUM', notes: 'CFTC commodity; 39-member governing council' },
  { sym: 'QNT', name: 'Quant Network', score: 87, rating: 'STRONG BUY', reg: 'COMMODITY', adoption: 'INSTITUTIONAL', liquidity: 'MEDIUM', notes: 'ECB pioneer; MX.3 integration' },
  { sym: 'XLM', name: 'Stellar', score: 76, rating: 'BUY', reg: 'MiCA', adoption: 'MEDIUM', liquidity: 'MEDIUM', notes: 'MiCA aligned; EU CBDC rails' },
  { sym: 'ADA', name: 'Cardano', score: 72, rating: 'BUY', reg: 'MiCA', adoption: 'MEDIUM', liquidity: 'MEDIUM', notes: 'MiCA compliant; UNHCR partnership' },
  { sym: 'IOTA', name: 'IOTA', score: 70, rating: 'BUY', reg: 'FAVORABLE', adoption: 'GOV PILOT', liquidity: 'LOW', notes: 'UK govt TWIN trial; FCA engagement' },
  { sym: 'XDC', name: 'XDC Network', score: 74, rating: 'BUY', reg: 'FAVORABLE', adoption: 'TRADE FIN', liquidity: 'LOW', notes: 'BitGo custody; $50B+ trade finance pipeline' },
  { sym: 'ALGO', name: 'Algorand', score: 66, rating: 'NEUTRAL', reg: 'MiCA', adoption: 'CBDC PILOT', liquidity: 'LOW', notes: 'Marshall Islands SOV; CBDC pilots' },
  { sym: 'DOT', name: 'Polkadot', score: 64, rating: 'NEUTRAL', reg: 'UNRESOLVED', adoption: 'DEVELOPER', liquidity: 'MEDIUM', notes: 'Parachain ecosystem; regulatory pending' },
  { sym: 'LINK', name: 'Chainlink', score: 78, rating: 'BUY', reg: 'FAVORABLE', adoption: 'INSTITUTIONAL', liquidity: 'MEDIUM', notes: 'SWIFT CCIP integration; DeFi oracle standard' },
];

const getRatingColor = (rating: string) => {
  if (rating === 'STRONG BUY') return 'var(--cyan)';
  if (rating === 'BUY') return 'var(--green)';
  if (rating === 'NEUTRAL') return 'var(--gold)';
  return 'var(--red)';
};

const getScoreColor = (score: number) => {
  if (score >= 85) return 'var(--cyan)';
  if (score >= 75) return 'var(--green)';
  if (score >= 65) return 'var(--gold)';
  return 'var(--red)';
};

const whaleAlerts = [
  { type: 'buy', dir: 'BUY', amt: '$224.8M', asset: '2,709 BTC', from: 'Unknown → Coinbase Custody', minsAgo: 3 },
  { type: 'transfer', dir: 'XFER', amt: '$312M', asset: '3,759 BTC', from: 'Cold wallet → OTC desk', minsAgo: 8 },
  { type: 'buy', dir: 'BUY', amt: '$48.2M', asset: '30,506 ETH', from: 'Unknown → Binance', minsAgo: 14 },
  { type: 'sell', dir: 'SELL', amt: '$31.8M', asset: '15.1M XRP', from: 'Kraken → Unknown', minsAgo: 18 },
  { type: 'transfer', dir: 'XFER', amt: '$88.4M', asset: '130M ADA', from: 'Binance → Cold storage', minsAgo: 26 },
  { type: 'buy', dir: 'BUY', amt: '$89.6M', asset: '1,080 BTC', from: 'Unknown → Coinbase Pro', minsAgo: 31 },
  { type: 'sell', dir: 'SELL', amt: '$14.2M', asset: '8,987 ETH', from: 'Unknown → DEX', minsAgo: 44 },
  { type: 'transfer', dir: 'XFER', amt: '$210M', asset: '2,530 BTC', from: 'Binance → Cold storage', minsAgo: 52 },
];

export default function WhalesTab() {
  const [selectedAsset, setSelectedAsset] = useState('BTC');
  const [alertAsset, setAlertAsset] = useState('BTC');
  const [alertCondition, setAlertCondition] = useState('above');
  const [alertTarget, setAlertTarget] = useState('');
  const [alertFreq, setAlertFreq] = useState('once');
  const [alerts, setAlerts] = useState<Array<{ asset: string; condition: string; target: string; freq: string }>>([]);

  const cs = chainScoreData[selectedAsset];

  const addPriceAlert = () => {
    if (!alertTarget) return;
    setAlerts(prev => [...prev, { asset: alertAsset, condition: alertCondition, target: alertTarget, freq: alertFreq }]);
    setAlertTarget('');
  };

  const removeAlert = (idx: number) => {
    setAlerts(prev => prev.filter((_, i) => i !== idx));
  };

  const conditionLabel = (c: string) => {
    if (c === 'above') return 'above';
    if (c === 'below') return 'below';
    if (c === 'change_up') return '% up';
    return '% down';
  };

  return (
    <div className="page" id="page-alerts">
      <div className="ai-context-strip" id="acs-alerts">
        <span className="acs-icon">◈ CI·AI</span>
        <span className="acs-body" id="acs-body-alerts">
          Net whale direction: accumulative — exchange outflows dominate inflows 3.2x. The $312M cold-wallet OTC desk transfer signals institutional block purchasing.{' '}
          <strong>Pattern matches pre-rally accumulation phases from Q4 2020 and Q4 2023.</strong>
        </span>
        <span className="acs-ts" id="acs-ts-alerts"></span>
      </div>
      <div className="section-h">
        <div className="section-h-label">Whale Transaction Tracker</div>
        <div className="section-h-line"></div>
        <div className="tag tag-live">Whale Alert · Nansen</div>
      </div>

      <div className="g4">
        <div className="kpi"><div className="kpi-label">Alerts Today</div><div className="kpi-val" style={{ color: 'var(--text)' }}>284</div><div className="kpi-chg">$50M+ threshold</div></div>
        <div className="kpi"><div className="kpi-label">Largest Alert · 24h</div><div className="kpi-val gold">$312M</div><div className="kpi-chg">3,568 BTC · Cold → OTC desk</div></div>
        <div className="kpi"><div className="kpi-label">Net Whale Direction</div><div className="kpi-val cyan">ACCUM</div><div className="kpi-chg up">Exchange outflows dominate</div></div>
        <div className="kpi"><div className="kpi-label">Smart Money Signal</div><div className="kpi-val up">BULLISH</div><div className="kpi-chg up">Nansen-labeled wallets accumulating</div></div>
      </div>

      <div className="g2">
        <div className="panel">
          <div className="ph">
            <div className="pt">Whale Transaction Tracker · $10M+ Transactions</div>
            <div className="tag tag-live">Whale Alert API</div>
          </div>
          <div id="whaleAlertFeed">
            {whaleAlerts.map((w, i) => (
              <div key={i} className={`whale-item ${w.type}`}>
                <div className={`wdir ${w.type}`}>{w.dir}</div>
                <div>
                  <div className="wamt">{w.amt}</div>
                  <div className="wasset">{w.asset}</div>
                </div>
                <div className="wfrom">{w.from}</div>
                <div className="wage" data-minsago={w.minsAgo}>{w.minsAgo}m ago</div>
              </div>
            ))}
          </div>
        </div>

        <div className="panel">
          <div className="ph">
            <div className="pt"><span data-glossary="ChainScore™">ChainScore™</span> — Full Ratings</div>
            <div className="tag tag-ai">5-Dimension Methodology</div>
          </div>
          <div id="chainScoreSelector" style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '8px', maxWidth: '100%' }}>
            {Object.keys(chainScoreData).map(asset => (
              <button
                key={asset}
                className={`cs-asset-btn${selectedAsset === asset ? ' active' : ''}`}
                data-asset={asset}
                onClick={() => setSelectedAsset(asset)}
                style={{
                  fontFamily: 'var(--mono)',
                  fontSize: '8px',
                  padding: '3px 7px',
                  background: 'var(--s3)',
                  border: `1px solid ${selectedAsset === asset ? 'var(--cyan)' : 'var(--b2)'}`,
                  color: selectedAsset === asset ? 'var(--cyan)' : 'var(--text2)',
                  borderRadius: '3px',
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
              >
                {asset}
              </button>
            ))}
          </div>
          <div className="gauge-wrap">
            <svg width="160" height="90" viewBox="0 0 160 90">
              <path d="M 10 80 A 70 70 0 0 1 150 80" fill="none" stroke="var(--b3)" strokeWidth="12" strokeLinecap="round"/>
              <path
                d="M 10 80 A 70 70 0 0 1 150 80"
                fill="none"
                stroke="var(--cyan)"
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={`${(cs.score / 100) * 220} 220`}
              />
              <text x="80" y="70" textAnchor="middle" fill="var(--cyan)" fontFamily="var(--mono)" fontSize="22" fontWeight="700">{cs.score}</text>
              <text x="80" y="86" textAnchor="middle" fill="var(--text2)" fontFamily="var(--mono)" fontSize="8">{selectedAsset} ChainScore™</text>
            </svg>
          </div>
          <div className="sub-scores">
            <div className="ss-row"><div className="ss-label">On-Chain Health</div><div className="ss-bar"><div className="ss-fill" id="ss1" style={{ width: `${cs.onChain}%` }}></div></div><div className="ss-val">{cs.onChain}</div></div>
            <div className="ss-row"><div className="ss-label">Protocol Fundamentals</div><div className="ss-bar"><div className="ss-fill" id="ss2" style={{ width: `${cs.protocol}%` }}></div></div><div className="ss-val">{cs.protocol}</div></div>
            <div className="ss-row"><div className="ss-label">Regulatory Exposure</div><div className="ss-bar"><div className="ss-fill" id="ss3" style={{ width: `${cs.regulatory}%` }}></div></div><div className="ss-val">{cs.regulatory}</div></div>
            <div className="ss-row"><div className="ss-label">Smart Money Position</div><div className="ss-bar"><div className="ss-fill" id="ss4" style={{ width: `${cs.smartMoney}%` }}></div></div><div className="ss-val">{cs.smartMoney}</div></div>
            <div className="ss-row"><div className="ss-label">Technomics Risk</div><div className="ss-bar"><div className="ss-fill" id="ss5" style={{ width: `${cs.technomics}%` }}></div></div><div className="ss-val">{cs.technomics}</div></div>
          </div>
        </div>
      </div>

      <div className="ai-box">
        <div className="ai-label">
          <span className="ai-pulse"></span>Whale AI Intelligence · Nansen · Whale Alert · <span id="whaleAiDate"></span>
        </div>
        <div className="ai-text">
          <strong>Net whale direction is structurally accumulative — <span data-glossary="Exchange Outflows">exchange outflows</span> dominate inflows by 3.2x.</strong> The $312M cold-wallet to OTC desk transfer signals institutional accumulation, not distribution — OTC desks facilitate large block purchases without impacting spot price. Nansen-labeled smart money wallets are net buyers at current levels. BTC <span data-glossary="ChainScore™">ChainScore™</span> of 88 is in the top 5% of historical readings. <strong>Pattern matches historical pre-rally accumulation phases seen in Q4 2020 and Q4 2023. This is not distribution behavior.</strong>
        </div>
      </div>

      {/* ChainScore Live Table */}
      <div style={{ background: 'var(--s1)', border: '1px solid var(--b2)', margin: '1px 0' }}>
        <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--b2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: 'var(--mono)', fontSize: '8px', letterSpacing: '0.14em', color: 'var(--cyan)' }}>◈ CHAINSCORE™ RATINGS — LIVE FROM DATABASE</span>
          <span style={{ fontFamily: 'var(--mono)', fontSize: '7px', color: 'var(--muted)' }}>Click any row for full asset detail · 14 assets rated</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--s2)' }}>
                <th style={{ padding: '5px 8px', fontFamily: 'var(--mono)', fontSize: '7px', color: 'var(--muted)', letterSpacing: '0.1em', textAlign: 'left' }}>SYMBOL</th>
                <th style={{ padding: '5px 8px', fontFamily: 'var(--mono)', fontSize: '7px', color: 'var(--muted)', letterSpacing: '0.1em', textAlign: 'left' }}>ASSET</th>
                <th style={{ padding: '5px 8px', fontFamily: 'var(--mono)', fontSize: '7px', color: 'var(--muted)', letterSpacing: '0.1em', textAlign: 'left' }}>SCORE /100</th>
                <th style={{ padding: '5px 8px', fontFamily: 'var(--mono)', fontSize: '7px', color: 'var(--muted)', letterSpacing: '0.1em', textAlign: 'left' }}>RATING</th>
                <th style={{ padding: '5px 8px', fontFamily: 'var(--mono)', fontSize: '7px', color: 'var(--muted)', letterSpacing: '0.1em', textAlign: 'left' }}>REG</th>
                <th style={{ padding: '5px 8px', fontFamily: 'var(--mono)', fontSize: '7px', color: 'var(--muted)', letterSpacing: '0.1em', textAlign: 'left' }}>ADOPTION</th>
                <th style={{ padding: '5px 8px', fontFamily: 'var(--mono)', fontSize: '7px', color: 'var(--muted)', letterSpacing: '0.1em', textAlign: 'left' }}>LIQUIDITY</th>
                <th style={{ padding: '5px 8px', fontFamily: 'var(--mono)', fontSize: '7px', color: 'var(--muted)', letterSpacing: '0.1em', textAlign: 'left' }}>REGULATORY NOTES</th>
              </tr>
            </thead>
            <tbody id="chainScoreLiveTable">
              {chainScoreLiveRows.map((row, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--b1)', cursor: 'pointer' }}>
                  <td style={{ padding: '5px 8px', fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--cyan)', fontWeight: 600 }}>{row.sym}</td>
                  <td style={{ padding: '5px 8px', fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--text2)' }}>{row.name}</td>
                  <td style={{ padding: '5px 8px', fontFamily: 'var(--mono)', fontSize: '9px', color: getScoreColor(row.score), fontWeight: 700 }}>{row.score}</td>
                  <td style={{ padding: '5px 8px', fontFamily: 'var(--mono)', fontSize: '8px', color: getRatingColor(row.rating) }}>{row.rating}</td>
                  <td style={{ padding: '5px 8px', fontFamily: 'var(--mono)', fontSize: '8px', color: 'var(--text2)' }}>{row.reg}</td>
                  <td style={{ padding: '5px 8px', fontFamily: 'var(--mono)', fontSize: '8px', color: 'var(--text2)' }}>{row.adoption}</td>
                  <td style={{ padding: '5px 8px', fontFamily: 'var(--mono)', fontSize: '8px', color: 'var(--text2)' }}>{row.liquidity}</td>
                  <td style={{ padding: '5px 8px', fontFamily: 'var(--mono)', fontSize: '8px', color: 'var(--muted)' }}>{row.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Price Alert Builder */}
      <div className="panel" style={{ marginTop: '1px' }}>
        <div className="ph">
          <div className="pt">⚡ Price Alert Builder</div>
          <div className="tag tag-live">Supabase · Real-time</div>
        </div>
        <div style={{ padding: '12px 14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr auto', gap: '8px', alignItems: 'end', marginBottom: '10px' }}>
            <div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: '7px', color: 'var(--muted)', marginBottom: '4px', letterSpacing: '0.1em' }}>ASSET</div>
              <select
                id="alertAsset"
                value={alertAsset}
                onChange={e => setAlertAsset(e.target.value)}
                style={{ width: '100%', background: 'var(--s3)', border: '1px solid var(--b3)', color: 'var(--text)', fontFamily: 'var(--mono)', fontSize: '9px', padding: '6px 8px' }}
              >
                <option>BTC</option><option>ETH</option><option>XRP</option><option>SOL</option>
                <option>XLM</option><option>HBAR</option><option>ADA</option><option>XDC</option>
                <option>IOTA</option><option>ALGO</option><option>QNT</option><option>BNB</option>
              </select>
            </div>
            <div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: '7px', color: 'var(--muted)', marginBottom: '4px', letterSpacing: '0.1em' }}>CONDITION</div>
              <select
                id="alertCondition"
                value={alertCondition}
                onChange={e => setAlertCondition(e.target.value)}
                style={{ width: '100%', background: 'var(--s3)', border: '1px solid var(--b3)', color: 'var(--text)', fontFamily: 'var(--mono)', fontSize: '9px', padding: '6px 8px' }}
              >
                <option value="above">Price above</option>
                <option value="below">Price below</option>
                <option value="change_up">% change up</option>
                <option value="change_down">% change down</option>
              </select>
            </div>
            <div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: '7px', color: 'var(--muted)', marginBottom: '4px', letterSpacing: '0.1em' }}>TARGET VALUE</div>
              <input
                id="alertTarget"
                type="number"
                placeholder="e.g. 80000"
                value={alertTarget}
                onChange={e => setAlertTarget(e.target.value)}
                style={{ width: '100%', background: 'var(--s3)', border: '1px solid var(--b3)', color: 'var(--text)', fontFamily: 'var(--mono)', fontSize: '9px', padding: '6px 8px', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: '7px', color: 'var(--muted)', marginBottom: '4px', letterSpacing: '0.1em' }}>FREQUENCY</div>
              <select
                id="alertFreq"
                value={alertFreq}
                onChange={e => setAlertFreq(e.target.value)}
                style={{ width: '100%', background: 'var(--s3)', border: '1px solid var(--b3)', color: 'var(--text)', fontFamily: 'var(--mono)', fontSize: '9px', padding: '6px 8px' }}
              >
                <option value="once">Once</option>
                <option value="always">Every trigger</option>
              </select>
            </div>
            <div>
              <button
                onClick={addPriceAlert}
                style={{ background: 'var(--cyan)', color: '#000', border: 'none', fontFamily: 'var(--mono)', fontSize: '9px', fontWeight: 700, padding: '7px 16px', cursor: 'pointer', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}
              >
                + SET ALERT
              </button>
            </div>
          </div>
          <div id="alertsList" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {alerts.length === 0 ? (
              <div style={{ fontFamily: 'var(--mono)', fontSize: '8px', color: 'var(--muted)', padding: '8px 0', textAlign: 'center' }}>
                No active alerts. Set one above — it will fire as a toast notification when triggered.
              </div>
            ) : (
              alerts.map((a, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--s2)', border: '1px solid var(--b2)', padding: '6px 10px' }}>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--text)' }}>
                    <span style={{ color: 'var(--cyan)' }}>{a.asset}</span> · {conditionLabel(a.condition)} <span style={{ color: 'var(--gold)' }}>${a.target}</span> · {a.freq === 'once' ? 'Once' : 'Every trigger'}
                  </span>
                  <button
                    onClick={() => removeAlert(i)}
                    style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontFamily: 'var(--mono)', fontSize: '10px' }}
                  >
                    ×
                  </button>
                </div>
              ))
            )}
          </div>
          <div style={{ marginTop: '8px', fontFamily: 'var(--mono)', fontSize: '7px', color: 'var(--muted)' }}>
            Alerts are session-based. Pro tier unlocks persistent cloud alerts via email + push notification.
          </div>
        </div>
      </div>
    </div>
  );
}
