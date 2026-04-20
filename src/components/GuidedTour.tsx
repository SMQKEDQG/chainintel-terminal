'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

/* ── GuidedTour — smooth, friendly product walkthrough (3 steps) ── */
interface TourStep {
  target: string;
  title: string;
  description: string;
  emoji: string;
  position: 'top' | 'bottom';
  tabSwitch?: string;
}

interface GuidedTourProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchTab?: (tabId: string) => void;
}

const TOUR_STEPS: TourStep[] = [
  {
    target: 'ask-ci',
    title: 'Ask CI — Your AI Analyst',
    emoji: '🧠',
    description:
      'Ask any crypto question. Try "Is now a good time to buy BTC?" — CI synthesizes data from 15+ live sources instantly.',
    position: 'bottom',
    tabSwitch: 'mktovr',
  },
  {
    target: 'daily-brief',
    title: 'Daily Intelligence Brief',
    emoji: '📊',
    description:
      'Your daily market digest — updated every 3 minutes with live prices, sentiment, DeFi, and network health all in one card.',
    position: 'bottom',
    tabSwitch: 'mktovr',
  },
  {
    target: 'tab-nav',
    title: 'Intelligence Modules',
    emoji: '⚡',
    description:
      '11 specialized modules. Start with Overview, explore Markets, then unlock Pro for deeper on-chain, DeFi, and derivatives analysis.',
    position: 'bottom',
  },
];

const TOUR_DISMISSED_KEY = 'chainintel_tour_done';
const IDLE_TIMEOUT_MS = 90_000;

/* ── helpers ── */
function wasTourDismissed(): boolean {
  try { return sessionStorage.getItem(TOUR_DISMISSED_KEY) === '1'; } catch { return false; }
}
function markTourDismissed(): void {
  try { sessionStorage.setItem(TOUR_DISMISSED_KEY, '1'); } catch {}
}

/** Measure a data-tour target, clamping oversized elements to a reasonable highlight */
function measureTarget(target: string): DOMRect | null {
  const el = document.querySelector(`[data-tour="${target}"]`);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  if (r.width <= 0 || r.height <= 0) return null;
  // If element is taller than 50% viewport, show just the top portion
  const vh = window.innerHeight;
  if (r.height > vh * 0.5) {
    const visTop = Math.max(0, r.top);
    return new DOMRect(r.left, visTop, Math.min(r.width, window.innerWidth), Math.min(200, vh * 0.25));
  }
  return r;
}

/** Compute tooltip position clamped within viewport */
function computePosition(
  highlight: DOMRect | null,
  position: 'top' | 'bottom',
): { top?: number; bottom?: number; left: number; centered: boolean } {
  if (!highlight) return { left: 0, centered: true };
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const tooltipW = 370;
  const tooltipH = 240;
  const pad = 16;
  const left = Math.max(16, Math.min(highlight.left, vw - tooltipW - 16));

  if (position === 'bottom') {
    const top = highlight.bottom + pad;
    if (top + tooltipH > vh - 16) {
      // Flip to above
      return { bottom: Math.max(16, vh - highlight.top + pad), left, centered: false };
    }
    return { top: Math.max(16, Math.min(top, vh - tooltipH - 16)), left, centered: false };
  }
  // top
  const bottom = vh - highlight.top + pad;
  return { bottom: Math.max(16, bottom), left, centered: false };
}


/* ═══════════════════════════════════════════════
   GuidedTour component
   ═══════════════════════════════════════════════ */
