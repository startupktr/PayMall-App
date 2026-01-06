import axios from "axios";
import * as SecureStore from "expo-secure-store";

const api = axios.create({
  baseURL: "http://192.168.1.8:8000/api/",
});

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

      const refresh = await SecureStore.getItemAsync("refreshToken");
      if (!refresh) {
        await SecureStore.deleteItemAsync("accessToken");
        return Promise.reject(error);
      }

      try {
        const res = await axios.post(
          "http://192.168.1.8:8000/api/accounts/token/refresh/",
          { refresh }
        );

        await SecureStore.setItemAsync("accessToken", res.data.access);
        originalRequest.headers.Authorization = `Bearer ${res.data.access}`;

        return api(originalRequest);
      } catch {
        await SecureStore.deleteItemAsync("accessToken");
        await SecureStore.deleteItemAsync("refreshToken");
      }
    }

    return Promise.reject(error);
  }
);

export default api;
