export type Site = {
  id: string;
  name: string;
  region: string;
  target: number;
  latitude: number;
  longitude: number;
  status: "Active" | "Paused";
  commodity: string;
};
export type Asset = {
  id: string;
  name: string;
  manufacturer: string;
  model: string;
  type: string;
  siteId: string;
  operatorId: string;
  hours: number;
  health: number;
  fuel: number;
  status: "Operational" | "Idle" | "Maintenance";
  lastService: string;
  nextService: string;
  hourHistory: { date: string; hours: number }[];
};
export type WorkOrder = {
  id: string;
  assetId: string;
  siteId: string;
  issue: string;
  priority: "High" | "Medium" | "Low";
  status: "Open" | "In progress" | "Resolved";
  kind: "Breakdown" | "Scheduled";
  technicianId: string;
  createdAt: string;
  completedAt: string;
  notes: string;
  resolution: string;
};
export type Production = {
  id: string;
  siteId: string;
  date: string;
  shift: "Day" | "Night";
  tonnes: number;
  trips: number;
  notes: string;
};
export type Customer = {
  id: string;
  name: string;
  industry: string;
  contact: string;
  email: string;
  phone: string;
  status: "Active" | "Prospect";
};
export type Contract = {
  id: string;
  customerId: string;
  siteId: string;
  title: string;
  value: number;
  status: "Active" | "Pending" | "Completed";
  startDate: string;
  endDate: string;
  renewalDate: string;
  notes: string;
};
export type Worker = {
  id: string;
  name: string;
  role: string;
  siteId: string;
  shift: "Day" | "Night";
  status: "On duty" | "Off duty";
  phone: string;
};
export type Activity = {
  id: string;
  date: string;
  message: string;
  entity: Entity;
  recordId: string;
  siteId: string;
};
export type Entity =
  | "sites"
  | "assets"
  | "orders"
  | "production"
  | "customers"
  | "contracts"
  | "workers";
export type Store = {
  sites: Site[];
  assets: Asset[];
  orders: WorkOrder[];
  production: Production[];
  customers: Customer[];
  contracts: Contract[];
  workers: Worker[];
  activities: Activity[];
};
export const DEMO_DATE = "2026-11-19";
export const STORAGE_KEY = "mysol-central-demo-v3";
export const number = (n: number) =>
  new Intl.NumberFormat("en-ZA", { maximumFractionDigits: 1 }).format(n);
export const money = (n: number) =>
  new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    maximumFractionDigits: 0,
  }).format(n);
