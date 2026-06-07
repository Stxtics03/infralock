import { useEffect } from 'react';
import useStore from '../store';
import Navbar from '../components/Navbar';
import IncidentKanban from '../components/IncidentKanban';

export default function Incidents() {
  const incidents = useStore(s => s.incidents);
  const fetchIncidents = useStore(s => s.fetchIncidents);

  useEffect(() => { fetchIncidents(); }, [fetchIncidents]);

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <main className="p-6 max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Incidents</h1>
        <IncidentKanban incidents={incidents} />
      </main>
    </div>
  );
}
