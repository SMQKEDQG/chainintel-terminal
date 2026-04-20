'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

/* ── GuidedTour — smooth, friendly product walkthrough (3 steps) ── */
interface TourStep {
  target: string;
  title: string;
  description: string;
  emoji: string;
  position: 'top' | 'bottom' | 'left' | 'right';
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
  try {
    return sessionStorage.getItem(TOUR_DISMISSED_KEY) === '1';
  } catch {
    return false;
  }
}

function markTourDismissed(): void {
  try {
    sessionStorage.setItem(TOUR_DISMISSED_KEY, '1');
  } catch {}
}

/* ── clamp a rect to at most viewport-sized (for large targets) ── */
function clampRect(r: DOMRect): DOMRect {
  const vh = window.innerHeight;
  const vw = window.innerWidth;
  // If element is taller than 60% of viewport, shrink to just the visible top portion
  if (r.height > vh * 0.6) {
    const visTop = Math.max(0, r.top);
    const visH = Math.min(200, vh * 0.25); // highlight a manageable top slice
    return new DOMRect(r.left, visTop, Math.min(r.width, vw), visH);
  }
  return r;
}

/* ── wait until a `data-tour` element is visible ── */
function waitForTarget(target: string, timeoutMs = 4000): Promise<DOMRect | null> {
  return new Promise((resolve) => {
    const deadline = Date.now() + timeoutMs;
    function poll() {
      const el = document.querySelector(`[data-tour="${target}"]`);
      if (el) {
        const rect = el.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          // For large elements, don't scroll — just clamp the highlight
          if (rect.height > window.innerHeight * 0.6) {
            resolve(clampRect(rect));
            return;
          }
          const inView = rect.top >= -20 && rect.bottom <= window.innerHeight + 80;
          if (!inView) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setTimeout(() => {
              resolve(clampRect(el.getBoundingClientRect()));
            }, 420);
            return;
          }
          resolve(clampRect(rect));
          return;
        }
      }
      if (Date.now() < deadline) requestAnimationFrame(poll);
      else resolve(null);
    }
    poll();
  });
}

/* ── measure element position ── */
function getRect(target: string): DOMRect | null {
  const el = document.querySelector(`[data-tour="${target}"]`);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  if (r.width <= 0 || r.height <= 0) return null;
  return clampRect(r);
}

/* ═══════════════════════════════════════════════
   GuidedTour component
   ═══════════════════════════════════════════════ */