export default function GuidedTour({ isOpen, onClose, onSwitchTab }: GuidedTourProps) {
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [visible, setVisible] = useState(false); // controls fade-in
  const [transitioning, setTransitioning] = useState(false); // locks during step change

  // Refs to avoid stale closures & dependency churn
  const onSwitchTabRef = useRef(onSwitchTab);
  onSwitchTabRef.current = onSwitchTab;
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const closedRef = useRef(false);
  const mountedStepRef = useRef(-1); // tracks which step has been set up

  const currentStep = TOUR_STEPS[step];

  /* ── Initial mount: locate target for current step (runs ONCE per step) ── */
  useEffect(() => {
    if (!isOpen) {
      setStep(0);
      setRect(null);
      setVisible(false);
      setTransitioning(false);
      closedRef.current = false;
      mountedStepRef.current = -1;
      return;
    }

    // Guard: only run setup once per step value
    if (mountedStepRef.current === step) return;
    mountedStepRef.current = step;

    const stepDef = TOUR_STEPS[step];
    if (!stepDef) return;

    // Switch tab if needed
    if (stepDef.tabSwitch && onSwitchTabRef.current) {
      onSwitchTabRef.current(stepDef.tabSwitch);
    }

    // Wait for DOM to settle, then measure and show
    let cancelled = false;
    const timer = setTimeout(() => {
      if (cancelled) return;

      // Poll until target is found (max 3s)
      let attempts = 0;
      const poll = () => {
        if (cancelled) return;
        const r = measureTarget(stepDef.target);
        if (r) {
          setRect(r);
          // Small stagger before showing tooltip
          setTimeout(() => {
            if (!cancelled) {
              setVisible(true);
              setTransitioning(false);
            }
          }, 120);
        } else if (attempts < 30) {
          attempts++;
          requestAnimationFrame(poll);
        } else {
          // Target not found — show centered anyway
          setRect(null);
          setVisible(true);
          setTransitioning(false);
        }
      };
      poll();
    }, 250);

    return () => { cancelled = true; clearTimeout(timer); };
    // Only depend on isOpen and step — nothing else
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, step]);

  /* ── Re-measure on scroll/resize only ── */
  useEffect(() => {
    if (!isOpen || !visible) return;
    const target = TOUR_STEPS[step]?.target;
    if (!target) return;

    let ticking = false;
    const sync = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const r = measureTarget(target);
        if (r) setRect(r);
        ticking = false;
      });
    };

    window.addEventListener('scroll', sync, true);
    window.addEventListener('resize', sync);
    return () => {
      window.removeEventListener('scroll', sync, true);
      window.removeEventListener('resize', sync);
    };
  }, [isOpen, visible, step]);

  /* ── Escape key ── */
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') doClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  /* ── Close ── */
  const doClose = useCallback(() => {
    if (closedRef.current) return;
    closedRef.current = true;
    markTourDismissed();
    onSwitchTabRef.current?.('mktovr');
    setVisible(false);
    setTimeout(() => {
      setStep(0);
      setRect(null);
      onCloseRef.current();
    }, 250);
  }, []);

  /* ── Step navigation ── */
  const goNext = useCallback(() => {
    if (transitioning) return;
    if (step >= TOUR_STEPS.length - 1) { doClose(); return; }
    setTransitioning(true);
    setVisible(false);
    setTimeout(() => {
      setRect(null);
      setStep(s => s + 1);
    }, 200);
  }, [step, transitioning, doClose]);

  const goPrev = useCallback(() => {
    if (transitioning || step <= 0) return;
    setTransitioning(true);
    setVisible(false);
    setTimeout(() => {
      setRect(null);
      setStep(s => s - 1);
    }, 200);
  }, [step, transitioning]);

  /* ── Don't render when closed ── */
  if (!isOpen) return null;

  /* ── Position calculation ── */
  const pos = computePosition(rect, currentStep?.position ?? 'bottom');

  const tooltipStyle: React.CSSProperties = {
    position: 'fixed',
    zIndex: 100002,
    background: '#161616',
    border: '1px solid rgba(232,165,52,0.4)',
    borderRadius: 12,
    padding: '22px 24px 20px',
    width: 370,
    maxWidth: 'calc(100vw - 32px)',
    boxShadow: '0 20px 60px rgba(0,0,0,0.6), 0 0 1px rgba(232,165,52,0.3), inset 0 1px 0 rgba(255,255,255,0.04)',
    opacity: visible ? 1 : 0,
    transform: visible ? 'translateY(0) scale(1)' : 'translateY(6px) scale(0.98)',
    transition: 'opacity 0.3s ease, transform 0.3s ease',
    pointerEvents: visible ? 'auto' as const : 'none' as const,
  };

  if (pos.centered) {
    tooltipStyle.top = '50%';
    tooltipStyle.left = '50%';
    tooltipStyle.transform = visible ? 'translate(-50%, -50%) scale(1)' : 'translate(-50%, -48%) scale(0.98)';
  } else {
    if (pos.top !== undefined) tooltipStyle.top = pos.top;
    if (pos.bottom !== undefined) tooltipStyle.bottom = pos.bottom;
    tooltipStyle.left = pos.left;
  }

  return (
    <>
      {/* Overlay — visible dim, not invisible on dark bg */}
      <div
        className="fixed inset-0"
        style={{
          background: 'rgba(0, 0, 0, 0.6)',
          zIndex: 100000,
          opacity: visible ? 1 : 0,
          transition: 'opacity 0.3s ease',
        }}
        onClick={doClose}
      />

      {/* Spotlight cutout */}
      {rect && (
        <div
          className="fixed"
          style={{
            top: rect.top - 6,
            left: rect.left - 6,
            width: rect.width + 12,
            height: rect.height + 12,
            borderRadius: 8,
            border: '1.5px solid rgba(232,165,52,0.5)',
            zIndex: 100001,
            boxShadow: '0 0 0 9999px rgba(0,0,0,0.55), 0 0 30px rgba(232,165,52,0.12)',
            pointerEvents: 'none',
            opacity: visible ? 1 : 0,
            transition: 'opacity 0.3s ease',
          }}
        />
      )}

      {/* Tooltip card */}
      <div style={tooltipStyle} onClick={e => e.stopPropagation()}>
        {/* Progress bar + close */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            {TOUR_STEPS.map((_, i) => (
              <div
                key={i}
                style={{
                  width: i === step ? 20 : 8,
                  height: 4,
                  borderRadius: 2,
                  background: i === step ? 'var(--accent)' : i < step ? 'rgba(232,165,52,0.4)' : 'var(--b3)',
                  transition: 'all 0.3s ease',
                }}
              />
            ))}
            <span style={{
              fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--muted)',
              marginLeft: 6, letterSpacing: '0.06em',
            }}>
              {step + 1} of {TOUR_STEPS.length}
            </span>
          </div>
          <button
            onClick={doClose}
            aria-label="Close tour"
            style={{
              background: 'rgba(255,255,255,0.05)', border: 'none', color: 'var(--muted)',
              fontSize: 14, cursor: 'pointer', padding: '4px 8px', lineHeight: 1,
              borderRadius: 6, transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(248,113,113,0.12)'; e.currentTarget.style.color = 'var(--red)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'var(--muted)'; }}
          >
            ✕
          </button>
        </div>

        {/* Emoji + Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <span style={{ fontSize: 20 }}>{currentStep?.emoji}</span>
          <h3 style={{
            fontFamily: 'var(--sans)', fontSize: 15, fontWeight: 700,
            color: 'var(--text)', margin: 0, letterSpacing: '0.01em',
          }}>
            {currentStep?.title}
          </h3>
        </div>

        {/* Description */}
        <p style={{
          fontFamily: 'var(--sans)', fontSize: 13, lineHeight: 1.65,
          color: 'var(--text2)', margin: '0 0 22px 0',
        }}>
          {currentStep?.description}
        </p>

        {/* Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {step > 0 ? (
            <button
              onClick={goPrev}
              style={{
                fontFamily: 'var(--sans)', fontSize: 12, fontWeight: 500,
                padding: '8px 18px', border: '1px solid var(--b3)', borderRadius: 8,
                color: 'var(--text2)', background: 'transparent', cursor: 'pointer',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--b3)'; e.currentTarget.style.color = 'var(--text2)'; }}
            >
              ← Back
            </button>
          ) : (
            <button
              onClick={doClose}
              style={{
                fontFamily: 'var(--sans)', fontSize: 12, fontWeight: 500,
                padding: '8px 18px', border: 'none', borderRadius: 8,
                color: 'var(--muted)', background: 'transparent', cursor: 'pointer',
                transition: 'color 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--text2)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--muted)')}
            >
              Skip tour
            </button>
          )}
          <button
            onClick={goNext}
            style={{
              fontFamily: 'var(--sans)', fontSize: 12, fontWeight: 600,
              padding: '9px 22px', borderRadius: 8,
              background: 'var(--accent)', color: '#000',
              border: 'none', cursor: 'pointer',
              transition: 'all 0.15s',
              boxShadow: '0 2px 8px rgba(232,165,52,0.25)',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(232,165,52,0.35)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(232,165,52,0.25)'; }}
          >
            {step === TOUR_STEPS.length - 1 ? 'Get started →' : 'Next →'}
          </button>
        </div>
      </div>
    </>
  );
}


/* ═══════════════════════════════════════════════
   Idle Tour Prompt
   ═══════════════════════════════════════════════ */
export function IdleTourPrompt({ onStartTour }: { onStartTour: () => void }) {
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (wasTourDismissed()) return;
    const resetTimer = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setVisible(true), IDLE_TIMEOUT_MS);
    };
    resetTimer();
    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];
    events.forEach(ev => window.addEventListener(ev, resetTimer, { passive: true }));
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      events.forEach(ev => window.removeEventListener(ev, resetTimer));
    };
  }, []);

  const dismiss = () => { setVisible(false); markTourDismissed(); };

  if (!visible) return null;

  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 99999,
      background: '#161616', border: '1px solid rgba(232,165,52,0.25)', borderRadius: 12,
      padding: '14px 18px',
      boxShadow: '0 12px 40px rgba(0,0,0,0.5), 0 0 1px rgba(232,165,52,0.2)',
      display: 'flex', alignItems: 'center', gap: 12,
      animation: 'tourPromptSlide 400ms cubic-bezier(0.16,1,0.3,1)',
      maxWidth: 320,
    }}>
      <div style={{
        width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)',
        animation: 'pulse 2s infinite', flexShrink: 0,
      }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--text)', fontWeight: 600, marginBottom: 2 }}>
          Want a quick tour?
        </div>
        <div style={{ fontFamily: 'var(--sans)', fontSize: 11, color: 'var(--muted)' }}>
          3 quick steps to get oriented
        </div>
      </div>
      <button
        onClick={() => { dismiss(); onStartTour(); }}
        style={{
          fontFamily: 'var(--sans)', fontSize: 11, fontWeight: 600,
          padding: '7px 14px', background: 'var(--accent)', color: '#000',
          border: 'none', cursor: 'pointer', flexShrink: 0, borderRadius: 8,
        }}
      >
        Start
      </button>
      <button
        onClick={dismiss}
        style={{
          background: 'none', border: 'none', color: 'var(--muted)',
          cursor: 'pointer', fontSize: 14, padding: '0 2px', flexShrink: 0,
        }}
      >
        ✕
      </button>
    </div>
  );
}

export { wasTourDismissed };
