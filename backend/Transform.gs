/** Transform.gs — ENGINE dựng 40_FACT_CostLines TỪ raw (port Power Query, QĐ-44/45).
 *
 * BÁM ĐÚNG PQ gốc (trích từ Logistics_System.xlsx → data/_source/pq_section1.m):
 *   Mỗi nguồn: UnpivotOtherColumns(tập định danh) → mỗi cột phí 1 dòng → merge Map_Cost.
 *   Tầng chung (1 lần): Amount≠0 → USD_Rate → Amount_USD → Mode chuẩn → Import/Export
 *                        → Route (Export??CDS??BL + UpdateManual) → Loại hàng.  [Route/Loại hàng: bước kế]
 *
 * Chạy `rebuildFact()` (menu Logistics DB) → GHI 40_FACT_CostLines. Web CHỈ ĐỌC tab đó.
 * Phụ thuộc Sheets: 10–19 (raw), 22_Map_Cost, 23_Map_ExchangeRate, 00_Config!B1 (tháng).
 * Logic: context/11_BUSINESS_RULES.md. */

var FACT_HEADERS = ['Month','Forwarder','B/L','INVOICE NO.','CDS NO.','Shipper','Consignee','Origin','Destination','Mode','CW','CBM','Original Cost Name','Amount','Currency','Exchange Rate','USD_Rate','Amount_USD','Standard Cost','FWD Column','Mode chuẩn','Import/Export','Route','Loại hàng'];
var MAP_COST_TABS = ['22_Map_Cost', 'Map_Cost'];
var MAP_RATE_TABS = ['23_Map_ExchangeRate', 'Map_ExchangeRate'];

// Cột định danh sẽ ĐÍNH vào mỗi dòng phí (nếu có mặt sau rename)
var CARRY = ['B/L','INVOICE NO.','CDS NO.','Shipper','Consignee','Origin','Destination','Mode','CW','CBM','Exchange Rate'];
var NUM_CARRY = { 'CW': 1, 'CBM': 1, 'Exchange Rate': 1 };

// ── Cấu hình staging từng nguồn (rename: raw→tên chuẩn; identifiers: KHÔNG unpivot) ──
var STAGES = [
  { tab: '10_DHL_Raw', forwarder: 'DHL',
    rename: { 'AWB': 'B/L', 'ORIG': 'Origin', 'DEST': 'Destination', 'CHRGBL WGHT (KG)': 'CW', 'SHIPPER': 'Shipper', 'CONSIGNEE': 'Consignee' },
    identifiers: ['INVOICE NO','VAT INVOICE NO.','DATE','B/L','SHIP DATE','Shipper','Consignee','Origin','Destination','Zone','CW','FUEL %','TOTAL AMOUNT (VND)'],
    require: ['SHIPPER', 'AWB'], dropIfTotal: 'INVOICE NO' },

  { tab: '11_FedExExp_Raw', forwarder: 'FedEx Export',
    rename: { 'AWB': 'B/L', 'CHRGBL WGHT (KG)': 'CW', 'ORIG': 'Origin', 'DEST': 'Destination', 'SHIPPER': 'Shipper', 'CONSIGNEE': 'Consignee' },
    identifiers: ['VAT INVOICE NO.','DEBIT NOTE NO.','DEBIT NOTE DATE','B/L','SHIP DATE','Shipper','Consignee','Origin','Destination','SERV','CW','TOTAL AMOUNT (VND)'],
    require: ['AWB', 'SHIPPER'] },

  { tab: '12_FedExImp_Raw', forwarder: 'FedEx Import',
    rename: { 'AWB': 'B/L', 'CHRGBL WGHT (KG)': 'CW', 'ORIG': 'Origin', 'DEST': 'Destination', 'SHIPPER': 'Shipper', 'CONSIGNEE': 'Consignee' },
    identifiers: ['STT','VAT INVOICE NO.','DEBIT NOTE NO.','DEBIT NOTE DATE','B/L','SHIP DATE','Shipper','Consignee','Origin','Destination','SERV','CW','TOTAL AMOUNT (VND)'],
    require: ['AWB', 'SHIPPER'] },

  { tab: '15_Dolphin_Raw', forwarder: 'Dolphin',
    rename: { 'HBL no': 'B/L', 'Shipper/Cnee': 'Shipper', 'Kgs': 'CW', 'Invoice No': 'INVOICE NO.', 'CDS No': 'CDS NO.', 'Cbm': 'CBM' },
    identifiers: ['B/L','INVOICE NO.','Shipper','AOL/POL','CDS NO.','Date','Mode','CW','CBM'],
    require: ['HBL no', 'Invoice No'] },

  { tab: '14_VVMV_Raw', forwarder: 'VVMV',
    rename: { 'HBL No.': 'B/L', 'Invoice No': 'INVOICE NO.', 'Shipper': 'Shipper', "Destination/ Shipper's country": 'Destination', 'Kgs': 'CW', 'Custom No': 'CDS NO.' },
    identifiers: ['INVOICE NO.','Shipper','Destination','CDS NO.','CD Date','Mode','CW','CBM','Total','Total (Included vAT)','Sub-Total (vnd)','TOTAL AMOUNT','NOTE','B/L'],
    require: ['Invoice No', 'Kgs'], vvmvBL: true },

  { tab: '13_EI_Raw', forwarder: 'EI',
    rename: { 'MBL/ HBL': 'B/L', 'type': 'Mode', 'Shipper/Consignee': 'Shipper', 'POL': 'Origin', 'POD': 'Destination', '(CBM)': 'CBM' },
    identifiers: ['NO.','Expeditors inv','Invoice date','File Ref','B/L','Mode','Shipper','Origin','ETD/COB','Destination','ETA','Ship date','CW','GW','CBM','VAT No.','Date','TOTAL IN USD','Exchange Rate','Total(VND)'],
    require: ['MBL/ HBL', 'type'], eiCurrency: true },
];

