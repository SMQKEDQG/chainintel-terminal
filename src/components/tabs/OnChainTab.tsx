'use client';

export default function OnChainTab() {
  const metrics = [
    { label: 'MVRV Ratio · BTC', value: '1.84', sub: 'Market Value to Realized Value — neutral zone (1.0–2.4 = fair value)', src: 'Glassnode', srcUrl: 'https://glassnode.com', delta: '▲ Accumulation', deltaColor: 'var(--gold)', color: 'var(--gold)' },
    { label: 'Exchange Reserves · BTC', value: '−42,800', sub: '30-day net outflow — coins leaving exchanges to cold storage (accumulation)', src: 'CryptoQuant', srcUrl: 'https://cryptoquant.com', delta: '▲ Bullish', deltaColor: 'var(--green)', color: 'var(--red)' },
    { label: 'Long-Term Holders', value: '74.8%', sub: '% of total BTC held 155+ days without moving — multi-year high', src: 'Glassnode', srcUrl: 'https://glassnode.com', delta: '▲ Strong', deltaColor: 'var(--green)', color: 'var(--green)' },
    { label: 'Hash Rate · BTC', value: '814 EH/s', sub: '7-day avg — near all-time high zone · miner confidence high', src: 'Cambridge CBECI', srcUrl: '', delta: 'ATH Zone', deltaColor: 'var(--cyan)', color: 'var(--cyan)' },
    { label: 'NVT Ratio · BTC', value: '68.4', sub: 'Network Value / Transaction Vol — fair value zone (like P/E ratio for crypto)', src: 'Glassnode', srcUrl: 'https://glassnode.com', delta: 'Fair Value', deltaColor: 'var(--gold)', color: 'var(--gold)' },
    { label: 'ETH Gas Price', value: '23 Gwei', sub: 'Current base fee — low activity environment · DeFi quiet', src: 'Etherscan', srcUrl: 'https://etherscan.io/gastracker', delta: '▼ Low', deltaColor: 'var(--green)', color: 'var(--cyan)' },
    { label: 'Active Addresses · BTC', value: '842,400', sub: 'Daily unique active addresses (7d avg)', src: 'Coin Metrics', srcUrl: '', color: 'var(--text)' },
    { label: 'Realized Cap · BTC', value: '$942B', sub: 'Sum of all UTXOs at price when last moved', src: 'Glassnode', srcUrl: 'https://glassnode.com', color: 'var(--text)' },
    { label: 'Stablecoin Supply Ratio', value: '0.042', sub: 'Stablecoin supply / BTC market cap — dry powder index', src: 'CryptoQuant', srcUrl: 'https://cryptoquant.com', delta: 'Elevated', deltaColor: 'var(--gold)', color: 'var(--green)' },
  ];

  const matrix = [
    { asset: 'BTC', mvrv: '1.84', exchFlow: '−42.8K', lth: '74.8%', nvt: '68.4', hash: '814', score: 92 },
    { asset: 'ETH', mvrv: '1.42', exchFlow: '−18.2K', lth: '68.2%', nvt: '42.1', hash: '—', score: 87 },
    { asset: 'XRP', mvrv: '1.68', exchFlow: '−8.4K', lth: '71.2%', nvt: '58.9', hash: '—', score: 79 },
    { asset: 'SOL', mvrv: '2.14', exchFlow: '+2.1K', lth: '62.4%', nvt: '38.2', hash: '—', score: 68 },
    { asset: 'HBAR', mvrv: '1.21', exchFlow: '−1.8K', lth: '78.4%', nvt: '44.8', hash: '—', score: 74 },
    { asset: 'QNT', mvrv: '0.94', exchFlow: '−0.4K', lth: '82.1%', nvt: '92.4', hash: '—', score: 71 },
    { asset: 'ADA', mvrv: '1.12', exchFlow: '−3.2K', lth: '74.1%', nvt: '52.1', hash: '—', score: 62 },
    { asset: 'XLM', mvrv: '1.08', exchFlow: '−0.8K', lth: '76.8%', nvt: '61.2', hash: '—', score: 64 },
    { asset: 'AVAX', mvrv: '1.62', exchFlow: '+0.6K', lth: '58.4%', nvt: '34.8', hash: '—', score: 58 },
    { asset: 'LINK', mvrv: '1.54', exchFlow: '−2.4K', lth: '66.8%', nvt: '48.2', hash: '—', score: 65 },
    { asset: 'DOT', mvrv: '0.88', exchFlow: '−1.2K', lth: '72.4%', nvt: '72.8', hash: '—', score: 56 },
    { asset: 'ALGO', mvrv: '0.76', exchFlow: '−0.2K', lth: '80.2%', nvt: '88.4', hash: '—', score: 52 },
  ];

  return (
    <div>
      <div className="ai-context-strip">
        <span className="acs-icon">◈ CI·AI</span>
        <span className="acs-body">BTC MVRV 1.84 is in neutral-to-undervalued territory (fair value: 1.0–2.4). Exchange reserves down 42,800 BTC this month — structural accumulation, not distribution. <strong>On-chain picture: constructively bullish.</strong></span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.12em', color: 'var(--text2)' }}>BITCOIN ON-CHAIN INTELLIGENCE</span>
        <div style={{ flex: 1, height: 1, background: 'var(--b2)' }} />
        <span className="tag" style={{ background: 'rgba(59,130,246,0.1)', color: 'var(--blue)' }}>PRO</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 12 }}>
        {metrics.map(m => (
          <div key={m.label} style={{ background: 'var(--s1)', border: '1px solid var(--b1)', padding: '10px 12px' }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 2 }}>{m.label}</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 15, fontWeight: 600, color: m.color }}>{m.value}</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--text2)', marginTop: 2 }}>{m.sub}</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 7, color: 'var(--muted)' }}>
                {m.srcUrl ? <a className="src-link" href={m.srcUrl} target="_blank" rel="noopener noreferrer">{m.src}</a> : m.src}
              </span>
              {m.delta && <span style={{ fontFamily: 'var(--mono)', fontSize: 8, color: m.deltaColor, fontWeight: 600 }}>{m.delta}</span>}
            </div>
          </div>
        ))}
      </div>

      <div className="panel">
        <div className="ph">
          <div className="pt">On-Chain Intelligence Matrix · 12 Assets</div>
          <div className="tag" style={{ background: 'rgba(59,130,246,0.1)', color: 'var(--blue)' }}>
            <a className="src-link" href="https://glassnode.com" target="_blank" rel="noopener noreferrer">Glassnode</a> · <a className="src-link" href="https://cryptoquant.com" target="_blank" rel="noopener noreferrer">CryptoQuant</a>
          </div>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--mono)', fontSize: 11 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--b2)' }}>
              <th style={{ textAlign: 'left', padding: '6px 8px', color: 'var(--muted)', fontSize: 8, letterSpacing: '0.1em' }}>Asset</th>
              <th style={{ textAlign: 'right', padding: '6px 8px', color: 'var(--muted)', fontSize: 8 }}>MVRV</th>
              <th style={{ textAlign: 'right', padding: '6px 8px', color: 'var(--muted)', fontSize: 8 }}>Exch Flow</th>
              <th style={{ textAlign: 'right', padding: '6px 8px', color: 'var(--muted)', fontSize: 8 }}>LTH %</th>
              <th style={{ textAlign: 'right', padding: '6px 8px', color: 'var(--muted)', fontSize: 8 }}>NVT</th>
              <th style={{ textAlign: 'right', padding: '6px 8px', color: 'var(--muted)', fontSize: 8 }}>Hash TH/s</th>
              <th style={{ textAlign: 'right', padding: '6px 8px', color: 'var(--muted)', fontSize: 8 }}>OC Score</th>
              <th style={{ padding: '6px 8px', width: 100 }}>Score Bar</th>
            </tr>
          </thead>
          <tbody>
            {matrix.map(m => (
              <tr key={m.asset} style={{ borderBottom: '1px solid var(--b1)' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,212,170,0.04)')}
                  onMouseLeave={e => (e.currentTarget.style.background = '')}>
                <td style={{ padding: '5px 8px', fontWeight: 600, color: 'var(--text)' }}>{m.asset}</td>
                <td style={{ textAlign: 'right', padding: '5px 8px', color: 'var(--gold)' }}>{m.mvrv}</td>
                <td style={{ textAlign: 'right', padding: '5px 8px', color: m.exchFlow.startsWith('−') ? 'var(--green)' : 'var(--red)' }}>{m.exchFlow}</td>
                <td style={{ textAlign: 'right', padding: '5px 8px', color: 'var(--text2)' }}>{m.lth}</td>
                <td style={{ textAlign: 'right', padding: '5px 8px', color: 'var(--text2)' }}>{m.nvt}</td>
                <td style={{ textAlign: 'right', padding: '5px 8px', color: m.hash === '—' ? 'var(--muted)' : 'var(--cyan)' }}>{m.hash}</td>
                <td style={{ textAlign: 'right', padding: '5px 8px', fontWeight: 700, color: 'var(--cyan)' }}>{m.score}</td>
                <td style={{ padding: '5px 8px' }}>
                  <div style={{ height: 6, background: 'var(--b3)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: `${m.score}%`, height: '100%', background: 'linear-gradient(90deg, var(--cyan), var(--blue))', borderRadius: 3 }} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ background: 'var(--s1)', border: '1px solid var(--b1)', padding: '10px 14px', marginTop: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--cyan)', animation: 'pulse 2s infinite' }} />
          <span style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--cyan)', letterSpacing: '0.08em' }}>On-Chain AI Synthesis · <a className="src-link" href="https://glassnode.com" target="_blank" rel="noopener noreferrer">Glassnode</a> · <a className="src-link" href="https://cryptoquant.com" target="_blank" rel="noopener noreferrer">CryptoQuant</a></span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5, fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text2)', lineHeight: 1.5 }}>
          <div style={{ display: 'flex', gap: 8 }}><span style={{ color: 'var(--cyan)', flexShrink: 0 }}>▸</span><span><strong style={{ color: 'var(--text)' }}>BTC MVRV 1.84</strong> — neutral-to-undervalued territory. No top signal. Fair value zone intact.</span></div>
          <div style={{ display: 'flex', gap: 8 }}><span style={{ color: 'var(--cyan)', flexShrink: 0 }}>▸</span><span><strong style={{ color: 'var(--text)' }}>Exchange outflows −42,800 BTC</strong> in 30d — coins moving to cold storage, not selling. LTH supply 74.8% (multi-year high).</span></div>
          <div style={{ display: 'flex', gap: 8 }}><span style={{ color: 'var(--green)', flexShrink: 0 }}>▸</span><span><strong style={{ color: 'var(--text)' }}>On-chain picture: constructively bullish</strong> — capitulation is in sentiment, not in coin behavior.</span></div>
        </div>
      </div>
    </div>
  );
}
