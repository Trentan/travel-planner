# Accommodation Feature Spec (Step-by-Step)

## Goal
Manage accommodation as date-range stays (not per-day rows)

---

# ✅ PHASE 1 — Data Model

## Tasks
- [ ] Create Stay table:
  - id
  - city
  - property_name
  - check_in_date
  - check_out_date
  - status (planned, booked)
  - provider
  - booking_reference
  - total_cost
  - cost_per_night (optional)
  - notes

## Validation
- [ ] Can create/read a stay record
- [ ] No UI yet

---

# ✅ PHASE 2 — Dialog UI

## Tasks
- [ ] Build "Add Stay" dialog

Fields:
- City
- Accommodation Name
- Check-in Date
- Check-out Date
- Status
- Provider
- Booking Reference
- Total Cost
- Notes

## UX Rules
- [ ] Auto-calc nights
- [ ] Keep form minimal
- [ ] Fast to complete

## Validation
- [ ] User can create stay via UI
- [ ] Dates save correctly

---

# ✅ PHASE 3 — Display

## Tasks
- [ ] Show stays sorted by check-in date
- [ ] Display:
  - City
  - Property
  - Date range
  - Nights
  - Status

## Validation
- [ ] Reads clean like an itinerary

---

# ✅ PHASE 4 — Itinerary Integration

## Tasks
- [ ] On each day:
  - Show check-in on start date
  - Show stay for in-between days
  - Show check-out on final day

## Validation
- [ ] Matches real travel flow

---

# 🚫 Rules

- [ ] 1 row = 1 stay (not per day)
- [ ] Do NOT create "transit" rows unless needed
- [ ] Do NOT duplicate dates

---

# 🎯 Done When

- [ ] Stays are easy to enter
- [ ] No duplicate rows
- [ ] Itinerary reads cleanly