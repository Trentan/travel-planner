// Guide and Tutorial System
const GUIDE_STEPS = [
  {
    id: 'welcome',
    title: 'Welcome to Travel Planner',
    description: 'This is your all-in-one trip planning companion. Let\'s walk through the key features.',
    demo: 'mini',
    hint: 'Click "Start Interactive Tutorial" above for a guided tour!'
  },
  {
    id: 'create-trip',
    title: 'Create Your Trip',
    description: 'Start by giving your trip a name and subtitle. Click on "✈ New Trip Plan" at the top to edit it.',
    demo: 'edit',
    hint: 'The header is fully editable - just click and type!'
  },
  {
    id: 'cities',
    title: '🌍 Manage Cities',
    description: 'Click "Cities" to add and manage destinations. Each city gets a color and can be filtered across all tabs. Tips, food, activities, and accommodation can all be assigned to cities.',
    demo: 'button',
    demoText: '🌍 Cities',
    hint: 'On mobile, use the Menu button for quick access to Cities and other tools.'
  },
  {
    id: 'add-leg',
    title: 'Add Trip Legs',
    description: 'A "leg" is a segment of your trip (start, travel between cities, or city stays). Click "+ Add Trip Leg" to create destinations.',
    demo: 'button',
    demoText: '+ Add Trip Leg',
    hint: 'Legs can be Start (departure home), Travel (city-to-city), City (destination), or Return (arrival home).'
  },
  {
    id: 'days',
    title: 'Plan Your Days',
    description: 'Each day shows your route (From → To) and can hold transport, accommodation, and activities.',
    demo: 'day-card',
    hint: 'Click on any day bar to expand/collapse the details. Use the expand/collapse buttons for bulk control.'
  },
  {
    id: 'journeys',
    title: '✈️ Multi-Leg Journeys',
    description: 'Transport is now organized as Journeys with multiple segments. Use the Transport tab to add flights, trains, buses, and more.',
    demo: 'button',
    demoText: '+ Add Journey',
    hint: 'Multi-leg trips (like flights with connections) are grouped together in the Transport tab.'
  },
  {
    id: 'accommodation',
    title: '🏨 Stays & Accommodation',
    description: 'Add stays with check-in/check-out dates in the Accommodation tab. The itinerary automatically shows where you\'re staying each night.',
    demo: 'button',
    demoText: '+ Add Stay',
    hint: 'Stays include provider (Booking.com, Airbnb), status, and booking references.'
  },
  {
    id: 'drag-drop',
    title: 'Drag & Drop Activities',
    description: 'In each leg, you can plan "Suggested Activities", "Food Quests", and "Tips". Drag them to any day to schedule!',
    demo: 'drag',
    hint: 'Look for the ⠿ handle - that\'s your drag grabber. These can be assigned to cities too.'
  },
  {
    id: 'budget',
    title: 'Track Your Budget',
    description: 'Click the "💰 Budget" tab to see a complete cost breakdown by category and trip leg.',
    demo: 'tabs',
    hint: 'Costs are automatically calculated from journeys, stays, and activities.'
  },
  {
    id: 'packing',
    title: '🧳 Master Your Packing',
    description: 'The Packing tab has pre-loaded lists for Walk-on Gear, Carry-on, and Personal Item bags. Use the guides for tips!',
    demo: 'check',
    hint: 'Check items off as you pack. Add custom categories and use the collapsible packing guides.'
  },
  {
    id: 'modes',
    title: 'Toggle View Modes',
    description: 'Use the top bar buttons to change how you view your trip:',
    demo: 'modes',
    modes: ['🔒 Lock - disables editing (Read Only)', '📄 Compact View - condenses the itinerary layout'],
    hint: 'Use Read Only to avoid accidental edits and Compact View for a denser trip overview.'
  },
  {
    id: 'print',
    title: 'Export Your Itinerary',
    description: 'Use "Export Itinerary Text" for a clean shareable itinerary, or "Share Export" for a filtered JSON file that can be imported back into the app.',
    demo: 'import-export',
    hint: 'The text export is the best option for sharing or pasting into AI tools.'
  },
  {
    id: 'export',
    title: 'Export & Share',
    description: 'Use "Open File" on supported browsers to autosave into one JSON file. On mobile fallback, use the download option to save a copy.',
    demo: 'import-export',
    hint: 'You can also import someone else\'s trip and modify it for your needs!'
  },
  {
    id: 'ai',
    title: '🤖 AI Assistant',
    description: 'Stuck for ideas? Go to AI Builder, enter your trip details, and generate a prompt for ChatGPT/Gemini.',
    demo: 'ai',
    hint: 'The AI can build a complete JSON itinerary including cities, stays, and journeys for import!'
  },
  {
    id: 'mappr-import',
    title: '🗺️ Mappr Curated Map Import',
    description: 'Bring in curated maps, GeoJSON, and .mappr export files directly into any trip leg. Spots automatically sort into Food Quests, Local Tips, and Suggested Sights with pins and notes preserved.',
    demo: 'button',
    demoText: '🗺️ Import Mappr Map',
    hint: 'Use the City / Leg menu or top menu to import curated maps in 1 click!'
  },
  {
    id: 'booking-intake',
    title: '📥 Booking Intake & Confirmations',
    description: 'Paste booking confirmation emails, flight reservations, and hotel receipts. Smart intake extracts departure times, airline codes, hotel check-in hours, and booking reference numbers automatically.',
    demo: 'button',
    demoText: '📥 Paste Confirmation Text',
    hint: 'Paste raw confirmation text from airlines or booking portals directly into the Intake modal.'
  },
  {
    id: 'attachments-alerts',
    title: '📎 Attachments & Flight Status Alerts',
    description: 'Store boarding pass PDFs, ticket screenshots, and links directly on activities, stays, and journeys. Set operational alerts (delays, gate changes, baggage belts) with prominent warning badges.',
    demo: 'check',
    hint: 'Use "📎 Add Link" or "🖼️ Upload Image" in any activity or journey editor.'
  },
  {
    id: 'split-view',
    title: '🖥️ Desktop Split View & Mobile Viewports',
    description: 'On desktop (1440x900), inspect day timelines side-by-side with interactive item drawers. On mobile, swipe sideways across days and toggle between compact and detailed timeline views.',
    demo: 'modes',
    modes: ['🖥️ Split View - Side-by-side day timeline & detail inspector', '📱 Mobile View - Swipeable day cards and sticky navigation'],
    hint: 'Click any activity or transport card to inspect full details without leaving your scroll position.'
  },
  {
    id: 'cloud-sync',
    title: '☁️ Cloud Sync & Emergency Backups',
    description: 'Sync your trip seamlessly across devices with Google Drive integration. Automatic emergency snapshots preserve your data locally before every major edit.',
    demo: 'import-export',
    hint: 'Export shareable JSON or load snapshots from the Backups panel in the main menu.'
  }
];

