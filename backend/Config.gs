/** Config.gs — hằng số backend.
 * Dán mã trong thư mục backend/ này vào Apps Script của Google Sheet chứa dữ liệu. */
var CONFIG = {
  VERSION: '0.1.0',
  // Tên tab chứa kho fact_CostLines (khớp DATA_CONTRACT.md)
  FACT_TAB: 'fact_CostLines',
  // Cột dùng cho meta/bộ lọc — GIỮ ĐÚNG tên cột gốc
  COL_MONTH: 'Month',
  COL_FORWARDER: 'Forwarder',
  COL_ROUTE: 'Route',
};
