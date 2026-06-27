import { authFetch } from "./authFetch";

export const workerApi = {
  getWorkers: async () => {
    const res = await authFetch("/api/workers");
    if (!res.ok) throw new Error("Failed to fetch workers list");
    const data = await res.json();
    return (data || []).map((w) => ({ ...w, id: w._id || w.id }));
  },

  addWorker: async (worker) => {
    const res = await authFetch("/api/workers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(worker),
    });
    if (!res.ok) throw new Error("Failed to register worker profile");
    const data = await res.json();
    return { ...data, id: data._id || data.id };
  },

  editWorker: async ({ workerId, updatedData }) => {
    const res = await authFetch(`/api/workers/${workerId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedData),
    });
    if (!res.ok) throw new Error("Failed to update worker profile details");
    const data = await res.json();
    return { ...data, id: data._id || data.id };
  },

  deleteWorker: async (workerId) => {
    const res = await authFetch(`/api/workers/${workerId}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("Failed to remove worker profile");
    const data = await res.json();
    return { id: data.id };
  },

  markWagesPaid: async ({ workerId, amount, setPending, totalDue }) => {
    const res = await authFetch(`/api/workers/${workerId}/pay`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount, setPending, totalDue }),
    });
    if (!res.ok) throw new Error("Failed to disburse/reset worker wages");
    const data = await res.json();
    return { ...data, id: data._id || data.id };
  },
};
