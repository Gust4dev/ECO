import { router, protectedProcedure } from "../trpc";
import { z } from "zod";

const createCategorySchema = z.object({
  name: z.string().min(1).max(50),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  icon: z.string().max(50).optional(),
  monthlyBudgetCents: z.number().int().min(0).optional(),
  parentId: z.string().cuid().optional(),
});

const updateCategorySchema = z.object({
  id: z.string().cuid(),
  name: z.string().min(1).max(50).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).nullable().optional(),
  icon: z.string().max(50).nullable().optional(),
  monthlyBudgetCents: z.number().int().min(0).nullable().optional(),
});

export const categoriesRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.category.findMany({
      where: { userId: ctx.userId, parentId: null },
      include: { children: true },
      orderBy: { name: "asc" },
    });
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      const category = await ctx.prisma.category.findFirst({
        where: { id: input.id, userId: ctx.userId },
        include: { children: true, parent: true },
      });

      if (!category) throw new Error("Categoria não encontrada");
      return category;
    }),

  create: protectedProcedure
    .input(createCategorySchema)
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.prisma.category.findFirst({
        where: { userId: ctx.userId, name: input.name },
      });

      if (existing) throw new Error("Categoria já existe");

      return ctx.prisma.category.create({
        data: {
          userId: ctx.userId,
          name: input.name,
          color: input.color,
          icon: input.icon,
          monthlyBudgetCents: input.monthlyBudgetCents,
          parentId: input.parentId,
        },
      });
    }),

  update: protectedProcedure
    .input(updateCategorySchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      const existing = await ctx.prisma.category.findFirst({
        where: { id, userId: ctx.userId },
      });

      if (!existing) throw new Error("Categoria não encontrada");

      return ctx.prisma.category.update({
        where: { id },
        data,
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      const category = await ctx.prisma.category.findFirst({
        where: { id: input.id, userId: ctx.userId },
        include: { transactions: { take: 1 }, children: { take: 1 } },
      });

      if (!category) throw new Error("Categoria não encontrada");
      if (category.transactions.length > 0) {
        throw new Error("Categoria possui transações vinculadas");
      }
      if (category.children.length > 0) {
        throw new Error("Categoria possui subcategorias");
      }

      return ctx.prisma.category.delete({ where: { id: input.id } });
    }),

  getSpending: protectedProcedure
    .input(z.object({ competence: z.string().regex(/^\d{4}-\d{2}$/) }))
    .query(async ({ ctx, input }) => {
      const [year, month] = input.competence.split("-").map(Number);
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);

      const categories = await ctx.prisma.category.findMany({
        where: { userId: ctx.userId },
        include: {
          transactions: {
            where: {
              competenceAt: { gte: startDate, lte: endDate },
              type: "EXPENSE",
              status: { not: "CANCELLED" },
            },
            select: { amountCents: true },
          },
        },
      });

      return categories.map((cat) => ({
        id: cat.id,
        name: cat.name,
        color: cat.color,
        icon: cat.icon,
        budgetCents: cat.monthlyBudgetCents,
        spentCents: cat.transactions.reduce((sum, t) => sum + t.amountCents, 0),
      }));
    }),
});