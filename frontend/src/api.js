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

function authHeaders(token) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ---------- Public: zones & prediction ----------

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

// ---------- Public: chatbot & authorities ----------

export async function askChatbot(message) {
  const res = await fetch(`${BASE_URL}/chatbot`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
  });
  return handleResponse(res);
}

export async function fetchAuthorities() {
  const res = await fetch(`${BASE_URL}/authorities`);
  return handleResponse(res);
}

// ---------- Auth ----------

export async function login(email, password) {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return handleResponse(res);
}

export async function signup(name, email, password) {
  const res = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  });
  return handleResponse(res);
}

export async function fetchMe(token) {
  const res = await fetch(`${BASE_URL}/auth/me`, {
    headers: authHeaders(token),
  });
  return handleResponse(res);
}

// ---------- Admin only ----------

export async function updateZoneAdmin(token, zoneId, fields) {
  const res = await fetch(`${BASE_URL}/admin/zones/${zoneId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
    body: JSON.stringify(fields),
  });
  return handleResponse(res);
}

export async function sendAuthorityMessage(token, { authority, subject, body }) {
  const res = await fetch(`${BASE_URL}/admin/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
    body: JSON.stringify({ authority, subject, body }),
  });
  return handleResponse(res);
}

export async function fetchSentMessages(token) {
  const res = await fetch(`${BASE_URL}/admin/messages`, {
    headers: authHeaders(token),
  });
  return handleResponse(res);
}

// ---------- Saved chat history (login required) ----------

export async function listConversations(token) {
  const res = await fetch(`${BASE_URL}/chat/conversations`, { headers: authHeaders(token) });
  return handleResponse(res);
}

export async function getConversation(token, id) {
  const res = await fetch(`${BASE_URL}/chat/conversations/${id}`, { headers: authHeaders(token) });
  return handleResponse(res);
}

export async function deleteConversation(token, id) {
  const res = await fetch(`${BASE_URL}/chat/conversations/${id}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
  return handleResponse(res);
}

// conversationId = null starts a new chat.
export async function sendChatMessage(token, { conversationId, message }) {
  const res = await fetch(`${BASE_URL}/chat/message`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
    body: JSON.stringify({ conversationId, message }),
  });
  return handleResponse(res);
}
