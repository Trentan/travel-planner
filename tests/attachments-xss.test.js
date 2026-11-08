const path = require('path');
const {
  assert,
  createVmContext,
  loadSource,
  runScriptInContext
} = require('./lib/test-helpers');

function runAttachmentsXssTests() {
  console.log('Running attachments XSS & injection unit tests (Issue #640)...');

  const context = createVmContext({
    URL,
    document: {
      getElementById: () => null,
      querySelector: () => null,
      querySelectorAll: () => []
    },
    location: { href: 'https://example.com/app/' },
    addEventListener() {}
  });
  context.window = context;

  const utilsSource = loadSource(path.join('js', 'utils.js'));
  runScriptInContext(utilsSource, context, 'js/utils.js');

  const attachmentsSource = loadSource(path.join('js', 'attachments.js'));
  runScriptInContext(attachmentsSource, context, 'js/attachments.js');

  const { renderAttachmentsListHtml, renderAttachmentsPillsHtml } = context;

  const maliciousAttachments = [
    {
      id: 'att-1',
      type: 'link',
      name: 'Exploit <script>alert(1)</script>',
      value: 'javascript:alert(document.domain)'
    },
    {
      id: 'att-2',
      type: 'link',
      name: 'Attribute Breakout',
      value: 'https://example.com" onmouseover="alert(1)'
    },
    {
      id: 'att-3',
      type: 'image',
      name: 'Handler Breakout Image',
      value: "'); alert('pwned'); //"
    },
    {
      id: 'att-4',
      type: 'link',
      name: 'HTML Data URI',
      value: 'data:text/html,<script>alert(1)</script>'
    },
    {
      id: 'att-5',
      type: 'image',
      name: 'Legit Screenshot',
      value: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
    },
    {
      id: 'att-6',
      type: 'link',
      name: 'Legit Link',
      value: 'https://airline.com/booking/123'
    }
  ];

  const listHtml = renderAttachmentsListHtml(maliciousAttachments, 'removeAttachment');
  const pillsHtml = renderAttachmentsPillsHtml(maliciousAttachments);

  // 1. Verify javascript: protocol is sanitized to #
  assert(!listHtml.includes('href="javascript:'), 'List HTML must not contain href with javascript: protocol');
  assert(!pillsHtml.includes('href="javascript:'), 'Pills HTML must not contain href with javascript: protocol');

  // 2. Verify unescaped attribute injection
  assert(!listHtml.includes('onmouseover="alert(1)'), 'List HTML must sanitize attribute injection in URL');
  assert(!pillsHtml.includes('onmouseover="alert(1)'), 'Pills HTML must sanitize attribute injection in URL');

  // 3. Verify handler breakout does not exist in openLightbox calls
  assert(!listHtml.includes("openLightbox(''); alert"), 'openLightbox call must not allow raw quotes breakout');
  assert(!pillsHtml.includes("openLightbox(''); alert"), 'openLightbox call must not allow raw quotes breakout');

  // 4. Verify legit links and images are rendered properly
  assert(listHtml.includes('https://airline.com/booking/123'), 'Legit link URL should be preserved in list');
  assert(pillsHtml.includes('https://airline.com/booking/123'), 'Legit link URL should be preserved in pills');
  assert(pillsHtml.includes('data-url="data:image/png;base64,'), 'Legit image data URL should be preserved in pills');

  console.log('✔ Attachments XSS sanitization tests passed.');
}

if (require.main === module) {
  runAttachmentsXssTests();
}

module.exports = {
  runAttachmentsXssTests
};
