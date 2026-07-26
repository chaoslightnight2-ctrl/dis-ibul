---
name: senior-web-research
description: Use when asked to research, investigate, find information, or gather data from the web. Triggers on: "research", "araştır", "search the web", "find", "investigate", "look up", "web search".
---

# Senior Web Research Methodology

## Research Process
1. **Clarify the question** — What exactly are we trying to find? Break into sub-questions
2. **Choose sources** — Official docs, GitHub, academic papers, blogs, forums
3. **Search strategically** — Multiple queries, different phrasings, use operators
4. **Extract and cite** — Pull relevant snippets, ALWAYS save the source URL
5. **Synthesize** — Combine findings into coherent answer, note contradictions
6. **Verify** — Cross-check critical claims across 2+ independent sources

## Search Strategy
- Start broad, then narrow: general query → specific terms → exact phrases
- Use multiple search providers for different angles
- For code: GitHub search, npm registry, library docs
- For issues: GitHub Issues, Stack Overflow, Discord/forum archives
- For architecture: official docs, comparison articles, migration guides

## Working with Firecrawl Plugin
The opencode-firecrawl plugin adds these capabilities:
- **Scrape** a URL to clean markdown content
- **Search** the web with auto-scraping of top results
- **Crawl** entire sites for comprehensive coverage
- **Map** all URLs on a domain
- **Extract** structured data using schemas
- **Agent** mode for autonomous multi-page research

## Using Context7 MCP
For library/framework documentation:
- Ask for the latest API docs: "Use Context7 to get the latest X docs"
- Context7 fetches fresh docs so you don't rely on stale training data
- Always use Context7 for Next.js, React, Prisma, or any fast-moving framework

## Output Format
After research, present findings as:
```
## Research: [Topic]
**Sources:**
- [Title](url) — key takeaway
- [Title](url) — key takeaway

**Summary:**
[2-3 paragraph synthesis of findings]

**Key Decisions:**
- Decision 1 with rationale
- Decision 2 with rationale
```
