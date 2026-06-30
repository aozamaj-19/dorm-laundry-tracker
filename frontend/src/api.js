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

export const getMachines = () => request('/api/machines');
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
