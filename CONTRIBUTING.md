# Contributing to Saransh

Thanks for helping make India's news legible. Saransh is community-driven, and every contribution — a corrected attribution, a bug fix, or a new Source — matters.

This guide covers **how to contribute**. For **how to run the project** (setup, Makefile, env vars, API endpoints, structure), see the [README](./readme.md) and [`frontend/README.md`](./frontend/README.md). We won't repeat that here.

---

## The one rule that matters most

**Never publish an unsourced or fabricated Summary.** Saransh's entire value is trust. A single invented quote, misattributed claim, or hallucinated detail permanently breaks the "verified sources" positioning for every reader.

- Every Summary must trace back to one or more real, citable Articles.
- If a fact isn't in a Source, it doesn't go in the Summary — don't fill gaps from the model's memory.
- Summarization Agent output is for human review, not auto-publish, until it clears confidence checks.

Everything else in this guide is negotiable style. This rule is not.

---

## The vocabulary

Saransh has a settled domain language — use it in code, commits, and reviews. The full glossary is in [CONTEXT.md](./CONTEXT.md); the short version:

| Term | Means | Don't say |
| --- | --- | --- |
| **Story** | A news event: headline, summary, sources, metadata | Article, news item, post |
| **Article** | One source document scraped from an outlet | Story, news piece |
| **Source** | A verified outlet Articles are scraped from | Publisher, feed |
| **Summary** | AI-generated concise Story text, attributed | Excerpt, blurb, digest |
| **Chunk / Embedding** | Semantic segment / its vector | Segment, encoding |
| **Pipeline** | scrape → chunk → embed → store | Workflow, flow |
| **Agent** | Autonomous task process (summarization, curation) | Bot, worker |

---

## Ways to contribute

- **Code — frontend or backend:** pick an issue from the backlog and ship it.
- **Sources & scrapers:** add or fix a Source under `app/scrapers/`, wired through `app/scrapers/factory.py`.
- **Agents & pipeline:** improve summarization, curation, chunking, or embeddings.
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
make up               # full stack (API :8001 + Next.js :3001 + Postgres :5432)
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
| `source/` | New or corrected Source / scraper |
| `refactor/` | Code cleanup, no behaviour change |
| `docs/` | Documentation only |
| `chore/` | Tooling, CI, deps |

Example: `feat/story-carousel-keyboard-nav`, `fix/waitlist-duplicate-email`.

---

## Project house rules (read before touching the UI)

These are settled architectural decisions. Work within them — a PR that violates one will be sent back.

- **Use Sutra first.** Import `@sutra_ui/ui` for Button, Card, Input, Badge, Text, Link, Modal, Toast, Skeleton, Avatar, Theme. Don't hand-roll a local twin. Re-skin via `--sutra-color-accent-*` overrides, never by forking the component.
- **Dark mode:** use real `dark:bg-* / text-* / border-*` classes only. **No `filter: invert()` hacks.** Every UI change must look right in **both** light and dark.
- **Attribution is visible.** A Summary rendered without its Source links is a bug, not a layout choice.
- **Public reading needs no login.** Reading Stories must never sit behind auth. Accounts are only for personalisation.
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
6. Keep the diff to intended changes only; review it yourself first.

Map your work back to the issue's **acceptance criteria** — a reviewer will check each box against your PR.

---

## Review & merge

- A maintainer reviews for correctness, the house rules above, tests, and green CI.
- Respond to feedback with follow-up commits (don't force-push over the review history unless asked).
- Once approved and CI is green, a maintainer merges. The version-bump label drives the automatic release bump.
- Be patient and kind — reviewers are volunteers too.

---

## Source & AI-agent contributions

To run the Agents locally you need at least one LLM key (`OPENAI_API_KEY` in `.env`). Rules: every enriched field must be Source-backed, no secrets in commits, and the test suite must be green before you push. See **Running agents** in the [README](./readme.md).

---

## Reporting bugs & requesting features

- **Bug:** open an issue ([new issue](https://github.com/imsks/Saransh/issues/new)). Include steps to reproduce, expected vs actual, environment, and a screenshot/log.
- **Bad Summary or attribution:** open an issue with the Story, the Source links, and what's wrong — accuracy bugs are our highest-priority class.
- **Feature idea:** start a [Discussion](https://github.com/imsks/Saransh/discussions) or open a feature issue so we can align before code.

---

## Code of Conduct

Be respectful, assume good intent, and keep discussion focused on the work. Harassment or discrimination isn't tolerated. Saransh reports on real people and real events — treat both with accuracy and care.

## License

By contributing, you agree that your contributions are licensed under the project's [MIT License](./LICENSE).

---

**Built with ❤️ in 🇮🇳 — thank you for contributing.**
