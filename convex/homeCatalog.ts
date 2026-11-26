import { v } from "convex/values";
import { MutationCtx, QueryCtx, query } from "./_generated/server";
import { mutation } from "./utils/functions";
import { Doc, Id } from "./_generated/dataModel";
import { requireAuthenticatedUser } from "./utils/auth";
import { assertValidDate, assertValidStoredImage } from "./utils/validation";
import { getLocationsMap, getUsersMap } from "./utils/batchFetch";
import {
  assertNonNegativeNumber,
  assertOptionalPositiveNumber,
  assertValidDimensionUnit,
  assertValidEntryType,
  assertValidMovingStatus,
  assertValidWeightUnit,
  resolveArchiveState,
} from "./utils/homeCatalog";
import { recordActivity } from "./utils/activityLog";

const MAX_CATALOG_PHOTOS = 10;

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

function parseNullablePositive(
  value: number | null | undefined,
  fieldName: string,
): number | undefined {
  if (value === undefined || value === null) return undefined;
  assertOptionalPositiveNumber(value, fieldName);
  return value;
}

function parseNullableNonNegative(
  value: number | null | undefined,
  fieldName: string,
): number | undefined {
  if (value === undefined || value === null) return undefined;
  assertNonNegativeNumber(value, fieldName);
  return value;
}

function parseNullableDate(
  value: string | null | undefined,
  fieldName: string,
): string | undefined {
  if (!value) return undefined;
  assertValidDate(value, fieldName);
  return value;
}

async function validateCatalogPhotos(
  ctx: MutationCtx,
  photoStorageIds: Id<"_storage">[],
  existingIds?: Id<"_storage">[],
) {
  if (photoStorageIds.length > MAX_CATALOG_PHOTOS) {
    throw new Error(`At most ${MAX_CATALOG_PHOTOS} photos are allowed per item`);
  }
  const existingSet = new Set(existingIds ?? []);
  for (const storageId of photoStorageIds) {
    if (!existingSet.has(storageId)) {
      await assertValidStoredImage(ctx, storageId);
    }
  }
}

