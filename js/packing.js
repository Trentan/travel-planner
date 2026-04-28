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

function toggleLeaveHomeItem(e, iIdx) { leaveHomeData[iIdx].done = e.target.checked; saveData(); buildPackingTab(); }
function updateLeaveHomeItem(iIdx, text) { if(!text.trim()) { leaveHomeData.splice(iIdx, 1); } else { leaveHomeData[iIdx].text = text; } saveData(); buildPackingTab(); }
function deleteLeaveHomeItem(iIdx) { leaveHomeData.splice(iIdx, 1); saveData(); buildPackingTab(); }
function addLeaveHomeItem() { leaveHomeData.push({text:"New task...", done:false}); saveData(); buildPackingTab(); }

function togglePackingItem(e, aIdx, cIdx, iIdx) { packingData[aIdx].categories[cIdx].items[iIdx].done = e.target.checked; saveData(); buildPackingTab(); }
function updatePackingItem(aIdx, cIdx, iIdx, text) { if(!text.trim()) { packingData[aIdx].categories[cIdx].items.splice(iIdx, 1); } else { packingData[aIdx].categories[cIdx].items[iIdx].text = text; } saveData(); buildPackingTab(); }
function updatePackingCat(aIdx, cIdx, text) { packingData[aIdx].categories[cIdx].title = text; saveData(); }
function updatePackingAreaName(aIdx, text) { packingData[aIdx].areaName = text; saveData(); }
function deletePackingItem(aIdx, cIdx, iIdx) { packingData[aIdx].categories[cIdx].items.splice(iIdx, 1); saveData(); buildPackingTab(); }
function addPackingItem(aIdx, cIdx) { packingData[aIdx].categories[cIdx].items.push({text:"New item...", done:false}); saveData(); buildPackingTab(); }
function addPackingCat(aIdx) { packingData[aIdx].categories.push({title:"New Category Block", items:[{text:"New item...", done:false}]}); saveData(); buildPackingTab(); }

// Expose packing guide functions to window scope
window.isActiveGuide = isActiveGuide;
window.toggleGuidePanel = toggleGuidePanel;
window.collapseAllGuides = collapseAllGuides;
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
