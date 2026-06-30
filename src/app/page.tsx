"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

import { PEOPLE, Person } from "@/lib/people";

type Expense = {
  id: number;
  date: string;
  amount: string;
  description: string;
  people: Person[];
  createdAt: string;
};

const emptyForm = {
  date: "",
  amount: "",
  description: "",
  people: [] as Person[],
};

export default function Home() {
  const [form, setForm] = useState(emptyForm);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [showExpenses, setShowExpenses] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingExpenses, setIsLoadingExpenses] = useState(false);

  const selectedPeople = useMemo(() => new Set(form.people), [form.people]);

  async function loadExpenses() {
    setIsLoadingExpenses(true);
    setError("");

    try {
      const response = await fetch("/api/expenses", { cache: "no-store" });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Could not load expenses.");
      }

      setExpenses(data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load expenses.");
    } finally {
      setIsLoadingExpenses(false);
    }
  }

  useEffect(() => {
    if (showExpenses) {
      void loadExpenses();
    }
  }, [showExpenses]);

  function clearForm() {
    setForm(emptyForm);
    setError("");
  }

  function togglePerson(person: Person) {
    setMessage("");
    setForm((current) => {
      const people = current.people.includes(person)
        ? current.people.filter((selectedPerson) => selectedPerson !== person)
        : [...current.people, person];

      return { ...current, people };
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");

    if (!form.date) {
      setError("Date is required.");
      return;
    }

    if (!Number.isFinite(Number(form.amount)) || Number(form.amount) <= 0) {
      setError("Amount must be greater than 0.");
      return;
    }

    if (!form.description.trim()) {
      setError("Description is required.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: form.date,
          amount: form.amount,
          description: form.description,
          people: form.people,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Could not save the expense.");
      }

      setForm(emptyForm);
      setMessage("Expense saved.");

      if (showExpenses) {
        await loadExpenses();
      }
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not save the expense.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleViewAll() {
    setShowExpenses(true);
    await loadExpenses();
  }

  function handleExport() {
    window.location.href = "/api/expenses/export";
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-6 px-4 py-8 sm:px-6">
      <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
        <h1 className="text-2xl font-semibold tracking-normal text-stone-950">Expense Report</h1>

        <form className="mt-5 grid gap-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-[160px_160px_1fr]">
            <label className="grid gap-1 text-sm font-medium text-stone-700">
              Date
              <input
                className="h-10 rounded-md border border-stone-300 px-3 text-stone-950 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                type="date"
                value={form.date}
                onChange={(event) => setForm({ ...form, date: event.target.value })}
              />
            </label>

            <label className="grid gap-1 text-sm font-medium text-stone-700">
              Amount
              <input
                className="h-10 rounded-md border border-stone-300 px-3 text-stone-950 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                min="0"
                step="0.01"
                type="number"
                value={form.amount}
                onChange={(event) => setForm({ ...form, amount: event.target.value })}
              />
            </label>

            <label className="grid gap-1 text-sm font-medium text-stone-700">
              Description
              <input
                className="h-10 rounded-md border border-stone-300 px-3 text-stone-950 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                type="text"
                value={form.description}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
              />
            </label>
          </div>

          <div className="grid gap-3">
            <div className="flex flex-wrap gap-2">
              <button
                className="h-9 rounded-md border border-stone-300 px-3 text-sm font-medium text-stone-800 hover:bg-stone-100"
                type="button"
                onClick={() => setForm({ ...form, people: [...PEOPLE] })}
              >
                Select All
              </button>
              <button
                className="h-9 rounded-md border border-stone-300 px-3 text-sm font-medium text-stone-800 hover:bg-stone-100"
                type="button"
                onClick={() => setForm({ ...form, people: [] })}
              >
                Select None
              </button>
            </div>

            <div className="grid gap-2 sm:grid-cols-3">
              {PEOPLE.map((person) => (
                <label
                  className="flex h-10 items-center gap-2 rounded-md border border-stone-200 px-3 text-sm font-medium text-stone-800"
                  key={person}
                >
                  <input
                    className="h-4 w-4 accent-emerald-700"
                    checked={selectedPeople.has(person)}
                    type="checkbox"
                    onChange={() => togglePerson(person)}
                  />
                  {person}
                </label>
              ))}
            </div>
          </div>

          {(message || error) && (
            <p
              className={`rounded-md px-3 py-2 text-sm ${
                error ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-800"
              }`}
            >
              {error || message}
            </p>
          )}

          <div className="flex flex-wrap gap-2 pt-1">
            <button
              className="h-10 rounded-md bg-emerald-700 px-4 text-sm font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-stone-400"
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting ? "Submitting..." : "Submit"}
            </button>
            <button
              className="h-10 rounded-md border border-stone-300 px-4 text-sm font-semibold text-stone-800 hover:bg-stone-100"
              type="button"
              onClick={clearForm}
            >
              Cancel
            </button>
            <button
              className="h-10 rounded-md border border-stone-300 px-4 text-sm font-semibold text-stone-800 hover:bg-stone-100"
              type="button"
              onClick={handleViewAll}
            >
              View All
            </button>
            <button
              className="h-10 rounded-md border border-stone-300 px-4 text-sm font-semibold text-stone-800 hover:bg-stone-100"
              type="button"
              onClick={handleExport}
            >
              Export
            </button>
          </div>
        </form>
      </section>

      {showExpenses && (
        <section className="overflow-hidden rounded-lg border border-stone-200 bg-white shadow-sm">
          <div className="border-b border-stone-200 px-5 py-3">
            <h2 className="text-base font-semibold text-stone-950">All Expenses</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] border-collapse text-left text-sm">
              <thead className="bg-stone-100 text-xs uppercase text-stone-600">
                <tr>
                  <th className="px-5 py-3 font-semibold">Date</th>
                  <th className="px-5 py-3 font-semibold">Amount</th>
                  <th className="px-5 py-3 font-semibold">Description</th>
                  <th className="px-5 py-3 font-semibold">People</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {isLoadingExpenses ? (
                  <tr>
                    <td className="px-5 py-4 text-stone-600" colSpan={4}>
                      Loading expenses...
                    </td>
                  </tr>
                ) : expenses.length === 0 ? (
                  <tr>
                    <td className="px-5 py-4 text-stone-600" colSpan={4}>
                      No expenses yet.
                    </td>
                  </tr>
                ) : (
                  expenses.map((expense) => (
                    <tr key={expense.id}>
                      <td className="whitespace-nowrap px-5 py-3 text-stone-900">{expense.date}</td>
                      <td className="whitespace-nowrap px-5 py-3 text-stone-900">
                        ${Number(expense.amount).toFixed(2)}
                      </td>
                      <td className="px-5 py-3 text-stone-900">{expense.description}</td>
                      <td className="px-5 py-3 text-stone-900">{expense.people.join(", ")}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </main>
  );
}
