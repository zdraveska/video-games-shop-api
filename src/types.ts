// Category References
export interface ProductCategoryRef {
  key: string;
}

export interface CategoryReference {
  typeId: "category";
  id: string;
}

// Product Attributes
export interface ProductAttribute {
  name: string;
  value: AttributeValue;
}

export type AttributeValue =
  | string
  | number
  | boolean
  | null
  | CategoryReference;

// Product Variants
export interface ProductVariant {
  sku?: string;
  key?: string;
  attributes?: ProductAttribute[];
  prices?: unknown[];
  images?: unknown[];
}

// Product Input
export interface ProductInput {
  key: string;
  externalId?: string;
  productType: { key: string };
  taxCategory: { key: string };
  categories: ProductCategoryRef[];
  masterVariant: ProductVariant;
  variants?: ProductVariant[];
  name: Record<string, string>;
  slug: Record<string, string>;
  description?: Record<string, string>;
  metaTitle?: Record<string, string>;
  metaDescription?: Record<string, string>;
}
