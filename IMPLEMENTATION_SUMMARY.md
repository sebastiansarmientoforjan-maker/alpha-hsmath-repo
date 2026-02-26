# Decision-First Architecture Implementation Summary

## Overview

The HS Math Hub application has been successfully transformed to use a **Decision-First Architecture**, where Decision Logs are the primary entity and Scrollytelling Reports serve as supporting evidence associated with those decisions.

## What Changed

### 1. Data Model
- **Decision Logs** now include:
  - `reportIds: string[]` - Array of associated report IDs
  - `reportCount: number` - Denormalized count for quick display

- **Scrollytelling Reports** now include:
  - `decisionLogId: string | null` - Reference to parent decision (null = orphaned)
  - `description?: string` - Brief context about the report
  - `reportType?: string` - Type of evidence (Pre-Analysis, Mid-Term, Final, Other)

### 2. Navigation
The admin navigation has been reordered to reflect the new priority:
- Dashboard → **Decision Logs** → Scrollytelling Reports

### 3. Admin Interface Improvements

#### Decision Logs Page (`/admin/decision-logs`)
- ✅ Report count badge on each decision card
- ✅ "Attach Report" button to associate existing orphaned reports
- ✅ "View Details" button to see all associated reports
- ✅ Modal view showing decision details with report thumbnails
- ✅ Detach functionality for removing report associations

#### Scrollytelling Reports Page (`/admin/scrollytelling`)
- ✅ "Associate with Decision Log" dropdown in upload form
- ✅ "Report Type" dropdown (Pre-Analysis, Mid-Term, Final, Other)
- ✅ "Description" field for report context
- ✅ Complete report management table showing ALL reports
- ✅ Filters: Status, Association (All/Associated/Orphaned)
- ✅ Edit, Delete, and View actions for each report
- ✅ Warning indicator for orphaned reports

#### Dashboard (`/admin`)
- ✅ Real statistics from Firestore (no more hardcoded zeros)
- ✅ "Reports per Decision" metric
- ✅ "Orphaned Reports" warning with prominent alert styling
- ✅ Updated quick start guide reflecting decision-first workflow

### 4. Public Gallery - Complete Redesign (`/gallery`)

The gallery now features a **decision-first layout**:

**Layout:**
```
┌────────────────────────────────────────────────┐
│  Header: HS Math Research Gallery             │
├─────────────────┬──────────────────────────────┤
│  Sidebar (30%)  │  Main Content (70%)          │
│  ┌───────────┐  │  ┌──────────────────────┐   │
│  │ Filters   │  │  │ Decision Details     │   │
│  ├───────────┤  │  │ - Title              │   │
│  │ Decision  │◄─┼──│ - Status/Taxonomy    │   │
│  │ Log 1     │  │  │ - Rationale          │   │
│  │ • 3 reps  │  │  └──────────────────────┘   │
│  ├───────────┤  │  Associated Reports:         │
│  │ Decision  │  │  ┌────┐ ┌────┐ ┌────┐      │
│  │ Log 2     │  │  │Rep1│ │Rep2│ │Rep3│      │
│  │ • 1 rep   │  │  └────┘ └────┘ └────┘      │
│  └───────────┘  │  ┌──────────────────────┐   │
│                 │  │ Report Iframe Viewer │   │
│                 │  └──────────────────────┘   │
└─────────────────┴──────────────────────────────┘
```

**Key Features:**
- Left sidebar shows all decision logs grouped by taxonomy
- Status badges and report counts visible at a glance
- Click a decision to view its details and associated reports
- Main area shows decision rationale and tabbed report viewer
- Only published reports appear in the gallery
- Filters by taxonomy and status

## New Files Created

### Library Files
- `lib/scrollytellingReports.ts` - CRUD operations for reports
- `lib/decisionLogReports.ts` - Relationship management with Firestore transactions

### UI Components
- `components/ui/ReportThumbnail.tsx` - Small report card component
- `components/ui/DecisionLogDetail.tsx` - Detailed decision view modal

### Gallery Components
- `components/gallery/DecisionLogSidebar.tsx` - Gallery sidebar with filters
- `components/gallery/DecisionLogViewer.tsx` - Main gallery viewer

### Scripts
- `scripts/migrateExistingData.ts` - One-time migration script

## Files Modified

