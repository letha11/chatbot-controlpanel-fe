Phase 5 - Frontend (Admin Panel)

- Initialized Next.js (app router) TypeScript project with Tailwind in `admin/` using pnpm.
- Integrated Shadcn UI; added core components (`button`, `input`, `label`, `form`, `card`, `badge`, `dropdown-menu`, `avatar`, `sonner`, `separator`, `sheet`, `navigation-menu`, `tooltip`, `skeleton`, `sidebar`).
- Applied custom theme colors per PRD in `admin/src/app/globals.css`:
  - Primary `#ED1E28`, Secondary `#B6252A`, Neutral Dark `#55565B`, Neutral Light `#959597` and matching dark mode.
- Implemented core layout in `admin/src/app/layout.tsx`:
  - Sidebar with navigation links: `/dashboard`, `/divisions`, `/documents`, `/chat`.
  - Header with sidebar trigger and app title.
  - Logout button wired to API route to clear session and redirect to `/login`.
- Added `/login` page with validation (React Hook Form + Zod) at `admin/src/app/(auth)/login/page.tsx` calling `POST /api/v1/auth/login` and storing token in `auth_token` cookie.
- Added middleware `admin/src/middleware.ts` to guard routes and redirect unauthenticated users to `/login`.
- Added minimal `/dashboard` placeholder at `admin/src/app/(app)/dashboard/page.tsx` to satisfy navigation.

Notes:
- Uses cookie `auth_token` (dev). Can be moved to HttpOnly cookie via server action when backend wiring is finalized.
- Next steps: implement divisions/documents pages per PRD, connect to backend endpoints, and add notifications.

