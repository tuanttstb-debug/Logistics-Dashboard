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
    var all = window.Store.raw().filter(nonPOB);
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

  // POB (Pay on behalf) là nhãn RIÊNG — KHÔNG tính vào Full logistics cost của
  // dashboard/forwarder/route (QĐ-51). Trang "Logistics record" mới hiện Full/POB/Total riêng.
  function nonPOB(r) { return r[C.IMP_EXP] !== 'Pay on behalf'; }

  // ---- BÁO CÁO THEO ROUTE (QĐ-38) ----
  function routeReport(month) {
    var all = window.Store.raw().filter(nonPOB);
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
    var all = window.Store.raw().filter(nonPOB);
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

  // ═══════════════════ LOGISTICS RECORD (Phase B, PLAN_LOGISTICS_RECORD) ═══════════════════
  // Bám cấu trúc báo cáo CEO Excel. Số do fact ta sinh (sẽ lệch bản tay — chấp nhận).

  // Chỉ tiêu 1 nhóm dòng. LƯU Ý: CW/B-L/CDS lặp trên MỌI dòng phí của cùng lô
  // (unpivot) → trọng lượng & số lô/tờ khai phải KHỬ TRÙNG theo B/L, CDS (QĐ-49).
  function lrMetrics(rows) {
    var freight = 0, ct = 0, lcc = 0, total = 0, blCW = {}, cds = {};
    rows.forEach(function (r) {
      var amt = Number(r[C.AMOUNT_USD]) || 0; total += amt;
      var sc = r[C.STANDARD_COST] || '';
      if (sc === 'Freight') freight += amt;
      else if (sc === 'Customs' || sc === 'Trucking') ct += amt;
      else if (sc === 'Origin LCC' || sc === 'Dest LCC') lcc += amt;
      var bl = r[C.BL]; if (bl && blCW[bl] === undefined) blCW[bl] = Number(r[C.CW]) || 0;
      var cd = r[C.CDS]; if (cd) cds[cd] = 1;
    });
    var weight = 0; Object.keys(blCW).forEach(function (k) { weight += blCW[k]; });
    return { freight: freight, customsTrucking: ct, lcc: lcc, subtotal: total,
      weight: weight, shipments: Object.keys(blCW).length, declarations: Object.keys(cds).length };
  }

  // Full / POB / Total theo tháng (nhãn Pay on behalf)
  function lrMonthlySeries() {
    var by = {};
    window.Store.raw().forEach(function (r) {
      var m = r[C.MONTH]; if (!m) return;
      var o = by[m] || (by[m] = { full: 0, pob: 0 });
      var v = Number(r[C.AMOUNT_USD]) || 0;
      if (r[C.IMP_EXP] === 'Pay on behalf') o.pob += v; else o.full += v;
    });
    return Object.keys(by).sort().map(function (m) {
      return { month: m, full: by[m].full, pob: by[m].pob, total: by[m].full + by[m].pob };
    });
  }

  var IMPORT_BUCKETS = ['Raw materials', 'Equipment', 'Other'];
  function importBucket(r) {
    var lh = r[C.LOAI_HANG];
    if (lh === 'Material') return 'Raw materials';
    if (lh === 'Equipment & Toolings') return 'Equipment';
    return 'Other';
  }

  // Import: theo tháng × {Raw materials, Equipment, Other} + Subtotal Import/tháng
  function lrImport() {
    var months = allMonths();
    var imp = window.Store.raw().filter(function (r) { return r[C.IMP_EXP] === 'Import'; });
    var data = {}, subtotal = {};
    months.forEach(function (m) {
      var monthRows = imp.filter(function (r) { return r[C.MONTH] === m; });
      data[m] = {};
      IMPORT_BUCKETS.forEach(function (b) {
        data[m][b] = lrMetrics(monthRows.filter(function (r) { return importBucket(r) === b; }));
      });
      subtotal[m] = lrMetrics(monthRows);
    });
    return { months: months, buckets: IMPORT_BUCKETS, data: data, subtotal: subtotal };
  }

  // Export: theo tháng × dự án (Route) + Subtotal Export/tháng
  function lrExport() {
    var months = allMonths();
    var exp = window.Store.raw().filter(function (r) { return r[C.IMP_EXP] === 'Export'; });
    var projSet = {};
    exp.forEach(function (r) { projSet[r[C.ROUTE] || '(không dự án)'] = 1; });
    var projects = Object.keys(projSet).sort();
    var data = {}, subtotal = {};
    months.forEach(function (m) {
      var monthRows = exp.filter(function (r) { return r[C.MONTH] === m; });
      data[m] = {};
      projects.forEach(function (p) {
        data[m][p] = lrMetrics(monthRows.filter(function (r) { return (r[C.ROUTE] || '(không dự án)') === p; }));
      });
      subtotal[m] = lrMetrics(monthRows);
    });
    return { months: months, projects: projects, data: data, subtotal: subtotal };
  }

  // Overhead: Customs fees in Month / Others (theo Standard Cost)
  function lrOverhead() {
    var months = allMonths();
    var ov = window.Store.raw().filter(function (r) { return r[C.IMP_EXP] === 'Overhead'; });
    var labelSet = {};
    ov.forEach(function (r) { labelSet[r[C.STANDARD_COST] || '(khác)'] = 1; });
    var labels = Object.keys(labelSet).sort();
    var data = {}, total = {};
    months.forEach(function (m) {
      data[m] = {}; var t = 0;
      labels.forEach(function (l) {
        var s = sum(ov.filter(function (r) { return r[C.MONTH] === m && (r[C.STANDARD_COST] || '(khác)') === l; }));
        data[m][l] = s; t += s;
      });
      total[m] = t;
    });
    return { months: months, labels: labels, data: data, total: total };
  }

  window.Report = {
    forwarderReport: forwarderReport,
    routeReport: routeReport,
    dashboard: dashboard,
    allMonths: allMonths,
    prevMonth: prevMonth,
    pct: pct,
    // Logistics record
    lrMonthlySeries: lrMonthlySeries,
    lrImport: lrImport,
    lrExport: lrExport,
    lrOverhead: lrOverhead,
  };
})();
