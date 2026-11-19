import { expect, test, type Page } from "@playwright/test";
import {
  cloneSeed,
  DEMO_DATE,
  metrics,
  number,
  STORAGE_KEY,
  type Store,
} from "../app/demo-data";

async function nav(page: Page, name: string) {
  if (
    await page
      .getByRole("button", { name: "Open navigation", exact: true })
      .isVisible()
  )
    await page
      .getByRole("button", { name: "Open navigation", exact: true })
      .click();
  await page.getByRole("button", { name, exact: true }).first().click();
}
async function state(page: Page): Promise<Store> {
  return page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)!),
    STORAGE_KEY,
  );
}
async function searchTable(page: Page, title: string, term: string) {
  await page
    .getByRole("textbox", { name: `Search ${title}`, exact: true })
    .fill(term);
}
async function openOrder(page: Page, issue: string) {
  await nav(page, "Maintenance");
  await searchTable(page, "Work order queue", issue);
  await page.locator(".record-link").filter({ hasText: issue }).click();
}
async function resolve(page: Page, issue: string) {
  await openOrder(page, issue);
  await page.getByRole("button", { name: "Edit record", exact: true }).click();
  await page.getByLabel("Workflow status").selectOption("Resolved");
  await page
    .getByLabel("Resolution notes")
    .fill("Replaced hydraulic hose; pressure tested and released by workshop.");
  await page.getByRole("button", { name: "Save record", exact: true }).click();
}

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Your operations, at a glance" }),
  ).toBeVisible();
});

test("production affects logbook, executive KPIs, reporting and refresh", async ({
  page,
}) => {
  const initial = metrics(cloneSeed(), DEMO_DATE, DEMO_DATE).tonnes;
  await nav(page, "Mining operations");
  await page
    .getByRole("button", { name: "Log production", exact: true })
    .click();
  await page.getByLabel("Tonnes produced").fill("1250");
  await page.getByLabel("Haulage trips").fill("29");
  await page
    .getByLabel("Notes", { exact: true })
    .fill("Management demonstration shift");
  await page.getByRole("button", { name: "Save record", exact: true }).click();
  const data = await state(page);
  const record = data.production.find(
    (p) => p.notes === "Management demonstration shift",
  )!;
  expect(record.tonnes).toBe(1250);
  await searchTable(page, "Production logbook", record.id);
  await expect(page.locator("tbody tr")).toHaveCount(1);
  await nav(page, "Executive dashboard");
  await expect(
    page.getByRole("button", { name: /Total production/ }),
  ).toContainText(`${number(initial + 1250)} t`);
  await nav(page, "Reports & analytics");
  await expect(
    page.getByRole("button", { name: /Total production/ }),
  ).toContainText(`${number(initial + 1250)} t`);
  await page.reload();
  await expect(
    page.getByRole("button", { name: /Total production/ }),
  ).toContainText(`${number(initial + 1250)} t`);
});

