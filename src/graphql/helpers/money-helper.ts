import { Money } from "@commercetools/platform-sdk";

export interface FormattedMoney {
  centAmount: number;
  currencyCode: string;
  amount: number;
}

// Convert from commercetools SDK/API money format
export function toFormattedMoney(money?: Money): FormattedMoney {
  const cent = money?.centAmount ?? 0;
  const currency = money?.currencyCode ?? "USD";
  return {
    centAmount: cent,
    currencyCode: currency,
    amount: cent / 100,
  };
}
