# ShareSaathi — Agent Context File

> This file is intended for AI agents (Claude, Copilot, etc.) to quickly understand the project architecture, conventions, and domain before making changes.

---

## Product Overview

**ShareSaathi** is a B2B2C fintech platform for buying and selling unlisted/pre-IPO shares of Indian companies (e.g., Swiggy, NSDL, HDB Financial). It serves as a secondary marketplace connecting retail investors, ESOP holders, partner agents/brokers, relationship managers, and admins.

**Core value proposition:** Investors get early access to pre-IPO equity. Partner agents earn margin commissions. Admins manage the entire deal lifecycle.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, TypeScript) |
| Language | TypeScript 5, React 19 |
| Styling | TailwindCSS v4 (PostCSS), Framer Motion |
| UI Components | Radix UI, Lucide React, Heroicons |
| State Management | Zustand 5 (with localStorage persistence) |
| Charts | Recharts |
| Database | PostgreSQL via Supabase |
| Auth | Clerk (primary) + Supabase Auth (session) |
| AI / LLM | Groq API — Llama 3.3 70B (streaming chat + blog generation) |
| AI SDK | Vercel AI SDK (`@ai-sdk/groq`, `@ai-sdk/react`) |
| Markdown | react-markdown + remark-gfm |
| Deployment | Vercel-ready (no explicit CI/CD configured) |

---

## User Roles

The platform is fully multi-role. The `role` field on the `profiles` table determines routing and access:

| Role | Dashboard Route | Purpose |
|------|----------------|---------|
| `customer` | `/dashboard/customer` | Browse, buy/sell shares, view portfolio |
| `agent` | `/dashboard/agent` | Marketplace access, KYC, custom checkout links, commissions |
| `rm` | `/dashboard/sales` | Relationship manager — manage leads, client orders |
| `staffmanager` | `/dashboard/manager` | Sales manager — team analytics, RM oversight |
| `admin` | `/dashboard/admin` | Full control — companies, users, orders, blogs, KYC approvals |

Row-Level Security (RLS) in Supabase enforces data access per role. Never bypass RLS by using the service role key on the client side.

---

## Directory Structure

```
src/
├── app/
│   ├── api/
│   │   ├── chat/route.ts                  # ShareX AI chat (Groq streaming)
│   │   ├── admin/generate-blog/route.ts   # AI blog generation (Groq JSON)
│   │   └── checkout/process/route.ts      # Agent order payment + commission calc
│   ├── dashboard/
│   │   ├── customer/                      # Customer portfolio & orders
│   │   ├── admin/                         # Admin panel pages
│   │   ├── agent/                         # Agent marketplace, KYC, earnings
│   │   ├── manager/                       # Sales manager
│   │   └── sales/                         # RM dashboard
│   ├── shares/                            # Public company listings
│   ├── blogs/                             # Blog listing & detail pages
│   ├── checkout/[token]/                  # Agent-generated checkout page
│   ├── kyc/[token]/                       # KYC verification flow
│   └── auth/callback/                     # Clerk OAuth callback
├── components/
│   ├── admin/                             # Admin-specific components
│   ├── agent/                             # Agent portal components
│   ├── chat/                              # ShareX AI chatbot, BlogAssistant
│   ├── sections/                          # Landing page sections
│   └── ui/                               # Shared UI primitives (button, card, etc.)
├── lib/
│   ├── auth-context.tsx                   # Auth provider (Clerk + Supabase)
│   ├── store.ts                           # Zustand global store
│   ├── mock-data.ts                       # Dev/simulation fallback data
│   └── supabase.ts                        # Supabase client (browser)
└── utils/
    └── supabase/
        ├── server.ts                      # Server-side Supabase client (SSR)
        └── client.ts                      # Browser-side Supabase client
migrations/                               # SQL migration files (Supabase)
```

---

## Database Schema

### Core Tables

| Table | Purpose |
|-------|---------|
| `companies` | Pre-IPO company listings (name, sector, valuation, bid/ask price, `ai_context`) |
| `profiles` | Extended user profiles (role, name, email, `assigned_rm_id`) — linked to `auth.users` |
| `orders` | Buy/sell transactions with full lifecycle status |
| `leads` | Sales pipeline leads for RMs |
| `demat_requests` | Physical-to-digital share conversion requests |
| `teams` | RM team groupings |
| `team_members` | Junction table for RM↔team membership |
| `rm_targets` | Monthly sales targets for RMs |
| `blogs` | AI-generated blog articles (status: `draft`/`published`) |
| `historical_prices` | Price history per company for charts |

