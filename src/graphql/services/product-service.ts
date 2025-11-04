import { ctClient, projectKey } from "../../clients/ct-client.js";
import { APIError } from "../../errors/api-error.js";
import { Product } from "../helpers/products-helper.js";
import { toFormattedMoney } from "../helpers/money-helper.js";

interface ProductFilters {
  limit?: number;
  offset?: number;
  search?: string;
  categoryKey?: string;
  sortBy?: "NAME" | "PRICE";
  sortOrder?: "ASC" | "DESC";
}

export class ProductService {
  async fetchProduct(productId: string): Promise<Product> {
    const response = await ctClient.execute({
      method: "GET",
      uri: `/${projectKey}/product-projections/${productId}`,
    });

    const productData = response.body;
    if (!productData) throw new Error(`Product ${productId} not found`);

    const categories = await Promise.all(
      (productData.categories || []).map(async (catRef: any) => {
        try {
          const res = await ctClient.execute({
            method: "GET",
            uri: `/${projectKey}/categories/${catRef.id}`,
          });
          return {
            id: res.body.id,
            name: { en_US: res.body.name["en-US"] || "" },
          };
        } catch {
          return { id: catRef.id, name: { en_US: "" } };
        }
      })
    );

    return {
      id: productData.id,
      key: productData.key,
      version: productData.version,
      name: { en_US: productData.name["en-US"] },
      slug: { en_US: productData.slug["en-US"] },
      description: { en_US: productData.description["en-US"] },
      metaTitle: { en_US: productData.metaTitle?.["en-US"] || "" },
      metaDescription: { en_US: productData.metaDescription?.["en-US"] || "" },
      categories,
      masterVariant: productData.masterVariant,
      variants: productData.variants || [],
    };
  }

  async getProductById(id: string) {
    try {
      const product = await this.fetchProduct(id);

      product.masterVariant.prices = (product.masterVariant.prices || []).map(
        (price: any) => ({ ...price, value: toFormattedMoney(price.value) })
      );

      product.variants = (product.variants || []).map((variant: any) => ({
        ...variant,
        prices: (variant.prices || []).map((price: any) => ({
          ...price,
          value: toFormattedMoney(price.value),
        })),
      }));

      return product;
    } catch (err: any) {
      console.error("Error fetching product by ID:", err);
      if (err.message.includes("not found")) {
        throw new APIError(`Product ${id} not found`, 404);
      }
      throw new APIError(err.message || "Failed to fetch product", 500);
    }
  }

  async getProducts(filters: ProductFilters) {
    try {
      const limit = filters.limit || 20;
      const offset = filters.offset || 0;

      const queryParams: string[] = [`limit=${limit}`, `offset=${offset}`];
      const filterQueries: string[] = [];

      if (filters.categoryKey) {
        const categoryId = await this.getCategoryIdByKey(filters.categoryKey);
        if (categoryId) {
          filterQueries.push(`categories.id:"${categoryId}"`);
        } else {
          return { total: 0, offset, limit, results: [] };
        }
      }

      if (filterQueries.length > 0) {
        queryParams.push(
          `filter=${encodeURIComponent(filterQueries.join(" and "))}`
        );
      }

      if (filters.sortBy === "NAME") {
        const order = filters.sortOrder === "DESC" ? "desc" : "asc";
        queryParams.push(`sort=${encodeURIComponent(`name.en-US ${order}`)}`);
      }

      const fullUrl = `/${projectKey}/product-projections/search?${queryParams.join(
        "&"
      )}`;

      const res = await ctClient.execute({ method: "GET", uri: fullUrl });
      let productsRaw = res.body.results || [];

      let products = await Promise.all(
        productsRaw.map(async (p: any) => {
          const product = await this.fetchProduct(p.id);

          product.masterVariant.prices = (
            product.masterVariant.prices || []
          ).map((price: any) => ({
            ...price,
            value: toFormattedMoney(price.value),
          }));

          product.variants = (product.variants || []).map((variant: any) => ({
            ...variant,
            prices: (variant.prices || []).map((price: any) => ({
              ...price,
              value: toFormattedMoney(price.value),
            })),
          }));

          return product;
        })
      );

      if (filters.search) {
        products = this.filterProductsBySearch(products, filters.search);
      }

      if (filters.sortBy === "PRICE") {
        products = this.sortProductsByPrice(products, filters.sortOrder);
      }

      return {
        total: products.length,
        offset,
        limit,
        results: products.slice(0, limit),
      };
    } catch (err: any) {
      console.error("Error fetching products:", err);
      throw new APIError(
        err.message || "Failed to fetch products",
        err.statusCode || 500
      );
    }
  }

  private async getCategoryIdByKey(
    categoryKey: string
  ): Promise<string | null> {
    const categoryRes = await ctClient.execute({
      method: "GET",
      uri: `/${projectKey}/categories?where=key="${categoryKey}"`,
    });

    if (categoryRes.body.results.length > 0) {
      return categoryRes.body.results[0].id;
    }
    return null;
  }

  private filterProductsBySearch(products: any[], searchTerm: string) {
    const searchLower = searchTerm.toLowerCase();
    return products.filter(
      (p: any) =>
        p.name.en_US.toLowerCase().includes(searchLower) ||
        p.description.en_US.toLowerCase().includes(searchLower)
    );
  }

  private sortProductsByPrice(products: any[], sortOrder?: "ASC" | "DESC") {
    const order = sortOrder === "DESC" ? -1 : 1;
    return products.sort((a, b) => {
      const priceA = a.masterVariant.prices?.[0]?.value?.amount || 0;
      const priceB = b.masterVariant.prices?.[0]?.value?.amount || 0;
      return (priceA - priceB) * order;
    });
  }
}

export const productService = new ProductService();
