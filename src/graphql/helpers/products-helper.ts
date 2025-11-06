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