### Agent Tables

| Table | Purpose |
|-------|---------|
| `agent_profiles` | KYC data (PAN, Aadhar, bank details JSONB, CMR), `kyc_status`, total/withdrawn earnings |
| `agent_settings` | Commission rules — hierarchical: agent+company > agent global > company global > platform default |
| `agent_client_orders` | Custom checkout orders created by agents (`link_token`, Razorpay IDs, `platform_cut`, `agent_earnings`) |

### Order Status Lifecycle

```
requested → under_process → mail_sent → in_holding → settled
```

### Agent Commission Formula

```
agent_cost      = base_price + fixed_markup           (default fixed_markup = ₹5)
gross_margin    = selling_price - agent_cost
variable_cut    = max(0, (gross_margin - threshold) * margin_pct)
                                                       (default threshold = ₹10, pct = 20%)
agent_earnings  = gross_margin - variable_cut
```

Rules are resolved hierarchically — check `agent_settings` table for per-agent or per-company overrides before falling back to platform defaults.

---

## Authentication

- **Clerk** handles OAuth login/signup and issues sessions.
- **Supabase Auth** is synced for RLS policy enforcement.
- The `auth-context.tsx` provider bridges both systems and exposes `user`, `profile`, and `supabase` to the app.
- **Simulator mode:** When `user.id` matches mock IDs (`agt_1`, `cust_1`, etc.), the app uses `mock-data.ts` instead of hitting Supabase. This is a dev-only fallback.

---

## AI Integration

### ShareX Chat (`/api/chat`)
- Uses Groq `llama-3.3-70b-versatile` with Vercel AI SDK streaming.
- System prompt is dynamically built from: user profile + portfolio summary + selected company context + optional blog context.
- The `ai_context` column on `companies` feeds domain-specific intelligence.

### Blog Generation (`/api/admin/generate-blog`)
- Same Groq model, non-streaming.
- Returns structured JSON: `{ title, slug, excerpt, content }`.
- Content is Markdown rendered via `react-markdown`.

---

## State Management

**Zustand store** (`src/lib/store.ts`) caches:
- `orders`, `companies`, `users`, `leads`, `blogs`, `historicalPrices`
- Persisted in `localStorage` for fast reload.

Always prefer reading from Supabase for fresh data. The store is a client-side cache layer, not the source of truth.

---

## Key Conventions

1. **App Router:** All pages use Next.js 15+ App Router. No Pages Router usage.
2. **Server vs Client:** API routes and data fetching use `utils/supabase/server.ts`. Components use `utils/supabase/client.ts` or the Zustand store.
3. **Types:** Types are inferred from Supabase-generated TypeScript or defined locally. No global `types.ts` — types live near usage.
4. **Styling:** Tailwind utility classes only. No inline styles. Custom design tokens are defined in `globals.css` (CSS variables: `--primary`, `--accent`, `--surface`, etc.).
5. **RLS:** All Supabase queries from the client go through the anon key. Never use the service role key client-side.
6. **Env vars:** Public vars use `NEXT_PUBLIC_` prefix. `GROQ_API_KEY` and `CLERK_SECRET_KEY` are server-only.

---

## Environment Variables

| Variable | Usage |
|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client-safe Supabase key |
| `GROQ_API_KEY` | Server-only — Groq LLM API (chat + blog gen) |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk client-side key |
| `CLERK_SECRET_KEY` | Server-only — Clerk auth verification |

---

## Common Gotchas

- **Agent settings are hierarchical** — always resolve in order: (agent_id + company_id) → (agent_id only) → (company_id only) → platform defaults. Don't assume a single row exists.
- **Demat requests** reference company name as a string, not a foreign key — handle gracefully if company lookup fails.
- **Blogs** use a `slug` for URL routing, not `id`. Slugs are generated by the AI and must be URL-safe.
- **Zustand store** may return stale data if the user has been active for a while — always refresh from Supabase on critical operations (orders, KYC status).
- **Mock data** is keyed on specific IDs (`agt_1`, `cust_1`, `rm_1`) — if you see these IDs in the code, it's simulator mode, not a real user.
- The `profiles` table uses the same `id` as `auth.users` (UUID). Agent and RM profiles are extensions of this base profile.

---

## Running Locally

```bash
npm install
npm run dev       # Start dev server at localhost:3000
npm run build     # Production build
npm run lint      # ESLint
```

Migrations are applied via Supabase MCP or the Supabase dashboard. Migration files live in `migrations/` and are numbered sequentially (`0001_`, `0002_`, ...).
