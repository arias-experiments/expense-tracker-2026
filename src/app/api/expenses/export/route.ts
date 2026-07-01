import { desc } from "drizzle-orm";
import { NextResponse } from "next/server";
import * as XLSX from "xlsx";

import { getDb } from "@/db";
import { expenses } from "@/db/schema";
import { PEOPLE, Person } from "@/lib/people";

const HEADERS = ["Date", "Amount", "Description", ...PEOPLE, "People"];
const CURRENCY_FORMAT = '"$"#,##0.00';

function isPerson(value: string): value is Person {
  return PEOPLE.includes(value as Person);
}

function formatAmountCells(worksheet: XLSX.WorkSheet, rowCount: number) {
  for (let rowIndex = 1; rowIndex < rowCount; rowIndex += 1) {
    const cellAddress = XLSX.utils.encode_cell({ r: rowIndex, c: 1 });
    const cell = worksheet[cellAddress];

    if (cell && typeof cell.v === "number") {
      cell.z = CURRENCY_FORMAT;
    }
  }
}

export async function GET() {
  const db = getDb();
  const rows = await db.select().from(expenses).orderBy(desc(expenses.date), desc(expenses.createdAt));

  const worksheetRows = rows.map((expense) => {
    const selectedPeople = new Set<Person>(expense.people.filter(isPerson));

    return [
      expense.date,
      Number(expense.amount),
      expense.description,
      ...PEOPLE.map((person) => (selectedPeople.has(person) ? "Yes" : "")),
      PEOPLE.filter((person) => selectedPeople.has(person)).join(", "),
    ];
  });

  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.aoa_to_sheet([HEADERS, ...worksheetRows]);

  worksheet["!cols"] = [
    { wch: 12 },
    { wch: 12 },
    { wch: 30 },
    ...PEOPLE.map(() => ({ wch: 12 })),
    { wch: 48 },
  ];

  formatAmountCells(worksheet, worksheetRows.length + 1);
  XLSX.utils.book_append_sheet(workbook, worksheet, "Expenses");

  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as Buffer;

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="expense-report.xlsx"',
    },
  });
}
