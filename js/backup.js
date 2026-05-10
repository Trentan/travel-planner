// Backup reminder system
// Simple localStorage tracking with user-friendly reminders

let editCountSinceExport = 0;
let lastExportTimestamp = null;
const BACKUP_REMINDER_THRESHOLD = 7; // days
const EDIT_REMINDER_THRESHOLD = 10; // edits

// Track when user makes edits
function trackUserEdit() {
  editCountSinceExport++;
  localStorage.setItem('travelApp_editCount', editCountSinceExport);
  checkBackupReminder();
}

// Reset edit counter after export
function resetEditTracking() {
  editCountSinceExport = 0;
  localStorage.setItem('travelApp_editCount', 0);
}

// Set last export timestamp
function setLastExportTime() {
  const now = new Date().toISOString();
  lastExportTimestamp = now;
  localStorage.setItem('travelApp_lastExport', now);
  resetEditTracking();
}

// Load tracking state
function loadBackupTracking() {
  const savedCount = localStorage.getItem('travelApp_editCount');
  const savedExport = localStorage.getItem('travelApp_lastExport');

  editCountSinceExport = savedCount ? parseInt(savedCount) : 0;
  lastExportTimestamp = savedExport;
}

// Check if we should show backup reminder
function checkBackupReminder() {
  // Check days since last export
  if (lastExportTimestamp) {
    const daysSince = (Date.now() - new Date(lastExportTimestamp).getTime()) / (1000 * 60 * 60 * 24);

    if (daysSince >= BACKUP_REMINDER_THRESHOLD) {
      showBackupReminder(`It's been ${Math.floor(daysSince)} days since your last backup. Consider exporting your data.`);
      return;
    }
  }

  // Check edit count
  if (editCountSinceExport >= EDIT_REMINDER_THRESHOLD) {
    showBackupReminder(`You've made ${editCountSinceExport} edits since your last backup. Consider exporting your data.`);
  }
}

// Show friendly backup reminder
function showBackupReminder(message) {
  // Create or update reminder element
  const existing = document.getElementById('backup-reminder');
  if (existing) {
    existing.textContent = message;
    return;
  }

  // Create new reminder element
  const reminder = document.createElement('div');
  reminder.id = 'backup-reminder';
  reminder.innerHTML = `
    <div style="
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: #FFF3CD;
      border: 1px solid #FFE69C;
      border-radius: 8px;
      padding: 16px 20px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 9999;
      max-width: 320px;
      animation: slideUp 0.3s ease-out;
    ">
      <div style="font-weight: 500; color: #856404; margin-bottom: 8px;">
        💾 Backup Reminder
      </div>
      <div style="font-size: 14px; color: #856404; margin-bottom: 12px;">
        ${message}
      </div>
      <div style="display: flex; gap: 8px;">
        <button onclick="exportJSON(false); hideBackupReminder();"
                style="
                  padding: 6px 12px;
                  background: #007BFF;
                  color: white;
                  border: none;
                  border-radius: 4px;
                  cursor: pointer;
                  font-size: 14px;
                ">
          Export Now
        </button>
        <button onclick="hideBackupReminder();"
                style="
                  padding: 6px 12px;
                  background: #6C757D;
                  color: white;
                  border: none;
                  border-radius: 4px;
                  cursor: pointer;
                  font-size: 14px;
                ">
          Later
        </button>
      </div>
    </div>
    <style>
      @keyframes slideUp {
        from { transform: translateY(100px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
    </style>
  `;
  document.body.appendChild(reminder);
}

// Hide backup reminder
function hideBackupReminder() {
  const reminder = document.getElementById('backup-reminder');
  if (reminder) {
    reminder.remove();
  }
}

// Initialize backup tracking on app load
window.addEventListener('load', function() {
  loadBackupTracking();

  // Check reminder after short delay
  setTimeout(checkBackupReminder, 2000);
});

// Override exportJSON to track when user exports
const originalExportJSON = window.exportJSON;
window.exportJSON = function() {
  originalExportJSON();
  setLastExportTime();
  hideBackupReminder();
};

// Track major data changes
function addEditTracking() {
  // Override saveData to track edits
  const originalSaveData = window.saveData;
  window.saveData = function(showTick = true) {
    originalSaveData(showTick);

    // Only track user-initiated saves (not initialization)
    if (showTick) {
      trackUserEdit();
    }
  };
}
// Expose functions globally
window.checkBackupReminder = checkBackupReminder;
window.hideBackupReminder = hideBackupReminder;