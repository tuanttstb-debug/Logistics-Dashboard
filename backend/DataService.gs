/** DataService.gs — đọc fact_CostLines, trả về cho web. */

function getFacts(month) {
  var rows = readTabAsObjects(CONFIG.FACT_TAB);
  if (month) rows = rows.filter(function (r) { return String(r[CONFIG.COL_MONTH]) === String(month); });
  return { ok: true, count: rows.length, rows: rows };
}

function getMeta() {
  var rows = readTabAsObjects(CONFIG.FACT_TAB);
  return {
    ok: true,
    months: uniqueValues(rows, CONFIG.COL_MONTH),
    forwarders: uniqueValues(rows, CONFIG.COL_FORWARDER),
    routes: uniqueValues(rows, CONFIG.COL_ROUTE),
  };
}
