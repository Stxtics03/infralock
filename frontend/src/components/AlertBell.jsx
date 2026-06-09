/**
 * AlertBell — Supabase Realtime alert component
 *
 * Usage in Navbar:
 *   import AlertBell from './AlertBell';
 *   <AlertBell supabase={supabaseClient} userId={currentUser.id} />
 *
 * Props:
 *   supabase  — your initialized Supabase client
 *   userId    — current user ID (for per-user alerts, optional)
 *   maxShown  — max items in dropdown (default 15)
 */

import { useState, useEffect, useRef, useCallback } from "react";

const SEVERITY_STYLES = {
  critical: {
    dot: "bg-red-400",
    text: "text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/20",
    badge: "bg-red-500",
  },
  warning: {
    dot: "bg-amber-400",
    text: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    badge: "bg-amber-500",
  },
  info: {
    dot: "bg-sky-400",
    text: "text-sky-400",
    bg: "bg-sky-500/10",
    border: "border-sky-500/20",
    badge: "bg-sky-500",
  },
  resolved: {
    dot: "bg-emerald-400",
    text: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    badge: "bg-emerald-500",
  },
};

const DEFAULT_STYLE = {
  dot: "bg-slate-400",
  text: "text-slate-400",
  bg: "bg-slate-700/30",
  border: "border-slate-700",
  badge: "bg-slate-500",
};

export default function AlertBell({
  supabase,
  userId,
  maxShown = 15,
}) {
  const [alerts, setAlerts] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef(null);
  const channelRef = useRef(null);

  // ── Initial fetch ────────────────────────────────────────────────────────
  const fetchAlerts = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    try {
      let query = supabase
        .from("alerts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(maxShown);

      if (userId) query = query.eq("user_id", userId);

      const { data, error } = await query;
      if (!error && data) setAlerts(data);
    } catch {
      // silently fail — realtime will still work
    } finally {
      setLoading(false);
    }
  }, [supabase, userId, maxShown]);

  // ── Supabase Realtime subscription ──────────────────────────────────────
  useEffect(() => {
    if (!supabase) return;

    fetchAlerts();

    // Subscribe to INSERT events on alerts table
    const channel = supabase
      .channel("alerts-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "alerts",
          ...(userId ? { filter: `user_id=eq.${userId}` } : {}),
        },
        (payload) => {
          setAlerts((prev) => [payload.new, ...prev].slice(0, maxShown));
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "alerts",
          ...(userId ? { filter: `user_id=eq.${userId}` } : {}),
        },
        (payload) => {
          setAlerts((prev) =>
            prev.map((a) => (a.id === payload.new.id ? payload.new : a))
          );
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "alerts",
        },
        (payload) => {
          setAlerts((prev) => prev.filter((a) => a.id !== payload.old.id));
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, userId, maxShown, fetchAlerts]);

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

  // ── Mark as read ─────────────────────────────────────────────────────────
  const markRead = useCallback(
    async (alertId) => {
      // Optimistic update
      setAlerts((prev) =>
        prev.map((a) => (a.id === alertId ? { ...a, is_read: true } : a))
      );

      if (supabase) {
        await supabase
          .from("alerts")
          .update({ is_read: true, read_at: new Date().toISOString() })
          .eq("id", alertId);
      }
    },
    [supabase]
  );

  const markAllRead = useCallback(async () => {
    const unreadIds = alerts.filter((a) => !a.is_read).map((a) => a.id);
    if (!unreadIds.length) return;

    setAlerts((prev) => prev.map((a) => ({ ...a, is_read: true })));

    if (supabase) {
      await supabase
        .from("alerts")
        .update({ is_read: true, read_at: new Date().toISOString() })
        .in("id", unreadIds);
    }
  }, [alerts, supabase]);

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
                <span className="text-xs text-slate-500">
                  {unreadCount} unread
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                Mark all read
              </button>
            )}
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
                <p className="text-sm text-slate-500">No alerts yet</p>
              </div>
            ) : (
              alerts.map((alert) => (
                <AlertItem
                  key={alert.id}
                  alert={alert}
                  onMarkRead={markRead}
                />
              ))
            )}
          </div>

          {/* Footer */}
          {alerts.length > 0 && (
            <div className="border-t border-slate-800 px-4 py-2.5">
              <a
                href="/alerts"
                className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                onClick={() => setOpen(false)}
              >
                View all alerts →
              </a>
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
    SEVERITY_STYLES[alert.type?.toLowerCase()] ||
    DEFAULT_STYLE;

  return (
    <div
      className={`flex items-start gap-3 px-4 py-3 border-b border-slate-800/50 last:border-0 transition-colors ${
        alert.is_read ? "opacity-60" : "bg-slate-800/20"
      }`}
    >
      {/* Severity dot */}
      <div className="mt-1 shrink-0">
        <div className={`w-2 h-2 rounded-full ${sev.dot} ${
          !alert.is_read ? "ring-2 ring-offset-2 ring-offset-slate-900 ring-current animate-pulse" : ""
        }`} style={{ color: sev.dot.replace("bg-", "") }} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={`text-xs font-semibold ${sev.text} uppercase tracking-wide`}>
            {alert.severity || alert.type || "Alert"}
          </p>
          <span className="text-[11px] text-slate-600 shrink-0 whitespace-nowrap">
            {relativeTime(alert.created_at)}
          </span>
        </div>
        <p className="text-sm text-slate-200 mt-0.5 leading-snug">
          {alert.title || alert.message || alert.description || "—"}
        </p>
        {alert.node_name && (
          <p className="text-xs text-slate-500 mt-0.5">
            Node: <span className="text-slate-400">{alert.node_name}</span>
          </p>
        )}
      </div>

      {/* Read toggle */}
      {!alert.is_read && (
        <button
          onClick={() => onMarkRead(alert.id)}
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
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
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
