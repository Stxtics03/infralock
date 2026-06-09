import { useEffect, useState } from 'react';
import useStore from '../store';
import Navbar from '../components/Navbar';

const STATUS_STYLES = {
  open:        'bg-red-500/10 text-red-400 border-red-500/20',
  investigating: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  resolved:    'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  closed:      'bg-slate-500/10 text-slate-400 border-slate-500/20',
};

const SEVERITY_STYLES = {
  critical: 'bg-red-500/10 text-red-400 border-red-500/20',
  high:     'bg-orange-500/10 text-orange-400 border-orange-500/20',
  medium:   'bg-amber-500/10 text-amber-400 border-amber-500/20',
  low:      'bg-sky-500/10 text-sky-400 border-sky-500/20',
};

const COLUMNS = ['open', 'investigating', 'resolved', 'closed'];

const EMPTY_FORM = {
  title: '',
  description: '',
  severity: 'medium',
  status: 'open',
};

export default function Incidents() {
  const incidents      = useStore(s => s.incidents);
  const fetchIncidents = useStore(s => s.fetchIncidents);
  const token          = useStore(s => s.token);

  const [showModal, setShowModal] = useState(false);
  const [form, setForm]           = useState(EMPTY_FORM);
  const [busy, setBusy]           = useState(false);
  const [toast, setToast]         = useState(null);
  const [selected, setSelected]   = useState(null); // detail drawer

  useEffect(() => { fetchIncidents(); }, [fetchIncidents]);

  const safeIncidents = Array.isArray(incidents) ? incidents : [];

  const showToast = (msg, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const openCreate = () => { setForm(EMPTY_FORM); setShowModal(true); };

  const createIncident = async () => {
    if (!form.title.trim()) return;
    setBusy(true);
    try {
      const res = await fetch('/api/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create incident');
      showToast('✓ Incident created');
      setShowModal(false);
      fetchIncidents();
    } catch (err) {
      showToast(err.message, false);
    } finally {
      setBusy(false);
    }
  };

  const updateStatus = async (incidentId, status) => {
    try {
      const res = await fetch(`/api/incidents/${incidentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Failed');
      showToast(`Status → ${status}`);
      fetchIncidents();
      if (selected?.incident_id === incidentId) setSelected(s => ({ ...s, status }));
    } catch {
      showToast('Failed to update status', false);
    }
  };

  // Group by status
  const byStatus = COLUMNS.reduce((acc, col) => {
    acc[col] = safeIncidents.filter(i => i.status === col);
    return acc;
  }, {});

  const stats = {
    total:  safeIncidents.length,
    open:   byStatus.open.length,
    investigating: byStatus.investigating.length,
    resolved: byStatus.resolved.length + byStatus.closed.length,
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <Navbar />

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-[60] px-4 py-3 rounded-xl shadow-xl text-sm font-medium border
          ${toast.ok
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
            : 'bg-red-500/10 border-red-500/30 text-red-300'}`}>
          {toast.msg}
        </div>
      )}

      <main className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-xs font-semibold text-red-500 uppercase tracking-widest mb-1">Operations</p>
            <h1 className="text-2xl font-bold text-white">Incidents</h1>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-semibold transition-colors shadow-lg shadow-red-900/30"
          >
            <PlusIcon className="w-4 h-4" />
            New Incident
          </button>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          <StatCard label="Total" value={stats.total} color="text-white" />
          <StatCard label="Open" value={stats.open} color="text-red-400" />
          <StatCard label="Investigating" value={stats.investigating} color="text-amber-400" />
          <StatCard label="Resolved / Closed" value={stats.resolved} color="text-emerald-400" />
        </div>

        {/* Kanban board */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {COLUMNS.map(col => (
            <KanbanColumn
              key={col}
              status={col}
              incidents={byStatus[col]}
              onSelect={setSelected}
              onStatusChange={updateStatus}
            />
          ))}
        </div>
      </main>

      {/* Create Incident Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
          onClick={e => e.target === e.currentTarget && setShowModal(false)}
        >
          <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-white">New Incident</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-300">
                <XIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
                  Title <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. DB replica lag spike"
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/30"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
                  Description
                </label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="What's happening? Impact, affected systems…"
                  rows={3}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/30 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
                    Severity
                  </label>
                  <select
                    value={form.severity}
                    onChange={e => setForm(f => ({ ...f, severity: e.target.value }))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-red-500/50"
                  >
                    <option value="critical">critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
                    Status
                  </label>
                  <select
                    value={form.status}
                    onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-red-500/50"
                  >
                    <option value="open">Open</option>
                    <option value="investigating">Investigating</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 transition-colors text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={createIncident}
                disabled={busy || !form.title.trim()}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-sm font-semibold transition-colors"
              >
                {busy ? 'Creating…' : 'Create Incident'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Drawer */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm"
          onClick={e => e.target === e.currentTarget && setSelected(null)}
        >
          <div className="w-full max-w-md bg-gray-900 border-l border-gray-800 h-full overflow-y-auto p-6 shadow-2xl">
            <div className="flex items-start justify-between mb-5">
              <div>
                <p className="text-xs text-gray-500 mb-1">#{selected.incident_id}</p>
                <h2 className="text-base font-bold text-white leading-snug">{selected.title}</h2>
              </div>
              <button onClick={() => setSelected(null)} className="text-gray-500 hover:text-gray-300 ml-3 shrink-0">
                <XIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-wrap gap-2 mb-5">
              <Badge label={selected.severity} styles={SEVERITY_STYLES[selected.severity?.toLowerCase()]} />
              <Badge label={selected.status} styles={STATUS_STYLES[selected.status?.toLowerCase()]} />
            </div>

            {selected.description && (
              <p className="text-sm text-gray-300 leading-relaxed mb-5">{selected.description}</p>
            )}

            <div className="text-xs text-gray-500 mb-6 space-y-1">
              {selected.created_at && (
                <p>Created: <span className="text-gray-400">{new Date(selected.created_at).toLocaleString()}</span></p>
              )}
              {selected.resolved_at && (
                <p>Resolved: <span className="text-gray-400">{new Date(selected.resolved_at).toLocaleString()}</span></p>
              )}
            </div>

            {/* Status actions */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Update Status</p>
              <div className="grid grid-cols-2 gap-2">
                {COLUMNS.filter(c => c !== selected.status).map(s => (
                  <button
                    key={s}
                    onClick={() => updateStatus(selected.incident_id, s)}
                    className="py-2 rounded-xl border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 text-xs font-medium transition-colors capitalize"
                  >
                    → {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatCard({ label, value, color }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

function KanbanColumn({ status, incidents, onSelect, onStatusChange }) {
  const headers = {
    open:          { label: 'Open',          color: 'text-red-400',    dot: 'bg-red-400' },
    investigating: { label: 'Investigating', color: 'text-amber-400',  dot: 'bg-amber-400' },
    resolved:      { label: 'Resolved',      color: 'text-emerald-400',dot: 'bg-emerald-400' },
    closed:        { label: 'Closed',        color: 'text-slate-400',  dot: 'bg-slate-400' },
  };
  const h = headers[status];

  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-3 flex flex-col gap-2 min-h-[200px]">
      <div className="flex items-center gap-2 px-1 mb-1">
        <div className={`w-2 h-2 rounded-full ${h.dot}`} />
        <span className={`text-xs font-semibold uppercase tracking-wide ${h.color}`}>{h.label}</span>
        <span className="ml-auto text-xs text-gray-600 font-mono">{incidents.length}</span>
      </div>

      {incidents.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-xs text-gray-700 py-6">
          No incidents
        </div>
      ) : (
        incidents.map(inc => (
          <IncidentCard
            key={inc.incident_id}
            incident={inc}
            onSelect={onSelect}
            onStatusChange={onStatusChange}
          />
        ))
      )}
    </div>
  );
}

function IncidentCard({ incident, onSelect, onStatusChange }) {
  const sev = SEVERITY_STYLES[incident.severity?.toLowerCase()] || SEVERITY_STYLES.medium;
  const nextStatus = {
    open: 'investigating',
    investigating: 'resolved',
    resolved: 'closed',
    closed: null,
  }[incident.status];

  return (
    <div
      className="bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-xl p-3 cursor-pointer transition-colors group"
      onClick={() => onSelect(incident)}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-xs font-semibold text-white leading-snug line-clamp-2 flex-1">
          {incident.title}
        </p>
        <span className={`shrink-0 text-[10px] px-1.5 py-0.5 rounded-full border font-medium ${sev}`}>
          {incident.severity}
        </span>
      </div>

      {incident.description && (
        <p className="text-[11px] text-gray-500 line-clamp-2 mb-2">{incident.description}</p>
      )}

      <div className="flex items-center justify-between">
        <span className="text-[10px] text-gray-600">
          {incident.created_at ? relativeTime(incident.created_at) : ''}
        </span>
        {nextStatus && (
          <button
            onClick={e => { e.stopPropagation(); onStatusChange(incident.incident_id, nextStatus); }}
            className="text-[10px] text-gray-600 hover:text-indigo-400 transition-colors opacity-0 group-hover:opacity-100 capitalize"
          >
            → {nextStatus}
          </button>
        )}
      </div>
    </div>
  );
}

function Badge({ label, styles }) {
  return (
    <span className={`text-xs px-2.5 py-0.5 rounded-full border font-medium capitalize ${styles}`}>
      {label}
    </span>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function relativeTime(ts) {
  const diff = (Date.now() - new Date(ts).getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

// ── Icons ─────────────────────────────────────────────────────────────────────
function PlusIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  );
}

function XIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}