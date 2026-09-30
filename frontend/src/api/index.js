import api from "./axios";

export const authApi = {
  register: (body) => api.post("/auth/register", body),
  login: (body) => api.post("/auth/login", body),
  logout: () => api.post("/auth/logout"),
  me: () => api.get("/auth/me"),
  refresh: () => api.post("/auth/refresh"),
};

export const routineApi = {
  list: (params) => api.get("/routines", { params }),
  create: (body) => api.post("/routines", body),
  update: (id, body) => api.put(`/routines/${id}`, body),
  toggle: (id) => api.patch(`/routines/${id}/toggle`),
  remove: (id) => api.delete(`/routines/${id}`),
};

export const logApi = {
  day: (date) => api.get("/logs/day", { params: { date } }),
  set: (body) => api.put("/logs", body),
  history: (from, to, today) => api.get("/logs/history", { params: { from, to, today } }),
};

export const dashboardApi = {
  get: (date) => api.get("/dashboard", { params: { date } }),
};
