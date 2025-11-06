import { Order, LineItem } from "@commercetools/platform-sdk";

import { getOrderToken } from "../../clients/ct-auth.js";
import { projectKey, ctClient } from "../../clients/ct-client.js";
import { APIError } from "../../errors/api-error.js";
import { CartItem } from "../helpers/cart-helper.js";
import { toFormattedMoney, FormattedMoney } from "../helpers/money-helper.js";

import { productService } from "./product-service.js";

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

interface OrderInput {
  shippingAddress: Address;
  billingAddress?: Address;
  customerEmail: string;
}

export class OrderService {
  async getAllOrders() {
    const token = await getOrderToken();

    const res = await ctClient.execute({
      method: "GET",
      uri: `/${projectKey}/orders`,
      headers: { Authorization: `Bearer ${token}` },
    });

    const orders: Order[] = res.body.results || [];

    return Promise.all(
      orders.map(async (order: Order) => {
        const items = await this.buildOrderItems(order.lineItems || []);

        return {
          id: order.id,
          orderNumber: order.orderNumber || "N/A",
          createdAt: order.createdAt,
          items,
          totalAmount: toFormattedMoney(order.totalPrice),
        };
      })
    );
  }

  async getOrderById(id?: string, orderNumber?: string) {
    const token = await getOrderToken();

    if (!id && !orderNumber) {
      throw new APIError("Please provide either id or orderNumber", 400);
    }

    let uri = `/${projectKey}/orders`;
    if (id) uri += `/${id}`;
    else uri += `/order-number=${orderNumber}`;

    try {
      const res = await ctClient.execute({
        method: "GET",
        uri,
        headers: { Authorization: `Bearer ${token}` },
      });

      const order: Order = res.body;
      const items = await this.buildOrderItems(order.lineItems || []);

      return {
        id: order.id,
        orderNumber: order.orderNumber,
        createdAt: order.createdAt,
        totalAmount: toFormattedMoney(order.totalPrice),
        shippingAddress: order.shippingAddress,
        billingAddress: order.billingAddress,
        customerEmail: order.customerEmail,
        items,
      };
    } catch (err: any) {
      if (err.message?.includes("URI not found") || err.statusCode === 404) {
        console.warn(`Order not found for ${orderNumber || id}`);
        return null;
      }

      console.error("Error fetching order:", err);
      throw new APIError("Failed to fetch order details", 500);
    }
  }

  async placeOrder(orderInput: OrderInput) {
    const { shippingAddress, billingAddress, customerEmail } = orderInput;
    const token = await getOrderToken();

    const list = await this.fetchShoppingList(token);
    if (!list || !list.lineItems.length) {
      throw new APIError("Cart is empty", 400);
    }

    const lineItemsForCart = await this.prepareLineItems(list.lineItems);

    const cart = await this.createCart(
      token,
      lineItemsForCart,
      shippingAddress,
      billingAddress,
      customerEmail
    );

    const order = await this.createOrder(token, cart);

    await this.deleteShoppingList(token, list.id, list.version);

    const items = await this.buildOrderItems(order.lineItems as LineItem[]);

    return {
      id: order.id,
      orderNumber: order.orderNumber,
      createdAt: order.createdAt,
      items,
      totalAmount: toFormattedMoney(order.totalPrice),
      shippingAddress: order.shippingAddress || shippingAddress,
      billingAddress: order.billingAddress || billingAddress || shippingAddress,
      customerEmail: order.customerEmail || customerEmail || null,
    };
  }

  async removeOrder(id?: string, orderNumber?: string): Promise<boolean> {
    const token = await getOrderToken();

    const uriGet = id
      ? `/${projectKey}/orders/${id}`
      : `/${projectKey}/orders/order-number=${orderNumber}`;
    const res = await ctClient.execute({
      method: "GET",
      uri: uriGet,
      headers: { Authorization: `Bearer ${token}` },
    });
    const order = res.body;

    await ctClient.execute({
      method: "DELETE",
      uri: `/${projectKey}/orders/${order.id}?version=${order.version}`,
      headers: { Authorization: `Bearer ${token}` },
    });

    return true;
  }

  async removeAllOrders(): Promise<boolean> {
    const token = await getOrderToken();

    const res = await ctClient.execute({
      method: "GET",
      uri: `/${projectKey}/orders`,
      headers: { Authorization: `Bearer ${token}` },
    });

    const orders = res.body.results || [];

    await Promise.all(
      orders.map((order: Order) =>
        ctClient.execute({
          method: "DELETE",
          uri: `/${projectKey}/orders/${order.id}?version=${order.version}`,
          headers: { Authorization: `Bearer ${token}` },
        })
      )
    );

    return true;
  }

  private async buildOrderItems(lineItems: LineItem[]): Promise<CartItem[]> {
    return Promise.all(
      lineItems.map(async (li: LineItem) => {
        const product = await productService.fetchProduct(li.productId);
        const price: FormattedMoney = li.price
          ? toFormattedMoney(li.price.value)
          : product.masterVariant?.prices?.[0]
          ? toFormattedMoney(product.masterVariant.prices[0].value)
          : { centAmount: 0, currencyCode: "USD", amount: 0 };

        return { product, quantity: li.quantity, price };
      })
    );
  }

  private async fetchShoppingList(token: any) {
    const listRes = await ctClient.execute({
      method: "GET",
      uri: `/${projectKey}/shopping-lists`,
      headers: { Authorization: `Bearer ${token.access_token}` },
    });
    return listRes.body.results?.[0];
  }

  private async prepareLineItems(lineItems: LineItem[]) {
    return Promise.all(
      (lineItems as LineItem[]).map(async (li: LineItem) => {
        const product = await productService.fetchProduct(li.productId);
        return {
          productId: li.productId,
          variantId: product.masterVariant.id,
          quantity: li.quantity,
        };
      })
    );
  }

  private async createCart(
    token: any,
    lineItems: any[],
    shippingAddress: Address,
    billingAddress?: Address,
    customerEmail?: string
  ) {
    const cartRes = await ctClient.execute({
      method: "POST",
      uri: `/${projectKey}/carts`,
      headers: { Authorization: `Bearer ${token.access_token}` },
      body: {
        currency: "USD",
        country: "US",
        lineItems,
        shippingAddress,
        billingAddress: billingAddress || shippingAddress,
        customerEmail: customerEmail || null,
      },
    });
    return cartRes.body;
  }

  private async createOrder(token: any, cart: any): Promise<Order> {
    const orderRes = await ctClient.execute({
      method: "POST",
      uri: `/${projectKey}/orders`,
      headers: { Authorization: `Bearer ${token.access_token}` },
      body: {
        cart: { id: cart.id, typeId: "cart" },
        version: cart.version,
        orderNumber: `ORD-${Date.now()}`,
      },
    });
    return orderRes.body;
  }

  private async deleteShoppingList(
    token: any,
    listId: string,
    version: number
  ) {
    await ctClient.execute({
      method: "DELETE",
      uri: `/${projectKey}/shopping-lists/${listId}?version=${version}`,
      headers: { Authorization: `Bearer ${token.access_token}` },
    });
  }
}

export const orderService = new OrderService();
