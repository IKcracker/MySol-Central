# MySol Central

An interactive mining operations and CRM sales demonstration for management presentations. Built with Next.js 16.4.6 App Router, React 19, TypeScript, Tailwind 4, Lucide and Recharts.

**All sites, coordinates, customers, employees, agreements and operational figures are fictional.** This proposal concept is not affiliated with MySol Holdings & Logistics. No MySol systems, machine sensors or external databases are connected.

## Run locally

Use Node.js 24 or a newer version supported by Next.js. No environment variables, database credentials or login are needed.

```sh
npm ci
npm run dev
```

Open http://localhost:3000. On Windows, if PowerShell blocks `npm.ps1`, use `npm.cmd`. Ensure your Node version manager has an active runtime.

## Modules

| Workspace           | Working functionality                                                                                                                                            |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Executive dashboard | Record-derived KPIs, period/site filters, interactive illustrative map, site drilldowns, readiness, production charts and priority incidents                     |
| Mining operations   | Shift production create/edit/delete, tonnes, trips, notes, filtered logbook and CSV                                                                              |
| Sites               | Register/edit sites, status and daily targets; linked equipment, workforce, production, activity, incidents and contracts                                        |
| Fleet & equipment   | Register/edit assets, unique IDs, manufacturer/model/category, transfers, operator assignments, service dates, engine-hour history and demo condition indicators |
| Maintenance         | Breakdown/scheduled work orders, priorities, technicians, fault notes, status, required resolution notes, completion history and reopening                       |
| Customers           | Create/edit accounts, contacts and account status, search, linked contracts and delivery sites                                                                   |
| Contracts           | Create/edit agreements, customer/site links, values, lifecycle status, start/end dates and renewal reviews                                                       |
| Workforce           | Create/edit employees, role, site, shift, contact and duty status; operator/technician relationships                                                             |
| Reports & analytics | Production/site comparisons, trends, current fleet/health/workforce/contract reports, period maintenance activity, filtered CSV and print layout                 |
| Settings            | Sample reset with confirmation, validated JSON backup import/export, recent activity and guided presentation                                                     |

Global search, notifications, keyboard-operable profiles and dialogs, sorting, status filters, table pagination and mobile navigation work throughout the application. Deletion protects linked records.

## Present the connected story

Use **Guided demo** or **Start guided demo** for the eight-step walkthrough.

1. Begin at the executive dashboard. Pick a site and review its figures.
2. In **Mining operations**, choose **Log production**, enter tonnes and trips, and save. Find the entry in the logbook; the executive and reporting totals now include it.
3. Open an operational machine in **Fleet & equipment**. Review its profile, assignment, service history and explicitly simulated telemetry.
4. Choose **Report breakdown**, enter a fault and technician, and save. A linked work order appears and the machine moves to Maintenance. Availability and executive alerts update.
5. Open the work order in **Maintenance**, choose **Edit record**, change it to Resolved and enter resolution notes. The machine returns to Operational only when no other unresolved breakdown remains. Reopening a breakdown takes it out of service again. Scheduled work does not automatically stop a machine.
6. Add a customer, open the customer profile and choose **Create linked contract**. Manage agreement status, dates and renewal review under Contracts.
7. Create an employee and assign site, role, shift and duty status. Operators must belong to their equipment's site. Moving an assigned operator to another site clears their previous incompatible equipment assignments.
8. Review reports with date/site filters, export CSV or print. Reset in Settings for another presentation.

## Data architecture

One typed `Store` relates sites, equipment, employees, customers, contracts, production, work orders and activity through stable IDs.

- `app/demo-data.ts`: deterministic seeds, runtime integrity validation, KPI selectors and maintenance state transitions.
- `app/demo-forms.ts`: shared form definitions, validation and cross-module mutations.
- `app/demo-store.ts`: hydration-safe external store, local persistence and cross-tab storage synchronization.
- `app/demo-migration.ts`: preserves records from the previous browser-local demo schema.
- `app/demo-ui.tsx`: accessible dialogs, searchable/sortable tables, exports, map and charts.
- `app/demo-app.tsx`: connected presentation workspace and profiles; the App Router page/layout stay server components.

Fresh samples contain **8 sites, 48 machines, 72 employees, 12 customers, 20 contracts, 40 work orders and 512 shift records over 32 days**, ending on **19 November 2026**. Values use South African formats and ZAR.

