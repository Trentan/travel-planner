const path = require('path');
const {
  assert,
  loadSource,
  runScriptInContext
} = require('./test-helpers');

class MockClassList {
  constructor(element) {
    this.element = element;
    this.set = new Set();
  }

  _sync() {
    this.element._className = [...this.set].join(' ');
  }

  add(...names) {
    names.flatMap(name => String(name || '').split(/\s+/)).filter(Boolean).forEach(name => this.set.add(name));
    this._sync();
  }

  remove(...names) {
    names.flatMap(name => String(name || '').split(/\s+/)).filter(Boolean).forEach(name => this.set.delete(name));
    this._sync();
  }

  toggle(name, force) {
    const shouldAdd = force === undefined ? !this.set.has(name) : !!force;
    if (shouldAdd) this.set.add(name);
    else this.set.delete(name);
    this._sync();
    return shouldAdd;
  }

  contains(name) {
    return this.set.has(name);
  }

  toString() {
    return [...this.set].join(' ');
  }
}

class MockElement {
  constructor(document, tagName = 'div') {
    this.ownerDocument = document;
    this.tagName = String(tagName || 'div').toUpperCase();
    this.children = [];
    this.attributes = {};
    this.style = {};
    this.dataset = {};
    this.listeners = {};
    this.parentNode = null;
    this.connected = false;
    this._className = '';
    this._id = '';
    this._innerHTML = '';
    this._textContent = '';
    this._value = '';
    this.checked = false;
    this.hidden = false;
    this.disabled = false;
    this.selected = false;
    this.onclick = null;
    this.onchange = null;
    this.onblur = null;
    this.oninput = null;
    this.type = '';
    this.name = '';
    this.href = '';
    this.download = '';
    this.classList = new MockClassList(this);

    Object.defineProperty(this, 'id', {
      get: () => this._id,
      set: value => {
        this._id = String(value || '');
        if (this._id) {
          this.ownerDocument._registerId(this, this._id);
        }
      }
    });

    Object.defineProperty(this, 'className', {
      get: () => this._className,
      set: value => {
        this.classList.set = new Set(String(value || '').split(/\s+/).filter(Boolean));
        this.classList._sync();
      }
    });

    Object.defineProperty(this, 'innerHTML', {
      get: () => this._innerHTML,
      set: value => {
        this._innerHTML = String(value ?? '');
      }
    });

    Object.defineProperty(this, 'textContent', {
      get: () => this._textContent,
      set: value => {
        this._textContent = String(value ?? '');
      }
    });

    Object.defineProperty(this, 'innerText', {
      get: () => this._textContent,
      set: value => {
        this._textContent = String(value ?? '');
      }
    });

    Object.defineProperty(this, 'value', {
      get: () => this._value,
      set: value => {
        this._value = String(value ?? '');
      }
    });
  }

