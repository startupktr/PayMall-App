import axios from "axios";
import * as SecureStore from "expo-secure-store";
import { authEvents } from "@/lib/authEvents";
import { pendingRequest } from "@/lib/pendingRequest";

const URL = "http://192.168.1.4:8000";

const api = axios.create({
  baseURL: `${URL}/api/`,
});

export type RequestConfigWithMeta = {
  _silentAuth?: boolean; // ✅ if true, do not show login required popup
  _retry?: boolean;
};

let isRefreshing = false;
let failedQueue: {
  resolve: (token: string) => void;
  reject: (err: any) => void;
}[] = [];

const processQueue = (error: any, token: string | null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token!);
  });
  failedQueue = [];
};

/* =============================
   REQUEST INTERCEPTOR
============================= */
api.interceptors.request.use(async (config: any) => {
  const token = await SecureStore.getItemAsync("accessToken");

  // ✅ always ensure headers exists
  config.headers = config.headers || {};

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

/* =============================
   RESPONSE INTERCEPTOR
============================= */
api.interceptors.response.use(
  (response) => response.data,

  async (error) => {
    const originalRequest = error.config as any as RequestConfigWithMeta & {
      url?: string;
      method?: string;
      headers?: any;
    };

    if (!error.response) return Promise.reject(error);

    // ✅ if silent request → do NOT trigger login modal
    if (error.response.status === 401 && originalRequest?._silentAuth) {
      return Promise.reject(error);
    }

    // ✅ Prevent refresh recursion on auth endpoints
    const isAuthEndpoint =
      originalRequest?.url?.includes("accounts/login") ||
      originalRequest?.url?.includes("accounts/token/refresh") ||
      originalRequest?.url?.includes("accounts/signup") ||
      originalRequest?.url?.includes("accounts/me"); // ✅ important

    // ✅ only try refresh for non-auth endpoints
    if (
      error.response.status === 401 &&
      !originalRequest._retry &&
      !isAuthEndpoint
    ) {
      originalRequest._retry = true;

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers = originalRequest.headers || {};
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      isRefreshing = true;

      const refresh = await SecureStore.getItemAsync("refreshToken");

      // ✅ no refresh token: user must login (only if NOT silent)
      if (!refresh) {
        await SecureStore.deleteItemAsync("accessToken");

        const method = originalRequest.method?.toUpperCase?.() || "GET";

        // ✅ Only save safe GET requests (never save POST/PATCH/DELETE)
        if (!originalRequest._silentAuth && method === "GET") {
          pendingRequest.set(originalRequest);
        }

        authEvents.emitAuthRequired({ reason: "missing_refresh_token" });

        processQueue(error, null);
        isRefreshing = false;
        return Promise.reject(error);
      }

      try {
        const res = await axios.post(`${URL}/api/accounts/token/refresh/`, {
          refresh,
        });

        await SecureStore.setItemAsync("accessToken", res.data.access);

        processQueue(null, res.data.access);

        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${res.data.access}`;

        return api(originalRequest);
      } catch (err) {
        await SecureStore.deleteItemAsync("accessToken");
        await SecureStore.deleteItemAsync("refreshToken");

        processQueue(err, null);

        const method = originalRequest.method?.toUpperCase?.() || "GET";

        if (!originalRequest._silentAuth && method === "GET") {
          pendingRequest.set(originalRequest);
        }

        authEvents.emitAuthRequired({ reason: "refresh_failed" });

        throw err;
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
