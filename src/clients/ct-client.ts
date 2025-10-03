import dotenv from "dotenv";
import fetch from "node-fetch";
import {
  ClientBuilder,
  createAuthMiddlewareForClientCredentialsFlow,
  createHttpMiddleware,
} from "@commercetools/ts-client";

dotenv.config();

const projectKey = process.env.CT_PROJECT_KEY!;
const clientId = process.env.CT_CLIENT_ID!;
const clientSecret = process.env.CT_CLIENT_SECRET!;
const scopes = (process.env.CT_SCOPES || "").split(" ");
const apiUrl = process.env.CT_API_URL!;
const authUrl = process.env.CT_AUTH_URL!;

if (!projectKey || !clientId || !clientSecret || !apiUrl || !authUrl) {
  throw new Error("Missing required commercetools environment variables.");
}

const ctClient = new ClientBuilder()
  .withMiddleware(
    createAuthMiddlewareForClientCredentialsFlow({
      host: authUrl,
      projectKey,
      credentials: { clientId, clientSecret },
      scopes,
      httpClient: fetch,
    })
  )
  .withMiddleware(
    createHttpMiddleware({
      host: apiUrl,
      httpClient: fetch,
    })
  )
  .build();

export { ctClient, projectKey };
