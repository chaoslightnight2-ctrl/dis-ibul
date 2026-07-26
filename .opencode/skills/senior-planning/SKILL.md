---
name: senior-planning
description: ALWAYS active in senior-dev mode. Every incoming task goes through Plan → Execute cycle. This is the mandatory workflow controller.
---

# Senior Planning Protocol — MANDATORY

This skill is ALWAYS active. Every single message goes through Plan → Execute.

## PHASE 1: PLAN (always first, never skip)

Before ANY code is written, any search is done, any file is edited:

### Step 1: Context Check
- Read `context.md` from second brain — what's the current status?
- Read `decisions.md` and `patterns.md` — are there existing decisions that apply?
- Read `preferences.md` — any user preferences relevant to this task?
- Read `learnings.md` — have we tried and failed at something similar before?

### Step 2: Decompose
Break the task into clear steps and decide for each step:
- Does this need **research**? → use websearch/webfetch/Context7/Firecrawl, or dispatch to `researcher` subagent
- Does this need **architecture design**? → dispatch to `architect` subagent
- Does this need **code review**? → dispatch to `reviewer` subagent or self-review
- Does this need **debugging**? → dispatch to `debugger` subagent
- Does this need **memory ops**? → dispatch to `second-brain` subagent
- Does this need **expert reasoning**? → use first-principles, alternatives, reflection

### Step 3: Select Skills — then load them with `skill()`
Which skills apply to this task? Check ALL that match and **load them with `skill()`**:

- `senior-planning` — this one, always active
- `senior-code-review` — for review/audit → `skill("senior-code-review")`
- `senior-testing` — for test writing/fixing → `skill("senior-testing")`
- `senior-debugging` — for bug fixing → `skill("senior-debugging")`
- `senior-refactoring` — for code cleanup → `skill("senior-refactoring")`
- `senior-architecture` — for design decisions → `skill("senior-architecture")`
- `senior-performance` — for optimization → `skill("senior-performance")`
- `senior-security` — for security review → `skill("senior-security")`
- `senior-git` — for git operations → `skill("senior-git")`
- `senior-web-research` — for web investigation → `skill("senior-web-research")`
- `senior-second-brain` — for memory operations → `skill("senior-second-brain")`
- `expert-engineer-reasoning` — for deep thinking → `skill("expert-engineer-reasoning")`

### Step 4: Write the Plan
Output a clear plan before executing:
```markdown
## Plan
1. [Step 1] — via [agent/skill/tool]
2. [Step 2] — via [agent/skill/tool]
3. [Step 3] — via [agent/skill/tool]

**Memory check:** [what I found in second brain]
**Research needed:** [yes/no, what]
**Subagents:** [which ones I'll dispatch]
```

## PHASE 2: EXECUTE (after plan is approved)

Execute each step of the plan. After each significant action:
- Save learnings to second brain
- Update context.md with progress

## PHASE 3: VERIFY

After execution:
1. Run linter if code changed
2. Run typecheck if TypeScript changed  
3. Run tests if logic changed
4. Save to second brain:
   - `learnings.md` — what did I learn?
   - `decisions.md` — what did I decide?
   - `context.md` — update status
