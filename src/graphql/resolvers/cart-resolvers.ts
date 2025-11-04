import { cartService } from "../services/cart-service.js";

export const cartResolvers = {
  Query: {
    cart: async () => {
      return cartService.getCart();
    },
  },

  Mutation: {
    addToCart: async (
      _: any,
      { productId, quantity }: { productId: string; quantity: number }
    ) => {
      return cartService.addToCart(productId, quantity);
    },

    removeFromCart: async (_: any, { productId }: { productId: string }) => {
      return cartService.removeFromCart(productId);
    },
  },
};
