# Contributing to Saransh

Thanks for helping make India's news legible. Saransh is an open-source news app for India: short, sourced stories in Hindi and English, approved by a person, with no personalisation. It is community-driven, and every contribution — a corrected attribution, a bug fix, or a clearer doc — matters.

This guide covers **how to contribute**. For **how to run the project** (setup, Makefile, env vars, API endpoints, structure), see the [README](./readme.md) and [`frontend/README.md`](./frontend/README.md). We won't repeat that here.

---

## The one rule that matters most

**Never publish an unsourced or fabricated Summary.** Saransh's entire value is trust. A single invented quote, misattributed claim, or hallucinated detail permanently breaks the "verified sources" positioning for every reader.

- Every Summary must trace back to one or more real, citable Articles.
- If a fact isn't in a Source, it doesn't go in the Summary — don't fill gaps from the model's memory.
- AI output is a draft for human review. A person approves every Story before it is published; an agent may flag problems but never approves.

Everything else in this guide is negotiable style. This rule is not.

---

## Keep `docs/PROJECT_STATE.md` current

**Every pull request that changes how the project works must update [`docs/PROJECT_STATE.md`](./docs/PROJECT_STATE.md) in the same pull request.** That file is the one description of what is built and how. Contributors, reviewers and AI assistants all start from it, so a change that is not recorded there is a trap for the next person.

- **Before you start:** read it, especially section 11 (known gaps) and section 14 (product direction).
- **When you change something:** update the matching section. Section 13 of the file lists which section goes with which kind of change (an endpoint, a table or migration, a page or component, an env var, a fix to a known gap).
- **When you finish:** update the "Last verified" date and commit hash at the top.
- **If you notice the file is wrong** about something you did not change, fix it or add it to section 11.

A pull request that changes behaviour without touching this file will be sent back. Changes with nothing to record (a typo, a dependency bump, a refactor with no behaviour change) are exempt; say so in the PR description.

---

## The vocabulary

Saransh has a settled domain language — use it in code, commits, and reviews. The full glossary is in [CONTEXT.md](./CONTEXT.md); the short version:

| Term | Means | Don't say |
| --- | --- | --- |
| **Story** | A news event: headline, summary, sources, metadata | Article, news item, post |
| **Article** | One source document from an outlet | Story, news piece |
| **Source** | An approved outlet or official body a Story is drawn from | Publisher, feed |
| **Summary** | AI-drafted, human-approved Story text, attributed | Excerpt, blurb, digest |
| **Tier** | National, State or International | Level, scope |
| **Topic** | The one primary subject of a Story (Politics, Civic, Education, Business & Economy, Crime) | Category, tag |
| **Edition** | One batch of cards a reader gets (15, 15, 10 and 10 in a day) | Session, batch |
| **Pipeline** | fetch → summarise → translate → tag → agent check → human review → publish | Workflow, flow |
| **Agent** | An automated first-pass checker or drafter; it never approves | Bot, worker |

---

## Ways to contribute

