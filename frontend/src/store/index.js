import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import createAnomalySlice from './anomalySlice';
import createMfaSlice from './mfaSlice';

const useStore = create(
  persist(
    (set, get) => ({
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
    }),
    {
      name: 'infralock-auth',
      partialize: (state) => ({ user: state.user, token: state.token }),
    }
  )
);

export default useStore;