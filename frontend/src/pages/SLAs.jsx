import { useEffect, useState } from 'react';
import useStore from '../store';
import Navbar from '../components/Navbar';

export default function SLAs() {
  const token = useStore(s => s.token);
  const [slas, setSlas] = useState([]);

  useEffect(() => {
    fetch('/api/slas', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(setSlas)
      .catch(() => setSlas([]));
  }, [token]);

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <main className="p-6 max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">SLAs</h1>
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left px-4 py-3">Client</th>
                <th className="text-left px-4 py-3">Hostname</th>
                <th className="text-left px-4 py-3">Target</th>
                <th className="text-left px-4 py-3">Breaches</th>
                <th className="text-left px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {slas.map(sla => (
                <tr key={sla.sla_id} className="border-t border-gray-100">
                  <td className="px-4 py-3">{sla.client_name}</td>
                  <td className="px-4 py-3">{sla.hostname ?? '—'}</td>
                  <td className="px-4 py-3">{sla.uptime_target_pct}%</td>
                  <td className="px-4 py-3">{sla.breach_count}</td>
                  <td className="px-4 py-3">{sla.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
