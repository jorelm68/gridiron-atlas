# Gridiron Atlas

A visual, beginner-friendly way to learn every NFL team, player, stadium, game, and stat — with a 3D map,
explained statistics, a built-in guided tour, and interactive quizzes. Scope and decisions: [docs/SCOPE.md](docs/SCOPE.md).

## Setup

**Requirements:** Node.js 24 LTS (20.19+ works), Docker Desktop (only for local Supabase), a free
[Supabase](https://supabase.com) account.

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create a Supabase project (free tier). Save the database password somewhere safe.
3. Copy `.env.example` to `.env.local` and fill in the project URL, publishable key, and secret key
   (project dashboard → **Connect**, or **Project Settings → API Keys**).
4. Log the Supabase CLI in and link this repo to the project (opens a browser; `link` may ask for the database password):
   ```bash
   npx supabase login
   ```
   ```bash
   npx supabase link --project-ref <your-project-ref>
   ```
   The project ref is the subdomain of your project URL (`https://<project-ref>.supabase.co`).
5. Start the app and open http://localhost:3000 — the setup-status page should show every check as **Ready**:
   ```bash
   npm run dev
   ```

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run lint` / `npm run typecheck` | ESLint / TypeScript checks |
| `npm run db:new -- <name>` | Create a new migration file |
| `npm run db:push` | Apply migrations to the linked Supabase project |
| `npm run db:types` | Regenerate TypeScript types from the database |
| `npm run db:start` / `db:stop` | Run Supabase locally in Docker |
