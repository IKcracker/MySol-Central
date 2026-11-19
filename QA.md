# MySol Central — executed QA

Verified on 19 November 2026 against the final user-supplied Oreon theme direction.

## Results

| Check | Result |
| --- | --- |
| npm ci | Passed after stopping the pre-existing server that locked native dependencies; a clean install of the final lockfile was also verified in an isolated temporary directory |
| npm run lint | Passed |
| npm run typecheck / tsc --noEmit | Passed |
| npm run build | Passed, statically prerendered App Router entry |
| npm test | 13 tests passed |
| Screenshot capture | Passed; no browser errors reported |
| Desktop, tablet, mobile | Checked at 1440×1000, 834×1112 and 390×844 |

Runtime: locally installed Node 26.13.1; installed Google Chrome through Playwright. GitHub Actions uses Node 24 and Chromium. CI results are separate from these local results.

## Scenarios verified

1. **Production:** create shift production; find its logbook record; verify dashboard/report totals; refresh and verify persistence.
2. **Breakdown:** select operational equipment; create an assigned work order; confirm Maintenance status and reduced fleet availability.
3. **Resolution:** report two faults on one machine; resolving one keeps it unavailable; resolving both restores operation. Manual status overrides are rejected while faults remain. Reopening a fault takes equipment out of service again.
4. **CRM:** create customer and linked agreement; verify profile relationships; edit status, end date and renewal review.
5. **Workforce:** create operator with site/shift; change duty status and verify counts; transfer equipment and assign the operator; moving the worker clears incompatible assignments.
6. **Persistence/reset:** reload retains records; reset exactly restores the deterministic seed.
7. **Reporting:** site/date filters, table pagination, global search, CSV download and print layout. Printing renders all filtered rows across pages, not only the visible ten-row page.
8. **Responsive/accessibility:** dashboard/forms/tables at three widths, no document horizontal overflow, mobile menu, bounded dialogs, Escape dismissal and restored keyboard focus.
9. **Recovery:** invalid saved data shows a recovery notice, malformed imports are rejected, JSON backup round-trip works, and storage failures do not falsely save records.
10. **Integrity:** seeded volumes, stable relationships, deterministic selectors, invalid amounts/dates, mandatory resolution notes, CSV formula escaping and previous-version migration.
11. **Registration/deletion:** create a site and machine; verify site assignment; prevent deleting a site with linked equipment.
12. **Guided demo:** all eight steps navigate and complete.

## Visual review

Screenshots in `qa/screenshots/` were captured and reviewed. The final theme uses black/charcoal surfaces, orange accents, yellow inspection highlights, a locally bundled illustrative mine photograph, floating equipment condition panel and a bottom KPI dock. Mobile rearranges the dock and condition panel into usable stacked sections.

Representative captures:

- `dashboard-desktop.png`, `dashboard-tablet.png`, `dashboard-mobile.png`
- `fleet-desktop.png`
- `test-form-desktop.png`, `test-form-tablet.png`, `test-form-mobile.png`
- `test-table-desktop.png`, `test-table-tablet.png`, `test-table-mobile.png`

## Practical limits

- Browser-local fictional demo; no shared database, authentication or production telemetry.
- Availability, health, workforce and commercial figures are current snapshots. Production and maintenance activity have date filters.
- Current targets are multiplied by calendar days; historical target revisions and roster calendars are not modelled.
- Aerial imagery and equipment photos are illustrative and do not represent the fictional site/asset IDs.
- Local Chrome checks do not constitute a full cross-browser or assistive-technology certification.
- Public preview status is reported only after deployment verification; no merge is performed.

## Clean-run corrections

The first GitHub Actions run identified that `LayoutProps` needs Next.js-generated route types on a fresh checkout. `npm run typecheck` now runs `next typegen` before TypeScript. Responsive QA also explicitly checks that every pair of command-map labels stays separate at all three viewports; tablet markers use two columns.
