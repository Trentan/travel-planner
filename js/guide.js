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
    hint: 'Cities appear in the navigation bar below the tabs for quick filtering.'
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
    modes: ['📋 Fun Mode - hides logistics/budget', '🔒 Lock - disables editing (Read Only)'],
    hint: 'Each mode helps you focus on what matters at that moment.'
  },
  {
    id: 'print',
    title: 'Print Your Itinerary',
    description: 'Click "🖨 Print Itinerary" for options: date ranges, what to include, and style (Summary vs Detailed).',
    demo: 'print',
    hint: 'The print view is optimized for saving to PDF or taking on your trip!'
  },
  {
    id: 'export',
    title: 'Export & Share',
    description: 'Use "📤 Export Backup" to save your trip as a JSON file. Share it with travel companions or keep it safe.',
    demo: 'import-export',
    hint: 'You can also import someone else\'s trip and modify it for your needs!'
  },
  {
    id: 'ai',
    title: '🤖 AI Assistant',
    description: 'Stuck for ideas? Go to AI Builder, enter your trip details, and generate a prompt for ChatGPT/Gemini.',
    demo: 'ai',
    hint: 'The AI can build a complete JSON itinerary including cities, stays, and journeys for import!'
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
          <div class="day-bar" style="background:#f9f9f9; padding:8px 12px; border-radius:4px;">
            <span style="font-family:monospace; color:#666;">Mon 1 Jan</span>
            <span style="margin:0 8px;">Home → City</span>
            <span style="color:#999; font-size:0.8rem;">▼</span>
          </div>
        </div>
      `;
    case 'drag':
      return `
        <div class="guide-step-demo">
          <div style="display:flex;gap:8px;align-items:center;">
            <span style="color:#999; cursor:grab;">⠿</span>
            <span>Eiffel Tower visit</span>
            <span style="font-size:0.75rem; color:#666;">← Drag to a day!</span>
          </div>
        </div>
      `;
    case 'tabs':
      return `
        <div class="guide-step-demo">
          <div style="display:flex;gap:8px;">
            <span style="padding:6px 12px; background:#eee; border-radius:4px; font-size:0.8rem;">✈️ Transport</span>
            <span style="padding:6px 12px; background:#eee; border-radius:4px; font-size:0.8rem;">🏨 Accommodation</span>
            <span style="padding:6px 12px; background:#eee; border-radius:4px; font-size:0.8rem;color:#2C3E50; font-weight:600;">💰 Budget</span>
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
            <span style="padding:6px 12px; background:#2C3E50; color:white; border-radius:4px; font-size:0.8rem;">🖨️ Print Preview</span>
            <span style="color:#666; font-size:0.8rem;">→</span>
            <span style="color:#666; font-size:0.8rem;">Choose options, then print!</span>
          </div>
        </div>
      `;
    case 'import-export':
      return `
        <div class="guide-step-demo">
          <div style="display:flex;gap:8px;">
            <span style="padding:6px 12px; background:#eee; border-radius:4px; font-size:0.8rem;">📥 Import JSON</span>
            <span style="padding:6px 12px; background:#eee; border-radius:4px; font-size:0.8rem;">📤 Export Backup</span>
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

const TUTORIAL_STEPS = [
  {
    target: '#mainTitle',
    title: 'Your Trip Title',
    text: 'Click here to edit your trip name and subtitle. This appears at the top of printed itineraries.',
    position: 'bottom'
  },
  {
    target: '.app-menu-right',
    title: 'View Modes & Tools',
    text: 'Toggle Fun Mode, Read Only, access Cities, AI Builder, Guide, and Print from the top menu.',
    position: 'bottom'
  },
  {
    target: '#cityNav',
    title: 'City Filter Navigator',
    text: 'Filter your view by city across all tabs. "All" shows everything, or select a specific city to see only its items.',
    position: 'bottom'
  },
  {
    target: '.app-tabs-nav',
    title: 'Navigation Tabs',
    text: 'Switch between Itinerary, Transport, Accommodation, Budget, Packing, and Map views.',
    position: 'bottom'
  },
  {
    target: '#expandAll',
    title: 'Expand/Collapse Days',
    text: 'Quickly show or hide all day details to get an overview of your trip. The Leg button controls the trip leg sections.',
    position: 'top'
  }
];

function startTutorial() {
  if (!document.querySelector('#tutorial-overlay')) {
    createTutorialOverlay();
  }

  tutorialActive = true;
  currentTutorialStep = 0;
  document.getElementById('tutorial-overlay').style.display = 'block';
  document.getElementById('tutorial-progress').style.display = 'flex';

  // Build progress dots
  const progress = document.getElementById('tutorial-progress');
  progress.innerHTML = TUTORIAL_STEPS.map((_, i) =>
    `<div class="tutorial-dot ${i === 0 ? 'active' : ''}" data-step="${i}"></div>`
  ).join('');

  showTutorialStep(0);

  // Add keyboard navigation
  document.addEventListener('keydown', handleTutorialKey);
}

function createTutorialOverlay() {
  const overlay = document.createElement('div');
  overlay.id = 'tutorial-overlay';
  overlay.className = 'tutorial-overlay';
  overlay.innerHTML = `
    <div class="tutorial-spotlight" id="tutorial-spotlight"></div>
    <div class="tutorial-tooltip" id="tutorial-tooltip">
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

  // Click outside to skip
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) skipTutorial();
  });
}

function showTutorialStep(index) {
  const step = TUTORIAL_STEPS[index];
  const target = document.querySelector(step.target);
  const spotlight = document.getElementById('tutorial-spotlight');
  const tooltip = document.getElementById('tutorial-tooltip');

  // Update content
  document.getElementById('tutorial-title').textContent = step.title;
  document.getElementById('tutorial-text').textContent = step.text;

  // Update buttons
  document.getElementById('tutorial-prev').style.display = index === 0 ? 'none' : 'inline-block';
  document.getElementById('tutorial-next').textContent = index === TUTORIAL_STEPS.length - 1 ? 'Done!' : 'Next →';

  // Update progress dots
  document.querySelectorAll('.tutorial-dot').forEach((dot, i) => {
    dot.classList.toggle('active', i === index);
  });

  // Position spotlight and tooltip
  if (target) {
    const rect = target.getBoundingClientRect();
    spotlight.style.left = rect.left - 4 + 'px';
    spotlight.style.top = rect.top - 4 + 'px';
    spotlight.style.width = rect.width + 8 + 'px';
    spotlight.style.height = rect.height + 8 + 'px';

    // Position tooltip
    const tooltipRect = tooltip.getBoundingClientRect();
    let top, left;

    if (step.position === 'bottom') {
      top = rect.bottom + 15;
      left = rect.left + (rect.width - tooltipRect.width) / 2;
    } else {
      top = rect.top - tooltipRect.height - 15;
      left = rect.left + (rect.width - tooltipRect.width) / 2;
    }

    // Keep tooltip in viewport
    left = Math.max(10, Math.min(left, window.innerWidth - tooltipRect.width - 10));
    top = Math.max(10, Math.min(top, window.innerHeight - tooltipRect.height - 10));

    tooltip.style.left = left + 'px';
    tooltip.style.top = top + 'px';
  }
}

function nextTutorialStep() {
  if (currentTutorialStep < TUTORIAL_STEPS.length - 1) {
    currentTutorialStep++;
    showTutorialStep(currentTutorialStep);
  } else {
    endTutorial();
  }
}

function prevTutorialStep() {
  if (currentTutorialStep > 0) {
    currentTutorialStep--;
    showTutorialStep(currentTutorialStep);
  }
}

function skipTutorial() {
  endTutorial();
}

function endTutorial() {
  tutorialActive = false;
  document.getElementById('tutorial-overlay').style.display = 'none';
  document.getElementById('tutorial-progress').style.display = 'none';
  document.removeEventListener('keydown', handleTutorialKey);

  localStorage.setItem('travelApp_tutorial_seen', 'true');
  showToast('✅ Tutorial complete! Check the Guide tab for more details.');
}

function handleTutorialKey(e) {
  if (!tutorialActive) return;
  if (e.key === 'ArrowRight') nextTutorialStep();
  if (e.key === 'ArrowLeft') prevTutorialStep();
  if (e.key === 'Escape') skipTutorial();
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
  `;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// Auto-show tutorial for first-time users
document.addEventListener('DOMContentLoaded', () => {
  const hasSeenTutorial = localStorage.getItem('travelApp_tutorial_seen');
  const isGuideTab = location.hash === '#guide';

  if (!hasSeenTutorial && !isGuideTab && buildGuideSteps) {
    setTimeout(() => {
      const btn = document.getElementById('tutorialBtn');
      if (btn) {
        btn.classList.add('pulse-animation');
        setTimeout(() => btn.classList.remove('pulse-animation'), 3000);
      }
    }, 1000);
  }
});

// Expose guide functions to window scope for HTML onclick handlers
window.buildGuideSteps = buildGuideSteps;
window.toggleGuideStep = toggleGuideStep;
window.markStepComplete = markStepComplete;
window.resetTutorialSeen = resetTutorialSeen;
window.startTutorial = startTutorial;
window.skipTutorial = skipTutorial;
window.nextTutorialStep = nextTutorialStep;
window.prevTutorialStep = prevTutorialStep;
