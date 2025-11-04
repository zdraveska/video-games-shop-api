import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import { GraphQLError } from "graphql";

import { PORT } from "../config.js";
import { APIError } from "../errors/api-error.js";

import { typeDefs } from "./schema.js";
import { resolvers } from "./resolvers/index.js";

const server = new ApolloServer({
  typeDefs,
  resolvers,
  formatError: (formattedError, error) => {
    const graphQLError = error as GraphQLError;

    if (graphQLError?.originalError instanceof APIError) {
      return {
        message: graphQLError.message,
        extensions: { code: graphQLError.originalError.statusCode },
      };
    }

    return formattedError;
  },
});

async function startServer() {
  const port = PORT;
  const { url } = await startStandaloneServer(server, {
    listen: { port },
  });

  console.log(`GraphQL Server ready at: ${url}`);
}

startServer();
