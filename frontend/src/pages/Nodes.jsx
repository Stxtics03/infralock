import { useState } from 'react';
import PageLayout from '../components/PageLayout';

const NODES = [
  { id: 'dc01-r01-s01', ip: '10.0.1.11', role: 'Compute', os: 'Ubuntu 22.04', cpu: '4×AMD EPYC 7713', ram: '512 GB', status: 'online',  rack: 'R01' },
  { id: 'dc01-r01-s02', ip: '10.0.1.12', role: 'Compute', os: 'Ubuntu 22.04', cpu: '4×AMD EPYC 7713', ram: '512 GB', status: 'online',  rack: 'R01' },
  { id: 'dc01-r02-s09', ip: '10.0.1.29', role: 'Storage', os: 'Debian 12',    cpu: '2×Intel Xeon Silver', ram: '256 GB', status: 'warning', rack: 'R02' },
  { id: 'dc02-r01-s22', ip: '10.0.2.22', role: 'Compute', os: 'Ubuntu 22.04', cpu: '4×AMD EPYC 7713', ram: '512 GB', status: 'warning', rack: 'R01' },
  { id: 'dc03-r02-s14', ip: '10.0.3.14', role: 'Storage', os: 'Debian 12',    cpu: '2×Intel Xeon Silver', ram: '128 GB', status: 'offline', rack: 'R02' },
  { id: 'dc04-r01-s03', ip: '10.0.4.3',  role: 'Network', os: 'VyOS 1.4',     cpu: '2×Intel Xeon Gold',  ram: '64 GB',  status: 'online',  rack: 'R01' },
];

const STATUS_BADGE = {
  online:  <span className="badge badge-online">Online</span>,
  warning: <span className="badge badge-warn">Warning</span>,
  offline: <span className="badge badge-offline">Offline</span>,
};

export default function Nodes() {
  const [query, setQuery] = useState('');

  const filtered = NODES.filter(n =>
    `${n.id} ${n.ip} ${n.role} ${n.rack}`.toLowerCase().includes(query.toLowerCase())
  );

  const actions = (
    <>
      <input
        className="form-input"
        type="search"
        placeholder="Search nodes…"
        value={query}
        onChange={e => setQuery(e.target.value)}
        style={{ width: 220 }}
        aria-label="Search nodes"
      />
      <button className="btn btn-primary">
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <path d="M8 2v12M2 8h12" />
        </svg>
        Add node
      </button>
    </>
  );

  return (
    <PageLayout
      eyebrow="Infrastructure"
      title="Nodes"
      subtitle={`${NODES.length} nodes registered`}
      actions={actions}
    >
      <div className="card">
        <div className="card-body-flush">
          {filtered.length === 0 ? (
            <div className="empty">
              <p className="empty-title">No nodes match "{query}"</p>
              <p className="empty-body">Try a different hostname, IP, or rack label.</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Node ID</th>
                  <th>IP Address</th>
                  <th>Role</th>
                  <th>CPU</th>
                  <th>RAM</th>
                  <th>OS</th>
                  <th>Rack</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(node => (
                  <tr key={node.id}>
                    <td className="mono" style={{ color: 'var(--cyan)' }}>{node.id}</td>
                    <td><span className="chip">{node.ip}</span></td>
                    <td className="dim">{node.role}</td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{node.cpu}</td>
                    <td className="mono">{node.ram}</td>
                    <td className="dim">{node.os}</td>
                    <td><span className="chip">{node.rack}</span></td>
                    <td>{STATUS_BADGE[node.status]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
