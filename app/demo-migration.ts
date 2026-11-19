import { assertStore, DEMO_DATE, type Store } from "./demo-data";

/** Preserve previous browser-local records while adding the v3 relational fields. */
export function migrateLegacy(value: unknown): Store {
  const old = value as Omit<Store, "assets"> & {
    assets: (Store["assets"][number] & { operator?: string })[];
  };
  for (const key of [
    "sites",
    "assets",
    "workers",
    "orders",
    "production",
    "customers",
    "contracts",
  ] as const) {
    if (!Array.isArray(old?.[key]))
      throw new Error("Incomplete previous demonstration data.");
  }
  const workers = old.workers.map((w) => ({ ...w, phone: w.phone || "" }));
  const assets = old.assets.map((a, index) => {
    let operatorId = a.operatorId || "";
    if (!operatorId && a.operator && a.operator !== "Unassigned") {
      let worker = workers.find(
        (w) =>
          w.name === a.operator &&
          w.siteId === a.siteId &&
          /operator/i.test(w.role),
      );
      if (!worker) {
        worker = {
          id: `EMP-MIGRATED-${index}`,
          name: a.operator,
          role: "Equipment operator",
          siteId: a.siteId,
          shift: "Day",
          status: "Off duty",
          phone: "",
        };
        workers.push(worker);
      }
      operatorId = worker.id;
    }
    return {
      ...a,
      operatorId,
      manufacturer: a.manufacturer || a.name.split(" ")[0],
      model: a.model || a.name.split(" ").slice(1).join(" ") || a.name,
      lastService: a.lastService || "2026-10-15",
      nextService: a.nextService || "2026-12-15",
      hourHistory: a.hourHistory || [{ date: DEMO_DATE, hours: a.hours }],
    };
  });
  const orders = old.orders.map((o) => ({
    ...o,
    kind: o.kind || ("Breakdown" as const),
    technicianId: o.technicianId || "",
    completedAt: o.status === "Resolved" ? o.completedAt || DEMO_DATE : "",
    resolution:
      o.resolution ||
      (o.status === "Resolved"
        ? "Completed in previous demonstration version."
        : ""),
  }));
  for (const asset of assets)
    if (
      orders.some(
        (o) =>
          o.assetId === asset.id &&
          o.kind === "Breakdown" &&
          o.status !== "Resolved",
      )
    )
      asset.status = "Maintenance";
  const data: Store = {
    ...old,
    sites: old.sites.map((s) => ({
      ...s,
      status: s.status || "Active",
      commodity: s.commodity || "Sample minerals",
    })),
    assets,
    orders,
    workers,
    customers: old.customers.map((c) => ({
      ...c,
      contact: c.contact || "Demo contact",
      phone: c.phone || "",
    })),
    contracts: old.contracts.map((c) => ({
      ...c,
      startDate: c.startDate || "2026-01-01",
      renewalDate: c.renewalDate || c.endDate,
      notes: c.notes || "Migrated fictional agreement.",
    })),
    activities: old.activities || [],
  };
  assertStore(data);
  return data;
}
