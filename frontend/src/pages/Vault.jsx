import { useState } from 'react';
import PageLayout from '../components/PageLayout';

const OBJECTS = [
  { key: 'backups/dc01-r01-s01/2026-06-08.tar.gz',   size: '4.2 GB', type: 'backup', modified: '2026-06-08 20:00', tags: ['daily'] },
  { key: 'backups/dc01-r02-s09/2026-06-08.tar.gz',   size: '2.1 GB', type: 'backup', modified: '2026-06-08 20:01', tags: ['daily'] },
  { key: 'configs/network/core-switch-01.yaml',       size: '14 KB',  type: 'config', modified: '2026-06-07 11:32', tags: ['network'] },
  { key: 'configs/servers/baseline-ansible.yaml',     size: '38 KB',  type: 'config', modified: '2026-06-05 09:14', tags: [] },
  { key: 'logs/incidents/INC-0041.log',               size: '812 KB', type: 'log',    modified: '2026-06-09 03:30', tags: ['incident'] },
  { key: 'logs/incidents/INC-0040.log',               size: '210 KB', type: 'log',    modified: '2026-06-08 23:10', tags: ['incident'] },
  { key: 'certs/datacenter-root-ca.pem',              size: '1.8 KB', type: 'cert',   modified: '2025-01-01 00:00', tags: ['tls'] },
  { key: 'reports/sla/2026-05-monthly.pdf',           size: '740 KB', type: 'report', modified: '2026-06-01 06:00', tags: ['sla'] },
];

const TYPE_COLOR = {
  backup: 'var(--purple)',
  config: 'var(--cyan)',
  log:    'var(--amber)',
  cert:   'var(--emerald)',
  report: 'var(--text-secondary)',
};

const FileIcon = ({ type }) => {
  const color = TYPE_COLOR[type] ?? 'var(--text-muted)';
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      style={{ width: 15, height: 15, flexShrink: 0 }}>
      <path d="M3 2h7l3 3v9H3V2z" />
      <path d="M10 2v3h3" />
    </svg>
  );
};

export default function Vault() {
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const types = ['all', ...new Set(OBJECTS.map(o => o.type))];

  const filtered = OBJECTS.filter(o => {
    if (typeFilter !== 'all' && o.type !== typeFilter) return false;
    if (query && !o.key.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  return (
    <PageLayout
      eyebrow="Storage"
      title="Vault"
      subtitle="MinIO object store · infralock-vault"
      actions={
        <>
          <input
            className="form-input"
            type="search"
            placeholder="Filter objects…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            style={{ width: 220 }}
            aria-label="Filter objects"
          />
          <button className="btn btn-primary">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 2v8M4 7l4 4 4-4" />
              <path d="M2 13h12" />
            </svg>
            Upload
          </button>
        </>
      }
    >
      {/* Type filters */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        {types.map(t => (
          <button
            key={t}
            onClick={() => setTypeFilter(t)}
            style={{
              padding: '4px 12px',
              borderRadius: 100,
              fontSize: 12,
              fontWeight: 500,
              fontFamily: 'var(--font-ui)',
              border: `1px solid ${typeFilter === t ? 'var(--border-hi)' : 'var(--border)'}`,
              background: typeFilter === t ? 'var(--bg-active)' : 'transparent',
              color: typeFilter === t ? 'var(--text-primary)' : 'var(--text-muted)',
              cursor: 'pointer',
              transition: 'all 0.1s',
              textTransform: t === 'all' ? 'none' : 'capitalize',
            }}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="card">
        <div className="card-body-flush">
          {filtered.length === 0 ? (
            <div className="empty">
              <p className="empty-title">No objects found</p>
              <p className="empty-body">Try a different search term or type filter.</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Object key</th>
                  <th>Type</th>
                  <th>Size</th>
                  <th>Modified</th>
                  <th>Tags</th>
                  <th style={{ width: 80 }}></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(obj => (
                  <tr key={obj.key}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <FileIcon type={obj.type} />
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-secondary)' }}>
                          {obj.key}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 11,
                        color: TYPE_COLOR[obj.type] ?? 'var(--text-muted)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}>{obj.type}</span>
                    </td>
                    <td className="mono">{obj.size}</td>
                    <td className="mono">{obj.modified}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {obj.tags.map(tag => (
                          <span key={tag} className="chip">{tag}</span>
                        ))}
                      </div>
                    </td>
                    <td>
                      <button className="btn btn-ghost btn-sm">
                        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 13, height: 13 }}>
                          <path d="M8 8v6M4 11l4 4 4-4" />
                          <path d="M11.5 7A4 4 0 104 8.5" />
                        </svg>
                        Get
                      </button>
                    </td>
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
