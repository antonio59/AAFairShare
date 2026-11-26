import { describe, expect, test } from "bun:test";
import { escapeCsvCell } from "./catalogConstants";

describe("escapeCsvCell", () => {
  test("returns plain values unchanged", () => {
    expect(escapeCsvCell("Samsung Washer")).toBe("Samsung Washer");
    expect(escapeCsvCell(549.99)).toBe("549.99");
    expect(escapeCsvCell(undefined)).toBe("");
    expect(escapeCsvCell(null)).toBe("");
  });

  test("quotes values containing commas, quotes, or newlines", () => {
    expect(escapeCsvCell('IKEA "KIVIK", 3-seat')).toBe('"IKEA ""KIVIK"", 3-seat"');
    expect(escapeCsvCell("Line 1\nLine 2")).toBe('"Line 1\nLine 2"');
  });

  test("neutralizes spreadsheet formula injection prefixes", () => {
    expect(escapeCsvCell("=CMD|' /C calc'!A0")).toBe("'=CMD|' /C calc'!A0");
    expect(escapeCsvCell("+1+1")).toBe("'+1+1");
    expect(escapeCsvCell("-2+3")).toBe("'-2+3");
    expect(escapeCsvCell("@SUM(A1:A2)")).toBe("'@SUM(A1:A2)");
    expect(escapeCsvCell("=HYPERLINK(\"http://evil\",\"click\")")).toBe(
      '"\'=HYPERLINK(""http://evil"",""click"")"',
    );
  });
});