// ───────────────────────── Orchestrator ─────────────────────────
function rebuildFact() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var month = getReportMonth_(ss);
  var maps = loadMaps_(ss);
  var rate = maps.rate[monthKey_(month)];
  if (rate == null || !(rate > 0)) {
    var have = Object.keys(maps.rate);
    throw new Error('Thiếu USD_Rate cho tháng ' + month + ' (Map_ExchangeRate 23). ' +
      (have.length ? 'Đang có: ' + have.join(', ') + '. ' : 'Bảng RỖNG. ') + 'Thêm dòng ' + month + ' | <tỷ giá>.');
  }

  var raw = [];  // các dòng phí (chưa qua tầng chung)
  var qc = { unmapped: {}, perSource: {} };

  STAGES.forEach(function (st) {
    var n0 = raw.length;
    buildStaging_(ss, st, maps.cost, month, raw, qc);
    qc.perSource[st.forwarder] = raw.length - n0;
  });
  var nOv = raw.length;
  stageOverhead_(ss, '19_Overhead_Raw', maps.cost, month, raw, qc);
  qc.perSource['Overhead'] = raw.length - nOv;

  // Tầng chung
  var fact = [];
  raw.forEach(function (r) {
    if (num_(r.Amount) === 0 || num_(r.Amount) === null) return; // Amount ≠ 0
    commonTier_(r, rate);
    fact.push(r);
  });

  writeFact_(ss, fact);
  return report_(month, rate, fact, qc);
}

// ───────────────────────── Staging (UnpivotOtherColumns) ─────────────────────────
function buildStaging_(ss, st, costMap, month, out, qc) {
  var t = readSheetObjects_(ss, st.tab, st.require || []);
  if (!t) return;
  var bridge = st.vvmvBL ? buildExportBridge_(ss) : null;

  t.rows.forEach(function (rr) {
    // rename raw → tên chuẩn
    var row = {};
    Object.keys(rr).forEach(function (h) { row[(st.rename && st.rename[h]) || h] = rr[h]; });

    if (st.dropIfTotal && String(row[st.dropIfTotal] || '').toLowerCase().indexOf('total') >= 0) return;
    if (st.vvmvBL) row['B/L'] = vvmvBL_(row, bridge);

    // Bộ định danh mang theo
    var carry = {};
    CARRY.forEach(function (f) {
      if (row[f] === undefined) return;
      carry[f] = NUM_CARRY[f] ? num_(row[f]) : (str_(row[f]) || null);
    });

    // Unpivot: mọi cột KHÔNG thuộc identifiers → 1 dòng phí
    Object.keys(row).forEach(function (k) {
      if (st.identifiers.indexOf(k) >= 0) return;
      var amt = num_(row[k]);
      if (amt === null) return; // PQ unpivot bỏ null
      var m = costMap[key_(st.forwarder, k)] || { std: null, fwd: null };
      if (!m.std) qc.unmapped[st.forwarder + ' / ' + k] = 1;
      var rec = {
        Month: month, Forwarder: st.forwarder,
        'Original Cost Name': k, Amount: amt,
        'Standard Cost': m.std, 'FWD Column': m.fwd,
      };
      Object.keys(carry).forEach(function (f) { rec[f] = carry[f]; });
      if (st.eiCurrency) rec.Currency = (k === 'PHÍ CHỨNG TỪ' || k === 'PHÍ LÀM HÀNG') ? 'VND' : 'USD';
      out.push(rec);
    });
  });
}

