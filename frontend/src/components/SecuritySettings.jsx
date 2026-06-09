import { useState } from 'react';

/* 
  SecuritySettings — restyled to INFRAlock design system.
  Paste your real Supabase/MFA calls where the TODO comments are.
*/
export default function SecuritySettings() {
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [pwCurrent, setPwCurrent]   = useState('');
  const [pwNew, setPwNew]           = useState('');
  const [pwConfirm, setPwConfirm]   = useState('');
  const [pwMessage, setPwMessage]   = useState(null);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (pwNew !== pwConfirm) {
      setPwMessage({ type: 'error', text: 'New passwords do not match.' });
      return;
    }
    // TODO: call Supabase updateUser({ password: pwNew })
    setPwMessage({ type: 'ok', text: 'Password updated.' });
    setPwCurrent(''); setPwNew(''); setPwConfirm('');
    setTimeout(() => setPwMessage(null), 4000);
  };

  const handleToggleMfa = async () => {
    // TODO: enrol or unenrol TOTP via Supabase MFA API
    setMfaEnabled(v => !v);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* MFA section */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Multi-factor authentication</span>
          <span className={`badge ${mfaEnabled ? 'badge-online' : 'badge-offline'}`}>
            {mfaEnabled ? 'Enabled' : 'Disabled'}
          </span>
        </div>
        <div className="card-body">
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.6 }}>
            {mfaEnabled
              ? 'Two-factor authentication is active. Each sign-in requires a time-based OTP.'
              : 'Add a second factor to protect your account with a TOTP authenticator app.'}
          </p>
          <button
            onClick={handleToggleMfa}
            className={`btn ${mfaEnabled ? 'btn-danger' : 'btn-primary'}`}
          >
            {mfaEnabled ? 'Disable MFA' : 'Enable MFA'}
          </button>
        </div>
      </div>

      {/* Password section */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Change password</span>
        </div>
        <div className="card-body">
          {pwMessage && (
            <div style={{
              padding: '10px 14px',
              borderRadius: 6,
              marginBottom: 16,
              fontSize: 13,
              background: pwMessage.type === 'ok' ? 'var(--emerald-bg)' : 'var(--red-bg)',
              border: `1px solid ${pwMessage.type === 'ok' ? 'var(--emerald-border)' : 'var(--red-border)'}`,
              color: pwMessage.type === 'ok' ? 'var(--emerald)' : 'var(--red)',
            }}>
              {pwMessage.text}
            </div>
          )}

          <form onSubmit={handleChangePassword}>
            <div className="form-group">
              <label className="form-label" htmlFor="pw-current">Current password</label>
              <input
                id="pw-current"
                type="password"
                className="form-input"
                value={pwCurrent}
                onChange={e => setPwCurrent(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="pw-new">New password</label>
              <input
                id="pw-new"
                type="password"
                className="form-input"
                value={pwNew}
                onChange={e => setPwNew(e.target.value)}
                placeholder="Min 12 characters"
                minLength={12}
                required
                autoComplete="new-password"
              />
            </div>
            <div className="form-group" style={{ marginBottom: 20 }}>
              <label className="form-label" htmlFor="pw-confirm">Confirm new password</label>
              <input
                id="pw-confirm"
                type="password"
                className="form-input"
                value={pwConfirm}
                onChange={e => setPwConfirm(e.target.value)}
                placeholder="Repeat new password"
                minLength={12}
                required
                autoComplete="new-password"
              />
            </div>
            <button type="submit" className="btn btn-primary">
              Update password
            </button>
          </form>
        </div>
      </div>

      {/* Session section */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Active sessions</span>
        </div>
        <div className="card-body">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>
                Current session
              </p>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
                Bengaluru, IN · {new Date().toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}
              </p>
            </div>
            <span className="badge badge-online">Active</span>
          </div>
          <button className="btn btn-danger btn-sm">
            Revoke all other sessions
          </button>
        </div>
      </div>
    </div>
  );
}
