const path = require('path');
const { assert, createVmContext, loadSource, runScriptInContext } = require('./lib/test-helpers');

function runSplitActivityTitleTests() {
  console.log('Running _splitActivityTitle unit tests...');

  let _splitActivityTitle;

  try {
    const actModal = require('../js/activity-modal');
    _splitActivityTitle = actModal._splitActivityTitle;
  } catch (_err) {
    const context = createVmContext({});
    const actModalCode = loadSource(path.join('js', 'activity-modal.js'));
    runScriptInContext(actModalCode, context, 'js/activity-modal.js');
    _splitActivityTitle = context._splitActivityTitle;
  }

  assert(typeof _splitActivityTitle === 'function', '_splitActivityTitle should be exported as a function');

  // ==========================================
  // 1. Falsy, null, undefined, empty, and whitespace-only inputs
  // ==========================================
  let res = _splitActivityTitle(null);
  assert(res.title === '' && res.location === '', 'null input should return empty title and location');

  res = _splitActivityTitle(undefined);
  assert(res.title === '' && res.location === '', 'undefined input should return empty title and location');

  res = _splitActivityTitle('');
  assert(res.title === '' && res.location === '', 'empty string input should return empty title and location');

  res = _splitActivityTitle('   ');
  assert(res.title === '' && res.location === '', 'whitespace-only input should return empty title and location');

  // ==========================================
  // 2. Titles without any separator
  // ==========================================
  res = _splitActivityTitle('Eiffel Tower Visit');
  assert(res.title === 'Eiffel Tower Visit' && res.location === '', 'Title without separator should return full title and empty location');

  res = _splitActivityTitle('  Tokyo Skytree  ');
  assert(res.title === 'Tokyo Skytree' && res.location === '', 'Title without separator should be trimmed');

  // ==========================================
  // 3. Supported separators with surrounding spaces
  // ==========================================
  // Em dash —
  res = _splitActivityTitle('Eiffel Tower — Paris');
  assert(res.title === 'Eiffel Tower' && res.location === 'Paris', 'Em dash separator ( — ) should split title and location');

  // En dash –
  res = _splitActivityTitle('Louvre Museum – Paris');
  assert(res.title === 'Louvre Museum' && res.location === 'Paris', 'En dash separator ( – ) should split title and location');

  // Hyphen -
  res = _splitActivityTitle('Colosseum - Rome');
  assert(res.title === 'Colosseum' && res.location === 'Rome', 'Hyphen separator ( - ) should split title and location');

  // Pipe |
  res = _splitActivityTitle('Sagrada Familia | Barcelona');
  assert(res.title === 'Sagrada Familia' && res.location === 'Barcelona', 'Pipe separator ( | ) should split title and location');

  // At symbol @
  res = _splitActivityTitle('Dinner @ Le Bistro');
  assert(res.title === 'Dinner' && res.location === 'Le Bistro', 'At symbol separator ( @ ) should split title and location');

  // ==========================================
  // 4. Separators without surrounding spaces (should NOT split)
  // ==========================================
  res = _splitActivityTitle('Self-guided tour');
  assert(res.title === 'Self-guided tour' && res.location === '', 'Hyphen within word without surrounding spaces should NOT split');

  res = _splitActivityTitle('user@example.com');
  assert(res.title === 'user@example.com' && res.location === '', 'At symbol without surrounding spaces should NOT split');

  res = _splitActivityTitle('A|B');
  assert(res.title === 'A|B' && res.location === '', 'Pipe without surrounding spaces should NOT split');

  res = _splitActivityTitle('Title -Location');
  assert(res.title === 'Title -Location' && res.location === '', 'Hyphen with space on only right side should NOT split');

  res = _splitActivityTitle('Title- Location');
  assert(res.title === 'Title- Location' && res.location === '', 'Hyphen with space on only left side should NOT split');

  // ==========================================
  // 5. Multiple separators in title (split on first match)
  // ==========================================
  res = _splitActivityTitle('Museum Visit - Room 101 - Louvre');
  assert(res.title === 'Museum Visit' && res.location === 'Room 101 - Louvre', 'Multiple separators should split on first match');

  res = _splitActivityTitle('Dinner @ Le Bistro — Paris');
  assert(res.title === 'Dinner' && res.location === 'Le Bistro — Paris', 'Multiple different separators should split on first match');

  // ==========================================
  // 6. Whitespace trimming on title and location results
  // ==========================================
  res = _splitActivityTitle('   Tokyo Skytree   —   Tokyo, Japan   ');
  assert(res.title === 'Tokyo Skytree' && res.location === 'Tokyo, Japan', 'Leading/trailing whitespace in title and location should be trimmed');

  // ==========================================
  // 7. Emojis, special characters, and numbers
  // ==========================================
  res = _splitActivityTitle('🗼 Tokyo Tower — 🇯🇵 Tokyo');
  assert(res.title === '🗼 Tokyo Tower' && res.location === '🇯🇵 Tokyo', 'Emojis in title and location should be preserved');

  res = _splitActivityTitle('Activity 123 - Location 456');
  assert(res.title === 'Activity 123' && res.location === 'Location 456', 'Numbers in title and location should be preserved');

  console.log('✅ ALL _splitActivityTitle UNIT TESTS PASSED CLEANLY!');
}

if (require.main === module) {
  try {
    runSplitActivityTitleTests();
  } catch (err) {
    console.error(err.stack || err.message);
    process.exitCode = 1;
  }
}

module.exports = { runSplitActivityTitleTests };
