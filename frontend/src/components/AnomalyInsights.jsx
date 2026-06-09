import { useEffect } from 'react';
import useStore from '../store';
import AnomalySeverityBadge from './AnomalySeverityBadge';

function getPulseDot(anomalies) {
  if (!Array.isArray(anomalies)) return null;
  if (anomalies.some(a => a.severity === 'critical')) {
    return (
      <span className="relative flex h-2.5 w-2.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
      </span>
    );
  }
  if (anomalies.some(a => a.severity === 'medium')) {
    return (
      <span className="relative flex h-2.5 w-2.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-amber-400" />
      </span>
    );
  }
  return <span className="relative flex h-2.5 w-2.5"><span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" /></span>;
}

export default function AnomalyInsights() {
  const { anomalies, summary, loading, error, fetchAnomalies, fetchSummary, resolveAnomaly } = useStore();

  useEffect(() => {
    fetchAnomalies();
    fetchSummary();
    const interval = setInterval(() => {
      fetchAnomalies();
      fetchSummary();
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const safeAnomalies = Array.isArray(anomalies) ? anomalies : [];
  const safeSummary   = Array.isArray(summary)   ? summary   : [];

  const criticalCount = safeAnomalies.filter(a => a.severity === 'critical').length;
  const mediumCount   = safeAnomalies.filter(a => a.severity === 'medium').length;
  const lowCount      = safeAnomalies.filter(a => a.severity === 'low').length;

  return (
    <section className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full">

      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
          <svg className="w-4 h-4 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold text-white">AI Anomaly Insights</h2>
          {getPulseDot(safeAnomalies)}
        </div>
        {loading && <span className="ml-auto text-xs text-gray-500 animate-pulse">Refreshing…</span>}
      </div>

      {/* Stat chips */}
      <div className="flex gap-3 mb-5">
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
          <span className="text-xs text-red-400 font-medium">Critical</span>
          <span className="text-sm font-bold text-red-300">{criticalCount}</span>
        </div>
        <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2">
          <span className="text-xs text-amber-400 font-medium">Medium</span>
          <span className="text-sm font-bold text-amber-300">{mediumCount}</span>
        </div>
        <div className="flex items-center gap-2 bg-sky-500/10 border border-sky-500/20 rounded-xl px-3 py-2">
          <span className="text-xs text-sky-400 font-medium">Low</span>
          <span className="text-sm font-bold text-sky-300">{lowCount}</span>
        </div>
      </div>

      {/* Error */}
      {error && !loading && (
        <div className="flex items-center gap-2 text-sm text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 mb-4">
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Failed to load anomalies.</span>
          <button onClick={() => { fetchAnomalies(); fetchSummary(); }}
            className="ml-auto underline hover:text-amber-300 text-xs">Retry</button>
        </div>
      )}

      {/* Loading skeletons */}
      {loading && safeAnomalies.length === 0 && (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-10 bg-gray-800 rounded-xl animate-pulse" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && safeAnomalies.length === 0 && (
        <div className="text-center py-10 text-gray-500 text-sm">
          <span className="text-2xl block mb-2">✅</span>
          No anomalies detected in the last 24 hours
        </div>
      )}

      {/* Table */}
      {safeAnomalies.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-gray-800">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-gray-800 text-[11px] text-gray-500 uppercase tracking-widest">
                <th className="pb-3 pt-3 px-4">Node</th>
                <th className="pb-3 pt-3 px-4">Metric</th>
                <th className="pb-3 pt-3 px-4">Z-Score</th>
                <th className="pb-3 pt-3 px-4">Severity</th>
                <th className="pb-3 pt-3 px-4">Detected</th>
                <th className="pb-3 pt-3 px-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60">
              {safeAnomalies.map(a => (
                <tr key={a.anomaly_id} className="hover:bg-gray-800/40 transition-colors">
                  <td className="py-3 px-4 font-mono text-xs text-cyan-400">
                    {safeSummary.find(s => s.node_id === a.node_id)?.hostname ?? `node-${a.node_id}`}
                  </td>
                  <td className="py-3 px-4 uppercase text-xs font-medium text-gray-300">{a.metric_type}</td>
                  <td className="py-3 px-4 font-mono text-xs text-gray-400">{parseFloat(a.z_score).toFixed(2)}</td>
                  <td className="py-3 px-4"><AnomalySeverityBadge severity={a.severity} /></td>
                  <td className="py-3 px-4 text-xs text-gray-500 whitespace-nowrap">
                    {new Date(a.detected_at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                  </td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => resolveAnomaly(a.anomaly_id)}
                      className="text-xs text-violet-400 hover:text-violet-300 font-medium hover:underline transition-colors"
                    >
                      Resolve
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}