const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const { startStaticServer } = require('../tests/lib/static-server');

const root = path.resolve(__dirname, '..');
const outRoot = path.join(root, 'docs', 'github-issue-assets');
const fixturePath = path.join(root, 'backups', '2026_June_July_Europe_Thailand.json');

const issueSpecs = {
  79: {
    title: 'Weather prediction for trip days',
    before: { kind: 'app', viewport: 'desktop', tab: 'itinerary', note: 'Day cards currently show activity and logistics, but no weather forecast based on city/date.' },
    proposed: { kind: 'mock', summary: 'Add a compact weather strip to itinerary days.', bullets: ['City-based forecast lookup', 'Unavailable/out-of-range fallback', 'Works in desktop and mobile day cards'] }
  },
  80: {
    title: 'Force city locations to load consistently',
    before: { kind: 'app', viewport: 'desktop', tab: 'map', note: 'Map and city navigation depend on city coordinates being reliably loaded.' },
    proposed: { kind: 'mock', summary: 'Normalize city location loading before map/weather/navigation render.', bullets: ['Load coordinates on startup/import', 'Show fallback for missing locations', 'Protect with city navigation regression'] }
  },
  81: {
    title: 'Run tutorial on first app load',
    before: { kind: 'app', viewport: 'desktop', tab: 'itinerary', note: 'Fresh app load lands directly in the planner without automatically starting onboarding.' },
    proposed: { kind: 'mock', summary: 'Show first-run tutorial and remember dismissal/completion.', bullets: ['First load opens tutorial', 'Returning users are not interrupted', 'Guide remains available from menu/help'] }
  },
  82: {
    title: 'Food quests collapsed in mobile compact',
    before: { kind: 'app', viewport: 'mobile', compact: true, tab: 'itinerary', note: 'Mobile compact food quests currently occupy expanded space and behave like a collapsible panel.' },
    proposed: { kind: 'mock', summary: 'Render food quests as a collapsed compact summary in MCO.', bullets: ['Default collapsed', 'No expand/collapse control in compact mobile', 'Detailed modes remain unchanged'] }
  },
  83: {
    title: 'Day activities appear in suggested activities',
    before: { kind: 'app', viewport: 'desktop', tab: 'itinerary', note: 'Default-loaded day activities should be compared against the suggested activities list.' },
    proposed: { kind: 'mock', summary: 'Normalize day activities into suggested activities.', bullets: ['Day activities represented in suggestions', 'Duplicate handling', 'Stable import/load behavior'] }
  },
  84: {
    title: 'Make activities easy to edit',
    before: { kind: 'app', viewport: 'desktop', tab: 'itinerary', note: 'Activity rows lack an always-obvious edit path unless the user knows the edit mode workflow.' },
    proposed: { kind: 'mock', summary: 'Add a discoverable edit affordance and edit flow.', bullets: ['Visible edit button/menu', 'Desktop and mobile access', 'Save/cancel behavior preserves data'] }
  },
  85: {
    title: 'Audio tour support for activities',
    before: { kind: 'app', viewport: 'desktop', tab: 'itinerary', note: 'Activity details do not include audio tour fields or links.' },
    proposed: { kind: 'mock', summary: 'Add optional audio tour details to activities.', bullets: ['Audio title/link/reference', 'Visible from activity detail UI', 'Clean empty state'] }
  },
  86: {
    title: 'Quick scrollable trip summary table',
    before: { kind: 'app', viewport: 'mobile', tab: 'itinerary', note: 'Mobile users must scan day cards/tabs instead of a single trip summary table.' },
    proposed: { kind: 'mock', summary: 'Add a compact scrollable summary table.', bullets: ['Days, cities, stay, transport, highlights', 'Mobile-first scrolling', 'Desktop quick overview'] }
  },
  87: {
    title: 'Keep undo, redo, and menu visible',
    before: { kind: 'app', viewport: 'desktop', tab: 'itinerary', note: 'Desktop undo/redo/menu controls should be reviewed for persistent visibility while working.' },
    proposed: { kind: 'mock', summary: 'Move undo/redo/menu into persistent desktop chrome.', bullets: ['Always reachable', 'No content overlap', 'Keyboard/menu behavior unchanged'] }
  },
  88: {
    title: 'AI prompt creates downloadable JSON',
    before: { kind: 'app', viewport: 'desktop', action: 'ai', note: 'AI Builder prompt currently focuses on returning JSON text, not a downloadable import file with the newest structure.' },
    proposed: { kind: 'mock', summary: 'Update prompt output requirements for a downloadable JSON import file.', bullets: ['Downloadable JSON file instruction', 'Current schema with city locations', 'Import-ready validation guidance'] }
  },
  89: {
    title: 'Receipts, tickets, screenshots, links',
    before: { kind: 'app', viewport: 'desktop', tab: 'transport', note: 'Transport/accommodation/activity records have booking fields but no structured attachment/reference area.' },
    proposed: { kind: 'mock', summary: 'Add attachment/reference storage to trip records.', bullets: ['Receipts and ticket screenshots', 'URLs and booking references', 'Compact view remains uncluttered'] }
  },
  90: {
    title: 'Map route segments show transport',
    before: { kind: 'app', viewport: 'desktop', tab: 'map', note: 'Map route segments are visual route lines, not transport-aware segment records.' },
    proposed: { kind: 'mock', summary: 'Make map segments transport-aware.', bullets: ['Match route segment to journey', 'Popup shows method/provider/time/status', 'No linked transport fallback'] }
  },
  91: {
    title: 'Improve interactive guide',
    before: { kind: 'app', viewport: 'desktop', action: 'guide', note: 'Guide content needs review against the newer functionality backlog.' },
    proposed: { kind: 'mock', summary: 'Refresh guide coverage and first-run flow.', bullets: ['New functionality covered', 'Desktop/mobile guide behavior', 'Useful without becoming noisy'] }
  },
  104: {
    title: 'Collapsible tips card in compact mode per itinerary leg',
    before: { kind: 'app', viewport: 'desktop', compact: true, tab: 'itinerary', note: 'In compact mode, leg-specific tips are missing. They only show in the detailed view dashboard.' },
    proposed: { kind: 'mock', summary: 'Add a collapsible Tips card in compact mode (desktop and mobile) per itinerary leg.', bullets: ['Collapsible Tips card styled like food quests', 'Fallback for empty tips state', 'Works seamlessly in DCO and MCO viewports'] }
  }
};

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

