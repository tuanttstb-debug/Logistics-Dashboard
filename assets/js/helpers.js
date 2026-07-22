/* helpers.js — tiện ích chung: format USD, theme, toast, debounce. */
(function () {
  function usd(n) {
    var v = Number(n) || 0;
    return v.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
  }
  function num(n) { return (Number(n) || 0).toLocaleString('en-US'); }
  function debounce(fn, ms) { var t; return function () { var a = arguments, c = this;
    clearTimeout(t); t = setTimeout(function () { fn.apply(c, a); }, ms || 250); }; }
  function esc(s) { return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

  // Theme
  function setTheme(t) { document.documentElement.dataset.theme = t; localStorage.setItem('logi_theme', t); }
  function toggleTheme() { setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'); }
  function initTheme() { setTheme(localStorage.getItem('logi_theme') || 'light'); }

  // Toast
  function toast(msg, type) {
    var wrap = document.querySelector('.toast-wrap');
    if (!wrap) { wrap = document.createElement('div'); wrap.className = 'toast-wrap'; document.body.appendChild(wrap); }
    var el = document.createElement('div');
    el.className = 'toast ' + (type === 'error' ? 'toast--error' : 'toast--ok');
    el.textContent = msg; wrap.appendChild(el);
    setTimeout(function () { el.remove(); }, 4000);
  }
  function log() { if (window.APP_CONFIG && window.APP_CONFIG.DEBUG) console.log.apply(console, arguments); }

  window.H = { usd: usd, num: num, debounce: debounce, esc: esc,
    setTheme: setTheme, toggleTheme: toggleTheme, initTheme: initTheme, toast: toast, log: log };
})();
