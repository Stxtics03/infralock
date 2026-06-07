import { useEffect } from 'react';
import useStore from '../store';
import AnomalySeverityBadge from './AnomalySeverityBadge';

function getPulseDot(anomalies) {
  if (anomalies.some(a => a.severity === 'critical')) {
    return <span className="relative flex h-3 w-3">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
      <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500" />
    </span>;
  }
  if (anomalies.some(a => a.severity === 'medium')) {
    return <span className="relative flex h-3 w-3">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
      <span className="relative inline-flex h-3 w-3 rounded-full bg-amber-400" />
    </span>;
  }
  return <span className="relative flex h-3 w-3">
    <span className="relative inline-flex h-3 w-3 rounded-full bg-green-400" />
  </span>;
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

  const criticalCount = anomalies.filter(a => a.severity === 'critical').length;
  const mediumCount   = anomalies.filter(a => a.severity === 'medium').length;
  const lowCount      = anomalies.filter(a => a.severity === 'low').length;

  return (
    <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 w-full">

      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-lg font-semibold text-gray-800">AI Insights</h2>
        {getPulseDot(anomalies)}
      </div>

      {/* Stat chips */}
      <div className="flex gap-3 mb-5">
        <div className="flex items-center gap-1.5 bg-red-50 border border-red-200 rounded-lg px-3 py-1.5">
          <span className="text-xs text-red-600 font-medium">Critical</span>
          <span className="text-sm font-bold text-red-700">{criticalCount}</span>
        </div>
        <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5">
          <span className="text-xs text-amber-600 font-medium">Medium</span>
          <span className="text-sm font-bold text-amber-700">{mediumCount}</span>
        </div>
        <div className="flex items-center gap-1.5 bg-blue-50 border border-blue-200 rounded-lg px-3 py-1.5">
          <span className="text-xs text-blue-600 font-medium">Low</span>
          <span className="text-sm font-bold text-blue-700">{lowCount}</span>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="text-sm text-red-600 flex items-center gap-2">
          <span>Failed to load anomalies.</span>
          <button onClick={() => { fetchAnomalies(); fetchSummary(); }}
            className="underline text-red-700 hover:text-red-900">
            Retry
          </button>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && anomalies.length === 0 && (
        <div className="text-center py-8 text-gray-400 text-sm">
          ✅ No anomalies detected in the last 24 hours
        </div>
      )}

      {/* Table */}
      {!loading && !error && anomalies.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-gray-100 text-xs text-gray-500 uppercase tracking-wide">
                <th className="pb-2 pr-4">Node</th>
                <th className="pb-2 pr-4">Metric</th>
                <th className="pb-2 pr-4">Z-Score</th>
                <th className="pb-2 pr-4">Severity</th>
                <th className="pb-2 pr-4">Detected</th>
                <th className="pb-2">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {anomalies.map(a => (
                <tr key={a.anomaly_id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-2.5 pr-4 font-mono text-xs text-gray-700">
                    {summary.find(s => s.node_id === a.node_id)?.hostname ?? `node-${a.node_id}`}
                  </td>
                  <td className="py-2.5 pr-4 uppercase text-xs font-medium text-gray-600">
                    {a.metric_type}
                  </td>
                  <td className="py-2.5 pr-4 font-mono text-xs">
                    {parseFloat(a.z_score).toFixed(2)}
                  </td>
                  <td className="py-2.5 pr-4">
                    <AnomalySeverityBadge severity={a.severity} />
                  </td>
                  <td className="py-2.5 pr-4 text-xs text-gray-500">
                    {new Date(a.detected_at).toLocaleString()}
                  </td>
                  <td className="py-2.5">
                    <button
                      onClick={() => resolveAnomaly(a.anomaly_id)}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-medium hover:underline"
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