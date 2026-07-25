/* mock-data.js — dữ liệu MẪU để xem UI khi chưa nối Google Sheets.
 * Chỉ dùng khi APP_CONFIG.GS_WEBAPP_URL trống và USE_MOCK=true.
 * KHÔNG phải dữ liệu thật. Nạp SAU constants.js. */
(function () {
  var C = window.COLS;
  // [Month, Forwarder, Import/Export, Mode chuẩn, Standard Cost, FWD Column, Route, Amount_USD]
  var T = [
    // ── 2026-05 ──
    ['2026-05','DHL','Import','Courier','Freight','Freight FWD','PURE',1180],
    ['2026-05','DHL','Import','Courier','Customs','Customs FWD','PURE',210],
    ['2026-05','DHL','Third party','Courier','Freight','Freight FWD','Other',640],
    ['2026-05','FedEx Import','Import','Courier','Freight','Freight FWD','EFI',900],
    ['2026-05','FedEx Import','Import','Courier','Customs','Customs FWD','EFI',150],
    ['2026-05','EI','Import','Air','Freight','Freight FWD','AGIGA',3200],
    ['2026-05','EI','Import','Air','Origin LCC','Origin LCC FWD','AGIGA',480],
    ['2026-05','EI','Import','Air','Dest LCC','Dest LCC FWD','AGIGA',520],
    ['2026-05','EI','Import','Air','Customs','Customs FWD','AGIGA',300],
    ['2026-05','EI','Export','Air','Freight','Freight FWD','Ford',1100],
    ['2026-05','VVMV','Import','Sea','Freight','Freight FWD','PURE',2600],
    ['2026-05','VVMV','Import','Sea','Trucking','Trucking FWD','PURE',430],
    ['2026-05','VVMV','Import','Sea','Dest LCC','Dest LCC FWD','PURE',380],
    ['2026-05','VVMV','Export','Sea','Freight','Freight FWD','Ford',1750],
    ['2026-05','Dolphin','Import','Air','Freight','Freight FWD','EFI',1400],
    ['2026-05','Gia Bảo','Overhead',null,'Lifting fee','Overhead FWD',null,520],
    ['2026-05','VVMV','Overhead',null,'Customs administration fee','Overhead FWD',null,300],
    ['2026-05','VVMV','Overhead',null,'Settlement report fee','Overhead FWD',null,120],
    // ── 2026-06 ── (cao hơn 5 chút để có xu hướng)
    ['2026-06','DHL','Import','Courier','Freight','Freight FWD','PURE',1320],
    ['2026-06','DHL','Import','Courier','Customs','Customs FWD','PURE',230],
    ['2026-06','DHL','Third party','Courier','Freight','Freight FWD','Other',710],
    ['2026-06','FedEx Import','Import','Courier','Freight','Freight FWD','EFI',1020],
    ['2026-06','FedEx Import','Import','Courier','Customs','Customs FWD','EFI',160],
    ['2026-06','EI','Import','Air','Freight','Freight FWD','AGIGA',3550],
    ['2026-06','EI','Import','Air','Origin LCC','Origin LCC FWD','AGIGA',500],
    ['2026-06','EI','Import','Air','Dest LCC','Dest LCC FWD','AGIGA',560],
    ['2026-06','EI','Import','Air','Customs','Customs FWD','AGIGA',330],
    ['2026-06','EI','Import','Air','Freight','Freight FWD','AGIGA',-180], // dòng điều chỉnh (âm)
    ['2026-06','EI','Export','Air','Freight','Freight FWD','Ford',1240],
    ['2026-06','VVMV','Import','Sea','Freight','Freight FWD','PURE',2880],
    ['2026-06','VVMV','Import','Sea','Trucking','Trucking FWD','PURE',460],
    ['2026-06','VVMV','Import','Sea','Dest LCC','Dest LCC FWD','PURE',400],
    ['2026-06','VVMV','Export','Sea','Freight','Freight FWD','Ford',1820],
    ['2026-06','Dolphin','Import','Air','Freight','Freight FWD','EFI',1520],
    ['2026-06','Gia Bảo','Overhead',null,'Lifting fee','Overhead FWD',null,560],
    ['2026-06','VVMV','Overhead',null,'Customs administration fee','Overhead FWD',null,310],
    ['2026-06','VVMV','Overhead',null,'Settlement report fee','Overhead FWD',null,120],
  ];
  // Loại hàng mẫu theo Route (chỉ hàng nhập) — để trang Logistics record có số
  var LH_BY_ROUTE = { PURE: 'Material', EFI: 'Equipment & Toolings', AGIGA: 'Material' };
  window.MOCK_ROWS = T.map(function (r, i) {
    var o = {};
    o[C.MONTH] = r[0]; o[C.FORWARDER] = r[1]; o[C.IMP_EXP] = r[2]; o[C.MODE_STD] = r[3];
    o[C.STANDARD_COST] = r[4]; o[C.FWD_COLUMN] = r[5]; o[C.ROUTE] = r[6]; o[C.AMOUNT_USD] = r[7];
    // B/L theo LÔ (Forwarder+Route+tháng) để khử trùng trọng lượng/số lô đúng
    o[C.BL] = 'MOCK-' + r[1].replace(/\s/g, '') + '-' + r[6] + '-' + r[0];
    o[C.CW] = (o[C.IMP_EXP] === 'Import') ? 120 : (o[C.IMP_EXP] === 'Export' ? 80 : 0);
    if (o[C.IMP_EXP] === 'Import') {
      o[C.LOAI_HANG] = LH_BY_ROUTE[r[6]] || null;
      if (r[1] === 'VVMV' || r[1] === 'Dolphin') o[C.CDS] = '1' + r[6] + r[0].slice(5);
    }
    return o;
  });

  // Vài dòng Pay-on-behalf (nhãn riêng, KHÔNG vào Full cost) — QĐ-48
  window.MOCK_ROWS.push(
    mk('2026-06', 'POB', 'Pay on behalf', 'Pay on behalf', 'PURE', 4200, 'MOCK-POB-1'),
    mk('2026-06', 'POB', 'Pay on behalf', 'Pay on behalf', 'EFI', 1850, 'MOCK-POB-2')
  );
  function mk(month, fwd, ie, sc, route, usd, bl) {
    var o = {};
    o[C.MONTH] = month; o[C.FORWARDER] = fwd; o[C.IMP_EXP] = ie;
    o[C.STANDARD_COST] = sc; o[C.ROUTE] = route; o[C.AMOUNT_USD] = usd; o[C.BL] = bl;
    o[C.MODE_STD] = null; o[C.FWD_COLUMN] = null; o[C.CW] = 0;
    return o;
  }

  // Chi tiết POB cho bảng (mock cho ?action=pob)
  window.MOCK_POB = [
    { 'B/L': 'MOCK-POB-1', 'INVOICE NO.': 'INV-POB-01', 'Shipper/Consignee': 'Đối tác A',
      Amount: 105000000, Amount_USD: 4200, Route: 'PURE', 'Quote customer': 4600, Remark: 'Ứng hộ, đã thu' },
    { 'B/L': 'MOCK-POB-2', 'INVOICE NO.': 'INV-POB-02', 'Shipper/Consignee': 'Đối tác B',
      Amount: 46250000, Amount_USD: 1850, Route: 'EFI', 'Quote customer': 2000, Remark: 'Chờ thu' },
  ];
})();
