function buildCompactItinerary() {
  const container = document.getElementById('itinerary');
  container.innerHTML = '';

  appData.forEach((leg, legIndex) => {
    const section = document.createElement('div');
    section.className = 'leg';
    section.id = 'leg-' + leg.id;

    const daysCount = leg.days.length;
    const nightLabel = `${daysCount} night${daysCount !== 1 ? 's' : ''}`;

    let html = `
      <div class="leg-header" style="background:${leg.colour}; cursor:default;">
        <div style="display:flex; align-items:center; justify-content:space-between;">
          <div>
            <h2 style="margin:0; font-size:14px; cursor:default;">${leg.label}</h2>
            <span style="font-size:11px; margin-left:10px;">${nightLabel}</span>
          </div>
        </div>
      </div>
    `;

    html += '<div style="padding:8px;">';
    leg.days.forEach((day, dayIdx) => {
      const dayTotal = getDayTotal(day);
      html += `<div style="border-left:4px solid ${leg.colour}; margin:6px 0; padding:6px; background:#fafafa;">
        <div style="display:flex; gap:6px; align-items:center; font-size:11px;">
          <input type="checkbox" ${day.completed ? 'checked' : ''}
            onchange="toggleDayCompleted(event, ${legIndex}, ${dayIdx})"
            style="width:14px; height:14px; accent-color:#27AE60;">
          <span style="font-weight:600;">${day.day} ${day.date}</span>
          <span style="font-size:10px;">${day.from} → ${day.to}</span>
          <span style="font-size:9px; color:#666; flex:1;">${day.desc || ''}</span>
          ${dayTotal ? `<span style="font-weight:600; font-family:monospace;">${dayTotal}</span>` : ''}
        </div>

        <div style="display:flex; gap:8px; margin-top:4px; font-size:10px;">`;

      if ((day.transportItems?.length || 0) > 0) {
        html += '<div style="flex:1;"><strong>Bus</strong> ';
        html += day.transportItems.map(item => {
          const status = item.status || 'pending';
          const statusIcon = status === 'confirmed' ? '✓' : '⏳';
          return `${item.text}${item.cost ? ` ($${item.cost})` : ''} <span style="color:${status === 'confirmed' ? '#27AE60' : '#E67E22'}">${statusIcon}</span>`;
        }).join(', ');
        html += '</div>';
      }

      if ((day.accomItems?.length || 0) > 0) {
        html += '<div style="flex:1;"><strong>Hotel</strong> ';
        html += day.accomItems.map(item => {
          const status = item.status || 'pending';
          const statusIcon = status === 'confirmed' ? '✓' : '⏳';
          return `${item.text}${item.cost ? ` ($${item.cost})` : ''} <span style="color:${status === 'confirmed' ? '#27AE60' : '#E67E22'}">${statusIcon}</span>`;
        }).join(', ');
        html += '</div>';
      }

      html += '</div>';

      if ((day.activityItems?.length || 0) > 0) {
        html += '<div style="margin-top:3px; font-size:10px;"><strong>Target</strong> ';
        html += day.activityItems.map((item, itemIdx) => {
          const doneStyle = item.done ? 'text-decoration:line-through; opacity:0.7;' : '';
          return `<span style="margin-right:12px; ${doneStyle}">
            <input type="checkbox" ${item.done ? 'checked' : ''}
              onchange="toggleActivityCompleted(event, ${legIndex}, ${dayIdx}, ${itemIdx})"
              style="width:12px; height:12px; accent-color:#27AE60; margin-right:4px;">
            ${item.text}${item.cost ? ` ($${item.cost})` : ''}
          </span>`;
        }).join('');
        html += '</div>';
      }

      html += '</div></div>';
    });

    html += '</div>';
    section.innerHTML = html;
    container.appendChild(section);
  });
}

