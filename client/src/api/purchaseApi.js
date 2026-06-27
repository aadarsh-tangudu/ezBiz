import { mapServerPurchaseToClient, mapServerItemToClient } from "./mappers";
import { authFetch } from "./authFetch";

export const purchaseApi = {
  getPurchases: async () => {
    const res = await authFetch("/api/purchases");
    if (!res.ok) throw new Error("Failed to fetch procurement ledger");
    const data = await res.json();
    return (data || []).map(mapServerPurchaseToClient);
  },

  addPurchase: async (purchase) => {
    const res = await authFetch("/api/purchases", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(purchase),
    });
    if (!res.ok) throw new Error("Failed to log supplier purchase");
    const data = await res.json();
    return {
      purchase: mapServerPurchaseToClient(data.purchase),
      inventory: (data.inventory || []).map(mapServerItemToClient),
    };
  },

  payPurchase: async ({ purchaseId, amount }) => {
    const res = await authFetch(`/api/purchases/${purchaseId}/pay`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount }),
    });
    if (!res.ok)
      throw new Error("Failed to record outstanding purchase payment");
    const data = await res.json();
    return mapServerPurchaseToClient(data);
  },

  updatePurchaseFiles: async ({ purchaseId, fileType, fileData }) => {
    if (!fileData) {
      const res = await authFetch(
        `/api/purchases/${purchaseId}/upload?type=${fileType}`,
        {
          method: "DELETE",
        },
      );
      if (!res.ok) throw new Error("Failed to remove attachment");
      const data = await res.json();
      return mapServerPurchaseToClient(data);
    }

    const formData = new FormData();
    const blob = await fetch(fileData.data).then((r) => r.blob());
    formData.append("file", blob, fileData.name);

    const res = await authFetch(
      `/api/purchases/${purchaseId}/upload?type=${fileType}`,
      {
        method: "POST",
        body: formData,
      },
    );
    if (!res.ok) throw new Error("Failed to upload purchase receipt scan");
    const data = await res.json();
    return mapServerPurchaseToClient(data);
  },
};
