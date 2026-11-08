import { ConvexError } from "convex/values";

/** The reason a mutation refused, when the backend meant it to be shown. */
export function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof ConvexError && typeof error.data === "string") return error.data;
  return fallback;
}
