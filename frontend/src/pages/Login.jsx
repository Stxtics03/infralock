import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useStore from '../store';

/* Lock icon */
const LockIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 20, height: 20 }}>
    <rect x="3" y="11" width="18" height="11" rx="2" />
    <path d="M7 11V7a5 5 0 0110 0v4" />
  </svg>
);

export default function Login() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const login    = useStore(s => s.login);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const needsMfa = await login(email, password);
      if (needsMfa) {
        navigate('/verify-mfa');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.message ?? 'Authentication failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-base)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>
      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 40 }}>
        <span style={{
          width: 36, height: 36,
          background: 'var(--cyan)',
          borderRadius: 6,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--bg-base)',
        }}>
          <LockIcon />
        </span>
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 16,
          fontWeight: 500,
          color: 'var(--text-primary)',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
        }}>
          INFRAlock
        </span>
      </div>

      {/* Card */}
      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        padding: '32px 36px',
        width: '100%',
        maxWidth: 380,
      }}>
        <h1 style={{
          fontSize: 18,
          fontWeight: 600,
          color: 'var(--text-primary)',
          marginBottom: 4,
        }}>
          Sign in
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 28 }}>
          Access your infrastructure console
        </p>

        {error && (
          <div style={{
            background: 'var(--red-bg)',
            border: '1px solid var(--red-border)',
            borderRadius: 6,
            padding: '10px 14px',
            marginBottom: 20,
            fontSize: 13,
            color: 'var(--red)',
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              className="form-input"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="operator@datacenter.io"
              required
              autoComplete="email"
              autoFocus
            />
          </div>

          <div className="form-group" style={{ marginBottom: 24 }}>
            <label className="form-label" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className="form-input"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: '100%', justifyContent: 'center', padding: '10px 14px' }}
          >
            {loading ? 'Authenticating…' : 'Sign in'}
          </button>
        </form>
      </div>

      <p style={{ marginTop: 24, fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>
        Data Centre Infrastructure Management System
      </p>
    </div>
  );
}
