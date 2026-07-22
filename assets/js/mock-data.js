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
  window.MOCK_ROWS = T.map(function (r, i) {
    var o = {};
    o[C.MONTH] = r[0]; o[C.FORWARDER] = r[1]; o[C.IMP_EXP] = r[2]; o[C.MODE_STD] = r[3];
    o[C.STANDARD_COST] = r[4]; o[C.FWD_COLUMN] = r[5]; o[C.ROUTE] = r[6]; o[C.AMOUNT_USD] = r[7];
    o[C.BL] = 'MOCK-BL-' + (1000 + i);
    return o;
  });
})();
