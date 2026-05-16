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
  }
 }
}
