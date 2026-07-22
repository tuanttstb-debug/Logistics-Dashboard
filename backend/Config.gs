/** Config.gs — hằng số backend.
 * Dán toàn bộ mã trong thư mục backend/ vào Apps Script của Google Sheet chứa dữ liệu.
 *
 * DB = sheet 40_FACT_CostLines (cột A:X) của Logistics_System.xlsx (QĐ-41),
 * được dán vào tab `40_FACT_CostLines` (header ở HÀNG 1 của tab Sheets). Web CHỈ ĐỌC. */
var CONFIG = {
  VERSION: '0.2.0',
  FACT_TAB: '40_FACT_CostLines',   // tên tab fact trên Sheets (web đọc + rebuildFact ghi ra)

  // Tên cột — GIỮ ĐÚNG tên gốc A:X của 40_FACT_CostLines
  COL_MONTH: 'Month',
  COL_FORWARDER: 'Forwarder',
  COL_ROUTE: 'Route',
  COL_IE: 'Import/Export',
  COL_MONEY: 'Amount_USD',      // ★ số dùng cho mọi báo cáo
};
