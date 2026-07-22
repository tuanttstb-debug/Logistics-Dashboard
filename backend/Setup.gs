/** Setup.gs — tạo TOÀN BỘ tab của DB trên Google Sheet (chạy 1 LẦN).
 *
 * MỤC TIÊU: Google Sheets là KHO quản lý toàn bộ Raw data (QĐ-43).
 *   - 11 tab RAW (10–19): mỗi nguồn/forwarder một tab, giữ đúng header gốc của file
 *     `Logistics_System.xlsx` (sheet 10_DHL_Raw … 19_Overhead_Raw).
 *   - 1 tab FACT (`40_FACT_CostLines`): bảng đã Power Query hoá — WEB CHỈ ĐỌC tab này.
 *
 * LUỒNG (QĐ-34/35 giữ nguyên): Excel vẫn là ENGINE (Power Query tính fact).
 *   Sheets là nơi LƯU raw + fact. Web đọc `40_FACT_CostLines`. KHÔNG tính toán trên Sheets.
 *
 * CÁCH DÙNG:
 *   1. Dán file này vào Apps Script của Google Sheet (Extensions → Apps Script).
 *   2. Chọn hàm `setupSheets` → ▶ Run → Allow (lần đầu).
 *   3. Xem Execution log: liệt kê tab đã tạo/đảm bảo.
 *   → KHÔNG cần deploy lại.
 *
 * Idempotent: chạy nhiều lần an toàn — KHÔNG xóa dữ liệu đã có; chỉ ghi header khi tab RỖNG
 * và (re)áp Plain text cho cột khóa. */

// ── Định nghĩa header từng tab (khớp Logistics_System.xlsx, trích 2026-07-22) ──
// textCols: chỉ số cột (1-based) ép Plain text (@) — mã/ngày dễ hỏng. null = ÉP TẤT CẢ cột (tab raw).
var TAB_SPECS = [
  { name: '10_DHL_Raw', headers: ['INVOICE NO','VAT INVOICE NO.','DATE','AWB','SHIP DATE','SHIPPER','CONSIGNEE','ORIG','DEST','Zone','CHRGBL WGHT (KG)','NET CHARGE','FUEL %','FUEL SURCHARGE','Other charge','VAT (8%)','TOTAL AMOUNT  (VND)'], textCols: null },
  { name: '11_FedExExp_Raw', headers: ['VAT INVOICE NO.','DEBIT NOTE NO.','DEBIT NOTE DATE','AWB','SHIP DATE','SHIPPER','CONSIGNEE','ORIG','DEST','SERV','CHRGBL WGHT (KG)','NET CHARGE','OTHER CHARGE','FUEL SURCHARGE','VAT (8%)','TOTAL AMOUNT  (VND)'], textCols: null },
  { name: '12_FedExImp_Raw', headers: ['STT','VAT INVOICE NO.','DEBIT NOTE NO.','DEBIT NOTE DATE','AWB','SHIP DATE','SHIPPER','CONSIGNEE','ORIG','DEST','SERV','CHRGBL WGHT (KG)','NET CHARGE','OTHER CHARGE','FUEL SURCHARGE','VAT (5.26%)','TOTAL AMOUNT  (VND)'], textCols: null },
  { name: '13_EI_Raw', headers: ['NO.','Expeditors inv','Invoice date','File Ref','MBL/ HBL','type','Shipper/Consignee','POL','ETD/COB','POD','ETA','Ship date','CW','GW','(CBM)','VAT No.','Date','AIR FREIGHT','AIRPORT TRANSFER FEE','PICKUP','TC LABEL','DOCUMENT','HANDLING','CARGO SCREENING FEE/RCAR','LOCAL','EXPORT CEARANCE','OUTLAY','FSC','ISS','SERVICE TAX','CAR PARKING','IMPORT CHARGE, DELIVERY, HEAVY LIFT','AWB','SUPERVISION','THC','TOTAL IN USD','Exchange Rate','Total(VND)','PHÍ CHỨNG TỪ','PHÍ LÀM HÀNG'], textCols: null },
  { name: '14_VVMV_Raw', headers: ['HBL No.','Invoice No','Shipper',"Destination/ Shipper's country",'Custom  No','CD Date','Mode','Kgs','CBM','Customs fee','Trucking fee','Inspection fee/Handling','EXW, OF, LOCAL CHARGE','Total','VAT','Total (Included vAT)','Infrastructure fee, lphq','Local charge','Storage charge, labor','Sub-Total (vnd)','TOTAL AMOUNT','NOTE'], textCols: null },
  { name: '15_Dolphin_Raw', headers: ['HBL no','Invoice No','Shipper/Cnee','AOL/POL','CDS No','Date','Mode','Kgs','Cbm','Customs Clearance fee','Custom Supervisor fee','Trucking fee','Other fee','D/O fee/BILL fee','Local Charge','EXW, A/F, O/F,DAP','Infrastructure fee','Customs fee','POB'], textCols: null },
  { name: '16_ExportMgmt_Raw', headers: ['INVOICE NO.','Tracking#','Route (Note cho FCA, DAP)','Remark (note cho FedEx DAP)','Charge customer (Note cho FCA, DAP)'], textCols: null },
  { name: '17_CustomsDetail_Raw', headers: ['CDS NO.','Ngày ĐK','Mã loại hình','Mã địa điểm đích','Tên địa điểm đích cho vận chuyển bảo thuế','Địa điểm dỡ hàng','Mã hiệu PTVC','Ngày khởi hành vận chuyển','Ký hiệu và số hiệu bao bì','Tỷ giá thanh toán','Đơn vị tiền tệ','Số lượng kiện','Mã ĐVT kiện','Trọng lượng','Mã ĐVT trọng lượng','Số quản lý nội bộ','Điều kiện giá hóa đơn','Ghi chú','STT hàng','Mã NPL/SP','Mã HS','Tên hàng','Mã hàng','Route','B/L','INVOICE NO.','Tổng số lượng','Đơn vị tính','Tổng số lượng 2','Đơn vị tính 2','Trị giá NT'], textCols: null },
  { name: '18_ImportPOB_Raw', headers: ['B/L','INVOICE NO.','SHIPPER/CONSIGNEE','AMOUNT','ROUTE','AMOUNT QUOTE CUSTOMER','REMARK'], textCols: null },
  { name: '19_Overhead_Raw', headers: ['Forwarder','B/L','Original Cost Name','Amount (VND)'], textCols: null },

  // FACT — web chỉ đọc tab này. Text cột khóa: Month(A), B/L(C), INVOICE NO.(D), CDS NO.(E)
  { name: '40_FACT_CostLines', headers: ['Month','Forwarder','B/L','INVOICE NO.','CDS NO.','Shipper','Consignee','Origin','Destination','Mode','CW','CBM','Original Cost Name','Amount','Currency','Exchange Rate','USD_Rate','Amount_USD','Standard Cost','FWD Column','Mode chuẩn','Import/Export','Route','Loại hàng'], textCols: [1, 3, 4, 5] },
];

function setupSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) {
    throw new Error('Không có spreadsheet đang mở. Apps Script phải GẮN với Google Sheet ' +
      '(mở Sheet → Extensions → Apps Script), KHÔNG phải project độc lập.');
  }

  var log = [];
  TAB_SPECS.forEach(function (spec) {
    log.push(ensureTab_(ss, spec));
  });

  // Dọn tab 'Sheet1' mặc định nếu còn rỗng và không phải tab của ta
  var s1 = ss.getSheetByName('Sheet1');
  if (s1 && s1.getLastRow() === 0 && ss.getSheets().length > 1) {
    ss.deleteSheet(s1);
    log.push('🗑️ Xóa tab rỗng "Sheet1".');
  }

  log.push(ensureConfigTab_(ss));

  var msg = 'Setup DB xong (' + TAB_SPECS.length + ' tab + Config):\n' + log.join('\n');
  Logger.log(msg);
  return msg;
}

// Tab 00_Config: A1='ThangBaoCao', B1=tháng báo cáo YYYY-MM (Transform.gs::getReportMonth_ đọc)
function ensureConfigTab_(ss) {
  var sh = ss.getSheetByName('00_Config');
  if (sh) return 'ℹ️ CÓ "00_Config" (B1=' + (str_cfg_(sh.getRange('B1').getValue()) || '(trống — điền YYYY-MM)') + ')';
  sh = ss.insertSheet('00_Config', 0); // đưa lên đầu
  sh.getRange('A1').setValue('ThangBaoCao').setFontWeight('bold');
  sh.getRange('B1').setNumberFormat('@').setValue('');
  sh.getRange('A2').setValue('→ Điền tháng báo cáo YYYY-MM vào ô B1 (vd 2026-06) rồi chạy rebuildFact()');
  return '✅ TẠO "00_Config" — nhớ điền tháng vào ô B1';
}
function str_cfg_(v) { return v === null || v === undefined ? '' : String(v).trim(); }

// Tạo/đảm bảo 1 tab: header khi rỗng + freeze dòng 1 + Plain text cột khóa
function ensureTab_(ss, spec) {
  var sh = ss.getSheetByName(spec.name);
  var created = false;
  if (!sh) { sh = ss.insertSheet(spec.name); created = true; }

  var lastRow = sh.getLastRow();
  var wroteHeader = false;
  if (lastRow === 0) {
    sh.getRange(1, 1, 1, spec.headers.length).setValues([spec.headers]).setFontWeight('bold');
    sh.setFrozenRows(1);
    wroteHeader = true;
  }

  // textCols === null → ép Plain text TOÀN BỘ cột header (tab raw: giữ nguyên vẹn mã/ngày)
  var cols = spec.textCols === null
    ? range_(1, spec.headers.length)
    : spec.textCols;
  var maxRows = sh.getMaxRows();
  cols.forEach(function (c) {
    if (c <= sh.getMaxColumns()) sh.getRange(1, c, maxRows, 1).setNumberFormat('@');
  });

  return (created ? '✅ TẠO' : 'ℹ️ CÓ') + ' "' + spec.name + '"' +
    (wroteHeader ? ' + ' + spec.headers.length + ' header' : ' (giữ ' + lastRow + ' dòng)') +
    (spec.textCols === null ? ' · text toàn cột' : ' · text cột khóa');
}

function range_(a, b) { var o = []; for (var i = a; i <= b; i++) o.push(i); return o; }
