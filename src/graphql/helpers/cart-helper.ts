import { Product } from "./products-helper.js";
import { FormattedMoney } from "./money-helper.js";

export interface CartItem {
  product: Product;
  quantity: number;
  price: FormattedMoney;
}

export interface Cart {
  id: string;
  items: CartItem[];
  totalAmount: FormattedMoney;
}

export const emptyMoney: FormattedMoney = {
  centAmount: 0,
  currencyCode: "USD",
  amount: 0,
};

export function buildCart(listId: string, items: CartItem[]): Cart {
  if (!items || items.length === 0) {
    return { id: listId || "empty", items: [], totalAmount: emptyMoney };
  }

  const totalCents = items.reduce(
    (sum, item) => sum + (item.price.centAmount || 0) * item.quantity,
    0
  );
  const currency = items[0]?.price.currencyCode || "USD";

  return {
    id: listId,
    items,
    totalAmount: {
      centAmount: totalCents,
      currencyCode: currency,
      amount: totalCents / 100,
    },
  };
}
