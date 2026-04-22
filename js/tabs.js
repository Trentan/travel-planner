function buildTransportTab() {
  const container = document.getElementById('transport-table-container');
  let html = `<div class="data-table-wrapper"><table class="data-table"><thead><tr><th>Date</th><th>Route</th><th>Provider / Details</th><th>Est. Cost</th></tr></thead><tbody>`;
  let hasItems = false;
  appData.forEach((leg, lIdx) => {
    leg.days.forEach((day, dIdx) => {
      if (day.transportItems) {
        day.transportItems.forEach((item, iIdx) => {
          if (item.text === "—" || item.text.trim() === "") return;
          hasItems = true;
          html += `<tr style="border-left-color: ${leg.colour}"><td class="date-col">${day.day} ${day.date}</td><td class="route-col">${day.from} → ${day.to}</td><td><span contenteditable="${isEditMode}" onblur="updateDayItemText(${lIdx}, ${dIdx}, 'transportItems', ${iIdx}, this.innerText, true)">${item.text}</span></td><td class="budget-field" style="width:100px; display:table-cell;">$<span contenteditable="${isEditMode}" onblur="updateDayItemCost(${lIdx}, ${dIdx}, 'transportItems', ${iIdx}, this.innerText, true)">${item.cost}</span></td></tr>`;
        });
      }
    });
  });
  html += `</tbody></table></div>`;
  if (!hasItems) html = `<div class="empty-placeholder">No transport details found in the itinerary yet.</div>`;
  container.innerHTML = html;
}

function buildAccomTab() {
  const container = document.getElementById('accom-table-container');
  let html = `<div class="data-table-wrapper"><table class="data-table"><thead><tr><th>Date</th><th>City</th><th>Accommodation Details</th><th>Est. Cost</th></tr></thead><tbody>`;
  let hasItems = false;
  appData.forEach((leg, lIdx) => {
    leg.days.forEach((day, dIdx) => {
      if (day.accomItems) {
        day.accomItems.forEach((item, iIdx) => {
          if (item.text === "—" || item.text.trim() === "") return;
          hasItems = true;
          html += `<tr style="border-left-color: ${leg.colour}"><td class="date-col">${day.day} ${day.date}</td><td class="route-col">${day.to}</td><td><span style="font-weight:600;" contenteditable="${isEditMode}" onblur="updateDayItemText(${lIdx}, ${dIdx}, 'accomItems', ${iIdx}, this.innerText, true)">${item.text}</span></td><td class="budget-field" style="width:100px; display:table-cell;">$<span contenteditable="${isEditMode}" onblur="updateDayItemCost(${lIdx}, ${dIdx}, 'accomItems', ${iIdx}, this.innerText, true)">${item.cost}</span></td></tr>`;
        });
      }
    });
  });
  html += `</tbody></table></div>`;
  if (!hasItems) html = `<div class="empty-placeholder">No accommodation details found in the itinerary yet.</div>`;
  container.innerHTML = html;
}

