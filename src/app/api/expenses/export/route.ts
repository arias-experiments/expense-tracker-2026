import { desc } from "drizzle-orm";
import { NextResponse } from "next/server";
import * as XLSX from "xlsx";

import { getDb } from "@/db";
import { expenses } from "@/db/schema";
import { PEOPLE, Person } from "@/lib/people";

const EXPORT_PEOPLE = ["Patrick", "Noah", "Jose A", "Camila", "Fam Arias", "Vicky"] as const satisfies readonly Person[];
const HEADERS = ["Date", "Amount", "Description", ...EXPORT_PEOPLE, "People"] as const;
const CURRENCY_FORMAT = '"$"#,##0.00';

function amountToCents(amount: string) {
  return Math.round(Number(amount) * 100);
}

function centsToDollars(cents: number) {
  return cents / 100;
}

function isPerson(value: string): value is Person {
  return PEOPLE.includes(value as Person);
}

function splitAmount(amountCents: number, selectedPeople: Set<Person>) {
  const includedPeople = EXPORT_PEOPLE.filter((person) => selectedPeople.has(person));

  if (includedPeople.length === 0) {
    return new Map<Person, number>();
  }

  const baseShare = Math.floor(amountCents / includedPeople.length);
  let remainder = amountCents % includedPeople.length;

  return new Map(
    includedPeople.map((person) => {
      const share = baseShare + (remainder > 0 ? 1 : 0);
      remainder -= 1;

      return [person, share];
    }),
  );
}

function formatCurrencyCells(worksheet: XLSX.WorkSheet, rowCount: number) {
  const currencyColumnIndexes = [1, ...EXPORT_PEOPLE.map((_, index) => index + 3)];

  for (let rowIndex = 1; rowIndex < rowCount; rowIndex += 1) {
    for (const columnIndex of currencyColumnIndexes) {
      const cellAddress = XLSX.utils.encode_cell({ r: rowIndex, c: columnIndex });
      const cell = worksheet[cellAddress];

      if (cell && typeof cell.v === "number") {
        cell.z = CURRENCY_FORMAT;
      }
    }
  }
}

export async function GET() {
  const db = getDb();
  const rows = await db.select().from(expenses).orderBy(desc(expenses.date), desc(expenses.createdAt));
  const totals = new Map<Person, number>(EXPORT_PEOPLE.map((person) => [person, 0]));
  let totalAmountCents = 0;

  const worksheetRows = rows.map((expense) => {
    const amountCents = amountToCents(expense.amount);
    const selectedPeople = new Set<Person>(expense.people.filter(isPerson));
    const shares = splitAmount(amountCents, selectedPeople);

    totalAmountCents += amountCents;

    for (const [person, share] of shares) {
      totals.set(person, (totals.get(person) ?? 0) + share);
    }

    return [
      expense.date,
      centsToDollars(amountCents),
      expense.description,
      ...EXPORT_PEOPLE.map((person) => {
        const share = shares.get(person);
        return share === undefined ? "" : centsToDollars(share);
      }),
      PEOPLE.filter((person) => selectedPeople.has(person)).join(", "),
    ];
  });

  const totalsRow = [
    "Totals",
    centsToDollars(totalAmountCents),
    "",
    ...EXPORT_PEOPLE.map((person) => centsToDollars(totals.get(person) ?? 0)),
    "",
  ];

  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.aoa_to_sheet([[...HEADERS], ...worksheetRows, totalsRow]);

  worksheet["!cols"] = [
    { wch: 12 },
    { wch: 12 },
    { wch: 30 },
    ...EXPORT_PEOPLE.map(() => ({ wch: 12 })),
    { wch: 36 },
  ];

  formatCurrencyCells(worksheet, worksheetRows.length + 2);
  XLSX.utils.book_append_sheet(workbook, worksheet, "Expenses");

  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as Buffer;

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="expense-report.xlsx"',
    },
  });
}
