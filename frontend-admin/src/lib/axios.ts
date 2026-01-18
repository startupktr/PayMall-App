import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

/* ==============================
   RESPONSE INTERCEPTOR (SAFE)
============================== */

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any) => {
  failedQueue.forEach(p => p.reject(error));
  failedQueue = [];
};

api.interceptors.response.use(
  res => res,
  async error => {
    const originalRequest = error.config;
    const url = originalRequest.url || "";

    // ❌ DO NOT refresh for these endpoints
    if (
      url.includes("/login") ||
      url.includes("/refresh") ||
      url.includes("/me")
    ) {
      return Promise.reject(error);
    }

    if (error.response?.status !== 401) {
      return Promise.reject(error);
    }

    if (originalRequest._retry) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((_, reject) => {
        failedQueue.push({ reject });
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      await api.post("/accounts/admin/token/refresh/");
      isRefreshing = false;
      return api(originalRequest);
    } catch (refreshError) {
      isRefreshing = false;
      processQueue(refreshError);
      window.location.href = "/admin/login";
      return Promise.reject(refreshError);
    }
  }
);

export default api;
