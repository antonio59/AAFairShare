import { describe, expect, it } from "bun:test";
import { whoOwesWhom } from "./settlementCopy";

describe("whoOwesWhom", () => {
  it("names the person who owes", () => {
    expect(whoOwesWhom(24.75, "owes", "Antonio", "Jamie")).toBe("Antonio owes Jamie");
    expect(whoOwesWhom(10, "owed", "Antonio", "Jamie")).toBe("Jamie owes Antonio");
  });

  it("says all square when the month balances", () => {
    expect(whoOwesWhom(0, "even", "Antonio", "Jamie")).toBe("All square");
    expect(whoOwesWhom(0, "owes", "Antonio", "Jamie")).toBe("All square");
  });
});
