# Design audit — landing page vs design system v1.2

**Phase 1 of 2. Audit only: no code was changed when this was written.** Phase 2 is recorded at the end, under [Phase 2 outcome](#phase-2-outcome).

| | |
|---|---|
| Audited | 2026-10-04 |
| Design system | `saransh-design-system.html`, v1.2, last updated 4 Oct 2026 |
| Code | `master` at `3fd6b15` (`frontend/`) |
| Deployed | https://saransh-app.vercel.app, checked at 1280px and 390px, light and dark |
| Screenshots | `docs/design-audit-screenshots/before/` (16 files) |

## How to read this

**Severity**

- **Blocker** — breaks an explicit design-system rule in a way every visitor sees, or is a bug that silently defeats the styles the code asks for.
- **Mismatch** — the design system gives a value or behaviour and the site does something else.
- **Polish** — small drift, or something the design system implies but does not state.
- **Decision** — the design system and the deployed site (or two parts of the design system) disagree and I cannot tell which should win. Listed in [Decisions needed](#decisions-needed). Not touched in Phase 2 until answered.

**Method**

- "Deployed" values are computed styles read from the live page in the browser, not guesses from the class names.
- Contrast ratios are calculated from the token hex values (WCAG 2.x formula).
- The thank-you overlay and the form error state were audited from the code only. Seeing them on the live site would mean submitting the production waitlist form, which I did not do.
- Keyboard focus styles were audited from the code; the browser pane does not report `:focus` styles reliably.
- 1280px screenshots were saved at 800×450 by the browser tool, so they show layout, not pixel detail.

**How I read the design system's component demos.** The demo CSS in section 03 is drawn smaller than the type table in section 02 (the demo story headline is 15px; the table says 18.5px). So where the two disagree on a *size*, the type table wins and the demo is treated as an illustration. Demos are still used for colour, border, radius, font family, weight and structure.

## Things to know before Phase 2

1. **The design system file is not in the repo.** The brief names `docs/design/saransh-design-system.html`. That path does not exist. I read the copy at `~/Desktop/PM Artefacts/Saransh/saransh-design-system.html`.
2. **Local `master` is behind what is released.** `origin/production` and `origin/development` are ahead of `master` (story `image_url`, publish-on-ingest). The landing-page components this audit covers are otherwise the same. Phase 2 needs a decision on which branch to start from.
3. **`PROJECT_STATE.md` is untracked**, and there is an uncommitted edit to `frontend/.gitignore` that tries to ignore it. That ignore line has no effect where it is (the path is relative to `frontend/`).
4. **The design system's web type table still describes the pre-v5 landing page** in places (a "Now in development" kicker, 18px Fraunces pillar headings, a longer hero lede). The live page was restructured after that. Where this causes a real conflict it is listed as a Decision.

---

## Summary

| Severity | Count |
|---|---|
| Blocker | 3 |
| Mismatch | 51 rows |
| Polish | 27 rows |
| Decision | 6 |

Mismatch and Polish are counted as table rows in sections 1–12. Some rows point at the same fix from two sections (for example the 4px radius and the button spec), so the number of distinct code changes is smaller. The contrast table in 12.1 is not included in the counts.

**Blockers**

1. Dark `--background` is `#111417`, not `--paper` (`#191816`). Confirmed in code and on the live site.
2. A global `h1–h4 { font-family }` rule overrides Tailwind's font utilities, so the three pillar headings ask for mono and render in Fraunces. Any future heading with `font-mono` or `font-sans` will silently break the same way.
3. The offset card shadow is a hardcoded light-mode `rgba(15,20,25,.07)`. In dark mode it is invisible on both the form card and the story card, and it is a hardcoded colour outside `globals.css`.

---

## 1. Colour tokens

### 1.1 Light (`:root`)

| Item | Design system says | Code / deployed does | Severity | Proposed fix |
|---|---|---|---|---|
| `--paper` `--card` `--ink` `--muted` `--line` `--line-heavy` | `#eeedea` `#ffffff` `#0f1419` `#6b6862` `#e2e0d8` `#c0bdb4` | Same | OK | None |
| `--red` `--red-tint` `--blue` `--blue-tint` `--green` `--green-tint` `--amber` | `#c41e2e` `#fdf0f1` `#1a4f8a` `#edf2f8` `#1f6b3e` `#eaf3ed` `#b8691a` | Same | OK | None |
| `--amber-tint` | `#fbf1e6` | Not defined in `:root`. Computes to empty in light mode. | Mismatch | Add `--amber-tint: #fbf1e6` to `:root` |
| Tailwind mapping for amber tint | Every token usable as a class | `--color-amber-tint` missing from `@theme inline`, so `bg-amber-tint` does not exist | Mismatch | Add `--color-amber-tint: var(--amber-tint)` |

### 1.2 Dark (`.dark`)

| Item | Design system says | Code / deployed does | Severity | Proposed fix |
|---|---|---|---|---|
| `--paper` `--card` `--ink` `--muted` `--line` `--line-heavy` | `#191816` `#211f1c` `#e6e4df` `#8e8a82` `#2c2a25` `#3a3730` | Same | OK | None |
| `--red` `--red-tint` `--blue` `--blue-tint` `--green` `--green-tint` `--amber` `--amber-tint` | `#d95550` `#2e1618` `#5a8ebe` `#141e2a` `#4a9b6a` `#152518` `#d4944a` `#352310` | Same | OK | None |

### 1.3 `--background` and `--foreground`

| Item | Design system says | Code / deployed does | Severity | Proposed fix |
|---|---|---|---|---|
| Dark `--background` | Equals `--paper`, `#191816` | `#111417` in `.dark`. Live: `<body>` computes to `rgb(17, 20, 23)` while the page wrapper is `rgb(25, 24, 22)`. The cold colour shows on overscroll and anywhere the wrapper does not cover. | **Blocker** | `--background: var(--paper)` in `:root` only |
| Where the aliases are declared | Once in `:root`. Not redeclared in `.dark`. No second hex. | Declared as hex in both `:root` and `.dark` | Mismatch | Remove both lines from `.dark`; replace the `:root` hex with `var(--paper)` / `var(--ink)` |
| `--foreground` | Alias of `--ink` | `#0f1419` / `#e6e4df` as hex. Values happen to match. | Mismatch | `--foreground: var(--ink)` in `:root` only |
| Docs | `PROJECT_STATE.md` §9.4 updated to match | §9.4 records the `#111417` value | Mismatch | Update §9.4 in Phase 2 |

### 1.4 v1.2 app-only tokens

| Item | Design system says | Code / deployed does | Severity | Proposed fix |
|---|---|---|---|---|
| `--body` `--edge` `--tint` `--img-bg` `--on-red` `--scrim` `--cta-shadow` `--card-shadow` | Defined in `:root` and `.dark` (section 05 snippet) | None exist | Mismatch | Add to `globals.css` with the snippet's values |
| Topic accents | `--topic-{civic,edu,health,jobs,transport}` plus `-bg` in light; accents only in dark | None exist | Mismatch | Add as listed. Topic list itself is an open decision and is not changed. |
| Tailwind mapping | Usable as theme names | Not mapped | Mismatch | Add `--color-*` entries and `--shadow-card-app` to `@theme inline`. No screens built. |

### 1.5 Hardcoded colour outside `globals.css`

The design system allows only the story-card image gradients.

| Item | Design system says | Code / deployed does | Severity | Proposed fix |
|---|---|---|---|---|
| Card and form offset shadow | `4px 4px 0 rgba(15,20,25,.07)` light; dark demo uses `rgba(0,0,0,.2)` | `shadow-[4px_4px_0_rgba(15,20,25,0.07)]` hardcoded in `WaitlistForm.tsx` and `StoryCarouselClient.tsx`. Same value in dark, where it cannot be seen. | **Blocker** | One shadow token in `globals.css` (light and dark values), mapped to a Tailwind shadow name, used in both places. Token name needs your approval; I suggest `--print-shadow`. |
| Thank-you tick | Token names only | `stroke="white"` on the SVG | Mismatch | `stroke="currentColor"` with a token text colour (`text-card`) |
| Submit spinner | Token names only | `border-t-white`. On the disabled button it is white on `--line-heavy`. | Mismatch | `border-t-card` |
| Photo credit chip | Web demo: `rgba(255,255,255,.88)` on `rgba(0,0,0,.38)` | `text-white/85` on `bg-black/35` | Mismatch | Use the new `--scrim` token for the background; white text is the stated rule for text on scrim |
| Story image gradients | Permitted. Example given: `linear-gradient(165deg, #B5AFA4 0%, #8A8578 50%, #4A4640 100%)` | Three gradients (`national` green, `road` grey, `civic` blue), `to bottom right`. The grey one is close to the example but not identical. | Polish | Leave the three variants. Align the grey one to the documented stops and angle. |
| Sutra overrides | "Never keep a second hex for the same job" | Nine extra hex values in the `--sutra-*` block (for example `--sutra-color-surface-muted: #232420`, `--sutra-color-accent-hover: #f5808b`) that are not design-system tokens | Polish | Point each at the nearest token where one exists (`--tint` for surface-muted, `--on-red` for accent-contrast). Leave the rest; they only affect Sutra components not yet used. |

---

## 2. Typography

Families load correctly: Fraunces (`font-serif`), Inter (`font-sans`), IBM Plex Mono (`font-mono`), Noto Sans Devanagari (`font-hindi`).

| Item | Design system says | Code / deployed does | Severity | Proposed fix |
|---|---|---|---|---|
| Heading font rule | Type table sets family per element | `globals.css` has an unlayered `h1, h2, h3, h4 { font-family: Fraunces }`. Unlayered CSS beats Tailwind's layered utilities, so `font-mono` on an `<h3>` is ignored. Live: pillar `<h3>` has class `font-mono` and computes to Fraunces. | **Blocker** | Move the rule into `@layer base` so utilities can override it |
| Hero headline | Fraunces, `clamp(34px, 4vw, 52px)`, 600 / 500 italic, line-height 1.08, tracking −0.025em | `clamp(36px, 5.2vw, 58px)`, line-height 1.05, tracking −0.028em. Live at 1280: 58px. Weight and italic match. | Mismatch | Use the design-system values |
| Hero headline wrapping | Three lines (two `<br>`) | At 58px "Sourced, summarised," does not fit the 492px column and wraps, giving four lines at 1280 and at 390 | Polish | Expected to resolve at 52px with a 64px gap; verify in Phase 2 |
| Hero body | Inter 17px, 400, line-height 1.68 | 16px, line-height 1.72, with a 2px red left rule and `max-width: 44ch` | Mismatch | 17px / 1.68. Keep the red rule (design system is silent on it). |
| Section headline | Fraunces `clamp(26px, 3vw, 36px)`, 600, 1.12, −0.02em | No element uses it. The What section has no headline since the v5 restructure. | n/a | None |
| Pillar heading | Fraunces 18px, 600, line-height 1.2, −0.01em, sentence case | 11px, 600, uppercase, tracking 0.12em, rendered in Fraunces by the bug above. The text itself is typed in capitals. | **Decision 1** | See Decisions |
| Rajniti headline | `clamp(24px, 3vw, 34px)`, 600, 1.15, −0.02em | Same | OK | None |
| Bottom CTA headline | `clamp(26px, 3.5vw, 42px)`, 600, 1.1, −0.025em | `clamp(26px, 4.4vw, 44px)`. Live at 1280: 44px. | Mismatch | Use the design-system clamp |
| Thank-you headline | `clamp(28px, 4vw, 42px)`, 600, 1.1, −0.02em | Size and line-height match. Tracking is `tracking-tight` (−0.025em). | Polish | `tracking-[-0.02em]` |
| Story card headline | 18.5px, 600, 1.25, −0.01em | 18.5px, 600, 1.25, tracking −0.025em (`tracking-tight`) | Mismatch | `tracking-[-0.01em]` |
| Nav logo | Fraunces 18px, 600, −0.01em | 20px (`text-xl`), −0.025em | Mismatch | 18px, −0.01em |
| Body copy, sections | Inter 15.5px, 400, 1.72 | Rajniti body 15px / 1.74. Bottom CTA body 15.5px / 1.7. Thank-you body 15.5px / 1.65. Pillar body 13px / 1.6. | Mismatch | 15.5px / 1.72 for Rajniti, CTA and thank-you. Pillar body follows Decision 1. |
| Body copy, story card | Inter 13.5px, 400, 1.6 | Same | OK | None |
| Kicker labels | Mono 10.5px, 600, 0.20em, upper | "Civic accountability" matches. "Live feed preview" and the form's "Join the waitlist" kicker are 9.5px. | Polish | 10.5px on both |
| Form labels | Mono 9.5px, 600, 0.12em, upper | Same size, weight, tracking. Colour differs (see section 4). | OK | None |
| Button text | Mono 12px, 600, 0.10em, upper | Form submit 11.5px / 0.12em. Bottom CTA 12px / 0.12em. Thank-you buttons 11px / 0.05em. | Mismatch | 12px / 0.10em on all four |
| Nav GitHub link | Mono 11.5px, 400, 0.06em, upper | 11.5px, 400, 0.05em (`tracking-wider`) | Polish | `tracking-[0.06em]` |
| Source badge | Mono 10px, 400, 0.03em, sentence case | 10px, 400, no tracking | Polish | Add `tracking-[0.03em]` |
| Microcopy / fine print | Mono 9.5px, 400, line-height 1.65, 0.05em | Form fine print 9.5px, tracking 0.04em, line-height 1.5 | Polish | 0.05em, 1.65 |
| Timestamp / metadata | Mono 10px, 400, 0.03em | 10px, 400, no tracking | Polish | Add `tracking-[0.03em]` |
| Footer text | Not specified | Name Fraunces 16px; Hindi 14px red; tagline 11px Noto; right column mono 11px | n/a | None |

Not done, by instruction: DM Sans, Tiro Devanagari Hindi, and the app type scale.

---

## 3. Buttons (web)

| Item | Design system says | Code / deployed does | Severity | Proposed fix |
|---|---|---|---|---|
| Primary text colour | `--paper` on `--ink` (`#EEEDEA` on `#0F1419`; dark `#191816` on `#e6e4df`) | `text-card`: white on ink in light, `#211f1c` on ink in dark | Mismatch | `text-paper` |
| Primary hover | Background `--ink` → `--red` | `hover:bg-red`. Present. | OK | None |
| Hover contrast, dark | 4.5:1 for text | `--card` on `--red` is 4.20:1. With `text-paper` it is 4.53:1. | Mismatch | Fixed by the `text-paper` change above |
| Transition | 0.15s on hover colour changes | Form submit and bottom CTA have no transition (`0s`). Thank-you buttons have `transition-colors`. | Mismatch | Add `transition-colors` (150ms) to both |
| Padding | `12px 20px` | Form submit `12px 20px`. Bottom CTA `14px 36px`. Thank-you buttons `10px 18px`. | Mismatch | `12px 20px` everywhere |
| Radius | 2px | Form submit and bottom CTA 2px. Thank-you buttons use `rounded-sm`, which is **4px** in Tailwind v4. | Mismatch | `rounded-[2px]` |
| Secondary button | Transparent, `--ink` text, 1.5px `--ink` border (dark: `--ink` text, `--line-heavy` border) | Thank-you "Explore Rajniti": `--muted` text, `--line-heavy` border in both themes, goes to ink on hover | Mismatch | Ink text; ink border in light, line-heavy in dark |
| Disabled state | Not specified | `disabled:bg-line-heavy`, spinner only | n/a | None |
| Sutra `Button` | Check Sutra before hand-writing | All four buttons are hand-written | Polish | Try Sutra `Button` re-skinned by tokens. If its sizes cannot be made to match without forking, keep the hand-written ones and say so in the PR. |

---

## 4. Form inputs and error states

| Item | Design system says | Code / deployed does | Severity | Proposed fix |
|---|---|---|---|---|
| Label colour | `--ink` (`#0F1419`; dark `#e6e4df`) | `text-muted` | Mismatch | `text-ink` |
| Input border | 1.5px `--line-heavy`, radius 2px | Same | OK | None |
| Input background | Light `#FFFFFF`; dark `#191816` | `bg-paper` in both themes, switching to `bg-card` on focus. Light: grey field on a white card. | **Decision 3** | See Decisions |
| Input text | Inter 13.5px, `--ink` | 14px | Polish | 13.5px |
| Input padding | `10px 12px` | `11px 14px` | Polish | `10px 12px` |
| Invalid field | Border turns `--red` on the field that is wrong | Border never changes. No `aria-invalid`. | Mismatch | Track which field failed; red border and `aria-invalid` on that field |
| Error message position | Directly under the invalid field | One message above the submit button for the whole form | Mismatch | Render under the field; link with `aria-describedby`; keep `role="alert"` |
| Error message type | Mono 10px, `--red`, tracking 0.04em, 4px above | Mono 10px red, no tracking | Polish | Add `tracking-[0.04em]` |
| Server and network errors | Not specified | Generic message in the same slot | n/a | Keep as a form-level message under the button |
| Focus state | Not specified | `outline-none`, border goes to `--ink`, background to `--card`. No transition. | Polish | Keep the border change, add a visible `focus-visible` ring using `--red` (the Sutra ring token) and a 0.15s transition |
| Placeholder | Shown, colour not specified | Ink at 50%. Light 3.39:1, dark 4.38:1. | Mismatch | `placeholder:text-muted` (4.74:1 light, 5.16:1 dark) |
| Tests | Add tests where behaviour changes | `validate.ts` is tested; the form component is not | — | Per-field errors change behaviour. Component tests would need `@testing-library/react` and `jsdom`, which are new dependencies. See Decision 6. |
| Sutra `Input` / `Field` | Check Sutra first | Hand-written inputs | Polish | Try Sutra `Field` + `Input`. Same caveat as buttons. |

Surfaced, not fixed (as instructed): the form reads `payload.message`, but FastAPI returns errors under `detail`, so a server message can never be shown. This matters for the planned 429 rate-limit message.

---

## 5. Story card (web)

| Item | Design system says | Code / deployed does | Severity | Proposed fix |
|---|---|---|---|---|
| Card border, light | 1.5px `--ink`, radius 2px max | Same | OK | None |
| Card border, dark | Dark demo: 1.5px `#2c2a25` (`--line`). Layout rule: 1.5px `--ink`. | `border-ink` in both themes: a bright `#e6e4df` outline in dark | **Decision 2** | See Decisions |
| Card shadow | `4px 4px 0`; dark demo `rgba(0,0,0,.2)` | Hardcoded light value in both themes | **Blocker** | See section 1.5 |
| Category label | Mono 10px, 600, 0.13em, upper, `--red` | Same | OK | None |
| Image radius | 2px | `rounded-sm` = 4px | Mismatch | `rounded-[2px]` |
| Image height | Demo 80px (illustrative) | 108px | n/a | None |
| Credit chip | Mono 8.5px, radius 2px, 7px from left, 5px from bottom | 9px, radius 4px, 6px / 6px | Polish | 8.5px, `rounded-[2px]` |
| Headline, body | See section 2 | Headline tracking off; body matches | — | See section 2 |
| Carousel dots | Not specified | 7×7px buttons, labelled "Story N", no selected state exposed | Mismatch (accessibility) | See section 12 |
| Sutra `Card` | Check Sutra first | Hand-written | Polish | Try Sutra `Card` for the frame |

---

## 6. Source badge

| Item | Design system says | Code / deployed does | Severity | Proposed fix |
|---|---|---|---|---|
| Colours | `--red` text, 1.5px `--red` border, `--red-tint` background | Same | OK | None |
| Radius | 2px | `rounded-sm` = 4px | Mismatch | `rounded-[2px]` |
| Padding | `3px 8px` | `2px 8px` | Polish | `py-[3px]` |
| Dot | 5px round, `--red`, 5px gap | 5px, 6px gap | OK | None |
| Tracking | 0.03em | None | Polish | See section 2 |
| "↗" and link | Demo shows "BSA press note · Official ↗" | Plain text, no arrow, not a link. `CONTRIBUTING.md` also says a summary without source links is a bug. The sample stories have no URL to link to. | **Decision 5** | See Decisions |
| Small red text on dark | Section 06: red on a dark card is 4.2:1 and is meant for large text only | 10px red on `--red-tint` is 4.31:1 in dark; the 10px category label on `--card` is 4.20:1 | **Decision 4** | See Decisions |

---

## 7. Rajniti chip

| Item | Design system says | Code / deployed does | Severity | Proposed fix |
|---|---|---|---|---|
| Frame | 1.5px `--blue`, `--blue-tint` fill, radius 3px | Same. Radius is on the top corners only because an explainer note is attached underneath. | OK | None |
| Kicker | Mono 9px, 600, 0.17em, upper, `--blue` | Same | OK | None |
| "Linked" badge | 1px `--blue` border, radius 3px, tracking 0.10em, full opacity | Radius 0, weight 700, tracking 0.12em, `opacity-75`. Contrast with the opacity: 4.08:1 light, 3.32:1 dark. | Mismatch | Remove the opacity, radius 3px, weight 600, tracking 0.10em |
| Name | Sans, weight 700, `--ink` | Fraunces, weight 600 | Mismatch | `font-sans font-bold` |
| Promise | Italic, `--muted`; status in `--amber`, weight 600, not italic | Same | OK | None |
| Status contrast, light | 4.5:1 for text | `--amber` on `--blue-tint` is 3.68:1 at 13.5px | **Decision 4** | See Decisions |
| Link | Mono, 600, upper, `--blue`, tracking 0.05em, ends with "↗", no underline | Tracking 0.10em, 1px blue underline, no arrow, `hover:opacity-70` with no transition | Polish | Tracking 0.05em; add a 0.15s transition. Arrow follows Decision 5. Keep the underline: it is the only non-colour link cue. |
| Explainer note under the chip | Not in the design system | Mono 10px `--muted` on `--paper`, blue border | n/a | Keep |

---

## 8. Badges

| Item | Design system says | Code / deployed does | Severity | Proposed fix |
|---|---|---|---|---|
| Badge set | Red, blue, green, amber, ink. Mono 9.5px, 600, 0.10em, upper, `4px 11px`, radius 2px, 1px border. | The page has no general badge. The only badge-like elements are the source badge and "Linked". | n/a | Nothing to build |
| Amber badge background | `--amber-tint` | Token missing in light | Mismatch | Fixed by section 1.1 |
| Sutra `Badge` | Check Sutra first | Not used | Polish | If a status badge is added later, use Sutra `Badge` re-skinned by tokens |

---

## 9. Spacing and layout

| Item | Design system says | Code / deployed does | Severity | Proposed fix |
|---|---|---|---|---|
| Max content width | 1120px, centred | 1120px | OK | None |
| Horizontal padding | 32px; 20px below 560px | 32px; 20px at 390 | OK | None |
| Two-column gap | 64px | 72px in hero, What and Rajniti | Mismatch | 64px |
| Section vertical padding | 80px top and bottom | What 64px; Rajniti 88px; Bottom CTA 88px | Mismatch | 80px on all three |
| Hero padding | 72px top, 80px bottom | Same | OK | None |
| Section separator | 1px `--line` | Same | OK | None |
| Footer separator | 1.5px `--ink` | Same | OK | None |
| Card border | 1.5px `--ink`, radius 2px max | Form card and story card match in light. Dark: see Decision 2. | OK | None |
| Radius 2px maximum | Web cards, buttons, inputs | `rounded-sm` (4px in Tailwind v4) on: story image, credit chip, source badge, both thank-you buttons, theme toggle | Mismatch | `rounded-[2px]` in all six places |
| 860px breakpoint | Columns stack | Stacks at 860px | OK | None |
| 560px breakpoint | Padding reduces; footer stacks left-aligned | Same | OK | None |
| Nav | 56px, sticky, `--paper`, 1px `--line` bottom border | Same | OK | None |
| Horizontal overflow | None | None at 390px | OK | None |
| Sticky right column | "Right column unsticks" at 860px | No column is sticky | n/a | Describes the older layout |

---

## 10. Thank-you overlay

Audited from `ThankYou.tsx` only.

| Item | Design system says | Code / deployed does | Severity | Proposed fix |
|---|---|---|---|---|
| Headline | See section 2 | Tracking slightly off | Polish | See section 2 |
| Body copy | 15.5px / 1.72 | 15.5px / 1.65 | Mismatch | 1.72 |
| Buttons | Web button spec | Radius 4px, 11px, 0.05em, `10px 18px`, `text-card`; secondary is muted | Mismatch | See section 3 |
| Tick | Token colours | Hardcoded `stroke="white"` on `--green` | Mismatch | See section 1.5 |
| Stamp line | Section 05 says the stamp uses `--line-heavy` | `text-line-heavy`, 10px. Contrast 1.60:1 light, 1.49:1 dark. It carries the tagline. | **Decision 4** | See Decisions |
| Stamp on narrow screens | — | `whitespace-nowrap` and absolutely positioned at the bottom; can run off a narrow or short screen | Polish | Allow wrapping, add side padding |
| Semantics | Not specified | `role="status"`. Not a dialog; focus is not moved into it; the page behind stays in the tab order. | Mismatch (accessibility) | Tied to dismissal below. Smallest safe step in Phase 2: move focus to the headline when it opens. |

Surfaced, not fixed (as instructed): the overlay cannot be dismissed. There is no close button, no Escape handler and no backdrop click, and page scroll is locked while it is open.

---

## 11. Motion

| Item | Design system says | Code / deployed does | Severity | Proposed fix |
|---|---|---|---|---|
| Hover transition | 0.15s on colour and border changes | Nav link and thank-you buttons: 150ms. Form submit, bottom CTA, inputs, Rajniti links: none. | Mismatch | `transition-colors` (or opacity) at 150ms on each |
| Card change animation | Not specified | `card-in` 0.3s | n/a | None |
| Overlay animations | Not specified | `fade-in` 0.4s, `pop-in` 0.4s | n/a | None |
| Reduced motion, CSS | Keep support | Global rule cuts animation and transition durations | OK | None |
| Reduced motion, carousel | Keep support | Auto-advance stops | OK | None |
| Reduced motion, scrolling | Keep support | `html { scroll-behavior: smooth }` is not switched off, and the bottom CTA calls `scrollTo({ behavior: "smooth" })` regardless | Mismatch | Add `scroll-behavior: auto` to the reduced-motion block; pick the scroll behaviour from `matchMedia` in `BottomCTA` |
| Auto-advancing carousel | The app rule is "motion only in response to touch". No web rule. | Advances every 4.2s with no pause control | Mismatch (accessibility) | Pause on hover and on keyboard focus. See section 12. |

---

## 12. Accessibility

### 12.1 Contrast (text target 4.5:1)

| Pair | Where | Light | Dark | Result |
|---|---|---|---|---|
| `--muted` on `--paper` | Body copy, labels | 4.74 | 5.16 | Pass |
| `--muted` on `--card` | Card body, fine print | 5.55 | 4.78 | Pass |
| `--red` on `--card` | Category label 10px, error text 10px | 5.88 | **4.20** | Fails in dark — Decision 4 |
| `--red` on `--red-tint` | Source badge 10px | 5.29 | **4.31** | Fails in dark — Decision 4 |
| `--red` on `--paper` | Hero italic word (large) | 5.02 | 4.53 | Pass |
| `--blue` on `--paper` / `--blue-tint` | Kicker, chip text | 7.09 / 7.38 | 5.11 / 4.84 | Pass |
| `--amber` on `--blue-tint` | "Delayed, 60% complete" | **3.68** | 6.51 | Fails in light — Decision 4 |
| "Linked" badge at 75% opacity | Rajniti chip | **4.08** | **3.32** | Fails — fixed by removing the opacity (section 7) |
| Button text now (`--card` on `--ink`) | Primary buttons | 18.51 | 12.94 | Pass |
| Button hover now (`--card` on `--red`) | Primary buttons | 5.88 | **4.20** | Fails in dark — fixed by `text-paper` (4.53) |
| Placeholder (ink 50%) | Inputs | **3.39** | **4.38** | Fails — fixed by `placeholder:text-muted` |
| `--line-heavy` on `--paper` | Thank-you stamp | **1.60** | **1.49** | Fails — Decision 4 |
| `--line-heavy` input border (3:1 target for controls) | Inputs | **1.60–1.88** | **1.38–1.49** | Fails — Decision 4 |
| Inactive carousel dot (`--line-heavy`) | Carousel | **1.60** | **1.49** | Fails — fixed with the dot change below |

### 12.2 Focus, targets, semantics

| Item | Standard | Code / deployed does | Severity | Proposed fix |
|---|---|---|---|---|
| Carousel dot size | `CONTRIBUTING.md`: tap targets ≥ 44px | 7×7px | Mismatch | Keep the 7px dot, give the button a 44px hit area |
| Carousel dot state | Selected state exposed | No `aria-current` | Mismatch | `aria-current="true"` on the active dot |
| Carousel auto-rotation | WCAG 2.2.2: moving content needs a way to pause | No pause | Mismatch | Pause on hover and focus-within |
| Theme toggle size | ≥ 44px | 32×32px | Mismatch | Larger hit area, same visual size |
| Nav "GitHub" link size | ≥ 44px | 45×17px | Polish | Vertical padding to reach 44px |
| Input focus | Visible focus | Border colour change only | Polish | See section 4 |
| Error association | Errors tied to their field | Not tied | Mismatch | See section 4 |
| Hindi text | `lang="hi"` on Hindi runs | None on the footer or the overlay | Mismatch | Add `lang="hi"` |
| Heading order | No skipped levels | `h1` → `h3` ×3 → `h2` → `h2` | Polish | Follows Decision 1 |
| Nav landmark | Labelled | `<nav>` with no label | Polish | `aria-label="Primary"` |
| Overlay | Dialog semantics, focus managed | See section 10 | Mismatch | See section 10 |

---

## Decisions needed

These are the cases where I cannot tell which side should win. I have not guessed. Each has a recommendation.

**1. Pillar headings ("Verified sources", "Open-source pipeline", "Human reviewed").**
The design system says Fraunces 18px, sentence case. The live page shows 11px uppercase. The words are typed in capitals in the source, so sentence case means editing the strings, which is a copy change.
- (a) Keep the compact uppercase style and make it render in mono as the code intends. No copy change. *Recommended: smallest change, matches the v5 layout you shipped.*
- (b) Design-system style: Fraunces 18px, and retype the three strings in sentence case.
- (c) Fraunces 18px but leave the strings in capitals.

**2. Card border in dark mode** (form card and story card).
The layout rule says 1.5px `--ink`. The dark story-card demo draws 1.5px `--line` (`#2c2a25`) with a `rgba(0,0,0,.2)` shadow. Live is `--ink`, a bright outline.
- (a) Follow the dark demo: `--line` border in dark, `--ink` in light. *Recommended: the demo is the only place dark is drawn.*
- (b) Keep `--ink` in both themes.

**3. Input background.**
The design system draws inputs white in light mode and `#191816` in dark. Live uses `--paper` in both, turning to `--card` on focus. In token terms the design system means `--card` in light and `--paper` in dark, which is not one token.
- (a) Follow the design system exactly: `bg-card` in light, `bg-paper` in dark. *Recommended.*
- (b) Keep `--paper` in both (the fields read as recessed in both themes).

**4. Design-system colours that fail the 4.5:1 check.** The brief says to check 4.5:1; these are specified by the design system and fail it.
- Small red text in dark: category label 4.20, source badge 4.31, error text 4.20.
- Amber status on the blue chip in light: 3.68.
- Thank-you stamp in `--line-heavy`: 1.60 / 1.49.
- Input border in `--line-heavy`: 1.4–1.9 against a 3:1 target for controls.

Options: (a) keep the design system as drawn and record these as accepted exceptions; (b) let me fix usage without touching token values (stamp to `--muted`, bolder weight on the small red labels, a darker wash behind the amber status); (c) you adjust the tokens in the design system first. *Recommended: (b) for the stamp only, (a) for the rest until the tokens are revisited, since changing token values is a design-system change, not a code change.*

**5. The "↗" on the source badge and the Rajniti link.**
The demos show the arrow. Adding a glyph is arguably copy, and the source badge has nothing to link to for the sample stories.
- (a) Leave both as they are. *Recommended for this pass.*
- (b) Add the arrow to the Rajniti link only (it is a real link).
- (c) Add both, and make the source badge a link when a story has a source URL.

**6. Housekeeping for Phase 2.**
- **Base branch.** `master` is behind `production` and `development`. Branch from `development`? `CONTRIBUTING.md` says to branch from the default branch.
- **Design system file.** Copy it into the repo at `docs/design/saransh-design-system.html`, as the brief assumes?
- **Which docs get committed.** `PROJECT_STATE.md` is untracked and half-ignored. Should it, this audit, and the screenshots go into the PR?
- **Test dependencies.** Per-field form errors change behaviour. Testing the component needs `@testing-library/react` and `jsdom` (dev-only, free). Approve those, or should I keep the new logic in a pure function and test that with the existing Vitest setup? *Recommended: pure function, no new dependencies.*

---

## Out of scope, noted and not fixed

| Item | Detail |
|---|---|
| Thank-you overlay cannot be dismissed | No close button, Escape handler or backdrop click. Scroll is locked. A reload is the only way out. |
| Form ignores FastAPI's `detail` | The form reads `payload.message`. FastAPI sends `{"detail": ...}`. Server messages never show. |
| Open Graph image route missing | `og:image` and `twitter:image` point at `/opengraph-image`. That URL returns 404 on the live site. Link previews have no image. |
| "Now in development" kicker | Shown in the design system's type specimen. Not on the live hero. Adding it is a copy change. |
| Hindi content | The preview card shows English only. |
| `PROJECT_STATE.md` is stale against `production` | Released code now publishes on ingest and carries `image_url`. The doc describes `master`. |
| Mobile app screens | Tokens only in Phase 2. No screens. |
| DM Sans, English font, topic colour list, any copy | Open decisions. Not touched. |

---

## Proposed Phase 2 commit order

One area per commit, each leaving lint, typecheck and tests green.

1. `globals.css`: `--background` / `--foreground` aliases; light `--amber-tint`; heading rule into `@layer base`.
2. `globals.css`: v1.2 app tokens and topic accents, plus Tailwind mappings.
3. Shadow token; replace the hardcoded shadows and the hardcoded white/black values.
4. Radius: `rounded-sm` → `rounded-[2px]` in the six places.
5. Typography: hero, CTA headline, nav logo, body sizes, tracking.
6. Buttons: text colour, padding, transition, secondary style.
7. Form: label colour, input sizes, placeholder, per-field error state, tests.
8. Story card and source badge.
9. Rajniti chip.
10. Spacing: section padding and column gap.
11. Motion and accessibility: reduced-motion scrolling, carousel pause and dot targets, `lang="hi"`, nav label.
12. Docs: `PROJECT_STATE.md` §9.4.

Items marked Decision are left out until answered.

---

## Phase 2 outcome

Implemented on `fix/design-system-v1.2-alignment`, branched from `development`. Full changelog: `docs/design-audit-pr.md`.

**Decisions taken** (your reply: "go with your recommendations"):

| # | Decision | Outcome |
|---|---|---|
| 1 | Pillar headings | Kept compact uppercase; now render in mono. No copy change. |
| 2 | Dark card border | `--line` in dark, `--ink` in light. |
| 3 | Input background | `--card` in light, `--paper` in dark. |
| 4 | Contrast exceptions | Thank-you stamp moved to `--muted`. The rest stay as the design system specifies and are recorded as accepted exceptions. |
| 5 | "↗" glyphs | Not added. |
| 6 | Housekeeping | Branched from `development`. Form logic tested with the test libraries already on `development`. |

**All three blockers are fixed.** Every Mismatch and Polish row is addressed except the ones below.

**Changed after the audit, at your request:** the story carousel now uses the v1.2 app story screen, so section 5 (web story card) and section 6 (source badge) describe a card that is no longer on the page. The web card tokens and rules remain in the design system.

**Also fixed, found during Phase 2:** the theme toggle caused React hydration errors (#418, #423) on the live site for dark-theme readers.

**Left open**

| Item | Why |
|---|---|
| Hero headline wraps to four lines | Still wraps at 52px. Needs a design call (narrower copy, wider column, or smaller clamp). |
| Sutra `Button` / `Input` / `Card` / `Badge` not adopted | Their shape and type would need overriding almost entirely. |
| Sutra override hex values | Left as they are; they only affect Sutra components not yet used. |
| Overlay is not a true dialog | Focus now moves into it. Dismissal and focus trapping are out of scope. |
| No illustration for stories without a photo | The card shows the topic wash only. |
