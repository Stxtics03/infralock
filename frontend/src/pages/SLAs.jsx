import { useEffect, useState } from 'react';
import useStore from '../store';
import Navbar from '../components/Navbar';

const STATUS_STYLES = {
  active:   'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
  breached: 'bg-red-500/20 text-red-400 border border-red-500/30',
  expired:  'bg-gray-500/20 text-gray-400 border border-gray-500/30',
};

export default function SLAs() {
  const token = useStore(s => s.token);
  const [slas, setSlas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/slas', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => { setSlas(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [token]);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />
      <div className="p-6 max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center">
            <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Service Level Agreements</h1>
            <p className="text-sm text-gray-400">Uptime targets and breach tracking per client</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Total SLAs</p>
            <p className="text-2xl font-bold text-white">{slas.length}</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Active</p>
            <p className="text-2xl font-bold text-emerald-400">{slas.filter(s => s.status === 'active').length}</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Breached</p>
            <p className="text-2xl font-bold text-red-400">{slas.filter(s => s.breach_count > 0).length}</p>
          </div>
        </div>

        {/* Table */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                {['Client', 'Node', 'Uptime Target', 'Breaches', 'Period Start', 'Period End', 'Status'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-gray-800/50">
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-gray-800 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : slas.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center text-gray-500">No SLAs found</td>
                </tr>
              ) : slas.map(sla => (
                <tr key={sla.sla_id} className="border-b border-gray-800/50 last:border-0 hover:bg-gray-800/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-white">{sla.client_name}</td>
                  <td className="px-4 py-3">
                    <code className="text-xs text-cyan-400 bg-cyan-400/10 px-2 py-0.5 rounded">
                      {sla.hostname ?? '—'}
                    </code>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 max-w-[80px] bg-gray-800 rounded-full h-1.5">
                        <div className="bg-cyan-500 h-1.5 rounded-full" style={{ width: `${sla.uptime_target_pct}%` }} />
                      </div>
                      <span className="text-gray-300 font-mono text-xs">{sla.uptime_target_pct}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`font-mono font-bold ${sla.breach_count > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                      {sla.breach_count}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 font-mono text-xs">
                    {sla.period_start ? new Date(sla.period_start).toLocaleDateString('en-IN', { dateStyle: 'medium' }) : '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-400 font-mono text-xs">
                    {sla.period_end ? new Date(sla.period_end).toLocaleDateString('en-IN', { dateStyle: 'medium' }) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLES[sla.status] || STATUS_STYLES.active}`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />
                      {sla.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}