import { mapServerItemToClient } from "./mappers";
import { authFetch } from "./authFetch";

export const productionApi = {
  getProductionRuns: async () => {
    const res = await authFetch("/api/production/runs");
    if (!res.ok) throw new Error("Failed to fetch production runs ledger");
    const data = await res.json();
    return (data || []).map((r) => ({ ...r, id: r._id || r.id }));
  },

  runProduction: async (run) => {
    const res = await authFetch("/api/production/runs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(run),
    });
    if (!res.ok) throw new Error("Failed to log daily production run");
    const data = await res.json();
    return {
      run: { ...data.run, id: data.run._id || data.run.id },
      inventory: (data.inventory || []).map(mapServerItemToClient),
      workers: (data.workers || []).map((w) => ({ ...w, id: w._id || w.id })),
    };
  },
};
