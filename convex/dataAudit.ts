import { internalAction } from "./_generated/server";
import { v } from "convex/values";

export const auditUserLinks = internalAction({
  args: {},
}, async (ctx) => {
  const users = await ctx.db.query("users").collect();
  
  const auditResults = {
    timestamp: new Date().toISOString(),
    totalUsers: users.length,
    users: [] as Array<{
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
    }>,
    orphanedReferences: [] as Array<{
      table: string;
      field: string;
      referenceId: string;
      count: number;
    }>,
    summary: {
      totalUserReferences: 0,
      totalOrphans: 0,
    },
  };

  // Check each user and count their references
  for (const user of users) {
    const userId = user._id.toString();
    
    // Count expenses where user is the payer
    const expensesPaid = await ctx.db
      .query("expenses")
      .withIndex("by_paid_by", (q) => q.eq("paidById", user._id))
      .collect();
    
    // Count recurring expenses created by user
    const recurringCreated = await ctx.db
      .query("recurring")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    
    // Count settlements where user is the payer (fromUserId)
    const settlementsFrom = await ctx.db
      .query("settlements")
      .collect()
      .then((settlements) => 
        settlements.filter(s => s.fromUserId.toString() === userId)
      );
    
    // Count settlements where user is the payee (toUserId)
    const settlementsTo = await ctx.db
      .query("settlements")
      .collect()
      .then((settlements) => 
        settlements.filter(s => s.toUserId.toString() === userId)
      );
    
    // Count settlements recorded by user
    const settlementsRecorded = await ctx.db
      .query("settlements")
      .collect()
      .then((settlements) => 
        settlements.filter(s => s.recordedBy.toString() === userId)
      );
    
    // Count savings contributions by user
    const contributions = await ctx.db
      .query("savingsContributions")
      .collect()
      .then((contributions) => 
        contributions.filter(c => c.contributorId?.toString() === userId)
      );
    
    // Count receipts uploaded by user
    const receiptsUploaded = await ctx.db
      .query("receipts")
      .collect()
      .then((receipts) => 
        receipts.filter(r => r.uploadedBy?.toString() === userId)
      );

    auditResults.users.push({
      userId,
      email: user.email ?? null,
      name: user.name ?? null,
      links: {
        expensesPaid: expensesPaid.length,
        recurringCreated: recurringCreated.length,
        settlementsFrom: settlementsFrom.length,
        settlementsTo: settlementsTo.length,
        settlementsRecorded: settlementsRecorded.length,
        contributions: contributions.length,
        receiptsUploaded: receiptsUploaded.length,
      },
      orphanedReferences: [],
    });

    auditResults.summary.totalUserReferences += 
      expensesPaid.length +
      recurringCreated.length +
      settlementsFrom.length +
      settlementsTo.length +
      settlementsRecorded.length +
      contributions.length +
      receiptsUploaded.length;
  }

  // Find orphaned references
  // Check for expenses with invalid paidById
  const allExpenses = await ctx.db.query("expenses").collect();
  const validUserIds = new Set(users.map(u => u._id.toString()));
  const invalidExpenseRefs = allExpenses.filter(e => !validUserIds.has(e.paidById.toString()));
  if (invalidExpenseRefs.length > 0) {
    auditResults.orphanedReferences.push({
      table: "expenses",
      field: "paidById",
      referenceId: "invalid",
      count: invalidExpenseRefs.length,
    });
  }

  // Check for recurring with invalid userId
  const allRecurring = await ctx.db.query("recurring").collect();
  const invalidRecurringRefs = allRecurring.filter(r => !validUserIds.has(r.userId.toString()));
  if (invalidRecurringRefs.length > 0) {
    auditResults.orphanedReferences.push({
      table: "recurring",
      field: "userId",
      referenceId: "invalid",
      count: invalidRecurringRefs.length,
    });
  }

  // Check for settlements with invalid user references
  const allSettlements = await ctx.db.query("settlements").collect();
  const invalidFromRefs = allSettlements.filter(s => !validUserIds.has(s.fromUserId.toString()));
  const invalidToRefs = allSettlements.filter(s => !validUserIds.has(s.toUserId.toString()));
  const invalidRecordedRefs = allSettlements.filter(s => !validUserIds.has(s.recordedBy.toString()));
  
  if (invalidFromRefs.length > 0) {
    auditResults.orphanedReferences.push({
      table: "settlements",
      field: "fromUserId",
      referenceId: "invalid",
      count: invalidFromRefs.length,
    });
  }
  if (invalidToRefs.length > 0) {
    auditResults.orphanedReferences.push({
      table: "settlements",
      field: "toUserId",
      referenceId: "invalid",
      count: invalidToRefs.length,
    });
  }
  if (invalidRecordedRefs.length > 0) {
    auditResults.orphanedReferences.push({
      table: "settlements",
      field: "recordedBy",
      referenceId: "invalid",
      count: invalidRecordedRefs.length,
    });
  }

  // Check for savingsContributions with invalid contributorId
  const allContributions = await ctx.db.query("savingsContributions").collect();
  const invalidContribRefs = allContributions.filter(c => 
    c.contributorId && !validUserIds.has(c.contributorId.toString())
  );
  if (invalidContribRefs.length > 0) {
    auditResults.orphanedReferences.push({
      table: "savingsContributions",
      field: "contributorId",
      referenceId: "invalid",
      count: invalidContribRefs.length,
    });
  }

  // Check for receipts with invalid uploadedBy
  const allReceipts = await ctx.db.query("receipts").collect();
  const invalidReceiptRefs = allReceipts.filter(r => 
    r.uploadedBy && !validUserIds.has(r.uploadedBy.toString())
  );
  if (invalidReceiptRefs.length > 0) {
    auditResults.orphanedReferences.push({
      table: "receipts",
      field: "uploadedBy",
      referenceId: "invalid",
      count: invalidReceiptRefs.length,
    });
  }

  // Calculate total orphans
  auditResults.summary.totalOrphans = auditResults.orphanedReferences.reduce(
    (sum, ref) => sum + ref.count,
    0
  );

  return auditResults;
});