# CalorieSnap

CalorieSnap is a mobile-first calorie tracking web app that lets users log meals from food photos. The app uses Gemini vision understanding to estimate calories and macros, while keeping the user in control through review-before-save editing.

## Features

- Name-only authentication (Auth.js v5 Credentials)
- First-time profile onboarding with Mifflin-St Jeor calorie calculation
- AI food photo analysis via Google Gemini
- Optional food hint text for better accuracy
- Editable AI estimates — always review before saving
- Daily tracking dashboard with progress ring and macros
- Weekly and monthly calorie overview charts (Recharts)
- AI weekly feedback on intake patterns
- History view (last 30 days)
- Settings / profile edit page
- Orange-white minimal UI, mobile-first

---

## Local Setup

### 1. Clone and install

```bash
git clone <your-repo>
cd caloriesnap
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` and fill in:

- `DATABASE_URL` — your Supabase pooler Postgres connection string
- `DIRECT_URL` — your Supabase direct Postgres connection string
- `AUTH_SECRET` — run `openssl rand -base64 32` to generate
- `NEXTAUTH_URL` — `http://localhost:3000` for local dev
- `GEMINI_API_KEY` — your Google Gemini API key

### 3. Initialize database schema

```bash
npx prisma db push
```

### 4. Start dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Supabase Setup Notes

- Use your Supabase **direct connection** string for both `DATABASE_URL` and `DIRECT_URL` in this project.
- If your DB password has special characters (`!`, `@`, `#`, etc.), URL-encode them in the connection string.
- If you are running in a serverless platform later, switch `DATABASE_URL` to Supabase pooler (`:6543`) and keep `DIRECT_URL` as direct (`:5432`).

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Database | Supabase Postgres |
| ORM | Prisma v5 |
| Auth | Auth.js v5 (Credentials) |
| AI | Google Gemini 2.0 Flash |
| Charts | Recharts |
| Validation | Zod |

---

## Project Structure

```
src/
  app/
    page.tsx              # Landing page
    login/page.tsx
    signup/page.tsx
    onboarding/page.tsx
    dashboard/page.tsx
    history/page.tsx
    overview/page.tsx
    settings/page.tsx
    api/
      auth/[...nextauth]/ # NextAuth handlers
      auth/signup/        # POST signup
      meals/              # GET/POST/DELETE meals
      meals/analyze/      # POST Gemini analysis
      overview/           # GET weekly/monthly data
      feedback/weekly/    # GET/POST AI feedback
      profile/            # GET/POST/PUT profile
  components/
    ui/                   # Button, Input, Card, etc.
    layout/               # AppShell, MobileBottomNav
    meals/                # MealCard, UploadMealCard, AnalysisReviewCard
    dashboard/            # CalorieProgressCard, FeedbackCard
    charts/               # Weekly, Monthly, MacroDistribution
  lib/
    auth.ts               # NextAuth config
    prisma.ts             # Prisma client singleton
    calories.ts           # Mifflin-St Jeor calculation
    dates.ts              # Date helpers
    rate-limit.ts         # Simple in-memory rate limiter
    gemini/
      analyzeFoodImage.ts # Gemini food vision call
      weeklyFeedback.ts   # Gemini weekly feedback call
      schemas.ts          # Zod schemas for AI responses
      prompts.ts          # Prompt builders
prisma/
  schema.prisma           # Database schema
```

---

## Security Notes

- Gemini API key is never sent to the browser — all AI calls are server-side only
- Name-only login is enabled (no password required)
- Images are not stored by default
- All API routes validate user ownership before returning data
- File upload is limited by size (`MAX_IMAGE_UPLOAD_MB`) and MIME type
- AI analysis endpoint is rate-limited (10 requests/minute per user)
- All inputs validated with Zod
