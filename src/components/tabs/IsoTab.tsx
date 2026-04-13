'use client';

export default function IsoTab() {
  const assets = [
    { sym: 'XRP', name: 'XRP Ledger', bank: 'Ripple · RippleNet', status: 'CERTIFIED', score: 94, banks: '300+', txSpeed: '3-5s', statusColor: 'var(--green)' },
    { sym: 'XLM', name: 'Stellar Network', bank: 'SDF · MoneyGram', status: 'CERTIFIED', score: 88, banks: '150+', txSpeed: '5s', statusColor: 'var(--green)' },
    { sym: 'HBAR', name: 'Hedera Hashgraph', bank: 'Hedera Council', status: 'CERTIFIED', score: 86, banks: '50+', txSpeed: '3-5s', statusColor: 'var(--green)' },
    { sym: 'QNT', name: 'Quant Network', bank: 'Overledger', status: 'CERTIFIED', score: 82, banks: '40+', txSpeed: 'Bridge', statusColor: 'var(--green)' },
    { sym: 'IOTA', name: 'IOTA Foundation', bank: 'Shimmer · Assembly', status: 'IN PROGRESS', score: 68, banks: '10+', txSpeed: '10s', statusColor: 'var(--gold)' },
    { sym: 'ADA', name: 'Cardano', bank: 'EMURGO · IOG', status: 'IN PROGRESS', score: 64, banks: '5+', txSpeed: '20s', statusColor: 'var(--gold)' },
    { sym: 'ALGO', name: 'Algorand', bank: 'Algorand Foundation', status: 'PARTIAL', score: 58, banks: '10+', txSpeed: '3.9s', statusColor: 'var(--gold)' },
    { sym: 'XDC', name: 'XDC Network', bank: 'XinFin · TradeFinex', status: 'PARTIAL', score: 54, banks: '10+', txSpeed: '2s', statusColor: 'var(--gold)' },
  ];

  const timeline = [
    { date: 'Nov 2022', event: 'SWIFT mandates ISO 20022 for cross-border payments' },
    { date: 'Mar 2023', event: 'Fed, ECB, BOE adopt ISO 20022 for RTGS systems' },
    { date: 'Nov 2025', event: 'Full SWIFT migration deadline (extended from Mar 2025)' },
    { date: 'Q1 2026', event: 'ISO 20022-native assets gain direct bank integration advantage' },
    { date: 'Q2 2026', event: 'Expected: first major bank deploys XRP for real-time settlement' },
  ];

  return (
    <div>
      <div className="ai-context-strip">
        <span className="acs-icon">◈ CI·AI</span>
        <span className="acs-body">ISO 20022 is the global banking messaging standard replacing SWIFT. Assets with native ISO 20022 compliance get direct integration into banking payment rails. <strong>This is the most underpriced structural catalyst in crypto — $150T+ flows annually through these systems.</strong></span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.12em', color: 'var(--text2)' }}>ISO 20022 BANKING INTEGRATION TRACKER</span>
        <div style={{ flex: 1, height: 1, background: 'var(--b2)' }} />
        <span className="tag" style={{ background: 'rgba(59,130,246,0.1)', color: 'var(--blue)' }}>PRO · 8 Assets</span>
      </div>

      <div className="g4">
        <div className="kpi"><div className="kpi-label">SWIFT Annual Volume</div><div className="kpi-val gold">$150T+</div><div className="kpi-chg">Total addressable market</div></div>
        <div className="kpi"><div className="kpi-label">ISO 20022 Certified Assets</div><div className="kpi-val cyan">4</div><div className="kpi-chg">XRP, XLM, HBAR, QNT</div></div>
        <div className="kpi"><div className="kpi-label">In Progress</div><div className="kpi-val" style={{ color: 'var(--gold)' }}>4</div><div className="kpi-chg">IOTA, ADA, ALGO, XDC</div></div>
        <div className="kpi"><div className="kpi-label">Migration Status</div><div className="kpi-val" style={{ color: 'var(--green)' }}>ACTIVE</div><div className="kpi-chg">Full SWIFT migration live</div></div>
      </div>

      <div className="panel">
        <div className="ph"><div className="pt">ISO 20022 Compliance Matrix</div></div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--mono)', fontSize: 11 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--b2)' }}>
              <th style={{ textAlign: 'left', padding: '6px 8px', color: 'var(--muted)', fontSize: 8 }}>ASSET</th>
              <th style={{ textAlign: 'left', padding: '6px 8px', color: 'var(--muted)', fontSize: 8 }}>NETWORK</th>
              <th style={{ textAlign: 'left', padding: '6px 8px', color: 'var(--muted)', fontSize: 8 }}>BANKING PARTNER</th>
              <th style={{ textAlign: 'center', padding: '6px 8px', color: 'var(--muted)', fontSize: 8 }}>STATUS</th>
              <th style={{ textAlign: 'right', padding: '6px 8px', color: 'var(--muted)', fontSize: 8 }}>BANKS</th>
              <th style={{ textAlign: 'right', padding: '6px 8px', color: 'var(--muted)', fontSize: 8 }}>TX SPEED</th>
              <th style={{ textAlign: 'right', padding: '6px 8px', color: 'var(--muted)', fontSize: 8 }}>SCORE</th>
              <th style={{ padding: '6px 8px', width: 80 }}></th>
            </tr>
          </thead>
          <tbody>
            {assets.map(a => (
              <tr key={a.sym} style={{ borderBottom: '1px solid var(--b1)' }}>
                <td style={{ padding: '5px 8px', fontWeight: 600, color: 'var(--text)' }}>{a.sym}</td>
                <td style={{ padding: '5px 8px', color: 'var(--text2)', fontSize: 10 }}>{a.name}</td>
                <td style={{ padding: '5px 8px', color: 'var(--text2)', fontSize: 9 }}>{a.bank}</td>
                <td style={{ textAlign: 'center', padding: '5px 8px' }}>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 8, padding: '2px 6px', border: `1px solid ${a.statusColor}`, color: a.statusColor, letterSpacing: '0.06em' }}>{a.status}</span>
                </td>
                <td style={{ textAlign: 'right', padding: '5px 8px', color: 'var(--text2)' }}>{a.banks}</td>
                <td style={{ textAlign: 'right', padding: '5px 8px', color: 'var(--cyan)' }}>{a.txSpeed}</td>
                <td style={{ textAlign: 'right', padding: '5px 8px', fontWeight: 700, color: 'var(--cyan)' }}>{a.score}</td>
                <td style={{ padding: '5px 8px' }}>
                  <div style={{ height: 5, background: 'var(--b3)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: `${a.score}%`, height: '100%', background: 'linear-gradient(90deg, var(--cyan), var(--blue))', borderRadius: 3 }} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="panel" style={{ marginTop: 8 }}>
        <div className="ph"><div className="pt">SWIFT → ISO 20022 Migration Timeline</div></div>
        <div style={{ padding: '0 12px 12px' }}>
          {timeline.map((t, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, padding: '6px 0', borderBottom: '1px solid var(--b1)' }}>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--cyan)', width: 80, flexShrink: 0 }}>{t.date}</span>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text2)' }}>{t.event}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: 'var(--s1)', border: '1px solid var(--b1)', padding: '10px 14px', marginTop: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--cyan)', animation: 'pulse 2s infinite' }} />
          <span style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--cyan)' }}>ISO 20022 AI Synthesis</span>
        </div>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text2)', lineHeight: 1.6 }}>
          <strong style={{ color: 'var(--text)' }}>ISO 20022 compliance is the quiet structural advantage Bloomberg doesn&apos;t track.</strong> XRP leads with 300+ bank partnerships and certified status. The SWIFT migration is complete — ISO 20022-native assets now have direct interoperability with $150T+ in annual payment flows. <strong style={{ color: 'var(--text)' }}>This module exists nowhere else in crypto intelligence.</strong>
        </div>
      </div>
    </div>
  );
}
