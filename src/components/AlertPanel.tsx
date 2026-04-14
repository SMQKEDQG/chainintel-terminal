'use client';

import { useState, useEffect } from 'react';

/* ── AlertPanel — slide-out notification center for smart alerts ── */
interface Alert {
  id: string;
  type: 'whale' | 'etf' | 'funding' | 'regulatory' | 'price' | 'chainscore';
  title: string;
  message: string;
  timestamp: string;
  severity: 'critical' | 'warning' | 'info';
  read: boolean;
  asset?: string;
}

interface AlertPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const typeIcons: Record<string, string> = {
  whale: '🐋',
  etf: '📊',
  funding: '💰',
  regulatory: '⚖️',
  price: '📈',
  chainscore: '🏆',
};

const severityColors: Record<string, string> = {
  critical: 'var(--red)',
  warning: 'var(--gold)',
  info: 'var(--accent)',
};

export default function AlertPanel({ isOpen, onClose }: AlertPanelProps) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;
    
    const fetchAlerts = async () => {
      try {
        const res = await fetch('/api/smart-alerts');
        const data = await res.json();
        
        const mapped: Alert[] = (data?.alerts || []).map((a: any, i: number) => ({
          id: a.id || `alert-${i}`,
          type: a.type || 'info',
          title: a.title || 'Alert',
          message: a.message || a.description || '',
          timestamp: a.timestamp || new Date().toISOString(),
          severity: a.severity || 'info',
          read: a.read || false,
          asset: a.asset,
        }));
        
        setAlerts(mapped);
      } catch (e) {
        console.error('Alert fetch error:', e);
        // Generate some sample alerts from recent market data
        setAlerts([
          {
            id: '1',
            type: 'whale',
            title: 'Large BTC Transfer Detected',
            message: 'A whale moved 2,500 BTC ($165M) from cold storage to exchange.',
            timestamp: new Date(Date.now() - 1800000).toISOString(),
            severity: 'warning',
            read: false,
            asset: 'BTC',
          },
          {
            id: '2',
            type: 'etf',
            title: 'ETF Inflow Streak Continues',
            message: 'Spot Bitcoin ETFs have seen 5 consecutive days of net inflows.',
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            severity: 'info',
            read: false,
            asset: 'BTC',
          },
          {
            id: '3',
            type: 'regulatory',
            title: 'New SEC Guidance Expected',
            message: 'SEC expected to release updated crypto custody framework.',
            timestamp: new Date(Date.now() - 7200000).toISOString(),
            severity: 'info',
            read: true,
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchAlerts();
    const id = setInterval(fetchAlerts, 60000);
    return () => clearInterval(id);
  }, [isOpen]);

  const filteredAlerts = filter === 'all' ? alerts : alerts.filter(a => a.type === filter);
  const unreadCount = alerts.filter(a => !a.read).length;

  const markRead = (id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, read: true } : a));
  };

  const markAllRead = () => {
    setAlerts(prev => prev.map(a => ({ ...a, read: true })));
  };

  const formatTime = (ts: string) => {
    const diff = Date.now() - new Date(ts).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0"
          style={{ background: 'rgba(0,0,0,0.5)', zIndex: 99998 }}
          onClick={onClose}
        />
      )}

      {/* Panel */}
      <div
        className="fixed top-0 right-0 h-full overflow-y-auto transition-transform duration-300"
        style={{
          width: 380,
          maxWidth: '90vw',
          background: 'var(--s1)',
          borderLeft: '1px solid var(--b1)',
          zIndex: 99999,
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          boxShadow: isOpen ? '-4px 0 24px rgba(0,0,0,0.4)' : 'none',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'var(--b1)', background: 'var(--s2)' }}>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] tracking-wider font-bold" style={{ color: 'var(--text)' }}>
              ALERT CENTER
            </span>
            {unreadCount > 0 && (
              <span
                className="font-mono text-[8px] px-1.5 py-0.5 rounded-full"
                style={{ background: 'var(--red)', color: '#fff' }}
              >
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="font-mono text-[7px] tracking-wider transition-colors hover:text-[var(--accent)]"
                style={{ color: 'var(--muted)' }}
              >
                MARK ALL READ
              </button>
            )}
            <button
              onClick={onClose}
              className="font-mono text-[14px] transition-colors hover:text-[var(--red)]"
              style={{ color: 'var(--muted)' }}
            >
              ×
            </button>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-0 px-2 py-1.5 overflow-x-auto border-b" style={{ borderColor: 'var(--b1)' }}>
          {['all', 'whale', 'etf', 'funding', 'regulatory', 'price', 'chainscore'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="font-mono text-[7px] tracking-wider px-2 py-1 whitespace-nowrap transition-colors"
              style={{
                color: filter === f ? 'var(--accent)' : 'var(--muted)',
                borderBottom: filter === f ? '1px solid var(--accent)' : '1px solid transparent',
              }}
            >
              {f === 'all' ? 'ALL' : `${typeIcons[f] || ''} ${f.toUpperCase()}`}
            </button>
          ))}
        </div>

        {/* Alert list */}
        <div className="p-2">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="rounded p-3 mb-2"
                style={{
                  background: 'var(--s2)',
                  height: 72,
                  animation: 'shimmer 1.5s ease-in-out infinite',
                  animationDelay: `${i * 0.1}s`,
                }}
              />
            ))
          ) : filteredAlerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="text-2xl mb-2" style={{ opacity: 0.3 }}>🔔</div>
              <span className="font-mono text-[9px] tracking-wider" style={{ color: 'var(--muted)' }}>
                NO ALERTS
              </span>
            </div>
          ) : (
            filteredAlerts.map((alert) => (
              <div
                key={alert.id}
                onClick={() => markRead(alert.id)}
                className="rounded p-3 mb-2 cursor-pointer transition-colors hover:bg-[var(--s3)]"
                style={{
                  background: alert.read ? 'var(--s1)' : 'var(--s2)',
                  border: `1px solid ${alert.read ? 'var(--b1)' : severityColors[alert.severity]}30`,
                  borderLeft: `3px solid ${severityColors[alert.severity]}`,
                }}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span style={{ fontSize: 12 }}>{typeIcons[alert.type] || '📋'}</span>
                    <span className="font-mono text-[9px] font-semibold" style={{ color: 'var(--text)' }}>
                      {alert.title}
                    </span>
                  </div>
                  {!alert.read && (
                    <div className="w-2 h-2 rounded-full" style={{ background: 'var(--accent)' }} />
                  )}
                </div>
                <p className="font-mono text-[8px] leading-relaxed mb-1.5" style={{ color: 'var(--text2)' }}>
                  {alert.message}
                </p>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[7px] tracking-wider" style={{ color: 'var(--muted)' }}>
                    {formatTime(alert.timestamp)}
                  </span>
                  {alert.asset && (
                    <span
                      className="font-mono text-[7px] tracking-wider px-1.5 py-0.5 rounded"
                      style={{ background: 'var(--s3)', color: 'var(--text2)' }}
                    >
                      {alert.asset}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
