import { create } from 'zustand';
import createAnomalySlice from './anomalySlice';
import createMfaSlice from './mfaSlice';

const useStore = create((set, get) => ({
  user: null,
  token: null,
  nodes: [],
  incidents: [],
  datacenters: [],

  login: async (email, password) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    set({ user: data.user, token: data.token });
    return data.mfa_required;
  },

  logout: () => set({ user: null, token: null }),

  setAuth: (user, token) => set({ user, token }),
  clearAuth: () => set({ user: null, token: null }),

  fetchNodes: async () => {
    const res = await fetch('/api/nodes', {
      headers: { Authorization: `Bearer ${get().token}` }
    });
    const data = await res.json();
    set({ nodes: Array.isArray(data) ? data : [] });
  },

  fetchIncidents: async () => {
    const res = await fetch('/api/incidents', {
      headers: { Authorization: `Bearer ${get().token}` }
    });
    const data = await res.json();
    set({ incidents: Array.isArray(data) ? data : [] });
  },

  fetchDatacenters: async () => {
    const res = await fetch('/api/datacenters', {
      headers: { Authorization: `Bearer ${get().token}` }
    });
    const data = await res.json();
    set({ datacenters: Array.isArray(data) ? data : [] });
  },

  pushMetrics: async ({ node_id, cpu_pct, memory_pct, disk_pct }) => {
    const res = await fetch('/api/metrics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${get().token}` },
      body: JSON.stringify({ node_id, cpu_pct, memory_pct, disk_pct }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to push metrics');
    return data;
  },

  ...createAnomalySlice(set, get),
  ...createMfaSlice(set, get),
}));

export default useStore;