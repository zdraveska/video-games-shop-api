import { Money } from "@commercetools/platform-sdk";

export interface ProductVariant {
  id: number;
  sku: string;
  prices: { value: Money }[];
  images: any[];
  attributes: any[];
}

export interface Product {
  id: string;
  key?: string;
  version: number;
  name: { en_US: string };
  slug: { en_US: string };
  description: { en_US: string };
  metaTitle: { en_US: string };
  metaDescription: { en_US: string };
  categories: { id: string; name: { en_US: string } }[];
  masterVariant: ProductVariant;
  variants: ProductVariant[];
}

export function filterProductsBySearch(products: any[], searchTerm: string) {
  const searchLower = searchTerm.toLowerCase();
  return products.filter(
    (p: any) =>
      p.name.en_US.toLowerCase().includes(searchLower) ||
      p.description.en_US.toLowerCase().includes(searchLower)
  );
}

export function sortProductsByPrice(
  products: any[],
  sortOrder?: "ASC" | "DESC"
) {
  const order = sortOrder === "DESC" ? -1 : 1;
  return products.sort((a, b) => {
    const priceA = a.masterVariant.prices?.[0]?.value?.amount || 0;
    const priceB = b.masterVariant.prices?.[0]?.value?.amount || 0;
    return (priceA - priceB) * order;
  });
}
