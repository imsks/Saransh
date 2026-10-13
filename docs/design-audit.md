# Historical design audit

Audit date: 2026-10-04. Scope: the landing page against design-system v1.2,
`master` at `3fd6b15`, and the deployed site at 1280px/390px in both themes.
Implementation branch: `fix/design-system-v1.2-alignment`, based on `development`.
This is a decision record, not a current bug list. Read today's code and tests
before treating an old finding as unresolved.

The external reference was `saransh-design-system.html` v1.2; it was not committed
to this repository. Browser values were measured rather than inferred from classes.
Form errors/confirmation were inspected locally, without submitting production signup.

## Implemented alignment

- Background/foreground aliases use the paper/ink tokens; dark body color matches the page.
- Heading rules moved into Tailwind's base layer so font utilities can override them.
- Added missing app/topic tokens and mapped them to Tailwind. Replaced hardcoded shadows and component color literals with tokens.
- Aligned type, spacing, 2px web radii, buttons, placeholders and field errors with the editorial design.
- Shared editorial button classes remain in `components/ui/buttonClasses.ts`.
- The carousel adopted the 24px app-style story card with topic wash/photo credit, counter, Back/Next and an 80px swipe threshold.
- "Read story" links actual articles; samples have a non-interactive label rather than invented URLs.
- Theme controls became client-mounted, fixing dark-theme hydration errors #418/#423.
- Added reduced-motion scrolling, larger tap areas, Hindi language attributes, heading order and confirmation focus.

## Accepted decisions

| Area | Decision |
| --- | --- |
| Pillar headings | Compact uppercase mono, not the older Fraunces specimen |
| Dark card borders | Line token in dark; ink in light |
| Inputs | Card background in light; paper in dark |
| Thank-you stamp | Muted text rather than low-contrast line-heavy |
| Arrow glyphs | Not added during this pass |
| Sutra Button/Input/Card/Badge | Not substituted: matching the editorial shapes would override nearly every class |
| App-card font | Inter retained, including 700/800 weights; DM Sans not introduced |
| Illustrations | Topic wash retained when no photo is available |

Accepted contrast exceptions were small red text in dark (4.20-4.31:1), amber
status on the light blue chip (3.68:1), and line-heavy input borders (1.4-1.9:1
against a 3:1 control target). They are not a claim of universal AA compliance.
Sutra override color literals remained centralized in the token file.

## Findings left for later

The audit left hero wrapping at 1280px/390px, confirmation dismissal/focus
trapping, FastAPI `detail` display, the missing Open Graph route and an illustration
set outside its scope. Some have since changed; check their owning tests rather
than using this historical list as a backlog. Reader-app screens and language
support were not part of the landing-page alignment.

Historical checks passed: frontend lint/typecheck/build, 63 frontend tests and
117 backend tests, plus desktop/mobile light/dark browser inspection. These counts
describe that change only, not today's suite. Local before/after screenshots
were not committed. Current carousel rotation behavior is defined by the client
and its tests, not the old PR's no-auto-advance wording.