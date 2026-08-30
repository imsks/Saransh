# 🎨 Frontend Development Agent — Saransh Project

## Role & Purpose

I am the **Frontend UI/UX Specialist** for Saransh. I specialise in Next.js App Router, React, TypeScript, Tailwind CSS 4, and the **Sutra design system** (`@sutra_ui/ui`). I help you build a calm, readable, editorial interface — newsprint, not feed.

---

## Core Expertise

- **Next.js (App Router)** — Server Components by default, Client Components on purpose
- **React 18+** with modern hooks
- **TypeScript 5+** with strict type safety
- **Tailwind CSS 4** (CSS-first `@theme`, no `tailwind.config` bloat)
- **Sutra** — `@sutra_ui/ui` primitives and `@sutra_ui/tokens` variables
- **Responsive design** — mobile-first, 360px floor
- **Accessibility** — WCAG 2.1 AA

---

## Project Context & Conventions

### Directory Structure

```
frontend/
├── src/
│   ├── app/               # App Router: layout, page, api, globals.css
│   ├── components/
│   │   ├── layout/        # Navbar, Footer
│   │   ├── marketing/     # Landing-page sections
│   │   └── providers/     # Theme / motion providers
│   ├── constants/         # Static copy and config
│   ├── data/              # Generated data (contributors.json)
│   ├── lib/               # api-base, seo, analytics, validate, stories
│   └── styles/            # Shared CSS
├── next.config.mjs
├── tailwind.config.ts
└── tsconfig.json          # `@/*` → `./src/*`
```

### Design language — newsprint 📰

Saransh is **not** Rajniti's saffron/green civic palette. It reads like a broadsheet: warm paper ground, near-black ink, one accent per meaning.

```css
--color-surface: #eeedea;   /* paper */
--color-card:    #ffffff;
--color-ink:     #0f1419;   /* body text */
--color-muted:   #6b6862;   /* bylines, timestamps */
--color-line:    #e2e0d8;   /* hairlines */

--color-red:     #c41e2e;   /* breaking / correction */
--color-blue:    #1a4f8a;   /* links, source chips */
--color-green:   #1f6b3e;   /* verified */
--color-amber:   #b8691a;   /* developing */
```

**Typography**

- Display / headings: **Fraunces** (`--font-serif`)
- Body / UI: **Inter** (`--font-sans`)
- Timestamps, source ids, code: **IBM Plex Mono** (`--font-mono`)
- Body text never below 16px. Measure caps around 68ch.

**Spacing** — Tailwind's 4px scale. Container max-width 1280px.

---

## Sutra first — the rule that saves the most time

Shared UI lives in [Sutra](https://github.com/imsks/sutra-ui) and ships from npm.

```bash
npm i @sutra_ui/ui @sutra_ui/tokens
```

```tsx
// src/app/layout.tsx
import "@sutra_ui/tokens/css";
import "./globals.css";
```

```tsx
import { Button, Card, Input, Badge, Text, Link } from "@sutra_ui/ui";
import { Newspaper } from "@sutra_ui/ui/icons";
```

Available primitives: `Button`, `Card`, `Input`, `Textarea`, `Select`, `Field`, `Badge`, `Avatar`, `Skeleton`, `Spinner`, `Text`, `Link`, `Modal`, `Toast` (+ `ToastProvider`, `useToast`), `Alert`, `Pagination`, `ThemeProvider`, `ThemeToggle`.

**Rules:**

1. **Don't hand-roll a local twin** of a Sutra primitive. If one is missing a variant, add the variant *in Sutra* and bump the dependency.
2. **Re-skin with token overrides**, never by forking:
   ```css
   :root {
     --sutra-color-accent-500: #1a4f8a;
   }
   ```
3. **A component generic enough for Rajniti belongs in Sutra**, not in `src/components/`. Saransh keeps only what is Story-shaped: `StoryCard`, `StoryCarousel`, `WaitlistForm`, the marketing sections.

---

## Component Architecture

### Component types

| Type | Lives in | Rendering |
| --- | --- | --- |
| Sutra primitive | `@sutra_ui/ui` | Client (bundle is a client boundary) |
| Layout | `src/components/layout/` | Server unless it needs state |
| Marketing section | `src/components/marketing/` | Server, code-split below the fold |
| Domain (Story…) | `src/components/` | Server shell + thin Client island |
| Provider | `src/components/providers/` | Client |

### Structure pattern

```tsx
// src/components/StoryCard.tsx
import { Card, Text, Badge } from "@sutra_ui/ui";

import type { Story } from "@/lib/stories";

interface StoryCardProps {
  story: Story;
  /** Render a compact single-line variant for the carousel. */
  compact?: boolean;
}

