import { ProductType } from "@commercetools/platform-sdk";
import { ctClient, projectKey } from "../../src/clients/ct-client.js";

export async function deleteAllProductTypes({ confirm = false } = {}) {
  // Fetch all product types
  const response = await ctClient.execute({
    method: "GET",
    uri: `/${projectKey}/product-types`,
  });

  const productTypes = response.body.results;

  if (productTypes.length === 0) {
    console.log("No product types found to delete.");
    return;
  }

  if (!confirm) {
    console.log(
      `Dry run: ${productTypes.length} product types found, nothing deleted`
    );
    productTypes.forEach((pt: ProductType, i: number) =>
      console.log(`[${i + 1}] key=${pt.key} id=${pt.id}`)
    );
    return;
  }

  // Delete product types
  let deletedCount = 0;
  for (const pt of productTypes) {
    try {
      await ctClient.execute({
        method: "DELETE",
        uri: `/${projectKey}/product-types/${pt.id}?version=${pt.version}`,
      });
      console.log(`Deleted product type: ${pt.key}`);
      deletedCount++;
    } catch (err: any) {
      console.error(
        `Failed to delete product type ${pt.key}:`,
        err.body || err
      );
    }
  }

  console.log(
    `Deletion finished. ${deletedCount}/${productTypes.length} deleted successfully.`
  );
}
