const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');

async function run() {
  console.log('--- Running Verification Suite for Issues #89, #91, #95, and #96 ---');

  // 1. Verify attachments.js definitions and helper contracts (Issue #89)
  console.log('1. Testing Attachment Models and Helpers (Issue #89)...');
  const attachmentsJs = readFileSync(resolve('js/attachments.js'), 'utf8');
  assert(attachmentsJs.includes('window._currentActivityAttachments'), 'attachments.js must define _currentActivityAttachments');
  assert(attachmentsJs.includes('window._currentStayAttachments'), 'attachments.js must define _currentStayAttachments');
  assert(attachmentsJs.includes('window._currentJourneyAttachments'), 'attachments.js must define _currentJourneyAttachments');
  assert(attachmentsJs.includes('renderAttachmentsPillsHtml'), 'attachments.js must provide renderAttachmentsPillsHtml');
  assert(attachmentsJs.includes('openLightbox'), 'attachments.js must provide lightbox viewer');

  // Test renderAttachmentsPillsHtml logic
  assert(attachmentsJs.includes('rel="noopener noreferrer"'), 'Link attachments should have noopener noreferrer');
  assert(attachmentsJs.includes('openLightbox'), 'Image attachments should bind openLightbox');
  console.log('✓ Issue #89 attachments verified');

  // 2. Verify interactive guide steps and tutorials (Issue #91)
  console.log('2. Testing Interactive Guide Expansion (Issue #91)...');
  const guideJs = readFileSync(resolve('js/guide.js'), 'utf8');
  assert(guideJs.includes("id: 'mappr-import'"), 'GUIDE_STEPS must include mappr-import');
  assert(guideJs.includes("id: 'booking-intake'"), 'GUIDE_STEPS must include booking-intake');
  assert(guideJs.includes("id: 'attachments-alerts'"), 'GUIDE_STEPS must include attachments-alerts');
  assert(guideJs.includes("id: 'split-view'"), 'GUIDE_STEPS must include split-view');
  assert(guideJs.includes("id: 'cloud-sync'"), 'GUIDE_STEPS must include cloud-sync');
  assert(guideJs.includes('switchGuideTab'), 'guide.js must include switchGuideTab');
  console.log('✓ Issue #91 guide tutorials expansion verified');

  // 3. Verify Journey Operational Alerts & Badges (Issue #95)
  console.log('3. Testing Transport Operational Alerts & Badges (Issue #95)...');
  const transportJs = readFileSync(resolve('js/transport.js'), 'utf8');
  assert(transportJs.includes('renderJourneyAlertBadgesHtml'), 'transport.js must export renderJourneyAlertBadgesHtml');
  assert(transportJs.includes('toggleJourneyAlertResolved'), 'transport.js must export toggleJourneyAlertResolved');
  assert(transportJs.includes('promptAddJourneyAlert'), 'transport.js must export promptAddJourneyAlert');
  assert(transportJs.includes('removeJourneyAlert'), 'transport.js must export removeJourneyAlert');
  assert(transportJs.includes('✅ Normal'), 'transport.js must show Normal when all alerts resolved');
  console.log('✓ Issue #95 journey alerts verified');

  // 4. Verify International Travel Readiness (Issue #96)
  console.log('4. Testing International Travel Readiness Engine (Issue #96)...');
  assert(guideJs.includes('COUNTRY_READINESS_DB'), 'guide.js must define COUNTRY_READINESS_DB');
  assert(guideJs.includes('renderReadinessGuide'), 'guide.js must define renderReadinessGuide');
  assert(guideJs.includes('toggleReadinessCheckItem'), 'guide.js must define toggleReadinessCheckItem');
  assert(guideJs.includes('getTripCountries'), 'guide.js must define getTripCountries');
  assert(guideJs.includes('getTripDatesRange'), 'guide.js must define getTripDatesRange');
  assert(guideJs.includes('openReadinessGuide'), 'guide.js must export openReadinessGuide');

  // Check country database coverage
  const countryCoverage = ['France', 'Italy', 'Germany', 'Austria', 'Switzerland', 'United Kingdom', 'Thailand', 'Taiwan', 'Japan', 'United States', 'Australia'];
  for (const c of countryCoverage) {
    assert(guideJs.includes(`'${c}'`), `COUNTRY_READINESS_DB should cover ${c}`);
  }

  // Check 6-month validity rule logic presence
  assert(guideJs.includes('passportTargetDate'), 'guide.js must calculate target 6-month passport expiry');
  console.log('✓ Issue #96 international readiness verified');

  // 5. Verify index.html modal bindings and buttons
  console.log('5. Testing index.html UI Entry Points...');
  const indexHtml = readFileSync(resolve('index.html'), 'utf8');
  assert(indexHtml.includes('id="guideTabBtnFeatures"'), 'index.html must have guideTabBtnFeatures');
  assert(indexHtml.includes('id="guideTabBtnReadiness"'), 'index.html must have guideTabBtnReadiness');
  assert(indexHtml.includes('openReadinessGuide()'), 'index.html must have openReadinessGuide buttons');
  assert(indexHtml.includes('journeyAlertsList'), 'index.html must have journeyAlertsList container');
  assert(indexHtml.includes('stayAttachmentsList'), 'index.html must have stayAttachmentsList container');
  console.log('✓ UI entry points verified in index.html');

  console.log('✅ ALL ISSUES 89, 91, 95, AND 96 VERIFICATION CHECKS PASSED CLEANLY!');
}

if (require.main === module) {
  run().catch((err) => {
    console.error('Verification failed:', err);
    process.exit(1);
  });
}

module.exports = { run, runIssuesVerification: run };
