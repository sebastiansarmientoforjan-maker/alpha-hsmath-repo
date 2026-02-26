/**
 * Migration Script: Research-First Architecture
 *
 * This script migrates existing data to support the Research-First Architecture:
 * 1. Adds investigationIds and investigationCount to all decision logs
 * 2. Adds investigationId field to all scrollytelling reports
 * 3. Updates orphaned reports logic (no investigation AND no decision)
 *
 * IMPORTANT: Run this once after deploying the new code.
 *
 * Usage:
 *   npm run migrate:research
 */

import { getAllDecisionLogs, updateDecisionLog } from '../lib/decisionLogs';
import { getAllReports, updateReport } from '../lib/scrollytellingReports';

async function migrate() {
  console.log('🚀 Starting migration to Research-First Architecture...\n');

  try {
    // Step 1: Migrate Decision Logs
    console.log('📊 Step 1: Migrating Decision Logs...');
    const logs = await getAllDecisionLogs();
    console.log(`   Found ${logs.length} decision logs`);

    let logsUpdated = 0;
    for (const log of logs) {
      if (!log.id) continue;

      // Check if already migrated
      if ('investigationIds' in log && 'investigationCount' in log) {
        console.log(`   ✓ Log "${log.title}" already migrated`);
        continue;
      }

      await updateDecisionLog(log.id, {
        investigationIds: [] as string[],
        investigationCount: 0,
        schoolContext: '',
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
      if ('investigationId' in report) {
        console.log(`   ✓ Report "${report.title}" already migrated`);
        continue;
      }

      await updateReport(report.id, {
        investigationId: null, // Orphaned by default (can be associated later)
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
    console.log('1. Create investigations in Research Repository');
    console.log('2. Associate existing reports with investigations or decisions');
    console.log('3. Link investigations to relevant decision logs');
    console.log('4. Set investigation and decision statuses to "Published" for gallery visibility');
    console.log('\n🎉 Your application now uses Research-First Architecture!');

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
