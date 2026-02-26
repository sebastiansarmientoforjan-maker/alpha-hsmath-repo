# Living Research Repository

A dynamic ecosystem for documenting pedagogical decisions, showcasing real-time telemetry, and hosting immersive research reports through scrollytelling for the Alpha Math program.

## Features

- **Scrollytelling Reports**: Upload and display immersive HTML reports with interactive visualizations
- **Decision Logs**: Document pedagogical adjustments, experimental findings, and new didactic models
- **Admin Panel**: Intuitive CMS for managing content with drag-and-drop file uploads
- **Public Gallery**: Master-detail view for exploring published research reports
- **Neobrutalist Design**: Bold, functional UI following Swiss design principles

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Styling**: TailwindCSS with custom neobrutalist design tokens
- **Backend**: Firebase (Firestore + Cloud Storage)
- **Deployment**: Vercel
- **Icons**: Lucide React
- **Language**: TypeScript

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Firebase project (see [DEPLOYMENT.md](./DEPLOYMENT.md))
- Vercel account (for deployment)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd repositorio-investigacion-viva
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.local.example .env.local
```

Edit `.env.local` and add your Firebase credentials:
```
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
repositorio-investigacion-viva/
├── app/
│   ├── admin/                    # Admin CMS routes
│   │   ├── decision-logs/        # Decision log management
│   │   ├── scrollytelling/       # Report upload interface
│   │   ├── layout.tsx            # Admin sidebar layout
│   │   └── page.tsx              # Admin dashboard
│   ├── gallery/                  # Public gallery view
│   │   └── page.tsx              # Master-detail report viewer
│   ├── globals.css               # Global styles + design tokens
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Homepage
├── components/
│   └── ui/                       # Reusable UI components
│       ├── BrutalButton.tsx      # Neobrutalist button
│       ├── BrutalCard.tsx        # Neobrutalist card
│       ├── BrutalInput.tsx       # Neobrutalist input
│       ├── FileUploader.tsx      # Drag & drop uploader
│       └── index.ts              # Component exports
├── lib/
│   ├── firebase.ts               # Firebase initialization
│   ├── uploadHtmlReport.ts       # Report upload logic
│   └── decisionLogs.ts           # Decision log CRUD operations
├── public/                       # Static assets
├── .env.local.example            # Environment variable template
├── DEPLOYMENT.md                 # Deployment guide
└── README.md                     # This file
```

## Usage

### Admin Panel

Navigate to `/admin` to access the content management system:

1. **Dashboard**: View statistics and quick start guide
2. **Scrollytelling Reports**: Upload HTML files with metadata (title, tags, status)
3. **Decision Logs**: Create, edit, and delete pedagogical decision records

### Public Gallery

Navigate to `/gallery` to view published reports:

- The most recent report displays in a large iframe
- Click any report card to switch the iframe content
- Only reports marked as "Published" are visible

## Design System

The application uses a custom neobrutalist design system defined in `app/globals.css`:

### Colors
- `bg-light`: #F4F4F4 (Light background)
- `dark`: #121212 (Dark text and borders)
- `cool-blue`: #16a1df (Primary accent)
- `alert-orange`: #e86e25 (Warning/danger)

### Design Tokens
- **Borders**: 4px solid black borders (`border-4 border-dark`)
- **Shadows**: Offset brutal shadows (`shadow-[6px_6px_0px_0px_rgba(18,18,18,1)]`)
- **Hover Effects**: Reduced shadow + translation on interaction
- **No Border Radius**: Sharp, angular edges throughout

## Firebase Collections

### `scrollytelling_reports`
```typescript
{
  title: string
  filename: string
  storage_url: string
  status: 'Published' | 'Archived' | 'Draft'
  tags: string[]
  createdAt: Timestamp
}
```

### `decision_logs`
```typescript
{
  title: string
  taxonomy: 'Pedagogical Adjustment' | 'Experimental Refutation' | 'New Didactic Model'
  status: 'Under Debate' | 'Empirically Validated' | 'Refuted'
  rationale: string  // Markdown/LaTeX
  embedding?: VectorValue  // For semantic search
  evidence_url?: string
  author: string
  createdAt: Timestamp
}
```

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions to Vercel.

Quick deploy:
```bash
npm run build
vercel --prod
```

## Development Notes

- **TypeScript**: Fully typed with strict mode enabled
- **ESLint**: Configured with Next.js recommended rules
- **No Dark Mode**: Intentionally light-only theme per design requirements
- **Font Strategy**: Sans-serif for UI, serif for long-form content

## Future Enhancements

- [ ] Firebase Authentication for admin panel
- [ ] Real-time telemetry dashboards
- [ ] Vector search for decision logs
- [ ] Markdown/LaTeX rendering for rationales
- [ ] Export decision logs to PDF
- [ ] Analytics integration

## License

MIT License - See LICENSE file for details

## Support

For questions or issues:
- Open an issue in the repository
- Refer to [DEPLOYMENT.md](./DEPLOYMENT.md) for deployment help
- Check Firebase and Next.js documentation

---

Built with Next.js 14, Firebase, and TailwindCSS | Deployed on Vercel
