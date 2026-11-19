"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import { CommandStage } from "./command-stage";
import {
  Activity,
  Bell,
  ChartNoAxesCombined,
  Check,
  ChevronRight,
  CircleHelp,
  Download,
  Factory,
  FileText,
  Gauge,
  LayoutDashboard,
  MapPin,
  Menu,
  Mountain,
  Play,
  Plus,
  Printer,
  Search,
  Settings,
  ShieldCheck,
  Truck,
  Users,
  Wrench,
  X,
} from "lucide-react";
import {
  assertStore,
  cloneSeed,
  dateOffset,
  DEMO_DATE,
  metrics,
  money,
  number,
  randId,
  type Entity,
  type Store,
  type Asset,
  type WorkOrder,
} from "./demo-data";
import { commitDemo, useDemoStore } from "./demo-store";
import {
  entityNames,
  fieldsFor,
  initialDraft,
  saveRecord,
  type Draft,
} from "./demo-forms";
import {
  Badge,
  Button,
  csv,
  DataTable,
  Dialog,
  download,
  Meter,
  Panel,
  ProductionChart,
  SiteMap,
  TrendChart,
  type TableRow,
} from "./demo-ui";

const navigation = [
  { label: "Executive dashboard", icon: LayoutDashboard },
  { label: "Mining operations", icon: Mountain },
  { label: "Sites", icon: MapPin },
  { label: "Fleet & equipment", icon: Truck },
  { label: "Maintenance", icon: Wrench },
  { label: "Customers", icon: Factory },
  { label: "Contracts", icon: FileText },
  { label: "Workforce", icon: Users },
  { label: "Reports & analytics", icon: ChartNoAxesCombined },
  { label: "Settings", icon: Settings },
] as const;
type Page = (typeof navigation)[number]["label"];
const pageEntity: Partial<Record<Page, Entity>> = {
  "Mining operations": "production",
  Sites: "sites",
  "Fleet & equipment": "assets",
  Maintenance: "orders",
  Customers: "customers",
  Contracts: "contracts",
  Workforce: "workers",
};
const entityPage: Record<Entity, Page> = {
  sites: "Sites",
  assets: "Fleet & equipment",
  orders: "Maintenance",
  production: "Mining operations",
  customers: "Customers",
  contracts: "Contracts",
  workers: "Workforce",
};
const walkthrough: { page: Page; title: string; text: string }[] = [
  {
    page: "Executive dashboard",
    title: "One operational picture",
    text: "Review record-driven production, fleet availability and priority incidents. Select a site on the illustrative map.",
  },
  {
    page: "Mining operations",
    title: "Capture the shift",
    text: "Use Log production to add tonnes and haulage trips. The logbook, dashboard and reports use that same record.",
  },
  {
    page: "Fleet & equipment",
    title: "Know every machine",
    text: "Open an asset profile to inspect sample telemetry, operator assignment, service dates and engine-hour history.",
  },
  {
    page: "Maintenance",
    title: "Report a breakdown",
    text: "Create a Breakdown work order against an operational machine. Its status immediately changes to Maintenance and availability updates.",
  },
  {
    page: "Maintenance",
    title: "Close the loop",
    text: "Open the new work order, choose Edit record and mark it Resolved with resolution notes. The machine returns to service when all its breakdowns are resolved.",
  },
  {
    page: "Customers",
    title: "Connect commercial delivery",
    text: "Add a fictional customer, then create an agreement under Contracts. Customer profiles show delivery sites and related agreements.",
  },
  {
    page: "Workforce",
    title: "Put people in the picture",
    text: "Create or edit an employee, assign their site and shift, and change duty status. Workforce metrics recalculate from these records.",
  },
  {
    page: "Reports & analytics",
    title: "Turn activity into decisions",
    text: "Choose a date range and site. Review linked reports, export the filtered data or print a management briefing. Reset in Settings for the next presentation.",
  },
];
function recordTitle(record: { id: string }, entity: Entity) {
  const r = record as unknown as Record<string, unknown>;
  return String(
    r.name || r.title || (entity === "orders" ? r.issue : "") || r.id,
  );
}
function errorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "The action could not be completed.";
}

