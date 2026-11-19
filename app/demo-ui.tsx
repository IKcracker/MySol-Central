"use client";

import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  Legend,
} from "recharts";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Mountain,
  Search,
  X,
} from "lucide-react";
import { number, type Site } from "./demo-data";

export function Badge({ value }: { value: string }) {
  return (
    <span
      className={`badge ${["Active", "Operational", "Resolved", "On duty"].includes(value) ? "good" : ["High", "Maintenance", "Open"].includes(value) ? "bad" : "neutral"}`}
    >
      {value}
    </span>
  );
}
export function Button({
  children,
  onClick,
  primary = false,
  disabled = false,
}: {
  children: ReactNode;
  onClick?: () => void;
  primary?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      className={`button ${primary ? "primary" : ""}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
export function Panel({
  title,
  eyebrow,
  action,
  children,
  className = "",
}: {
  title: string;
  eyebrow?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`panel ${className}`}>
      <div className="panel-head">
        <div>
          {eyebrow && <span className="eyebrow">{eyebrow}</span>}
          <h2>{title}</h2>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
export function Meter({ value, label }: { value: number; label: string }) {
  return (
    <div className="meter">
      <div>
        <span>{label}</span>
        <b>{number(value)}%</b>
      </div>
      <div className="meter-rail">
        <i style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
      </div>
    </div>
  );
}
export function Ring({ value, label }: { value: number; label: string }) {
  return (
    <div
      className="ring"
      style={{
        background: `conic-gradient(#ff683b ${Math.min(100, Math.max(0, value))}%, #303030 0)`,
      }}
    >
      <div>
        <strong>
          {Math.round(value)}
          <small>%</small>
        </strong>
        <span>{label}</span>
      </div>
    </div>
  );
}
export function Dialog({
  title,
  children,
  onClose,
  wide = false,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current!;
    const previous = document.activeElement;
    d.showModal();
    const old = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      d.close();
      document.body.style.overflow = old;
      queueMicrotask(() => {
        if (previous instanceof HTMLElement && previous.isConnected)
          previous.focus({ preventScroll: true });
      });
    };
  }, []);
  return (
    <dialog
      className={`dialog ${wide ? "wide" : ""}`}
      ref={ref}
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      aria-label={title}
    >
      <div className="dialog-content">
        <div className="dialog-heading">
          <div>
            <span className="eyebrow">MYSOL CENTRAL · FICTIONAL SAMPLE</span>
            <h2>{title}</h2>
          </div>
          <button
            className="icon-button"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}
