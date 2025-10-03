import { ctClient, projectKey } from "../clients/ct-client.js";
import { APIError } from "../errors/api-error.js";

interface QueryProductArgs {
  id: string;
}

interface QueryProductsArgs {
  limit?: number;
  offset?: number;
  search?: string;
  categoryKey?: string;
  sortBy?: "NAME" | "PRICE";
  sortOrder?: "ASC" | "DESC";
}

export const resolvers = {
  Query: {
    // Getting product details by ID
    product: async (_: any, { id }: QueryProductArgs) => {
      try {
        const response = await ctClient.execute({
          method: "GET",
          uri: `/${projectKey}/products/${id}`,
        });
        return response.body;
      } catch (error) {
        console.error("Error fetching product:", error);
        throw new APIError(`Product: ${id} not found.`, 404);
      }
    },

    // Listing all products
    products: async (_: any, args: QueryProductsArgs) => {
      const limit = args.limit || 20;
      const offset = args.offset || 0;

      const queryParams: string[] = [
        `limit=${limit}`,
        `offset=${offset}`,
        `staged=true`,
      ];

      const filterQueries: string[] = [];

      // Searching products
      if (args.search) {
        queryParams.push(`text.en-US=${encodeURIComponent(args.search)}`);
      }

      // Filtering products by category
      if (args.categoryKey) {
        try {
          const categoryResponse = await ctClient.execute({
            method: "GET",
            uri: `/${projectKey}/categories?where=key="${args.categoryKey}"`,
          });

          if (categoryResponse.body.results.length > 0) {
            const categoryId = categoryResponse.body.results[0].id;
            filterQueries.push(`categories.id:"${categoryId}"`);
          }
        } catch (error) {
          console.error("Error fetching category:", error);
        }
      }

      if (filterQueries.length > 0) {
        queryParams.push(
          `filter=${encodeURIComponent(filterQueries.join(" and "))}`
        );
      }

      // Sorting products
      if (args.sortBy) {
        const order = args.sortOrder === "DESC" ? "desc" : "asc";

        if (args.sortBy === "NAME") {
          queryParams.push(`sort=${encodeURIComponent(`name.en-US ${order}`)}`);
        } else if (args.sortBy === "PRICE") {
          queryParams.push(`sort=${encodeURIComponent(`price ${order}`)}`);
        }
      }

      const fullUrl = `/${projectKey}/product-projections/search?${queryParams.join(
        "&"
      )}`;
      console.log("Fetching URL:", fullUrl);

      try {
        const response = await ctClient.execute({
          method: "GET",
          uri: fullUrl,
        });

        console.log("Response received:", {
          total: response.body.total,
          count: response.body.results?.length,
        });

        return {
          total: response.body.total || 0,
          offset: response.body.offset || 0,
          limit: response.body.limit || limit,
          results: response.body.results || [],
        };
      } catch (error: any) {
        console.error("Error fetching products");
        console.error("Error message:", error.message);
        console.error("Error body:", JSON.stringify(error.body, null, 2));
        console.error("Status code:", error.statusCode);
        throw new Error("Failed to fetch products");
      }
    },
  },

  // Resolve nested fields
  Product: {
    name: (parent: any) => ({
      en_US:
        parent.name?.["en-US"] || parent.masterData?.current?.name?.["en-US"],
    }),
    slug: (parent: any) => ({
      en_US:
        parent.slug?.["en-US"] || parent.masterData?.current?.slug?.["en-US"],
    }),
    description: (parent: any) => ({
      en_US:
        parent.description?.["en-US"] ||
        parent.masterData?.current?.description?.["en-US"],
    }),
    metaTitle: (parent: any) => ({
      en_US:
        parent.metaTitle?.["en-US"] ||
        parent.masterData?.current?.metaTitle?.["en-US"],
    }),
    metaDescription: (parent: any) => ({
      en_US:
        parent.metaDescription?.["en-US"] ||
        parent.masterData?.current?.metaDescription?.["en-US"],
    }),
    categories: async (parent: any) => {
      const categories =
        parent.categories || parent.masterData?.current?.categories || [];

      // Fetch full category details
      const categoryDetails = await Promise.all(
        categories.map(async (catRef: any) => {
          try {
            const response = await ctClient.execute({
              method: "GET",
              uri: `/${projectKey}/categories/${catRef.id}`,
            });
            return {
              id: response.body.id,
              name: {
                en_US: response.body.name?.["en-US"],
              },
            };
          } catch (error) {
            return { id: catRef.id, name: { en_US: null } };
          }
        })
      );

      return categoryDetails;
    },
    masterVariant: (parent: any) =>
      parent.masterVariant || parent.masterData?.current?.masterVariant,
    variants: (parent: any) =>
      parent.variants || parent.masterData?.current?.variants || [],
  },

  Attribute: {
    value: (parent: any) => {
      if (typeof parent.value === "string") {
        return { __typename: "TextAttribute", text: parent.value };
      } else if (parent.value?.typeId && parent.value?.id) {
        return { __typename: "ReferenceAttribute", ...parent.value };
      }
      return null;
    },
  },

  Money: {
    fractionDigits: () => 2, // USD has 2 fraction digits
  },
};
