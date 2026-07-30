# Milestone 2 Master Verification & Release Test Plan Template

**Branch**: `milestone2`  
**Test Data**: `backups/2026_June_July_Europe_Thailand.json`  

---

## 📱 / 💻 Viewport Standards
- **Desktop View**: 1440 x 900
- **Mobile View**: 390 x 844

---

## 🖥️ DESKTOP VERIFICATION SUITE (1440 x 900)

### 1. 🚀 Issue #188: Onboarding Wizard & Storage Location Setup (Desktop)
- [ ] **1.1 Factory Reset Boot**: Click *Settings* -> *Factory Reset* (or clear browser site data). Verify page reloads and automatically opens Create New Trip modal (`#trip-start-modal`).
  > **Desktop Notes**: 

- [ ] **1.2 Step 1 Storage Picker**: Verify Step 1 presents choice between *Pick Drive / Local File Location* and *Browser Storage & Auto-Download*.
  > **Desktop Notes**: 

- [ ] **1.3 Step 2 Trip Name**: Enter trip name (e.g. `Japan & Thailand Summer`). Verify name validation works.
  > **Desktop Notes**: 

- [ ] **1.4 Step 3 Departure City & Date**: Enter `Brisbane` and departure date `2026-06-01`.
  > **Desktop Notes**: 

- [ ] **1.5 Step 4 First Destination & Nights**: Enter `Tokyo` (4 nights) and select `Flight`.
  > **Desktop Notes**: 

- [ ] **1.6 Step 5 Additional Stops & Auto Return Date**: Add `Kyoto` (3 nights) and `Nara` (2 nights). Verify return date input (*When do you head home?*) automatically updates to `2026-06-10`.
  > **Desktop Notes**: 

- [ ] **1.7 Step 6 Style & Pacing**: Click `Couple` and `Relaxed`. Verify chips highlight when selected.
  > **Desktop Notes**: 

- [ ] **1.8 Step 7 Interests**: Click `Food & Dining` and `History & Culture`. Verify selection state toggles cleanly.
  > **Desktop Notes**: 

- [ ] **1.9 Step 8 Pre-booked Items**: Click `+ Add pre-booked item`, select `Flight`, pair with `Tokyo`, enter `QF21`. Click *Finish* and verify trip is created with starter activities and saved file.
  > **Desktop Notes**: 

---

### 2. 🌍 Issue #191: Prominent City Management, Rename, Refetch & Airport Codes (Desktop)
- [ ] **2.1 Prominent Desktop Top Bar Button**: Verify *Manage Cities* button is visible in top header navigation bar.
  > **Desktop Notes**: 

- [ ] **2.2 Prominent Itinerary Header Button**: Scroll to Itinerary section header. Verify *Manage Cities* button appears next to *Manage Legs*.
  > **Desktop Notes**: 

- [ ] **2.3 Inline City Rename**: Click inside a city name input field (e.g. rename `Tokyo` to `Tokyo Metropolitan`), press Enter or click away. Verify city name updates across all itinerary days and journey cards.
  > **Desktop Notes**: 

- [ ] **2.4 IATA & ICAO Code Inputs**: Verify each city row has editable monospace inputs for IATA (e.g. `HND` / `NRT`) and ICAO (e.g. `RJTT` / `RJAA`).
  > **Desktop Notes**: 

- [ ] **2.5 Auto Geocoding on Country Dropdown Change**: Change a city's country dropdown (e.g. select `Japan`). Verify coordinates, country flag, and airport codes update automatically.
  > **Desktop Notes**: 

---

### 3. ⚠️ Issue #192: Unmapped City Health Audit & Disambiguation Prompt (Desktop)
- [ ] **3.1 Auto-Audit Warning Banner**: If a city has missing coordinates or missing country flag, verify orange banner appears: *X cities need location or flag updates [Review & Repair]*.
  > **Desktop Notes**: 

- [ ] **3.2 1-Click Batch Repair**: Click *Auto-repair all locations and flags* in Manage Cities toolbar. Verify all cities gain coordinates and flags.
  > **Desktop Notes**: 

