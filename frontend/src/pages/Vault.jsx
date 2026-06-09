import { useState, useEffect } from 'react';
import useStore from '../store';
import Navbar from '../components/Navbar';

function Toast({ message, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg border text-sm font-medium shadow-lg flex items-center gap-2
      ${type === 'success' ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' : 'bg-red-500/20 border-red-500/30 text-red-400'}`}>
      {type === 'success' ? (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
      ) : (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
      )}
      {message}
    </div>
  );
}

function UploadModal({ node, onClose, onSuccess, token }) {
  const [password, setPassword] = useState('');
  const [file, setFile] = useState(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file || !password) return;
    setLoading(true); setError('');
    const form = new FormData();
    form.append('file', file);
    form.append('node_id', node.node_id);
    form.append('password', password);
    form.append('notes', notes);
    try {
      const res = await fetch('/api/vault/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      onSuccess(`Snapshot v${data.version} uploaded and encrypted successfully`);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-semibold text-white">Upload Config</h2>
            <p className="text-sm text-gray-400 mt-0.5">Node: <span className="text-cyan-400 font-mono">{node.hostname}</span></p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {error && (
          <div className="mb-4 px-3 py-2 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">{error}</div>
        )}

        <form onSubmit={handleUpload} className="space-y-4">
          <div>
            <label className="block text-xs text-gray-400 font-medium uppercase tracking-wider mb-1.5">Config File</label>
            <div className={`border-2 border-dashed rounded-xl p-4 text-center transition-colors cursor-pointer
              ${file ? 'border-cyan-500/50 bg-cyan-500/5' : 'border-gray-700 hover:border-gray-600'}`}
              onClick={() => document.getElementById('vault-file').click()}>
              <input id="vault-file" type="file" className="hidden" onChange={e => setFile(e.target.files[0])} />
              {file ? (
                <div className="flex items-center justify-center gap-2 text-cyan-400">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <span className="text-sm font-medium">{file.name}</span>
                  <span className="text-xs text-gray-500">({(file.size / 1024).toFixed(1)} KB)</span>
                </div>
              ) : (
                <div className="text-gray-500 text-sm">
                  <svg className="w-8 h-8 mx-auto mb-2 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                  Click to select file
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-400 font-medium uppercase tracking-wider mb-1.5">Encryption Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Strong password for AES-256-GCM encryption"
              required
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 font-medium uppercase tracking-wider mb-1.5">Notes <span className="text-gray-600 normal-case">(optional)</span></label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Post-maintenance backup"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 text-sm font-medium rounded-lg transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading || !file || !password}
              className="flex-1 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2">
              {loading ? (
                <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Encrypting...</>
              ) : (
                <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>Encrypt & Upload</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DecryptModal({ snapshot, onClose, onSuccess, token }) {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDecrypt = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await fetch(`/api/vault/${snapshot.snapshot_id}/decrypt`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Decryption failed');
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `snapshot-v${snapshot.version}.cfg`;
      a.click();
      URL.revokeObjectURL(url);
      onSuccess('File decrypted and downloaded successfully');
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-semibold text-white">Decrypt & Download</h2>
            <p className="text-sm text-gray-400 mt-0.5">Snapshot <span className="text-cyan-400 font-mono">v{snapshot.version}</span></p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {error && (
          <div className="mb-4 px-3 py-2 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm font-mono">{error}</div>
        )}

        <form onSubmit={handleDecrypt} className="space-y-4">
          <div>
            <label className="block text-xs text-gray-400 font-medium uppercase tracking-wider mb-1.5">Decryption Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Password used during upload"
              required
              autoFocus
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 text-sm font-medium rounded-lg transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading || !password}
              className="flex-1 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2">
              {loading ? (
                <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Decrypting...</>
              ) : (
                <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>Download</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Vault() {
  const token = useStore(s => s.token);
  const [nodes, setNodes] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [snapshots, setSnapshots] = useState([]);
  const [loadingNodes, setLoadingNodes] = useState(true);
  const [loadingSnaps, setLoadingSnaps] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [showDecrypt, setShowDecrypt] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => setToast({ message, type });

  useEffect(() => {
    fetch('/api/nodes', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => { setNodes(Array.isArray(data) ? data : []); setLoadingNodes(false); })
      .catch(() => setLoadingNodes(false));
  }, [token]);

  useEffect(() => {
    if (!selectedNode) return;
    setLoadingSnaps(true);
    fetch(`/api/vault/${selectedNode.node_id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => { setSnapshots(Array.isArray(data) ? data : []); setLoadingSnaps(false); })
      .catch(() => setLoadingSnaps(false));
  }, [selectedNode, token]);

  const refreshSnapshots = () => {
    if (!selectedNode) return;
    setLoadingSnaps(true);
    fetch(`/api/vault/${selectedNode.node_id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => { setSnapshots(Array.isArray(data) ? data : []); setLoadingSnaps(false); })
      .catch(() => setLoadingSnaps(false));
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="p-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center">
              <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Config Vault</h1>
              <p className="text-sm text-gray-400">AES-256-GCM encrypted node configuration backups</p>
            </div>
          </div>
          {selectedNode && (
            <button onClick={() => setShowUpload(true)}
              className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-semibold rounded-lg transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
              Upload Config
            </button>
          )}
        </div>

        {/* Node Selector */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-4">
          <label className="block text-xs text-gray-400 font-medium uppercase tracking-wider mb-2">Select Node</label>
          {loadingNodes ? (
            <div className="h-10 bg-gray-800 rounded-lg animate-pulse" />
          ) : (
            <div className="flex flex-wrap gap-2">
              {nodes.map(n => (
                <button key={n.node_id}
                  onClick={() => setSelectedNode(n)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-mono font-medium transition-colors border
                    ${selectedNode?.node_id === n.node_id
                      ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-400'
                      : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-white hover:border-gray-600'}`}>
                  {n.hostname}
                </button>
              ))}
              {nodes.length === 0 && <span className="text-gray-500 text-sm">No nodes found</span>}
            </div>
          )}
        </div>

        {/* Snapshots */}
        {selectedNode && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-white">Snapshots for</span>
                <code className="text-sm text-cyan-400 bg-cyan-400/10 px-2 py-0.5 rounded">{selectedNode.hostname}</code>
              </div>
              <span className="text-xs text-gray-500">{snapshots.length} snapshot{snapshots.length !== 1 ? 's' : ''}</span>
            </div>

            {loadingSnaps ? (
              <div className="p-8 text-center">
                <svg className="w-6 h-6 animate-spin text-cyan-500 mx-auto" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
              </div>
            ) : snapshots.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                <svg className="w-10 h-10 mx-auto mb-3 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
                <p className="text-sm">No snapshots yet for this node</p>
                <button onClick={() => setShowUpload(true)}
                  className="mt-3 text-sm text-cyan-400 hover:text-cyan-300 transition-colors">
                  Upload the first config →
                </button>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800">
                    {['Version', 'Uploaded At', 'Size', 'Uploaded By', 'Notes', 'Actions'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {snapshots.map(snap => (
                    <tr key={snap.snapshot_id} className="border-b border-gray-800/50 last:border-0 hover:bg-gray-800/30 transition-colors">
                      <td className="px-4 py-3">
                        <span className="font-mono text-cyan-400 bg-cyan-400/10 px-2 py-0.5 rounded text-xs">v{snap.version}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-300 font-mono text-xs">
                        {new Date(snap.uploaded_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs">
                        {snap.file_size_bytes ? `${(snap.file_size_bytes / 1024).toFixed(1)} KB` : '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs">{snap.uploaded_by ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{snap.notes ?? '—'}</td>
                      <td className="px-4 py-3">
                        <button onClick={() => setShowDecrypt(snap)}
                          className="flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 transition-colors font-medium">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          Decrypt & Download
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {!selectedNode && !loadingNodes && (
          <div className="text-center py-20 text-gray-600">
            <svg className="w-12 h-12 mx-auto mb-3 text-gray-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <p className="text-sm">Select a node above to view its config snapshots</p>
          </div>
        )}
      </div>

      {showUpload && (
        <UploadModal
          node={selectedNode}
          token={token}
          onClose={() => setShowUpload(false)}
          onSuccess={(msg) => { showToast(msg); refreshSnapshots(); }}
        />
      )}
      {showDecrypt && (
        <DecryptModal
          snapshot={showDecrypt}
          token={token}
          onClose={() => setShowDecrypt(null)}
          onSuccess={(msg) => showToast(msg)}
        />
      )}
    </div>
  );
}