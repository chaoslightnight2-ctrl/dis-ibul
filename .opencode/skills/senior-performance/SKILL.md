---
name: senior-performance
description: Use when asked to optimize performance, reduce load times, improve Core Web Vitals, or fix slow queries. Triggers on: "performance", "slow", "optimize", "bottleneck", "lazy load", "caching", "hızlandır", "performans".
---

# Senior Performance Optimization Guide

## Measure First
- Never optimize without data
- Use browser DevTools (Lighthouse, Performance tab, Network tab)
- Database: `EXPLAIN ANALYZE`, Prisma query logging
- Real User Monitoring: Core Web Vitals data

## Frontend Priority

### 1. Reduce JavaScript
- Code splitting: dynamic imports for route-based chunks
- Tree shaking: import specific exports, not entire libraries
- Bundle analysis: `next build --debug` or `vite build --analyze`
- Lazy load: heavy components below the fold, modals, tabs

### 2. Optimize Rendering
- React Server Components by default, client components only when needed
- Memoize: `useMemo`/`useCallback` only for expensive computations
- Virtual lists for long collections (react-window, tanstack-virtual)
- Avoid `"use client"` wrapper components that could be server-rendered

### 3. Assets
- Images: next/image with proper sizes, WebP/AVIF, lazy loading
- Fonts: font-display: swap, subset fonts, preload critical fonts
- CSS: purge unused styles, avoid large CSS-in-JS runtime, use Tailwind

### 4. Network
- Prefetch: `prefetch={true}` on navigational links
- Preconnect to critical origins (CDN, API, fonts)
- Stale-while-revalidate for data fetching patterns
- Optimistic updates for mutations

## Backend Priority

### 1. Database
- Missing indexes: check `EXPLAIN ANALYZE` for sequential scans
- N+1 queries: use Prisma `include` with `select`, batch queries
- Connection pooling: configure Prisma pool size for serverless
- Query only needed columns with `select`

### 2. Caching Strategy
- **Static**: CDN cache, ISR for semi-dynamic pages
- **Data**: Redis for API responses, session data, rate limit counters
- **Computation**: memoize pure functions, cache expensive derivations
- **Headers**: proper Cache-Control, ETag, Last-Modified

### 3. Serverless/Edge
- Minimize cold starts: keep dependencies small, use regional deployment
- Stream responses for large payloads
- Avoid synchronous API calls in request path

## Core Web Vitals Targets
- LCP (Largest Contentful Paint): < 2.5s
- FID (First Input Delay) / INP: < 200ms
- CLS (Cumulative Layout Shift): < 0.1
- TTFB (Time to First Byte): < 800ms
