import dotenv from "dotenv";

dotenv.config();

const env = {
  port: Number(process.env.PORT ?? 3333),
  jwtSecret: process.env.JWT_SECRET ?? "financy_dev_secret",
  databaseUrl: process.env.DATABASE_URL ?? "file:./dev.db",
  clientUrl: process.env.CLIENT_URL ?? "http://localhost:5173"
};

export { env };