  setAttribute(name, value) {
    const attrName = String(name);
    const attrValue = String(value ?? '');
    this.attributes[attrName] = attrValue;

    if (attrName === 'id') this.id = attrValue;
    else if (attrName === 'class') this.className = attrValue;
    else if (attrName === 'name') this.name = attrValue;
    else if (attrName === 'type') this.type = attrValue;
    else if (attrName === 'value') this.value = attrValue;
    else if (attrName === 'href') this.href = attrValue;
    else if (attrName === 'download') this.download = attrValue;
    else if (attrName.startsWith('data-')) {
      this.dataset[attrName.slice(5).replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = attrValue;
    }
  }

  getAttribute(name) {
    const attrName = String(name);
    if (attrName === 'id') return this.id;
    if (attrName === 'class') return this.className;
    if (attrName === 'name') return this.name;
    if (attrName === 'type') return this.type;
    if (attrName === 'value') return this.value;
    if (attrName === 'href') return this.href;
    if (attrName === 'download') return this.download;
    return this.attributes[attrName];
  }

  appendChild(child) {
    if (!child) return child;
    child.parentNode = this;
    child.connected = this.connected;
    this.children.push(child);
    this.ownerDocument._registerSubtree(child);
    return child;
  }

  removeChild(child) {
    const idx = this.children.indexOf(child);
    if (idx >= 0) {
      this.children.splice(idx, 1);
      child.parentNode = null;
      child.connected = false;
    }
    return child;
  }

  replaceChild(newChild, oldChild) {
    const idx = this.children.indexOf(oldChild);
    if (idx >= 0) {
      this.children[idx] = newChild;
      newChild.parentNode = this;
      newChild.connected = this.connected;
      oldChild.parentNode = null;
      oldChild.connected = false;
      this.ownerDocument._registerSubtree(newChild);
    }
    return oldChild;
  }

  remove() {
    if (this.parentNode && typeof this.parentNode.removeChild === 'function') {
      this.parentNode.removeChild(this);
    } else {
      this.connected = false;
    }
  }

  cloneNode(deep = false) {
    const clone = new MockElement(this.ownerDocument, this.tagName.toLowerCase());
    clone.className = this.className;
    clone._innerHTML = this._innerHTML;
    clone._textContent = this._textContent;
    clone._value = this._value;
    clone.checked = this.checked;
    clone.hidden = this.hidden;
    clone.disabled = this.disabled;
    clone.selected = this.selected;
    clone.type = this.type;
    clone.name = this.name;
    clone.href = this.href;
    clone.download = this.download;
    Object.entries(this.attributes).forEach(([key, value]) => clone.setAttribute(key, value));
    if (deep) {
      this.children.forEach(child => clone.appendChild(child.cloneNode(true)));
    }
    return clone;
  }

  addEventListener(type, handler) {
    if (!this.listeners[type]) this.listeners[type] = [];
    this.listeners[type].push(handler);
  }

  dispatchEvent(event) {
    const evt = event || {};
    evt.target = evt.target || this;
    evt.currentTarget = this;
    const handlers = this.listeners[evt.type] || [];
    handlers.forEach(handler => handler.call(this, evt));
    const propHandler = this[`on${evt.type}`];
    if (typeof propHandler === 'function') propHandler.call(this, evt);
    return !evt.defaultPrevented;
  }

  click() {
    this.ownerDocument.lastClickedElement = this;
    const event = {
      type: 'click',
      target: this,
      currentTarget: this,
      preventDefault() {},
      stopPropagation() {}
    };
    this.dispatchEvent(event);
    if (typeof this.onclick === 'function') this.onclick(event);
  }

  focus() {}
  select() { this.selected = true; }
  scrollIntoView() {}

  getBoundingClientRect() {
    const width = Number.parseFloat(this.style.width || '0') || 0;
    const height = Number.parseFloat(this.style.height || '0') || 0;
    return { width, height, top: 0, left: 0, right: width, bottom: height };
  }

  closest(selector) {
    let current = this;
    while (current) {
      if (this.ownerDocument._matchesSimple(current, selector)) return current;
      current = current.parentNode instanceof MockElement ? current.parentNode : null;
    }
    return null;
  }

  querySelector(selector) {
    return this.ownerDocument._queryWithin(this, selector, true)[0] || null;
  }

  querySelectorAll(selector) {
    return this.ownerDocument._queryWithin(this, selector, false);
  }
}

class MockStorage {
  constructor(initial = {}) {
    this.map = new Map(Object.entries(initial));
  }

  get length() {
    return this.map.size;
  }

  key(index) {
    return [...this.map.keys()][index] || null;
  }

  getItem(key) {
    return this.map.has(String(key)) ? this.map.get(String(key)) : null;
  }

  setItem(key, value) {
    this.map.set(String(key), String(value));
  }

  removeItem(key) {
    this.map.delete(String(key));
  }

