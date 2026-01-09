import axios from "axios";
import * as SecureStore from "expo-secure-store";

const URL = 'http://192.168.1.12:8000'

const api = axios.create({
  baseURL: `${URL}/api/`,
});

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null) => {
  failedQueue.forEach(prom => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

/* 🔐 REQUEST INTERCEPTOR */
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/* 🔁 RESPONSE INTERCEPTOR (AUTO REFRESH) */
api.interceptors.response.use(
  res => res,
  async error => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      isRefreshing = true;

      const refresh = await SecureStore.getItemAsync("refreshToken");
      if (!refresh) {
        await SecureStore.deleteItemAsync("accessToken");
        return Promise.reject(error);
      }

      try {
        const res = await axios.post(
          `${URL}/api/accounts/token/refresh/`,
          { refresh }
        );

        await SecureStore.setItemAsync("accessToken", res.data.access);
        originalRequest.headers.Authorization = `Bearer ${res.data.access}`;

        processQueue(null, res.data.access);

        return api(originalRequest);
      } catch (err) {

        await SecureStore.deleteItemAsync("accessToken");
        await SecureStore.deleteItemAsync("refreshToken");

        processQueue(err, null);
        throw err;
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
