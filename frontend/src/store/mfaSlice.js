const createMfaSlice = (set, get) => ({
  mfaEnabled: false,
  mfaVerified: false,
  backupCodes: [],
  mfaLoading: false,
  mfaError: null,

  fetchMfaStatus: async () => {
    set({ mfaLoading: true, mfaError: null });
    try {
      const res = await fetch('/api/mfa/status', {
        headers: { Authorization: `Bearer ${get().token}` }
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      set({ mfaEnabled: data.enabled, mfaLoading: false });
    } catch (err) {
      set({ mfaError: err.message, mfaLoading: false });
    }
  },

  enableMfa: async () => {
    set({ mfaLoading: true, mfaError: null });
    try {
      const res = await fetch('/api/mfa/setup', {
        method: 'POST',
        headers: { Authorization: `Bearer ${get().token}` }
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      set({ mfaLoading: false });
      return data;
    } catch (err) {
      set({ mfaError: err.message, mfaLoading: false });
      return null;
    }
  },

  verifyMfa: async (token) => {
    set({ mfaLoading: true, mfaError: null });
    try {
      const res = await fetch('/api/mfa/verify', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${get().token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      if (data.token) {
        get().setAuth(get().user, data.token);
      }
      set({ mfaVerified: true, mfaEnabled: true, mfaLoading: false });
      return true;
    } catch (err) {
      set({ mfaError: err.message, mfaLoading: false });
      throw err;
    }
  },

  disableMfa: async (token) => {
    set({ mfaLoading: true, mfaError: null });
    try {
      const res = await fetch('/api/mfa/disable', {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${get().token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      set({ mfaEnabled: false, mfaVerified: false, mfaLoading: false });
    } catch (err) {
      set({ mfaError: err.message, mfaLoading: false });
    }
  },

  setMfaVerified: (val) => set({ mfaVerified: val }),
  clearMfaError: () => set({ mfaError: null }),
});

export default createMfaSlice;