export const randId = (prefix: string) =>
  `${prefix}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
export const dateOffset = (day: string, offset: number) => {
  const d = new Date(day + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + offset);
  return d.toISOString().slice(0, 10);
};

export function cloneSeed(): Store {
  const names = [
    "North Ridge",
    "West Pit",
    "South Quarry",
    "East Basin",
    "Mogalane",
    "Copper Valley",
    "Highveld",
    "Kalahari",
  ];
  const regions = [
    "Rustenburg, North West",
    "Brits, North West",
    "Mokopane, Limpopo",
    "Witbank, Mpumalanga",
    "Thabazimbi, Limpopo",
    "Phalaborwa, Limpopo",
    "Middelburg, Mpumalanga",
    "Kathu, Northern Cape",
  ];
  const sites: Site[] = names.map((name, i) => ({
    id: `S-0${i + 1}`,
    name,
    region: regions[i],
    target: 2800 + i * 300,
    latitude: [15, 44, 72, 23, 53, 78, 17, 53][i],
    longitude: [25, 18, 28, 50, 45, 54, 76, 76][i],
    status: "Active",
    commodity: [
      "Platinum",
      "Chromite",
      "Aggregates",
      "Coal",
      "Iron ore",
      "Copper",
      "Coal",
      "Manganese",
    ][i],
  }));
  const first = [
    "Thabo",
    "Naledi",
    "Sipho",
    "Palesa",
    "Karabo",
    "Mpho",
    "Tumelo",
    "Lerato",
    "Kabelo",
    "Zanele",
    "Lebo",
    "Ayanda",
  ];
  const last = ["Mokoena", "Khumalo", "Nkosi", "Dlamini", "Ndlovu", "Maseko"];
  const workers: Worker[] = Array.from({ length: 72 }, (_, i) => ({
    id: `EMP-${101 + i}`,
    name: `${first[i % 12]} ${last[Math.floor(i / 12)]}`,
    role:
      i < 48
        ? "Equipment operator"
        : i < 64
          ? "Maintenance technician"
          : "Site supervisor",
    siteId: sites[i % 8].id,
    shift: i % 3 === 0 ? "Night" : "Day",
    status: i % 5 === 0 ? "Off duty" : "On duty",
    phone: `+27 10 555 ${String(1000 + i)}`,
  }));
  const models = [
    ["Caterpillar", "395", "Excavator"],
    ["Volvo", "A60H", "Haul truck"],
    ["Komatsu", "D155", "Dozer"],
    ["Hitachi", "ZX870", "Excavator"],
    ["Bell", "B45E", "Haul truck"],
    ["Caterpillar", "988K", "Wheel loader"],
  ];
  const assets: Asset[] = Array.from({ length: 48 }, (_, i) => {
    const [manufacturer, model, type] = models[i % 6];
    const hours = 1900 + i * 89;
    return {
      id: `${["EX", "DT", "DZ", "EX", "DT", "LD"][i % 6]}-${104 + i}`,
      name: `${manufacturer} ${model}`,
      manufacturer,
      model,
      type,
      siteId: sites[i % 8].id,
      operatorId: workers[i].id,
      hours,
      health: 66 + ((i * 7) % 33),
      fuel: 31 + ((i * 11) % 68),
      status: i % 11 === 0 ? "Idle" : "Operational",
      lastService: "2026-10-15",
      nextService: dateOffset(DEMO_DATE, 2 + (i % 28)),
      hourHistory: Array.from({ length: 7 }, (_, d) => ({
        date: dateOffset(DEMO_DATE, d - 6),
        hours: hours - (6 - d) * 9,
      })),
    };
  });
  const orders: WorkOrder[] = Array.from({ length: 40 }, (_, i) => {
    const a = assets[i % 48];
    const resolved = i >= 12;
    const kind = i % 4 === 0 ? "Scheduled" : "Breakdown";
    if (!resolved && kind === "Breakdown") a.status = "Maintenance";
    return {
      id: `WO-${1048 + i}`,
      assetId: a.id,
      siteId: a.siteId,
      issue: [
        "Hydraulic pressure loss",
        "Brake assembly inspection",
        "Cooling system temperature",
        "500-hour planned service",
        "Track tension adjustment",
      ][i % 5],
      priority: i % 3 === 0 ? "High" : i % 3 === 1 ? "Medium" : "Low",
      status: resolved ? "Resolved" : i % 2 ? "Open" : "In progress",
      kind,
      technicianId: workers[48 + (i % 16)].id,
      createdAt: dateOffset(DEMO_DATE, -(i % 25)),
      completedAt: resolved
        ? dateOffset(DEMO_DATE, -Math.max(0, (i % 25) - 2))
        : "",
      notes: "Fictional workshop inspection record.",
      resolution: resolved
        ? "Inspected, serviced and function-tested. Released by workshop."
        : "",
    };
  });
  const production: Production[] = Array.from({ length: 32 }, (_, d) =>
    sites.flatMap((s, i) =>
      (["Day", "Night"] as const).map((shift, k) => {
        const tonnes = Math.round(
          s.target * (0.39 + ((d * 7 + i * 3 + k * 5) % 18) / 100),
        );
        return {
          id: `PR-${d}-${i}-${k}`,
          siteId: s.id,
          date: dateOffset(DEMO_DATE, -d),
          shift,
          tonnes,
          trips: Math.ceil(tonnes / 43),
          notes:
            d === 0
              ? "Shift handover complete; haul road inspected."
              : "Historical fictional shift record.",
        };
      }),
    ),
  ).flat();
  const customerNames = [
    "Apex Mineral Resources",
    "Kopano Earthworks",
    "BlueRock Aggregates",
    "Marula Ore Partners",
    "Cedar Basin Mining",
    "Umoya Materials",
    "Summit Rock Trading",
    "Karoo Mineral Group",
    "Tswelopele Resources",
    "Ndlovu Bulk Logistics",
    "Copperleaf Industries",
    "Horizon Quarry Works",
  ];
  const customers: Customer[] = customerNames.map((name, i) => ({
    id: `CU-${100 + i}`,
    name,
    industry: i % 3 ? "Mining" : "Bulk materials",
    contact: `${first[i]} ${last[i % 6]}`,
    email: `contact${i + 1}@example.invalid`,
    phone: `+27 10 555 ${2000 + i}`,
    status: i < 10 ? "Active" : "Prospect",
  }));
  const contracts: Contract[] = Array.from({ length: 20 }, (_, i) => ({
    id: `CT-${String(i + 1).padStart(3, "0")}`,
    customerId: customers[i % 12].id,
    siteId: sites[i % 8].id,
    title: [
      "Opencast loading & hauling",
      "Bulk earthworks programme",
      "Ore handling services",
      "Plant support agreement",
    ][i % 4],
    value: 2400000 + i * 650000,
    status: i < 15 ? "Active" : "Pending",
    startDate: "2026-07-01",
    endDate: dateOffset("2027-03-31", i * 12),
    renewalDate: dateOffset("2027-03-01", i * 12),
    notes: "Fictional commercial agreement. Values exclude VAT.",
  }));
  return {
    sites,
    assets,
    orders,
    production,
    customers,
    contracts,
    workers,
    activities: [
      {
        id: "ACT-SEED",
        date: `${DEMO_DATE}T06:00:00Z`,
        message:
          "Sample operations dataset prepared for management presentation",
        entity: "sites",
        recordId: sites[0].id,
        siteId: sites[0].id,
      },
    ],
  };
}

export function metrics(data: Store, from: string, to: string, siteId = "All") {
  const sites = data.sites.filter((s) => siteId === "All" || s.id === siteId);
  const ids = new Set(sites.map((s) => s.id));
  const production = data.production.filter(
    (p) => ids.has(p.siteId) && p.date >= from && p.date <= to,
  );
  const assets = data.assets.filter((a) => ids.has(a.siteId));
  const orders = data.orders.filter((o) => ids.has(o.siteId));
  const days = Math.max(
    1,
    Math.round((Date.parse(to) - Date.parse(from)) / 86400000) + 1,
  );
  const tonnes = production.reduce((t, p) => t + p.tonnes, 0);
  const dailyTarget = sites
    .filter((s) => s.status === "Active")
    .reduce((t, s) => t + s.target, 0);
  const target = dailyTarget * days;
  const operational = assets.filter((a) => a.status === "Operational").length;
  return {
    sites,
    assets,
    orders,
    production,
    tonnes,
    dailyTarget,
    target,
    days,
    operational,
    available: assets.filter((a) => a.status !== "Maintenance").length,
    availability: assets.length
      ? (assets.filter((a) => a.status !== "Maintenance").length /
          assets.length) *
        100
      : 0,
    achievement: target ? (tonnes / target) * 100 : 0,
    open: orders.filter((o) => o.status !== "Resolved"),
    workers: data.workers.filter((w) => ids.has(w.siteId)),
    contracts: data.contracts.filter((c) => ids.has(c.siteId)),
  };
}

export function changeOrder(
  data: Store,
  id: string,
  patch: Partial<WorkOrder>,
): Store {
  const current = data.orders.find((o) => o.id === id);
  if (!current) throw new Error("Work order does not exist.");
  const updated = { ...current, ...patch };
  if (updated.status === "Resolved" && !updated.resolution.trim())
    throw new Error(
      "Record resolution notes before completing this work order.",
    );
  updated.completedAt =
    updated.status === "Resolved" ? updated.completedAt || DEMO_DATE : "";
  const orders = data.orders.map((o) => (o.id === id ? updated : o));
  const blocked = orders.some(
    (o) =>
      o.assetId === current.assetId &&
      o.kind === "Breakdown" &&
      o.status !== "Resolved",
  );
  const assets = data.assets.map((a) =>
    a.id === current.assetId
      ? {
          ...a,
          status: blocked
            ? ("Maintenance" as const)
            : current.kind === "Breakdown" && updated.status === "Resolved"
              ? ("Operational" as const)
              : a.status,
        }
      : a,
  );
  return { ...data, orders, assets };
}

export function assertStore(value: unknown): asserts value is Store {
  if (!value || typeof value !== "object")
    throw new Error("Invalid demo data.");
  const d = value as Store;
  for (const key of [
    "sites",
    "assets",
    "orders",
    "production",
    "customers",
    "contracts",
    "workers",
    "activities",
  ] as const) {
    if (!Array.isArray(d[key])) throw new Error(`Missing ${key} records.`);
    if (d[key].some((x) => !x || typeof x !== "object"))
      throw new Error(`Invalid ${key} records.`);
    const ids = d[key].map((x) => x.id);
    if (
      ids.some((id) => typeof id !== "string" || !id) ||
      new Set(ids).size !== ids.length
    )
      throw new Error(`Invalid or duplicate ${key} IDs.`);
  }
  if (!d.sites.length) throw new Error("At least one site is required.");
  const text = (v: unknown, required = false) =>
    typeof v === "string" && (!required || !!v.trim());
  const num = (v: unknown, min = 0, max = Number.MAX_SAFE_INTEGER) =>
    typeof v === "number" && Number.isFinite(v) && v >= min && v <= max;
  const day = (v: unknown) =>
    text(v) &&
    /^\d{4}-\d{2}-\d{2}$/.test(v as string) &&
    Number.isFinite(Date.parse(v as string)) &&
    new Date(`${v}T12:00:00Z`).toISOString().slice(0, 10) === v;
  const oneOf = (v: unknown, choices: string[]) =>
    choices.includes(v as string);
  if (
    d.sites.some(
      (s) =>
        !text(s.name, true) ||
        !text(s.region, true) ||
        !text(s.commodity, true) ||
        !num(s.target, 1) ||
        !num(s.latitude, 5, 85) ||
        !num(s.longitude, 10, 85) ||
        !oneOf(s.status, ["Active", "Paused"]),
    )
  )
    throw new Error("Invalid site fields.");
  if (
    d.assets.some(
      (a) =>
        !text(a.name, true) ||
        !text(a.type, true) ||
        !text(a.manufacturer, true) ||
        !text(a.model, true) ||
        !text(a.operatorId) ||
        !num(a.hours) ||
        !num(a.health, 0, 100) ||
        !num(a.fuel, 0, 100) ||
        !oneOf(a.status, ["Operational", "Idle", "Maintenance"]) ||
        !day(a.lastService) ||
        !day(a.nextService) ||
        a.nextService < a.lastService ||
        !Array.isArray(a.hourHistory) ||
        a.hourHistory.some((h) => !day(h.date) || !num(h.hours)),
    )
  )
    throw new Error("Invalid equipment fields.");
  if (
    d.workers.some(
      (w) =>
        !text(w.name, true) ||
        !text(w.role, true) ||
        !text(w.phone) ||
        !oneOf(w.shift, ["Day", "Night"]) ||
        !oneOf(w.status, ["On duty", "Off duty"]),
    )
  )
    throw new Error("Invalid workforce fields.");
  if (
    d.customers.some(
      (c) =>
        !text(c.name, true) ||
        !text(c.industry, true) ||
        !text(c.contact, true) ||
        !text(c.email) ||
        !text(c.phone) ||
        !oneOf(c.status, ["Active", "Prospect"]),
    )
  )
    throw new Error("Invalid customer fields.");
  if (
    d.production.some(
      (p) =>
        !day(p.date) ||
        !num(p.tonnes, 0.1) ||
        !num(p.trips) ||
        !Number.isInteger(p.trips) ||
        !text(p.notes) ||
        !oneOf(p.shift, ["Day", "Night"]),
    )
  )
    throw new Error("Invalid production fields.");
  if (
    d.contracts.some(
      (c) =>
        !text(c.title, true) ||
        !num(c.value) ||
        !oneOf(c.status, ["Active", "Pending", "Completed"]) ||
        !day(c.startDate) ||
        !day(c.endDate) ||
        !day(c.renewalDate) ||
        c.endDate < c.startDate ||
        c.renewalDate > c.endDate ||
        c.renewalDate < c.startDate ||
        !text(c.notes),
    )
  )
    throw new Error("Invalid contract fields.");
  if (
    d.orders.some(
      (o) =>
        !text(o.issue, true) ||
        !text(o.technicianId) ||
        !text(o.notes) ||
        !text(o.resolution) ||
        !oneOf(o.kind, ["Breakdown", "Scheduled"]) ||
        !oneOf(o.priority, ["High", "Medium", "Low"]) ||
        !oneOf(o.status, ["Open", "In progress", "Resolved"]) ||
        !day(o.createdAt) ||
        (o.status === "Resolved" &&
          (!o.resolution.trim() ||
            !day(o.completedAt) ||
            o.completedAt < o.createdAt)),
    )
  )
    throw new Error("Invalid work order fields or completion dates.");
  if (
    d.activities.some(
      (a) =>
        !text(a.message, true) ||
        !text(a.siteId) ||
        !text(a.recordId) ||
        !text(a.date) ||
        !Number.isFinite(Date.parse(a.date)) ||
        !oneOf(a.entity, [
          "sites",
          "assets",
          "orders",
          "production",
          "customers",
          "contracts",
          "workers",
        ]),
    )
  )
    throw new Error("Invalid activity fields.");
  const site = (id: string) => d.sites.some((s) => s.id === id);
  if (
    d.assets.some(
      (a) =>
        !site(a.siteId) ||
        (a.operatorId &&
          !d.workers.some(
            (w) => w.id === a.operatorId && w.siteId === a.siteId,
          )),
    )
  )
    throw new Error("Equipment has an invalid site or operator assignment.");
  if (
    d.workers.some((w) => !site(w.siteId)) ||
    d.production.some(
      (p) => !site(p.siteId) || !Number.isFinite(p.tonnes) || p.tonnes <= 0,
    )
  )
    throw new Error("Invalid workforce or production relationships.");
  if (
    d.orders.some(
      (o) =>
        !site(o.siteId) ||
        !d.assets.some((a) => a.id === o.assetId) ||
        (o.technicianId && !d.workers.some((w) => w.id === o.technicianId)),
    )
  )
    throw new Error("Invalid maintenance relationships.");
  if (
    d.contracts.some(
      (c) => !site(c.siteId) || !d.customers.some((x) => x.id === c.customerId),
    )
  )
    throw new Error("Invalid contract relationships.");
  if (
    d.orders.some(
      (o) =>
        o.kind === "Breakdown" &&
        o.status !== "Resolved" &&
        d.assets.find((a) => a.id === o.assetId)?.status !== "Maintenance",
    )
  )
    throw new Error(
      "Equipment with an unresolved breakdown must remain in Maintenance.",
    );
}
