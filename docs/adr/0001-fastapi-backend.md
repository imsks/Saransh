# FastAPI Backend with Async Support

Saransh uses FastAPI for its backend, not Flask like Rajniti.

**Context**: Saransh's workload is I/O-heavy — handling many concurrent API requests, validating approved sources, and storing Story and Source data. The planned pipeline runs local AI through Ollama, but the service itself still needs a framework that is efficient under concurrent, short-lived requests. Flask's synchronous model would require threading or worker processes for concurrency. FastAPI's native async support is a better fit.

**Decision**: Keep FastAPI for Saransh. Don't migrate to Flask for "consistency" with Rajniti. The products are independent; the shared layer is the UI (Sutra), not the backend.

**Consequences**: Teams working across both projects need familiarity with both Flask and FastAPI. This is acceptable — both are small, well-documented frameworks with similar mental models.
