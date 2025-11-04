import { APIError } from "../src/errors/api-error.js";

import { deleteAllProducts } from "./lib/delete-products.js";
import { deleteAllCategories } from "./lib/delete-categories.js";
import { importCategories } from "./lib/import-categories.js";
import { importProductsType } from "./lib/import-products-type.js";
import { importProducts } from "./lib/import-products.js";
import { deleteAllProductTypes } from "./lib/delete-product-types.js";
import { deleteAllOrders } from "./lib/delete-orders.js";

async function main() {
  console.log("Starting full setup. of categories and products..\n");

  try {
    // Step 0: Cleanup existing data
    console.log("Cleanup: Deleting existing data...");
    await deleteAllOrders({ confirm: true });
    await deleteAllProducts({ confirm: true });
    await deleteAllProductTypes({ confirm: true });
    await deleteAllCategories({ confirm: true });
    console.log("Cleanup complete\n");

    // Step 1: Import categories
    console.log("Step 1/3: Importing categories...");
    await importCategories();
    console.log("Categories imported successfully\n");

    // Step 2: Import product types
    console.log("Step 2/3: Importing product types...");
    await importProductsType();
    console.log("Product types imported successfully\n");

    // Step 3: Import products
    console.log("Step 3/3: Importing products...");
    await importProducts();
    console.log("Products imported successfully\n");

    console.log('Full setup complete! You can now run "npm run dev".');
  } catch (err: any) {
    throw new APIError(
      `Failed to finish the setup: ${err.message || err}`,
      500
    );
  }
}

main();
