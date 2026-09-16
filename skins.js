(function () {
  const THEMES = [
    { id: "or", nom: "Chantier or", desc: "Sombre + or" },
    { id: "luxe", nom: "Luxe", desc: "Noir champagne" },
    { id: "moderne", nom: "Moderne", desc: "Clair bleu" },
    { id: "industriel", nom: "Industriel", desc: "Acier rouille" },
    { id: "nord", nom: "Nordique", desc: "Glace Calgary" },
    { id: "game", nom: "Gaming XP", desc: "Néon + niveaux" }
  ];
  function cur() { return localStorage.getItem("gm.theme") || "or"; }
  function apply(id) {
    const t = THEMES.some(x => x.id === id) ? id : "or";
    document.documentElement.setAttribute("data-theme", t);
    localStorage.setItem("gm.theme", t);
  }
  window.setTheme = function (id) { apply(id); inject(true); };
  apply(cur());
  function grid() {
    return '<div class="skins">' + THEMES.map(t =>
      '<button class="skin ' + (cur() === t.id ? 'on' : '') + '" onclick="setTheme(\'' + t.id + '\')"><i class="sw sw-' + t.id + '"></i><b>' + t.nom + '</b><span>' + t.desc + '</span></button>'
    ).join('') + '</div>';
  }
  function inject(force) {
    const app = document.getElementById('app');
    if (!app) return;
    var box = document.getElementById('skin-box');
    if (box && force) { box.remove(); box = null; }
    if (box) return;
    box = document.createElement('div');
    box.id = 'skin-box';
    box.innerHTML = '<div class="card" style="margin:12px 0 80px"><h3>Look / skins</h3><p class="muted">6 thèmes — clique pour changer</p>' + grid() + '</div>';
    var host = app.querySelector('.login-card') || app.querySelector('.main') || app;
    host.appendChild(box);
  }
  var wait = setInterval(function () {
    if (document.getElementById('app') && document.getElementById('app').innerHTML) {
      inject();
      if (typeof window.render === 'function' && !window.render._skins) {
        var old = window.render;
        window.render = function () { old.apply(this, arguments); inject(true); };
        window.render._skins = true;
      }
    }
  }, 400);
  setTimeout(function () { clearInterval(wait); }, 20000);
})();
