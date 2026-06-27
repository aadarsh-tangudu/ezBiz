import { mapServerExpenseToClient } from "./mappers";
import { authFetch } from "./authFetch";

export const expenseApi = {
  getExpenses: async () => {
    const res = await authFetch("/api/expenses");
    if (!res.ok) throw new Error("Failed to fetch expenses");
    const data = await res.json();
    return (data || []).map(mapServerExpenseToClient);
  },

  addExpense: async (expense) => {
    const res = await authFetch("/api/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(expense),
    });
    if (!res.ok) throw new Error("Failed to log operational expense");
    const data = await res.json();
    return mapServerExpenseToClient(data);
  },

  updateExpenseFiles: async ({ expenseId, fileType, fileData }) => {
    if (!fileData) {
      const res = await authFetch(
        `/api/expenses/${expenseId}/upload?type=${fileType}`,
        {
          method: "DELETE",
        },
      );
      if (!res.ok) throw new Error("Failed to remove attachment");
      const data = await res.json();
      return mapServerExpenseToClient(data);
    }

    const formData = new FormData();
    const blob = await fetch(fileData.data).then((r) => r.blob());
    formData.append("file", blob, fileData.name);

    const res = await authFetch(
      `/api/expenses/${expenseId}/upload?type=${fileType}`,
      {
        method: "POST",
        body: formData,
      },
    );
    if (!res.ok) throw new Error("Failed to upload expense voucher scan");
    const data = await res.json();
    return mapServerExpenseToClient(data);
  },
};
