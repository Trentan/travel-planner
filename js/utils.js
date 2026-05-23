const DEFAULT_DATA = [
  {
    id: 'leg-1', label: '🏠 Start (Brisbane)', colour: '#2C3E50',
    cityFood: [],
    suggestedActivities: [],
    legTips: [],
    days: [
      {
        date:'1 Jan', day:'Mon', from:'Home', to:'Brisbane Airport',
        completed: false, desc:'Departure day',
        transportItems: [{ text: "Flight to London", cost: "1200", status: "confirmed", bookingRef: "ABC123" }],
        accomItems: [],
        activityItems: []
      }
    ]
  },
  {
    id: 'leg-2', label: '📍 London', colour: '#E74C3C',
    cityFood: [
      { text: "Try authentic fish & chips", done: false, cityId: 'city-london' },
      { text: "Visit Borough Market", done: false, cityId: 'city-london' }
    ],
    suggestedActivities: [
      { title: 'Morning run along Thames', category: 'fitness', estTime: '1 hr', estCost: '0', assignedDayIdx: null, cityId: 'city-london' },
      { title: 'British Museum', category: 'sight', estTime: '3 hrs', estCost: '0', assignedDayIdx: null, cityId: 'city-london' },
      { title: 'West End show', category: 'attraction', estTime: '3 hrs', estCost: '80', assignedDayIdx: null, cityId: 'city-london' }
    ],
    legTips: [
      { text: "Download Citymapper for transit", cityId: 'city-london' },
      { text: "Book museum tickets in advance", cityId: 'city-london' }
    ],
    days: [
      {
        date:'2 Jan', day:'Tue', from:'Brisbane Airport', to:'London',
        completed: false, desc:'Arrival and hotel check-in',
        transportItems: [{ text: "Heathrow Express to Paddington", cost: "25", status: "pending", bookingRef: "" }],
        accomItems: [{ text: "Premier Inn London", cost: "150", status: "confirmed", bookingRef: "LON456", cityId: 'city-london' }],
        activityItems: [{ text: "Rest and explore local area", cost: "0", time: "2 hrs", done: false, cityId: 'city-london' }]
      },
      {
        date:'3 Jan', day:'Wed', from:'London', to:'London',
        completed: false, desc:'First full day exploring',
        transportItems: [{ text: "Oyster card / Contactless", cost: "10", status: "", bookingRef: "" }],
        accomItems: [{ text: "Premier Inn London", cost: "150", status: "confirmed", bookingRef: "LON456", cityId: 'city-london' }],
        activityItems: [
          { text: "British Museum", cost: "0", time: "3 hrs", done: false, cityId: 'city-london' },
          { text: "Covent Garden dinner", cost: "40", time: "2 hrs", done: false, cityId: 'city-london' }
        ]
      }
    ]
  },
  {
    id: 'leg-3', label: '✈️ London → Paris', colour: '#3498DB',
    cityFood: [],
    suggestedActivities: [],
    legTips: [],
    days: [
      {
        date:'4 Jan', day:'Thu', from:'London', to:'Paris',
        completed: false, desc:'Travel to Paris',
        transportItems: [{ text: "Eurostar to Paris", cost: "100", status: "confirmed", bookingRef: "EST789" }],
        accomItems: [],
        activityItems: []
      }
    ]
  },
  {
    id: 'leg-4', label: '📍 Paris', colour: '#3498DB',
    cityFood: [
      { text: "Croissant at local boulangerie", done: false, cityId: 'city-paris' },
      { text: "Dinner cruise on Seine", done: false, cityId: 'city-paris' }
    ],
    suggestedActivities: [
      { title: 'Run in Luxembourg Gardens', category: 'fitness', estTime: '1 hr', estCost: '0', assignedDayIdx: null, cityId: 'city-paris' },
      { title: 'Louvre Museum', category: 'sight', estTime: '4 hrs', estCost: '17', assignedDayIdx: null, cityId: 'city-paris' },
      { title: 'Eiffel Tower sunset', category: 'sight', estTime: '2 hrs', estCost: '28', assignedDayIdx: null, cityId: 'city-paris' }
    ],
    legTips: [
      { text: "Museum pass saves money", cityId: 'city-paris' },
      { text: "Book Eiffel Tower in advance", cityId: 'city-paris' }
    ],
    days: [
      {
        date:'4 Jan', day:'Thu', from:'London', to:'Paris',
        completed: false, desc:'Arrival in Paris',
        transportItems: [],
        accomItems: [{ text: "Hotel des Arts", cost: "180", status: "confirmed", bookingRef: "PA987", cityId: 'city-paris' }],
        activityItems: [{ text: "Evening Seine walk", cost: "0", time: "1.5 hrs", done: false, cityId: 'city-paris' }]
      },
      {
        date:'5 Jan', day:'Fri', from:'Paris', to:'Paris',
        completed: false, desc:'Exploring the city',
        transportItems: [{ text: "Metro day pass", cost: "8", status: "", bookingRef: "" }],
        accomItems: [{ text: "Hotel des Arts", cost: "180", status: "confirmed", bookingRef: "PA987", cityId: 'city-paris' }],
        activityItems: [
          { text: "Louvre Museum", cost: "17", time: "4 hrs", done: false, cityId: 'city-paris' },
          { text: "Eiffel Tower", cost: "28", time: "2 hrs", done: false, cityId: 'city-paris' }
        ]
      }
    ]
  },
  {
    id: 'leg-5', label: '🏠 Return (Brisbane)', colour: '#2C3E50',
    cityFood: [],
    suggestedActivities: [],
    legTips: [],
    days: [
      {
        date:'6 Jan', day:'Sat', from:'Paris', to:'Home',
        completed: false, desc:'Return flight home',
        transportItems: [{ text: "Flight CDG → BNE", cost: "1200", status: "confirmed", bookingRef: "RET321" }],
        accomItems: [],
        activityItems: []
      }
    ]
  },
];

