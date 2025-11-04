import { getShoppingListToken } from "../../clients/ct-auth.js";
import { ctClient, projectKey } from "../../clients/ct-client.js";
import { APIError } from "../../errors/api-error.js";
import { buildCart, Cart, CartItem } from "../helpers/cart-helper.js";
import { toFormattedMoney } from "../helpers/money-helper.js";

import { productService } from "./product-service.js";

export class CartService {
  async getCart(): Promise<Cart> {
    try {
      const token = await getShoppingListToken();
      const list = await this.fetchShoppingList(token);

      if (!list || !list.lineItems || list.lineItems.length === 0) {
        return buildCart(list?.id || "empty", []);
      }

      const items: CartItem[] = [];
      for (const li of list.lineItems) {
        try {
          const product = await productService.fetchProduct(li.productId);
          const price = toFormattedMoney(
            product.masterVariant?.prices?.[0]?.value
          );
          items.push({ product, quantity: li.quantity, price });
        } catch (err) {
          console.error(`Failed to fetch product ${li.productId}`, err);
        }
      }

      return buildCart(list.id, items);
    } catch (err: any) {
      console.error("cart fetch error:", err);
      throw new APIError(
        err.message || "Failed to fetch cart",
        err.statusCode || 500
      );
    }
  }

  async addToCart(productId: string, quantity: number): Promise<Cart> {
    try {
      const token = await getShoppingListToken();
      const product = await productService.fetchProduct(productId);

      let list = await this.fetchShoppingList(token);

      if (!list) {
        list = await this.createShoppingList(token);
      }

      const existingItem = list.lineItems?.find(
        (li: any) => li.productId === productId
      );

      const actions = existingItem
        ? this.buildUpdateQuantityAction(existingItem, quantity)
        : this.buildAddLineItemAction(
            productId,
            product.masterVariant.id,
            quantity
          );

      const updatedList = await this.updateShoppingList(
        token,
        list.id,
        list.version,
        actions
      );

      const items: CartItem[] = [];
      for (const li of updatedList.lineItems) {
        try {
          const prod = await productService.fetchProduct(li.productId);
          const price = toFormattedMoney(
            prod.masterVariant?.prices?.[0]?.value
          );
          items.push({ product: prod, quantity: li.quantity, price });
        } catch (err) {
          console.error(`Failed to fetch product ${li.productId}`, err);
        }
      }

      return buildCart(updatedList.id, items);
    } catch (err: any) {
      console.error("addToCart error:", err);
      throw new APIError(
        err.message || "Failed to add to cart",
        err.statusCode || 500
      );
    }
  }

  async removeFromCart(productId: string): Promise<Cart> {
    try {
      const token = await getShoppingListToken();
      let list = await this.fetchShoppingList(token);

      if (!list) {
        throw new APIError("Cart not found", 404);
      }

      const existingItem = list.lineItems?.find(
        (li: any) => li.productId === productId
      );

      if (!existingItem) {
        throw new APIError("Product not found in cart", 404);
      }

      const actions = [
        {
          action: "removeLineItem",
          lineItemId: existingItem.id,
        },
      ];

      const updatedList = await this.updateShoppingList(
        token,
        list.id,
        list.version,
        actions
      );

      const items: CartItem[] = [];
      for (const li of updatedList.lineItems || []) {
        try {
          const prod = await productService.fetchProduct(li.productId);
          const price = toFormattedMoney(
            prod.masterVariant?.prices?.[0]?.value
          );
          items.push({ product: prod, quantity: li.quantity, price });
        } catch (err) {
          console.error(`Failed to fetch product ${li.productId}`, err);
        }
      }

      return buildCart(updatedList.id, items);
    } catch (err: any) {
      console.error("removeFromCart error:", err);
      throw new APIError(
        err.message || "Failed to remove from cart",
        err.statusCode || 500
      );
    }
  }

  private async fetchShoppingList(token: string): Promise<any> {
    const res = await ctClient.execute({
      method: "GET",
      uri: `/${projectKey}/shopping-lists`,
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.body.results?.[0] || null;
  }

  private async createShoppingList(token: string): Promise<any> {
    const createRes = await ctClient.execute({
      method: "POST",
      uri: `/${projectKey}/shopping-lists`,
      headers: { Authorization: `Bearer ${token}` },
      body: { name: { "en-US": "My Cart" }, lineItems: [] },
    });
    return createRes.body;
  }

  private async updateShoppingList(
    token: string,
    listId: string,
    version: number,
    actions: any[]
  ): Promise<any> {
    const updateRes = await ctClient.execute({
      method: "POST",
      uri: `/${projectKey}/shopping-lists/${listId}`,
      headers: { Authorization: `Bearer ${token}` },
      body: { version, actions },
    });
    return updateRes.body;
  }

  private buildUpdateQuantityAction(existingItem: any, quantityToAdd: number) {
    return [
      {
        action: "changeLineItemQuantity",
        lineItemId: existingItem.id,
        quantity: existingItem.quantity + quantityToAdd,
      },
    ];
  }

  private buildAddLineItemAction(
    productId: string,
    variantId: number,
    quantity: number
  ) {
    return [
      {
        action: "addLineItem",
        productId,
        variantId,
        quantity,
      },
    ];
  }
}

export const cartService = new CartService();