- **Code — frontend or backend:** pick an issue from the backlog and ship it.
- **Pipeline:** the planned pipeline (section 14.5 of `docs/PROJECT_STATE.md`) is not built yet. Pick up an issue for one of its steps.
- **Corrections:** report a wrong Story or a wrong attribution (see the end of this guide).
- **Design system:** shared UI lives in [Sutra](https://github.com/imsks/sutra-ui) (`@sutra_ui/ui`). If a component is generic enough for Rajniti to want it too, contribute it there, not here.
- **Bug reports & feature ideas:** open an issue.
- **Docs:** improve the README, this guide, or the ADRs in `docs/adr/`.

New here? Look for issues labelled **`good first issue`**.

---

## Before you start: claim an issue

1. Browse the [Issues](https://github.com/imsks/Saransh/issues) and the project backlog.
2. Read the issue fully — the description, **current behaviour**, **expected behaviour**, and **acceptance criteria** define "done."
3. Check nobody else is already on it (open PRs / recent comments).
4. **Comment to get assigned** before writing code, so effort isn't duplicated.
5. If anything is unclear, ask in the issue or in [Discussions](https://github.com/imsks/Saransh/discussions) first. A two-line question saves a rejected PR.

Please don't open large unsolicited PRs that aren't tied to an issue — start a discussion so we can align on approach.

---

## Setup (quick pointer)

Full instructions are in the [README](./readme.md). The short version:

```bash
git clone https://github.com/imsks/Saransh.git && cd Saransh
make setup            # copies .env templates
make up               # full stack (API :8001 + Next.js :3001 + Postgres :5433)
```

> **Port note:** Saransh runs on `:8001` / `:3001` so it can sit beside Rajniti on `:8000` / `:3000`.

---

## Branching

Branch off the default branch and target it in your PR.

```bash
git checkout master && git pull
git checkout -b <type>/<short-scope>
```

Branch prefixes:

| Prefix | Use for |
| --- | --- |
| `feat/` | New feature or enhancement |
| `fix/` | Bug fix |
| `source/` | New or corrected Source |
| `refactor/` | Code cleanup, no behaviour change |
| `docs/` | Documentation only |
| `chore/` | Tooling, CI, deps |

Example: `feat/story-carousel-keyboard-nav`, `fix/waitlist-duplicate-email`.

---

## Project house rules (read before touching the UI)

These are settled architectural decisions. Work within them — a PR that violates one will be sent back.

- **Use Sutra first.** Import `@sutra_ui/ui` for Button, Card, Input, Badge, Text, Link, Modal, Toast, Skeleton, Avatar, Theme. Don't hand-roll a local twin. Re-skin via `--sutra-color-accent-*` overrides, never by forking the component.
- **Style with theme token names, never hex.** Use `bg-paper`, `text-ink`, `border-line` and the other names mapped in `globals.css`; they follow the active theme on their own. Reach for a `dark:` class only where a token cannot express the difference. **No `filter: invert()` hacks.** Every UI change must look right in **both** light and dark.
- **Attribution is visible.** A Summary rendered without its Source link is a bug, not a layout choice.
- **No personalisation.** Nothing is learned from clicks, reading time or analytics. Topics are a filter the reader sets and can see. Analytics and read records must never feed ranking or suggestions.
- **Hindi and English are equal.** A feature that works in one language and not the other is not done.
- **Word limits are hard.** English ≤ 60 words, Hindi ≤ 70. Reject, never warn.
- **No publisher images.** Story images are an official photo or a Saransh illustration.
- **The production database is shared with Rajniti.** Rajniti owns `users`. A Saransh migration never creates or alters a table Saransh does not own ([ADR 0006](./docs/adr/0006-shared-database-and-users.md)).
- **Accessibility baseline:** keyboard-navigable, correct ARIA roles, visible focus, contrast that passes AA, tap targets ≥ 44px, and no horizontal overflow at 360px.
- **Server components by default.** Reach for `"use client"` only when you need state, effects, or browser APIs.

---

## Code style & linting

- **Python:** `black` + `isort` formatting, `flake8` linting, `mypy` types. Run `black app tests scripts && isort app tests scripts`, then `flake8 app tests scripts` / `mypy app`.
- **Frontend:** ESLint + TypeScript typecheck (`cd frontend && npm run lint && npm run typecheck`).
- **Pre-commit hooks:** `pip install -r requirements-test.txt && pre-commit install` — formats Python on commit and runs React Doctor over staged frontend files.
- Keep changes focused; don't reformat unrelated files in the same PR.

---

## Testing

Your PR must keep the suite green.

```bash
pip install -r requirements-test.txt   # first time
pytest tests/ -v
cd frontend && npm test
```

- Add or update tests for new behaviour and bug fixes.
- Paste the command(s) you ran into the PR's "How was this tested?" section.

**Required CI checks (all must pass):** `Backend — tests`, `Frontend — tests`, `Backend — lint`, `Frontend — lint & typecheck`, `Frontend — production build`.

---

## Commit messages

- Imperative mood, present tense: "Add story carousel", not "Added" / "Adds".
- One logical change per commit where practical; a scope helps: `feat(stories): add source attribution row`.
- Reference the issue in the body when useful.

---

## Opening a pull request

1. Push your branch and open a PR into the default branch.
2. **Fill in the PR template** — it's pre-loaded. In particular:
   - Tick the correct **Type of change**.
   - Add **exactly one version-bump label** — `patch` (fixes/tweaks), `minor` (features/enhancements), or `major` (breaking). No label defaults to `patch`.
   - Describe **how you tested** (paste the command).
3. **Link the issue:** put `Closes #<issue-number>` in the description so it auto-closes on merge.
4. **UI changes:** attach before/after screenshots in **both light and dark mode**, and a mobile (360px) shot.
5. **Never commit** `.env`, API keys, or secrets.
6. **Update `docs/PROJECT_STATE.md`** if your change alters how the project works (see above).
7. Keep the diff to intended changes only; review it yourself first.

Map your work back to the issue's **acceptance criteria** — a reviewer will check each box against your PR.

---

## Review & merge

- A maintainer reviews for correctness, the house rules above, tests, green CI, and an updated `docs/PROJECT_STATE.md`.
- Respond to feedback with follow-up commits (don't force-push over the review history unless asked).
- Once approved and CI is green, a maintainer merges. The version-bump label drives the automatic release bump.
- Be patient and kind — reviewers are volunteers too.

---

## Source & pipeline contributions

The pipeline is planned, not built, so these are the rules any pipeline work must follow:

- **Sources:** RSS feeds, licensed feeds and official sources only. No scraping of article pages. An outlet's reuse terms are checked before it is added, and the source list is the founder's call.
- **AI:** local models only (Ollama), so no API key is needed and the cost stays at zero. Do not add a paid AI service.
- **Prompts:** fact-only, attributed claims ("according to police…"), no opinion adjectives. Every prompt is versioned and public.
- **Failure:** fail per Story, not per batch. Validator, dedupe and tagger changes come with tests.
- No secrets in commits, and the test suite must be green before you push.

---

## Reporting bugs & requesting features

- **Bug:** open an issue ([new issue](https://github.com/imsks/Saransh/issues/new)). Include steps to reproduce, expected vs actual, environment, and a screenshot/log.
- **Bad Summary, wrong attribution, or a grievance about a Story:** open an issue with the Story, the Source links, and what's wrong. Corrections and grievances are handled in public, as GitHub Issues, and accuracy bugs are our highest-priority class.
- **Feature idea:** start a [Discussion](https://github.com/imsks/Saransh/discussions) or open a feature issue so we can align before code.

---

## Code of Conduct

Be respectful, assume good intent, and keep discussion focused on the work. Harassment or discrimination isn't tolerated. Saransh reports on real people and real events — treat both with accuracy and care.

## License

By contributing, you agree that your contributions are licensed under the project's [MIT License](./LICENSE).

---

**Built with ❤️ in 🇮🇳 — thank you for contributing.**
