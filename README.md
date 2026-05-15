# ✈️ Travel Planner PWA

A completely offline, JSON-driven Progressive Web App (PWA) designed to manage complex travel itineraries, itemized budgets, and modular packing lists. Built to work seamlessly on airplane mode, deep in transit, or wherever an internet connection drops out.

## 🌟 Key Features

* **Offline-First Architecture:** Powered by a Service Worker (`sw.js`), the app physically installs to your device and functions 100% offline.
* **JSON Data Engine:** No databases required. Your entire trip—dates, budgets, packing checklists—lives inside a single, portable `.json` file.
* **Dynamic Itinerary:** Drag and drop activities from a "Suggested Sights" pool directly into specific days.
* **Live Budget Tracking:** Itemized cost fields for Transport, Accommodation, and Activities automatically calculate daily and trip-wide totals.
* **Categorized Packing Lists:** Built-in checklists separated by bags (Carry-on vs. Personal Item) and pre-departure tasks.
* **AI Itinerary Engine:** A built-in prompt generator to quickly build new trips using AI tools (ChatGPT/Gemini) and export them into the app's required JSON format.

---

## 📱 How to Install on Your Phone

Because this is a PWA, you do not download it from the App Store. You install it directly from the browser.

### iOS (iPhone/iPad)
1. Open **Safari** and navigate to your GitHub Pages URL (e.g., `https://your-username.github.io/travel-planner/`).
2. Tap the **Share** button at the bottom of the screen (the square with an arrow pointing up).
3. Scroll down and tap **Add to Home Screen**.
4. Open the new "Travel Planner" app from your home screen.

### Android
1. Open **Chrome** and navigate to your GitHub Pages URL.
2. Tap the **Three Dots (Menu)** in the top right corner.
3. Tap **Add to Home screen** (or **Install App**).
4. Open the app from your app drawer/home screen.

---

## 💾 The Workflow: Saving & Google Drive

To keep the app blazing fast and fully offline, it saves your active edits to browser storage. On browsers that support the File System Access API, you can open a JSON file once and the app will keep saving back to that same file. On iPhone/Safari, it falls back to localStorage and the manual export flow.

### 1. Starting a Trip
* Open the app.
* Tap **Open File**.
* Select your `master_itinerary.json` file from your file picker.
* The app will instantly populate with your trip data.

### 2. Making Edits on the Go
* You can safely tick off packing items, log train ticket costs, or drag-and-drop sights while totally offline (e.g., on a flight). The app will auto-save as you edit.

### 3. Manual Backup on Mobile
* On browsers that cannot keep a writable file handle, use the download option when you want a fresh `.json` copy.
* Save that file over the old one in your Google Drive `Backups` folder. This locks in your progress.

---

## 🤖 Generating a New Trip with AI

Ready for the next adventure? Use the built-in AI Builder tab:
1. Navigate to the **🤖 AI Builder** tab.
2. Fill in the rough details of your next trip (Dates, Vibe, Target Cities).
3. Click **🪄 Generate AI Prompt** and copy the output.
4. Paste the prompt into an AI (like ChatGPT or Gemini). It will generate a raw JSON file formatted specifically for this app.
5. Save that output as a `.json` file, tap **Open File**, and your new trip is instantly ready to go.

---

## 📂 File Structure

* `index.html`: The core application layout, styling, and logic.
* `manifest.json`: The configuration file that dictates the app's icon, name, and display colors for mobile installation.
* `sw.js`: The Service Worker that forces the browser to cache the assets, enabling true offline functionality.

---

## Regression Checks

Run the city import/navigation regression check after changing import, city submenu, transport, or itinerary mapping logic:

```powershell
node tests\city-nav-regression.js
```

The check uses `backups/2026_June_July_Europe_Thailand.json` and verifies city filtering, timeline order, transit city handling, journey-to-leg mapping, and key city nav scroll targets.

## Automated Tests

Run the full smoke/unit suite from the dedicated `tests/` folder before you push changes:

```powershell
npm test
```

That suite covers date normalization, transport date display, AI prompt generation, checklist merging, city navigation regression coverage, item 15 automation, and a real Chromium desktop/mobile browser pass.

To run only the browser layer with the verbose coverage summary:

```powershell
npm run test:browser
```

To open Chromium and watch the interactions live:

```powershell
npm run test:browser:headed
```

You can also double-click [run-tests.bat](/C:/Apps/Projects/travel-planner/run-tests.bat) for the full suite or [run-browser-tests.bat](/C:/Apps/Projects/travel-planner/run-browser-tests.bat) for the visible browser run.

Recommended workflow:
1. Run `npm test` or double-click `run-tests.bat`.
2. If you want to watch the UI, run `npm run test:browser:headed` or double-click `run-browser-tests.bat`.
3. Confirm everything passes before committing or pushing branch changes.