// Overhead (19): đã dạng dọc — mỗi dòng 1 khoản
function stageOverhead_(ss, tab, costMap, month, out, qc) {
  var t = readSheetObjects_(ss, tab, ['Forwarder', 'Original Cost Name']);
  if (!t) return;
  var amtCol = t.headers.indexOf('Amount (VND)') >= 0 ? 'Amount (VND)' : 'Amount';
  t.rows.forEach(function (r) {
    var fwd = str_(r['Forwarder']), name = str_(r['Original Cost Name']), amt = num_(r[amtCol]);
    if (!fwd || !name || amt === null) return;
    var m = costMap[key_(fwd, name)] || { std: null, fwd: null };
    if (!m.std) qc.unmapped[fwd + ' / ' + name] = 1;
    out.push({ Month: month, Forwarder: fwd, 'B/L': str_(r['B/L']) || null,
      'Original Cost Name': name, Amount: amt, 'Standard Cost': m.std, 'FWD Column': m.fwd });
  });
}

// ───────────────────────── Tầng chung (per dòng) ─────────────────────────
function commonTier_(r, rate) {
  r.USD_Rate = rate;
  // Amount_USD (§2)
  if (r.Forwarder === 'EI') {
    r.Amount_USD = (r.Currency === 'USD') ? r.Amount
      : (r['Exchange Rate'] ? r.Amount / r['Exchange Rate'] : null);
  } else {
    r.Amount_USD = r.Amount / rate;
  }
  r['Mode chuẩn'] = modeChuan_(r.Forwarder, r.Mode);
  r['Import/Export'] = impExp_(r);
  // Route / Loại hàng: bước kế (giữ null)
  if (r.Route === undefined) r.Route = null;
  if (r['Loại hàng'] === undefined) r['Loại hàng'] = null;
}

// Mode chuẩn — khớp chuỗi CHÍNH XÁC như PQ (§3)
function modeChuan_(fwd, mode) {
  if (fwd === 'DHL' || fwd === 'FedEx Export' || fwd === 'FedEx Import') return 'Courier';
  switch (str_(mode)) {
    case 'AIR': case 'air import': return 'Air';
    case 'LCL': case 'FCL': return 'Sea';
    case 'CPN': return 'Courier';
    case 'TC': return 'Local';
    default: return null;
  }
}

// Import/Export (§4) — thứ tự KHÔNG đổi
function impExp_(r) {
  var f = r.Forwarder, o = r.Origin, d = r.Destination;
  if (r['FWD Column'] === 'Overhead FWD') return 'Overhead';
  if ((f === 'DHL' || f === 'FedEx Export' || f === 'FedEx Import') && o && d && o !== 'VN' && d !== 'VN') return 'Third party';
  if (f === 'FedEx Export') return 'Export';
  if (f === 'FedEx Import') return 'Import';
  if (f === 'DHL') return (d === 'VN') ? 'Import' : (o === 'VN') ? 'Export' : null;
  if (f === 'EI') {
    var lm = str_(r.Mode).toLowerCase();
    if (lm.indexOf('export') >= 0) return 'Export';
    if (lm.indexOf('import') >= 0) return 'Import';
    return null;
  }
  if (f === 'VVMV' || f === 'Dolphin') {
    var cds = str_(r['CDS NO.']);
    if (!cds) return null;
    if (cds.charAt(0) === '1') return 'Import';
    if (cds.charAt(0) === '3') return 'Export';
    return null;
  }
  return null;
}

// VVMV B/L (§8/§10): Local→CDS; trống→Tracking# theo invoice; còn lại→HBL
function vvmvBL_(row, bridge) {
  var hbl = str_(row['B/L']);
  if (hbl === 'Local') return str_(row['CDS NO.']) || null;
  if (hbl === '') return bridge[normInv_(row['INVOICE NO.'])] || null;
  return hbl;
}

