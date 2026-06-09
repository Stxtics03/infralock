import { useEffect } from 'react';
import useStore from '../store';
import Navbar from '../components/Navbar';
import NodeCard from '../components/NodeCard';

export default function Nodes() {
  const nodes = useStore(s => s.nodes);
  const fetchNodes = useStore(s => s.fetchNodes);

  useEffect(() => { fetchNodes(); }, [fetchNodes]);

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <main className="p-6 max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Nodes</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {nodes.map(node => <NodeCard key={node.node_id} node={node} />)}
        </div>
      </main>
    </div>
  );
}
