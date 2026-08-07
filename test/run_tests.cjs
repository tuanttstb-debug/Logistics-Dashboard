/* run_tests.cjs — Kiểm chứng logic Phase A (GAS Transform) + Phase B (report.js) BẰNG NODE.
 * Không cần Google Sheets: nạp .gs/.js vào vm với Spreadsheet giả + fixtures nhỏ có kết quả BIẾT TRƯỚC.
 * Ghi bằng chứng ra EVD/. Chạy: node test/run_tests.cjs */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const EVD = path.join(ROOT, 'EVD');
const log = [];
let pass = 0, fail = 0;
function line(s) { log.push(s); console.log(s); }
function ok(name, cond, extra) {
  if (cond) { pass++; line('  ✅ ' + name); }
  else { fail++; line('  ❌ ' + name + (extra ? ' — ' + extra : '')); }
}
function approx(a, b) { return Math.abs((a || 0) - (b || 0)) < 1e-6; }

// ───────────────────────── Fake Google Sheets ─────────────────────────
function FakeSheet(name, data) { this.name = name; this.data = data || []; }
FakeSheet.prototype.getName = function () { return this.name; };
FakeSheet.prototype.getDataRange = function () { const d = this.data; return { getValues: () => d.map(r => r.slice()) }; };
FakeSheet.prototype.getLastRow = function () { return this.data.length; };
FakeSheet.prototype.getLastColumn = function () { return this.data.reduce((m, r) => Math.max(m, r.length), 0); };
FakeSheet.prototype.getMaxRows = function () { return Math.max(this.data.length, 1); };
FakeSheet.prototype.getMaxColumns = function () { return Math.max(this.getLastColumn(), 1); };
FakeSheet.prototype.setFrozenRows = function () { return this; };
FakeSheet.prototype.getRange = function (r, c) {
  const self = this;
  if (typeof r === 'string') { // A1 notation, vd 'B1'
    const m = r.match(/^([A-Za-z]+)(\d+)$/);
    let col = 0; const letters = m[1].toUpperCase();
    for (let i = 0; i < letters.length; i++) col = col * 26 + (letters.charCodeAt(i) - 64);
    c = col; r = parseInt(m[2], 10);
  }
  return {
    setValues(vals) { for (let i = 0; i < vals.length; i++) { const rr = r - 1 + i; self.data[rr] = self.data[rr] || []; for (let j = 0; j < vals[i].length; j++) self.data[rr][c - 1 + j] = vals[i][j]; } return this; },
    setValue(v) { self.data[r - 1] = self.data[r - 1] || []; self.data[r - 1][c - 1] = v; return this; },
    getValue() { return (self.data[r - 1] || [])[c - 1]; },
    setFontWeight() { return this; }, setNumberFormat() { return this; },
  };
};
function FakeSS(sheets) { this._sheets = sheets; }
FakeSS.prototype.getSheetByName = function (n) { return this._sheets[n] || null; };
FakeSS.prototype.insertSheet = function (n) { const s = new FakeSheet(n, []); this._sheets[n] = s; return s; };
FakeSS.prototype.deleteSheet = function (s) { delete this._sheets[s.name]; };
FakeSS.prototype.getRangeByName = function () { return null; };
FakeSS.prototype.getSheets = function () { return Object.keys(this._sheets).map(k => this._sheets[k]); };

let CURRENT_SS = null;
const stubs = {
  SpreadsheetApp: {
    getActiveSpreadsheet: () => CURRENT_SS,
    getUi: () => ({ createMenu: () => ({ addItem() { return this; }, addToUi() {} }) }),
  },
  Logger: { log: () => {} },
  ContentService: { createTextOutput: (s) => ({ setMimeType() { return this; }, _s: s }), MimeType: { JSON: 'json' } },
  console,
};

// ───────────────────────── Nạp backend vào 1 vm context ─────────────────────────
const beCtx = Object.assign({}, stubs);
beCtx.global = beCtx;
vm.createContext(beCtx);
['Config.gs', 'Utils.gs', 'Transform.gs', 'DataService.gs', 'Code.gs'].forEach(f => {
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'backend', f), 'utf8'), beCtx, { filename: f });
});

