'use client';

import { useState, useEffect, useCallback } from 'react';

/* ── InsightDrawer — click any hoverable element for AI-driven insight ── */

interface InsightDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  context: {
    type: 'asset' | 'etf' | 'chainscore' | 'whale' | 'kpi' | 'general';
    title: string;
    subtitle?: string;
    data?: Record<string, any>;
  } | null;
}

export default function InsightDrawer({ isOpen, onClose, context }: InsightDrawerProps) {
  const [insight, setInsight] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchInsight = useCallback(async () => {
    if (!context) return;
    setLoading(true);
    setInsight('');

    // Build a contextual query for Ask CI
    let query = '';
    switch (context.type) {
      case 'asset':
        query = `${context.title} detailed analysis including price action, market position, and outlook`;
        break;
      case 'etf':
        query = `${context.title} ETF flow analysis — what does ${context.data?.flow || 'this flow'} signal for institutional positioning?`;
        break;
      case 'chainscore':
        query = `${context.title} with ChainScore ${context.data?.score || ''}/100 — what does this rating mean for investors?`;
        break;
      case 'whale':
        query = `Whale ${context.data?.direction || 'movement'} of ${context.data?.amount || ''} in ${context.title} — what does this signal?`;
        break;
      case 'kpi':
        query = `${context.title} is at ${context.subtitle || ''} — what does this mean for the market?`;
        break;
      default:
        query = `${context.title} analysis`;
    }

    try {
      const res = await fetch('/api/ask-ci', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });
      const data = await res.json();
      setInsight(data.answer || 'Analysis unavailable.');
    } catch {
      setInsight('Unable to generate insight. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [context]);

  useEffect(() => {
    if (isOpen && context) {
      fetchInsight();
    } else {
      setInsight('');
    }
  }, [isOpen, context, fetchInsight]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen || !context) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          zIndex: 90000, transition: 'opacity 0.2s',
        }}
      />

      {/* Drawer panel */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0,
        width: 440, maxWidth: '90vw',
        background: 'var(--s1)', borderLeft: '1px solid var(--b2)',
        zIndex: 90001, display: 'flex', flexDirection: 'column',
        boxShadow: '-8px 0 32px rgba(0,0,0,0.4)',
        animation: 'slideInRight 0.2s ease-out',
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 20px', borderBottom: '1px solid var(--b2)',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.14em', color: 'var(--accent)', marginBottom: 4 }}>
              ◈ CI·AI INSIGHT
            </div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>
              {context.title}
            </div>
            {context.subtitle && (
              <div style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
                {context.subtitle}
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            style={{
              fontFamily: 'var(--mono)', fontSize: 18, color: 'var(--muted)',
              background: 'none', border: 'none', cursor: 'pointer', padding: '0 4px',
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        {/* Data summary */}
        {context.data && Object.keys(context.data).length > 0 && (
          <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--b1)', background: 'var(--s2)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
              {Object.entries(context.data).slice(0, 6).map(([key, val]) => (
                <div key={key}>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.1em', color: 'var(--muted)', textTransform: 'uppercase' }}>
                    {key.replace(/_/g, ' ')}
                  </div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>
                    {String(val)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI Insight */}
        <div style={{ flex: 1, padding: '16px 20px', overflow: 'auto' }}>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40, gap: 12 }}>
              <div style={{
                width: 32, height: 32, border: '2px solid var(--b3)',
                borderTopColor: 'var(--accent)', borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
              }} />
              <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--accent)', letterSpacing: '0.1em' }}>
                CI·AI ANALYZING...
              </span>
            </div>
          ) : insight ? (
            <div
              style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--text2)', lineHeight: 1.8 }}
              dangerouslySetInnerHTML={{
                __html: insight.replace(/\*\*(.*?)\*\*/g, '<strong style="color:var(--text)">$1</strong>'),
              }}
            />
          ) : null}
        </div>

        {/* Footer */}
        <div style={{
          padding: '10px 20px', borderTop: '1px solid var(--b2)',
          fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--muted)',
          letterSpacing: '0.06em', display: 'flex', justifyContent: 'space-between',
        }}>
          <span>● LIVE DATA · CHAININTEL AI</span>
          <span>ESC TO CLOSE</span>
        </div>
      </div>

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}

/* ── Hook: useInsightDrawer ── */
export function useInsightDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const [context, setContext] = useState<InsightDrawerProps['context']>(null);

  const openInsight = useCallback((ctx: NonNullable<InsightDrawerProps['context']>) => {
    setContext(ctx);
    setIsOpen(true);
  }, []);

  const closeInsight = useCallback(() => {
    setIsOpen(false);
  }, []);

  return { isOpen, context, openInsight, closeInsight };
}