export default function DemoApp() {
  const { data, ready, storageError } = useDemoStore();
  const [page, setPage] = useState<Page>("Executive dashboard");
  const [mobile, setMobile] = useState(false);
  const [siteFilter, setSiteFilter] = useState("All");
  const [from, setFrom] = useState(DEMO_DATE);
  const [to, setTo] = useState(DEMO_DATE);
  const [selectedSite, setSelectedSite] = useState("S-01");
  const [form, setForm] = useState<{ entity: Entity; id?: string } | null>(
    null,
  );
  const [draft, setDraft] = useState<Draft>({});
  const [formError, setFormError] = useState("");
  const [detail, setDetail] = useState<{ entity: Entity; id: string } | null>(
    null,
  );
  const [overlay, setOverlay] = useState<
    "search" | "notifications" | "profile" | "reset" | "delete" | null
  >(null);
  const [query, setQuery] = useState("");
  const [toast, setToast] = useState("");
  const [tour, setTour] = useState<number | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (!toast) return;
    const timeout = setTimeout(() => setToast(""), 6500);
    return () => clearTimeout(timeout);
  }, [toast]);
  const m = metrics(data, from, to, siteFilter);
  const siteName = (id: string) =>
    data.sites.find((s) => s.id === id)?.name || "Unassigned";
  const workerName = (id: string) =>
    data.workers.find((w) => w.id === id)?.name || "Unassigned";
  const customerName = (id: string) =>
    data.customers.find((c) => c.id === id)?.name || "Unknown customer";
  const siteTotals = Object.fromEntries(
    m.sites.map((s) => [
      s.id,
      m.production
        .filter((p) => p.siteId === s.id)
        .reduce((t, p) => t + p.tonnes, 0),
    ]),
  );
  const go = (next: Page) => {
    setPage(next);
    setMobile(false);
    requestAnimationFrame(() => heading.current?.focus());
  };
  const open = (entity: Entity, id: string) => {
    setOverlay(null);
    setDetail({ entity, id });
  };
  const create = (entity: Entity, patch: Draft = {}) => {
    setDetail(null);
    setDraft(
      initialDraft(entity, data, {
        siteId: siteFilter !== "All" ? siteFilter : selectedSite,
        date: to,
        ...patch,
      }),
    );
    setFormError("");
    setForm({ entity });
  };
  const edit = (entity: Entity, id: string) => {
    const record = data[entity].find((r) => r.id === id);
    if (!record) return;
    setDetail(null);
    setDraft(
      Object.fromEntries(
        Object.entries(record)
          .filter(([, value]) => typeof value !== "object")
          .map(([key, value]) => [key, String(value)]),
      ),
    );
    setFormError("");
    setForm({ entity, id });
  };
  const save = () => {
    if (!form) return;
    try {
      const next = saveRecord(data, form.entity, draft, form.id);
      commitDemo(next);
      setForm(null);
      setToast(
        `${form.id ? "Updated" : "Created"} ${entityNames[form.entity]}. Connected records and metrics updated.`,
      );
      if (form.entity === "production") {
        setFrom(draft.date);
        setTo(draft.date);
      }
    } catch (error) {
      setFormError(errorMessage(error));
    }
  };
  const remove = () => {
    if (!detail) return;
    const { entity, id } = detail;
    try {
      if (
        entity === "sites" &&
        [
          data.assets,
          data.workers,
          data.orders,
          data.production,
          data.contracts,
        ].some((list) => list.some((x) => x.siteId === id))
      )
        throw new Error(
          "Transfer or remove all linked records before deleting this site.",
        );
      if (entity === "sites" && data.sites.length === 1)
        throw new Error("Keep at least one mining site.");
      if (entity === "assets" && data.orders.some((o) => o.assetId === id))
        throw new Error(
          "This equipment has maintenance history. Keep the asset for traceability.",
        );
      if (
        entity === "customers" &&
        data.contracts.some((c) => c.customerId === id)
      )
        throw new Error(
          "This customer has linked contracts. Keep the account for traceability.",
        );
      if (
        entity === "workers" &&
        (data.assets.some((a) => a.operatorId === id) ||
          data.orders.some((o) => o.technicianId === id))
      )
        throw new Error(
          "Remove operator and technician assignments before deleting this employee.",
        );
      if (
        entity === "orders" &&
        data.orders.find((o) => o.id === id)?.status !== "Resolved"
      )
        throw new Error("Resolve the work order before removing it.");
      commitDemo({
        ...data,
        [entity]: data[entity].filter((r) => r.id !== id),
        activities: [
          {
            id: randId("ACT"),
            date: new Date().toISOString(),
            message: `Deleted ${entityNames[entity]} ${id}`,
            entity,
            recordId: id,
            siteId: "",
          },
          ...data.activities,
        ],
      });
      setOverlay(null);
      setDetail(null);
      setToast("Record deleted.");
    } catch (error) {
      setOverlay(null);
      setToast(errorMessage(error));
    }
  };
  const reset = () => {
    try {
      commitDemo(cloneSeed());
      setSiteFilter("All");
      setSelectedSite("S-01");
      setFrom(DEMO_DATE);
      setTo(DEMO_DATE);
      setDetail(null);
      setOverlay(null);
      setToast(
        "Original sample data restored. Ready for the next presentation.",
      );
    } catch (error) {
      setToast(errorMessage(error));
    }
  };
  const chooseRange = (value: string) => {
    setTo(DEMO_DATE);
    setFrom(
      dateOffset(DEMO_DATE, value === "30" ? -29 : value === "7" ? -6 : 0),
    );
  };
  const link = (entity: Entity, id: string, label: ReactNode) => (
    <button className="text-link" onClick={() => open(entity, id)}>
      {label}
    </button>
  );
  const stat = (label: string, value: ReactNode) => (
    <div className="detail-stat" key={label}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );

  function table(
    entity: Entity,
    records = data[entity],
    title?: string,
    showCreate = true,
  ) {
    let headers: string[] = [];
    const rows: TableRow[] = [];
    for (const base of records) {
      let cells: ReactNode[] = [],
        values: (string | number)[] = [];
      let status = "";
      const title = recordTitle(base, entity);
      const identity = (
        <span className="identity">
          <b>{title}</b>
          <small>{base.id}</small>
        </span>
      );
      switch (entity) {
        case "sites": {
          const r = base as Store["sites"][number];
          headers = ["Site", "Region", "Commodity", "Daily target", "Status"];
          status = r.status;
          values = [title, r.region, r.commodity, r.target, r.status];
          cells = [
            identity,
            r.region,
            r.commodity,
            `${number(r.target)} t`,
            <Badge key="status" value={r.status} />,
          ];
          break;
        }
        case "assets": {
          const r = base as Asset;
          headers = [
            "Equipment",
            "Site",
            "Operator",
            "Engine hours",
            "Health",
            "Status",
          ];
          status = r.status;
          values = [
            `${r.id} ${r.name}`,
            siteName(r.siteId),
            workerName(r.operatorId),
            r.hours,
            r.health,
            r.status,
          ];
          cells = [
            identity,
            link("sites", r.siteId, siteName(r.siteId)),
            r.operatorId
              ? link("workers", r.operatorId, workerName(r.operatorId))
              : "Unassigned",
            `${number(r.hours)} h`,
            <Meter key="health" value={r.health} label="Demo health" />,
            <Badge key="status" value={r.status} />,
          ];
          break;
        }
        case "orders": {
          const r = base as WorkOrder;
          headers = [
            "Work order",
            "Machine / site",
            "Priority",
            "Technician",
            "Reported",
            "Status",
          ];
          status = r.status;
          values = [
            `${r.id} ${r.issue}`,
            `${r.assetId} ${siteName(r.siteId)}`,
            r.priority,
            workerName(r.technicianId),
            r.createdAt,
            r.status,
          ];
          cells = [
            identity,
            <span key="machine" className="identity">
              {link("assets", r.assetId, r.assetId)}
              <small>{siteName(r.siteId)}</small>
            </span>,
            <Badge key="priority" value={r.priority} />,
            r.technicianId
              ? link("workers", r.technicianId, workerName(r.technicianId))
              : "Unassigned",
            r.createdAt,
            <Badge key="status" value={r.status} />,
          ];
          break;
        }
        case "production": {
          const r = base as Store["production"][number];
          headers = [
            "Record",
            "Date",
            "Site",
            "Shift",
            "Tonnes",
            "Trips",
            "Notes",
          ];
          values = [
            r.id,
            r.date,
            siteName(r.siteId),
            r.shift,
            r.tonnes,
            r.trips,
            r.notes,
          ];
          cells = [
            <span className="code" key="id">
              {r.id}
            </span>,
            r.date,
            link("sites", r.siteId, siteName(r.siteId)),
            r.shift,
            <b key="tonnes">{number(r.tonnes)} t</b>,
            r.trips,
            r.notes,
          ];
          break;
        }
        case "customers": {
          const r = base as Store["customers"][number];
          headers = [
            "Customer",
            "Industry",
            "Contact",
            "Email",
            "Contracts",
            "Status",
          ];
          status = r.status;
          values = [
            r.name,
            r.industry,
            r.contact,
            r.email,
            data.contracts.filter((c) => c.customerId === r.id).length,
            r.status,
          ];
          cells = [
            identity,
            r.industry,
            r.contact,
            r.email,
            values[4],
            <Badge key="status" value={r.status} />,
          ];
          break;
        }
        case "contracts": {
          const r = base as Store["contracts"][number];
          headers = [
            "Agreement",
            "Customer",
            "Site",
            "Value (ZAR)",
            "End / renewal",
            "Status",
          ];
          status = r.status;
          values = [
            `${r.id} ${r.title}`,
            customerName(r.customerId),
            siteName(r.siteId),
            r.value,
            `${r.endDate} / ${r.renewalDate}`,
            r.status,
          ];
          cells = [
            identity,
            link("customers", r.customerId, customerName(r.customerId)),
            link("sites", r.siteId, siteName(r.siteId)),
            money(r.value),
            <span key="dates" className="identity">
              {r.endDate}
              <small>Review {r.renewalDate}</small>
            </span>,
            <Badge key="status" value={r.status} />,
          ];
          break;
        }
        case "workers": {
          const r = base as Store["workers"][number];
          headers = ["Employee", "Role", "Site", "Shift", "Duty status"];
          status = r.status;
          values = [r.name, r.role, siteName(r.siteId), r.shift, r.status];
          cells = [
            identity,
            r.role,
            link("sites", r.siteId, siteName(r.siteId)),
            r.shift,
            <Badge key="status" value={r.status} />,
          ];
          break;
        }
      }
      rows.push({ id: base.id, cells, values, status });
    }
    // Keep empty registers accessible and exportable, with named columns.
    if (!headers.length) headers = ["Record", "Details", "Status"];
    return (
      <DataTable
        key={`${entity}-${title || "register"}`}
        title={
          title ||
          {
            sites: "Site register",
            assets: "Equipment register",
            orders: "Work order queue",
            production: "Production logbook",
            customers: "Customer directory",
            contracts: "Contract register",
            workers: "Employee directory",
          }[entity]
        }
        headers={headers}
        rows={rows}
        onOpen={(id) => open(entity, id)}
        create={
          showCreate ? (
            <Button onClick={() => create(entity)}>
              <Plus size={15} /> Add {entityNames[entity]}
            </Button>
          ) : undefined
        }
      />
    );
  }

  const cardData = [
    {
      label: "Total production",
      value: `${number(m.tonnes)} t`,
      text: `${m.days === 1 ? "Selected day" : `${m.days}-day period`} · ${m.production.length} shift records`,
      icon: Factory,
      page: "Mining operations" as Page,
    },
    {
      label: "Production to plan",
      value: `${Math.round(m.achievement)}%`,
      text: `${number(m.target)} t period target`,
      icon: Gauge,
      page: "Reports & analytics" as Page,
    },
    {
      label: "Fleet availability",
      value: `${Math.round(m.availability)}%`,
      text: `${m.available} of ${m.assets.length} available · includes idle`,
      icon: Truck,
      page: "Fleet & equipment" as Page,
    },
    {
      label: "Open work orders",
      value: String(m.open.length).padStart(2, "0"),
      text: `${m.open.filter((o) => o.priority === "High").length} high priority · current snapshot`,
      icon: Wrench,
      page: "Maintenance" as Page,
    },
  ];
  const cards = (
    <div className="kpi-grid">
      {cardData.map(({ label, value, text, icon: Icon, page }) => (
        <button className="kpi" key={label} onClick={() => go(page)}>
          <div>
            <span>{label}</span>
            <Icon size={19} />
          </div>
          <strong>{value}</strong>
          <small>{text}</small>
        </button>
      ))}
    </div>
  );
  const sitePerformance = m.sites.map((s) => ({
    name: s.name,
    actual: siteTotals[s.id],
    target: s.status === "Active" ? s.target * m.days : 0,
  }));
  const trend = Array.from(
    { length: Math.min(366, m.days === 1 ? 14 : m.days) },
    (_, i) =>
      dateOffset(to, i - (m.days === 1 ? 13 : Math.min(366, m.days) - 1)),
  ).map((date) => ({
    date,
    value: data.production
      .filter(
        (p) =>
          p.date === date && (siteFilter === "All" || p.siteId === siteFilter),
      )
      .reduce((t, p) => t + p.tonnes, 0),
  }));
  const siteScorecard = (
    <Panel
      title="Site performance"
      eyebrow="PRODUCTION & DELIVERY"
      action={
        <Button
          onClick={() =>
            download(
              "mysol-site-performance.csv",
              csv([
                ["Site", "Period target", "Actual tonnes", "Attainment %"],
                ...sitePerformance.map((s) => [
                  s.name,
                  s.target,
                  s.actual,
                  s.target ? Math.round((s.actual / s.target) * 100) : 0,
                ]),
              ]),
            )
          }
        >
          <Download size={15} /> Export
        </Button>
      }
    >
      <div className="scorecard">
        {m.sites.map((s) => (
          <button key={s.id} onClick={() => open("sites", s.id)}>
            <span>
              <b>{s.name}</b>
              <small>
                {s.commodity} · {number(s.target)} t daily target
              </small>
            </span>
            <span>
              <strong>{number(siteTotals[s.id])} t</strong>
              <small>
                {s.status === "Active"
                  ? `${Math.round((siteTotals[s.id] / (s.target * m.days)) * 100)}% of plan`
                  : "Site paused"}
              </small>
            </span>
            <ChevronRight size={15} />
          </button>
        ))}
      </div>
    </Panel>
  );
  const alerts = (
    <Panel
      title="Priority incidents"
      eyebrow="MAINTENANCE CONTROL"
      action={<span className="count">{m.open.length}</span>}
    >
      <div className="alerts">
        {[...m.open]
          .sort(
            (a, b) =>
              ["High", "Medium", "Low"].indexOf(a.priority) -
              ["High", "Medium", "Low"].indexOf(b.priority),
          )
          .slice(0, 4)
          .map((o) => (
            <button key={o.id} onClick={() => open("orders", o.id)}>
              <i>
                <Wrench size={18} />
              </i>
              <span>
                <b>{o.issue}</b>
                <small>
                  {o.id} · {o.assetId} · {siteName(o.siteId)}
                </small>
              </span>
              <Badge value={o.priority} />
            </button>
          ))}
        {!m.open.length && (
          <p className="empty">
            No unresolved incidents in this site selection.
          </p>
        )}
      </div>
      <button className="panel-link" onClick={() => go("Maintenance")}>
        Manage maintenance <ChevronRight size={16} />
      </button>
    </Panel>
  );

  const currentRecord = detail
    ? data[detail.entity].find((r) => r.id === detail.id)
    : null;
  function profile() {
    if (!detail || !currentRecord) return null;
    const { entity, id } = detail;
    const related = (kind: Entity, records: Store[Entity], title: string) => (
      <Panel title={title}>
        <div className="related-list">
          {records.slice(0, 12).map((r) => (
            <button key={r.id} onClick={() => open(kind, r.id)}>
              <span>
                <b>{recordTitle(r, kind)}</b>
                <small>{r.id}</small>
              </span>
              <ChevronRight size={16} />
            </button>
          ))}
          {!records.length && <p className="muted">No linked records.</p>}
          {records.length > 12 && (
            <Button
              onClick={() => {
                setDetail(null);
                go(entityPage[kind]);
              }}
            >
              View all {records.length} records
            </Button>
          )}
        </div>
      </Panel>
    );
    switch (entity) {
      case "sites": {
        const r = currentRecord as Store["sites"][number];
        return (
          <>
            <div className="profile-banner">
              <Mountain size={36} />
              <div>
                <h3>{r.name}</h3>
                <p>
                  {r.region} · {r.commodity}
                </p>
              </div>
              <Badge value={r.status} />
            </div>
            <div className="profile-stats">
              {stat("Daily target", `${number(r.target)} t`)}
              {stat(
                "Period production",
                `${number(data.production.filter((p) => p.siteId === id && p.date >= from && p.date <= to).reduce((n, p) => n + p.tonnes, 0))} t`,
              )}
              {stat(
                "Assigned equipment",
                data.assets.filter((a) => a.siteId === id).length,
              )}
              {stat(
                "People on duty",
                data.workers.filter(
                  (w) => w.siteId === id && w.status === "On duty",
                ).length,
              )}
            </div>
            <div className="profile-actions">
              <Button
                primary
                onClick={() => create("production", { siteId: id })}
              >
                Log production
              </Button>
              <Button
                onClick={() => {
                  setDetail(null);
                  setSiteFilter(id);
                  go("Fleet & equipment");
                }}
              >
                Assign equipment
              </Button>
              <Button
                onClick={() => {
                  setDetail(null);
                  setSiteFilter(id);
                  go("Workforce");
                }}
              >
                Manage workforce
              </Button>
            </div>
            <div className="profile-grid">
              {related(
                "assets",
                data.assets.filter((a) => a.siteId === id),
                "Assigned equipment",
              )}
              {related(
                "workers",
                data.workers.filter((w) => w.siteId === id),
                "Assigned workforce",
              )}
              {related(
                "orders",
                data.orders.filter((o) => o.siteId === id),
                "Maintenance incidents",
              )}
              {related(
                "contracts",
                data.contracts.filter((c) => c.siteId === id),
                "Delivery contracts",
              )}
            </div>
            {table(
              "production",
              data.production.filter(
                (p) => p.siteId === id && p.date >= from && p.date <= to,
              ),
              "Site production history",
              false,
            )}
            <Panel title="Recent operational activity">
              <div className="activity-list">
                {data.activities
                  .filter((a) => a.siteId === id)
                  .slice(0, 8)
                  .map((a) => (
                    <p key={a.id}>
                      {a.message}
                      <small>{a.date.slice(0, 10)}</small>
                    </p>
                  ))}
                {!data.activities.some((a) => a.siteId === id) && (
                  <p className="muted">
                    No new activity recorded for this site.
                  </p>
                )}
              </div>
            </Panel>
          </>
        );
      }
      case "assets": {
        const a = currentRecord as Asset;
        return (
          <>
            <div className="asset-photo">
              <Image
                src={
                  a.type === "Excavator"
                    ? "/excavator.jpg"
                    : "/quarry-truck.jpg"
                }
                alt="Illustrative mining machinery at a quarry; not the registered asset"
                fill
                sizes="(max-width: 700px) 90vw, 900px"
              />
              <span>ILLUSTRATIVE EQUIPMENT PHOTOGRAPH</span>
            </div>
            <div className="profile-banner">
              <Truck size={32} />
              <div>
                <h3>{a.name}</h3>
                <p>
                  {a.id} · {a.manufacturer} · {a.model} · {a.type}
                </p>
              </div>
              <Badge value={a.status} />
            </div>
            <div className="profile-stats">
              {stat(
                "Current site",
                link("sites", a.siteId, siteName(a.siteId)),
              )}
              {stat(
                "Assigned operator",
                a.operatorId
                  ? link("workers", a.operatorId, workerName(a.operatorId))
                  : "Unassigned",
              )}
              {stat("Engine hours", `${number(a.hours)} h`)}
              {stat("Last service", a.lastService)}
              {stat("Next service", a.nextService)}
            </div>
            <div className="profile-actions">
              <Button
                primary
                onClick={() => create("orders", { assetId: a.id })}
              >
                <Wrench size={16} /> Report breakdown
              </Button>
              <Button onClick={() => edit("assets", a.id)}>
                Transfer / assign operator
              </Button>
            </div>
            <div className="profile-grid">
              <Panel
                title="Condition indicators"
                eyebrow="SIMULATED DEMO TELEMETRY"
              >
                <Meter value={a.health} label="Equipment health" />
                <Meter value={a.fuel} label="Fuel level" />
                <p className="muted">
                  Sample indicators entered in the equipment register. No
                  sensors or live telemetry are connected.
                </p>
              </Panel>
              <Panel
                title="Engine-hour history"
                eyebrow="RECORDED SAMPLE READINGS"
              >
                <TrendChart
                  label="Engine hours"
                  data={a.hourHistory.map((h) => ({
                    date: h.date,
                    value: h.hours,
                  }))}
                />
              </Panel>
            </div>
            {related(
              "orders",
              data.orders.filter((o) => o.assetId === id),
              "Maintenance history & work orders",
            )}
          </>
        );
      }
      case "orders": {
        const r = currentRecord as WorkOrder;
        return (
          <>
            <div className="profile-banner">
              <Wrench size={32} />
              <div>
                <h3>{r.id}</h3>
                <p>{r.issue}</p>
              </div>
              <Badge value={r.status} />
            </div>
            <div className="profile-stats">
              {stat("Equipment", link("assets", r.assetId, r.assetId))}
              {stat(
                "Incident site",
                link("sites", r.siteId, siteName(r.siteId)),
              )}
              {stat("Priority", <Badge value={r.priority} />)}
              {stat("Type", r.kind)}
              {stat(
                "Technician",
                r.technicianId
                  ? link("workers", r.technicianId, workerName(r.technicianId))
                  : "Unassigned",
              )}
              {stat("Reported", r.createdAt)}
              {stat("Completed", r.completedAt || "Awaiting completion")}
            </div>
            <Panel title="Workshop notes">
              <p className="pre-wrap">
                {r.notes || "No workshop notes recorded."}
              </p>
              <h3>Resolution</h3>
              <p className="pre-wrap">
                {r.resolution ||
                  "Record resolution notes when completing this work order."}
              </p>
            </Panel>
            <p className="callout">
              Breakdown work orders keep equipment in Maintenance until every
              linked breakdown is resolved. Scheduled work does not
              automatically take a machine out of service.
            </p>
          </>
        );
      }
      case "customers": {
        const c = currentRecord as Store["customers"][number];
        const agreements = data.contracts.filter((r) => r.customerId === id);
        return (
          <>
            <div className="profile-banner">
              <Factory size={32} />
              <div>
                <h3>{c.name}</h3>
                <p>{c.industry} · Fictional customer</p>
              </div>
              <Badge value={c.status} />
            </div>
            <div className="profile-stats">
              {stat("Primary contact", c.contact)}
              {stat("Email", c.email)}
              {stat("Phone", c.phone || "Not provided")}
              {stat(
                "Contract value",
                money(agreements.reduce((t, c) => t + c.value, 0)),
              )}
            </div>
            <Button
              primary
              onClick={() => create("contracts", { customerId: id })}
            >
              <Plus size={16} /> Create linked contract
            </Button>
            <div className="profile-grid">
              {related("contracts", agreements, "Customer contracts")}
              {related(
                "sites",
                data.sites.filter((s) =>
                  agreements.some((c) => c.siteId === s.id),
                ),
                "Related delivery sites",
              )}
            </div>
          </>
        );
      }
      case "contracts": {
        const c = currentRecord as Store["contracts"][number];
        return (
          <>
            <div className="profile-banner">
              <FileText size={32} />
              <div>
                <h3>{c.title}</h3>
                <p>{c.id} · Fictional agreement</p>
              </div>
              <Badge value={c.status} />
            </div>
            <div className="profile-stats">
              {stat(
                "Customer",
                link("customers", c.customerId, customerName(c.customerId)),
              )}
              {stat(
                "Delivery site",
                link("sites", c.siteId, siteName(c.siteId)),
              )}
              {stat("Agreement value", money(c.value))}
              {stat("Start date", c.startDate)}
              {stat("End date", c.endDate)}
              {stat("Renewal review", c.renewalDate)}
            </div>
            <Panel title="Agreement notes">
              <p className="pre-wrap">{c.notes || "No notes recorded."}</p>
            </Panel>
            <Button onClick={() => edit("contracts", id)}>
              Manage renewal and dates
            </Button>
          </>
        );
      }
      case "workers": {
        const w = currentRecord as Store["workers"][number];
        return (
          <>
            <div className="profile-banner">
              <Users size={32} />
              <div>
                <h3>{w.name}</h3>
                <p>
                  {w.id} · {w.role}
                </p>
              </div>
              <Badge value={w.status} />
            </div>
            <div className="profile-stats">
              {stat(
                "Assigned site",
                link("sites", w.siteId, siteName(w.siteId)),
              )}
              {stat("Shift", w.shift)}
              {stat("Phone", w.phone || "Not provided")}
              {stat("Duty status", w.status)}
            </div>
            <div className="profile-grid">
              {related(
                "assets",
                data.assets.filter((a) => a.operatorId === id),
                "Assigned equipment",
              )}
              {related(
                "orders",
                data.orders.filter((o) => o.technicianId === id),
                "Technician work orders",
              )}
            </div>
          </>
        );
      }
      case "production": {
        const p = currentRecord as Store["production"][number];
        return (
          <>
            <div className="profile-stats">
              {stat("Record", p.id)}
              {stat("Mining site", link("sites", p.siteId, siteName(p.siteId)))}
              {stat("Date", p.date)}
              {stat("Shift", p.shift)}
              {stat("Tonnes produced", `${number(p.tonnes)} t`)}
              {stat("Haulage trips", p.trips)}
            </div>
            <Panel title="Shift notes">
              <p className="pre-wrap">{p.notes || "No notes recorded."}</p>
            </Panel>
          </>
        );
      }
    }
  }

  return (
    <div className="app-shell">
      <a className="skip-link" href="#workspace">
        Skip to workspace
      </a>
      <aside
        className={`sidebar ${mobile ? "is-open" : ""}`}
        aria-label="Primary navigation"
      >
        <div className="brand">
          <span>
            <Mountain size={25} />
          </span>
          <div>
            <b>
              MYSOL<span>°</span>
            </b>
            <small>CENTRAL</small>
          </div>
          <button
            className="mobile-close icon-button"
            aria-label="Close navigation"
            onClick={() => setMobile(false)}
          >
            <X size={20} />
          </button>
        </div>
        <div className="workspace-label">
          <i>M</i>
          <span>
            <b>MySol Holdings & Logistics</b>
            <small>Enterprise demonstration</small>
          </span>
        </div>
        <nav>
          <span className="nav-label">OPERATIONS WORKSPACE</span>
          {navigation.map(({ label, icon: Icon }, index) => (
            <div key={label}>
              {index === 5 && (
                <span className="nav-label organisation">
                  BUSINESS MANAGEMENT
                </span>
              )}
              <button
                className={`nav-item ${page === label ? "active" : ""}`}
                aria-label={label}
                aria-current={page === label ? "page" : undefined}
                onClick={() => go(label)}
              >
                <Icon size={18} />
                <span>{label}</span>
                {label === "Maintenance" && (
                  <em>
                    {data.orders.filter((o) => o.status !== "Resolved").length}
                  </em>
                )}
              </button>
            </div>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="presentation-card">
            <Play size={19} />
            <b>See the connected story.</b>
            <p>From the pit to the boardroom.</p>
            <button
              onClick={() => {
                setTour(0);
                go(walkthrough[0].page);
              }}
            >
              Start guided demo <ChevronRight size={15} />
            </button>
          </div>
          <button
            className="sidebar-profile"
            onClick={() => setOverlay("profile")}
          >
            <i>AD</i>
            <span>
              <b>Demo Administrator</b>
              <small>Presentation workspace</small>
            </span>
            <Settings size={15} />
          </button>
        </div>
      </aside>
      {mobile && (
        <button
          className="nav-scrim"
          aria-label="Close navigation"
          onClick={() => setMobile(false)}
        />
      )}
      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumbs">
            <button
              className="mobile-toggle icon-button"
              aria-label="Open navigation"
              onClick={() => setMobile(true)}
            >
              <Menu size={22} />
            </button>
            <span>Workspace</span>
            <ChevronRight size={13} />
            <b>{page}</b>
          </div>
          <div className="top-actions">
            <button
              className="search-trigger"
              onClick={() => {
                setQuery("");
                setOverlay("search");
              }}
              aria-label="Global search"
            >
              <Search size={17} />
              <span>Search workspace</span>
              <kbd>Search</kbd>
            </button>
            <span className="demo-label">
              <i /> Demo Environment
            </span>
            <button
              className="icon-button notification-button"
              aria-label="View notifications"
              onClick={() => setOverlay("notifications")}
            >
              <Bell size={19} />
              {m.open.length > 0 && <i />}
            </button>
            <button
              className="avatar"
              aria-label="Open profile menu"
              onClick={() => setOverlay("profile")}
            >
              AD
            </button>
          </div>
        </header>
        <main
          className={`workspace ${page === "Executive dashboard" ? "command-workspace" : ""}`}
          id="workspace"
        >
          <div className="title-row">
            <div>
              <span className="eyebrow">
                MYSOL CENTRAL <span>/</span> OPERATIONS INTELLIGENCE
              </span>
              <h1 ref={heading} tabIndex={-1}>
                {page === "Executive dashboard"
                  ? "Operations command centre"
                  : page}
              </h1>
              <p>
                {page === "Executive dashboard"
                  ? "Every site. Every asset. One clear picture."
                  : page === "Mining operations"
                    ? "Capture shift performance and connect production to the bigger picture."
                    : page === "Fleet & equipment"
                      ? "A complete view of the machines that keep your operations moving."
                      : page === "Maintenance"
                        ? "From reported fault to return to service, with every step connected."
                        : page === "Customers"
                          ? "Build relationships around the work you deliver."
                          : page === "Contracts"
                            ? "Bring commercial commitments and operational delivery together."
                            : page === "Workforce"
                              ? "The right people, in the right place, on the right shift."
                              : page === "Settings"
                                ? "Prepare a reliable workspace for your next management presentation."
                                : "Connected operational records. Clearer management decisions."}
              </p>
            </div>
            <div className="title-actions">
              {page === "Reports & analytics" ? (
                <Button onClick={() => window.print()}>
                  <Printer size={16} /> Print report
                </Button>
              ) : (
                <Button
                  onClick={() => {
                    setTour(0);
                    go(walkthrough[0].page);
                  }}
                >
                  <Play size={15} /> Guided demo
                </Button>
              )}
              {pageEntity[page] && (
                <Button
                  primary
                  disabled={!ready}
                  onClick={() => create(pageEntity[page]!)}
                >
                  <Plus size={17} />
                  {page === "Mining operations"
                    ? "Log production"
                    : page === "Maintenance"
                      ? "Report breakdown"
                      : `Add ${entityNames[pageEntity[page]!]}`}
                </Button>
              )}
            </div>
          </div>
          <div className="demo-notice">
            <ShieldCheck size={16} />
            <span>
              <b>FICTIONAL SAMPLE DATA</b> · Browser-local demonstration.
              Illustrative map and telemetry. No live MySol systems connected.
            </span>
            <span className="snapshot-date">Demo date · 19 Nov 2026</span>
          </div>
          {storageError && (
            <div className="error-message" role="alert">
              {storageError}
            </div>
          )}
          {!ready ? (
            <div className="loading-state">
              <Mountain size={40} />
              <h2>Preparing your command centre</h2>
              <p>Loading local demonstration records…</p>
            </div>
          ) : (
            <>
              {page !== "Settings" && (
                <div className="context-filters">
                  <label>
                    <MapPin size={15} />
                    <span>Site</span>
                    <select
                      aria-label="Filter by site"
                      value={siteFilter}
                      onChange={(e) => {
                        setSiteFilter(e.target.value);
                        if (e.target.value !== "All")
                          setSelectedSite(e.target.value);
                      }}
                    >
                      <option value="All">All mining sites</option>
                      {data.sites.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  {[
                    "Executive dashboard",
                    "Mining operations",
                    "Reports & analytics",
                  ].includes(page) && (
                    <div className="date-filters">
                      <label>
                        From{" "}
                        <input
                          aria-label="From date"
                          type="date"
                          value={from}
                          max={to}
                          onChange={(e) => {
                            if (e.target.value && e.target.value <= to)
                              setFrom(e.target.value);
                          }}
                        />
                      </label>
                      <label>
                        To{" "}
                        <input
                          aria-label="To date"
                          type="date"
                          value={to}
                          min={from}
                          onChange={(e) => {
                            if (e.target.value && e.target.value >= from)
                              setTo(e.target.value);
                          }}
                        />
                      </label>
                      <select
                        aria-label="Date range preset"
                        value=""
                        onChange={(e) => chooseRange(e.target.value)}
                      >
                        <option value="" disabled>
                          Date range
                        </option>
                        <option value="1">Demo day</option>
                        <option value="7">Last 7 days</option>
                        <option value="30">Last 30 days</option>
                      </select>
                    </div>
                  )}
                </div>
              )}
              {page === "Executive dashboard" && (
                <>
                  <CommandStage
                    sites={m.sites}
                    assets={m.assets}
                    selectedSite={selectedSite}
                    totals={siteTotals}
                    cards={cards}
                    onSelect={setSelectedSite}
                    onSite={(id) => open("sites", id)}
                    onAsset={(id) => open("assets", id)}
                    onNavigate={go}
                  />
                  <div className="snapshot-strip">
                    <span>
                      <b>{number(m.dailyTarget)} t</b> daily target
                    </span>
                    <span>
                      <b>{m.operational}</b> operational machines
                    </span>
                    <span>
                      <b>
                        {
                          m.assets.filter((a) => a.status === "Maintenance")
                            .length
                        }
                      </b>{" "}
                      in maintenance
                    </span>
                    <span>
                      <b>
                        {m.sites.filter((s) => s.status === "Active").length}
                      </b>{" "}
                      active sites
                    </span>
                    <span>
                      <b>
                        {
                          m.contracts.filter((c) => c.status === "Active")
                            .length
                        }
                      </b>{" "}
                      active contracts
                    </span>
                    <span>
                      <b>
                        {m.workers.filter((w) => w.status === "On duty").length}
                      </b>{" "}
                      people on duty
                    </span>
                  </div>
                  <div className="dashboard-grid">
                    <Panel
                      title="Production against plan"
                      eyebrow="SELECTED PERIOD"
                    >
                      <ProductionChart data={sitePerformance} />
                    </Panel>
                    {alerts}
                  </div>
                  <div className="dashboard-grid">
                    <Panel
                      title="Production momentum"
                      eyebrow={
                        m.days === 1
                          ? "14 DAYS ENDING ON SELECTED DATE"
                          : "SELECTED PERIOD · UP TO 366 DAYS"
                      }
                    >
                      <TrendChart data={trend} />
                    </Panel>
                    {siteScorecard}
                  </div>
                </>
              )}
              {page === "Mining operations" && (
                <>
                  <div className="compact-metrics">
                    {stat("Recorded tonnes", `${number(m.tonnes)} t`)}
                    {stat("Period target", `${number(m.target)} t`)}
                    {stat(
                      "Haulage trips",
                      number(m.production.reduce((n, p) => n + p.trips, 0)),
                    )}
                    {stat("Shift records", m.production.length)}
                  </div>
                  <div className="dashboard-grid">
                    <Panel
                      title="Shift production vs target"
                      eyebrow="SELECTED PERIOD"
                    >
                      <ProductionChart data={sitePerformance} />
                    </Panel>
                    {siteScorecard}
                  </div>
                  {table("production", m.production)}
                </>
              )}
              {page === "Sites" && (
                <>
                  <Panel
                    title="Mining site network"
                    eyebrow="ILLUSTRATIVE SOUTH AFRICAN OPERATIONS"
                  >
                    <SiteMap
                      sites={m.sites}
                      selected={selectedSite}
                      onSelect={(id) => {
                        setSelectedSite(id);
                        open("sites", id);
                      }}
                      totals={siteTotals}
                    />
                  </Panel>
                  {table("sites", m.sites)}
                </>
              )}
              {page === "Fleet & equipment" && (
                <>
                  <div className="fleet-hero">
                    <div>
                      <span className="eyebrow">FLEET INTELLIGENCE</span>
                      <h2>
                        Keep your operation
                        <br />
                        moving forward.
                      </h2>
                      <p>
                        {m.assets.length} registered machines. Every assignment,
                        service and incident connected.
                      </p>
                      <div>
                        <Badge value="Operational" />
                        <strong>{m.operational} machines working</strong>
                      </div>
                    </div>
                    <div className="fleet-hero-image">
                      <Image
                        src="/excavator.jpg"
                        alt="Illustrative excavator working in a rocky quarry"
                        fill
                        sizes="(max-width: 760px) 90vw, 650px"
                        priority
                      />
                      <span>ILLUSTRATIVE PHOTO · SAMPLE EQUIPMENT</span>
                    </div>
                  </div>
                  {table("assets", m.assets)}
                </>
              )}
              {page === "Maintenance" && (
                <>
                  <div className="compact-metrics">
                    {stat(
                      "Open",
                      m.orders.filter((o) => o.status === "Open").length,
                    )}
                    {stat(
                      "In progress",
                      m.orders.filter((o) => o.status === "In progress").length,
                    )}
                    {stat(
                      "Resolved",
                      m.orders.filter((o) => o.status === "Resolved").length,
                    )}
                    {stat(
                      "Machines in maintenance",
                      m.assets.filter((a) => a.status === "Maintenance").length,
                    )}
                  </div>
                  <p className="context-note">
                    Current work order snapshot. Use Reports & analytics for
                    period activity. The queue keeps all unresolved work
                    visible.
                  </p>
                  {table("orders", m.orders)}
                </>
              )}
              {page === "Customers" && (
                <>
                  <div className="compact-metrics">
                    {stat("Customer accounts", data.customers.length)}
                    {stat(
                      "Active accounts",
                      data.customers.filter((c) => c.status === "Active")
                        .length,
                    )}
                    {stat(
                      "Active contracts",
                      m.contracts.filter((c) => c.status === "Active").length,
                    )}
                    {stat(
                      "Contract portfolio",
                      money(m.contracts.reduce((n, c) => n + c.value, 0)),
                    )}
                  </div>
                  {table(
                    "customers",
                    siteFilter === "All"
                      ? data.customers
                      : data.customers.filter((c) =>
                          m.contracts.some((x) => x.customerId === c.id),
                        ),
                  )}
                </>
              )}
              {page === "Contracts" && (
                <>
                  <div className="compact-metrics">
                    {stat(
                      "Active agreements",
                      m.contracts.filter((c) => c.status === "Active").length,
                    )}
                    {stat(
                      "Pending agreements",
                      m.contracts.filter((c) => c.status === "Pending").length,
                    )}
                    {stat(
                      "Portfolio value",
                      money(m.contracts.reduce((n, c) => n + c.value, 0)),
                    )}
                    {stat(
                      "Review within 90 days",
                      m.contracts.filter(
                        (c) =>
                          c.renewalDate >= to &&
                          c.renewalDate <= dateOffset(to, 90),
                      ).length,
                    )}
                  </div>
                  {table("contracts", m.contracts)}
                </>
              )}
              {page === "Workforce" && (
                <>
                  <div className="compact-metrics">
                    {stat("Registered employees", m.workers.length)}
                    {stat(
                      "People on duty",
                      m.workers.filter((w) => w.status === "On duty").length,
                    )}
                    {stat(
                      "Day shift on duty",
                      m.workers.filter(
                        (w) => w.shift === "Day" && w.status === "On duty",
                      ).length,
                    )}
                    {stat(
                      "Night shift on duty",
                      m.workers.filter(
                        (w) => w.shift === "Night" && w.status === "On duty",
                      ).length,
                    )}
                  </div>
                  {table("workers", m.workers)}
                </>
              )}
              {page === "Reports & analytics" && (
                <>
                  <p className="print-context">
                    Management briefing · {from} to {to} ·{" "}
                    {siteFilter === "All" ? "All sites" : siteName(siteFilter)}{" "}
                    · Fictional sample data
                  </p>
                  {cards}
                  <p className="context-note">
                    Production and maintenance activity use the selected dates.
                    Fleet, health, workforce and contracts are current
                    snapshots; no historical telemetry is implied.
                  </p>
                  <div className="dashboard-grid">
                    <Panel
                      title="Production performance"
                      eyebrow="SELECTED PERIOD"
                    >
                      <ProductionChart data={sitePerformance} />
                    </Panel>
                    {siteScorecard}
                  </div>
                  <Panel
                    title="Production trend"
                    eyebrow="RECORDED SHIFT TOTALS"
                  >
                    <TrendChart data={trend} />
                  </Panel>
                  <div className="report-grid">
                    <Panel
                      title="Equipment health distribution"
                      eyebrow="SIMULATED CURRENT READINGS"
                    >
                      {[
                        [
                          "Healthy · 85–100%",
                          m.assets.filter((a) => a.health >= 85).length,
                        ],
                        [
                          "Monitor · 70–84%",
                          m.assets.filter(
                            (a) => a.health >= 70 && a.health < 85,
                          ).length,
                        ],
                        [
                          "Attention · below 70%",
                          m.assets.filter((a) => a.health < 70).length,
                        ],
                      ].map(([label, count]) => (
                        <div className="distribution" key={label}>
                          <span>{label}</span>
                          <b>{count}</b>
                          <div>
                            <i
                              style={{
                                width: `${m.assets.length ? (Number(count) / m.assets.length) * 100 : 0}%`,
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </Panel>
                    <Panel
                      title="Work order status"
                      eyebrow="CURRENT MAINTENANCE QUEUE"
                    >
                      {["Open", "In progress", "Resolved"].map((status) => (
                        <button
                          className="report-row"
                          key={status}
                          onClick={() => go("Maintenance")}
                        >
                          <Badge value={status} />
                          <b>
                            {m.orders.filter((o) => o.status === status).length}
                          </b>
                          <ChevronRight size={14} />
                        </button>
                      ))}
                    </Panel>
                    <Panel
                      title="Workforce allocation"
                      eyebrow="CURRENT DUTY SNAPSHOT"
                    >
                      {m.sites.map((s) => (
                        <button
                          className="report-row"
                          key={s.id}
                          onClick={() => {
                            setSiteFilter(s.id);
                            go("Workforce");
                          }}
                        >
                          <span>{s.name}</span>
                          <b>
                            {
                              m.workers.filter(
                                (w) =>
                                  w.siteId === s.id && w.status === "On duty",
                              ).length
                            }{" "}
                            /{" "}
                            {m.workers.filter((w) => w.siteId === s.id).length}
                          </b>
                        </button>
                      ))}
                    </Panel>
                  </div>
                  {table(
                    "orders",
                    m.orders.filter(
                      (o) => o.createdAt >= from && o.createdAt <= to,
                    ),
                    "Maintenance activity report",
                    false,
                  )}
                  {table(
                    "contracts",
                    m.contracts,
                    "Contract overview report",
                    false,
                  )}
                  {table(
                    "production",
                    m.production,
                    "Production performance report",
                    false,
                  )}
                </>
              )}
              {page === "Settings" && (
                <>
                  <div className="settings-grid">
                    <Panel
                      title="Presentation workspace"
                      eyebrow="DEMO ENVIRONMENT"
                    >
                      <div className="settings-brand">
                        <Mountain size={40} />
                        <div>
                          <h3>MySol Central</h3>
                          <p>Enterprise mining operations & CRM</p>
                        </div>
                      </div>
                      {stat("Persistence", "This browser only")}
                      {stat("Demo date", DEMO_DATE)}
                      {stat("Currency & locale", "ZAR · South Africa")}
                      {stat("Authentication", "Open demonstration · no login")}
                      {stat(
                        "Connections",
                        "No external systems or credentials",
                      )}
                      <p className="muted">
                        This is a fictional sales concept and is not affiliated
                        with MySol Holdings & Logistics. Browser storage is not
                        a shared enterprise database.
                      </p>
                    </Panel>
                    <Panel
                      title="Demo data controls"
                      eyebrow="PRESENTATION PREPARATION"
                    >
                      <p>
                        Restore the original sample records before presenting,
                        or export your current workspace as a JSON backup.
                      </p>
                      <div className="settings-actions">
                        <Button
                          onClick={() =>
                            download(
                              "mysol-demo-backup.json",
                              JSON.stringify({ version: 3, data }, null, 2),
                              "application/json",
                            )
                          }
                        >
                          <Download size={17} /> Export demo backup
                        </Button>
                        <label className="button import-label">
                          Import demo backup
                          <input
                            type="file"
                            accept="application/json,.json"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              try {
                                const content = JSON.parse(await file.text());
                                if (content.version !== 3)
                                  throw new Error(
                                    "Select a version 3 MySol backup.",
                                  );
                                assertStore(content.data);
                                commitDemo(content.data);
                                setToast("Demo backup restored.");
                              } catch (error) {
                                setToast(errorMessage(error));
                              }
                              e.target.value = "";
                            }}
                          />
                        </label>
                        <Button primary onClick={() => setOverlay("reset")}>
                          Reset Demo Data
                        </Button>
                        <Button
                          onClick={() => {
                            setTour(0);
                            go(walkthrough[0].page);
                          }}
                        >
                          <Play size={17} /> Start guided demo
                        </Button>
                      </div>
                      <p className="muted">
                        Reset replaces this browser’s demo data after
                        confirmation. Imports must contain valid record
                        relationships.
                      </p>
                    </Panel>
                  </div>
                  <Panel
                    title="Connected sample dataset"
                    eyebrow="STABLE IDS · RELATED RECORDS"
                  >
                    <div className="dataset-counts">
                      {(
                        [
                          "sites",
                          "assets",
                          "workers",
                          "customers",
                          "contracts",
                          "orders",
                          "production",
                        ] as Entity[]
                      ).map((entity) => (
                        <button
                          key={entity}
                          onClick={() => go(entityPage[entity])}
                        >
                          <strong>{data[entity].length}</strong>
                          <span>
                            {entity === "assets" ? "equipment" : entity}
                          </span>
                        </button>
                      ))}
                    </div>
                  </Panel>
                  <Panel
                    title="Recent workspace activity"
                    eyebrow="BROWSER-LOCAL DEMO HISTORY"
                  >
                    <div className="activity-list">
                      {data.activities.slice(0, 15).map((a) => (
                        <p key={a.id}>
                          <Activity size={16} />
                          <span>
                            {a.message}
                            <small>
                              {new Date(a.date).toLocaleString("en-ZA", {
                                timeZone: "Africa/Johannesburg",
                              })}
                            </small>
                          </span>
                        </p>
                      ))}
                    </div>
                  </Panel>
                </>
              )}
            </>
          )}
          <footer>
            <span>
              <Mountain size={14} /> MySol Central · Connected operations. Clear
              decisions.
            </span>
            <span>Fictional sales concept · Stored in this browser</span>
          </footer>
        </main>
      </div>
      {form && (
        <Dialog
          title={`${form.id ? "Edit" : "Create"} ${entityNames[form.entity]}`}
          onClose={() => setForm(null)}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              save();
            }}
          >
            <div className="form-fields">
              {fieldsFor(form.entity, data, draft, !!form.id).map((field) => (
                <label
                  key={field.key}
                  className={`field ${field.type === "textarea" ? "full" : ""}`}
                >
                  <span>
                    {field.label}
                    {field.required && " *"}
                  </span>
                  {field.options ? (
                    <select
                      required={field.required}
                      value={draft[field.key] || ""}
                      onChange={(e) =>
                        setDraft((d) => ({
                          ...d,
                          [field.key]: e.target.value,
                          ...(field.key === "siteId" && form.entity === "assets"
                            ? { operatorId: "" }
                            : {}),
                        }))
                      }
                    >
                      {field.options.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : field.type === "textarea" ? (
                    <textarea
                      rows={3}
                      required={field.required}
                      maxLength={2000}
                      value={draft[field.key] || ""}
                      onChange={(e) =>
                        setDraft((d) => ({ ...d, [field.key]: e.target.value }))
                      }
                    />
                  ) : (
                    <input
                      type={field.type || "text"}
                      required={field.required}
                      min={field.min}
                      max={field.max}
                      step={
                        field.step ||
                        (field.type === "number" ? "1" : undefined)
                      }
                      maxLength={180}
                      value={draft[field.key] || ""}
                      onChange={(e) =>
                        setDraft((d) => ({ ...d, [field.key]: e.target.value }))
                      }
                    />
                  )}
                </label>
              ))}
            </div>
            {formError && (
              <p className="error-message" role="alert">
                {formError}
              </p>
            )}
            {form.entity === "assets" && (
              <p className="context-note">
                Operators must belong to the assigned site. Resolve all open
                breakdowns before changing an affected machine’s status.
              </p>
            )}
            <div className="dialog-footer">
              <Button onClick={() => setForm(null)}>Cancel</Button>
              <button className="button primary" type="submit">
                <Check size={16} /> Save record
              </button>
            </div>
          </form>
        </Dialog>
      )}
      {detail && currentRecord && (
        <Dialog
          title={recordTitle(currentRecord, detail.entity)}
          onClose={() => setDetail(null)}
          wide
        >
          {profile()}
          <div className="dialog-footer">
            <button
              className="text-link danger"
              onClick={() => setOverlay("delete")}
            >
              Delete record
            </button>
            <Button onClick={() => setDetail(null)}>Close</Button>
            <Button primary onClick={() => edit(detail.entity, detail.id)}>
              Edit record
            </Button>
          </div>
        </Dialog>
      )}
      {overlay === "delete" && (
        <Dialog
          title="Delete this demo record?"
          onClose={() => setOverlay(null)}
        >
          <p>
            Linked records are protected. This action removes the selected
            record from this browser’s demonstration.
          </p>
          <div className="dialog-footer">
            <Button onClick={() => setOverlay(null)}>Cancel</Button>
            <Button primary onClick={remove}>
              Delete record
            </Button>
          </div>
        </Dialog>
      )}
      {overlay === "reset" && (
        <Dialog
          title="Restore original sample data?"
          onClose={() => setOverlay(null)}
        >
          <p>
            All changes in this browser will be replaced with the original 8
            sites, 48 machines, 72 employees and linked sample records. Export a
            backup in Settings if you want to keep your changes.
          </p>
          <div className="dialog-footer">
            <Button onClick={() => setOverlay(null)}>Cancel</Button>
            <Button primary onClick={reset}>
              Restore sample data
            </Button>
          </div>
        </Dialog>
      )}
      {overlay === "search" && (
        <Dialog title="Search the workspace" onClose={() => setOverlay(null)}>
          <label className="search-input global-search">
            <Search size={20} />
            <input
              autoFocus
              aria-label="Search all records"
              placeholder="Site, machine, person, customer or work order…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <div className="search-results">
            {query.trim() ? (
              (() => {
                const results = (
                  [
                    "sites",
                    "assets",
                    "workers",
                    "orders",
                    "customers",
                    "contracts",
                    "production",
                  ] as Entity[]
                ).flatMap((entity) =>
                  data[entity]
                    .filter((r) =>
                      JSON.stringify(r)
                        .toLowerCase()
                        .includes(query.toLowerCase()),
                    )
                    .map((r) => ({ entity, r })),
                );
                return results.length ? (
                  <>
                    <small>{results.length} matches · showing up to 30</small>
                    {results.slice(0, 30).map(({ entity, r }) => (
                      <button
                        key={`${entity}-${r.id}`}
                        onClick={() => open(entity, r.id)}
                      >
                        <span>
                          <b>{recordTitle(r, entity)}</b>
                          <small>
                            {r.id} · {entityNames[entity]}
                          </small>
                        </span>
                        <ChevronRight size={16} />
                      </button>
                    ))}
                  </>
                ) : (
                  <p className="empty">
                    No matching records. Try an asset ID, site or surname.
                  </p>
                );
              })()
            ) : (
              <p className="empty">
                Search across your connected demonstration records.
              </p>
            )}
          </div>
        </Dialog>
      )}
      {overlay === "notifications" && (
        <Dialog
          title="Operational notifications"
          onClose={() => setOverlay(null)}
        >
          <p className="muted">
            Current unresolved work orders in the selected site context.
          </p>
          <div className="search-results">
            {m.open.map((o) => (
              <button key={o.id} onClick={() => open("orders", o.id)}>
                <span>
                  <b>{o.issue}</b>
                  <small>
                    {o.id} · {o.assetId}
                  </small>
                </span>
                <Badge value={o.priority} />
              </button>
            ))}
            {!m.open.length && (
              <p className="empty">No unresolved work orders.</p>
            )}
          </div>
        </Dialog>
      )}
      {overlay === "profile" && (
        <Dialog title="Demo Administrator" onClose={() => setOverlay(null)}>
          <p>
            This open presentation workspace uses fictional data stored in this
            browser. No signed-in enterprise account is connected.
          </p>
          <div className="settings-actions">
            <Button
              onClick={() => {
                setOverlay(null);
                go("Settings");
              }}
            >
              <Settings size={17} /> Workspace settings
            </Button>
            <Button
              onClick={() => {
                setOverlay(null);
                setTour(0);
                go(walkthrough[0].page);
              }}
            >
              <CircleHelp size={17} /> Guided presentation
            </Button>
          </div>
        </Dialog>
      )}
      {tour !== null && (
        <div className="tour" role="region" aria-label="Guided demonstration">
          <div>
            <span className="eyebrow">
              <Play size={12} /> GUIDED DEMO · {tour + 1} / {walkthrough.length}
            </span>
            <button
              className="icon-button"
              aria-label="End guided demo"
              onClick={() => setTour(null)}
            >
              <X size={17} />
            </button>
          </div>
          <h3>{walkthrough[tour].title}</h3>
          <p>{walkthrough[tour].text}</p>
          <div className="tour-actions">
            <Button
              disabled={tour === 0}
              onClick={() => {
                setTour(tour - 1);
                go(walkthrough[tour - 1].page);
              }}
            >
              Previous
            </Button>
            <Button
              primary
              onClick={() => {
                if (tour === walkthrough.length - 1) setTour(null);
                else {
                  setTour(tour + 1);
                  go(walkthrough[tour + 1].page);
                }
              }}
            >
              {tour === walkthrough.length - 1 ? "Finish" : "Next step"}
            </Button>
          </div>
        </div>
      )}
      {toast && (
        <div className="toast" role="status">
          <Check size={18} />
          <span>{toast}</span>
          <button
            className="icon-button"
            aria-label="Dismiss notification"
            onClick={() => setToast("")}
          >
            <X size={17} />
          </button>
        </div>
      )}
    </div>
  );
}
