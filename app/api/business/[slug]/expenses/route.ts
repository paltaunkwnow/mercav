import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiBusiness } from "@/lib/business/context";
import { audit } from "@/lib/business/audit";
import { ExpenseCategory } from "@prisma/client";

const CreateExpenseSchema = z.object({
  date: z.string().datetime(),
  category: z.enum([
    "SALARIOS",
    "SERVICIOS",
    "MARKETING",
    "OPERACION",
    "OTROS",
  ]),
  amount: z.number().positive("El monto debe ser mayor a 0"),
  description: z.string().min(1, "La descripción es requerida"),
  receipt: z.string().url().optional().or(z.literal("")),
});

const ListExpensesSchema = z.object({
  year: z.coerce.number().int().optional(),
  month: z.coerce.number().int().min(1).max(12).optional(),
  category: z.enum([
    "SALARIOS",
    "SERVICIOS",
    "MARKETING",
    "OPERACION",
    "OTROS",
  ]).optional(),
});

export const dynamic = "force-dynamic";

/**
 * GET /api/business/[slug]/expenses
 * Lista gastos del mes/año actual filtrados por categoría
 */
export async function GET(req: Request, { params }: { params: { slug: string } }) {
  const auth = await apiBusiness(params.slug, "expenses.view");
  if ("error" in auth) return auth.error;
  const { ctx } = auth;

  const url = new URL(req.url);
  const parsed = ListExpensesSchema.safeParse({
    year: url.searchParams.get("year"),
    month: url.searchParams.get("month"),
    category: url.searchParams.get("category"),
  });

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Parámetros inválidos" },
      { status: 400 }
    );
  }

  const { year, month, category } = parsed.data;
  const now = new Date();
  const filterYear = year || now.getFullYear();
  const filterMonth = month || now.getMonth() + 1;

  const startDate = new Date(filterYear, filterMonth - 1, 1);
  const endDate = new Date(filterYear, filterMonth, 0, 23, 59, 59, 999);

  const where: any = {
    workspaceId: ctx.workspace.id,
    date: {
      gte: startDate,
      lte: endDate,
    },
  };

  if (category) {
    where.category = category;
  }

  const expenses = await prisma.businessExpense.findMany({
    where,
    orderBy: { date: "desc" },
  });

  // Calcular estadísticas
  const total = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const byCategory = expenses.reduce((acc, e) => {
    const cat = e.category;
    acc[cat] = (acc[cat] || 0) + Number(e.amount);
    return acc;
  }, {} as Record<string, number>);

  return NextResponse.json({
    success: true,
    data: {
      expenses: expenses.map((e) => ({
        id: e.id,
        date: e.date.toISOString(),
        category: e.category,
        amount: Number(e.amount),
        description: e.description,
        receipt: e.receipt,
      })),
      stats: {
        total,
        byCategory,
        count: expenses.length,
      },
    },
  });
}

/**
 * POST /api/business/[slug]/expenses
 * Crea un nuevo gasto
 */
export async function POST(req: Request, { params }: { params: { slug: string } }) {
  const auth = await apiBusiness(params.slug, "expenses.manage");
  if ("error" in auth) return auth.error;
  const { ctx } = auth;

  const parsed = CreateExpenseSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        error: "Los datos del gasto no son válidos",
        details: parsed.error.flatten(),
      },
      { status: 400 }
    );
  }

  const { date, category, amount, description, receipt } = parsed.data;

  const expense = await prisma.businessExpense.create({
    data: {
      workspaceId: ctx.workspace.id,
      date: new Date(date),
      category: category as ExpenseCategory,
      amount,
      description,
      receipt: receipt && receipt !== "" ? receipt : null,
    },
  });

  await audit(ctx.workspace.id, ctx.userId, "expenses.create", "BusinessExpense", expense.id, {
    category,
    amount,
    description,
  });

  return NextResponse.json({
    success: true,
    data: {
      id: expense.id,
      date: expense.date.toISOString(),
      category: expense.category,
      amount: Number(expense.amount),
      description: expense.description,
      receipt: expense.receipt,
    },
  });
}
// creado por pato dev y askforvini
