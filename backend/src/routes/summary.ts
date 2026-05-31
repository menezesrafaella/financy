import { Router } from "express";
import { prisma } from "../prisma";
import { ensureAuth, AuthRequest } from "../middleware/auth";

const summaryRouter = Router();

summaryRouter.use(ensureAuth);

summaryRouter.get("/", async (request: AuthRequest, response) => {
  const userId = request.userId!;

  const [income, expense, byCategory] = await Promise.all([
    prisma.transaction.aggregate({
      where: { userId, type: "INCOME" },
      _sum: { amount: true }
    }),
    prisma.transaction.aggregate({
      where: { userId, type: "EXPENSE" },
      _sum: { amount: true }
    }),
    prisma.transaction.groupBy({
      by: ["categoryId", "type"],
      where: { userId },
      _sum: { amount: true }
    })
  ]);

  const categories = await prisma.category.findMany({
    where: { userId }
  });

  const categoryMap = new Map(categories.map((category) => [category.id, category]));

  const byCategoryWithNames = byCategory.map((item) => {
    const category = categoryMap.get(item.categoryId);
    return {
      categoryId: item.categoryId,
      categoryName: category?.name ?? "Without category",
      type: item.type,
      total: item._sum.amount ?? 0
    };
  });

  const incomeTotal = Number(income._sum.amount ?? 0);
  const expenseTotal = Number(expense._sum.amount ?? 0);

  response.json({
    data: {
      income: incomeTotal,
      expense: expenseTotal,
      balance: incomeTotal - expenseTotal,
      byCategory: byCategoryWithNames
    }
  });
});

export { summaryRouter };
