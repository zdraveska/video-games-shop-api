import { Category, TaxCategory } from "@commercetools/platform-sdk";

import { ctClient, projectKey } from "../../src/clients/ct-client.js";
import { ProductAttribute } from "../../src/types.js";
import { APIError } from "../../src/errors/api-error.js";

export async function getProductTypeIdByKey(key: string) {
  const res = await ctClient.execute({
    method: "GET",
    uri: `/${projectKey}/product-types?where=key="${key}"`,
  });
  if (res.body.results.length > 0) return res.body.results[0].id;
  throw new APIError(`Product type: ${key} not found.`, 404);
}

export async function getTaxCategoryIdByKey(key: string) {
  const res = await ctClient.execute({
    method: "GET",
    uri: `/${projectKey}/tax-categories?where=key="${key}"`,
  });
  if (res.body.results.length > 0) return res.body.results[0].id;
  throw new APIError(`Tax category: ${key} not found.`, 404);
}

export async function getCategoryIdByKey(key: string) {
  const res = await ctClient.execute({
    method: "GET",
    uri: `/${projectKey}/categories?where=key="${key}"`,
  });
  if (res.body.results.length > 0) return res.body.results[0].id;
  throw new APIError(`Category: ${key} not found.`, 404);
}

export async function fetchAllCategories(): Promise<Category[]> {
  const all: Category[] = [];
  let offset = 0;
  const limit = 500;

  while (true) {
    const resp = await ctClient.execute({
      method: "GET",
      uri: `/${projectKey}/categories?limit=${limit}&offset=${offset}`,
    });
    const page: Category[] = resp.body.results;
    all.push(...page);
    if (page.length < limit) break;
    offset += limit;
  }

  return all;
}

export async function processAttributes(
  attributes: ProductAttribute[]
): Promise<ProductAttribute[]> {
  const processed: ProductAttribute[] = [];

  for (const attr of attributes) {
    if (attr.name === "platform") {
      let categoryKey: string | undefined;

      if (typeof attr.value === "string") {
        categoryKey = attr.value;
      } else if (
        typeof attr.value === "object" &&
        attr.value &&
        "key" in attr.value
      ) {
        categoryKey = (attr.value as any).key;
      }

      if (categoryKey) {
        const id = await getCategoryIdByKey(categoryKey);
        processed.push({
          name: "platform",
          value: { typeId: "category", id },
        });
        continue;
      }
    }

    processed.push(attr);
  }

  return processed;
}

export async function getOrCreateTaxCategory(): Promise<TaxCategory> {
  const key = "standard-tax";
  const resp = await ctClient.execute({
    method: "GET",
    uri: `/${projectKey}/tax-categories?where=key="${key}"`,
  });

  if (resp.body.results.length > 0) return resp.body.results[0] as TaxCategory;

  const payload = {
    name: "Standard",
    key,
    rates: [
      {
        name: "Standard Tax",
        amount: 0.0,
        includedInPrice: false,
        country: "US",
      },
    ],
  };

  const created = await ctClient.execute({
    method: "POST",
    uri: `/${projectKey}/tax-categories`,
    body: payload,
  });

  return created.body as TaxCategory;
}
