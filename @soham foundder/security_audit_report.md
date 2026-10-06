# Security Audit Report

**Date**: October 7, 2026  
**Scope**: `@soham foundder` project, focused on `card-arena-ui`, `7 lavni`, and shared runtime configuration.

## Executive Summary
This audit reviewed the current implementation of the card game stack and found that the codebase has improved over the earlier draft in several areas, including room ID generation, idle room cleanup, and room-creation throttling. However, the project still has important security issues that should be resolved before production use.

The most serious concern is secret exposure: real Clerk, Supabase, and JWT credentials are present in a committed `.env` file. In addition, the admin API is exposed without a clear authorization check, and the app uses permissive CORS settings that allow any origin. These issues create a realistic path for credential theft, data exposure, and unauthorized access.

Overall risk rating: High.

---

## Positive Security Controls Observed
- Room IDs in the `7 lavni` backend are now generated with a cryptographic source (`crypto.randomBytes`) instead of `Math.random()`.
- Idle rooms are auto-cleaned to help prevent memory exhaustion attacks.
- Room creation in `card-arena-ui/server.js` includes a rate limit to reduce spam and abuse.
- Game actions are primarily validated on the server rather than trusting the browser.
- Static assets are served from a dedicated `public` directory instead of the project root, which reduces accidental exposure.

---

## Findings

### 1. Critical: Secrets are committed to the repository
**Location**: `.env` and `.env.example` in the project root.

**Evidence**: The checked-in `.env` file contains:
- `CLERK_SECRET_KEY`
- `SUPABASE_SECRET_KEY`
- `SUPABASE_JWT_SECRET`
- public and publishable keys for Clerk and Supabase

**Risk**: Anyone with repository access can harvest live credentials, impersonate services, forge JWTs, or abuse external APIs. This is a direct compromise path for authentication, user management, and backend trust assumptions.

**Recommendation**:
- Remove `.env` from the repository immediately.
- Rotate all exposed keys and regenerate secrets.
- Move configuration to a secret manager or deployment environment variable injection.
- Add a pre-commit secret scanning step (`gitleaks`, `detect-secrets`, or GitHub secret scanning).

---

### 2. High: Admin user API is exposed without clear authorization enforcement
**Location**: `card-arena-ui/server.js`

**Relevant code**:
```javascript
app.get('/api/admin/users', async (req, res) => {
  try {
    const response = await fetch('https://api.clerk.com/v1/users', {
      headers: {
        'Authorization': `Bearer ${process.env.CLERK_SECRET_KEY}`
      }
    });
    ...
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
```

**Risk**: This route is not restricted to an authenticated admin session or role check. If the endpoint is reachable from a public or semi-public environment, attackers may enumerate users and harvest account metadata. The route also creates a server-side dependency on a secret key that is not intentionally scoped to a restricted admin flow.

**Recommendation**:
- Require an authenticated admin session with verified role claims.
- Validate `req.user` or session claims before serving any account data.
- Restrict access by IP or trusted network path in production.
- Rate-limit this endpoint to reduce enumeration and scraping.

---

### 3. High: CORS is configured to allow all origins
**Location**: `card-arena-ui/server.js` and `7 lavni/server/server.js`

**Relevant code**:
```javascript
const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});
```

**Risk**: Opening CORS to all origins allows cross-origin access from untrusted websites and increases the blast radius of credential leaks, token misuse, and abuse of public endpoints. In a production game backend, broad CORS is not appropriate unless the service is deliberately public and tightly scoped.

**Recommendation**:
- Replace `origin: '*'` with an explicit allowlist.
- Restrict methods to the exact API surface needed.
- Enforce HTTPS and proper cookie/session policies for any authenticated paths.

---

### 4. Medium: JWT verification is present, but trust boundaries are still fragile
**Location**: `card-arena-ui/server.js`

**Relevant code**:
```javascript
const jwtSecret = process.env.SUPABASE_JWT_SECRET;
jwt.verify(token, jwtSecret, (err, decoded) => {
  if (err) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
  req.user = decoded;
  next();
});
```

**Risk**: The endpoint validates a JWT using a shared secret, but there is no explicit issuer/audience/tenant validation in the code shown. If the application is deployed across multiple environments or uses shared secrets, a misconfigured secret or replayed token could lead to incorrect trust decisions.

**Recommendation**:
- Validate `iss`, `aud`, `exp`, and token subject claims.
- Use environment-specific secrets and separate development/production keys.
- Reject tokens generated for the wrong audience or issuer.

---

### 5. Medium: Socket event input validation should be hardened
**Location**: socket handlers in `card-arena-ui/server.js` and `7 lavni/server/server.js`

**Risk**: These handlers accept messages from clients and rely heavily on server-side room state checks. While the game logic appears authoritative, the code would benefit from schema validation, strict type checking, and guard clauses to reject malformed payloads early.

**Recommendation**:
- Validate `roomId`, `userId`, `seatIndex`, and `cardId` before performing actions.
- Reject unexpected types and oversized payloads.
- Log suspicious invalid attempts for abuse monitoring.

---

## Summary of Current Risk
| Severity | Finding | Status |
| --- | --- | --- |
| Critical | Exposed secrets in committed `.env` | Open |
| High | Unauthenticated admin user endpoint | Open |
| High | Wildcard CORS configuration | Open |
| Medium | JWT validation is incomplete | Open |
| Medium | Socket payload validation needs hardening | Open |

---

## Remediation Priority
1. Rotate and replace all leaked credentials immediately.
2. Remove `.env` from source control and enforce secret scanning in CI.
3. Lock down `/api/admin/users` behind verified admin authorization.
4. Replace wildcard CORS with a strict allowlist.
5. Add schema validation to socket event payloads and security logging.
6. Continue regular dependency audits and npm vulnerability checks.

---

## Final Assessment
The project is not yet production-ready from a security perspective. The codebase shows significant improvements compared to the earlier version, but the remaining security issues are centered on identity and access control rather than gameplay logic. Addressing credential hygiene and admin access controls should be the first priority.
