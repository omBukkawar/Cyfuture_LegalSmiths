/**
 * Centralized Authentication & Token Management Utilities
 */

// Decode JWT payload without verifying signature (client-side expiry check only)
function decodeTokenPayload(token) {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return null;
  }
}

export const isAuthenticated = () => {
  const token = localStorage.getItem("accessToken");
  if (!token || !token.trim()) return false;
  const payload = decodeTokenPayload(token);
  if (!payload?.exp) return false;
  return payload.exp * 1000 > Date.now();
};

export const getUser = () => {
  try {
    const userStr = localStorage.getItem("user");
    return userStr ? JSON.parse(userStr) : null;
  } catch (err) {
    console.error("Failed to parse user from localStorage:", err);
    return null;
  }
};

export const logout = (navigate) => {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("user");

  if (navigate) {
    navigate("/login", { replace: true });
  } else {
    window.location.href = "/login";
  }
};

