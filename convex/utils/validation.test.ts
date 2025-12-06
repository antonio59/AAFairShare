import { describe, expect, it } from "bun:test";
import {
  assertPositiveAmount,
  assertValidDate,
  assertValidMonth,
} from "./validation";

describe("validation helpers", () => {
  it("accepts valid month", () => {
    expect(() => assertValidMonth("2024-12")).not.toThrow();
  });

  it("rejects invalid month", () => {
    expect(() => assertValidMonth("2024-13")).toThrow();
    expect(() => assertValidMonth("24-01")).toThrow();
  });

  it("accepts valid date", () => {
    expect(() => assertValidDate("2024-02-29")).not.toThrow();
  });

  it("rejects invalid date", () => {
    expect(() => assertValidDate("2024-13-01")).toThrow();
    expect(() => assertValidDate("2024-00-10")).toThrow();
    expect(() => assertValidDate("2024-12-32")).toThrow();
  });

  it("accepts positive amounts", () => {
    expect(() => assertPositiveAmount(0.01)).not.toThrow();
  });

  it("rejects non-positive amounts", () => {
    expect(() => assertPositiveAmount(0)).toThrow();
    expect(() => assertPositiveAmount(-5)).toThrow();
    expect(() => assertPositiveAmount(Number.NaN)).toThrow();
  });
});
