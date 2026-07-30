# Milestone 2 Master Verification & Release Test Plan Template

**Branch**: `milestone2`  
**Test Data**: `backups/2026_June_July_Europe_Thailand.json`  

---

## 📱 / 💻 Viewport & Mode Key
- **DDE**: Desktop / Detailed (1440 x 900, Default density)
- **DCO**: Desktop / Compact (1440 x 900, Compact toggle active)
- **MDE**: Mobile / Detailed (390 x 844, Default density)
- **MCO**: Mobile / Compact (390 x 844, Compact toggle active)

---

## 1. 🚀 Issue #188: Onboarding Wizard & Storage Location Setup
- [ ] **1.1 Factory Reset Boot**: Click *Settings* -> *Factory Reset* (or clear browser site data). Verify the page reloads and automatically opens the Create New Trip onboarding modal (`#trip-start-modal`).
  > **Notes / Feedback**: 

- [ ] **1.2 Step 1 Storage Picker**: Verify Step 1 presents choice between *Pick Drive / Local File Location* and *Browser Storage & Auto-Download*.
  > **Notes / Feedback**: 

- [ ] **1.3 Step 2 Trip Name**: Enter trip name (e.g. `Japan & Thailand Summer`). Verify name validation works.
  > **Notes / Feedback**: 

- [ ] **1.4 Step 3 Departure City & Date**: Enter `Brisbane` and departure date `2026-06-01`.
  > **Notes / Feedback**: 

- [ ] **1.5 Step 4 First Destination & Nights**: Enter `Tokyo` (4 nights) and select `Flight`.
  > **Notes / Feedback**: 

- [ ] **1.6 Step 5 Additional Stops & Auto Return Date**: Add `Kyoto` (3 nights) and `Nara` (2 nights). Verify the return date input (*When do you head home?*) automatically updates to `2026-06-10`.
  > **Notes / Feedback**: 

- [ ] **1.7 Step 6 Style & Pacing**: Click `Couple` and `Relaxed`. Verify chips highlight when selected.
  > **Notes / Feedback**: 

- [ ] **1.8 Step 7 Interests**: Click `Food & Dining` and `History & Culture`. Verify selection state toggles cleanly.
  > **Notes / Feedback**: 

- [ ] **1.9 Step 8 Pre-booked Items**: Click `+ Add pre-booked item`, select `Flight`, pair with `Tokyo`, enter `QF21`. Click *Finish* and verify trip is created with starter activities and saved file.
  > **Notes / Feedback**: 

---

## 2. 🌍 Issue #191: Prominent City Management, Rename, Refetch & Airport Codes
- [ ] **2.1 Prominent Desktop Top Bar Button**: In DDE/DCO, verify *Manage Cities* button is visible in the top header navigation bar.
  > **Notes / Feedback**: 

- [ ] **2.2 Prominent Itinerary Header Button**: Scroll to Itinerary section header. Verify *Manage Cities* button appears next to *Manage Legs*.
  > **Notes / Feedback**: 

- [ ] **2.3 Prominent Mobile Menu Button**: In MDE/MCO, open menu sheet. Verify *Cities* button opens the cities dialog.
  > **Notes / Feedback**: 

- [ ] **2.4 Inline City Rename**: Click inside a city name input field (e.g. rename `Tokyo` to `Tokyo Metropolitan`), press Enter or click away. Verify city name updates across all itinerary days and journey cards.
  > **Notes / Feedback**: 

- [ ] **2.5 IATA & ICAO Code Inputs**: Verify each city row has editable monospace inputs for IATA (e.g. `HND` / `NRT`) and ICAO (e.g. `RJTT` / `RJAA`).
  > **Notes / Feedback**: 

- [ ] **2.6 Auto Geocoding on Country Dropdown Change**: Change a city's country dropdown (e.g. select `Japan`). Verify coordinates, country flag, and airport codes update automatically.
  > **Notes / Feedback**: 

---

## 3. ⚠️ Issue #192: Unmapped City Health Audit & Disambiguation Prompt
- [ ] **3.1 Auto-Audit Warning Banner**: If a city has missing coordinates or missing country flag, verify orange banner appears: *X cities need location or flag updates [Review & Repair]*.
  > **Notes / Feedback**: 

- [ ] **3.2 1-Click Batch Repair**: Click *Auto-repair all locations and flags* in Manage Cities toolbar. Verify all cities gain coordinates and flags.
  > **Notes / Feedback**: 

- [ ] **3.3 Interactive Disambiguation Prompt**: Add a new city named `Nara` or `Naples` without selecting a country. Click *Find on Map*. Verify modal pops up asking *Which Nara are you visiting?* with choices `Nara, Japan` vs `Nara, USA`. Select Japan and confirm instant mapping.
  > **Notes / Feedback**: 

---

## 4. 💻 Issue #190: Mobile Desktop Advisory Notice
- [ ] **4.1 Mobile Menu Notice**: Switch to MDE (390 x 844) and open top menu.
  > **Notes / Feedback**: 

- [ ] **4.2 Advisory Visibility & Link**: Verify the *Best Experienced on Desktop PC* banner is clearly visible at top with text: *Travel Planner works best on a desktop PC! Load and manage your trip at trentan.github.io/travel-planner* and working web link.
  > **Notes / Feedback**: 

---

## 5. 🤖 Issue #189: AI Builder From Scratch
- [ ] **5.1 Regions & Countries Input**: Open AI Builder. Verify field *Regions / Countries of Interest* is present (e.g. `Southeast Asia and Southern Europe`).
  > **Notes / Feedback**: 

- [ ] **5.2 Booked Flights & Junctions Input**: Verify field *Pre-booked Flights & Fixed Junctions* is present (e.g. `Land in Bangkok 12 June, Depart Singapore 26 June`).
  > **Notes / Feedback**: 

- [ ] **5.3 Prompt Generation**: Click *Generate AI Prompt*. Verify generated prompt explicitly instructs LLM to choose 3-5 logical destination cities in the requested regions that connect the flight junctions.
  > **Notes / Feedback**: 
