const SEVERITY = {
  P1: { col: 'border-l-red-500',    bg: 'bg-red-500/5',    badge: 'text-red-400 bg-red-500/10 border-red-500/20'    },
  P2: { col: 'border-l-orange-500', bg: 'bg-orange-500/5', badge: 'text-orange-400 bg-orange-500/10 border-orange-500/20' },
  P3: { col: 'border-l-amber-500',  bg: 'bg-amber-500/5',  badge: 'text-amber-400 bg-amber-500/10 border-amber-500/20'  },
  P4: { col: 'border-l-sky-500',    bg: 'bg-sky-500/5',    badge: 'text-sky-400 bg-sky-500/10 border-sky-500/20'    },
};

const columns = ['P1', 'P2', 'P3', 'P4'];

export default function IncidentKanban({ incidents }) {
  const safe = Array.isArray(incidents) ? incidents : [];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {columns.map(severity => {
        const items = safe.filter(i => i.severity === severity);
        const theme = SEVERITY[severity];
        return (
          <div key={severity} className="bg-gray-900 border border-gray-800 rounded-2xl p-3">
            <div className="flex items-center justify-between mb-3">
              <h3 className={`text-xs font-bold uppercase tracking-widest ${theme.badge.split(' ')[0]}`}>
                {severity}
              </h3>
              <span className={`text-xs px-2 py-0.5 rounded-full border font-mono font-semibold ${theme.badge}`}>
                {items.length}
              </span>
            </div>
            <div className="space-y-2">
              {items.length === 0 && (
                <p className="text-xs text-gray-600 text-center py-4">No incidents</p>
              )}
              {items.map(incident => (
                <div
                  key={incident.incident_id}
                  className={`border-l-2 ${theme.col} ${theme.bg} rounded-lg p-3`}
                >
                  <p className="text-sm font-medium text-gray-100 leading-snug">{incident.title}</p>
                  <p className="text-xs text-gray-500 mt-1">{incident.node_hostname ?? 'No node'}</p>
                  <span className={`inline-block mt-2 text-[10px] px-2 py-0.5 rounded-full border font-semibold uppercase ${theme.badge}`}>
                    {incident.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
