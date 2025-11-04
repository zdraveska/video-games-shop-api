import { productResolvers } from "./product-resolvers.js";
import { cartResolvers } from "./cart-resolvers.js";
import { ordersResolvers } from "./order-resolvers.js";

export const resolvers = {
  Query: {
    health: () => "OK",
    ...productResolvers.Query,
    ...cartResolvers.Query,
    ...ordersResolvers.Query,
  },
  Mutation: {
    ...cartResolvers.Mutation,
    ...ordersResolvers.Mutation,
  },
  Product: productResolvers.Product,
};