// Build guide steps on load
function buildGuideSteps() {
  const container = document.getElementById('guideSteps');
  if (!container) return;

  container.innerHTML = GUIDE_STEPS.map((step, idx) => `
    <div class="guide-step-card ${getStepStatus(step.id) ? 'completed' : ''}" data-step="${step.id}" onclick="toggleGuideStep(this)">
      <div class="guide-step-header">
        <div class="guide-step-number">${getStepStatus(step.id) ? '✓' : idx + 1}</div>
        <div class="guide-step-title">${step.title}</div>
        <div class="guide-step-toggle">▼</div>
      </div>
      <div class="guide-step-content">
        <div class="guide-step-description">${step.description}</div>
        ${buildStepDemo(step)}
        <div class="guide-hint">💡 ${step.hint}</div>
      </div>
    </div>
  `).join('');

  // Add completion banner if all steps done
  if (allStepsCompleted()) {
    container.innerHTML += `
      <div class="guide-complete-banner">
        <h3>🎉 You're Ready to Plan!</h3>
        <p>You've completed the guide. Start building your dream trip!</p>
      </div>
    `;
  }
}

function buildStepDemo(step) {
  if (!step.demo) return '';

  switch(step.demo) {
    case 'mini':
      return `
        <div class="guide-step-demo mini">
          <button class="guide-demo-btn">${step.demoText || 'Example Button'}</button>
          <input class="guide-demo-input" placeholder="Editable text...">
          <span style="font-size: 0.8rem; color: #666;">Try clicking around!</span>
        </div>
      `;
    case 'button':
      return `<div class="guide-step-demo"><button class="action-btn" disabled>${step.demoText}</button></div>`;
    case 'day-card':
      return `
        <div class="guide-step-demo">
          <div class="day-bar bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700" style="padding:8px 12px; border-radius:4px;">
            <span class="text-slate-600 dark:text-slate-400" style="font-family:monospace;">Mon 1 Jan</span>
            <span style="margin:0 8px;">Home → City</span>
            <span class="text-slate-400 dark:text-slate-500" style="font-size:0.8rem;">▼</span>
          </div>
        </div>
      `;
    case 'drag':
      return `
        <div class="guide-step-demo">
          <div style="display:flex;gap:8px;align-items:center;">
            <span class="text-slate-400 dark:text-slate-500" style="cursor:grab;">⠿</span>
            <span>Eiffel Tower visit</span>
            <span class="text-slate-500 dark:text-slate-400" style="font-size:0.75rem;">← Drag to a day!</span>
          </div>
        </div>
      `;
    case 'tabs':
      return `
        <div class="guide-step-demo">
          <div style="display:flex;gap:8px;">
            <span class="bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300" style="padding:6px 12px; border-radius:4px; font-size:0.8rem;">✈️ Transport</span>
            <span class="bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300" style="padding:6px 12px; border-radius:4px; font-size:0.8rem;">🏨 Accommodation</span>
            <span class="bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-100" style="padding:6px 12px; border-radius:4px; font-size:0.8rem; font-weight:600;">💰 Budget</span>
          </div>
        </div>
      `;
    case 'check':
      return `
        <div class="guide-step-demo">
          <div style="display:flex;flex-direction:column;gap:6px;">
            <label style="display:flex;align-items:center;gap:8px;"><input type="checkbox" checked> Passport</label>
            <label style="display:flex;align-items:center;gap:8px;"><input type="checkbox"> Phone charger</label>
          </div>
        </div>
      `;
    case 'modes':
      return `
        <div class="guide-step-demo">
          <div style="display:flex;flex-direction:column;gap:8px; font-size:0.85rem;">
            ${step.modes.map(m => `<div>• ${m}</div>`).join('')}
          </div>
        </div>
      `;
    case 'print':
      return `
        <div class="guide-step-demo">
          <div style="display:flex;gap:12px;align-items:center;">
            <span class="bg-slate-800 dark:bg-slate-600 text-white" style="padding:6px 12px; border-radius:4px; font-size:0.8rem;">🖨️ Print Preview</span>
            <span class="text-slate-500 dark:text-slate-400" style="font-size:0.8rem;">→</span>
            <span class="text-slate-500 dark:text-slate-400" style="font-size:0.8rem;">Choose options, then print!</span>
          </div>
        </div>
      `;
    case 'import-export':
      return `
        <div class="guide-step-demo">
          <div style="display:flex;gap:8px;">
            <span class="bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300" style="padding:6px 12px; border-radius:4px; font-size:0.8rem;">Open File</span>
            <span class="bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300" style="padding:6px 12px; border-radius:4px; font-size:0.8rem;">Download JSON Copy</span>
          </div>
        </div>
      `;
    case 'ai':
      return `
        <div class="guide-step-demo">
          <div style="background:#8E44AD; color:white; padding:10px 20px; border-radius:6px; display:inline-block; font-weight:600;">🪄 Generate AI Prompt</div>
        </div>
      `;
    default:
      return '';
  }
}

function toggleGuideStep(card) {
  card.classList.toggle('open');
}

function getStepStatus(stepId) {
  const completed = JSON.parse(localStorage.getItem('travelApp_guide_completed') || '[]');
  return completed.includes(stepId);
}

function markStepComplete(stepId) {
  const completed = JSON.parse(localStorage.getItem('travelApp_guide_completed') || '[]');
  if (!completed.includes(stepId)) {
    completed.push(stepId);
    localStorage.setItem('travelApp_guide_completed', JSON.stringify(completed));
  }
}

function allStepsCompleted() {
  const completed = JSON.parse(localStorage.getItem('travelApp_guide_completed') || '[]');
  return completed.length === GUIDE_STEPS.length;
}

function resetTutorialSeen() {
  localStorage.removeItem('travelApp_guide_completed');
  localStorage.removeItem('travelApp_tutorial_seen');
  buildGuideSteps();
  showToast('📚 Tutorial reset! You can start again.');
}

// Interactive Tutorial System
let currentTutorialStep = 0;
let tutorialActive = false;

/**
 * Each step can have:
 *  - target: CSS selector for desktop highlight
 *  - mobileTarget: fallback selector used when viewport < 768px
 *    (or when the primary target is not visible)
 *  - title / text / position as before
 *
 * On mobile the tooltip renders as a fixed bottom-sheet, so `position`
 * is only used on desktop.
 */
