'use client';

import { useState, useEffect } from 'react';

/* ── DataFreshness indicator — shows live/stale status with timestamp ── */
interface DataFreshnessProps {
  lastUpdated: string | Date | null;
  source?: string;
  isLive?: boolean;
}

export function DataFreshness({ lastUpdated, source, isLive }: DataFreshnessProps) {
  const [relativeTime, setRelativeTime] = useState('');

  useEffect(() => {
    const update = () => {
      if (!lastUpdated) { setRelativeTime('—'); return; }
      const ts = lastUpdated instanceof Date ? lastUpdated.getTime() : new Date(lastUpdated).getTime();
      const diff = Date.now() - ts;
      const secs = Math.floor(diff / 1000);
      if (secs < 60) setRelativeTime(`${secs}s ago`);
      else if (secs < 3600) setRelativeTime(`${Math.floor(secs / 60)}m ago`);
      else setRelativeTime(`${Math.floor(secs / 3600)}h ago`);
    };
    update();
    const id = setInterval(update, 10000);
    return () => clearInterval(id);
  }, [lastUpdated]);

  return (
    <div className="flex items-center gap-2 font-mono text-[8px] tracking-wider" style={{ color: 'var(--muted)' }}>
      <div
        className="w-1.5 h-1.5 rounded-full"
        style={{
          background: isLive ? 'var(--accent)' : 'var(--gold)',
          boxShadow: isLive ? '0 0 6px var(--accent)' : 'none',
          animation: isLive ? 'pulse 2s ease-in-out infinite' : 'none',
        }}
      />
      <span>{isLive ? 'LIVE' : 'CACHED'}</span>
      {relativeTime && <span style={{ color: 'var(--text2)' }}>{relativeTime}</span>}
      {source && <span style={{ opacity: 0.5 }}>· {source}</span>}
    </div>
  );
}

/* ── Skeleton loaders — used while fetching data ── */
export function SkeletonGrid({ cols = 4, rows = 2 }: { cols?: number; rows?: number }) {
  return (
    <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
      {Array.from({ length: cols * rows }).map((_, i) => (
        <div
          key={i}
          className="rounded"
          style={{
            background: 'var(--s2)',
            height: 80,
            animation: 'shimmer 1.5s ease-in-out infinite',
            animationDelay: `${i * 0.08}s`,
          }}
        />
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 6 }: { rows?: number; cols?: number }) {
  return (
    <div className="overflow-hidden rounded" style={{ border: '1px solid var(--b1)' }}>
      {/* Header */}
      <div className="grid gap-0 px-3 py-2" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)`, background: 'var(--s2)' }}>
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="rounded" style={{ background: 'var(--s3)', height: 10, width: '70%', opacity: 0.5 }} />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, r) => (
        <div
          key={r}
          className="grid gap-0 px-3 py-2.5"
          style={{
            gridTemplateColumns: `repeat(${cols}, 1fr)`,
            borderTop: '1px solid var(--b1)',
            animation: 'shimmer 1.5s ease-in-out infinite',
            animationDelay: `${r * 0.1}s`,
          }}
        >
          {Array.from({ length: cols }).map((_, c) => (
            <div key={c} className="rounded" style={{ background: 'var(--s3)', height: 8, width: c === 0 ? '90%' : '60%' }} />
          ))}
        </div>
      ))}
    </div>
  );
}

/* ── Error state — graceful fallback when API fails ── */
interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ message = 'Failed to fetch data', onRetry }: ErrorStateProps) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-3 py-12 rounded"
      style={{ background: 'var(--s1)', border: '1px solid var(--b1)' }}
    >
      <div className="font-mono text-2xl" style={{ color: 'var(--red)', opacity: 0.5 }}>⚠</div>
      <div className="font-mono text-[10px] tracking-wider" style={{ color: 'var(--muted)' }}>
        {message.toUpperCase()}
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="font-mono text-[8px] tracking-wider px-3 py-1.5 border transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
          style={{ color: 'var(--muted)', borderColor: 'var(--b3)', background: 'transparent' }}
        >
          RETRY
        </button>
      )}
    </div>
  );
}
