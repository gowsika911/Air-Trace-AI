// In local dev, Vite's proxy (see vite.config.js) forwards /api to localhost:5000.
// In production, there is no dev server/proxy, so we call the deployed backend
// directly using a URL injected at build time via VITE_API_BASE_URL.
const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

async function handleResponse(res) {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed with status ${res.status}`);
  }
  return res.json();
}

export async function fetchZones() {
  const res = await fetch(`${BASE_URL}/zones`);
  return handleResponse(res);
}

export async function predictSource(pollutants) {
  const res = await fetch(`${BASE_URL}/predict`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(pollutants),
  });
  return handleResponse(res);
}
