# Auth Migration Documentation

## Overview

This document tracks the audit of user links in the AAFairShare application prior to authentication system changes. The audit ensures data integrity by identifying all references to users across the database schema.

## Audit Results

The audit was performed using the `dataAudit.auditUserLinks` Convex action and the `scripts/audit-user-links.ts` CLI runner. Results are persisted to `artifacts/user-link-audit.json` for historical reference.

**Run the audit:**
```bash
bun run audit-user-links
```

## User-Linked Tables

The following tables and fields reference the `users` table:

### 1. expenses.paidById
- **Description**: References the user who paid for the expense
- **Type**: `v.id("users")` (required)
- **Index**: `by_paid_by`
- **Referential Integrity**: Required - every expense must have a valid payer

### 2. recurring.userId
- **Description**: References the user who created the recurring expense
- **Type**: `v.id("users")` (required)
- **Index**: `by_user`
- **Referential Integrity**: Required - every recurring expense must have a creator

### 3. settlements.fromUserId
- **Description**: References the user who owes money
- **Type**: `v.id("users")` (required)
- **Index**: None
- **Referential Integrity**: Required - every settlement must specify who owes

### 4. settlements.toUserId
- **Description**: References the user who is owed money
- **Type**: `v.id("users")` (required)
- **Index**: None
- **Referential Integrity**: Required - every settlement must specify who is owed

### 5. settlements.recordedBy
- **Description**: References the user who recorded the settlement
- **Type**: `v.id("users")` (required)
- **Index**: None
- **Referential Integrity**: Required - every settlement must have a recorder

### 6. savingsContributions.contributorId
- **Description**: References the user who contributed to a savings goal
- **Type**: `v.optional(v.id("users"))` (optional)
- **Index**: None
- **Referential Integrity**: Optional - contributions can be anonymous

### 7. receipts.uploadedBy
- **Description**: References the user who uploaded the receipt
- **Type**: `v.optional(v.id("users"))` (optional)
- **Index**: None
- **Referential Integrity**: Optional - receipts can be uploaded without authentication

## Data Relationships Summary

```
users (1) ----< (N) expenses.paidById
users (1) ----< (N) recurring.userId
users (1) ----< (N) settlements.fromUserId
users (1) ----< (N) settlements.toUserId
users (1) ----< (N) settlements.recordedBy
users (1) ----< (N) savingsContributions.contributorId
users (1) ----< (N) receipts.uploadedBy
```

## Verification Checklist

### Pre-Migration Verification

- [ ] Run user links audit and verify zero orphaned references
  ```bash
  bun run audit-user-links
  ```
- [ ] Verify all users have valid authentication tokens
- [ ] Export backup of all user data and references
- [ ] Confirm no soft-deleted users have active references
- [ ] Validate all user emails are properly formatted and verified

### Migration Steps

1. **Backup Phase**
   - Export current schema and data
   - Document all foreign key relationships
   - Take database snapshot

2. **Auth System Migration**
   - Implement new authentication flow
   - Migrate existing users to new auth system
   - Update user tokens and identifiers

3. **Data Validation Phase**
   - Re-run user links audit to verify integrity
   - Check for any orphaned references created during migration
   - Validate all user relationships are intact

### Post-Migration Verification

- [ ] Run user links audit - expect zero orphaned references
- [ ] Verify expense CRUD operations work correctly
- [ ] Verify recurring expense operations work correctly
- [ ] Verify settlement operations work correctly
- [ ] Verify savings goals operations work correctly
- [ ] Verify receipt upload operations work correctly
- [ ] Test user authentication flow
- [ ] Validate API responses contain proper user data

## Migration Safety Rules

1. **Never delete users with active references**
   - Always check all linked tables before user deletion
   - Use soft-delete or archive patterns for users with historical data

2. **Maintain referential integrity**
   - All required foreign keys must reference valid users
   - Optional foreign keys should be nullified if user deletion is required

3. **Audit before and after migration**
   - Run audit script before any auth changes
   - Run audit script after migration and before deployment

4. **Rollback plan**
   - Maintain backups until migration is verified
   - Document rollback procedures
   - Test rollback procedures

## Troubleshooting

### Common Issues

1. **Orphaned references found**
   - Check if users were soft-deleted without updating references
   - Validate user ID consistency across all tables
   - Review recent deletions in user management

2. **Authentication token mismatch**
   - Verify token identifier format
   - Check Convex auth configuration
   - Validate OAuth provider settings

3. **Missing user data**
   - Check if user creation failed during migration
   - Verify user import process completed successfully
   - Validate email verification status

### Emergency Contacts

- **Database Administrator**: [Contact Info]
- **DevOps Lead**: [Contact Info]
- **Project Maintainer**: [Contact Info]

## Audit History

| Date | Audit File | Total Users | Total References | Orphaned References |
|------|------------|-------------|------------------|---------------------|
| [Date] | artifacts/user-link-audit.json | [Count] | [Count] | [Count] |

## Related Documents

- [Convex Auth Migration Guide](https://docs.convex.dev/production/authentication)
- [Database Schema Documentation](./schema.md)
- [API Documentation](../src/api/README.md)