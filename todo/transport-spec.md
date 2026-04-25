# Transport Feature Spec (Step-by-Step Build)

## Goal
Change the current transport options to the following

---

# ✅ PHASE 1 — Data Model (Start Here)

## Tasks
- [ ] Update Transport model/table and add transport with fields:
    - id
    - from_location
    - to_location
    - departure_date + departure_time
    - arrival_date + departure_time
    - transport_type (flight, train, car, ferry, bus)
    - provider
    - route_code (optional)
    - status (planned, booked)
    - cost
    - booking_reference
    - is_multi_leg (boolean, default false)
    - notes

## Validation
- [ ] Can create a Journey record
- [ ] Can read/display a Journey

---

# ✅ PHASE 2 — Basic Dialog (Single Journey Only)

## Tasks
- [ ] Build "Add Journey" modal/dialog

## Validation
- [ ] Transition current trasnport to new mode
- [ ] Data persists correctly
- [ ] Form is clean and fast (no clutter)

🚫 Do NOT build multi-leg yet

---

# ✅ PHASE 3 — Itinerary Display (Basic)

## Tasks
- [ ] Render list of journeys sorted by date + departure_time
- [ ] Display:
    - From → To
    - Departure → Arrival
    - Transport Type + Provider

## Validation
- [ ] Journeys appear in correct order
- [ ] Output is readable as a simple itinerary

---

# ✅ PHASE 4 — Multi-leg Data Support

## Tasks
- [ ] Create JourneyLeg table:
    - id
    - journey_id
    - leg_order
    - from_location
    - to_location
    - departure_time
    - arrival_time
    - provider
    - route_code

- [ ] Add relationship: Journey → JourneyLeg[]

## Validation
- [ ] Can attach multiple legs to a journey
- [ ] leg_order is preserved

🚫 Still no UI for legs yet

---

# ✅ PHASE 5 — Multi-leg UI

## Tasks
- [ ] Add checkbox:
  "This journey has stopovers"

- [ ] When checked:
    - Show dynamic list of legs
    - Each leg has:
        - From / To
        - Departure / Arrival
        - Provider
        - Route code

- [ ] Add:
    - "Add Leg" button
    - Remove leg option

## Validation
- [ ] User can add/remove legs
- [ ] Legs save correctly to DB
- [ ] First leg starts at journey.from_location
- [ ] Last leg ends at journey.to_location

---

# ✅ PHASE 6 — Itinerary (Multi-leg Display)

## Tasks
- [ ] If single journey:
    - Show simple A → B

- [ ] If multi-leg:
    - Collapsed view:
      "A → B (via X)"

    - Expanded view:
      Show each leg with times

## Validation
- [ ] Multi-leg journeys render correctly
- [ ] Layout is easy to read

---

# ✅ PHASE 7 — UX Improvements (Optional)

## Tasks
- [ ] Auto-fill:
    - First leg "from" = journey origin
    - Last leg "to" = journey destination

- [ ] Optional:
    - Calculate layover durations
    - Auto-calc duration from times
- [ ] Incorporate into the full itinerary

---

# 🚫 Rules (Always Enforce)

---

# 🎯 Definition of Done

- [ ] User can create journeys easily
- [ ] Multi-leg journeys supported
- [ ] Itinerary view is clean and readable
- [ ] No hacks (no fake rows, no messy text parsing)