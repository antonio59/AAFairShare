import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAuthenticatedUser } from "./utils/auth";

export const getAll = query({
  args: {},
  handler: async (ctx) => {
    await requireAuthenticatedUser(ctx);

    const mappings = await ctx.db.query("merchantMappings").collect();

    // Enrich with category/location names
    const enriched = await Promise.all(
      mappings.map(async (m) => {
        const category = await ctx.db.get(m.categoryId);
        const location = m.locationId ? await ctx.db.get(m.locationId) : null;
        return {
          ...m,
          categoryName: category?.name || "Unknown",
          locationName: location?.name,
        };
      })
    );

    return enriched;
  },
});

export const create = mutation({
  args: {
    merchantPattern: v.string(),
    categoryId: v.id("categories"),
    locationId: v.optional(v.id("locations")),
    isUtility: v.boolean(),
  },
  handler: async (ctx, args) => {
    await requireAuthenticatedUser(ctx);

    return await ctx.db.insert("merchantMappings", {
      merchantPattern: args.merchantPattern.toLowerCase(),
      categoryId: args.categoryId,
      locationId: args.locationId,
      isUtility: args.isUtility,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("merchantMappings"),
    merchantPattern: v.optional(v.string()),
    categoryId: v.optional(v.id("categories")),
    locationId: v.optional(v.id("locations")),
    isUtility: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await requireAuthenticatedUser(ctx);

    const { id, ...updates } = args;
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([, value]) => value !== undefined)
    );

    if (typeof filteredUpdates.merchantPattern === "string") {
      filteredUpdates.merchantPattern = filteredUpdates.merchantPattern.toLowerCase();
    }

    await ctx.db.patch(id, filteredUpdates);
  },
});

export const remove = mutation({
  args: { id: v.id("merchantMappings") },
  handler: async (ctx, args) => {
    await requireAuthenticatedUser(ctx);
    await ctx.db.delete(args.id);
  },
});

// Seed common UK utility mappings
export const seedUtilityMappings = mutation({
  args: {},
  handler: async (ctx) => {
    await requireAuthenticatedUser(ctx);

    // Find or create "Utilities" category
    let utilitiesCategory = await ctx.db
      .query("categories")
      .withIndex("by_name", (q) => q.eq("name", "Utilities"))
      .first();

    if (!utilitiesCategory) {
      const catId = await ctx.db.insert("categories", {
        name: "Utilities",
        icon: "zap",
        color: "#f59e0b",
      });
      utilitiesCategory = await ctx.db.get(catId);
    }

    if (!utilitiesCategory) return { created: 0 };

    // Find or create "Home" location
    let homeLocation = await ctx.db
      .query("locations")
      .withIndex("by_name", (q) => q.eq("name", "Home"))
      .first();

    if (!homeLocation) {
      const locId = await ctx.db.insert("locations", { name: "Home" });
      homeLocation = await ctx.db.get(locId);
    }

    // Common UK utility providers
    const utilityPatterns = [
      // Energy
      "british gas",
      "edf energy",
      "eon",
      "e.on",
      "scottish power",
      "sse",
      "octopus energy",
      "bulb",
      "ovo energy",
      "shell energy",
      "utilita",
      "utility warehouse",
      "so energy",
      "outfox the market",
      "good energy",
      "ecotricity",
      "green energy",
      "bristol energy",
      // Water
      "thames water",
      "severn trent",
      "united utilities",
      "anglian water",
      "yorkshire water",
      "southern water",
      "wessex water",
      "south west water",
      "northumbrian water",
      "affinity water",
      "south east water",
      "sutton and east surrey water",
      "portsmouth water",
      "ses water",
      "south staffs water",
      "cambridge water",
      "essex and suffolk water",
      // Internet/Phone/Broadband
      "bt",
      "virgin media",
      "sky",
      "talktalk",
      "plusnet",
      "vodafone",
      "ee",
      "three",
      "o2",
      "youfibre",
      "hyperoptic",
      "community fibre",
      "zen internet",
      "idnet",
      "aql",
      "giganet",
      "toob",
      "zzoomm",
      "trooli",
      "fibrus",
      "brsk",
      "wildanet",
      "county broadband",
      "cityfibre",
      "openreach",
      "now broadband",
      "shell broadband",
      "john lewis broadband",
      "utility warehouse broadband",
      // Mobile
      "giffgaff",
      "tesco mobile",
      "lebara",
      "lycamobile",
      "smarty",
      "voxi",
      "id mobile",
      // Council tax
      "council tax",
      "local authority",
      // TV License
      "tv licensing",
      // Insurance (home)
      "buildings insurance",
      "contents insurance",
      "home insurance",
      // Subscriptions often shared
      "netflix",
      "spotify",
      "disney+",
      "disney plus",
      "amazon prime",
      "apple tv",
      "youtube premium",
      "now tv",
    ];

    let created = 0;
    for (const pattern of utilityPatterns) {
      // Check if mapping exists
      const existing = await ctx.db
        .query("merchantMappings")
        .withIndex("by_pattern", (q) => q.eq("merchantPattern", pattern))
        .first();

      if (!existing) {
        await ctx.db.insert("merchantMappings", {
          merchantPattern: pattern,
          categoryId: utilitiesCategory._id,
          locationId: homeLocation?._id,
          isUtility: true,
        });
        created++;
      }
    }

    return { created };
  },
});
