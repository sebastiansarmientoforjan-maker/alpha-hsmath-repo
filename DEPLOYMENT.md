# Deployment Guide - HS Math Documentation & Analysis Hub

This guide will help you deploy the HS Math Documentation & Analysis Hub for Alpha School to Vercel.

## Prerequisites

1. A Vercel account (https://vercel.com)
2. A Firebase project (https://console.firebase.google.com)
3. Git repository (GitHub, GitLab, or Bitbucket)

## Firebase Setup

### 1. Create a Firebase Project

1. Go to https://console.firebase.google.com
2. Click "Add Project"
3. Follow the wizard to create your project
4. Enable Google Analytics (optional)

### 2. Enable Firestore Database

1. In your Firebase console, go to "Firestore Database"
2. Click "Create database"
3. Choose production mode
4. Select a location close to your users

### 3. Enable Firebase Storage

1. In your Firebase console, go to "Storage"
2. Click "Get started"
3. Accept the default security rules for now
4. Click "Done"

### 4. Create Collections

Firestore collections will be created automatically when you first add data, but the structure is:

- `decision_logs`: Stores pedagogical decisions and findings
- `scrollytelling_reports`: Stores metadata for uploaded HTML reports

### 5. Get Firebase Configuration

1. Go to Project Settings (gear icon)
2. Scroll to "Your apps" section
3. Click the web icon (`</>`) to create a web app
4. Copy the configuration values

## Vercel Deployment

### 1. Push Code to Git Repository

```bash
cd /path/to/repositorio-investigacion-viva
git add .
git commit -m "Initial commit - Living Research Repository"
git push origin main
```

### 2. Import Project to Vercel

1. Go to https://vercel.com/new
2. Import your Git repository
3. Vercel will automatically detect Next.js

### 3. Configure Environment Variables

In the Vercel dashboard, add the following environment variables:

```
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 4. Deploy

Click "Deploy" and wait for the build to complete.

## Post-Deployment Configuration

### 1. Update Firebase Security Rules

#### Firestore Rules

Go to Firestore → Rules and update:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read access to published reports
    match /scrollytelling_reports/{report} {
      allow read: if resource.data.status == 'Published';
      allow write: if request.auth != null; // Add authentication later
    }

    // Allow read access to decision logs
    match /decision_logs/{log} {
      allow read: if true;
      allow write: if request.auth != null; // Add authentication later
    }
  }
}
```

#### Storage Rules

Go to Storage → Rules and update:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /scrollytelling_files/{filename} {
      allow read: if true;
      allow write: if request.auth != null; // Add authentication later
    }
  }
}
```

### 2. Add Authentication (Optional but Recommended)

To protect the admin panel:

1. Enable Firebase Authentication (Email/Password or Google)
2. Update the app to use Firebase Auth
3. Protect `/admin` routes with authentication middleware

## Local Development

To run the project locally:

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.local.example .env.local
# Edit .env.local with your Firebase credentials

# Run development server
npm run dev
```

Open http://localhost:3000 in your browser.

## Project Structure

```
repositorio-investigacion-viva/
├── app/
│   ├── admin/              # Admin panel routes
│   │   ├── decision-logs/  # Decision log management
│   │   └── scrollytelling/ # Report upload interface
│   ├── gallery/            # Public gallery view
│   └── layout.tsx          # Root layout
├── components/
│   └── ui/                 # Neobrutalist UI components
├── lib/
│   ├── firebase.ts         # Firebase initialization
│   ├── uploadHtmlReport.ts # Report upload logic
│   └── decisionLogs.ts     # Decision log CRUD
└── public/                 # Static assets
```

## Usage

### Admin Panel

1. Go to `/admin` to access the dashboard
2. Upload HTML reports in "Scrollytelling Reports"
3. Document decisions in "Decision Logs"
4. Set report status to "Published" to make them visible

### Public Gallery

1. Go to `/gallery` to view published reports
2. Click report cards to switch the iframe view
3. Share this URL with stakeholders

## Troubleshooting

### "No reports showing in gallery"

- Make sure reports are set to "Published" status
- Check Firebase console for data
- Verify environment variables in Vercel

### "Upload failing"

- Check Firebase Storage is enabled
- Verify environment variables
- Check browser console for errors

### "Build failing on Vercel"

- Ensure all environment variables are set
- Check build logs for specific errors
- Verify package.json dependencies

## Support

For issues or questions, refer to:
- Next.js Documentation: https://nextjs.org/docs
- Firebase Documentation: https://firebase.google.com/docs
- Vercel Documentation: https://vercel.com/docs