const ACTIVITY_CATEGORIES = {
  fitness: { emoji: '🏃', label: 'Fitness' },
  sight: { emoji: '🏛️', label: 'Sights' },
  attraction: { emoji: '🎢', label: 'Attractions' },
  wellness: { emoji: '🧘', label: 'Wellness' },
  food: { emoji: '🍽️', label: 'Food' },
  tour: { emoji: '🚌', label: 'Tour' }
};

function getActivityEmoji(category) {
  return ACTIVITY_CATEGORIES[category]?.emoji || '📍';
}

function getActivityLabel(category) {
  return ACTIVITY_CATEGORIES[category]?.label || 'Activity';
}

function escapeHtmlText(text) {
  if (text === null || text === undefined) return '';
  return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
}

function parseCurrencyAmount(value) {
  const parsed = Number.parseFloat(String(value ?? '').replace(/[^0-9.-]/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatCurrency(value, options = {}) {
  const {
    includeSymbol = true,
    showZero = true,
    minimumFractionDigits = 'auto',
    maximumFractionDigits = 'auto'
  } = options;
  const amount = parseCurrencyAmount(value);
  if (!showZero && amount === 0) return '';
  const minDigits = minimumFractionDigits === 'auto' ? (Number.isInteger(amount) ? 0 : 2) : minimumFractionDigits;
  const maxDigits = maximumFractionDigits === 'auto' ? Math.max(minDigits, 2) : maximumFractionDigits;
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: minDigits,
    maximumFractionDigits: maxDigits
  }).format(amount);
  return includeSymbol ? `$${formatted}` : formatted;
}

function renderMobileStat(label, primary, secondary = '', extraClass = '') {
  return `
    <div class="mobile-surface-card-stat ${extraClass}">
      <span class="mobile-surface-card-stat-label">${escapeHtmlText(label)}</span>
      <span class="mobile-surface-card-stat-primary">${primary ? escapeHtmlText(primary) : '—'}</span>
      ${secondary ? `<span class="mobile-surface-card-stat-secondary">${secondary}</span>` : ''}
    </div>
  `;
}

function renderMobileTripTracker({
                                   label = 'Trip',
                                   position = '',
                                   behind = 0,
                                   here = 1,
                                   ahead = 0
                                 }) {
  const behindCount = Math.max(0, Number(behind) || 0);
  const hereCount = Math.max(0, Number(here) || 0);
  const aheadCount = Math.max(0, Number(ahead) || 0);
  const total = Math.max(1, behindCount + hereCount + aheadCount);
  return `
    <div class="mobile-trip-tracker">
      <div class="mobile-trip-tracker-top">
        <span class="mobile-trip-tracker-label">${escapeHtmlText(label)}</span>
        ${position ? `<span class="mobile-trip-tracker-position">${escapeHtmlText(position)}</span>` : ''}
      </div>
      <div class="mobile-trip-tracker-bar" aria-hidden="true">
        <span class="mobile-trip-tracker-segment is-behind" style="width:${(behindCount / total) * 100}%"></span>
        <span class="mobile-trip-tracker-segment is-here" style="width:${(hereCount / total) * 100}%"></span>
        <span class="mobile-trip-tracker-segment is-ahead" style="width:${(aheadCount / total) * 100}%"></span>
      </div>
    </div>
  `;
}

function getMobilePagerStateStore() {
  if (typeof window === 'undefined') return {};
  if (!window.__mobilePagerState) {
    window.__mobilePagerState = {};
  }
  return window.__mobilePagerState;
}

function getMobilePagerActiveIndex(pagerKey, fallback = 0) {
  if (!pagerKey) return Math.max(0, Number(fallback) || 0);
  const store = getMobilePagerStateStore();
  const value = store[pagerKey];
  return Number.isFinite(Number(value)) ? Number(value) : Math.max(0, Number(fallback) || 0);
}

function setMobilePagerActiveIndex(pagerKey, index) {
  if (!pagerKey) return;
  const store = getMobilePagerStateStore();
  store[pagerKey] = Math.max(0, Number(index) || 0);
}

function resetMobilePagerActiveIndex(pagerKey) {
  if (!pagerKey) return;
  const store = getMobilePagerStateStore();
  delete store[pagerKey];
}

function captureMobilePagerStates(root = document) {
  if (typeof window === 'undefined' || !root) return;
  root.querySelectorAll('[data-role="mobile-swipe-pager"]').forEach(pager => {
    const pagerKey = pager.dataset.pagerKey || '';
    if (!pagerKey) return;

    const carousel = pager.querySelector('[data-role="mobile-swipe-carousel"]');
    const slides = Array.from(pager.querySelectorAll('[data-role="mobile-swipe-slide"]'));
    if (!carousel || slides.length === 0) return;

    let bestIndex = Number(pager.dataset.activeIndex || 0);
    let bestDistance = Number.POSITIVE_INFINITY;
    slides.forEach((slide, index) => {
      const distance = Math.abs((slide.offsetLeft - carousel.offsetLeft) - carousel.scrollLeft);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestIndex = index;
      }
    });
    setMobilePagerActiveIndex(pagerKey, bestIndex);
  });
}

