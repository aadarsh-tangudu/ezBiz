export const mapServerItemToClient = (item) => {
  if (!item) return null;
  const grades = [];
  const stocks = {};
  const avgCost = {};
  
  if (item.hasGrades) {
    (item.grades || []).forEach((g) => {
      if (g && typeof g === "object" && g.grade !== undefined) {
        grades.push(g.grade);
        stocks[g.grade] = g.stockQuantity || 0;
        avgCost[g.grade] = g.avgCost || 0;
      } else {
        grades.push(g);
      }
    });
  } else {
    stocks[""] = item.stockQuantity || 0;
    avgCost[""] = item.avgCost || 0;
  }

  return {
    ...item,
    id: item._id || item.id,
    grades,
    stocks,
    avgCost
  };
};

export const mapClientItemToServer = (item) => {
  const hasGrades = item.hasGrades !== undefined ? !!item.hasGrades : (item.grades && item.grades.length > 0);
  const grades = hasGrades
    ? (item.grades || []).map((g) => ({
        grade: g,
        stockQuantity: item.stocks?.[g] || 0,
        avgCost: item.avgCost?.[g] || 0
      }))
    : [];

  return {
    name: item.name,
    unit: item.unit,
    lowStockAlert: item.lowStockAlert,
    hasGrades,
    stockQuantity: !hasGrades ? (item.stocks?.[""] || 0) : 0,
    avgCost: !hasGrades ? (item.avgCost?.[""] || 0) : 0,
    grades
  };
};

export const mapServerFileToClient = (file) => {
  if (!file) return null;
  return {
    ...file,
    name: file.filename,
    type: file.contentType,
    size: file.size,
    fileId: file.fileId,
  };
};

export const mapServerSaleToClient = (sale) => {
  if (!sale) return null;
  return {
    ...sale,
    id: sale._id || sale.id,
    billFile: mapServerFileToClient(sale.billFile),
    receiptFile: mapServerFileToClient(sale.receiptFile),
  };
};

export const mapServerPurchaseToClient = (purchase) => {
  if (!purchase) return null;
  return {
    ...purchase,
    id: purchase._id || purchase.id,
    billFile: mapServerFileToClient(purchase.billFile),
    receiptFile: mapServerFileToClient(purchase.receiptFile),
  };
};

export const mapServerExpenseToClient = (expense) => {
  if (!expense) return null;
  return {
    ...expense,
    id: expense._id || expense.id,
    billFile: mapServerFileToClient(expense.billFile),
    receiptFile: mapServerFileToClient(expense.receiptFile),
  };
};
