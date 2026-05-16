const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

const ROOT = path.resolve(__dirname, '..', '..');
const ITEMS_DIR = path.join(ROOT, 'polish', 'items');
const PROPOSAL_DIR = path.join(ITEMS_DIR, 'proposals');

function readWorkItems() {
  return fs.readdirSync(ITEMS_DIR)
    .filter(name => /^WI-\d{3}\.md$/.test(name))
    .sort()
    .map(file => {
      const id = file.replace('.md', '');
      const raw = fs.readFileSync(path.join(ITEMS_DIR, file), 'utf8');
      const title = raw.match(/^# \[WI-\d{3}\] (.+)$/m)?.[1] || id;
      const priority = raw.match(/\| Priority \| (.+?) \|/)?.[1] || '';
      const effort = raw.match(/\| Effort \| (.+?) \|/)?.[1] || '';
      const dimension = raw.match(/\| Dimension \| (.+?) \|/)?.[1] || '';
      const before = raw.match(/\| Before screenshot \| `screenshots\/before\/(.+?)` \|/)?.[1] || '';
      const problem = raw.match(/## Problem\s+([\s\S]*?)\s+## Before/)?.[1]?.trim() || '';
      const after = raw.match(/## After \(proposed state description\)\s+([\s\S]*?)\s+## Acceptance criteria/)?.[1]?.trim() || '';
      const criteriaBlock = raw.match(/## Acceptance criteria\s+([\s\S]*?)\s+## How to implement/)?.[1] || '';
      const criteria = criteriaBlock
        .split(/\r?\n/)
        .map(line => line.replace(/^- \[ \]\s*/, '').trim())
        .filter(Boolean)
        .slice(0, 3);
      return { id, title, priority, effort, dimension, before, problem, after, criteria };
    });
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function isMobile(item) {
  return /Mobile|390|tap|touch/i.test(`${item.dimension} ${item.title} ${item.problem} ${item.after}`);
}

function getAccent(item) {
  if (item.priority.includes('Critical')) return '#c2410c';
  if (item.priority.includes('Important')) return '#b7791f';
  return '#2f855a';
}

function getPattern(item) {
  const text = `${item.title} ${item.problem} ${item.after}`.toLowerCase();
  if (text.includes('modal')) return 'modal';
  if (text.includes('menu') || text.includes('chrome') || text.includes('toolbar')) return 'toolbar';
  if (text.includes('nav') || text.includes('tab')) return 'nav';
  if (text.includes('transport')) return 'cards';
  if (text.includes('budget') || text.includes('currency')) return 'budget';
  if (text.includes('map')) return 'map';
  if (text.includes('ai builder')) return 'form';
  if (text.includes('packing')) return 'checklist';
  return 'layout';
}

function componentMarkup(item) {
  const accent = getAccent(item);
  const pattern = getPattern(item);
  const mobile = isMobile(item);

  if (pattern === 'toolbar') {
    return `
      <div class="mock desktop-wide">
        <div class="topbar" style="border-color:${accent}">
          <div class="file-pill">Trip file</div>
          <div class="spacer"></div>
          <div class="small-pill">Read only</div>
          <div class="small-pill">Detailed</div>
          <div class="primary-pill">Actions</div>
        </div>
        <div class="hero-band"></div>
        <div class="note">After state: stable compact chrome with secondary controls grouped.</div>
      </div>`;
  }

  if (pattern === 'modal') {
    return `
      <div class="mock ${mobile ? 'phone' : 'desktop-wide'}">
        <div class="modal-card">
          <div class="modal-head"><strong>${escapeHtml(item.title.replace(/^Journey\s*/i, ''))}</strong><span class="close">x</span></div>
          <div class="modal-body-grid">
            <div class="field full">Segment summary</div>
            <div class="field">From</div><div class="field">To</div>
            <div class="field full">Date</div>
            <div class="field full">Time</div>
            <div class="field full">Provider and notes</div>
          </div>
          <div class="modal-actions">
            <button>Cancel</button><button>Delete</button><button class="dark">Add segment</button><button class="save">Save</button>
          </div>
        </div>
        <div class="note">After state: no horizontal clipping; controls wrap or stack safely.</div>
      </div>`;
  }

  if (pattern === 'nav') {
    return `
      <div class="mock phone">
        <div class="tab-rail">
          <span class="tab active">Itinerary</span><span class="tab">Transport</span><span class="tab">Accommodation</span>
          <span class="fade-edge"></span>
        </div>
        <div class="city-rail">
          <span class="city active">All</span><span class="city">Brisbane</span><span class="city">Taipei</span><span class="city">Vienna</span>
          <span class="fade-edge"></span>
        </div>
        <div class="note">After state: overflow is intentional and visibly scrollable.</div>
      </div>`;
  }

  if (pattern === 'cards') {
    return `
      <div class="mock phone">
        ${['Vienna -> Bratislava', 'Bratislava -> Prague', 'Zurich -> Bangkok'].map((route, idx) => `
          <div class="journey-card-demo">
            <div><strong>${route}</strong><span>${idx === 2 ? 'Flight · 2 legs' : 'Train'}</span></div>
            <div class="journey-meta-demo"><span>D: ${11 + idx} Jun</span><span>Status</span><button>Details</button></div>
          </div>
        `).join('')}
        <div class="note">After state: mobile-first journey cards replace dense table rows.</div>
      </div>`;
  }

  if (pattern === 'budget') {
    return `
      <div class="mock phone">
        <div class="kpi dark">$3,465</div>
        <div class="budget-row"><span>Bratislava</span><strong>$111</strong></div>
        <div class="budget-row"><span>Munich</span><strong>$760</strong></div>
        <div class="budget-row"><span>Koh Samui</span><strong>$1,700</strong></div>
        <div class="note">After state: formatted currency with consistent precision.</div>
      </div>`;
  }

  if (pattern === 'map') {
    return `
      <div class="mock desktop-wide">
        <div class="map-demo">
          <div class="tile-grid"></div>
          <div class="route-line"></div>
          <span class="pin one"></span><span class="pin two"></span><span class="pin three"></span>
          <div class="zoom">+<br>-</div>
        </div>
        <div class="note">After state: pan/zoom map with real markers and route lines.</div>
      </div>`;
  }

  if (pattern === 'form') {
    return `
      <div class="mock phone">
        <div class="field full filled">Europe & Asia 2026</div>
        <div class="field full filled">8 Jun - 8 Jul · Brisbane to Koh Samui</div>
        <div class="field full filled">Brisbane, Taipei, Vienna, Prague...</div>
        <button class="wide dark">Generate AI Prompt</button>
        <div class="note">After state: current trip context is prefilled and editable.</div>
      </div>`;
  }

  if (pattern === 'checklist') {
    return `
      <div class="mock desktop-wide">
        <div class="progress">Packing progress <strong>42%</strong><span></span></div>
        <div class="check-grid">
          <div class="check-card">Carry-on<br><small>8 remaining</small></div>
          <div class="check-card">Personal item<br><small>4 remaining</small></div>
          <div class="check-card">Before home<br><small>3 remaining</small></div>
        </div>
        <div class="note">After state: checklist progress leads, guide content is secondary.</div>
      </div>`;
  }

  return `
    <div class="mock ${mobile ? 'phone' : 'desktop-wide'}">
      <div class="layout-grid">
        <div></div><div></div><div></div>
        <div class="wide-block"></div>
      </div>
      <div class="note">After state: cleaner hierarchy, safer spacing, and reusable responsive classes.</div>
    </div>`;
}

function renderHtml(item) {
  const accent = getAccent(item);
  const viewport = isMobile(item) ? 'Mobile 390px' : 'Desktop 1440px';
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@400;600;700&family=DM+Mono:wght@400;700&display=swap');
  * { box-sizing: border-box; }
  body {
    margin: 0;
    width: 1440px;
    height: 900px;
    overflow: hidden;
    font-family: 'DM Sans', sans-serif;
    color: #18212b;
    background:
      radial-gradient(circle at 90% 5%, rgba(36,72,93,0.16), transparent 30%),
      linear-gradient(135deg, #fffdf8 0%, #f4efe6 100%);
  }
  .page { padding: 48px; height: 900px; display: grid; grid-template-columns: 430px 1fr; gap: 42px; }
  .sidebar {
    background: #172330;
    color: white;
    border-radius: 30px;
    padding: 34px;
    box-shadow: 0 24px 70px rgba(23,35,48,0.26);
    display: flex;
    flex-direction: column;
  }
  .id { font-family: 'DM Mono', monospace; color: #fbd38d; font-size: 22px; margin-bottom: 18px; }
  h1 { font-family: 'Playfair Display', serif; font-size: 46px; line-height: 1.02; margin: 0 0 22px; }
  .meta { display: flex; flex-wrap: wrap; gap: 10px; margin: 0 0 28px; }
  .pill { border: 1px solid rgba(255,255,255,0.18); background: rgba(255,255,255,0.08); border-radius: 999px; padding: 8px 12px; font-size: 13px; }
  .copy { color: #dbe4ed; font-size: 18px; line-height: 1.55; }
  .before { margin-top: auto; font-size: 13px; color: #aab7c4; }
  .main {
    background: rgba(255,255,255,0.72);
    border: 1px solid #ddd3c6;
    border-radius: 34px;
    padding: 34px;
    box-shadow: 0 30px 90px rgba(26,36,47,0.12);
    display: grid;
    grid-template-rows: auto 1fr auto;
    gap: 24px;
  }
  .main-head { display: flex; align-items: center; justify-content: space-between; gap: 24px; }
  .main-head h2 { font-family: 'Playfair Display', serif; font-size: 40px; margin: 0; color: #26384a; }
  .viewport { font-family: 'DM Mono', monospace; color: ${accent}; font-weight: 700; }
  .mock { border-radius: 26px; background: #f8f5ee; border: 2px solid #ddd3c6; padding: 28px; min-height: 520px; position: relative; overflow: hidden; }
  .phone { width: 390px; min-height: 620px; margin: 0 auto; border-radius: 38px; box-shadow: 0 0 0 12px #172330; background: #fffdf8; }
  .desktop-wide { width: 100%; min-height: 520px; }
  .note { position: absolute; left: 28px; right: 28px; bottom: 24px; background: #172330; color: white; border-radius: 18px; padding: 16px 18px; font-weight: 700; }
  .topbar { height: 58px; display: flex; align-items: center; gap: 12px; border: 2px solid; background: #172330; border-radius: 18px; padding: 10px; color: white; }
  .file-pill, .small-pill, .primary-pill { border-radius: 999px; padding: 10px 14px; background: rgba(255,255,255,0.12); }
  .spacer { flex: 1; }
  .primary-pill { background: ${accent}; color: white; }
  .hero-band { margin-top: 24px; height: 130px; border-radius: 22px; background: linear-gradient(135deg, #24485d, #1a242f); }
  .modal-card { background: white; border-radius: 24px; border: 2px solid #ddd3c6; overflow: hidden; height: 100%; display: flex; flex-direction: column; }
  .modal-head { height: 78px; display: flex; align-items: center; justify-content: space-between; padding: 0 26px; font-size: 24px; border-bottom: 1px solid #ddd3c6; }
  .close { width: 44px; height: 44px; display: inline-flex; align-items: center; justify-content: center; border-radius: 50%; background: #f4efe6; }
  .modal-body-grid { padding: 24px; display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
  .field { min-height: 56px; border: 2px solid #ddd3c6; border-radius: 16px; padding: 16px; color: #66707a; background: white; font-size: 20px; }
  .field.full { grid-column: 1 / -1; }
  .field.filled { color: #18212b; background: #fff; }
  .modal-actions { margin-top: auto; display: flex; flex-wrap: wrap; gap: 12px; padding: 20px; border-top: 1px solid #ddd3c6; }
  button, .wide { border: 0; border-radius: 16px; padding: 16px 20px; background: #f4efe6; font: inherit; font-weight: 700; }
  .dark { background: #26384a; color: white; }
  .save { background: #2f855a; color: white; }
  .tab-rail, .city-rail { position: relative; display: flex; gap: 12px; overflow: hidden; padding: 14px; border-bottom: 1px solid #ddd3c6; }
  .tab, .city { white-space: nowrap; border-radius: 999px; padding: 15px 18px; background: white; border: 1px solid #ddd3c6; font-weight: 700; }
  .tab.active, .city.active { background: #172330; color: white; }
  .fade-edge { position: absolute; right: 0; top: 0; width: 90px; height: 100%; background: linear-gradient(90deg, transparent, #fffdf8); }
  .journey-card-demo, .budget-row { background: white; border-left: 6px solid ${accent}; border-radius: 18px; padding: 18px; margin-bottom: 14px; box-shadow: 0 10px 24px rgba(26,36,47,0.08); }
  .journey-card-demo strong { display: block; font-size: 22px; }
  .journey-card-demo span { color: #66707a; font-weight: 700; }
  .journey-meta-demo { margin-top: 12px; display: flex; align-items: center; justify-content: space-between; gap: 10px; }
  .kpi { border-radius: 22px; padding: 40px; font-family: 'DM Mono', monospace; font-size: 48px; text-align: center; margin-bottom: 18px; }
  .budget-row { display: flex; justify-content: space-between; align-items: center; font-size: 22px; border-left-color: ${accent}; }
  .map-demo { height: 420px; border-radius: 24px; overflow: hidden; position: relative; background: #d9eef8; }
  .tile-grid { position: absolute; inset: 0; background-image: linear-gradient(#b7d8ea 1px, transparent 1px), linear-gradient(90deg, #b7d8ea 1px, transparent 1px); background-size: 80px 80px; }
  .route-line { position: absolute; left: 20%; top: 46%; width: 58%; border-top: 6px dashed #ef6f6c; transform: rotate(-14deg); }
  .pin { position: absolute; width: 28px; height: 28px; border-radius: 50%; background: ${accent}; border: 4px solid white; box-shadow: 0 8px 18px rgba(0,0,0,0.24); }
  .pin.one { left: 20%; top: 58%; } .pin.two { left: 48%; top: 40%; } .pin.three { left: 76%; top: 30%; }
  .zoom { position: absolute; left: 20px; top: 20px; background: white; border-radius: 12px; padding: 12px 16px; font-size: 24px; font-weight: 700; }
  .progress { background: white; border-radius: 20px; padding: 24px; font-size: 24px; }
  .progress span { display: block; height: 12px; border-radius: 999px; background: linear-gradient(90deg, ${accent} 42%, #e2ddd4 42%); margin-top: 16px; }
  .check-grid, .layout-grid { margin-top: 24px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; }
  .check-card, .layout-grid div { min-height: 150px; border-radius: 22px; background: white; border: 1px solid #ddd3c6; padding: 24px; font-size: 24px; font-weight: 700; }
  .wide-block { grid-column: 1 / -1; }
  .checks { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
  .check { border-radius: 16px; background: #edf7f1; color: #24523b; padding: 14px; font-weight: 700; font-size: 14px; }
</style>
</head>
<body>
  <div class="page">
    <aside class="sidebar">
      <div class="id">${item.id}</div>
      <h1>${escapeHtml(item.title)}</h1>
      <div class="meta">
        <span class="pill">${escapeHtml(item.priority)}</span>
        <span class="pill">${escapeHtml(item.effort)}</span>
        <span class="pill">${escapeHtml(item.dimension)}</span>
      </div>
      <div class="copy">${escapeHtml(item.after)}</div>
      <div class="before">Source before screenshot: ${escapeHtml(item.before)}</div>
    </aside>
    <main class="main">
      <div class="main-head">
        <h2>Proposed After State</h2>
        <div class="viewport">${viewport}</div>
      </div>
      ${componentMarkup(item)}
      <div class="checks">
        ${item.criteria.map(c => `<div class="check">✓ ${escapeHtml(c)}</div>`).join('')}
      </div>
    </main>
  </div>
</body>
</html>`;
}

async function run() {
  fs.mkdirSync(PROPOSAL_DIR, { recursive: true });
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });

  const items = readWorkItems();
  for (const item of items) {
    await page.setContent(renderHtml(item), { waitUntil: 'domcontentloaded' });
    await page.screenshot({
      path: path.join(PROPOSAL_DIR, `${item.id}-proposal.png`),
      clip: { x: 0, y: 0, width: 1440, height: 900 }
    });
    console.log(`created ${item.id}-proposal.png`);
  }

  await browser.close();
  console.log(`Created ${items.length} proposal images in ${PROPOSAL_DIR}`);
}

run().catch(error => {
  console.error(error);
  process.exit(1);
});
