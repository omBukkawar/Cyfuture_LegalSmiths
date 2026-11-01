/**
 * Centralized Authentication & Token Management Utilities
 */

export const isAuthenticated = () => {
  const token = localStorage.getItem("accessToken");
  return Boolean(token && token.trim() !== "");
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

