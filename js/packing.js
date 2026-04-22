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
