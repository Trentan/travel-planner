const path = require('path');
const { assert, createVmContext, runScriptInContext, loadSource } = require('./lib/test-helpers');

function runGetTransportLabelTests() {
  console.log('Running getTransportLabel unit tests...');

  const transportCode = loadSource(path.join('js', 'transport.js'));

  const context = createVmContext({
    localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
    location: { hostname: 'localhost', origin: 'http://localhost:3000', href: 'http://localhost:3000/' },
    addEventListener() {},
    console: { log: () => {}, error: () => {}, warn: () => {} }
  });
  context.window = context;

  runScriptInContext(transportCode, context, 'js/transport.js');

  const getTransportLabel = context.getTransportLabel;

  assert(typeof getTransportLabel === 'function', 'getTransportLabel should be exported as a function on window and context');

  // 1. Standard valid transport types
  assert(getTransportLabel('flight') === 'Flight', "flight should return 'Flight'");
  assert(getTransportLabel('train') === 'Train', "train should return 'Train'");
  assert(getTransportLabel('car') === 'Car', "car should return 'Car'");
  assert(getTransportLabel('ferry') === 'Ferry', "ferry should return 'Ferry'");
  assert(getTransportLabel('bus') === 'Bus', "bus should return 'Bus'");
  assert(getTransportLabel('bike') === 'Bike', "bike should return 'Bike'");
  assert(getTransportLabel('walk') === 'Walk', "walk should return 'Walk'");
  assert(getTransportLabel('other') === 'Transport', "other should return 'Transport'");

  // 2. Unknown / unrecognized transport types (should fallback to 'Transport')
  assert(getTransportLabel('subway') === 'Transport', "Unknown type 'subway' should return 'Transport'");
  assert(getTransportLabel('helicopter') === 'Transport', "Unknown type 'helicopter' should return 'Transport'");
  assert(getTransportLabel('tram') === 'Transport', "Unknown type 'tram' should return 'Transport'");
  assert(getTransportLabel('monorail') === 'Transport', "Unknown type 'monorail' should return 'Transport'");

  // 3. Case sensitivity variations
  assert(getTransportLabel('FLIGHT') === 'Transport', "Uppercase 'FLIGHT' should return fallback 'Transport'");
  assert(getTransportLabel('Flight') === 'Transport', "Titlecase 'Flight' should return fallback 'Transport'");
  assert(getTransportLabel('TRAIN') === 'Transport', "Uppercase 'TRAIN' should return fallback 'Transport'");

  // 4. Empty and whitespace strings
  assert(getTransportLabel('') === 'Transport', "Empty string '' should return fallback 'Transport'");
  assert(getTransportLabel('   ') === 'Transport', "Whitespace string should return fallback 'Transport'");
  assert(getTransportLabel('\t\n') === 'Transport', "Tab/newline string should return fallback 'Transport'");

  // 5. Non-string, falsy, and object types
  assert(getTransportLabel(null) === 'Transport', "null should return fallback 'Transport'");
  assert(getTransportLabel(undefined) === 'Transport', "undefined should return fallback 'Transport'");
  assert(getTransportLabel(0) === 'Transport', "Numeric 0 should return fallback 'Transport'");
  assert(getTransportLabel(123) === 'Transport', "Numeric 123 should return fallback 'Transport'");
  assert(getTransportLabel(true) === 'Transport', "Boolean true should return fallback 'Transport'");
  assert(getTransportLabel(false) === 'Transport', "Boolean false should return fallback 'Transport'");
  assert(getTransportLabel({}) === 'Transport', "Object {} should return fallback 'Transport'");
  assert(getTransportLabel([]) === 'Transport', "Array [] should return fallback 'Transport'");

  // 6. Prototype property names / safety checks
  assert(getTransportLabel('toString') === 'Transport', "Property name 'toString' should return fallback 'Transport'");
  assert(getTransportLabel('__proto__') === 'Transport', "Property name '__proto__' should return fallback 'Transport'");
  assert(getTransportLabel('constructor') === 'Transport', "Property name 'constructor' should return fallback 'Transport'");
  assert(getTransportLabel('valueOf') === 'Transport', "Property name 'valueOf' should return fallback 'Transport'");

  console.log('✅ ALL getTransportLabel UNIT TESTS PASSED CLEANLY!');
}

if (require.main === module) {
  try {
    runGetTransportLabelTests();
  } catch (err) {
    console.error('❌ getTransportLabel TEST FAILED:', err.stack || err.message);
    process.exit(1);
  }
}

module.exports = { runGetTransportLabelTests };
