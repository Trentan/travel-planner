function handleDragStart(e, legIdx, itemType, itemIdx) {
 if (!isEditMode) { e.preventDefault(); return; }
 e.dataTransfer.setData('text/plain', JSON.stringify({legIdx, itemType, itemIdx}));
 e.dataTransfer.effectAllowed = 'move';
}
function handleDragOver(e) { if (!isEditMode) return; e.preventDefault(); e.currentTarget.classList.add('drag-over'); }
function handleDragLeave(e) { e.currentTarget.classList.remove('drag-over'); }
function handleDrop(e, targetLegIdx, targetDayIdx) {
 if (!isEditMode) return;
 e.preventDefault();
 e.currentTarget.classList.remove('drag-over');
 const data = e.dataTransfer.getData('text/plain');
 if (!data) return;
 const { legIdx: srcLegIdx, itemType, itemIdx } = JSON.parse(data);

 // Get the activity from suggestedActivities
 if (itemType === 'activity' && appData[srcLegIdx].suggestedActivities && appData[srcLegIdx].suggestedActivities[itemIdx]) {
 const activity = appData[srcLegIdx].suggestedActivities[itemIdx];

 activity.assignedDayIdx = targetDayIdx;
 if (appData[targetLegIdx].days[targetDayIdx].activityItems.length === 1 && appData[targetLegIdx].days[targetDayIdx].activityItems[0].text === "—") {
 appData[targetLegIdx].days[targetDayIdx].activityItems = [];
 }
 appData[targetLegIdx].days[targetDayIdx].activityItems.push({
 text: activity.title,
 cost: activity.estCost || "0",
 time: activity.estTime || "1 hr",
 done: false
 });
 saveData();
 buildItinerary();
 }
}
