# MySol Central — interactive mining operations sales demo

An original, Oreon-inspired mining operations concept built with Next.js 16, React 19 and Tailwind 4. The prototype demonstrates how mine sites, production records, equipment, maintenance, customers, contracts and workforce data can work together in one command centre.

> **Sales concept only.** This repository is not affiliated with MySol Holdings & Logistics. Every site name, map pin, machine record, personnel name, client and performance figure is fictional. No live database, geospatial imagery, machine telematics or MySol systems are connected.

## Quick start

```bash
npm ci
npm run dev
```

Open http://localhost:3000.

## Presentation walkthrough

1. **Command centre:** Show the dark industrial dashboard, interactive schematic mine map, fleet health status, production chart and maintenance alerts.
2. **Mine operations:** Select a site. Click **Log production**, choose a shift and enter tonnes/trips. New entries appear in the logbook and change the production totals.
3. **Fleet intelligence:** Select a machine from the equipment register to inspect sample condition readings. Use **Report fault** to register a breakdown.
4. **Maintenance:** The fault appears as a new work order and the machine is moved into maintenance status. Change the work order to **In progress** and then **Resolved** to restore availability, provided no other open fault is linked to the asset.
5. **Clients & contracts:** Create a customer, then create a contract linked to the customer and an existing site.
6. **Workforce:** Create a workforce record and change the person's duty status and shift.
7. **Analytics:** Review linked KPIs and export site performance and operational logs as CSV.
8. **Reset demo:** Reset all records to the original sample dataset when preparing for another presentation.

## Demo data behaviour

- Data is stored in the browser's `localStorage` and survives refreshes in the same browser.
- Use **Reset demo** to restore the original sample dataset.
- Data is not shared between browsers, devices or users. There is no authentication, API or server-side persistence.
- The operational map is a **schematic visual**, not an actual geographic map or satellite image.
- Demo date: 2026-11-19. Choose another date from Analytics to see that day's available records.

## Build verification

```bash
npm run lint
npm run build
```

The repository also includes a GitHub Actions workflow to execute those checks. Complete browser interaction and visual QA before presenting to a client.

## Future production requirements

This concept needs discovery workshops to establish ownership and workflow requirements. Production implementation would require authenticated role-based access, a relational database, permissions, audit trails, validation, resilient integration layers, secure file storage, geospatial and telemetry providers, backups, performance monitoring, tests and an agreed data migration plan.

## Design notes

Inspired by the layout and information density of the Oreon mining operations interface on Dribbble. The implementation uses original UI code, generated CSS schematic terrain, and no copied proprietary design assets.
