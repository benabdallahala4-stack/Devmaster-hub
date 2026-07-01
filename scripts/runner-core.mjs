/**
 * Core logic for the in-browser JavaScript exercise runner.
 *
 * Exported as a STRING so it can be used two ways from one source of truth:
 *   - Node: `new Function(RUNNER_CORE + 'return runSuite;')` (see verify-runner.mjs)
 *   - Browser: embedded verbatim as the body of a Web Worker in CodeRunnerComponent.
 *
 * It transforms an Exercism-style Jest spec (strips ESM imports) and the user's
 * solution (strips `export`), then runs the spec against a minimal Jest-compatible
 * shim (describe/test/it/xtest + expect matchers) and returns a results array:
 *   [{ name, status: 'pass' | 'fail' | 'skip', error? }]
 *
 * Inner code uses only single-quoted strings (no template literals / no ${}) so it
 * nests safely inside this outer template literal.
 */
export const RUNNER_CORE = `
function __stripImports(code) {
  // Remove ESM import lines (Exercism specs use single-line imports).
  return String(code).replace(/^\\s*import\\b.*$/gm, '');
}
function __stripExports(code) {
  return String(code)
    .replace(/^\\s*export\\s+default\\s+/gm, '')
    .replace(/^\\s*export\\s+/gm, '');
}
function __unskip(code) {
  // Exercism ships all-but-the-first test as xtest/xit so learners enable them
  // progressively. We grade the whole suite, so activate every test.
  return String(code)
    .replace(/\\bxtest\\b/g, 'test')
    .replace(/\\bxit\\b/g, 'it')
    .replace(/\\bxdescribe\\b/g, 'describe')
    .replace(/\\.skip\\(/g, '(')
    .replace(/\\.only\\(/g, '(');
}
function __fmtV(v) {
  try {
    if (typeof v === 'function') return 'function ' + (v.name || '');
    var s = JSON.stringify(v);
    if (s === undefined) return String(v);
    return s.length > 200 ? s.slice(0, 200) + '…' : s;
  } catch (e) { return String(v); }
}
function __fmtName(name, args) {
  var i = 0;
  return String(name).replace(/%[psdifjo#%]/g, function (m) {
    if (m === '%%') return '%';
    return __fmtV(args[i++]);
  });
}
function __errMsg(e) {
  if (e && e.message != null) return String(e.message);
  return String(e);
}
function __equals(a, b) {
  if (a === b) return true;
  if (typeof a === 'number' && typeof b === 'number') return a === b || (isNaN(a) && isNaN(b));
  if (a && b && typeof a === 'object' && typeof b === 'object') {
    if (Array.isArray(a) !== Array.isArray(b)) return false;
    if (a instanceof Date && b instanceof Date) return a.getTime() === b.getTime();
    if (a instanceof RegExp && b instanceof RegExp) return a.toString() === b.toString();
    if (a instanceof Set && b instanceof Set) {
      if (a.size !== b.size) return false;
      var bv = Array.from(b);
      var av = Array.from(a);
      return av.every(function (x) { return bv.some(function (y) { return __equals(x, y); }); });
    }
    if (a instanceof Map && b instanceof Map) {
      if (a.size !== b.size) return false;
      var ok = true;
      a.forEach(function (v, k) { if (!b.has(k) || !__equals(v, b.get(k))) ok = false; });
      return ok;
    }
    var ka = Object.keys(a), kb = Object.keys(b);
    if (ka.length !== kb.length) return false;
    return ka.every(function (k) {
      return Object.prototype.hasOwnProperty.call(b, k) && __equals(a[k], b[k]);
    });
  }
  return false;
}
function __matchers(actual, isNot) {
  function assert(pass, msg) {
    if (isNot) pass = !pass;
    if (!pass) throw new Error(msg + (isNot ? ' (negated)' : ''));
  }
  var m = {
    toBe: function (e) { assert(Object.is(actual, e), 'expected ' + __fmtV(actual) + ' to be ' + __fmtV(e)); },
    toEqual: function (e) { assert(__equals(actual, e), 'expected ' + __fmtV(actual) + ' to equal ' + __fmtV(e)); },
    toStrictEqual: function (e) { assert(__equals(actual, e), 'expected ' + __fmtV(actual) + ' to strictly equal ' + __fmtV(e)); },
    toBeCloseTo: function (e, d) { if (d === undefined) d = 2; assert(Math.abs(actual - e) < Math.pow(10, -d) / 2, 'expected ' + __fmtV(actual) + ' to be close to ' + __fmtV(e)); },
    toBeTruthy: function () { assert(!!actual, 'expected ' + __fmtV(actual) + ' to be truthy'); },
    toBeFalsy: function () { assert(!actual, 'expected ' + __fmtV(actual) + ' to be falsy'); },
    toBeNull: function () { assert(actual === null, 'expected ' + __fmtV(actual) + ' to be null'); },
    toBeUndefined: function () { assert(actual === undefined, 'expected ' + __fmtV(actual) + ' to be undefined'); },
    toBeDefined: function () { assert(actual !== undefined, 'expected value to be defined'); },
    toBeNaN: function () { assert(typeof actual === 'number' && isNaN(actual), 'expected ' + __fmtV(actual) + ' to be NaN'); },
    toContain: function (e) { assert(Array.isArray(actual) ? actual.indexOf(e) !== -1 : String(actual).indexOf(e) !== -1, 'expected ' + __fmtV(actual) + ' to contain ' + __fmtV(e)); },
    toContainEqual: function (e) { assert(Array.isArray(actual) && actual.some(function (x) { return __equals(x, e); }), 'expected ' + __fmtV(actual) + ' to contain equal ' + __fmtV(e)); },
    toHaveLength: function (n) { assert(actual != null && actual.length === n, 'expected length ' + (actual == null ? 'n/a' : actual.length) + ' to be ' + n); },
    toBeGreaterThan: function (n) { assert(actual > n, 'expected ' + __fmtV(actual) + ' > ' + n); },
    toBeGreaterThanOrEqual: function (n) { assert(actual >= n, 'expected ' + __fmtV(actual) + ' >= ' + n); },
    toBeLessThan: function (n) { assert(actual < n, 'expected ' + __fmtV(actual) + ' < ' + n); },
    toBeLessThanOrEqual: function (n) { assert(actual <= n, 'expected ' + __fmtV(actual) + ' <= ' + n); },
    toMatch: function (re) { assert(re instanceof RegExp ? re.test(String(actual)) : String(actual).indexOf(re) !== -1, 'expected ' + __fmtV(actual) + ' to match ' + __fmtV(re)); },
    toThrow: function (expected) {
      if (typeof actual !== 'function') throw new Error('toThrow expects a function');
      var threw = false, err;
      try { actual(); } catch (e) { threw = true; err = e; }
      var pass = threw;
      if (threw && expected !== undefined) {
        var msg = (err && err.message != null) ? String(err.message) : String(err);
        if (typeof expected === 'string') pass = msg.indexOf(expected) !== -1;
        else if (expected instanceof RegExp) pass = expected.test(msg);
        else if (expected instanceof Error) pass = msg === expected.message;
        else if (typeof expected === 'function') pass = err instanceof expected;
      }
      assert(pass, 'expected function to throw' + (expected !== undefined ? ' ' + __fmtV(expected) : ''));
    }
  };
  return m;
}
function runSuite(userCode, testCode) {
  var results = [];
  var path = [];
  var beforeEaches = [];
  var afterEaches = [];
  function label(name) { return path.concat([String(name)]).join(' > '); }
  function describe(name, fn) { path.push(String(name)); try { fn(); } finally { path.pop(); } }
  describe.each = function (table) { return function (name, fn) { table.forEach(function (row) { var args = Array.isArray(row) ? row : [row]; describe(__fmtName(name, args), function () { fn.apply(null, args); }); }); }; };
  describe.skip = function () {};
  function runTest(name, fn) {
    try {
      beforeEaches.forEach(function (h) { h(); });
      fn();
      afterEaches.forEach(function (h) { h(); });
      results.push({ name: label(name), status: 'pass' });
    } catch (e) {
      results.push({ name: label(name), status: 'fail', error: __errMsg(e) });
    }
  }
  var test = function (name, fn) { runTest(name, fn); };
  test.each = function (table) { return function (name, fn) { table.forEach(function (row) { var args = Array.isArray(row) ? row : [row]; runTest(__fmtName(name, args), function () { fn.apply(null, args); }); }); }; };
  test.skip = function (name) { results.push({ name: label(name), status: 'skip' }); };
  test.todo = function (name) { results.push({ name: label(name), status: 'skip' }); };
  var it = test;
  var xtest = function (name) { results.push({ name: label(name), status: 'skip' }); };
  var xit = xtest;
  var beforeEach = function (fn) { beforeEaches.push(fn); };
  var afterEach = function (fn) { afterEaches.push(fn); };
  var beforeAll = function (fn) { try { fn(); } catch (e) {} };
  var afterAll = function () {};
  var expect = function (actual) { var mm = __matchers(actual, false); mm.not = __matchers(actual, true); mm.resolves = mm; mm.rejects = mm; return mm; };

  var src = __stripExports(userCode) + '\\n;\\n' + __unskip(__stripImports(testCode));
  var runner = new Function('describe', 'test', 'it', 'xtest', 'xit', 'expect', 'beforeEach', 'afterEach', 'beforeAll', 'afterAll', '"use strict";\\n' + src);
  runner(describe, test, it, xtest, xit, expect, beforeEach, afterEach, beforeAll, afterAll);
  return results;
}
`;