export default function GuidedTour({ isOpen, onClose, onSwitchTab }: GuidedTourProps) {
  const [step, setStep] = useState(0);
  const [highlight, setHighlight] = useState<DOMRect | null>(null);
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const closedRef = useRef(false);

  const currentStep = TOUR_STEPS[step];

  /* ── Locate target when step changes ── */
  useEffect(() => {
    if (!isOpen) {
      setStep(0);
      setHighlight(null);
      setTooltipVisible(false);
      closedRef.current = false;
      return;
    }

    let cancelled = false;
    setTooltipVisible(false);

    if (currentStep?.tabSwitch && onSwitchTab) {
      onSwitchTab(currentStep.tabSwitch);
    }

    const timer = setTimeout(async () => {
      if (cancelled) return;
      const rect = await waitForTarget(currentStep.target);
      if (!cancelled) {
        setHighlight(rect);
        // Stagger tooltip entrance for smooth feel
        setTimeout(() => {
          if (!cancelled) setTooltipVisible(true);
        }, 150);
      }
    }, 200);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [isOpen, step, currentStep, onSwitchTab]);

  /* ── Re-sync position only on scroll/resize (not continuous polling) ── */
  useEffect(() => {
    if (!isOpen || !tooltipVisible) return;

    let ticking = false;
    const sync = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(() => {
          const r = getRect(currentStep?.target ?? '');
          if (r) setHighlight(r);
          ticking = false;
        });
      }
    };

    window.addEventListener('scroll', sync, true);
    window.addEventListener('resize', sync);

    return () => {
      window.removeEventListener('scroll', sync, true);
      window.removeEventListener('resize', sync);
    };
  }, [isOpen, tooltipVisible, currentStep]);

  /* ── Escape key ── */
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') doClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  /* ── Close helper ── */
  const doClose = useCallback(() => {
    if (closedRef.current) return;
    closedRef.current = true;
    markTourDismissed();
    if (onSwitchTab) onSwitchTab('mktovr');
    setTooltipVisible(false);
    // Let fade-out play before unmounting
    setTimeout(() => {
      setStep(0);
      setHighlight(null);
      onClose();
    }, 200);
  }, [onClose, onSwitchTab]);

  /* ── Navigation ── */
  const next = useCallback(() => {
    if (step < TOUR_STEPS.length - 1) {
      setTooltipVisible(false);
      setHighlight(null);
      setTimeout(() => setStep((s) => s + 1), 120);
    } else {
      doClose();
    }
  }, [step, doClose]);

  const prev = useCallback(() => {
    if (step > 0) {
      setTooltipVisible(false);
      setHighlight(null);
      setTimeout(() => setStep((s) => s - 1), 120);
    }
  }, [step]);

  if (!isOpen) return null;

  /* ── Tooltip position ── */
  const tooltipStyle: React.CSSProperties = {
    position: 'fixed',
    zIndex: 100002,
    background: 'linear-gradient(145deg, #1A1A1A 0%, #141414 100%)',
    border: '1px solid rgba(232,165,52,0.35)',
    borderRadius: 12,
    padding: '22px 24px 20px',
    width: 370,
    maxWidth: 'calc(100vw - 32px)',
    boxShadow: '0 20px 60px rgba(0,0,0,0.4), 0 0 20px rgba(232,165,52,0.08)',
    opacity: tooltipVisible ? 1 : 0,
    transform: tooltipVisible ? 'translateY(0)' : 'translateY(8px)',
    transition: 'opacity 0.35s cubic-bezier(0.16,1,0.3,1), transform 0.35s cubic-bezier(0.16,1,0.3,1)',
  };

  if (highlight) {
    const pad = 16;
    const tooltipH = 220; // approximate height of the tooltip card
    const tooltipW = 370;
    const vw = typeof window !== 'undefined' ? window.innerWidth : 1400;
    const vh = typeof window !== 'undefined' ? window.innerHeight : 900;

    let top: number | undefined;
    let left: number | undefined;
    let bottom: number | undefined;

    if (currentStep.position === 'bottom') {
      top = highlight.bottom + pad;
      left = Math.max(16, Math.min(highlight.left, vw - tooltipW - 16));
      // If tooltip would overflow below viewport, flip to top
      if (top + tooltipH > vh - 16) {
        top = undefined;
        bottom = vh - highlight.top + pad;
      }
    } else if (currentStep.position === 'top') {
      bottom = vh - highlight.top + pad;
      left = Math.max(16, Math.min(highlight.left, vw - tooltipW - 16));
      // If would overflow above, flip to bottom
      if (vh - bottom + tooltipH > vh) {
        bottom = undefined;
        top = highlight.bottom + pad;
      }
    } else if (currentStep.position === 'right') {
      top = Math.max(16, Math.min(highlight.top, vh - tooltipH - 16));
      left = highlight.right + pad;
    } else {
      top = Math.max(16, Math.min(highlight.top, vh - tooltipH - 16));
      left = Math.max(16, highlight.left - tooltipW - pad);
    }

    // Final viewport clamp
    if (top !== undefined) tooltipStyle.top = Math.max(16, Math.min(top, vh - tooltipH - 16));
    if (bottom !== undefined) tooltipStyle.bottom = Math.max(16, bottom);
    if (left !== undefined) tooltipStyle.left = Math.max(16, Math.min(left, vw - tooltipW - 16));
  } else {
    tooltipStyle.top = '50%';
    tooltipStyle.left = '50%';
    tooltipStyle.transform = tooltipVisible ? 'translate(-50%, -50%)' : 'translate(-50%, -46%)';
  }

  return (
    <>
      {/* Soft overlay — NOT pitch-black */}
      <div
        className="fixed inset-0"
        style={{
          background: 'rgba(10, 10, 10, 0.45)',
          backdropFilter: 'blur(2px)',
          WebkitBackdropFilter: 'blur(2px)',
          zIndex: 100000,
          opacity: tooltipVisible ? 1 : 0,
          transition: 'opacity 0.4s ease',
        }}
        onClick={doClose}
      />

      {/* Spotlight cutout — soft glow, lighter mask */}
      {highlight && (
        <div
          className="fixed"
          style={{
            top: highlight.top - 6,
            left: highlight.left - 6,
            width: highlight.width + 12,
            height: highlight.height + 12,
            borderRadius: 8,
            border: '1.5px solid rgba(232,165,52,0.5)',
            zIndex: 100001,
            boxShadow: '0 0 0 9999px rgba(10,10,10,0.4), 0 0 24px rgba(232,165,52,0.15), 0 0 48px rgba(232,165,52,0.06)',
            pointerEvents: 'none',
            opacity: tooltipVisible ? 1 : 0,
            transition: 'opacity 0.35s cubic-bezier(0.16,1,0.3,1)',
          }}
        />
      )}

      {/* Tooltip card */}
      <div style={tooltipStyle} onClick={(e) => e.stopPropagation()}>
        {/* Step counter + close */}
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
                  transition: 'all 0.35s cubic-bezier(0.16,1,0.3,1)',
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
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(248,113,113,0.12)';
              e.currentTarget.style.color = 'var(--red)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
              e.currentTarget.style.color = 'var(--muted)';
            }}
          >
            ✕
          </button>
        </div>

        {/* Emoji + Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <span style={{ fontSize: 20 }}>{currentStep.emoji}</span>
          <h3 style={{
            fontFamily: 'var(--sans)', fontSize: 15, fontWeight: 700,
            color: 'var(--text)', margin: 0, letterSpacing: '0.01em',
          }}>
            {currentStep.title}
          </h3>
        </div>

        {/* Description */}
        <p style={{
          fontFamily: 'var(--sans)', fontSize: 13, lineHeight: 1.65,
          color: 'var(--text2)', margin: '0 0 22px 0',
        }}>
          {currentStep.description}
        </p>

        {/* Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {step > 0 ? (
            <button
              onClick={prev}
              style={{
                fontFamily: 'var(--sans)', fontSize: 12, fontWeight: 500,
                padding: '8px 18px', border: '1px solid var(--b3)', borderRadius: 8,
                color: 'var(--text2)', background: 'transparent', cursor: 'pointer',
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--accent)';
                e.currentTarget.style.color = 'var(--accent)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--b3)';
                e.currentTarget.style.color = 'var(--text2)';
              }}
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
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text2)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--muted)')}
            >
              Skip tour
            </button>
          )}
          <button
            onClick={next}
            style={{
              fontFamily: 'var(--sans)', fontSize: 12, fontWeight: 600,
              padding: '9px 22px', borderRadius: 8,
              background: 'var(--accent)', color: '#000',
              border: 'none', cursor: 'pointer',
              transition: 'all 0.15s',
              boxShadow: '0 2px 8px rgba(232,165,52,0.2)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 4px 14px rgba(232,165,52,0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(232,165,52,0.2)';
            }}
          >
            {step === TOUR_STEPS.length - 1 ? 'Get started →' : 'Next →'}
          </button>
        </div>
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════════
   Idle Tour Prompt — shows after 90s of no interaction
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
    events.forEach((ev) => window.addEventListener(ev, resetTimer, { passive: true }));

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      events.forEach((ev) => window.removeEventListener(ev, resetTimer));
    };
  }, []);

  const dismiss = () => {
    setVisible(false);
    markTourDismissed();
  };

  if (!visible) return null;

  return (
    <div
      style={{
        position: 'fixed', bottom: 24, right: 24, zIndex: 99999,
        background: 'linear-gradient(145deg, #1A1A1A 0%, #141414 100%)',
        border: '1px solid rgba(232,165,52,0.25)', borderRadius: 12,
        padding: '14px 18px',
        boxShadow: '0 12px 40px rgba(0,0,0,0.4), 0 0 16px rgba(232,165,52,0.06)',
        display: 'flex', alignItems: 'center', gap: 12,
        animation: 'tourPromptSlide 400ms cubic-bezier(0.16,1,0.3,1)',
        maxWidth: 320,
      }}
    >
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
          transition: 'transform 0.15s',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-1px)')}
        onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
      >
        Start
      </button>
      <button
        onClick={dismiss}
        style={{
          background: 'none', border: 'none', color: 'var(--muted)',
          cursor: 'pointer', fontSize: 14, padding: '0 2px', flexShrink: 0,
          transition: 'color 0.15s',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text2)')}
        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--muted)')}
      >
        ✕
      </button>
    </div>
  );
}

export { wasTourDismissed };
