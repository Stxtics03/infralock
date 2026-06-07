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

  const activeNodes = nodes.filter(n => n.status === 'active').length;
  const openIncidents = incidents.length;

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <main className="p-6 max-w-7xl mx-auto space-y-8">
        <div className="grid grid-cols-4 gap-4">
          <StatCard label="Total Nodes" value={nodes.length} />
          <StatCard label="Active Nodes" value={activeNodes} />
          <StatCard label="Open Incidents" value={openIncidents} />
          <StatCard label="Datacenters" value={datacenters.length} />
        </div>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Active Nodes</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {nodes.map(node => <NodeCard key={node.node_id} node={node} />)}
          </div>
        </section>

        <AnomalyInsights />

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Incidents</h2>
          <IncidentKanban incidents={incidents} />
        </section>
      </main>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
      <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
    </div>
  );
}