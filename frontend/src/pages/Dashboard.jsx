import { useEffect } from 'react';
import useStore from '../store';
import Navbar from '../components/Navbar';
import NodeCard from '../components/NodeCard';
import IncidentKanban from '../components/IncidentKanban';
import AnomalyInsights from '../components/AnomalyInsights';

export default function Dashboard() {
  const nodes = useStore(s => s.nodes);
  const incidents = useStore(s => s.incidents);
  const datacenters = useStore(s => s.datacenters);
  const fetchNodes = useStore(s => s.fetchNodes);
  const fetchIncidents = useStore(s => s.fetchIncidents);
  const fetchDatacenters = useStore(s => s.fetchDatacenters);

  useEffect(() => {
    fetchNodes();
    fetchIncidents();
    fetchDatacenters();
  }, [fetchNodes, fetchIncidents, fetchDatacenters]);

  const activeNodes  = Array.isArray(nodes)      ? nodes.filter(n => n.status === 'active').length : 0;
  const openIncidents = Array.isArray(incidents)   ? incidents.length : 0;
  const dcCount       = Array.isArray(datacenters) ? datacenters.length : 0;

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <Navbar />
      <main className="p-6 max-w-7xl mx-auto space-y-8">
        <div className="grid grid-cols-4 gap-4">
          <StatCard label="Total Nodes"    value={Array.isArray(nodes) ? nodes.length : 0} />
          <StatCard label="Active Nodes"   value={activeNodes} />
          <StatCard label="Open Incidents" value={openIncidents} />
          <StatCard label="Datacenters"    value={dcCount} />
        </div>

        <section>
          <h2 className="text-lg font-semibold text-gray-100 mb-4">Active Nodes</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.isArray(nodes) && nodes.map(node => <NodeCard key={node.node_id} node={node} />)}
          </div>
        </section>

        <AnomalyInsights />

        <section>
          <h2 className="text-lg font-semibold text-gray-100 mb-4">Incidents</h2>
          <IncidentKanban incidents={Array.isArray(incidents) ? incidents : []} />
        </section>
      </main>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 shadow-sm">
      <p className="text-xs text-gray-400 uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold text-cyan-400 mt-1">{value}</p>
    </div>
  );
}