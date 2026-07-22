/* config/routes.js — dựng URL gọi API GAS.
 * Phụ thuộc window.APP_CONFIG (env.js). Nạp SAU env.js. */
(function () {
  var base = function () { return (window.APP_CONFIG && window.APP_CONFIG.GS_WEBAPP_URL) || ''; };
  function build(action, params) {
    var u = base();
    if (!u) return '';
    var qs = ['action=' + encodeURIComponent(action)];
    Object.keys(params || {}).forEach(function (k) {
      if (params[k] !== undefined && params[k] !== null && params[k] !== '')
        qs.push(encodeURIComponent(k) + '=' + encodeURIComponent(params[k]));
    });
    return u + (u.indexOf('?') === -1 ? '?' : '&') + qs.join('&');
  }
  window.ROUTES = {
    isConfigured: function () { return !!base(); },
    ping:  function ()        { return build('ping', {}); },
    facts: function (month)   { return build('facts', { month: month }); },
    meta:  function ()        { return build('meta', {}); },
  };
})();
