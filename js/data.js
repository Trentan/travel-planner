let appData = [];
let packingData = [];
let leaveHomeData = [];
let titleData = { title: "✈ New Trip Plan", subtitle: "Click here to add your trip subtitle/description" };
let currentFileName = "Default Template";

function initData() {
  const saved = localStorage.getItem('travelApp_v2026_template');
  if (saved) {
    appData = JSON.parse(saved);
    appData.forEach(leg => {
      if (!leg.legTips) {
        leg.legTips = [];
        leg.days.forEach(day => {
          if (day.tips && day.tips.length > 0) leg.legTips.push(...day.tips);
          delete day.tips;
        });
      }
      if (leg.cityRun && leg.cityRun.length > 0 && typeof leg.cityRun[0] === 'string') {
        leg.cityRun = leg.cityRun.map(r => ({ title: r, estTime: '1 hr', estCost: '0', assignedDayIdx: null }));
      }
      leg.days.forEach(day => {
        if(day.activityItems) {
          day.activityItems.forEach(act => {
            if (act.time === undefined) act.time = "1 hr";
          });
        }
      });
    });
  }
  else { appData = JSON.parse(JSON.stringify(DEFAULT_DATA)); }

  const savedPacking = localStorage.getItem('travelApp_packing_v3');
  if (savedPacking) { packingData = JSON.parse(savedPacking); }
  else { packingData = JSON.parse(JSON.stringify(DEFAULT_PACKING)); }

  const savedLeaveHome = localStorage.getItem('travelApp_leavehome_v3');
  if (savedLeaveHome) { leaveHomeData = JSON.parse(savedLeaveHome); }
  else { leaveHomeData = JSON.parse(JSON.stringify(DEFAULT_LEAVE_HOME)); }

  const savedMeta = localStorage.getItem('travelApp_meta_template');
  if (savedMeta) { titleData = JSON.parse(savedMeta); }

  const savedFile = localStorage.getItem('travelApp_filename_v2026');
  if (savedFile) { currentFileName = savedFile; }

  document.getElementById('mainTitle').innerText = titleData.title;
  document.getElementById('mainSubtitle').innerText = titleData.subtitle;
  document.getElementById('activeFileDisplay').innerText = "📂 " + currentFileName;

  saveData(false);
}

function saveData(showTick = true) {
  titleData.title = document.getElementById('mainTitle').innerText;
  titleData.subtitle = document.getElementById('mainSubtitle').innerText;
  localStorage.setItem('travelApp_meta_template', JSON.stringify(titleData));
  localStorage.setItem('travelApp_v2026_template', JSON.stringify(appData));
  localStorage.setItem('travelApp_packing_v3', JSON.stringify(packingData));
  localStorage.setItem('travelApp_leavehome_v3', JSON.stringify(leaveHomeData));

  if(showTick) {
    const status = document.getElementById('saveStatus');
    status.textContent = "✓ Saved";
    setTimeout(() => status.textContent = "", 2000);
  }
}

function resetData() {
  if(confirm("Reset all edits back to the default template? This will wipe current data.")) {
    localStorage.removeItem('travelApp_v2026_template');
    localStorage.removeItem('travelApp_packing_v3');
    localStorage.removeItem('travelApp_leavehome_v3');
    localStorage.removeItem('travelApp_meta_template');
    localStorage.removeItem('travelApp_filename_v2026');
    location.reload();
  }
}

function migratePacking(data) {
  if (!Array.isArray(data) || data.length === 0) return null;
  const isOldFormat = data[0].hasOwnProperty('title') && !data[0].hasOwnProperty('areaName');
  if (!isOldFormat) return data;
  const areas = [
    { areaName: '🚶 Walk-on Gear (Wear onto plane)', areaColor: '#E67E22', categories: [] },
    { areaName: '🧳 Carry-on Packed Bag (Main Luggage)', areaColor: '#2980B9', categories: [] },
    { areaName: '🎒 Personal Item Bag (Under Seat)', areaColor: '#8E44AD', categories: [] }
  ];
  data.forEach(cat => {
    const t = cat.title || '';
    const entry = { title: t.replace(/^(🧳|🎒|🚶|💧)\s*/,'').replace(/^(Carry-On: |Personal Item: )/,''), items: cat.items || [] };
    if (t.includes('Walk-on') || t.includes('Plane Outfit')) { areas[0].categories.push(entry); }
    else if (t.includes('Personal Item') || t.includes('Flight Items') || t.includes('Tech') || t.includes('Essentials')) { areas[2].categories.push(entry); }
    else { areas[1].categories.push(entry); }
  });
  return areas.filter(a => a.categories.length > 0);
}

function exportJSON() {
  saveData(false);
  const exportObj = { meta: titleData, itinerary: appData, packing: packingData, leaveHome: leaveHomeData };
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportObj, null, 2));
  const downloadAnchorNode = document.createElement('a');
  downloadAnchorNode.setAttribute("href", dataStr);

  let dlName = currentFileName;
  if(dlName === "Default Template") dlName = "travel_planner_backup.json";

  downloadAnchorNode.setAttribute("download", dlName);
  document.body.appendChild(downloadAnchorNode);
  downloadAnchorNode.click();
  downloadAnchorNode.remove();
}

function importJSON(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const importedData = JSON.parse(e.target.result);
      if (importedData.itinerary && Array.isArray(importedData.itinerary)) {
        appData = importedData.itinerary;

        appData.forEach(leg => {
          if (!leg.legTips) {
            leg.legTips = [];
            leg.days.forEach(day => {
              if (day.tips && day.tips.length > 0) leg.legTips.push(...day.tips);
              delete day.tips;
            });
          }
          if (leg.cityRun && leg.cityRun.length > 0 && typeof leg.cityRun[0] === 'string') {
            leg.cityRun = leg.cityRun.map(r => ({ title: r, estTime: '1 hr', estCost: '0', assignedDayIdx: null }));
          }
        });

        if (importedData.packing) {
          const migrated = migratePacking(importedData.packing);
          packingData = migrated || packingData;
        }
        if (importedData.leaveHome) leaveHomeData = importedData.leaveHome;
        if (importedData.meta) {
          titleData = importedData.meta;
        }

        currentFileName = file.name;
        localStorage.setItem('travelApp_filename_v2026', currentFileName);

        saveData(false);
        location.reload();
      } else { alert("Invalid JSON format."); }
    } catch (err) { alert("Error parsing JSON file: " + err.message); }
  };
  reader.readAsText(file);
}
