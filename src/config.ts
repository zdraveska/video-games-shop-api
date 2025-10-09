import dotenv from "dotenv";

import { APIError } from "./errors/api-error.js";

dotenv.config();

// List of required environment variables
const requiredVars = [
  "CT_PROJECT_KEY",
  "CT_CLIENT_ID",
  "CT_CLIENT_SECRET",
  "CT_SCOPES",
  "CT_API_URL",
  "CT_AUTH_URL",
  "PORT",
];

const missingVars = requiredVars.filter((varName) => !process.env[varName]);

if (missingVars.length > 0) {
  throw new APIError(
    `Missing environment variables: ${missingVars.join(", ")}`,
    500
  );
}

// Validate CT_SCOPES includes all required scopes
const requiredScopes = [
  "manage_categories",
  "manage_types",
  "manage_tax_categories",
  "manage_product_selections",
  "view_products",
  "manage_products",
  "manage_states",
];

const envScopes = process.env
  .CT_SCOPES!.split(/\s+/)
  .map((s) => s.split(":")[0]);

const missingScopes = requiredScopes.filter(
  (scope) => !envScopes.includes(scope)
);

if (missingScopes.length > 0) {
  throw new APIError(
    `Missing required Commercetools scopes in CT_SCOPES: ${missingScopes.join(
      ", "
    )}`,
    500
  );
}

// Export variables
export const PORT = parseInt(process.env.PORT || "3000");

export const CT_PROJECT_KEY = process.env.CT_PROJECT_KEY as string;
export const CT_CLIENT_ID = process.env.CT_CLIENT_ID as string;
export const CT_CLIENT_SECRET = process.env.CT_CLIENT_SECRET as string;
export const CT_SCOPES = process.env.CT_SCOPES as string;
export const CT_API_URL = process.env.CT_API_URL as string;
export const CT_AUTH_URL = process.env.CT_AUTH_URL as string;
export const CT_IMPORT_API_URL = process.env.CT_IMPORT_API_URL as string;
