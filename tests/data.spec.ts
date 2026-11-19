import { expect, test } from "@playwright/test";
import {
  assertStore,
  changeOrder,
  cloneSeed,
  DEMO_DATE,
  metrics,
} from "../app/demo-data";
import { initialDraft, saveRecord } from "../app/demo-forms";
import { csv } from "../app/demo-ui";
import { migrateLegacy } from "../app/demo-migration";

test("seed relationships, required volumes and deterministic calculations", () => {
  const data = cloneSeed();
  assertStore(data);
  expect(data.sites).toHaveLength(8);
  expect(data.assets).toHaveLength(48);
  expect(data.workers).toHaveLength(72);
  expect(data.customers).toHaveLength(12);
  expect(data.contracts).toHaveLength(20);
  expect(data.orders).toHaveLength(40);
  expect(new Set(data.production.map((p) => p.date)).size).toBe(32);
  expect(cloneSeed()).toEqual(data);
  expect(metrics(data, DEMO_DATE, DEMO_DATE).tonnes).toBe(
    data.production
      .filter((p) => p.date === DEMO_DATE)
      .reduce((n, p) => n + p.tonnes, 0),
  );
  expect(
    metrics(data, DEMO_DATE, DEMO_DATE, "S-01").assets.every(
      (a) => a.siteId === "S-01",
    ),
  ).toBe(true);
});
test("resolution notes, invalid amounts and incorrect contract dates are rejected", () => {
  const data = cloneSeed();
  expect(() =>
    changeOrder(data, data.orders[0].id, {
      status: "Resolved",
      resolution: "",
    }),
  ).toThrow("resolution notes");
  expect(() =>
    saveRecord(
      data,
      "production",
      initialDraft("production", data, { tonnes: "-1" }),
    ),
  ).toThrow();
  expect(() =>
    saveRecord(
      data,
      "contracts",
      initialDraft("contracts", data, {
        title: "Test",
        value: "100",
        endDate: "2026-01-01",
      }),
    ),
  ).toThrow("Contract dates");
});
test("CSV escapes spreadsheet formulas, quotes and line breaks", () => {
  const text = csv([["=SUM(A1:A2)", 'a"b', "line\nbreak", 42]]);
  expect(text).toContain("'=SUM(A1:A2)");
  expect(text).toContain('"a""b"');
  expect(text).toContain('"line\nbreak"');
});

test("malformed imports and inconsistent maintenance states are rejected", () => {
  const data = cloneSeed();
  data.assets[0].health = Number.NaN;
  expect(() => assertStore(data)).toThrow("equipment");
  const broken = cloneSeed();
  broken.assets.find((a) => a.id === broken.orders[1].assetId)!.status =
    "Operational";
  expect(() => assertStore(broken)).toThrow("unresolved breakdown");
  const dates = cloneSeed();
  dates.production[0].date = "2026-02-31";
  expect(() => assertStore(dates)).toThrow("production");
});

test("previous demo records migrate without losing their IDs, production or operator names", () => {
  const seed = cloneSeed();
  const old = {
    ...seed,
    sites: seed.sites.map(
      ({ id, name, region, target, latitude, longitude }) => ({
        id,
        name,
        region,
        target,
        latitude,
        longitude,
      }),
    ),
    assets: seed.assets.map(
      ({
        id,
        name,
        type,
        siteId,
        hours,
        health,
        fuel,
        status,
        operatorId,
      }) => ({
        id,
        name,
        type,
        siteId,
        hours,
        health,
        fuel,
        status,
        operator: seed.workers.find((w) => w.id === operatorId)!.name,
      }),
    ),
    customers: seed.customers.map(({ phone: _phone, ...customer }) => {
      void _phone;
      return customer;
    }),
    workers: seed.workers.map(({ phone: _phone, ...worker }) => {
      void _phone;
      return worker;
    }),
  };
  const migrated = migrateLegacy(old);
  assertStore(migrated);
  expect(migrated.production).toEqual(seed.production);
  expect(migrated.assets.map((a) => a.id)).toEqual(
    seed.assets.map((a) => a.id),
  );
  expect(migrated.assets[0].operatorId).toBe(seed.assets[0].operatorId);
});
