import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/api";
import { toaster } from "../components/ui/toaster";

// --- QUERY HOOKS ---

export const useInventoryQuery = () => {
  const token = localStorage.getItem("token");
  return useQuery({
    queryKey: ["inventory"],
    queryFn: api.getInventory,
    enabled: !!token,
  });
};

export const useWorkersQuery = () => {
  const token = localStorage.getItem("token");
  return useQuery({
    queryKey: ["workers"],
    queryFn: api.getWorkers,
    enabled: !!token,
  });
};

export const useTemplatesQuery = () => {
  const token = localStorage.getItem("token");
  return useQuery({
    queryKey: ["templates"],
    queryFn: api.getTemplates,
    enabled: !!token,
  });
};

export const useProductionRunsQuery = () => {
  const token = localStorage.getItem("token");
  return useQuery({
    queryKey: ["productionRuns"],
    queryFn: api.getProductionRuns,
    enabled: !!token,
  });
};

export const useSalesQuery = () => {
  const token = localStorage.getItem("token");
  return useQuery({
    queryKey: ["sales"],
    queryFn: api.getSales,
    enabled: !!token,
  });
};

export const usePurchasesQuery = () => {
  const token = localStorage.getItem("token");
  return useQuery({
    queryKey: ["purchases"],
    queryFn: api.getPurchases,
    enabled: !!token,
  });
};

export const useExpensesQuery = () => {
  const token = localStorage.getItem("token");
  return useQuery({
    queryKey: ["expenses"],
    queryFn: api.getExpenses,
    enabled: !!token,
  });
};


// --- MUTATION HOOKS ---

export const useAddInventoryMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.addInventoryItem,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      toaster.create({
        title: "Stock Item Created",
        description: `Item "${data.name}" registered successfully.`,
        type: "success",
      });
    },
    onError: (err) => {
      toaster.create({
        title: "Registration Failed",
        description: err.message,
        type: "error",
      });
    }
  });
};

export const useAdjustStockMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.adjustStock,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      toaster.create({
        title: "Stock Adjusted",
        description: `Adjusted Grade ${variables.grade} quantity by ${variables.deltaQty > 0 ? "+" : ""}${variables.deltaQty}.`,
        type: "info",
      });
    },
  });
};

export const useUpdateItemGradesMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.updateItemGrades,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      toaster.create({
        title: "Grades Updated",
        description: "Stock grades configuration updated successfully.",
        type: "success",
      });
    },
  });
};

export const useAddWorkerMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.addWorker,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["workers"] });
      toaster.create({
        title: "Worker Profile Added",
        description: `Worker "${data.name}" successfully registered.`,
        type: "success",
      });
    },
  });
};

export const useEditWorkerMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.editWorker,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workers"] });
      toaster.create({
        title: "Worker Updated",
        description: "Worker profile updated successfully.",
        type: "success",
      });
    },
  });
};

export const useDeleteWorkerMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.deleteWorker,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workers"] });
      toaster.create({
        title: "Worker Removed",
        description: "Worker profile deleted successfully.",
        type: "warning",
      });
    },
  });
};

export const useMarkWagesPaidMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.markWagesPaid,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["workers"] });
      if (variables.setPending) {
        toaster.create({
          title: "Payroll Cycle Reset",
          description: "Worker marked as pending for next payment period.",
          type: "info",
        });
      } else {
        toaster.create({
          title: "Wages Disbursed",
          description: `Wages of ₹${variables.amount.toLocaleString()} cleared.`,
          type: "success",
        });
      }
    },
  });
};

export const useAddTemplateMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.addTemplate,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
      toaster.create({
        title: "Template Saved",
        description: `Production template "${data.name}" created successfully.`,
        type: "success",
      });
    },
  });
};

export const useRunProductionMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.runProduction,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["productionRuns"] });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["workers"] });
      toaster.create({
        title: "Production Run Complete",
        description: `Run complete. Yield: ${data.run.yieldPercent.toFixed(1)}%. Wastage: ${data.run.wastage}kg.`,
        type: "success",
      });
    },
  });
};

export const useAddSaleMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.addSale,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      toaster.create({
        title: "Invoice Recorded",
        description: `Invoice recorded with ${data.sale.items.length} items. Stock levels updated.`,
        type: "success",
      });
    },
  });
};

export const usePaySaleMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.paySale,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      toaster.create({
        title: "Payment Recorded",
        description: `Recorded payment of ₹${variables.amount.toLocaleString()} for sale.`,
        type: "success",
      });
    },
  });
};

export const useUpdateSaleFilesMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.updateSaleFiles,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      toaster.create({
        title: "Attachment Updated",
        description: `${variables.fileType === "billFile" ? "Invoice document" : "Receipt document"} updated successfully.`,
        type: "success",
      });
    },
  });
};

export const useAddPurchaseMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.addPurchase,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["purchases"] });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      toaster.create({
        title: "Purchase Logged",
        description: `Procured ${data.purchase.items.length} items. Stock levels updated.`,
        type: "success",
      });
    },
  });
};

export const usePayPurchaseMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.payPurchase,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["purchases"] });
      toaster.create({
        title: "Payment Recorded",
        description: `Recorded payment of ₹${variables.amount.toLocaleString()} for purchase.`,
        type: "success",
      });
    },
  });
};

export const useUpdatePurchaseFilesMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.updatePurchaseFiles,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["purchases"] });
      toaster.create({
        title: "Attachment Updated",
        description: `${variables.fileType === "billFile" ? "Purchase document" : "Receipt document"} updated successfully.`,
        type: "success",
      });
    },
  });
};

export const useAddExpenseMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.addExpense,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      toaster.create({
        title: "Expense Logged",
        description: `Logged operating expense: ${data.name} (₹${data.amount}).`,
        type: "info",
      });
    },
  });
};

export const useUpdateExpenseFilesMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.updateExpenseFiles,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      toaster.create({
        title: "Attachment Updated",
        description: `${variables.fileType === "billFile" ? "Voucher document" : "Receipt document"} updated successfully.`,
        type: "success",
      });
    },
  });
};
