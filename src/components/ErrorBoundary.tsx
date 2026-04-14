'use client';

import { Component, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ChainIntel] Uncaught render error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '60vh',
            padding: '40px',
            fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
            background: 'var(--bg, #080d16)',
            color: 'var(--text, #e4eaf4)',
          }}
        >
          {/* Glitch icon */}
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              border: '2px solid var(--red, #ef4444)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 24,
              background: 'rgba(239,68,68,0.08)',
            }}
          >
            <span style={{ fontSize: 28, lineHeight: 1 }}>⚠</span>
          </div>

          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.12em',
              color: 'var(--red, #ef4444)',
              marginBottom: 8,
            }}
          >
            SYSTEM ERROR
          </div>

          <div
            style={{
              fontSize: 10,
              color: 'var(--muted, #4a6a8c)',
              maxWidth: 400,
              textAlign: 'center',
              lineHeight: 1.6,
              marginBottom: 24,
            }}
          >
            A rendering error occurred in the terminal. This has been logged.
            Click below to attempt recovery.
          </div>

          {/* Error detail */}
          {this.state.error && (
            <div
              style={{
                fontSize: 9,
                color: 'var(--muted, #4a6a8c)',
                background: 'var(--s1, #0d1420)',
                border: '1px solid var(--b2, #1f3550)',
                borderRadius: 4,
                padding: '8px 16px',
                maxWidth: 480,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                marginBottom: 24,
              }}
            >
              {this.state.error.message}
            </div>
          )}

          <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={this.handleReset}
              style={{
                fontFamily: 'inherit',
                fontSize: 9,
                fontWeight: 600,
                letterSpacing: '0.1em',
                padding: '8px 20px',
                background: 'var(--cyan, #E8A534)',
                color: '#000',
                border: 'none',
                borderRadius: 3,
                cursor: 'pointer',
              }}
            >
              RECOVER
            </button>
            <button
              onClick={() => window.location.reload()}
              style={{
                fontFamily: 'inherit',
                fontSize: 9,
                fontWeight: 600,
                letterSpacing: '0.1em',
                padding: '8px 20px',
                background: 'transparent',
                color: 'var(--muted, #4a6a8c)',
                border: '1px solid var(--b3, #254060)',
                borderRadius: 3,
                cursor: 'pointer',
              }}
            >
              RELOAD PAGE
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
