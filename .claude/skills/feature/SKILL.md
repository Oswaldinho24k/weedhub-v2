---
name: feature
description: Orchestrates the full spec-driven feature development workflow for WeedHub. Guides through 10 phases — spec, domain model, issues, implement, verify, review, simplify, UI polish, security, ship — one at a time, never skipping without confirmation. Use when starting any new feature, invoking as /feature "Feature Name" or just /feature.
---

# /feature — Spec-Driven Feature Workflow

Runs a new feature through 10 phases in order. Each phase must complete before the next starts. Never skip ahead without explicit user confirmation.

## How to start

```
/feature "Cepas similares"   # named feature
/feature                     # interactive — ask for feature name first
```

If no name given, ask: "¿Qué feature vamos a construir?"

---

## The 10 Phases

After each phase print: `✅ Fase N completa — ¿arrancamos con Fase N+1?`  
Wait for confirmation before proceeding. If the user says "skip" on Phase 8, move to Phase 9.

---

### Fase 1 — SPEC
Invoke `/to-prd` with the feature name as context.  
**Gate:** User must explicitly approve the spec ("aprobado", "sí", "dale") before Phase 2.  
If the spec needs revisions, iterate `/to-prd` until approved.

---

### Fase 2 — DOMAIN MODEL
Invoke `/domain-modeling`.  
Focus on: Mongoose schema changes, new fields, indexes needed, query patterns.  
If schema changes are significant, produce or update `GLOSSARY.md` or write an ADR in `docs/adr/`.  
**Gate:** Model must be reviewed and confirmed before Phase 3.

---

### Fase 3 — ISSUES
Invoke `/to-issues` on the approved spec.  
Each issue = one self-contained unit of work (model → API → UI → SEO as separate issues).  
**Gate:** Issue list confirmed before Phase 4.

---

### Fase 4 — IMPLEMENT
Invoke `/implement-specs` referencing the approved spec and issue list.  
After each major chunk (model, API, UI), run:
```bash
npm run typecheck
```
If typecheck fails → fix before continuing. Do not move to Phase 5 with type errors.

---

### Fase 5 — VERIFY
Invoke `/verify`.  
Must cover: golden path + at least 2 edge cases.  
**Gate:** All paths pass. If verify fails → back to Phase 4 to fix, then re-verify.

---

### Fase 6 — REVIEW
Invoke `/code-review`.  
If blockers found → fix, run typecheck, re-verify (Phase 5), then re-review.  
Warnings are OK to ship with a note; blockers are not.

---

### Fase 7 — SIMPLIFY
Invoke `/simplify` on the diff from this feature.  
Apply all suggested simplifications. Run typecheck again after.

---

### Fase 8 — UI POLISH *(optional — skip if no UI changes)*
Invoke `/impeccable` on the new/changed UI.  
If user says "skip" → move directly to Phase 9.

---

### Fase 9 — SECURITY
Invoke `/security-review` on the diff.  
Any HIGH severity finding is a blocker. Fix before Phase 10.

---

### Fase 10 — SHIP
Commit with a structured message:
```
feat: <feature name in lowercase>

<1-2 lines on what was built and why>

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
```
Push to `main`. Print: `🚀 Feature shipped.`

---

## Failure handling

| Failure | Action |
|---|---|
| Typecheck errors | Fix in place, re-run `npm run typecheck`, continue |
| Verify fails | Back to Phase 4, fix, re-verify |
| Review blocker | Fix, re-typecheck, re-verify, re-review |
| Security HIGH | Fix, re-security-review |
| User wants to pause | Note current phase, resume with `/feature --resume` |

## Resume

If a session is interrupted, start with:
```
/feature --resume
```
Ask: "¿En qué fase quedamos?" and continue from there, reading the current diff as context.
