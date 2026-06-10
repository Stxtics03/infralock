import { useEffect, useState, useCallback } from 'react';
import useStore from '../store';
import Navbar from '../components/Navbar';

const OP_STYLES = {
  INSERT: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  UPDATE: 'bg-amber-500/10  text-amber-400  border-amber-500/20',
  DELETE: 'bg-red-500/10    text-red-400    border-red-500/20',
};

export default function AuditLog() {
  const token = useStore(s => s.token);

  const [logs,     setLogs]     = useState([]);
  const [total,    setTotal]    = useState(0);
  const [pages,    setPages]    = useState(1);
  const [page,     setPage]     = useState(1);
  const [tables,   setTables]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [expanded, setExpanded] = useState(null);

  const [filters, setFilters] = useState({
    user: '', table_name: '', operation: '', date_from: '', date_to: '',
  });
  const [applied, setApplied] = useState(filters);

  const setFilter = (k, v) => setFilters(f => ({ ...f, [k]: v }));

  const fetchLogs = useCallback(async (f = applied, p = page) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: p, limit: 20 });
      if (f.user)       params.set('user',       f.user);
      if (f.table_name) params.set('table_name', f.table_name);
      if (f.operation)  params.set('operation',  f.operation);
      if (f.date_from)  params.set('date_from',  f.date_from);
      if (f.date_to)    params.set('date_to',    f.date_to);

      const res  = await fetch(`/api/audit-log?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setLogs(data.logs   || []);
      setTotal(data.total || 0);
      setPages(data.pages || 1);
      if (data.meta?.tables) setTables(data.meta.tables);
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [token, applied, page]);

  useEffect(() => { fetchLogs(applied, page); }, [page]);   // eslint-disable-line

  const applyFilters = () => {
    setApplied(filters);
    setPage(1);
    fetchLogs(filters, 1);
  };

  const clearFilters = () => {
    const empty = { user: '', table_name: '', operation: '', date_from: '', date_to: '' };
    setFilters(empty); setApplied(empty); setPage(1);
    fetchLogs(empty, 1);
  };

  const hasFilters = Object.values(applied).some(Boolean);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <Navbar />

      <main className="p-6 max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-6">
          <p className="text-xs font-semibold text-indigo-400 uppercase tracking-widest mb-1">Compliance</p>
          <h1 className="text-2xl font-bold text-white">Audit Log</h1>
          <p className="text-sm text-gray-500 mt-1">
            Track every change — who did what, when, and on which record.
          </p>
        </div>

        {/* Filter bar */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 mb-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-3">

            {/* User search */}
            <div className="relative lg:col-span-2">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 pointer-events-none">
                <SearchIcon className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={filters.user}
                onChange={e => setFilter('user', e.target.value)}
                onKeyDown={e => e.key === 'Enter' && applyFilters()}
                placeholder="Search by user email…"
                className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-9 pr-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30"
              />
            </div>

            {/* Table */}
            <select
              value={filters.table_name}
              onChange={e => setFilter('table_name', e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500/50"
            >
              <option value="">All Tables</option>
              {tables.map(t => <option key={t} value={t}>{t}</option>)}
            </select>

            {/* Operation */}
            <select
              value={filters.operation}
              onChange={e => setFilter('operation', e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500/50"
            >
              <option value="">All Operations</option>
              <option value="INSERT">INSERT</option>
              <option value="UPDATE">UPDATE</option>
              <option value="DELETE">DELETE</option>
            </select>

            {/* Date from */}
            <input
              type="date"
              value={filters.date_from}
              onChange={e => setFilter('date_from', e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500/50 [color-scheme:dark]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <input
              type="date"
              value={filters.date_to}
              onChange={e => setFilter('date_to', e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500/50 [color-scheme:dark]"
            />
            <button
              onClick={applyFilters}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-colors"
            >
              Search
            </button>
            {hasFilters && (
              <button
                onClick={clearFilters}
                className="px-4 py-2 rounded-xl border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 text-sm transition-colors"
              >
                Clear
              </button>
            )}
            <span className="ml-auto text-xs text-gray-500">
              {total.toLocaleString()} record{total !== 1 ? 's' : ''} found
            </span>
          </div>
        </div>

        {/* Active filter chips */}
        {hasFilters && (
          <div className="flex flex-wrap gap-2 mb-4">
            {applied.user       && <Chip label={`User: ${applied.user}`}        onRemove={() => { setFilter('user',       ''); applyFilters(); }} />}
            {applied.table_name && <Chip label={`Table: ${applied.table_name}`} onRemove={() => { setFilter('table_name', ''); applyFilters(); }} />}
            {applied.operation  && <Chip label={`Op: ${applied.operation}`}     onRemove={() => { setFilter('operation',  ''); applyFilters(); }} />}
            {applied.date_from  && <Chip label={`From: ${applied.date_from}`}   onRemove={() => { setFilter('date_from',  ''); applyFilters(); }} />}
            {applied.date_to    && <Chip label={`To: ${applied.date_to}`}       onRemove={() => { setFilter('date_to',    ''); applyFilters(); }} />}
          </div>
        )}

        {/* Table */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_40px] gap-4 px-4 py-2.5 border-b border-gray-800 text-xs font-semibold text-gray-500 uppercase tracking-wide">
            <span>Performed By</span>
            <span>Table</span>
            <span>Operation</span>
            <span>Record</span>
            <span>When</span>
            <span />
          </div>

          {loading ? (
            <div className="py-16 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : logs.length === 0 ? (
            <div className="py-16 text-center">
              <DocumentIcon className="w-10 h-10 text-gray-700 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No audit records match your filters.</p>
            </div>
          ) : (
            logs.map(log => (
              <LogRow
                key={log.audit_id}
                log={log}
                expanded={expanded === log.audit_id}
                onToggle={() => setExpanded(expanded === log.audit_id ? null : log.audit_id)}
              />
            ))
          )}
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 rounded-xl border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 disabled:opacity-30 text-sm transition-colors"
            >
              ← Previous
            </button>
            <span className="text-xs text-gray-500">Page {page} of {pages}</span>
            <button
              onClick={() => setPage(p => Math.min(pages, p + 1))}
              disabled={page === pages}
              className="px-4 py-2 rounded-xl border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 disabled:opacity-30 text-sm transition-colors"
            >
              Next →
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

// ── LogRow ────────────────────────────────────────────────────────────────────
function LogRow({ log, expanded, onToggle }) {
  const opStyle  = OP_STYLES[log.operation] || 'bg-gray-700/30 text-gray-400 border-gray-700';
  const hasData  = log.old_values || log.new_values;
  const initials = (log.performed_by || '?')[0].toUpperCase();

  return (
    <>
      <div
        className={`grid grid-cols-[2fr_1fr_1fr_1fr_1fr_40px] gap-4 px-4 py-3 border-b border-gray-800/50 last:border-0 text-sm items-center transition-colors ${
          expanded ? 'bg-gray-800/30' : 'hover:bg-gray-800/20'
        }`}
      >
        {/* User */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
            <span className="text-[10px] font-bold text-indigo-400">{initials}</span>
          </div>
          <span className="text-gray-200 truncate text-xs font-medium">{log.performed_by}</span>
        </div>

        {/* Table */}
        <span className="text-gray-400 text-xs font-mono truncate">{log.table_name}</span>

        {/* Operation */}
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border w-fit ${opStyle}`}>
          {log.operation}
        </span>

        {/* Record PK */}
        <span className="text-gray-500 text-xs font-mono">#{log.record_pk}</span>

        {/* When */}
        <span className="text-gray-500 text-xs" title={new Date(log.performed_at).toLocaleString()}>
          {relativeTime(log.performed_at)}
        </span>

        {/* Expand toggle */}
        <button
          onClick={onToggle}
          disabled={!hasData}
          className="text-gray-600 hover:text-gray-300 disabled:opacity-20 transition-colors justify-self-center"
          title={hasData ? 'View changes' : 'No change data'}
        >
          <ChevronIcon className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Diff panel */}
      {expanded && hasData && (
        <div className="px-4 py-3 bg-gray-800/20 border-b border-gray-800/50 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {log.old_values && (
            <div>
              <p className="text-[10px] font-semibold text-red-400 uppercase tracking-wide mb-1.5">Before</p>
              <pre className="text-xs text-gray-400 bg-gray-900 rounded-xl p-3 overflow-x-auto border border-gray-800 leading-relaxed">
                {JSON.stringify(log.old_values, null, 2)}
              </pre>
            </div>
          )}
          {log.new_values && (
            <div>
              <p className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wide mb-1.5">After</p>
              <pre className="text-xs text-gray-400 bg-gray-900 rounded-xl p-3 overflow-x-auto border border-gray-800 leading-relaxed">
                {JSON.stringify(log.new_values, null, 2)}
              </pre>
            </div>
          )}
          {log.ip_address && (
            <p className="text-[11px] text-gray-600 sm:col-span-2">
              IP: <span className="text-gray-500 font-mono">{log.ip_address}</span>
            </p>
          )}
        </div>
      )}
    </>
  );
}

// ── Chip ──────────────────────────────────────────────────────────────────────
function Chip({ label, onRemove }) {
  return (
    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-300">
      {label}
      <button onClick={onRemove} className="text-indigo-400 hover:text-white transition-colors">
        <XIcon className="w-3 h-3" />
      </button>
    </span>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function relativeTime(ts) {
  const diff = (Date.now() - new Date(ts).getTime()) / 1000;
  if (diff < 60)     return 'just now';
  if (diff < 3600)   return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400)  return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(ts).toLocaleDateString();
}

// ── Icons ─────────────────────────────────────────────────────────────────────
function SearchIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}
function ChevronIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );
}
function DocumentIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}
function XIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}