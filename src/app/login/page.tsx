'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const { signIn } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error } = await signIn(email, password);
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push('/');
    }
  };

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
            DIGITAL ASSET INTELLIGENCE
          </div>
        </div>

        {/* Login Form */}
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
            Sign In to Terminal
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
                  transition: 'border-color 0.15s',
                }}
                onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                onBlur={e => e.target.style.borderColor = 'var(--b2)'}
                placeholder="you@example.com"
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
                  transition: 'border-color 0.15s',
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
                transition: 'opacity 0.15s',
              }}
            >
              {loading ? 'SIGNING IN...' : 'SIGN IN →'}
            </button>
          </form>
        </div>

        {/* Sign up link */}
        <div style={{
          textAlign: 'center',
          marginTop: '16px',
          fontFamily: 'var(--mono)',
          fontSize: '9px',
          color: 'var(--muted)',
        }}>
          No account?{' '}
          <Link href="/signup" style={{ color: 'var(--accent)', textDecoration: 'none' }}>
            Create one →
          </Link>
        </div>

        {/* Back to terminal */}
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
