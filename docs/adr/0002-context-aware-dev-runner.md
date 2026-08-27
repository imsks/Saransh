# Context-Aware Dev Runner

Each repository has a self-contained `make up` command that starts only that project's stack, not the entire ecosystem.

**Context**: We considered a "super-runner" that boots all apps + all infra across repos. This adds complexity (cross-repo orchestration, shared Docker networks) without clear benefit — developers typically work on one product at a time.

**Decision**: Each repo's `make up` starts:
1. That repo's backing services (Postgres, Chroma, etc.) via `docker compose up -d`
2. That repo's backend (Flask/FastAPI via uvicorn/gunicorn)
3. That repo's frontend (Next.js dev server)

No cross-repo dependencies at dev time. Products consume Sutra as an installed npm package, not a linked workspace.

**Consequences**: If you're working on Sutra and want to test changes in Rajniti, you need to:
1. Build and pack Sutra: `pnpm build && pnpm pack`
2. Update Rajniti's vendor tarball
3. Reinstall in Rajniti

This is intentional friction — it mirrors the production dependency relationship.
