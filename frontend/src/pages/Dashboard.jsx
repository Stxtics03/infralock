import PageLayout from '../components/PageLayout';

/* ─── Demo data ─── replace with real API calls via useEffect / react-query */
const stats = [
  { label: 'Total Nodes',     value: '48',    meta: '3 provisioning',  accent: 'cyan' },
  { label: 'Online',          value: '44',    meta: '91.7% healthy',   accent: 'emerald' },
  { label: 'Open Incidents',  value: '7',     meta: '2 critical',      accent: 'red' },
  { label: 'SLA Compliance',  value: '99.1%', meta: 'Last 30 days',    accent: 'amber' },
  { label: 'Vault Objects',   value: '312',   meta: '14.2 GB stored',  accent: 'purple' },
];

const recentIncidents = [
  { id: 'INC-0041', title: 'NVMe RAID degraded on node dc03-r02-s14', severity: 'critical', node: 'dc03-r02-s14', ts: '09 Jun 03:12' },
  { id: 'INC-0040', title: 'High CPU utilisation sustained > 15 min', severity: 'high',     node: 'dc01-r05-s08', ts: '08 Jun 22:44' },
  { id: 'INC-0039', title: 'Memory ECC correctable errors spiking',    severity: 'medium',   node: 'dc02-r01-s22', ts: '08 Jun 18:31' },
  { id: 'INC-0038', title: 'Network interface flapping — eth1',        severity: 'high',     node: 'dc01-r03-s11', ts: '08 Jun 11:05' },
  { id: 'INC-0037', title: 'Scheduled reboot completed successfully',  severity: 'ok',       node: 'dc04-r01-s03', ts: '07 Jun 20:00' },
];

const slaHealth = [
  { name: 'COMPUTE-GOLD',    uptime: 99.98, target: 99.9,  status: 'ok' },
  { name: 'STORAGE-SILVER',  uptime: 99.72, target: 99.5,  status: 'ok' },
  { name: 'NETWORK-PLAT',    uptime: 99.12, target: 99.5,  status: 'warn' },
  { name: 'BACKUP-BRONZE',   uptime: 98.80, target: 99.0,  status: 'warn' },
];

const SEVERITY_BADGE = {
  critical: <span className="badge-severity badge-crit">CRIT</span>,
  high:     <span className="badge-severity badge-high">HIGH</span>,
  medium:   <span className="badge-severity badge-med">MED</span>,
  low:      <span className="badge-severity badge-low">LOW</span>,
  ok:       <span className="badge-severity badge-ok">OK</span>,
};

export default function Dashboard() {
  return (
    <PageLayout eyebrow="Overview" title="Dashboard">

      {/* ── Stat strip ── */}
      <div className="stat-grid">
        {stats.map(s => (
          <div key={s.label} className={`stat-card ${s.accent}`}>
            <p className="stat-label">{s.label}</p>
            <p className="stat-value">{s.value}</p>
            <p className="stat-meta">{s.meta}</p>
          </div>
        ))}
      </div>

      {/* ── Two-col lower section ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16 }}>

        {/* Recent incidents */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Recent Incidents</span>
            <a href="/incidents" className="btn btn-ghost btn-sm" style={{ textDecoration: 'none' }}>
              View all
            </a>
          </div>
          <div className="card-body-flush">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Description</th>
                  <th>Node</th>
                  <th>Severity</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {recentIncidents.map(inc => (
                  <tr key={inc.id}>
                    <td className="mono">{inc.id}</td>
                    <td style={{ maxWidth: 320, color: 'var(--text-secondary)', fontSize: 13 }}>
                      {inc.title}
                    </td>
                    <td><span className="chip">{inc.node}</span></td>
                    <td>{SEVERITY_BADGE[inc.severity]}</td>
                    <td className="mono">{inc.ts}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* SLA health */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">SLA Health</span>
          </div>
          <div className="card-body">
            {slaHealth.map(sla => {
              const pct = ((sla.uptime / 100) * 100).toFixed(0);
              const ok  = sla.status === 'ok';
              return (
                <div key={sla.name} style={{ marginBottom: 18 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                      {sla.name}
                    </span>
                    <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: ok ? 'var(--emerald)' : 'var(--amber)' }}>
                      {sla.uptime}%
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div style={{ background: 'var(--bg-raised)', height: 4, borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${Math.min(sla.uptime, 100)}%`,
                      background: ok ? 'var(--emerald)' : 'var(--amber)',
                      borderRadius: 2,
                      transition: 'width 0.6s ease',
                    }} />
                  </div>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                    Target {sla.target}%
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