function scrollChildIntoHorizontalView(container, child, { behavior = 'auto', align = 'center' } = {}) {
  if (!container || !child) return;
  const childLeft = child.offsetLeft - container.offsetLeft;
  const targetLeft = align === 'start'
      ? childLeft
      : childLeft - (container.clientWidth - child.offsetWidth) / 2;
  container.scrollTo({
    left: Math.max(0, targetLeft),
    behavior
  });
}

function renderMobileSurfaceCard({
                                   cardClass = '',
                                   accentColor = '',
                                   dateLabel = '',
                                   title = '',
                                   subtitle = '',
                                   summary = '',
                                   meta = '',
                                   primaryAction = '',
                                   actions = '',
                                   details = '',
                                   detailsOpen = false
                                 }) {
  const accentStyle = accentColor ? ` style="--card-accent:${accentColor};"` : '';
  return `
    <article class="mobile-surface-card ${cardClass}"${accentStyle}>
      <div class="mobile-surface-card-head">
        <div class="mobile-surface-card-headline">
          <div class="mobile-surface-card-headline-line">
            ${dateLabel ? `<span class="mobile-surface-card-date">${escapeHtmlText(dateLabel)}</span>` : ''}
            ${title ? `<span class="mobile-surface-card-title">${escapeHtmlText(title || '—')}</span>` : ''}
            ${subtitle ? `<span class="mobile-surface-card-subtitle">${escapeHtmlText(subtitle)}</span>` : ''}
          </div>
        </div>
        ${primaryAction ? `<div class="mobile-surface-card-primary-action">${primaryAction}</div>` : ''}
      </div>
      ${summary ? `<div class="mobile-surface-card-summary">${summary}</div>` : ''}
      ${meta ? `<div class="mobile-surface-card-meta-grid">${meta}</div>` : ''}
      ${details ? `<div class="mobile-surface-card-details ${detailsOpen ? 'expanded' : ''}">${details}</div>` : ''}
      ${actions ? `<div class="mobile-surface-card-actions">${actions}</div>` : ''}
    </article>
  `;
}

