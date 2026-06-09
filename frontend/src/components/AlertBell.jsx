/**
 * AlertBell — MySQL polling (no Supabase)
 * Polls /api/anomalies every 30s for new alerts.
 *
 * Usage in Navbar:
 *   import AlertBell from './AlertBell';
 *   <AlertBell token={token} maxShown={15} pollInterval={30000} />
 */

import { useState, useEffect, useRef, useCallback } from "react";

const SEVERITY_STYLES = {
  critical: {
    dot: "bg-red-400",
    text: "text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/20",
  },
  warning: {
    dot: "bg-amber-400",
    text: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
  },
  info: {
    dot: "bg-sky-400",
    text: "text-sky-400",
    bg: "bg-sky-500/10",
    border: "border-sky-500/20",
  },
  resolved: {
    dot: "bg-emerald-400",
    text: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
  },
};

const DEFAULT_STYLE = {
  dot: "bg-slate-400",
  text: "text-slate-400",
  bg: "bg-slate-700/30",
  border: "border-slate-700",
};

export default function AlertBell({ token, maxShown = 15, pollInterval = 30000 }) {
  const [alerts, setAlerts] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef(null);
  const seenIdsRef = useRef(new Set());

  // ── Fetch from /api/anomalies ────────────────────────────────────────────
  const fetchAlerts = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`/api/anomalies?limit=${maxShown}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      const rows = Array.isArray(data) ? data : (data.anomalies ?? data.data ?? []);

      // Mark anything not previously seen as unread
      const enriched = rows.map((a) => {
        const id = a.anomaly_id ?? a.id;
        const isNew = !seenIdsRef.current.has(id);
        if (isNew) seenIdsRef.current.add(id);
        return { ...a, _id: id, is_read: isNew ? (a.is_read ?? false) : true };
      });

      setAlerts(enriched.slice(0, maxShown));
    } catch {
      // network error — silently ignore, will retry next poll
    } finally {
      setLoading(false);
    }
  }, [token, maxShown]);

  // ── Initial fetch + polling interval ────────────────────────────────────
  useEffect(() => {
    fetchAlerts();
    const id = setInterval(fetchAlerts, pollInterval);
    return () => clearInterval(id);
  }, [fetchAlerts, pollInterval]);

  // ── Close on outside click ───────────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Mark read (local only — no separate alerts table) ───────────────────
  const markRead = useCallback((id) => {
    setAlerts((prev) => prev.map((a) => (a._id === id ? { ...a, is_read: true } : a)));
  }, []);

  const markAllRead = useCallback(() => {
    setAlerts((prev) => prev.map((a) => ({ ...a, is_read: true })));
  }, []);

  const unreadCount = alerts.filter((a) => !a.is_read).length;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className={`relative p-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
          open
            ? "bg-slate-700 text-slate-100"
            : "text-slate-400 hover:bg-slate-700 hover:text-slate-200"
        }`}
        aria-label={`Alerts — ${unreadCount} unread`}
      >
        <BellIcon className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 mt-2 w-96 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl shadow-black/50 z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-slate-100">Alerts</h3>
              {unreadCount > 0 && (
                <span className="text-xs text-slate-500">{unreadCount} unread</span>
              )}
            </div>
            <div className="flex items-center gap-3">
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  Mark all read
                </button>
              )}
              <button
                onClick={fetchAlerts}
                className="text-slate-500 hover:text-slate-300 transition-colors"
                title="Refresh"
              >
                <RefreshIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Alert List */}
          <div className="max-h-[420px] overflow-y-auto">
            {loading ? (
              <div className="py-8 flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : alerts.length === 0 ? (
              <div className="py-12 text-center">
                <BellIcon className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                <p className="text-sm text-slate-500">No alerts</p>
              </div>
            ) : (
              alerts.map((alert) => (
                <AlertItem key={alert._id} alert={alert} onMarkRead={markRead} />
              ))
            )}
          </div>

          {/* Footer */}
          {alerts.length > 0 && (
            <div className="border-t border-slate-800 px-4 py-2.5 flex items-center justify-between">
              <a
                href="/anomalies"
                className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                onClick={() => setOpen(false)}
              >
                View all →
              </a>
              <span className="text-[11px] text-slate-600">
                Refreshes every {pollInterval / 1000}s
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AlertItem({ alert, onMarkRead }) {
  const sev =
    SEVERITY_STYLES[alert.severity?.toLowerCase()] ||
    SEVERITY_STYLES[alert.anomaly_type?.toLowerCase()] ||
    DEFAULT_STYLE;

  return (
    <div
      className={`flex items-start gap-3 px-4 py-3 border-b border-slate-800/50 last:border-0 transition-colors ${
        alert.is_read ? "opacity-55" : "bg-slate-800/20"
      }`}
    >
      {/* Severity dot */}
      <div className="mt-1.5 shrink-0">
        <div
          className={`w-2 h-2 rounded-full ${sev.dot} ${
            !alert.is_read ? "animate-pulse" : ""
          }`}
        />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={`text-xs font-semibold ${sev.text} uppercase tracking-wide`}>
            {alert.severity || alert.anomaly_type || "Alert"}
          </p>
          <span className="text-[11px] text-slate-600 shrink-0 whitespace-nowrap">
            {relativeTime(alert.detected_at || alert.created_at)}
          </span>
        </div>
        <p className="text-sm text-slate-200 mt-0.5 leading-snug">
          {alert.description || alert.title || alert.message || "—"}
        </p>
        {(alert.node_hostname || alert.node_name) && (
          <p className="text-xs text-slate-500 mt-0.5">
            Node:{" "}
            <span className="text-slate-400 font-mono">
              {alert.node_hostname || alert.node_name}
            </span>
          </p>
        )}
      </div>

      {/* Read toggle */}
      {!alert.is_read && (
        <button
          onClick={() => onMarkRead(alert._id)}
          className="shrink-0 mt-0.5 p-1 rounded text-slate-600 hover:text-slate-300 hover:bg-slate-700 transition-colors"
          title="Mark as read"
        >
          <CheckIcon className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function relativeTime(ts) {
  if (!ts) return "";
  const diff = (Date.now() - new Date(ts).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

// ── Icons ─────────────────────────────────────────────────────────────────────
function BellIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
      />
    </svg>
  );
}

function CheckIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}

function RefreshIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
      />
    </svg>
  );
}