// Bảng cầu invoice→Tracking# từ 16_ExportMgmt_Raw
function buildExportBridge_(ss) {
  var t = readSheetObjects_(ss, '16_ExportMgmt_Raw', ['INVOICE NO.', 'Tracking#']);
  var map = {};
  if (!t) return map;
  t.rows.forEach(function (r) {
    var inv = str_(r['INVOICE NO.']), trk = str_(r['Tracking#']);
    if (!inv || !trk) return;
    var k = normInv_(inv);
    if (map[k] === undefined) map[k] = trk; // distinct: giữ dòng đầu
  });
  return map;
}

// Chuẩn hóa invoice (§11): bỏ UHAN-, cắt đuôi sau '-' cuối
function normInv_(v) {
  var s = String(v == null ? '' : v).replace(/UHAN-/g, '');
  if (s.indexOf('-') >= 0) s = s.substring(0, s.lastIndexOf('-'));
  return s.trim();
}

// ───────────────────────── Maps & config ─────────────────────────
function loadMaps_(ss) {
  var cost = {};
  var ct = readSheetFirst_(ss, MAP_COST_TABS, ['Forwarder', 'Original Cost Name', 'Standard Cost']);
  if (!ct) throw new Error('Không thấy Map_Cost (thử: ' + MAP_COST_TABS.join(', ') + ').');
  ct.rows.forEach(function (r) {
    var f = str_(r['Forwarder']), n = normHdr_(r['Original Cost Name']);
    if (!f || !n) return;
    cost[key_(f, n)] = { std: str_(r['Standard Cost']) || null, fwd: str_(r['FWD Column']) || null };
  });
  var rate = {};
  var rt = readSheetFirst_(ss, MAP_RATE_TABS, ['Month', 'USD_Rate']);
  if (!rt) throw new Error('Không thấy Map_ExchangeRate (thử: ' + MAP_RATE_TABS.join(', ') + ').');
  rt.rows.forEach(function (r) { var m = monthKey_(r['Month']), v = num_(r['USD_Rate']); if (m && v) rate[m] = v; });
  return { cost: cost, rate: rate };
}

var MONTH_RE = /^\d{4}-\d{2}$/;
function getReportMonth_(ss) {
  var cands = [];
  var cfg = ss.getSheetByName('00_Config');
  if (cfg) cands.push(['00_Config!B1', cfg.getRange('B1').getValue()]);
  try { var nr = ss.getRangeByName('ThangBaoCao'); if (nr) cands.push(['ThangBaoCao', nr.getValue()]); } catch (e) {}
  var seen = [];
  for (var i = 0; i < cands.length; i++) {
    var v = str_(cands[i][1]);
    if (MONTH_RE.test(v)) return v;
    if (v) seen.push(cands[i][0] + '="' + v + '"');
  }
  if (!cfg) {
    cfg = ss.insertSheet('00_Config', 0);
    cfg.getRange('A1').setValue('ThangBaoCao').setFontWeight('bold');
    cfg.getRange('B1').setNumberFormat('@').setValue('');
    cfg.getRange('A2').setValue('→ Điền tháng YYYY-MM vào ô B1 (vd 2026-06) rồi chạy lại rebuildFact()');
    throw new Error('Chưa khai báo tháng. Đã tạo tab 00_Config — điền YYYY-MM vào B1 rồi chạy lại.');
  }
  throw new Error('Tháng không hợp lệ (cần YYYY-MM). ' + (seen.length ? 'Đang thấy: ' + seen.join('; ') + '. ' : '00_Config!B1 trống. ') + 'Sửa 00_Config!B1 = 2026-06.');
}

// ───────────────────────── Sheet I/O ─────────────────────────
function normHdr_(v) { return String(v == null ? '' : v).replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim(); }

// Đọc tab → {headers(chuẩn hóa), rows:[{header:value}]}, tự dò dòng header theo requiredCols
function readSheetObjects_(ss, tabName, requiredCols) {
  var sh = ss.getSheetByName(tabName);
  if (!sh) return null;
  var vals = sh.getDataRange().getValues();
  var req = (requiredCols || []).map(normHdr_);
  var need = Math.max(2, req.length - 1);
  var hr = -1;
  for (var i = 0; i < Math.min(vals.length, 40); i++) {
    var cells = vals[i].map(normHdr_);
    var hit = 0;
    req.forEach(function (k) { if (cells.indexOf(k) >= 0) hit++; });
    if (req.length === 0 ? cells.filter(function (c) { return c; }).length >= 2 : hit >= Math.min(req.length, need)) { hr = i; break; }
  }
  if (hr < 0) throw new Error('Không thấy header ở "' + tabName + '" (cần: ' + req.join(', ') + ').');
  var headers = vals[hr].map(normHdr_);
  var rows = [];
  for (i = hr + 1; i < vals.length; i++) {
    var row = vals[i];
    if (row.every(function (c) { return c === '' || c === null; })) continue;
    var obj = {};
    for (var j = 0; j < headers.length; j++) if (headers[j] && obj[headers[j]] === undefined) obj[headers[j]] = row[j];
    rows.push(obj);
  }
  return { headers: headers, rows: rows };
}

