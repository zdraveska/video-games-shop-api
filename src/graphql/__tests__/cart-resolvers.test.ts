import { cartResolvers } from "../resolvers/cart-resolvers.js";
import { cartService } from "../services/cart-service.js";

jest.mock("../services/cart-service.js", () => ({
  cartService: {
    getCart: jest.fn(),
    addToCart: jest.fn(),
    removeFromCart: jest.fn(),
  },
}));

describe("Cart Resolvers", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Query.cart", () => {
    it("should fetch the current cart", async () => {
      const mockCart = {
        id: "cart-123",
        items: [
          {
            product: {
              id: "prod-1",
              version: 1,
              name: { en_US: "Zelda" },
              slug: { en_US: "zelda" },
              description: { en_US: "Adventure game" },
              metaTitle: { en_US: "" },
              metaDescription: { en_US: "" },
              categories: [],
              masterVariant: { id: 1, sku: "SKU1", prices: [], images: [], attributes: [] },
              variants: [],
            },
            quantity: 2,
            price: { centAmount: 5999, currencyCode: "USD", amount: 59.99 },
          },
        ],
        totalAmount: { centAmount: 11998, currencyCode: "USD", amount: 119.98 },
      };
      jest.mocked(cartService.getCart).mockResolvedValue(mockCart);

      const result = await cartResolvers.Query.cart();

      expect(cartService.getCart).toHaveBeenCalled();
      expect(result).toEqual(mockCart);
    });

    it("should return empty cart when no cart exists", async () => {
      const mockCart = {
        id: "empty",
        items: [],
        totalAmount: { centAmount: 0, currencyCode: "USD", amount: 0 },
      };
      jest.mocked(cartService.getCart).mockResolvedValue(mockCart);

      const result = await cartResolvers.Query.cart();

      expect(result).toEqual(mockCart);
      expect(result.items).toHaveLength(0);
    });

    it("should propagate errors from cartService", async () => {
      const mockError = new Error("Failed to fetch cart");
      jest.mocked(cartService.getCart).mockRejectedValue(mockError);

      await expect(cartResolvers.Query.cart()).rejects.toThrow(
        "Failed to fetch cart"
      );
    });
  });

  describe("Mutation.addToCart", () => {
    it("should add a product to cart", async () => {
      const mockCart = {
        id: "cart-123",
        items: [
          {
            product: {
              id: "prod-1",
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
            quantity: 1,
            price: { centAmount: 5999, currencyCode: "USD", amount: 59.99 },
          },
        ],
        totalAmount: { centAmount: 5999, currencyCode: "USD", amount: 59.99 },
      };
      jest.mocked(cartService.addToCart).mockResolvedValue(mockCart);

      const result = await cartResolvers.Mutation.addToCart(
        {},
        { productId: "prod-1", quantity: 1 }
      );

      expect(cartService.addToCart).toHaveBeenCalledWith("prod-1", 1);
      expect(result).toEqual(mockCart);
    });

    it("should increase quantity when adding existing product", async () => {
      const mockCart = {
        id: "cart-123",
        items: [
          {
            product: {
              id: "prod-1",
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
            quantity: 3,
            price: { centAmount: 5999, currencyCode: "USD", amount: 59.99 },
          },
        ],
        totalAmount: { centAmount: 17997, currencyCode: "USD", amount: 179.97 },
      };
      jest.mocked(cartService.addToCart).mockResolvedValue(mockCart);

      const result = await cartResolvers.Mutation.addToCart(
        {},
        { productId: "prod-1", quantity: 2 }
      );

      expect(cartService.addToCart).toHaveBeenCalledWith("prod-1", 2);
      expect(result.items[0].quantity).toBe(3);
    });

    it("should add multiple quantities at once", async () => {
      const mockCart = {
        id: "cart-123",
        items: [
          {
            product: {
              id: "prod-1",
              version: 1,
              name: { en_US: "Mario" },
              slug: { en_US: "mario" },
              description: { en_US: "Platform game" },
              metaTitle: { en_US: "" },
              metaDescription: { en_US: "" },
              categories: [],
              masterVariant: { id: 1, sku: "SKU1", prices: [], images: [], attributes: [] },
              variants: [],
            },
            quantity: 5,
            price: { centAmount: 4999, currencyCode: "USD", amount: 49.99 },
          },
        ],
        totalAmount: { centAmount: 24995, currencyCode: "USD", amount: 249.95 },
      };
      jest.mocked(cartService.addToCart).mockResolvedValue(mockCart);

      const result = await cartResolvers.Mutation.addToCart(
        {},
        { productId: "prod-1", quantity: 5 }
      );

      expect(cartService.addToCart).toHaveBeenCalledWith("prod-1", 5);
      expect(result.items[0].quantity).toBe(5);
    });

    it("should handle errors when adding to cart", async () => {
      const mockError = new Error("Product not found");
      jest.mocked(cartService.addToCart).mockRejectedValue(mockError);

      await expect(
        cartResolvers.Mutation.addToCart(
          {},
          { productId: "invalid-id", quantity: 1 }
        )
      ).rejects.toThrow("Product not found");
    });
  });

  describe("Mutation.removeFromCart", () => {
    it("should remove a product from cart", async () => {
      const mockCart = {
        id: "cart-123",
        items: [],
        totalAmount: { centAmount: 0, currencyCode: "USD", amount: 0 },
      };
      jest.mocked(cartService.removeFromCart).mockResolvedValue(mockCart);

      const result = await cartResolvers.Mutation.removeFromCart(
        {},
        { productId: "prod-1" }
      );

      expect(cartService.removeFromCart).toHaveBeenCalledWith("prod-1");
      expect(result).toEqual(mockCart);
      expect(result.items).toHaveLength(0);
    });

    it("should update total after removing product", async () => {
      const mockCart = {
        id: "cart-123",
        items: [
          {
            product: {
              id: "prod-2",
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
            quantity: 1,
            price: { centAmount: 4999, currencyCode: "USD", amount: 49.99 },
          },
        ],
        totalAmount: { centAmount: 4999, currencyCode: "USD", amount: 49.99 },
      };
      jest.mocked(cartService.removeFromCart).mockResolvedValue(mockCart);

      const result = await cartResolvers.Mutation.removeFromCart(
        {},
        { productId: "prod-1" }
      );

      expect(result.items).toHaveLength(1);
      expect(result.totalAmount.centAmount).toBe(4999);
    });

    it("should handle errors when removing from cart", async () => {
      const mockError = new Error("Product not found in cart");
      jest.mocked(cartService.removeFromCart).mockRejectedValue(mockError);

      await expect(
        cartResolvers.Mutation.removeFromCart({}, { productId: "invalid-id" })
      ).rejects.toThrow("Product not found in cart");
    });

    it("should handle empty cart when removing", async () => {
      const mockError = new Error("Cart not found");
      jest.mocked(cartService.removeFromCart).mockRejectedValue(mockError);

      await expect(
        cartResolvers.Mutation.removeFromCart({}, { productId: "prod-1" })
      ).rejects.toThrow("Cart not found");
    });
  });
});
