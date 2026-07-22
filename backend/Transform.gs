/** Transform.gs — ENGINE dựng 40_FACT_CostLines TỪ các sheet Raw (thay Power Query).
 *
 * QĐ-44: GAS tự tính fact từ raw 10–19 + bảng map, KHÔNG lấy từ 40_FACT_CostLines dán sẵn.
 * Cơ chế: BATCH — chạy `rebuildFact()` (menu hoặc editor) → GHI ra tab `40_FACT_CostLines`.
 *         Web vẫn CHỈ ĐỌC `40_FACT_CostLines` (nhanh). Đây là "Refresh All" bản GAS.
 *
 * PHẠM VI v1 (tăng dần — courier trước): DHL, FedEx Export, FedEx Import, Overhead.
 *   → VVMV / Dolphin / EI cắm thêm sau (xem chỗ COURIER_SOURCES + hàm stage*).
 * TRƯỜNG SINH v1 (lõi): Amount_USD · Standard Cost · Mode chuẩn · Import/Export.
 *   → Route / Loại hàng để null ở v1 (bổ sung sau).
 *
 * PHỤ THUỘC (đã dán lên Sheets): 22_Map_Cost, 23_Map_ExchangeRate. Tháng: tab 00_Config B1.
 *
 * Logic nghiệp vụ: context/11_BUSINESS_RULES.md (§1 Map_Cost, §2 USD, §3 Mode, §4 Import/Export). */

var FACT_HEADERS = ['Month','Forwarder','B/L','INVOICE NO.','CDS NO.','Shipper','Consignee','Origin','Destination','Mode','CW','CBM','Original Cost Name','Amount','Currency','Exchange Rate','USD_Rate','Amount_USD','Standard Cost','FWD Column','Mode chuẩn','Import/Export','Route','Loại hàng'];

// Tên tab map — thử lần lượt (chịu được đặt tên có/không tiền tố số)
var MAP_COST_TABS = ['22_Map_Cost', 'Map_Cost'];
var MAP_RATE_TABS = ['23_Map_ExchangeRate', 'Map_ExchangeRate'];

// Nguồn courier (unpivot cột phí). idInvoice/bl/origin/dest/cw = tên cột trên raw.
var COURIER_SOURCES = [
  { tab: '10_DHL_Raw',      forwarder: 'DHL',          idInvoice: 'INVOICE NO',     bl: 'AWB', origin: 'ORIG', dest: 'DEST', cw: 'CHRGBL WGHT (KG)' },
  { tab: '11_FedExExp_Raw', forwarder: 'FedEx Export', idInvoice: 'VAT INVOICE NO.', bl: 'AWB', origin: 'ORIG', dest: 'DEST', cw: 'CHRGBL WGHT (KG)' },
  { tab: '12_FedExImp_Raw', forwarder: 'FedEx Import', idInvoice: 'VAT INVOICE NO.', bl: 'AWB', origin: 'ORIG', dest: 'DEST', cw: 'CHRGBL WGHT (KG)' },
];

// ───────────────────────── Orchestrator ─────────────────────────
function rebuildFact() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var month = getReportMonth_(ss);
  var maps = loadMaps_(ss);
  var rate = maps.rate[month];
  if (rate == null || !(rate > 0)) {
    throw new Error('Thiếu USD_Rate cho tháng ' + month + ' ở bảng Map_ExchangeRate (23). ' +
      'Thêm dòng: ' + month + ' | <tỷ giá> → rồi chạy lại.');
  }

  var fact = [];
  var qc = { unmapped: {}, missingUsd: 0, perSource: {} };

  COURIER_SOURCES.forEach(function (src) {
    var n0 = fact.length;
    stageCourier_(ss, src, month, rate, maps.cost, fact, qc);
    qc.perSource[src.forwarder] = fact.length - n0;
  });
  var nOv = fact.length;
  stageOverhead_(ss, '19_Overhead_Raw', month, rate, maps.cost, fact, qc);
  qc.perSource['Overhead'] = fact.length - nOv;

  writeFact_(ss, fact);
  return report_(month, rate, fact, qc);
}