function readSheetFirst_(ss, tabNames, requiredCols) {
  for (var i = 0; i < tabNames.length; i++) if (ss.getSheetByName(tabNames[i])) return readSheetObjects_(ss, tabNames[i], requiredCols);
  return null;
}

function writeFact_(ss, fact) {
  var name = CONFIG.FACT_TAB;
  var old = ss.getSheetByName(name);
  if (old) ss.deleteSheet(old);
  var sh = ss.insertSheet(name);
  sh.getRange(1, 1, 1, FACT_HEADERS.length).setValues([FACT_HEADERS]).setFontWeight('bold');
  sh.setFrozenRows(1);
  try { [1, 3, 4, 5].forEach(function (c) { sh.getRange(1, c, sh.getMaxRows(), 1).setNumberFormat('@'); }); }
  catch (e) { Logger.log('Cảnh báo format: ' + e.message); }
  if (fact.length) {
    var matrix = fact.map(function (o) { return FACT_HEADERS.map(function (h) { return o[h] === undefined ? null : o[h]; }); });
    sh.getRange(2, 1, matrix.length, FACT_HEADERS.length).setValues(matrix);
  }
}

// ───────────────────────── helpers ─────────────────────────
var KEY_SEP = '';
function key_(f, n) { return str_(f) + KEY_SEP + normHdr_(n); }
function str_(v) { return v === null || v === undefined ? '' : String(v).trim(); }
function monthKey_(v) {
  if (v === null || v === undefined || v === '') return '';
  if (Object.prototype.toString.call(v) === '[object Date]') { var y = v.getFullYear(), mo = v.getMonth() + 1; return y + '-' + (mo < 10 ? '0' : '') + mo; }
  var s = String(v).trim(), mm = s.match(/^(\d{4})-(\d{1,2})/);
  return mm ? mm[1] + '-' + (mm[2].length < 2 ? '0' + mm[2] : mm[2]) : s;
}
function num_(v) {
  if (v === '' || v === null || v === undefined) return null;
  if (typeof v === 'number') return v;
  var s = String(v).replace(/,/g, '').trim();
  if (s === '') return null;
  var f = parseFloat(s);
  return isNaN(f) ? null : f;
}

function report_(month, rate, fact, qc) {
  var tot = 0; fact.forEach(function (o) { tot += (o.Amount_USD || 0); });
  var lines = ['✅ rebuildFact — tháng ' + month + ' (rate ' + rate + ')', 'Tổng: ' + fact.length + ' dòng · $' + Math.round(tot * 100) / 100];
  Object.keys(qc.perSource).forEach(function (f) { lines.push('  · ' + f + ': ' + qc.perSource[f]); });
  var un = Object.keys(qc.unmapped);
  if (un.length) lines.push('⚠️ Phí CHƯA map (' + un.length + '): ' + un.join('; '));
  var msg = lines.join('\n'); Logger.log(msg); return msg;
}

function diagMaps() {
  var ss = SpreadsheetApp.getActiveSpreadsheet(), out = [];
  try { out.push('Tháng: ' + getReportMonth_(ss)); } catch (e) { out.push('Tháng LỖI: ' + e.message); }
  try { var mp = loadMaps_(ss); out.push('ExchangeRate: ' + Object.keys(mp.rate).map(function (k) { return k + '=' + mp.rate[k]; }).join(', ')); out.push('Map_Cost: ' + Object.keys(mp.cost).length + ' dòng'); }
  catch (e2) { out.push('loadMaps LỖI: ' + e2.message); }
  var msg = out.join('\n'); Logger.log(msg); return msg;
}

function onOpen() {
  SpreadsheetApp.getUi().createMenu('Logistics DB')
    .addItem('Rebuild fact (dựng lại từ raw)', 'rebuildFact')
    .addItem('Chẩn đoán (diag maps)', 'diagMaps')
    .addToUi();
}
