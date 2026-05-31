import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma";
import { ensureAuth, AuthRequest } from "../middleware/auth";

const categoriesRouter = Router();

const categorySchema = z.object({
  name: z.string().min(2),
  description: z.string().max(500).optional().nullable(),
  iconKey: z.string().max(64).optional().nullable(),
  colorKey: z.string().max(32).optional().nullable()
});

categoriesRouter.use(ensureAuth);

categoriesRouter.get("/", async (request: AuthRequest, response) => {
  const categories = await prisma.category.findMany({
    where: { userId: request.userId },
    orderBy: { createdAt: "desc" }
  });

  response.json({ data: categories });
});

categoriesRouter.post("/", async (request: AuthRequest, response) => {
  const payload = categorySchema.safeParse(request.body);

  if (!payload.success) {
    return response.status(400).json({ message: "Invalid data", errors: payload.error.flatten() });
  }

  const exists = await prisma.category.findFirst({
    where: { userId: request.userId, name: payload.data.name }
  });

  if (exists) {
    return response.status(409).json({ message: "Category already exists" });
  }

  const { name, description, iconKey, colorKey } = payload.data;
  const category = await prisma.category.create({
    data: {
      userId: request.userId!,
      name,
      description: description?.trim() || null,
      iconKey: iconKey?.trim() || null,
      colorKey: colorKey?.trim() || null
    }
  });

  response.status(201).json({ data: category });
});

categoriesRouter.put("/:id", async (request: AuthRequest, response) => {
  const payload = categorySchema.safeParse(request.body);

  if (!payload.success) {
    return response.status(400).json({ message: "Invalid data", errors: payload.error.flatten() });
  }

  const category = await prisma.category.findFirst({
    where: { id: request.params.id, userId: request.userId }
  });

  if (!category) {
    return response.status(404).json({ message: "Category not found" });
  }

  if (payload.data.name !== category.name) {
    const taken = await prisma.category.findFirst({
      where: { userId: request.userId, name: payload.data.name, NOT: { id: category.id } }
    });
    if (taken) {
      return response.status(409).json({ message: "Category already exists" });
    }
  }

  const { name, description, iconKey, colorKey } = payload.data;
  const updated = await prisma.category.update({
    where: { id: category.id },
    data: {
      name,
      description: description?.trim() || null,
      iconKey: iconKey?.trim() || null,
      colorKey: colorKey?.trim() || null
    }
  });

  response.json({ data: updated });
});

categoriesRouter.delete("/:id", async (request: AuthRequest, response) => {
  const category = await prisma.category.findFirst({
    where: { id: request.params.id, userId: request.userId }
  });

  if (!category) {
    return response.status(404).json({ message: "Category not found" });
  }

  await prisma.category.delete({
    where: { id: category.id }
  });

  response.status(204).send();
});

export { categoriesRouter };