function buildPackingTab() {
  const guidesContainer = document.getElementById('guides-container');
  const listsContainer = document.getElementById('packing-areas-container');

  let guidesHTML = `
    <details class="guide-details" open>
      <summary class="guide-summary red-alert">🏠 Before Leaving Home</summary>
      <div class="guide-content">
        ${leaveHomeData.map((item, iIdx) => `
          <div class="packing-item">
            <button class="del-btn" title="Delete Item" onclick="deleteLeaveHomeItem(${iIdx})">×</button>
            <input type="checkbox" ${item.done ? 'checked' : ''} onchange="toggleLeaveHomeItem(event, ${iIdx})">
            <span contenteditable="${isEditMode}" onblur="updateLeaveHomeItem(${iIdx}, this.innerText)" style="${item.done ? 'text-decoration:line-through;opacity:0.6;' : ''}">${item.text}</span>
          </div>
        `).join('')}
        <button class="add-btn" style="width:auto; margin-top:10px; border-color:#E74C3C; color:#C0392B;" onclick="addLeaveHomeItem()">+ Add Home Task</button>
      </div>
    </details>

    <details class="guide-details">
      <summary class="guide-summary">🧼 Hotel Sink Washing Guide</summary>
      <div class="guide-content">
        <h4>How to Do Laundry in Your Hotel Room:</h4>
        <ol>
          <li><strong>Clean Your Sink:</strong> Start fresh by giving your sink a quick wash with soap and water.</li>
          <li><strong>Fill With Water:</strong> Plug the drain and fill the sink with lukewarm water.</li>
          <li><strong>Add Detergent:</strong> Drop in a laundry detergent sheet. Swish it around until it dissolves.</li>
          <li><strong>Wash Your Clothes:</strong> Add your clothes to the sink and give them a quick swish to soak (5 to 15 minutes).</li>
          <li><strong>Agitate:</strong> Gently agitate and move the clothes around to release dirt and sweat.</li>
          <li><strong>Drain & Rinse:</strong> Squeeze out the soapy water, drain, refill with clean water, swish again.</li>
          <li><strong>Remove Excess Water:</strong> Fold clothes into a compact "brick" and press gently to release water (don't wring).</li>
          <li><strong>The Towel Burrito Method:</strong> Lay a clean towel on the floor, place clothing flat on top, roll it up, and step on the towel to squeeze out extra moisture.</li>
          <li><strong>Hang to Dry:</strong> Drape over clothes hangers or the shower rod.</li>
        </ol>
        <div class="guide-tip"><strong>👉 Pro Tip:</strong> Rolling clothes in a microfiber towel works even better than hotel towels.</div>
      </div>
    </details>

    <details class="guide-details">
      <summary class="guide-summary">💡 Example Capsule Wardrobe Prompt</summary>
      <div class="guide-content">
        <p style="font-style: italic; background: #f9f9f9; padding: 10px; border-left: 3px solid #ccc;">
          "I'm going on a 14-day trip to Europe in June and want to pack carry-on only. I want to create a minimalist capsule wardrobe with as few pieces as possible that will give me 14 different outfits (can be achieved with a 3x3 method - 3 shirts, 3 bottoms, 3 layers). Please build me a packing list by telling me the number of tops, bottoms and layering pieces that can be mixed and matched. My style is classic and practical with neutral colors. I want outfits that are comfortable and stylish for activities like sightseeing, casual dinners, and lots of walking. No more than 2 shoes (formal and sports). I need outfits for touring ports, lounging, and a couple of dressy dinners + I will need swimmers for asia or any hotel pools."
        </p>
        <h4>Example Output Breakdown:</h4>
        <ul>
          <li><strong>Main bag:</strong> Hoodie, Business long sleeve thin wool shirt, Nice dress shirt, Plain everday wool short sleeve shirt, Business short sleeve shirt, Dress Work style pants, Dress shorts, 2 activewear shirts, 2 activewear shorts, Underwear x 3, Socks 2 x sports, 2 x black, Swimmers x 2, Thongs/Sandals, Toiletry bag.</li>
          <li><strong>Wear onto plane:</strong> Underwear, Jeans, Belt, Sports shoes, Socks, Activewear shirt, Hoodie, Sunglasses.</li>
          <li><strong>Personal bag:</strong> Fanny pack/cross body bag, Charging cables, Wireless mouse/keyboard, Travel phone holder, Travel kit, Med Kit, Formal shoes, Broad Rim Hat, Microfibre towel, Pillow case.</li>
        </ul>
      </div>
    </details>
  `;
  guidesContainer.innerHTML = guidesHTML;

  let areasHTML = '';
  packingData.forEach((area, aIdx) => {
    areasHTML += `
      <div style="margin-bottom: 3.5rem;">
        <h2 style="font-family:'Playfair Display', serif; color:${area.areaColor}; border-bottom: 2px solid ${area.areaColor}; padding-bottom:0.5rem; margin-bottom:1.5rem;">
          <span contenteditable="${isEditMode}" onblur="updatePackingAreaName(${aIdx}, this.innerText)">${area.areaName}</span>
        </h2>
        <div class="packing-grid">
          ${area.categories.map((cat, cIdx) => `
            <div class="packing-card">
              <h3><span contenteditable="${isEditMode}" onblur="updatePackingCat(${aIdx}, ${cIdx}, this.innerText)">${cat.title}</span></h3>
              ${cat.items.map((item, iIdx) => `
                <div class="packing-item">
                  <button class="del-btn" title="Delete Item" onclick="deletePackingItem(${aIdx}, ${cIdx}, ${iIdx})">×</button>
                  <input type="checkbox" ${item.done ? 'checked' : ''} onchange="togglePackingItem(event, ${aIdx}, ${cIdx}, ${iIdx})">
                  <span contenteditable="${isEditMode}" onblur="updatePackingItem(${aIdx}, ${cIdx}, ${iIdx}, this.innerText)" style="${item.done ? 'text-decoration:line-through;opacity:0.6;' : ''}">${item.text}</span>
                </div>
              `).join('')}
              <button class="add-btn" onclick="addPackingItem(${aIdx}, ${cIdx})">+ Add Item</button>
            </div>
          `).join('')}
          <div class="packing-card" style="border: 2px dashed var(--border); display:flex; align-items:center; justify-content:center; cursor:pointer;" onclick="addPackingCat(${aIdx})">
            <span style="color:var(--muted); font-weight:500;">+ Add New Category Block</span>
          </div>
        </div>
      </div>`;
  });

  listsContainer.innerHTML = areasHTML;
}

