const BASE = import.meta.env.VITE_API_URL;

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

// Admin requests use credentials: 'include' so the browser attaches (and
// prompts for, on 401) Basic Auth credentials across origins.
const adminRequest = (path, options = {}) =>
  request(path, { ...options, credentials: 'include' });

export const getMachines = () => request('/api/machines');
export const getAdminState = () => adminRequest('/api/machines/admin/state');
export const resetMachine = (id) =>
  adminRequest(`/api/machines/${id}/reset`, { method: 'POST' });
export const startLoad = (id, pin, cycleDurationMinutes) =>
  request(`/api/machines/${id}/start`, {
    method: 'POST',
    body: JSON.stringify({ pin, cycleDurationMinutes }),
  });
export const collectLoad = (id, pin) =>
  request(`/api/machines/${id}/collect`, {
    method: 'POST',
    body: JSON.stringify({ pin }),
  });
export const randomizeState = () =>
  request('/api/machines/simulate/randomize', { method: 'POST' });
export const getUsageHeatmap = () => request('/api/machines/usage/heatmap');
export const getBestTimes = () => request('/api/machines/usage/best-times');
