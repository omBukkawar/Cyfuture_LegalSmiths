export const NODE_API_URL =
  import.meta.env.VITE_NODE_API_URL || "http://localhost:5000";

export const AI_API_URL =
  import.meta.env.VITE_AI_API_URL || "http://localhost:8000";

// Helper to get auth headers with stored JWT token
export const getAuthHeaders = () => {
  const token = localStorage.getItem("accessToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

