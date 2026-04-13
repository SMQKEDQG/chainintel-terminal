'use client';

export default function SentimentTab() {
  const socialMetrics = [
    { asset: 'BTC', mentions: '842K', sentiment: '−24%', devActivity: 'High', galaxyScore: 72, trend: 'Bearish retail, bullish smart money' },
    { asset: 'ETH', mentions: '428K', sentiment: '−31%', devActivity: 'Very High', galaxyScore: 68, trend: 'Dev momentum strong despite price weakness' },
    { asset: 'XRP', mentions: '312K', sentiment: '+18%', devActivity: 'Medium', galaxyScore: 76, trend: 'SEC clarity driving optimism' },
    { asset: 'SOL', mentions: '284K', sentiment: '−12%', devActivity: 'High', galaxyScore: 64, trend: 'DeFi TVL concerns offset dev activity' },
    { asset: 'HBAR', mentions: '86K', sentiment: '+22%', devActivity: 'Medium', galaxyScore: 71, trend: 'ISO 20022 narrative gaining traction' },
    { asset: 'ADA', mentions: '142K', sentiment: '−8%', devActivity: 'High', galaxyScore: 58, trend: 'Hydra updates underappreciated' },
  ];

  return (
    <div>
      <div className="ai-context-strip">
        <span className="acs-icon">◈ CI·AI</span>
        <span className="acs-body">Social sentiment at extremes: retail maximally bearish while institutional signals diverge bullish. <strong>This retail/institutional divergence historically precedes 15-25% recoveries within 60 days.</strong></span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.12em', color: 'var(--text2)' }}>SOCIAL SENTIMENT & DEVELOPER INTELLIGENCE</span>
        <div style={{ flex: 1, height: 1, background: 'var(--b2)' }} />
        <div className="tag tag-live"><a className="src-link" href="https://lunarcrush.com" target="_blank" rel="noopener noreferrer">LunarCrush</a> · <a className="src-link" href="https://santiment.net" target="_blank" rel="noopener noreferrer">Santiment</a></div>
      </div>

      <div className="g4">
        <div className="kpi"><div className="kpi-label">Crypto Twitter Sentiment</div><div className="kpi-val" style={{ color: 'var(--red)' }}>−24%</div><div className="kpi-chg dn">Bearish — multi-month low</div></div>
        <div className="kpi"><div className="kpi-label">Social Volume (24h)</div><div className="kpi-val cyan">2.4M</div><div className="kpi-chg up">+18% vs 7d avg — fear-driven</div></div>
        <div className="kpi"><div className="kpi-label">GitHub Commits (7d)</div><div className="kpi-val" style={{ color: 'var(--green)' }}>14,200</div><div className="kpi-chg up">+6% — developers still building</div></div>
        <div className="kpi"><div className="kpi-label">Reddit Weighted Sentiment</div><div className="kpi-val" style={{ color: 'var(--red)' }}>−0.42</div><div className="kpi-chg dn">r/CryptoCurrency · bearish</div></div>
      </div>

      <div className="panel">
        <div className="ph"><div className="pt">Sentiment & Developer Activity Matrix</div><div className="tag tag-live"><a className="src-link" href="https://lunarcrush.com" target="_blank" rel="noopener noreferrer">LunarCrush</a></div></div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--mono)', fontSize: 11 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--b2)' }}>
              <th style={{ textAlign: 'left', padding: '6px 8px', color: 'var(--muted)', fontSize: 8 }}>ASSET</th>
              <th style={{ textAlign: 'right', padding: '6px 8px', color: 'var(--muted)', fontSize: 8 }}>MENTIONS (7d)</th>
              <th style={{ textAlign: 'right', padding: '6px 8px', color: 'var(--muted)', fontSize: 8 }}>SENTIMENT</th>
              <th style={{ textAlign: 'center', padding: '6px 8px', color: 'var(--muted)', fontSize: 8 }}>DEV ACTIVITY</th>
              <th style={{ textAlign: 'right', padding: '6px 8px', color: 'var(--muted)', fontSize: 8 }}>GALAXY SCORE</th>
              <th style={{ textAlign: 'left', padding: '6px 8px', color: 'var(--muted)', fontSize: 8 }}>TREND</th>
            </tr>
          </thead>
          <tbody>
            {socialMetrics.map(s => (
              <tr key={s.asset} style={{ borderBottom: '1px solid var(--b1)' }}>
                <td style={{ padding: '5px 8px', fontWeight: 600, color: 'var(--text)' }}>{s.asset}</td>
                <td style={{ textAlign: 'right', padding: '5px 8px', color: 'var(--text2)' }}>{s.mentions}</td>
                <td style={{ textAlign: 'right', padding: '5px 8px', color: s.sentiment.startsWith('+') ? 'var(--green)' : 'var(--red)', fontWeight: 600 }}>{s.sentiment}</td>
                <td style={{ textAlign: 'center', padding: '5px 8px' }}>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 8, padding: '2px 6px', background: s.devActivity === 'Very High' ? 'rgba(0,212,170,0.15)' : s.devActivity === 'High' ? 'rgba(16,185,129,0.1)' : 'rgba(74,106,140,0.1)', color: s.devActivity === 'Very High' ? 'var(--cyan)' : s.devActivity === 'High' ? 'var(--green)' : 'var(--text2)' }}>{s.devActivity}</span>
                </td>
                <td style={{ textAlign: 'right', padding: '5px 8px', fontWeight: 700, color: 'var(--cyan)' }}>{s.galaxyScore}</td>
                <td style={{ padding: '5px 8px', fontSize: 9, color: 'var(--text2)' }}>{s.trend}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ background: 'var(--s1)', border: '1px solid var(--b1)', padding: '10px 14px', marginTop: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--cyan)', animation: 'pulse 2s infinite' }} />
          <span style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--cyan)' }}>Sentiment AI Synthesis</span>
        </div>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text2)', lineHeight: 1.6 }}>
          <strong style={{ color: 'var(--text)' }}>Maximum retail fear (sentiment −24%) while developer activity remains strong (+6% weekly commits).</strong> This divergence — sentiment capitulating while builders keep building — is historically the strongest contrarian signal in crypto. GitHub activity is the &quot;smart money&quot; of sentiment: builders don&apos;t code for dead projects.
        </div>
      </div>
    </div>
  );
}
