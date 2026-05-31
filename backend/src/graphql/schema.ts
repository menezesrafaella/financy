import { createSchema } from "graphql-yoga";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../prisma";
import { env } from "../config/env";

type Context = {
  userId?: string;
};

function getUserId(context: Context) {
  if (!context.userId) {
    throw new Error("Unauthorized");
  }
  return context.userId;
}

function mapTransaction(transaction: any) {
  return {
    ...transaction,
    date: transaction.date.toISOString(),
    category: transaction.category ?? null
  };
}

export const schema = createSchema({
  typeDefs: `
    type User {
      id: String!
      name: String!
      email: String!
    }

    enum TransactionType {
      INCOME
      EXPENSE
    }

    type Category {
      id: String!
      name: String!
      description: String
      iconKey: String
      colorKey: String
      transactionCount: Int!
    }

    type Transaction {
      id: String!
      description: String!
      amount: Float!
      date: String!
      type: TransactionType!
      categoryId: String!
      category: Category
    }

    type SummaryItem {
      categoryId: String!
      categoryName: String!
      type: TransactionType!
      total: Float!
      colorKey: String
      iconKey: String
    }

    type Summary {
      income: Float!
      expense: Float!
      balance: Float!
      byCategory: [SummaryItem!]!
    }

    type AuthPayload {
      user: User!
      token: String!
    }

    input CategoryInput {
      name: String!
      description: String
      iconKey: String
      colorKey: String
    }

    input TransactionInput {
      description: String!
      amount: Float!
      date: String!
      type: TransactionType!
      categoryId: String!
    }

    input TransactionFilter {
      startDate: String
      endDate: String
      type: TransactionType
      categoryId: String
    }

    type Query {
      me: User
      categories: [Category!]!
      transactions(filters: TransactionFilter): [Transaction!]!
      summary: Summary!
    }

    type Mutation {
      register(name: String!, email: String!, password: String!): AuthPayload!
      login(email: String!, password: String!): AuthPayload!
      updateProfile(name: String!): User!
      createCategory(data: CategoryInput!): Category!
      updateCategory(id: String!, data: CategoryInput!): Category!
      deleteCategory(id: String!): Boolean!
      createTransaction(data: TransactionInput!): Transaction!
      updateTransaction(id: String!, data: TransactionInput!): Transaction!
      deleteTransaction(id: String!): Boolean!
    }
  `,
  resolvers: {
    Category: {
      transactionCount: async (parent, _args, context: Context) => {
        if (!context.userId) return 0;
        return prisma.transaction.count({
          where: { userId: context.userId, categoryId: parent.id }
        });
      }
    },
    Query: {
      me: async (_parent, _args, context: Context) => {
        if (!context.userId) return null;
        return prisma.user.findUnique({ where: { id: context.userId } });
      },
      categories: async (_parent, _args, context: Context) => {
        const userId = getUserId(context);
        return prisma.category.findMany({
          where: { userId },
          orderBy: { createdAt: "desc" }
        });
      },
      transactions: async (_parent, args, context: Context) => {
        const userId = getUserId(context);
        const filters: Record<string, any> = { userId };

        if (args.filters?.type) {
          filters.type = args.filters.type;
        }
        if (args.filters?.categoryId) {
          filters.categoryId = args.filters.categoryId;
        }
        if (args.filters?.startDate || args.filters?.endDate) {
          filters.date = {};
          if (args.filters.startDate) {
            filters.date.gte = new Date(args.filters.startDate);
          }
          if (args.filters.endDate) {
            filters.date.lte = new Date(args.filters.endDate);
          }
        }

        const transactions = await prisma.transaction.findMany({
          where: filters,
          include: { category: true },
          orderBy: { date: "desc" }
        });

        return transactions.map(mapTransaction);
      },
      summary: async (_parent, _args, context: Context) => {
        const userId = getUserId(context);

        const [income, expense, byCategory, categories] = await Promise.all([
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
          }),
          prisma.category.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" }
          })
        ]);

        const totalsByCategoryKey = new Map<string, number>();
        for (const row of byCategory) {
          const key = `${row.categoryId}|${row.type}`;
          totalsByCategoryKey.set(key, Number(row._sum.amount ?? 0));
        }

        const categoryIds = new Set(categories.map((c) => c.id));

        const byCategoryWithNames = [
          ...categories.map((category) => {
            const inc = totalsByCategoryKey.get(`${category.id}|INCOME`) ?? 0;
            const exp = totalsByCategoryKey.get(`${category.id}|EXPENSE`) ?? 0;
            const total = inc - exp;
            const type = total > 0 ? "INCOME" : "EXPENSE";
            return {
              categoryId: category.id,
              categoryName: category.name,
              type,
              total,
              colorKey: category.colorKey,
              iconKey: category.iconKey
            };
          }),
          ...byCategory
            .filter((row) => !categoryIds.has(row.categoryId))
            .map((row) => ({
              categoryId: row.categoryId,
              categoryName: "Without category",
              type: row.type,
              total: Number(row._sum.amount ?? 0),
              colorKey: null,
              iconKey: null
            }))
        ];

        const incomeTotal = Number(income._sum.amount ?? 0);
        const expenseTotal = Number(expense._sum.amount ?? 0);

        return {
          income: incomeTotal,
          expense: expenseTotal,
          balance: incomeTotal - expenseTotal,
          byCategory: byCategoryWithNames
        };
      }
    },
    Mutation: {
      register: async (_parent, args) => {
        const existingUser = await prisma.user.findUnique({ where: { email: args.email } });
        if (existingUser) {
          throw new Error("Email already registered");
        }

        const passwordHash = await bcrypt.hash(args.password, 10);
        const user = await prisma.user.create({
          data: { name: args.name, email: args.email, passwordHash }
        });

        const token = jwt.sign({}, env.jwtSecret, { subject: user.id, expiresIn: "7d" });
        return { user, token };
      },
      login: async (_parent, args) => {
        const user = await prisma.user.findUnique({ where: { email: args.email } });
        if (!user) {
          throw new Error("Invalid credentials");
        }

        const passwordMatches = await bcrypt.compare(args.password, user.passwordHash);
        if (!passwordMatches) {
          throw new Error("Invalid credentials");
        }

        const token = jwt.sign({}, env.jwtSecret, { subject: user.id, expiresIn: "7d" });
        return { user, token };
      },
      updateProfile: async (_parent, args, context: Context) => {
        const userId = getUserId(context);
        const name = args.name.trim();
        if (!name.length) {
          throw new Error("Invalid name");
        }
        return prisma.user.update({
          where: { id: userId },
          data: { name }
        });
      },
      createCategory: async (_parent, args, context: Context) => {
        const userId = getUserId(context);
        const name = args.data.name.trim();
        if (!name.length) {
          throw new Error("Invalid name");
        }
        const exists = await prisma.category.findFirst({
          where: { userId, name }
        });
        if (exists) {
          throw new Error("Category already exists");
        }

        const { description, iconKey, colorKey } = args.data;
        return prisma.category.create({
          data: {
            userId,
            name,
            description: description?.trim() || null,
            iconKey: iconKey?.trim() || null,
            colorKey: colorKey?.trim() || null
          }
        });
      },
      updateCategory: async (_parent, args, context: Context) => {
        const userId = getUserId(context);
        const category = await prisma.category.findFirst({
          where: { id: args.id, userId }
        });
        if (!category) {
          throw new Error("Category not found");
        }

        const name = args.data.name.trim();
        if (!name.length) {
          throw new Error("Invalid name");
        }

        if (name !== category.name) {
          const nameTaken = await prisma.category.findFirst({
            where: { userId, name, NOT: { id: category.id } }
          });
          if (nameTaken) {
            throw new Error("Category already exists");
          }
        }

        const { description, iconKey, colorKey } = args.data;
        return prisma.category.update({
          where: { id: category.id },
          data: {
            name,
            description: description?.trim() || null,
            iconKey: iconKey?.trim() || null,
            colorKey: colorKey?.trim() || null
          }
        });
      },
      deleteCategory: async (_parent, args, context: Context) => {
        const userId = getUserId(context);
        const category = await prisma.category.findFirst({
          where: { id: args.id, userId }
        });
        if (!category) {
          throw new Error("Category not found");
        }
        await prisma.category.delete({ where: { id: category.id } });
        return true;
      },
      createTransaction: async (_parent, args, context: Context) => {
        const userId = getUserId(context);
        const category = await prisma.category.findFirst({
          where: { id: args.data.categoryId, userId }
        });
        if (!category) {
          throw new Error("Category not found");
        }

        const transaction = await prisma.transaction.create({
          data: {
            ...args.data,
            date: new Date(args.data.date),
            userId
          },
          include: { category: true }
        });

        return mapTransaction(transaction);
      },
      updateTransaction: async (_parent, args, context: Context) => {
        const userId = getUserId(context);
        const existing = await prisma.transaction.findFirst({
          where: { id: args.id, userId }
        });
        if (!existing) {
          throw new Error("Transaction not found.");
        }

        const category = await prisma.category.findFirst({
          where: { id: args.data.categoryId, userId }
        });
        if (!category) {
          throw new Error("Category not found.");
        }

        const updated = await prisma.transaction.update({
          where: { id: existing.id },
          data: { ...args.data, date: new Date(args.data.date) },
          include: { category: true }
        });

        return mapTransaction(updated);
      },
      deleteTransaction: async (_parent, args, context: Context) => {
        const userId = getUserId(context);
        const existing = await prisma.transaction.findFirst({
          where: { id: args.id, userId }
        });
        if (!existing) {
          throw new Error("Transaction not found.");
        }
        await prisma.transaction.delete({ where: { id: existing.id } });
        return true;
      }
    }
  }
});

