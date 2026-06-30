# Expense Tracker 2026

A very small single-user expense reporting app built with Next.js App Router, TypeScript, Tailwind CSS, Drizzle ORM, and PostgreSQL.

## Local Setup

Install dependencies:

```bash
npm install
```

Create a `.env.local` file with a PostgreSQL connection string:

```bash
DATABASE_URL="postgres://USER:PASSWORD@HOST:PORT/DATABASE"
```

For local development, this can point at any local PostgreSQL database. In production, set `DATABASE_URL` in Vercel using a Neon, Vercel Postgres, or other PostgreSQL connection string.

## Drizzle Migrations

Generate SQL migrations from the schema:

```bash
npm run db:generate
```

Apply migrations to the database configured by `DATABASE_URL`:

```bash
npm run db:migrate
```

The Drizzle schema lives in `src/db/schema.ts`, and configuration lives in `drizzle.config.ts`.

## Run Locally

Start the development server:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Deploy To Vercel

1. Push this repository to GitHub.
2. Import the project in Vercel.
3. Add the production `DATABASE_URL` environment variable in the Vercel project settings.
4. Run `npm run db:migrate` against the production database before using the app.
5. Deploy with Vercel's default Next.js settings.