// ───────────────────────── Fixtures backend ─────────────────────────
function sheet(name, headers, rows) { return new FakeSheet(name, [headers].concat(rows)); }
function buildSS() {
  return new FakeSS({
    '00_Config': new FakeSheet('00_Config', [['ThangBaoCao', '2026-06']]),
    '22_Map_Cost': sheet('22_Map_Cost', ['Forwarder', 'Original Cost Name', 'Standard Cost', 'FWD Column'], [
      ['VVMV', 'Customs fee', 'Customs', 'Customs FWD'],
      ['VVMV', 'Freight fee', 'Freight', 'Freight FWD'],
      ['DHL', 'NET CHARGE', 'Freight', 'Freight FWD'],
      ['Gia Bảo', 'Lifting fee', 'Lifting fee', 'Overhead FWD'],
    ]),
    '23_Map_ExchangeRate': sheet('23_Map_ExchangeRate', ['Month', 'USD_Rate'], [['2026-06', 25000]]),
    // VVMV: 1 lô nhập (CDS 1PURE0006) + 1 lô xuất (HBL trống → bridge)
    '14_VVMV_Raw': sheet('14_VVMV_Raw',
      ['HBL No.', 'Invoice No', 'Shipper', "Destination/ Shipper's country", 'Custom No', 'CD Date', 'Mode', 'Kgs', 'CBM', 'Customs fee', 'Freight fee'], [
        ['HBLIMP1', 'INVI1', 'S1', 'US', '1PURE0006', '', 'LCL', 120, 2, 500000, 2500000],
        ['', 'UHAN-INV9001-1', 'S2', 'JP', '3FORD0009', '', 'AIR', 80, 1, 0, 1800000],
      ]),
    // DHL: 1 lô third party (orig/dest đều ≠ VN)
    '10_DHL_Raw': sheet('10_DHL_Raw',
      ['INVOICE NO', 'DATE', 'AWB', 'SHIP DATE', 'SHIPPER', 'CONSIGNEE', 'ORIG', 'DEST', 'Zone', 'CHRGBL WGHT (KG)', 'NET CHARGE'], [
        ['INV-DHL-1', '', 'AWB777', '', 'ShpX', 'CneY', 'CN', 'JP', 'A', 30, 1250000],
      ]),
    // Overhead — Gia Bảo (đã map) + Evergreen (CHƯA map → phải vẫn phân loại Overhead)
    '19_Overhead_Raw': sheet('19_Overhead_Raw', ['Forwarder', 'B/L', 'Original Cost Name', 'Amount (VND)'], [
      ['Gia Bảo', 'GB-1', 'Lifting fee', 1000000],
      ['Evergreen', '', 'Customs handling', 500000],
    ]),
    // 16: bridge invoice→Tracking# + Route xuất
    '16_ExportMgmt_Raw': sheet('16_ExportMgmt_Raw', ['INVOICE NO.', 'Tracking#', 'Route (Note cho FCA, DAP)'], [
      ['UHAN-INV9001-1', 'TRKEXP1', 'Ford'],
    ]),
    // 17: winner-take-all Route (PURE 10 > Other 5) + Loại hàng E11→Material
    '17_CustomsDetail_Raw': sheet('17_CustomsDetail_Raw', ['CDS NO.', 'Mã loại hình', 'Route', 'B/L', 'Tổng số lượng', 'Trị giá NT'], [
      ['1PURE0006', 'E11', 'PURE', 'HBLIMP1', 10, 1000],
      ['1PURE0006', 'E11', 'Other', 'HBLIMP1', 5, 800],
    ]),
    // 26: map loại hình
    '26_Map_LoaiHinh': sheet('26_Map_LoaiHinh', ['Mã loại hình', 'Loại hàng'], [
      ['E11', 'Material'], ['E13', 'Equipment & Toolings'],
    ]),
    // 18: POB (VND) → /25000 = 10000 USD
    '18_ImportPOB_Raw': sheet('18_ImportPOB_Raw', ['B/L', 'INVOICE NO.', 'SHIPPER/CONSIGNEE', 'AMOUNT', 'ROUTE', 'AMOUNT QUOTE CUSTOMER', 'REMARK'], [
      ['POBBL1', 'INVP1', 'Cust X', 250000000, 'PURE', 300000000, 'note'],
    ]),
  });
}

