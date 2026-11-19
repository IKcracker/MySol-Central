import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";
await mkdir("qa/screenshots", { recursive: true });
const browser = await chromium.launch({
  channel: process.env.PLAYWRIGHT_CHANNEL || "chrome",
  headless: true,
});
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const issues = [];
page.on("pageerror", (error) => issues.push(error.message));
page.on("console", (message) => {
  if (message.type() === "error") issues.push(message.text());
});
await page.goto(process.env.BASE_URL || "http://localhost:3000");
await page
  .getByRole("heading", { name: "Your operations, at a glance" })
  .waitFor();
await page.locator(".machine-overlay-image img").evaluate((img) => img.decode());
await page.screenshot({
  path: "qa/screenshots/dashboard-desktop.png",
  fullPage: true,
});
for (const [name, width, height] of [
  ["tablet", 834, 1112],
  ["mobile", 390, 844],
]) {
  await page.setViewportSize({ width, height });
  await page.screenshot({
    path: `qa/screenshots/dashboard-${name}.png`,
    fullPage: true,
  });
}
await page.setViewportSize({ width: 1440, height: 1000 });
await page
  .getByRole("button", { name: "Fleet & equipment", exact: true })
  .click();
await page.locator(".fleet-hero-image img").evaluate((img) => img.decode());
await page.screenshot({
  path: "qa/screenshots/fleet-desktop.png",
  fullPage: true,
});
console.log(JSON.stringify({ browserErrors: issues }));
await browser.close();
