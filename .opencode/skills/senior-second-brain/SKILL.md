---
name: senior-second-brain
description: Use when asked to remember, recall, save knowledge, store decisions, or manage persistent project memory. Triggers on: "remember", "hatırla", "save this", "store", "memory", "second brain", "knowledge base", "never forget", "not et", "kaydet".
---

# Second Brain — Persistent Memory System

## Purpose
The second brain stores cross-session knowledge so you never repeat yourself. It lives in `.opencode/memory/` as structured markdown files.

## Memory Categories

### `.opencode/memory/decisions.md`
Architecture decisions, technology choices, why-X-over-Y.
```md
# Architecture Decisions
## YYYY-MM-DD: [Decision Title]
- **Context:** What prompted this decision
- **Options considered:** A, B, C
- **Chosen:** A
- **Rationale:** Performance + team familiarity
- **Trade-offs:** Slightly more boilerplate
- **Status:** [active | superseded | deprecated]
```

### `.opencode/memory/patterns.md`
Reusable patterns, conventions, code idioms for this project.
```md
# Project Patterns
## Error Handling
We use a Result type pattern instead of try/catch for domain operations.
See: src/lib/result.ts for the implementation.
```

### `.opencode/memory/preferences.md`
User preferences, workflow habits, tool choices.
```md
# Preferences
- Testing framework: Vitest
- Styling: Tailwind CSS v4
- Package manager: npm
- Always run lint + typecheck + test before committing
```

### `.opencode/memory/context.md`
Current project context — what we're working on, what's in progress.
```md
# Current Context
## Active Task (YYYY-MM-DD)
- **What:** Brief description
- **Status:** in-progress | blocked | complete
- **Files involved:** path/to/file.ts
- **Next steps:** step 1, step 2
```

### `.opencode/memory/learnings.md`
Things learned during development — bugs, workarounds, insights.
```md
# Learnings
## YYYY-MM-DD: [Topic]
[What you learned. Include reproduction steps for bugs, exact error messages, solutions.]
```

## Usage Commands
- `\remember <note>` — save something to memory (categorizes automatically)
- `\recall <topic>` — search memory for relevant notes

## Workflow
1. When discovering something reusable → save to memory immediately
2. Before starting a task → check memory for relevant context
3. After completing a task → update context.md and add learnings
4. When making a decision → log it in decisions.md with rationale

## Second Brain Agent
Use `@second-brain` for:
- "Save this to memory: ..."
- "What do we know about X?"
- "Update the current context"
- "Find all decisions related to X"
