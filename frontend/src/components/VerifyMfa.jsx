import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useStore from '../store';

export default function VerifyMfa() {
  const [code, setCode]     = useState('');
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const verifyMfa = useStore(s => s.verifyMfa);
  const navigate  = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await verifyMfa(code);
      navigate('/');
    } catch (err) {
      setError(err.message ?? 'Invalid code. Please try again.');
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
      padding: 24,
    }}>
      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 40 }}>
        <span style={{
          width: 36, height: 36,
          background: 'var(--cyan)',
          borderRadius: 6,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--bg-base)',
          fontFamily: 'var(--font-mono)',
          fontWeight: 700,
          fontSize: 18,
          letterSpacing: '-0.02em',
        }}>IL</span>
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 16,
          fontWeight: 500,
          color: 'var(--text-primary)',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
        }}>INFRAlock</span>
      </div>

      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        padding: '32px 36px',
        width: '100%',
        maxWidth: 380,
      }}>
        <h1 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
          Two-factor verification
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 28, lineHeight: 1.6 }}>
          Enter the 6-digit code from your authenticator app.
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
          <div className="form-group" style={{ marginBottom: 24 }}>
            <label className="form-label" htmlFor="mfa-code">Authenticator code</label>
            <input
              id="mfa-code"
              type="text"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              className="form-input"
              value={code}
              onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              required
              autoFocus
              autoComplete="one-time-code"
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 22,
                textAlign: 'center',
                letterSpacing: '0.4em',
              }}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading || code.length !== 6}
            style={{ width: '100%', justifyContent: 'center', padding: '10px 14px' }}
          >
            {loading ? 'Verifying…' : 'Verify'}
          </button>
        </form>
      </div>
    </div>
  );
}