// ───────────────────────── Staging: courier ─────────────────────────
// DHL / FedEx: unpivot các cột phí có trong Map_Cost → mỗi khoản phí 1 dòng fact.
function stageCourier_(ss, src, month, rate, costMap, out, qc) {
  var t = readSheetObjects_(ss, src.tab, [src.bl, src.origin]);
  if (!t) return; // tab chưa có → bỏ qua
  // Cột phí = header của raw có mặt trong Map_Cost cho forwarder này
  var costCols = t.headers.filter(function (h) { return h && costMap[key_(src.forwarder, h)]; });

  t.rows.forEach(function (r) {
    var bl = str_(r[src.bl]);
    // Lọc dòng Total/Grand Total: AWB trống là dấu hiệu dòng tổng của DHL
    if (!bl) return;
    if (str_(r[src.idInvoice]).toLowerCase().indexOf('total') >= 0) return;

    var origin = str_(r[src.origin]) || null;
    var dest = str_(r[src.dest]) || null;
    var ie = impExpCourier_(src.forwarder, origin, dest);

    costCols.forEach(function (h) {
      var amt = num_(r[h]);
      if (amt === null || amt === 0) return; // Amount ≠ 0 (giữ dòng âm)
      var m = costMap[key_(src.forwarder, h)];
      if (!m.std) qc.unmapped[key_(src.forwarder, h)] = 1;
      out.push(factRow_({
        Month: month, Forwarder: src.forwarder, 'B/L': bl,
        'INVOICE NO.': str_(r[src.idInvoice]) || null,
        Shipper: str_(r['SHIPPER']) || str_(r['Shipper']) || null,
        Consignee: str_(r['CONSIGNEE']) || str_(r['Consignee']) || null,
        Origin: origin, Destination: dest, CW: num_(r[src.cw]),
        'Original Cost Name': h, Amount: amt,
        USD_Rate: rate, Amount_USD: amt / rate,
        'Standard Cost': m.std || null, 'FWD Column': m.fwd || null,
        'Mode chuẩn': 'Courier', 'Import/Export': ie,
      }));
    });
  });
}

// ───────────────────────── Staging: overhead ─────────────────────────
// 19_Overhead_Raw đã ở dạng dọc: mỗi dòng = 1 khoản. Chỉ merge Map_Cost + quy USD.
function stageOverhead_(ss, tab, month, rate, costMap, out, qc) {
  var t = readSheetObjects_(ss, tab, ['Forwarder', 'Original Cost Name']);
  if (!t) return;
  var amtCol = t.headers.indexOf('Amount (VND)') >= 0 ? 'Amount (VND)' : 'Amount';
  t.rows.forEach(function (r) {
    var fwd = str_(r['Forwarder']);
    var name = str_(r['Original Cost Name']);
    var amt = num_(r[amtCol]);
    if (!fwd || !name || amt === null || amt === 0) return;
    var m = costMap[key_(fwd, name)] || { std: null, fwd: null };
    if (!m.std) qc.unmapped[key_(fwd, name)] = 1;
    out.push(factRow_({
      Month: month, Forwarder: fwd, 'B/L': str_(r['B/L']) || null,
      'Original Cost Name': name, Amount: amt,
      USD_Rate: rate, Amount_USD: amt / rate,
      'Standard Cost': m.std || null, 'FWD Column': m.fwd || null,
      'Import/Export': 'Overhead', // FWD Column = Overhead FWD → Overhead
    }));
  });
}

