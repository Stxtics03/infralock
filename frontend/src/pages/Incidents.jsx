import { useState } from 'react';
import PageLayout from '../components/PageLayout';

const INCIDENTS = [
  { id: 'INC-0041', title: 'NVMe RAID degraded on dc03-r02-s14', body: 'Drive slot 4 reporting I/O errors. RAID array downgraded to degraded mode.', severity: 'critical', node: 'dc03-r02-s14', status: 'open',     ts: '2026-06-09 03:12' },
  { id: 'INC-0040', title: 'High CPU utilisation > 15 min',       body: 'Load average sustained at 47.3. OOM risk. Needs workload rebalancing.',       severity: 'high',     node: 'dc01-r05-s08', status: 'open',     ts: '2026-06-08 22:44' },
  { id: 'INC-0039', title: 'Memory ECC correctable errors',        body: 'DIMM slot B2 producing correctable ECC errors at ~200/sec.',                  severity: 'medium',   node: 'dc02-r01-s22', status: 'open',     ts: '2026-06-08 18:31' },
  { id: 'INC-0038', title: 'eth1 interface flapping',              body: 'Link up/down cycles detected on eth1. Potential cable or transceiver fault.', severity: 'high',     node: 'dc01-r03-s11', status: 'resolved', ts: '2026-06-08 11:05' },
  { id: 'INC-0037', title: 'Scheduled reboot completed',           body: 'Kernel update applied. Node returned to service in 4m 32s.',                  severity: 'ok',       node: 'dc04-r01-s03', status: 'resolved', ts: '2026-06-07 20:00' },
];

const SEVERITY_ORDER = ['critical','high','medium','low','ok'];

const BADGE = {
  critical: { cls: 'badge-crit',    label: 'CRIT' },
  high:     { cls: 'badge-high',    label: 'HIGH' },
  medium:   { cls: 'badge-med',     label: 'MED' },
  low:      { cls: 'badge-low',     label: 'LOW' },
  ok:       { cls: 'badge-ok',      label: 'OK' },
};

const STATUS_BADGE = {
  open:     <span className="badge badge-warn">Open</span>,
  resolved: <span className="badge badge-neutral">Resolved</span>,
};

const FILTERS = ['all', 'open', 'resolved'];

export default function Incidents() {
  const [filter, setFilter]   = useState('all');
  const [severity, setSeverity] = useState('all');

  const visible = INCIDENTS.filter(i => {
    if (filter !== 'all' && i.status !== filter)     return false;
    if (severity !== 'all' && i.severity !== severity) return false;
    return true;
  });

  return (
    <PageLayout
      eyebrow="Operations"
      title="Incidents"
      subtitle={`${INCIDENTS.filter(i => i.status === 'open').length} open · ${INCIDENTS.length} total`}
      actions={
        <button className="btn btn-primary">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M8 2v12M2 8h12" />
          </svg>
          Raise incident
        </button>
      }
    >
      {/* Filter bar */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center' }}>
        <div style={{ display: 'flex', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 6, overflow: 'hidden' }}>
          {FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '6px 14px',
                fontSize: 12,
                fontWeight: 500,
                fontFamily: 'var(--font-ui)',
                border: 'none',
                borderRight: f !== 'resolved' ? '1px solid var(--border)' : 'none',
                background: filter === f ? 'var(--bg-active)' : 'transparent',
                color: filter === f ? 'var(--text-primary)' : 'var(--text-muted)',
                cursor: 'pointer',
                transition: 'background 0.1s, color 0.1s',
                textTransform: 'capitalize',
              }}
            >
              {f}
            </button>
          ))}
        </div>

        <select
          className="form-select"
          value={severity}
          onChange={e => setSeverity(e.target.value)}
          style={{ width: 140 }}
        >
          <option value="all">All severities</option>
          {SEVERITY_ORDER.map(s => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
      </div>

      {/* Incident cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {visible.length === 0 ? (
          <div className="card">
            <div className="empty">
              <p className="empty-title">No incidents match your filters</p>
              <p className="empty-body">Adjust the status or severity filter above.</p>
            </div>
          </div>
        ) : (
          visible.map(inc => {
            const badge = BADGE[inc.severity] ?? BADGE.low;
            return (
              <div
                key={inc.id}
                className="card"
                style={{
                  borderLeft: `3px solid ${
                    inc.severity === 'critical' ? '#ff6b6b'
                    : inc.severity === 'high'   ? 'var(--red)'
                    : inc.severity === 'medium' ? 'var(--amber)'
                    : inc.severity === 'ok'     ? 'var(--emerald)'
                    : 'var(--cyan)'
                  }`,
                }}
              >
                <div style={{ padding: '14px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                        <span className={`badge-severity ${badge.cls}`}>{badge.label}</span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>{inc.id}</span>
                        <span className="chip">{inc.node}</span>
                      </div>
                      <h3 style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 4 }}>{inc.title}</h3>
                      <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{inc.body}</p>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, flexShrink: 0 }}>
                      {STATUS_BADGE[inc.status]}
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>{inc.ts}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </PageLayout>
  );
}