function renderMobileSwipePager({
                                  pagerClass = '',
                                  pagerKey = '',
                                  label = '',
                                  title = '',
                                  hint = '',
                                  positionPrefix = 'Item',
                                  position = '',
                                  counter = '',
                                  railHtml = '',
                                  slidesHtml = '',
                                  ariaLabel = ''
                                }) {
  const pagerKeyAttr = pagerKey ? ` data-pager-key="${escapeHtmlText(pagerKey)}"` : '';
  return `
    <div class="mobile-swipe-pager ${pagerClass}" data-role="mobile-swipe-pager"${pagerKeyAttr}>
      ${railHtml ? `<div class="mobile-swipe-rail" role="tablist" aria-label="${escapeHtmlText(ariaLabel || 'Swipe rail')}">${railHtml}</div>` : ''}
      <div class="mobile-swipe-progress" aria-hidden="true">
        <span class="mobile-swipe-progress-fill" data-role="mobile-swipe-progress"></span>
      </div>
      <div class="mobile-swipe-carousel" data-role="mobile-swipe-carousel">
        ${slidesHtml}
      </div>
    </div>
  `;
}

function setupMobileSwipePagers(root = document) {
  const pagers = root.querySelectorAll('[data-role="mobile-swipe-pager"]');
  pagers.forEach(pager => {
    const carousel = pager.querySelector('[data-role="mobile-swipe-carousel"]');
    const rail = pager.querySelector('.mobile-swipe-rail');
    const slides = Array.from(pager.querySelectorAll('[data-role="mobile-swipe-slide"]'));
    const chips = Array.from(pager.querySelectorAll('[data-role="mobile-swipe-chip"]'));
    const progressFill = pager.querySelector('[data-role="mobile-swipe-progress"]');
    const pagerKey = pager.dataset.pagerKey || '';

    if (!carousel || slides.length === 0) return;

    const total = slides.length;
    let suppressObserver = false;
    let scrollFrame = 0;
    const initialIndex = getMobilePagerActiveIndex(pagerKey, Number(pager.dataset.activeIndex || 0));

    // Dynamically build visual dots indicators
    let dotsContainer = pager.querySelector('.mobile-swipe-dots');
    if (!dotsContainer && total > 1) {
      dotsContainer = document.createElement('div');
      dotsContainer.className = 'mobile-swipe-dots';
      pager.appendChild(dotsContainer);
      for (let i = 0; i < total; i++) {
        const dot = document.createElement('span');
        dot.className = 'mobile-swipe-dot';
        dot.dataset.slideIndex = String(i);
        dotsContainer.appendChild(dot);
      }
    }
    const dots = dotsContainer ? Array.from(dotsContainer.querySelectorAll('.mobile-swipe-dot')) : [];

    const setActive = nextIndex => {
      const safeIndex = Math.max(0, Math.min(total - 1, Number(nextIndex) || 0));

      slides.forEach((slide, idx) => {
        slide.classList.toggle('is-active', idx === safeIndex);
      });

      chips.forEach((chip, idx) => {
        const active = idx === safeIndex;
        chip.classList.toggle('active', active);
        chip.setAttribute('aria-selected', active ? 'true' : 'false');
        chip.setAttribute('aria-current', active ? 'true' : 'false');
      });

      // Update active state of dot indicators
      dots.forEach((dot, idx) => {
        dot.classList.toggle('active', idx === safeIndex);
      });

      if (progressFill) progressFill.style.width = `${((safeIndex + 1) / total) * 100}%`;
      pager.dataset.activeIndex = String(safeIndex);
      setMobilePagerActiveIndex(pagerKey, safeIndex);

      const activeChip = chips[safeIndex];
      if (rail && activeChip) {
        scrollChildIntoHorizontalView(rail, activeChip, { behavior: 'auto', align: 'center' });
      }
    };

    const scrollToIndex = nextIndex => {
      const slide = slides[nextIndex];
      if (!slide) return;
      suppressObserver = true;
      scrollChildIntoHorizontalView(carousel, slide, { behavior: 'smooth', align: 'start' });
      setActive(nextIndex);
      window.setTimeout(() => {
        suppressObserver = false;
      }, 420);
    };

    chips.forEach(chip => {
      chip.addEventListener('click', () => {
        scrollToIndex(Number(chip.dataset.dayIndex || chip.dataset.slideIndex || 0));
      });
    });

    // Add click listeners to page dots
    dots.forEach(dot => {
      dot.addEventListener('click', () => {
        scrollToIndex(Number(dot.dataset.slideIndex || 0));
      });
    });

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(entries => {
        if (suppressObserver) return;
        const visibleEntry = entries
            .filter(entry => entry.isIntersecting)
            .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visibleEntry) return;
        const nextIndex = Number(visibleEntry.target.dataset.dayIndex || visibleEntry.target.dataset.slideIndex || 0);
        if (!Number.isNaN(nextIndex)) setActive(nextIndex);
      }, {
        root: carousel,
        threshold: [0.55, 0.7, 0.85]
      });

      slides.forEach(slide => observer.observe(slide));
      pager.__mobileSwipeObserver = observer;
    } else {
      const syncFromScroll = () => {
        if (scrollFrame) cancelAnimationFrame(scrollFrame);
        scrollFrame = requestAnimationFrame(() => {
          const center = carousel.scrollLeft + carousel.clientWidth / 2;
          let bestIndex = 0;
          let bestDistance = Number.POSITIVE_INFINITY;

          slides.forEach((slide, idx) => {
            const slideCenter = slide.offsetLeft + slide.offsetWidth / 2;
            const distance = Math.abs(slideCenter - center);
            if (distance < bestDistance) {
              bestDistance = distance;
              bestIndex = idx;
            }
          });

          setActive(bestIndex);
        });
      };

      carousel.addEventListener('scroll', syncFromScroll, { passive: true });
    }

    setActive(initialIndex);
    const initialSlide = slides[initialIndex];
    if (carousel && initialSlide) {
      carousel.scrollLeft = Math.max(0, initialSlide.offsetLeft - carousel.offsetLeft);
    }
  });
}

