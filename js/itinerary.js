function getCompactFoodQuestTitle(label) {
  const cleaned = String(label || '')
      .replace(/[\u{1F1E6}-\u{1F1FF}]/gu, '')
      .replace(/[\u{1F300}-\u{1F9FF}]/gu, '')
      .replace(/[\u{2600}-\u{26FF}]/gu, '')
      .replace(/[\u{2700}-\u{27BF}]/gu, '')
      .replace(/\p{Emoji}/gu, '')
      .replace(/\s*[â†’>-].*$/u, '')
      .replace(/[^\w\s()&,-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

  return `${cleaned || 'Food'} - Food Quest`;
}

function stripCompactLeadingEmoji(text) {
  return String(text || '')
      .replace(/^\s*(?:\p{Extended_Pictographic}|\p{Emoji_Presentation}|\p{Emoji})+(?:\uFE0F)?\s*/gu, '')
      .replace(/^\s*[-–—:·•]+\s*/u, '')
      .trim();
}

function escapeCompactText(text) {
  return String(text || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
}

function getJourneyDisplayCost(journey) {
  if (!journey) return '';
  const ownCost = parseFloat(journey.cost || '0');
  if (ownCost > 0) return journey.cost;

  if (journey.journeyId) {
    const journeysSource = (typeof window !== 'undefined' && Array.isArray(window.journeys))
      ? window.journeys
      : (typeof journeys !== 'undefined' && Array.isArray(journeys) ? journeys : []);
    const matching = journeysSource.filter(seg => seg.journeyId === journey.journeyId);
    for (const seg of matching) {
      const segCost = parseFloat(seg.cost || '0');
      if (segCost > 0) {
        return seg.cost;
      }
    }
  }
  return journey.cost;
}

function renderCompactMetaSuffix(value) {
  const trimmed = String(value || '').trim();
  if (!trimmed) return '';
  return ` <span class="compact-meta-suffix">[${escapeCompactText(trimmed)}]</span>`;
}

function renderCompactEmojiLine({ emoji, text, duration = '', cost = '', done = false }) {
  const cleanText = escapeCompactText(stripCompactLeadingEmoji(text));
  const durationTrimmed = String(duration || '').trim();
  const costTrimmed = String(cost || '').trim();
  
  let suffixParts = [];
  if (durationTrimmed) suffixParts.push(escapeCompactText(durationTrimmed));
  if (costTrimmed) suffixParts.push(`<span class="compact-inline-meta-cost">${escapeCompactText(costTrimmed)}</span>`);
  
  const suffix = suffixParts.length > 0 ? ` <span class="compact-meta-suffix">[${suffixParts.join(' · ')}]</span>` : '';
  
  return `
    <span class="compact-line">
      <span class="compact-line-emoji">${emoji}</span>
      <span class="compact-line-text ${done ? 'is-done' : ''}">${cleanText}${suffix}</span>
    </span>
  `;
}

function parseCompactDateTime(dateStr, timeStr = '') {
  if (!dateStr) return null;
  const rawTime = String(timeStr || '').trim() || '00:00';
  const isoCandidate = `${dateStr}T${rawTime}:00`;
  const direct = new Date(isoCandidate);
  if (!Number.isNaN(direct.getTime())) return direct;

  const fallback = new Date(`${dateStr} 2026 ${rawTime}`);
  if (!Number.isNaN(fallback.getTime())) return fallback;
  return null;
}

function formatCompactJourneyDuration(segments) {
  if (!Array.isArray(segments) || segments.length === 0) return '';
  const firstSeg = segments[0];
  const lastSeg = segments[segments.length - 1];
  const depDate = firstSeg.departureDate || firstSeg.dayDate;
  const arrDate = lastSeg.arrivalDate || lastSeg.departureDate || lastSeg.dayDate;
  const dep = parseCompactDateTime(depDate, firstSeg.departureTime);
  const arr = parseCompactDateTime(arrDate, lastSeg.arrivalTime);
  if (!dep || !arr) return '';

  let diffMinutes = Math.round((arr.getTime() - dep.getTime()) / 60000);
  if (diffMinutes < 0) diffMinutes += 24 * 60;
  if (diffMinutes <= 0) return '';

  const hours = Math.floor(diffMinutes / 60);
  const minutes = diffMinutes % 60;
  if (hours === 0) return `${minutes}m`;
  return minutes > 0 ? `${hours}h${String(minutes).padStart(2, '0')}m` : `${hours}h`;
}

function renderCompactBlock(title, linesHtml, fullWidth = false) {
  if (!linesHtml) return '';
  return `
    <div class="compact-day-block${fullWidth ? ' compact-day-block-wide' : ''}">
      ${title ? `<div class="compact-day-block-title">${title}</div>` : ''}
      <div class="compact-day-block-lines">${linesHtml}</div>
    </div>
  `;
}

function getCompactDaySlideId(legId, dayIdx) {
  return `compact-day-${String(legId)}-${dayIdx}`;
}

function renderCompactFoodQuestItem(legIndex, item, itemIdx) {
  const itemId = `compact-food-${legIndex}-${itemIdx}`;
  const done = !!item.done;

  return `
    <label class="compact-food-item" for="${itemId}">
      <input
        id="${itemId}"
        type="checkbox"
        ${done ? 'checked' : ''}
        onchange="toggleFoodCompleted(event, ${legIndex}, ${itemIdx})"
      >
      <span class="compact-food-item-copy">${renderCompactEmojiLine({
    emoji: '🍽️',
    text: item.text,
    done
  })}</span>
    </label>
  `;
}

function renderCompactFoodQuestCard(leg, legIndex) {
  const foodItems = Array.isArray(leg.cityFood) ? leg.cityFood : [];
  const completedCount = foodItems.filter(item => item && item.done).length;
  const totalCount = foodItems.length;
  const countLabel = `${completedCount}/${totalCount}`;
  const progressWidth = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const foodLines = foodItems.length > 0
      ? foodItems.map((item, itemIdx) => renderCompactFoodQuestItem(legIndex, item, itemIdx)).join('')
      : '<div class="compact-day-empty">No food quests saved for this leg yet.</div>';

  return `
    <article class="mobile-surface-card compact-food-quest-card" style="--card-accent:${escapeCompactText(leg.colour || '#24485d')};">
      <div class="compact-food-summary" style="cursor: default; user-select: none;">
        <span class="compact-food-summary-title"><span class="compact-food-summary-icon" aria-hidden="true">🍗</span> Food quests</span>
        <span class="compact-food-summary-meter" aria-hidden="true"><span style="width:${progressWidth}%"></span></span>
        <span class="compact-food-summary-count">${escapeCompactText(countLabel)}</span>
      </div>
      <div class="mobile-surface-card-details expanded">
        <div class="compact-food-list">${foodLines}</div>
      </div>
    </article>
  `;
}

function renderCompactTipItem(tip) {
  const text = typeof tip === 'string' ? tip : (tip && tip.text) || '';
  return `
    <li class="compact-tip-item">
      ${renderCompactEmojiLine({
    emoji: '&#128161;',
    text: text || 'Untitled tip'
  })}
    </li>
  `;
}

function renderCompactTipsCard(leg, legIndex) {
  const tips = Array.isArray(leg.legTips) ? leg.legTips : [];
  const tipsList = tips.length > 0
      ? `<ul class="compact-tips-list">${tips.map(tip => renderCompactTipItem(tip)).join('')}</ul>`
      : '<div class="compact-day-empty">No tips saved for this leg yet.</div>';
  const countLabel = `${tips.length} tip${tips.length === 1 ? '' : 's'}`;

  return `
    <article class="mobile-surface-card compact-tips-card" style="--card-accent:${escapeCompactText(leg.colour || '#24485d')};">
      <div class="compact-tips-summary" style="cursor: default; user-select: none;">
        <span class="compact-tips-summary-title"><span class="compact-tips-summary-icon" aria-hidden="true">&#128161;</span> Tips</span>
        <span class="compact-tips-summary-count">${escapeCompactText(countLabel)}</span>
      </div>
      <div class="mobile-surface-card-details expanded">
        ${tipsList}
      </div>
    </article>
  `;
}

function renderCompactMobileLegInfoCluster(leg, legIndex) {
  const tips = Array.isArray(leg.legTips) ? leg.legTips : [];
  const foodItems = Array.isArray(leg.cityFood) ? leg.cityFood : [];
  const completedFoodCount = foodItems.filter(item => item && item.done).length;
  const legId = leg.id || String(legIndex);
  const tipsExpanded = isTipsCardExpanded(legId);
  const foodExpanded = isFoodQuestExpanded(legId);
  const tipsLabel = `${tips.length} tip${tips.length === 1 ? '' : 's'}`;
  const foodLabel = `${completedFoodCount}/${foodItems.length}`;
  const foodProgressWidth = foodItems.length > 0 ? Math.round((completedFoodCount / foodItems.length) * 100) : 0;
  const tipsList = tips.length > 0
      ? `<ul class="compact-mobile-info-list">${tips.map(tip => renderCompactTipItem(tip)).join('')}</ul>`
      : '<div class="compact-day-empty">No tips saved for this leg yet.</div>';
  const foodLines = foodItems.length > 0
      ? foodItems.map((item, itemIdx) => renderCompactFoodQuestItem(legIndex, item, itemIdx)).join('')
      : '<div class="compact-day-empty">No food quests saved for this leg yet.</div>';

  return `
    <div class="compact-mobile-leg-info">
      <div class="compact-mobile-info-chips" aria-label="Leg info">
        <button
          type="button"
          class="compact-mobile-info-chip ${tipsExpanded ? 'is-active' : ''}"
          onclick="toggleTipsCardDetails(event, '${legId}')"
          aria-expanded="${tipsExpanded ? 'true' : 'false'}"
        >
          <span class="compact-mobile-info-chip-title"><span aria-hidden="true">&#128161;</span> Tips</span>
          <span class="compact-mobile-info-chip-count">${escapeCompactText(tipsLabel)}</span>
        </button>
        <button
          type="button"
          class="compact-mobile-info-chip ${foodExpanded ? 'is-active' : ''}"
          onclick="toggleFoodQuestDetails(event, '${legId}')"
          aria-expanded="${foodExpanded ? 'true' : 'false'}"
          aria-label="Food quests ${escapeCompactText(foodLabel)} complete"
          title="Food quests"
        >
          <span class="compact-mobile-info-chip-title"><span aria-hidden="true">&#127831;</span> Food</span>
          <span class="compact-mobile-info-chip-count">${escapeCompactText(foodLabel)}</span>
          <span class="compact-mobile-info-progress" aria-hidden="true"><span style="width:${foodProgressWidth}%"></span></span>
        </button>
      </div>
      ${tipsExpanded ? `
        <div class="compact-mobile-info-panel compact-mobile-info-panel-tips">
          ${tipsList}
        </div>
      ` : ''}
      ${foodExpanded ? `
        <div class="compact-mobile-info-panel compact-mobile-info-panel-food">
          <div class="compact-food-list">${foodLines}</div>
        </div>
      ` : ''}
    </div>
  `;
}

function formatJourneySubLocationText(segments) {
  if (!Array.isArray(segments) || segments.length === 0) return '';
  const isMultiLeg = segments.length > 1;
  return segments
    .flatMap((seg, index) => {
      const legPrefix = isMultiLeg ? `Leg ${index + 1} ` : '';
      
      let fromVal = seg.fromAddress || '';
      if (fromVal && seg.fromLocation) {
        const cleanCity = String(seg.fromLocation).trim();
        if (cleanCity && !fromVal.toLowerCase().includes(cleanCity.toLowerCase())) {
          fromVal = `${fromVal} (${cleanCity})`;
        }
      }
      
      let toVal = seg.toAddress || '';
      if (toVal && seg.toLocation) {
        const cleanCity = String(seg.toLocation).trim();
        if (cleanCity && !toVal.toLowerCase().includes(cleanCity.toLowerCase())) {
          toVal = `${toVal} (${cleanCity})`;
        }
      }

      return [
        seg.fromAddress ? `${legPrefix}Depart: ${fromVal}` : '',
        seg.toAddress ? `${legPrefix}Arrive: ${toVal}` : ''
      ];
    })
    .filter(Boolean)
    .join(' | ');
}

function renderJourneySubLocationTextHtml(text) {
  const parts = String(text || '').split(' | ').map(part => part.trim()).filter(Boolean);
  if (parts.length === 0) return '';

  return `
    <div class="transport-sub-location-details daily-timeline-sub-location-details">
      ${parts.map(part => {
        const colonIndex = part.indexOf(':');
        const label = colonIndex >= 0 ? part.slice(0, colonIndex).trim() : '';
        const value = colonIndex >= 0 ? part.slice(colonIndex + 1).trim() : part;
        return `
          <span class="transport-sub-location-detail">
            ${label ? `<span class="transport-sub-location-label">${escapeCompactText(label)}</span>` : ''}
            <span class="transport-sub-location-value">
              <a href="${getMapSearchUrl(value)}" target="_blank" rel="noopener noreferrer" class="transport-sub-location-value-link">
                <span class="location-map-icon">🗺️</span> ${escapeCompactText(value)}
              </a>
            </span>
          </span>
        `;
      }).join('')}
    </div>
  `;
}

function renderCompactDaySlide(leg, legIndex, day, dayIdx, totalDays) {
  const useGroupedView = typeof window !== 'undefined' && window.itineraryDayViewMode === 'grouped';
  const dayDateLabel = typeof formatTripDateForDisplay === 'function' ? formatTripDateForDisplay(day.date) : day.date;
  const dayJourneys = getDayJourneys(day.date, day.from, day.to, leg.id);
  const dayStayInfo = getStayDisplayForDay(day.date, day.to);
  const dayTotal = getDayTotal(day);
  const routeLabel = `${day.from} → ${day.to}`;
  const slideId = getCompactDaySlideId(leg.id, dayIdx);

  const transportLines = dayJourneys.map(journey => {
    const icon = getTransportIcon(journey.transportType);
    const journeyLabel = stripCompactLeadingEmoji(
        journey.provider || journey.journeyName || journey.notes || `${journey.fromLocation}→${journey.toLocation}`
    );
    const segs = journey.journeyId ? (window.journeys || [])
        .filter(seg => seg.journeyId === journey.journeyId)
        .sort((a, b) => (a.segmentOrder || 1) - (b.segmentOrder || 1)) : [];
    const duration = formatCompactJourneyDuration(segs);
    const details = formatJourneySubLocationText(segs.length > 0 ? segs : [journey]);
    const mainLine = renderCompactEmojiLine({
      emoji: icon,
      text: journeyLabel,
      duration: duration,
      cost: getJourneyDisplayCost(journey) ? formatCurrency(getJourneyDisplayCost(journey)) : ''
    });
    const subLocsHtml = details ? `<div class="daily-timeline-sub-locations" style="padding-left: 20px; margin-top: 2px;">${renderJourneySubLocationTextHtml(details)}</div>` : '';
    return `<div class="compact-grouped-item">${mainLine}${subLocsHtml}</div>`;
  }).join('');

  const accomLines = dayStayInfo.map(info => {
    const label = info.type === 'checkin' ? 'Check-in' : info.type === 'checkout' ? 'Check-out' : 'Staying';
    const mainLine = renderCompactEmojiLine({
      emoji: '🏨',
      text: `${label}: ${info.propertyName || 'Accommodation'}`,
      duration: '',
      cost: info.cost ? formatCurrency(info.cost) : ''
    });
    const stayLoc = info.location ? (() => {
      let loc = info.location;
      const cleanCity = String(day.to).trim();
      if (cleanCity && !loc.toLowerCase().includes(cleanCity.toLowerCase())) {
        loc = `${loc} (${cleanCity})`;
      }
      return `Location: ${loc}`;
    })() : '';
    const subLocsHtml = stayLoc ? `<div class="daily-timeline-sub-locations" style="padding-left: 20px; margin-top: 2px;">${renderJourneySubLocationTextHtml(stayLoc)}</div>` : '';
    return `<div class="compact-grouped-item">${mainLine}${subLocsHtml}</div>`;
  }).join('');

  const activityLines = (day.activityItems || []).map((item, itemIdx) => {
    const doneStyle = item.done ? 'text-decoration:line-through; opacity:0.7;' : '';
    const emoji = /food/i.test(item.text || '') ? '🍽️' : '📍';
    const split = typeof _splitActivityTitle === 'function' ? _splitActivityTitle(item.text) : { title: item.text, location: '' };
    const activityLoc = split.location ? (() => {
      let loc = split.location;
      const cleanCity = String(day.to || day.from || '').trim();
      if (cleanCity && !loc.toLowerCase().includes(cleanCity.toLowerCase())) {
        loc = `${loc} (${cleanCity})`;
      }
      return `Location: ${loc}`;
    })() : '';
    const subLocsHtml = activityLoc ? `<div class="daily-timeline-sub-locations" style="padding-left: 20px; margin-top: 2px;">${renderJourneySubLocationTextHtml(activityLoc)}</div>` : '';
    return `
      <div class="compact-activity-row" style="${doneStyle}">
        <input
          type="checkbox"
          ${item.done ? 'checked' : ''}
          onchange="toggleActivityCompleted(event, ${legIndex}, ${dayIdx}, ${itemIdx})"
        >
        <div class="compact-activity-copy" style="display: flex; flex-direction: column; width: 100%;">
          ${renderCompactEmojiLine({
            emoji,
            text: split.title,
            duration: item.time || '1 hr',
            cost: item.cost ? formatCurrency(item.cost) : '',
            done: item.done
          })}
          ${subLocsHtml}
        </div>
      </div>
    `;
  }).join('');

  const timelineBlock = renderCompactBlock('', renderDailyTimeline(leg, legIndex, day, dayIdx, { compact: true }), true);
  const groupedBlock = renderCompactBlock('Grouped Plan', `
        <div class="compact-grouped-plan">
          <section><h5>Transport</h5>${transportLines || '<div class="compact-day-empty">No transport scheduled.</div>'}</section>
          <section><h5>Stay</h5>${accomLines || '<div class="compact-day-empty">No stay linked.</div>'}</section>
          <section><h5>Activities</h5>${activityLines || '<div class="compact-day-empty">Nothing planned yet.</div>'}</section>
        </div>
      `, true);
  const details = `
    <div class="compact-day-grid">
      ${useGroupedView ? groupedBlock : timelineBlock}
    </div>
  `;

  return `
    <section class="compact-day-slide" id="${slideId}" data-day-index="${dayIdx}">
      ${renderMobileSurfaceCard({
    cardClass: 'compact-day-surface',
    accentColor: leg.colour,
    dateLabel: dayDateLabel,
    title: `Day ${dayIdx + 1}`,
    subtitle: routeLabel,
    summary: `
          <div class="compact-day-summary-row">
            <span class="compact-day-summary-desc">${escapeCompactText(day.desc || 'No description yet')}</span>
            ${dayTotal ? `<span class="compact-day-total-badge">${escapeCompactText(dayTotal)}</span>` : ''}
          </div>
        `,
    primaryAction: '',
    details,
    detailsOpen: true
  })}
    </section>
  `;
}

function renderCompactDayPager(leg, legIndex) {
  const days = Array.isArray(leg.days) ? leg.days : [];
  const totalDays = days.length;
  const pagerKey = `compact-day-${leg.id}`;
  const initialIndex = typeof getMobilePagerActiveIndex === 'function'
      ? getMobilePagerActiveIndex(pagerKey, 0)
      : 0;
  if (totalDays === 0) {
    return `
      <div class="compact-day-pager compact-day-pager-empty" data-pager-key="${escapeCompactText(pagerKey)}">
        <div class="compact-day-empty">No itinerary days available for this leg yet.</div>
      </div>
    `;
  }

  const chips = days.map((day, dayIdx) => {
    const dayDateLabel = typeof formatTripDateForDisplay === 'function' ? formatTripDateForDisplay(day.date) : day.date;
    const slideId = getCompactDaySlideId(leg.id, dayIdx);
    const active = dayIdx === initialIndex;
    return `
      <button
        type="button"
        class="compact-day-chip${active ? ' active' : ''}"
        data-leg-id="${escapeCompactText(leg.id)}"
        data-day-index="${dayIdx}"
        data-target-slide="${slideId}"
        aria-selected="${active ? 'true' : 'false'}"
        aria-current="${active ? 'true' : 'false'}"
        aria-controls="${slideId}"
        onclick="return compactItineraryGoToDay(event, this.dataset.legId, this.dataset.dayIndex)"
      >
        <span class="compact-day-chip-day">Day ${dayIdx + 1}</span>
        <span class="compact-day-chip-date">${escapeCompactText(day.day)} ${escapeCompactText(dayDateLabel)}</span>
        <span class="compact-day-chip-route">${escapeCompactText(day.from)} → ${escapeCompactText(day.to)}</span>
      </button>
    `;
  }).join('');

  const slides = days.map((day, dayIdx) => renderCompactDaySlide(leg, legIndex, day, dayIdx, totalDays)).join('');

  return `
      <div class="compact-day-pager" data-leg-id="${escapeCompactText(leg.id)}" data-total-days="${totalDays}" data-pager-key="${escapeCompactText(pagerKey)}" data-active-index="${initialIndex}">
        <div class="compact-day-pager-head">
          <div class="compact-day-pager-copy">
            <span class="compact-day-pager-position" data-role="compact-day-position">Day 1 of ${totalDays}</span>
          </div>
          <div class="compact-day-pager-counter" data-role="compact-day-counter">1/${totalDays}</div>
        </div>
      <div class="compact-day-rail" role="tablist" aria-label="Days for ${escapeCompactText(leg.label || 'this leg')}">
        ${chips}
      </div>
      <div class="compact-day-progress" aria-hidden="true">
        <span class="compact-day-progress-fill" data-role="compact-day-progress-fill"></span>
      </div>
      <div class="compact-day-carousel" data-leg-id="${escapeCompactText(leg.id)}">
        ${slides}
      </div>
    </div>
  `;
}

function setupCompactItineraryPagers(root = document) {
  const pagers = root.querySelectorAll('.compact-day-pager');
  pagers.forEach(pager => {
    const carousel = pager.querySelector('.compact-day-carousel');
    const rail = pager.querySelector('.compact-day-rail');
    const slides = Array.from(pager.querySelectorAll('.compact-day-slide'));
    const chips = Array.from(pager.querySelectorAll('.compact-day-chip'));
    const positionLabel = pager.querySelector('[data-role="compact-day-position"]');
    const counterLabel = pager.querySelector('[data-role="compact-day-counter"]');
    const progressFill = pager.querySelector('[data-role="compact-day-progress-fill"]');
    const pagerKey = pager.dataset.pagerKey || '';

    if (!carousel || slides.length === 0) return;

    const total = slides.length;
    let suppressObserver = false;
    let scrollFrame = 0;
    const initialIndex = typeof getMobilePagerActiveIndex === 'function'
        ? getMobilePagerActiveIndex(pagerKey, Number(pager.dataset.activeIndex || 0))
        : Number(pager.dataset.activeIndex || 0);

    const setActive = nextIndex => syncCompactDayPagerState(pager, nextIndex, {
      chips,
      slides,
      total,
      rail,
      positionLabel,
      counterLabel,
      progressFill,
      pagerKey
    });

    const scrollToIndex = nextIndex => {
      const slide = slides[nextIndex];
      if (!slide) return;
      suppressObserver = true;
      if (typeof scrollChildIntoHorizontalView === 'function') {
        scrollChildIntoHorizontalView(carousel, slide, { behavior: 'smooth', align: 'start' });
      } else {
        carousel.scrollTo({
          left: Math.max(0, slide.offsetLeft - carousel.offsetLeft),
          behavior: 'smooth'
        });
      }
      setActive(nextIndex);
      window.setTimeout(() => {
        suppressObserver = false;
      }, 420);
    };

    pager.__compactScrollToIndex = scrollToIndex;
    pager.__compactSetActive = setActive;

    chips.forEach(chip => {
      chip.addEventListener('click', () => {
        scrollToIndex(Number(chip.dataset.dayIndex || 0));
      });
    });

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(entries => {
        if (suppressObserver) return;

        const visibleEntry = entries
            .filter(entry => entry.isIntersecting)
            .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (!visibleEntry) return;
        const nextIndex = Number(visibleEntry.target.dataset.dayIndex || 0);
        if (!Number.isNaN(nextIndex)) {
          setActive(nextIndex);
        }
      }, {
        root: carousel,
        threshold: [0.55, 0.7, 0.85]
      });

      slides.forEach(slide => observer.observe(slide));
      pager.__compactObserver = observer;
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

function captureCompactDayPagerStates(root = document) {
  if (!root) return;
  root.querySelectorAll('.compact-day-pager').forEach(pager => {
    const pagerKey = pager.dataset.pagerKey || '';
    if (!pagerKey || typeof setMobilePagerActiveIndex !== 'function') return;

    const carousel = pager.querySelector('.compact-day-carousel');
    const slides = Array.from(pager.querySelectorAll('.compact-day-slide'));
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

function restoreCompactDayPagerScrollPositions(root = document) {
  if (!root) return;
  root.querySelectorAll('.compact-day-pager').forEach(pager => {
    const carousel = pager.querySelector('.compact-day-carousel');
    const slides = Array.from(pager.querySelectorAll('.compact-day-slide'));
    if (!carousel || slides.length === 0) return;

    const pagerKey = pager.dataset.pagerKey || '';
    const activeIndex = typeof getMobilePagerActiveIndex === 'function'
        ? getMobilePagerActiveIndex(pagerKey, Number(pager.dataset.activeIndex || 0))
        : Number(pager.dataset.activeIndex || 0);
    const safeIndex = Math.max(0, Math.min(slides.length - 1, Number(activeIndex) || 0));
    const slide = slides[safeIndex];
    carousel.scrollLeft = Math.max(0, slide.offsetLeft - carousel.offsetLeft);
  });
}

function syncCompactDayPagerState(pager, nextIndex, context = {}) {
  if (!pager) return;

  const chips = context.chips || Array.from(pager.querySelectorAll('.compact-day-chip'));
  const slides = context.slides || Array.from(pager.querySelectorAll('.compact-day-slide'));
  const total = Math.max(1, context.total || slides.length || 1);
  const rail = context.rail || pager.querySelector('.compact-day-rail');
  const positionLabel = context.positionLabel || pager.querySelector('[data-role="compact-day-position"]');
  const counterLabel = context.counterLabel || pager.querySelector('[data-role="compact-day-counter"]');
  const progressFill = context.progressFill || pager.querySelector('[data-role="compact-day-progress-fill"]');
  const pagerKey = context.pagerKey || pager.dataset.pagerKey || '';
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

  if (positionLabel) positionLabel.textContent = `Day ${safeIndex + 1} of ${total}`;
  if (counterLabel) counterLabel.textContent = `${safeIndex + 1}/${total}`;
  if (progressFill) progressFill.style.width = `${((safeIndex + 1) / total) * 100}%`;
  pager.dataset.activeIndex = String(safeIndex);
  if (pagerKey && typeof setMobilePagerActiveIndex === 'function') {
    setMobilePagerActiveIndex(pagerKey, safeIndex);
  }

  const activeChip = chips[safeIndex];
  if (rail && activeChip) {
    if (typeof scrollChildIntoHorizontalView === 'function') {
      scrollChildIntoHorizontalView(rail, activeChip, { behavior: 'auto', align: 'center' });
    } else {
      rail.scrollLeft = Math.max(0, activeChip.offsetLeft - rail.offsetLeft - (rail.clientWidth - activeChip.offsetWidth) / 2);
    }
  }
}

function compactItineraryGoToDay(event, legId, dayIndex) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }

  const pager = Array.from(document.querySelectorAll('.compact-day-pager')).find(el => el.dataset.legId === String(legId));
  if (!pager) return false;

  const nextIndex = Math.max(0, Number(dayIndex) || 0);
  if (typeof pager.__compactScrollToIndex === 'function') {
    pager.__compactScrollToIndex(nextIndex);
    return false;
  }

  syncCompactDayPagerState(pager, nextIndex);

  const carousel = pager.querySelector('.compact-day-carousel');
  const slide = pager.querySelector(`.compact-day-slide[data-day-index="${nextIndex}"]`);
  if (carousel && slide) {
    carousel.scrollTo({
      left: Math.max(0, slide.offsetLeft - carousel.offsetLeft),
      behavior: 'smooth'
    });
  }
  return false;
}

function renderCompactLegCard(leg, legIndex) {
  const daysCount = Array.isArray(leg.days) ? leg.days.length : 0;
  const nightLabel = getLegNightSummary(leg).label;
  const legCost = getLegTotalCost(leg);
  const firstDay = leg.days && leg.days[0];
  const lastDay = leg.days && leg.days[daysCount - 1];
  const legDateRange = firstDay && lastDay
      ? `${typeof formatTripDateForDisplay === 'function' ? formatTripDateForDisplay(firstDay.date) : firstDay.date} - ${typeof formatTripDateForDisplay === 'function' ? formatTripDateForDisplay(lastDay.date) : lastDay.date}`
      : (firstDay ? (typeof formatTripDateForDisplay === 'function' ? formatTripDateForDisplay(firstDay.date) : firstDay.date) : '');
  const routeLabel = firstDay && lastDay
      ? `${firstDay.day || 'Day'} ${firstDay.date} - ${lastDay.day || 'Day'} ${lastDay.date}`
      : `${daysCount} day${daysCount !== 1 ? 's' : ''}`;
  const legLabel = leg.label && !/^trip leg$/i.test(String(leg.label).trim())
      ? leg.label
      : '';
  const displayLegLabel = legLabel || routeLabel || `Leg ${legIndex + 1}`;

  return `
    <article class="compact-leg-card" style="--leg-accent:${escapeHtmlText(leg.colour || '#24485d')}">
      <div class="leg-header compact-leg-header" style="background:${leg.colour}; cursor:default;">
        <div class="compact-leg-header-line">
          <span class="compact-leg-date">${escapeHtmlText(legDateRange || '-')}</span>
          <span class="compact-leg-label">${escapeHtmlText(displayLegLabel)}</span>
          <span class="compact-leg-cost-badge">${formatCurrency(legCost)}</span>
          <span class="compact-leg-night-count">${escapeHtmlText(nightLabel)}</span>
        </div>
      </div>
      <div class="compact-leg-body">
        ${renderCompactTipsCard(leg, legIndex)}
        ${renderCompactFoodQuestCard(leg, legIndex)}
        ${renderCompactDayPager(leg, legIndex)}
      </div>
    </article>
  `;
}

function buildCompactItinerary() {
  const container = document.getElementById('itinerary');
  if (!container) return;

  container.innerHTML = '';

  const slidesHtml = [];
  const railHtml = [];

  appData.forEach((leg, legIndex) => {
    const daysCount = Array.isArray(leg.days) ? leg.days.length : 0;
    const nightLabel = getLegNightSummary(leg).label;
    const legCost = getLegTotalCost(leg);
    const firstDay = leg.days && leg.days[0];
    const lastDay = leg.days && leg.days[daysCount - 1];
    const legDateRange = firstDay && lastDay
        ? `${typeof formatTripDateForDisplay === 'function' ? formatTripDateForDisplay(firstDay.date) : firstDay.date} → ${typeof formatTripDateForDisplay === 'function' ? formatTripDateForDisplay(lastDay.date) : lastDay.date}`
        : (firstDay ? (typeof formatTripDateForDisplay === 'function' ? formatTripDateForDisplay(firstDay.date) : firstDay.date) : '');
    const routeLabel = firstDay && lastDay
        ? `${firstDay.day || 'Day'} ${firstDay.date} → ${lastDay.day || 'Day'} ${lastDay.date}`
        : `${daysCount} day${daysCount !== 1 ? 's' : ''}`;
    const legLabel = leg.label && !/^trip leg$/i.test(String(leg.label).trim())
        ? leg.label
        : '';
    const displayLegLabel = legLabel || routeLabel || `Leg ${legIndex + 1}`;
    const chipDateRange = firstDay && lastDay
        ? `${firstDay.date}${lastDay.date && lastDay.date !== firstDay.date ? ` → ${lastDay.date}` : ''}`
        : (firstDay ? firstDay.date : '');

    const legCard = `
      <article class="compact-leg-card" style="--leg-accent:${escapeHtmlText(leg.colour || '#24485d')}">
        <div class="leg-header compact-leg-header" style="background:${leg.colour}; cursor:default;">
          <div class="compact-leg-header-line">
            <span class="compact-leg-date">${escapeHtmlText(legDateRange || '—')}</span>
            <span class="compact-leg-label">${escapeHtmlText(displayLegLabel)}</span>
            <span class="compact-leg-cost-badge">${formatCurrency(legCost)}</span>
            <span class="compact-leg-night-count">${escapeHtmlText(nightLabel)}</span>
          </div>
        </div>
        <div class="compact-leg-body">
          ${renderCompactMobileLegInfoCluster(leg, legIndex)}
          ${renderCompactDayPager(leg, legIndex)}
        </div>
      </article>
    `;

    slidesHtml.push(`
      <div id="city-slide-${legIndex}" class="mobile-swipe-slide compact-city-slide" data-role="mobile-swipe-slide" data-slide-index="${legIndex}">
        ${legCard}
      </div>
    `);
    railHtml.push(`
      <button type="button" class="mobile-swipe-chip compact-city-chip" data-role="mobile-swipe-chip" data-slide-index="${legIndex}" aria-controls="city-slide-${legIndex}" aria-selected="${legIndex === 0 ? 'true' : 'false'}">
        <span class="mobile-swipe-chip-eyebrow">${escapeHtmlText(chipDateRange || 'Trip')}</span>
        <span class="mobile-swipe-chip-title">${escapeHtmlText(displayLegLabel)}</span>
        <span class="mobile-swipe-chip-route">${escapeHtmlText(nightLabel)}</span>
      </button>
    `);
  });

  const pagerRoot = document.createElement('div');
  pagerRoot.className = 'compact-city-swipe-root';
  pagerRoot.innerHTML = renderMobileSwipePager({
    pagerClass: 'compact-city-swipe-pager',
    pagerKey: 'compact-city-swipe',
    positionPrefix: 'Trip',
    railHtml: railHtml.join(''),
    slidesHtml: slidesHtml.join(''),
    ariaLabel: 'Itinerary city cards'
  });

  container.appendChild(pagerRoot);
  setupMobileSwipePagers(container);
}

function buildCompactItineraryDesktop() {
  const container = document.getElementById('itinerary');
  if (!container) return;

  container.innerHTML = '';

  const stack = document.createElement('div');
  stack.className = 'compact-desktop-stack';
  stack.innerHTML = appData.map((leg, legIndex) => `
    <section class="compact-desktop-leg" id="leg-${escapeHtmlText(leg.id || `compact-${legIndex}`)}">
      ${renderCompactLegCard(leg, legIndex)}
    </section>
  `).join('');

  container.appendChild(stack);
  setupCompactItineraryPagers(container);
}

function buildCompactItineraryLegacy() {
  const container = document.getElementById('itinerary');
  container.innerHTML = '';

  appData.forEach((leg, legIndex) => {
    const section = document.createElement('div');
    section.className = 'leg';
    section.id = 'leg-' + leg.id;

    const daysCount = leg.days.length;
    const nightLabel = getLegNightSummary(leg).label;

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

    if ((leg.cityFood || []).length > 0) {
      html += `
      <div style="margin:4px 0 8px; padding:6px 8px 5px; background:rgba(255,255,255,0.74); border-left:3px solid ${leg.colour}; border-radius:8px; font-size:10px; line-height:1.25;">
        <div style="display:flex; align-items:center; justify-content:space-between; gap:6px; margin-bottom:4px; color:#4A4A4A;">
          <strong style="font-size:10px;">${getCompactFoodQuestTitle(leg.label)}</strong>
          <span style="font-size:9px; color:#7A7A7A;">Must eat items</span>
        </div>
        <div style="display:flex; flex-direction:column; gap:3px;">
          ${(leg.cityFood || []).map((f, i) => `
            <label style="display:flex; align-items:flex-start; gap:6px; font-size:10px; color:#495057; cursor:pointer;">
              <input type="checkbox" ${f.done ? 'checked' : ''}
                onchange="toggleFoodCompleted(event, ${legIndex}, ${i})"
                style="width:12px; height:12px; accent-color:#27AE60; margin-top:1px;">
              <span style="line-height:1.3; ${f.done ? 'text-decoration:line-through; opacity:0.65;' : ''}">${renderCompactEmojiLine({ emoji: '🍽️', text: f.text, done: f.done })}</span>
            </label>
          `).join('')}
        </div>
      </div>`;
    }

    leg.days.forEach((day, dayIdx) => {
      {
      const dayTotal = getDayTotal(day);
      const dayDateLabel = typeof formatTripDateForDisplay === 'function' ? formatTripDateForDisplay(day.date) : day.date;
      const dayJourneys = getDayJourneys(day.date, day.from, day.to, leg.id);
      const dayStayInfo = getStayDisplayForDay(day.date, day.to);
      const transportLines = dayJourneys.map(j => {
        const icon = getTransportIcon(j.transportType);
        const journeyLabel = stripCompactLeadingEmoji(j.provider || j.journeyName || j.notes || `${j.fromLocation}→${j.toLocation}`);
        const segs = (window.journeys || [])
          .filter(seg => seg.journeyId === j.journeyId)
          .sort((a, b) => (a.segmentOrder || 1) - (b.segmentOrder || 1));
        const duration = formatCompactJourneyDuration(segs);
        const details = formatJourneySubLocationText(segs.length > 0 ? segs : [j]);
        return renderCompactEmojiLine({ emoji: icon, text: [journeyLabel, details].filter(Boolean).join(' | '), duration });
      }).join('');
      const accomLines = dayStayInfo.map(info => renderCompactEmojiLine({
        emoji: '🏨',
        text: info.propertyName || 'Accommodation'
      })).join('');
      const activityLines = (day.activityItems || []).map((item, itemIdx) => {
        const doneStyle = item.done ? 'text-decoration:line-through; opacity:0.7;' : '';
        const emoji = /food/i.test(item.text || '') ? '🍽️' : '📍';
        return `
          <div style="display:flex; align-items:flex-start; gap:6px; ${doneStyle}">
            <input type="checkbox" ${item.done ? 'checked' : ''}
              onchange="toggleActivityCompleted(event, ${legIndex}, ${dayIdx}, ${itemIdx})"
              style="width:12px; height:12px; accent-color:#27AE60; margin-top:1px;">
            <div style="min-width:0;">${renderCompactEmojiLine({ emoji, text: item.text, duration: item.time || '1 hr', done: item.done })}</div>
          </div>`;
        }).join('');

        html += `<div class="compact-day-card" style="margin:0; border-top:1px solid rgba(0,0,0,0.08);">
      <div class="compact-day-top" style="display:flex; gap:6px; align-items:center; font-size:11px; padding:4px 0;">
        <span class="compact-day-label" style="font-weight:600;">${day.day} ${dayDateLabel}</span>
        <span class="compact-day-route" style="font-size:10px;">${day.from} → ${day.to}</span>
        <span class="compact-day-desc" style="font-size:9px; color:#666; flex:1;">${day.desc || ''}</span>
      </div>
      <div class="compact-day-grid" style="display:grid; grid-template-columns:repeat(2, minmax(0, 1fr)); gap:6px; margin-top:5px; font-size:10px;">
        ${renderCompactBlock('Transport', transportLines)}
        ${renderCompactBlock('Accom', accomLines)}
        ${renderCompactBlock('Activities', activityLines, true)}
      </div>
      </div></div>`;
        return;
      }
      html += `<div style="margin:0; border-top:1px solid rgba(0,0,0,0.08);">
      <div style="display:flex; gap:6px; align-items:center; font-size:11px; padding:4px 0;">
        <span style="font-weight:600;">${day.day} ${dayDateLabel}</span>
        <span style="font-size:10px;">${day.from} → ${day.to}</span>
        <span style="font-size:9px; color:#666; flex:1;">${day.desc || ''}</span>
      </div>

      <div style="display:flex; gap:8px; margin-top:4px; font-size:10px;">`;

      // Display transport from journeys
      const dayJourneys = getDayJourneys(day.date, day.from, day.to, leg.id);
      if (dayJourneys.length > 0) {
        html += '<div style="flex:1;"><strong>Transport</strong> ';
        html += dayJourneys.map(j => {
          const status = j.status || 'planned';
          const statusText = status === 'booked' ? 'Booked' : 'Planned';
          const icon = getTransportIcon(j.transportType);
          const journeyLabel = stripCompactLeadingEmoji(j.notes || `${j.fromLocation}→${j.toLocation}`);
          const segs = (window.journeys || [])
              .filter(seg => seg.journeyId === j.journeyId)
              .sort((a, b) => (a.segmentOrder || 1) - (b.segmentOrder || 1));
          const duration = j.isMultiLeg && typeof calculateJourneyDuration === 'function' && segs.length > 0
              ? `${calculateJourneyDuration(segs)}h`
              : '';
          const details = formatJourneySubLocationText(segs.length > 0 ? segs : [j]);
          return `${renderCompactEmojiLine({ emoji: icon, text: [journeyLabel, details].filter(Boolean).join(' | '), duration })} <span style="color:${status === 'booked' ? '#27AE60' : '#E67E22'}">${statusText}</span>`;
        }).join(', ');
        html += '</div>';
      }


      // Display stay info derived from stays[] based on date matching
      const dayStayInfo = getStayDisplayForDay(day.date, day.to);
      if (dayStayInfo.length > 0) {
        html += '<div style="flex:1;">';
        html += dayStayInfo.map(info => {
          const icon = info.type === 'checkin' ? '🏨' : info.type === 'checkout' ? '🚪' : '🏨';
          const label = info.type === 'checkin' ? 'Check-in' : info.type === 'checkout' ? 'Check-out' : 'Staying';
          return `<span style="margin-right:12px;">${renderCompactEmojiLine({ emoji: icon, text: `${label}: ${info.propertyName}` })}</span>`;
        }).join('');
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
            ${renderCompactEmojiLine({ emoji: '📍', text: item.text, duration: item.time || '1 hr', done: item.done })}
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

// Parse "8 Jun" style dates to ISO for comparisons.
function normalizeDate(dateStr, year = 2026) {
  if (typeof normalizeTripDateValue === 'function') return normalizeTripDateValue(dateStr, year);
  if (!dateStr) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;

  const match = dateStr.match(/^(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)$/);
  if (!match) return dateStr;

  const monthMap = {
    Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06',
    Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12'
  };
  const day = match[1].padStart(2, '0');
  const month = monthMap[match[2]];
  return `${year}-${month}-${day}`;
}

// Derive stay display rows for both full and compact itinerary builders.
function getStayDisplayForDay(dayDate, dayCity) {
  const staysData = Array.isArray(stays)
      ? stays
      : (typeof window !== 'undefined' && Array.isArray(window.stays) ? window.stays : []);

  if (!Array.isArray(staysData) || staysData.length === 0) return [];

  const normalizedDayDate = normalizeDate(dayDate);
  const matchedCity = typeof citiesData !== 'undefined'
      ? citiesData.find(c => c.name === dayCity)
      : null;
  const matchedCityId = matchedCity ? matchedCity.id : null;
  const result = [];

  staysData.forEach(stay => {
    if (!stay) return;
    if (matchedCityId && stay.cityId && stay.cityId !== matchedCityId) return;

    const checkInDate = normalizeDate(stay.checkIn) || '';
    const checkOutDate = normalizeDate(stay.checkOut) || '';

    if (normalizedDayDate === checkInDate) {
      result.push({
        type: 'checkin',
        stayId: stay.id,
        propertyName: stay.propertyName,
        location: stay.location || '',
        provider: stay.provider,
        status: stay.status,
        bookingRef: stay.bookingRef,
        cost: stay.totalCost,
        startTime: stay.checkInTime || '15:00',
        endTime: '',
        done: !!stay.done
      });
      return;
    }

    if (normalizedDayDate === checkOutDate) {
      result.push({
        type: 'checkout',
        stayId: stay.id,
        propertyName: stay.propertyName,
        location: stay.location || '',
        provider: stay.provider,
        status: stay.status,
        bookingRef: stay.bookingRef,
        cost: stay.totalCost,
        startTime: stay.checkOutTime || '11:00',
        endTime: '',
        done: !!stay.done
      });
      return;
    }

    if (normalizedDayDate > checkInDate && normalizedDayDate < checkOutDate) {
      result.push({
        type: 'staying',
        stayId: stay.id,
        propertyName: stay.propertyName,
        location: stay.location || '',
        provider: stay.provider,
        status: stay.status,
        bookingRef: null,
        cost: null,
        startTime: '',
        endTime: '',
        done: !!stay.done
      });
    }
  });

  return result;
}

function formatTimelineTimeRange(startTime = '', endTime = '') {
  const start = String(startTime || '').trim();
  const end = String(endTime || '').trim();
  if (start && end) return `${start}-${end}`;
  return start || end || 'Anytime';
}

function getDailyTimelineItemSortValue(dayDate, startTime, fallbackOffset = 0) {
  const hasTime = !!String(startTime || '').trim();
  const fallback = Number.MAX_SAFE_INTEGER - 100000 + fallbackOffset;
  const score = getTimelineScore(dayDate, startTime || '', fallback);
  return hasTime ? score : fallback;
}

function buildDailyTimelineItems(leg, legIndex, day, dayIndex) {
  const items = [];
  const dayDate = normalizeDate(day?.date || '');
  const dayJourneys = typeof getDayJourneys === 'function'
    ? getDayJourneys(day.date, day.from, day.to, leg.id)
    : [];

  dayJourneys.forEach((journey, journeyIndex) => {
    const journeysSource = (typeof window !== 'undefined' && Array.isArray(window.journeys))
      ? window.journeys
      : (typeof journeys !== 'undefined' && Array.isArray(journeys) ? journeys : []);
    const segments = journeysSource
      .filter(seg => (seg.journeyId || seg.id) === (journey.journeyId || journey.id))
      .sort((a, b) => (a.segmentOrder || 1) - (b.segmentOrder || 1));
    const first = segments[0] || journey;
    const last = segments[segments.length - 1] || journey;
    const route = segments.length > 1
      ? [first.fromLocation, ...segments.map(seg => seg.toLocation)].filter(Boolean).join(' -> ')
      : [journey.fromLocation, journey.toLocation].filter(Boolean).join(' -> ');
    const startTime = first.departureTime || journey.departureTime || '';
    const endTime = last.arrivalTime || journey.arrivalTime || '';
    const startDate = normalizeDate(first.departureDate || first.dayDate || journey.departureDate || journey.dayDate || dayDate);
    const endDate = normalizeDate(last.arrivalDate || last.departureDate || journey.arrivalDate || journey.departureDate || dayDate);
    const crossDate = endDate && startDate && endDate !== startDate ? ` Arrives ${formatTripDateForDisplay(endDate)}` : '';

    const subLocations = formatJourneySubLocationText(segments.length > 0 ? segments : [journey]);

    items.push({
      type: 'transport',
      typeLabel: 'Transport',
      icon: getTransportIcon(journey.transportType),
      title: journey.journeyName || route || 'Transport',
      meta: [journey.provider, journey.routeCode, journey.bookingReference ? `Ref ${journey.bookingReference}` : '', crossDate.trim()].filter(Boolean).join(' · '),
      subLocations: subLocations,
      cost: getJourneyDisplayCost(journey),
      status: journey.status || 'planned',
      startTime,
      endTime,
      sortValue: getDailyTimelineItemSortValue(startDate || dayDate, startTime, journeyIndex),
      actionHtml: '',
      journeyId: journey.id,
      done: !!journey.done
    });
  });

  getStayDisplayForDay(day.date, day.to).forEach((stayInfo, stayIndex) => {
    const label = stayInfo.type === 'checkin' ? 'Check-in' : stayInfo.type === 'checkout' ? 'Check-out' : 'Staying';
    const icon = stayInfo.type === 'checkout' ? '🚪' : '🏨';
    items.push({
      type: 'stay',
      typeLabel: label,
      icon,
      title: `${label}: ${stayInfo.propertyName || 'Accommodation'}`,
      meta: [stayInfo.provider, stayInfo.bookingRef ? `Ref ${stayInfo.bookingRef}` : '', stayInfo.status].filter(Boolean).join(' · '),
      subLocations: stayInfo.location ? (() => {
        let loc = stayInfo.location;
        const cleanCity = String(day.to).trim();
        if (cleanCity && !loc.toLowerCase().includes(cleanCity.toLowerCase())) {
          loc = `${loc} (${cleanCity})`;
        }
        return `Location: ${loc}`;
      })() : '',
      cost: stayInfo.cost,
      status: stayInfo.status || '',
      startTime: stayInfo.startTime || '',
      endTime: stayInfo.endTime || '',
      sortValue: getDailyTimelineItemSortValue(dayDate, stayInfo.startTime, 2000 + stayIndex),
      stayId: stayInfo.stayId,
      done: !!stayInfo.done
    });
  });

  (day.activityItems || []).forEach((item, itemIndex) => {
    const emoji = /food/i.test(item.text || '') ? '🍽️' : '📍';
    const split = typeof _splitActivityTitle === 'function' ? _splitActivityTitle(item.text) : { title: item.text, location: '' };
    const activityLoc = split.location ? (() => {
      let loc = split.location;
      const cleanCity = String(day.to || day.from || '').trim();
      if (cleanCity && !loc.toLowerCase().includes(cleanCity.toLowerCase())) {
        loc = `${loc} (${cleanCity})`;
      }
      return `Location: ${loc}`;
    })() : '';

    items.push({
      type: 'activity',
      typeLabel: 'Activity',
      icon: emoji,
      title: split.title || 'Activity',
      subLocations: activityLoc,
      meta: [item.time || ''].filter(Boolean).join(' · '),
      cost: item.cost,
      done: !!item.done,
      startTime: item.startTime || '',
      endTime: item.endTime || '',
      legIndex,
      dayIndex,
      itemIndex,
      sortValue: getDailyTimelineItemSortValue(dayDate, item.startTime, 4000 + itemIndex),
      actionHtml: `
        <button class="del-btn" title="Remove Activity" onclick="event.stopPropagation(); deleteDayItem(${legIndex}, ${dayIndex}, 'activityItems', ${itemIndex})">×</button>
      `
    });
  });

  return items.sort((a, b) => {
    if (a.sortValue !== b.sortValue) return a.sortValue - b.sortValue;
    return String(a.title || '').localeCompare(String(b.title || ''));
  });
}

function getDailyTimelineBuckets(items) {
  return {
    scheduled: items.filter(item => String(item.startTime || item.endTime || '').trim()),
    anytime: items.filter(item => !String(item.startTime || item.endTime || '').trim())
  };
}

function renderDailyTimelineRow(item, compact = false) {
  const isTimeClickable = isEditMode && item.type === 'activity';
  const timeClass = "daily-timeline-time" + (isTimeClickable ? " is-clickable" : "");
  const timeOnClick = isTimeClickable
    ? ` role="button" tabindex="0" onclick="event.stopPropagation(); openDayItemScheduleDialog(${item.legIndex}, ${item.dayIndex}, 'activityItems', ${item.itemIndex})"`
    : '';

  let checkboxHtml = '';
  let editBtnHtml = '';
  if (item.type === 'activity') {
    checkboxHtml = `<input type="checkbox" class="daily-timeline-checkbox activity-checkbox" ${item.done ? 'checked' : ''} onchange="event.stopPropagation(); toggleActivityCompleted(event, ${item.legIndex}, ${item.dayIndex}, ${item.itemIndex})">`;
    if (isEditMode) {
      editBtnHtml = `<button class="edit-btn" title="Edit Activity" onclick="event.stopPropagation(); openEditDayActivityModal(${item.legIndex}, ${item.dayIndex}, ${item.itemIndex})">✎</button>`;
    }
  } else if (item.type === 'transport') {
    checkboxHtml = `<input type="checkbox" class="daily-timeline-checkbox transport-checkbox" ${item.done ? 'checked' : ''} onchange="event.stopPropagation(); toggleJourneyCompleted(event, '${item.journeyId}')">`;
  } else if (item.type === 'stay' || item.type === 'checkin' || item.type === 'checkout' || item.type === 'staying') {
    checkboxHtml = `<input type="checkbox" class="daily-timeline-checkbox stay-checkbox" ${item.done ? 'checked' : ''} onchange="event.stopPropagation(); toggleStayCompleted(event, '${item.stayId}')">`;
  }

  return `
    <div class="daily-timeline-item daily-timeline-item-${escapeCompactText(item.type)} ${item.done ? 'is-done' : ''}">
      <div class="${timeClass}"${timeOnClick}>${escapeCompactText(formatTimelineTimeRange(item.startTime, item.endTime))}</div>
      <div class="daily-timeline-marker"><span>${item.icon}</span></div>
      <div class="daily-timeline-content">
        <div class="daily-timeline-title-row">
          <span class="daily-timeline-type">${escapeCompactText(item.typeLabel || item.type)}</span>
          <div class="daily-timeline-title-and-checkbox">
            <span class="daily-timeline-title">${escapeCompactText(item.title)}</span>
            ${editBtnHtml}
            ${checkboxHtml}
          </div>
        </div>
        ${(item.meta || item.cost) ? `<div class="daily-timeline-meta">${escapeCompactText(item.meta || '')}${item.cost ? `<span class="timeline-inline-meta-cost"> · ${formatCurrency(item.cost)}</span>` : ''}</div>` : ''}
        ${item.subLocations ? `<div class="daily-timeline-sub-locations">${renderJourneySubLocationTextHtml(item.subLocations)}</div>` : ''}
      </div>
      ${item.actionHtml ? `<div class="daily-timeline-actions">${item.actionHtml}</div>` : ''}
    </div>
  `;
}

function renderDailyTimeline(leg, legIndex, day, dayIndex, options = {}) {
  const items = buildDailyTimelineItems(leg, legIndex, day, dayIndex);
  const compact = !!options.compact;
  const empty = compact
    ? '<div class="compact-day-empty">No scheduled items yet.</div>'
    : '<div class="timeline-empty">No scheduled items yet. Add transport, stays, or activities to build the day.</div>';
  if (items.length === 0) return empty;
  const { scheduled, anytime } = getDailyTimelineBuckets(items);
  const summaryParts = [
    scheduled.length ? `${scheduled.length} scheduled` : '',
    anytime.length ? `${anytime.length} anytime` : ''
  ].filter(Boolean).join(' · ');

  return `
    <div class="daily-timeline-shell ${compact ? 'daily-timeline-shell-compact' : ''}">
      ${summaryParts ? `<div class="daily-timeline-summary">${escapeCompactText(summaryParts)}</div>` : ''}
      ${scheduled.length ? `
        <div class="timeline-section-label">Scheduled</div>
        <div class="daily-timeline ${compact ? 'daily-timeline-compact' : ''}">
          ${scheduled.map(item => renderDailyTimelineRow(item, compact)).join('')}
        </div>
      ` : '<div class="timeline-empty">No timed entries yet. Add start times to build the day timeline.</div>'}
      ${anytime.length ? `
        <div class="timeline-anytime">
          <div class="timeline-anytime-label">Anytime</div>
          <div class="timeline-anytime-list">
            ${anytime.map(item => renderDailyTimelineRow(item, compact)).join('')}
          </div>
        </div>
      ` : ''}
    </div>
  `;
}

function getLegStayNightCount(leg) {
  const staysData = Array.isArray(stays)
      ? stays
      : (typeof window !== 'undefined' && Array.isArray(window.stays) ? window.stays : []);

  if (!Array.isArray(staysData) || staysData.length === 0 || !leg) return 0;

  const legCityName = cleanCityNavLabel(leg.label || leg.subtitle || leg.desc || '').toLowerCase();
  const legCity = legCityName ? getCityByName(legCityName) : null;
  const legCityId = legCity ? legCity.id : (leg.id ? `city-${String(leg.id).replace(/^city-/, '')}` : '');
  const legCityIdNormalized = String(legCityId || '').toLowerCase();

  return staysData.reduce((total, stay) => {
    if (!stay) return total;

    const stayCityId = String(stay.cityId || '').toLowerCase();
    const stayCityName = cleanCityNavLabel(getCityNameForNavId(stay.cityId) || stay.city || '').toLowerCase();
    const matchesLegCity =
        (legCityIdNormalized && stayCityId === legCityIdNormalized) ||
        (legCityName && stayCityName === legCityName);

    if (!matchesLegCity) return total;

    const stayNights = Number(stay.nights) || (typeof calculateNightsBetween === 'function'
        ? calculateNightsBetween(stay.checkIn, stay.checkOut)
        : 0);

    return total + Math.max(0, stayNights);
  }, 0);
}

function getLegNightSummary(leg) {
  const stayNights = getLegStayNightCount(leg);
  if (stayNights > 0) {
    return {
      label: `${stayNights} night${stayNights !== 1 ? 's' : ''}`,
      isTransit: false,
      nights: stayNights
    };
  }

  if (isTransitLegForDisplay(leg)) {
    return {
      label: 'Day Transit / Stop',
      isTransit: true,
      nights: 0
    };
  }

  const fallbackNights = Array.isArray(leg && leg.days) && leg.days.length > 0 ? leg.days.length : 1;
  return {
    label: `${fallbackNights} night${fallbackNights !== 1 ? 's' : ''}`,
    isTransit: false,
    nights: fallbackNights
  };
}

function isTransitLegForDisplay(leg) {
  if (!leg || !Array.isArray(leg.days) || leg.days.length === 0) return false;
  if (getLegStayNightCount(leg) > 0) return false;
  if (leg.days.length > 1) return false;

  const legText = [
    leg.label,
    leg.subtitle,
    leg.desc,
    ...leg.days.flatMap(day => [day.desc, day.headline, day.accom, day.from, day.to])
  ]
      .filter(Boolean)
      .join(' ');

  return /(\bstopover\b|\bstop over\b|\ben route\b|\btransit\b|\btravel\b|\btransfer\b|\blayover\b|\bday transit\b|→|->)/i.test(legText);
}

function getLegTotalCost(leg) {
  const parseCost = window.parseCurrencyAmount || ((val) => {
    if (typeof val === 'number') return val;
    const s = String(val || '').replace(/[^0-9.-]/g, '');
    return parseFloat(s) || 0;
  });

  let total = 0;

  // 1. Sum up all day-level activity costs
  (leg.days || []).forEach(day => {
    (day.activityItems || []).forEach(item => {
      total += parseCost(item.cost);
    });
  });

  // 2. Add unassigned suggested activities
  (leg.suggestedActivities || []).forEach(activity => {
    const isAssigned = activity.assignedDayIdx !== null && activity.assignedDayIdx !== undefined;
    if (!isAssigned) {
      total += parseCost(activity.estCost);
    }
  });

  // 3. Sum stays costs (only check-in days within the leg)
  if (typeof getStayDisplayForDay === 'function') {
    (leg.days || []).forEach(day => {
      const staysForDay = getStayDisplayForDay(day.date, day.to);
      staysForDay.forEach(stayInfo => {
        if (stayInfo.type === 'checkin') {
          total += parseCost(stayInfo.cost);
        }
      });
    });
  } else {
    // Fallback to legacy accomItems
    (leg.days || []).forEach(day => {
      (day.accomItems || []).forEach(item => {
        total += parseCost(item.cost);
      });
    });
  }

  // 4. Sum up journey costs, deduplicated by their database entry ID
  if (typeof getDayJourneys === 'function') {
    const seenJourneys = new Set();
    (leg.days || []).forEach(day => {
      const journeysForDay = getDayJourneys(day.date, day.from, day.to, leg.id);
      journeysForDay.forEach(journey => {
        if (journey.legId && journey.legId !== leg.id) {
          return;
        }
        const key = journey.id || journey.journeyId;
        if (key && !seenJourneys.has(key)) {
          seenJourneys.add(key);
          total += parseCost(journey.cost);
        }
      });
    });
  } else {
    // Fallback to legacy transportItems
    (leg.days || []).forEach(day => {
      (day.transportItems || []).forEach(item => {
        total += parseCost(item.cost);
      });
    });
  }

  return total;
}

window.getLegTotalCost = getLegTotalCost;


// Track open day cards across rebuilds
let openDayCardIds = new Set();
let expandedFoodQuestLegs = new Set();
let expandedTipsLegs = new Set();

function isFoodQuestExpanded(legId) {
  return expandedFoodQuestLegs.has(legId);
}

function isTipsCardExpanded(legId) {
  return expandedTipsLegs.has(legId);
}

function toggleFoodQuestDetails(e, legId) {
  if (e) {
    if (typeof e.stopPropagation === 'function') e.stopPropagation();
    if (typeof e.preventDefault === 'function') e.preventDefault();
  }
  const scrollX = window.scrollX || 0;
  const scrollY = window.scrollY || 0;
  if (expandedFoodQuestLegs.has(legId)) {
    expandedFoodQuestLegs.delete(legId);
  } else {
    expandedFoodQuestLegs.add(legId);
  }
  if (typeof rebuildCurrentView === 'function') rebuildCurrentView();
  requestAnimationFrame(() => window.scrollTo(scrollX, scrollY));
}

function toggleTipsCardDetails(e, legId) {
  if (e) {
    if (typeof e.stopPropagation === 'function') e.stopPropagation();
    if (typeof e.preventDefault === 'function') e.preventDefault();
  }
  const scrollX = window.scrollX || 0;
  const scrollY = window.scrollY || 0;
  if (expandedTipsLegs.has(legId)) {
    expandedTipsLegs.delete(legId);
  } else {
    expandedTipsLegs.add(legId);
  }
  if (typeof rebuildCurrentView === 'function') rebuildCurrentView();
  requestAnimationFrame(() => window.scrollTo(scrollX, scrollY));
}

function buildItinerary() {
  // Check window.isCompactView for cross-module access
  const isCompact = typeof window !== 'undefined' && window.isCompactView;
  if (isCompact) {
    if (typeof isMobileViewport === 'function' && isMobileViewport()) {
      buildCompactItinerary();
    } else {
      buildCompactItineraryDesktop();
    }
    return;
  }


  // Save open state of day cards before rebuilding
  openDayCardIds.clear();
  document.querySelectorAll('.day-card.open').forEach(card => {
    const preservedDayKey = card.getAttribute('data-day-key');
    if (preservedDayKey) {
      openDayCardIds.add(preservedDayKey);
      return;
    }
    const dayBar = card.querySelector('.day-bar');
    if (dayBar) {
      const dayNum = dayBar.querySelector('.day-num')?.textContent;
      const dayName = dayBar.querySelector('.day-name')?.textContent;
      if (dayNum && dayName) {
        openDayCardIds.add(`${dayName}-${dayNum}`);
      }
    }
  });

  const container = document.getElementById('itinerary');
  container.innerHTML = '';

  appData.forEach((leg, legIndex) => {
    const section = document.createElement('div');
    section.className = 'leg';
    section.id = 'leg-' + leg.id;

    const daysCount = leg.days.length;

    // Detect transit legs based on whether there are any stays overlapping with this leg
    let isTransit = false;
    if (daysCount > 0) {
      const firstDay = leg.days[0].date;
      const lastDay = leg.days[leg.days.length - 1].date;
      const skipCityNames = ['Home', 'In transit', 'Between cities', 'TBC', '', 'Return', 'Departure', 'Arrival'];
      const cleanLabel = (leg.label || '')
          .replace(/[\u{1F1E6}-\u{1F1FF}]/gu, '')
          .replace(/[\u{1F300}-\u{1F9FF}]/gu, '')
          .replace(/[\u{2600}-\u{26FF}]/gu, '')
          .replace(/[\u{2700}-\u{27BF}]/gu, '')
          .replace(/\p{Emoji}/gu, '')
          .replace(/[^\w\s-]/gu, '')
          .trim();
      const labelLooksTransit = /(\bto\b|via|transit|travel|flight|train|bus|→|->)/i.test(leg.label || '');
      const hasDestinationDay = leg.days.some(day =>
          day.from &&
          day.to &&
          day.from === day.to &&
          !skipCityNames.includes(day.to)
      );
      const labelMatchesDayCity = cleanLabel && leg.days.some(day =>
          (day.to && cleanLabel.toLowerCase() === day.to.toLowerCase()) ||
          (day.from && cleanLabel.toLowerCase() === day.from.toLowerCase())
      );

      // Check if any stays overlap with this legs dates
      const hasStays = (typeof stays !== 'undefined' && Array.isArray(stays)) ? stays.some(s => {
        return s.checkIn && s.checkOut && s.checkIn <= lastDay && s.checkOut >= firstDay;
      }) : false;

      // Also check old accomItems for backward compatibility
      const hasOldAccom = leg.days.some(d => d.accomItems && d.accomItems.length > 0);

      // If no accommodation at all, its likely a transit leg
      if (!hasStays && !hasOldAccom) {
        isTransit = labelLooksTransit || (!hasDestinationDay && !labelMatchesDayCity);
      } else if (daysCount === 1) {
        // For single-day legs, check if its a city mismatch
        const toCity = leg.days[0].to;
        if (!labelMatchesDayCity && !hasDestinationDay && !(leg.label || '').includes(toCity) && leg.days[0].from !== toCity) {
          isTransit = true;
        }
      }
    }

    const nightSummary = getLegNightSummary(leg);
    const nightLabel = nightSummary.isTransit ? '✈ Day Transit / Stop' : nightSummary.label;
    const badgeClass = nightSummary.isTransit || isTransit ? 'leg-night-count badge-transit' : 'leg-night-count';

    const firstDateObj = daysCount > 0 ? leg.days[0] : null;
    const lastDateObj = daysCount > 0 ? leg.days[daysCount - 1] : null;
    const firstDateStr = firstDateObj ? `${firstDateObj.day} ${firstDateObj.date}` : '';
    const lastDateStr = lastDateObj ? `${lastDateObj.day} ${lastDateObj.date}` : '';
    const dateRange = (firstDateStr && lastDateStr && firstDateStr !== lastDateStr) ? `${firstDateStr} – ${lastDateStr}` : firstDateStr;

    const unassigned = (leg.suggestedActivities||[]).filter(s => s.assignedDayIdx === null || s.assignedDayIdx === undefined);
    const subtitle = unassigned.length === 0 ? "All suggested activities assigned! 🎉" : `Remaining Ideas: ${unassigned.slice(0, 3).map(s => s.title.split('—')[0].trim()).join(', ')}${unassigned.length > 3 ? '...' : ''}`;

    const legCost = getLegTotalCost(leg);

    let html = `
    <div class="leg-header" style="background:${leg.colour}" onclick="toggleLeg(this)">
      <div class="leg-header-top">
        <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
          <h2 contenteditable="${isEditMode}" onclick="event.stopPropagation()" onblur="updateData(${legIndex}, 'label', this.innerText)">${leg.label}</h2>
          <span style="opacity:0.8; font-size:0.9rem; font-family:'DM Mono', monospace;">${dateRange}</span>
        </div>
        <div style="display:flex; align-items:center; gap:10px;">
          <span class="leg-cost-total-badge">${formatCurrency(legCost)}</span>
          <span class="${badgeClass}">${nightLabel}</span>
          ${isEditMode ? `<button class="header-del-btn" title="Add a day to this leg" onclick="event.stopPropagation(); adjustLegDays(${legIndex}, 1)">+</button>` : ''}
          ${isEditMode ? `<button class="header-del-btn" title="Remove a day from this leg" onclick="event.stopPropagation(); adjustLegDays(${legIndex}, -1)">−</button>` : ''}
          ${isEditMode ? `<button class="header-del-btn" title="Delete Leg" onclick="event.stopPropagation(); deleteLeg(${legIndex})">🗑</button>` : ''}
          <span class="leg-chevron">▼</span>
        </div>
      </div>
      <div class="leg-subtitle">${subtitle}</div>
    </div>
    <div class="leg-content">
    `;

    // Get emoji for activity category
    const getCategoryEmoji = (cat) => {
      const emojis = { fitness: '🏃', sight: '🏛️', attraction: '🎢', wellness: '🧘', food: '🍽️', tour: '🚌' };
      return emojis[cat] || '📍';
    };

    html += `<div class="city-dashboard">
      <div class="city-block city-block-tips">
        <h4>💡 Tips</h4>
        <ul class="tips-list">${(leg.legTips || []).map((t, i) => `<li class="tip-item"><span contenteditable="${isEditMode}" onblur="updateLegTip(${legIndex}, ${i}, this.innerText)">${t.text || t}</span><button class="del-btn" title="Delete Tip" onclick="event.stopPropagation(); deleteLegTip(${legIndex}, ${i})">×</button></li>`).join('')}</ul>
        <button class="add-btn" onclick="event.stopPropagation(); addLegTip(${legIndex})">+ Add Tip</button>
      </div>
      <div class="city-block city-block-food">
        <h4>🍔 Food Quests</h4>
        <ul class="food-list">${(leg.cityFood || []).map((f, i) => `<li class="quest-item"><button class="del-btn" title="Delete Food" onclick="event.stopPropagation(); deleteFood(${legIndex}, ${i})">×</button><input type="checkbox" ${f.done ? 'checked' : ''} onchange="event.stopPropagation(); toggleFoodCompleted(event, ${legIndex}, ${i})"><span contenteditable="${isEditMode}" onblur="updateFoodText(${legIndex}, ${i}, this.innerText)" style="${f.done ? 'text-decoration:line-through;opacity:0.6' : ''}">${f.text}</span></li>`).join('')}</ul>
        <button class="add-btn" onclick="event.stopPropagation(); addFood(${legIndex})">+ Add Food</button>
      </div>
      <div class="city-block city-block-activities">
        <h4>📌 Suggested Activities</h4>
        <ul class="activity-list unified-activities">${(leg.suggestedActivities || []).map((activity, activityIdx) => {
      const isAssigned = activity.assignedDayIdx !== null && activity.assignedDayIdx !== undefined;
      let isCompleted = false; let dayLabel = '';
      if (isAssigned && leg.days[activity.assignedDayIdx]) {
        dayLabel = leg.days[activity.assignedDayIdx].date;
        const matchTexts = typeof getSuggestedActivityMatchTexts === 'function'
          ? getSuggestedActivityMatchTexts(activity)
          : [activity.title];
        const matchedActivity = leg.days[activity.assignedDayIdx].activityItems.find(a => matchTexts.includes(String(a.text || '').trim()));
        if (matchedActivity && matchedActivity.done) isCompleted = true;
      }
      const badgeStateClass = isCompleted ? 'is-complete' : 'is-scheduled';
      const badgeIcon = isCompleted ? '✓' : '✓';
      const badgeHoverText = isCompleted ? `Completed on ${dayLabel}` : (isAssigned ? `Scheduled for ${dayLabel}` : 'Drag to day');
      const categoryEmoji = getCategoryEmoji(activity.category);
      return `<li class="${isAssigned ? 'assigned-sight' : 'draggable-sight'} activity-item" ${!isAssigned ? `draggable="true" ondragstart="handleDragStart(event, ${legIndex}, 'activity', ${activityIdx})"` : ''}><button class="del-btn" title="Delete" onclick="event.stopPropagation(); deleteActivity(${legIndex}, ${activityIdx})">×</button>${!isAssigned ? `<span class="drag-handle" title="Drag to assign">⠿</span>` : `<span class="assigned-badge ${badgeStateClass}" title="${badgeHoverText}">${badgeIcon}</span>`}<span class="activity-emoji">${categoryEmoji}</span><span style="${isCompleted ? 'text-decoration:line-through;' : ''}; flex:1;">${activity.title}</span><span class="sight-inline-meta">⏱ ${activity.estTime} · <span class="sight-inline-meta-cost">${formatCurrency(activity.estCost || 0)}</span></span><button class="action-btn ${isAssigned ? 'action-btn-secondary' : ''} activity-assign-btn" type="button" onclick="event.stopPropagation(); openActivityAssignModal(${legIndex}, ${activityIdx})">${isAssigned ? 'Move' : 'Assign'}</button>${isEditMode ? `<button class="edit-btn" title="Edit activity" onclick="event.stopPropagation(); openEditActivityModal(${legIndex}, ${activityIdx})">✎</button>` : ''}</li>`;
    }).join('')}</ul>
        <button class="add-btn" onclick="event.stopPropagation(); addActivity(${legIndex})">+ Add Activity</button>
      </div>
    </div>`;

    leg.days.forEach((day, dayIndex) => {
      const cityHTML = day.from === day.to ? `<span class="city-same">${day.from}</span>` : `${day.from} <span style="opacity:0.4">→</span> ${day.to}`;
      const dayTotal = getDayTotal(day);

      // Get journeys for this day
      const dayJourneys = getDayJourneys(day.date, day.from, day.to, leg.id);

      // Check if this day should be open
      const dayKey = `${day.day}-${day.date}`;
      const shouldBeOpen = openDayCardIds.has(dayKey);
      const openClass = shouldBeOpen ? 'open' : '';
      const dayDateLabel = typeof formatTripDateForDisplay === 'function' ? formatTripDateForDisplay(day.date) : day.date;
      const dayViewMode = typeof window !== 'undefined' && window.itineraryDayViewMode === 'grouped' ? 'grouped' : 'timeline';

      html += `
      <div class="day-card ${openClass}" data-day-key="${escapeCompactText(dayKey)}">
        <div class="day-bar" style="--leg-colour:${leg.colour}" onclick="toggleCard(this)">
          <div class="day-date"><span class="day-num">${dayDateLabel}</span><span class="day-name">${day.day}</span></div>
          <div class="day-title"><div class="day-cities">${cityHTML}</div><div class="day-desc" contenteditable="${isEditMode}" onclick="event.stopPropagation()" onblur="updateDayData(${legIndex}, ${dayIndex}, 'desc', this.innerText)">${day.desc}</div></div>
          ${dayTotal ? `<div class="day-total-cost" title="Total estimated cost for the day">${dayTotal}</div>` : ''}<span class="day-chevron">▼</span>
        </div>
        <div class="day-detail"><div class="day-planner-shell day-planner-shell-${dayViewMode}">
          <div class="day-view-panel day-view-panel-timeline">
          <div class="detail-block daily-timeline-card drop-zone" onclick="event.stopPropagation()" ondragover="handleDragOver(event)" ondragleave="handleDragLeave(event)" ondrop="handleDrop(event, ${legIndex}, ${dayIndex})">
            ${renderDailyTimeline(leg, legIndex, day, dayIndex)}
          </div>
          </div>
          <div class="day-view-panel day-view-panel-grouped"><div class="detail-grid detail-grid-grouped">

          <div class="detail-block block-transport">
            <h4>Transport</h4><div class="item-list">
            ${dayJourneys.map((journey) => {
        const status = journey.status || 'planned';
        const statusColor = status === 'booked' ? '#27AE60' : '#E67E22';
        const statusIcon = status === 'booked' ? '✓' : '⏳';
        const icon = getTransportIcon(journey.transportType);
        const showRef = status === 'booked';

        // For multi-leg journeys, show the full route chain; otherwise show name or route
        let label = '';
        if (journey.isMultiLeg && journey.journeyId) {
          // Find all segments and build chain
          const allSegs = (window.journeys || [])
              .filter(j => j.journeyId === journey.journeyId)
              .sort((a, b) => (a.segmentOrder || 1) - (b.segmentOrder || 1));
          const stops = allSegs.length > 0
              ? [allSegs[0].fromLocation, ...allSegs.map(s => s.toLocation)].join(' → ')
              : (journey.journeyName || journey.fromLocation + ' → ' + journey.toLocation);
          label = `${icon} ${journey.journeyName ? journey.journeyName + ' · ' : ''}${stops}`;
        } else {
          label = `${icon} ${journey.journeyName || journey.notes || journey.fromLocation + ' → ' + journey.toLocation}`;
        }

        // Show departure time if available
        const timeHint = journey.departureTime ? ` <span style="color:#999;font-size:0.75rem;font-family:monospace;">${journey.departureTime}</span>` : '';

        const journeysSource = (typeof window !== 'undefined' && Array.isArray(window.journeys))
          ? window.journeys
          : [];
        const segs = journey.journeyId ? journeysSource
            .filter(seg => seg.journeyId === journey.journeyId)
            .sort((a, b) => (a.segmentOrder || 1) - (b.segmentOrder || 1)) : [];
        const subLocations = formatJourneySubLocationText(segs.length > 0 ? segs : [journey]);

        return `<div class="cost-item journey-item">
                <button class="del-btn" title="Remove Journey" onclick="event.stopPropagation(); deleteJourney('${journey.id}'); rebuildCurrentView();">×</button>
                <div class="cost-item-text" style="display: flex; flex-direction: column; gap: 4px;">
                  <span>${label}${timeHint}</span>
                  ${subLocations ? `<div class="daily-timeline-sub-locations" style="padding-left: 0; margin-top: 2px;">${renderJourneySubLocationTextHtml(subLocations)}</div>` : ''}
                </div>
                <div class="cost-item-actions">
                  <span class="status-badge ${isEditMode ? 'status-badge-clickable' : ''}" style="--status-color:${statusColor};" title="${isEditMode ? 'Click to toggle status' : 'Booking status'}" onclick="event.stopPropagation(); toggleJourneyStatus('${journey.id}');">${statusIcon} ${status === 'booked' ? 'Booked' : 'Planned'}</span>
                  ${showRef ? `<input type="text" class="booking-ref-input confirmed" value="${journey.bookingReference || ''}" placeholder="Ref #" onchange="event.stopPropagation(); updateJourneyBookingRef('${journey.id}', this.value);" ${isEditMode ? '' : 'disabled'}/>` : ''}
                  <span class="budget-field">$<span contenteditable="${isEditMode}" onblur="updateJourneyCost('${journey.id}', this.innerText)">${formatCurrency(journey.cost || '0', { includeSymbol: false })}</span></span>
                </div>
              </div>`;
      }).join('')}
            </div>${isEditMode ? `<button class="add-btn" onclick="event.stopPropagation(); openAddJourneyModal();">+ Add Journey</button>` : ''}
          </div>


<div class="detail-block block-accom">
<h4>Accommodation</h4><div class="item-list">
${(() => {
        const dayStayInfo = getStayDisplayForDay(day.date, day.to);
        return dayStayInfo.map(info => {
          const icon = info.type === 'checkin' ? '🏨' : info.type === 'checkout' ? '🚪' : '🏨';
          const label = info.type === 'checkin' ? 'Check-in' : info.type === 'checkout' ? 'Check-out' : 'Staying';
          const stayLoc = info.location ? (() => {
            let loc = info.location;
            const cleanCity = String(day.to).trim();
            if (cleanCity && !loc.toLowerCase().includes(cleanCity.toLowerCase())) {
              loc = `${loc} (${cleanCity})`;
            }
            return `Location: ${loc}`;
          })() : '';

          return `<div class="cost-item">
        <div class="cost-item-text" style="display: flex; flex-direction: column; gap: 4px;">
          <span>${icon} <strong>${label}:</strong> ${info.propertyName}${info.provider ? ` via ${info.provider}` : ''}${info.cost ? `<span class="accom-inline-meta-cost"> (${formatCurrency(info.cost)})</span>` : ''}</span>
          ${stayLoc ? `<div class="daily-timeline-sub-locations" style="padding-left: 0; margin-top: 2px;">${renderJourneySubLocationTextHtml(stayLoc)}</div>` : ''}
        </div>
        <div class="cost-item-actions">
          <span class="status-badge" style="--status-color:${info.status === 'confirmed' ? '#27AE60' : info.status === 'cancelled' ? '#E74C3C' : '#E67E22'};">${info.status === 'confirmed' ? '✓ Confirmed' : info.status === 'cancelled' ? '✕ Cancelled' : '⏳ Pending'}</span>
          ${info.bookingRef ? `<span class="booking-ref" style="font-family:monospace; font-size:0.75rem; color:#666;">${info.bookingRef}</span>` : ''}
        </div>
      </div>`;
        }).join('');
      })()}
</div><button class="add-btn" onclick="event.stopPropagation(); openAddStayModal()">+ Add Stay</button>
</div>

          <div class="detail-block block-activities drop-zone" ondragover="handleDragOver(event)" ondragleave="handleDragLeave(event)" ondrop="handleDrop(event, ${legIndex}, ${dayIndex})">
            <h4>Planned Activities</h4><div class="item-list">
            ${(day.activityItems || []).map((item, i) => {
              const split = typeof _splitActivityTitle === 'function' ? _splitActivityTitle(item.text) : { title: item.text, location: '' };
              const activityLoc = split.location ? (() => {
                let loc = split.location;
                const cleanCity = String(day.to || day.from || '').trim();
                if (cleanCity && !loc.toLowerCase().includes(cleanCity.toLowerCase())) {
                  loc = `${loc} (${cleanCity})`;
                }
                return `Location: ${loc}`;
              })() : '';
              const locHtml = activityLoc ? `<div class="daily-timeline-sub-locations" style="padding-left: 0; margin-top: 2px;">${renderJourneySubLocationTextHtml(activityLoc)}</div>` : '';
              return `
                <div class="cost-item">
                  <div class="cost-item-text" style="display: flex; flex-direction: column; gap: 4px;">
                    <div style="display: flex; align-items: center; gap: 6px;">
                      <button class="del-btn" title="Remove Activity" onclick="event.stopPropagation(); deleteDayItem(${legIndex}, ${dayIndex}, 'activityItems', ${i})">×</button>
                      ${isEditMode ? `<button class="edit-btn" title="Edit Activity" onclick="event.stopPropagation(); openEditDayActivityModal(${legIndex}, ${dayIndex}, ${i})">✎</button>` : ''}
                      <input type="checkbox" class="activity-checkbox" ${item.done ? 'checked' : ''} onchange="event.stopPropagation(); toggleActivityCompleted(event, ${legIndex}, ${dayIndex}, ${i})">
                      <span class="cost-item-text" style="${item.done ? 'text-decoration:line-through;opacity:0.6;' : ''}" contenteditable="${isEditMode}" onblur="updateDayItemText(${legIndex}, ${dayIndex}, 'activityItems', ${i}, this.innerText)">${split.title}</span>
                    </div>
                    ${locHtml}
                  </div>
                  <span class="budget-field" style="color:#666;">⏱ <span contenteditable="${isEditMode}" onblur="updateDayItemTime(${legIndex}, ${dayIndex}, 'activityItems', ${i}, this.innerText)">${item.time || '1 hr'}</span></span>
                  <span class="budget-field">$<span contenteditable="${isEditMode}" onblur="updateDayItemCost(${legIndex}, ${dayIndex}, 'activityItems', ${i}, this.innerText)">${formatCurrency(item.cost || '0', { includeSymbol: false })}</span></span>
                </div>
              `;
            }).join('')}
            </div><button class="add-btn" onclick="event.stopPropagation(); addDayItem(${legIndex}, ${dayIndex}, 'activityItems')">+ Add Activity</button>
          </div>

          </div></div>
        </div></div>
      </div>
      `;
    });

    html += `</div>`;
    section.innerHTML = html;
    container.appendChild(section);
  });
  if (typeof renderActivityActionButtons === 'function') renderActivityActionButtons(container);
  if (typeof reObserveLegs === "function") reObserveLegs();
}

function renderActivityActionButtonsLegacy(root) {
  if (!root) return;
  root.querySelectorAll('.activity-item button[onclick*="openActivityAssignModal"]').forEach(btn => {
    const title = (btn.getAttribute('title') || btn.getAttribute('aria-label') || '').toLowerCase();
    const isMove = title.includes('move');
    const icon = isMove ? '›' : '📌';
    const label = isMove ? 'Move to another day' : 'Add to day';
    btn.textContent = icon;
    btn.setAttribute('aria-label', label);
    btn.setAttribute('title', label);
    btn.classList.add('activity-action-btn');
  });
}

function renderActivityActionButtons(root) {
  if (!root) return;
  root.querySelectorAll('.activity-item button[onclick*="openActivityAssignModal"]').forEach(btn => {
    const title = (btn.getAttribute('title') || btn.getAttribute('aria-label') || '').toLowerCase();
    const rawLabel = (btn.textContent || '').trim().toLowerCase();
    const isMove = title.includes('move') || rawLabel === 'move';
    const icon = isMove ? '›' : '📌';
    const label = isMove ? 'Move to another day' : 'Add to day';
    btn.textContent = icon;
    btn.setAttribute('aria-label', label);
    btn.setAttribute('title', label);
    btn.classList.add('activity-action-btn');
  });
}


function buildNav() {
  // Build city filter nav only (leg-nav removed per 6h)
  buildCityNav();
}

const CITY_NAV_SKIP_NAMES = ['departure', 'arrival', 'in transit', 'between cities', 'tbc', 'return', 'home', ''];

function cleanCityNavLabel(value) {
  if (!value || typeof value !== 'string') return '';
  return value
      .replace(/[\u{1F1E6}-\u{1F1FF}]/gu, '')
      .replace(/[\u{1F300}-\u{1F9FF}]/gu, '')
      .replace(/[\u{2600}-\u{26FF}]/gu, '')
      .replace(/[\u{2700}-\u{27BF}]/gu, '')
      .replace(/\p{Emoji}/gu, '')
      .replace(/[^\w\s-]/gu, '')
      .trim();
}

function shouldSkipCityNavName(cityName) {
  return CITY_NAV_SKIP_NAMES.includes((cityName || '').trim().toLowerCase());
}

function getCityByName(cityName) {
  if (!cityName || !Array.isArray(citiesData)) return null;
  return citiesData.find(c => (c.name || '').toLowerCase() === cityName.trim().toLowerCase()) || null;
}

function getCityNameForNavId(cityId) {
  if (!cityId || !Array.isArray(citiesData)) return '';
  const city = citiesData.find(c => c.id === cityId);
  return city ? city.name : '';
}

function getTripTimelineYear() {
  if (Array.isArray(journeys)) {
    const datedJourney = journeys.find(j => /^\d{4}-\d{2}-\d{2}$/.test(j.departureDate || j.arrivalDate || j.dayDate || ''));
    if (datedJourney) return Number((datedJourney.departureDate || datedJourney.arrivalDate || datedJourney.dayDate).slice(0, 4));
  }
  return new Date().getFullYear();
}

function getTimelineScore(dateValue, timeValue = '', fallback = Number.MAX_SAFE_INTEGER) {
  if (!dateValue || typeof dateValue !== 'string') return fallback;

  const trimmedDate = dateValue.trim();
  let year;
  let month;
  let day;

  const isoMatch = trimmedDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    year = Number(isoMatch[1]);
    month = Number(isoMatch[2]) - 1;
    day = Number(isoMatch[3]);
  } else {
    const shortMatch = trimmedDate.match(/^(\d{1,2})\s+([A-Za-z]{3,})$/);
    if (!shortMatch) return fallback;

    const months = {
      jan: 0, january: 0,
      feb: 1, february: 1,
      mar: 2, march: 2,
      apr: 3, april: 3,
      may: 4,
      jun: 5, june: 5,
      jul: 6, july: 6,
      aug: 7, august: 7,
      sep: 8, sept: 8, september: 8,
      oct: 9, october: 9,
      nov: 10, november: 10,
      dec: 11, december: 11
    };

    const monthKey = shortMatch[2].toLowerCase();
    if (!Object.prototype.hasOwnProperty.call(months, monthKey)) return fallback;

    year = getTripTimelineYear();
    month = months[monthKey];
    day = Number(shortMatch[1]);
  }

  const timeMatch = (timeValue || '').match(/^(\d{1,2}):(\d{2})$/);
  const hours = timeMatch ? Number(timeMatch[1]) : 12;
  const minutes = timeMatch ? Number(timeMatch[2]) : 0;
  return Date.UTC(year, month, day, hours, minutes) / 60000;
}

function getLegDateScore(leg, legIndex) {
  const firstDay = leg?.days?.[0];
  return getTimelineScore(firstDay?.date, '', legIndex * 10000);
}

function addCityOrderCandidate(orderMap, cityName, score, sourceRank = 0, stayWeight = 0) {
  if (shouldSkipCityNavName(cityName)) return;
  const city = getCityByName(cityName);
  if (!city) return;

  const existing = orderMap.get(city.id);
  const candidate = { score, sourceRank, stayWeight };
  if (
      !existing ||
      stayWeight > existing.stayWeight ||
      (stayWeight === existing.stayWeight && score < existing.score) ||
      (stayWeight === existing.stayWeight && score === existing.score && sourceRank < existing.sourceRank)
  ) {
    orderMap.set(city.id, candidate);
  }
}

function addMissingCityOrderCandidate(orderMap, cityName, score, sourceRank = 0, stayWeight = 0) {
  if (shouldSkipCityNavName(cityName)) return;
  const city = getCityByName(cityName);
  if (!city || orderMap.has(city.id)) return;
  orderMap.set(city.id, { score, sourceRank, stayWeight });
}

function getCityStayCandidates() {
  const candidates = [];

  if (Array.isArray(stays)) {
    stays.forEach(stay => {
      const cityName = stay.city || getCityNameForNavId(stay.cityId);
      if (!cityName) return;

      const startScore = getTimelineScore(stay.checkIn, '', Number.MAX_SAFE_INTEGER);
      const endScore = getTimelineScore(stay.checkOut, '', startScore);
      const nights = Number(stay.nights) || Math.max(1, Math.round((endScore - startScore) / 1440)) || 1;
      candidates.push({
        cityName,
        score: startScore,
        weight: 1000 + nights,
        sourceRank: 0
      });
    });
  }

  if (Array.isArray(appData)) {
    appData.forEach((leg, legIndex) => {
      let activeCity = '';
      let activeStartScore = 0;
      let activeCount = 0;

      const flush = () => {
        if (!activeCity) return;
        candidates.push({
          cityName: activeCity,
          score: activeStartScore,
          weight: 1,
          sourceRank: 1
        });
      };

      (leg.days || []).forEach((day, dayIndex) => {
        const sameCityStay = day.from && day.to && day.from === day.to && !shouldSkipCityNavName(day.to);
        const dayScore = getTimelineScore(day.date, '', getLegDateScore(leg, legIndex) + dayIndex * 10);

        if (!sameCityStay) {
          flush();
          activeCity = '';
          activeCount = 0;
          return;
        }

        if (activeCity.toLowerCase() !== day.to.toLowerCase()) {
          flush();
          activeCity = day.to;
          activeStartScore = dayScore;
          activeCount = 1;
        } else {
          activeCount++;
        }
      });

      flush();
    });
  }

  return candidates;
}

// Get cities in travel order based on trip legs
function getCitiesInTravelOrder() {
  if (!Array.isArray(appData) || appData.length === 0) {
    return citiesData;
  }

  const orderMap = new Map();

  appData.forEach((leg, legIndex) => {
    const legBaseScore = getLegDateScore(leg, legIndex);
    const labelCity = cleanCityNavLabel(leg.label);
    const labelAlreadyInDayRoute = labelCity && (leg.days || []).some(day =>
        (day.from && day.from.toLowerCase() === labelCity.toLowerCase()) ||
        (day.to && day.to.toLowerCase() === labelCity.toLowerCase())
    );
    if (labelCity && !shouldSkipCityNavName(labelCity) && !labelAlreadyInDayRoute) {
      addCityOrderCandidate(orderMap, labelCity, legBaseScore + 0.5, 2, 10);
    }

    (leg.days || []).forEach((day, dayIndex) => {
      const dayScore = getTimelineScore(day.date, '', legBaseScore + dayIndex * 10);
      addCityOrderCandidate(orderMap, day.from, dayScore, 3, 1);
      addCityOrderCandidate(orderMap, day.to, dayScore + 1, 4, 1);
    });
  });

  if (Array.isArray(journeys)) {
    journeys.forEach((journey, journeyIndex) => {
      // Use a score that keeps them in chronological order
      // We use a high base score but adjusted by timeline
      const departureScore = getTimelineScore(journey.departureDate || journey.dayDate, journey.departureTime, Number.MAX_SAFE_INTEGER - 20000 + journeyIndex);
      const arrivalScore = getTimelineScore(journey.arrivalDate || journey.dayDate || journey.departureDate, journey.arrivalTime, departureScore + 1);

      addMissingCityOrderCandidate(orderMap, journey.fromLocation, departureScore, 5, 2);
      addMissingCityOrderCandidate(orderMap, journey.toLocation, arrivalScore, 6, 2);
    });
  }

  getCityStayCandidates().forEach(candidate => {
    addMissingCityOrderCandidate(orderMap, candidate.cityName, candidate.score, candidate.sourceRank, candidate.weight);
  });

  return citiesData
      .map((city, fallbackIndex) => {
        let order = orderMap.get(city.id);
        
        // If no direct order found, give it a score based on its index
        if (!order) {
          order = { score: Number.MAX_SAFE_INTEGER - 1000 + fallbackIndex, sourceRank: 99 };
        }
        
        return { city, order };
      })
      .sort((a, b) => {
        if (a.order.score !== b.order.score) return a.order.score - b.order.score;
        if (a.order.sourceRank !== b.order.sourceRank) return a.order.sourceRank - b.order.sourceRank;
        return a.city.name.localeCompare(b.city.name);
      })
      .map(entry => entry.city);
}

function scrollToElementWithNavOffset(el) {
  if (!el) return false;
  el.classList.remove('collapsed');
  const navHeight = document.querySelector('.app-tabs-nav')?.offsetHeight || 56;
  const cityNavHeight = document.querySelector('.city-nav')?.offsetHeight || 56;
  const offset = navHeight + cityNavHeight + 20;
  const elTop = el.getBoundingClientRect().top + window.scrollY;
  window.scrollTo({
    top: elTop - offset,
    behavior: 'smooth'
  });
  return true;
}

function findCompactCitySlideIndex(cityId, cityName) {
  if (!Array.isArray(appData) || appData.length === 0) return -1;

  const normalizedCityId = String(cityId || '').trim().toLowerCase();
  const normalizedCityName = String(cityName || '').trim().toLowerCase();

  for (let i = 0; i < appData.length; i++) {
    const leg = appData[i];
    if (!leg) continue;

    const legId = String(leg.id || '').trim().toLowerCase();
    const legLabel = cleanCityNavLabel(leg.label || '').toLowerCase();

    if (normalizedCityId && (legId === normalizedCityId || legId === normalizedCityId.replace(/^city-/, ''))) {
      return i;
    }

    if (normalizedCityName && legLabel === normalizedCityName) {
      return i;
    }

    if (normalizedCityName && Array.isArray(leg.days) && leg.days.some(day =>
        (day.from && day.from.toLowerCase() === normalizedCityName) ||
        (day.to && day.to.toLowerCase() === normalizedCityName)
    )) {
      return i;
    }
  }

  return -1;
}

function scrollToCompactCitySlide(cityId, cityName) {
  const slideIndex = findCompactCitySlideIndex(cityId, cityName);
  if (slideIndex < 0) return false;

  const slide = document.querySelector(`.compact-city-swipe-pager .compact-city-slide[data-slide-index="${slideIndex}"]`);
  if (!slide) return false;

  const pager = slide.closest('.mobile-swipe-pager');
  if (pager) {
    const carousel = pager.querySelector('[data-role="mobile-swipe-carousel"]');
    if (typeof scrollChildIntoHorizontalView === 'function') {
      scrollChildIntoHorizontalView(carousel, slide, { behavior: 'smooth', align: 'start' });
    } else if (carousel) {
      carousel.scrollTo({
        left: Math.max(0, slide.offsetLeft - carousel.offsetLeft),
        behavior: 'smooth'
      });
    }
    pager.dataset.activeIndex = String(slideIndex);
    if (typeof setMobilePagerActiveIndex === 'function') {
      setMobilePagerActiveIndex(pager.dataset.pagerKey || 'compact-city-swipe', slideIndex);
    }
  }

  return true;
}

function getLegElement(leg) {
  if (!leg) return null;
  return document.getElementById('leg-' + leg.id);
}

function sameTimelineDay(dayDate, targetDate) {
  if (!dayDate || !targetDate) return false;
  const dayScore = getTimelineScore(dayDate, '', null);
  const targetScore = getTimelineScore(targetDate, '', null);
  if (dayScore === null || targetScore === null) return false;
  return Math.floor(dayScore / 1440) === Math.floor(targetScore / 1440);
}

function findLegForJourneyCity(cityId, cityName) {
  if (!Array.isArray(journeys)) return null;

  const matchingJourneys = journeys
      .filter(j =>
          j.fromCityId === cityId ||
          j.toCityId === cityId ||
          (cityName && (j.fromLocation === cityName || j.toLocation === cityName))
      )
      .sort((a, b) => {
        const aScore = getTimelineScore(a.arrivalDate || a.departureDate || a.dayDate, a.arrivalTime || a.departureTime, Number.MAX_SAFE_INTEGER);
        const bScore = getTimelineScore(b.arrivalDate || b.departureDate || b.dayDate, b.arrivalTime || b.departureTime, Number.MAX_SAFE_INTEGER);
        return aScore - bScore;
      });

  for (const journey of matchingJourneys) {
    if (journey.legId) {
      const directLeg = appData.find(leg => leg.id === journey.legId);
      if (directLeg) return directLeg;
    }

    const targetDate = journey.toCityId === cityId || journey.toLocation === cityName
        ? (journey.arrivalDate || journey.dayDate || journey.departureDate)
        : (journey.departureDate || journey.dayDate || journey.arrivalDate);

    const dateMatchedLeg = appData.find(leg =>
        (leg.days || []).some(day => sameTimelineDay(day.date, targetDate))
    );
    if (dateMatchedLeg) return dateMatchedLeg;
  }

  return null;
}

// Active city filter - 'all' or city ID (access via window.currentCityFilter for cross-module access)
function buildCityNav() {
  const nav = document.getElementById('cityNav');
  const navList = nav.querySelector('.city-nav-list');
  const filter = window.currentCityFilter || 'all';

  // Keep the "All" button
  navList.innerHTML = `
    <button class="city-nav-btn ${filter === 'all' ? 'active' : ''}" data-city="all" onclick="selectCityFilter('all', this)">
      <span>🏙️ All</span>
    </button>
  `;

  // Get cities in travel order (by leg appearance)
  const citiesInOrder = getCitiesInTravelOrder();

  // Add all city buttons - transit cities get different styling
  citiesInOrder.forEach(city => {
    const btn = document.createElement('button');
    btn.setAttribute('data-city', city.id);
    btn.onclick = () => selectCityFilter(city.id, btn);

    // Transit cities get different styling (gray, dashed)
    const isTransit = city.isTransit === true; // Explicit check
    const color = city.colour || (isTransit ? '#95a5a6' : '#2C3E50');

    if (isTransit) {
      btn.className = 'city-nav-btn city-nav-btn-transit' + (filter === city.id ? ' active' : '');
      btn.style.borderLeft = `4px dashed ${color}`;
    } else {
      btn.className = 'city-nav-btn' + (filter === city.id ? ' active' : '');
      btn.style.borderLeft = `4px solid ${color}`;
    }

    const flagHtml = typeof getCityFlagHTML === 'function' ? getCityFlagHTML(city.name) : '<span class="city-flag">📍</span>';
    btn.innerHTML = `<span class="city-nav-content">${flagHtml} ${city.name}</span>`;
    navList.appendChild(btn);
  });

  updateCityNavOverflowCue(nav, navList);
  if (!nav.dataset.overflowCueBound) {
    nav.dataset.overflowCueBound = '1';
    navList.addEventListener('scroll', () => updateCityNavOverflowCue(nav, navList), { passive: true });
    window.addEventListener('resize', () => updateCityNavOverflowCue(nav, navList));
  }
}

function updateCityNavOverflowCue(nav, navList) {
  if (!nav || !navList) return;
  const maxScrollLeft = Math.max(0, navList.scrollWidth - navList.clientWidth);
  const hasOverflow = maxScrollLeft > 4;
  const scrollLeft = navList.scrollLeft || 0;
  const atStart = !hasOverflow || scrollLeft <= 4;
  const atEnd = !hasOverflow || scrollLeft >= maxScrollLeft - 4;

  nav.classList.toggle('city-nav-has-overflow', hasOverflow);
  nav.classList.toggle('city-nav-at-start', atStart);
  nav.classList.toggle('city-nav-at-end', atEnd);
}

function selectCityFilter(cityId, btn) {
  window.currentCityFilter = cityId;

  // Update button states
  const nav = document.getElementById('cityNav');
  nav.querySelectorAll('.city-nav-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');

  // Rebuild tabs that have city filtering
  const activeTab = document.querySelector('.app-tab-btn.active');
  const tabType = activeTab ? activeTab.getAttribute('data-tab') : 'itinerary';

  if (cityId === 'all') {
    // Show all - rebuild normally
    if (tabType === 'transport' && typeof buildTransportTab === 'function') {
      buildTransportTab();
    } else if (tabType === 'accom' && typeof buildAccomTab === 'function') {
      buildAccomTab();
    } else if (tabType === 'itinerary') {
      if (typeof isMobileViewport === 'function' ? isMobileViewport() : window.innerWidth <= 768) {
        if (typeof resetMobilePagerActiveIndex === 'function') resetMobilePagerActiveIndex('compact-city-swipe');
        buildItinerary();
      } else {
        buildItinerary();
      }
    }
  } else {
    // Filter by city
    const cityName = getCityNameById ? getCityNameById(cityId) : cityId;
    console.log(`[CityFilter] Selected: ${cityName} (${cityId})`);

    // Rebuild with filtering
    if (tabType === 'transport' && typeof buildTransportTab === 'function') {
      buildTransportTab(cityId);
    } else if (tabType === 'accom' && typeof buildAccomTab === 'function') {
      buildAccomTab(cityId);
    } else if (tabType === 'map') {
      if (typeof focusCityOnMap === 'function') focusCityOnMap(cityId);
    } else if (tabType === 'itinerary') {
      if (typeof isMobileViewport === 'function' ? isMobileViewport() : window.innerWidth <= 768) {
        if (!scrollToCompactCitySlide(cityId, cityName)) {
          scrollToCity(cityId);
        }
      } else {
        // Scroll to first leg with this city
        scrollToCity(cityId);
      }
    }
  }
}

function scrollToCity(cityId) {
  const cityName = getCityNameById(cityId);

  const candidateElementIds = [
    'leg-' + cityId,
    'leg-' + cityId.replace(/^city-/, '')
  ];

  for (const elementId of candidateElementIds) {
    const legEl = document.getElementById(elementId);
    if (scrollToElementWithNavOffset(legEl)) return;
  }

  if (!cityName) return;

  // Match stopover legs where the city is the leg label but not the day destination.
  for (let i = 0; i < appData.length; i++) {
    const leg = appData[i];
    if (cleanCityNavLabel(leg.label).toLowerCase() === cityName.toLowerCase()) {
      if (scrollToElementWithNavOffset(getLegElement(leg))) return;
    }
  }

  // Match itinerary day from/to references.
  for (let i = 0; i < appData.length; i++) {
    const leg = appData[i];
    const hasCity = (leg.days || []).some(day => day.from === cityName || day.to === cityName);

    if (hasCity) {
      if (scrollToElementWithNavOffset(getLegElement(leg))) return;
    }
  }

  // Match transport-only transit cities, such as London in a Zurich to Bangkok via London journey.
  const journeyLeg = findLegForJourneyCity(cityId, cityName);
  if (journeyLeg) scrollToElementWithNavOffset(getLegElement(journeyLeg));
}

// Expose itinerary functions to window scope for HTML onclick handlers

window.selectCityFilter = selectCityFilter;
window.getStayDisplayForDay = getStayDisplayForDay;
window.toggleFoodQuestDetails = toggleFoodQuestDetails;
window.toggleTipsCardDetails = toggleTipsCardDetails;
window.compactItineraryGoToDay = compactItineraryGoToDay;
window.captureCompactDayPagerStates = captureCompactDayPagerStates;
window.restoreCompactDayPagerScrollPositions = restoreCompactDayPagerScrollPositions;

// Expand to show a city in the itinerary
function expandToCity(cityId) {
  if (!cityId) return;
// Find the leg that contains this city
  const leg = appData.find(l => l.days.some(d => d.to === getCityNameById(cityId) || d.from === getCityNameById(cityId)));
  if (leg) {
// Expand the leg if collapsed
    const legEl = document.querySelector(`[data-leg-id="${leg.id}"]`);
    if (legEl) {
      legEl.classList.add('expanded');
// Scroll to the leg
      smoothScrollTo(legEl);
    }
  }
}
window.expandToCity = expandToCity;
