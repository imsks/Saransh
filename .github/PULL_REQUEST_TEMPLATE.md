## What does this PR do?

<!-- A brief description of the change. Link the issue: Closes #123 -->

## Type of change

- [ ] Reader app or landing page (frontend)
- [ ] API or database (backend)
- [ ] Pipeline (sources, summariser, tagger, checker, review)
- [ ] Bug fix
- [ ] Feature / enhancement
- [ ] Refactor / code cleanup
- [ ] Documentation update
- [ ] Other (describe below)

## Scope

<!-- Which modules are affected? -->
<!-- For a new Source: which outlet, is it RSS / licensed / official, and where are its reuse terms? -->
<!-- For a database change: which migration, and does it touch only Saransh-owned tables? -->

## How was this tested?

<!-- Paste the command you ran and a short summary of the result. -->

```bash
# e.g.
# pytest tests/ -v
# cd frontend && npm test
# curl http://localhost:8001/api/v1/health
```

## Version bump

<!-- Add ONE label to this PR to control the automatic version bump when merged to production. -->
<!-- If no label is added, defaults to `patch`. -->

- [ ] `patch` — Bug fixes, small tweaks (0.1.0 → 0.1.1)
- [ ] `minor` — New features, enhancements (0.1.0 → 0.2.0)
- [ ] `major` — Breaking changes (0.1.0 → 1.0.0)

## Checklist

- [ ] I have **not** committed `.env`, API keys, or any secrets
- [ ] I have updated **`docs/PROJECT_STATE.md`** to match this change (or it changes nothing about how the project works — say so above)
- [ ] I have reviewed the diff and it only contains intended changes
- [ ] Tests pass locally (`pytest tests/ -v` and `cd frontend && npm test`)
- [ ] UI changes look right in **both light and dark mode** and at 360px

**Product rules** (tick the ones this change touches; leave the rest)

- [ ] Every Summary in this change is **attributed to a real, citable Source** and links out to it
- [ ] Anything shown to readers works in **both Hindi and English**
- [ ] Word limits hold: English ≤ 60 words, Hindi ≤ 70 (reject, never warn)
- [ ] No publisher image is used; images are an official photo or a Saransh illustration
- [ ] Nothing is learned from clicks, reading time or analytics (**no personalisation**)
- [ ] No article page is scraped; Sources are RSS, licensed or official
- [ ] Migrations touch only Saransh-owned tables (never `users`)

## Screenshots / logs (optional)

<!-- UI changes: before and after, in light and dark, plus a 360px shot. -->

## Additional notes

<!-- Anything reviewers should know — uncertain sources, manual fixes, edge cases, etc. -->
