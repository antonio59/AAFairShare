import { v } from "convex/values";
import { MutationCtx, QueryCtx, query } from "./_generated/server";
import { mutation } from "./utils/functions";
import { Doc, Id } from "./_generated/dataModel";
import { requireAuthenticatedUser } from "./utils/auth";
import { assertValidDate, assertValidStoredImage } from "./utils/validation";
import { getLocationsMap, getUsersMap } from "./utils/batchFetch";
import { assertNonNegativeNumber } from "./utils/homeCatalog";
import {
  assertValidMaintenanceSeverity,
  assertValidMaintenanceStatus,
  assertValidVisitOutcome,
} from "./utils/homeMaintenance";
import { recordActivity } from "./utils/activityLog";

const MAX_MAINTENANCE_PHOTOS = 10;

function normalizeOptionalText(value: string | undefined): string | undefined {
  if (value === undefined) return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function assertRequiredText(value: string, fieldName: string): string {
  const trimmed = value.trim();
  if (!trimmed) throw new Error(`${fieldName} is required`);
  return trimmed;
}

async function validateMaintenancePhotos(
  ctx: MutationCtx,
  photoStorageIds: Id<"_storage">[],
  existingIds?: Id<"_storage">[],
) {
  if (photoStorageIds.length > MAX_MAINTENANCE_PHOTOS) {
    throw new Error(
      `At most ${MAX_MAINTENANCE_PHOTOS} photos are allowed per issue`,
    );
  }
  const existingSet = new Set(existingIds ?? []);
  for (const storageId of photoStorageIds) {
    if (!existingSet.has(storageId)) {
      await assertValidStoredImage(ctx, storageId);
    }
  }
}

async function enrichMaintenanceLogs(
  ctx: QueryCtx,
  logs: Doc<"homeMaintenanceLogs">[],
) {
  const [usersMap, locationsMap, addresses] = await Promise.all([
    getUsersMap(ctx),
    getLocationsMap(ctx),
    ctx.db.query("addresses").collect(),
  ]);
  const addressMap = new Map(addresses.map((a) => [a._id, a]));

  const docIds = new Set<Id<"documents">>();
  const expenseIds = new Set<Id<"expenses">>();
  const catalogIds = new Set<Id<"homeCatalogItems">>();
  for (const log of logs) {
    for (const docId of log.linkedDocumentIds ?? []) docIds.add(docId);
    if (log.linkedExpenseId) expenseIds.add(log.linkedExpenseId);
    if (log.catalogItemId) catalogIds.add(log.catalogItemId);
  }

  const [docsArray, expensesArray, catalogArray] = await Promise.all([
    Promise.all(
      Array.from(docIds).map(async (docId) => {
        const doc = await ctx.db.get(docId);
        if (!doc) return null;
        const url = await ctx.storage.getUrl(doc.storageId);
        return {
          _id: doc._id,
          type: doc.type,
          title: doc.title,
          fileType: doc.fileType,
          date: doc.date,
          url,
        };
      }),
    ),
    Promise.all(
      Array.from(expenseIds).map(async (expId) => {
        const exp = await ctx.db.get(expId);
        if (!exp) return null;
        return {
          _id: exp._id,
          amount: exp.amount,
          date: exp.date,
          description: exp.description ?? "",
          location: locationsMap.get(exp.locationId)?.name ?? "Unknown",
        };
      }),
    ),
    Promise.all(
      Array.from(catalogIds).map(async (itemId) => {
        const item = await ctx.db.get(itemId);
        if (!item) return null;
        return {
          _id: item._id,
          name: item.name,
          room: item.room,
          brand: item.brand,
          modelNumber: item.modelNumber,
          serialNumber: item.serialNumber,
        };
      }),
    ),
  ]);

  const docsMap = new Map(
    docsArray
      .filter((d): d is NonNullable<typeof d> => d !== null)
      .map((d) => [d._id, d]),
  );
  const expensesMap = new Map(
    expensesArray
      .filter((e): e is NonNullable<typeof e> => e !== null)
      .map((e) => [e._id, e]),
  );
  const catalogMap = new Map(
    catalogArray
      .filter((c): c is NonNullable<typeof c> => c !== null)
      .map((c) => [c._id, c]),
  );

  return await Promise.all(
    logs.map(async (log) => {
      const photos = await Promise.all(
        (log.photoStorageIds ?? []).map(async (storageId) => ({
          storageId,
          url: await ctx.storage.getUrl(storageId),
        })),
      );
      const linkedDocuments = (log.linkedDocumentIds ?? [])
        .map((id) => docsMap.get(id))
        .filter((d): d is NonNullable<typeof d> => d !== undefined);
      const linkedExpense = log.linkedExpenseId
        ? expensesMap.get(log.linkedExpenseId) ?? null
        : null;
      const linkedCatalogItem = log.catalogItemId
        ? catalogMap.get(log.catalogItemId) ?? null
        : null;
      const address = log.addressId ? addressMap.get(log.addressId) : null;
      const createdByUser = log.createdBy ? usersMap.get(log.createdBy) : null;

      return {
        ...log,
        visits: log.visits ?? [],
        photos,
        linkedDocuments,
        linkedExpense,
        linkedCatalogItem,
        addressName: address?.name ?? null,
        createdByName:
          createdByUser?.username || createdByUser?.name || "Household",
      };
    }),
  );
}

// ============ QUERIES ============

export const getAll = query({
  args: {},
  handler: async (ctx) => {
    await requireAuthenticatedUser(ctx);

    const logs = await ctx.db.query("homeMaintenanceLogs").collect();
    logs.sort((a, b) => b.updatedAt - a.updatedAt);

    return await enrichMaintenanceLogs(ctx, logs);
  },
});

export const getByCatalogItem = query({
  args: { catalogItemId: v.id("homeCatalogItems") },
  handler: async (ctx, args) => {
    await requireAuthenticatedUser(ctx);

    const logs = await ctx.db
      .query("homeMaintenanceLogs")
      .withIndex("by_catalog_item", (q) =>
        q.eq("catalogItemId", args.catalogItemId),
      )
      .collect();
    logs.sort((a, b) => b.updatedAt - a.updatedAt);

    return await enrichMaintenanceLogs(ctx, logs);
  },
});

// ============ MUTATIONS ============

export const create = mutation({
  args: {
    title: v.string(),
    category: v.string(),
    room: v.string(),
    addressId: v.optional(v.id("addresses")),
    catalogItemId: v.optional(v.id("homeCatalogItems")),
    severity: v.string(),
    status: v.optional(v.string()),
    reportedDate: v.string(),
    resolvedDate: v.optional(v.string()),
    reportedTo: v.optional(v.string()),
    referenceNumber: v.optional(v.string()),
    description: v.optional(v.string()),
    resolutionSummary: v.optional(v.string()),
    photoStorageIds: v.optional(v.array(v.id("_storage"))),
    linkedDocumentIds: v.optional(v.array(v.id("documents"))),
    linkedExpenseId: v.optional(v.id("expenses")),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuthenticatedUser(ctx);

    const title = assertRequiredText(args.title, "title");
    const category = assertRequiredText(args.category, "category");
    const room = assertRequiredText(args.room, "room");
    assertValidMaintenanceSeverity(args.severity);
    const status = args.status ?? "open";
    assertValidMaintenanceStatus(status);
    assertValidDate(args.reportedDate, "reportedDate");
    if (args.resolvedDate) {
      assertValidDate(args.resolvedDate, "resolvedDate");
    }

    const photoStorageIds = args.photoStorageIds ?? [];
    if (photoStorageIds.length > 0) {
      await validateMaintenancePhotos(ctx, photoStorageIds);
    }

    const resolvedDate =
      status === "resolved"
        ? args.resolvedDate || new Date().toISOString().slice(0, 10)
        : args.resolvedDate || undefined;

    const now = Date.now();
    const id = await ctx.db.insert("homeMaintenanceLogs", {
      title,
      category,
      room,
      addressId: args.addressId,
      catalogItemId: args.catalogItemId,
      severity: args.severity,
      status,
      reportedDate: args.reportedDate,
      resolvedDate,
      reportedTo: normalizeOptionalText(args.reportedTo),
      referenceNumber: normalizeOptionalText(args.referenceNumber),
      description: normalizeOptionalText(args.description),
      resolutionSummary: normalizeOptionalText(args.resolutionSummary),
      visits: [],
      photoStorageIds,
      linkedDocumentIds: args.linkedDocumentIds ?? [],
      linkedExpenseId: args.linkedExpenseId,
      createdBy: userId,
      createdAt: now,
      updatedAt: now,
    });

    await recordActivity(ctx, {
      action:
        status === "escalated" ? "maintenance.escalated" : "maintenance.added",
      actorId: userId,
      description: title,
      category,
      location: room,
      maintenanceLogId: id,
    });

    return id;
  },
});

export const update = mutation({
  args: {
    id: v.id("homeMaintenanceLogs"),
    title: v.optional(v.string()),
    category: v.optional(v.string()),
    room: v.optional(v.string()),
    addressId: v.optional(v.union(v.id("addresses"), v.null())),
    catalogItemId: v.optional(v.union(v.id("homeCatalogItems"), v.null())),
    severity: v.optional(v.string()),
    status: v.optional(v.string()),
    reportedDate: v.optional(v.string()),
    resolvedDate: v.optional(v.union(v.string(), v.null())),
    reportedTo: v.optional(v.string()),
    referenceNumber: v.optional(v.string()),
    description: v.optional(v.string()),
    resolutionSummary: v.optional(v.string()),
    photoStorageIds: v.optional(v.array(v.id("_storage"))),
    linkedDocumentIds: v.optional(v.array(v.id("documents"))),
    linkedExpenseId: v.optional(v.union(v.id("expenses"), v.null())),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuthenticatedUser(ctx);

    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Maintenance log not found");

    const patch: Partial<Doc<"homeMaintenanceLogs">> = {
      updatedAt: Date.now(),
    };

    if (args.title !== undefined) {
      patch.title = assertRequiredText(args.title, "title");
    }
    if (args.category !== undefined) {
      patch.category = assertRequiredText(args.category, "category");
    }
    if (args.room !== undefined) {
      patch.room = assertRequiredText(args.room, "room");
    }
    if (args.addressId !== undefined) {
      patch.addressId = args.addressId ?? undefined;
    }
    if (args.catalogItemId !== undefined) {
      patch.catalogItemId = args.catalogItemId ?? undefined;
    }
    if (args.severity !== undefined) {
      assertValidMaintenanceSeverity(args.severity);
      patch.severity = args.severity;
    }
    if (args.reportedDate !== undefined) {
      assertValidDate(args.reportedDate, "reportedDate");
      patch.reportedDate = args.reportedDate;
    }
    if (args.resolvedDate !== undefined) {
      if (args.resolvedDate) {
        assertValidDate(args.resolvedDate, "resolvedDate");
        patch.resolvedDate = args.resolvedDate;
      } else {
        patch.resolvedDate = undefined;
      }
    }
    if (args.status !== undefined) {
      assertValidMaintenanceStatus(args.status);
      patch.status = args.status;
      if (args.status === "resolved" && !args.resolvedDate && !existing.resolvedDate) {
        patch.resolvedDate = new Date().toISOString().slice(0, 10);
      } else if (args.status !== "resolved" && args.resolvedDate === undefined) {
        patch.resolvedDate = undefined;
      }
    }
    if (args.reportedTo !== undefined) {
      patch.reportedTo = normalizeOptionalText(args.reportedTo);
    }
    if (args.referenceNumber !== undefined) {
      patch.referenceNumber = normalizeOptionalText(args.referenceNumber);
    }
    if (args.description !== undefined) {
      patch.description = normalizeOptionalText(args.description);
    }
    if (args.resolutionSummary !== undefined) {
      patch.resolutionSummary = normalizeOptionalText(args.resolutionSummary);
    }
    if (args.linkedDocumentIds !== undefined) {
      patch.linkedDocumentIds = args.linkedDocumentIds;
    }
    if (args.linkedExpenseId !== undefined) {
      patch.linkedExpenseId = args.linkedExpenseId ?? undefined;
    }

    let removedPhotos: Id<"_storage">[] = [];
    if (args.photoStorageIds !== undefined) {
      const oldPhotos = existing.photoStorageIds ?? [];
      await validateMaintenancePhotos(ctx, args.photoStorageIds, oldPhotos);
      const newSet = new Set(args.photoStorageIds);
      removedPhotos = oldPhotos.filter((id) => !newSet.has(id));
      patch.photoStorageIds = args.photoStorageIds;
    }

    await ctx.db.patch(args.id, patch);

    for (const storageId of removedPhotos) {
      await ctx.storage.delete(storageId);
    }

    const nextStatus = patch.status ?? existing.status;
    const action =
      nextStatus !== existing.status && nextStatus === "resolved"
        ? "maintenance.resolved"
        : nextStatus !== existing.status && nextStatus === "escalated"
          ? "maintenance.escalated"
          : "maintenance.updated";

    await recordActivity(ctx, {
      action,
      actorId: userId,
      description: patch.title ?? existing.title,
      category: patch.category ?? existing.category,
      location: patch.room ?? existing.room,
      maintenanceLogId: args.id,
    });
  },
});

export const setStatus = mutation({
  args: {
    id: v.id("homeMaintenanceLogs"),
    status: v.string(),
    resolutionSummary: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuthenticatedUser(ctx);
    assertValidMaintenanceStatus(args.status);

    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Maintenance log not found");

    const patch: Partial<Doc<"homeMaintenanceLogs">> = {
      status: args.status,
      resolvedDate:
        args.status === "resolved"
          ? existing.resolvedDate || new Date().toISOString().slice(0, 10)
          : undefined,
      updatedAt: Date.now(),
    };
    if (args.resolutionSummary !== undefined) {
      patch.resolutionSummary = normalizeOptionalText(args.resolutionSummary);
    }

    await ctx.db.patch(args.id, patch);

    const action =
      args.status === "resolved"
        ? "maintenance.resolved"
        : args.status === "escalated"
          ? "maintenance.escalated"
          : "maintenance.updated";

    await recordActivity(ctx, {
      action,
      actorId: userId,
      description: existing.title,
      category: existing.category,
      location: existing.room,
      maintenanceLogId: args.id,
    });
  },
});

export const addVisit = mutation({
  args: {
    id: v.id("homeMaintenanceLogs"),
    date: v.string(),
    contractor: v.string(),
    summary: v.string(),
    outcome: v.string(),
    cost: v.optional(v.number()),
    notes: v.optional(v.string()),
    updateStatus: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuthenticatedUser(ctx);

    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Maintenance log not found");

    assertValidDate(args.date, "date");
    const contractor = assertRequiredText(args.contractor, "contractor");
    const summary = assertRequiredText(args.summary, "summary");
    assertValidVisitOutcome(args.outcome);
    if (args.cost !== undefined) {
      assertNonNegativeNumber(args.cost, "cost");
    }

    const visitId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const nextVisits = [
      ...(existing.visits ?? []),
      {
        id: visitId,
        date: args.date,
        contractor,
        summary,
        outcome: args.outcome,
        cost: args.cost,
        notes: normalizeOptionalText(args.notes),
      },
    ].sort((a, b) => a.date.localeCompare(b.date));

    const patch: Partial<Doc<"homeMaintenanceLogs">> = {
      visits: nextVisits,
      updatedAt: Date.now(),
    };

    if (args.updateStatus) {
      assertValidMaintenanceStatus(args.updateStatus);
      patch.status = args.updateStatus;
      if (args.updateStatus === "resolved") {
        patch.resolvedDate = args.date;
      }
    }

    await ctx.db.patch(args.id, patch);

    await recordActivity(ctx, {
      action: "maintenance.visit_logged",
      actorId: userId,
      amount: args.cost,
      description: `${existing.title} · ${contractor}`,
      category: existing.category,
      location: existing.room,
      maintenanceLogId: args.id,
    });

    return visitId;
  },
});

export const removeVisit = mutation({
  args: {
    id: v.id("homeMaintenanceLogs"),
    visitId: v.string(),
  },
  handler: async (ctx, args) => {
    await requireAuthenticatedUser(ctx);

    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Maintenance log not found");

    await ctx.db.patch(args.id, {
      visits: (existing.visits ?? []).filter((v) => v.id !== args.visitId),
      updatedAt: Date.now(),
    });
  },
});

export const remove = mutation({
  args: { id: v.id("homeMaintenanceLogs") },
  handler: async (ctx, args) => {
    const userId = await requireAuthenticatedUser(ctx);

    const existing = await ctx.db.get(args.id);
    if (!existing) return;

    await ctx.db.delete(args.id);

    for (const storageId of existing.photoStorageIds ?? []) {
      await ctx.storage.delete(storageId);
    }

    await recordActivity(ctx, {
      action: "maintenance.deleted",
      actorId: userId,
      description: existing.title,
      category: existing.category,
      location: existing.room,
      maintenanceLogId: args.id,
    });
  },
});
