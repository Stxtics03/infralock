import { useState } from 'react';
import useStore from '../store';
import Navbar from '../components/Navbar';

export default function Vault() {
  const token = useStore(s => s.token);
  const [nodeId, setNodeId] = useState('');
  const [password, setPassword] = useState('');
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file || !nodeId || !password) return;
    const form = new FormData();
    form.append('file', file);
    form.append('node_id', nodeId);
    form.append('password', password);
    const res = await fetch('/api/vault/upload', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });
    const data = await res.json();
    setMessage(res.ok ? `Uploaded snapshot ${data.snapshot_id}` : data.error);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <main className="p-6 max-w-xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Config Vault</h1>
        <form onSubmit={handleUpload} className="bg-white p-6 rounded-xl border border-gray-200 space-y-4">
          <div>
            <label className="block text-sm text-gray-700 mb-1">Node ID</label>
            <input value={nodeId} onChange={e => setNodeId(e.target.value)} className="w-full border rounded-lg px-3 py-2" required />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Encryption Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full border rounded-lg px-3 py-2" required />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Config File</label>
            <input type="file" onChange={e => setFile(e.target.files[0])} className="w-full" required />
          </div>
          <button type="submit" className="bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800">
            Upload & Encrypt
          </button>
          {message && <p className="text-sm text-gray-600">{message}</p>}
        </form>
      </main>
    </div>
  );
}