const TUTORIAL_STEPS = [
  {
    target: '#mainTitle',
    mobileTarget: '.app-tabs-nav',
    title: '🧭 Trip Overview & Customization',
    text: 'Welcome to Travel Planner! Click your trip title to rename your trip, or click the emoji icon to pick custom travel symbols.',
    position: 'bottom',
    onEnter: () => { if (typeof switchTab === 'function') switchTab('itinerary'); }
  },
  {
    target: '#cityNav',
    mobileTarget: '#cityNav',
    title: '🏙️ City Filter & Route Navigation',
    text: 'Filter entire itinerary days, stays, and transit by city. Click "+ Add City" to dynamically add new destinations and auto-cascade trip dates.',
    position: 'bottom'
  },
  {
    target: '.itinerary-view-mode-controls',
    mobileTarget: '.itinerary-view-mode-controls',
    title: '🗓️ Timeline & Split-Screen View',
    text: 'Switch between compact day cards and the chronological Daily Timeline. On desktop, toggle Split View to inspect day details side-by-side with full-screen efficiency.',
    position: 'bottom',
    onEnter: () => { if (typeof switchTab === 'function') switchTab('itinerary'); }
  },
  {
    target: 'button[data-tab="transport"]',
    mobileTarget: 'button[data-tab="transport"]',
    title: '✈️ Transport Hub & Flight Alerts',
    text: 'Manage flights, trains, and layover warnings. New: record live operational alerts (delays, gate changes, baggage belts) with real-time badges on your timeline!',
    position: 'bottom',
    onEnter: () => { if (typeof switchTab === 'function') switchTab('transport'); }
  },
  {
    target: 'button[data-tab="accom"]',
    mobileTarget: 'button[data-tab="accom"]',
    title: '🏨 Stays & Receipts / Attachments',
    text: 'Track accommodations and check-in times. New: attach PDFs, booking links, and ticket screenshots across stays, activities, and transit with instant image lightbox preview.',
    position: 'bottom',
    onEnter: () => { if (typeof switchTab === 'function') switchTab('accom'); }
  },
  {
    target: '.packing-guide-btn-readiness, button[data-tab="packing"]',
    mobileTarget: 'button[data-tab="packing"]',
    title: '🌍 International Travel Readiness',
    text: 'New: Click the highlighted [🌍 Travel Readiness] button in Packing to see country-by-country visa rules, 6-month passport target dates, power plugs, currencies, and pre-departure checklists!',
    position: 'bottom',
    onEnter: () => {
      if (typeof switchTab === 'function') switchTab('packing');
      if (typeof toggleGuidePanel === 'function') toggleGuidePanel('readiness');
    },
    onLeave: () => {
      if (typeof collapseAllGuides === 'function') collapseAllGuides();
    }
  },
  {
    target: '.app-menu-right, .actions-menu-details',
    mobileTarget: '.mobile-menu-btn',
    title: '📥 Smart Booking Intake Parser',
    text: 'Paste raw flight, train, or hotel reservation emails/texts into "Import Booking" in the menu to auto-extract routes, flight numbers, and dates directly into your itinerary.',
    position: 'bottom',
    onEnterMobile: () => {
      if (typeof toggleMobileMenu === 'function' && !document.getElementById('mobileMenuSheet').classList.contains('open')) toggleMobileMenu();
    },
    onLeaveMobile: () => {
      if (typeof closeMobileMenu === 'function') closeMobileMenu();
    }
  },
  {
    target: '.app-menu-right, .actions-menu-details',
    mobileTarget: '.mobile-menu-btn',
    title: '🗺️ Mappr Curated Map Import',
    text: 'Import curated local maps from Mappr! Automatically categorize spots into food quests, sights, and insider tips attached to your chosen trip legs.',
    position: 'bottom',
    onEnterMobile: () => {
      if (typeof toggleMobileMenu === 'function' && !document.getElementById('mobileMenuSheet').classList.contains('open')) toggleMobileMenu();
    },
    onLeaveMobile: () => {
      if (typeof closeMobileMenu === 'function') closeMobileMenu();
    }
  },
  {
    target: '.cloud-status-pill, #cloudSyncStatusPill',
    mobileTarget: '#mobileCloudSyncStatusPill',
    title: '☁️ Cloud Hub & Google Drive Sync',
    text: 'All changes save locally offline. Connect Google Drive for seamless cross-device cloud sync, trip version history, and pre-save safety backups.',
    position: 'bottom',
    onEnter: () => {
      if (typeof switchTab === 'function') switchTab('itinerary');
      if (typeof closeMobileMenu === 'function') closeMobileMenu();
    }
  },
  {
    target: '.app-menu-right, .actions-menu-details',
    mobileTarget: '.mobile-menu-btn',
    title: '📤 Share, PDF Print & AI Builder',
    text: 'Print beautiful booklet-ready PDF itineraries, export calendar (.ics) events, share compressed lightweight URLs, or prompt the AI Builder to customize your trip!',
    position: 'bottom',
    onEnter: () => {
      if (typeof switchTab === 'function') switchTab('itinerary');
    }
  }
];

function isMobile() {
  return window.innerWidth < 768;
}

/** Return the best visible DOM element for a tutorial step */
function getTutorialTarget(step) {
  const primary = document.querySelector(step.target);
  if (primary && primary.offsetParent !== null) return primary;

  const mobile = step.mobileTarget ? document.querySelector(step.mobileTarget) : null;
  if (mobile && mobile.offsetParent !== null) return mobile;

  return primary || mobile || null;
}

function startTutorial() {
  if (!document.querySelector('#tutorial-overlay')) {
    createTutorialOverlay();
  }

  tutorialActive = true;
  currentTutorialStep = 0;
  const overlay = document.getElementById('tutorial-overlay');
  const progress = document.getElementById('tutorial-progress');
  if (overlay) overlay.style.display = 'block';
  if (progress) progress.style.display = 'flex';

  // Build progress dots
  if (progress) {
    progress.innerHTML = TUTORIAL_STEPS.map((_, i) =>
      `<div class="tutorial-dot ${i === 0 ? 'active' : ''}" data-step="${i}"></div>`
    ).join('');
  }

  showTutorialStep(0);

  // Keyboard navigation
  document.addEventListener('keydown', handleTutorialKey);
}

