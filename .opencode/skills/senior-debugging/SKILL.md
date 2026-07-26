---
name: senior-debugging
description: Use when asked to fix a bug, investigate an issue, troubleshoot errors, or debug a problem. Triggers on: "bug", "error", "fix", "broken", "not working", "fail", "hata", "çalışmıyor", "debug", "issue".
---

# Senior Debugging Methodology

## 1. Reproduce First
- Get the exact steps, input data, environment
- Check if it's consistent or intermittent
- Note the exact error message and stack trace

## 2. Isolate the Layer
- **Client?** Network tab, React DevTools, console errors
- **Server?** Server logs, API response, status codes
- **Database?** Raw query, Prisma Studio, connection pool
- **Infrastructure?** Docker logs, disk space, memory, network

## 3. Binary Search Approach
- Comment out half the code → check if error persists
- Bisect recent commits: `git bisect`
- Narrow by layer: UI → API → Service → DB

## 4. Common Root Causes (check these FIRST)
- **Type mismatch**: runtime type !== TypeScript type
- **Async timing**: race condition, unawaited promise, stale closure
- **Missing dependency**: package not installed, wrong version
- **Environment**: different Node/DB version, missing env var
- **State**: stale React state, wrong initial value, mutation
- **Auth**: expired token, wrong scope, missing cookie
- **Null/undefined**: optional chain missing, bad API response shape

## 5. Debugging Tools by Layer
```bash
# Server
curl -v https://api.example.com/endpoint
docker compose logs app
tail -f logs/app.log

# Database
npx prisma studio
docker compose exec db psql -U user -d db -c "SELECT * FROM ..."

# Client
console.log -> browser DevTools -> React DevTools -> Network tab
```

## 6. Fix with Confidence
- Understand the ROOT CAUSE, not just the symptom
- Write a failing test that reproduces the bug FIRST
- Apply the fix
- Verify the test passes AND the fix works end-to-end
- Consider: "Could this fix introduce a new bug?"
- Add logging/error handling to prevent silent recurrence