// ───────────────────────── TEST 1: rebuildFact end-to-end ─────────────────────────
line('\n[1] Backend — rebuildFact() end-to-end (Route ×3 + Loại hàng + POB + report split)');
CURRENT_SS = buildSS();
const report = beCtx.rebuildFact();
const factSheet = CURRENT_SS.getSheetByName('40_FACT_CostLines');
const fvals = factSheet.getDataRange().getValues();
const H = fvals[0];
const idx = {}; H.forEach((h, i) => idx[h] = i);
const rows = fvals.slice(1).map(r => { const o = {}; H.forEach((h, i) => o[h] = r[i]); return o; });
function find(pred) { return rows.filter(pred); }

ok('fact có 7 dòng (6 Full + 1 POB)', rows.length === 7, 'thực: ' + rows.length);
const impCustoms = find(r => r.Forwarder === 'VVMV' && r['Standard Cost'] === 'Customs' && r['Import/Export'] === 'Import')[0];
ok('VVMV nhập: Route=PURE (winner-take-all)', impCustoms && impCustoms.Route === 'PURE', impCustoms && impCustoms.Route);
ok('VVMV nhập: Loại hàng=Material (E11)', impCustoms && impCustoms['Loại hàng'] === 'Material', impCustoms && impCustoms['Loại hàng']);
ok('VVMV nhập Customs: Amount_USD=20', impCustoms && approx(impCustoms.Amount_USD, 20), impCustoms && impCustoms.Amount_USD);
const expFreight = find(r => r.Forwarder === 'VVMV' && r['Import/Export'] === 'Export')[0];
ok('VVMV xuất: Route=Ford (sheet 16, B/L=Tracking# qua bridge)', expFreight && expFreight.Route === 'Ford', expFreight && expFreight.Route);
ok('VVMV xuất: B/L=TRKEXP1 (bridge invoice)', expFreight && expFreight['B/L'] === 'TRKEXP1', expFreight && expFreight['B/L']);
ok('VVMV xuất: Loại hàng=null (chỉ hàng nhập)', expFreight && (expFreight['Loại hàng'] === null || expFreight['Loại hàng'] === ''), expFreight && expFreight['Loại hàng']);
const tp = find(r => r.Forwarder === 'DHL')[0];
ok('DHL cả 2 đầu ≠ VN: Import/Export=Third party', tp && tp['Import/Export'] === 'Third party', tp && tp['Import/Export']);
ok('DHL Third party: Route=Other (tự động)', tp && tp.Route === 'Other', tp && tp.Route);
const ov = find(r => r.Forwarder === 'Gia Bảo')[0];
ok('Overhead: Import/Export=Overhead', ov && ov['Import/Export'] === 'Overhead', ov && ov['Import/Export']);
ok('Overhead: Route=null (ép null)', ov && (ov.Route === null || ov.Route === ''), ov && ov.Route);
// Overhead CHƯA map (Evergreen/Customs handling): thêm mới không cần map vẫn phân loại đúng
const ovNew = find(r => r.Forwarder === 'Evergreen')[0];
ok('Overhead chưa map: FWD Column mặc định "Overhead FWD"', ovNew && ovNew['FWD Column'] === 'Overhead FWD', ovNew && ovNew['FWD Column']);
ok('Overhead chưa map: Import/Export=Overhead (không bị loại)', ovNew && ovNew['Import/Export'] === 'Overhead', ovNew && ovNew['Import/Export']);
ok('Overhead chưa map: Standard Cost mặc định = tên gốc', ovNew && ovNew['Standard Cost'] === 'Customs handling', ovNew && ovNew['Standard Cost']);
ok('Overhead chưa map: Amount_USD=20 (500000/25000, vào tổng)', ovNew && approx(ovNew.Amount_USD, 20), ovNew && ovNew.Amount_USD);
ok('Overhead chưa map: vẫn cảnh báo qc.unmapped', /Phí CHƯA map/.test(report) && /Evergreen \/ Customs handling/.test(report), report.split('\n').filter(s => /CHƯA map/.test(s))[0]);
const pob = find(r => r['Import/Export'] === 'Pay on behalf')[0];
ok('POB: có nhãn Pay on behalf', !!pob);
ok('POB: Amount_USD=10000 (VND/25000)', pob && approx(pob.Amount_USD, 10000), pob && pob.Amount_USD);
ok('POB: Route=PURE (từ sheet 18)', pob && pob.Route === 'PURE', pob && pob.Route);
ok('report tách Full=6 dòng', /Full \(không POB\): 6 dòng/.test(report), report.split('\n')[1]);
ok('report tách POB=1 dòng', /POB: 1 dòng/.test(report), report.split('\n')[2]);
ok('report có $ theo nguồn (VVMV)', /Theo nguồn/.test(report) && /· VVMV: \d+ dòng · \$[\d.]+/.test(report),
  report.split('\n').filter(s => /VVMV:/.test(s))[0]);
