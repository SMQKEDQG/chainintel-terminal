'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

/* ── GuidedTour — interactive product tour overlay (3 steps) ── */
interface TourStep {
  target: string;
  title: string;
  description: string;
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
    description: 'Ask any crypto question. Try: "Is now a good time to buy BTC?" — CI synthesizes data from 15+ live sources instantly.',
    position: 'bottom',
    tabSwitch: 'mktovr',
  },
  {
    target: 'daily-brief',
    title: 'Daily Intelligence Brief',
    description: 'Your daily market digest, updated every 3 minutes with live data from 7+ sources. Prices, sentiment, DeFi, network health — all in one card.',
    position: 'bottom',
    tabSwitch: 'mktovr',
  },
  {
    target: 'tab-nav',
    title: 'Intelligence Modules',
    description: '11 specialized modules. Start with Overview, explore Markets, and unlock Pro tabs for deeper on-chain, DeFi, and derivatives analysis.',
    position: 'bottom',
  },
];

const IDLE_TIMEOUT_MS = 90_000;
const DISMISSAL_KEY = 'chainintel_tour_dismissed';

export default function GuidedTour({ isOpen, onClose, onSwitchTab }: GuidedTourProps) {
  const [step, setStep] = useState(0);
  const [highlight, setHighlight] = useState<DOMRect | null>(null);
  const [isClosing, setIsClosing] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  const currentStep = TOUR_STEPS[step];

  const updateHighlight = useCallback(() => {
    if (!isOpen || !currentStep) return;

    try {
      const el = document.querySelector(`[data-tour="${currentStep.target}"]`);
      if (el) {
        const rect = el.getBoundingClientRect();
        const isInView = rect.top >= 0 && rect.bottom <= window.innerHeight;
        if (!isInView) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          setTimeout(() => {
            const newRect = el.getBoundingClientRect();
            setHighlight(newRect);
          }, 350);
          return;
        }
        setHighlight(rect);
      } else {
        setHighlight(null);
      }
    } catch {
      setHighlight(null);
    }
  }, [isOpen, currentStep]);

  useEffect(() => {
    if (!isOpen) {
      setStep(0);
      setIsClosing(false);
      return;
    }

    if (currentStep?.tabSwitch && onSwitchTab) {
      onSwitchTab(currentStep.tabSwitch);
    }

    const t = setTimeout(updateHighlight, 300);
    return () => clearTimeout(t);
  }, [isOpen, step, currentStep, onSwitchTab, updateHighlight]);

  useEffect(() => {
    if (!isOpen) return;

    const handler = () => updateHighlight();
    window.addEventListener('resize', handler);
    window.addEventListener('scroll', handler, true);
    return () => {
      window.removeEventListener('resize', handler);
      window.removeEventListener('scroll', handler, true);
    };
  }, [isOpen, updateHighlight]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleClose = useCallback(() => {
    if (isClosing) return;
    setIsClosing(true);

    // Mark dismissed in sessionStorage
    try { sessionStorage.setItem(DISMISSAL_KEY, '1'); } catch {}

    if (onSwitchTab) {
      onSwitchTab('mktovr');
    }

    setStep(0);
    setHighlight(null);

    requestAnimationFrame(() => {
      onClose();
    });
  }, [isClosing, onSwitchTab, onClose]);

  const next = () => {
    if (step < TOUR_STEPS.length - 1) setStep(step + 1);
    else handleClose();
  };

  const prev = () => {
    if (step > 0) setStep(step - 1);
  };

  if (!isOpen || isClosing) return null;

  const tooltipStyle: React.CSSProperties = {
    position: 'fixed',
    zIndex: 100002,
    background: 'var(--s1)',
    border: '1px solid var(--accent)',
    padding: '20px 24px',
    width: 360,
    boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 12px rgba(232,165,52,0.15)',
  };

  if (highlight) {
    const pad = 14;
    if (currentStep.position === 'bottom') {
      tooltipStyle.top = highlight.bottom + pad;
      tooltipStyle.left = Math.max(16, Math.min(highlight.left, window.innerWidth - 380));
    } else if (currentStep.position === 'top') {
      tooltipStyle.bottom = window.innerHeight - highlight.top + pad;
      tooltipStyle.left = Math.max(16, Math.min(highlight.left, window.innerWidth - 380));
    } else if (currentStep.position === 'right') {
      tooltipStyle.top = highlight.top;
      tooltipStyle.left = highlight.right + pad;
    } else {
      tooltipStyle.top = highlight.top;
      tooltipStyle.right = window.innerWidth - highlight.left + pad;
    }
  } else {
    tooltipStyle.top = '50%';
    tooltipStyle.left = '50%';
    tooltipStyle.transform = 'translate(-50%, -50%)';
  }

  return (
    <>
      {/* Overlay backdrop */}
      <div
        ref={overlayRef}
        className="fixed inset-0"
        style={{ background: 'rgba(0,0,0,0.7)', zIndex: 100000 }}
        onClick={handleClose}
      />

      {/* Highlight cutout with amber spotlight glow */}
      {highlight && (
        <div
          className="fixed tour-spotlight"
          style={{
            top: highlight.top - 4,
            left: highlight.left - 4,
            width: highlight.width + 8,
            height: highlight.height + 8,
            border: '2px solid var(--accent)',
            zIndex: 100001,
            boxShadow: '0 0 0 9999px rgba(0,0,0,0.65), 0 0 20px rgba(232,165,52,0.3), 0 0 40px rgba(232,165,52,0.15)',
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Tooltip */}
      <div style={tooltipStyle} onClick={(e) => e.stopPropagation()}>
        {/* Header with close button */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          {/* Progress dots */}
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            {TOUR_STEPS.map((_, i) => (
              <div
                key={i}
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: i === step ? 'var(--accent)' : i < step ? 'rgba(232,165,52,0.5)' : 'var(--b3)',
                  transition: 'background 0.3s, box-shadow 0.3s',
                  boxShadow: i === step ? '0 0 6px rgba(232,165,52,0.4)' : 'none',
                }}
              />
            ))}
          </div>
          <button
            onClick={handleClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--muted)',
              fontSize: 16,
              cursor: 'pointer',
              padding: '0 2px',
              lineHeight: 1,
              transition: 'color 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--red)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--muted)'}
          >
            ×
          </button>
        </div>

        <h3 style={{
          fontFamily: 'var(--mono)',
          fontSize: 14,
          fontWeight: 700,
          color: 'var(--accent)',
          marginBottom: 8,
        }}>
          {currentStep.title}
        </h3>
        <p style={{
          fontFamily: 'var(--mono)',
          fontSize: 12,
          lineHeight: 1.6,
          color: 'var(--text2)',
          marginBottom: 20,
        }}>
          {currentStep.description}
        </p>

        {/* Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button
            onClick={prev}
            disabled={step === 0}
            style={{
              fontFamily: 'var(--mono)',
              fontSize: 11,
              letterSpacing: '0.08em',
              padding: '8px 16px',
              border: '1px solid var(--b3)',
              color: step === 0 ? 'var(--b3)' : 'var(--muted)',
              background: 'transparent',
              cursor: step === 0 ? 'default' : 'pointer',
              transition: 'border-color 0.15s, color 0.15s',
            }}
            onMouseEnter={e => { if (step > 0) { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; }}}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--b3)'; e.currentTarget.style.color = step === 0 ? 'var(--b3)' : 'var(--muted)'; }}
          >
            PREV
          </button>
          <button
            onClick={next}
            style={{
              fontFamily: 'var(--mono)',
              fontSize: 11,
              letterSpacing: '0.08em',
              padding: '8px 16px',
              background: 'var(--accent)',
              color: '#000',
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer',
              transition: 'opacity 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            {step === TOUR_STEPS.length - 1 ? 'FINISH' : 'NEXT'}
          </button>
        </div>
      </div>
    </>
  );
}

/* ── Idle Tour Prompt — shows after 90s of no interaction ── */
export function IdleTourPrompt({ onStartTour }: { onStartTour: () => void }) {
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Don't show if already dismissed this session
    try {
      if (sessionStorage.getItem(DISMISSAL_KEY)) return;
    } catch {}

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

  const dismiss = () => {
    setVisible(false);
    try { sessionStorage.setItem(DISMISSAL_KEY, '1'); } catch {}
  };

  if (!visible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: 99999,
        background: 'var(--s1)',
        border: '1px solid rgba(232,165,52,0.3)',
        padding: '12px 16px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 12px rgba(232,165,52,0.1)',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        animation: 'tourPromptSlide 300ms ease-out',
        maxWidth: 320,
      }}
    >
      <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', animation: 'pulse 2s infinite', flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text)', fontWeight: 600, marginBottom: 2 }}>Want a quick tour?</div>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--muted)' }}>3 steps to get oriented</div>
      </div>
      <button
        onClick={() => { dismiss(); onStartTour(); }}
        style={{
          fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.08em',
          padding: '6px 12px', background: 'var(--accent)', color: '#000',
          border: 'none', cursor: 'pointer', fontWeight: 700, flexShrink: 0,
        }}
      >
        START
      </button>
      <button
        onClick={dismiss}
        style={{
          background: 'none', border: 'none', color: 'var(--muted)',
          cursor: 'pointer', fontSize: 14, padding: '0 2px', flexShrink: 0,
        }}
      >
        ×
      </button>
    </div>
  );
}
