import { Id } from "../_generated/dataModel";

const monthRegex = /^\d{4}-(0[1-9]|1[0-2])$/;
const dateRegex = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

// Valid enum values
export const VALID_SPLIT_TYPES = ["50/50", "custom", "100%"] as const;
export const VALID_FREQUENCIES = ["monthly"] as const;
export const VALID_SETTLEMENT_STATUSES = ["pending", "completed"] as const;

export type SplitType = (typeof VALID_SPLIT_TYPES)[number];
export type Frequency = (typeof VALID_FREQUENCIES)[number];
export type SettlementStatus = (typeof VALID_SETTLEMENT_STATUSES)[number];

export function assertValidMonth(month: string, context = "month") {
  if (typeof month !== "string" || !monthRegex.test(month)) {
    throw new Error(`${context} must be in YYYY-MM format`);
  }
}

export function assertValidDate(date: string, context = "date") {
  if (typeof date !== "string" || !dateRegex.test(date)) {
    throw new Error(`${context} must be in YYYY-MM-DD format`);
  }
}

export function assertPositiveAmount(amount: number, context = "amount") {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error(`${context} must be a positive number`);
  }
}

export function assertValidSplitType(
  splitType: string,
  context = "splitType",
): asserts splitType is SplitType {
  if (!VALID_SPLIT_TYPES.includes(splitType as SplitType)) {
    throw new Error(
      `${context} must be one of: ${VALID_SPLIT_TYPES.join(", ")}`,
    );
  }
}

export function assertValidFrequency(
  frequency: string,
  context = "frequency",
): asserts frequency is Frequency {
  if (!VALID_FREQUENCIES.includes(frequency as Frequency)) {
    throw new Error(
      `${context} must be one of: ${VALID_FREQUENCIES.join(", ")}`,
    );
  }
}

export function assertValidSettlementStatus(
  status: string,
  context = "status",
): asserts status is SettlementStatus {
  if (!VALID_SETTLEMENT_STATUSES.includes(status as SettlementStatus)) {
    throw new Error(
      `${context} must be one of: ${VALID_SETTLEMENT_STATUSES.join(", ")}`,
    );
  }
}

const MIN_PASSWORD_LENGTH = 8;

export function assertStrongPassword(password: string, context = "password") {
  if (typeof password !== "string" || password.length < MIN_PASSWORD_LENGTH) {
    throw new Error(
      `${context} must be at least ${MIN_PASSWORD_LENGTH} characters long`,
    );
  }
  if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
    throw new Error(
      `${context} must contain at least one letter and one number`,
    );
  }
}

const ALLOWED_UPLOAD_CONTENT_TYPES = ["image/", "application/pdf"];
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10MB

// Enforce upload policy at the server boundary — client-side checks in
// ReceiptUpload.tsx are bypassable since generateUploadUrl is unconstrained.
// Deletes the stored blob and throws when the file fails policy.
export async function assertValidStoredFile(
  ctx: { storage: { getMetadata(id: Id<"_storage">): Promise<{ size: number; contentType: string | null } | null>; delete(id: Id<"_storage">): Promise<void> } },
  storageId: Id<"_storage">,
) {
  const meta = await ctx.storage.getMetadata(storageId);
  if (!meta) {
    throw new Error("Uploaded file not found");
  }
  const contentType = meta.contentType ?? "";
  if (!ALLOWED_UPLOAD_CONTENT_TYPES.some((t) => contentType.startsWith(t))) {
    await ctx.storage.delete(storageId);
    throw new Error("Unsupported file type — images and PDFs only");
  }
  if (meta.size > MAX_UPLOAD_BYTES) {
    await ctx.storage.delete(storageId);
    throw new Error("File exceeds the 10MB limit");
  }
}
