import fs from "fs";
import path from "path";

import { ctClient, projectKey } from "../../src/clients/ct-client.js";
import { ProductInput } from "../../src/types.js";
import { APIError } from "../../src/errors/api-error.js";

import {
  getProductTypeIdByKey,
  getTaxCategoryIdByKey,
  getCategoryIdByKey,
  processAttributes,
  getOrCreateTaxCategory,
} from "./utils.js";

const productsPath = path.resolve("scripts/data/products.json");
const productsData = JSON.parse(fs.readFileSync(productsPath, "utf-8"));

export async function prepareProductPayload(product: ProductInput) {
  const productTypeId = await getProductTypeIdByKey(product.productType.key);
  const taxCategoryId = await getTaxCategoryIdByKey(product.taxCategory.key);
  const categoryIds = await Promise.all(
    product.categories.map(async (c) => ({
      typeId: "category" as const,
      id: await getCategoryIdByKey(c.key),
    }))
  );

  const masterVariant = { ...product.masterVariant };
  if (masterVariant.attributes)
    masterVariant.attributes = await processAttributes(
      masterVariant.attributes
    );

  let variants = product.variants;
  if (variants && variants.length > 0) {
    variants = await Promise.all(
      variants.map(async (v) => ({
        ...v,
        attributes: v.attributes
          ? await processAttributes(v.attributes)
          : undefined,
      }))
    );
  }

  return {
    key: product.key,
    name: product.name,
    slug: product.slug,
    description: product.description,
    productType: { typeId: "product-type" as const, id: productTypeId },
    taxCategory: { typeId: "tax-category" as const, id: taxCategoryId },
    categories: categoryIds,
    masterVariant,
    variants,
    externalId: product.externalId,
    metaTitle: product.metaTitle,
    metaDescription: product.metaDescription,
  };
}

export async function importProducts() {
  await getOrCreateTaxCategory();

  for (const product of productsData.resources) {
    try {
      const payload = await prepareProductPayload(product);

      const response = await ctClient.execute({
        method: "POST",
        uri: `/${projectKey}/products`,
        body: payload,
      });

      const created = response.body;

      // publish
      await ctClient.execute({
        method: "POST",
        uri: `/${projectKey}/products/${created.id}`,
        body: { version: created.version, actions: [{ action: "publish" }] },
      });

      console.log(`Created product: ${product.key}`);
    } catch (err: any) {
      throw new APIError(
        `Failed to create product "${product.key}": ${err.message || err}`,
        500
      );
    }
  }

  console.log("Products import finished!");
}