// getMeta: totalUsd = Full (loại POB), pobUsd tách riêng (QĐ-51)
const meta = beCtx.getMeta();
ok('getMeta.totalUsd = Full (loại POB) = 302', approx(meta.totalUsd, 302), meta.totalUsd);
ok('getMeta.pobUsd = 10000', approx(meta.pobUsd, 10000), meta.pobUsd);
ok('getMeta.grandTotalUsd = Full+POB = 10302', approx(meta.grandTotalUsd, 10302), meta.grandTotalUsd);
line('  ── report ──\n' + report.split('\n').map(s => '     ' + s).join('\n'));

// ───────────────────────── TEST 2: unit — winner-take-all & chuẩn hóa Route ─────────────────────────
line('\n[2] Backend — unit: normRoute_ + reduceWTA_ tie-break + routeFor_ ưu tiên');
ok("normRoute_('Transfer')='Other'", beCtx.normRoute_('Transfer') === 'Other');
ok("normRoute_('x')=null", beCtx.normRoute_('x') === null);
ok("normRoute_('  ')=null", beCtx.normRoute_('   ') === null);
ok("normRoute_('Ford')='Ford'", beCtx.normRoute_('Ford') === 'Ford');
const tie = beCtx.reduceWTA_({ K: { A: { qty: 5, val: 100 }, B: { qty: 5, val: 200 } } });
ok('reduceWTA_ hòa qty → chọn Trị giá NT lớn hơn (B)', tie.K === 'B', tie.K);
const win = beCtx.reduceWTA_({ K: { A: { qty: 9, val: 1 }, B: { qty: 5, val: 999 } } });
ok('reduceWTA_ qty lớn hơn thắng (A)', win.K === 'A', win.K);
const dims = { updateManual: { BLX: { Route: 'MANUAL' } }, routeExport: { BLX: 'EXP' }, routeCDS: { C1: 'CDS' }, routeBL: { BLX: 'BL' }, loaiHangCDS: {}, loaiHangBL: {} };
ok('routeFor_ UpdateManual thắng tất cả', beCtx.routeFor_({ 'B/L': 'BLX', 'CDS NO.': 'C1', 'FWD Column': 'x', 'Import/Export': 'Import' }, dims) === 'MANUAL');
ok('routeFor_ Overhead → null', beCtx.routeFor_({ 'B/L': 'BLX', 'FWD Column': 'Overhead FWD' }, dims) === null);
const dims2 = { updateManual: {}, routeExport: {}, routeCDS: { C1: 'CDS' }, routeBL: { BLX: 'BL' }, loaiHangCDS: {}, loaiHangBL: {} };
ok('routeFor_ CDS trước BL', beCtx.routeFor_({ 'B/L': 'BLX', 'CDS NO.': 'C1', 'FWD Column': '', 'Import/Export': 'Import' }, dims2) === 'CDS');
ok('loaiHangFor_ hàng xuất → null', beCtx.loaiHangFor_({ 'B/L': 'B', 'Import/Export': 'Export', 'FWD Column': '' }, dims2) === null);