  clear() {
    this.map.clear();
  }
}

class MockDocument {
  constructor() {
    this.idMap = new Map();
    this.allElements = new Set();
    this.listeners = {};
    this.lastDownload = null;
    this.lastClickedElement = null;

    this.documentElement = new MockElement(this, 'html');
    this.documentElement.connected = true;
    this.documentElement.style.setProperty = (key, value) => {
      this.documentElement.style[key] = value;
    };

    this.body = new MockElement(this, 'body');
    this.body.connected = true;
    this.documentElement.appendChild(this.body);
    this.head = new MockElement(this, 'head');
    this.head.connected = true;
    this.documentElement.appendChild(this.head);

    this.body.classList.add('app-root');
  }

  _registerId(element, id) {
    this.idMap.set(id, element);
  }

  _registerElement(element) {
    this.allElements.add(element);
    if (element.id) this.idMap.set(element.id, element);
  }

  _registerSubtree(element) {
    if (!(element instanceof MockElement)) return;
    this._registerElement(element);
    element.children.forEach(child => this._registerSubtree(child));
  }

  createElement(tagName) {
    const el = new MockElement(this, tagName);
    this._registerElement(el);
    return el;
  }

  getElementById(id) {
    if (!this.idMap.has(id)) {
      const el = this.createElement('div');
      el.id = id;
      this.body.appendChild(el);
      return el;
    }
    return this.idMap.get(id);
  }

  addEventListener(type, handler) {
    if (!this.listeners[type]) this.listeners[type] = [];
    this.listeners[type].push(handler);
  }

  dispatchEvent(event) {
    const evt = event || {};
    const handlers = this.listeners[evt.type] || [];
    handlers.forEach(handler => handler.call(this, evt));
  }

  execCommand(command) {
    this.lastExecCommand = command;
    return command === 'copy';
  }

  querySelector(selector) {
    return this._queryAll(selector)[0] || null;
  }

  querySelectorAll(selector) {
    return this._queryAll(selector);
  }

  _queryAll(selector) {
    return this._queryWithin(this.documentElement, selector, false);
  }

  _queryWithin(root, selector, firstOnly) {
    const selectors = String(selector || '').split(',').map(s => s.trim()).filter(Boolean);
    const results = [];
    for (const token of selectors) {
      const matches = this._matchSelectorChain(root, token);
      for (const el of matches) {
        if (!results.includes(el)) {
          results.push(el);
          if (firstOnly) return results;
        }
      }
    }
    return results;
  }

  _matchSelectorChain(root, selector) {
    const parts = selector.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return [];
    const found = [];
    const visit = element => {
      if (!(element instanceof MockElement)) return;
      if (this._matchesChain(element, parts)) found.push(element);
      element.children.forEach(child => visit(child));
    };
    visit(root);
    return found;
  }

  _matchesChain(element, parts) {
    let current = element;
    for (let i = parts.length - 1; i >= 0; i--) {
      if (!current || !this._matchesSimple(current, parts[i])) return false;
      if (i > 0) {
        let ancestor = current.parentNode instanceof MockElement ? current.parentNode : null;
        let found = false;
        while (ancestor) {
          if (this._matchesSimple(ancestor, parts[i - 1])) {
            current = ancestor;
            found = true;
            i--;
            break;
          }
          ancestor = ancestor.parentNode instanceof MockElement ? ancestor.parentNode : null;
        }
        if (!found) return false;
      }
    }
    return true;
  }