async function importFixture(page) {
  const fixture = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));
  await page.evaluate(async data => {
    const file = new File([JSON.stringify(data)], '2026_June_July_Europe_Thailand.json', { type: 'application/json' });
    await window.importJSON({ target: { files: [file], value: '' } });
  }, fixture);
  await page.waitForTimeout(500);
}

async function prepareAppPage(browser, baseUrl, spec) {
  const viewport = spec.viewport === 'mobile'
    ? { width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }
    : { width: 1440, height: 900 };
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  page.on('dialog', dialog => dialog.accept().catch(() => {}));
  await page.goto(`${baseUrl}/index.html`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => typeof window.importJSON === 'function' && typeof window.getCurrentAppData === 'function');
  await importFixture(page);
  if (spec.compact) {
    await page.evaluate(() => window.toggleCompactView(true));
    await page.waitForFunction(() => document.body.classList.contains('compact-view-mode'));
  }
  if (spec.tab) {
    await page.locator(`.app-tab-btn[data-tab="${spec.tab}"]`).click();
    await page.waitForTimeout(500);
  }
  if (spec.action === 'ai') {
    await page.evaluate(() => window.openAIDialog());
    await page.waitForSelector('#ai-modal', { state: 'visible' });
  }
  if (spec.action === 'guide') {
    await page.evaluate(() => window.openGuideDialog());
    await page.waitForSelector('#guide-modal', { state: 'visible' });
  }
  await page.waitForTimeout(500);
  return { context, page };
}

function imageDataUri(filePath) {
  const bytes = fs.readFileSync(filePath);
  return `data:image/png;base64,${bytes.toString('base64')}`;
}