export function download(
  name: string,
  text: string,
  mime = "text/csv;charset=utf-8",
) {
  const url = URL.createObjectURL(new Blob([text], { type: mime }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function csv(rows: (string | number)[][]) {
  return (
    "\uFEFF" +
    rows
      .map((row) =>
        row
          .map((value) => {
            const text = String(value);
            return (
              '"' +
              (/^[=+\-@\t\r]/.test(text) ? "'" : "") +
              text.replaceAll('"', '""') +
              '"'
            );
          })
          .join(","),
      )
      .join("\r\n")
  );
}
export type TableRow = {
  id: string;
  cells: ReactNode[];
  values: (string | number)[];
  search?: string;
  status?: string;
};
function subscribePrint(callback: () => void) {
  const media = window.matchMedia("print");
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
}
export function DataTable({
  title,
  headers,
  rows,
  onOpen,
  create,
  initialSearch = "",
}: {
  title: string;
  headers: string[];
  rows: TableRow[];
  onOpen?: (id: string) => void;
  create?: ReactNode;
  initialSearch?: string;
}) {
  const [query, setQuery] = useState(initialSearch);
  const [status, setStatus] = useState("All");
  const [sort, setSort] = useState(0);
  const [ascending, setAscending] = useState(true);
  const [page, setPage] = useState(0);
  const printing = useSyncExternalStore(
    subscribePrint,
    () => window.matchMedia("print").matches,
    () => false,
  );
  const visible = rows
    .filter(
      (r) =>
        (status === "All" || r.status === status) &&
        `${r.id} ${r.values.join(" ")} ${r.search || ""}`
          .toLowerCase()
          .includes(query.toLowerCase()),
    )
    .sort((a, b) => {
      const x = a.values[sort],
        y = b.values[sort];
      return (
        (typeof x === "number" && typeof y === "number"
          ? x - y
          : String(x).localeCompare(String(y))) * (ascending ? 1 : -1)
      );
    });
  const pages = Math.max(1, Math.ceil(visible.length / 10));
  const current = Math.min(page, pages - 1);
  return (
    <Panel
      title={title}
      eyebrow={`${rows.length} RECORDS · LOCAL DEMO`}
      action={create}
    >
      <div className="table-toolbar">
        <label className="search-input">
          <Search size={17} />
          <input
            aria-label={`Search ${title}`}
            value={query}
            placeholder="Search records…"
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(0);
            }}
          />
        </label>
        {rows.some((r) => r.status) && (
          <select
            aria-label={`Filter ${title} status`}
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(0);
            }}
          >
            <option value="All">All statuses</option>
            {[...new Set(rows.map((r) => r.status).filter(Boolean))].map(
              (s) => (
                <option key={s}>{s}</option>
              ),
            )}
          </select>
        )}
        <Button
          onClick={() =>
            download(
              `mysol-${title.toLowerCase().replaceAll(" ", "-")}.csv`,
              csv([headers, ...visible.map((r) => r.values)]),
            )
          }
        >
          <Download size={15} /> Export
        </Button>
      </div>
      <div
        className="table-scroll"
        tabIndex={0}
        role="region"
        aria-label={`${title} table`}
      >
        <table>
          <thead>
            <tr>
              {headers.map((h, i) => (
                <th
                  key={h}
                  aria-sort={
                    sort === i
                      ? ascending
                        ? "ascending"
                        : "descending"
                      : "none"
                  }
                >
                  <button
                    onClick={() => {
                      setSort(i);
                      setAscending(sort === i ? !ascending : true);
                    }}
                  >
                    {h}
                    <span>{sort === i ? (ascending ? " ↑" : " ↓") : " ↕"}</span>
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(printing
              ? visible
              : visible.slice(current * 10, current * 10 + 10)
            ).map((row) => (
              <tr key={row.id}>
                {row.cells.map((cell, i) => (
                  <td key={i}>
                    {i === 0 && onOpen ? (
                      <button
                        className="record-link"
                        onClick={() => onOpen(row.id)}
                      >
                        {cell}
                      </button>
                    ) : (
                      cell
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {!visible.length && (
          <div className="empty">
            <Search size={26} />
            <b>No matching records</b>
            <span>Try a different search, status or site filter.</span>
            <Button
              onClick={() => {
                setQuery("");
                setStatus("All");
              }}
            >
              Clear search and status
            </Button>
          </div>
        )}
      </div>
      <div className="pagination">
        <span>
          {visible.length
            ? `${current * 10 + 1}–${Math.min((current + 1) * 10, visible.length)}`
            : "0"}{" "}
          of {visible.length} records
        </span>
        <div>
          <button
            className="icon-button"
            aria-label={`Previous ${title} page`}
            disabled={!current}
            onClick={() => setPage(current - 1)}
          >
            <ChevronLeft size={18} />
          </button>
          <span>
            {current + 1} / {pages}
          </span>
          <button
            className="icon-button"
            aria-label={`Next ${title} page`}
            disabled={current + 1 >= pages}
            onClick={() => setPage(current + 1)}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </Panel>
  );
}
export function SiteMap({
  sites,
  selected,
  onSelect,
  totals,
}: {
  sites: Site[];
  selected: string;
  onSelect: (id: string) => void;
  totals: Record<string, number>;
}) {
  return (
    <div className="site-map">
      <div className="map-caption">
        <Mountain size={14} /> ILLUSTRATIVE OPERATIONS MAP{" "}
        <span>SCHEMATIC / NOT GEOSPATIAL</span>
      </div>
      <div className="terrain one" />
      <div className="terrain two" />
      <div className="terrain three" />
      <svg
        className="map-roads"
        viewBox="0 0 1000 500"
        preserveAspectRatio="none"
      >
        <path
          d="M-20 380Q200 180 400 290T1050 210M200-20Q300 100 600 300T800 600"
          stroke="#c5b48a"
          strokeWidth="12"
          opacity=".3"
          fill="none"
        />
        <path
          d="M0 100Q300 150 500 90T1000 100"
          stroke="#b4c5a5"
          strokeDasharray="10 10"
          strokeWidth="3"
          fill="none"
          opacity=".3"
        />
      </svg>
      {sites.map((site) => (
        <button
          aria-label={`Select ${site.name}`}
          key={site.id}
          className={`map-marker ${site.latitude > 65 ? "edge" : ""} ${selected === site.id ? "selected" : ""}`}
          style={{ left: `${site.latitude}%`, top: `${site.longitude}%` }}
          onClick={() => onSelect(site.id)}
        >
          <i>
            <Mountain size={18} />
          </i>
          <span>
            <b>{site.name}</b>
            <small>{number(totals[site.id] || 0)} t</small>
          </span>
        </button>
      ))}
      <div className="map-bottom">
        <span>
          <i /> Fictional mining sites
        </span>
        <span>South Africa · Sample layout</span>
      </div>
    </div>
  );
}
export function ProductionChart({
  data,
}: {
  data: { name: string; actual: number; target: number }[];
}) {
  return (
    <div
      className="chart"
      role="img"
      aria-label="Production against target. Exact values are available in the site scorecard."
    >
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <BarChart
          data={data}
          barGap={3}
          margin={{ left: 0, right: 12, bottom: 0 }}
        >
          <CartesianGrid stroke="#303030" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fill: "#999999", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
            minTickGap={12}
            tickFormatter={(v) => String(v).split(" ")[0]}
          />
          <YAxis
            tick={{ fill: "#999999", fontSize: 12 }}
            width={52}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${Number(v) / 1000}k`}
          />
          <Tooltip
            contentStyle={{
              background: "#1c1c1c",
              border: "1px solid #444444",
              borderRadius: 8,
              color: "#eff2e9",
            }}
            cursor={{ fill: "#ffffff06" }}
          />
          <Legend />
          <Bar
            isAnimationActive={false}
            dataKey="target"
            name="Target (t)"
            fill="#404040"
            radius={[3, 3, 0, 0]}
          />
          <Bar
            isAnimationActive={false}
            dataKey="actual"
            name="Production (t)"
            fill="#ff683b"
            radius={[3, 3, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
export function TrendChart({
  data,
  label = "Tonnes",
}: {
  data: { date: string; value: number }[];
  label?: string;
}) {
  return (
    <div
      className="chart trend"
      role="img"
      aria-label={`${label} trend from underlying demo records`}
    >
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <AreaChart data={data} margin={{ right: 15, left: 0 }}>
          <defs>
            <linearGradient id="trend-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ff683b" stopOpacity={0.28} />
              <stop offset="100%" stopColor="#ff683b" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#303030" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={(v) => String(v).slice(5)}
            tick={{ fill: "#999999", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            minTickGap={20}
          />
          <YAxis
            domain={
              label === "Engine hours"
                ? ["dataMin - 10", "dataMax + 10"]
                : [0, "auto"]
            }
            tick={{ fill: "#999999", fontSize: 12 }}
            width={55}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              background: "#1c1c1c",
              border: "1px solid #444444",
              borderRadius: 8,
            }}
          />
          <Area
            isAnimationActive={false}
            name={label}
            type="monotone"
            dataKey="value"
            stroke="#ff683b"
            strokeWidth={2}
            fill="url(#trend-fill)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
