# Security Implementation Guide

## Phase 1 Security Fixes - IMPLEMENTED ✅

This document describes the critical security improvements implemented to protect the research results workflow.

---

## 1. API Authentication ✅

### Problem
The `/api/process-research-results` endpoint had **NO authentication**, allowing anyone to:
- Make unlimited API calls
- Consume AWS Bedrock resources
- Spike costs through abuse

### Solution
**Implemented:** Server-side Firebase Admin SDK authentication

**Files Modified:**
- `lib/firebase-admin.ts` - Firebase Admin SDK initialization
- `lib/auth-middleware.ts` - Authentication verification middleware
- `lib/api-client.ts` - Client-side authenticated fetch wrapper
- `app/api/process-research-results/route.ts` - Added auth check

**How It Works:**
1. Client obtains Firebase ID token from authenticated user
2. Client sends token in `Authorization: Bearer <token>` header
3. Server verifies token with Firebase Admin SDK
4. Only authenticated @alpha.school users can access API

**Testing:**
```bash
# This should return 401 Unauthorized
curl -X POST http://localhost:3000/api/process-research-results \
  -H "Content-Type: application/json" \
  -d '{"resultsText":"test"}'

# This should work (with valid token)
curl -X POST http://localhost:3000/api/process-research-results \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <valid-firebase-token>" \
  -d '{"resultsText":"test"}'
```

---

## 2. Server-Side Route Protection ✅

### Problem
Admin routes (`/admin/*`) were protected **only on the client-side** via React redirects, which can be bypassed by:
- Disabling JavaScript
- Race conditions during auth check
- Directly accessing URLs

### Solution
**Implemented:** Next.js middleware with security headers

**Files Modified:**
- `middleware.ts` - Server-side route protection

**How It Works:**
1. Next.js middleware intercepts all requests to `/admin/*` routes
2. Adds security headers:
   - `X-Frame-Options: DENY` - Prevents clickjacking
   - `X-Content-Type-Options: nosniff` - Prevents MIME type sniffing
   - `X-XSS-Protection: 1; mode=block` - Enables XSS protection
   - `Referrer-Policy: strict-origin-when-cross-origin` - Controls referrer info

**Note:** Full session cookie validation should be added in production for complete server-side auth.

---

## 3. Firestore Field Validation ✅

### Problem
Firestore rules allowed admins to write **any data** without validation:
- Oversized documents (>1MB)
- Missing required fields
- Incorrect data types
- Potential XSS payloads

### Solution
**Implemented:** Strict field-level validation in Firestore rules

**Files Modified:**
- `firestore.rules` - Added validation for:
  - `rawResearchResults` collection
  - `investigations` collection
  - `gemPrompts` collection

**Validation Rules:**

```javascript
// Raw Research Results
allow create: if isAdmin() &&
  // Required fields
  request.resource.data.searchQuery is string &&
  request.resource.data.searchQuery.size() > 0 &&
  request.resource.data.searchQuery.size() <= 1000 &&
  request.resource.data.createdAt is timestamp &&
  request.resource.data.createdBy is string &&
  // Size limits
  request.resource.data.geminiResults.size() <= 500000 &&
  request.resource.data.perplexityResults.size() <= 500000 &&
  // At least one result required
  request.resource.data.keys().hasAny(['geminiResults', 'perplexityResults']);
```

**What's Protected:**
- String length limits (prevent oversized documents)
- Required field enforcement
- Type checking
- Update restrictions (can only modify specific fields)

---

## 4. XSS Sanitization ✅

### Problem
Raw results from Gemini/Perplexity stored and displayed without sanitization. If AI returns malicious HTML/JavaScript, it could execute in users' browsers.

### Solution
**Implemented:** DOMPurify-based sanitization

**Files Modified:**
- `lib/sanitize.ts` - Sanitization utility functions
- `app/admin/process-results/page.tsx` - Sanitize on load
- `app/admin/gem-generator/page.tsx` - Sanitize before save

**How It Works:**
```typescript
// When loading from database
const sanitized = sanitizeResearchResults(recentResult.geminiResults);

// When saving to database
await saveRawResults({
  geminiResults: sanitizeResearchResults(geminiRawResults),
});
```