1. `lib/decisionLogs.ts` - Added reportIds and reportCount fields
2. `lib/uploadHtmlReport.ts` - Added decisionLogId, description, reportType fields
3. `app/admin/layout.tsx` - Reordered navigation
4. `app/admin/page.tsx` - Added real statistics
5. `app/admin/decision-logs/page.tsx` - Added report attachment UI
6. `app/admin/scrollytelling/page.tsx` - Complete rewrite with report management
7. `app/gallery/page.tsx` - Complete redesign to decision-first layout
8. `components/ui/index.ts` - Added exports for new components

## Migration Required

Before using the new features, you **must run the migration script once**:

```bash
npm run migrate
```

Or:

```bash
npx ts-node scripts/migrateExistingData.ts
```

This script will:
1. Add `reportIds` and `reportCount` to all existing decision logs (initialized to empty)
2. Add `decisionLogId`, `description`, and `reportType` to all existing reports (orphaned by default)

## How to Use

### Creating Content (Recommended Workflow)

1. **Create Decision Logs First** (`/admin/decision-logs`)
   - Document pedagogical decisions
   - Add rationale and context
   - These become the primary entities

2. **Upload Reports with Association** (`/admin/scrollytelling`)
   - Upload HTML reports
   - Select the associated decision log from dropdown
   - Add report type and description
   - Set status to Published when ready

3. **View in Gallery** (`/gallery`)
   - Published reports appear under their associated decision logs
   - Stakeholders see the decision context first
   - Reports serve as evidence for decisions

### Managing Existing/Orphaned Reports

If you have existing reports that aren't associated:

**Option 1: Attach from Decision Logs page**
1. Go to `/admin/decision-logs`
2. Click the "Link" icon on any decision log
3. Select orphaned reports to attach

**Option 2: Edit from Scrollytelling page**
1. Go to `/admin/scrollytelling`
2. See orphaned reports highlighted in the table
3. Edit each report and change association (future feature)

Note: Currently you can only attach reports, not change their association after upload. To change association, detach from the old decision and attach to the new one.

## Firestore Indexes Required

For optimal performance, create these compound indexes in Firebase Console:

```
Collection: scrollytelling_reports
- decisionLogId (Ascending) + createdAt (Descending)
- status (Ascending) + decisionLogId (Ascending) + createdAt (Descending)
```

Firebase will prompt you to create these indexes when you first query reports. Click the link in the console error message to auto-create them.

## Key Features

### Transaction-Based Consistency
Report attachment/detachment uses Firestore transactions to ensure:
- Reports and decisions are always in sync
- No orphaned references
- Accurate report counts

### Backward Compatibility
- Old data is preserved
- New fields don't break existing code
- Existing reports become "orphaned" until associated
- Gradual migration is supported

### User Experience
- Clear visual indicators for orphaned reports
- Easy attachment workflow
- Report counts visible at a glance
- Decision-first narrative in public gallery

## Success Criteria - All Met ✅

1. ✅ Decision Logs are clearly the primary entity in navigation
2. ✅ Each decision can have multiple associated scrollytelling reports
3. ✅ Stakeholders can see the full decision context and supporting evidence
4. ✅ Admin can easily manage relationships between decisions and reports
5. ✅ Gallery provides clear narrative of decision-making process
6. ✅ Existing data is preserved and can be associated retroactively

## Next Steps

1. **Run Migration**: Execute `npm run migrate` once
2. **Test Workflow**: Create a decision log and upload associated reports
3. **Associate Existing Content**: Attach orphaned reports to decision logs
4. **Review Gallery**: Check that the public gallery displays correctly
5. **Configure Indexes**: Create Firestore indexes when prompted

## Troubleshooting

### Orphaned Reports Warning
- This is expected after migration
- All existing reports start as orphaned
- Use the attach feature to associate them

### Reports Not Showing in Gallery
- Check that reports are Published (not Draft/Archived)
- Verify they're associated with a decision log
- Ensure the decision log has at least one published report

### Firestore Permission Errors
- Check Firebase console for index creation prompts
- Verify Firestore rules allow read/write access
- Ensure Firebase config in `.env.local` is correct

## Support

For issues or questions:
- Check the Firebase console for errors
- Review Firestore security rules
- Verify all indexes are created
- Check browser console for client-side errors
