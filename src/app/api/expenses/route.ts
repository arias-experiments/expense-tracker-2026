import { desc } from "drizzle-orm";
import { NextResponse } from "next/server";

import { getDb } from "@/db";
import { expenses } from "@/db/schema";
import { isValidPeople } from "@/lib/people";

function isValidDate(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !Number.isNaN(Date.parse(`${value}T00:00:00.000Z`))
  );
}

export async function GET() {
  const db = getDb();
  const rows = await db.select().from(expenses).orderBy(desc(expenses.date), desc(expenses.createdAt));

  return NextResponse.json(rows);
}

export async function POST(request: Request) {
  const db = getDb();
  const body = (await request.json()) as {
    date?: unknown;
    amount?: unknown;
    description?: unknown;
    people?: unknown;
  };

  const amount = Number(body.amount);
  const description = typeof body.description === "string" ? body.description.trim() : "";

  if (!isValidDate(body.date)) {
    return NextResponse.json({ error: "Date is required." }, { status: 400 });
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: "Amount must be greater than 0." }, { status: 400 });
  }

  if (!description) {
    return NextResponse.json({ error: "Description is required." }, { status: 400 });
  }

  if (!isValidPeople(body.people)) {
    return NextResponse.json({ error: "People contains an invalid name." }, { status: 400 });
  }

  const [expense] = await db
    .insert(expenses)
    .values({
      date: body.date,
      amount: amount.toFixed(2),
      description,
      people: body.people,
    })
    .returning();

  return NextResponse.json(expense, { status: 201 });
}
