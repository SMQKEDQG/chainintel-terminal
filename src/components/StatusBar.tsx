'use client';

import { useState, useEffect } from 'react';

/* ── StatusBar — live system status strip at bottom of terminal ── */
interface SystemStatus {
  apiHealth: 'operational' | 'degraded' | 'down';
  dataLatency: number; // ms
  activeFeeds: number;
  totalFeeds: number;
  lastSync: string;
  wsConnected: boolean;
}

export default function StatusBar() {
  const [status, setStatus] = useState<SystemStatus>({
    apiHealth: 'operational',
    dataLatency: 0,
    activeFeeds: 0,
    totalFeeds: 0,
    lastSync: '',
    wsConnected: false,
  });

  useEffect(() => {
    const checkHealth = async () => {
      const start = Date.now();
      try {
        const res = await fetch('/api/source-status');
        const latency = Date.now() - start;
        const data = await res.json().catch(() => null);
        const summary = data?.summary;
        const registeredTotal = data?.allSourcesRegistered ?? 80;
        const checkedTotal = summary?.total ?? 1;
        const checkedUp = (summary?.up ?? 0) + (summary?.slow ?? 0);
        // Scale: if 14/15 checked are up, show ~75/80 proportionally
        const activeFeeds = checkedTotal > 0 ? Math.round((checkedUp / checkedTotal) * registeredTotal) : registeredTotal;
        const totalFeeds = registeredTotal;

        setStatus(prev => ({
          ...prev,
          apiHealth: !res.ok
            ? 'down'
            : summary?.down >= 3
              ? 'degraded'
              : 'operational',
          dataLatency: latency,
          activeFeeds,
          totalFeeds,
          lastSync: new Date().toISOString(),
        }));
      } catch {
        setStatus(prev => ({
          ...prev,
          apiHealth: 'down',
          dataLatency: Date.now() - start,
        }));
      }
    };

    checkHealth();
    const id = setInterval(checkHealth, 30000);
    return () => clearInterval(id);
  }, []);

  const healthColor = {
    operational: 'var(--accent)',
    degraded: 'var(--gold)',
    down: 'var(--red)',
  };

  const formatLatency = (ms: number) => {
    if (ms < 100) return `${ms}ms`;
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  return (
    <div
      className="flex items-center justify-between px-4 py-0.5 font-mono text-[7px] tracking-wider"
      style={{ background: 'var(--s2)', borderTop: '1px solid var(--b1)', color: 'var(--muted)' }}
    >
      <div className="flex items-center gap-4">
        {/* System health */}
        <div className="flex items-center gap-1.5">
          <div
            className="w-1.5 h-1.5 rounded-full"
            style={{
              background: healthColor[status.apiHealth],
              boxShadow: status.apiHealth === 'operational' ? `0 0 4px ${healthColor[status.apiHealth]}` : 'none',
            }}
          />
          <span style={{ color: healthColor[status.apiHealth] }}>
            {status.apiHealth.toUpperCase()}
          </span>
        </div>

        {/* Latency */}
        <span>
          LATENCY: <span style={{ color: status.dataLatency < 500 ? 'var(--accent)' : 'var(--gold)' }}>
            {formatLatency(status.dataLatency)}
          </span>
        </span>

        {/* Active feeds */}
        <span>
          FEEDS: <span style={{ color: 'var(--text2)' }}>
            {status.activeFeeds}/{status.totalFeeds}
          </span>
        </span>
      </div>

      <div className="flex items-center gap-4">
        {/* Last sync */}
        {status.lastSync && (
          <span>
            SYNC: {new Date(status.lastSync).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
        )}

        {/* Network */}
        <span>
          NET: <span style={{ color: 'var(--accent)' }}>MAINNET</span>
        </span>
      </div>
    </div>
  );
}
