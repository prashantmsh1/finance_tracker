# Expense Tracker Monorepo

A comprehensive Full-Stack Personal Finance Tracker built with modern tools to help users manage their income, expenses, and categories with actionable dashboards.

This project is a monorepo managed by **Turborepo** and powered by **pnpm workspaces**.

## Features

- **Transaction Management**: Add, edit, delete, search, filter, and paginate through income and expenses.
- **Category Management**: Create custom categories and seed defaults natively.
- **Analytics Dashboard**: View aggregate balances, category-wise breakdowns (Pie charts), and 12-month trailing trends (Line/Bar charts).
- **Role-Based Access Control**: Differentiates between `admin`, regular `user`, and `read-only` modes.
- **Strong Typing**: Full-stack type safety with TypeScript, Drizzle ORM, and Zod validation.
- **Security First**: Rate limiting, Helmet helmet integration (XSS/Clickjacking protection), and Drizzle's baked-in SQL Injection immunity.

## Tech Stack

- **Monorepo**: [Turborepo](https://turbo.build/) + pnpm
- **Frontend** (`apps/web`): [Next.js](https://nextjs.org/) (App Router), React 19, Tailwind CSS, shadcn/ui, TanStack Query, Recharts, Zustand.
- **Backend API** (`apps/api`): Node.js, [Express](https://expressjs.com/), Zod (Validation), Swagger (API Docs).
- **Database** (`packages/db`): [Drizzle ORM](https://orm.drizzle.team/).
- **Auth**: JWT, bcryptjs.

---

## Workspace Structure

```
.
├── apps
│   ├── api               # Express.js REST API
│   └── web               # Next.js Frontend Application
├── packages
│   ├── config            # Shared TypeScript configurations
│   └── db                # Drizzle ORM schemas, edge DB client, and migrations
├── package.json          # Root dependencies and Turbo scripts
└── turbo.json            # Turborepo pipeline configuration
```

---

## Local Development Setup

Follow these instructions to get the project running locally.

### Prerequisites
- Node.js `^20.0.0`
- [pnpm](https://pnpm.io/installation) `^9.0.0`
- A PostgreSQL database (e.g. Neon, Supabase, or local Docker container)

### 1. Clone & Install dependencies
```bash
git clone <your-repo-url>
cd expense_tracker
pnpm install
```

### 2. Environment Variables
You need to configure your environment variables for both the backend and frontend.

Create a `.env` file at the root of the project:
```env
# Database configuration
DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require"

# API & Auth
PORT=8000
JWT_SECRET="your-super-secret-jwt-key"
NODE_ENV="development"
```

### 3. Database Setup (Drizzle ORM)
Run the following commands from the root of the monorepo to push your schema definitions to the active database:

Generate migration files based on schemas:
```bash
pnpm run db:generate
```

Push the schemas directly to the remote/local database:
```bash
pnpm run db:push
```

*(Optional)* Start the Drizzle local studio to view your database UI:
```bash
pnpm run db:dev
```

### 4. Running the Application
Using Turborepo, you can easily spin up both the API and Web apps concurrently from the root directory:

```bash
pnpm run dev
```

- **Frontend (Next.js)**: Runs on `http://localhost:3000`
- **Backend API (Express)**: Runs on `http://localhost:8000`

### 5. API Documentation
Once the local dev server is running, the backend Swagger documentation is natively hosted. You can view it by navigating to:
```
http://localhost:8000/api-docs
```

## Useful Commands

From the root directory, you can run:

- `pnpm run build`: Build all workspaces for production
- `pnpm run lint`: Lint all applications
- `pnpm --filter @expense-tracker/api run dev`: Run ONLY the Express API
- `pnpm --filter @expense-tracker/web run dev`: Run ONLY the Next.js Web app
