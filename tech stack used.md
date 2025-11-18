### Tech stack overview

  

- **Framework & language**

- **Next.js (App Router) + React + TypeScript**

- **Node.js** runtime for server routes and middleware

  

- **Styling & UI**

- **Tailwind CSS** (with PostCSS config)

- Custom components under `src/components/**`

  

- **Data & ORM**

- **Prisma** ORM (`prisma/schema.prisma`, generated client in `src/generated/prisma`)

- **SQLite** for local storage (`kananvisa.db` present), with seed/migration helpers in `src/lib/**`

  

- **API & backend**

- Next.js **API routes** under `src/app/api/**` (auth, user, payment, email debug, etc.)

- **EmailJS** integration (`src/config/email.ts`, `src/lib/emailjs.ts`)

- **Razorpay** integration (`src/services/razorpayService.ts`, `src/config/payment.ts`)

  

- **Auth**

- Custom email/password flows and reset endpoints (`src/app/api/auth/**`)

- Client hook `src/hooks/useAuth.ts` and middleware support (`middleware.ts`)

  

- **State & utilities**

- Lightweight client stores in `src/stores/**`

- Search utilities and components (`src/utils/searchUtils.ts`, `src/components/search/FuzzySearch.tsx`)

  

- **Testing**

- **Playwright** for E2E tests (`tests/e2e/**`, `playwright.config.ts`)

  

- **Tooling & config**

- **ESLint**, **tsconfig**, **tailwind.config.js**, **postcss.config.mjs**, `next.config.ts`

- Project scripts in `package.json` and lockfile tracked

  

- **Assets**

- Static assets in `public/**` (logos, hero images, svgs)

  

If you want, I can [1] list key npm scripts, [2] enumerate important API routes, or [3] map files to features.