# AGENTS.md

This file defines mandatory rules for working in this repository.
All agents must follow these rules before and after making changes.

---

## 0. Priority

Feature delivery comes first,
but **security and data integrity must NEVER be compromised**.

When in doubt:

* Implement the feature
* Apply rules as much as possible
* **NEVER skip security or access control**
* Leave TODOs only for structural improvements (not for security issues)

---

## 1. Stack

* Framework: Next.js 15 App Router
* Language: TypeScript (strict)
* ORM: Prisma + SQLite (→ PostgreSQL planned)
* Validation: Zod
* Auth: Session-based (hashed token in DB)
* Password: Argon2id
* Encryption: AES-256-GCM (PersonSection)
* Testing: Vitest

---

## 2. Architecture Rules

### route.ts — allowed only:

* Auth / permission handling
* Request parsing
* Zod validation
* Service calls only (**no business logic**)
* HTTP response mapping
* Request-level audit logging

### route.ts — forbidden:

* Direct Prisma usage
* Multi-step DB writes
* Transaction logic
* Large DTO construction
* Role/type branching
* Manual complex validation

---

### service

Must contain:

* Business flow orchestration
* Transaction boundaries (`prisma.$transaction`)
* Role/type logic
* Create/update/delete logic

Must NOT:

* Build large DTOs inline
* Mix unrelated flows in one file

---

### helper

Must contain:

* DTO builders
* Payload builders
* Profile/section merge logic
* Data transformation

---

### validation

* All inputs must use Zod
* Complex rules must use `refine` / `superRefine`
* No manual branching validation

---

### query / repository

* Extract repeated Prisma queries
* Avoid N+1 queries
* Prefer DB filtering over in-memory filtering
* **Exception**: encrypted fields (e.g. name, email stored via AES-256-GCM)
  cannot be filtered at the DB level.
  In these cases, in-memory filtering after decryption is acceptable.
  Long-term solution: maintain a separate plaintext search index column
  (e.g. `accountSearchText`) — planned for PostgreSQL migration.

---

## 3. Anti-Monster Rules

Split code when ANY of these is true:

* Flow touches 3+ tables
* Role/type branching > 2 major branches
* Same logic appears in multiple files
* File becomes hard to read top-to-bottom
* Transaction callback becomes large or complex

Goal:

* route = input → validate → service → response
* service = clear step-by-step orchestration
* details live in helper

---

## 4. Security Rules (MANDATORY)

### A. OWASP Top 10

Always check:

* Access control
* Authentication logic
* Injection risks (SQL, XSS)
* Sensitive data exposure
* Insecure configuration
* Logging coverage

---

### B. No hardcoded secrets

Never commit:

* API keys
* Passwords
* Tokens
* Encryption keys
* DB credentials

Use environment variables only.

---

### C. Authentication / session

Always verify:

* Session expiration works correctly
* Password hashing is secure (Argon2id)
* Session/token validation is enforced
* Logout and invalidation work
* Privilege changes invalidate sessions
* **CSRF protection is preserved for write routes**

---

### D. Input validation & injection

Always ensure:

* All inputs are validated
* No SQL injection paths
* No XSS risks
* Optional inputs are validated if present

---

### E. Authorization / data access

For every route, verify:

* Who can access it?
* What data can they access?
* Can they access another user's data?

Must guarantee:

* No cross-user data leaks
* No cross-role data leaks
* Admin-only routes remain restricted

---

## 5. Project-Specific High-Risk Areas

Extra caution required:

* Login / authentication
* Session handling
* Account creation
* Account update / delete
* Profile read / update
* Information-change approval
* File / photo handling

---

## 6. Audit Logging

* Request-level logging → route
* Business-level logging → service (only if necessary)

Do not mix arbitrarily.

---

## 7. High-Risk Files

| File                       | Risk               |
| -------------------------- | ------------------ |
| src/lib/authz.ts           | Access control     |
| src/lib/session.ts         | Session lifecycle  |
| src/lib/session-cache.ts   | Cache invalidation |
| src/lib/password.ts        | Password hashing   |
| src/lib/person-data.ts     | Encryption         |
| prisma/schema.prisma       | DB schema          |
| middleware.ts              | Route protection   |
| src/lib/api-csrf-policy.ts | CSRF protection    |

When modifying:

* Read the entire file first
* Check all usages before changing signatures
* Ensure build and tests pass after changes

---

## 8. New API Checklist

Before completing a new route:

* [ ] Authentication/authorization strategy is explicitly chosen
* [ ] `guardApiRequest` is used for protected routes (only omitted for intentionally public routes)
* [ ] Zod validation implemented
* [ ] Business logic is in service (not route)
* [ ] DB writes use transaction if touching multiple tables
* [ ] Audit logging added for write operations
* [ ] ForbiddenError handled correctly
* [ ] No hardcoded secrets
* [ ] No unauthorized data access
* [ ] `npm run check:mutation-audit` passes

---

## 9. Required Commands

All must pass before finishing:

```bash
npm run build
npm run test
npm run check:mutation-audit
```

---

## 10. Key Conventions

### Error handling

* Use `handleAuthzError` for `ForbiddenError`
* Never expose raw errors or stack traces

---

### Naming

* Services: `verb-noun.service.ts`
* Helpers: `verb-noun.helpers.ts`
* Schemas: `noun.schema.ts`

---

### Prisma

* Never use Prisma directly in route.ts
* Multi-table writes must use transactions

After schema changes:

* `npx prisma db push`
* `npx prisma generate`

---

### Environment variables

* Never hardcode secrets or config values
* Add all new variables to `.env.example`

---

## 11. Migration Rules

This project is still evolving.

* New files must follow all rules
* Modified files must follow rules in touched areas
* Do NOT perform large unrelated refactors
* Small refactors to comply with rules are allowed
* Note violations with TODO comments (do not block feature work)
* If a file predates these rules and is NOT being modified, leave it as-is

---

## 12. Self-Check (MUST PASS)

### For new code:

* [ ] route has no Prisma or business logic
* [ ] service owns transaction and flow
* [ ] reusable logic extracted to helper
* [ ] Zod validation exists
* [ ] no hardcoded secrets
* [ ] auth/session logic is correct
* [ ] no unauthorized data access
* [ ] OWASP risks reviewed
* [ ] no injection or XSS risk
* [ ] audit logging present for write operations
* [ ] no duplicate business logic/pathway introduced
* [ ] API response shape preserved
* [ ] build passes
* [ ] tests pass
* [ ] mutation audit passes

---

### For existing code being modified:

* Apply checks only to changed parts
* Do not block feature delivery for unrelated violations
* Do not introduce new violations 
