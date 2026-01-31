import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE,
  withCredentials: true
});

let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

api.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  async (err) => {
    if (err.response?.status === 401 && !err.config.__isRetry) {
      try {
        err.config.__isRetry = true;
        const res = await api.post("/auth/refresh");
        setAccessToken(res.data.accessToken);
        err.config.headers.Authorization = `Bearer ${res.data.accessToken}`;
        return api.request(err.config);
      } catch {
        setAccessToken(null);
      }
    }
    throw err;
  }
);
