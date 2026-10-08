# Security Architecture

## Overview
This document outlines the security measures implemented in Scope Sense Phase 1 and documents known limitations. This is NOT production-grade security — it's the foundation that will be enhanced in later phases.

## Current Security Measures

### 1. Password Security
- **Hashing Algorithm**: bcrypt with automatic salt (via passlib)
- **Centralized Configuration**: All password operations in `app/core/security.py`
- **Never Stored Plaintext**: Passwords are hashed before storage
- **Never Logged**: Password fields are never logged
- **Never Exposed**: `password_hash` never appears in API responses
- **Minimum Length**: 8 characters (enforced in Pydantic schema)

### 2. Authentication & Authorization
- **JWT Tokens**: HS256 signed tokens with configurable expiration
- **Secret Key**: Loaded from environment variables (not hardcoded)
- **Token Claims**: Only user ID and role (no sensitive data)
- **Token Validation**: Server validates each request's token
- **Account Status Check**: Inactive users cannot access protected endpoints
- **Bearer Token**: Standard `Authorization: Bearer <token>` header

### 3. Input Validation
- **Pydantic Schemas**: Strong typing and validation for all API inputs
- **Email Validation**: Proper email format required
- **Password Validation**: Minimum length and complexity enforced
- **Role Validation**: Enum-based role validation (freelancer, client, admin)
- **String Normalization**: Email lowercased, names stripped

### 4. CORS Configuration
- **Configurable Origins**: `BACKEND_CORS_ORIGINS` environment variable
- **Credentials Support**: `allow_credentials=True`
- **Methods & Headers**: All methods and headers allowed (appropriate for dev)
- **Environment-Specific**: Different origins for dev vs production

### 5. Error Handling
- **No Internal Leakage**: Generic error messages (e.g., "Incorrect email or password")
- **Proper HTTP Status Codes**:
  - 201 Created → 401 Unauthorized → 403 Forbidden → 409 Conflict → 422 Unprocessable Entity
- **No Stack Traces**: Errors handled gracefully without exposing internals
- **Timing Attack Resistance**: Login doesn't leak whether email exists

### 6. Email Normalization
- **Consistent Storage**: All emails lowercased and trimmed
- **Duplicate Prevention**: Unique constraints prevent duplicate accounts
- **Lookup Consistency**: Same normalization applied on all lookups

### 7. Database Security
- **UUID Primary Keys**: Harder to guess than sequential IDs
- **Unique Constraint**: Email uniqueness enforced at database level
- **Indexes**: Performance indexes on email and role columns

## Known Limitations (Phase 1)

### Token Storage (Frontend)
**Current Approach**: `localStorage` for JWT access tokens
**Risk**: Vulnerable to XSS (cross-site scripting) attacks
**Mitigation**: 
- JWT tokens contain only user ID and role (least privilege)
- Consider using HttpOnly cookies in production
- Implement Content Security Policy (CSP) headers
- Sanitize all user inputs

**Recommendation**: Switch to **HttpOnly cookies** for production. See "Token Strategy" below.

### Token Revocation
**Current Approach**: Stateless JWT tokens (no server-side revocation)
**Risk**: Stolen tokens remain valid until expiration
**Mitigation**: Short-lived tokens (8-hour default expiration)
**Recommendation**: Implement refresh token rotation with server-side blacklist

### Rate Limiting
**Current Approach**: No rate limiting on authentication endpoints
**Risk**: Brute force attacks on login/register
**Recommendation**: Implement rate limiting (e.g., slowapi or custom middleware)

### Email Verification
**Current Status**: Not implemented
**Risk**: Anyone can register with any email address
**Recommendation**: Implement verification workflow with email confirmation

### Password Reset
**Current Status**: Not implemented
**Risk**: Users cannot recover compromised accounts
**Recommendation**: Implement secure password reset via email verification

