import PageLayout from '../components/PageLayout';

const SLAS = [
  { id: 'SLA-COMP-GOLD',   name: 'Compute — Gold',    tier: 'GOLD',   target: 99.9,  uptime: 99.98, nodes: 24, window: '30d', status: 'ok' },
  { id: 'SLA-STOR-SILV',   name: 'Storage — Silver',  tier: 'SILVER', target: 99.5,  uptime: 99.72, nodes: 12, window: '30d', status: 'ok' },
  { id: 'SLA-NET-PLAT',    name: 'Network — Platinum', tier: 'PLAT',  target: 99.5,  uptime: 99.12, nodes: 8,  window: '30d', status: 'warn' },
  { id: 'SLA-BACK-BRON',   name: 'Backup — Bronze',   tier: 'BRONZE', target: 99.0,  uptime: 98.80, nodes: 6,  window: '30d', status: 'warn' },
  { id: 'SLA-MGMT-STD',    name: 'Management — Std',  tier: 'STD',    target: 98.0,  uptime: 99.50, nodes: 4,  window: '30d', status: 'ok' },
];

const TIER_COLOR = {
  GOLD:   'var(--amber)',
  PLAT:   'var(--cyan)',
  SILVER: 'var(--text-secondary)',
  BRONZE: '#b87333',
  STD:    'var(--text-muted)',
};

export default function SLAs() {
  const compliant = SLAS.filter(s => s.status === 'ok').length;

  return (
    <PageLayout
      eyebrow="Contracts"
      title="SLA Management"
      subtitle={`${compliant} of ${SLAS.length} contracts within target`}
      actions={
        <button className="btn btn-primary">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M8 2v12M2 8h12" />
          </svg>
          New SLA
        </button>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {SLAS.map(sla => {
          const delta   = (sla.uptime - sla.target).toFixed(2);
          const passing = sla.status === 'ok';
          const barW    = Math.min((sla.uptime / 100) * 100, 100);
          const targetW = Math.min((sla.target / 100) * 100, 100);

          return (
            <div key={sla.id} className="card">
              <div style={{ padding: '18px 22px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                      <span style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 10,
                        fontWeight: 500,
                        color: TIER_COLOR[sla.tier] ?? 'var(--text-muted)',
                        background: 'var(--bg-raised)',
                        border: '1px solid var(--border)',
                        borderRadius: 4,
                        padding: '2px 7px',
                        letterSpacing: '0.06em',
                      }}>{sla.tier}</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>{sla.id}</span>
                    </div>
                    <h3 style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-primary)' }}>{sla.name}</h3>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                      {sla.nodes} nodes · {sla.window} window
                    </p>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <p style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 24,
                      fontWeight: 600,
                      color: passing ? 'var(--emerald)' : 'var(--amber)',
                      lineHeight: 1,
                    }}>
                      {sla.uptime}%
                    </p>
                    <p style={{ fontSize: 12, color: passing ? 'var(--emerald-dim)' : 'var(--amber-dim)', marginTop: 4 }}>
                      {passing ? '+' : ''}{delta}% vs target
                    </p>
                  </div>
                </div>

                {/* Uptime bar with target marker */}
                <div style={{ position: 'relative', height: 8, background: 'var(--bg-raised)', borderRadius: 4, overflow: 'visible' }}>
                  {/* Fill */}
                  <div style={{
                    position: 'absolute', top: 0, left: 0,
                    height: '100%',
                    width: `${barW}%`,
                    background: passing ? 'var(--emerald)' : 'var(--amber)',
                    borderRadius: 4,
                    transition: 'width 0.8s ease',
                  }} />
                  {/* Target marker */}
                  <div style={{
                    position: 'absolute',
                    top: -3, bottom: -3,
                    left: `${targetW}%`,
                    width: 2,
                    background: 'var(--border-hi)',
                    borderRadius: 1,
                  }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  <span>0%</span>
                  <span>Target: {sla.target}%</span>
                  <span>100%</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </PageLayout>
  );
}
