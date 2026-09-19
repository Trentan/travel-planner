# Feature Gap Analysis: Travel Planner PWA vs. TripMapper.co (Issue #164)

This document benchmarks the **Travel Planner PWA** against **TripMapper.co**, identifying functional gaps, UX differences, architectural trade-offs, and high-impact roadmap recommendations that align with our offline-first PWA philosophy.

---

## 📊 High-Level Comparison Matrix

| Capability | Travel Planner PWA | TripMapper.co | Architectural Assessment & Alignment |
|---|---|---|---|
| **Platform Architecture** | Client-side PWA (IndexedDB / LocalStorage), Android APK, offline-first | Cloud SaaS web & mobile app (requires account & internet for initial loads) | Travel Planner wins on privacy, offline reliability, and zero hosting costs. |
| **Pricing & Monetization** | 100% Free & Open-Source | Freemium / Paid Subscription (£2.99–£4.99/mo) | Complete user ownership without recurring subscription barriers. |
| **Itinerary Views** | Dual-pane split view (1440px desktop), day pagers, grouped/timeline views, Leaflet interactive map | Card feeds, Kanban boards, interactive map, calendar view | Travel Planner's split-pane is highly ergonomic; adding an optional card gallery view for activities would close the visual gap. |
| **Activity Cover Photos** | Attachment pills / lightbox (Issue #89) | Rich image cover cards per activity | TripMapper is more image-centric. Adding photo thumbnails to activity cards enhances visual appeal. |
| **Trip Tasks & Prep** | Packing checklist, context-aware smart reminders (passports, check-outs) | Dedicated Tasks board with due dates, assignees, and alerts | Gap: Travel Planner has packing & reminders, but lacks arbitrary pre-trip dated tasks (e.g. "Renew passport by May 1st"). |
| **Multi-Currency Budgeting** | Multi-currency tags, localized cost rollups, day totals | Live currency conversion with European Central Bank (ECB) exchange rates | Gap: Travel Planner records original currency costs; adding offline-cached ECB rates for unified total calculation would match TripMapper. |
| **Location & Place Details** | OpenStreetMap / Leaflet, city coordinates lookup, Open-Meteo weather forecasts, Mappr import | Google Places API integration (auto-fetches hours, phone, address, rating) | Gap: Auto-fetching Google Place IDs or Nominatim details without compromising offline capability. |
| **Export & Sharing** | Formatted `@media print` A4 stylesheet, Gzip compressed hash URLs, JSON export/import, Google Drive sync | PDF export generator, invitation links with user roles | Travel Planner's print engine is fast and local; hash links enable instant serverless sharing. |
| **Curated Inspiration** | AI Trip Wizard prompt generator, Mappr map import engine (Issue #163) | Searchable catalog of community itineraries | Mappr import bridges this gap by letting users bring in rich external community maps. |

---

## 🔍 Detailed Feature Gap Analysis

### 1. Visual Card & Photo Experience
- **TripMapper Strength**: Each event can have an eye-catching cover photo and thumbnail in the daily feed, creating a mood-board aesthetic.
- **Travel Planner Status**: Uses a high-density, text-and-emoji timeline optimized for fast scanning and battery/bandwidth efficiency while traveling.
- **Recommended Roadmap Item**:
  - Extend the existing `attachments.js` image lightbox to allow marking one attachment as the **cover image**, rendering a subtle thumbnail on desktop split cards and mobile day slides.

### 2. Multi-Currency Live Conversion
- **TripMapper Strength**: Converts expenses in EUR, USD, THB, and GBP into a primary home currency using real-time ECB exchange rates.
- **Travel Planner Status**: Records costs in whatever currency symbol or code was entered (e.g., `€25`, `$100`, `฿450`), calculating totals within legs but without cross-currency normalization.
- **Recommended Roadmap Item**:
  - Integrate a lightweight, offline-cached exchange rate module (e.g., `https://open.er-api.com/v6/latest/USD` or ECB open data) with a 24-hour cache TTL, allowing users to choose a "Home Currency" for unified budget rollups.

### 3. Pre-Trip Tasks with Due Dates
- **TripMapper Strength**: Users can track tasks before departure (e.g., "Book museum tickets 30 days ahead", "Purchase eSIM").
- **Travel Planner Status**: Features a robust Packing tab with category filtering and smart timeline reminders triggered on transit days, but no standalone task checklist with calendar dates.
- **Recommended Roadmap Item**:
  - Add a "Tasks" section to the Packing & Readiness tab supporting dated milestones (e.g. 30 days before departure, 7 days before, 1 day before).

### 4. Direct PDF Generation
- **TripMapper Strength**: Downloadable standalone PDF documents formatted for printing or offline storage.
- **Travel Planner Status**: Milestone 6 added a distraction-free monochrome `@media print` stylesheet that directly formats the entire itinerary for A4 portrait printing (via browser "Print to PDF").
- **Assessment**: The `@media print` solution already achieves identical PDF output via native browser print without requiring bulky client-side PDF generation libraries (like `jspdf` or `pdfmake`) that bloat bundle size.

---

## 🎯 Prioritized Action Items for Travel Planner

1. **High Priority (Quick-Win)**: Multi-Currency normalization using open-source exchange rate caches in the Budget tab.
2. **Medium Priority**: Cover photo thumbnail support for activities (building on `attachments.js`).
3. **Medium Priority**: Pre-trip dated task checklists within the Packing & Readiness module (connecting with Issue #96 International Readiness).
4. **Completed via Issue #163**: External curated map import from `mappr.com` to rapidly populate localized attractions and spots.
