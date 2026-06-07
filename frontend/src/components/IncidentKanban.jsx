const severityColors = {
  P1: 'border-red-400 bg-red-50',
  P2: 'border-orange-400 bg-orange-50',
  P3: 'border-amber-400 bg-amber-50',
  P4: 'border-blue-400 bg-blue-50',
};

const columns = ['P1', 'P2', 'P3', 'P4'];

export default function IncidentKanban({ incidents }) {
  return (
    <div className="grid grid-cols-4 gap-4">
      {columns.map(severity => (
        <div key={severity} className="bg-gray-50 rounded-xl p-3">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">{severity}</h3>
          <div className="space-y-2">
            {incidents
              .filter(i => i.severity === severity)
              .map(incident => (
                <div
                  key={incident.incident_id}
                  className={`border-l-4 rounded-lg p-3 shadow-sm ${severityColors[severity]}`}
                >
                  <p className="text-sm font-medium text-gray-900">{incident.title}</p>
                  <p className="text-xs text-gray-500 mt-1">{incident.node_hostname ?? 'No node'}</p>
                  <p className="text-xs text-gray-400 mt-1">{incident.status}</p>
                </div>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}