function mockHtml(issueNumber, spec, beforeImagePath) {
  const bullets = spec.bullets.map(item => `<li>${item}</li>`).join('');
  const beforeImage = imageDataUri(beforeImagePath);
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { margin: 0; font-family: "DM Sans", Arial, sans-serif; background: #f5f7f8; color: #1a242f; }
    .canvas { width: 1440px; height: 900px; padding: 38px 44px; box-sizing: border-box; background: linear-gradient(180deg, #f9fbfb, #eef4f1); }
    .label { font-size: 13px; letter-spacing: .08em; text-transform: uppercase; color: #557064; font-weight: 700; }
    h1 { margin: 8px 0 8px; font-family: Georgia, serif; font-size: 40px; line-height: 1.05; color: #1a242f; }
    .summary { font-size: 20px; color: #344b42; max-width: 980px; line-height: 1.35; margin-bottom: 22px; }
    .mock { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; align-items: stretch; }
    .panel { background: white; border: 1px solid #dbe6e1; border-radius: 8px; padding: 22px; box-shadow: 0 18px 45px rgba(26,36,47,.08); }
    .mini-title { font-weight: 800; font-size: 18px; margin-bottom: 16px; }
    .before-shot { width: 100%; height: 360px; object-fit: cover; object-position: top center; border: 1px solid #d4ded9; border-radius: 6px; background: #edf2ef; }
    .callout { margin-top: 14px; padding: 14px 16px; background: #f4f8f6; border-left: 4px solid #557064; color: #263f38; line-height: 1.45; font-size: 16px; }
    .row { display: grid; grid-template-columns: 1fr auto; align-items: center; border-bottom: 1px solid #edf2ef; padding: 12px 0; gap: 18px; }
    .pill { border-radius: 999px; padding: 6px 10px; background: #e4f0ea; color: #24485d; font-weight: 800; font-size: 12px; white-space: nowrap; }
    ul { margin: 0; padding-left: 22px; font-size: 19px; line-height: 1.58; color: #263f38; }
    .wireframe { margin-top: 16px; display: grid; gap: 10px; }
    .wire-row { display: grid; grid-template-columns: 90px 1fr 110px; gap: 10px; padding: 12px; border: 1px solid #dbe6e1; border-radius: 6px; background: #fbfdfc; align-items: center; font-size: 15px; }
    .bar { height: 10px; background: #dce9e3; border-radius: 999px; }
    .bar.dark { background: #24485d; }
    .footer { margin-top: 18px; font-size: 14px; color: #61736c; }
  </style>
</head>
<body>
  <div class="canvas">
    <div class="label">Issue #${issueNumber} proposed state</div>
    <h1>${spec.title}</h1>
    <div class="summary">${spec.summary}</div>
    <div class="mock">
      <section class="panel">
        <div class="mini-title">Before screenshot reference</div>
        <img class="before-shot" src="${beforeImage}" alt="Before screenshot reference">
        <div class="callout">${spec.beforeNote || 'Use the current app state as the visual baseline before implementing the issue.'}</div>
      </section>
      <section class="panel">
        <div class="mini-title">Proposed outcome</div>
        <div class="row"><span>Primary workflow becomes visible in-context</span><span class="pill">After</span></div>
        <div class="row"><span>Desktop and mobile states have an explicit check path</span><span class="pill">Modes</span></div>
        <div class="row"><span>Save/load/export impact is reviewed where relevant</span><span class="pill">Data</span></div>
        <div class="wireframe" aria-hidden="true">
          <div class="wire-row"><strong>Entry</strong><span class="bar dark"></span><span class="pill">Action</span></div>
          <div class="wire-row"><strong>Detail</strong><span class="bar"></span><span class="pill">Status</span></div>
          <div class="wire-row"><strong>Fallback</strong><span class="bar"></span><span class="pill">Empty</span></div>
        </div>
        <div class="mini-title" style="margin-top:18px;">What changes</div>
        <ul>${bullets}</ul>
      </section>
    </div>
    <div class="footer">Mockup/spec image generated from the GitHub issue workflow. It intentionally references the before screenshot and outlines the proposed visible change. Final implementation screenshots should replace or supplement this when the issue is resolved.</div>
  </div>
</body>
</html>`;
}

async function screenshotMock(browser, issueNumber, proposedSpec, beforeImagePath, outPath) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.setContent(mockHtml(issueNumber, proposedSpec, beforeImagePath), { waitUntil: 'load' });
  await page.screenshot({ path: outPath, fullPage: false });
  await page.close();
}

async function run() {
  ensureDir(outRoot);
  const server = await startStaticServer(root);
  const browser = await chromium.launch({ headless: true });
  try {
    for (const [issueNumber, spec] of Object.entries(issueSpecs)) {
      const dir = path.join(outRoot, `issue-${issueNumber}`);
      ensureDir(dir);
      const beforePath = path.join(dir, 'before.png');
      const proposedPath = path.join(dir, 'proposed.png');
      const { context, page } = await prepareAppPage(browser, server.baseUrl, spec.before);
      try {
        await page.screenshot({ path: beforePath, fullPage: false });
      } finally {
        await context.close();
      }
      await screenshotMock(browser, issueNumber, { title: spec.title, beforeNote: spec.before.note, ...spec.proposed }, beforePath, proposedPath);
      fs.writeFileSync(path.join(dir, 'README.md'), `# Issue #${issueNumber} assets\n\n- before.png: current app/reference state\n- proposed.png: proposed mockup/spec image\n`, 'utf8');
      console.log(`Generated issue-${issueNumber}`);
    }
  } finally {
    await browser.close();
    await server.close();
  }
}

if (require.main === module) {
  run().catch(error => {
    console.error(error.stack || error.message || String(error));
    process.exitCode = 1;
  });
}
