export const API = (import.meta.env.VITE_API_URL || "https://comback-eight.vercel.app/").replace(/\/$/, "");

export async function request(path, options = {}, canRefresh = true) {
  const isForm = options.body instanceof FormData;
  const headers = {
    ...(options.body && !isForm ? { "Content-Type": "application/json" } : {}),
    ...options.headers,
  };
  const response = await fetch(`${API}${path}`, {
    credentials: "include",
    ...options,
    headers,
  });

  if (response.status === 401 && canRefresh && !["/auth/login", "/auth/register", "/auth/refresh"].includes(path)) {
    const refreshed = await fetch(`${API}/auth/refresh`, { method: "POST", credentials: "include" });
    if (refreshed.ok) return request(path, options, false);
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.message || `Request failed (${response.status})`);
    error.status = response.status;
    throw error;
  }
  return data;
}

export const json = (method, value) => ({ method, body: JSON.stringify(value) });
