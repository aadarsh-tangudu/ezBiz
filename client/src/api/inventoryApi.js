import { mapServerItemToClient, mapClientItemToServer } from "./mappers";
import { authFetch } from "./authFetch";

export const inventoryApi = {
  getInventory: async () => {
    const res = await authFetch("/api/inventory");
    if (!res.ok) throw new Error("Failed to fetch inventory");
    const data = await res.json();
    return (data || []).map(mapServerItemToClient);
  },

  addInventoryItem: async (item) => {
    const serverItem = mapClientItemToServer(item);
    const res = await authFetch("/api/inventory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(serverItem),
    });
    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.error || "Failed to create inventory item");
    }
    const data = await res.json();
    return mapServerItemToClient(data);
  },

  adjustStock: async ({ itemId, grade, deltaQty }) => {
    const res = await authFetch(`/api/inventory/${itemId}/adjust`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ grade, deltaQty }),
    });
    if (!res.ok) throw new Error("Failed to adjust stock quantity");
    const data = await res.json();
    return mapServerItemToClient(data);
  },

  updateItemGrades: async ({ itemId, newGrades, renameMap }) => {
    const res = await authFetch(`/api/inventory/${itemId}/grades`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ newGrades, renameMap }),
    });
    if (!res.ok) throw new Error("Failed to update stock grades configuration");
    const data = await res.json();
    return mapServerItemToClient(data);
  },
};