### Account Lockout
**Current Status**: No account lockout after failed logins
**Risk**: Unlimited login attempts possible
**Recommendation**: Implement account lockout after N failed attempts

### Logging & Audit Trail
**Current Status**: Minimal logging
**Risk**: No audit trail for security events
**Recommendation**: Implement comprehensive audit logging for auth events

### Password Strength
**Current Approach**: Minimum 8 characters
**Recommendation**: Add requirements for mixed case, numbers, special characters

### HTTPS Enforcement
**Current Status**: Not enforced at application level
**Recommendation**: Use HTTPS in production, configure reverse proxy

## Token Strategy

### Decision: localStorage vs HttpOnly Cookies

**Chosen for Phase 1**: `localStorage` storage on frontend

**Justification**:
1. Simpler to implement and test in initial phases
2. HttpOnly cookies require CSRF protection, adding complexity
3. JWT tokens contain minimal sensitive data (user ID, role only)
4. CORS is configured and can be tightened in production

**Path to Production**:
1. Phase 1: localStorage (current) — documented limitation
2. Future Phase: HttpOnly cookies + CSRF tokens
   - Cookie: `auth_token`, HttpOnly, Secure, SameSite=Strict
   - CSRF token: Double-submit cookie pattern
   - Refresh token: HttpOnly cookie, server-side blacklisted on logout

### JWT Token Design

**Claims in Token**:
| Claim | Purpose | Sensitive? |
|-------|---------|------------|
| `sub` | User ID (UUID) | No — needed for authentication |
| `role` | User's role | No — needed for authorization |
| `exp` | Expiration time | No — required by JWT spec |
| `iat` | Issued at | No — standard JWT claim |
| `type` | Token type | No — for future refresh/access distinction |

**Data NOT in Token**:
- Password ❌
- Password hash ❌
- Email address ❌
- First/last name ❌
- Any PII ❌

### Logout Strategy

**Current Implementation**: Client-side token removal only

**Justification**:
- JWT access tokens are stateless — cannot be invalidated server-side
- For short-lived access tokens without refresh tokens, the risk is limited
- Logout simply removes the token from client storage
- This is documented behavior, not a bug

**Future Improvement**:
- Introduce refresh tokens (stored server-side)
- Logout invalidates the refresh token server-side
- Access token expires naturally after short lifetime

## Security Checklist (Phase 1)

- [x] Passwords hashed with bcrypt, never stored plaintext
- [x] Passwords never logged or returned in API responses
- [x] JWT signed with environment-configurable secret
- [x] JWT tokens contain only non-sensitive claims
- [x] Email normalized to lowercase
- [x] Email uniqueness enforced at database level
- [x] Role validation against known enums
- [x] Account active check in authentication flow
- [x] Proper HTTP status codes for auth errors
- [x] Generic error messages (no information leakage)
- [x] CORS configured for allowed origins
- [x] Database uses UUID primary keys
- [x] Pydantic validation on all inputs
- [ ] Rate limiting (planned for future phase)
- [ ] Email verification (planned for future phase)
- [ ] Password reset (planned for future phase)
- [ ] Account lockout (planned for future phase)
- [ ] HttpOnly cookies (planned for future phase)
- [ ] Refresh token rotation (planned for future phase)
- [ ] CSRF protection (planned for future phase)
- [ ] Audit logging (planned for future phase)
- [ ] CSP headers (planned for future phase)
- [ ] HTTPS enforcement (production concern)

## Environment Security

### `.env` File
- **Never commit `.env` files** — they contain secrets
- `.gitignore` excludes `.env`
- `.env.example` template provided with placeholder values

### Secret Management
- `SECRET_KEY` must be changed for production
- Database passwords in environment variables
- No secrets in source code or commits

## Conclusion

Phase 1 establishes a solid security foundation that covers the critical auth flows. The known limitations are documented and the path to production-grade security is clear. The next phase (Projects) will not require additional security changes unless new attack vectors are introduced.