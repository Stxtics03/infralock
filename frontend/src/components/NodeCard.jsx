import { Link } from 'react-router-dom';

function statusColor(status) {
  switch (status) {
    case 'active':   return { badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', dot: 'bg-emerald-400' };
    case 'inactive': return { badge: 'bg-gray-500/10  text-gray-400  border-gray-500/20',  dot: 'bg-gray-500'  };
    case 'failed':   return { badge: 'bg-red-500/10   text-red-400   border-red-500/20',   dot: 'bg-red-400'   };
    default:         return { badge: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20', dot: 'bg-yellow-400' };
  }
}

export default function NodeCard({ node }) {
  const { badge, dot } = statusColor(node.status);

  return (
    <Link
      to={`/nodes/${node.node_id}`}
      className="block bg-gray-900 border border-gray-800 rounded-2xl p-5 hover:border-cyan-600/40 hover:shadow-lg hover:shadow-cyan-900/10 transition-all group"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${dot}`} />
          <span className="font-semibold text-white text-sm font-mono group-hover:text-cyan-300 transition-colors">
            {node.hostname}
          </span>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${badge}`}>
          {node.status}
        </span>
      </div>

      {/* Meta */}
      <p className="text-xs text-gray-500 font-mono mb-0.5">{node.ip_address}</p>
      <p className="text-xs text-gray-600 mb-4">
        {[node.rack_label, node.dc_name].filter(Boolean).join(' — ') || 'No rack assigned'}
      </p>

      {/* Specs */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-gray-800/60 rounded-lg py-2">
          <p className="text-[10px] text-gray-500 uppercase tracking-wide">CPU</p>
          <p className="text-sm font-semibold text-gray-200">{node.cpu_cores ?? '—'}<span className="text-xs text-gray-500">c</span></p>
        </div>
        <div className="bg-gray-800/60 rounded-lg py-2">
          <p className="text-[10px] text-gray-500 uppercase tracking-wide">RAM</p>
          <p className="text-sm font-semibold text-gray-200">{node.ram_gb ?? '—'}<span className="text-xs text-gray-500">GB</span></p>
        </div>
        <div className="bg-gray-800/60 rounded-lg py-2">
          <p className="text-[10px] text-gray-500 uppercase tracking-wide">Disk</p>
          <p className="text-sm font-semibold text-gray-200">{node.storage_tb ?? '—'}<span className="text-xs text-gray-500">TB</span></p>
        </div>
      </div>

      <p className="text-xs text-gray-600 mt-3 text-right group-hover:text-cyan-600 transition-colors">View details →</p>
    </Link>
  );
}
