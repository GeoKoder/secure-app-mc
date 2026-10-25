import axios from "axios";

const API_URL = "http://localhost:4000/api";

// Create an axios instance with default config
const api = axios.create({
    baseURL: API_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

// Automatically attach token to every request
api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Auth API functions
export const authAPI = {
    register: (data) => api.post("/auth/register", data),
    login: (data) => api.post("/auth/login", data),
    getMe: () => api.get("/auth/me"),
    changePassword: (data) => api.put("/auth/password", data),
    deleteAccount: () => api.delete("/auth/account"),
};

export default api;