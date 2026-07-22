/* views.js — render HTML từng trang. Phụ thuộc H (helpers), Report.
 * Charts (Chart.js) vẽ ở app.js sau khi chèn canvas. */
(function () {
  function fmtMonth(m) { return m ? (m.slice(5, 7) + '/' + m.slice(0, 4)) : '—'; }
  function money(v) { return H.usd(v); }

  // ô % thay đổi (chi phí TĂNG = đỏ, GIẢM = xanh)
  function deltaCell(cur, prev) {
    var p = Report.pct(cur, prev);
    if (p === null) return '<td class="num delta">—</td>';
    var up = p > 0, cls = up ? 'up' : (p < 0 ? 'down' : '');
    var arrow = up ? '▲' : (p < 0 ? '▼' : '');
    return '<td class="num delta ' + cls + '">' + arrow + ' ' + Math.abs(p).toFixed(1) + '%</td>';
  }
  function numTd(v, extra) { return '<td class="num ' + (extra || '') + '">' + money(v) + '</td>'; }
  function triCols(t) { // Tháng này | Tháng trước | %△ | YTD
    return numTd(t.cur) + numTd(t.prev) + deltaCell(t.cur, t.prev) + numTd(t.ytd, 'ytd');
  }
  var HEAD_COMPARE = '<th class="num">Tháng này</th><th class="num">Tháng trước</th><th class="num">%△</th><th class="num">YTD</th>';

  // ---------- DASHBOARD ----------
  function dashboard(month) {
    var d = Report.dashboard(month);
    function kpi(label, t, mod) {
      var p = Report.pct(t.cur, t.prev);
      var deltaTxt = (p === null) ? 'kỳ trước: —'
        : (p > 0 ? '▲ ' : (p < 0 ? '▼ ' : '')) + Math.abs(p).toFixed(1) + '% so tháng trước';
      var deltaCls = (p > 0) ? 'up' : (p < 0 ? 'down' : '');
      return '<div class="kpi ' + (mod || '') + '">' +
        '<div class="kpi-label">' + H.esc(label) + '</div>' +
        '<div class="kpi-value">' + money(t.cur) + '</div>' +
        '<div class="kpi-sub"><span class="delta ' + deltaCls + '">' + deltaTxt + '</span></div>' +
        '<div class="kpi-sub">YTD: ' + money(t.ytd) + '</div>' +
        '</div>';
    }
    return '' +
      '<div class="kpi-row">' +
        kpi('Tổng chi phí (USD)', d.total, 'kpi--warn') +
        kpi('Import', d.byIE['Import']) +
        kpi('Export', d.byIE['Export']) +
        kpi('Overhead', d.byIE['Overhead']) +
        kpi('Third party', d.byIE['Third party']) +
      '</div>' +
      '<div class="grid-2">' +
        '<div class="card"><div class="card-head"><h3 class="card-title">Cơ cấu theo nhóm phí</h3>' +
          '<span class="card-meta">' + fmtMonth(month) + '</span></div>' +
          '<div class="chart-box"><canvas id="chartGroup"></canvas></div></div>' +
        '<div class="card"><div class="card-head"><h3 class="card-title">Theo forwarder</h3>' +
          '<span class="card-meta">' + fmtMonth(month) + '</span></div>' +
          '<div class="chart-box"><canvas id="chartFwd"></canvas></div></div>' +
      '</div>' +
      '<div class="card"><div class="card-head"><h3 class="card-title">Xu hướng theo tháng</h3></div>' +
        '<div class="chart-box chart-box--wide"><canvas id="chartTrend"></canvas></div></div>';
  }

  // ---------- BÁO CÁO THEO FORWARDER ----------
  function forwarder(month) {
    var rep = Report.forwarderReport(month);
    if (!rep.length) return emptyCard('Chưa có dữ liệu cho ' + fmtMonth(month));
    var html = '';
    rep.forEach(function (f) {
      html += '<div class="card report-card"><div class="card-head">' +
        '<h3 class="card-title">' + H.esc(f.forwarder) + '</h3>' +
        '<span class="card-meta">Tổng YTD: ' + money(f.total.ytd) + '</span></div>' +
        '<div class="table-scroll"><table class="tbl tbl-report">' +
        '<thead><tr><th>Khoản mục</th>' + HEAD_COMPARE + '</tr></thead><tbody>';
      f.blocks.forEach(function (b) {
        html += '<tr class="row-block"><td>' + H.esc(b.name) + '</td>' +
          numTd(b.subtotal.cur) + numTd(b.subtotal.prev) + deltaCell(b.subtotal.cur, b.subtotal.prev) + numTd(b.subtotal.ytd, 'ytd') + '</tr>';
        b.lines.forEach(function (l) {
          html += '<tr class="row-line"><td>&nbsp;&nbsp;• ' + H.esc(l.label) + '</td>' + triCols(l.val) + '</tr>';
        });
      });
      html += '<tr class="row-total"><td>TỔNG ' + H.esc(f.forwarder) + '</td>' + triCols(f.total) + '</tr>';
      html += '</tbody></table></div></div>';
    });
    return html;
  }

  // ---------- THEO ROUTE ----------
  function route(month) {
    var rep = Report.routeReport(month);
    if (!rep.length) return emptyCard('Chưa có dữ liệu Route cho ' + fmtMonth(month));
    var html = '<div class="card"><div class="card-head"><h3 class="card-title">Chi phí theo Route (dự án)</h3>' +
      '<span class="card-meta">' + fmtMonth(month) + '</span></div>' +
      '<div class="table-scroll"><table class="tbl"><thead><tr>' +
      '<th>Route</th><th class="num">Import</th><th class="num">Export</th>' +
      '<th class="num">Tổng tháng này</th><th class="num">Tháng trước</th><th class="num">%△</th><th class="num">YTD</th>' +
      '</tr></thead><tbody>';
    var g = { imp: 0, exp: 0, cur: 0, prev: 0, ytd: 0 };
    rep.forEach(function (r) {
      html += '<tr><td>' + H.esc(r.route) + '</td>' +
        numTd(r.imp.cur) + numTd(r.exp.cur) + numTd(r.total.cur) + numTd(r.total.prev) +
        deltaCell(r.total.cur, r.total.prev) + numTd(r.total.ytd, 'ytd') + '</tr>';
      g.imp += r.imp.cur; g.exp += r.exp.cur; g.cur += r.total.cur; g.prev += r.total.prev; g.ytd += r.total.ytd;
    });
    html += '<tr class="row-total"><td>TỔNG</td>' +
      numTd(g.imp) + numTd(g.exp) + numTd(g.cur) + numTd(g.prev) + deltaCell(g.cur, g.prev) + numTd(g.ytd, 'ytd') + '</tr>';
    html += '</tbody></table></div></div>';
    return html;
  }

  function about() {
    return '<div class="card"><div class="card-head"><h3 class="card-title">Giới thiệu</h3></div>' +
      '<p><b>Logistics Cost Dashboard</b> — tầng báo cáo chi phí logistics cho CEO. ' +
      'Dữ liệu do Excel + Power Query chuẩn hóa (kho <code>fact_CostLines</code>), web chỉ đọc.</p>' +
      '<p>Số dùng là <code>Amount_USD</code> (đã gồm VAT). Chi phí <span class="delta up">tăng ▲ = đỏ</span>, ' +
      '<span class="delta down">giảm ▼ = xanh</span>.</p>' +
      '<p class="kpi-sub">Xem chi tiết engine ở <code>context/</code>; quyết định thiết kế ở <code>AI_CONTEXT/</code>.</p></div>';
  }

  function emptyCard(msg) {
    return '<div class="card"><div class="empty-state"><div class="big">📭</div><p>' + H.esc(msg) + '</p></div></div>';
  }

  window.Views = { dashboard: dashboard, forwarder: forwarder, route: route, about: about, fmtMonth: fmtMonth };
})();
