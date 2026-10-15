const path = require('path');
const {
  assert,
  createVmContext,
  loadSource,
  runScriptInContext
} = require('./lib/test-helpers');

function runRenderMobileStatTests() {
  console.log('Running renderMobileStat unit tests...');

  const documentMock = {
    getElementById: () => null,
    querySelector: () => null,
    querySelectorAll: () => [],
    addEventListener: () => {}
  };

  const context = createVmContext({
    document: documentMock,
    localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
    location: { hostname: 'localhost', origin: 'http://localhost:3000', href: 'http://localhost:3000/' },
    addEventListener() {}
  });
  context.window = context;

  const utilsSource = loadSource(path.join('js', 'utils.js'));
  runScriptInContext(utilsSource, context, 'js/utils.js');

  const renderMobileStat = context.window.renderMobileStat;

  assert(typeof renderMobileStat === 'function', 'renderMobileStat should be exported on window');

  // 1. Basic rendering with all arguments provided
  {
    const html = renderMobileStat('Total Cost', '$250.00', 'Budget: $300', 'custom-stat-class');
    assert(html.includes('Total Cost'), 'HTML should include label');
    assert(html.includes('$250.00'), 'HTML should include primary value');
    assert(html.includes('Budget: $300'), 'HTML should include secondary text');
    assert(html.includes('custom-stat-class'), 'HTML container should include extraClass');
    assert(html.includes('text-[10px] font-semibold'), 'HTML should contain label styling classes');
    assert(html.includes('text-sm font-medium'), 'HTML should contain primary value styling classes');
    assert(html.includes('text-xs text-slate-500'), 'HTML should contain secondary text styling classes');
  }

  // 2. Default optional parameters (secondary and extraClass omitted)
  {
    const html = renderMobileStat('Status', 'Confirmed');
    assert(html.includes('Status'), 'HTML should include label');
    assert(html.includes('Confirmed'), 'HTML should include primary value');
    assert(!html.includes('truncate'), 'HTML should not include secondary span when secondary is omitted');
    assert(!html.includes('undefined'), 'HTML should not contain string "undefined"');
  }

  // 3. Truthy vs. falsy primary values
  {
    // Truthy string
    const htmlString = renderMobileStat('Label', 'Active');
    assert(htmlString.includes('Active'), 'Truthy string primary should render text');

    // Number primary (truthy non-zero number)
    const htmlNumber = renderMobileStat('Count', 5);
    assert(htmlNumber.includes('5'), 'Number primary should be rendered as string');

    // Falsy primary values should display dash fallback '—'
    ['', null, undefined, false, 0].forEach(falsyVal => {
      const htmlFalsy = renderMobileStat('Empty', falsyVal);
      assert(htmlFalsy.includes('—'), `Falsy primary value (${falsyVal}) should render fallback dash "—"`);
    });
  }

  // 4. HTML / XSS escaping in label and primary
  {
    const htmlXss = renderMobileStat(
      '<script>alert("xss")</script>',
      '<img src="x" onerror="alert(1)">',
      '<em>Secondary</em>'
    );
    assert(!htmlXss.includes('<script>'), 'Label should be HTML-escaped');
    assert(htmlXss.includes('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'), 'Label should contain escaped script tags');
    assert(!htmlXss.includes('<img'), 'Primary value should be HTML-escaped');
    assert(htmlXss.includes('&lt;img src=&quot;x&quot; onerror=&quot;alert(1)&quot;&gt;'), 'Primary value should contain escaped img tags');
  }

  // 5. Secondary parameter presence logic
  {
    const htmlWithSecondary = renderMobileStat('Label', 'Primary', 'SubText');
    assert(htmlWithSecondary.includes('<span class="text-xs text-slate-500 dark:text-slate-400 truncate">SubText</span>'), 'Secondary text should be wrapped in span when present');

    const htmlEmptySecondary = renderMobileStat('Label', 'Primary', '');
    assert(!htmlEmptySecondary.includes('text-xs text-slate-500'), 'Secondary span should be omitted when secondary is empty string');
  }

  // 6. Extra CSS class application
  {
    const htmlExtra = renderMobileStat('Label', 'Primary', '', 'col-span-2 border-l-2');
    assert(htmlExtra.includes('bg-slate-50 dark:bg-slate-800/50 rounded col-span-2 border-l-2'), 'extraClass should be appended to top-level container class attribute');
  }

  console.log('✅ ALL renderMobileStat UNIT TESTS PASSED CLEANLY!');
}

if (require.main === module) {
  try {
    runRenderMobileStatTests();
  } catch (err) {
    console.error('❌ renderMobileStat TEST FAILED:', err.message);
    process.exit(1);
  }
}

module.exports = { runRenderMobileStatTests };
