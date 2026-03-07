import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || "http://localhost:8000/api",
  headers: {
    "Content-Type": "application/json",
  },

  timeout: 15000,
});

// Automatically inject Bearer token into every request
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle expired/invalid tokens (401) globally
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      const authPaths = ["/login", "/register"];
      if (!authPaths.includes(window.location.pathname)) {
        const from = encodeURIComponent(
          window.location.pathname + window.location.search
        );
        window.location.replace(`/login?from=${from}`);
      }
    }

    if (!error.response) {
      error.isNetworkError = true;
      error.response = {
        status: 0,
        data: {
          detail:
            error.code === "ECONNABORTED"
              ? "Request timed out. Please check your connection and try again."
              : "Network error. Please check your connection and try again.",
        },
      };
    }

    return Promise.reject(error);
  }
);

export default API;