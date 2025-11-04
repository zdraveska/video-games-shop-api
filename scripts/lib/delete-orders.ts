import { ctClient, projectKey } from "../../src/clients/ct-client.js";
import { getOrderToken } from "../../src/clients/ct-auth.js";

export async function deleteAllOrders({ confirm = false } = {}) {
  if (!confirm) {
    console.log("Skipping order deletion (confirmation required).");
    return;
  }

  console.log("Fetching existing orders...");

  const token = await getOrderToken();
  const fetchRes = await ctClient.execute({
    method: "GET",
    uri: `/${projectKey}/orders`,
    headers: { Authorization: `Bearer ${token}` },
  });

  const orders = fetchRes.body.results || [];
  if (orders.length === 0) {
    console.log("No orders found.");
    return;
  }

  console.log(`Found ${orders.length} orders. Deleting...`);

  for (const order of orders) {
    try {
      await ctClient.execute({
        method: "DELETE",
        uri: `/${projectKey}/orders/${order.id}?version=${order.version}`,
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log(`Deleted order ${order.orderNumber || order.id}`);
    } catch (err: any) {
      console.warn(
        `⚠️ Failed to delete order ${order.orderNumber || order.id}: ${
          err.message || err
        }`
      );
    }
  }

  console.log("All orders processed.\n");
}
