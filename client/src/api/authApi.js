import { authFetch } from "./authFetch";

export const authApi = {
  login: async ({ username, password }) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Login failed");
    }
    return await res.json();
  },

  register: async ({ username, password }) => {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Registration failed");
    }
    return await res.json();
  },

  getMe: async () => {
    const res = await authFetch("/api/auth/me");
    if (!res.ok) throw new Error("Failed to verify user profile session");
    return await res.json();
  },
};