function buildBudgetTab() {
  const container = document.getElementById('budget-table-container');
  const kpiContainer = document.getElementById('budget-kpi-container');
  let totalTrans = 0, totalAccom = 0, totalAct = 0; let legBreakdown = [];

  appData.forEach(leg => {
    let legTrans = 0, legAccom = 0, legAct = 0;
    leg.days.forEach(day => {
      (day.transportItems || []).forEach(i => legTrans += parseCost(i.cost));
      (day.accomItems || []).forEach(i => legAccom += parseCost(i.cost));
      (day.activityItems || []).forEach(i => legAct += parseCost(i.cost));
    });
    const legTotal = legTrans + legAccom + legAct;
    if (legTotal > 0) {
      legBreakdown.push({ label: leg.label, colour: leg.colour, trans: legTrans, accom: legAccom, act: legAct, total: legTotal });
      totalTrans += legTrans; totalAccom += legAccom; totalAct += legAct;
    }
  });
  const grandTotal = totalTrans + totalAccom + totalAct;

  kpiContainer.innerHTML = `
    <div class="budget-kpi"><h3>Transport</h3><div class="amount">$${totalTrans}</div></div>
    <div class="budget-kpi"><h3>Accommodation</h3><div class="amount">$${totalAccom}</div></div>
    <div class="budget-kpi"><h3>Activities</h3><div class="amount">$${totalAct}</div></div>
    <div class="budget-kpi grand-total"><h3>Grand Total</h3><div class="amount">$${grandTotal}</div></div>
  `;

  let html = `<div class="data-table-wrapper"><table class="data-table"><thead><tr><th>Trip Leg</th><th>Transport</th><th>Accommodation</th><th>Activities</th><th>Leg Total</th></tr></thead><tbody>`;
  legBreakdown.forEach(l => {
    html += `<tr style="border-left-color: ${l.colour}"><td style="font-weight:600;">${l.label}</td><td>$${l.trans}</td><td>$${l.accom}</td><td>$${l.act}</td><td style="font-family:'DM Mono',monospace; font-weight:600;">$${l.total}</td></tr>`;
  });
  html += `</tbody></table></div>`;
  container.innerHTML = html;
}
