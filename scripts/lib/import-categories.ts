import fs from "fs";
import path from "path";
import { ctClient, projectKey } from "../../src/clients/ct-client.js";
import { Category } from "@commercetools/platform-sdk";

const categoriesPath = path.resolve("scripts/data/categories.json");
const categoriesData = JSON.parse(fs.readFileSync(categoriesPath, "utf-8"));

export async function createCategory(
  category: Partial<Category>
): Promise<Category | null> {
  try {
    const resp = await ctClient.execute({
      method: "POST",
      uri: `/${projectKey}/categories`,
      body: category,
    });
    console.log(`Created category: ${category.key}`);
    return resp.body as Category;
  } catch (err: any) {
    if (err.body?.message?.includes("already exists")) {
      console.log(`Category already exists: ${category.key}`);
      return null;
    }
    console.error(
      `Failed to create category: ${category.key}`,
      err.body || err
    );
    return null;
  }
}

export async function importCategories() {
  const createdCategories: Record<string, Category> = {};

  // First pass: create top-level categories (without parents)
  for (const category of categoriesData.resources) {
    if (!category.parent) {
      const categoryToCreate = {
        key: category.key,
        name: category.name,
        slug: category.slug,
        externalId: category.externalId,
        description: category.description,
        metaTitle: category.metaTitle,
        metaDescription: category.metaDescription,
      };
      const created = await createCategory(categoryToCreate);
      if (created) createdCategories[category.key] = created;
    }
  }

  // Second pass: create child categories
  for (const category of categoriesData.resources) {
    if (category.parent) {
      const parentKey = category.parent.key;
      const categoryToCreate = {
        key: category.key,
        name: category.name,
        slug: category.slug,
        externalId: category.externalId,
        description: category.description,
        parent: {
          typeId: category.parent.typeId,
          id: createdCategories[parentKey]?.id,
        },
        metaTitle: category.metaTitle,
        metaDescription: category.metaDescription,
      };
      const created = await createCategory(categoryToCreate);
      if (created) createdCategories[category.key] = created;
    }
  }

  console.log("Categories import finished!");
}
