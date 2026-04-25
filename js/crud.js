function deleteLeg(idx) {
  if(confirm("Are you sure you want to delete this entire leg and all its days?")) {
    appData.splice(idx, 1);
    saveData(); buildNav(); buildItinerary();
  }
}
function deleteFood(legIdx, foodIdx) { appData[legIdx].cityFood.splice(foodIdx, 1); saveData(); buildItinerary(); }
function deleteActivity(legIdx, activityIdx) {
  const activity = appData[legIdx].suggestedActivities[activityIdx];
  // If activity is assigned to a day, remove it from that day's activity items
  if (activity.assignedDayIdx !== null && activity.assignedDayIdx !== undefined) {
    const day = appData[legIdx].days[activity.assignedDayIdx];
    if (day && day.activityItems) {
      day.activityItems = day.activityItems.filter(item => item.text !== activity.title);
    }
  }
  appData[legIdx].suggestedActivities.splice(activityIdx, 1);
  saveData(); buildItinerary();
}
function deleteLegTip(legIdx, tipIdx) { appData[legIdx].legTips.splice(tipIdx, 1); saveData(); buildItinerary(); }

function deleteDayItem(legIdx, dayIdx, category, itemIdx) {
  const itemText = appData[legIdx].days[dayIdx][category][itemIdx].text;
  if (category === 'activityItems') {
    const poolActivity = appData[legIdx].suggestedActivities.find(a => a.title === itemText && a.assignedDayIdx === dayIdx);
    if (poolActivity) poolActivity.assignedDayIdx = null;
  }
  appData[legIdx].days[dayIdx][category].splice(itemIdx, 1); saveData(); buildItinerary();
}

function addFood(legIdx) { appData[legIdx].cityFood.push({ text: "New food item...", done: false }); saveData(); buildItinerary(); }

