import { orderService } from "../services/order-service.js";

interface Address {
  firstName: string;
  lastName: string;
  streetName: string;
  streetNumber: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
  phone?: string;
}

export const ordersResolvers = {
  Query: {
    orders: async () => {
      return orderService.getAllOrders();
    },

    order: async (_: any, args: { id?: string; orderNumber?: string }) => {
      const { id, orderNumber } = args;
      return orderService.getOrderById(id, orderNumber);
    },
  },

  Mutation: {
    placeOrder: async (
      _: any,
      args: {
        shippingAddress: Address;
        billingAddress?: Address;
        customerEmail: string;
      }
    ) => {
      return orderService.placeOrder(args);
    },

    removeOrder: async (
      _: any,
      args: { id?: string; orderNumber?: string }
    ) => {
      const { id, orderNumber } = args;
      return orderService.removeOrder(id, orderNumber);
    },

    removeAllOrders: async () => {
      return orderService.removeAllOrders();
    },
  },
};
