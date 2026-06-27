import { authFetch } from "./authFetch";

export const templateApi = {
  getTemplates: async () => {
    const res = await authFetch("/api/templates");
    if (!res.ok) throw new Error("Failed to fetch production templates");
    const data = await res.json();
    return (data || []).map((t) => ({ ...t, id: t._id || t.id }));
  },

  addTemplate: async (template) => {
    const res = await authFetch("/api/templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(template),
    });
    if (!res.ok) throw new Error("Failed to create template configuration");
    const data = await res.json();
    return { ...data, id: data._id || data.id };
  },
};
