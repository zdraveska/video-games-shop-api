import fetch from "node-fetch";

import {
  CT_CLIENT_ID,
  CT_CLIENT_SECRET,
  CT_AUTH_URL,
  CT_PROJECT_KEY,
} from "../config.js";

export interface TokenResponse {
  access_token: string;
  expires_in: number;
  scope: string;
  token_type: string;
}

export async function getShoppingListToken(): Promise<string> {
  const tokenResp = await getCTToken(
    `manage_shopping_lists:${CT_PROJECT_KEY} view_products:${CT_PROJECT_KEY} manage_orders:${CT_PROJECT_KEY}`
  );
  return tokenResp.access_token;
}

export async function getOrderToken(): Promise<string> {
  const tokenResp = await getCTToken(
    `manage_orders:${CT_PROJECT_KEY} view_products:${CT_PROJECT_KEY} view_shopping_lists:${CT_PROJECT_KEY}`
  );
  return tokenResp.access_token;
}

async function getCTToken(scopes: string): Promise<TokenResponse> {
  if (!CT_AUTH_URL || !CT_CLIENT_ID || !CT_CLIENT_SECRET) {
    throw new Error(
      "Missing CommerceTools credentials in environment variables"
    );
  }

  const resp = await fetch(`${CT_AUTH_URL}/oauth/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization:
        "Basic " +
        Buffer.from(`${CT_CLIENT_ID}:${CT_CLIENT_SECRET}`).toString("base64"),
    },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      scope: scopes,
    }),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Failed to fetch CT token: ${resp.status} ${text}`);
  }

  const data: unknown = await resp.json();

  if (
    typeof data === "object" &&
    data !== null &&
    "access_token" in data &&
    "expires_in" in data &&
    "scope" in data &&
    "token_type" in data
  ) {
    return data as TokenResponse;
  } else {
    throw new Error("Invalid token response");
  }
}
