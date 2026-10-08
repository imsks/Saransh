# Align the landing page with design system v1.2

Base: `development`. Branch: `fix/design-system-v1.2-alignment`.

## Summary

- Brings the landing page, waitlist form, thank-you overlay and theme tokens in line with design system v1.2.
- Adds the v1.2 app-only tokens and topic accents to `globals.css` and the Tailwind theme.
- Moves the story carousel onto the v1.2 app story card, with Back / Next.
- Fixes a hydration error from the theme toggle that affected dark-theme readers on the live site.

## Changelog

**Theme tokens**
- `--background` / `--foreground` are aliases of `--paper` / `--ink`, declared once in `:root`. Dark `<body>` is now `#191816`, not `#111417`.
- Added light `--amber-tint`, the v1.2 app tokens, the five topic accents (with washes), and `--print-shadow` for the web card's offset shadow. All mapped into Tailwind.
- The heading font rule moved into `@layer base`; unlayered, it overrode `font-mono` on the pillar headings.
- No colour literals remain in components. The card shadow, tick, spinner and credit chip use tokens.

**Typography, spacing, radius**
- Hero headline `clamp(34px, 4vw, 52px)`, hero body 17px / 1.68, bottom CTA headline `clamp(26px, 3.5vw, 42px)`, nav logo 18px, section body 15.5px / 1.72, kickers 10.5px.
- Section padding 80px; two-column gap 64px.
- `rounded-sm` (4px in Tailwind v4) replaced with 2px on web elements.

**Buttons and form**
- One shared button spec (`components/ui/buttonClasses.ts`): paper text on ink, 12px / 0.10em, `12px 20px`, 150ms transition, visible focus outline. Secondary button outlined in ink.
- Waitlist form: per-field validation errors (red border, `aria-invalid`, message under the field, focus moves to the first invalid field). Ink labels, 13.5px inputs, muted placeholders, visible focus.

**Story carousel**
- Uses the v1.2 app story card: 24px radius, `--edge` border, image or topic wash with credit chip, 22px / 800 headline, `--body` copy, time line in the topic accent, source line with a green tick for official sources, outlined "Read story" button.
- A position counter and Back / Next circles replace the dots. No auto-advance; swipe threshold 80px. The card fills its column and the three points are centred against it.
- "Read story" is always shown: a link when the story has an article, a non-interactive label on the sample stories.
- `Story.imageVariant` is now `Story.topic`. Inter gains weights 700 and 800.

**Rajniti chip**
- "Linked" badge at full opacity with a 3px radius; representative name in bold sans; link tracking 0.05em.

**Accessibility and motion**
- Smooth scrolling respects `prefers-reduced-motion` in CSS and in the bottom CTA.
- 44px hit areas on the theme toggle, GitHub link and form controls.
- Thank-you overlay moves focus to its headline; its tagline uses `--muted` and can wrap.
- `lang="hi"` on Hindi text; labelled nav; heading order no longer skips a level.
- Dark cards use a `--line` border.

**Bug fix**
- The theme toggle is mounted on the client only. Rendering it on the server threw React hydration errors #418 and #423 for readers whose stored theme differed from the server's guess.

## Not changed (by decision)

- Sutra `Button`, `Input`, `Card` are not used: they are rounded, sans-serif and accent-filled, so matching the editorial spec would mean overriding nearly every class.
- DM Sans is not added. The app card uses Inter.
- Topic colour list unchanged. No copy changed, except the design system's own "Read story" label on the new card.
- Accepted contrast exceptions, as specified by the design system: small red text on dark (4.2–4.3:1), amber status on the blue chip in light (3.7:1), `--line-heavy` input borders.

## Known, not fixed here

- Thank-you overlay cannot be dismissed.
- The form reads `message`; FastAPI sends `detail`.
- `/opengraph-image` returns 404.
- The hero headline still wraps to four lines at 1280px and 390px.
- Stories without a photo show a plain topic wash; there is no illustration set yet.

## Test plan

- [x] `npm run lint` — no warnings or errors
- [x] `npm run typecheck` — clean
- [x] `npm test` — 63 passed (10 files); was 32
- [x] `npm run build` — compiled, 5 static pages
- [x] `pytest tests/` — 117 passed
- [x] Viewed at 1280px and 390px, light and dark; no console errors in either theme
- [ ] Check the Vercel preview against the screenshots

## Screenshots

Before (live site) and after (this branch), full page, in `docs/design-audit-screenshots/` locally. Drag these into the PR:

| | Before | After |
|---|---|---|
| 1280 light | `before/1280-light-full.jpg` | `after/1280-light-full.jpg` |
| 1280 dark | `before/1280-dark-full.jpg` | `after/1280-dark-full.jpg` |
| 390 light | `before/390-light-full.jpg` | `after/390-light-full.jpg` |
| 390 dark | `before/390-dark-full.jpg` | `after/390-dark-full.jpg` |

Also in `after/`: form error state, carousel on story 2, and the thank-you overlay, each at both widths and themes.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
