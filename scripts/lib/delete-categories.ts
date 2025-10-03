import { ctClient, projectKey } from "../../src/clients/ct-client.js";
import { Category } from "@commercetools/platform-sdk";
import { fetchAllCategories } from "./utils.js";

// Delete a single category
async function deleteCategory(cat: Category) {
  try {
    await ctClient.execute({
      method: "DELETE",
      uri: `/${projectKey}/categories/${cat.id}?version=${cat.version}`,
    });
    console.log(`Deleted category: ${cat.key ?? cat.id}`);
    return true;
  } catch (err: any) {
    // Ignore 404 errors
    if (err.statusCode === 404) return false;
    // Ignore "category has children" errors
    if (
      err.body?.errors?.some(
        (e: any) =>
          e.code === "ReferencedResourceNotFound" ||
          e.code === "CategoryHasChildren"
      )
    ) {
      return false;
    }
    console.error(`Failed to delete ${cat.key ?? cat.id}:`, err.body || err);
    return false;
  }
}

// Delete all categories, multiple passes if needed
export async function deleteAllCategories({ confirm = false } = {}) {
  let categories = await fetchAllCategories();
  if (categories.length === 0) return console.log("No categories to delete.");

  if (!confirm) {
    console.log("Dry run (no deletions). Pass confirm=true to delete.");
    categories.forEach((cat) => console.log(`key=${cat.key ?? "(no key)"}`));
    return;
  }

  let deletedTotal = 0;

  while (categories.length > 0) {
    // Find leaf categories (no other category has this as parent)
    const parentIds = new Set(
      categories.map((c) => c.parent?.id).filter(Boolean)
    );
    const leafCategories = categories.filter((c) => !parentIds.has(c.id));

    if (leafCategories.length === 0) {
      console.log(
        "No leaf categories found, some categories may be stuck due to references."
      );
      break;
    }

    for (const cat of leafCategories) {
      const deleted = await deleteCategory(cat);
      if (deleted) deletedTotal++;
    }

    // Fetch remaining categories
    categories = await fetchAllCategories();
  }

  console.log(`Deleted ${deletedTotal} categories.`);
}
