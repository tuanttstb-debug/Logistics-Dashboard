/* constants.js — tên cột fact_CostLines + hằng số. GIỮ ĐÚNG tên gốc (DATA_CONTRACT.md). */
(function () {
  window.COLS = {
    MONTH: 'Month', FORWARDER: 'Forwarder', BL: 'B/L', INVOICE: 'INVOICE NO.', CDS: 'CDS NO.',
    CW: 'CW', CBM: 'CBM',
    ORIGINAL_COST: 'Original Cost Name', AMOUNT: 'Amount', CURRENCY: 'Currency',
    USD_RATE: 'USD_Rate', AMOUNT_USD: 'Amount_USD',
    STANDARD_COST: 'Standard Cost', FWD_COLUMN: 'FWD Column',
    MODE_STD: 'Mode chuẩn', IMP_EXP: 'Import/Export', ROUTE: 'Route', LOAI_HANG: 'Loại hàng',
  };
  // Giá trị hợp lệ của Import/Export (context/12_DATA_DICTIONARY.md)
  window.IMP_EXP_VALUES = ['Import', 'Export', 'Overhead', 'Third party'];
  // 5 nhóm phí chuẩn
  window.STANDARD_GROUPS = ['Freight', 'Origin LCC', 'Dest LCC', 'Trucking', 'Customs'];
  // 7 forwarder
  window.FORWARDERS = ['DHL', 'FedEx Export', 'FedEx Import', 'EI', 'VVMV', 'Dolphin', 'Gia Bảo'];
})();
