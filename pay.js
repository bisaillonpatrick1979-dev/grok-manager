(function () {
  function money(n) {
    try { return new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD' }).format(+n || 0); }
    catch (e) { return '$' + (+n || 0).toFixed(2); }
  }
  function tick() {
    if (typeof USER === 'undefined' || !USER || USER.portal !== 'staff') return;
    var taux = USER.taux || 0;
    var start = new Date(); start.setHours(0,0,0,0);
    var mine = (typeof DB !== 'undefined' && DB.punches) ? DB.punches.filter(function (p) { return p.qui === USER.name && p.in >= start.getTime(); }) : [];
    var open = mine.filter(function (p) { return !p.out; })[0];
    var h = 0, dol = 0;
    mine.forEach(function (p) {
      if (p.out) { h += p.heures || 0; dol += p.gain != null ? p.gain : (p.heures || 0) * taux; }
    });
    if (open) { var live = (Date.now() - open.in) / 3600000; h += live; dol += live * taux; }
    var el = document.getElementById('gain-bubble');
    if (!el) { el = document.createElement('div'); el.id = 'gain-bubble'; el.className = 'gain'; document.body.appendChild(el); }
    el.innerHTML = '<b>' + money(dol) + '</b><span>' + h.toFixed(2) + ' h aujourd\'hui</span>' + (open ? '<span class="badge ok">en cours</span>' : '');
    var coins = document.getElementById('coins-live');
    if (open && !coins) {
      coins = document.createElement('div'); coins.id = 'coins-live'; coins.className = 'coins';
      coins.innerHTML = [0,1,2,3,4,5,6,7].map(function (i) { return '<i style="left:' + (10+i*11) + '%;animation-delay:' + (i*0.4) + 's">\u25cf</i>'; }).join('');
      document.body.appendChild(coins);
    }
    if (!open && coins) coins.remove();
  }
  setInterval(tick, 1000);
})();
