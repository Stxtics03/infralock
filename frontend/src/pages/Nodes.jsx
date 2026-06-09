import { useEffect, useState } from 'react';
import useStore from '../store';
import Navbar from '../components/Navbar';

const EMPTY_REG = {
  hostname: '',
  ip_address: '',
  node_type: 'web',
  status: 'active',
  location: '',
};

export default function Nodes() {
  const nodes      = useStore(s => s.nodes);
  const token      = useStore(s => s.token);
  const fetchNodes = useStore(s => s.fetchNodes);

  const [metricsModal, setMetricsModal] = useState(null);
  const [form, setForm]                 = useState({ cpu_pct: 50, memory_pct: 50, disk_pct: 50 });
  const [regModal, setRegModal]         = useState(false);
  const [regForm, setRegForm]           = useState(EMPTY_REG);
  const [busy, setBusy]                 = useState(false);
  const [toast, setToast]               = useState('');

  useEffect(() => { fetchNodes(); }, [fetchNodes]);

  const openMetrics = (node) => {
    setForm({ cpu_pct: 50, memory_pct: 50, disk_pct: 50 });
    setMetricsModal(node);
  };

  const openRegister = () => { setRegForm(EMPTY_REG); setRegModal(true); };

  const showToast = (msg, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(''), 3000);
  };

  // ── Push Metrics ───────────────────────────────────────────────────────────
  const submitMetrics = async () => {
    setBusy(true);
    try {
      const res = await fetch('/api/metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ node_id: metricsModal.node_id, ...form }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      showToast(`✓ Metrics pushed for ${metricsModal.hostname}`);
      setMetricsModal(null);
    } catch (err) {
      showToast(err.message, false);
    } finally {
      setBusy(false);
    }
  };

  // ── Register Node ──────────────────────────────────────────────────────────
  const registerNode = async () => {
    if (!regForm.hostname.trim() || !regForm.ip_address.trim()) return;
    setBusy(true);
    try {
      const res = await fetch('/api/nodes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(regForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to register node');
      showToast(`✓ Node "${regForm.hostname}" registered`);
      setRegModal(false);
      fetchNodes();
    } catch (err) {
      showToast(err.message, false);
    } finally {
      setBusy(false);
    }
  };

  const safeNodes = Array.isArray(nodes) ? nodes : [];

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <Navbar />

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-xl text-sm font-medium border transition-all
          ${toast.ok ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-red-500/10 border-red-500/30 text-red-300'}`}>
          {toast.msg}
        </div>
      )}

      <main className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-xs font-semibold text-cyan-500 uppercase tracking-widest mb-1">Infrastructure</p>
            <h1 className="text-2xl font-bold text-white">Nodes</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-400">{safeNodes.length} node{safeNodes.length !== 1 ? 's' : ''}</span>
            <button
              onClick={openRegister}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-semibold transition-colors shadow-lg shadow-cyan-900/30"
            >
              <PlusIcon className="w-4 h-4" />
              Register Node
            </button>
          </div>
        </div>

        {safeNodes.length === 0 ? (
          <div className="text-center py-24">
            <ServerIcon className="w-12 h-12 text-gray-700 mx-auto mb-3" />
            <p className="text-gray-500 mb-4">No nodes registered yet.</p>
            <button
              onClick={openRegister}
              className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-semibold transition-colors"
            >
              Register your first node
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {safeNodes.map(node => (
              <NodeCard key={node.node_id} node={node} onPushMetrics={openMetrics} />
            ))}
          </div>
        )}
      </main>

      {/* Push Metrics Modal */}
      {metricsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
          onClick={e => e.target === e.currentTarget && setMetricsModal(null)}>
          <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-white">Push Metrics</h2>
              <button onClick={() => setMetricsModal(null)} className="text-gray-500 hover:text-gray-300">
                <XIcon className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-gray-400 mb-6">
              Node: <span className="text-cyan-400 font-mono">{metricsModal.hostname}</span>
            </p>

            <div className="space-y-5">
              <MetricSlider label="CPU Usage" value={form.cpu_pct}
                onChange={v => setForm(f => ({ ...f, cpu_pct: v }))} />
              <MetricSlider label="Memory Usage" value={form.memory_pct}
                onChange={v => setForm(f => ({ ...f, memory_pct: v }))} />
              <MetricSlider label="Disk Usage" value={form.disk_pct}
                onChange={v => setForm(f => ({ ...f, disk_pct: v }))} />
            </div>

            <div className="flex gap-3 mt-8">
              <button onClick={() => setMetricsModal(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 transition-colors text-sm font-medium">
                Cancel
              </button>
              <button onClick={submitMetrics} disabled={busy}
                className="flex-1 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-sm font-semibold transition-colors">
                {busy ? 'Pushing…' : 'Push Metrics'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Register Node Modal */}
      {regModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
          onClick={e => e.target === e.currentTarget && setRegModal(false)}>
          <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-white">Register Node</h2>
              <button onClick={() => setRegModal(false)} className="text-gray-500 hover:text-gray-300">
                <XIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
                    Hostname <span className="text-cyan-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={regForm.hostname}
                    onChange={e => setRegForm(f => ({ ...f, hostname: e.target.value }))}
                    placeholder="prod-web-01"
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
                    IP Address <span className="text-cyan-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={regForm.ip_address}
                    onChange={e => setRegForm(f => ({ ...f, ip_address: e.target.value }))}
                    placeholder="10.0.1.10"
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
                    Node Type
                  </label>
                  <select
                    value={regForm.node_type}
                    onChange={e => setRegForm(f => ({ ...f, node_type: e.target.value }))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500/50"
                  >
                    <option value="web">Web</option>
                    <option value="db">Database</option>
                    <option value="cache">Cache</option>
                    <option value="worker">Worker</option>
                    <option value="storage">Storage</option>
                    <option value="gateway">Gateway</option>
                    <option value="monitoring">Monitoring</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
                    Initial Status
                  </label>
                  <select
                    value={regForm.status}
                    onChange={e => setRegForm(f => ({ ...f, status: e.target.value }))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500/50"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
                  Location / Region
                </label>
                <input
                  type="text"
                  value={regForm.location}
                  onChange={e => setRegForm(f => ({ ...f, location: e.target.value }))}
                  placeholder="us-east-1, rack-A3, etc."
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setRegModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 transition-colors text-sm font-medium">
                Cancel
              </button>
              <button
                onClick={registerNode}
                disabled={busy || !regForm.hostname.trim() || !regForm.ip_address.trim()}
                className="flex-1 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-sm font-semibold transition-colors">
                {busy ? 'Registering…' : 'Register Node'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function statusColor(status) {
  switch (status) {
    case 'active':      return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    case 'inactive':    return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    case 'failed':      return 'bg-red-500/10 text-red-400 border-red-500/20';
    case 'maintenance': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
    default:            return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
  }
}

function NodeCard({ node, onPushMetrics }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 flex flex-col gap-4 hover:border-gray-700 transition-colors">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-semibold text-white font-mono text-sm">{node.hostname}</p>
          <p className="text-xs text-gray-500 mt-0.5 font-mono">{node.ip_address}</p>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${statusColor(node.status)}`}>
          {node.status}
        </span>
      </div>

      <div className="flex items-center gap-3 text-xs text-gray-500">
        {node.node_type && (
          <span className="px-2 py-0.5 rounded bg-gray-800 text-gray-400 capitalize">{node.node_type}</span>
        )}
        {node.location && (
          <span className="truncate">{node.location}</span>
        )}
      </div>

      <button
        onClick={() => onPushMetrics(node)}
        className="mt-auto w-full flex items-center justify-center gap-2 py-2 rounded-xl
          bg-cyan-600/10 border border-cyan-600/20 text-cyan-400 text-sm font-medium
          hover:bg-cyan-600/20 hover:border-cyan-500/40 transition-colors">
        <ArrowUpDownIcon className="w-4 h-4" />
        Push Metrics
      </button>
    </div>
  );
}

function MetricSlider({ label, value, onChange }) {
  const color = value >= 90 ? 'text-red-400' : value >= 70 ? 'text-yellow-400' : 'text-emerald-400';
  return (
    <div>
      <div className="flex justify-between items-center mb-1.5">
        <label className="text-sm text-gray-300">{label}</label>
        <span className={`text-sm font-bold font-mono ${color}`}>{value}%</span>
      </div>
      <input
        type="range" min={0} max={100} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full h-2 rounded-full appearance-none cursor-pointer accent-cyan-500 bg-gray-700"
      />
    </div>
  );
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

function ArrowUpDownIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" />
    </svg>
  );
}

function ServerIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-7-4h.01M12 16h.01" />
    </svg>
  );
}