import { useEffect, useState } from 'react';
import useStore from '../store';
import Navbar from '../components/Navbar';
import NodeCard from '../components/NodeCard';
import IncidentKanban from '../components/IncidentKanban';
import AnomalyInsights from '../components/AnomalyInsights';

const ICONS = {
  nodes: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
    </svg>
  ),
  active: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  incidents: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
  dc: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ),
};

function StatCard({ label, value, icon, accent, trend }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 flex items-center gap-4 hover:border-gray-700 transition-colors">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${accent.bg}`}>
        <span className={accent.text}>{icon}</span>
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">{label}</p>
        <p className={`text-3xl font-bold mt-0.5 ${accent.text}`}>{value}</p>
      </div>
      {trend !== undefined && (
        <div className="ml-auto">
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${
            trend === 'good' ? 'bg-emerald-500/10 text-emerald-400' :
            trend === 'warn' ? 'bg-amber-500/10 text-amber-400' :
            'bg-gray-800 text-gray-500'}`}>
            {trend === 'good' ? '● Online' : trend === 'warn' ? '● Alert' : '● —'}
          </span>
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  const nodes        = useStore(s => s.nodes);
  const incidents    = useStore(s => s.incidents);
  const datacenters  = useStore(s => s.datacenters);
  const user         = useStore(s => s.user);
  const fetchNodes        = useStore(s => s.fetchNodes);
  const fetchIncidents    = useStore(s => s.fetchIncidents);
  const fetchDatacenters  = useStore(s => s.fetchDatacenters);
  const [time, setTime]   = useState(new Date());

  useEffect(() => {
    fetchNodes();
    fetchIncidents();
    fetchDatacenters();
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const totalNodes    = Array.isArray(nodes)      ? nodes.length : 0;
  const activeNodes   = Array.isArray(nodes)      ? nodes.filter(n => n.status === 'active').length : 0;
  const openIncidents = Array.isArray(incidents)  ? incidents.length : 0;
  const dcCount       = Array.isArray(datacenters)? datacenters.length : 0;

  const greeting = () => {
    const h = time.getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <Navbar />
      <main className="p-6 max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 font-medium">
              {greeting()}, <span className="text-cyan-400">{user?.email?.split('@')[0] ?? 'Admin'}</span>
            </p>
            <h1 className="text-2xl font-bold text-white mt-0.5">Infrastructure Overview</h1>
          </div>
          <div className="text-right hidden sm:block">
            <p className="text-xs text-gray-500 uppercase tracking-wider">System Time</p>
            <p className="text-sm font-mono text-cyan-400 mt-0.5">
              {time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </p>
            <p className="text-xs text-gray-600 font-mono">
              {time.toLocaleDateString('en-IN', { dateStyle: 'medium' })}
            </p>
          </div>
        </div>

        {/* Status bar */}
        <div className="flex items-center gap-2 bg-emerald-500/5 border border-emerald-500/20 rounded-xl px-4 py-2.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
          </span>
          <span className="text-xs text-emerald-400 font-medium">All systems operational</span>
          <span className="ml-auto text-xs text-gray-600 font-mono">
            Last updated: {time.toLocaleTimeString('en-IN', { timeStyle: 'short' })}
          </span>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Nodes" value={totalNodes} icon={ICONS.nodes}
            accent={{ bg: 'bg-cyan-500/10', text: 'text-cyan-400' }}
            trend={totalNodes > 0 ? 'good' : 'neutral'}
          />
          <StatCard
            label="Active Nodes" value={activeNodes} icon={ICONS.active}
            accent={{ bg: 'bg-emerald-500/10', text: 'text-emerald-400' }}
            trend={activeNodes === totalNodes ? 'good' : 'warn'}
          />
          <StatCard
            label="Open Incidents" value={openIncidents} icon={ICONS.incidents}
            accent={{ bg: openIncidents > 0 ? 'bg-red-500/10' : 'bg-gray-800', text: openIncidents > 0 ? 'text-red-400' : 'text-gray-400' }}
            trend={openIncidents > 0 ? 'warn' : 'good'}
          />
          <StatCard
            label="Datacenters" value={dcCount} icon={ICONS.dc}
            accent={{ bg: 'bg-violet-500/10', text: 'text-violet-400' }}
          />
        </div>

        {/* Nodes grid */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-white">Node Fleet</h2>
              <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full border border-gray-700">
                {totalNodes} total
              </span>
            </div>
            <a href="/nodes" className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors">
              View all →
            </a>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.isArray(nodes) && nodes.map(node => (
              <NodeCard key={node.node_id} node={node} />
            ))}
            {totalNodes === 0 && (
              <div className="col-span-3 text-center py-12 text-gray-600 text-sm">
                No nodes registered yet
              </div>
            )}
          </div>
        </section>

        {/* Anomaly + Incidents side by side on large screens */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <AnomalyInsights />
          <section className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h2 className="text-base font-semibold text-white">Incidents</h2>
              {openIncidents > 0 && (
                <span className="text-xs bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-full">
                  {openIncidents} open
                </span>
              )}
            </div>
            <IncidentKanban incidents={Array.isArray(incidents) ? incidents : []} />
          </section>
        </div>

      </main>
    </div>
  );
}