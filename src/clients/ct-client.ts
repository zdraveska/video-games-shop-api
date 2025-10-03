import {
  CT_PROJECT_KEY,
  CT_CLIENT_ID,
  CT_CLIENT_SECRET,
  CT_SCOPES,
  CT_API_URL,
  CT_AUTH_URL,
} from "../config.js";
import fetch from "node-fetch";
import {
  ClientBuilder,
  createAuthMiddlewareForClientCredentialsFlow,
  createHttpMiddleware,
} from "@commercetools/ts-client";

const projectKey = CT_PROJECT_KEY;
const scopes = CT_SCOPES.split(" ");

const ctClient = new ClientBuilder()
  .withMiddleware(
    createAuthMiddlewareForClientCredentialsFlow({
      host: CT_AUTH_URL,
      projectKey,
      credentials: { clientId: CT_CLIENT_ID, clientSecret: CT_CLIENT_SECRET },
      scopes,
      httpClient: fetch,
    })
  )
  .withMiddleware(
    createHttpMiddleware({
      host: CT_API_URL,
      httpClient: fetch,
    })
  )
  .build();

export { ctClient, projectKey };
