# Stippl (stippl.io) vs. Travel Planner PWA — Feature & Architecture Comparison

*Prepared for Issue [#667](https://github.com/Trentan/travel-planner/issues/667) — 2026-11-28*

## Executive Summary
**Stippl** (`stippl.io`) is a polished freemium iOS/Android/Web trip planner focused on visual multi-city route mapping, group expense splitting, travel journaling/photobooks, and a built-in AI itinerary generator (Pro).

**Travel Planner PWA** is an offline-first, privacy-respecting, zero-subscription PWA + Capacitor mobile app backed by portable single-JSON files (and optional Google Drive sync), with deep booking confirmation parsing, multi-leg transport/stay tracking, weather/maps, and full user data ownership.

---

## Side-by-Side Feature Matrix

| Capability | Stippl (`stippl.io`) | Travel Planner PWA | Advantage / Gap |
|---|---|---|---|
| **Data Ownership & Offline** | Cloud-first; enhanced offline & PDF export gated behind Stippl Pro (~$24.99/yr) | 100% offline-first PWA + portable JSON + local storage + Capacitor iOS/Android | **Travel Planner** wins on privacy, offline reliability, & zero lock-in |
| **Multi-City Route Map** | Interactive visual route planner; reordering a stop dynamically shifts connecting transit | Map view with trip route, city markers, and `cityId` navigation | **Tie / Slight Stippl edge** on drag-to-reorder transit auto-recalculation |
| **Day-by-Day Itinerary** | Hour-by-hour/day-by-day drag-and-drop; some users report friction fine-tuning times | City-grouped day-by-day itinerary + suggested activities + AI Builder prompt | **Travel Planner** is faster for structured multi-week trips |
| **Booking Intake** | Manual entry or Pro tools | Built-in `Import Booking` parser for `.txt`, `.eml`, and `.pdf` confirmations with review-before-merge | **Travel Planner** wins significantly |
| **Budget & Expense Splitting** | Built-in category tracker + **group/family bill splitting** | Budget summaries with consistent currency formatting | **Gap in Travel Planner**: No multi-person bill splitting ("who paid / who owes") |
| **AI Trip Generation** | Native in-app AI planner from text prompt (limited on Free, unlimited on Pro) | `AI Builder` generates structured prompt for external AI (Gemini/Claude/ChatGPT) -> JSON import | **Gap in Travel Planner**: Extra copy/paste hop vs. 1-click in-app generation |
| **Post-Trip Memories / Journal** | Built-in Travel Journal, photo timeline, auto-generated **Reels & Photobooks** | Focused on planning & execution; no dedicated journal/photobook layer | **Stippl** wins for post-trip sharing/memories |
| **Packing Lists & Tasks** | Basic packing checklists + eSIM marketplace upsells | Packing checklists grouped by **bag** and **pre-trip task** | **Travel Planner** is more practical for actual packing |
| **Pricing** | Freemium ($3.99–$4.99/mo or ~$24.99/yr Pro) | Free, open, self-hosted / local | **Travel Planner** |

---

## High-ROI Ideas Worth Borrowing from Stippl
1. **Dynamic Stop Reordering**: When shifting a city's dates in the itinerary, offer a 1-click prompt to shift linked stays and transit legs by `+N/-N` days.
2. **Lightweight Trip Journal / Memory Notes**: Add an optional per-day `"Highlights / Notes"` field so the same JSON file serves as both itinerary and post-trip log without bloat.
3. **Group / Couple Expense Split Tagging**: Add an optional `paidBy` / `splitWith` field on budget items for shared trips.
4. **Calendar / ICS Export**: Stippl Pro gates calendar sync—adding a client-side `.ics` export for flights & hotel check-ins is a zero-backend win.

## What Travel Planner Should NOT Copy
- **SaaS/Cloud Lock-in & Upsells**: Keep portable JSON + offline-first as the core differentiator; avoid eSIM/affiliate clutter.
- **Heavy Video Reels / Social Feed**: Out of scope for a fast, utility-first travel planner.