  _matchesSimple(element, selector) {
    if (!(element instanceof MockElement)) return false;
    let s = String(selector || '').trim();
    if (!s) return false;

    let checkedRequired = false;
    if (s.endsWith(':checked')) {
      checkedRequired = true;
      s = s.slice(0, -8);
    }
    if (checkedRequired && !element.checked) return false;

    const attrMatches = [...s.matchAll(/\[([^=\]]+)(?:=(["'])(.*?)\2|=([^\]]+))?\]/g)];
    attrMatches.forEach(match => {
      const attrName = match[1];
      const attrValue = match[3] ?? match[4] ?? null;
      const actual = element.getAttribute(attrName) ?? element[attrName];
      if (attrValue !== null && String(actual) !== attrValue) {
        s = '__no_match__';
      } else if (attrValue === null && (actual === undefined || actual === null)) {
        s = '__no_match__';
      }
    });
    if (s === '__no_match__') return false;
    s = s.replace(/\[([^\]]+)\]/g, '');

    let idMatch = s.match(/#([A-Za-z0-9_-]+)/);
    if (idMatch && element.id !== idMatch[1]) return false;
    s = s.replace(/#([A-Za-z0-9_-]+)/g, '');

    const classMatches = [...s.matchAll(/\.([A-Za-z0-9_-]+)/g)].map(match => match[1]);
    if (classMatches.length > 0 && !classMatches.every(cls => element.classList.contains(cls))) return false;
    s = s.replace(/\.([A-Za-z0-9_-]+)/g, '');

    const tagMatch = s.match(/^[A-Za-z][A-Za-z0-9_-]*/);
    if (tagMatch && element.tagName.toLowerCase() !== tagMatch[0].toLowerCase()) return false;

    return true;
  }
}

function createStorage(initial = {}) {
  return new MockStorage(initial);
}

function createBrowserHarness({
  mobile = false,
  sharedLocalStorage = null,
  sharedSessionStorage = null,
  supportFileSystemAccess = false
} = {}) {
  const document = new MockDocument();
  const localStorage = sharedLocalStorage || createStorage();
  const sessionStorage = sharedSessionStorage || createStorage();
  const errors = [];
  const warnings = [];
  const downloads = [];
  const serviceWorkerRegistrations = [];
  const timers = [];
  let timerId = 1;
  let reloadCalled = false;
  let printCalled = false;

  const location = {
    reload() {
      reloadCalled = true;
    }
  };

  const navigator = {
    standalone: false,
    clipboard: {
      writeText: async text => {
        navigator.lastClipboardText = text;
      }
    },
    serviceWorker: {
      register: async (scriptURL, options) => {
        serviceWorkerRegistrations.push({ scriptURL, options });
        return { scriptURL, options };
      },
      getRegistrations: async () => []
    }
  };

  const windowListeners = {};
  const windowObj = {
    document,
    navigator,
    localStorage,
    sessionStorage,
    location,
    console: {
      log: (...args) => { windowObj.lastLog = args; },
      warn: (...args) => { warnings.push(args); },
      error: (...args) => { errors.push(args); }
    },
    setTimeout(fn, delay = 0) {
      const id = timerId++;
      timers.push({ id, fn, delay });
      return id;
    },
    clearTimeout(id) {
      const idx = timers.findIndex(timer => timer.id === id);
      if (idx >= 0) timers.splice(idx, 1);
    },
    setInterval(fn, delay = 0) {
      const id = timerId++;
      timers.push({ id, fn, delay, interval: true });
      return id;
    },
    clearInterval(id) {
      const idx = timers.findIndex(timer => timer.id === id);
      if (idx >= 0) timers.splice(idx, 1);
    },
    matchMedia(query) {
      const mobileMatch = /max-width:\s*768px/.test(query);
      const standaloneMatch = /display-mode:\s*standalone/.test(query);
      return {
        media: query,
        matches: standaloneMatch ? false : (mobileMatch ? mobile : false),
        addEventListener() {},
        removeEventListener() {},
        addListener() {},
        removeListener() {}
      };
    },
    print() {
      printCalled = true;
    },
    addEventListener(type, handler) {
      if (!windowListeners[type]) windowListeners[type] = [];
      windowListeners[type].push(handler);
    },
    removeEventListener(type, handler) {
      const handlers = windowListeners[type] || [];
      const idx = handlers.indexOf(handler);
      if (idx >= 0) handlers.splice(idx, 1);
    },
    dispatchEvent(event) {
      const handlers = windowListeners[event.type] || [];
      handlers.forEach(handler => handler.call(windowObj, event));
    },
    showSaveFilePicker: supportFileSystemAccess ? async () => createFileHandle('saved-trip.json') : undefined,
    showOpenFilePicker: supportFileSystemAccess ? async () => [createFileHandle('opened-trip.json')] : undefined,
    caches: {
      async keys() { return []; },
      async delete() { return true; }
    },
    isSecureContext: supportFileSystemAccess,
    innerWidth: mobile ? 390 : 1280,
    innerHeight: mobile ? 844 : 900,
    lastLog: null
  };

  function createFileHandle(name) {
    return {
      name,
      async createWritable() {
        return {
          async write(content) {
            windowObj.lastSavedFileContent = content;
          },
          async close() {}
        };
      },
      async getFile() {
        return {
          name,
          text: async () => windowObj.lastImportedFileContent || ''
        };
      }
    };
  }

  windowObj.window = windowObj;
  windowObj.globalThis = windowObj;
  windowObj.self = windowObj;
  windowObj.top = windowObj;
  windowObj.parent = windowObj;
  windowObj.document = document;
  windowObj.navigator = navigator;
  windowObj.localStorage = localStorage;
  windowObj.sessionStorage = sessionStorage;
  windowObj.location = location;
  windowObj.alert = message => { windowObj.lastAlert = message; };
  windowObj.confirm = message => {
    windowObj.lastConfirm = message;
    return true;
  };
  windowObj.prompt = message => {
    windowObj.lastPrompt = message;
    return '';
  };
  windowObj.URL = URL;
  windowObj.encodeURIComponent = encodeURIComponent;
  windowObj.decodeURIComponent = decodeURIComponent;
  windowObj.JSON = JSON;
  windowObj.Math = Math;
  windowObj.Date = Date;
  windowObj.Array = Array;
  windowObj.Object = Object;
  windowObj.String = String;
  windowObj.Number = Number;
  windowObj.Boolean = Boolean;
  windowObj.RegExp = RegExp;
  windowObj.Map = Map;
  windowObj.Set = Set;
  windowObj.WeakMap = WeakMap;
  windowObj.WeakSet = WeakSet;
  windowObj.Promise = Promise;
  windowObj.Symbol = Symbol;
  windowObj.Intl = Intl;
  windowObj.Reflect = Reflect;
  windowObj.parseInt = parseInt;
  windowObj.parseFloat = parseFloat;
  windowObj.isNaN = isNaN;
  windowObj.requestAnimationFrame = cb => windowObj.setTimeout(() => cb(Date.now()), 16);
  windowObj.cancelAnimationFrame = id => windowObj.clearTimeout(id);
  windowObj.fetch = async () => { throw new Error('fetch not expected in tests'); };
  windowObj.FileReader = class {
    readAsText(file) {
      const result = file && typeof file.text === 'function'
        ? file.text()
        : Promise.resolve(file && file.content ? file.content : '');
      Promise.resolve(result).then(text => {
        if (typeof this.onload === 'function') {
          this.onload({ target: { result: text } });
        }
      });
    }
  };
  windowObj.HTMLElement = MockElement;
  windowObj.MutationObserver = class {
    constructor(callback) {
      this.callback = callback;
    }
    observe() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
  };

  const baseIds = [
    'activeFileDisplay', 'saveStatus', 'timestampStatus', 'editToggleBtn', 'compactToggleBtn',
    'modeToggleBtn', 'saveAsBtn', 'openFileBtn', 'installAppBtn', 'mobileEditToggleBtn',
    'mobileCompactToggleBtn', 'mobileSaveAsBtn', 'mobileOpenFileBtn', 'mobileInstallAppBtn',
    'mainTitle', 'mainSubtitle', 'cityNav', 'itinerary', 'transport-table-container',
    'accom-table-container', 'budget-kpi-container', 'budget-table-container',
    'guides-container', 'packing-areas-container', 'mapContainer', 'journey-map-view',
    'map-legend-container', 'journey-stats', 'mobileMenuSheet', 'print-preview-modal',
    'printDateRange', 'showTransport', 'showAccom', 'showActivities', 'showCosts',
    'printPreviewContent', 'ai-modal', 'aiTripTitle', 'aiTripDates', 'aiTripCities',
    'aiTripVibe', 'aiOutputBox', 'aiPromptOutput', 'guide-modal', 'guideContainer',
    'add-leg-modal', 'city-modal', 'journey-modal', 'stay-modal', 'importFile',
    'newCityCountrySelect', 'customCountryDiv', 'customCountryName', 'customCountryCode',
    'stayCitySelect', 'stayPropertyName', 'stayCheckIn', 'stayCheckOut', 'stayNights',
    'stayStatus', 'stayProvider', 'stayBookingRef', 'stayTotalCost', 'stayNotes',
    'stayDeleteBtn', 'journeyDeleteBtn', 'saveFoodBtn', 'foodName', 'foodCost',
    'saveActivityBtn', 'activityCategory', 'activityTitle', 'activityLocation',
    'activityTime', 'activityCost', 'customCountryDiv', 'backup-reminder', 'expandAll',
    'expandAllLegs', 'mobileMenuSheet', 'tab-itinerary', 'tab-transport', 'tab-accom',
    'tab-budget', 'tab-packing', 'tab-map'
  ];

  baseIds.forEach(id => {
    const el = document.getElementById(id);
    el.connected = true;
    if (id === 'printDateRange') el.tagName = 'SELECT';
    if (id === 'showTransport' || id === 'showAccom' || id === 'showActivities' || id === 'showCosts') {
      el.tagName = 'INPUT';
      el.type = 'checkbox';
      el.checked = ['showTransport', 'showAccom', 'showActivities'].includes(id);
    }
  });

  const mobileMenuSheet = document.getElementById('mobileMenuSheet');
  mobileMenuSheet.className = 'mobile-menu-sheet';
  mobileMenuSheet.setAttribute('aria-hidden', 'true');

  const appMenuBar = document.createElement('div');
  appMenuBar.className = 'app-menu-bar';
  document.body.appendChild(appMenuBar);

  const appTabsNav = document.createElement('div');
  appTabsNav.className = 'app-tabs-nav';
  document.body.appendChild(appTabsNav);

  const cityNav = document.getElementById('cityNav');
  cityNav.className = 'city-nav';
  const cityNavList = document.createElement('div');
  cityNavList.className = 'city-nav-list';
  cityNav.appendChild(cityNavList);

  const appTabButtons = [
    ['itinerary', 'Itinerary'],
    ['transport', 'Transport'],
    ['accom', 'Accommodation'],
    ['budget', 'Budget'],
    ['packing', 'Packing'],
    ['map', 'Map']
  ].map(([tabId, label], index) => {
    const btn = document.createElement('button');
    btn.className = 'app-tab-btn';
    btn.dataset.tab = tabId;
    btn.innerText = label;
    btn.id = `seed-tab-${tabId}`;
    if (index === 0) btn.classList.add('active');
    document.body.appendChild(btn);
    return btn;
  });

  const tabPaneIds = ['itinerary', 'transport', 'accom', 'budget', 'packing', 'map'];
  tabPaneIds.forEach((tabId, index) => {
    const pane = document.getElementById(`tab-${tabId}`);
    pane.className = 'tab-pane';
    if (index === 0) pane.classList.add('active');
  });

  const printStyleSummary = document.createElement('input');
  printStyleSummary.type = 'radio';
  printStyleSummary.name = 'printStyle';
  printStyleSummary.value = 'summary';
  printStyleSummary.checked = true;
  printStyleSummary.id = 'printStyleSummary';
  document.body.appendChild(printStyleSummary);

  const printStyleDetailed = document.createElement('input');
  printStyleDetailed.type = 'radio';
  printStyleDetailed.name = 'printStyle';
  printStyleDetailed.value = 'detailed';
  printStyleDetailed.checked = false;
  printStyleDetailed.id = 'printStyleDetailed';
  document.body.appendChild(printStyleDetailed);

  const printDateRange = document.getElementById('printDateRange');
  printDateRange.tagName = 'SELECT';

  const dayCard = document.createElement('div');
  dayCard.className = 'day-card open';
  const dayBar = document.createElement('div');
  dayBar.className = 'day-bar';
  const dayNum = document.createElement('span');
  dayNum.className = 'day-num';
  dayNum.textContent = '1';
  const dayName = document.createElement('span');
  dayName.className = 'day-name';
  dayName.textContent = 'Mon';
  dayBar.appendChild(dayNum);
  dayBar.appendChild(dayName);
  dayCard.appendChild(dayBar);
  document.body.appendChild(dayCard);

  const leg = document.createElement('div');
  leg.className = 'leg';
  document.body.appendChild(leg);

  const printPreviewModal = document.getElementById('print-preview-modal');
  printPreviewModal.style.display = 'none';

  const aiModal = document.getElementById('ai-modal');
  aiModal.style.display = 'none';

  const guideModal = document.getElementById('guide-modal');
  guideModal.style.display = 'none';

  const cityModal = document.getElementById('city-modal');
  cityModal.style.display = 'none';

  const journeyModal = document.getElementById('journey-modal');
  journeyModal.style.display = 'none';

  const stayModal = document.getElementById('stay-modal');
  stayModal.style.display = 'none';

  const importFile = document.getElementById('importFile');
  importFile.tagName = 'INPUT';
  importFile.type = 'file';
  importFile.click = () => {
    windowObj.importFileClicked = true;
    document.lastClickedElement = importFile;
    importFile.selected = true;
  };

  const seedInput = (id, value = '') => {
    const el = document.getElementById(id);
    el.tagName = 'INPUT';
    el.value = value;
    return el;
  };

  seedInput('aiTripTitle');
  seedInput('aiTripDates');
  seedInput('aiTripCities');
  const aiVibe = document.getElementById('aiTripVibe');
  aiVibe.tagName = 'TEXTAREA';
  aiVibe.value = '';

  ['foodName', 'foodCost', 'activityTitle', 'activityLocation', 'activityTime', 'activityCost',
    'stayPropertyName', 'stayCheckIn', 'stayCheckOut', 'stayNights', 'stayProvider', 'stayBookingRef',
    'stayTotalCost', 'stayNotes', 'customCountryName', 'customCountryCode', 'newLegCityName',
    'legDateFrom', 'legDateTo'].forEach(id => {
    const el = document.getElementById(id);
    el.tagName = 'INPUT';
  });

  ['stayCitySelect', 'stayStatus', 'activityCategory', 'newCityCountrySelect', 'printDateRange'].forEach(id => {
    const el = document.getElementById(id);
    el.tagName = 'SELECT';
  });

  const accentIds = ['saveAsBtn', 'openFileBtn', 'installAppBtn', 'mobileSaveAsBtn', 'mobileOpenFileBtn', 'mobileInstallAppBtn', 'editToggleBtn', 'compactToggleBtn', 'mobileEditToggleBtn', 'mobileCompactToggleBtn'];
  accentIds.forEach(id => document.getElementById(id).className = 'app-menu-btn');

  document.body.appendChild(document.getElementById('mainTitle'));
  document.body.appendChild(document.getElementById('mainSubtitle'));

  const context = {
    ...windowObj,
    __errors: errors,
    __warnings: warnings,
    __downloads: downloads,
    __timers: timers,
    __serviceWorkerRegistrations: serviceWorkerRegistrations,
    __reloadCalled: () => reloadCalled,
    __printCalled: () => printCalled,
    __flushTimers() {
      const pending = timers.splice(0, timers.length);
      pending.forEach(timer => {
        if (typeof timer.fn === 'function') timer.fn();
      });
    },
    __dispatchWindowEvent(type, detail = {}) {
      windowObj.dispatchEvent({ type, ...detail });
    },
    __dispatchDocumentEvent(type, detail = {}) {
      document.dispatchEvent({ type, ...detail });
    },
    __registerDownload() {},
    __setImportedFileContent(content) {
      windowObj.lastImportedFileContent = content;
    },
    __resetDownloads() {
      downloads.length = 0;
      document.lastDownload = null;
    },
    __captureAnchorDownload(anchor) {
      downloads.push({
        href: anchor.href,
        download: anchor.download
      });
      document.lastDownload = { href: anchor.href, download: anchor.download };
    }
  };

  context.document = document;
  context.window = context;
  context.navigator = navigator;
  context.localStorage = localStorage;
  context.sessionStorage = sessionStorage;
  context.location = location;

  const originalCreateElement = document.createElement.bind(document);
  document.createElement = function(tagName) {
    const el = originalCreateElement(tagName);
    if (String(tagName).toLowerCase() === 'a') {
      el.click = () => {
        context.__captureAnchorDownload(el);
      };
    }
    return el;
  };

  return {
    context,
    document,
    window: context,
    localStorage,
    sessionStorage,
    errors,
    warnings,
    downloads,
    serviceWorkerRegistrations,
    flushTimers: () => context.__flushTimers(),
    dispatchWindowEvent: type => context.__dispatchWindowEvent(type),
    dispatchDocumentEvent: type => context.__dispatchDocumentEvent(type),
    setImportedFileContent: content => context.__setImportedFileContent(content),
    reloadCalled: () => reloadCalled,
    printCalled: () => printCalled
  };
}

function loadAppScripts(harness) {
  const scriptOrder = [
    ['js/utils.js', 'js/utils.js'],
    ['js/data.js', 'js/data.js'],
    ['js/packing.js', 'js/packing.js'],
    ['js/dragdrop.js', 'js/dragdrop.js'],
    ['js/crud.js', 'js/crud.js'],
    ['js/tabs.js', 'js/tabs.js'],
    ['js/ai.js', 'js/ai.js'],
    ['js/guide.js', 'js/guide.js'],
    ['js/map.js', 'js/map.js'],
    ['js/ui.js', 'js/ui.js'],
    ['js/itinerary.js', 'js/itinerary.js'],
    ['js/backup.js', 'js/backup.js'],
    ['js/auto-stays.js', 'js/auto-stays.js'],
    ['js/transport.js', 'js/transport.js']
  ];

  scriptOrder.forEach(([relativePath, filename]) => {
    const source = loadSource(relativePath);
    runScriptInContext(source, harness.context, filename);
  });
}

function bootstrapApp(harness) {
  const inlineBootstrap = `
let deferredInstallPrompt = null;

function isStandaloneDisplayMode() {
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
}

function syncInstallButton() {
  const btn = document.getElementById('installAppBtn');
  const mobileBtn = document.getElementById('mobileInstallAppBtn');
  if (!btn) return;
  btn.hidden = isStandaloneDisplayMode() || !deferredInstallPrompt;
  if (mobileBtn) mobileBtn.hidden = btn.hidden;
  if (typeof syncResponsiveUi === 'function') syncResponsiveUi();
}

async function promptInstallApp() {
  if (!deferredInstallPrompt) return;
  deferredInstallPrompt.prompt();
  try {
    await deferredInstallPrompt.userChoice;
  } finally {
    deferredInstallPrompt = null;
    syncInstallButton();
  }
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js', { scope: './' }).catch(err => console.log('SW registration failed:', err));
  });
}

window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault();
  deferredInstallPrompt = event;
  syncInstallButton();
});

window.addEventListener('appinstalled', () => {
  deferredInstallPrompt = null;
  syncInstallButton();
});

document.addEventListener('DOMContentLoaded', () => {
  syncInstallButton();
});

initData();
applyUiSettings();
buildNav();
buildItinerary();
reObserveLegs();
`;

  runScriptInContext(inlineBootstrap, harness.context, 'inline-bootstrap.js');
  harness.dispatchDocumentEvent('DOMContentLoaded');
  harness.dispatchWindowEvent('load');
}

module.exports = {
  assert,
  bootstrapApp,
  createBrowserHarness,
  loadAppScripts
};