// ───────────────────────── TEST 3: frontend report.js lr* ─────────────────────────
line('\n[3] Frontend — report.js lr* (khử trùng trọng lượng + tách POB)');
const feCtx = { console };
feCtx.window = feCtx; feCtx.global = feCtx;
vm.createContext(feCtx);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'assets/js/constants.js'), 'utf8'), feCtx, { filename: 'constants.js' });
vm.runInContext(fs.readFileSync(path.join(ROOT, 'assets/js/report.js'), 'utf8'), feCtx, { filename: 'report.js' });
const CC = feCtx.COLS;
function row(o) { const r = {}; Object.keys(o).forEach(k => r[CC[k] || k] = o[k]); return r; }
const feRows = [
  // 1 lô nhập Material, 2 dòng phí cùng B/L (CW lặp) → weight phải = 120, shipments=1
  row({ MONTH: '2026-06', FORWARDER: 'VVMV', IMP_EXP: 'Import', STANDARD_COST: 'Freight', ROUTE: 'PURE', LOAI_HANG: 'Material', BL: 'BL1', CDS: '1P', CW: 120, AMOUNT_USD: 100 }),
  row({ MONTH: '2026-06', FORWARDER: 'VVMV', IMP_EXP: 'Import', STANDARD_COST: 'Customs', ROUTE: 'PURE', LOAI_HANG: 'Material', BL: 'BL1', CDS: '1P', CW: 120, AMOUNT_USD: 20 }),
  row({ MONTH: '2026-06', FORWARDER: 'FedEx Import', IMP_EXP: 'Import', STANDARD_COST: 'Freight', ROUTE: 'EFI', LOAI_HANG: 'Equipment & Toolings', BL: 'BL2', CDS: '', CW: 50, AMOUNT_USD: 200 }),
  row({ MONTH: '2026-06', FORWARDER: 'EI', IMP_EXP: 'Export', STANDARD_COST: 'Freight', ROUTE: 'Ford', BL: 'BL3', CW: 80, AMOUNT_USD: 300 }),
  row({ MONTH: '2026-06', FORWARDER: 'Gia Bảo', IMP_EXP: 'Overhead', STANDARD_COST: 'Lifting fee', FWD_COLUMN: 'Overhead FWD', BL: '', CW: 0, AMOUNT_USD: 40 }),
  row({ MONTH: '2026-06', FORWARDER: 'POB', IMP_EXP: 'Pay on behalf', STANDARD_COST: 'Pay on behalf', ROUTE: 'PURE', BL: 'POB1', CW: 0, AMOUNT_USD: 10000 }),
];
feCtx.Store = { raw: () => feRows };

const series = feCtx.Report.lrMonthlySeries();
const s6 = series.find(s => s.month === '2026-06');
ok('lrMonthlySeries Full excludes POB (100+20+200+300+40=660)', approx(s6.full, 660), s6 && s6.full);
ok('lrMonthlySeries POB=10000', approx(s6.pob, 10000), s6 && s6.pob);
ok('lrMonthlySeries Total=Full+POB=10660', approx(s6.total, 10660), s6 && s6.total);
const imp = feCtx.Report.lrImport();
const rm = imp.data['2026-06']['Raw materials'];
ok('lrImport Raw materials subtotal=120', approx(rm.subtotal, 120), rm.subtotal);
ok('lrImport Raw materials weight KHỬ TRÙNG theo B/L = 120 (không 240)', approx(rm.weight, 120), rm.weight);
ok('lrImport Raw materials shipments=1', rm.shipments === 1, rm.shipments);
ok('lrImport Raw materials declarations=1', rm.declarations === 1, rm.declarations);
const eq = imp.data['2026-06']['Equipment'];
ok('lrImport Equipment subtotal=200', approx(eq.subtotal, 200), eq.subtotal);
ok('lrImport Subtotal Import=320', approx(imp.subtotal['2026-06'].subtotal, 320), imp.subtotal['2026-06'].subtotal);
const exp = feCtx.Report.lrExport();
ok('lrExport có dự án Ford', exp.projects.indexOf('Ford') >= 0, exp.projects.join(','));
ok('lrExport Ford subtotal=300', approx(exp.data['2026-06']['Ford'].subtotal, 300), exp.data['2026-06']['Ford'].subtotal);
const ovr = feCtx.Report.lrOverhead();
ok('lrOverhead total=40', approx(ovr.total['2026-06'], 40), ovr.total['2026-06']);
const dash = feCtx.Report.dashboard('2026-06');
ok('dashboard.total EXCLUDES POB (=660)', approx(dash.total.cur, 660), dash.total.cur);