Data saves to this browser's `localStorage` at `mysol-central-demo-v3`, and survives refresh. The previous `mysol-central-demo-v2` dataset is migrated automatically when present, with its original key retained. Migrated workspaces keep their previous record counts; Reset restores the expanded seed dataset.

This is **not a shared enterprise database**. Devices, browser profiles and deployment origins have separate data. There is no authentication, authorization, server API, durable shared audit log or production integration. Storage failures are shown and do not falsely report a successful save. Invalid saved data falls back to sample records with a recovery notice. Imports validate field types, record IDs and relationships.

## Metric definitions and sample limitations

- Production is summed from shift records for the selected inclusive date range and site.
- Period targets use **current site daily targets multiplied by calendar days**; paused sites contribute no target. Historical target revisions and working calendars are not modelled.
- Fleet availability includes Operational and Idle equipment; operational utilisation counts Operational equipment only.
- Fleet, equipment health, workforce and commercial values are **current snapshots**, not historical telemetry. Reporting labels distinguish snapshots from period activity.
- The 14-day dashboard trend ends on the selected date; wider selected periods show up to 366 days. The scorecard and exported totals include the entire selected period.
- Work-order site IDs retain the incident location when an asset transfers.
- Work orders require resolution notes before completion. All unresolved breakdowns must be resolved before a machine returns to service.
- Map positions are illustrative layout percentages, not latitude/longitude, geospatial imagery or live tracking. Equipment photographs illustrate the industry and do not depict registered assets.
- Personnel and customer contact details are sample values using reserved `.invalid` email domains and fictitious phone numbers.
- Reports and record actions run entirely in the browser. Reset is local to this browser/origin.

## Reset and backup

Open **Settings → Reset Demo Data → Restore sample data**. This replaces all changes in this browser with the original seed. Export a JSON backup first if needed. Import only version 3 backups produced by this app. Invalid or inconsistent imports are rejected. CSV exports include filtered rows across all pages and protect spreadsheet formula-like text.

## Verification

```sh
npm run lint
npm run typecheck
npm test
npm run build
```

Browser tests use installed Chrome on Windows. On Linux/CI, install Chromium with `npx playwright install --with-deps chromium`. Override the browser via `PLAYWRIGHT_CHANNEL`, and target an existing server with `BASE_URL`. Otherwise Playwright starts/reuses the local dev server.

`npm run screenshots` captures representative screens against `BASE_URL` or localhost. See `QA.md` for executed results and `qa/screenshots/` for visual evidence. GitHub Actions installs the lockfile, checks lint/types/build and runs browser tests, retaining reports as artifacts.

## Production build and deployment

```sh
npm ci
npm run build
npm start
```

Deploy as a Next.js project on Vercel with the repository root, `npm ci`, `npm run build` and no environment variables. Keep previews on the feature branch until validation passes. No secrets are required or committed. Hosted data remains local to that deployment's browser origin.

Before deploying a production enterprise system, agree requirements for role-based access, a shared relational database, immutable auditing, backups, data retention, integration ownership and telemetry/map providers. Those services are outside this sales demonstration.

## Design and asset credits

Original interface inspired by the industrial direction of [Oreon by Josselyn Espinoza / Meetlabs](https://dribbble.com/shots/26901652-Oreon-Web-App-UI-UX-Design-for-Mining-Ops-AI-SaaS). No proprietary artwork or source code is copied.

Locally bundled illustrative photographs, free to use under the [Pexels license](https://www.pexels.com/license/):

- `public/excavator.jpg`: [Gaspar Zaldo — Yellow Backhoe with Gear-Driven Track](https://www.pexels.com/photo/yellow-backhoe-with-gear-driven-track-8671344/).
- `public/quarry-truck.jpg`: [Daniel Neves Cotta — Heavy Duty Mining Bulldozer in Quarry](https://www.pexels.com/photo/heavy-duty-mining-bulldozer-in-quarry-31543919/).
- `public/mine-aerial.jpg`: [Volker Braun — Aerial View of Industrial Open-Pit Mining Operation](https://www.pexels.com/photo/aerial-view-of-industrial-open-pit-mining-operation-33122148/). Used as a darkened illustrative backdrop, with fictional marker positions.

The final theme follows the user-supplied Oreon screenshot: near-black surfaces, orange accents, yellow inspection states, a photographic map workspace, floating equipment condition panel and bottom KPI dock. The image is visual inspiration; no proprietary source or artwork is included.