function renderMobileStatusCostMeta({
                                      status,
                                      costValue,
                                      bookingReference = '',
                                      statusOnClick = '',
                                      costOnBlur = '',
                                      statusButtonTitle = 'Change status',
                                      metaClass = 'transport-status-cost-meta',
                                      editableCost = false
                                    }) {
  const normalizedStatus = (status === 'pending' ? 'planned' : status) || 'planned';
  const statusColors = {
    planned: '#E67E22',
    booked: '#27AE60',
    confirmed: '#27AE60',
    cancelled: '#E74C3C'
  };
  const statusIcons = {
    planned: '⏳',
    booked: '✓',
    confirmed: '🎫',
    cancelled: '❌'
  };
  const statusText = normalizedStatus.charAt(0).toUpperCase() + normalizedStatus.slice(1);
  const statusColor = statusColors[normalizedStatus] || statusColors.planned;
  const statusGlyph = statusIcons[normalizedStatus] || '⏳';
  const safeCost = typeof formatCurrency === 'function'
      ? formatCurrency(costValue, { includeSymbol: false })
      : (costValue ?? '0');
  const costNode = editableCost
      ? `<span class="transport-mobile-cost-value" contenteditable="true" onblur="${costOnBlur}">${safeCost}</span>`
      : `<span class="transport-mobile-cost-value">${safeCost}</span>`;
  const statusNode = statusOnClick
      ? `<button type="button" class="status-badge transport-mobile-status-btn" style="background:${statusColor};" onclick="${statusOnClick}" title="${statusButtonTitle}">${statusGlyph} ${statusText}</button>`
      : `<span class="status-badge transport-mobile-status-btn" style="background:${statusColor};">${statusGlyph} ${statusText}</span>`;

  return `
    <div class="mobile-table-meta ${metaClass}">
      ${statusNode}
      <div class="transport-mobile-cost-line">
        <span class="transport-mobile-cost-currency">$</span>${costNode}
      </div>
      ${bookingReference ? `<span class="transport-mobile-booking">${bookingReference}</span>` : ''}
    </div>
  `;
}

