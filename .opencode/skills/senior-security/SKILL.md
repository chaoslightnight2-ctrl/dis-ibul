---
name: senior-security
description: Use when asked about security, authentication, authorization, data protection, or vulnerability prevention. Triggers on: "security", "auth", "vulnerability", "XSS", "SQL injection", "CORS", "CSP", "güvenlik", "RBAC", "encryption", "rate limit".
---

# Senior Security Guide

## Authentication & Authorization
- Use battle-tested auth libraries (Better Auth, NextAuth, Lucia)
- Hash passwords with bcrypt/argon2 — never store plaintext
- JWT: short expiry (15min access, 7d refresh), rotate refresh tokens
- Session: httpOnly, secure, sameSite cookies; rotate session ID on login
- MFA for admin/sensitive operations

## API Security
- Input validation at EVERY endpoint boundary (Zod schemas)
- Rate limiting: per-IP and per-user, different limits per endpoint sensitivity
- Pagination on ALL list endpoints (prevent data scraping)
- Request size limits, timeout limits
- Idempotency keys for mutation endpoints

## Frontend Security
- CSP headers: restrict script/style sources, report violations
- Never render unsanitized HTML (use DOMPurify if needed)
- CSRF tokens on state-changing requests (or use SameSite cookies)
- No sensitive data in URL params, localStorage, or client state

## Database Security
- Parameterized queries (Prisma does this by default — never raw SQL with string concat)
- Least privilege DB user: only necessary schemas/tables
- Encrypt PII at rest (column-level encryption)
- Audit logs for all data access and mutations
- Regular backup rotation with encryption

## Infrastructure
- HSTS headers, HTTPS enforced
- CORS: allow only specific origins, not `*`
- Docker: don't run as root, use read-only filesystem where possible
- Secrets: env vars only, never in code, use secret manager in prod
- Dependencies: regularly audit with `npm audit`, update vulnerable packages

## GDPR/KVKK Compliance
- Explicit consent before collecting personal data
- Data minimization: only collect what's needed
- Right to access, rectify, delete user data
- Data Processing Agreement (DPA) with third-party providers
- Breach notification procedure in place
- Privacy policy and cookie consent banner

## Common Vulnerabilities (Checklist)
- [ ] SQL injection: parameterized queries only
- [ ] XSS: output encoding, CSP headers
- [ ] CSRF: SameSite cookies or tokens
- [ ] Path traversal: validate file paths, use allowlist
- [ ] IDOR: check resource ownership before access
- [ ] Mass assignment: whitelist allowed fields
- [ ] Open redirect: validate redirect URLs
- [ ] Insecure deserialization: validate shape before use
