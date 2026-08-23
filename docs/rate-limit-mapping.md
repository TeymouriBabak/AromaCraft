# Rate limit mapping (patch-ready)

This file maps endpoints to limiter keys, limits, Redis behavior, and test cases. Do NOT apply changes yet — this is a patch-ready plan for Phase 3 implementation.

## Guidelines

- Always apply both per-identifier and per-IP checks where applicable.
- Use hashed identifiers in Redis keys (SHA256/HMAC) to avoid PII in Redis keys.
- Fail-closed on Redis unavailability (deny) for auth-critical endpoints.

---

### 1) `POST /api/auth/login` -> `src/pages/api/auth/login.ts`

- Keys:
  - `login_id:{sha256(identifier)}` (identifier = normalized email or username)
  - `login_ip:{ip}`
- Limits:
  - identifier: 5 attempts / 900s (15m)
  - ip: 50 attempts / 3600s (1h)
- Redis behavior:
  - use `checkRateLimit(key, limit, window)`; if Redis unavailable -> deny (return 429 with generic message)
- Tests:
  - repeat 6 failed logins for same identifier -> expect 429 on 6th
  - repeat 51 attempts from same IP with different identifiers -> expect 429
  - Redis mock unavailable -> expect generic deny and 503 or 429 depending on policy (current: 429)

### 2) `POST /api/auth/signup` -> `src/pages/api/auth/signup.ts`

- Keys:
  - `signup_ip:{ip}`
  - `signup_email:{sha256(email)}`
- Limits:
  - ip: 5 / 3600s (1h)
  - email: 3 / 3600s
- Redis behavior: fail-closed
- Tests:
  - 6 signup attempts from same IP -> 429 on 6th
  - 4 signup attempts for same email -> 429 on 4th

### 3) `POST /api/auth/resend-verification` -> `src/pages/api/auth/resend-verification.ts`

- Keys:
  - `otp_resend:{sha256(email)}`
  - `otp_resend_ip:{ip}`
- Limits:
  - email: 3 / 3600s
  - ip: 30 / 3600s
- Redis behavior: fail-closed
- Tests:
  - resend 4 times for same email -> 429 on 4th
  - ensure after resend older OTPs reject (existing tests cover)

### 4) `POST /api/auth/verify-account` -> `src/pages/api/auth/verify-account.ts`

- Keys:
  - `otp_verify_id:{tokenId}`
  - `otp_verify_email:{sha256(email)}`
- Limits:
  - tokenId: 5 / 900s
  - email attempts: 10 / 3600s
- Redis behavior: fail-closed
- Tests:
  - 6 incorrect OTP attempts for tokenId -> 429 on 6th
  - multiple invalid attempts escalate to temporary block

### 5) `POST /api/auth/forgot-password` & `POST /api/auth/forgot-username`

- Keys:
  - `forgot:{sha256(email_or_mobile)}`
  - `forgot_ip:{ip}`
- Limits:
  - identifier: 3 / 3600s
  - ip: 30 / 3600s
- Redis behavior: fail-closed
- Tests:
  - repeated forgot requests -> 429 after limit

### 6) `GET /api/auth/check-username`, `GET /api/auth/check-email`, `GET /api/auth/check-mobile`

- Keys:
  - `lookup_ip:{ip}`
- Limits:
  - ip: 30 / 600s (10m)
- Redis behavior: degrade to require CAPTCHA or return 429 (prefer 429)
- Tests:
  - enumerate 31 checks from IP -> 429

### 7) `POST /api/auth/upload-avatar` -> DOS/file abuse protections

- Keys:
  - `avatar_user:{userId}`
  - `avatar_ip:{ip}`
- Limits:
  - user: 20 / 86400s (day)
  - ip: 200 / 86400s
- Redis behavior: fail-closed; also enforce file size limits
- Tests:
  - 21 uploads by user -> 429

### 8) Dev endpoints: `src/pages/api/dev/*`

- Behavior:
  - Deny in production (check NODE_ENV). In dev, keep limited to 10/min per IP.
- Tests:
  - ensure production denies access

---

## Implementation checklist (patch-ready)

- Update `RATE_LIMIT_CONFIG` in `src/lib/redis.ts` with above named configs.
- Add `rateLimitMiddleware` usage to each handler (wrap or call inside handler) and enforce both per-identifier and per-IP keys.
- Add helper `keyForIdentifier(type, identifier)` that normalizes then returns hashed key.
- Add tests under `tests/rate-limit.*.test.ts` for each mapping above and a Redis-unavailable test.

Commit will include: modifications to `src/lib/redis.ts`, new helper in `src/lib/middleware/rateLimit.ts` (if needed), updates to endpoint handlers, and tests.

---

Current stable commit: 2779c87