const DEFAULT_LEAVE_HOME = [
  { text: "Kitchen and bins", kind: "section" },
  { text: "Empty fridge and pantry perishables", done: false },
  { text: "Empty coffee and compost bins and leave outside", done: false },
  { text: "Empty bins", done: false, mergeKeys: ["take out all rubbish and recycling"] },
  { text: "Pause or reschedule any regular deliveries", done: false },
  { text: "Check mailbox is empty or hold mail service", done: false },

  { text: "Home shutdown", kind: "section" },
  { text: "Turn power off everywhere not needed", done: false, mergeKeys: ["switch off power points at the wall except fridge"] },
  { text: "Check all lights and fans off", done: false },
  { text: "Close and check all windows", done: false, mergeKeys: ["lock all doors and windows"] },
  { text: "Blinds partial down", done: false, mergeKeys: ["close blinds or curtains and secure loose outdoor items"] },
  { text: "Water off (including outdoor taps)", done: false, mergeKeys: ["water off, including outdoor taps", "turn off all taps and check for leaks"] },
  { text: "Turn off gas supply if applicable", done: false },
  { text: "Adjust thermostat to away or saver mode", done: false },

  { text: "Security and pets", kind: "section" },
  { text: "Check CCTV on", done: false },
  { text: "Dog door panel / lock", done: false },
  { text: "Automatic fish feeder", done: false, mergeKeys: ["automatic fish feeder"] },
  { text: "Security system on", done: false, mergeKeys: ["set security alarm / notify security company"] },
  { text: "Water plants or arrange plant care", done: false },
  { text: "Set up lights on timers if away long", done: false },

  { text: "Travel ready", kind: "section" },
  { text: "Charge all devices including phones, tablets, and power banks", done: false },
  { text: "Download offline maps and confirmations", done: false },
  { text: "Notify emergency contact of travel plans", done: false },
  { text: "Pause gym membership or group activities", done: false },

  { text: "If taking dog", kind: "section" },
  { text: "Waste bags", done: false, mergeKeys: ["if taking dog: waste bags"] },
  { text: "Water bowl", done: false, mergeKeys: ["if taking dog: water bowl"] },
  { text: "Food", done: false, mergeKeys: ["if taking dog: food"] },
  { text: "Toys", done: false, mergeKeys: ["if taking dog: toys"] },
  { text: "Leash", done: false, mergeKeys: ["if taking dog: leash"] },
  { text: "Treats", done: false, mergeKeys: ["if taking dog: treats"] }
];

