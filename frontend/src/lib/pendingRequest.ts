import type { AxiosRequestConfig } from "axios";

let pendingConfig: AxiosRequestConfig | null = null;

export const pendingRequest = {
  set(config: AxiosRequestConfig) {
    pendingConfig = {
      url: config.url,
      method: config.method,
      data: config.data,
      params: config.params,
      headers: config.headers,
      baseURL: config.baseURL,
    };
  },

  clear() {
    pendingConfig = null;
  },

  has() {
    return !!pendingConfig;
  },

  get() {
    return pendingConfig;
  },
};
