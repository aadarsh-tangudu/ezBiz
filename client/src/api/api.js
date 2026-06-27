import { inventoryApi } from "./inventoryApi";
import { workerApi } from "./workerApi";
import { templateApi } from "./templateApi";
import { productionApi } from "./productionApi";
import { saleApi } from "./saleApi";
import { purchaseApi } from "./purchaseApi";
import { expenseApi } from "./expenseApi";
import { authApi } from "./authApi";

export const api = {
  ...inventoryApi,
  ...workerApi,
  ...templateApi,
  ...productionApi,
  ...saleApi,
  ...purchaseApi,
  ...expenseApi,
  ...authApi,
};
