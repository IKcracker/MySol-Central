import {
  changeOrder,
  DEMO_DATE,
  randId,
  type Entity,
  type Store,
  type Asset,
  type WorkOrder,
} from "./demo-data";
export type Draft = Record<string, string>;
export type Field = {
  key: string;
  label: string;
  type?: "number" | "date" | "email" | "textarea";
  required?: boolean;
  options?: { value: string; label: string }[];
  min?: number;
  max?: number;
  step?: string;
};
export const entityNames: Record<Entity, string> = {
  sites: "mining site",
  assets: "equipment",
  orders: "work order",
  production: "production record",
  customers: "customer",
  contracts: "contract",
  workers: "employee",
};
export function fieldsFor(
  entity: Entity,
  data: Store,
  draft: Draft,
  editing: boolean,
): Field[] {
  const choices = (values: string[]) =>
    values.map((value) => ({ value, label: value }));
  const sites = data.sites.map((s) => ({ value: s.id, label: s.name }));
  const site: Field = {
    key: "siteId",
    label: "Assigned site",
    options: sites,
    required: true,
  };
  const name: Field = { key: "name", label: "Name", required: true };
  const notes: Field = { key: "notes", label: "Notes", type: "textarea" };
  switch (entity) {
    case "sites":
      return [
        name,
        { key: "region", label: "Region", required: true },
        { key: "commodity", label: "Commodity", required: true },
        {
          key: "target",
          label: "Daily target (tonnes)",
          type: "number",
          min: 1,
          required: true,
        },
        {
          key: "status",
          label: "Site status",
          options: choices(["Active", "Paused"]),
        },
      ];
    case "assets":
      return [
        ...(!editing
          ? [{ key: "id", label: "Unique asset ID", required: true }]
          : []),
        name,
        { key: "manufacturer", label: "Manufacturer", required: true },
        { key: "model", label: "Model", required: true },
        {
          key: "type",
          label: "Category",
          options: choices([
            "Excavator",
            "Haul truck",
            "Dozer",
            "Wheel loader",
            "Grader",
          ]),
        },
        site,
        {
          key: "operatorId",
          label: "Assigned operator",
          options: [
            { value: "", label: "Unassigned" },
            ...data.workers
              .filter(
                (w) => w.siteId === draft.siteId && /operator/i.test(w.role),
              )
              .map((w) => ({ value: w.id, label: w.name })),
          ],
        },
        {
          key: "status",
          label: "Operational status",
          options: choices(["Operational", "Idle", "Maintenance"]),
        },
        {
          key: "hours",
          label: "Engine hours",
          type: "number",
          min: 0,
          required: true,
        },
        {
          key: "lastService",
          label: "Last service",
          type: "date",
          required: true,
        },
        {
          key: "nextService",
          label: "Next service",
          type: "date",
          required: true,
        },
        {
          key: "health",
          label: "Demo health (%)",
          type: "number",
          min: 0,
          max: 100,
          required: true,
        },
        {
          key: "fuel",
          label: "Demo fuel (%)",
          type: "number",
          min: 0,
          max: 100,
          required: true,
        },
      ];
    case "orders":
      return [
        ...(!editing
          ? [
              {
                key: "assetId",
                label: "Machine",
                options: data.assets.map((a) => ({
                  value: a.id,
                  label: `${a.id} · ${a.name}`,
                })),
                required: true,
              },
              {
                key: "kind",
                label: "Maintenance type",
                options: choices(["Breakdown", "Scheduled"]),
              },
            ]
          : []),
        { key: "issue", label: "Fault description", required: true },
        {
          key: "priority",
          label: "Priority",
          options: choices(["High", "Medium", "Low"]),
        },
        {
          key: "technicianId",
          label: "Assigned technician",
          options: [
            { value: "", label: "Unassigned" },
            ...data.workers
              .filter((w) => /technician/i.test(w.role))
              .map((w) => ({ value: w.id, label: w.name })),
          ],
        },
        {
          key: "createdAt",
          label: "Reported date",
          type: "date",
          required: true,
        },
        {
          key: "status",
          label: "Workflow status",
          options: choices(["Open", "In progress", "Resolved"]),
        },
        notes,
        {
          key: "resolution",
          label: "Resolution notes",
          type: "textarea",
          required: draft.status === "Resolved",
        },
      ];
    case "production":
      return [
        site,
        { key: "date", label: "Production date", type: "date", required: true },
        { key: "shift", label: "Shift", options: choices(["Day", "Night"]) },
        {
          key: "tonnes",
          label: "Tonnes produced",
          type: "number",
          min: 0.1,
          step: "0.1",
          required: true,
        },
        {
          key: "trips",
          label: "Haulage trips",
          type: "number",
          min: 0,
          required: true,
        },
        notes,
      ];
    case "customers":
      return [
        { ...name, label: "Company name" },
        { key: "industry", label: "Industry", required: true },
        { key: "contact", label: "Primary contact", required: true },
        { key: "email", label: "Contact email", type: "email", required: true },
        { key: "phone", label: "Contact phone" },
        {
          key: "status",
          label: "Account status",
          options: choices(["Active", "Prospect"]),
        },
      ];
    case "contracts":
      return [
        { key: "title", label: "Agreement name", required: true },
        {
          key: "customerId",
          label: "Customer",
          options: data.customers.map((c) => ({ value: c.id, label: c.name })),
          required: true,
        },
        site,
        {
          key: "value",
          label: "Contract value (ZAR)",
          type: "number",
          min: 0,
          required: true,
        },
        { key: "startDate", label: "Start date", type: "date", required: true },
        { key: "endDate", label: "End date", type: "date", required: true },
        {
          key: "renewalDate",
          label: "Renewal review",
          type: "date",
          required: true,
        },
        {
          key: "status",
          label: "Contract status",
          options: choices(["Active", "Pending", "Completed"]),
        },
        notes,
      ];
    case "workers":
      return [
        { ...name, label: "Full name" },
        {
          key: "role",
          label: "Role",
          options: choices([
            "Equipment operator",
            "Maintenance technician",
            "Site supervisor",
            "Safety officer",
            "General worker",
          ]),
        },
        site,
        { key: "shift", label: "Shift", options: choices(["Day", "Night"]) },
        {
          key: "status",
          label: "Duty status",
          options: choices(["On duty", "Off duty"]),
        },
        { key: "phone", label: "Phone number" },
      ];
  }
}
export function initialDraft(
  entity: Entity,
  data: Store,
  patch: Draft = {},
): Draft {
  const defaults: Draft = {
    siteId: data.sites[0].id,
    assetId: data.assets[0]?.id || "",
    customerId: data.customers[0]?.id || "",
    status:
      entity === "orders"
        ? "Open"
        : entity === "assets"
          ? "Operational"
          : entity === "workers"
            ? "On duty"
            : entity === "contracts"
              ? "Pending"
              : "Active",
    shift: "Day",
    date: DEMO_DATE,
    createdAt: DEMO_DATE,
    kind: "Breakdown",
    priority: "High",
    role: "Equipment operator",
    type: "Excavator",
    lastService: DEMO_DATE,
    nextService: "2026-12-19",
    startDate: DEMO_DATE,
    endDate: "2027-12-31",
    renewalDate: "2027-11-30",
    hours: "0",
    health: "100",
    fuel: "100",
    trips: "0",
    technicianId: "",
    operatorId: "",
    notes: "",
    resolution: "",
  };
  return { ...defaults, ...patch };
}
export function saveRecord(
  data: Store,
  entity: Entity,
  draft: Draft,
  editId?: string,
): Store {
  for (const field of fieldsFor(entity, data, draft, !!editId)) {
    const value = draft[field.key]?.trim() || "";
    if (field.required && !value)
      throw new Error(`${field.label} is required.`);
    if (
      field.type === "number" &&
      (!Number.isFinite(Number(value)) ||
        (field.min !== undefined && Number(value) < field.min) ||
        (field.max !== undefined && Number(value) > field.max))
    )
      throw new Error(`Enter a valid ${field.label.toLowerCase()}.`);
    if (
      field.type === "date" &&
      value &&
      (!/^\d{4}-\d{2}-\d{2}$/.test(value) ||
        !Number.isFinite(Date.parse(value)))
    )
      throw new Error("Enter a valid date.");
    if (field.options && !field.options.some((o) => o.value === value))
      throw new Error(`Choose a valid ${field.label.toLowerCase()}.`);
  }
  const id =
    editId ||
    draft.id?.trim() ||
    randId(
      {
        sites: "S",
        assets: "EQ",
        orders: "WO",
        production: "PR",
        customers: "CU",
        contracts: "CT",
        workers: "EMP",
      }[entity],
    );
  if (!editId && data[entity].some((x) => x.id === id))
    throw new Error("That ID already exists.");
  if (
    entity === "contracts" &&
    (draft.endDate < draft.startDate ||
      draft.renewalDate > draft.endDate ||
      draft.renewalDate < draft.startDate)
  )
    throw new Error(
      "Contract dates must run from start through renewal review to end.",
    );
  if (entity === "orders" && draft.createdAt > DEMO_DATE)
    throw new Error(
      "Reported date cannot be after the fixed demonstration date.",
    );
  if (entity === "assets" && draft.nextService < draft.lastService)
    throw new Error("Next service must follow the last service date.");
  if (
    entity === "assets" &&
    data.orders.some(
      (o) =>
        o.assetId === id && o.kind === "Breakdown" && o.status !== "Resolved",
    ) &&
    draft.status !== "Maintenance"
  )
    throw new Error(
      "Resolve all breakdown work orders before returning this machine to service.",
    );
  const numeric = new Set([
    "target",
    "hours",
    "health",
    "fuel",
    "tonnes",
    "trips",
    "value",
  ]);
  const previous = data[entity].find((x) => x.id === id);
  const record: Record<string, unknown> = { ...previous, id };
  for (const field of fieldsFor(entity, data, draft, !!editId))
    record[field.key] = numeric.has(field.key)
      ? Number(draft[field.key])
      : (draft[field.key] || "").trim();
  if (entity === "sites" && !editId) {
    record.latitude = 35;
    record.longitude = 55;
  }
  if (entity === "assets") {
    const old = previous as Asset | undefined;
    if (old && Number(draft.hours) < old.hours)
      throw new Error("Engine hours cannot decrease.");
    record.hourHistory = old
      ? old.hours === Number(draft.hours)
        ? old.hourHistory
        : [...old.hourHistory, { date: DEMO_DATE, hours: Number(draft.hours) }]
      : [{ date: DEMO_DATE, hours: Number(draft.hours) }];
  }
  let next = {
    ...data,
    [entity]: editId
      ? data[entity].map((x) => (x.id === id ? record : x))
      : [record, ...data[entity]],
  } as Store;
  if (entity === "orders") {
    record.siteId = previous
      ? (previous as WorkOrder).siteId
      : data.assets.find((a) => a.id === draft.assetId)!.siteId;
    record.completedAt = "";
    next = changeOrder(next, id, record as Partial<WorkOrder>);
  }
  // Transfers retain historical work-order sites; operators must belong to their machine's current site.
  if (entity === "workers")
    next.assets = next.assets.map((a) =>
      a.operatorId === id &&
      (a.siteId !== draft.siteId || !/operator/i.test(draft.role))
        ? { ...a, operatorId: "" }
        : a,
    );
  return {
    ...next,
    activities: [
      {
        id: randId("ACT"),
        date: new Date().toISOString(),
        message: `${editId ? "Updated" : "Created"} ${entityNames[entity]} ${id}`,
        entity,
        recordId: id,
        siteId: String(record.siteId || (entity === "sites" ? id : "")),
      },
      ...next.activities,
    ].slice(0, 250),
  };
}
