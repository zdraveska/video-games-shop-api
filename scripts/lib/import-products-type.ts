import { ProductType } from "@commercetools/platform-sdk";
import { ctClient, projectKey } from "../../src/clients/ct-client.js";

// --- CREATE PRODUCT TYPE ---
const productTypeKey = "video-game";
const productTypePayload = {
  key: productTypeKey,
  name: "Video Game",
  description: "Product type for video games",
  attributes: [
    {
      name: "edition",
      label: { "en-US": "Edition" },
      type: { name: "text" },
      isRequired: false,
      isSearchable: true,
      attributeConstraint: "None",
      inputTip: { "en-US": "Specify the edition of the game" },
      inputHint: "SingleLine",
    },
    {
      name: "platform",
      label: { "en-US": "Platform" },
      type: { name: "reference", referenceTypeId: "category" },
      isRequired: true,
      isSearchable: true,
      attributeConstraint: "None",
      inputTip: { "en-US": "Select the platform category" },
      inputHint: "SingleLine",
    },
  ],
};

export async function importProductsType(
  productType = productTypePayload
): Promise<ProductType | null> {
  try {
    const resp = await ctClient.execute({
      method: "POST",
      uri: `/${projectKey}/product-types`,
      body: productType,
    });
    console.log(`Created product type: ${productType.key}`);
    return resp.body as ProductType;
  } catch (err: any) {
    if (err.body?.message?.includes("already exists")) {
      console.log(`Product type already exists: ${productType.key}`);
      return null;
    }
    console.error(
      `Failed to create product type: ${productType.key}`,
      err.body || err
    );
    return null;
  }
}
