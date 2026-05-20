# Travel Planner PWA

An offline-first, JSON-driven Progressive Web App for planning complex trips. It manages itineraries, transport, accommodation, budgets, packing lists, maps, and AI-assisted trip generation from a single portable JSON file.

## Features

- Offline-first PWA with install support and a service worker.
- Portable trip data stored in a single JSON file.
- Itinerary planning with city navigation, suggested activities, and day-by-day organization.
- Transport and accommodation tracking with costs, dates, status, and notes.
- Budget summaries with consistent currency formatting.
- Packing checklists grouped by bag and pre-trip task.
- Map view with trip route and city markers.
- AI Builder prompt generator for creating new trip JSON.

## Getting Started

Install dependencies:

```powershell
npm install
```

Run the app locally:

```powershell
npx serve . --listen 3000
```

Open [http://localhost:3000](http://localhost:3000), then load a trip JSON file. A realistic sample trip is available at:

```text
backups/2026_June_July_Europe_Thailand.json
```

## Installing The PWA

Deploy the repo with GitHub Pages or any static host, then open the hosted URL in a mobile browser.

On iOS, use Safari's Share menu and choose Add to Home Screen.

On Android, use Chrome's menu and choose Install App or Add to Home Screen.

## Data Workflow

The app keeps active edits in browser storage so it remains useful offline. Where the File System Access API is supported, you can open a JSON file and save back to it. On browsers without writable file handles, export a fresh JSON backup when you want to preserve changes outside the browser.

## AI Builder

Use the AI Builder tab to generate a structured prompt for a new trip. Paste the prompt into an AI assistant, save the returned JSON, then open that file in the app.

## Tests

Run the full test suite:

```powershell
npm test
```

Run only the browser suite:

```powershell
npm run test:browser
```

Run the visible browser suite:

```powershell
npm run test:browser:headed
```

Run the city navigation regression directly after changes to import, transport, itinerary mapping, or city navigation behavior:

```powershell
node tests\city-nav-regression.js
```

## Contributing

Work is tracked in [GitHub Issues](https://github.com/Trentan/travel-planner/issues). Please open or claim an issue before starting a change, keep pull requests focused, and include the relevant test results.

See [CONTRIBUTING.md](./CONTRIBUTING.md) for the development workflow.

## Project History

The original private polish sprint has been archived at [docs/archive/polish-sprint](./docs/archive/polish-sprint). Active planning now happens in GitHub Issues.

## License

MIT. See [LICENSE](./LICENSE).
