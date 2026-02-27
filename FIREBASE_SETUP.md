# Firebase Security Rules Setup

## Problem
The application was throwing `Missing or insufficient permissions` errors when trying to save GEM prompts because Firestore security rules were too restrictive.

## Solution
This repository now includes properly configured Firestore security rules that allow authenticated @alpha.school users to read and write data.

## Files Created
- `firestore.rules` - Security rules for Firestore
- `firebase.json` - Firebase project configuration
- `firestore.indexes.json` - Database indexes configuration

## Security Rules Summary
- ✅ All collections require authentication with @alpha.school email
- ✅ Read access: All authenticated @alpha.school users
- ✅ Write access: All authenticated @alpha.school users
- ❌ Deny all other access

## Deployment Instructions

### Option 1: Deploy via Firebase CLI (Recommended)

1. **Install Firebase CLI** (if not already installed):
```bash
npm install -g firebase-tools
```

2. **Login to Firebase**:
```bash
firebase login
```

3. **Initialize Firebase** (if needed):
```bash
firebase init
# Select: Firestore
# Use existing files: firestore.rules and firestore.indexes.json
```

4. **Deploy the security rules**:
```bash
firebase deploy --only firestore:rules
```

5. **Verify deployment**:
```bash
firebase firestore:rules:get
```

### Option 2: Manual Deployment via Firebase Console

If you prefer to deploy manually:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: `alpha-hsmath-repo`
3. Navigate to **Firestore Database** → **Rules**
4. Copy the contents of `firestore.rules` and paste into the editor
5. Click **Publish**

### Option 3: Copy-Paste Rules (Quick Fix)

Go to Firebase Console → Firestore → Rules and paste this:

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    function isAlphaSchoolUser() {
      return request.auth != null &&
             request.auth.token.email.matches('.*@alpha\\.school$');
    }

    match /gemPrompts/{promptId} {
      allow read, create, update, delete: if isAlphaSchoolUser();
    }

    match /researchItems/{itemId} {
      allow read, create, update, delete: if isAlphaSchoolUser();
    }

    match /decisionLogs/{logId} {
      allow read, create, update, delete: if isAlphaSchoolUser();
    }

    match /scrollytellingReports/{reportId} {
      allow read, create, update, delete: if isAlphaSchoolUser();
    }

    match /stakeholderApprovals/{approvalId} {
      allow read, create, update, delete: if isAlphaSchoolUser();
    }

    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

## Testing

After deploying the rules:

1. Open the app at `/admin/gem-generator`
2. Sign in with your @alpha.school Google account
3. Generate a prompt
4. Click **Save** button
5. Verify the prompt saves successfully without permission errors

## Troubleshooting

### Still getting permission errors?
1. Check that rules are deployed: `firebase firestore:rules:get`
2. Verify you're signed in with @alpha.school email
3. Check browser console for auth token
4. Try signing out and signing back in

### Rules not updating?
- Wait 1-2 minutes for Firebase to propagate the rules
- Hard refresh the browser (Ctrl+Shift+R)
- Clear browser cache

## Security Notes

- ✅ Only @alpha.school email addresses can access the database
- ✅ All writes are authenticated and logged
- ✅ No public access to any data
- ✅ Domain restriction enforced at auth and database level
