function handleDragStart(e, legIdx, itemType, itemIdx) {
 if (!isEditMode) { e.preventDefault(); return; }
 e.dataTransfer.setData('text/plain', JSON.stringify({ legIdx, itemType, itemIdx }));
 e.dataTransfer.effectAllowed = 'move';
}

function handleDragOver(e) {
 if (!isEditMode) return;
 e.preventDefault();
 e.currentTarget.classList.add('drag-over');
}

function handleDragLeave(e) {
 e.currentTarget.classList.remove('drag-over');
}

function handleDrop(e, targetLegIdx, targetDayIdx) {
 if (typeof triggerHaptic === "function") triggerHaptic("light");
 if (!isEditMode) return;
 e.preventDefault();
 e.currentTarget.classList.remove('drag-over');
 const data = e.dataTransfer.getData('text/plain');
 if (!data) return;
 const { legIdx: srcLegIdx, itemType, itemIdx } = JSON.parse(data);

 // Get the activity from suggestedActivities
 if (itemType === 'activity' && appData[srcLegIdx].suggestedActivities && appData[srcLegIdx].suggestedActivities[itemIdx]) {
  const assigned = typeof assignSuggestedActivityToDay === 'function'
   ? assignSuggestedActivityToDay(srcLegIdx, itemIdx, targetLegIdx, targetDayIdx)
   : false;
  if (assigned) {
   saveData();
   buildItinerary();
   if (typeof showActivityAssignFeedback === 'function') {
    const targetDay = appData[targetLegIdx]?.days?.[targetDayIdx];
    const dayLabel = targetDay ? `${targetDay.day} ${targetDay.date}` : 'selected day';
    showActivityAssignFeedback(`Assigned to ${dayLabel}`);
   }
  } else if (typeof showActivityAssignFeedback === 'function') {
   showActivityAssignFeedback(assignSuggestedActivityToDay.lastError || 'Could not place this activity on that day.');
  }
 }
}

/* Leg Reordering Drag & Drop handlers */
let draggedLegIndex = null;

function handleLegDragStart(e, idx) {
  draggedLegIndex = idx;
  if (e.dataTransfer) {
    e.dataTransfer.setData('text/plain', JSON.stringify({ legIndex: idx }));
    e.dataTransfer.effectAllowed = 'move';
  }
  if (e.currentTarget) e.currentTarget.classList.add('dragging');
}

function handleLegDragOver(e, idx) {
  e.preventDefault();
  if (e.dataTransfer) {
    e.dataTransfer.dropEffect = 'move';
  }
  if (e.currentTarget) e.currentTarget.classList.add('drag-over');
}

function handleLegDragLeave(e) {
  if (e.currentTarget) e.currentTarget.classList.remove('drag-over');
}

function handleLegDrop(e, targetIdx) {
  e.preventDefault();
  if (e.currentTarget) e.currentTarget.classList.remove('drag-over');
  if (draggedLegIndex === null || draggedLegIndex === targetIdx) return;
  if (typeof moveLegInSequence === 'function') {
    moveLegInSequence(draggedLegIndex, targetIdx);
  }
  draggedLegIndex = null;
}

function handleLegDragEnd(e) {
  if (e.currentTarget) e.currentTarget.classList.remove('dragging');
  document.querySelectorAll('.leg-reorder-item').forEach(el => el.classList.remove('drag-over', 'dragging'));
  draggedLegIndex = null;
}

let touchDragLegIdx = null;

function setupMobileTouchLegReordering(container) {
  if (!container) return;
  const items = container.querySelectorAll('.leg-reorder-item');
  items.forEach(item => {
    item.addEventListener('touchstart', (e) => {
      const idx = parseInt(item.getAttribute('data-leg-index'), 10);
      if (Number.isFinite(idx)) {
        touchDragLegIdx = idx;
        item.classList.add('dragging');
      }
    }, { passive: true });

    item.addEventListener('touchmove', (e) => {
      if (touchDragLegIdx === null) return;
      const touch = e.touches[0];
      const targetElement = document.elementFromPoint(touch.clientX, touch.clientY);
      const targetItem = targetElement ? targetElement.closest('.leg-reorder-item') : null;

      items.forEach(el => el.classList.remove('drag-over'));
      if (targetItem) {
        targetItem.classList.add('drag-over');
      }
    }, { passive: true });

    item.addEventListener('touchend', (e) => {
      if (touchDragLegIdx === null) return;
      const touch = e.changedTouches[0];
      const targetElement = document.elementFromPoint(touch.clientX, touch.clientY);
      const targetItem = targetElement ? targetElement.closest('.leg-reorder-item') : null;

      items.forEach(el => el.classList.remove('drag-over', 'dragging'));
      if (targetItem) {
        const targetIdx = parseInt(targetItem.getAttribute('data-leg-index'), 10);
        if (Number.isFinite(targetIdx) && targetIdx !== touchDragLegIdx) {
          if (typeof moveLegInSequence === 'function') {
            moveLegInSequence(touchDragLegIdx, targetIdx);
          }
        }
      }
      touchDragLegIdx = null;
    });
  });
}

if (typeof window !== 'undefined') {
  window.handleLegDragStart = handleLegDragStart;
  window.handleLegDragOver = handleLegDragOver;
  window.handleLegDragLeave = handleLegDragLeave;
  window.handleLegDrop = handleLegDrop;
  window.handleLegDragEnd = handleLegDragEnd;
  window.setupMobileTouchLegReordering = setupMobileTouchLegReordering;
}
