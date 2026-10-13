# Contributing

Read [readme.md](readme.md) for current scope and Docker commands,
[CONTEXT.md](CONTEXT.md) for domain terminology and product decisions,
and [docs/adr](docs/adr) for architectural decisions.
Do not describe planned features as shipped.

## Before writing code

Claim an issue before starting and check for existing work. Use its current
behavior, expected behavior and acceptance criteria to define the change.
Discuss large or unclear changes first. Report bugs with reproduction steps,
environment and logs; report accuracy problems with Story and Source links.
Corrections and grievances are handled publicly through
[GitHub Issues](https://github.com/imsks/Saransh/issues).

Branch from the default branch and target it in your PR. Prefixes:
`feat/`, `fix/`, `source/`, `refactor/`, `docs/`, `chore/`.
Use focused commits with imperative descriptions and conventional scopes.

## Host-only development

Docker setup is in the README. Without Docker, install Python 3.11+, Node 20+
and PostgreSQL, then from the repository root:

```bash
cp .env.example .env
cp frontend/.env.example frontend/.env
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt -r requirements-test.txt
```

Set `DATABASE_URL` in `.env` to your local PostgreSQL database before continuing.
If using Compose's PostgreSQL with a host API, use `127.0.0.1:5433`, not `postgres`.
The copy commands above are first-time setup; do not overwrite existing settings.

```bash
python -m scripts.init_db
uvicorn main:app --host 0.0.0.0 --port 8001 --reload
```

In another terminal: `cd frontend && npm ci && npm run dev`.
For commit hooks: `pre-commit install` after installing the test requirements.

## Code rules

- Never publish fabricated or unsourced summaries. Every claim must trace to a citable Article.
- Use the glossary in CONTEXT: Story, Article, Source, Summary, Tier, Topic, Edition, Pipeline and Agent have distinct meanings.
- Routers handle HTTP, schemas validate data and repositories handle persistence. Read existing code before adding a layer.
- Configure through `app/config.py`; document new settings in the relevant environment template.
- Keep API endpoints under `/api/v1`, validate input and preserve existing error/status contracts.
- Ingest writes require `SARANSH_INGEST_API_KEY`; CORS is an explicit allow-list. Never log credentials, full database URLs or reader emails.
- Production shares PostgreSQL with Rajniti. Migrations may touch only Saransh-owned tables. Register new tables in `app/db/ownership.py`, review generated SQL and never rewrite applied revisions.
- Server Components are the default. Add client boundaries only for state, effects or browser APIs.
- Use theme tokens, not color literals, and check both light and dark. No inversion hacks.
- Use Sutra where it fits. Existing editorial controls are an intentional exception, recorded in [design-audit.md](docs/design-audit.md); shared primitives belong upstream rather than in a local copy.
- Keep source links visible. Use keyboard-operable controls, visible focus, appropriate ARIA, Hindi `lang` attributes, AA contrast, 44px tap targets and no overflow at 360px.
- Treat Hindi and English equally in reader features. Analytics must not personalize the feed or contain names/emails.
- Keep diffs focused; do not reformat unrelated files or introduce abstractions only to reduce line count.

## Planned pipeline rules

The full review pipeline is not built. Its requirements are hard word limits
(English <= 60, Hindi <= 70), attribution, official photos or illustrations,
and human approval before publication. The current
[stopgap routine](docs/story-ingest-routine.md) is a documented exception:
it publishes immediately, may use publisher images and has no enforced word limit.
Do not silently extend that exception to new pipeline work.

Use RSS, licensed feeds and official sources, not scraped article pages; check
reuse terms before adding a Source. PTI/ANI are licensed products. Source-list
approval belongs to the founder. Planned AI uses local Ollama, not paid services.
Version prompts, attribute claims, avoid opinion adjectives and fail per Story,
not per batch. An Agent drafts or flags; a person approves. Test validators,
deduplication and tagging with saved fixtures, never live news feeds.

## Required checks

```bash
pytest tests/ -v
black --check app tests scripts
isort --check-only app tests scripts
flake8 app tests scripts
cd frontend
npm test
npm run lint
npm run typecheck
npm run build
```

Python uses Black (88 columns), isort's Black profile, flake8 and type hints.
`mypy app` is advisory in CI. Frontend tests use Jest and Testing Library under
`frontend/tests`; backend fixtures are in `tests/conftest.py`.
Add tests for changed behavior. Preserve coverage thresholds and include both
languages when a rule applies to both. CI checks are in
[ci.yml](.github/workflows/ci.yml).

## Pull requests

Fill in the [PR template](.github/PULL_REQUEST_TEMPLATE.md), link the issue with
`Closes #...`, map the result to acceptance criteria and include commands/results.
Choose one version label: `patch` for fixes, `minor` for features, `major` for
breaking changes. No label defaults to `patch`.

UI changes need before/after screenshots in light/dark and at 360px.
Never commit secrets. Respond to review with follow-up commits; do not force-push
review history unless asked. A maintainer merges after review and green CI.

Be respectful and keep discussion focused on the work. Harassment and
discrimination are not tolerated. Contributions use the [MIT License](LICENSE).