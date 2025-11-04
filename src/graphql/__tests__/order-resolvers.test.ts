import { ordersResolvers } from "../resolvers/order-resolvers.js";
import { orderService } from "../services/order-service.js";

jest.mock("../services/order-service.js", () => ({
  orderService: {
    getAllOrders: jest.fn(),
    getOrderById: jest.fn(),
    placeOrder: jest.fn(),
    removeOrder: jest.fn(),
    removeAllOrders: jest.fn(),
  },
}));

describe("Order Resolvers", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Query.orders", () => {
    it("should fetch all orders", async () => {
      const mockOrders = [
        {
          id: "order-1",
          orderNumber: "ORD-001",
          createdAt: "2024-01-01T00:00:00Z",
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
        },
        {
          id: "order-2",
          orderNumber: "ORD-002",
          createdAt: "2024-01-02T00:00:00Z",
          items: [
            {
              product: {
                id: "prod-2",
                version: 1,
                name: { en_US: "Mario" },
                slug: { en_US: "mario" },
                description: { en_US: "Platform" },
                metaTitle: { en_US: "" },
                metaDescription: { en_US: "" },
                categories: [],
                masterVariant: { id: 1, sku: "SKU2", prices: [], images: [], attributes: [] },
                variants: [],
              },
              quantity: 2,
              price: { centAmount: 4999, currencyCode: "USD", amount: 49.99 },
            },
          ],
          totalAmount: { centAmount: 9998, currencyCode: "USD", amount: 99.98 },
        },
      ];
      jest.mocked(orderService.getAllOrders).mockResolvedValue(mockOrders);

      const result = await ordersResolvers.Query.orders();

      expect(orderService.getAllOrders).toHaveBeenCalled();
      expect(result).toEqual(mockOrders);
      expect(result).toHaveLength(2);
    });

    it("should return empty array when no orders exist", async () => {
      jest.mocked(orderService.getAllOrders).mockResolvedValue([]);

      const result = await ordersResolvers.Query.orders();

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it("should propagate errors from orderService", async () => {
      const mockError = new Error("Failed to fetch orders");
      jest.mocked(orderService.getAllOrders).mockRejectedValue(mockError);

      await expect(ordersResolvers.Query.orders()).rejects.toThrow(
        "Failed to fetch orders"
      );
    });
  });

  describe("Query.order", () => {
    const mockOrder = {
      id: "order-123",
      orderNumber: "ORD-123",
      createdAt: "2024-01-01T00:00:00Z",
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
      shippingAddress: {
        firstName: "John",
        lastName: "Doe",
        streetName: "Main St",
        streetNumber: "123",
        city: "New York",
        postalCode: "10001",
        country: "US",
      },
      billingAddress: {
        firstName: "John",
        lastName: "Doe",
        streetName: "Main St",
        streetNumber: "123",
        city: "New York",
        postalCode: "10001",
        country: "US",
      },
      customerEmail: "john@example.com",
    };

    it("should fetch order by ID", async () => {
      jest.mocked(orderService.getOrderById).mockResolvedValue(mockOrder);

      const result = await ordersResolvers.Query.order(
        {},
        { id: "order-123" }
      );

      expect(orderService.getOrderById).toHaveBeenCalledWith(
        "order-123",
        undefined
      );
      expect(result).toEqual(mockOrder);
    });

    it("should fetch order by order number", async () => {
      jest.mocked(orderService.getOrderById).mockResolvedValue(mockOrder);

      const result = await ordersResolvers.Query.order(
        {},
        { orderNumber: "ORD-123" }
      );

      expect(orderService.getOrderById).toHaveBeenCalledWith(
        undefined,
        "ORD-123"
      );
      expect(result).toEqual(mockOrder);
    });

    it("should return null when order not found", async () => {
      jest.mocked(orderService.getOrderById).mockResolvedValue(null);

      const result = await ordersResolvers.Query.order(
        {},
        { id: "nonexistent" }
      );

      expect(result).toBeNull();
    });

    it("should handle errors when fetching order", async () => {
      const mockError = new Error("Invalid order ID");
      jest.mocked(orderService.getOrderById).mockRejectedValue(mockError);

      await expect(
        ordersResolvers.Query.order({}, { id: "invalid" })
      ).rejects.toThrow("Invalid order ID");
    });
  });

  describe("Mutation.placeOrder", () => {
    const mockAddress = {
      firstName: "Jane",
      lastName: "Smith",
      streetName: "Oak Ave",
      streetNumber: "456",
      city: "Los Angeles",
      postalCode: "90001",
      country: "US",
      state: "CA",
      phone: "555-1234",
    };

    const mockOrder = {
      id: "order-456",
      orderNumber: "ORD-456",
      createdAt: "2024-01-03T00:00:00Z",
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
          quantity: 2,
          price: { centAmount: 5999, currencyCode: "USD", amount: 59.99 },
        },
      ],
      totalAmount: { centAmount: 11998, currencyCode: "USD", amount: 119.98 },
      shippingAddress: mockAddress,
      billingAddress: mockAddress,
      customerEmail: "jane@example.com",
    };

    it("should place an order with shipping address", async () => {
      jest.mocked(orderService.placeOrder).mockResolvedValue(mockOrder);

      const result = await ordersResolvers.Mutation.placeOrder(
        {},
        {
          shippingAddress: mockAddress,
          customerEmail: "jane@example.com",
        }
      );

      expect(orderService.placeOrder).toHaveBeenCalledWith({
        shippingAddress: mockAddress,
        customerEmail: "jane@example.com",
      });
      expect(result).toEqual(mockOrder);
    });

    it("should place an order with separate billing address", async () => {
      const billingAddress = {
        ...mockAddress,
        streetName: "Pine St",
        streetNumber: "789",
      };

      const orderWithBilling = {
        ...mockOrder,
        billingAddress,
      };

      jest.mocked(orderService.placeOrder).mockResolvedValue(orderWithBilling);

      const result = await ordersResolvers.Mutation.placeOrder(
        {},
        {
          shippingAddress: mockAddress,
          billingAddress,
          customerEmail: "jane@example.com",
        }
      );

      expect(orderService.placeOrder).toHaveBeenCalledWith({
        shippingAddress: mockAddress,
        billingAddress,
        customerEmail: "jane@example.com",
      });
      expect(result.billingAddress).toEqual(billingAddress);
    });

    it("should handle empty cart error", async () => {
      const mockError = new Error("Cart is empty");
      jest.mocked(orderService.placeOrder).mockRejectedValue(mockError);

      await expect(
        ordersResolvers.Mutation.placeOrder(
          {},
          {
            shippingAddress: mockAddress,
            customerEmail: "jane@example.com",
          }
        )
      ).rejects.toThrow("Cart is empty");
    });

    it("should handle order creation errors", async () => {
      const mockError = new Error("Failed to create order");
      jest.mocked(orderService.placeOrder).mockRejectedValue(mockError);

      await expect(
        ordersResolvers.Mutation.placeOrder(
          {},
          {
            shippingAddress: mockAddress,
            customerEmail: "jane@example.com",
          }
        )
      ).rejects.toThrow("Failed to create order");
    });
  });

  describe("Mutation.removeOrder", () => {
    it("should remove order by ID", async () => {
      jest.mocked(orderService.removeOrder).mockResolvedValue(true);

      const result = await ordersResolvers.Mutation.removeOrder(
        {},
        { id: "order-123" }
      );

      expect(orderService.removeOrder).toHaveBeenCalledWith(
        "order-123",
        undefined
      );
      expect(result).toBe(true);
    });

    it("should remove order by order number", async () => {
      jest.mocked(orderService.removeOrder).mockResolvedValue(true);

      const result = await ordersResolvers.Mutation.removeOrder(
        {},
        { orderNumber: "ORD-123" }
      );

      expect(orderService.removeOrder).toHaveBeenCalledWith(
        undefined,
        "ORD-123"
      );
      expect(result).toBe(true);
    });

    it("should handle errors when removing order", async () => {
      const mockError = new Error("Order not found");
      jest.mocked(orderService.removeOrder).mockRejectedValue(mockError);

      await expect(
        ordersResolvers.Mutation.removeOrder({}, { id: "nonexistent" })
      ).rejects.toThrow("Order not found");
    });
  });

  describe("Mutation.removeAllOrders", () => {
    it("should remove all orders", async () => {
      jest.mocked(orderService.removeAllOrders).mockResolvedValue(true);

      const result = await ordersResolvers.Mutation.removeAllOrders();

      expect(orderService.removeAllOrders).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it("should handle errors when removing all orders", async () => {
      const mockError = new Error("Failed to remove orders");
      jest.mocked(orderService.removeAllOrders).mockRejectedValue(mockError);

      await expect(
        ordersResolvers.Mutation.removeAllOrders()
      ).rejects.toThrow("Failed to remove orders");
    });
  });
});