// ───────────────────────── Business rules ─────────────────────────
// §4 Import/Export cho courier (Third party trước, rồi theo hãng/tuyến VN)
function impExpCourier_(fwd, origin, dest) {
  if ((fwd === 'DHL' || fwd === 'FedEx Export' || fwd === 'FedEx Import') &&
      origin && dest && origin !== 'VN' && dest !== 'VN') return 'Third party';
  if (fwd === 'FedEx Export') return 'Export';
  if (fwd === 'FedEx Import') return 'Import';
  if (fwd === 'DHL') {
    if (dest === 'VN') return 'Import';
    if (origin === 'VN') return 'Export';
    return null;
  }
  return null;
}

// ───────────────────────── Maps & config ─────────────────────────
function loadMaps_(ss) {
  var cost = {};
  var ct = readSheetFirst_(ss, MAP_COST_TABS, ['Forwarder', 'Original Cost Name', 'Standard Cost']);
  if (!ct) throw new Error('Không thấy bảng Map_Cost (thử: ' + MAP_COST_TABS.join(', ') + ').');
  ct.rows.forEach(function (r) {
    var f = str_(r['Forwarder']), n = str_(r['Original Cost Name']);
    if (!f || !n) return;
    cost[key_(f, n)] = { std: str_(r['Standard Cost']) || null, fwd: str_(r['FWD Column']) || null };
  });

  var rate = {};
  var rt = readSheetFirst_(ss, MAP_RATE_TABS, ['Month', 'USD_Rate']);
  if (!rt) throw new Error('Không thấy bảng Map_ExchangeRate (thử: ' + MAP_RATE_TABS.join(', ') + ').');
  rt.rows.forEach(function (r) {
    var m = str_(r['Month']); var v = num_(r['USD_Rate']);
    if (m && v) rate[m] = v;
  });
  return { cost: cost, rate: rate };
}

var MONTH_RE = /^\d{4}-\d{2}$/; // YYYY-MM

// Lấy tháng báo cáo. Ưu tiên 00_Config!B1, rồi named range ThangBaoCao.
// CHỈ nhận giá trị đúng dạng YYYY-MM → giá trị rác (vd named range trỏ ô "Cột 1") bị BỎ QUA.
function getReportMonth_(ss) {
  var cands = [];
  var cfg = ss.getSheetByName('00_Config');
  if (cfg) cands.push(['00_Config!B1', cfg.getRange('B1').getValue()]);
  try { var nr = ss.getRangeByName('ThangBaoCao'); if (nr) cands.push(['named range ThangBaoCao', nr.getValue()]); } catch (e) {}

  var seen = [];
  for (var i = 0; i < cands.length; i++) {
    var v = str_(cands[i][1]);
    if (MONTH_RE.test(v)) return v;
    if (v) seen.push(cands[i][0] + '="' + v + '"');
  }
  if (!cfg) { // bootstrap tab config
    cfg = ss.insertSheet('00_Config', 0);
    cfg.getRange('A1').setValue('ThangBaoCao').setFontWeight('bold');
    cfg.getRange('B1').setNumberFormat('@').setValue('');
    cfg.getRange('A2').setValue('→ Điền tháng YYYY-MM vào ô B1 (vd 2026-06) rồi chạy lại rebuildFact()');
    throw new Error('Chưa khai báo tháng. Đã tạo tab 00_Config — điền YYYY-MM vào ô B1 rồi chạy lại.');
  }
  throw new Error('Tháng báo cáo không hợp lệ (cần YYYY-MM, vd 2026-06). ' +
    (seen.length ? 'Đang thấy: ' + seen.join('; ') + '. ' : 'Ô 00_Config!B1 đang trống. ') +
    'Sửa ô 00_Config!B1 thành 2026-06 rồi chạy lại. ' +
    '(Nếu có named range ThangBaoCao trỏ ô rác thì xoá ở Data → Named ranges.)');
}

