/**
 * Node Detail Page — /nodes/:id
 *
 * Add to your router:
 *   <Route path="/nodes/:id" element={<NodeDetailPage />} />
 */

import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import useStore from "../store";

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function NodeDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const token = useStore(s => s.token);

  const [node, setNode] = useState(null);
  const [incidents, setIncidents] = useState([]);
  const [slas, setSlas] = useState([]);
  const [snapshots, setSnapshots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("incidents");

  useEffect(() => {
    const headers = { Authorization: `Bearer ${token}` };

    const fetchAll = async () => {
      setLoading(true);
      setError(null);
      try {
        const [nodeRes, incRes, slaRes, snapRes] = await Promise.all([
          fetch(`/api/nodes/${id}`, { headers }),
          fetch(`/api/nodes/${id}/incidents`, { headers }),
          fetch(`/api/nodes/${id}/sla`, { headers }),
          fetch(`/api/nodes/${id}/config-snapshots`, { headers }),
        ]);

        if (!nodeRes.ok) throw new Error(`Node not found (${nodeRes.status})`);

        const [nodeData, incData, slaData, snapData] = await Promise.all([
          nodeRes.json(),
          incRes.ok ? incRes.json() : { data: [] },
          slaRes.ok ? slaRes.json() : { data: [] },
          snapRes.ok ? snapRes.json() : { data: [] },
        ]);

        setNode(nodeData.data || nodeData);
        setIncidents(incData.data || incData || []);
        setSlas(slaData.data || slaData || []);
        setSnapshots(snapData.data || snapData || []);
      } catch (err) {
        setError(err.message);
        // Fallback mock
        const mock = generateMockNode(id);
        setNode(mock.node);
        setIncidents(mock.incidents);
        setSlas(mock.slas);
        setSnapshots(mock.snapshots);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [id]);

  if (loading) return <PageSkeleton />;

  if (error && !node)
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-400 mb-4">{error}</p>
          <button
            onClick={() => navigate("/nodes")}
            className="text-indigo-400 hover:text-indigo-300"
          >
            ← Back to Nodes
          </button>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Navbar />
      <div className="p-6">
      {/* Breadcrumb */}}
      <nav className="flex items-center gap-2 text-sm text-slate-500 mb-6">
        <Link to="/nodes" className="hover:text-slate-300 transition-colors">
          Nodes
        </Link>
        <ChevronIcon className="w-4 h-4" />
        <span className="text-slate-300">{node?.hostname || `Node #${id}`}</span>
      </nav>

      {/* Error banner (mock mode) */}
      {error && (
        <div className="mb-4 px-4 py-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-400 text-sm">
          API error — showing mock data.
        </div>
      )}

      {/* Node Header */}
      <NodeHeader node={node} />

      {/* Specs Grid */}
      <SpecsGrid node={node} />

      {/* Tabs */}
      <div className="mt-8">
        <div className="flex gap-1 mb-4 bg-slate-900 border border-slate-800 rounded-xl p-1 w-fit">
          {[
            { key: "incidents", label: "Incident History", count: incidents.length },
            { key: "sla", label: "SLA Associations", count: slas.length },
            { key: "config", label: "Config Timeline", count: snapshots.length },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                activeTab === tab.key
                  ? "bg-slate-700 text-slate-100"
                  : "text-slate-400 hover:text-slate-300"
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span
                  className={`text-xs px-1.5 py-0.5 rounded-full font-mono ${
                    activeTab === tab.key
                      ? "bg-slate-600 text-slate-200"
                      : "bg-slate-800 text-slate-500"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {activeTab === "incidents" && <IncidentTable incidents={incidents} nodeId={id} />}
        {activeTab === "sla" && <SlaTable slas={slas} />}
        {activeTab === "config" && <ConfigTimeline snapshots={snapshots} />}
      </div>
      </div>
    </div>
  );
}

// ─── Node Header ─────────────────────────────────────────────────────────────
function NodeHeader({ node }) {
  const status = node?.status?.toLowerCase() || "unknown";
  const statusConfig = {
    online: { dot: "bg-emerald-400", text: "text-emerald-400", label: "Online" },
    offline: { dot: "bg-red-400", text: "text-red-400", label: "Offline" },
    degraded: { dot: "bg-amber-400", text: "text-amber-400", label: "Degraded" },
    maintenance: { dot: "bg-sky-400", text: "text-sky-400", label: "Maintenance" },
    unknown: { dot: "bg-slate-400", text: "text-slate-400", label: "Unknown" },
  };
  const st = statusConfig[status] || statusConfig.unknown;

  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-slate-800 border border-slate-700 rounded-xl flex items-center justify-center shrink-0">
          <ServerIcon className="w-6 h-6 text-indigo-400" />
        </div>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">
              {node?.hostname || "—"}
            </h1>
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700`}>
              <div className={`w-2 h-2 rounded-full ${st.dot} ${status === "online" ? "animate-pulse" : ""}`} />
              <span className={`text-xs font-semibold ${st.text}`}>{st.label}</span>
            </div>
          </div>
          <p className="text-slate-400 text-sm mt-0.5">
            {node?.ip_address || node?.ip || "—"} · Node #{node?.node_id || node?.id}
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        <a
          href={`/nodes/${node?.id}/edit`}
          className="px-3 py-2 text-sm text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
        >
          Edit
        </a>
        <a
          href={`/nodes/${node?.id}/ssh`}
          className="px-3 py-2 text-sm text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors"
        >
          SSH →
        </a>
      </div>
    </div>
  );
}

// ─── Specs Grid ───────────────────────────────────────────────────────────────
function SpecsGrid({ node }) {
  const specs = [
    { label: "IP Address", value: node?.ip_address || node?.ip, mono: true },
    { label: "OS", value: node?.os || node?.operating_system },
    { label: "CPU", value: node?.cpu || node?.cpu_model },
    {
      label: "RAM",
      value: node?.ram_gb
        ? `${node.ram_gb} GB`
        : node?.memory_gb
        ? `${node.memory_gb} GB`
        : null,
    },
    {
      label: "Disk",
      value: node?.disk_gb
        ? `${node.disk_gb} GB`
        : node?.storage_gb
        ? `${node.storage_gb} GB`
        : null,
    },
    {
      label: "Environment",
      value: node?.environment || node?.env,
    },
    {
      label: "Region",
      value: node?.region || node?.location,
    },
    {
      label: "Registered",
      value: node?.created_at
        ? new Date(node.created_at).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })
        : null,
    },
    { label: "Last Seen", value: relativeTime(node?.last_seen || node?.last_heartbeat) },
    { label: "Agent Version", value: node?.agent_version, mono: true },
    { label: "Tags", value: node?.tags, isTags: true },
  ].filter((s) => s.value);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {specs.map((spec) => (
        <div
          key={spec.label}
          className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-3"
        >
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">
            {spec.label}
          </p>
          {spec.isTags ? (
            <div className="flex flex-wrap gap-1 mt-1">
              {(Array.isArray(spec.value)
                ? spec.value
                : String(spec.value).split(",")
              ).map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-2 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full"
                >
                  {tag.trim()}
                </span>
              ))}
            </div>
          ) : (
            <p
              className={`text-sm font-medium text-slate-200 truncate ${
                spec.mono ? "font-mono" : ""
              }`}
            >
              {spec.value}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Incident Table ──────────────────────────────────────────────────────────
function IncidentTable({ incidents, nodeId }) {
  const SEVERITY_COLORS = {
    critical: "text-red-400 bg-red-500/10 border-red-500/20",
    high: "text-orange-400 bg-orange-500/10 border-orange-500/20",
    medium: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    low: "text-sky-400 bg-sky-500/10 border-sky-500/20",
  };
  const STATUS_COLORS = {
    open: "text-red-400",
    investigating: "text-amber-400",
    resolved: "text-emerald-400",
    closed: "text-slate-500",
  };

  if (!incidents.length) {
    return <EmptyState icon={<ShieldIcon className="w-8 h-8" />} message="No incidents for this node." />;
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800">
              {["ID", "Title", "Severity", "Status", "Started", "Duration", ""].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {incidents.map((inc) => {
              const sev = inc.severity?.toLowerCase() || "low";
              const st = inc.status?.toLowerCase() || "open";
              const duration = calcDuration(inc.started_at, inc.resolved_at);
              return (
                <tr
                  key={inc.id}
                  className="border-b border-slate-800/50 last:border-0 hover:bg-slate-800/30 transition-colors"
                >
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">#{inc.id}</td>
                  <td className="px-4 py-3 text-slate-200 max-w-xs truncate">{inc.title || inc.description || "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${SEVERITY_COLORS[sev] || SEVERITY_COLORS.low}`}>
                      {inc.severity || "—"}
                    </span>
                  </td>
                  <td className={`px-4 py-3 text-xs font-semibold capitalize ${STATUS_COLORS[st] || "text-slate-400"}`}>
                    {inc.status || "—"}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">
                    {formatDate(inc.started_at || inc.created_at)}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400 font-mono">{duration}</td>
                  <td className="px-4 py-3">
                    <Link
                      to={`/incidents/${inc.id}`}
                      className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                      View →
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── SLA Table ────────────────────────────────────────────────────────────────
function SlaTable({ slas }) {
  if (!slas.length) {
    return <EmptyState icon={<ClockIcon className="w-8 h-8" />} message="No SLA policies associated with this node." />;
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-800">
            {["Policy", "Type", "Target", "Current", "Compliance", "Period"].map((h) => (
              <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {slas.map((sla) => {
            const target = sla.target_percentage || sla.uptime_target || 99.9;
            const current = sla.current_percentage || sla.actual_uptime;
            const compliant = current != null ? current >= target : null;
            return (
              <tr
                key={sla.id}
                className="border-b border-slate-800/50 last:border-0 hover:bg-slate-800/30 transition-colors"
              >
                <td className="px-4 py-3 text-slate-200 font-medium">{sla.name || sla.policy_name || "—"}</td>
                <td className="px-4 py-3 text-slate-400 text-xs uppercase tracking-wide">{sla.type || sla.metric_type || "—"}</td>
                <td className="px-4 py-3 font-mono text-sm text-slate-300">{target}%</td>
                <td className="px-4 py-3 font-mono text-sm">
                  {current != null ? (
                    <span className={compliant ? "text-emerald-400" : "text-red-400"}>
                      {Number(current).toFixed(2)}%
                    </span>
                  ) : (
                    <span className="text-slate-600">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {compliant != null ? (
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
                        compliant
                          ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                          : "text-red-400 bg-red-500/10 border-red-500/20"
                      }`}
                    >
                      {compliant ? "Met" : "Breached"}
                    </span>
                  ) : (
                    <span className="text-slate-600 text-xs">N/A</span>
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-slate-500">{sla.period || sla.evaluation_period || "Monthly"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── Config Timeline ──────────────────────────────────────────────────────────
function ConfigTimeline({ snapshots }) {
  const [selected, setSelected] = useState(null);
  const [comparing, setComparing] = useState(null);

  if (!snapshots.length) {
    return <EmptyState icon={<ClockIcon className="w-8 h-8" />} message="No configuration snapshots recorded yet." />;
  }

  const selectedSnap = snapshots[selected];
  const compareSnap = snapshots[comparing];

  return (
    <div className="flex gap-4">
      {/* Timeline */}
      <div className="w-72 shrink-0">
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Snapshots ({snapshots.length})
          </div>
          <div className="max-h-[500px] overflow-y-auto divide-y divide-slate-800/50">
            {snapshots.map((snap, i) => (
              <button
                key={snap.id || i}
                onClick={() => {
                  setSelected(i);
                  setComparing(null);
                }}
                className={`w-full text-left px-4 py-3 transition-colors hover:bg-slate-800/40 ${
                  selected === i ? "bg-indigo-600/10 border-l-2 border-indigo-500" : ""
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${i === 0 ? "bg-indigo-400" : "bg-slate-600"}`} />
                  <div className="min-w-0">
                    <p className="text-xs font-mono text-slate-300 truncate">
                      {snap.version || snap.commit_hash?.slice(0, 8) || `v${snapshots.length - i}`}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {formatDate(snap.created_at || snap.captured_at)}
                    </p>
                    {snap.changed_by && (
                      <p className="text-[11px] text-slate-600 truncate">{snap.changed_by}</p>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Detail / Diff panel */}
      <div className="flex-1 min-w-0">
        {selectedSnap ? (
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
              <div>
                <p className="text-sm font-medium text-slate-200">
                  Snapshot {selectedSnap.version || `#${snapshots.length - selected}`}
                </p>
                <p className="text-xs text-slate-500">
                  {formatDate(selectedSnap.created_at || selectedSnap.captured_at)}
                  {selectedSnap.changed_by && ` · ${selectedSnap.changed_by}`}
                </p>
              </div>
              {selected < snapshots.length - 1 && (
                <button
                  onClick={() => setComparing(selected + 1)}
                  className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  Compare with previous
                </button>
              )}
            </div>
            <div className="p-4">
              {comparing != null && compareSnap ? (
                <SnapshotDiff a={compareSnap} b={selectedSnap} />
              ) : (
                <SnapshotView snap={selectedSnap} />
              )}
            </div>
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-center h-48">
            <p className="text-slate-500 text-sm">Select a snapshot to view its contents</p>
          </div>
        )}
      </div>
    </div>
  );
}

function SnapshotView({ snap }) {
  const config = parseConfig(snap.config || snap.snapshot_data || snap.data);
  if (!config) return <pre className="text-xs text-slate-400 whitespace-pre-wrap">{JSON.stringify(snap, null, 2)}</pre>;

  return (
    <pre className="text-xs text-slate-300 bg-slate-950 rounded-lg p-4 overflow-auto max-h-[400px] font-mono leading-relaxed">
      {JSON.stringify(config, null, 2)}
    </pre>
  );
}

function SnapshotDiff({ a, b }) {
  const configA = parseConfig(a.config || a.snapshot_data || a.data) || {};
  const configB = parseConfig(b.config || b.snapshot_data || b.data) || {};
  const allKeys = [...new Set([...Object.keys(configA), ...Object.keys(configB)])];

  const changed = allKeys.filter((k) => JSON.stringify(configA[k]) !== JSON.stringify(configB[k]));
  const same = allKeys.filter((k) => JSON.stringify(configA[k]) === JSON.stringify(configB[k]));

  return (
    <div className="space-y-1 font-mono text-xs">
      {changed.map((k) => (
        <div key={k}>
          {configA[k] !== undefined && (
            <div className="px-3 py-1 bg-red-500/10 text-red-300 rounded">
              - {k}: {JSON.stringify(configA[k])}
            </div>
          )}
          {configB[k] !== undefined && (
            <div className="px-3 py-1 bg-emerald-500/10 text-emerald-300 rounded">
              + {k}: {JSON.stringify(configB[k])}
            </div>
          )}
        </div>
      ))}
      {same.map((k) => (
        <div key={k} className="px-3 py-1 text-slate-600">
          &nbsp; {k}: {JSON.stringify(configA[k])}
        </div>
      ))}
    </div>
  );
}

// ─── Shared ───────────────────────────────────────────────────────────────────
function EmptyState({ icon, message }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl flex flex-col items-center justify-center py-16 text-slate-600">
      {icon}
      <p className="mt-3 text-sm text-slate-500">{message}</p>
    </div>
  );
}

function PageSkeleton() {
  return (
    <div className="min-h-screen bg-slate-950 p-6 space-y-4 animate-pulse">
      <div className="h-4 w-32 bg-slate-800 rounded" />
      <div className="h-12 w-64 bg-slate-800 rounded" />
      <div className="grid grid-cols-4 gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-16 bg-slate-800 rounded-xl" />
        ))}
      </div>
      <div className="h-64 bg-slate-800 rounded-xl" />
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function relativeTime(ts) {
  if (!ts) return null;
  const diff = (Date.now() - new Date(ts).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function formatDate(ts) {
  if (!ts) return "—";
  return new Date(ts).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function calcDuration(start, end) {
  if (!start) return "—";
  const s = new Date(start);
  const e = end ? new Date(end) : new Date();
  const diff = Math.floor((e - s) / 1000);
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ${Math.floor((diff % 3600) / 60)}m`;
  return `${Math.floor(diff / 86400)}d`;
}

function parseConfig(v) {
  if (!v) return null;
  if (typeof v === "object") return v;
  try { return JSON.parse(v); } catch { return { raw: v }; }
}

// ─── Icons ────────────────────────────────────────────────────────────────────
function ServerIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
    </svg>
  );
}
function ChevronIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}
function ShieldIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  );
}
function ClockIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

// ─── Mock Data ────────────────────────────────────────────────────────────────
function generateMockNode(id) {
  return {
    node: {
      id, hostname: `node-${id}.infralock.internal`, ip_address: `10.0.${id}.100`,
      status: ["online", "online", "degraded", "offline"][id % 4],
      os: "Ubuntu 22.04 LTS", cpu: "Intel Xeon E5-2680 v4 (14 cores)", ram_gb: 64,
      disk_gb: 1024, environment: "production", region: "ap-south-1",
      agent_version: "1.4.2", tags: ["prod", "mysql", "critical"],
      created_at: new Date(Date.now() - 90 * 86400_000).toISOString(),
      last_seen: new Date(Date.now() - 30_000).toISOString(),
    },
    incidents: Array.from({ length: 5 }, (_, i) => ({
      id: 1000 + i, title: ["High CPU Usage", "Disk Near Capacity", "Memory Leak Detected", "Network Packet Loss", "DB Connection Pool Exhausted"][i],
      severity: ["critical", "high", "medium", "high", "critical"][i],
      status: ["resolved", "resolved", "open", "resolved", "investigating"][i],
      started_at: new Date(Date.now() - (i + 1) * 7 * 86400_000).toISOString(),
      resolved_at: i !== 2 && i !== 4 ? new Date(Date.now() - (i + 1) * 7 * 86400_000 + 3600_000).toISOString() : null,
    })),
    slas: [
      { id: 1, name: "Uptime SLA", type: "Availability", target_percentage: 99.9, current_percentage: 99.97, period: "Monthly" },
      { id: 2, name: "Response Time SLA", type: "Latency", target_percentage: 95, current_percentage: 92.1, period: "Weekly" },
    ],
    snapshots: Array.from({ length: 6 }, (_, i) => ({
      id: i + 1,
      version: `v1.${6 - i}.0`,
      created_at: new Date(Date.now() - i * 14 * 86400_000).toISOString(),
      changed_by: ["aakash@infralock.dev", "admin@infralock.dev"][i % 2],
      config: JSON.stringify({
        max_connections: 200 + i * 10,
        timeout_ms: 5000,
        log_level: i < 2 ? "warn" : "info",
        backup_enabled: true,
        retention_days: 30,
        ssl_enabled: i < 3,
      }),
    })),
  };
}
