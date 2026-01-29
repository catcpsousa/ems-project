const TOKEN_KEY = "ems.token";
const USER_KEY = "ems.user";
const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8080";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function getUser() {
  const user = localStorage.getItem(USER_KEY);
  return user ? JSON.parse(user) : null;
}

export function setUser(user) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

// Role checks
export function isAdmin() {
  return getUser()?.role === "ADMIN";
}

export function isOrganizer() {
  return getUser()?.role === "ORGANIZER";
}

export function isParticipant() {
  return getUser()?.role === "PARTICIPANT";
}

export async function login(username, password) {
  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    throw new Error(msg || `Login falhou (${res.status})`);
  }

  const data = await res.json();
  setToken(data.token);
  setUser({
    username: data.username,
    role: data.role,
    fullName: data.fullName,
  });
  return data;
}

export async function register({ username, password, email, fullName, phone, role }) {
  const res = await fetch(`${API_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password, email, fullName, phone, role }),
  });

  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    throw new Error(msg || `Registo falhou (${res.status})`);
  }

  return await res.text();
}