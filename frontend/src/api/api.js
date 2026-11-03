
import axios from "axios";

// Production on Netlify: always use /api.
// Local development: use the configured backend,
// or default to localhost:5000.
const api = axios.create({
  baseURL: import.meta.env.PROD
    ? "/api"
    : (
        import.meta.env.VITE_API_URL ||
        "http://localhost:5000/api"
      ),
});

// Attach login token to API requests.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(
    "gamebalance_token"
  );

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default api;
