/** Code.gs — Router. doGet(action) → JSON.
 * Deploy: Apps Script → Deploy → New deployment → Web app
 *   Execute as: Me · Who has access: Anyone (nội bộ chia link)
 * Copy URL /exec → dán vào config/env.js (GS_WEBAPP_URL). */

function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) || 'ping';
  try {
    switch (action) {
      case 'ping':  return jsonResponse({ ok: true, version: CONFIG.VERSION });
      case 'facts': return jsonResponse(getFacts(e.parameter.month));
      case 'meta':  return jsonResponse(getMeta());
      default:      return jsonResponse({ ok: false, error: 'Unknown action: ' + action });
    }
  } catch (err) {
    return jsonResponse({ ok: false, error: String(err) });
  }
}

// Chạy tay trong editor để test nhanh (không cần deploy)
function _selftest() {
  Logger.log(getMeta());
  Logger.log(getFacts('').count + ' rows');
}
