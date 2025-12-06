import { chromium, devices } from "playwright";

const mobile = devices["iPhone 13"];
const BASE_URL = process.env.BASE_URL || "http://localhost:5002";
const OUT_DIR = process.env.OUT_DIR || "./artifacts/screenshots";
const VIEWPORT = process.env.VIEWPORT || "mobile"; // "mobile" | "desktop"

const shots: { path: string; url: string; wait?: number }[] = [
  { path: "01-dashboard.png", url: "/dashboard", wait: 800 },
  { path: "02-add-expense.png", url: "/add-expense" },
  { path: "03-recurring.png", url: "/recurring" },
  { path: "04-savings.png", url: "/savings" },
  { path: "05-receipts.png", url: "/receipts" },
  { path: "06-analytics.png", url: "/analytics" },
  { path: "07-settings.png", url: "/settings" },
];

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = VIEWPORT === "desktop"
    ? await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, baseURL: BASE_URL })
    : await browser.newContext({ ...mobile, baseURL: BASE_URL });
  const page = await context.newPage();

  page.on("pageerror", (err) => console.error("pageerror", err));
  page.on("console", (msg) => {
    if (msg.type() === "error") console.error("console error", msg.text());
  });

  for (const shot of shots) {
    const target = `${BASE_URL}${shot.url}`;
    await page.goto(target, { waitUntil: "networkidle" });
    await page.waitForTimeout(shot.wait ?? 400);
    await page.screenshot({ path: `${OUT_DIR}/${shot.path}`, fullPage: true });
    console.log(`Captured ${shot.path} from ${target}`);
  }

  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
