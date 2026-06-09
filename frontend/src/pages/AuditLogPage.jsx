import { useState, useEffect, useCallback } from "react";
import Navbar from "../components/Navbar";
import useStore from "../store";

const ROWS_PER_PAGE = 20;

const OP_STYLES = {
  INSERT: {
    badge: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
    dot: "bg-emerald-400",
  },
  UPDATE: {
    badge: "bg-amber-500/20 text-amber-400 border border-amber-500/30",
    dot: "bg-amber-400",
  },
  DELETE: {
    badge: "bg-red-500/20 text-red-400 border border-red-500/30",
    dot: "bg-red-400",
  },
};

function Skeleton({ className = "" }) {
  return (
    <div className={`animate-pulse bg-slate-700/50 rounded ${className}`} />
  );
}

function Badge({ op }) {
  const style = OP_STYLES[op] || {
    badge: "bg-slate-700 text-slate-300 border border-slate-600",
    dot: "bg-slate-400",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-mono font-semibold ${style.badge}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
      {op}
    </span>
  );
}

export default function AuditLogPage() {
  const token = useStore(s => s.token);

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [filters, setFilters] = useState({
    user: "", table_name: "", operation: "", date_from: "", date_to: "",
  });
  const [appliedFilters, setAppliedFilters] = useState(filters);

  const [page, setPage] = useState(1);
  const [totalRows, setTotalRows] = useState(0);

  const [users, setUsers] = useState([]);
  const [tables, setTables] = useState([]);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page,
        limit: ROWS_PER_PAGE,
        ...(appliedFilters.user        && { user:       appliedFilters.user }),
        ...(appliedFilters.table_name  && { table_name: appliedFilters.table_name }),
        ...(appliedFilters.operation   && { operation:  appliedFilters.operation }),
        ...(appliedFilters.date_from   && { date_from:  appliedFilters.date_from }),
        ...(appliedFilters.date_to     && { date_to:    appliedFilters.date_to }),
      });

      const res = await fetch(`/api/audit-log?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      setLogs(data.logs || []);
      setTotalRows(data.total || 0);
      if (data.meta?.users)  setUsers(data.meta.users);
      if (data.meta?.tables) setTables(data.meta.tables);
    } catch (err) {
      setError(err.message);
      const mock = generateMock();
      setLogs(mock.slice((page - 1) * ROWS_PER_PAGE, page * ROWS_PER_PAGE));
      setTotalRows(mock.length);
    } finally {
      setLoading(false);
    }
  }, [page, appliedFilters, token]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const totalPages = Math.max(1, Math.ceil(totalRows / ROWS_PER_PAGE));

  const handleApply = () => { setPage(1); setAppliedFilters({ ...filters }); };
  const handleReset = () => {
    const empty = { user: "", table_name: "", operation: "", date_from: "", date_to: "" };
    setFilters(empty); setAppliedFilters(empty); setPage(1);
  };

  const activeFilterCount = Object.values(appliedFilters).filter(Boolean).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Navbar />
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
              <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">Audit Log</h1>
          </div>
          <p className="text-slate-400 text-sm ml-11">
            Full trail of INSERT, UPDATE, and DELETE operations across all tables.
          </p>
        </div>

        {/* Filters */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-4">
          <div className="flex flex-wrap gap-3">
            <div className="flex flex-col gap-1 min-w-[160px]">
              <label className="text-xs text-slate-400 font-medium uppercase tracking-wider">User</label>
              {users.length > 0 ? (
                <select value={filters.user} onChange={e => setFilters(f => ({ ...f, user: e.target.value }))}
                  className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="">All users</option>
                  {users.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              ) : (
                <input type="text" placeholder="Filter by user…" value={filters.user}
                  onChange={e => setFilters(f => ({ ...f, user: e.target.value }))}
                  className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              )}
            </div>

            <div className="flex flex-col gap-1 min-w-[160px]">
              <label className="text-xs text-slate-400 font-medium uppercase tracking-wider">Table</label>
              {tables.length > 0 ? (
                <select value={filters.table_name} onChange={e => setFilters(f => ({ ...f, table_name: e.target.value }))}
                  className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="">All tables</option>
                  {tables.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              ) : (
                <input type="text" placeholder="Filter by table…" value={filters.table_name}
                  onChange={e => setFilters(f => ({ ...f, table_name: e.target.value }))}
                  className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-400 font-medium uppercase tracking-wider">Operation</label>
              <select value={filters.operation} onChange={e => setFilters(f => ({ ...f, operation: e.target.value }))}
                className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="">All operations</option>
                <option value="INSERT">INSERT</option>
                <option value="UPDATE">UPDATE</option>
                <option value="DELETE">DELETE</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-400 font-medium uppercase tracking-wider">From</label>
              <input type="date" value={filters.date_from}
                onChange={e => setFilters(f => ({ ...f, date_from: e.target.value }))}
                className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-400 font-medium uppercase tracking-wider">To</label>
              <input type="date" value={filters.date_to}
                onChange={e => setFilters(f => ({ ...f, date_to: e.target.value }))}
                className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>

            <div className="flex flex-col gap-1 justify-end">
              <label className="text-xs text-transparent">-</label>
              <div className="flex gap-2">
                <button onClick={handleApply}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors">
                  Apply
                </button>
                {activeFilterCount > 0 && (
                  <button onClick={handleReset}
                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-medium rounded-lg transition-colors">
                    Clear {activeFilterCount}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mb-4 px-4 py-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-400 text-sm flex items-center gap-2">
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            API error — showing mock data. ({error})
          </div>
        )}

        {/* Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800">
                  {['Time', 'User', 'Table', 'Operation', 'Record ID', 'Changes'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading
                  ? Array.from({ length: ROWS_PER_PAGE }).map((_, i) => (
                      <tr key={i} className="border-b border-slate-800/50 last:border-0">
                        {Array.from({ length: 6 }).map((_, j) => (
                          <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-full" /></td>
                        ))}
                      </tr>
                    ))
                  : logs.map((log, i) => <AuditRow key={log.audit_id ?? i} log={log} />)
                }
                {!loading && logs.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-16 text-center text-slate-500">
                      No audit records match the current filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="border-t border-slate-800 px-4 py-3 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              {totalRows === 0
                ? "No records"
                : `${(page - 1) * ROWS_PER_PAGE + 1}–${Math.min(page * ROWS_PER_PAGE, totalRows)} of ${totalRows.toLocaleString()} records`}
            </span>
            <div className="flex items-center gap-1">
              <PageBtn onClick={() => setPage(1)}              disabled={page === 1}          label="«" />
              <PageBtn onClick={() => setPage(p => p - 1)}    disabled={page === 1}          label="‹" />
              {getPageRange(page, totalPages).map((p, i) =>
                p === "…"
                  ? <span key={`e-${i}`} className="px-2 text-slate-600">…</span>
                  : <PageBtn key={p} onClick={() => setPage(p)} active={p === page} label={p} />
              )}
              <PageBtn onClick={() => setPage(p => p + 1)}    disabled={page === totalPages} label="›" />
              <PageBtn onClick={() => setPage(totalPages)}     disabled={page === totalPages} label="»" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AuditRow({ log }) {
  const [expanded, setExpanded] = useState(false);
  const hasChanges = log.old_values || log.new_values;

  return (
    <>
      <tr
        className={`border-b border-slate-800/50 last:border-0 hover:bg-slate-800/30 transition-colors ${hasChanges ? "cursor-pointer" : ""}`}
        onClick={() => hasChanges && setExpanded(e => !e)}
      >
        <td className="px-4 py-3 text-slate-300 font-mono text-xs whitespace-nowrap">
          {formatTs(log.performed_at)}
        </td>
        <td className="px-4 py-3 text-slate-200">{log.performed_by ?? "—"}</td>
        <td className="px-4 py-3">
          <code className="text-xs text-sky-400 bg-sky-400/10 px-2 py-0.5 rounded">
            {log.table_name ?? "—"}
          </code>
        </td>
        <td className="px-4 py-3"><Badge op={log.operation} /></td>
        <td className="px-4 py-3 font-mono text-xs text-slate-400">#{log.record_pk ?? "—"}</td>
        <td className="px-4 py-3">
          {hasChanges ? (
            <button className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors">
              <svg className={`w-3 h-3 transition-transform ${expanded ? "rotate-90" : ""}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              View diff
            </button>
          ) : (
            <span className="text-slate-600 text-xs">—</span>
          )}
        </td>
      </tr>
      {expanded && hasChanges && (
        <tr className="border-b border-slate-800/50 bg-slate-900/80">
          <td colSpan={6} className="px-4 py-3">
            <DiffView oldValues={log.old_values} newValues={log.new_values} />
          </td>
        </tr>
      )}
    </>
  );
}

