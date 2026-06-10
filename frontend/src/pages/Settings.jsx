import { useState } from 'react';
import Navbar from '../components/Navbar';
import SecuritySettings from '../components/SecuritySettings';
import useStore from '../store';

export default function Settings() {
  const { token, user } = useStore();
  const isAdmin = user?.role === 'ADMIN';

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center">
            <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
            <p className="text-sm text-gray-400">Manage authentication and security preferences</p>
          </div>
        </div>

        <div className="flex flex-col gap-6 max-w-lg">
          <SecuritySettings />
          {isAdmin && <InviteUser token={token} />}
        </div>
      </div>
    </div>
  );
}

// ── Invite User ───────────────────────────────────────────────────────────────
function InviteUser({ token }) {
  const [form, setForm]       = useState({ full_name: '', email: '', role: 'ENGINEER' });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [result, setResult]   = useState(null);

  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    setError(''); setResult(null);
    if (!form.full_name.trim() || !form.email.trim()) {
      setError('Full name and email are required.'); return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setError('Enter a valid email address.'); return;
    }
    setLoading(true);
    try {
      const res  = await fetch('/api/auth/invite', {
        method:  'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body:    JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to create user.'); return; }
      setResult(data);
      setForm({ full_name: '', email: '', role: 'ENGINEER' });
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
      <div className="flex items-center gap-3 mb-1">
        <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
          <UserPlusIcon className="w-4 h-4 text-indigo-400" />
        </div>
        <h2 className="text-lg font-semibold text-white">Invite User</h2>
      </div>
      <p className="text-sm text-gray-400 mb-5">
        Create a new account. A temporary password will be generated for you to share.
      </p>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-2 mb-4">
          {error}
        </div>
      )}

      {/* Success card */}
      {result && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 mb-4 space-y-2">
          <p className="text-emerald-400 text-sm font-semibold">
            ✓ {result.user.full_name} created successfully
          </p>
          <p className="text-xs text-gray-400">
            Share these credentials with the new user — the password is shown only once.
          </p>
          <div className="bg-gray-900 rounded-lg p-3 border border-gray-700 space-y-1">
            <Row label="Email"    value={result.user.email} />
            <Row label="Role"     value={result.user.role} />
            <Row label="Password" value={result.temp_password} mono copyable />
          </div>
          <p className="text-[11px] text-amber-400/80">
            ⚠ The user should change this password and set up MFA on first login.
          </p>
        </div>
      )}

      <div className="space-y-3">
        {/* Full name */}
        <div>
          <label className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1 block">
            Full Name <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={form.full_name}
            onChange={e => setField('full_name', e.target.value)}
            placeholder="Jane Smith"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30"
          />
        </div>

        {/* Email */}
        <div>
          <label className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1 block">
            Email <span className="text-red-400">*</span>
          </label>
          <input
            type="email"
            value={form.email}
            onChange={e => setField('email', e.target.value)}
            placeholder="jane@company.com"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30"
          />
        </div>

        {/* Role */}
        <div>
          <label className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1 block">
            Role
          </label>
          <select
            value={form.role}
            onChange={e => setField('role', e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500/50"
          >
            <option value="ENGINEER">Engineer</option>
            <option value="ADMIN">Admin</option>
            <option value="VIEWER">Viewer</option>
          </select>
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-medium transition-colors mt-1"
        >
          {loading ? 'Creating...' : 'Create User'}
        </button>
      </div>
    </div>
  );
}

// ── Small helpers ─────────────────────────────────────────────────────────────
function Row({ label, value, mono, copyable }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs text-gray-500 w-20 shrink-0">{label}</span>
      <span className={`text-xs text-gray-200 flex-1 ${mono ? 'font-mono' : ''}`}>{value}</span>
      {copyable && (
        <button onClick={copy} className="text-xs text-indigo-400 hover:text-indigo-300 shrink-0">
          {copied ? '✓ Copied' : 'Copy'}
        </button>
      )}
    </div>
  );
}

function UserPlusIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
    </svg>
  );
}