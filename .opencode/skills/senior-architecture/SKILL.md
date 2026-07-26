---
name: senior-architecture
description: Use when asked about system design, architecture decisions, project structure, or technology choices. Triggers on: "architecture", "system design", "project structure", "design pattern", "mimari", "yapı", "how to organize", "best practice".
---

# Senior Architecture Guide

## Key Principles
- **Separation of concerns**: each layer has one responsibility
- **Dependency inversion**: high-level modules don't depend on low-level modules
- **Composition over inheritance**: favor small composable units
- **Interface segregation**: keep interfaces focused and minimal
- **Explicit over implicit**: make data flow and dependencies visible

## Typical Layer Architecture
```
src/
  app/          → routes, pages, API endpoints (presentation)
  components/   → reusable UI components
  domain/       → business entities, types, enums, validation schemas
  services/     → external integrations (DB, APIs, file storage, email)
  lib/          → shared utilities, helpers, configuration
  config/       → app configuration, environment validation
```

## Decision Framework
When choosing between approaches, evaluate:
1. **Complexity cost**: is the overhead worth the benefit?
2. **Team familiarity**: can the team maintain this?
3. **Future flexibility**: does this lock us in?
4. **Testability**: can we test this easily?
5. **Performance**: measurable impact or premature optimization?

## Common Patterns

### Adapter Pattern
- Wrap external services behind an interface
- Swap implementations (mock vs real) without changing business logic
- Always return domain types, never raw API responses

### Repository Pattern
- Data access behind a repository interface
- Business logic doesn't know about Prisma/SQL
- Enables testing with in-memory implementations

### Middleware Pattern
- Cross-cutting concerns (auth, logging, rate limiting) in middleware
- Keep middleware focused: one concern per middleware
- Order matters: auth → validation → rate limit → handler

## State Management Decision
- **Server state** (data from API): React Query/SWR
- **Client state** (UI state): useState/useReducer
- **Global client state** (theme, auth): Context or Zustand
- **URL state** (filters, pagination): search params
- **Form state**: form library (react-hook-form)

## API Design
- RESTful resource naming: plural nouns, consistent status codes
- Input validation at the boundary (Zod schema)
- Return consistent error shapes
- Version API via headers or URL prefix when breaking changes exist
