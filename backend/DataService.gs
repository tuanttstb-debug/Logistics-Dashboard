/** DataService.gs — đọc 40_FACT_CostLines, trả về cho web. Web CHỈ ĐỌC. */

function getFacts(month) {
  var rows = readTabAsObjects(CONFIG.FACT_TAB);
  if (month) rows = rows.filter(function (r) { return String(r[CONFIG.COL_MONTH]) === String(month); });
  return { ok: true, count: rows.length, rows: rows };
}

function getMeta() {
  var rows = readTabAsObjects(CONFIG.FACT_TAB);
  // QC: đếm dòng thiếu Amount_USD (ASSUMPTION-W04) — 1 dòng ở T6/2026
  var missingUsd = 0, total = 0;
  rows.forEach(function (r) {
    var v = r[CONFIG.COL_MONEY];
    if (v === '' || v === null || v === undefined) missingUsd++;
    else if (typeof v === 'number') total += v;
    else if (!isNaN(parseFloat(v))) total += parseFloat(v);
  });
  return {
    ok: true,
    rowCount: rows.length,
    months: uniqueValues(rows, CONFIG.COL_MONTH),
    forwarders: uniqueValues(rows, CONFIG.COL_FORWARDER),
    routes: uniqueValues(rows, CONFIG.COL_ROUTE),
    impExp: uniqueValues(rows, CONFIG.COL_IE),
    missingUsd: missingUsd,
    totalUsd: Math.round(total * 100) / 100,
  };
}