function createTutorialOverlay() {
  const overlay = document.createElement('div');
  overlay.id = 'tutorial-overlay';
  overlay.className = 'tutorial-overlay';
  overlay.innerHTML = `
    <div class="tutorial-spotlight" id="tutorial-spotlight"></div>
    <div class="tutorial-tooltip" id="tutorial-tooltip">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
        <span id="tutorial-step-counter" style="font-size: 0.72rem; font-weight: 700; padding: 2px 8px; border-radius: 9999px; background: rgba(59, 130, 246, 0.15); color: #2563eb;">Step 1 of ${TUTORIAL_STEPS.length}</span>
      </div>
      <h4 id="tutorial-title"></h4>
      <p id="tutorial-text"></p>
      <div class="tutorial-nav">
        <button class="btn-skip" onclick="skipTutorial()">Skip Tour</button>
        <button class="btn-prev" id="tutorial-prev" onclick="prevTutorialStep()">← Back</button>
        <button class="btn-next" id="tutorial-next" onclick="nextTutorialStep()">Next →</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  const progress = document.createElement('div');
  progress.id = 'tutorial-progress';
  progress.className = 'tutorial-progress';
  document.body.appendChild(progress);

  // Click backdrop to skip
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) skipTutorial();
  });

  // Touch swipe: left = next, right = back
  let touchStartX = 0;
  overlay.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].clientX;
  }, { passive: true });
  overlay.addEventListener('touchend', (e) => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 50) {
      if (dx < 0) nextTutorialStep();   // swipe left = advance
      else         prevTutorialStep();  // swipe right = back
    }
  }, { passive: true });
}

function showTutorialStep(index) {
  const step = TUTORIAL_STEPS[index];
  if (!step) return;

  if (typeof step.onEnter === 'function') {
    step.onEnter();
  }

  const target = getTutorialTarget(step);
  if (target) {
    try {
      target.scrollIntoView({ behavior: 'instant', block: 'center' });
    } catch (e) {}
  }
  const spotlight = document.getElementById('tutorial-spotlight');
  const tooltip   = document.getElementById('tutorial-tooltip');

  // Update step counter
  const counter = document.getElementById('tutorial-step-counter');
  if (counter) {
    counter.textContent = `Step ${index + 1} of ${TUTORIAL_STEPS.length}`;
  }

  // Update content
  document.getElementById('tutorial-title').textContent = step.title;
  document.getElementById('tutorial-text').textContent  = step.text;

  // Nav buttons
  document.getElementById('tutorial-prev').style.display =
    index === 0 ? 'none' : 'inline-block';
  document.getElementById('tutorial-next').textContent =
    index === TUTORIAL_STEPS.length - 1 ? 'Finish Tour! ✓' : 'Next →';

  // Progress dots
  document.querySelectorAll('.tutorial-dot').forEach((dot, i) => {
    dot.classList.toggle('active', i === index);
  });

  // Mobile layout
  if (isMobile()) {
    if (step.onEnterMobile) {
      step.onEnterMobile();
      setTimeout(() => {
        const t = getTutorialTarget(step);
        if (t) {
          try { t.scrollIntoView({ behavior: 'instant', block: 'center' }); } catch (e) {}
        }
        applyMobileTutorialStyles(tooltip, spotlight, t);
      }, 350);
    } else {
      applyMobileTutorialStyles(tooltip, spotlight, target);
    }
    return;
  }

  // Desktop layout
  applyDesktopTutorialStyles(tooltip, spotlight, target, step);
}

/** Mobile layout: fixed bottom sheet, spotlight if target visible */
function applyMobileTutorialStyles(tooltip, spotlight, target) {
  tooltip.style.position  = 'fixed';
  tooltip.style.bottom    = '0';
  tooltip.style.left      = '0';
  tooltip.style.right     = '0';
  tooltip.style.top       = '';
  tooltip.style.width     = '100%';
  tooltip.style.maxWidth  = '100%';
  tooltip.style.transform = 'none';
  tooltip.style.borderRadius = '16px 16px 0 0';
  tooltip.style.boxSizing = 'border-box';

  if (target && target.offsetParent !== null) {
    const rect = target.getBoundingClientRect();
    spotlight.style.display  = 'block';
    spotlight.style.left     = Math.max(0, rect.left   - 4) + 'px';
    spotlight.style.top      = Math.max(0, rect.top    - 4) + 'px';
    spotlight.style.width    = (rect.width  + 8) + 'px';
    spotlight.style.height   = (rect.height + 8) + 'px';
  } else {
    spotlight.style.display  = 'none';
  }
}

/** Desktop layout: spotlight + tooltip pinned above/below target */
function applyDesktopTutorialStyles(tooltip, spotlight, target, step) {
  tooltip.style.bottom   = '';
  tooltip.style.right    = '';
  tooltip.style.width    = '';
  tooltip.style.maxWidth = '';
  tooltip.style.transform = '';
  tooltip.style.borderRadius = '';
  tooltip.style.position = 'absolute';

  if (!target || target.offsetParent === null) {
    spotlight.style.display = 'none';
    tooltip.style.top  = '50%';
    tooltip.style.left = '50%';
    tooltip.style.transform = 'translate(-50%, -50%)';
    return;
  }

  const rect = target.getBoundingClientRect();
  spotlight.style.display  = 'block';
  spotlight.style.left     = (rect.left   - 4) + 'px';
  spotlight.style.top      = (rect.top    - 4) + 'px';
  spotlight.style.width    = (rect.width  + 8) + 'px';
  spotlight.style.height   = (rect.height + 8) + 'px';

  const MARGIN = 12;
  const tooltipW = 320;

  let top, left;
  if (step.position === 'bottom') {
    top  = rect.bottom + MARGIN;
    left = rect.left + (rect.width  - tooltipW) / 2;
  } else {
    top  = rect.top - 200 - MARGIN;
    left = rect.left + (rect.width  - tooltipW) / 2;
  }

  left = Math.max(MARGIN, Math.min(left, window.innerWidth  - tooltipW - MARGIN));
  top  = Math.max(MARGIN, Math.min(top,  window.innerHeight - 220        - MARGIN));

  tooltip.style.left = left + 'px';
  tooltip.style.top  = top  + 'px';
}

function nextTutorialStep() {
  const prev = TUTORIAL_STEPS[currentTutorialStep];
  if (prev) {
    if (typeof prev.onLeave === 'function') prev.onLeave();
    if (isMobile() && typeof prev.onLeaveMobile === 'function') prev.onLeaveMobile();
  }
  if (currentTutorialStep < TUTORIAL_STEPS.length - 1) {
    currentTutorialStep++;
    showTutorialStep(currentTutorialStep);
  } else {
    endTutorial();
  }
}

function prevTutorialStep() {
  const prev = TUTORIAL_STEPS[currentTutorialStep];
  if (prev) {
    if (typeof prev.onLeave === 'function') prev.onLeave();
    if (isMobile() && typeof prev.onLeaveMobile === 'function') prev.onLeaveMobile();
  }
  if (currentTutorialStep > 0) {
    currentTutorialStep--;
    showTutorialStep(currentTutorialStep);
  }
}

function skipTutorial() {
  const prev = TUTORIAL_STEPS[currentTutorialStep];
  if (prev) {
    if (typeof prev.onLeave === 'function') prev.onLeave();
    if (isMobile() && typeof prev.onLeaveMobile === 'function') prev.onLeaveMobile();
  }
  endTutorial();
}

function endTutorial() {
  tutorialActive = false;
  const overlay  = document.getElementById('tutorial-overlay');
  const progress = document.getElementById('tutorial-progress');
  if (overlay)  overlay.style.display  = 'none';
  if (progress) progress.style.display = 'none';
  document.removeEventListener('keydown', handleTutorialKey);
  localStorage.setItem('travelApp_tutorial_seen', 'true');
  if (typeof switchTab === 'function') switchTab('itinerary');
  if (typeof collapseAllGuides === 'function') collapseAllGuides();
  if (typeof closeMobileMenu === 'function') closeMobileMenu();
  showToast('✅ Interactive tour complete! You are ready to plan.');
}

function handleTutorialKey(e) {
  if (!tutorialActive) return;
  if (e.key === 'ArrowRight') nextTutorialStep();
  if (e.key === 'ArrowLeft')  prevTutorialStep();
  if (e.key === 'Escape')     skipTutorial();
}

function showToast(message) {
  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed;
    bottom: 2rem;
    left: 50%;
    transform: translateX(-50%);
    background: #2C3E50;
    color: white;
    padding: 12px 24px;
    border-radius: 8px;
    font-size: 0.9rem;
    z-index: 10000;
    animation: fadeIn 0.3s ease;
    max-width: 90vw;
    text-align: center;
  `;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

function acceptWelcomeTutorial() {
  document.getElementById('welcome-tutorial-modal').style.display = 'none';
  startTutorial();
}

function dismissWelcomeTutorial() {
  document.getElementById('welcome-tutorial-modal').style.display = 'none';
  localStorage.setItem('travelApp_tutorial_seen', 'true');
}

// Auto-show tutorial for first-time users
document.addEventListener('DOMContentLoaded', () => {
  if (navigator.webdriver) return; // don't block automated tests

  const hasSeenTutorial = localStorage.getItem('travelApp_tutorial_seen');
  const isGuideTab = location.hash === '#guide';

  if (!hasSeenTutorial && !isGuideTab && buildGuideSteps) {
    // Show the welcome modal
    const welcomeModal = document.getElementById('welcome-tutorial-modal');
    if (welcomeModal) {
      setTimeout(() => {
        welcomeModal.style.display = 'flex';
      }, 500);
    }
  }
});

// --- Guide Tabs Navigation ---
function switchGuideTab(tab) {
  const btnFeatures = document.getElementById('guideTabBtnFeatures');
  const btnReadiness = document.getElementById('guideTabBtnReadiness');
  const contentFeatures = document.getElementById('guideTabContentFeatures');
  const contentReadiness = document.getElementById('guideTabContentReadiness');
  const title = document.getElementById('guideModalTitle');

  if (tab === 'readiness') {
    if (btnFeatures) {
      btnFeatures.className = 'px-4 py-2 text-sm font-semibold border-b-2 border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 focus:outline-none';
    }
    if (btnReadiness) {
      btnReadiness.className = 'px-4 py-2 text-sm font-semibold border-b-2 border-blue-600 text-blue-600 dark:text-blue-400 focus:outline-none';
    }
    if (contentFeatures) contentFeatures.style.display = 'none';
    if (contentReadiness) contentReadiness.style.display = 'block';
    if (title) title.textContent = '🌍 International Travel Readiness';
    renderReadinessGuide();
  } else {
    if (btnFeatures) {
      btnFeatures.className = 'px-4 py-2 text-sm font-semibold border-b-2 border-blue-600 text-blue-600 dark:text-blue-400 focus:outline-none';
    }
    if (btnReadiness) {
      btnReadiness.className = 'px-4 py-2 text-sm font-semibold border-b-2 border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 focus:outline-none';
    }
    if (contentFeatures) contentFeatures.style.display = 'block';
    if (contentReadiness) contentReadiness.style.display = 'none';
    if (title) title.textContent = '📖 How to Use Travel Planner';
    buildGuideSteps();
  }
}

function openReadinessGuide() {
  if (typeof openGuideDialog === 'function') {
    openGuideDialog();
  } else {
    const modal = document.getElementById('guide-modal');
    if (modal) modal.style.display = 'flex';
  }
  switchGuideTab('readiness');
}

// --- Country Readiness Knowledge Base ---
const COUNTRY_READINESS_DB = {
  'France': {
    flag: '🇫🇷',
    region: 'Schengen Area (Europe)',
    passportRule: 'Valid for at least 3 months beyond departure date from Schengen (6 months strongly recommended). Must be issued within the last 10 years and contain at least 2 blank pages.',
    visaRule: 'Schengen 90/180-day rule: Visa-free for up to 90 days in any 180-day period for eligible tourists (US, UK, AU, CA, etc.). ETIAS pre-travel authorization rolling out.',
    healthRule: 'Comprehensive travel health insurance with medical evacuation strongly advised. Routine vaccines (MMR, Tdap). Tap water is safe to drink everywhere.',
    power: 'Type C & Type E plugs. 230V, 50Hz. Standard European round 2-pin adapters required for non-EU devices.',
    currency: 'Euro (€ / EUR). Cards and mobile contactless (Apple/Google Pay) ubiquitous. Keep €1-€2 coins for public toilets and lockers. Tipping: Rounding up or 5-10% in sit-down dining.',
    emergency: 'Universal EU: 112 | Police: 17 | Ambulance (SAMU): 15 | Fire: 18.',
    notes: 'Validate tickets before boarding regional trains and metro stations to avoid instant fines.'
  },
  'Italy': {
    flag: '🇮🇹',
    region: 'Schengen Area (Europe)',
    passportRule: 'Valid for at least 3 months beyond departure from Schengen (6 months recommended). Minimum 2 blank pages.',
    visaRule: 'Schengen 90/180-day rule. Proof of accommodation and return travel may be requested at border control.',
    healthRule: 'Travel health insurance recommended. Tap water is safe; free public drinking fountains ("fontanelle" / "nasoni") are ubiquitous.',
    power: 'Type C, F, and L (Italian 3-in-line). 230V, 50Hz. Standard EU Type C two-pin plugs fit modern Italian sockets.',
    currency: 'Euro (€ / EUR). Card acceptance mandatory by law, but small cash (€5-€20) is helpful for espresso bars, gelato, and tourist city taxes. Tipping: "Coperto" (cover charge) is standard; additional tip optional.',
    emergency: 'Universal EU: 112 | Police (Carabinieri): 112 | Ambulance: 118 | Fire: 115.',
    notes: 'Always validate regional train tickets at green/yellow validation machines on the platform before boarding.'
  },
  'Germany': {
    flag: '🇩🇪',
    region: 'Schengen Area (Europe)',
    passportRule: 'Valid for at least 3 months after Schengen exit date. Issued within the last 10 years.',
    visaRule: 'Schengen 90/180-day rule for eligible tourists.',
    healthRule: 'Travel insurance recommended. World-class medical infrastructure. Tap water is safe.',
    power: 'Type C & Type F (Schuko). 230V, 50Hz. Standard European 2-prong adapters.',
    currency: 'Euro (€ / EUR). Cards widely accepted now, but carry cash for traditional bakeries, beer gardens, and small kiosks. Tipping: Round up or add 5-10% when paying.',
    emergency: 'Police: 110 | Universal EU / Ambulance / Fire: 112.',
    notes: 'Strict adherence to pedestrian signals (jaywalking is fined). Quiet hours observed on Sundays.'
  },
  'Austria': {
    flag: '🇦🇹',
    region: 'Schengen Area (Europe)',
    passportRule: 'Valid for at least 3 months beyond Schengen departure date. 2 blank pages.',
    visaRule: 'Schengen 90/180-day visa-free for eligible nationalities.',
    healthRule: 'Travel health insurance recommended. Mountain rescue insurance essential for Alpine hiking. Tap water is pristine alpine spring water.',
    power: 'Type C & Type F. 230V, 50Hz.',
    currency: 'Euro (€ / EUR). Cards widely accepted; cash handy for mountain huts and traditional coffeehouses. Tipping: 5-10% customary.',
    emergency: 'Universal EU: 112 | Police: 133 | Ambulance: 144 | Mountain Rescue: 140.',
    notes: 'Motorway vignette required on all Austrian motorways (Autobahnen).'
  },
  'Switzerland': {
    flag: '🇨🇭',
    region: 'Schengen Area (Non-EU)',
    passportRule: 'Valid for at least 3 months beyond Schengen stay. Minimum 2 blank pages.',
    visaRule: 'Schengen member: 90-day visa exemption applies. Not in EU customs union (customs duty limits apply).',
    healthRule: 'Medical insurance is critical due to exceptionally high Swiss healthcare costs. Tap water is exceptional alpine quality.',
    power: 'Type J (Swiss 3-pin hex) and Type C (standard 2-pin Europlug fits Type J sockets). 230V, 50Hz.',
    currency: 'Swiss Franc (CHF). Cards and contactless accepted everywhere. Tipping: Service included by law; rounding up appreciated.',
    emergency: 'Universal: 112 | Police: 117 | Ambulance: 144 | REGA Alpine Air Rescue: 1414.',
    notes: 'Swiss Travel Pass or SBB Half-Fare travelcard provides massive discounts on trains, panorama routes, and lake ferries.'
  },
  'United Kingdom': {
    flag: '🇬🇧',
    region: 'United Kingdom (Europe)',
    passportRule: 'Valid for the full duration of your stay in the UK. 6 months recommended for international airline check-in.',
    visaRule: 'Standard Visitor: Visa-free for up to 6 months for eligible tourists (US, AU, CA, NZ, EU). UK ETA (Electronic Travel Authorisation) required for visa-exempt travelers.',
    healthRule: 'Travel insurance required for hospital care and non-emergency treatment. Tap water is completely safe.',
    power: 'Type G (three large rectangular prongs). 230V, 50Hz. Specific UK 3-pin adapter required.',
    currency: 'British Pound (£ / GBP). Nearly cashless; contactless cards & Apple/Google Pay accepted on London Underground, buses, and shops. Tipping: 10-12.5% often included as discretionary service charge.',
    emergency: 'Emergency: 999 or 112 | Non-emergency police: 101 | NHS 24/7 health helpline: 111.',
    notes: 'Tap in and tap out with the same contactless card on the London Underground; daily fare caps apply automatically.'
  },
  'Thailand': {
    flag: '🇹🇭',
    region: 'Southeast Asia',
    passportRule: 'Strictly valid for at least 6 months from the date of arrival in Thailand. At least 2 completely blank passport pages required.',
    visaRule: '60-day visa exemption for tourists from 93 countries (eligible for 30-day extension). Proof of onward return flight and hotel booking frequently requested by airlines before departure.',
    healthRule: 'Comprehensive travel health insurance with medical evacuation strongly advised. Vaccines: Hepatitis A, Tetanus, Typhoid. Mosquito bite prevention essential (Dengue fever). Drink bottled or filtered water only; do NOT drink tap water.',
    power: 'Types A, B, C, and O. 220V, 50Hz. Modern Thai sockets are universal and accommodate US 2-prong (Type A) and European round 2-pin (Type C) plugs.',
    currency: 'Thai Baht (฿ / THB). Cash is king for street food, night markets, tuk-tuks, and island ferries. Cards accepted in malls and hotels. Tipping: Not traditional, but 20-50 THB appreciated for good table service, luggage, and massage.',
    emergency: 'Tourist Police (English speaking, 24/7): 1155 | General Police: 191 | Medical Ambulance: 1669 | Fire: 199.',
    notes: 'Strict respect for the Royal Family and Buddhist sacred sites. Dress modestly (shoulders and knees covered) for temples. Remove shoes before entering temple buildings and private homes.'
  },
  'Taiwan': {
    flag: '🇹🇼',
    region: 'East Asia',
    passportRule: 'Valid for at least 6 months upon arrival. Minimum 2 blank pages.',
    visaRule: '90-day visa exemption for eligible passport holders. Online Taiwan Arrival Card (TWAC) can be completed 72h prior to arrival.',
    healthRule: 'Travel insurance recommended. Tap water should be boiled; public chilled/boiled water dispensers are everywhere.',
    power: 'Type A & Type B (US-style two flat prongs). 110V, 60Hz. Compatible with US/Canadian plugs directly.',
    currency: 'New Taiwan Dollar (NT$ / TWD). Cash essential for night markets and smaller food stalls. EasyCard is essential for MRT, buses, and convenience stores. Tipping: Not customary.',
    emergency: 'Police: 110 | Ambulance & Fire: 119 | English Tourist Hotline: 0800-011-765.',
    notes: 'Strict eating/drinking ban inside MRT stations and trains (violators fined).'
  },
  'Japan': {
    flag: '🇯🇵',
    region: 'East Asia',
    passportRule: 'Valid for duration of stay (6 months recommended). Minimum 2 blank pages.',
    visaRule: '90-day visa exemption for tourist visits. Visit Japan Web pre-clearance QR codes recommended for fast immigration & customs.',
    healthRule: 'Travel medical insurance strongly recommended. Tap water is safe everywhere.',
    power: 'Type A (two ungrounded flat blades). 100V, 50/60Hz. US two-prong plugs fit; 3-prong grounded plugs require adapter.',
    currency: 'Japanese Yen (¥ / JPY). IC Cards (Suica / Pasmo in Apple Wallet) work on trains, buses, and convenience stores. Cash still needed for shrines, ramen ticket machines, and small izakayas. Tipping: Never tip in Japan; it can be considered impolite.',
    emergency: 'Police: 110 | Ambulance/Fire: 119 | Japan Visitor Hotline: 050-3816-2720.',
    notes: 'Carry a small plastic bag for personal trash as public rubbish bins are rare in Japanese cities.'
  },
  'United States': {
    flag: '🇺🇸',
    region: 'North America',
    passportRule: 'Valid for 6 months beyond stay (or duration of stay for 6-Month Club members).',
    visaRule: 'Visa Waiver Program (VWP): Electronic System for Travel Authorization (ESTA) mandatory at least 72 hours before boarding.',
    healthRule: 'Medical insurance with high coverage limit ($100k+) is absolutely vital due to extreme medical costs in the US.',
    power: 'Type A & Type B. 120V, 60Hz.',
    currency: 'US Dollar ($ / USD). Cards and mobile pay ubiquitous. Tipping: 18-22% standard for table service and taxi rides.',
    emergency: 'Emergency: 911.',
    notes: 'Always lock luggage with TSA-approved locks when flying to or within the US.'
  },
  'Australia': {
    flag: '🇦🇺',
    region: 'Oceania',
    passportRule: 'Valid for intended period of stay (6 months recommended).',
    visaRule: 'All non-citizens must have a visa or ETA (subclass 601) before boarding flight to Australia.',
    healthRule: 'Strict biosecurity and quarantine laws: declare all food, plant, and animal products upon arrival. High sun UV index: SPF50+ sunscreen essential.',
    power: 'Type I (two slanted flat blades and optional grounding pin). 230V, 50Hz.',
    currency: 'Australian Dollar (A$ / AUD). Virtually cashless. Tipping: Not expected, but 5-10% appreciated for exceptional restaurant service.',
    emergency: 'Emergency: 000 | From mobile with international SIM: 112.',
    notes: 'Swim only between the red and yellow flags at patrolled beaches.'
  }
};

function getTripCountries() {
  const countries = new Set();
  if (Array.isArray(window.citiesData)) {
    window.citiesData.forEach(c => {
      if (c && c.country && c.country.trim()) countries.add(c.country.trim());
    });
  }

  const cityMap = {
    'paris': 'France', 'nice': 'France', 'lyon': 'France',
    'rome': 'Italy', 'verona': 'Italy', 'milan': 'Italy', 'venice': 'Italy', 'florence': 'Italy', 'bolzano': 'Italy',
    'vienna': 'Austria', 'salzburg': 'Austria', 'innsbruck': 'Austria',
    'berlin': 'Germany', 'munich': 'Germany', 'frankfurt': 'Germany',
    'zurich': 'Switzerland', 'geneva': 'Switzerland', 'lucerne': 'Switzerland', 'basel': 'Switzerland',
    'london': 'United Kingdom', 'edinburgh': 'United Kingdom', 'manchester': 'United Kingdom',
    'bangkok': 'Thailand', 'chiang mai': 'Thailand', 'phuket': 'Thailand', 'krabi': 'Thailand',
    'taipei': 'Taiwan', 'kaohsiung': 'Taiwan',
    'tokyo': 'Japan', 'kyoto': 'Japan', 'osaka': 'Japan',
    'new york': 'United States', 'san francisco': 'United States', 'los angeles': 'United States',
    'sydney': 'Australia', 'melbourne': 'Australia', 'brisbane': 'Australia'
  };

  if (Array.isArray(window.appData)) {
    window.appData.forEach(leg => {
      const label = String(leg.label || leg.city || '').toLowerCase();
      Object.keys(cityMap).forEach(cityName => {
        if (label.includes(cityName)) countries.add(cityMap[cityName]);
      });
      (leg.days || []).forEach(day => {
        const to = String(day.to || '').toLowerCase();
        const from = String(day.from || '').toLowerCase();
        Object.keys(cityMap).forEach(cityName => {
          if (to.includes(cityName) || from.includes(cityName)) {
            countries.add(cityMap[cityName]);
          }
        });
      });
    });
  }

  if (countries.size === 0) {
    countries.add('France');
    countries.add('Italy');
    countries.add('Thailand');
  }

  return Array.from(countries);
}

function getTripDatesRange() {
  let firstDate = '';
  let lastDate = '';

  if (Array.isArray(window.appData)) {
    window.appData.forEach(leg => {
      (leg.days || []).forEach(d => {
        if (d && d.date && /^\d{4}-\d{2}-\d{2}$/.test(d.date)) {
          if (!firstDate || d.date < firstDate) firstDate = d.date;
          if (!lastDate || d.date > lastDate) lastDate = d.date;
        }
      });
    });
  }

  let passportTargetDate = '';
  if (lastDate) {
    const end = new Date(lastDate);
    end.setMonth(end.getMonth() + 6);
    passportTargetDate = end.toISOString().split('T')[0];
  }

  return { firstDate, lastDate, passportTargetDate };
}

const READINESS_CHECKLIST_ITEMS = [
  { key: 'passport_validity', label: 'Passport 6-month validity verified against return date', hint: 'Passports should expire at least 6 months after your last travel day.' },
  { key: 'passport_blank_pages', label: 'Passport has 2-4 blank visa pages for entry/exit stamps', hint: 'Entry stamps require clear blank pages in many countries (e.g. Thailand, EU).' },
  { key: 'visa_entry', label: 'Visa, ETA, or visa-exemption requirements confirmed', hint: 'Verify stay length (Schengen 90-day, Thailand 60-day) and apply for ETAs if needed.' },
  { key: 'travel_insurance', label: 'Comprehensive travel medical & evacuation insurance active', hint: 'Keep policy number & 24/7 emergency assistance phone line saved offline.' },
  { key: 'power_adapters', label: 'Correct electrical plug adapters & chargers packed', hint: 'Check voltage (110V vs 230V) and plug prongs (Type C, G, A, O).' },
  { key: 'bank_notifications', label: 'Fee-free travel cards (Wise / Revolut) & bank travel notice set', hint: 'Avoid 3% foreign transaction fees and prevent automated card fraud blocks.' },
  { key: 'offline_navigation', label: 'Offline Google Maps & transit apps downloaded', hint: 'Download regional map packs for navigation without mobile reception.' },
  { key: 'emergency_contacts', label: 'Emergency embassy, insurance & local emergency numbers saved', hint: 'Save local emergency numbers (112 in EU, 1155 in Thailand, 999 in UK).' },
  { key: 'prescriptions', label: 'Essential medications packed in carry-on with doctors notes', hint: 'Keep prescription drugs in original packaging with doctor letters.' },
  { key: 'copies_docs', label: 'Digital backup copies of passport, tickets, and bookings stored safely', hint: 'Keep offline PDFs on your phone and print backup paper copies.' }
];

function getReadinessChecklistState() {
  const metaChecklist = window.titleData && window.titleData.readiness && window.titleData.readiness.checklist;
  if (metaChecklist && typeof metaChecklist === 'object') return metaChecklist;
  try {
    return JSON.parse(localStorage.getItem('travelApp_readiness_checklist') || '{}');
  } catch (e) {
    return {};
  }
}

function toggleReadinessCheckItem(key) {
  const state = getReadinessChecklistState();
  state[key] = !state[key];
  if (!window.titleData) window.titleData = { title: 'Trip Plan', subtitle: '' };
  if (!window.titleData.readiness) window.titleData.readiness = {};
  window.titleData.readiness.checklist = state;

  try {
    localStorage.setItem('travelApp_readiness_checklist', JSON.stringify(state));
  } catch (e) {}

  if (typeof saveData === 'function') {
    saveData(false);
  }

  renderReadinessChecklist();
}

function renderReadinessChecklist() {
  const mounts = [
    document.getElementById('readinessChecklistMount'),
    document.getElementById('packingReadinessChecklistMount')
  ].filter(Boolean);
  if (mounts.length === 0) return;

  const escapeFn = typeof escapeHtmlText === 'function' ? escapeHtmlText : (s => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'));
  const state = getReadinessChecklistState();
  const total = READINESS_CHECKLIST_ITEMS.length;
  const done = READINESS_CHECKLIST_ITEMS.filter(item => !!state[item.key]).length;
  const pct = Math.round((done / total) * 100);

  const itemsHtml = READINESS_CHECKLIST_ITEMS.map(item => {
    const isChecked = !!state[item.key];
    return `
      <label class="flex items-start gap-2.5 p-2 rounded border cursor-pointer transition-colors ${isChecked ? 'bg-emerald-50/60 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900/40 text-slate-500' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-750'}">
        <input type="checkbox" class="mt-1 accent-emerald-600 rounded" ${isChecked ? 'checked' : ''} onchange="toggleReadinessCheckItem('${item.key}')">
        <div class="flex flex-col min-w-0">
          <span class="text-xs sm:text-sm font-medium ${isChecked ? 'line-through text-slate-400 dark:text-slate-500' : ''}">${escapeFn(item.label)}</span>
          <span class="text-[11px] text-slate-500 dark:text-slate-400 no-underline">${escapeFn(item.hint)}</span>
        </div>
      </label>
    `;
  }).join('');

  const checklistHtml = `
    <div class="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col gap-3">
      <div class="flex items-center justify-between flex-wrap gap-2">
        <div class="font-semibold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-2">
          <span>📋 Pre-Departure Readiness Checklist</span>
          <span class="text-xs font-bold px-2 py-0.5 rounded-full ${pct === 100 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200' : 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200'}">${done} / ${total} Done (${pct}%)</span>
        </div>
      </div>
      <div class="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
        <div class="bg-emerald-500 h-2 transition-all duration-300 rounded-full" style="width: ${pct}%;"></div>
      </div>
      <div class="flex flex-col gap-2 mt-1">
        ${itemsHtml}
      </div>
    </div>
  `;

  mounts.forEach(container => {
    container.innerHTML = checklistHtml;
  });
}

function buildReadinessGuideHtml(checklistMountId = 'readinessChecklistMount') {
  const escapeFn = typeof escapeHtmlText === 'function' ? escapeHtmlText : (s => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'));
  const countries = getTripCountries();
  const { firstDate, lastDate, passportTargetDate } = getTripDatesRange();

  const formattedStart = firstDate && typeof formatTripDateForDisplay === 'function' ? formatTripDateForDisplay(firstDate) : (firstDate || 'Start');
  const formattedEnd = lastDate && typeof formatTripDateForDisplay === 'function' ? formatTripDateForDisplay(lastDate) : (lastDate || 'End');
  const formattedTarget = passportTargetDate && typeof formatTripDateForDisplay === 'function' ? formatTripDateForDisplay(passportTargetDate) : (passportTargetDate || '6 months post-trip');

  const countryCardsHtml = countries.map(countryName => {
    const data = COUNTRY_READINESS_DB[countryName] || {
      flag: '🌐',
      region: 'International Destination',
      passportRule: 'Ensure passport is valid for at least 6 months beyond travel dates with 2 blank pages.',
      visaRule: 'Check entry visa or electronic travel authorization (ETA) requirements before departure.',
      healthRule: 'International travel medical insurance recommended. Drink safe bottled/purified water.',
      power: 'Standard international universal adapter recommended. Verify local voltage rating (110V vs 230V).',
      currency: 'Local Currency. Keep both credit/debit card with zero foreign transaction fees and emergency cash.',
      emergency: 'Local Emergency Police & Medical Services.',
      notes: 'Check travel advisories and register trip with your national embassy.'
    };

    return `
      <div class="country-readiness-card p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/90 shadow-sm flex flex-col gap-3">
        <div class="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-2.5">
          <div class="flex items-center gap-2">
            <span class="text-2xl">${data.flag}</span>
            <div>
              <h3 class="font-bold text-slate-800 dark:text-slate-100 text-base">${escapeFn(countryName)}</h3>
              <span class="text-xs text-slate-500 dark:text-slate-400 font-medium">${escapeFn(data.region)}</span>
            </div>
          </div>
          <span class="px-2 py-0.5 rounded text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800">Trip Destination</span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <!-- 1. Passport & Visa -->
          <div class="p-3 bg-slate-50 dark:bg-slate-850 rounded-lg border border-slate-200/60 dark:border-slate-700/60 flex flex-col gap-1.5">
            <div class="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <span>🛂</span> Passport & Visa Requirements
            </div>
            <p class="text-slate-600 dark:text-slate-300 leading-relaxed"><strong>Passport:</strong> ${escapeFn(data.passportRule)}</p>
            <p class="text-slate-600 dark:text-slate-300 leading-relaxed"><strong>Visa & Entry:</strong> ${escapeFn(data.visaRule)}</p>
          </div>

          <!-- 2. Power & Voltage -->
          <div class="p-3 bg-slate-50 dark:bg-slate-850 rounded-lg border border-slate-200/60 dark:border-slate-700/60 flex flex-col gap-1.5">
            <div class="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <span>🔌</span> Power Plugs & Voltage
            </div>
            <p class="text-slate-600 dark:text-slate-300 leading-relaxed">${escapeFn(data.power)}</p>
          </div>

          <!-- 3. Currency & Tipping -->
          <div class="p-3 bg-slate-50 dark:bg-slate-850 rounded-lg border border-slate-200/60 dark:border-slate-700/60 flex flex-col gap-1.5">
            <div class="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <span>💳</span> Currency, Cards & Tipping
            </div>
            <p class="text-slate-600 dark:text-slate-300 leading-relaxed">${escapeFn(data.currency)}</p>
          </div>

          <!-- 4. Health, Water & Safety -->
          <div class="p-3 bg-slate-50 dark:bg-slate-850 rounded-lg border border-slate-200/60 dark:border-slate-700/60 flex flex-col gap-1.5">
            <div class="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <span>💉</span> Health, Water & Insurance
            </div>
            <p class="text-slate-600 dark:text-slate-300 leading-relaxed">${escapeFn(data.healthRule)}</p>
          </div>
        </div>

        <div class="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-slate-100 dark:border-slate-700/60 text-xs">
          <div class="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
            <span class="font-semibold text-red-600 dark:text-red-400">🚨 Emergency:</span>
            <span>${escapeFn(data.emergency)}</span>
          </div>
          ${data.notes ? `<div class="text-[11px] text-slate-500 dark:text-slate-400 italic">💡 ${escapeFn(data.notes)}</div>` : ''}
        </div>
      </div>
    `;
  }).join('');

  return `
    <!-- Top Summary Banner -->
    <div class="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 border border-blue-200 dark:border-blue-800/60 rounded-xl flex flex-col gap-2.5">
      <div class="flex items-center justify-between flex-wrap gap-2">
        <h3 class="text-base font-bold text-blue-900 dark:text-blue-100 flex items-center gap-2">
          <span>🌍</span> Destination Travel Readiness Overview
        </h3>
        <span class="text-xs font-semibold px-2.5 py-1 bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-300 rounded-lg border border-blue-200 dark:border-blue-800">
          ${countries.length} Destination Countr${countries.length === 1 ? 'y' : 'ies'} Detected
        </span>
      </div>
      <p class="text-xs sm:text-sm text-blue-800 dark:text-blue-200 leading-relaxed">
        Your trip runs from <strong>${escapeFn(formattedStart)}</strong> to <strong>${escapeFn(formattedEnd)}</strong> across:
        <span class="font-semibold">${escapeFn(countries.join(', '))}</span>.
      </p>
      ${passportTargetDate ? `
        <div class="p-2.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-lg text-xs font-medium text-amber-900 dark:text-amber-200 flex items-center gap-2">
          <span class="text-base">🛂</span>
          <span><strong>Passport 6-Month Rule:</strong> Your passport must be valid until at least <strong>${escapeFn(formattedTarget)}</strong> (6 months beyond your trip return date).</span>
        </div>
      ` : ''}
    </div>

    <!-- Interactive Checklist Mount -->
    <div id="${checklistMountId}"></div>

    <!-- Country Guidance Cards -->
    <div class="flex flex-col gap-4 mt-2">
      <h4 class="font-bold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-2">
        <span>📍</span> Country-Specific Regulations & Advice
      </h4>
      ${countryCardsHtml}
    </div>
  `;
}

function renderReadinessGuide() {
  const container = document.getElementById('readinessContainer');
  if (!container) return;
  container.innerHTML = buildReadinessGuideHtml('readinessChecklistMount');
  renderReadinessChecklist();
}

// Expose guide and readiness functions to window scope
window.buildGuideSteps = buildGuideSteps;
window.toggleGuideStep = toggleGuideStep;
window.markStepComplete = markStepComplete;
window.resetTutorialSeen = resetTutorialSeen;
window.startTutorial = startTutorial;
window.skipTutorial = skipTutorial;
window.nextTutorialStep = nextTutorialStep;
window.prevTutorialStep = prevTutorialStep;
window.acceptWelcomeTutorial = acceptWelcomeTutorial;
window.dismissWelcomeTutorial = dismissWelcomeTutorial;

window.switchGuideTab = switchGuideTab;
window.openReadinessGuide = openReadinessGuide;
window.renderReadinessGuide = renderReadinessGuide;
window.buildReadinessGuideHtml = buildReadinessGuideHtml;
window.renderReadinessChecklist = renderReadinessChecklist;
window.toggleReadinessCheckItem = toggleReadinessCheckItem;
window.getTripCountries = getTripCountries;
window.getTripDatesRange = getTripDatesRange;
window.COUNTRY_READINESS_DB = COUNTRY_READINESS_DB;
window.READINESS_CHECKLIST_ITEMS = READINESS_CHECKLIST_ITEMS;
