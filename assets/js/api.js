/* api.js — wrapper fetch tới GAS. Phụ thuộc ROUTES (routes.js). */
(function () {
  function getJSON(url) {
    return fetch(url, { method: 'GET' }).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    });
  }
  window.Api = {
    configured: function () { return window.ROUTES && window.ROUTES.isConfigured(); },
    ping:  function ()      { return getJSON(window.ROUTES.ping()); },
    facts: function (month) { return getJSON(window.ROUTES.facts(month)); },
    meta:  function ()      { return getJSON(window.ROUTES.meta()); },
  };
})();
