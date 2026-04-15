'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

/* ── GuidedTour — interactive product tour overlay ── */
interface TourStep {
  target: string; // data-tour attribute
  title: string;
  description: string;
  position: 'top' | 'bottom' | 'left' | 'right';
  tabSwitch?: string; // switch to this tab before highlighting
}

interface GuidedTourProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchTab?: (tabId: string) => void;
}

const TOUR_STEPS: TourStep[] = [
  {
    target: 'ticker-tape',
    title: 'Live Ticker Tape',
    description: 'Real-time price feed from CoinMarketCap covering the top 20 digital assets. Prices update every 60 seconds.',
    position: 'bottom',
  },
  {
    target: 'tab-nav',
    title: 'Intelligence Modules',
    description: '11 specialized tabs covering markets, on-chain analytics, DeFi, derivatives, sentiment, regulatory intelligence, and more. PRO tabs require a subscription.',
    position: 'bottom',
  },
  {
    target: 'tab-overview',
    title: 'Overview Dashboard',
    description: 'Your command center — market snapshot, correlation engine, daily AI brief, smart alerts, and portfolio allocation intelligence all in one view.',
    position: 'bottom',
    tabSwitch: 'overview',
  },
  {
    target: 'alert-btn',
    title: 'Smart Alert Engine',
    description: 'Configurable alerts for whale moves >$10M, funding rate flips, ETF flow streak breaks, and regulatory actions on assets you track.',
    position: 'bottom',
  },
  {
    target: 'live-indicator',
    title: 'Live Data Connection',
    description: '80+ data sources feeding the terminal in real-time. The pulse indicates active connections to exchanges, on-chain explorers, and intelligence feeds.',
    position: 'bottom',
  },
  {
    target: 'status-bar',
    title: 'System Status',
    description: 'Monitor API health, data latency, active feed count, and last sync time. Everything transparent.',
    position: 'top',
  },
];

export default function GuidedTour({ isOpen, onClose, onSwitchTab }: GuidedTourProps) {
  const [step, setStep] = useState(0);
  const [highlight, setHighlight] = useState<DOMRect | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const currentStep = TOUR_STEPS[step];

  const updateHighlight = useCallback(() => {
    if (!isOpen || !currentStep) return;
    
    try {
      const el = document.querySelector(`[data-tour="${currentStep.target}"]`);
      if (el) {
        const rect = el.getBoundingClientRect();
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
      return;
    }
    
    // Switch tab if needed
    if (currentStep?.tabSwitch && onSwitchTab) {
      onSwitchTab(currentStep.tabSwitch);
    }
    
    // Small delay to let tab switch render
    const t = setTimeout(updateHighlight, 250);
    return () => clearTimeout(t);
  }, [isOpen, step, currentStep, onSwitchTab, updateHighlight]);

  useEffect(() => {
    if (!isOpen) return;
    
    const handler = () => updateHighlight();
    window.addEventListener('resize', handler);
    window.addEventListener('scroll', handler, true); // capture phase for nested scrolls
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

  const next = () => {
    if (step < TOUR_STEPS.length - 1) setStep(step + 1);
    else handleClose();
  };

  const prev = () => {
    if (step > 0) setStep(step - 1);
  };

  const handleClose = () => {
    setStep(0);
    onClose();
  };

  if (!isOpen) return null;

  const tooltipStyle: React.CSSProperties = {
    position: 'fixed',
    zIndex: 100002,
    background: 'var(--s1)',
    border: '1px solid var(--accent)',
    borderRadius: 8,
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

      {/* Highlight cutout */}
      {highlight && (
        <div
          className="fixed"
          style={{
            top: highlight.top - 4,
            left: highlight.left - 4,
            width: highlight.width + 8,
            height: highlight.height + 8,
            border: '2px solid var(--accent)',
            borderRadius: 6,
            zIndex: 100001,
            boxShadow: '0 0 0 9999px rgba(0,0,0,0.65), 0 0 20px rgba(232,165,52,0.2)',
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Tooltip */}
      <div style={tooltipStyle} onClick={(e) => e.stopPropagation()}>
        {/* Progress */}
        <div className="flex items-center justify-between mb-3">
          <span className="font-mono text-[11px] tracking-wider" style={{ color: 'var(--muted)' }}>
            STEP {step + 1} OF {TOUR_STEPS.length}
          </span>
          <button
            onClick={handleClose}
            className="font-mono text-[16px] hover:text-[var(--red)] transition-colors leading-none"
            style={{ color: 'var(--muted)', padding: '0 2px' }}
          >
            ×
          </button>
        </div>

        {/* Progress bar */}
        <div className="w-full h-1 rounded mb-4" style={{ background: 'var(--b2)' }}>
          <div
            className="h-full rounded transition-all duration-300"
            style={{ background: 'var(--accent)', width: `${((step + 1) / TOUR_STEPS.length) * 100}%` }}
          />
        </div>

        <h3 className="font-mono text-[14px] font-bold mb-2" style={{ color: 'var(--accent)' }}>
          {currentStep.title}
        </h3>
        <p className="font-mono text-[12px] leading-relaxed mb-5" style={{ color: 'var(--text2)' }}>
          {currentStep.description}
        </p>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={prev}
            disabled={step === 0}
            className="font-mono text-[11px] tracking-wider px-4 py-2 border transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)] disabled:opacity-30"
            style={{ color: 'var(--muted)', borderColor: 'var(--b3)', background: 'transparent' }}
          >
            ← PREV
          </button>
          <button
            onClick={next}
            className="font-mono text-[11px] tracking-wider px-4 py-2 transition-opacity hover:opacity-80"
            style={{ background: 'var(--accent)', color: '#000', fontWeight: 700 }}
          >
            {step === TOUR_STEPS.length - 1 ? 'FINISH' : 'NEXT →'}
          </button>
        </div>
      </div>
    </>
  );
}
