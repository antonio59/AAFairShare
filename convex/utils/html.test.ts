import { describe, expect, it } from "bun:test";
import { escapeHtml } from "./html";

describe("escapeHtml", () => {
  it("escapes the five HTML-sensitive characters", () => {
    expect(escapeHtml(`<script>alert("x")</script>`)).toBe(
      "&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;",
    );
    expect(escapeHtml("a & b")).toBe("a &amp; b");
    expect(escapeHtml("it's")).toBe("it&#39;s");
  });

  it("escapes ampersands first so entities are not double-encoded", () => {
    expect(escapeHtml("<b>&</b>")).toBe("&lt;b&gt;&amp;&lt;/b&gt;");
  });

  it("leaves safe strings unchanged", () => {
    expect(escapeHtml("Alice")).toBe("Alice");
    expect(escapeHtml("")).toBe("");
  });
});