- [ ] **3.3 Interactive Disambiguation Prompt**: Add a new city named `Nara` or `Naples` without selecting a country. Click *Find on Map*. Verify modal pops up asking *Which Nara are you visiting?* with choices `Nara, Japan` vs `Nara, USA`. Select Japan and confirm instant mapping.
  > **Desktop Notes**: 

---

### 4. 🤖 Issue #189: AI Builder From Scratch (Desktop)
- [ ] **4.1 Regions & Countries Input**: Open AI Builder. Verify field *Regions / Countries of Interest* is present (e.g. `Southeast Asia and Southern Europe`).
  > **Desktop Notes**: 

- [ ] **4.2 Booked Flights & Junctions Input**: Verify field *Pre-booked Flights & Fixed Junctions* is present (e.g. `Land in Bangkok 12 June, Depart Singapore 26 June`).
  > **Desktop Notes**: 

- [ ] **4.3 Prompt Generation**: Click *Generate AI Prompt*. Verify generated prompt explicitly instructs LLM to choose 3-5 logical destination cities in requested regions that connect flight junctions.
  > **Desktop Notes**: 

---

## 📱 MOBILE VERIFICATION SUITE (390 x 844)

### 5. 🚀 Issue #188: Onboarding Wizard & Storage Location Setup (Mobile)
- [ ] **5.1 Factory Reset Boot**: Open mobile viewport (390 x 844). Perform Factory Reset. Verify modal layout renders cleanly on narrow screens without overflow.
  > **Mobile Notes**: 

- [ ] **5.2 Step Navigation & Touch Targets**: Step through Onboarding Wizard (Steps 1 to 8) on mobile. Verify all buttons, radios, chips, and date pickers have clean touch targets and clear layout.
  > **Mobile Notes**: 

- [ ] **5.3 Mobile Trip Creation**: Complete Onboarding Wizard on mobile. Verify trip generates cleanly and fits mobile viewport.
  > **Mobile Notes**: 

---

### 6. 🌍 Issue #191: Prominent City Management, Rename, Refetch & Airport Codes (Mobile)
- [ ] **6.1 Mobile Header Menu Cities Button**: Open mobile top menu sheet. Verify *Cities* button opens cities modal cleanly.
  > **Mobile Notes**: 

- [ ] **6.2 Mobile Cities Dialog Layout**: Verify Manage Cities dialog scales properly in mobile viewport without horizontal clipping.
  > **Mobile Notes**: 

- [ ] **6.3 Mobile Inline Editing & Dropdowns**: Edit city name, IATA/ICAO codes, and change country dropdown on mobile. Verify touch inputs and auto-geocoding function smoothly.
  > **Mobile Notes**: 

---

### 7. ⚠️ Issue #192: Unmapped City Health Audit & Disambiguation Prompt (Mobile)
- [ ] **7.1 Mobile Warning Banner**: Verify orange audit banner wraps neatly on mobile screen.
  > **Mobile Notes**: 

- [ ] **7.2 Mobile Disambiguation Modal**: Trigger disambiguation modal (e.g. add `Nara`). Verify choice buttons are full-width and touch-friendly on mobile.
  > **Mobile Notes**: 

---

### 8. 💻 Issue #190: Mobile Desktop Advisory Notice (Mobile)
- [ ] **8.1 Advisory Visibility**: Open top menu in mobile view. Verify banner *Best Experienced on Desktop PC* is clearly displayed.
  > **Mobile Notes**: 

- [ ] **8.2 Advisory Link**: Tap desktop link (*trentan.github.io/travel-planner*). Verify link triggers target location cleanly.
  > **Mobile Notes**: 

---

### 9. 🤖 Issue #189: AI Builder From Scratch (Mobile)
- [ ] **9.1 Mobile Modal Layout**: Open AI Builder modal on mobile. Verify form inputs (Regions & Booked Junctions) fit mobile width.
  > **Mobile Notes**: 

- [ ] **9.2 Mobile Prompt Generation & Copy**: Generate AI prompt on mobile. Verify copy prompt button works and text container scrolls vertically.
  > **Mobile Notes**: 
