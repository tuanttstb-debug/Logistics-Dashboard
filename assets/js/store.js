/* store.js — cache dữ liệu + bộ lọc + phép tổng hợp cơ bản. */
(function () {
  var _rows = [];
  var _meta = { months: [], forwarders: [], routes: [] };
  var _filter = { month: '', forwarder: '', impexp: '', mode: '', route: '' };
  var C = window.COLS;

  function setRows(rows) { _rows = rows || []; }
  function setMeta(m) { _meta = m || _meta; }
  function getMeta() { return _meta; }
  function setFilter(patch) { Object.assign(_filter, patch || {}); }
  function getFilter() { return _filter; }

  function filtered() {
    return _rows.filter(function (r) {
      if (_filter.month && r[C.MONTH] !== _filter.month) return false;
      if (_filter.forwarder && r[C.FORWARDER] !== _filter.forwarder) return false;
      if (_filter.impexp && r[C.IMP_EXP] !== _filter.impexp) return false;
      if (_filter.mode && r[C.MODE_STD] !== _filter.mode) return false;
      if (_filter.route && r[C.ROUTE] !== _filter.route) return false;
      return true;
    });
  }
  function sumUSD(rows) {
    return (rows || filtered()).reduce(function (s, r) { return s + (Number(r[C.AMOUNT_USD]) || 0); }, 0);
  }
  function sumBy(field, rows) {
    var out = {}; (rows || filtered()).forEach(function (r) {
      var k = r[field] || '(trống)'; out[k] = (out[k] || 0) + (Number(r[C.AMOUNT_USD]) || 0);
    });
    return out;
  }
  // QC: đếm dòng thiếu Amount_USD (ASSUMPTION-W04)
  function countMissingUSD() {
    return _rows.filter(function (r) { return r[C.AMOUNT_USD] == null || r[C.AMOUNT_USD] === ''; }).length;
  }

  window.Store = { setRows: setRows, setMeta: setMeta, getMeta: getMeta,
    setFilter: setFilter, getFilter: getFilter, filtered: filtered,
    sumUSD: sumUSD, sumBy: sumBy, countMissingUSD: countMissingUSD,
    raw: function () { return _rows; } };
})();
