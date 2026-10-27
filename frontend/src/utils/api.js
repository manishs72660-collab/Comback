const productionApi = "https://comback-u5j5.onrender.com";
const configuredApi = import.meta.env.VITE_API_URL?.replace(/\/$/, "");
const pointsToFrontend = !import.meta.env.DEV && configuredApi &&
  new URL(configuredApi, window.location.origin).origin === window.location.origin;

export const API = pointsToFrontend
  ? productionApi
  : configuredApi || (import.meta.env.DEV ? "http://localhost:3000" : productionApi);

const fetchApi = async (url, options) => {
  try {
    const response = await fetch(url, options);
    window.dispatchEvent(new Event("comeback:network-restored"));
    return response;
  } catch (error) {
    window.dispatchEvent(new Event("comeback:network-error"));
    throw error;
  }
};

export async function request(path, options = {}, canRefresh = true) {
  const isForm = options.body instanceof FormData;
  const headers = {
    ...(options.body && !isForm ? { "Content-Type": "application/json" } : {}),
    ...options.headers,
  };
  const response = await fetchApi(`${API}${path}`, {
    credentials: "include",
    ...options,
    headers,
  });

  if (response.status === 401 && canRefresh && !["/auth/login", "/auth/register", "/auth/refresh"].includes(path)) {
    const refreshed = await fetchApi(`${API}/auth/refresh`, { method: "POST", credentials: "include" });
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
