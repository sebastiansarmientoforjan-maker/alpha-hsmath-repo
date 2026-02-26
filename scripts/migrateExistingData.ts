/**
 * Migration Script: Add Decision-First Architecture Fields
 *
 * This script migrates existing data to support the Decision-First Architecture:
 * 1. Adds reportIds and reportCount fields to all decision logs
 * 2. Adds decisionLogId, description, and reportType fields to all reports
 *
 * IMPORTANT: This is a one-time migration script. Run it once after deploying the new code.
 *
 * Usage:
 *   npx ts-node scripts/migrateExistingData.ts
 *
 * Or add to package.json:
 *   "scripts": {
 *     "migrate": "ts-node scripts/migrateExistingData.ts"
 *   }
 *
 * Then run:
 *   npm run migrate
 */

import { getAllDecisionLogs, updateDecisionLog } from '../lib/decisionLogs';
import { getAllReports, updateReport } from '../lib/scrollytellingReports';

async function migrate() {
  console.log('🚀 Starting migration to Decision-First Architecture...\n');

  try {
    // Step 1: Migrate Decision Logs
    console.log('📊 Step 1: Migrating Decision Logs...');
    const logs = await getAllDecisionLogs();
    console.log(`   Found ${logs.length} decision logs`);

    let logsUpdated = 0;
    for (const log of logs) {
      if (!log.id) continue;

      // Check if already migrated
      if ('reportIds' in log && 'reportCount' in log) {
        console.log(`   ✓ Log "${log.title}" already migrated`);
        continue;
      }

      await updateDecisionLog(log.id, {
        reportIds: [],
        reportCount: 0,
      });

      logsUpdated++;
      console.log(`   ✓ Migrated log: "${log.title}"`);
    }

    console.log(`   ✅ Migrated ${logsUpdated} decision logs\n`);

    // Step 2: Migrate Reports
    console.log('📄 Step 2: Migrating Scrollytelling Reports...');
    const reports = await getAllReports();
    console.log(`   Found ${reports.length} reports`);

    let reportsUpdated = 0;
    for (const report of reports) {
      // Check if already migrated
      if ('decisionLogId' in report) {
        console.log(`   ✓ Report "${report.title}" already migrated`);
        continue;
      }

      await updateReport(report.id, {
        decisionLogId: null, // Orphaned by default
        description: '',
        reportType: 'Other',
      });

      reportsUpdated++;
      console.log(`   ✓ Migrated report: "${report.title}"`);
    }

    console.log(`   ✅ Migrated ${reportsUpdated} reports\n`);

    // Summary
    console.log('═══════════════════════════════════════');
    console.log('✅ Migration completed successfully!');
    console.log('═══════════════════════════════════════');
    console.log(`Decision Logs: ${logsUpdated}/${logs.length} migrated`);
    console.log(`Reports: ${reportsUpdated}/${reports.length} migrated`);
    console.log('\n📝 Next Steps:');
    console.log('1. Existing reports are now "orphaned" (not associated with any decision)');
    console.log('2. Go to Admin > Scrollytelling Reports to see orphaned reports');
    console.log('3. Use the "Attach Report" button in Admin > Decision Logs to associate reports');
    console.log('4. Published reports will only appear in the Gallery once associated with a decision log');
    console.log('\n🎉 Your application is now using Decision-First Architecture!');

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    console.error('\nPlease check your Firebase configuration and try again.');
    process.exit(1);
  }
}

// Run migration
migrate()
  .then(() => {
    console.log('\n✅ Migration script completed.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migration script failed:', error);
    process.exit(1);
  });
