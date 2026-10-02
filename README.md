# Maa Ad Agency — Website

The official marketing website for **Maa Ad Agency**, a 360° advertising and
branding agency based in Raipur, Chhattisgarh. Built with Next.js (App
Router), Tailwind CSS, and Motion (Framer Motion).

## Tech Stack

- [Next.js 16](https://nextjs.org) — App Router, React Server Components
- [React 19](https://react.dev)
- [Tailwind CSS 4](https://tailwindcss.com)
- [Motion](https://motion.dev) for animation
- [Lucide React](https://lucide.dev) for icons

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the site.

## Deploy on Vercel

Create a separate Vercel project with this folder as its **Root Directory**.
The dashboard calls same-origin `/api/*` routes, which are proxied by
`src/app/api/[...path]/route.ts` to the backend.

Set these environment variables in the frontend Vercel project:

```text
NEXT_PUBLIC_API_URL=/api
BACKEND_API_URL=https://<server-project>.vercel.app/api
```

Set `CLIENT_ORIGIN` in the backend project to the deployed frontend URL. Keep
the backend MongoDB and JWT secrets in the backend project only.

## Scripts

- `npm run dev` — start the development server
- `npm run build` — production build
- `npm run start` — run the production build
- `npm run lint` — lint the codebase

## Project Structure

```
src/
  app/            App Router pages, layout, metadata, icons
  components/
    layout/       Navbar, MobileMenu, Footer, floating actions, preloader
    sections/     Homepage sections (Hero, Services, Portfolio, etc.)
    ui/           Small reusable building blocks (Reveal, Container, ...)
  data/           Site content (services, portfolio, testimonials, ...)
  lib/            Shared utilities and animation helpers
public/
  images/         Logo, client logos, and project photography
```

Real photography used throughout the site (hero, services, portfolio) is
sourced from the agency's own brand profile and campaign documentation.
