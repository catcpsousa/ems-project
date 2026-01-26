import { getToken, clearAuth } from "./auth";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8080";

export async function apiFetch(path, options = {}) {
  const token = getToken();

  const headers = new Headers(options.headers || {});
  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  // se token expirou/invalidou
  if (res.status === 401) {
    clearAuth();
  }

  return res;
}