test("two breakdowns, resolution safeguards, and work-order reopening update the fleet", async ({
  page,
}) => {
  const machine = cloneSeed().assets.find((a) => a.status === "Operational")!;
  const initial = metrics(cloneSeed(), DEMO_DATE, DEMO_DATE).available;
  await nav(page, "Fleet & equipment");
  await searchTable(page, "Equipment register", machine.id);
  await page.locator(".record-link").click();
  await page
    .getByRole("button", { name: "Report breakdown", exact: true })
    .click();
  await page.getByLabel("Fault description").fill("QA hydraulic fault one");
  await page.getByLabel("Assigned technician").selectOption("EMP-149");
  await page.getByRole("button", { name: "Save record", exact: true }).click();
  let data = await state(page);
  expect(data.assets.find((a) => a.id === machine.id)?.status).toBe(
    "Maintenance",
  );
  expect(metrics(data, DEMO_DATE, DEMO_DATE).available).toBe(initial - 1);
  await nav(page, "Maintenance");
  await page
    .getByRole("button", { name: "Report breakdown", exact: true })
    .click();
  await page.getByLabel("Machine").selectOption(machine.id);
  await page.getByLabel("Fault description").fill("QA hydraulic fault two");
  await page.getByRole("button", { name: "Save record", exact: true }).click();
  await resolve(page, "QA hydraulic fault one");
  data = await state(page);
  expect(data.assets.find((a) => a.id === machine.id)?.status).toBe(
    "Maintenance",
  );
  await nav(page, "Fleet & equipment");
  await searchTable(page, "Equipment register", machine.id);
  await page.locator(".record-link").click();
  await page.getByRole("button", { name: "Edit record", exact: true }).click();
  await page.getByLabel("Operational status").selectOption("Operational");
  await page.getByRole("button", { name: "Save record", exact: true }).click();
  await expect(page.locator(".error-message")).toContainText(
    "Resolve all breakdown",
  );
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await resolve(page, "QA hydraulic fault two");
  data = await state(page);
  expect(data.assets.find((a) => a.id === machine.id)?.status).toBe(
    "Operational",
  );
  expect(metrics(data, DEMO_DATE, DEMO_DATE).available).toBe(initial);
  await openOrder(page, "QA hydraulic fault one");
  await page.getByRole("button", { name: "Edit record", exact: true }).click();
  await page.getByLabel("Workflow status").selectOption("Open");
  await page.getByRole("button", { name: "Save record", exact: true }).click();
  data = await state(page);
  expect(data.assets.find((a) => a.id === machine.id)?.status).toBe(
    "Maintenance",
  );
  await page
    .getByRole("button", { name: "View notifications", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toContainText(
    "QA hydraulic fault one",
  );
});

test("customer and linked contract can be created, edited and followed through profiles", async ({
  page,
}) => {
  await nav(page, "Customers");
  await page
    .getByRole("button", { name: "Add customer", exact: true })
    .first()
    .click();
  await page.getByLabel("Company name").fill("QA Fictional Minerals");
  await page.getByLabel("Industry").fill("Mining");
  await page.getByLabel("Primary contact").fill("Demo Contact");
  await page.getByLabel("Contact email").fill("qa@example.invalid");
  await page.getByLabel("Contact phone").fill("+27 10 555 3000");
  await page.getByRole("button", { name: "Save record", exact: true }).click();
  await searchTable(page, "Customer directory", "QA Fictional Minerals");
  await page.locator(".record-link").click();
  await page
    .getByRole("button", { name: "Create linked contract", exact: true })
    .click();
  await page.getByLabel("Agreement name").fill("QA loading and hauling");
  await page.getByLabel("Contract value").fill("6500000");
  await page.getByRole("button", { name: "Save record", exact: true }).click();
  let data = await state(page);
  const customer = data.customers.find(
    (c) => c.name === "QA Fictional Minerals",
  )!;
  const contract = data.contracts.find(
    (c) => c.title === "QA loading and hauling",
  )!;
  expect(contract.customerId).toBe(customer.id);
  await nav(page, "Contracts");
  await searchTable(page, "Contract register", "QA loading");
  await page.locator(".record-link").click();
  await expect(page.getByRole("dialog")).toContainText("QA Fictional Minerals");
  await page
    .getByRole("button", { name: "Manage renewal and dates", exact: true })
    .click();
  await page.getByLabel("Contract status").selectOption("Active");
  await page.getByLabel("End date").fill("2028-06-30");
  await page.getByLabel("Renewal review").fill("2028-05-31");
  await page.getByRole("button", { name: "Save record", exact: true }).click();
  data = await state(page);
  expect(data.contracts.find((c) => c.id === contract.id)?.endDate).toBe(
    "2028-06-30",
  );
  await nav(page, "Customers");
  await searchTable(page, "Customer directory", customer.name);
  await page.locator(".record-link").click();
  await expect(page.getByRole("dialog")).toContainText(
    "QA loading and hauling",
  );
  await expect(page.getByRole("dialog")).toContainText("North Ridge");
});

test("workforce assignment, duty analytics and equipment transfer stay consistent", async ({
  page,
}) => {
  await nav(page, "Workforce");
  await page
    .getByRole("button", { name: "Add employee", exact: true })
    .first()
    .click();
  await page.getByLabel("Full name").fill("QA Demo Operator");
  await page.getByLabel("Assigned site").selectOption("S-02");
  await page.getByLabel("Shift").selectOption("Night");
  await page.getByRole("button", { name: "Save record", exact: true }).click();
  let data = await state(page);
  const worker = data.workers.find((w) => w.name === "QA Demo Operator")!;
  expect(worker.status).toBe("On duty");
  expect(data.workers.filter((w) => w.status === "On duty").length).toBe(58);
  await searchTable(page, "Employee directory", worker.id);
  await page.locator(".record-link").click();
  await page.getByRole("button", { name: "Edit record", exact: true }).click();
  await page.getByLabel("Duty status").selectOption("Off duty");
  await page.getByRole("button", { name: "Save record", exact: true }).click();
  await expect(page.locator(".compact-metrics")).toContainText("57");
  await nav(page, "Fleet & equipment");
  const machine = cloneSeed().assets.find((a) => a.status === "Operational")!;
  await searchTable(page, "Equipment register", machine.id);
  await page.locator(".record-link").click();
  await page
    .getByRole("button", { name: "Transfer / assign operator", exact: true })
    .click();
  await page.getByLabel("Assigned site").selectOption("S-02");
  await page.getByLabel("Assigned operator").selectOption(worker.id);
  await page.getByRole("button", { name: "Save record", exact: true }).click();
  data = await state(page);
  expect(data.assets.find((a) => a.id === machine.id)?.siteId).toBe("S-02");
  expect(data.assets.find((a) => a.id === machine.id)?.operatorId).toBe(
    worker.id,
  );
  await nav(page, "Workforce");
  await searchTable(page, "Employee directory", worker.id);
  await page.locator(".record-link").click();
  await page.getByRole("button", { name: "Edit record", exact: true }).click();
  await page.getByLabel("Assigned site").selectOption("S-03");
  await page.getByRole("button", { name: "Save record", exact: true }).click();
  data = await state(page);
  expect(data.assets.find((a) => a.id === machine.id)?.operatorId).toBe("");
});

test("filters, global search, pagination, CSV export, print layout, guided tour and reset", async ({
  page,
}) => {
  await page.getByLabel("Date range preset").selectOption("30");
  const expected = metrics(cloneSeed(), "2026-10-21", DEMO_DATE, "S-02");
  await page.getByLabel("Filter by site").selectOption("S-02");
  await expect(
    page.getByRole("button", { name: /Total production/ }),
  ).toContainText(number(expected.tonnes));
  await page
    .getByRole("button", { name: "Global search", exact: true })
    .click();
  await page.getByLabel("Search all records").fill("Apex Mineral");
  await page.getByRole("button", { name: /Apex Mineral Resources/ }).click();
  await expect(page.getByRole("dialog")).toContainText("Customer contracts");
  await page.keyboard.press("Escape");
  await page.getByLabel("Filter by site").selectOption("All");
  await nav(page, "Fleet & equipment");
  await expect(page.locator("tbody tr")).toHaveCount(10);
  await page
    .getByRole("button", { name: "Next Equipment register page" })
    .click();
  await expect(page.locator(".pagination")).toContainText("11–20");
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export", exact: true }).click();
  const file = await downloadPromise;
  expect(file.suggestedFilename()).toBe("mysol-equipment-register.csv");
  await nav(page, "Reports & analytics");
  await page.emulateMedia({ media: "print" });
  await expect(page.locator(".sidebar")).toBeHidden();
  const fullReport = metrics(cloneSeed(), "2026-10-21", DEMO_DATE);
  await expect(page.locator("tbody tr")).toHaveCount(
    fullReport.orders.length +
      fullReport.contracts.length +
      fullReport.production.length,
  );
  await expect(
    page.getByRole("heading", { name: "Production performance", exact: true }),
  ).toBeVisible();
  await page.emulateMedia({ media: "screen" });
  await page
    .getByRole("button", { name: "Start guided demo", exact: true })
    .click();
  for (let i = 0; i < 7; i++)
    await page.getByRole("button", { name: "Next step", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Reports & analytics", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Finish", exact: true }).click();
  await nav(page, "Settings");
  await page
    .getByRole("button", { name: "Reset Demo Data", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Restore sample data", exact: true })
    .click();
  expect(await state(page)).toEqual(cloneSeed());
  await page.reload();
  await expect(
    page.getByRole("button", { name: /Total production/ }),
  ).toContainText(number(metrics(cloneSeed(), DEMO_DATE, DEMO_DATE).tonnes));
});

test("desktop, tablet and mobile layouts, keyboard dialogs, forms and tables", async ({
  page,
}) => {
  for (const [name, width, height] of [
    ["desktop", 1440, 1000],
    ["tablet", 834, 1112],
    ["mobile", 390, 844],
  ] as const) {
    await page.setViewportSize({ width, height });
    await nav(page, "Executive dashboard");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    const markerLabels = await page
      .locator(".command-stage .map-marker > span")
      .evaluateAll((labels) =>
        labels.map((label) => {
          const r = label.getBoundingClientRect();
          return { left: r.left, top: r.top, right: r.right, bottom: r.bottom };
        }),
      );
    for (let i = 0; i < markerLabels.length; i++)
      for (let j = i + 1; j < markerLabels.length; j++) {
        const a = markerLabels[i],
          b = markerLabels[j];
        expect(
          a.right <= b.left ||
            b.right <= a.left ||
            a.bottom <= b.top ||
            b.bottom <= a.top,
        ).toBe(true);
      }
    await page.screenshot({
      path: `qa/screenshots/test-dashboard-${name}.png`,
      fullPage: true,
    });
    await nav(page, "Mining operations");
    await page
      .getByRole("button", { name: "Log production", exact: true })
      .click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    const bounds = await dialog.boundingBox();
    expect(bounds!.width).toBeLessThanOrEqual(width);
    expect(bounds!.height).toBeLessThanOrEqual(height);
    await page.screenshot({
      path: `qa/screenshots/test-form-${name}.png`,
      fullPage: true,
    });
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "Log production", exact: true }),
    ).toBeFocused();
    await nav(page, "Workforce");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `qa/screenshots/test-table-${name}.png`,
      fullPage: true,
    });
  }
});

