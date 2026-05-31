import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const categorySeeds = [
  {
    name: "Alimentação",
    type: "EXPENSE",
    description: "Restaurantes, delivery e refeições",
    iconKey: "utensils",
    colorKey: "blue",
    txCount: 8
  },
  {
    name: "Entretenimento",
    type: "EXPENSE",
    description: "Cinema, jogos e lazer",
    iconKey: "ticket",
    colorKey: "pink",
    txCount: 2
  },
  {
    name: "Investimento",
    type: "INCOME",
    description: "Aplicações e retornos financeiros",
    iconKey: "piggy-bank",
    colorKey: "green",
    txCount: 1
  },
  {
    name: "Mercado",
    type: "EXPENSE",
    description: "Compras de supermercado e mantimentos",
    iconKey: "shopping-cart",
    colorKey: "orange",
    txCount: 3
  },
  {
    name: "Salário",
    type: "INCOME",
    description: "Renda mensal e bonificações",
    iconKey: "briefcase-business",
    colorKey: "green",
    txCount: 3
  },
  {
    name: "Saúde",
    type: "EXPENSE",
    description: "Medicamentos, consultas e exames",
    iconKey: "heart-pulse",
    colorKey: "red",
    txCount: 0
  },
  {
    name: "Transporte",
    type: "EXPENSE",
    description: "Gasolina, transporte público e viagens",
    iconKey: "car-front",
    colorKey: "purple",
    txCount: 5
  },
  {
    name: "Utilidades",
    type: "EXPENSE",
    description: "Energia, água, internet e telefone",
    iconKey: "gift",
    colorKey: "yellow",
    txCount: 5
  }
];

async function main() {
  const passwordHash = await bcrypt.hash("password1234", 10);

  const user = await prisma.user.upsert({
    where: { email: "test@financy.app" },
    update: { name: "Test User", passwordHash },
    create: {
      name: "Test User",
      email: "test@financy.app",
      passwordHash
    }
  });

  await prisma.transaction.deleteMany({ where: { userId: user.id } });
  await prisma.category.deleteMany({ where: { userId: user.id } });

  const created: { id: string; type: string; txCount: number }[] = [];

  for (const row of categorySeeds) {
    const { txCount, type, ...rest } = row;
    const cat = await prisma.category.create({
      data: {
        ...rest,
        userId: user.id
      }
    });
    created.push({ id: cat.id, type, txCount });
  }

  const dayMs = 86400000;
  let t = Date.now();

  for (const c of created) {
    for (let i = 0; i < c.txCount; i += 1) {
      t -= dayMs;
      await prisma.transaction.create({
        data: {
          description: `Lançamento ${i + 1}`,
          amount: Math.round(15 + Math.random() * 180),
          date: new Date(t),
          type: c.type,
          categoryId: c.id,
          userId: user.id
        }
      });
    }
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
