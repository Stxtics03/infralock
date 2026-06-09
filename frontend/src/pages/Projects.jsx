import { useEffect, useState } from 'react';
import useStore from '../store';
import Navbar from '../components/Navbar';

// ----------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------
function statusColor(status) {
  switch (status) {
    case 'active':    return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    case 'inactive':  return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    case 'archived':  return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
    default:          return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
  }
}

function UsageBar({ label, used, allocated, unit }) {
  const pct     = allocated > 0 ? Math.min((used / allocated) * 100, 100) : 0;
  const barColor = pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-yellow-500' : 'bg-cyan-500';
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs text-gray-400">{label}</span>
        <span className="text-xs font-mono text-gray-300">
          {used}{unit} / {allocated}{unit}
        </span>
      </div>
      <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function AllocationSlider({ label, value, min = 0, max, step = 1, unit, onChange }) {
  return (
    <div>
      <div className="flex justify-between items-center mb-1.5">
        <label className="text-sm text-gray-300">{label}</label>
        <span className="text-sm font-bold font-mono text-cyan-400">{value}{unit}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full h-2 rounded-full appearance-none cursor-pointer accent-cyan-500 bg-gray-700"
      />
      <div className="flex justify-between text-xs text-gray-600 mt-0.5">
        <span>{min}{unit}</span>
        <span>{max}{unit}</span>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------
// Main Page
// ----------------------------------------------------------------
export default function Projects() {
  const token = useStore(s => s.token);

  const [projects, setProjects]     = useState([]);
  const [loading,  setLoading]      = useState(true);
  const [toast,    setToast]        = useState(null);

  // Create modal
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({
    project_name:         '',
    description:          '',
    allocated_ram_gb:     16,
    allocated_cpu_cores:  4,
    allocated_storage_tb: 1,
    rack_id:              '',
    status:               'active',
  });
  const [createBusy, setCreateBusy] = useState(false);

  // Nodes modal
  const [nodesModal, setNodesModal] = useState(null); // project object with nodes[]

  const showToast = (msg, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchProjects = async () => {
    try {
      const res  = await fetch('/api/projects', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load projects');
      setProjects(Array.isArray(data) ? data : []);
    } catch (err) {
      showToast(err.message, false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProjects(); }, []);

  // ---- Create project ----
  const handleCreate = async () => {
    if (!createForm.project_name.trim()) {
      showToast('Project name is required', false);
      return;
    }
    setCreateBusy(true);
    try {
      const res  = await fetch('/api/projects', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify({
          ...createForm,
          rack_id: createForm.rack_id || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create project');
      showToast(`✔ Project "${data.project_name}" created`);
      setShowCreate(false);
      setCreateForm({
        project_name: '', description: '',
        allocated_ram_gb: 16, allocated_cpu_cores: 4,
        allocated_storage_tb: 1, rack_id: '', status: 'active',
      });
      fetchProjects();
    } catch (err) {
      showToast(err.message, false);
    } finally {
      setCreateBusy(false);
    }
  };

  // ---- Delete project ----
  const handleDelete = async (project) => {
    if (!window.confirm(`Delete project "${project.project_name}"? Assigned nodes will be unlinked.`)) return;
    try {
      const res = await fetch(`/api/projects/${project.project_id}`, {
        method:  'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete');
      showToast(`Project "${project.project_name}" deleted`);
      fetchProjects();
    } catch (err) {
      showToast(err.message, false);
    }
  };

  // ---- Open nodes modal ----
  const openNodesModal = async (project) => {
    try {
      const res  = await fetch(`/api/projects/${project.project_id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load nodes');
      setNodesModal(data);
    } catch (err) {
      showToast(err.message, false);
    }
  };

  // ---- Unassign node ----
  const handleUnassign = async (projectId, nodeId, hostname) => {
    try {
      const res  = await fetch(`/api/projects/${projectId}/unassign-node`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ node_id: nodeId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to unassign');
      showToast(`Node "${hostname}" removed from project`);
      // Refresh nodes modal
      setNodesModal(prev => ({
        ...prev,
        nodes: prev.nodes.filter(n => n.node_id !== nodeId),
      }));
      fetchProjects();
    } catch (err) {
      showToast(err.message, false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <Navbar />

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-xl text-sm font-medium border transition-all
          ${toast.ok
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
            : 'bg-red-500/10 border-red-500/30 text-red-300'}`}>
          {toast.msg}
        </div>
      )}

      <main className="p-6 max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-xs font-semibold text-cyan-500 uppercase tracking-widest mb-1">Resource Allocation</p>
            <h1 className="text-2xl font-bold text-white">Projects</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-400">{projects.length} project{projects.length !== 1 ? 's' : ''}</span>
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-semibold transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Project
            </button>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="text-center py-24 text-gray-500">Loading projects…</div>
        ) : projects.length === 0 ? (
          <div className="text-center py-24 text-gray-500">No projects yet. Create one to start allocating resources.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map(p => (
              <ProjectCard
                key={p.project_id}
                project={p}
                onDelete={handleDelete}
                onViewNodes={openNodesModal}
              />
            ))}
          </div>
        )}
      </main>

      {/* ---- Create Project Modal ---- */}
      {showCreate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
          onClick={e => e.target === e.currentTarget && setShowCreate(false)}>
          <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-white mb-1">Create Project</h2>
            <p className="text-sm text-gray-400 mb-6">Set a name and define resource allocations.</p>

            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm text-gray-300 mb-1.5">Project Name <span className="text-red-400">*</span></label>
                <input
                  type="text"
                  placeholder="e.g. Payment Gateway Cluster"
                  value={createForm.project_name}
                  onChange={e => setCreateForm(f => ({ ...f, project_name: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition-colors"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm text-gray-300 mb-1.5">Description</label>
                <textarea
                  rows={2}
                  placeholder="Optional description…"
                  value={createForm.description}
                  onChange={e => setCreateForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition-colors resize-none"
                />
              </div>

              {/* Rack ID */}
              <div>
                <label className="block text-sm text-gray-300 mb-1.5">Rack ID <span className="text-gray-500">(optional)</span></label>
                <input
                  type="number"
                  placeholder="Leave blank if not rack-specific"
                  value={createForm.rack_id}
                  onChange={e => setCreateForm(f => ({ ...f, rack_id: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition-colors"
                />
              </div>

              <div className="border-t border-gray-800 pt-4 space-y-5">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Resource Allocations</p>
                <AllocationSlider
                  label="RAM" value={createForm.allocated_ram_gb} max={512} unit=" GB"
                  onChange={v => setCreateForm(f => ({ ...f, allocated_ram_gb: v }))}
                />
                <AllocationSlider
                  label="CPU Cores" value={createForm.allocated_cpu_cores} max={128} unit=" cores"
                  onChange={v => setCreateForm(f => ({ ...f, allocated_cpu_cores: v }))}
                />
                <AllocationSlider
                  label="Storage" value={createForm.allocated_storage_tb} max={100} step={0.5} unit=" TB"
                  onChange={v => setCreateForm(f => ({ ...f, allocated_storage_tb: v }))}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setShowCreate(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 transition-colors text-sm font-medium">
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={createBusy}
                className="flex-1 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-sm font-semibold transition-colors">
                {createBusy ? 'Creating…' : 'Create Project'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---- Nodes Modal ---- */}
      {nodesModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
          onClick={e => e.target === e.currentTarget && setNodesModal(null)}>
          <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-white">{nodesModal.project_name}</h2>
                <p className="text-sm text-gray-400">{nodesModal.nodes?.length ?? 0} assigned node{nodesModal.nodes?.length !== 1 ? 's' : ''}</p>
              </div>
              <button onClick={() => setNodesModal(null)}
                className="text-gray-500 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {nodesModal.nodes?.length === 0 ? (
              <p className="text-center py-10 text-gray-500 text-sm">No nodes assigned to this project.</p>
            ) : (
              <div className="space-y-2">
                {nodesModal.nodes.map(node => (
                  <div key={node.node_id}
                    className="flex items-center justify-between bg-gray-800 border border-gray-700 rounded-xl px-4 py-3">
                    <div>
                      <p className="text-sm font-mono font-semibold text-white">{node.hostname}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {node.cpu_cores} cores · {node.ram_gb} GB RAM · {node.storage_tb} TB
                      </p>
                    </div>
                    <button
                      onClick={() => handleUnassign(nodesModal.project_id, node.node_id, node.hostname)}
                      className="text-xs px-3 py-1.5 rounded-lg border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-colors">
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------------------
// Project Card
// ----------------------------------------------------------------
function ProjectCard({ project, onDelete, onViewNodes }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 flex flex-col gap-4 hover:border-gray-700 transition-colors">

      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold text-white truncate">{project.project_name}</p>
          {project.description && (
            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{project.description}</p>
          )}
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium flex-shrink-0 ${statusColor(project.status)}`}>
          {project.status}
        </span>
      </div>

      {/* Rack badge */}
      {project.rack_label && (
        <p className="text-xs text-gray-400">
          Rack: <span className="text-gray-200 font-mono">{project.rack_label}</span>
        </p>
      )}

      {/* Usage bars */}
      <div className="space-y-3">
        <UsageBar
          label="RAM"
          used={project.used_ram_gb}
          allocated={project.allocated_ram_gb}
          unit=" GB"
        />
        <UsageBar
          label="CPU Cores"
          used={project.used_cpu_cores}
          allocated={project.allocated_cpu_cores}
          unit=""
        />
        <UsageBar
          label="Storage"
          used={Number(project.used_storage_tb)}
          allocated={Number(project.allocated_storage_tb)}
          unit=" TB"
        />
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-4 text-xs text-gray-500">
        <span>{project.node_count} node{project.node_count !== 1 ? 's' : ''}</span>
        <span>·</span>
        <span>{project.ram_utilisation_pct}% RAM used</span>
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-auto pt-2 border-t border-gray-800">
        <button
          onClick={() => onViewNodes(project)}
          className="flex-1 py-2 rounded-xl bg-cyan-600/10 border border-cyan-600/20 text-cyan-400
            text-xs font-medium hover:bg-cyan-600/20 hover:border-cyan-500/40 transition-colors">
          View Nodes
        </button>
        <button
          onClick={() => onDelete(project)}
          className="py-2 px-3 rounded-xl border border-gray-700 text-gray-500
            text-xs font-medium hover:border-red-500/30 hover:text-red-400 transition-colors">
          Delete
        </button>
      </div>
    </div>
  );
}