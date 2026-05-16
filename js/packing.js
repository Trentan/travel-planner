// Active guide panel state (stored globally)
let activeGuidePanel = null;

function isActiveGuide(panel) {
  return activeGuidePanel === panel;
}

function toggleGuidePanel(panel) {
  if (activeGuidePanel === panel) {
    activeGuidePanel = null;
  } else {
    activeGuidePanel = panel;
  }
  buildPackingTab();
}

function collapseAllGuides() {
  activeGuidePanel = null;
  buildPackingTab();
}

function restorePackingToDefault() {
  if (!confirm('Restore all packing data back to the default template? This will wipe all packing categories, checklist edits, and Before Leaving Home changes.')) return;

  packingData = JSON.parse(JSON.stringify(DEFAULT_PACKING));
  leaveHomeData = JSON.parse(JSON.stringify(DEFAULT_LEAVE_HOME));
  activeGuidePanel = null;
  saveData();
  buildPackingTab();
}

function isLeaveHomeSection(item) {
  return item && item.kind === 'section';
}

function countLeaveHomeTasks() {
  return leaveHomeData.filter(item => !isLeaveHomeSection(item)).length;
}

function countCompletedLeaveHomeTasks() {
  return leaveHomeData.filter(item => !isLeaveHomeSection(item) && item.done).length;
}

function calculatePackingAreaProgress(aIdx) {
  const area = packingData[aIdx];
  let total = 0;
  let done = 0;
  area.categories.forEach(cat => {
    cat.items.forEach(item => {
      total++;
      if (item.done) done++;
    });
  });
  const percent = total ? Math.round((done / total) * 100) : 0;
  return { total, done, percent };
}

function renderPackingAreaProgress(aIdx) {
  const area = packingData[aIdx];
  const { total, done, percent } = calculatePackingAreaProgress(aIdx);
  if (total === 0) return '';

  return `
    <div class="packing-area-progress" style="--area-color: ${area.areaColor || 'var(--accent)'}">
      <div class="packing-area-progress-header">
        <span class="packing-area-progress-title">${area.areaName}</span>
        <span class="packing-area-progress-info">${done}/${total}</span>
      </div>
      <div class="packing-area-progress-bar">
        <span style="width: ${percent}%"></span>
      </div>
    </div>
  `;
}

function renderPackingGlobalProgress() {
  if (!packingData || packingData.length === 0) return '';
  
  let html = '<div class="packing-progress-grid">';
  packingData.forEach((_, aIdx) => {
    html += renderPackingAreaProgress(aIdx);
  });
  html += '</div>';
  return html;
}

function toggleLeaveHomeItem(e, iIdx) {
  if (isLeaveHomeSection(leaveHomeData[iIdx])) return;
  leaveHomeData[iIdx].done = e.target.checked;
  saveData();
  buildPackingTab();
}

function updateLeaveHomeItem(iIdx, text) {
  const item = leaveHomeData[iIdx];
  if (isLeaveHomeSection(item)) return;
  if (!text.trim()) {
    leaveHomeData.splice(iIdx, 1);
  } else {
    leaveHomeData[iIdx].text = text;
  }
  saveData();
  buildPackingTab();
}

function deleteLeaveHomeItem(iIdx) {
  leaveHomeData.splice(iIdx, 1);
  saveData();
  buildPackingTab();
}

function addLeaveHomeItem() {
  leaveHomeData.push({ text: 'New task...', done: false });
  saveData();
  buildPackingTab();
}

function togglePackingItem(e, aIdx, cIdx, iIdx) {
  packingData[aIdx].categories[cIdx].items[iIdx].done = e.target.checked;
  saveData();
  buildPackingTab();
}

function updatePackingItem(aIdx, cIdx, iIdx, text) {
  if (!text.trim()) {
    packingData[aIdx].categories[cIdx].items.splice(iIdx, 1);
  } else {
    packingData[aIdx].categories[cIdx].items[iIdx].text = text;
  }
  saveData();
  buildPackingTab();
}

function updatePackingCat(aIdx, cIdx, text) {
  packingData[aIdx].categories[cIdx].title = text;
  saveData();
}

function updatePackingAreaName(aIdx, text) {
  packingData[aIdx].areaName = text;
  saveData();
}

function deletePackingItem(aIdx, cIdx, iIdx) {
  packingData[aIdx].categories[cIdx].items.splice(iIdx, 1);
  saveData();
  buildPackingTab();
}

function addPackingItem(aIdx, cIdx) {
  packingData[aIdx].categories[cIdx].items.push({ text: 'New item...', done: false });
  saveData();
  buildPackingTab();
}

function addPackingCat(aIdx) {
  packingData[aIdx].categories.push({ title: 'New Category Block', items: [{ text: 'New item...', done: false }] });
  saveData();
  buildPackingTab();
}

function deletePackingCat(aIdx, cIdx) {
  if (!confirm('Delete this category block?')) return;
  packingData[aIdx].categories.splice(cIdx, 1);
  saveData();
  buildPackingTab();
}

function renderLeaveHomeItems() {
  return leaveHomeData.map((item, iIdx) => {
    if (isLeaveHomeSection(item)) {
      return `<div class="leave-home-section-heading">${item.text}</div>`;
    }

    return `
      <div class="packing-item leave-home-item">
        <button class="del-btn" title="Delete Item" onclick="deleteLeaveHomeItem(${iIdx})">×</button>
        <input type="checkbox" ${item.done ? 'checked' : ''} onchange="toggleLeaveHomeItem(event, ${iIdx})">
        <span contenteditable="${isEditMode}" onblur="updateLeaveHomeItem(${iIdx}, this.innerText)" style="${item.done ? 'text-decoration:line-through;opacity:0.6;' : ''}">${item.text}</span>
      </div>
    `;
  }).join('');
}

