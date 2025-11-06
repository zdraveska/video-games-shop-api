import { productService } from "../services/product-service.js";

interface QueryProductsArgs {
  limit?: number;
  offset?: number;
  search?: string;
  categoryKey?: string;
  platformKey?: string;
  sortBy?: "NAME" | "PRICE";
  sortOrder?: "ASC" | "DESC";
}

export const productResolvers = {
  Query: {
    product: async (_: any, { id }: { id: string }) => {
      return productService.getProductById(id);
    },

    products: async (_: any, args: QueryProductsArgs) => {
      return productService.getProducts(args);
    },
  },

  Product: {
    name: (parent: any) => ({ en_US: parent.name?.en_US || "" }),
    slug: (parent: any) => ({ en_US: parent.slug?.en_US || "" }),
    description: (parent: any) => ({ en_US: parent.description?.en_US || "" }),
    metaTitle: (parent: any) => ({ en_US: parent.metaTitle?.en_US || "" }),
    metaDescription: (parent: any) => ({
      en_US: parent.metaDescription?.en_US || "",
    }),
    categories: async (parent: any) => parent.categories || [],
    masterVariant: (parent: any) => parent.masterVariant,
    variants: (parent: any) => parent.variants || [],
  },
};
