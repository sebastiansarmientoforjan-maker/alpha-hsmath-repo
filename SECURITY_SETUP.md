# Phase 1 Security Setup Guide

## ✅ What Was Implemented

All Phase 1 critical security fixes have been successfully implemented and committed:

1. **API Authentication** - Firebase Admin SDK protects `/api/process-research-results`
2. **Server-side Route Protection** - Next.js middleware adds security headers
3. **Firestore Field Validation** - Strict rules prevent malicious data
4. **XSS Sanitization** - DOMPurify sanitizes all user input
5. **Error Message Security** - No system info leaked to clients

---

## 🔧 Required Setup Steps

### Step 1: Get Firebase Admin Service Account

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Go to **Project Settings** (⚙️ gear icon)
4. Click **Service Accounts** tab
5. Click **"Generate new private key"**
6. Save the downloaded JSON file securely (DO NOT commit to git!)

### Step 2: Add Environment Variables

Open your `.env.local` file and add these lines:

```bash
# Firebase Admin SDK (Server-side authentication)
FIREBASE_PROJECT_ID=your-actual-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour_Actual_Private_Key_Here\n-----END PRIVATE KEY-----\n"
```

**How to get values from the JSON file:**
- `FIREBASE_PROJECT_ID` = `project_id` field
- `FIREBASE_CLIENT_EMAIL` = `client_email` field
- `FIREBASE_PRIVATE_KEY` = `private_key` field (keep the quotes and \n characters)

### Step 3: Deploy Firestore Rules

Deploy the updated security rules to Firebase:

```bash
# If not logged in to Firebase CLI:
firebase login

# Deploy rules
firebase deploy --only firestore:rules
```

You should see:
```
✔  Deploy complete!
```

### Step 4: Restart Development Server

```bash
# Stop current server (Ctrl+C)
# Start fresh
npm run dev
```

### Step 5: Test Security

**Test 1: API Authentication**
```bash
# This should return 401 Unauthorized
curl -X POST http://localhost:3000/api/process-research-results \
  -H "Content-Type: application/json" \
  -d '{"resultsText":"test"}'
```

**Test 2: XSS Protection**
1. Go to GEM Generator
2. Paste this in raw results: `<script>alert('XSS')</script>`
3. Save raw results
4. Go to Process Results
5. Verify the script is sanitized (shows as plain text, doesn't execute)

**Test 3: Authenticated API Call**
1. Sign in to the app
2. Go to Process Results
3. Load auto-loaded results
4. Click "Process with Claude"
5. Should work successfully

---

## 🚨 Important Security Notes

### DO NOT:
- ❌ Commit service account JSON file to git
- ❌ Commit `.env.local` file to git
- ❌ Share private key in Slack/email
- ❌ Deploy without setting environment variables

### DO:
- ✅ Keep service account JSON in a secure password manager
- ✅ Use different service accounts for dev/staging/production
- ✅ Rotate service account keys regularly (every 90 days)
- ✅ Enable Firebase App Check for production
- ✅ Set up API key restrictions in Google Cloud Console

---

## 🔍 Verification Checklist

Before deploying to production, verify:

- [ ] Firebase Admin SDK environment variables are set
- [ ] Firestore rules are deployed
- [ ] Dev server starts without errors
- [ ] API authentication test returns 401
- [ ] Authenticated API calls work
- [ ] XSS sanitization is working
- [ ] No sensitive data in console logs
- [ ] All admin routes load correctly

---

## 🐛 Troubleshooting

### Error: "Failed to authenticate"
**Cause:** Firebase Admin SDK credentials not configured

**Fix:**
1. Check `.env.local` has all three Firebase Admin variables
2. Verify private key is wrapped in quotes
3. Restart dev server

### Error: "Missing permission on Firestore"
**Cause:** Firestore rules not deployed or incorrectly configured

**Fix:**
```bash
firebase deploy --only firestore:rules
```

### Error: "Cannot find module 'firebase-admin'"
**Cause:** Dependencies not installed

**Fix:**
```bash
npm install
```

### API returns 401 even when signed in
**Cause:** Token not being sent or expired

**Fix:**
1. Sign out and sign in again
2. Check browser console for errors
3. Verify `authenticatedFetch` is being used (not plain `fetch`)

---

## 📚 Documentation

- Full details: `SECURITY.md`
- Environment variables: `.env.local.example`
- Firestore rules: `firestore.rules`

---

## 🎯 Next Steps (Phase 2)

After verifying Phase 1 works:

1. **Rate Limiting** - Prevent API abuse
2. **Session Cookies** - Server-side session management
3. **Toast Notifications** - Replace alert() dialogs
4. **Breadcrumb Navigation** - Improve user flow
5. **Error Boundaries** - Graceful error handling

See the main analysis document for full Phase 2 recommendations.

---

## ✅ Deployment Checklist

When deploying to production:

- [ ] Set Firebase Admin environment variables in Vercel/hosting platform
- [ ] Deploy Firestore rules: `firebase deploy --only firestore:rules`
- [ ] Enable Firebase App Check
- [ ] Set up Google Cloud Console API restrictions
- [ ] Configure CORS if needed
- [ ] Set up monitoring/alerting for API errors
- [ ] Test all security measures in production
- [ ] Document deployment date and version

---

## 📞 Support

Issues with setup? Contact sebastian.sarmiento@alpha.school

**Report Security Vulnerabilities:**
- Email (not GitHub issues): sebastian.sarmiento@alpha.school
- Include: Description, steps to reproduce, impact assessment
