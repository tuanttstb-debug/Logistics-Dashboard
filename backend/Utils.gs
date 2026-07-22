/** Utils.gs — helper JSON + CORS + đọc sheet thành object. */

// Trả JSON kèm header CORS (xem ASSUMPTION-W01)
function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// Đọc 1 tab thành mảng object {header: value}. Ép tất cả về chuỗi/số như trên sheet.
function readTabAsObjects(tabName) {
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(tabName);
  if (!sh) throw new Error('Không thấy tab: ' + tabName);
  var values = sh.getDataRange().getValues();
  if (values.length < 2) return [];
  var headers = values[0].map(function (h) { return String(h).trim(); });
  var rows = [];
  for (var i = 1; i < values.length; i++) {
    var row = values[i];
    // Bỏ hàng trống hoàn toàn
    if (row.every(function (c) { return c === '' || c === null; })) continue;
    var obj = {};
    for (var j = 0; j < headers.length; j++) obj[headers[j]] = row[j];
    rows.push(obj);
  }
  return rows;
}

// Danh sách giá trị duy nhất của 1 cột (cho bộ lọc)
function uniqueValues(rows, col) {
  var seen = {}, out = [];
  rows.forEach(function (r) {
    var v = r[col];
    if (v !== '' && v !== null && v !== undefined && !seen[v]) { seen[v] = 1; out.push(v); }
  });
  return out.sort();
}
