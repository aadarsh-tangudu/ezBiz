import { mapServerSaleToClient, mapServerItemToClient } from "./mappers";
import { authFetch } from "./authFetch";

export const saleApi = {
  getSales: async () => {
    const res = await authFetch("/api/sales");
    if (!res.ok) throw new Error("Failed to fetch sales records");
    const data = await res.json();
    return (data || []).map(mapServerSaleToClient);
  },

  addSale: async (sale) => {
    const res = await authFetch("/api/sales", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(sale),
    });
    if (!res.ok) throw new Error("Failed to record sale invoice");
    const data = await res.json();
    return {
      sale: mapServerSaleToClient(data.sale),
      inventory: (data.inventory || []).map(mapServerItemToClient),
    };
  },

  paySale: async ({ saleId, amount }) => {
    const res = await authFetch(`/api/sales/${saleId}/pay`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount }),
    });
    if (!res.ok)
      throw new Error("Failed to record outstanding invoice payment");
    const data = await res.json();
    return mapServerSaleToClient(data);
  },

  updateSaleFiles: async ({ saleId, fileType, fileData }) => {
    if (!fileData) {
      const res = await authFetch(`/api/sales/${saleId}/upload?type=${fileType}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to remove attachment");
      const data = await res.json();
      return mapServerSaleToClient(data);
    }

    const formData = new FormData();
    const blob = await fetch(fileData.data).then((r) => r.blob());
    formData.append("file", blob, fileData.name);

    const res = await authFetch(`/api/sales/${saleId}/upload?type=${fileType}`, {
      method: "POST",
      body: formData,
    });
    if (!res.ok) throw new Error("Failed to upload sales invoice scan");
    const data = await res.json();
    return mapServerSaleToClient(data);
  },
};