function normalizeChecklistText(text) {
  return String(text || '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ' ');
}

function getChecklistItemKeys(item) {
  if (!item) return [];

  const keys = [];
  const primary = normalizeChecklistText(item.text);
  if (primary) keys.push(primary);

  if (Array.isArray(item.mergeKeys)) {
    item.mergeKeys.forEach(key => {
      const normalized = normalizeChecklistText(key);
      if (normalized && !keys.includes(normalized)) {
        keys.push(normalized);
      }
    });
  }

  return keys;
}

function mergeChecklistWithDefaults(savedItems, defaultItems = DEFAULT_LEAVE_HOME) {
  const savedList = Array.isArray(savedItems) ? savedItems : [];
  const defaults = Array.isArray(defaultItems) ? defaultItems : [];
  const savedEntries = savedList
      .map((item, index) => ({ item, index, keys: getChecklistItemKeys(item), matched: false }))
      .filter(entry => entry.keys.length > 0);

  const merged = defaults.map(def => {
    const defaultCopy = JSON.parse(JSON.stringify(def));
    const defaultKeys = getChecklistItemKeys(def);
    const savedEntry = savedEntries.find(entry =>
        !entry.matched && entry.keys.some(key => defaultKeys.includes(key))
    );

    if (!savedEntry) {
      if (defaultCopy.kind !== 'section' && typeof defaultCopy.done !== 'boolean') {
        defaultCopy.done = false;
      }
      return defaultCopy;
    }

    savedEntry.matched = true;

    if (defaultCopy.kind === 'section') {
      return defaultCopy;
    }

    return {
      ...defaultCopy,
      ...savedEntry.item,
      text: defaultCopy.text,
      done: Boolean(savedEntry.item.done)
    };
  });

  savedEntries.forEach(entry => {
    if (entry.matched) return;
    const item = { ...entry.item };
    if (!item.kind && typeof item.done !== 'boolean') {
      item.done = false;
    }
    merged.push(item);
  });

  return merged;
}

const DEFAULT_PACKING = [
  {
    areaName: "🚶 Walk-on Gear (Wear onto plane)",
    areaColor: "#E67E22",
    categories: [
      { title: "Plane Outfit", items: [{text: "Underwear", done:false}, {text: "Jeans", done:false}, {text: "Belt", done:false}, {text: "Sports shoes", done:false}, {text: "Socks", done:false}, {text: "Activewear shirt", done:false}, {text: "Hoodie", done:false}, {text: "Sunglasses", done:false}] }
    ]
  },
  {
    areaName: "🧳 Carry-on Packed Bag (Main Luggage)",
    areaColor: "#2980B9",
    categories: [
      { title: "Clothes", items: [{text: "T-shirts, Tank Tops", done:false}, {text: "Shorts, Skirts", done:false}, {text: "Pants", done:false}, {text: "Layers (hoodie, sweater)", done:false}, {text: "Swim suit", done:false}, {text: "Dress", done:false}, {text: "Socks", done:false}, {text: "Underwear", done:false}, {text: "Bras", done:false}, {text: "Pyjamas, Sleepwear", done:false}, {text: "Formal Wear", done:false}, {text: "Hat", done:false}, {text: "Workout outfit", done:false}, {text: "Other accessories / Earrings", done:false}] },
      { title: "Shoes & Misc", items: [{text: "Dress shoes", done:false}, {text: "Sandals/Crocs", done:false}, {text: "Presents / Card", done:false}, {text: "Reusable tote bag", done:false}, {text: "Pillowcase for used clothes", done:false}, {text: "Micro-fibre Towel", done:false}, {text: "Foldable hangers", done:false}, {text: "Laundry Sheets for washing", done:false}, {text: "Raincoat/Umbrella", done:false}] },
      { title: "Dry Toiletries", items: [{text: "Floss", done:false}, {text: "Toothbrush", done:false}, {text: "Razor (Cartidge), Shaving", done:false}, {text: "Bar of Soap", done:false}, {text: "Cotton pad, q-tips", done:false}, {text: "Nail clippers/tweezers", done:false}, {text: "Personal Hygiene items (Pads)", done:false}, {text: "Makeup", done:false}, {text: "Hair clips, hair ties", done:false}, {text: "Hair Brush/comb", done:false}, {text: "Bandaids, Electrolyte packs", done:false}, {text: "Body wipes", done:false}, {text: "Panadol / Nurofen", done:false}, {text: "Vitamins / Tablets", done:false}] },
      { title: "💧 1L Clear Bag (Liquids <100ml)", items: [{text: "Clear 1 litre bag", done:false}, {text: "Cologne/Perfume", done:false}, {text: "Toothpaste", done:false}, {text: "Face wash", done:false}, {text: "Shampoo & Conditioner", done:false}, {text: "Leave-in conditioner", done:false}, {text: "Micellar Water/Makeup Remover", done:false}, {text: "Sunscreen", done:false}, {text: "Deodorant", done:false}, {text: "Moisturiser", done:false}] }
    ]
  },
  {
    areaName: "🎒 Personal Item Bag (Under Seat)",
    areaColor: "#8E44AD",
    categories: [
      { title: "Essentials", items: [{text: "TRS Claim + Items", done:false}, {text: "Passport + [Copy + Tracker]", done:false}, {text: "Reservations + Itineraries + Insurance", done:false}, {text: "Wallet/Purse + Local cash + Cards", done:false}, {text: "Phone", done:false}, {text: "Crossbody/Sling Bag", done:false}] },
      { title: "Flight Items", items: [{text: "Travel pillow / Foot sling", done:false}, {text: "Phone holder (watch movies)", done:false}, {text: "Compression socks, Slippers", done:false}, {text: "Disposable Toothbrush kit", done:false}, {text: "Eye mask, Eye Drops", done:false}, {text: "Ear plugs, Breath Fresheners", done:false}, {text: "Snacks, TravelCalm", done:false}, {text: "Headphones/Airpods", done:false}, {text: "Airfly/Bluetooth Adapter", done:false}, {text: "Book/Kindle", done:false}, {text: "Water bottle", done:false}] },
      { title: "Tech", items: [{text: "eSIM (Installed)", done:false}, {text: "Mobile downloads (Movies, Shows)", done:false}, {text: "Phone charger", done:false}, {text: "Power cables, Cords", done:false}, {text: "Power Adapter", done:false}, {text: "Power bank", done:false}, {text: "Pen", done:false}, {text: "Laptop", done:false}, {text: "Luggage Trackers", done:false}] }
    ]
  },
  {
    areaName: "📝 Trip Notes",
    areaColor: "#6C5CE7",
    categories: [
      { title: "Notes", items: [{text: "Booking reminders", done:false}, {text: "Places to book", done:false}, {text: "Trip ideas to follow up", done:false}] }
    ]
  }
];

function updateClocks() {}

function getMapSearchUrl(query, city = '') {
  if (!query) return '';
  let fullQuery = query;
  if (city) {
    const cleanCity = String(city).trim();
    if (cleanCity && !query.toLowerCase().includes(cleanCity.toLowerCase())) {
      fullQuery = `${query}, ${cleanCity}`;
    }
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullQuery)}`;
}

function parseCost(val) { return parseCurrencyAmount(val); }

function getDayTotal(day) {
  let total = 0;
  
  // 1. Sum up custom activity items stored directly on the day (activityItems)
  (day.activityItems || []).forEach(item => {
    total += parseCost(item.cost);
  });

  // 2. Sum up stays checkin costs from the global stays database for this day
  if (typeof getStayDisplayForDay === 'function') {
    const staysForDay = getStayDisplayForDay(day.date, day.to);
    staysForDay.forEach(stayInfo => {
      // ONLY sum the cost on check-in day, to avoid double-counting on check-out day!
      if (stayInfo.type === 'checkin') {
        total += parseCost(stayInfo.cost);
      }
    });
  } else {
    (day.accomItems || []).forEach(item => {
      total += parseCost(item.cost);
    });
  }

  // 3. Sum up journey costs from the global journeys database for this day
  if (typeof getDayJourneys === 'function') {
    let legId = '';
    if (typeof appData !== 'undefined') {
      const parentLeg = appData.find(leg => (leg.days || []).some(d => d.date === day.date));
      if (parentLeg) legId = parentLeg.id;
    }
    const journeysForDay = getDayJourneys(day.date, day.from, day.to, legId);
    journeysForDay.forEach(journey => {
      if (journey.legId && legId && journey.legId !== legId) {
        return;
      }
      // Avoid double-counting overnight or transit journeys on arrival day:
      // Only sum the cost on the departure day!
      const depDate = journey.departureDate || journey.dayDate;
      const isDepDay = depDate && (typeof journeyDatesMatch === 'function' ? journeyDatesMatch(depDate, day.date) : (depDate === day.date));
      if (depDate && !isDepDay) {
        return;
      }
      total += parseCost(journey.cost);
    });
  } else {
    (day.transportItems || []).forEach(item => {
      total += parseCost(item.cost);
    });
  }

  return formatCurrency(total, { showZero: false });
}

window.getMapSearchUrl = getMapSearchUrl;
window.getDayTotal = getDayTotal;
window.parseCurrencyAmount = parseCurrencyAmount;
window.formatCurrency = formatCurrency;
window.escapeHtmlText = escapeHtmlText;
window.renderMobileStat = renderMobileStat;
window.renderMobileSurfaceCard = renderMobileSurfaceCard;
window.renderMobileSwipePager = renderMobileSwipePager;
window.setupMobileSwipePagers = setupMobileSwipePagers;
window.renderMobileStatusCostMeta = renderMobileStatusCostMeta;
window.getMobilePagerActiveIndex = getMobilePagerActiveIndex;
window.setMobilePagerActiveIndex = setMobilePagerActiveIndex;
window.resetMobilePagerActiveIndex = resetMobilePagerActiveIndex;
window.captureMobilePagerStates = captureMobilePagerStates;
window.scrollChildIntoHorizontalView = scrollChildIntoHorizontalView;