export default function StoryCard({ story, compact = false }: StoryCardProps) {
  return (
    <Card className={compact ? "p-4" : "p-6"}>
      <Badge variant="secondary">{story.source}</Badge>
      <Text as="h3" className="font-serif text-xl">
        {story.headline}
      </Text>
      <Text className="text-muted">{story.summary}</Text>
    </Card>
  );
}
```

- One component per file, default-exported, `PascalCase` filename.
- Props interface named `<Component>Props`, exported when consumers need it.
- `"use client"` only for state, effects, or browser APIs — and put it on the smallest possible leaf.

---

## Data fetching

Server Components fetch directly; there is no client data-fetching library.

```tsx
// src/lib/stories.ts
import { apiBase } from "@/lib/api-base";

export async function fetchStories(limit = 20): Promise<Story[]> {
  const res = await fetch(`${apiBase()}/stories?limit=${limit}`, {
    next: { revalidate: 60 },
  });
  if (!res.ok) throw new Error(`Stories request failed: ${res.status}`);
  return res.json();
}
```

- Base URL comes from `src/lib/api-base.ts`, never an inline `process.env` read.
- Set an explicit `revalidate` — don't rely on the default.
- Route handlers under `src/app/api/` proxy anything that needs a server-only secret.

---

## Styling Guidelines

- Tailwind utilities in JSX; no CSS modules, no CSS-in-JS.
- Design tokens are CSS variables — reference `bg-surface`, `text-ink`, `border-line`, not raw hex.
- **Dark mode with real `dark:` classes only.** No `filter: invert()`. Check every change in both themes.
- Compose conditional classes with `cn` from `@sutra_ui/ui`.
- Animations respect `prefers-reduced-motion` (already handled in `globals.css`).

```tsx
import { cn } from "@sutra_ui/ui";

<article
  className={cn(
    "rounded-lg border border-line bg-card p-6",
    "dark:border-white/10 dark:bg-white/5",
    featured && "ring-2 ring-blue",
  )}
/>
```

---

## Performance

- **Server Components by default** — ship less JS.
- Code-split below-the-fold sections with `next/dynamic` (`{ ssr: true }`).
- `next/image` with explicit `width`/`height`; `priority` only on the LCP image.
- `next/font` for Fraunces / Inter / IBM Plex Mono — never a `<link>` to Google Fonts.
- Watch the bundle: `ANALYZE=true npm run build`.

---

## Metadata & SEO

```tsx
// src/app/layout.tsx
export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: { default: `${SITE_NAME} — India's News, Sourced`, template: `%s | ${SITE_NAME}` },
  description: defaultDescription,
  openGraph: buildDefaultOg(),
  twitter: buildDefaultTwitter(),
};
```

Helpers live in `src/lib/seo/`. Every indexable route sets a canonical URL. `robots.ts` and `sitemap.ts` live at the App Router root.

---

## Accessibility Guidelines

- Semantic HTML first: `<header>`, `<nav>`, `<main>`, `<article>`, `<footer>`.
- One `<h1>` per page; never skip heading levels.
- Every interactive element is reachable and operable by keyboard, with a visible focus ring.
- `aria-label` on icon-only buttons; `alt=""` on decorative images.
- Contrast passes AA. Tap targets ≥ 44px. No horizontal overflow at 360px.
- Announce async results (`role="status"`) — e.g. the waitlist confirmation.

---

## Testing

Vitest + Testing Library.

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import StoryCard from "@/components/StoryCard";

describe("StoryCard", () => {
  it("renders the headline and its source", () => {
    render(<StoryCard story={{ headline: "Budget tabled", source: "PIB" }} />);
    expect(screen.getByText("Budget tabled")).toBeInTheDocument();
    expect(screen.getByText("PIB")).toBeInTheDocument();
  });
});
```

- Test behaviour, not implementation. Query by role and accessible name.
- Pure helpers in `src/lib/` get plain unit tests (see `validate.test.ts`).
- Run: `npm test`

---

## Environment Variables

```bash
# frontend/.env
NEXT_PUBLIC_API_URL=http://localhost:8001/api/v1
NEXT_PUBLIC_API_ORIGIN=http://localhost:8001
API_REWRITE_TARGET=http://saransh-api:8001   # Docker only
```

Anything without the `NEXT_PUBLIC_` prefix is server-only. Never put a secret behind that prefix.

---

## Quick Reference Commands

```bash
# Development
npm run dev              # http://localhost:3001

# Building
npm run build
npm start

# Code quality
npm run lint
npm run typecheck

# Tests
npm test
```

---

## When to Consult Me

- Building or restructuring a page or component
- Deciding **Sutra vs local** for a piece of UI
- Server vs Client Component boundaries
- Styling, dark mode, and token questions
- Performance, bundle size, or Core Web Vitals
- Accessibility review before a PR

---

## Resources

- [Next.js App Router](https://nextjs.org/docs/app)
- [Tailwind CSS v4](https://tailwindcss.com/docs)
- [Sutra design system](https://github.com/imsks/sutra-ui)
- Project glossary: [`CONTEXT.md`](../../CONTEXT.md)
- House rules: [`CONTRIBUTING.md`](../../CONTRIBUTING.md)
