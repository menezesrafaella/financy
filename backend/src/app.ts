import express from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import { createYoga } from "graphql-yoga";
import { env } from "./config/env";
import { router } from "./routes";
import { schema } from "./graphql/schema";

const app = express();

app.use(cors({ origin: env.clientUrl }));
app.use(express.json());

const yoga = createYoga({
  schema,
  graphiql: true,
  maskedErrors: false,
  context: ({ request }) => {
    const authHeader = request.headers.get("authorization");
    if (!authHeader) return {};
    const [, token] = authHeader.split(" ");
    if (!token) return {};
    try {
      const decoded = jwt.verify(token, env.jwtSecret) as { sub: string };
      return { userId: decoded.sub };
    } catch {
      return {};
    }
  }
});

app.get("/", (_request, response) => {
  response.json({ status: "Financy API online", graphql: "/graphql" });
});

app.use("/api", router);
app.use("/graphql", yoga);

app.use((error: Error, _request: express.Request, response: express.Response, _next: express.NextFunction) => {
  console.error(error);
  response.status(500).json({ message: "Erro interno do servidor." });
});

export { app };
