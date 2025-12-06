import { chromium, devices } from "playwright";

const mobile = devices["iPhone 13"];
const BASE_URL = process.env.BASE_URL || "http://localhost:5002";
const OUT_DIR = process.env.OUT_DIR || "./artifacts/screenshots";

const shots: { path: string; url: string; wait?: number }[] = [
  { path: "01-dashboard.png", url: "/" },
  { path: "02-add-expense.png", url: "/add-expense" },
  { path: "03-recurring.png", url: "/recurring" },
  { path: "04-savings.png", url: "/savings" },
  { path: "05-receipts.png", url: "/receipts" },
  { path: "06-analytics.png", url: "/analytics" },
  { path: "07-settings.png", url: "/settings" },
];

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ ...mobile, baseURL: BASE_URL });
  const page = await context.newPage();

  for (const shot of shots) {
    const target = `${BASE_URL}${shot.url}`;
    await page.goto(target, { waitUntil: "networkidle" });
    if (shot.wait) await page.waitForTimeout(shot.wait);
    await page.screenshot({ path: `${OUT_DIR}/${shot.path}`, fullPage: true });
    console.log(`Captured ${shot.path} from ${target}`);
  }

  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
