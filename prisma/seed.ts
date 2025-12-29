import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando seed...");

  const user = await prisma.user.upsert({
    where: { email: "dev@eco.local" },
    update: {},
    create: {
      id: "dev-user-123",
      email: "dev@eco.local",
      name: "Desenvolvedor",
      profile: {
        create: {
          incomeType: "VARIABLE",
          averageMonthlyIncome: 800000,
          emergencyMonths: 6,
          billingCycleDay: 1,
        },
      },
    },
  });

  console.log(`✅ Usuário criado: ${user.email}`);

  const categories = [
    { name: "Alimentação", color: "#ef4444", icon: "utensils" },
    { name: "Transporte", color: "#3b82f6", icon: "car" },
    { name: "Moradia", color: "#8b5cf6", icon: "home" },
    { name: "Saúde", color: "#10b981", icon: "heart" },
    { name: "Educação", color: "#f59e0b", icon: "book" },
    { name: "Lazer", color: "#ec4899", icon: "gamepad" },
    { name: "Freelance", color: "#06b6d4", icon: "briefcase" },
    { name: "Investimentos", color: "#84cc16", icon: "trending-up" },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { userId_name: { userId: user.id, name: cat.name } },
      update: {},
      create: {
        userId: user.id,
        name: cat.name,
        color: cat.color,
        icon: cat.icon,
      },
    });
  }

  console.log(`✅ ${categories.length} categorias criadas`);

  const alimentacao = await prisma.category.findFirst({
    where: { userId: user.id, name: "Alimentação" },
  });

  const freelance = await prisma.category.findFirst({
    where: { userId: user.id, name: "Freelance" },
  });

  await prisma.goal.upsert({
    where: { id: "goal-emergencia" },
    update: {},
    create: {
      id: "goal-emergencia",
      userId: user.id,
      name: "Reserva de Emergência",
      description: "6 meses de despesas",
      targetCents: 4800000,
      currentCents: 1200000,
      monthlyAllocation: 200000,
      priority: 1,
      status: "ACTIVE",
    },
  });

  await prisma.goal.upsert({
    where: { id: "goal-carro" },
    update: {},
    create: {
      id: "goal-carro",
      userId: user.id,
      name: "Carro Novo",
      description: "Entrada para financiamento",
      targetCents: 3000000,
      currentCents: 500000,
      monthlyAllocation: 150000,
      priority: 2,
      targetDate: new Date("2025-12-01"),
      status: "ACTIVE",
    },
  });

  console.log("✅ 2 metas criadas");

  const now = new Date();
  const transactions = [
    {
      description: "Projeto Website Cliente A",
      amountCents: 450000,
      type: "INCOME" as const,
      categoryId: freelance?.id,
      occurredAt: new Date(now.getFullYear(), now.getMonth(), 5),
    },
    {
      description: "Projeto App Cliente B",
      amountCents: 350000,
      type: "INCOME" as const,
      categoryId: freelance?.id,
      occurredAt: new Date(now.getFullYear(), now.getMonth(), 15),
    },
    {
      description: "Supermercado",
      amountCents: 45000,
      type: "EXPENSE" as const,
      categoryId: alimentacao?.id,
      occurredAt: new Date(now.getFullYear(), now.getMonth(), 8),
    },
    {
      description: "iFood",
      amountCents: 8500,
      type: "EXPENSE" as const,
      categoryId: alimentacao?.id,
      occurredAt: new Date(now.getFullYear(), now.getMonth(), 10),
    },
  ];

  for (const tx of transactions) {
    await prisma.transaction.create({
      data: {
        userId: user.id,
        description: tx.description,
        amountCents: tx.amountCents,
        type: tx.type,
        status: "CONFIRMED",
        categoryId: tx.categoryId,
        occurredAt: tx.occurredAt,
        competenceAt: new Date(tx.occurredAt.getFullYear(), tx.occurredAt.getMonth(), 1),
      },
    });
  }

  console.log(`✅ ${transactions.length} transações criadas`);

  console.log("🎉 Seed concluído!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });