import axios from "axios";

export const AUTH_EVENT = "comeback:logged-out";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "https://comback-u5j5.onrender.com/",
  withCredentials: true, // send the httpOnly auth cookies
});

// If an access token has expired, refresh once and retry the original request.
// Several requests failing at the same moment share one refresh call.
let refreshing = null;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;
    const isAuthCall = original?.url?.startsWith("/auth/");

    if (status === 401 && original && !original._retry && !isAuthCall) {
      original._retry = true;
      try {
        refreshing = refreshing || api.post("/auth/refresh").finally(() => (refreshing = null));
        await refreshing;
        return api(original);
      } catch (refreshError) {
        window.dispatchEvent(new Event(AUTH_EVENT));
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  }
);

export const errorMessage = (error, fallback = "Something went wrong. Try again.") => {
  if (error?.response?.data?.message) return error.response.data.message;
  if (error?.request && !error.response) {
    return "Cannot reach the server. Check that the backend is running.";
  }
  return fallback;
};

export default api;