// ───────────────────────── TEST 4: views.js render (không ném lỗi) ─────────────────────────
line('\n[4] Frontend — views.js render Logistics record + POB table');
feCtx.H = {
  usd: (n) => '$' + Math.round(Number(n) || 0),
  num: (n) => String(n),
  esc: (s) => String(s == null ? '' : s),
};
vm.runInContext(fs.readFileSync(path.join(ROOT, 'assets/js/views.js'), 'utf8'), feCtx, { filename: 'views.js' });
let lrHtml = '', pobHtml = '', threw = null;
try { lrHtml = feCtx.Views.logisticsRecord('2026-06'); pobHtml = feCtx.Views.pobTable(feRows.filter(r => r[CC.IMP_EXP] === 'Pay on behalf').map(r => ({ 'B/L': 'POB1', 'Shipper/Consignee': 'X', Amount_USD: 10000, Route: 'PURE', Remark: 'r' }))); }
catch (e) { threw = e; }
ok('Views.logisticsRecord không ném lỗi', threw === null, threw && threw.message);
ok('HTML có canvas chartLRImport', /chartLRImport/.test(lrHtml));
ok('HTML có canvas chartLRExport', /chartLRExport/.test(lrHtml));
ok('HTML có mục Full logistics cost', /Full logistics cost/.test(lrHtml));
ok('HTML có SUBTOTAL IMPORT', /SUBTOTAL IMPORT/.test(lrHtml));
ok('HTML có #pobDetail placeholder', /id="pobDetail"/.test(lrHtml));
ok('pobTable render dòng POB', /PURE/.test(pobHtml) && /table/.test(pobHtml));

// ───────────────────────── Ghi EVD ─────────────────────────
line('\n══════════════════════════════════════════');
line('KẾT QUẢ: ' + pass + ' PASS · ' + fail + ' FAIL');
if (!fs.existsSync(EVD)) fs.mkdirSync(EVD, { recursive: true });
const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const header = 'EVIDENCE — Logistics Dashboard Phase A+B\n' +
  'Ngày: ' + new Date().toISOString() + '\n' +
  'Node: ' + process.version + '\n' +
  'Phạm vi: Route ×3, Loại hàng ×2, POB (Transform.gs) + report.js lr* (Phase B)\n' +
  '════════════════════════════════════════════\n';
fs.writeFileSync(path.join(EVD, 'evidence_phaseAB_' + stamp + '.txt'), header + log.join('\n') + '\n', 'utf8');
fs.writeFileSync(path.join(EVD, 'fact_sample_' + stamp + '.json'), JSON.stringify({ report: report, factRows: rows }, null, 2), 'utf8');
// Preview HTML tĩnh (bảng render từ fixtures — mở bằng trình duyệt để xem bố cục)
const preview = '<!DOCTYPE html><html lang="vi" data-theme="light"><head><meta charset="UTF-8">' +
  '<title>EVD — Logistics record preview</title>' +
  ['variables', 'base', 'layout', 'components', 'report', 'responsive'].map(n => '<link rel="stylesheet" href="../assets/css/' + n + '.css">').join('') +
  '</head><body><div class="app"><div class="app-body"><main class="app-main" style="padding:24px">' +
  '<p style="color:#b45309">⚠️ EVD preview — dữ liệu FIXTURE (không phải thật). Chart cần app.js runtime nên trống ở bản tĩnh.</p>' +
  lrHtml.replace('<div class="empty-state">Đang tải chi tiết…</div>', pobHtml) +
  '</main></div></div></body></html>';
fs.writeFileSync(path.join(EVD, 'preview_logistics_record.html'), preview, 'utf8');
line('📄 EVD/evidence_phaseAB_' + stamp + '.txt');
line('📄 EVD/fact_sample_' + stamp + '.json');
line('📄 EVD/preview_logistics_record.html');
process.exit(fail ? 1 : 0);
