// src/lib/api.ts
import axios, { AxiosInstance } from "axios";

const BASE_URL =
  (import.meta as any).env?.VITE_API_BASE_URL ||
  // fallback for local dev:
  "http://localhost:5000/api";

const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach JWT token from localStorage (key: "token") to every request
api.interceptors.request.use(
  (config) => {
    try {
      if (typeof window !== "undefined") {
        const token = localStorage.getItem("token");
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
    } catch (e) {
      // ignore read errors
      console.warn("Could not read auth token from localStorage", e);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Global response handler (optional central place for common errors)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    if (status === 401) {
      // Token expired / invalid — clear and redirect to auth
      try {
        if (typeof window !== "undefined") {
          localStorage.removeItem("token");
          // you may want to show a toast here, or dispatch a global logout event
          window.location.href = "/auth";
        }
      } catch (e) {
        // ignore
      }
    }
    return Promise.reject(error);
  }
);

export default api;
export { api };
