---
name: senior-code-review
description: Use when asked to review code, do PR review, audit changes, or check for bugs/security/style issues. Triggers on: "review code", "code review", "pr review", "audit", "incele", "gözden geçir", "check this code".
---

# Senior Code Review Checklist

## Correctness
- Edge cases: empty states, null/undefined, boundary values, race conditions
- Error handling: every error path logged, no silent failures, proper error boundaries
- Async: proper cleanup, cancellation, timeout handling, no unhandled rejections
- State management: immutable updates, no stale closures, proper lifecycle

## Security (OWASP Top 10)
- Input validation: Zod/Joi schema for ALL external input, never trust req params
- Auth: RBAC checked at every endpoint, resource ownership verified
- Injection: parameterized queries only, no string concat in SQL/shell/HTML
- Secrets: no hardcoded keys, tokens, passwords in code or logs
- XSS/CSRF: output escaped, CSP headers set, CSRF tokens on state-changing requests
- Rate limiting on all public endpoints, pagination on list endpoints

## Performance
- N+1 queries: check Prisma `include`/`select` usage, use `batch` or `findMany`
- Bundle: dynamic imports for heavy deps, tree-shakeable imports, no `*` imports
- Rendering: prefer React Server Components, minimize `"use client"` boundaries
- Caching: memoize expensive computations, cache API responses, use `React.cache`
- Memory: no memory leaks in useEffect, cleanup subscriptions, avoid large deps arrays

## Maintainability
- Naming: descriptive names, no abbreviations, consistent casing
- DRY: extract repeated logic but avoid premature abstraction
- Complexity: max 3 levels of nesting, pure functions where possible, single responsibility
- Types: strict TypeScript, avoid `any`, use discriminated unions for states
- Tests: test behavior not implementation, cover happy path + error + edge cases

## Communication
- Explain WHY a change is needed, not just WHAT
- Flag risky areas: "this could break if X happens"
- Suggest improvements with concrete examples, not vague feedback
- Be constructive: point out what's good too
