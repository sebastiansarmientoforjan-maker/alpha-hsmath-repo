# 🔥 QUICK FIX: Deploy Firebase Rules

## ⚡ FASTEST METHOD (2 minutes)

### Step 1: Login to Firebase Console
1. Go to: https://console.firebase.google.com/
2. Select project: **alpha-hsmath-repo**
3. Click **Firestore Database** in the left sidebar
4. Click **Rules** tab at the top

### Step 2: Copy-Paste These Rules
Replace ALL existing rules with this:

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

### Step 3: Publish
Click the blue **Publish** button

### Step 4: Test
1. Refresh your app
2. Sign in with @alpha.school account
3. Try saving a GEM prompt
4. ✅ Should work now!

---

## 🛠️ ALTERNATIVE: Deploy via CLI

If you want to use Firebase CLI instead:

```bash
# 1. Login to Firebase
firebase login

# 2. Select the project
firebase use alpha-hsmath-repo

# 3. Deploy rules
firebase deploy --only firestore:rules
```

---

## ❓ What was the problem?

The Firestore security rules were blocking ALL writes, even from authenticated users. The new rules allow:
- ✅ Read/Write for authenticated @alpha.school users
- ❌ Deny everyone else
