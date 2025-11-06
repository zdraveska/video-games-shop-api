import { productResolvers } from "../resolvers/product-resolvers.js";
import { productService } from "../services/product-service.js";

jest.mock("../services/product-service.js", () => ({
  productService: {
    getProductById: jest.fn(),
    getProducts: jest.fn(),
  },
}));

describe("Product Resolvers", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Query.product", () => {
    it("should fetch product by ID", async () => {
      const mockProduct = {
        id: "123",
        version: 1,
        name: { en_US: "Zelda" },
        slug: { en_US: "zelda" },
        description: { en_US: "Adventure game" },
        metaTitle: { en_US: "Zelda Game" },
        metaDescription: { en_US: "Epic adventure" },
        categories: [],
        masterVariant: { id: 1, sku: "SKU123", prices: [], images: [], attributes: [] },
        variants: [],
      };
      jest.mocked(productService.getProductById).mockResolvedValue(mockProduct);

      const result = await productResolvers.Query.product({}, { id: "123" });

      expect(productService.getProductById).toHaveBeenCalledWith("123");
      expect(result).toEqual(mockProduct);
    });

    it("should throw error when product not found", async () => {
      const mockError = new Error("Product not found");
      jest.mocked(productService.getProductById).mockRejectedValue(mockError);

      await expect(
        productResolvers.Query.product({}, { id: "999" })
      ).rejects.toThrow("Product not found");
    });
  });

  describe("Query.products", () => {
    it("should fetch products with default parameters", async () => {
      const mockResponse = {
        total: 2,
        offset: 0,
        limit: 20,
        results: [
          {
            id: "1",
            version: 1,
            name: { en_US: "Zelda" },
            slug: { en_US: "zelda" },
            description: { en_US: "Adventure" },
            metaTitle: { en_US: "" },
            metaDescription: { en_US: "" },
            categories: [],
            masterVariant: { id: 1, sku: "SKU1", prices: [], images: [], attributes: [] },
            variants: [],
          },
          {
            id: "2",
            version: 1,
            name: { en_US: "Mario" },
            slug: { en_US: "mario" },
            description: { en_US: "Platform game" },
            metaTitle: { en_US: "" },
            metaDescription: { en_US: "" },
            categories: [],
            masterVariant: { id: 1, sku: "SKU2", prices: [], images: [], attributes: [] },
            variants: [],
          },
        ],
      };
      jest.mocked(productService.getProducts).mockResolvedValue(mockResponse);

      const result = await productResolvers.Query.products({}, {});

      expect(productService.getProducts).toHaveBeenCalledWith({});
      expect(result).toEqual(mockResponse);
    });

    it("should fetch products with limit and offset", async () => {
      const mockResponse = {
        total: 2,
        offset: 10,
        limit: 5,
        results: [],
      };
      jest.mocked(productService.getProducts).mockResolvedValue(mockResponse);

      const result = await productResolvers.Query.products(
        {},
        { limit: 5, offset: 10 }
      );

      expect(productService.getProducts).toHaveBeenCalledWith({
        limit: 5,
        offset: 10,
      });
      expect(result).toEqual(mockResponse);
    });

    it("should search products by term", async () => {
      const mockResponse = {
        total: 1,
        offset: 0,
        limit: 20,
        results: [
          {
            id: "1",
            version: 1,
            name: { en_US: "Zelda" },
            slug: { en_US: "zelda" },
            description: { en_US: "Adventure" },
            metaTitle: { en_US: "" },
            metaDescription: { en_US: "" },
            categories: [],
            masterVariant: { id: 1, sku: "SKU1", prices: [], images: [], attributes: [] },
            variants: [],
          },
        ],
      };
      jest.mocked(productService.getProducts).mockResolvedValue(mockResponse);

      await productResolvers.Query.products({}, { search: "Zelda" });

      expect(productService.getProducts).toHaveBeenCalledWith({
        search: "Zelda",
      });
    });

    it("should filter products by category", async () => {
      const mockResponse = {
        total: 1,
        offset: 0,
        limit: 20,
        results: [
          {
            id: "1",
            version: 1,
            name: { en_US: "RPG Game" },
            slug: { en_US: "rpg-game" },
            description: { en_US: "Role-playing game" },
            metaTitle: { en_US: "" },
            metaDescription: { en_US: "" },
            categories: [],
            masterVariant: { id: 1, sku: "SKU1", prices: [], images: [], attributes: [] },
            variants: [],
          },
        ],
      };
      jest.mocked(productService.getProducts).mockResolvedValue(mockResponse);

      await productResolvers.Query.products({}, { categoryKey: "rpg" });

      expect(productService.getProducts).toHaveBeenCalledWith({
        categoryKey: "rpg",
      });
    });

    it("should sort products by name ascending", async () => {
      const mockResponse = {
        total: 3,
        offset: 0,
        limit: 20,
        results: [],
      };
      jest.mocked(productService.getProducts).mockResolvedValue(mockResponse);

      await productResolvers.Query.products(
        {},
        { sortBy: "NAME", sortOrder: "ASC" }
      );

      expect(productService.getProducts).toHaveBeenCalledWith({
        sortBy: "NAME",
        sortOrder: "ASC",
      });
    });

    it("should sort products by price descending", async () => {
      const mockResponse = {
        total: 3,
        offset: 0,
        limit: 20,
        results: [],
      };
      jest.mocked(productService.getProducts).mockResolvedValue(mockResponse);

      await productResolvers.Query.products(
        {},
        { sortBy: "PRICE", sortOrder: "DESC" }
      );

      expect(productService.getProducts).toHaveBeenCalledWith({
        sortBy: "PRICE",
        sortOrder: "DESC",
      });
    });

    it("should handle multiple filters", async () => {
      const mockResponse = {
        total: 1,
        offset: 0,
        limit: 10,
        results: [],
      };
      jest.mocked(productService.getProducts).mockResolvedValue(mockResponse);

      await productResolvers.Query.products(
        {},
        {
          search: "Mario",
          categoryKey: "action",
          sortBy: "PRICE",
          sortOrder: "ASC",
          limit: 10,
          offset: 0,
        }
      );

      expect(productService.getProducts).toHaveBeenCalledWith({
        search: "Mario",
        categoryKey: "action",
        sortBy: "PRICE",
        sortOrder: "ASC",
        limit: 10,
        offset: 0,
      });
    });
  });

  describe("Product field resolvers", () => {
    it("should resolve name field", () => {
      const parent = { name: { en_US: "Test Product" } };
      const result = productResolvers.Product.name(parent);
      expect(result).toEqual({ en_US: "Test Product" });
    });

    it("should resolve slug field", () => {
      const parent = { slug: { en_US: "test-product" } };
      const result = productResolvers.Product.slug(parent);
      expect(result).toEqual({ en_US: "test-product" });
    });

    it("should resolve description field", () => {
      const parent = { description: { en_US: "A test product" } };
      const result = productResolvers.Product.description(parent);
      expect(result).toEqual({ en_US: "A test product" });
    });

    it("should handle missing name field", () => {
      const parent = {};
      const result = productResolvers.Product.name(parent);
      expect(result).toEqual({ en_US: "" });
    });

    it("should resolve categories field", async () => {
      const parent = { categories: [{ id: "1", name: { en_US: "Action" } }] };
      const result = await productResolvers.Product.categories(parent);
      expect(result).toEqual([{ id: "1", name: { en_US: "Action" } }]);
    });

    it("should handle empty categories", async () => {
      const parent = {};
      const result = await productResolvers.Product.categories(parent);
      expect(result).toEqual([]);
    });

    it("should resolve masterVariant field", () => {
      const parent = {
        masterVariant: { id: 1, sku: "SKU123", prices: [] },
      };
      const result = productResolvers.Product.masterVariant(parent);
      expect(result).toEqual({ id: 1, sku: "SKU123", prices: [] });
    });

    it("should resolve variants field", () => {
      const parent = {
        variants: [{ id: 2, sku: "SKU456", prices: [] }],
      };
      const result = productResolvers.Product.variants(parent);
      expect(result).toEqual([{ id: 2, sku: "SKU456", prices: [] }]);
    });

    it("should handle empty variants", () => {
      const parent = {};
      const result = productResolvers.Product.variants(parent);
      expect(result).toEqual([]);
    });
  });
});
