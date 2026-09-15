import { describe, expect, it } from "bun:test";
import {
  assertPositiveAmount,
  assertValidDate,
  assertValidMonth,
  assertValidSplitType,
  assertValidFrequency,
  assertValidSettlementStatus,
  assertValidStoredFile,
} from "./validation";
import { Id } from "../_generated/dataModel";

describe("validation helpers", () => {
  describe("month validation", () => {
    it("accepts valid month", () => {
      expect(() => assertValidMonth("2024-12")).not.toThrow();
      expect(() => assertValidMonth("2024-01")).not.toThrow();
    });

    it("rejects invalid month", () => {
      expect(() => assertValidMonth("2024-13")).toThrow();
      expect(() => assertValidMonth("24-01")).toThrow();
      expect(() => assertValidMonth("2024-00")).toThrow();
    });
  });

  describe("date validation", () => {
    it("accepts valid date", () => {
      expect(() => assertValidDate("2024-02-29")).not.toThrow();
      expect(() => assertValidDate("2024-12-31")).not.toThrow();
    });

    it("rejects invalid date", () => {
      expect(() => assertValidDate("2024-13-01")).toThrow();
      expect(() => assertValidDate("2024-00-10")).toThrow();
      expect(() => assertValidDate("2024-12-32")).toThrow();
    });
  });

  describe("amount validation", () => {
    it("accepts positive amounts", () => {
      expect(() => assertPositiveAmount(0.01)).not.toThrow();
      expect(() => assertPositiveAmount(100)).not.toThrow();
    });

    it("rejects non-positive amounts", () => {
      expect(() => assertPositiveAmount(0)).toThrow();
      expect(() => assertPositiveAmount(-5)).toThrow();
      expect(() => assertPositiveAmount(Number.NaN)).toThrow();
    });
  });

  describe("splitType validation", () => {
    it("accepts valid split types", () => {
      expect(() => assertValidSplitType("50/50")).not.toThrow();
      expect(() => assertValidSplitType("custom")).not.toThrow();
      expect(() => assertValidSplitType("100%")).not.toThrow();
    });

    it("rejects invalid split types", () => {
      expect(() => assertValidSplitType("invalid")).toThrow();
      expect(() => assertValidSplitType("")).toThrow();
      expect(() => assertValidSplitType("50-50")).toThrow();
    });
  });

  describe("frequency validation", () => {
    it("accepts valid frequencies", () => {
      expect(() => assertValidFrequency("monthly")).not.toThrow();
    });

    it("rejects invalid frequencies", () => {
      expect(() => assertValidFrequency("weekly")).toThrow();
      expect(() => assertValidFrequency("yearly")).toThrow();
      expect(() => assertValidFrequency("daily")).toThrow();
      expect(() => assertValidFrequency("")).toThrow();
      expect(() => assertValidFrequency("biweekly")).toThrow();
    });
  });

  describe("settlement status validation", () => {
    it("accepts valid statuses", () => {
      expect(() => assertValidSettlementStatus("pending")).not.toThrow();
      expect(() => assertValidSettlementStatus("completed")).not.toThrow();
    });

    it("rejects invalid statuses", () => {
      expect(() => assertValidSettlementStatus("cancelled")).toThrow();
      expect(() => assertValidSettlementStatus("")).toThrow();
      expect(() => assertValidSettlementStatus("done")).toThrow();
    });
  });

  describe("stored file validation", () => {
    const storageId = "fake-storage-id" as Id<"_storage">;
    const makeCtx = (meta: { size: number; contentType: string | null } | null) => {
      const deleted: string[] = [];
      return {
        deleted,
        ctx: {
          storage: {
            getMetadata: async () => meta,
            delete: async (id: Id<"_storage">) => {
              deleted.push(id);
            },
          },
        },
      };
    };

    it("accepts an image within the size limit", async () => {
      const { ctx } = makeCtx({ size: 1024, contentType: "image/png" });
      await expect(assertValidStoredFile(ctx, storageId)).resolves.toBeUndefined();
    });

    it("accepts a PDF", async () => {
      const { ctx } = makeCtx({ size: 1024, contentType: "application/pdf" });
      await expect(assertValidStoredFile(ctx, storageId)).resolves.toBeUndefined();
    });

    it("rejects and deletes non-image non-PDF types", async () => {
      const { ctx, deleted } = makeCtx({ size: 1024, contentType: "application/x-msdownload" });
      await expect(assertValidStoredFile(ctx, storageId)).rejects.toThrow("Unsupported file type");
      expect(deleted).toEqual([storageId]);
    });

    it("rejects and deletes files over 10MB", async () => {
      const { ctx, deleted } = makeCtx({ size: 11 * 1024 * 1024, contentType: "image/png" });
      await expect(assertValidStoredFile(ctx, storageId)).rejects.toThrow("10MB");
      expect(deleted).toEqual([storageId]);
    });

    it("rejects when metadata is missing", async () => {
      const { ctx } = makeCtx(null);
      await expect(assertValidStoredFile(ctx, storageId)).rejects.toThrow("not found");
    });
  });
});
