const createAnomalySlice = (set, get) => ({
  anomalies: [],
  summary: [],
  loading: false,
  error: null,

  fetchAnomalies: async () => {
    set({ loading: true, error: null });
    try {
      const res = await fetch('/api/anomalies', {
        headers: { Authorization: `Bearer ${get().token}` }
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      set({ anomalies: data, loading: false });
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },

  fetchSummary: async () => {
    try {
      const res = await fetch('/api/anomalies/summary', {
        headers: { Authorization: `Bearer ${get().token}` }
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      set({ summary: data });
    } catch (err) {
      set({ error: err.message });
    }
  },

  resolveAnomaly: async (id) => {
    try {
      await fetch(`/api/anomalies/${id}/resolve`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${get().token}` }
      });
      set(state => ({
        anomalies: state.anomalies.filter(a => a.anomaly_id !== id)
      }));
    } catch (err) {
      set({ error: err.message });
    }
  }
});

export default createAnomalySlice;