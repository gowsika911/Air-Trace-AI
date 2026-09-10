const BASE_URL = '/api';

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
