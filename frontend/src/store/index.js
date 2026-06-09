import { create } from 'zustand';
import createAnomalySlice from './anomalySlice';
import createMfaSlice from './mfaSlice';

const useStore = create((set, get) => ({
  user: null,
  token: null,
  nodes: [],
  incidents: [],
  datacenters: [],

  setAuth: (user, token) => set({ user, token }),
  clearAuth: () => set({ user: null, token: null }),

  fetchNodes: async () => {
    const res = await fetch('/api/nodes', {
      headers: { Authorization: `Bearer ${get().token}` }
    });
    const data = await res.json();
    set({ nodes: data });
  },

  fetchIncidents: async () => {
    const res = await fetch('/api/incidents', {
      headers: { Authorization: `Bearer ${get().token}` }
    });
    const data = await res.json();
    set({ incidents: data });
  },

  fetchDatacenters: async () => {
    const res = await fetch('/api/datacenters', {
      headers: { Authorization: `Bearer ${get().token}` }
    });
    const data = await res.json();
    set({ datacenters: data });
  },

  ...createAnomalySlice(set, get),
  ...createMfaSlice(set, get),
}));

export default useStore;