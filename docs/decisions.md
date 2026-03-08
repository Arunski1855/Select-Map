# Decision Log

Track key architectural, design, and implementation decisions for this project.

---

## Template

### [YYYY-MM-DD] Decision Title

**Context:** What situation prompted this decision?

**Decision:** What was decided?

**Rationale:** Why was this the right choice?

**Alternatives Considered:** What other options were evaluated?

---

## Decisions

### [2026-03-08] Initialize Decision Log

**Context:** Need a lightweight way to track project decisions across sessions.

**Decision:** Create a simple markdown-based decision log in `docs/decisions.md`.

**Rationale:** Low overhead, version-controlled, human-readable. Can evolve to structured format later if needed.

**Alternatives Considered:**
- ADR (Architecture Decision Records) format - too formal for current stage
- Database/JSON storage - overkill for manual logging
