# Portfolio

My personal portfolio website, built with Next.js and Tailwind CSS. It showcases
my work, background, and ways to get in touch.

## Tech Stack

- **Next.js 15** (App Router, Turbopack)
- **React 18** + **TypeScript**
- **Tailwind CSS** with Radix UI primitives
- **Genkit** (Google AI) for AI-powered features
- Deployed on Vercel

## Getting Started

```bash
npm install
npm run dev
```

The dev server runs on [http://localhost:9002](http://localhost:9002).

### Scripts

| Command             | Description                          |
| ------------------- | ------------------------------------ |
| `npm run dev`       | Start the dev server (Turbopack)     |
| `npm run build`     | Build for production                 |
| `npm run start`     | Run the production build             |
| `npm run lint`      | Lint the codebase                    |
| `npm run typecheck` | Type-check with the TypeScript compiler |

## Projects

Featured work shown on the site:

- **EuroParcs Rental** — Holiday homes platform with advanced availability
  management and a Contentful CMS integration.
  _Nuxt.js · Vue.js · TypeScript · TailwindCSS · GraphQL · Contentful._
- **Word Twist** — A word-unscrambling game scored on speed.
  _Next.js · Firebase Studio · TypeScript · TailwindCSS._
  [Live](https://word-twist.sererejegede.dev) ·
  [GitHub](https://github.com/sererejegede/word-twist)
- **Wovar** — A high-traffic e-commerce platform for hardware and construction
  supplies. _React · Remix · TypeScript · Prismic CMS._
- **Tailor's Ledger** — An offline-first mobile app that replaces the paper
  measurement card, letting tailors capture client measurements as fast as pen
  and paper, backed by a self-built sync API. _React Native · Expo · TypeScript ·
  WatermelonDB · Hono · Supabase · Postgres._
  [Live](https://tailors-ledger.vercel.app)

## Project Structure

```
src/
  app/          Next.js App Router pages and layout
  components/   UI components and page sections
  assets/       Images and logos
  ai/           Genkit AI flows
```
