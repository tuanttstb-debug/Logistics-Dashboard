/* app.js — entry point. Nạp CUỐI.
 * Điều hướng SPA + chọn tháng + orchestration + vẽ Chart.js.
 * Chặng 2: Dashboard / Báo cáo CEO (forwarder) / Theo Route / Giới thiệu. */
(function () {
  var _view = 'dashboard';
  var _month = '';
  var _charts = [];

  function init() {
    H.initTheme();
    bindShell();
    bindControls();       // gắn listener MỘT LẦN (tránh nhân đôi khi đồng bộ)
    refreshData(true);    // lần đầu: chọn tháng mới nhất
  }

  function loadData() {
    var cfg = window.APP_CONFIG;
    if (window.Api.configured()) {
      setMain('<div class="card"><div class="empty-state">Đang tải dữ liệu…</div></div>');
      var month = cfg.LOAD_ALL_MONTHS ? '' : _month;
      return Promise.all([Api.meta().catch(function () { return null; }), Api.facts(month)])
        .then(function (res) {
          if (res[0] && res[0].ok) Store.setMeta(res[0]);
          Store.setRows((res[1] && res[1].rows) || []);
          qcCheck();
        });
    }
    // Chưa nối GAS → dùng dữ liệu mẫu nếu bật
    if (cfg.USE_MOCK !== false && window.MOCK_ROWS) {
      Store.setRows(window.MOCK_ROWS);
      H.toast('Đang xem DỮ LIỆU MẪU (chưa nối Google Sheets)', 'ok');
      qcCheck();
      return Promise.resolve();
    }
    renderPlaceholder();
    return Promise.reject(new Error('Chưa cấu hình GS_WEBAPP_URL và không có mock'));
  }

  function qcCheck() {
    var miss = Store.countMissingUSD();
    if (miss > 0) H.toast('⚠️ ' + miss + ' dòng thiếu Amount_USD — kiểm Excel', 'error');
  }

  // Gắn listener MỘT LẦN cho chọn tháng + điều hướng (gọi trong init)
  function bindControls() {
    var sel = document.getElementById('monthSelect');
    if (sel) sel.addEventListener('change', function () { _month = sel.value; render(); });
    document.querySelectorAll('[data-view]').forEach(function (el) {
      el.addEventListener('click', function () { _view = el.getAttribute('data-view'); syncNav(); render(); closeSidebarMobile(); });
    });
  }

  // Đổ lại danh sách tháng vào dropdown (KHÔNG gắn thêm listener)
  function populateMonths(pickNewest) {
    var months = Report.allMonths();
    if (pickNewest || months.indexOf(_month) < 0) _month = months.length ? months[months.length - 1] : '';
    var sel = document.getElementById('monthSelect');
    if (sel) {
      sel.innerHTML = months.map(function (m) {
        return '<option value="' + m + '">' + Views.fmtMonth(m) + '</option>';
      }).join('');
      sel.value = _month;
    }
  }

  // Đồng bộ: tải lại dữ liệu từ GAS + vẽ lại, có spinner + toast (thay việc F5)
  function refreshData(pickNewest) {
    var btn = document.getElementById('refreshBtn');
    if (btn) { btn.classList.add('is-spinning'); btn.disabled = true; }
    return loadData()
      .then(function () {
        populateMonths(pickNewest);
        render();
        if (window.Api.configured()) H.toast('Đã đồng bộ dữ liệu', 'ok');
      })
      .catch(function (e) { H.log(e); H.toast('Đồng bộ lỗi: ' + e.message, 'error'); renderPlaceholder(); })
      .then(function () { if (btn) { btn.classList.remove('is-spinning'); btn.disabled = false; } });
  }

  function syncNav() {
    document.querySelectorAll('[data-view]').forEach(function (el) {
      el.classList.toggle('is-active', el.getAttribute('data-view') === _view);
    });
    var titles = { dashboard: 'Dashboard chi phí logistics', forwarder: 'Báo cáo CEO — theo forwarder', route: 'Chi phí theo Route', about: 'Giới thiệu' };
    var t = document.getElementById('topbarTitle');
    if (t) t.textContent = titles[_view] || '';
  }

  function render() {
    destroyCharts();
    syncNav();
    var html;
    switch (_view) {
      case 'forwarder': html = Views.forwarder(_month); break;
      case 'route':     html = Views.route(_month); break;
      case 'about':     html = Views.about(); break;
      default:          html = Views.dashboard(_month);
    }
    setMain(html);
    if (_view === 'dashboard') drawCharts(_month);
  }

  // ---------- Charts ----------
  function cssVar(n) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim(); }
  var PALETTE = ['#0e7490', '#06b6d4', '#d97706', '#0f2a43', '#16a34a', '#7c3aed', '#dc2626', '#0891b2', '#65a30d', '#9333ea'];

  function destroyCharts() { _charts.forEach(function (c) { try { c.destroy(); } catch (e) {} }); _charts = []; }

  function drawCharts(month) {
    if (typeof Chart === 'undefined') { H.log('Chart.js chưa tải'); return; }
    var d = Report.dashboard(month);
    var tick = cssVar('--text-2'), grid = cssVar('--border');
    Chart.defaults.color = tick;
    Chart.defaults.font.family = cssVar('--font') || 'sans-serif';

    // Doughnut: cơ cấu nhóm phí
    var gLabels = Object.keys(d.byGroup), gVals = gLabels.map(function (k) { return d.byGroup[k]; });
    mkChart('chartGroup', {
      type: 'doughnut',
      data: { labels: gLabels, datasets: [{ data: gVals, backgroundColor: PALETTE, borderWidth: 0 }] },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right' } } }
    });
    // Bar: theo forwarder
    var fLabels = Object.keys(d.byFwd), fVals = fLabels.map(function (k) { return d.byFwd[k]; });
    mkChart('chartFwd', {
      type: 'bar',
      data: { labels: fLabels, datasets: [{ data: fVals, backgroundColor: cssVar('--brand') }] },
      options: {
        responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } },
        scales: { x: { grid: { display: false } }, y: { grid: { color: grid }, beginAtZero: true } }
      }
    });
    // Line: xu hướng tháng
    mkChart('chartTrend', {
      type: 'line',
      data: {
        labels: d.trend.map(function (t) { return Views.fmtMonth(t.month); }),
        datasets: [{ data: d.trend.map(function (t) { return t.total; }), borderColor: cssVar('--accent'),
          backgroundColor: 'rgba(6,182,212,.15)', fill: true, tension: .25, pointRadius: 3 }]
      },
      options: {
        responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } },
        scales: { x: { grid: { display: false } }, y: { grid: { color: grid }, beginAtZero: true } }
      }
    });
  }
  function mkChart(id, cfg) {
    var el = document.getElementById(id); if (!el) return;
    _charts.push(new Chart(el.getContext('2d'), cfg));
  }

  // ---------- shell ----------
  function setMain(html) { document.getElementById('view').innerHTML = html; }
  function bindShell() {
    var toggle = document.getElementById('sidebarToggle');
    var sidebar = document.getElementById('sidebar');
    var overlay = document.getElementById('sidebarOverlay');
    if (toggle) toggle.addEventListener('click', function () { sidebar.classList.toggle('is-open'); overlay.classList.toggle('is-open'); });
    if (overlay) overlay.addEventListener('click', closeSidebarMobile);
    var themeBtn = document.getElementById('themeBtn');
    if (themeBtn) themeBtn.addEventListener('click', function () { H.toggleTheme(); render(); }); // vẽ lại chart theo theme
    var refresh = document.getElementById('refreshBtn');
    if (refresh) refresh.addEventListener('click', function () { refreshData(false); });
  }
  function closeSidebarMobile() {
    var sidebar = document.getElementById('sidebar'), overlay = document.getElementById('sidebarOverlay');
    if (sidebar) sidebar.classList.remove('is-open'); if (overlay) overlay.classList.remove('is-open');
  }
  function renderPlaceholder() {
    setMain('<div class="card"><div class="empty-state"><div class="big">🔌</div>' +
      '<h3>Chưa kết nối dữ liệu</h3><p>Dán <code>GS_WEBAPP_URL</code> vào <code>config/env.js</code>, ' +
      'hoặc bật <code>USE_MOCK</code> để xem dữ liệu mẫu.</p></div></div>');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
