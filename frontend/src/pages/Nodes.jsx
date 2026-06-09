import { useEffect, useState } from 'react';
import useStore from '../store';
import Navbar from '../components/Navbar';

export default function Nodes() {
  const nodes      = useStore(s => s.nodes);
  const token      = useStore(s => s.token);
  const fetchNodes = useStore(s => s.fetchNodes);

  const [modal, setModal]     = useState(null);   // node object
  const [form,  setForm]      = useState({ cpu_pct: 50, memory_pct: 50, disk_pct: 50 });
  const [busy,  setBusy]      = useState(false);
  const [toast, setToast]     = useState('');

  useEffect(() => { fetchNodes(); }, [fetchNodes]);

  const openModal = (node) => {
    setForm({ cpu_pct: 50, memory_pct: 50, disk_pct: 50 });
    setModal(node);
  };

  const showToast = (msg, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(''), 3000);
  };

  const submitMetrics = async () => {
    setBusy(true);
    try {
      const res = await fetch('/api/metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ node_id: modal.node_id, ...form }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      showToast(`✓ Metrics pushed for ${modal.hostname}`);
      setModal(null);
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
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-xs font-semibold text-cyan-500 uppercase tracking-widest mb-1">Infrastructure</p>
            <h1 className="text-2xl font-bold text-white">Nodes</h1>
          </div>
          <span className="text-sm text-gray-400">{safeNodes.length} node{safeNodes.length !== 1 ? 's' : ''}</span>
        </div>

        {safeNodes.length === 0 ? (
          <div className="text-center py-24 text-gray-500">No nodes found.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {safeNodes.map(node => (
              <NodeCard key={node.node_id} node={node} onPushMetrics={openModal} />
            ))}
          </div>
        )}
      </main>

      {/* Push Metrics Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
          onClick={(e) => e.target === e.currentTarget && setModal(null)}>
          <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-white mb-1">Push Metrics</h2>
            <p className="text-sm text-gray-400 mb-6">
              Node: <span className="text-cyan-400 font-mono">{modal.hostname}</span>
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
              <button
                onClick={() => setModal(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 transition-colors text-sm font-medium">
                Cancel
              </button>
              <button
                onClick={submitMetrics}
                disabled={busy}
                className="flex-1 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-sm font-semibold transition-colors">
                {busy ? 'Pushing…' : 'Push Metrics'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function statusColor(status) {
  switch (status) {
    case 'active':   return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    case 'inactive': return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    case 'failed':   return 'bg-red-500/10 text-red-400 border-red-500/20';
    default:         return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
  }
}

function NodeCard({ node, onPushMetrics }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 flex flex-col gap-4 hover:border-gray-700 transition-colors">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-semibold text-white font-mono text-sm">{node.hostname}</p>
          <p className="text-xs text-gray-500 mt-0.5">{node.ip_address}</p>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${statusColor(node.status)}`}>
          {node.status}
        </span>
      </div>

      {node.node_type && (
        <p className="text-xs text-gray-400">
          Type: <span className="text-gray-200">{node.node_type}</span>
        </p>
      )}

      <button
        onClick={() => onPushMetrics(node)}
        className="mt-auto w-full flex items-center justify-center gap-2 py-2 rounded-xl
          bg-cyan-600/10 border border-cyan-600/20 text-cyan-400 text-sm font-medium
          hover:bg-cyan-600/20 hover:border-cyan-500/40 transition-colors">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" />
        </svg>
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
