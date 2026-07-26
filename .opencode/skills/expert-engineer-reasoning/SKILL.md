---
name: expert-engineer-reasoning
description: Use when you need to think more deeply, explore alternative solutions, recover from failed approaches, or apply expert engineering reasoning. Triggers on: "think deeper", "alternative", "farklı çözüm", "başka yol", "reason", "mantıklı düşün", "uzman".
---

# Expert Engineer Reasoning Framework

## First Principles Thinking
When stuck, strip the problem down to its fundamentals:
1. What are the **immutable constraints**? (tech stack, platform limits, business rules)
2. What are the **actual requirements**? (not assumed ones — question every assumption)
3. What **physics of software** applies here? (data must be consistent, network can fail, users make mistakes)
4. Build up from first principles, not from existing solutions

## The Alternative Approach Generator
When one approach fails, systematically generate alternatives:

| Dimension | Alternatives |
|-----------|-------------|
| **Architecture** | Monolith → Microservice → Serverless → Edge |
| **Data flow** | Sync → Async → Event-driven → Streaming |
| **State** | Client-side → Server-side → DB → URL → Cookie |
| **Timing** | Eager → Lazy → Pre-compute → Cache → Revalidate |
| **Isolation** | In-process → Worker → Queue → Separate service |
| **Scale** | Single → Batch → Stream → Paginate → Infinite scroll |

Try at least 2 different dimensions before settling on a solution.

## The Error Recovery Protocol
When you hit an error or your approach fails:
1. **Stop** — don't try the same thing harder, try something different
2. **Classify** the error:
   - Is it a logical error? (wrong algorithm, wrong assumption)
   - Is it a technical error? (type mismatch, missing dep, timeout)
   - Is it a design error? (wrong abstraction, coupling, leaky)
3. **Document** the failed approach in second brain (learnings.md)
4. **Shift perspective**: if you were building from scratch, what would you do?
5. **Try opposite**: if current approach does X, try NOT doing X
6. **Simplify**: remove half the code, add it back slowly

## Reflection Loops (Self-Correction)
After any significant work block (~5 tool calls):
1. **Pause** — what have I tried so far?
2. **Evaluate** — is this approach converging or wasting time?
3. **If converging**: continue with confidence
4. **If stuck**: declare it, try a fundamentally different approach
5. **If partial**: what's the 20% effort that delivers 80% value?

## Expert Engineering Heuristics
- "If it's hard to test, the design is wrong"
- "If you're writing the same code twice, extract it; if three times, your abstraction is wrong"
- "The best code is the code you don't write" (can you use a library? a built-in?)
- "Premature optimization is root of all evil — but premature abstraction is a close second"
- "Simple is not easy. Simple takes effort."
- "A complex solution to a simple problem is always wrong"
- "When debugging, the error message is never the root cause — it's a symptom"