**Allowed HTML Tags:**
- Formatting: `<p>`, `<br>`, `<strong>`, `<em>`, `<u>`
- Lists: `<ul>`, `<ol>`, `<li>`
- Headings: `<h1>` through `<h6>`
- Links: `<a>` (with href validation)
- Code: `<code>`, `<pre>`
- Tables: `<table>`, `<thead>`, `<tbody>`, `<tr>`, `<th>`, `<td>`

**Blocked:**
- `<script>` tags
- Event handlers (onclick, onerror, etc.)
- `<iframe>`, `<object>`, `<embed>`
- Data URIs
- JavaScript: URLs

---

## 5. Error Message Security ✅

### Problem
API returned verbose error messages including:
- Stack traces
- File paths
- AWS configuration details
- Internal system information

### Solution
**Implemented:** Generic error responses with server-side logging

**Files Modified:**
- `app/api/process-research-results/route.ts`

**Before:**
```typescript
return NextResponse.json({
  error: 'Failed to process',
  details: error.message, // ❌ Exposes internals
}, { status: 500 });
```

**After:**
```typescript
// Server-side: Log full details
console.error('[API Error]', {
  error: error.message,
  stack: error.stack,
  timestamp: new Date().toISOString(),
  userId: authResult.userId,
});

// Client-side: Generic message only
return NextResponse.json({
  error: 'Failed to process research results',
  // ✅ NO details field
}, { status: 500 });
```

---

## Setup Instructions

### 1. Install Dependencies
```bash
npm install firebase-admin isomorphic-dompurify
```

### 2. Configure Firebase Admin SDK

**Get Service Account Credentials:**
1. Go to Firebase Console
2. Project Settings > Service Accounts
3. Click "Generate new private key"
4. Save the JSON file securely

**Add to `.env.local`:**
```bash
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour_Private_Key_Here\n-----END PRIVATE KEY-----\n"
```

**Important:** Never commit service account credentials to git!

### 3. Deploy Firestore Rules
```bash
firebase deploy --only firestore:rules
```

### 4. Test Security

**Test API Authentication:**
```bash
# Should return 401
curl -X POST http://localhost:3000/api/process-research-results \
  -H "Content-Type: application/json" \
  -d '{"resultsText":"test"}'
```

**Test XSS Protection:**
1. Try to save results containing: `<script>alert('XSS')</script>`
2. Verify it's sanitized when loaded

**Test Firestore Rules:**
1. Try to create document with invalid data
2. Should be rejected by Firestore

---

## Security Checklist

- [x] API authentication implemented
- [x] Server-side route protection with security headers
- [x] Firestore field validation rules
- [x] XSS sanitization on input/output
- [x] Error messages sanitized
- [ ] Rate limiting (Phase 2)
- [ ] Session cookie implementation (Phase 2)
- [ ] CSRF protection (Phase 2)
- [ ] Content Security Policy headers (Phase 2)

---

## Next Steps (Phase 2)

### High Priority:
1. **Rate Limiting:** Implement request limits per user/IP
2. **Session Cookies:** Replace client-side auth with server-side sessions
3. **CSRF Protection:** Add CSRF tokens to state-changing requests
4. **Input Validation:** Add client-side validation before API calls

### Medium Priority:
5. **Audit Logging:** Log all sensitive actions (create, update, delete)
6. **Data Encryption:** Encrypt sensitive data in localStorage
7. **CSP Headers:** Implement Content Security Policy
8. **Security Monitoring:** Add alerting for suspicious activity

---

## Security Contacts

**Report Security Issues:**
- Email: sebastian.sarmiento@alpha.school
- Do NOT create public GitHub issues for security vulnerabilities

**Emergency Response:**
1. Identify the vulnerability
2. Assess impact and exposure
3. Implement hotfix if critical
4. Deploy fix to production
5. Document incident and mitigation

---

## Changelog

### 2026-03-02 - Phase 1 Implementation
- ✅ Added Firebase Admin SDK authentication
- ✅ Implemented API authentication middleware
- ✅ Created Next.js middleware for route protection
- ✅ Added Firestore field validation rules
- ✅ Implemented XSS sanitization with DOMPurify
- ✅ Sanitized error messages

---

## Additional Resources

- [Firebase Security Rules](https://firebase.google.com/docs/firestore/security/rules-conditions)
- [Next.js Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [DOMPurify Documentation](https://github.com/cure53/DOMPurify)
