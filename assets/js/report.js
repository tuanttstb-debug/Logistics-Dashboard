/* report.js — engine tổng hợp. Đọc Store.raw(), sinh cấu trúc báo cáo.
 * KHÔNG phân loại lại — chỉ group/sum theo nhãn có sẵn. Số dùng: Amount_USD.
 * Quyết định liên quan: QĐ-37 (Third party), QĐ-38 (Route trang riêng),
 * QĐ-39 (so sánh kỳ: tháng trước + % + YTD), QĐ-40 (chưa đơn giá). */
(function () {
  var C = window.COLS;
  var BLOCKS = ['Import', 'Export', 'Overhead', 'Third party']; // QĐ-37

  // ---- tiện ích tháng ----
  function prevMonth(m) {
    if (!m) return '';
    var y = +m.slice(0, 4), mo = +m.slice(5, 7) - 1;
    if (mo === 0) { y -= 1; mo = 12; }
    return y + '-' + String(mo).padStart(2, '0');
  }
  function sameYearUpTo(m) { // các tháng cùng năm, <= m (cho YTD)
    var y = m.slice(0, 4);
    return function (mm) { return mm.slice(0, 4) === y && mm <= m; };
  }

  // ---- nhãn dòng phí: Freight tách theo Mode chuẩn (Air/Sea freight) ----
  function feeLabel(r) {
    if ((r[C.STANDARD_COST] || '') === 'Freight')
      return (r[C.MODE_STD] || '?') + ' freight';
    return r[C.STANDARD_COST] || '(chưa map)';
  }

  function sum(rows) {
    return rows.reduce(function (s, r) { return s + (Number(r[C.AMOUNT_USD]) || 0); }, 0);
  }
  // Bộ 3 giá trị {cur, prev, ytd} cho một tập rows đã lọc sẵn theo tiêu chí phi-thời-gian
  function triplet(rows, month) {
    var pm = prevMonth(month), inYtd = sameYearUpTo(month);
    var cur = 0, prev = 0, ytd = 0;
    rows.forEach(function (r) {
      var v = Number(r[C.AMOUNT_USD]) || 0, mm = r[C.MONTH];
      if (mm === month) cur += v;
      if (mm === pm) prev += v;
      if (inYtd(mm)) ytd += v;
    });
    return { cur: cur, prev: prev, ytd: ytd };
  }
  function addTriplet(a, b) { return { cur: a.cur + b.cur, prev: a.prev + b.prev, ytd: a.ytd + b.ytd }; }

  // ---- BÁO CÁO THEO FORWARDER ----
  function forwarderReport(month) {
    var all = window.Store.raw();
    var fwdOrder = window.FORWARDERS.slice();
    // thêm forwarder lạ (nếu có) vào cuối
    all.forEach(function (r) { if (fwdOrder.indexOf(r[C.FORWARDER]) === -1 && r[C.FORWARDER]) fwdOrder.push(r[C.FORWARDER]); });

    var out = [];
    fwdOrder.forEach(function (fwd) {
      var fwdRows = all.filter(function (r) { return r[C.FORWARDER] === fwd; });
      if (!fwdRows.length) return;
      var blocks = [], fwdTotal = { cur: 0, prev: 0, ytd: 0 };
      BLOCKS.forEach(function (bk) {
        var bkRows = fwdRows.filter(function (r) { return r[C.IMP_EXP] === bk; });
        if (!bkRows.length) return;
        // gom theo nhãn dòng
        var byLabel = {};
        bkRows.forEach(function (r) {
          var k = feeLabel(r);
          (byLabel[k] = byLabel[k] || []).push(r);
        });
        var lines = Object.keys(byLabel).map(function (k) {
          return { label: k, val: triplet(byLabel[k], month) };
        }).filter(function (l) { return l.val.cur || l.val.prev || l.val.ytd; })
          .sort(function (a, b) { return b.val.ytd - a.val.ytd; });
        if (!lines.length) return;
        var sub = lines.reduce(function (s, l) { return addTriplet(s, l.val); }, { cur: 0, prev: 0, ytd: 0 });
        blocks.push({ name: bk, lines: lines, subtotal: sub });
        fwdTotal = addTriplet(fwdTotal, sub);
      });
      if (blocks.length) out.push({ forwarder: fwd, blocks: blocks, total: fwdTotal });
    });
    return out;
  }

  // ---- BÁO CÁO THEO ROUTE (QĐ-38) ----
  function routeReport(month) {
    var all = window.Store.raw();
    var byRoute = {};
    all.forEach(function (r) {
      var route = r[C.ROUTE];
      if (route === null || route === undefined || route === '') route = '(không Route)';
      byRoute[route] = byRoute[route] || { imp: [], exp: [], all: [] };
      byRoute[route].all.push(r);
      if (r[C.IMP_EXP] === 'Import') byRoute[route].imp.push(r);
      else if (r[C.IMP_EXP] === 'Export') byRoute[route].exp.push(r);
    });
    return Object.keys(byRoute).map(function (route) {
      var g = byRoute[route];
      return {
        route: route,
        imp: triplet(g.imp, month),
        exp: triplet(g.exp, month),
        total: triplet(g.all, month),
      };
    }).filter(function (x) { return x.total.cur || x.total.prev || x.total.ytd; })
      .sort(function (a, b) { return b.total.ytd - a.total.ytd; });
  }

  // ---- SỐ LIỆU DASHBOARD ----
  function dashboard(month) {
    var all = window.Store.raw();
    var total = triplet(all, month);
    var byIE = {};
    BLOCKS.forEach(function (bk) {
      byIE[bk] = triplet(all.filter(function (r) { return r[C.IMP_EXP] === bk; }), month);
    });
    // cơ cấu theo nhóm phí (tháng hiện tại): overhead gom 'Overhead', còn lại theo Standard Cost
    var byGroup = {};
    all.filter(function (r) { return r[C.MONTH] === month; }).forEach(function (r) {
      var g = (r[C.FWD_COLUMN] === 'Overhead FWD') ? 'Overhead' : (r[C.STANDARD_COST] || '(chưa map)');
      byGroup[g] = (byGroup[g] || 0) + (Number(r[C.AMOUNT_USD]) || 0);
    });
    // theo forwarder (tháng hiện tại)
    var byFwd = {};
    all.filter(function (r) { return r[C.MONTH] === month; }).forEach(function (r) {
      var f = r[C.FORWARDER] || '(?)';
      byFwd[f] = (byFwd[f] || 0) + (Number(r[C.AMOUNT_USD]) || 0);
    });
    // xu hướng theo tháng
    var months = allMonths();
    var trend = months.map(function (mm) {
      return { month: mm, total: sum(all.filter(function (r) { return r[C.MONTH] === mm; })) };
    });
    return { total: total, byIE: byIE, byGroup: byGroup, byFwd: byFwd, trend: trend };
  }

  function allMonths() {
    var s = {}, all = window.Store.raw();
    all.forEach(function (r) { if (r[C.MONTH]) s[r[C.MONTH]] = 1; });
    return Object.keys(s).sort();
  }

  // % thay đổi cur so prev
  function pct(cur, prev) {
    if (!prev) return null;
    return (cur - prev) / Math.abs(prev) * 100;
  }

  window.Report = {
    forwarderReport: forwarderReport,
    routeReport: routeReport,
    dashboard: dashboard,
    allMonths: allMonths,
    prevMonth: prevMonth,
    pct: pct,
  };
})();
