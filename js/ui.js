let isFunMode = false;
let isCompactView = false;
let isEditMode = true;

function toggleCompactView() {
  isCompactView = !isCompactView;
  document.body.classList.toggle('compact-view-mode', isCompactView);

  const btn = document.getElementById('compactToggleBtn');
  if(isCompactView) {
    btn.innerHTML = "📄 Exit Compact";
    btn.classList.add('active-mode');
  } else {
    btn.innerHTML = "📄 Compact View";
    btn.classList.remove('active-mode');
  }

  buildItinerary();
  buildPackingTab();
}

function toggleMode() {
  isFunMode = !isFunMode;
  document.body.classList.toggle('fun-mode', isFunMode);
  const btn = document.getElementById('modeToggleBtn');
  if(isFunMode) { btn.innerHTML = "🎭 Logistics Mode"; btn.classList.add('active-mode'); }
  else { btn.innerHTML = "📋 Fun Mode"; btn.classList.remove('active-mode'); }
}

function toggleEditMode() {
  isEditMode = !isEditMode;
  document.body.classList.toggle('read-only-mode', !isEditMode);
  const btn = document.getElementById('editToggleBtn');
  document.getElementById('mainTitle').contentEditable = isEditMode;
  document.getElementById('mainSubtitle').contentEditable = isEditMode;

  if(isEditMode) { btn.innerHTML = "🔒 Lock"; btn.classList.remove('edit-mode'); }
  else { btn.innerHTML = "✏️ Unlock"; btn.classList.add('edit-mode'); saveData(); }

  const activeTab = document.querySelector('.app-tab-btn.active').innerText;
  if(activeTab.includes('Transport')) buildTransportTab();
  if(activeTab.includes('Accommodation')) buildAccomTab();
  if(activeTab.includes('Packing')) buildPackingTab();
}

function switchTab(tabId, btnElement) {
  document.querySelectorAll('.tab-pane').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.app-tab-btn').forEach(el => el.classList.remove('active'));
  document.getElementById('tab-' + tabId).classList.add('active');
  btnElement.classList.add('active');

  if (tabId === 'transport') buildTransportTab();
  if (tabId === 'accom') buildAccomTab();
  if (tabId === 'budget') buildBudgetTab();
  if (tabId === 'packing') buildPackingTab();
}

function toggleLeg(headerEl) { headerEl.parentElement.classList.toggle('collapsed'); }

function toggleCard(bar) { bar.parentElement.classList.toggle('open'); }

let allExpanded = false;
let allLegsExpanded = true;

function toggleAllDays() {
  allExpanded = !allExpanded;
  document.querySelectorAll('.day-card').forEach(c => c.classList.toggle('open', allExpanded));
  if (allExpanded) {
    allLegsExpanded = true;
    document.querySelectorAll('.leg').forEach(l => l.classList.remove('collapsed'));
    document.getElementById('expandAllLegs').textContent = '▲ Collapse all legs';
  }
  document.getElementById('expandAll').textContent = allExpanded ? '▲ Collapse all days' : '▼ Expand all days';
}

function toggleAllLegs() {
  allLegsExpanded = !allLegsExpanded;
  document.querySelectorAll('.leg').forEach(l => l.classList.toggle('collapsed', !allLegsExpanded));
  document.getElementById('expandAllLegs').textContent = allLegsExpanded ? '▲ Collapse all legs' : '▼ Expand all legs';
}

function printPage(mode) {
  if (mode === 'detailed') {
    document.querySelectorAll('.day-card').forEach(c => c.classList.add('open'));
    document.querySelectorAll('.leg').forEach(l => l.classList.remove('collapsed'));
  }
  document.body.className = isFunMode ? 'fun-mode' : '';
  document.body.classList.add('print-' + mode);
  window.print();
  setTimeout(() => { document.body.className = isFunMode ? 'fun-mode' : ''; if(!isEditMode) document.body.classList.add('read-only-mode'); }, 1000);
}

document.getElementById('mainTitle').addEventListener('blur', function() { titleData.title = this.innerText; saveData(); });
document.getElementById('mainSubtitle').addEventListener('blur', function() { titleData.subtitle = this.innerText; saveData(); });

function updateData(legIdx, key, val) { appData[legIdx][key] = val; saveData(); }

function updateDayData(legIdx, dayIdx, key, val) {
  appData[legIdx].days[dayIdx][key] = val;
  saveData();
  if (key === 'date') { sortLegs(); }
}

function sortLegs() {
  appData.sort((a, b) => {
    if (!a.days || a.days.length === 0) return 1;
    if (!b.days || b.days.length === 0) return -1;
    let dA = new Date(a.days[0].date + " 2026").getTime();
    let dB = new Date(b.days[0].date + " 2026").getTime();
    if(isNaN(dA)) dA = 0;
    if(isNaN(dB)) dB = 0;
    return dA - dB;
  });
  saveData(false);
  buildNav();
  buildItinerary();
}

const navObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const id = entry.target.id.replace('leg-', '');
      document.querySelectorAll('.nav-btn').forEach(b => {
        const leg = appData.find(l => l.id === id);
        const isActive = b.dataset.leg === id;
        b.classList.toggle('active', isActive);
        b.style.borderBottomColor = isActive && leg ? leg.colour : 'transparent';
      });
    }
  });
}, { threshold: 0.15 });

function reObserveLegs() {
  navObserver.disconnect();
  document.querySelectorAll('.leg').forEach(el => navObserver.observe(el));
}