function renderPackingGuidePanel() {
  if (activeGuidePanel === 'leaveHome') {
    const totalTasks = countLeaveHomeTasks();
    const completedTasks = countCompletedLeaveHomeTasks();
    const progressWidth = totalTasks ? (completedTasks / totalTasks) * 100 : 0;

    return `
      <div class="packing-guide-panel guide-panel">
        <div class="guide-panel-header">
          <div>
            <h4>Before Leaving Home</h4>
            <p class="guide-panel-subtitle">${completedTasks} of ${totalTasks} tasks checked off</p>
          </div>
        </div>
        <div class="guide-panel-content leave-home-guide-content">
          <div class="leave-home-progress">
            <div class="leave-home-progress-bar">
              <span style="width:${progressWidth}%"></span>
            </div>
          </div>
          <div class="leave-home-list">
            ${renderLeaveHomeItems()}
          </div>
          <button class="add-btn leave-home-add-btn" onclick="addLeaveHomeItem()">+ Add Home Task</button>
        </div>
      </div>
    `;
  }

  if (activeGuidePanel === 'sink') {
    return `
      <div class="packing-guide-panel guide-panel">
        <div class="guide-panel-header">
          <h4>Hotel Sink Washing Guide</h4>
        </div>
        <div class="guide-panel-content">
          <h4>How to Do Laundry in Your Hotel Room:</h4>
          <ol class="guide-steps-list">
            <li><strong>Clean your sink:</strong> Start fresh by giving your sink a quick wash with soap and water.</li>
            <li><strong>Fill with water:</strong> Plug the drain and fill the sink with lukewarm water.</li>
            <li><strong>Add detergent:</strong> Drop in a laundry detergent sheet. Swish it around until it dissolves.</li>
            <li><strong>Wash your clothes:</strong> Add your clothes to the sink and give them a quick swish to soak.</li>
            <li><strong>Agitate:</strong> Gently move the clothes around to release dirt and sweat.</li>
            <li><strong>Drain and rinse:</strong> Squeeze out the soapy water, drain, refill with clean water, swish again.</li>
            <li><strong>Remove excess water:</strong> Fold clothes into a compact brick and press gently to release water.</li>
            <li><strong>Towel burrito:</strong> Roll clothing in a clean towel and step on it to squeeze out moisture.</li>
            <li><strong>Hang to dry:</strong> Drape over clothes hangers or the shower rod.</li>
          </ol>
          <div class="guide-tip"><strong>Tip:</strong> A microfiber towel works better than a hotel towel.</div>
        </div>
      </div>
    `;
  }

  if (activeGuidePanel === 'capsule') {
    return `
      <div class="packing-guide-panel guide-panel">
        <div class="guide-panel-header">
          <h4>Example Capsule Prompt</h4>
        </div>
        <div class="guide-panel-content">
          <p style="font-style: italic; background: #f8f6f1; padding: 12px; border-left: 3px solid #cfc6b8;">
            "I'm going on a 14-day trip to Europe in June and want to pack carry-on only. I want to create a minimalist capsule wardrobe with as few pieces as possible that will give me 14 different outfits. Please build me a packing list with tops, bottoms, and layering pieces that can be mixed and matched. My style is classic and practical with neutral colors."
          </p>
          <h4>Example output breakdown:</h4>
          <ul class="guide-bullets">
            <li><strong>Main bag:</strong> core clothing, toiletries, shoes, and backup essentials.</li>
            <li><strong>Wear onto plane:</strong> the heaviest items and airport-ready layers.</li>
            <li><strong>Personal bag:</strong> documents, tech, meds, and in-flight comfort items.</li>
          </ul>
        </div>
      </div>
    `;
  }

  return '';
}

function renderPackingGuidesShell() {
  return `
    <div class="packing-guides-shell">
      <div class="packing-guides-toolbar">
        <div class="packing-guides-buttons">
          <button type="button" class="packing-guide-btn ${isActiveGuide('leaveHome') ? 'active' : ''}" onclick="toggleGuidePanel('leaveHome')">Before Leaving Home</button>
          <button type="button" class="packing-guide-btn ${isActiveGuide('sink') ? 'active' : ''}" onclick="toggleGuidePanel('sink')">Hotel Sink Washing</button>
          <button type="button" class="packing-guide-btn ${isActiveGuide('capsule') ? 'active' : ''}" onclick="toggleGuidePanel('capsule')">Capsule Wardrobe Prompt</button>
        </div>
      </div>
      ${renderPackingGuidePanel()}
    </div>
  `;
}

// Expose packing guide functions to window scope
window.isActiveGuide = isActiveGuide;
window.toggleGuidePanel = toggleGuidePanel;
window.collapseAllGuides = collapseAllGuides;
window.restorePackingToDefault = restorePackingToDefault;
window.isLeaveHomeSection = isLeaveHomeSection;
window.toggleLeaveHomeItem = toggleLeaveHomeItem;
window.updateLeaveHomeItem = updateLeaveHomeItem;
window.deleteLeaveHomeItem = deleteLeaveHomeItem;
window.addLeaveHomeItem = addLeaveHomeItem;
window.togglePackingItem = togglePackingItem;
window.updatePackingItem = updatePackingItem;
window.updatePackingCat = updatePackingCat;
window.updatePackingAreaName = updatePackingAreaName;
window.deletePackingItem = deletePackingItem;
window.addPackingItem = addPackingItem;
window.addPackingCat = addPackingCat;
window.deletePackingCat = deletePackingCat;
window.renderPackingGuidePanel = renderPackingGuidePanel;
window.renderPackingGuidesShell = renderPackingGuidesShell;
window.renderPackingGlobalProgress = renderPackingGlobalProgress;
