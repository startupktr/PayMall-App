import "axios";

declare module "axios" {
  export interface AxiosRequestConfig {
    _silentAuth?: boolean;
    _retry?: boolean;
  }
}