function addActivity(legIdx) {
  // Create modal for adding new activity
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.style.display = 'flex';
  modal.innerHTML = `
    <div class="modal-content" style="max-width: 400px;">
      <div class="modal-header">
        <h2>➕ Add Suggested Activity</h2>
        <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">&times;</button>
      </div>
      <div class="modal-body">
        <div class="ai-form-group">
          <label>Category</label>
          <select id="activityCategory" style="width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 4px; font-family: 'DM Sans', sans-serif;">
            <option value="fitness">🏃 Fitness</option>
            <option value="sight" selected>🏛️ Sight</option>
            <option value="attraction">🎢 Attraction</option>
            <option value="wellness">🧘 Wellness</option>
            <option value="food">🍽️ Food</option>
        <option value="tour">🚌 Tour</option>
          </select>
        </div>
        <div class="ai-form-group">
          <label>Description</label>
          <input type="text" id="activityTitle" placeholder="e.g., Morning yoga in the park" style="width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 4px; font-family: 'DM Sans', sans-serif;">
        </div>
        <div class="ai-form-group">
          <label>Location</label>
          <input type="text" id="activityLocation" placeholder="e.g., Central Park" style="width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 4px; font-family: 'DM Sans', sans-serif;">
        </div>
        <div class="ai-form-group">
          <label>Estimated Time</label>
          <input type="text" id="activityTime" placeholder="e.g., 1 hr" value="1 hr" style="width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 4px; font-family: 'DM Sans', sans-serif;">
        </div>
        <div class="ai-form-group">
          <label>Estimated Cost ($)</label>
          <input type="text" id="activityCost" placeholder="0" value="0" style="width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 4px; font-family: 'DM Sans', sans-serif;">
        </div>
      </div>
      <div class="modal-footer">
        <button class="action-btn" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
        <button class="action-btn" style="background: #2C3E50; color: white;" id="saveActivityBtn">Save Activity</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  // Focus on title input
  setTimeout(() => document.getElementById('activityTitle').focus(), 100);

  // Handle save
  document.getElementById('saveActivityBtn').onclick = () => {
    const category = document.getElementById('activityCategory').value;
    const title = document.getElementById('activityTitle').value.trim();
    const location = document.getElementById('activityLocation').value.trim();
    const estTime = document.getElementById('activityTime').value.trim() || '1 hr';
    const estCost = document.getElementById('activityCost').value.trim() || '0';

    if (!title) {
      alert('Please enter a description');
      return;
    }

    const fullTitle = location ? `${title} — ${location}` : title;
    appData[legIdx].suggestedActivities.push({
      title: fullTitle,
      category: category,
      estTime: estTime,
      estCost: estCost,
      assignedDayIdx: null
    });
    modal.remove();
    saveData(); buildItinerary();
  };

  // Allow Enter key to save
  modal.querySelectorAll('input').forEach(input => {
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        document.getElementById('saveActivityBtn').click();
      }
    });
  });
}
function addLegTip(legIdx) { appData[legIdx].legTips.push("New tip..."); saveData(); buildItinerary(); }

function addDayItem(legIdx, dayIdx, category) {
  if (category === 'activityItems') { appData[legIdx].days[dayIdx][category].push({ text: "New item...", cost: "0", time: "1 hr", done: false }); }
  else if (category === 'transportItems' || category === 'accomItems') { appData[legIdx].days[dayIdx][category].push({ text: "New item...", cost: "0", status: "pending", bookingRef: "", done: false }); }
  else { appData[legIdx].days[dayIdx][category].push({ text: "New item...", cost: "0", done: false }); }
  saveData(); buildItinerary();
}

function toggleBookingStatus(e, legIdx, dayIdx, category, itemIdx) {
  e.stopPropagation();
  e.preventDefault();
  const item = appData[legIdx].days[dayIdx][category][itemIdx];
  item.status = item.status === 'confirmed' ? 'pending' : 'confirmed';
  if (item.status === 'pending') item.bookingRef = '';
  saveData();
  // Rebuild the current active view
  if (typeof rebuildCurrentView === 'function') {
    rebuildCurrentView();
  } else {
    buildItinerary();
  }
}

function updateBookingRef(legIdx, dayIdx, category, itemIdx, value) {
  appData[legIdx].days[dayIdx][category][itemIdx].bookingRef = value;
  saveData();
  // Rebuild the current active view
  if (typeof rebuildCurrentView === 'function') {
    rebuildCurrentView();
  }
}

function openAddLegDialog() {
  const modal = document.getElementById('add-leg-modal');
  if (!modal) {
    // Fallback to direct add if modal doesn't exist
    addLegBasic();
    return;
  }

  // Populate existing cities dropdown
  const select = document.getElementById('existingCitySelect');
  select.innerHTML = '<option value="">-- Choose a city --</option>';

  if (typeof citiesData !== 'undefined' && citiesData.length > 0) {
    citiesData.forEach(city => {
      const flag = typeof getCityFlag === 'function' ? getCityFlag(city.name) : '';
      const option = document.createElement('option');
      option.value = city.name;
      option.textContent = `${flag} ${city.name}`;
      select.appendChild(option);
    });
  }

  // Reset form
  document.getElementById('newLegCityName').value = '';
  document.getElementById('newLegCityCountry').value = '';
  document.getElementById('newLegStartDate').value = '';
  document.getElementById('newLegEndDate').value = '';

  modal.style.display = 'flex';

  // Focus on city name input
  setTimeout(() => document.getElementById('newLegCityName').focus(), 100);
}

function closeAddLegDialog() {
  const modal = document.getElementById('add-leg-modal');
  if (modal) modal.style.display = 'none';
}

function confirmAddLeg() {
  const existingCity = document.getElementById('existingCitySelect').value;
  const newCityName = document.getElementById('newLegCityName').value.trim();
  const newCityCountry = document.getElementById('newLegCityCountry').value.trim();
  const startDate = document.getElementById('newLegStartDate').value.trim() || 'DD Mon';
  const endDate = document.getElementById('newLegEndDate').value.trim() || '';

  let cityName = existingCity;
  let cityId = '';

  if (existingCity) {
    // Use existing city
    cityName = existingCity;
    if (typeof citiesData !== 'undefined') {
      const city = citiesData.find(c => c.name === cityName);
      cityId = city ? city.id : '';
    }
  } else if (newCityName) {
    // Check if city already exists (case-insensitive)
    const existingCityCheck = citiesData.find(c =>
      c.name.toLowerCase() === newCityName.toLowerCase()
    );
    if (existingCityCheck) {
      const useExisting = confirm(`City "${newCityName}" already exists. Use the existing city?`);
      if (useExisting) {
        cityName = existingCityCheck.name;
        cityId = existingCityCheck.id;
      } else {
        return;
      }
    } else {
      // Create new city
      cityName = newCityName;
      // Add to cities data
      if (typeof addOrUpdateCity === 'function') {
        const newCity = addOrUpdateCity(newCityName, newCityCountry, startDate, endDate);
        if (newCity) cityId = newCity.id;
      }
    }
  } else {
    alert('Please select an existing city or enter a new city name.');
    return;
  }

  // Create the new leg
  createNewLeg(cityName, cityId, startDate, endDate);

  closeAddLegDialog();
}

function createNewLeg(cityName, cityId, startDate, endDate) {
  const flag = typeof getCityFlag === 'function' ? getCityFlag(cityName) : '';

  // Get city color from cities data
  let cityColor = '#2C3E50';
  if (typeof citiesData !== 'undefined' && cityId) {
    const city = citiesData.find(c => c.id === cityId);
    if (city && city.colour) {
      cityColor = city.colour;
    }
  }

  // Create days array based on date range or single day
  let days = [];
  if (endDate && endDate !== startDate) {
    // Multi-day leg - create arrival day
    days.push({
      date: startDate, day: 'Day', from: 'Home', to: cityName,
      completed: false, desc: 'Arrival day',
      transportItems: [{ text: "Add transport...", cost: "0", cityId: cityId }],
      accomItems: [{ text: "Add accommodation...", cost: "0", cityId: cityId }],
      activityItems: [{ text: "Explore local area", cost: "0", time: "1 hr", done: false, cityId: cityId }]
    });
    // Add departure/to leg for next city
    if (typeof addOrUpdateCity === 'function') {
      addOrUpdateCity(cityName, '', startDate, endDate);
    }
  } else {
    // Single day
    days.push({
      date: startDate, day: 'Day', from: 'Home', to: cityName,
      completed: false, desc: 'Arrival day',
      transportItems: [{ text: "Add transport...", cost: "0", cityId: cityId }],
      accomItems: [{ text: "Add accommodation...", cost: "0", cityId: cityId }],
      activityItems: [{ text: "Explore local area", cost: "0", time: "1 hr", done: false, cityId: cityId }]
    });
  }

  const newLeg = {
    id: 'leg_' + Date.now(),
    label: `${flag} ${cityName}`,
    colour: cityColor,
    cityFood: [{ text: "Local dish to try", done: false, cityId: cityId }],
    suggestedActivities: [],
    legTips: [{ text: "Add tip...", cityId: cityId }],
    days: days
  };
  appData.push(newLeg);

  // Rebuild city nav and itinerary
  if (typeof extractCitiesFromItinerary === 'function' &&
      typeof citiesData !== 'undefined') {
    citiesData = extractCitiesFromItinerary();
    // Merge with existing to preserve countries
    const existingCity = citiesData.find(c => c.name === cityName);
    if (existingCity && cityId) existingCity.id = cityId;
  }

  if (typeof saveData === 'function') saveData();
  if (typeof sortLegs === 'function') sortLegs();
  if (typeof buildCityNav === 'function') buildCityNav();
}

function addLegBasic() {
  // Basic add without dialog (fallback)
  const newLeg = {
    id: 'leg_' + Date.now(),
    label: '',
    colour: '#2C3E50',
    cityFood: [{ text: "Local dish to try", done: false }],
    suggestedActivities: [],
    legTips: [{ text: "Add tip..." }],
    days: [{
      date: 'DD Mon', day: 'Mon', from: 'City', to: 'City',
      completed: false, desc: 'Travel and arrival day',
      transportItems: [{ text: "Add transport...", cost: "0" }],
      accomItems: [{ text: "Add accommodation...", cost: "0" }],
      activityItems: [{ text: "Explore local area", cost: "0", time: "1 hr", done: false }]
    }]
  };
  appData.push(newLeg);
  sortLegs();
}

// Legacy function - now opens dialog
function addLeg() {
  openAddLegDialog();
}

function updateFoodText(legIdx, foodIdx, text) { appData[legIdx].cityFood[foodIdx].text = text; saveData(); }

function updateActivity(legIdx, activityIdx, key, val) {
  if (!val.trim() && key === 'title') {
    deleteActivity(legIdx, activityIdx);
  } else {
    appData[legIdx].suggestedActivities[activityIdx][key] = val;
    saveData();
  }
}

function updateActivityCategory(legIdx, activityIdx, newCategory) {
  appData[legIdx].suggestedActivities[activityIdx].category = newCategory;
  saveData(); buildItinerary();
}

function updateLegTip(legIdx, tipIdx, val) {
  if (!val.trim()) {
    appData[legIdx].legTips.splice(tipIdx, 1);
    saveData(); buildItinerary();
  } else {
    appData[legIdx].legTips[tipIdx] = val;
    saveData();
  }
}

function updateDayItemText(legIdx, dayIdx, category, itemIdx, text, fromTabs = false) {
  appData[legIdx].days[dayIdx][category][itemIdx].text = text;
  saveData();
  // Rebuild current view to reflect changes
  if (typeof rebuildCurrentView === 'function') {
    rebuildCurrentView();
  } else {
    buildItinerary();
  }
}
function updateDayItemCost(legIdx, dayIdx, category, itemIdx, cost, fromTabs = false) {
  appData[legIdx].days[dayIdx][category][itemIdx].cost = cost;
  saveData();
  // Rebuild current view to reflect changes
  if (typeof rebuildCurrentView === 'function') {
    rebuildCurrentView();
  } else {
    buildItinerary();
  }
}
function updateDayItemTime(legIdx, dayIdx, category, itemIdx, time) {
  appData[legIdx].days[dayIdx][category][itemIdx].time = time;
  saveData();
}

function toggleFoodCompleted(e, legIdx, foodIdx) { appData[legIdx].cityFood[foodIdx].done = e.target.checked; saveData(); buildItinerary(); }
function toggleDayCompleted(e, legIdx, dayIdx) { e.stopPropagation(); appData[legIdx].days[dayIdx].completed = e.target.checked; saveData(); buildItinerary(); }
function toggleActivityCompleted(e, legIdx, dayIdx, itemIdx) { appData[legIdx].days[dayIdx].activityItems[itemIdx].done = e.target.checked; saveData(); buildItinerary(); }
