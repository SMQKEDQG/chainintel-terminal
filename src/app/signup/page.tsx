'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function SignUpPage() {
  const { signUp } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    const { error } = await signUp(email, password);
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSuccess(true);
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'var(--bg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'var(--sans)',
      }}>
        <div style={{
          width: '100%',
          maxWidth: '380px',
          padding: '0 20px',
          textAlign: 'center',
        }}>
          <div style={{
            fontFamily: 'var(--mono)',
            fontSize: '20px',
            fontWeight: 600,
            color: '#fff',
            letterSpacing: '0.06em',
            marginBottom: '24px',
          }}>
            CHAIN<span style={{ color: 'var(--accent)' }}>INTEL</span>
          </div>
          <div style={{
            background: 'var(--s1)',
            border: '1px solid rgba(232,165,52,0.2)',
            padding: '28px 24px',
          }}>
            <div style={{
              fontFamily: 'var(--mono)',
              fontSize: '11px',
              color: 'var(--accent)',
              fontWeight: 600,
              marginBottom: '12px',
            }}>
              ✓ ACCOUNT CREATED
            </div>
            <div style={{
              fontFamily: 'var(--mono)',
              fontSize: '10px',
              color: 'var(--text2)',
              lineHeight: 1.6,
              marginBottom: '20px',
            }}>
              Check your email to confirm your account. Then sign in to access the terminal.
            </div>
            <Link
              href="/login"
              style={{
                display: 'block',
                background: 'var(--accent)',
                color: '#000',
                fontFamily: 'var(--mono)',
                fontSize: '10px',
                fontWeight: 700,
                letterSpacing: '0.12em',
                padding: '12px',
                textDecoration: 'none',
                textAlign: 'center',
              }}
            >
              GO TO SIGN IN →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'var(--sans)',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '380px',
        padding: '0 20px',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <div style={{
              fontFamily: 'var(--mono)',
              fontSize: '20px',
              fontWeight: 600,
              color: '#fff',
              letterSpacing: '0.06em',
            }}>
              CHAIN<span style={{ color: 'var(--accent)' }}>INTEL</span>
            </div>
          </Link>
          <div style={{
            fontFamily: 'var(--mono)',
            fontSize: '9px',
            color: 'var(--muted)',
            letterSpacing: '0.12em',
            marginTop: '4px',
          }}>
            CREATE YOUR ACCOUNT
          </div>
        </div>

        {/* Sign Up Form */}
        <div style={{
          background: 'var(--s1)',
          border: '1px solid var(--b2)',
          padding: '28px 24px',
        }}>
          <div style={{
            fontFamily: 'var(--mono)',
            fontSize: '10px',
            letterSpacing: '0.14em',
            color: 'var(--text2)',
            marginBottom: '20px',
            textTransform: 'uppercase',
          }}>
            Create Account
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '14px' }}>
              <label style={{
                fontFamily: 'var(--mono)',
                fontSize: '8px',
                letterSpacing: '0.12em',
                color: 'var(--muted)',
                display: 'block',
                marginBottom: '6px',
                textTransform: 'uppercase',
              }}>Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                style={{
                  width: '100%',
                  background: 'var(--s2)',
                  border: '1px solid var(--b2)',
                  color: 'var(--text)',
                  fontFamily: 'var(--mono)',
                  fontSize: '11px',
                  padding: '10px 12px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
                onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                onBlur={e => e.target.style.borderColor = 'var(--b2)'}
                placeholder="you@example.com"
              />
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{
                fontFamily: 'var(--mono)',
                fontSize: '8px',
                letterSpacing: '0.12em',
                color: 'var(--muted)',
                display: 'block',
                marginBottom: '6px',
                textTransform: 'uppercase',
              }}>Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                style={{
                  width: '100%',
                  background: 'var(--s2)',
                  border: '1px solid var(--b2)',
                  color: 'var(--text)',
                  fontFamily: 'var(--mono)',
                  fontSize: '11px',
                  padding: '10px 12px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
                onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                onBlur={e => e.target.style.borderColor = 'var(--b2)'}
                placeholder="Min 6 characters"
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{
                fontFamily: 'var(--mono)',
                fontSize: '8px',
                letterSpacing: '0.12em',
                color: 'var(--muted)',
                display: 'block',
                marginBottom: '6px',
                textTransform: 'uppercase',
              }}>Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
                style={{
                  width: '100%',
                  background: 'var(--s2)',
                  border: '1px solid var(--b2)',
                  color: 'var(--text)',
                  fontFamily: 'var(--mono)',
                  fontSize: '11px',
                  padding: '10px 12px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
                onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                onBlur={e => e.target.style.borderColor = 'var(--b2)'}
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div style={{
                fontFamily: 'var(--mono)',
                fontSize: '9px',
                color: 'var(--red)',
                marginBottom: '14px',
                padding: '8px 10px',
                background: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.2)',
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                background: 'var(--accent)',
                color: '#000',
                border: 'none',
                fontFamily: 'var(--mono)',
                fontSize: '10px',
                fontWeight: 700,
                letterSpacing: '0.12em',
                padding: '12px',
                cursor: loading ? 'wait' : 'pointer',
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? 'CREATING ACCOUNT...' : 'CREATE ACCOUNT →'}
            </button>
          </form>

          <div style={{
            fontFamily: 'var(--mono)',
            fontSize: '8px',
            color: 'var(--muted)',
            marginTop: '14px',
            lineHeight: 1.5,
          }}>
            Free tier includes: Market dashboard, Fear &amp; Greed, ETF flows, heatmap, DeFi TVL, regulatory feed.
          </div>
        </div>

        {/* Sign in link */}
        <div style={{
          textAlign: 'center',
          marginTop: '16px',
          fontFamily: 'var(--mono)',
          fontSize: '9px',
          color: 'var(--muted)',
        }}>
          Already have an account?{' '}
          <Link href="/login" style={{ color: 'var(--accent)', textDecoration: 'none' }}>
            Sign in →
          </Link>
        </div>

        <div style={{
          textAlign: 'center',
          marginTop: '12px',
          fontFamily: 'var(--mono)',
          fontSize: '8px',
        }}>
          <Link href="/" style={{ color: 'var(--muted)', textDecoration: 'none' }}>
            ← Back to Terminal
          </Link>
        </div>
      </div>
    </div>
  );
}
