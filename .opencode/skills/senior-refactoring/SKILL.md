---
name: senior-refactoring
description: Use when asked to improve code structure, reduce tech debt, refactor components, or clean up code. Triggers on: "refactor", "clean up", "tech debt", "improve code", "reorganize", "düzenle", "temizle".
---

# Senior Refactoring Guide

## Before Refactoring
- **Make sure tests exist** — never refactor without a safety net
- Write missing tests first if coverage is insufficient
- Understand the CURRENT behavior before changing it
- Check git blame: who touched this last, why was it written this way?

## Refactoring Patterns

### Extract Function
- Long functions > 20 lines → extract cohesive sub-functions
- Repeated code blocks → extract once, name descriptively
- Complex conditions → extract into named boolean variables/functions

### Simplify State
- Multiple useState calls → useReducer or custom hook
- Props drilling → context (but only for truly global state)
- Redundant state → derive values from existing state

### Improve Types
- `any` → proper TypeScript types
- Function overloads → union types or generic constraints
- String enums → const objects or `as const`
- Optional chaining → reduce `if (x && x.y)` noise

### Component Refactoring (React)
- Big component → split into smaller components
- Mixed concerns → custom hooks for logic, components for UI
- `"use client"` bloat → push state down, use server components
- Inline handlers → named functions or useCallback where needed

## Refactoring Order (most impactful first)
1. **Naming**: most important for readability
2. **Structure**: file/folder organization
3. **Logic**: extract, simplify, deduplicate
4. **Types**: add/enforce TypeScript
5. **Performance**: only if there's a measurable issue

## Red Flag: Over-Refactoring
- Don't extract until pattern appears 3+ times
- Don't add abstraction layers "just in case"
- Don't change formatting/style alongside logic changes (separate PRs)
- Don't refactor what's working in a hotfix branch

## Always Leave the Code Better Than You Found It
- Small improvements every time you touch a file
- Remove dead code, commented code, unused imports
- Update stale comments (or remove them — code is truth)
- Fix minor lint warnings in the vicinity
