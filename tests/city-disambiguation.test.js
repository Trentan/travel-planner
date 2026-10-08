// tests/city-disambiguation.test.js
// Unit tests for selectCityDisambiguationChoice function in js/data.js

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

console.log('--- Running City Disambiguation Unit Tests ---');

function createSandbox() {
  let toastMsg = '';
  const domElements = {};

  function createElement(tag) {
    return {
      tagName: tag ? tag.toUpperCase() : 'DIV',
      id: '',
      style: {},
      innerHTML: '',
      value: '',
      disabled: false,
      attributes: {},
      setAttribute(name, val) { this.attributes[name] = String(val); },
      getAttribute(name) { return this.attributes[name] || null; },
      removeAttribute(name) { delete this.attributes[name]; },
      appendChild() {},
      cloneNode() {
        return createElement(tag);
      },
      addEventListener() {},
      removeEventListener() {},
      querySelector() { return null; },
      querySelectorAll() { return []; },
      parentNode: {
        replaceChild() {},
        appendChild() {},
        removeChild() {}
      },
      remove() {}
    };
  }

  const document = {
    getElementById(id) {
      if (!domElements[id]) {
        domElements[id] = createElement('div');
        domElements[id].id = id;
      }
      return domElements[id];
    },
    body: {
      appendChild() {}
    },
    createElement(tag) {
      return createElement(tag);
    }
  };

  const window = {
    addEventListener() {},
    removeEventListener() {},
    localStorage: {
      getItem() { return null; },
      setItem() {},
      removeItem() {}
    }
  };

  const localStorageMock = {
    getItem() { return null; },
    setItem() {},
    removeItem() {}
  };

  const sandbox = {
    console,
    setTimeout,
    clearTimeout,
    document,
    window,
    localStorage: localStorageMock,
    citiesData: [],
    saveData: () => {},
    populateCityList: () => {},
    buildNav: () => {},
    buildItinerary: () => {},
    buildJourneyMap: () => {},
    showToast: (msg) => { toastMsg = msg; },
    getToastMsg: () => toastMsg
  };

  vm.createContext(sandbox);

  // Load utils.js and data.js into sandbox
  const utilsCode = fs.readFileSync(path.join(__dirname, '..', 'js/utils.js'), 'utf8');
  const dataCode = fs.readFileSync(path.join(__dirname, '..', 'js/data.js'), 'utf8');

  vm.runInContext(utilsCode, sandbox, { filename: 'js/utils.js' });
  vm.runInContext(dataCode, sandbox, { filename: 'js/data.js' });

  return sandbox;
}

function runCityDisambiguationTests() {
  // Test 1: selectCityDisambiguationChoice with options object parameter
  console.log('Test 1: selectCityDisambiguationChoice with options object parameter...');
  const sb1 = createSandbox();
  vm.runInContext(`
    citiesData = [
      { id: 'city-naples', name: 'Naples', country: '', countryCode: '', lat: null, lng: null }
    ];

    selectCityDisambiguationChoice({
      cityId: 'city-naples',
      countryCode: 'IT',
      lat: 40.8518,
      lng: 14.2681,
      iataCode: 'NAP',
      icaoCode: 'LIRN'
    });

    const city = citiesData[0];
    if (city.countryCode !== 'IT') throw new Error('Expected countryCode IT, got: ' + city.countryCode);
    if (city.country !== 'Italy') throw new Error('Expected country Italy, got: ' + city.country);
    if (city.lat !== 40.8518) throw new Error('Expected lat 40.8518, got: ' + city.lat);
    if (city.lng !== 14.2681) throw new Error('Expected lng 14.2681, got: ' + city.lng);
    if (city.code !== 'NAP') throw new Error('Expected code NAP, got: ' + city.code);
    if (city.icaoCode !== 'LIRN') throw new Error('Expected icaoCode LIRN, got: ' + city.icaoCode);
  `, sb1);
  console.log('✓ Test 1 passed.');

  // Test 2: selectCityDisambiguationChoice with positional arguments (backward compatibility)
  console.log('Test 2: selectCityDisambiguationChoice with positional arguments...');
  const sb2 = createSandbox();
  vm.runInContext(`
    citiesData = [
      { id: 'city-nara', name: 'Nara', country: '', countryCode: '', lat: null, lng: null }
    ];

    selectCityDisambiguationChoice('city-nara', 'JP', 34.6851, 135.8048, 'NRA', 'RJRO');

    const city = citiesData[0];
    if (city.countryCode !== 'JP') throw new Error('Expected countryCode JP, got: ' + city.countryCode);
    if (city.country !== 'Japan') throw new Error('Expected country Japan, got: ' + city.country);
    if (city.lat !== 34.6851) throw new Error('Expected lat 34.6851, got: ' + city.lat);
    if (city.lng !== 135.8048) throw new Error('Expected lng 135.8048, got: ' + city.lng);
    if (city.code !== 'NRA') throw new Error('Expected code NRA, got: ' + city.code);
    if (city.icaoCode !== 'RJRO') throw new Error('Expected icaoCode RJRO, got: ' + city.icaoCode);
  `, sb2);
  console.log('✓ Test 2 passed.');

  // Test 3: selectCityDisambiguationChoice when city is not found
  console.log('Test 3: selectCityDisambiguationChoice with nonexistent cityId...');
  const sb3 = createSandbox();
  vm.runInContext(`
    citiesData = [
      { id: 'city-paris', name: 'Paris' }
    ];

    selectCityDisambiguationChoice({ cityId: 'city-nonexistent', countryCode: 'FR', lat: 48.8566, lng: 2.3522 });

    if (citiesData[0].countryCode) throw new Error('city-paris should remain untouched');
  `, sb3);
  console.log('✓ Test 3 passed.');

  console.log('✅ All city disambiguation tests passed cleanly!');
}

if (require.main === module) {
  runCityDisambiguationTests();
}

module.exports = { runCityDisambiguationTests };
