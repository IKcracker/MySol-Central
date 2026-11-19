"use client";

import Image from "next/image";
import {
  Activity,
  ArrowUpRight,
  Factory,
  Fuel,
  Gauge,
  LayoutGrid,
  Truck,
  Wrench,
} from "lucide-react";
import type { ReactNode } from "react";
import { number, type Asset, type Site } from "./demo-data";
import { Button, SiteMap } from "./demo-ui";

export function CommandStage({
  sites,
  assets,
  selectedSite,
  totals,
  cards,
  onSelect,
  onSite,
  onAsset,
  onNavigate,
}: {
  sites: Site[];
  assets: Asset[];
  selectedSite: string;
  totals: Record<string, number>;
  cards: ReactNode;
  onSelect: (id: string) => void;
  onSite: (id: string) => void;
  onAsset: (id: string) => void;
  onNavigate: (
    page: "Mining operations" | "Fleet & equipment" | "Maintenance",
  ) => void;
}) {
  const selected = sites.find((s) => s.id === selectedSite) || sites[0];
  const machine =
    assets.find(
      (a) => a.siteId === selected?.id && a.status === "Maintenance",
    ) || assets.find((a) => a.siteId === selected?.id);
  // These percentages arrange sample markers on an illustrative photograph, not a geographic map.
  const layout = sites.map((site, i) => ({
    ...site,
    latitude: [17, 45, 79, 27, 55, 82, 18, 61][i % 8],
    longitude: [45, 41, 46, 59, 61, 62, 69, 71][i % 8],
  }));
  return (
    <section
      className="command-stage"
      aria-label="Illustrative operations command map"
    >
      <SiteMap
        sites={layout}
        selected={selected?.id || ""}
        onSelect={onSelect}
        totals={totals}
      />
      <div className="command-map-header">
        <div className="command-tabs">
          <span className="current">
            <LayoutGrid size={14} /> Overview
          </span>
          <button onClick={() => onNavigate("Mining operations")}>
            <Factory size={14} /> Production
          </button>
          <button onClick={() => onNavigate("Fleet & equipment")}>
            <Truck size={14} /> Fleet operations
          </button>
          <button onClick={() => onNavigate("Maintenance")}>
            <Wrench size={14} /> Maintenance
          </button>
        </div>
        <span className="map-system-label">
          <Activity size={13} /> DEMONSTRATION NETWORK
        </span>
      </div>
      <h2 className="command-map-title">Your operations, at a glance</h2>
      {machine && (
        <div className="machine-overlay">
          <div className="machine-overlay-image">
            <Image
              src={
                machine.type === "Excavator"
                  ? "/excavator.jpg"
                  : "/quarry-truck.jpg"
              }
              alt="Illustrative mining equipment, not the registered asset"
              fill
              sizes="160px"
            />
            <small>{machine.id}</small>
          </div>
          <div className="machine-condition">
            <span
              className={`condition-label ${machine.status === "Maintenance" || machine.health < 75 ? "attention" : ""}`}
            >
              {machine.status === "Maintenance" || machine.health < 75
                ? "Needs inspection"
                : "Demo condition"}
            </span>
            <strong>
              {machine.health}
              <span>%</span>
            </strong>
            <small>Overall condition · simulated</small>
          </div>
          <div className="machine-overlay-readings">
            <div>
              <Fuel size={20} />
              <span>
                Fuel reserve<b>{machine.fuel}%</b>
              </span>
            </div>
            <div>
              <Gauge size={20} />
              <span>
                Engine hours<b>{number(machine.hours)} h</b>
              </span>
            </div>
            <button onClick={() => onAsset(machine.id)}>
              Equipment profile <ArrowUpRight size={15} />
            </button>
          </div>
        </div>
      )}
      {selected && (
        <div className="map-site-summary">
          <span className="map-selection-dot" />
          <div>
            <small>SELECTED OPERATION</small>
            <b>{selected.name}</b>
            <span>
              {selected.region} · {number(totals[selected.id] || 0)} t
            </span>
          </div>
          <Button onClick={() => onSite(selected.id)}>Site overview</Button>
        </div>
      )}
      <div className="command-stat-dock">{cards}</div>
    </section>
  );
}
