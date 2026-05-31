import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { prisma } from "../prisma";
import { env } from "../config/env";

const authRouter = Router();

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6)
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

authRouter.post("/register", async (request, response) => {
  const payload = registerSchema.safeParse(request.body);

  if (!payload.success) {
    return response.status(400).json({ message: "Invalid data", errors: payload.error.flatten() });
  }

  const { name, email, password } = payload.data;

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return response.status(409).json({ message: "Email already registered" });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash
    }
  });

  const token = jwt.sign({}, env.jwtSecret, {
    subject: user.id,
    expiresIn: "7d"
  });

  return response.status(201).json({
    user: { id: user.id, name: user.name, email: user.email },
    token
  });
});

authRouter.post("/login", async (request, response) => {
  const payload = loginSchema.safeParse(request.body);

  if (!payload.success) {
    return response.status(400).json({ message: "Invalid data", errors: payload.error.flatten() });
  }

  const { email, password } = payload.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return response.status(401).json({ message: "Invalid credentials." });
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatches) {
    return response.status(401).json({ message: "Invalid credentials." });
  }

  const token = jwt.sign({}, env.jwtSecret, {
    subject: user.id,
    expiresIn: "7d"
  });

  return response.json({
    user: { id: user.id, name: user.name, email: user.email },
    token
  });
});

export { authRouter };
