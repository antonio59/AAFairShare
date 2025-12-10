#!/usr/bin/env bun

import { writeFileSync } from "fs";
import { join } from "path";

interface AuditResult {
  timestamp: string;
  totalUsers: number;
  users: Array<{
    userId: string;
    email: string | null;
    name: string | null;
    links: {
      expensesPaid: number;
      recurringCreated: number;
      settlementsFrom: number;
      settlementsTo: number;
      settlementsRecorded: number;
      contributions: number;
      receiptsUploaded: number;
    };
    orphanedReferences: string[];
  }>;
  orphanedReferences: Array<{
    table: string;
    field: string;
    referenceId: string;
    count: number;
  }>;
  summary: {
    totalUserReferences: number;
    totalOrphans: number;
  };
}

async function runAudit() {
  console.log("🔍 Starting user links audit...\n");

  const convexUrl = process.env.VITE_CONVEX_URL;
  if (!convexUrl) {
    console.error("❌ Error: VITE_CONVEX_URL environment variable not set");
    console.log("Please set it to your Convex deployment URL");
    process.exit(1);
  }

  const apiKey = process.env.CONVEX_DEPLOYMENT_KEY;
  if (!apiKey) {
    console.error("❌ Error: CONVEX_DEPLOYMENT_KEY environment variable not set");
    console.log("Run: npx convex login to get your key");
    process.exit(1);
  }

  try {
    console.log("📡 Calling Convex action: dataAudit.auditUserLinks");
    
    const response = await fetch(`${convexUrl}/api/dataAudit.auditUserLinks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({}),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Convex action failed:", response.status, errorText);
      process.exit(1);
    }

    const auditResult: AuditResult = await response.json();
    
    // Ensure artifacts directory exists
    const artifactsDir = join(process.cwd(), "artifacts");
    
    // Write to JSON file
    const outputPath = join(artifactsDir, "user-link-audit.json");
    writeFileSync(outputPath, JSON.stringify(auditResult, null, 2));
    console.log(`✅ Audit results saved to: ${outputPath}\n`);

    // Print to stdout
    console.log("📊 Audit Results");
    console.log("================\n");
    console.log(`Timestamp: ${auditResult.timestamp}`);
    console.log(`Total Users: ${auditResult.totalUsers}`);
    console.log(`Total User References: ${auditResult.summary.totalUserReferences}`);
    console.log(`Total Orphaned References: ${auditResult.summary.totalOrphans}\n`);

    if (auditResult.orphanedReferences.length === 0) {
      console.log("✅ No orphaned references found!\n");
    } else {
      console.log("⚠️  Orphaned References Found:\n");
      auditResult.orphanedReferences.forEach((ref) => {
        console.log(`  - ${ref.table}.${ref.field}: ${ref.count} invalid references`);
      });
      console.log();
    }

    if (auditResult.users.length > 0) {
      console.log("👥 User Link Summary:\n");
      auditResult.users.forEach((user) => {
        const totalLinks = Object.values(user.links).reduce((sum, count) => sum + count, 0);
        console.log(`  User: ${user.name || user.email || user.userId}`);
        console.log(`    Expenses Paid: ${user.links.expensesPaid}`);
        console.log(`    Recurring Created: ${user.links.recurringCreated}`);
        console.log(`    Settlements (From): ${user.links.settlementsFrom}`);
        console.log(`    Settlements (To): ${user.links.settlementsTo}`);
        console.log(`    Settlements (Recorded): ${user.links.settlementsRecorded}`);
        console.log(`    Savings Contributions: ${user.links.contributions}`);
        console.log(`    Receipts Uploaded: ${user.links.receiptsUploaded}`);
        console.log(`    Total References: ${totalLinks}\n`);
      });
    }

    // Exit with error code if orphans found
    if (auditResult.summary.totalOrphans > 0) {
      console.log("❌ Audit completed with orphaned references");
      process.exit(1);
    } else {
      console.log("✅ Audit completed successfully - no orphaned references");
    }
  } catch (error) {
    console.error("❌ Audit failed:", error);
    process.exit(1);
  }
}

runAudit();