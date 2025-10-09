import { resolvers } from "../resolvers.js";
import { ctClient } from "../../clients/ct-client.js";

jest.mock("../../clients/ct-client.js", () => ({
  ctClient: { execute: jest.fn() },
  projectKey: "test-project",
}));

jest.mock("../../errors/api-error.js", () => ({
  APIError: jest.fn().mockImplementation((message, statusCode = 500) => ({
    message,
    statusCode,
    isApiError: true,
  })),
}));

describe("GraphQL Product resolvers", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Query.product", () => {
    it("returns product details when found", async () => {
      const mockResponse = { body: { id: "123", name: "Zelda" } };
      jest.mocked(ctClient.execute).mockResolvedValue(mockResponse);

      const result = await resolvers.Query.product({}, { id: "123" });

      expect(ctClient.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          method: "GET",
          uri: expect.stringContaining("/products/123"),
        })
      );
      expect(result).toEqual(mockResponse.body);
    });

    it("throws APIError when product fetch fails", async () => {
      jest.mocked(ctClient.execute).mockRejectedValue(new Error("Not found"));

      await expect(resolvers.Query.product({}, { id: "999" })).rejects.toEqual(
        expect.objectContaining({
          message: "Product: 999 not found.",
          statusCode: 404,
          isApiError: true,
        })
      );
    });
  });

  describe("Query.products", () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("returns product list without any filters", async () => {
      const mockResponse = { body: { results: [{ id: "1" }], total: 1 } };
      jest.mocked(ctClient.execute).mockResolvedValue(mockResponse);

      const result = await resolvers.Query.products(
        {},
        { limit: 5, offset: 0 }
      );

      expect(result).toEqual({
        results: [{ id: "1" }],
        total: 1,
        offset: 0,
        limit: 5,
      });
    });

    it("returns only products matching the search term", async () => {
      const mockProducts = [
        { id: "1", name: { "en-US": "Zelda" } },
        { id: "2", name: { "en-US": "Mario" } },
        { id: "3", name: { "en-US": "Zelda 2" } },
      ];

      jest.mocked(ctClient.execute).mockResolvedValue({
        body: {
          results: mockProducts.filter((p) =>
            p.name["en-US"].startsWith("Zelda")
          ),
        },
      });

      const result = await resolvers.Query.products({}, { search: "Zelda" });

      const calledArg = (ctClient.execute as jest.Mock).mock.calls[0][0];
      expect(calledArg.uri).toContain("text.en-US=Zelda");

      expect(result.results.map((p: any) => p.name["en-US"])).toEqual([
        "Zelda",
        "Zelda 2",
      ]);
    });

    it("returns products sorted by name descending", async () => {
      const mockResponse = {
        body: {
          results: [
            { id: "1", name: { "en-US": "Mario" } },
            { id: "2", name: { "en-US": "Zelda" } },
            { id: "3", name: { "en-US": "Alpha" } },
          ],
        },
      };
      jest.mocked(ctClient.execute).mockResolvedValue(mockResponse);

      const result = await resolvers.Query.products(
        {},
        { sortBy: "NAME", sortOrder: "DESC" }
      );

      const calledArg = (ctClient.execute as jest.Mock).mock.calls[0][0];
      expect(calledArg.uri).toContain("sort=name.en-US%20desc");

      // Check that the products are returned in descending order by name
      const returnedNames = result.results.map((p: any) => p.name["en-US"]);
      expect(returnedNames).toEqual(["Mario", "Zelda", "Alpha"]); // the resolver doesn’t sort client-side
    });

    it("filters products by category key", async () => {
      // Mock category fetch
      (ctClient.execute as jest.Mock)
        .mockResolvedValueOnce({ body: { results: [{ id: "cat123" }] } }) // category fetch
        .mockResolvedValueOnce({
          body: { results: [{ id: "1", categories: [{ id: "cat123" }] }] },
        }); // products fetch

      const result = await resolvers.Query.products({}, { categoryKey: "rpg" });

      // Category fetch
      expect(ctClient.execute).toHaveBeenNthCalledWith(1, {
        method: "GET",
        uri: '/test-project/categories?where=key="rpg"',
      });

      // Products fetch should include filter
      const secondCall = (ctClient.execute as jest.Mock).mock.calls[1][0];
      expect(secondCall.uri).toContain("filter=");
      expect(result.results).toHaveLength(1);
      expect(result.results[0].id).toBe("1");
    });

    it("returns empty list when category does not exist", async () => {
      (ctClient.execute as jest.Mock).mockResolvedValueOnce({
        body: { results: [] },
      });

      const result = await resolvers.Query.products(
        {},
        { categoryKey: "invalid" }
      );

      expect(result.results).toEqual([]);
      expect(result.total).toBe(0);
    });

    it("throws APIError when category fetch fails", async () => {
      // Mock category fetch to fail
      (ctClient.execute as jest.Mock).mockRejectedValueOnce(
        new Error("Error fetching")
      );

      await expect(
        resolvers.Query.products({}, { categoryKey: "invalid" })
      ).rejects.toMatchObject({
        message: "There was an error fetching categories",
        statusCode: 500,
        isApiError: true,
      });
    });
  });
});
