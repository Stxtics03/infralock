export default function NodeCard({ node }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium text-gray-900">{node.hostname}</span>
        <span className={`text-xs px-2 py-0.5 rounded-full ${
          node.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>{node.status}</span>
      </div>
      <p className="text-xs text-gray-500">{node.ip_address}</p>
      <p className="text-xs text-gray-500">{node.rack_label} — {node.dc_name}</p>
      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        <div><p className="text-xs text-gray-400">CPU</p><p className="text-sm font-medium">{node.cpu_cores}c</p></div>
        <div><p className="text-xs text-gray-400">RAM</p><p className="text-sm font-medium">{node.ram_gb}GB</p></div>
        <div><p className="text-xs text-gray-400">Storage</p><p className="text-sm font-medium">{node.storage_tb}TB</p></div>
      </div>
    </div>
  );
}
