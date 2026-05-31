import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma";
import { ensureAuth, AuthRequest } from "../middleware/auth";

const transactionsRouter = Router();

const transactionSchema = z.object({
  description: z.string().min(2),
  amount: z.number().positive(),
  date: z.string().transform((value) => new Date(value)),
  type: z.enum(["INCOME", "EXPENSE"]),
  categoryId: z.string().min(1)
});

transactionsRouter.use(ensureAuth);

transactionsRouter.get("/", async (request: AuthRequest, response) => {
  const { startDate, endDate, type, categoryId } = request.query;

  const filters: Record<string, unknown> = {
    userId: request.userId
  };

  if (type && (type === "INCOME" || type === "EXPENSE")) {
    filters.type = type;
  }

  if (categoryId && typeof categoryId === "string") {
    filters.categoryId = categoryId;
  }

  if (startDate || endDate) {
    filters.date = {};
    if (startDate && typeof startDate === "string") {
      (filters.date as { gte?: Date }).gte = new Date(startDate);
    }
    if (endDate && typeof endDate === "string") {
      (filters.date as { lte?: Date }).lte = new Date(endDate);
    }
  }

  const transactions = await prisma.transaction.findMany({
    where: filters,
    include: { category: true },
    orderBy: { date: "desc" }
  });

  response.json({ data: transactions });
});

transactionsRouter.post("/", async (request: AuthRequest, response) => {
  const payload = transactionSchema.safeParse(request.body);

  if (!payload.success) {
    return response.status(400).json({ message: "Invalid data", errors: payload.error.flatten() });
  }

  const category = await prisma.category.findFirst({
    where: {
      id: payload.data.categoryId,
      userId: request.userId
    }
  });

  if (!category) {
    return response.status(404).json({ message: "Category not found." });
  }

  const transaction = await prisma.transaction.create({
    data: {
      ...payload.data,
      userId: request.userId!
    },
    include: { category: true }
  });

  response.status(201).json({ data: transaction });
});

transactionsRouter.put("/:id", async (request: AuthRequest, response) => {
  const payload = transactionSchema.safeParse(request.body);

  if (!payload.success) {
    return response.status(400).json({ message: "Invalid data", errors: payload.error.flatten() });
  }

  const existing = await prisma.transaction.findFirst({
    where: { id: request.params.id, userId: request.userId }
  });

  if (!existing) {
    return response.status(404).json({ message: "Transaction not found." });
  }

  const category = await prisma.category.findFirst({
    where: {
      id: payload.data.categoryId,
      userId: request.userId
    }
  });

  if (!category) {
    return response.status(404).json({ message: "Category not found." });
  }

  const updated = await prisma.transaction.update({
    where: { id: existing.id },
    data: payload.data,
    include: { category: true }
  });

  response.json({ data: updated });
});

transactionsRouter.delete("/:id", async (request: AuthRequest, response) => {
  const existing = await prisma.transaction.findFirst({
    where: { id: request.params.id, userId: request.userId }
  });

  if (!existing) {
    return response.status(404).json({ message: "Transaction not found." });
  }

  await prisma.transaction.delete({
    where: { id: existing.id }
  });

  response.status(204).send();
});

export { transactionsRouter };
