/** Setup.gs — tạo các tab cần thiết trên Google Sheet (chạy 1 LẦN).
 *
 * CÁCH DÙNG:
 *   1. Dán file này vào Apps Script của Google Sheet (Extensions → Apps Script).
 *   2. Chọn hàm `setupSheets` trong thanh chọn hàm → bấm ▶ Run.
 *   3. Lần đầu Google hỏi cấp quyền → Allow.
 *   4. Xem Execution log: sẽ báo đã tạo/đảm bảo tab `fact_CostLines`.
 *   → KHÔNG cần deploy lại: hàm chạy trực tiếp trong editor.
 *
 * Idempotent: chạy nhiều lần an toàn — nếu tab đã có sẽ KHÔNG xóa dữ liệu,
 * chỉ đảm bảo header (khi tab rỗng) + định dạng cột khóa = Plain text.
 *
 * Sau khi chạy xong → làm bước dán dữ liệu (DATA_CONTRACT §2 / SOP_DEPLOY):
 *   Excel 40_FACT_CostLines A:X (từ dòng 9) → Copy → tab fact_CostLines ô A1
 *   → Ctrl+Shift+V (Paste values only). Header thật sẽ đè lên header mẫu ở đây. */

// 24 cột A:X — khớp DATA_CONTRACT.md §1 (đúng thứ tự, giữ nguyên tên gốc kể cả dấu chấm & tiếng Việt)
var SETUP_HEADERS = [
  'Month', 'Forwarder', 'B/L', 'INVOICE NO.', 'CDS NO.', 'Shipper', 'Consignee',
  'Origin', 'Destination', 'Mode', 'CW', 'CBM', 'Original Cost Name', 'Amount',
  'Currency', 'Exchange Rate', 'USD_Rate', 'Amount_USD', 'Standard Cost',
  'FWD Column', 'Mode chuẩn', 'Import/Export', 'Route', 'Loại hàng',
];

// Cột khóa cần để Plain text (@) trước khi dán — tránh số khoa học / auto-date
// (theo DATA_CONTRACT §2 bước 4 và §4 cạm bẫy): Month(A), B/L(C), INVOICE NO.(D), CDS NO.(E)
var SETUP_TEXT_COLS = [1, 3, 4, 5];

function setupSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) {
    throw new Error('Không có spreadsheet đang mở. Apps Script phải GẮN với Google Sheet ' +
      '(mở Sheet → Extensions → Apps Script), KHÔNG phải project độc lập.');
  }

  var name = CONFIG.FACT_TAB; // 'fact_CostLines'
  var sh = ss.getSheetByName(name);
  var created = false;
  if (!sh) {
    sh = ss.insertSheet(name);
    created = true;
  }

  // Header mẫu chỉ ghi khi tab đang RỖNG (tránh đè dữ liệu thật đã dán)
  var lastRow = sh.getLastRow();
  if (lastRow === 0) {
    sh.getRange(1, 1, 1, SETUP_HEADERS.length)
      .setValues([SETUP_HEADERS])
      .setFontWeight('bold');
    sh.setFrozenRows(1);
  }

  // Định dạng cột khóa = Plain text (áp dụng cả cột, an toàn kể cả khi đã có dữ liệu)
  var maxRows = sh.getMaxRows();
  SETUP_TEXT_COLS.forEach(function (col) {
    sh.getRange(1, col, maxRows, 1).setNumberFormat('@');
  });

  var msg = (created ? '✅ ĐÃ TẠO' : 'ℹ️ ĐÃ CÓ') + ' tab "' + name + '". ' +
    (lastRow === 0 ? 'Đã ghi 24 header mẫu + freeze dòng 1. ' : 'Giữ nguyên ' + lastRow + ' dòng dữ liệu. ') +
    'Cột Month/B-L/INVOICE/CDS đã đặt Plain text. ' +
    'Bước tiếp: dán A:X (từ dòng 9 Excel) vào ô A1, Paste values only.';
  Logger.log(msg);
  return msg;
}