test("invalid persisted data is recoverable and standard navigation has no browser errors", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.evaluate(
    (key) => localStorage.setItem(key, '{"broken": true}'),
    STORAGE_KEY,
  );
  await page.reload();
  await expect(page.locator(".error-message")).toContainText(
    "could not be read",
  );
  await nav(page, "Settings");
  await page
    .getByRole("button", { name: "Reset Demo Data", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Restore sample data", exact: true })
    .click();
  for (const name of [
    "Mining operations",
    "Sites",
    "Fleet & equipment",
    "Maintenance",
    "Customers",
    "Contracts",
    "Workforce",
    "Reports & analytics",
    "Settings",
  ])
    await nav(page, name);
  expect(errors).toEqual([]);
});

test("site and equipment registration, safe deletion, JSON restore and storage failures", async ({
  page,
}) => {
  await nav(page, "Sites");
  await page
    .getByRole("button", { name: "Add mining site", exact: true })
    .first()
    .click();
  await page.getByLabel("Name", { exact: false }).fill("QA Sample Mine");
  await page.getByLabel("Region").fill("Limpopo");
  await page.getByLabel("Commodity").fill("Platinum");
  await page.getByLabel("Daily target").fill("2200");
  await page.getByRole("button", { name: "Save record", exact: true }).click();
  let data = await state(page);
  const site = data.sites.find((s) => s.name === "QA Sample Mine")!;
  await nav(page, "Fleet & equipment");
  await page
    .getByRole("button", { name: "Add equipment", exact: true })
    .first()
    .click();
  await page.getByLabel("Unique asset ID").fill("QA-NEW-01");
  await page.getByLabel("Name", { exact: false }).fill("QA Demo Excavator");
  await page.getByLabel("Manufacturer").fill("Demo manufacturer");
  await page.getByLabel("Model").fill("D100");
  await page.getByLabel("Assigned site").selectOption(site.id);
  await page.getByRole("button", { name: "Save record", exact: true }).click();
  data = await state(page);
  expect(data.assets.find((a) => a.id === "QA-NEW-01")?.siteId).toBe(site.id);
  await nav(page, "Settings");
  const backupEvent = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Export demo backup", exact: true })
    .click();
  expect((await backupEvent).suggestedFilename()).toBe(
    "mysol-demo-backup.json",
  );
  await nav(page, "Sites");
  await searchTable(page, "Site register", site.id);
  await page.locator(".record-link").click();
  await page
    .getByRole("button", { name: "Delete record", exact: true })
    .click();
  await page
    .getByRole("dialog", { name: "Delete this demo record?" })
    .getByRole("button", { name: "Delete record", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText(
    "Transfer or remove all linked",
  );
  await page.keyboard.press("Escape");
  await nav(page, "Settings");
  await page
    .getByRole("button", { name: "Reset Demo Data", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Restore sample data", exact: true })
    .click();
  await page.locator('input[type="file"]').setInputFiles({
    name: "demo.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify({ version: 3, data })),
  });
  await expect(page.getByRole("status")).toContainText("backup restored");
  expect((await state(page)).assets.some((a) => a.id === "QA-NEW-01")).toBe(
    true,
  );
  await page.evaluate(() => {
    Storage.prototype.setItem = () => {
      throw new DOMException("QuotaExceededError");
    };
  });
  await nav(page, "Mining operations");
  await page
    .getByRole("button", { name: "Log production", exact: true })
    .click();
  await page.getByLabel("Tonnes produced").fill("100");
  await page.getByRole("button", { name: "Save record", exact: true }).click();
  await expect(page.locator(".error-message")).toContainText(
    "Changes were not saved",
  );
  expect((await state(page)).production).toHaveLength(512);
});
