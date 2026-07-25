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

/** Chi tiết Pay-on-behalf (Phase B5, QĐ-48). Đọc TRỰC TIẾP 18_ImportPOB_Raw để lấy
 * cột quote-customer/remark KHÔNG có trong 24 cột fact. Amount là VND → kèm Amount_USD
 * quy đổi theo tỷ giá tháng (00_Config). Dùng helper của Transform.gs (cùng global scope). */
function getPOB() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var t = readSheetObjects_(ss, '18_ImportPOB_Raw', ['B/L', 'AMOUNT']);
  if (!t) return { ok: true, count: 0, rows: [], note: 'Chưa thấy tab 18_ImportPOB_Raw' };
  var rate = null;
  try { rate = loadMaps_(ss).rate[monthKey_(getReportMonth_(ss))]; } catch (e) {}
  var rows = t.rows.map(function (r) {
    var amt = num_(r['AMOUNT']);
    return {
      'B/L': str_(r['B/L']) || '',
      'INVOICE NO.': str_(r['INVOICE NO.']) || '',
      'Shipper/Consignee': str_(r['SHIPPER/CONSIGNEE']) || '',
      Amount: amt,
      Amount_USD: (rate && amt != null) ? Math.round(amt / rate * 100) / 100 : null,
      Route: str_(r['ROUTE']) || '',
      'Quote customer': num_(r['AMOUNT QUOTE CUSTOMER']),
      Remark: str_(r['REMARK']) || '',
    };
  }).filter(function (r) { return r.Amount != null && r.Amount !== 0; });
  return { ok: true, count: rows.length, rows: rows, usdRate: rate || null };
}
