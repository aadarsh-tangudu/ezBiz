import { create } from "zustand";
import { toaster } from "../components/ui/toaster";

export const useStore = create((set, get) => ({
  // Auth States
  token: localStorage.getItem("token") || null,
  user: JSON.parse(localStorage.getItem("user") || "null"),

  login: (token, user) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    set({ token, user });
  },

  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    set({ token: null, user: null });
  },

  // Skeleton States
  inventory: [],
  workers: [],
  templates: [],
  productionRuns: [],
  sales: [],
  purchases: [],
  expenses: [],
  isLoading: false,

  setInventory: (inventory) => set({ inventory }),
  setWorkers: (workers) => set({ workers }),
  setTemplates: (templates) => set({ templates }),
  setProductionRuns: (productionRuns) => set({ productionRuns }),
  setSales: (sales) => set({ sales }),
  setPurchases: (purchases) => set({ purchases }),
  setExpenses: (expenses) => set({ expenses }),

  setIsLoading: (loading) => set({ isLoading: loading }),
  simulateLoading: (delayMs = 800) => {
    set({ isLoading: true });
    setTimeout(() => {
      set({ isLoading: false });
    }, delayMs);
  },

  // 1. Inventory Actions
  addInventoryItem: (item) => {
    const id = item.name.toLowerCase().replace(/\s+/g, "-");
    const newItem = { ...item, id };
    set((state) => ({ inventory: [...state.inventory, newItem] }));
    toaster.create({
      title: "Stock Item Created",
      description: `Item "${item.name}" registered successfully.`,
      type: "success",
    });
  },

  adjustStock: (itemId, grade, deltaQty, notes = "") => {
    set((state) => ({
      inventory: state.inventory.map((item) => {
        if (item.id === itemId) {
          const currentStock = item.stocks?.[grade] || 0;
          const updatedStocks = {
            ...item.stocks,
            [grade]: Math.max(0, currentStock + deltaQty),
          };
          return { ...item, stocks: updatedStocks };
        }
        return item;
      }),
    }));

    const unit = get().inventory.find((i) => i.id === itemId)?.unit || "kg";
    toaster.create({
      title: "Stock Adjusted",
      description: `Adjusted Grade ${grade} quantity by ${deltaQty > 0 ? "+" : ""}${deltaQty} ${unit}.`,
      type: "info",
    });
  },

  updateItemGrades: (itemId, newGrades, renameMap = {}) => {
    set((state) => ({
      inventory: state.inventory.map((item) => {
        if (item.id !== itemId) return item;

        const nextStocks = {};
        const nextAvgCost = {};

        newGrades.forEach((g) => {
          const oldKey = Object.keys(renameMap).find((k) => renameMap[k] === g);
          if (oldKey) {
            nextStocks[g] = item.stocks?.[oldKey] || 0;
            nextAvgCost[g] = item.avgCost?.[oldKey] || 0;
          } else if (item.stocks && item.stocks[g] !== undefined) {
            nextStocks[g] = item.stocks[g];
            nextAvgCost[g] = item.avgCost[g] || 0;
          } else {
            nextStocks[g] = 0;
            nextAvgCost[g] = 0;
          }
        });

        return {
          ...item,
          grades: newGrades,
          stocks: nextStocks,
          avgCost: nextAvgCost,
        };
      }),
    }));
  },

  // 2. Sales Actions
  addSale: (sale) => {
    const id = `sale-${Math.random().toString(36).substring(2, 9)}`;
    const newSale = { ...sale, id };
    
    set((state) => {
      // Update inventory for each item in the sale
      const updatedInventory = state.inventory.map((invItem) => {
        let updatedItem = { ...invItem };
        let itemStocks = { ...updatedItem.stocks };
        let changed = false;

        sale.items.forEach((saleItem) => {
          if (invItem.id === saleItem.itemId) {
            const currentStock = itemStocks[saleItem.grade] || 0;
            itemStocks[saleItem.grade] = Math.max(0, currentStock - saleItem.qty);
            changed = true;
          }
        });

        if (changed) {
          updatedItem.stocks = itemStocks;
        }
        return updatedItem;
      });

      return {
        sales: [newSale, ...state.sales],
        inventory: updatedInventory,
      };
    });

    toaster.create({
      title: "Invoice Recorded",
      description: `Invoice recorded with ${sale.items.length} items. Stock levels updated.`,
      type: "success",
    });
  },

  updateSaleFiles: (saleId, fileType, fileData) => {
    set((state) => ({
      sales: state.sales.map((s) => (s.id === saleId ? { ...s, [fileType]: fileData } : s)),
    }));
    toaster.create({
      title: "Attachment Updated",
      description: `${fileType === "billFile" ? "Invoice document" : "Receipt document"} updated successfully.`,
      type: "success",
    });
  },

  paySale: (saleId, amount) => {
    set((state) => ({
      sales: state.sales.map((s) => {
        if (s.id === saleId) {
          const currentPaid = s.paidAmount !== undefined ? s.paidAmount : (s.paymentStatus === "Paid" ? s.totalAmount : 0);
          const newPaidAmount = Math.min(s.totalAmount, currentPaid + amount);
          const newStatus = newPaidAmount >= s.totalAmount ? "Paid" : "Partially Paid";
          return {
            ...s,
            paidAmount: newPaidAmount,
            paymentStatus: newStatus,
          };
        }
        return s;
      }),
    }));
    toaster.create({
      title: "Payment Recorded",
      description: `Recorded payment of ₹${amount.toLocaleString()} for sale.`,
      type: "success",
    });
  },

  // 3. Purchases Actions
  addPurchase: (purchase) => {
    const id = `pur-${Math.random().toString(36).substring(2, 9)}`;
    const newPurchase = { ...purchase, id };

    set((state) => {
      // Update inventory stock levels & avgCost
      const updatedInventory = state.inventory.map((invItem) => {
        let updatedItem = { ...invItem };
        let itemStocks = { ...updatedItem.stocks };
        let itemAvgCost = { ...updatedItem.avgCost };
        let changed = false;

        purchase.items.forEach((purItem) => {
          if (invItem.id === purItem.itemId) {
            const currentStock = itemStocks[purItem.grade] || 0;
            const currentAvgCost = itemAvgCost[purItem.grade] || 0;

            const nextStock = currentStock + purItem.qty;
            // Weighted average calculation:
            const nextAvgCost = nextStock > 0
              ? ((currentStock * currentAvgCost) + (purItem.qty * purItem.rate)) / nextStock
              : purItem.rate;

            itemStocks[purItem.grade] = nextStock;
            itemAvgCost[purItem.grade] = nextAvgCost;
            changed = true;
          }
        });

        if (changed) {
          updatedItem.stocks = itemStocks;
          updatedItem.avgCost = itemAvgCost;
        }
        return updatedItem;
      });

      return {
        purchases: [newPurchase, ...state.purchases],
        inventory: updatedInventory,
      };
    });

    toaster.create({
      title: "Purchase Logged",
      description: `Procured ${purchase.items.length} items. Stock levels updated.`,
      type: "success",
    });
  },

  updatePurchaseFiles: (purchaseId, fileType, fileData) => {
    set((state) => ({
      purchases: state.purchases.map((p) => (p.id === purchaseId ? { ...p, [fileType]: fileData } : p)),
    }));
    toaster.create({
      title: "Attachment Updated",
      description: `${fileType === "billFile" ? "Purchase document" : "Receipt document"} updated successfully.`,
      type: "success",
    });
  },

  payPurchase: (purchaseId, amount) => {
    set((state) => ({
      purchases: state.purchases.map((p) => {
        if (p.id === purchaseId) {
          const currentPaid = p.paidAmount !== undefined ? p.paidAmount : (p.paymentStatus === "Paid" ? p.totalCost : 0);
          const newPaidAmount = Math.min(p.totalCost, currentPaid + amount);
          const newStatus = newPaidAmount >= p.totalCost ? "Paid" : "Partially Paid";
          return {
            ...p,
            paidAmount: newPaidAmount,
            paymentStatus: newStatus,
          };
        }
        return p;
      }),
    }));
    toaster.create({
      title: "Payment Recorded",
      description: `Recorded payment of ₹${amount.toLocaleString()} for purchase.`,
      type: "success",
    });
  },

  // 4. Production Actions
  runProduction: (run) => {
    const id = `run-${Math.random().toString(36).substring(2, 9)}`;
    const newRun = { ...run, id };

    set((state) => {
      // Deduct inputs & Add outputs to inventory based on specific grades
      const updatedInventory = state.inventory.map((item) => {
        let updatedStocks = { ...item.stocks };
        let changed = false;

        // Deduct inputs
        run.inputs.forEach((input) => {
          if (item.id === input.itemId) {
            const hasGrades = item.grades && item.grades.length > 0;
            const defaultGrade = hasGrades ? (item.grades[0] || "A") : "";
            const grade = (input.grade !== undefined && input.grade !== null) ? input.grade : defaultGrade;
            updatedStocks[grade] = Math.max(0, (updatedStocks[grade] || 0) - input.actualQty);
            changed = true;
          }
        });

        // Add outputs
        run.outputs.forEach((output) => {
          if (item.id === output.itemId) {
            const hasGrades = item.grades && item.grades.length > 0;
            const defaultGrade = hasGrades ? (item.grades[0] || "A") : "";
            const grade = (output.grade !== undefined && output.grade !== null) ? output.grade : defaultGrade;
            updatedStocks[grade] = (updatedStocks[grade] || 0) + output.actualQty;
            changed = true;
          }
        });

        return changed ? { ...item, stocks: updatedStocks } : item;
      });

      // Log pending salary/wages for all assigned workers
      const updatedWorkers = state.workers.map((w) => {
        const matchedRunWorker = run.workers?.find((rw) => rw.workerId === w.id);
        if (matchedRunWorker && matchedRunWorker.wages > 0) {
          const hasPaidBefore = (w.paidAmount || 0) > 0;
          return { ...w, paymentStatus: hasPaidBefore ? "Partially Paid" : "Pending" };
        }
        return w;
      });

      return {
        productionRuns: [newRun, ...state.productionRuns],
        inventory: updatedInventory,
        workers: updatedWorkers,
      };
    });

    toaster.create({
      title: "Production Run Complete",
      description: `Run complete. Yield: ${run.yieldPercent.toFixed(1)}%. Wastage: ${run.wastage}kg.`,
      type: "success",
    });
  },

  addTemplate: (t) => {
    const newTemplate = { ...t, id: `temp-${Date.now()}` };
    set((state) => ({ templates: [...state.templates, newTemplate] }));
  },

  // 5. Worker Actions
  addWorker: (worker) => {
    const id = `worker-${Math.random().toString(36).substring(2, 9)}`;
    const newWorker = { ...worker, id, paidAmount: 0 };
    set((state) => ({ workers: [...state.workers, newWorker] }));
    toaster.create({
      title: "Worker Profile Added",
      description: `Worker "${worker.name}" successfully registered.`,
      type: "success",
    });
  },

  editWorker: (workerId, updatedData) => {
    set((state) => ({
      workers: state.workers.map((w) => (w.id === workerId ? { ...w, ...updatedData } : w)),
    }));
    toaster.create({
      title: "Worker Updated",
      description: "Worker profile updated successfully.",
      type: "success",
    });
  },

  deleteWorker: (workerId) => {
    set((state) => ({
      workers: state.workers.filter((w) => w.id !== workerId),
    }));
    toaster.create({
      title: "Worker Removed",
      description: "Worker profile deleted successfully.",
      type: "warning",
    });
  },

  markWagesPaid: (workerId, amount = 0, setPending = false, totalDue = null) => {
    set((state) => ({
      workers: state.workers.map((w) => {
        if (w.id === workerId) {
          const newPaidAmount = setPending ? 0 : (w.paidAmount || 0) + amount;
          let newStatus = "Pending";
          if (!setPending) {
            const actualTotalDue = totalDue !== null ? totalDue : (w.type === "Salary" ? w.rate : 0);
            if (actualTotalDue > 0) {
              if (newPaidAmount >= actualTotalDue) {
                newStatus = "Paid";
              } else if (newPaidAmount > 0) {
                newStatus = "Partially Paid";
              }
            } else {
              newStatus = "Paid";
            }
          }
          return {
            ...w,
            paymentStatus: newStatus,
            paidAmount: newPaidAmount,
          };
        }
        return w;
      }),
    }));

    if (setPending) {
      toaster.create({
        title: "Payroll Cycle Reset",
        description: "Worker marked as pending for next payment period.",
        type: "info",
      });
    } else {
      toaster.create({
        title: "Wages Disbursed",
        description: `Wages of ₹${amount.toLocaleString()} cleared.`,
        type: "success",
      });
    }
  },

  // 6. Expenses Actions
  addExpense: (expense) => {
    const id = `exp-${Math.random().toString(36).substring(2, 9)}`;
    const newExpense = { ...expense, id, billFile: null, receiptFile: null };
    set((state) => ({ expenses: [newExpense, ...state.expenses] }));
    toaster.create({
      title: "Expense Logged",
      description: `Logged operating expense: ${expense.name} (₹${expense.amount}).`,
      type: "info",
    });
  },

  updateExpenseFiles: (expenseId, fileType, fileData) => {
    set((state) => ({
      expenses: state.expenses.map((e) => (e.id === expenseId ? { ...e, [fileType]: fileData } : e)),
    }));
    toaster.create({
      title: "Attachment Updated",
      description: `${fileType === "billFile" ? "Voucher document" : "Receipt document"} updated successfully.`,
      type: "success",
    });
  },
}));

// Derived Selector Hook for Alerts Count
export const useAlertsCount = () => {
  const inventory = useStore((state) => state.inventory);
  const workers = useStore((state) => state.workers);
  return {
    lowStock: inventory.filter((item) => {
      const total = Object.values(item.stocks || {}).reduce((sum, qty) => sum + qty, 0);
      return total <= item.lowStockAlert;
    }).length,
    unpaidWorkers: workers.some((w) => w.paymentStatus === "Pending"),
  };
};
