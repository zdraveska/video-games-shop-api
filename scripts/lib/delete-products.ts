import { ctClient, projectKey } from "../../src/clients/ct-client.js";

export async function deleteAllProducts({ confirm = false } = {}) {
  const response = await ctClient.execute({
    method: "GET",
    uri: `/${projectKey}/products`,
  });
  const products = response.body.results;

  if (!confirm) {
    console.log(`Dry run: ${products.length} products found, nothing deleted`);
    return;
  }

  for (const p of products) {
    // Unpublish if needed
    if (p.masterData.published) {
      const unpublished = await ctClient.execute({
        method: "POST",
        uri: `/${projectKey}/products/${p.id}`,
        body: { version: p.version, actions: [{ action: "unpublish" }] },
      });
      p.version = unpublished.body.version;
    }

    await ctClient.execute({
      method: "DELETE",
      uri: `/${projectKey}/products/${p.id}?version=${p.version}`,
    });
    console.log(`Deleted product: ${p.key ?? p.id}`);
  }

  console.log(`All products deleted (${products.length})`);
}