function buildItinerary() {
  if (isCompactView) {
    buildCompactItinerary();
    return;
  }
  const container = document.getElementById('itinerary'); container.innerHTML = '';

  appData.forEach((leg, legIndex) => {
    const section = document.createElement('div'); section.className = 'leg'; section.id = 'leg-' + leg.id;

    const daysCount = leg.days.length;
    const firstAccom = daysCount > 0 && leg.days[0].accomItems && leg.days[0].accomItems.length > 0 ? leg.days[0].accomItems[0].text : "";

    let isTransit = false;
    if (firstAccom.toLowerCase().includes('transit') || firstAccom === '—') {
      isTransit = true;
    } else if (daysCount === 1) {
      const toCity = leg.days[0].to;
      if (!leg.label.includes(toCity) && leg.days[0].from !== toCity) {
        isTransit = true;
      }
    }

    const nightLabel = isTransit ? '✈ Day Transit / Stop' : `${daysCount} night${daysCount !== 1 ? 's' : ''}`;
    const badgeClass = isTransit ? 'leg-night-count badge-transit' : 'leg-night-count';

    const firstDateObj = daysCount > 0 ? leg.days[0] : null;
    const lastDateObj = daysCount > 0 ? leg.days[daysCount - 1] : null;
    const firstDateStr = firstDateObj ? `${firstDateObj.day} ${firstDateObj.date}` : '';
    const lastDateStr = lastDateObj ? `${lastDateObj.day} ${lastDateObj.date}` : '';
    const dateRange = (firstDateStr && lastDateStr && firstDateStr !== lastDateStr) ? `${firstDateStr} – ${lastDateStr}` : firstDateStr;

    const unassigned = (leg.suggestedSights||[]).filter(s => s.assignedDayIdx === null || s.assignedDayIdx === undefined);
    const subtitle = unassigned.length === 0 ? "All suggested sights assigned! 🎉" : `Remaining Ideas: ${unassigned.slice(0, 3).map(s => s.title.split('—')[0].trim()).join(', ')}${unassigned.length > 3 ? '...' : ''}`;

    let html = `
      <div class="leg-header" style="background:${leg.colour}" onclick="toggleLeg(this)">
        <div class="leg-header-top">
          <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
            <h2 contenteditable="${isEditMode}" onclick="event.stopPropagation()" onblur="updateData(${legIndex}, 'label', this.innerText)">${leg.label}</h2>
            <span style="opacity:0.8; font-size:0.9rem; font-family:'DM Mono', monospace;">${dateRange}</span>
          </div>
          <div style="display:flex; align-items:center; gap:10px;">
            <span class="${badgeClass}">${nightLabel}</span>
            ${isEditMode ? `<button class="header-del-btn" title="Delete Leg" onclick="event.stopPropagation(); deleteLeg(${legIndex})">🗑</button>` : ''}
            <span class="leg-chevron">▼</span>
          </div>
        </div>
        <div class="leg-subtitle">${subtitle}</div>
      </div>
      <div class="leg-content">
    `;

  html += `<div class="city-dashboard">
  <div class="city-block city-block-food">
  <div class="city-block city-block-food">
    <h4>🍔 City Food Quests</h4>
    <ul class="food-list">${(leg.cityFood || []).map((f, i) => `<li class="quest-item"><button class="del-btn" title="Delete Food" onclick="deleteFood(${legIndex}, ${i})">×</button><input type="checkbox" ${f.done ? 'checked' : ''} onchange="toggleFoodCompleted(event, ${legIndex}, ${i})"><span contenteditable="${isEditMode}" onblur="updateFoodText(${legIndex}, ${i}, this.innerText)" style="${f.done ? 'text-decoration:line-through;opacity:0.6' : ''}">${f.text}</span></li>`).join('')}</ul>
    <button class="add-btn" onclick="addFood(${legIndex})">+ Add Food</button>
  </div>
  <div class="city-block city-block-tips">
    <h4>💡 City Tips</h4>
    <ul class="tips-list">${(leg.legTips || []).map((t, i) => `<li class="tip-item"><span class="tip-bulb">💡</span><span contenteditable="${isEditMode}" onblur="updateLegTip(${legIndex}, ${i}, this.innerText)">${t}</span><button class="del-btn" title="Delete Tip" onclick="deleteLegTip(${legIndex}, ${i})">×</button></li>`).join('')}</ul>
    <button class="add-btn" onclick="addLegTip(${legIndex})">+ Add Tip</button>
  </div>
  <div class="city-block city-block-activities">
    <h4>📌 Suggested Activities</h4>
    <div class="activities-columns">
      <div class="activity-col">
        <h5>🏃 Running/Fitness</h5>
        <ul class="activity-list">${(leg.cityRun || []).map((r, i) => {
          const isAssigned = r.assignedDayIdx !== null && r.assignedDayIdx !== undefined;
          let isCompleted = false; let dayLabel = '';
          if (isAssigned) {
            dayLabel = leg.days[r.assignedDayIdx].date;
            const matchedActivity = leg.days[r.assignedDayIdx].activityItems.find(a => a.text === r.title);
            if (matchedActivity && matchedActivity.done) isCompleted = true;
          }
          const badgeColor = isCompleted ? '#27AE60' : '#E67E22'; const badgeIcon = isCompleted ? '✓' : '⏳'; const badgeHoverText = isCompleted ? `Completed on ${dayLabel}` : `Scheduled for ${dayLabel}`;
          return `<li class="${isAssigned ? 'assigned-sight' : 'draggable-sight'} activity-item" ${!isAssigned ? `draggable="true" ondragstart="handleDragStart(event, ${legIndex}, 'run', ${i})"` : ''}><button class="del-btn" title="Delete" onclick="deleteRun(${legIndex}, ${i})">×</button>${!isAssigned ? `<span class="drag-handle" title="Drag to assign">⠿</span>` : `<span class="assigned-badge" style="background: ${badgeColor};" title="${badgeHoverText}">${badgeIcon}</span>`}<span contenteditable="${!isAssigned && isEditMode}" onblur="updateRunPool(${legIndex}, ${i}, 'title', this.innerText)" style="${isCompleted ? 'text-decoration:line-through;' : ''}; flex:1;">${r.title}</span><span class="sight-inline-meta">⏱ ${r.estTime} · $${r.estCost}</span></li>`;
        }).join('')}</ul>
        <button class="add-btn" onclick="addRun(${legIndex})">+ Add Run</button>
      </div>
      <div class="activity-col">
        <h5>🏛️ Sights</h5>
        <ul class="activity-list">${(leg.suggestedSights || []).map((s, i) => {
          const isAssigned = s.assignedDayIdx !== null && s.assignedDayIdx !== undefined;
          let isCompleted = false; let dayLabel = '';
          if (isAssigned) {
            dayLabel = leg.days[s.assignedDayIdx].date;
            const matchedActivity = leg.days[s.assignedDayIdx].activityItems.find(a => a.text === s.title);
            if (matchedActivity && matchedActivity.done) isCompleted = true;
          }
          const badgeColor = isCompleted ? '#27AE60' : '#E67E22'; const badgeIcon = isCompleted ? '✓' : '⏳'; const badgeHoverText = isCompleted ? `Completed on ${dayLabel}` : `Scheduled for ${dayLabel}`;
          return `<li class="${isAssigned ? 'assigned-sight' : 'draggable-sight'} activity-item" ${!isAssigned ? `draggable="true" ondragstart="handleDragStart(event, ${legIndex}, 'sight', ${i})"` : ''}><button class="del-btn" title="Delete" onclick="deleteSight(${legIndex}, ${i})">×</button>${!isAssigned ? `<span class="drag-handle" title="Drag to assign">⠿</span>` : `<span class="assigned-badge" style="background: ${badgeColor};" title="${badgeHoverText}">${badgeIcon}</span>`}<span contenteditable="${!isAssigned && isEditMode}" onblur="updateSightPool(${legIndex}, ${i}, 'title', this.innerText)" style="${isCompleted ? 'text-decoration:line-through;' : ''}; flex:1;">${s.title}</span><span class="sight-inline-meta">⏱ ${s.estTime} · $${s.estCost}</span></li>`;
        }).join('')}</ul>
        <button class="add-btn" onclick="addSight(${legIndex})">+ Add Sight</button>
      </div>
    </div>
  </div>
  </div>`;

    leg.days.forEach((day, dayIndex) => {
      const cityHTML = day.from === day.to ? `<span class="city-same">${day.from}</span>` : `${day.from} <span style="opacity:0.4">→</span> ${day.to}`;
      const completedClass = day.completed ? 'is-completed' : ''; const dayTotal = getDayTotal(day);

      html += `
      <div class="day-card ${completedClass}">
        <div class="day-bar" style="--leg-colour:${leg.colour}" onclick="toggleCard(this)">
          <input type="checkbox" class="day-checkbox" ${day.completed ? 'checked' : ''} onclick="toggleDayCompleted(event, ${legIndex}, ${dayIndex})">
          <div class="day-date"><span class="day-num">${day.date}</span><span class="day-name">${day.day}</span></div>
          <div class="day-title"><div class="day-cities">${cityHTML}</div><div class="day-desc" contenteditable="${isEditMode}" onclick="event.stopPropagation()" onblur="updateDayData(${legIndex}, ${dayIndex}, 'desc', this.innerText)">${day.desc}</div></div>
          ${dayTotal ? `<div class="day-total-cost" title="Total estimated cost for the day">${dayTotal}</div>` : ''}<span class="day-chevron">▼</span>
        </div>
        <div class="day-detail"><div class="detail-grid">

          <div class="detail-block block-transport">
            <h4>Transport</h4><div class="item-list">
            ${(day.transportItems || []).map((item, i) => {
              const status = item.status || 'pending';
              const statusColor = status === 'confirmed' ? '#27AE60' : '#E67E22';
              const statusIcon = status === 'confirmed' ? '✓' : '⏳';
              const showRef = status === 'confirmed';
              return `<div class="cost-item">
                <button class="del-btn" title="Remove Transport" onclick="deleteDayItem(${legIndex}, ${dayIndex}, 'transportItems', ${i})">×</button>
                <span class="cost-item-text" contenteditable="${isEditMode}" onblur="updateDayItemText(${legIndex}, ${dayIndex}, 'transportItems', ${i}, this.innerText)">${item.text}</span>
                <div class="cost-item-actions">
                  <span class="status-badge" style="background:${statusColor}; ${isEditMode ? 'cursor:pointer;' : ''}" title="${isEditMode ? 'Click to toggle status' : 'Booking status'}" ${isEditMode ? 'onclick="event.stopPropagation(); event.preventDefault(); toggleBookingStatus(event, ' + legIndex + ', ' + dayIndex + ', \'transportItems\', ' + i + '); return false;"' : ''}>${statusIcon} ${status.charAt(0).toUpperCase() + status.slice(1)}</span>
                  ${showRef ? `<input type="text" class="booking-ref-input ${status === 'confirmed' ? 'confirmed' : ''}" value="${item.bookingRef || ''}" placeholder="Ref #" onchange="updateBookingRef(${legIndex}, ${dayIndex}, 'transportItems', ${i}, this.value)" ${isEditMode ? '' : 'readonly'}/>` : ''}
                  <span class="budget-field">$<span contenteditable="${isEditMode}" onblur="updateDayItemCost(${legIndex}, ${dayIndex}, 'transportItems', ${i}, this.innerText)">${item.cost}</span></span>
                </div>
              </div>`;
            }).join('')}
            </div><button class="add-btn" onclick="addDayItem(${legIndex}, ${dayIndex}, 'transportItems')">+ Add Transport</button>
          </div>

          <div class="detail-block block-accom">
            <h4>Accommodation</h4><div class="item-list">
            ${(day.accomItems || []).map((item, i) => {
              const status = item.status || 'pending';
              const statusColor = status === 'confirmed' ? '#27AE60' : '#E67E22';
              const statusIcon = status === 'confirmed' ? '✓' : '⏳';
              const showRef = status === 'confirmed';
              return `<div class="cost-item">
                <button class="del-btn" title="Remove Accommodation" onclick="deleteDayItem(${legIndex}, ${dayIndex}, 'accomItems', ${i})">×</button>
                <span class="cost-item-text" contenteditable="${isEditMode}" onblur="updateDayItemText(${legIndex}, ${dayIndex}, 'accomItems', ${i}, this.innerText)">${item.text}</span>
                <div class="cost-item-actions">
                  <span class="status-badge" style="background:${statusColor}; ${isEditMode ? 'cursor:pointer;' : ''}" title="${isEditMode ? 'Click to toggle status' : 'Booking status'}" ${isEditMode ? 'onclick="event.stopPropagation(); toggleBookingStatus(event, ' + legIndex + ', ' + dayIndex + ', \'accomItems\', ' + i + '); return false;"' : ''}>${statusIcon} ${status.charAt(0).toUpperCase() + status.slice(1)}</span>
                  ${showRef ? `<input type="text" class="booking-ref-input ${status === 'confirmed' ? 'confirmed' : ''}" value="${item.bookingRef || ''}" placeholder="Ref #" onchange="updateBookingRef(${legIndex}, ${dayIndex}, 'accomItems', ${i}, this.value)" ${isEditMode ? '' : 'readonly'}/>` : ''}
                  <span class="budget-field">$<span contenteditable="${isEditMode}" onblur="updateDayItemCost(${legIndex}, ${dayIndex}, 'accomItems', ${i}, this.innerText)">${item.cost}</span></span>
                </div>
              </div>`;
            }).join('')}
            </div><button class="add-btn" onclick="addDayItem(${legIndex}, ${dayIndex}, 'accomItems')">+ Add Accom</button>
          </div>

          <div class="detail-block block-activities drop-zone" ondragover="handleDragOver(event)" ondragleave="handleDragLeave(event)" ondrop="handleDrop(event, ${legIndex}, ${dayIndex})">
            <h4>Planned Activities</h4><div class="item-list">
            ${(day.activityItems || []).map((item, i) => `<div class="cost-item"><button class="del-btn" title="Remove Activity" onclick="deleteDayItem(${legIndex}, ${dayIndex}, 'activityItems', ${i})">×</button><input type="checkbox" class="activity-checkbox" ${item.done ? 'checked' : ''} onchange="toggleActivityCompleted(event, ${legIndex}, ${dayIndex}, ${i})"><span class="cost-item-text" style="${item.done ? 'text-decoration:line-through;opacity:0.6;' : ''}" contenteditable="${isEditMode}" onblur="updateDayItemText(${legIndex}, ${dayIndex}, 'activityItems', ${i}, this.innerText)">${item.text}</span><span class="budget-field" style="color:#666;">⏱ <span contenteditable="${isEditMode}" onblur="updateDayItemTime(${legIndex}, ${dayIndex}, 'activityItems', ${i}, this.innerText)">${item.time || '1 hr'}</span></span><span class="budget-field">$<span contenteditable="${isEditMode}" onblur="updateDayItemCost(${legIndex}, ${dayIndex}, 'activityItems', ${i}, this.innerText)">${item.cost}</span></span></div>`).join('')}
            </div><button class="add-btn" onclick="addDayItem(${legIndex}, ${dayIndex}, 'activityItems')">+ Add Activity</button>
          </div>

        </div></div>
      </div>
      `;
    });

    html += `</div>`;
    section.innerHTML = html; container.appendChild(section);
  });
  if (typeof reObserveLegs === "function") reObserveLegs();
}

function buildNav() {
  const nav = document.getElementById('legNav'); nav.innerHTML = '';
  appData.forEach(leg => {
    const btn = document.createElement('button');
    btn.className = 'nav-btn'; btn.textContent = leg.label;
    btn.onclick = () => {
      const el = document.getElementById('leg-' + leg.id);
      el.classList.remove('collapsed');
      el.scrollIntoView({behavior:'smooth', block:'start'});
    };
    btn.dataset.leg = leg.id; nav.appendChild(btn);
  });
}