// ───────────────────────── Sheet I/O ─────────────────────────
// Đọc 1 tab → {headers, rows:[{header:value}]}, tự dò dòng header theo requiredCols (chịu khối ghi chú).
function readSheetObjects_(ss, tabName, requiredCols) {
  var sh = ss.getSheetByName(tabName);
  if (!sh) return null;
  var vals = sh.getDataRange().getValues();
  var need = Math.max(2, requiredCols.length - 1);
  var hr = -1;
  for (var i = 0; i < Math.min(vals.length, 40); i++) {
    var cells = vals[i].map(function (c) { return str_(c); });
    var hit = 0;
    requiredCols.forEach(function (k) { if (cells.indexOf(k) >= 0) hit++; });
    if (hit >= Math.min(requiredCols.length, need)) { hr = i; break; }
  }
  if (hr < 0) throw new Error('Không tìm thấy dòng header ở tab "' + tabName + '" (cần cột: ' + requiredCols.join(', ') + ').');
  var headers = vals[hr].map(function (c) { return str_(c); });
  var rows = [];
  for (i = hr + 1; i < vals.length; i++) {
    var row = vals[i];
    if (row.every(function (c) { return c === '' || c === null; })) continue;
    var obj = {};
    for (var j = 0; j < headers.length; j++) if (headers[j]) obj[headers[j]] = row[j];
    rows.push(obj);
  }
  return { headers: headers, rows: rows };
}

function readSheetFirst_(ss, tabNames, requiredCols) {
  for (var i = 0; i < tabNames.length; i++) {
    if (ss.getSheetByName(tabNames[i])) return readSheetObjects_(ss, tabNames[i], requiredCols);
  }
  return null;
}

function writeFact_(ss, fact) {
  var sh = ss.getSheetByName(CONFIG.FACT_TAB);
  if (!sh) { sh = ss.insertSheet(CONFIG.FACT_TAB); }
  if (sh.getLastRow() === 0) {
    sh.getRange(1, 1, 1, FACT_HEADERS.length).setValues([FACT_HEADERS]).setFontWeight('bold');
    sh.setFrozenRows(1);
  }
  // Xóa data cũ (giữ header), viết mới
  var last = sh.getLastRow();
  if (last > 1) sh.getRange(2, 1, last - 1, FACT_HEADERS.length).clearContent();
  if (fact.length) {
    var matrix = fact.map(function (o) {
      return FACT_HEADERS.map(function (h) { return o[h] === undefined ? null : o[h]; });
    });
    sh.getRange(2, 1, matrix.length, FACT_HEADERS.length).setValues(matrix);
  }
}

// ───────────────────────── helpers ─────────────────────────
function factRow_(o) { return o; } // giữ nguyên object; writeFact_ map theo FACT_HEADERS
function key_(f, n) { return str_(f) + '' + str_(n); }
function str_(v) { return v === null || v === undefined ? '' : String(v).trim(); }
function num_(v) {
  if (v === '' || v === null || v === undefined) return null;
  if (typeof v === 'number') return v;
  var s = String(v).replace(/,/g, '').trim();
  if (s === '') return null;
  var f = parseFloat(s);
  return isNaN(f) ? null : f;
}

function report_(month, rate, fact, qc) {
  var totUsd = 0; fact.forEach(function (o) { totUsd += (o['Amount_USD'] || 0); });
  var lines = ['✅ rebuildFact xong — tháng ' + month + ' (USD_Rate ' + rate + ')',
    'Tổng: ' + fact.length + ' dòng · $' + Math.round(totUsd * 100) / 100];
  Object.keys(qc.perSource).forEach(function (f) { lines.push('  · ' + f + ': ' + qc.perSource[f] + ' dòng'); });
  var un = Object.keys(qc.unmapped);
  if (un.length) lines.push('⚠️ Phí CHƯA map (' + un.length + '): ' + un.map(function (k) { return k.replace('', ' / '); }).join('; '));
  var msg = lines.join('\n');
  Logger.log(msg);
  return msg;
}

// Menu tiện dụng khi mở Sheet
function onOpen() {
  SpreadsheetApp.getUi().createMenu('Logistics DB')
    .addItem('Rebuild fact (dựng lại từ raw)', 'rebuildFact')
    .addToUi();
}
