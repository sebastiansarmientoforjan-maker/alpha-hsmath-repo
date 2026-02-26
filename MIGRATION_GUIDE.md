# Migration Guide: Decision-First Architecture

## Before You Start

This guide will help you migrate your existing HS Math Hub data to the new Decision-First Architecture.

**Important:** This is a **one-time migration**. The changes are backward compatible and non-destructive.

## Prerequisites

1. All existing data should be backed up (optional but recommended)
2. Firebase should be properly configured in `.env.local`
3. You should have `npm` or `yarn` installed

## Migration Steps

### Step 1: Install Dependencies

First, install the new dependency required for the migration script:

```bash
npm install
```

This will install `ts-node` which is needed to run the TypeScript migration script.

### Step 2: Run the Migration Script

Execute the migration script:

```bash
npm run migrate
```

**What this does:**
- Adds `reportIds: []` and `reportCount: 0` to all existing decision logs
- Adds `decisionLogId: null`, `description: ''`, and `reportType: 'Other'` to all reports
- All existing reports will be marked as "orphaned" (not associated with any decision)

**Expected output:**
```
🚀 Starting migration to Decision-First Architecture...

📊 Step 1: Migrating Decision Logs...
   Found 5 decision logs
   ✓ Migrated log: "Shift to Inquiry-Based Learning"
   ✓ Migrated log: "New Assessment Framework"
   ...
   ✅ Migrated 5 decision logs

📄 Step 2: Migrating Scrollytelling Reports...
   Found 12 reports
   ✓ Migrated report: "Q1 Analysis"
   ✓ Migrated report: "Mid-Year Review"
   ...
   ✅ Migrated 12 reports

═══════════════════════════════════════
✅ Migration completed successfully!
═══════════════════════════════════════
```

### Step 3: Verify Migration

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Go to the admin dashboard: `http://localhost:3000/admin`

3. Check the statistics:
   - You should see your existing counts for Reports and Decision Logs
   - "Reports / Decision" should show `0` (because no associations exist yet)
   - If you have reports, you'll see an "Orphaned Reports" warning

4. Go to Scrollytelling Reports page: `http://localhost:3000/admin/scrollytelling`
   - Look for the orange warning badge showing orphaned reports
   - Filter by "Orphaned" to see all unassociated reports

### Step 4: Associate Reports with Decisions

Now you need to create relationships between your reports and decision logs:

#### Option A: Attach from Decision Logs Page (Recommended)

1. Go to `/admin/decision-logs`
2. For each decision log, click the "Link" icon (🔗)
3. A modal will show all orphaned reports
4. Click "Attach" on reports that belong to this decision
5. The report count will update automatically

#### Option B: During New Uploads

When uploading new reports:
1. Go to `/admin/scrollytelling`
2. Fill in the report metadata
3. Select the decision log from the "Associate with Decision Log" dropdown
4. Choose the report type (Pre-Analysis, Mid-Term, Final, Other)
5. Upload the file

### Step 5: Review the Gallery

1. Go to the public gallery: `http://localhost:3000/gallery`
2. You should see:
   - Decision logs in the left sidebar (only those with published reports)
   - Clicking a decision shows its details and associated reports
   - Report viewer shows each associated report in tabs

**Note:** Only decision logs that have at least one published, associated report will appear in the gallery.

## What If Something Goes Wrong?

### Migration Script Fails

If the migration script fails:

1. Check Firebase connection:
   - Verify `.env.local` has correct Firebase credentials
   - Test Firebase connection by going to `/admin`

2. Check for errors in the console output
   - The script will show which step failed
   - Common issues: permissions, network, or configuration

3. You can safely re-run the script:
   ```bash
   npm run migrate
   ```
   - Already migrated items will be skipped
   - Only new items will be processed

### Unexpected Behavior

If you see unexpected behavior after migration:

1. **Clear browser cache** - Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)

2. **Check browser console** - Look for JavaScript errors

3. **Verify Firestore rules** - Ensure read/write permissions are correct

4. **Create Firestore indexes** - When you first load pages, Firebase may prompt you to create indexes. Click the link to auto-create them.

## Rollback (If Needed)

The migration is **backward compatible**, meaning:
- Old code will ignore the new fields
- No data is deleted or modified destructively
- You can rollback to the previous version if needed

To rollback:
1. Revert to the previous Git commit
2. The new fields will simply be ignored
3. No data cleanup is needed

## Post-Migration Checklist

- [ ] Migration script completed without errors
- [ ] Dashboard shows real statistics (not all zeros)
- [ ] Orphaned reports count is displayed (if applicable)
- [ ] Can attach reports to decision logs
- [ ] Report count updates when attaching
- [ ] Gallery shows decision-first layout
- [ ] Published associated reports appear in gallery
- [ ] Can upload new reports with decision association

## Need Help?

If you encounter issues:

1. Check `IMPLEMENTATION_SUMMARY.md` for detailed architecture info
2. Review Firebase console for errors
3. Check browser console for client-side errors
4. Verify all Firestore indexes are created

## Next Steps After Migration

1. **Associate Existing Content**
   - Go through orphaned reports and attach them to relevant decisions
   - Add descriptions and report types to existing reports

2. **Publish Content**
   - Set reports to "Published" status
   - Check that they appear correctly in the gallery

3. **Test the Workflow**
   - Create a new decision log
   - Upload a report and associate it
   - Verify it appears in the gallery

4. **Share with Stakeholders**
   - The gallery now provides a clear decision-first narrative
   - Stakeholders can understand the reasoning behind each decision

## Congratulations! 🎉

Your HS Math Hub now uses Decision-First Architecture. Stakeholders will see the full context of pedagogical decisions with supporting evidence.
