import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useStore from '../store';
import Navbar from '../components/Navbar';

export default function SecuritySettings() {
  const token    = useStore(s => s.token);
  const user     = useStore(s => s.user);
  const logout   = useStore(s => s.logout);
  const navigate = useNavigate();

  // ── Password change state ─────────────────────────────────────────────────
  const [pw, setPw] = useState({ current: '', next: '', confirm: '' });
  const [showPw, setShowPw] = useState({ current: false, next: false, confirm: false });
  const [pwBusy, setPwBusy] = useState(false);
  const [pwToast, setPwToast] = useState(null);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const toast = (msg, ok = true, setter = setPwToast) => {
    setter({ msg, ok });
    setTimeout(() => setter(null), 4000);
  };

  const strength = (p) => {
    if (!p) return 0;
    let s = 0;
    if (p.length >= 8)  s++;
    if (p.length >= 12) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return s; // 0-5
  };

  const strengthLabel = (s) => {
    if (s <= 1) return { label: 'Weak',   color: 'bg-red-500',    text: 'text-red-400' };
    if (s <= 3) return { label: 'Fair',   color: 'bg-amber-500',  text: 'text-amber-400' };
    if (s <= 4) return { label: 'Good',   color: 'bg-cyan-500',   text: 'text-cyan-400' };
    return       { label: 'Strong', color: 'bg-emerald-500', text: 'text-emerald-400' };
  };

  const pwStrength = strength(pw.next);
  const sl = strengthLabel(pwStrength);

  // ── Submit password change ────────────────────────────────────────────────
  const submitPasswordChange = async () => {
    if (!pw.current || !pw.next || !pw.confirm) {
      toast('All fields are required.', false); return;
    }
    if (pw.next !== pw.confirm) {
      toast('New passwords do not match.', false); return;
    }
    if (pw.next.length < 8) {
      toast('Password must be at least 8 characters.', false); return;
    }

    setPwBusy(true);
    try {
      const res  = await fetch('/api/auth/change-password', {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ current_password: pw.current, new_password: pw.next }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to change password');
      toast('Password updated. Please log in again.', true);
      setPw({ current: '', next: '', confirm: '' });
      // Force re-login after password change
      setTimeout(() => { logout(); navigate('/login'); }, 2000);
    } catch (err) {
      toast(err.message, false);
    } finally {
      setPwBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <Navbar />

      <main className="p-6 max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <p className="text-xs font-semibold text-indigo-400 uppercase tracking-widest mb-1">Account</p>
          <h1 className="text-2xl font-bold text-white">Security Settings</h1>
        </div>

        {/* Account info card */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 mb-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
            <UserIcon className="w-5 h-5 text-indigo-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">{user?.full_name || 'Admin'}</p>
            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-medium capitalize">
            {user?.role || 'admin'}
          </span>
        </div>

        {/* Password Change Card */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-5">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
              <KeyIcon className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Change Password</h2>
              <p className="text-xs text-gray-500">Use a strong, unique password</p>
            </div>
          </div>

          {/* Toast */}
          {pwToast && (
            <div className={`flex items-center gap-2 mb-4 px-3 py-2.5 rounded-xl border text-sm
              ${pwToast.ok
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
              {pwToast.ok ? <CheckIcon className="w-4 h-4 shrink-0" /> : <AlertIcon className="w-4 h-4 shrink-0" />}
              {pwToast.msg}
            </div>
          )}

          <div className="space-y-4">
            {/* Current password */}
            <PasswordField
              label="Current Password"
              value={pw.current}
              show={showPw.current}
              onToggle={() => setShowPw(s => ({ ...s, current: !s.current }))}
              onChange={v => setPw(p => ({ ...p, current: v }))}
              placeholder="Enter current password"
            />

            {/* New password */}
            <PasswordField
              label="New Password"
              value={pw.next}
              show={showPw.next}
              onToggle={() => setShowPw(s => ({ ...s, next: !s.next }))}
              onChange={v => setPw(p => ({ ...p, next: v }))}
              placeholder="Min. 8 characters"
            />

            {/* Strength meter */}
            {pw.next && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-gray-500">Password strength</span>
                  <span className={`text-xs font-semibold ${sl.text}`}>{sl.label}</span>
                </div>
                <div className="flex gap-1">
                  {[1,2,3,4,5].map(i => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                        i <= pwStrength ? sl.color : 'bg-gray-800'
                      }`}
                    />
                  ))}
                </div>
                <ul className="mt-2 space-y-0.5">
                  {[
                    [pw.next.length >= 8,            '8+ characters'],
                    [/[A-Z]/.test(pw.next),          'Uppercase letter'],
                    [/[0-9]/.test(pw.next),          'Number'],
                    [/[^A-Za-z0-9]/.test(pw.next),   'Special character'],
                  ].map(([met, label]) => (
                    <li key={label} className={`text-[11px] flex items-center gap-1.5 ${met ? 'text-emerald-400' : 'text-gray-600'}`}>
                      <span>{met ? '✓' : '○'}</span> {label}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Confirm password */}
            <PasswordField
              label="Confirm New Password"
              value={pw.confirm}
              show={showPw.confirm}
              onToggle={() => setShowPw(s => ({ ...s, confirm: !s.confirm }))}
              onChange={v => setPw(p => ({ ...p, confirm: v }))}
              placeholder="Repeat new password"
              error={pw.confirm && pw.next !== pw.confirm ? "Passwords don't match" : null}
            />
          </div>

          <button
            onClick={submitPasswordChange}
            disabled={pwBusy || !pw.current || !pw.next || !pw.confirm || pw.next !== pw.confirm}
            className="mt-6 w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2"
          >
            {pwBusy ? (
              <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Updating…</>
            ) : (
              <><KeyIcon className="w-4 h-4" /> Update Password</>
            )}
          </button>
        </div>

        {/* MFA status card */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
              <ShieldIcon className="w-4 h-4 text-purple-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Two-Factor Authentication</h2>
              <p className="text-xs text-gray-500">TOTP-based MFA via authenticator app</p>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-gray-800/50 border border-gray-700/50">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-sm text-gray-300">MFA configuration</span>
            </div>
            <button
              onClick={() => navigate('/settings/mfa')}
              className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors font-medium"
            >
              Manage →
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function PasswordField({ label, value, show, onToggle, onChange, placeholder, error }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
        {label}
      </label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full bg-gray-800 border text-white text-sm rounded-xl px-3 pr-10 py-2.5 placeholder-gray-600 focus:outline-none focus:ring-1 transition-colors ${
            error
              ? 'border-red-500/50 focus:border-red-500/60 focus:ring-red-500/30'
              : 'border-gray-700 focus:border-cyan-500/60 focus:ring-cyan-500/30'
          }`}
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400 transition-colors"
          tabIndex={-1}
        >
          {show ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
        </button>
      </div>
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
    </div>
  );
}

// ── Icons ─────────────────────────────────────────────────────────────────────
function UserIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}

function KeyIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
    </svg>
  );
}

function ShieldIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  );
}

function CheckIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}

function AlertIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M12 8v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
    </svg>
  );
}

function EyeIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );
}

function EyeOffIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  );
}