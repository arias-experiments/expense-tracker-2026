import { desc } from "drizzle-orm";
import { NextResponse } from "next/server";
import * as XLSX from "xlsx";

import { getDb } from "@/db";
import { expenses } from "@/db/schema";
import { PEOPLE } from "@/lib/people";

export async function GET() {
  const db = getDb();
  const rows = await db.select().from(expenses).orderBy(desc(expenses.date), desc(expenses.createdAt));

  const worksheetRows = rows.map((expense) => {
    const selectedPeople = new Set(expense.people);

    return {
      Date: expense.date,
      Amount: expense.amount,
      Description: expense.description,
      Noah: selectedPeople.has("Noah") ? "Yes" : "",
      Patrick: selectedPeople.has("Patrick") ? "Yes" : "",
      Camila: selectedPeople.has("Camila") ? "Yes" : "",
      "Jose A": selectedPeople.has("Jose A") ? "Yes" : "",
      "Fam Arias": selectedPeople.has("Fam Arias") ? "Yes" : "",
      Vicky: selectedPeople.has("Vicky") ? "Yes" : "",
      People: PEOPLE.filter((person) => selectedPeople.has(person)).join(", "),
    };
  });

  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(worksheetRows, {
    header: ["Date", "Amount", "Description", ...PEOPLE, "People"],
  });

  XLSX.utils.book_append_sheet(workbook, worksheet, "Expenses");

  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as Buffer;

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="expense-report.xlsx"',
    },
  });
}