function DiffView({ oldValues, newValues }) {
  const parseJ = v => {
    if (!v) return {};
    if (typeof v === "object") return v;
    try { return JSON.parse(v); } catch { return { raw: v }; }
  };
  const oldObj = parseJ(oldValues);
  const newObj = parseJ(newValues);
  const keys = [...new Set([...Object.keys(oldObj), ...Object.keys(newObj)])];
  if (!keys.length) return null;

  return (
    <div className="rounded-lg overflow-hidden border border-slate-700/50 text-xs font-mono">
      <div className="grid grid-cols-2 divide-x divide-slate-700/50">
        <div>
          <div className="px-3 py-1.5 bg-red-500/10 text-red-400 font-semibold text-[10px] uppercase tracking-wider border-b border-slate-700/50">Before</div>
          {keys.map(k => (
            <div key={k} className="flex px-3 py-1.5 border-b border-slate-800/50 last:border-0">
              <span className="text-slate-500 w-28 shrink-0">{k}</span>
              <span className={oldObj[k] !== newObj[k] ? "text-red-300" : "text-slate-400"}>
                {oldObj[k] != null ? String(oldObj[k]) : <em className="text-slate-600">null</em>}
              </span>
            </div>
          ))}
        </div>
        <div>
          <div className="px-3 py-1.5 bg-emerald-500/10 text-emerald-400 font-semibold text-[10px] uppercase tracking-wider border-b border-slate-700/50">After</div>
          {keys.map(k => (
            <div key={k} className="flex px-3 py-1.5 border-b border-slate-800/50 last:border-0">
              <span className="text-slate-500 w-28 shrink-0">{k}</span>
              <span className={oldObj[k] !== newObj[k] ? "text-emerald-300" : "text-slate-400"}>
                {newObj[k] != null ? String(newObj[k]) : <em className="text-slate-600">null</em>}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PageBtn({ onClick, disabled, active, label }) {
  return (
    <button onClick={onClick} disabled={disabled}
      className={`min-w-[32px] h-8 px-2 rounded text-sm font-medium transition-colors
        ${active    ? "bg-indigo-600 text-white"
        : disabled  ? "text-slate-700 cursor-not-allowed"
                    : "text-slate-400 hover:bg-slate-700 hover:text-slate-200"}`}>
      {label}
    </button>
  );
}

function getPageRange(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, "…", total];
  if (current >= total - 3) return [1, "…", total - 4, total - 3, total - 2, total - 1, total];
  return [1, "…", current - 1, current, current + 1, "…", total];
}

function formatTs(ts) {
  if (!ts) return "—";
  const d = new Date(ts);
  if (isNaN(d)) return ts;
  return (
    d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) +
    " " +
    d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
  );
}

function generateMock() {
  const ops = ["INSERT", "UPDATE", "DELETE"];
  const tables = ["nodes", "incidents", "users", "slas", "config_snapshots", "alerts"];
  const users = ["admin@infralock.dev", "aakash@infralock.dev", "ops@infralock.dev"];
  return Array.from({ length: 120 }, (_, i) => {
    const op = ops[i % 3];
    return {
      audit_id: i + 1,
      performed_at: new Date(Date.now() - i * 1_800_000).toISOString(),
      performed_by: users[i % users.length],
      table_name: tables[i % tables.length],
      operation: op,
      record_pk: 1000 + i,
      old_values: op !== "INSERT" ? JSON.stringify({ status: "active", updated_at: "2025-01-01" }) : null,
      new_values: op !== "DELETE" ? JSON.stringify({ status: "inactive", updated_at: new Date().toISOString() }) : null,
    };
  });
}