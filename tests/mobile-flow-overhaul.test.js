const path = require('path');
const { assert, loadSource } = require('./lib/test-helpers');

function runTask1ShellTests() {
  const indexHtml = loadSource('index.html');
  const responsiveCss = loadSource(path.join('src', 'css', 'responsive-core.css'));
  const componentsCss = loadSource(path.join('src', 'css', 'components.css'));
  const uiJs = loadSource(path.join('js', 'ui.js'));

  assert(
    indexHtml.includes('interactive-widget=resizes-content'),
    'Task 1: index.html viewport meta should include interactive-widget=resizes-content'
  );
  assert(
    indexHtml.includes('mobile-menu-quick-tabs'),
    'Task 1: #mobileMenuSheet should include .mobile-menu-quick-tabs for Budget and Packing quick access'
  );
  assert(
    responsiveCss.includes('grid-template-columns: repeat(5, minmax(0, 1fr))'),
    'Task 1: responsive-core.css should use a 5-column mobile bottom tab bar'
  );
  assert(
    componentsCss.includes('body.mobile-app-mode #cityNav') &&
      componentsCss.includes('position: sticky !important;'),
    'Task 1: components.css should dock #cityNav as sticky at the top on mobile instead of fixed above bottom tabs'
  );
  assert(
    uiJs.includes('mobileTabScrollPositions') && uiJs.includes('startViewTransition'),
    'Task 1: switchTab in js/ui.js should preserve per-tab scroll positions and use startViewTransition when available'
  );
}

if (require.main === module) {
  runTask1ShellTests();
  console.log('Task 1 mobile shell tests passed');
}

module.exports = { runMobileFlowOverhaulTests: runTask1ShellTests };
