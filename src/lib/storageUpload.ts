import { Id } from "../../convex/_generated/dataModel";

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

export interface FileValidationResult {
  valid: boolean;
  fileType?: "pdf" | "image";
  error?: string;
}

export function validateClientUploadFile(
  file: File,
  options: { allowPdf: boolean; maxBytes?: number },
): FileValidationResult {
  const maxBytes = options.maxBytes ?? MAX_UPLOAD_BYTES;
  const contentType = file.type.toLowerCase();
  const isPdf = contentType === "application/pdf";
  const isRasterImage =
    contentType.startsWith("image/") && contentType !== "image/svg+xml";

  if (options.allowPdf) {
    if (!isPdf && !isRasterImage) {
      return {
        valid: false,
        error: "Please select a PDF or raster image file (PNG, JPG, WebP).",
      };
    }
  } else if (!isRasterImage) {
    return {
      valid: false,
      error: "Please select a raster image file (PNG, JPG, WebP).",
    };
  }

  if (file.size > maxBytes) {
    const mb = Math.round(maxBytes / (1024 * 1024));
    return {
      valid: false,
      error: `File must be less than ${mb}MB.`,
    };
  }

  return { valid: true, fileType: isPdf ? "pdf" : "image" };
}

export async function uploadFileToConvex(
  file: File,
  generateUploadUrl: () => Promise<string>,
): Promise<Id<"_storage">> {
  const uploadUrl = await generateUploadUrl();
  const response = await fetch(uploadUrl, {
    method: "POST",
    headers: { "Content-Type": file.type },
    body: file,
  });
  if (!response.ok) {
    throw new Error("Upload failed");
  }
  const { storageId } = (await response.json()) as {
    storageId: Id<"_storage">;
  };
  return storageId;
}
