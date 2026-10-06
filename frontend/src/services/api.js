import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const reqUrl = error.config?.url || "";
    const isAuthAttempt =
      reqUrl.includes("/api/auth/login") || reqUrl.includes("/api/auth/signup");

    // Login/signup 401 must stay on the form so the error message can render.
    if (status === 401 && !isAuthAttempt) {
      let role = null;
      try {
        const saved = localStorage.getItem("user");
        role = saved ? JSON.parse(saved).role : null;
      } catch (e) {
        role = null;
      }
      localStorage.removeItem("access_token");
      localStorage.removeItem("user");
      window.location.href = role === "patient" ? "/patient/login" : "/login";
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  signup: async (userData) => {
    const response = await api.post("/api/auth/signup", userData);
    return response.data;
  },

  login: async (credentials) => {
    const response = await api.post("/api/auth/login", credentials);
    return response.data;
  },

  getCurrentUser: async () => {
    const response = await api.get("/api/auth/me");
    return response.data;
  },
};

// Notes API
export const notesAPI = {
  uploadNote: async (noteData) => {
    const response = await api.post("/api/note/upload", noteData);
    return response.data;
  },

  uploadPrescription: async ({ file, title, patientId }) => {
    const form = new FormData();
    form.append("file", file);
    if (title) form.append("title", title);
    if (patientId) form.append("patient_id", patientId);
    const response = await api.post("/api/note/upload_prescription", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  processNote: async (noteId) => {
    const response = await api.post("/api/note/process", { note_id: noteId });
    return response.data;
  },

  getNotes: async (params = {}) => {
    const response = await api.get("/api/notes", { params });
    return response.data;
  },

  getNoteDetail: async (noteId) => {
    const response = await api.get(`/api/note/${noteId}`);
    return response.data;
  },

  getEntities: async (params = {}) => {
    const response = await api.get("/api/entities", { params });
    return response.data;
  },

  deleteNote: async (noteId) => {
    const response = await api.delete(`/api/note/${noteId}`);
    return response.data;
  },
};

// Chat API
export const chatAPI = {
  ask: async ({ question, noteId, topKNotes = 3 }) => {
    const response = await api.post("/api/chat", {
      question,
      note_id: noteId || null,
      top_k_notes: topKNotes,
    });
    return response.data;
  },
};

// Utility functions
export const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem("access_token", token);
  } else {
    localStorage.removeItem("access_token");
  }
};

export const getAuthToken = () => {
  return localStorage.getItem("access_token");
};

export const setUser = (user) => {
  if (user) {
    localStorage.setItem("user", JSON.stringify(user));
  } else {
    localStorage.removeItem("user");
  }
};

export const getUser = () => {
  const user = localStorage.getItem("user");
  return user ? JSON.parse(user) : null;
};

export const clearAuth = () => {
  localStorage.removeItem("access_token");
  localStorage.removeItem("user");
};

export default api;
