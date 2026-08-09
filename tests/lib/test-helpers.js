const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..', '..');

function read(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function extractBetween(source, startMarker, endMarker) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start);
  assert(start !== -1, `Missing start marker: ${startMarker}`);
  assert(end !== -1, `Missing end marker: ${endMarker}`);
  return source.slice(start, end);
}

function createElement(initial = {}) {
  return {
    value: '',
    textContent: '',
    style: {},
    selected: false,
    select() {
      this.selected = true;
    },
    ...initial
  };
}

function createDocument() {
  const elements = new Map();

  return {
    elements,
    getElementById(id) {
      if (!elements.has(id)) {
        elements.set(id, createElement());
      }
      return elements.get(id);
    },
    execCommand() {
      return true;
    }
  };
}

function createAiContext() {
  const document = createDocument();
  const alerts = [];
  const clipboardWrites = [];
  const execCommands = [];

  const context = {
    document: {
      ...document,
      execCommand(command) {
        execCommands.push(command);
        return command === 'copy';
      }
    },
    navigator: {
      clipboard: {
        writeText: async text => {
          clipboardWrites.push(text);
        }
      }
    },
    alert: message => {
      alerts.push(message);
    },
    console,
    setTimeout,
    clearTimeout,
    globalThis: null
  };
  context.globalThis = context;

  return { context, document: context.document, alerts, clipboardWrites, execCommands };
}

function createVmContext(extra = {}) {
  const context = {
    console,
    setTimeout,
    clearTimeout,
    ...extra,
    globalThis: null
  };
  context.globalThis = context;
  return context;
}

function loadSource(relativePath) {
  return read(path.join(root, relativePath));
}

function runScriptInContext(source, context, filename) {
  vm.runInNewContext(source, context, { filename });
  return context;
}

module.exports = {
  assert,
  createAiContext,
  createDocument,
  createElement,
  createVmContext,
  extractBetween,
  loadSource,
  read,
  root,
  runScriptInContext
};