async function enrichCatalogItems(
  ctx: QueryCtx,
  items: Doc<"homeCatalogItems">[],
) {
  const [usersMap, locationsMap, addresses, maintenanceLogs] = await Promise.all([
    getUsersMap(ctx),
    getLocationsMap(ctx),
    ctx.db.query("addresses").collect(),
    ctx.db.query("homeMaintenanceLogs").collect(),
  ]);
  const addressMap = new Map(addresses.map((a) => [a._id, a]));
  const maintenanceByItem = new Map<
    Id<"homeCatalogItems">,
    { total: number; open: number }
  >();
  for (const log of maintenanceLogs) {
    if (!log.catalogItemId) continue;
    const prev = maintenanceByItem.get(log.catalogItemId) ?? {
      total: 0,
      open: 0,
    };
    prev.total += 1;
    if (log.status !== "resolved") prev.open += 1;
    maintenanceByItem.set(log.catalogItemId, prev);
  }

  const docIds = new Set<Id<"documents">>();
  const expenseIds = new Set<Id<"expenses">>();
  for (const item of items) {
    for (const docId of item.linkedDocumentIds ?? []) {
      docIds.add(docId);
    }
    if (item.linkedExpenseId) {
      expenseIds.add(item.linkedExpenseId);
    }
  }

  const [docsArray, expensesArray] = await Promise.all([
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
          expiryDate: doc.expiryDate,
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

  return await Promise.all(
    items.map(async (item) => {
      const photos = await Promise.all(
        (item.photoStorageIds ?? []).map(async (storageId) => ({
          storageId,
          url: await ctx.storage.getUrl(storageId),
        })),
      );

      const linkedDocuments = (item.linkedDocumentIds ?? [])
        .map((id) => docsMap.get(id))
        .filter((d): d is NonNullable<typeof d> => d !== undefined);

      const linkedExpense = item.linkedExpenseId
        ? expensesMap.get(item.linkedExpenseId) ?? null
        : null;

      const address = item.addressId ? addressMap.get(item.addressId) : null;
      const createdByUser = item.createdBy ? usersMap.get(item.createdBy) : null;
      const maintCounts = maintenanceByItem.get(item._id) ?? {
        total: 0,
        open: 0,
      };

      return {
        ...item,
        photos,
        linkedDocuments,
        linkedExpense,
        addressName: address?.name ?? null,
        maintenanceCount: maintCounts.total,
        openMaintenanceCount: maintCounts.open,
        createdByName:
          createdByUser?.username || createdByUser?.name || "Household",
      };
    }),
  );
}

// ============ UPDATE PATCH HELPERS ============

interface CatalogUpdateArgs {
  entryType?: string;
  name?: string;
  category?: string;
  room?: string;
  addressId?: Id<"addresses"> | null;
  brand?: string;
  modelNumber?: string;
  serialNumber?: string;
  width?: number | null;
  depth?: number | null;
  height?: number | null;
  dimensionUnit?: string;
  weight?: number | null;
  weightUnit?: string;
  measurementNotes?: string;
  purchasePrice?: number | null;
  purchaseDate?: string | null;
  retailer?: string;
  warrantyExpiryDate?: string | null;
  linkedExpenseId?: Id<"expenses"> | null;
  linkedDocumentIds?: Id<"documents">[];
  movingStatus?: string;
  salePrice?: number | null;
  notes?: string;
}

function applyCoreUpdates(
  patch: Partial<Doc<"homeCatalogItems">>,
  args: CatalogUpdateArgs,
) {
  if (args.entryType !== undefined) {
    assertValidEntryType(args.entryType);
    patch.entryType = args.entryType;
  }
  if (args.name !== undefined) patch.name = assertRequiredText(args.name, "name");
  if (args.category !== undefined) {
    patch.category = assertRequiredText(args.category, "category");
  }
  if (args.room !== undefined) patch.room = assertRequiredText(args.room, "room");
  if (args.addressId !== undefined) patch.addressId = args.addressId ?? undefined;
  if (args.brand !== undefined) patch.brand = normalizeOptionalText(args.brand);
  if (args.modelNumber !== undefined) {
    patch.modelNumber = normalizeOptionalText(args.modelNumber);
  }
  if (args.serialNumber !== undefined) {
    patch.serialNumber = normalizeOptionalText(args.serialNumber);
  }
  if (args.notes !== undefined) patch.notes = normalizeOptionalText(args.notes);
}

function applyMeasurementUpdates(
  patch: Partial<Doc<"homeCatalogItems">>,
  args: CatalogUpdateArgs,
) {
  if (args.width !== undefined) {
    patch.width = parseNullablePositive(args.width, "width");
  }
  if (args.depth !== undefined) {
    patch.depth = parseNullablePositive(args.depth, "depth");
  }
  if (args.height !== undefined) {
    patch.height = parseNullablePositive(args.height, "height");
  }
  if (args.dimensionUnit !== undefined) {
    assertValidDimensionUnit(args.dimensionUnit);
    patch.dimensionUnit = args.dimensionUnit;
  }
  if (args.weight !== undefined) {
    patch.weight = parseNullablePositive(args.weight, "weight");
  }
  if (args.weightUnit !== undefined) {
    assertValidWeightUnit(args.weightUnit);
    patch.weightUnit = args.weightUnit;
  }
  if (args.measurementNotes !== undefined) {
    patch.measurementNotes = normalizeOptionalText(args.measurementNotes);
  }
}

function applyPurchaseAndStatusUpdates(
  patch: Partial<Doc<"homeCatalogItems">>,
  args: CatalogUpdateArgs,
  existingArchivedAt?: number,
) {
  if (args.purchasePrice !== undefined) {
    patch.purchasePrice = parseNullableNonNegative(
      args.purchasePrice,
      "purchasePrice",
    );
  }
  if (args.purchaseDate !== undefined) {
    patch.purchaseDate = parseNullableDate(args.purchaseDate, "purchaseDate");
  }
  if (args.retailer !== undefined) {
    patch.retailer = normalizeOptionalText(args.retailer);
  }
  if (args.warrantyExpiryDate !== undefined) {
    patch.warrantyExpiryDate = parseNullableDate(
      args.warrantyExpiryDate,
      "warrantyExpiryDate",
    );
  }
  if (args.linkedExpenseId !== undefined) {
    patch.linkedExpenseId = args.linkedExpenseId ?? undefined;
  }
  if (args.linkedDocumentIds !== undefined) {
    patch.linkedDocumentIds = args.linkedDocumentIds;
  }
  if (args.salePrice !== undefined) {
    patch.salePrice = parseNullableNonNegative(args.salePrice, "salePrice");
  }
  if (args.movingStatus !== undefined) {
    assertValidMovingStatus(args.movingStatus);
    patch.movingStatus = args.movingStatus;
    const archiveState = resolveArchiveState(
      args.movingStatus,
      existingArchivedAt,
    );
    patch.isArchived = archiveState.isArchived;
    patch.archivedAt = archiveState.archivedAt;
  }
}

// ============ QUERIES ============

export const getAll = query({
  args: {},
  handler: async (ctx) => {
    await requireAuthenticatedUser(ctx);

    const items = await ctx.db.query("homeCatalogItems").collect();
    items.sort((a, b) => b.updatedAt - a.updatedAt);

    return await enrichCatalogItems(ctx, items);
  },
});

export const getById = query({
  args: { id: v.id("homeCatalogItems") },
  handler: async (ctx, args) => {
    await requireAuthenticatedUser(ctx);

    const item = await ctx.db.get(args.id);
    if (!item) return null;

    const [enriched] = await enrichCatalogItems(ctx, [item]);
    return enriched ?? null;
  },
});

// ============ MUTATIONS ============

export const create = mutation({
  args: {
    entryType: v.string(),
    name: v.string(),
    category: v.string(),
    room: v.string(),
    addressId: v.optional(v.id("addresses")),
    brand: v.optional(v.string()),
    modelNumber: v.optional(v.string()),
    serialNumber: v.optional(v.string()),
    width: v.optional(v.number()),
    depth: v.optional(v.number()),
    height: v.optional(v.number()),
    dimensionUnit: v.optional(v.string()),
    weight: v.optional(v.number()),
    weightUnit: v.optional(v.string()),
    measurementNotes: v.optional(v.string()),
    purchasePrice: v.optional(v.number()),
    purchaseDate: v.optional(v.string()),
    retailer: v.optional(v.string()),
    warrantyExpiryDate: v.optional(v.string()),
    linkedExpenseId: v.optional(v.id("expenses")),
    photoStorageIds: v.optional(v.array(v.id("_storage"))),
    linkedDocumentIds: v.optional(v.array(v.id("documents"))),
    movingStatus: v.optional(v.string()),
    salePrice: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuthenticatedUser(ctx);

    const name = assertRequiredText(args.name, "name");
    const category = assertRequiredText(args.category, "category");
    const room = assertRequiredText(args.room, "room");

    assertValidEntryType(args.entryType);
    const dimensionUnit = args.dimensionUnit ?? "cm";
    assertValidDimensionUnit(dimensionUnit);
    const weightUnit = args.weightUnit ?? "kg";
    assertValidWeightUnit(weightUnit);

    const movingStatus = args.movingStatus ?? "keeping";
    assertValidMovingStatus(movingStatus);

    assertOptionalPositiveNumber(args.width, "width");
    assertOptionalPositiveNumber(args.depth, "depth");
    assertOptionalPositiveNumber(args.height, "height");
    assertOptionalPositiveNumber(args.weight, "weight");
    const purchasePrice = parseNullableNonNegative(args.purchasePrice, "purchasePrice");
    const salePrice = parseNullableNonNegative(args.salePrice, "salePrice");
    const purchaseDate = parseNullableDate(args.purchaseDate, "purchaseDate");
    const warrantyExpiryDate = parseNullableDate(
      args.warrantyExpiryDate,
      "warrantyExpiryDate",
    );

    const photoStorageIds = args.photoStorageIds ?? [];
    if (photoStorageIds.length > 0) {
      await validateCatalogPhotos(ctx, photoStorageIds);
    }

    const now = Date.now();
    const archiveState = resolveArchiveState(movingStatus, undefined, now);

    const id = await ctx.db.insert("homeCatalogItems", {
      entryType: args.entryType,
      name,
      category,
      room,
      addressId: args.addressId,
      brand: normalizeOptionalText(args.brand),
      modelNumber: normalizeOptionalText(args.modelNumber),
      serialNumber: normalizeOptionalText(args.serialNumber),
      width: args.width,
      depth: args.depth,
      height: args.height,
      dimensionUnit,
      weight: args.weight,
      weightUnit,
      measurementNotes: normalizeOptionalText(args.measurementNotes),
      purchasePrice,
      purchaseDate,
      retailer: normalizeOptionalText(args.retailer),
      warrantyExpiryDate,
      linkedExpenseId: args.linkedExpenseId,
      photoStorageIds,
      linkedDocumentIds: args.linkedDocumentIds ?? [],
      movingStatus,
      salePrice,
      isArchived: archiveState.isArchived,
      archivedAt: archiveState.archivedAt,
      notes: normalizeOptionalText(args.notes),
      createdBy: userId,
      createdAt: now,
      updatedAt: now,
    });

    await recordActivity(ctx, {
      action: archiveState.isArchived ? "catalog.archived" : "catalog.added",
      actorId: userId,
      amount: purchasePrice,
      description: name,
      category,
      location: room,
      catalogItemId: id,
    });

    return id;
  },
});

export const update = mutation({
  args: {
    id: v.id("homeCatalogItems"),
    entryType: v.optional(v.string()),
    name: v.optional(v.string()),
    category: v.optional(v.string()),
    room: v.optional(v.string()),
    addressId: v.optional(v.union(v.id("addresses"), v.null())),
    brand: v.optional(v.string()),
    modelNumber: v.optional(v.string()),
    serialNumber: v.optional(v.string()),
    width: v.optional(v.union(v.number(), v.null())),
    depth: v.optional(v.union(v.number(), v.null())),
    height: v.optional(v.union(v.number(), v.null())),
    dimensionUnit: v.optional(v.string()),
    weight: v.optional(v.union(v.number(), v.null())),
    weightUnit: v.optional(v.string()),
    measurementNotes: v.optional(v.string()),
    purchasePrice: v.optional(v.union(v.number(), v.null())),
    purchaseDate: v.optional(v.union(v.string(), v.null())),
    retailer: v.optional(v.string()),
    warrantyExpiryDate: v.optional(v.union(v.string(), v.null())),
    linkedExpenseId: v.optional(v.union(v.id("expenses"), v.null())),
    photoStorageIds: v.optional(v.array(v.id("_storage"))),
    linkedDocumentIds: v.optional(v.array(v.id("documents"))),
    movingStatus: v.optional(v.string()),
    salePrice: v.optional(v.union(v.number(), v.null())),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuthenticatedUser(ctx);

    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Catalog item not found");

    const patch: Partial<Doc<"homeCatalogItems">> = {
      updatedAt: Date.now(),
    };

    applyCoreUpdates(patch, args);
    applyMeasurementUpdates(patch, args);
    applyPurchaseAndStatusUpdates(patch, args, existing.archivedAt);

    let removedPhotos: Id<"_storage">[] = [];
    if (args.photoStorageIds !== undefined) {
      const oldPhotos = existing.photoStorageIds ?? [];
      await validateCatalogPhotos(ctx, args.photoStorageIds, oldPhotos);
      const newSet = new Set(args.photoStorageIds);
      removedPhotos = oldPhotos.filter((id) => !newSet.has(id));
      patch.photoStorageIds = args.photoStorageIds;
    }

    await ctx.db.patch(args.id, patch);

    for (const storageId of removedPhotos) {
      await ctx.storage.delete(storageId);
    }

    const wasArchived = Boolean(existing.isArchived);
    const nowArchived =
      patch.isArchived !== undefined ? patch.isArchived : wasArchived;
    const action =
      !wasArchived && nowArchived
        ? "catalog.archived"
        : wasArchived && !nowArchived
          ? "catalog.restored"
          : "catalog.edited";

    await recordActivity(ctx, {
      action,
      actorId: userId,
      amount: patch.salePrice ?? patch.purchasePrice,
      description: patch.name ?? existing.name,
      category: patch.category ?? existing.category,
      location: patch.room ?? existing.room,
      catalogItemId: args.id,
    });
  },
});

export const setMovingStatus = mutation({
  args: {
    id: v.id("homeCatalogItems"),
    movingStatus: v.string(),
    salePrice: v.optional(v.union(v.number(), v.null())),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuthenticatedUser(ctx);
    assertValidMovingStatus(args.movingStatus);

    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Catalog item not found");

    const archiveState = resolveArchiveState(
      args.movingStatus,
      existing.archivedAt,
    );

    const patch: Partial<Doc<"homeCatalogItems">> = {
      movingStatus: args.movingStatus,
      isArchived: archiveState.isArchived,
      archivedAt: archiveState.archivedAt,
      updatedAt: Date.now(),
    };

    if (args.salePrice !== undefined) {
      patch.salePrice = parseNullableNonNegative(args.salePrice, "salePrice");
    }

    await ctx.db.patch(args.id, patch);

    await recordActivity(ctx, {
      action: archiveState.isArchived
        ? "catalog.archived"
        : existing.isArchived
          ? "catalog.restored"
          : "catalog.edited",
      actorId: userId,
      amount: patch.salePrice,
      description: `${existing.name} (${args.movingStatus.replace("_", " ")})`,
      category: existing.category,
      location: existing.room,
      catalogItemId: args.id,
    });

    return { isArchived: archiveState.isArchived };
  },
});

export const remove = mutation({
  args: { id: v.id("homeCatalogItems") },
  handler: async (ctx, args) => {
    const userId = await requireAuthenticatedUser(ctx);

    const existing = await ctx.db.get(args.id);
    if (!existing) return;

    // Unlink any maintenance logs referencing this catalog item
    const maintLogs = await ctx.db
      .query("homeMaintenanceLogs")
      .withIndex("by_catalog_item", (q) => q.eq("catalogItemId", args.id))
      .collect();
    for (const log of maintLogs) {
      await ctx.db.patch(log._id, { catalogItemId: undefined });
    }

    await ctx.db.delete(args.id);

    for (const storageId of existing.photoStorageIds ?? []) {
      await ctx.storage.delete(storageId);
    }

    await recordActivity(ctx, {
      action: "catalog.deleted",
      actorId: userId,
      description: existing.name,
      category: existing.category,
      location: existing.room,
      catalogItemId: args.id,
    });
  },
});
