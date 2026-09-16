const USERS = {
  admin: { pass: "admin", name: "Patrick", role: "admin", type: "salarie", portal: "admin" },
  comptable: { pass: "demo", name: "Comptable", role: "comptable", type: "salarie", portal: "admin" },
  secretaire: { pass: "demo", name: "Secrétaire", role: "secretaire", type: "salarie", portal: "admin" },
  employe: { pass: "demo", name: "Alex Tremblay", role: "employe", type: "salarie", portal: "employe" },
  soustraitant: { pass: "demo", name: "Marco Siding", role: "sous-traitant", type: "sous-traitant", portal: "employe" }
};

const PERMS = {
  admin: ["all"],
  comptable: ["finances", "factures", "catalogue", "marges", "projets", "punchs"],
  secretaire: ["projets", "punchs", "documents", "employes", "outils"],
  employe: ["moi", "punch", "taches"],
  "sous-traitant": ["moi", "punch", "mes-factures", "taches"]
};

const STATE = { user: null, page: "accueil", punched: false, geoOk: true };

const DATA = {
  projets: [
    { id: "P-104", nom: "Abbeydale — 12 Abalone", client: "Famille Roy", geo: "51.060, -113.950", rayon: "120 m", taches: ["Soffit garage", "Fascia sud"], outils: ["Échafaud 2×", "Scie à onglet"], pi2: 1840, statut: "Actif" },
    { id: "P-101", nom: "Forest Lawn — siding", client: "K. Singh", geo: "51.038, -113.967", rayon: "80 m", taches: ["Mesure mur est"], outils: ["Niveau laser"], pi2: 920, statut: "Soumission" }
  ],
  catalogue: [
    { sku: "VIN-D4-W", nom: "Vinyle D4 White", four: 1.85, sous: 2.40, client: 4.15, unite: "pi²" },
    { sku: "FAS-ALU", nom: "Fascia aluminium 6\"", four: 6.10, sous: 8.20, client: 14.50, unite: "pi lin." },
    { sku: "WRAP-HOU", nom: "Housewrap", four: 68, sous: 85, client: 145, unite: "rouleau" }
  ],
  outils: [
    { id: "OUT-12", nom: "Scie à onglet DeWalt", annee: 2023, facture: "HD-88421", photo: true },
    { id: "OUT-07", nom: "Échafaud Werner 2×", annee: 2021, facture: "manquante", photo: false }
  ],
  docs: [
    { type: "Soumission", no: "SOU-226", projet: "P-104", montant: 18420, statut: "Envoyée" },
    { type: "Contrat", no: "CON-118", projet: "P-104", montant: 18420, statut: "Signé" },
    { type: "Facture", no: "FAC-391", projet: "P-101", montant: 6420, statut: "À encaisser" }
  ],
  equipe: [
    { nom: "Alex Tremblay", type: "Salarié", taux: 35, acces: "Employé" },
    { nom: "Marco Siding", type: "Sous-traitant", taux: 42, acces: "Sous-traitant" },
    { nom: "Comptable", type: "Bureau", taux: "—", acces: "Chiffres" },
    { nom: "Secrétaire", type: "Bureau", taux: "—", acces: "Ops, pas marges" }
  ]
};

function can(key) {
  const r = STATE.user.role;
  if (PERMS[r].includes("all")) return true;
  return PERMS[r].includes(key);
}
function money(n) { return new Intl.NumberFormat("fr-CA", { style: "currency", currency: "CAD" }).format(n); }
function fill(u, p) { document.getElementById("u").value = u; document.getElementById("p").value = p; }
function doLogin() {
  const u = (document.getElementById("u").value || "").trim().toLowerCase();
  const p = document.getElementById("p").value;
  const user = USERS[u];
  if (!user || user.pass !== p) { alert("Mauvais identifiant."); return; }
  STATE.user = { id: u, ...user };
  STATE.page = user.portal === "admin" ? "tableau" : "punch";
  render();
}
function logout() { STATE.user = null; render(); }
function go(p) { STATE.page = p; render(); }
function togglePunch() {
  if (!STATE.geoOk) { alert("Hors du rayon GPS."); return; }
  STATE.punched = !STATE.punched;
  render();
}

function loginView() {
  return `<div class="login-wrap"><div class="login-card">
    <div class="brand"><div class="mark">GM</div><div><h1>Grok Manager</h1></div></div>
    <p class="sub">Deux portails. Tes données, tes règles. Chantier Calgary.</p>
    <label>Identifiant</label><input id="u" placeholder="admin, employe…" />
    <label>Mot de passe</label><input id="p" type="password" placeholder="••••" />
    <div style="height:16px"></div>
    <button class="btn" onclick="doLogin()">Entrer</button>
    <div class="demos">
      <button class="demo" onclick="fill('admin','admin')"><b>Admin</b>tout voir — admin / admin</button>
      <button class="demo" onclick="fill('comptable','demo')"><b>Comptable</b>chiffres + factures — comptable / demo</button>
      <button class="demo" onclick="fill('secretaire','demo')"><b>Secrétaire</b>ops, pas les marges — secretaire / demo</button>
      <button class="demo" onclick="fill('employe','demo')"><b>Employé</b>ses heures seulement — employe / demo</button>
      <button class="demo" onclick="fill('soustraitant','demo')"><b>Sous-traitant</b>punch + ses factures — soustraitant / demo</button>
    </div></div></div>`;
}

function nav(items) {
  return items.map(([id, label]) => `<button class="nav-btn ${STATE.page===id?"on":""}" onclick="go('${id}')">${label}</button>`).join("");
}
function aiDock() {
  return `<aside class="ai"><h4>Assistant IA</h4>
    <p class="muted" style="font-size:13px;line-height:1.45">« Crée une soumission P-104, 1840 pi² vinyle, marge 38%. »</p>
    <input placeholder="Demande à l’IA…" style="margin-top:10px" /></aside>`;
}
function shell(inner) {
  const admin = STATE.user.portal === "admin";
  const items = admin ? [
    ["tableau", "Tableau de bord"],["projets", "Projets + GPS"],["equipe", "Équipe & accès"],
    ["punchs", "Punchs"],["catalogue", "Catalogue 3 prix"],["documents", "Devis · Contrats · Factures"],
    ["outils", "Outils & assurances"],["ia", "Assistant IA"]
  ] : [
    ["punch", "Punch in / out"],["mes-heures", "Mes heures"],["mes-taches", "Mes tâches"],
    ...(can("mes-factures") ? [["mes-factures", "Mes factures"]] : []),
    ["profil", "Mon profil"]
  ];
  return `<div class="shell"><aside class="side">
    <div class="brand" style="margin-bottom:18px"><div class="mark">GM</div><strong>Grok Manager</strong></div>
    ${nav(items)}<div class="grow"></div>
    <div class="who"><b>${STATE.user.name}</b>${STATE.user.role} · ${STATE.user.type}<br>
    <button class="btn ghost sm" style="margin-top:10px;width:auto" onclick="logout()">Quitter</button></div>
    </aside><main class="main">${inner}${aiDock()}</main></div>`;
}

function pageTableau() {
  const hideMarge = !can("marges") && STATE.user.role !== "admin";
  return `<div class="top"><div><p class="muted">Portail administration</p><h2>Tableau de bord</h2></div><span class="badge ok">Géofence active</span></div>
    <div class="grid g4">
      <div class="card"><div class="kpi">Chantiers actifs<b>2</b></div></div>
      <div class="card"><div class="kpi">Équipe sur site<b>1 / 4</b></div></div>
      <div class="card ${hideMarge?"lock":""}"><div class="kpi">Marge brute sem.<b>41 %</b></div></div>
      <div class="card ${hideMarge?"lock":""}"><div class="kpi">À facturer<b>${money(6420)}</b></div></div>
    </div>
    ${hideMarge ? `<p class="note">Les marges sont masquées pour le rôle ${STATE.user.role}.</p>` : ""}
    <div class="card" style="margin-top:16px"><table class="table">
      <tr><th>Projet</th><th>Statut</th><th>Pi²</th><th>GPS</th></tr>
      ${DATA.projets.map(p=>`<tr><td>${p.nom}</td><td><span class="badge ok">${p.statut}</span></td><td>${p.pi2}</td><td class="muted">${p.geo} · ${p.rayon}</td></tr>`).join("")}
    </table></div>`;
}
function pageProjets() {
  return `<div class="top"><div><p class="muted">Géolocalisation anti-douche</p><h2>Projets</h2></div><button class="btn sm">+ Nouveau projet</button></div>
    <div class="grid g2">${DATA.projets.map(p=>`<div class="card">
      <div class="kpi">${p.id}</div><h3 style="margin:6px 0 10px">${p.nom}</h3>
      <p class="muted">${p.client} · ${p.pi2} pi²</p>
      <p style="margin:10px 0">GPS ${p.geo} — rayon ${p.rayon}</p>
      <p><b>Tâches</b> ${p.taches.join(" · ")}</p>
      <p class="muted">Outils requis : ${p.outils.join(", ")}</p></div>`).join("")}</div>`;
}
function pageEquipe() {
  return `<div class="top"><h2>Équipe & accès</h2><button class="btn sm">+ Personne</button></div>
    <div class="card"><table class="table"><tr><th>Nom</th><th>Type</th><th>Taux</th><th>Accès</th></tr>
    ${DATA.equipe.map(e=>`<tr><td>${e.nom}</td><td>${e.type}</td><td>${typeof e.taux==="number"?money(e.taux)+"/h":e.taux}</td><td>${e.acces}</td></tr>`).join("")}
    </table><p class="note">Salarié = heures + OT Alberta. Sous-traitant = ses invoices seulement.</p></div>`;
}
function pagePunchs() {
  return `<div class="top"><h2>Punchs du jour</h2></div><div class="card"><table class="table">
    <tr><th>Qui</th><th>Projet</th><th>In</th><th>Out</th><th>GPS</th></tr>
    <tr><td>Alex Tremblay</td><td>P-104</td><td>07:12</td><td>—</td><td><span class="badge ok">Dans le rayon</span></td></tr>
    <tr><td>Marco Siding</td><td>—</td><td>—</td><td>—</td><td><span class="badge warn">Pas punché</span></td></tr>
  </table></div>`;
}
function pageCatalogue() {
  const hide = !can("marges") && STATE.user.role !== "admin" && STATE.user.role !== "comptable";
  return `<div class="top"><h2>Catalogue</h2><button class="btn sm">+ Produit</button></div>
    <div class="card ${hide?"lock":""}"><table class="table">
    <tr><th>SKU</th><th>Produit</th><th>Fournisseur</th><th>Sous-traitant</th><th>Client</th><th>Marge</th></tr>
    ${DATA.catalogue.map(c=>{ const m=((c.client-c.four)/c.client*100).toFixed(0); return `<tr><td>${c.sku}</td><td>${c.nom}</td><td>${money(c.four)}</td><td>${money(c.sous)}</td><td>${money(c.client)}</td><td>${m}%</td></tr>`; }).join("")}
    </table></div>${hide?`<p class="note">Prix et marges masqués.</p>`:""}`;
}
function pageDocuments() {
  return `<div class="top"><h2>Papiers officiels</h2><div class="row">
    <button class="btn sm">Soumission</button><button class="btn sm ghost">Contrat</button><button class="btn sm ghost">Facture</button></div></div>
    <div class="grid g2"><div class="card"><table class="table">
    ${DATA.docs.map(d=>`<tr><td>${d.type} ${d.no}</td><td>${d.projet}</td><td>${money(d.montant)}</td><td><span class="badge ok">${d.statut}</span></td></tr>`).join("")}
    </table></div>
    <div class="doc"><div class="wm">GROK MANAGER</div>
      <p class="muted">HAILITE · Calgary</p><h3>Facture FAC-391</h3>
      <p>Projet P-101 · Forest Lawn</p>
      <p style="margin-top:16px">Vinyle + main-d’œuvre<br><b>${money(6420)} CAD</b></p>
      <p class="muted" style="margin-top:20px">Filigrane + en-tête pro.</p></div></div>`;
}
function pageOutils() {
  return `<div class="top"><h2>Registre d’outils</h2><button class="btn sm">+ Outil + photo facture</button></div>
    <div class="card"><table class="table"><tr><th>ID</th><th>Outil</th><th>Année</th><th>Facture</th><th>Photo</th></tr>
    ${DATA.outils.map(o=>`<tr><td>${o.id}</td><td>${o.nom}</td><td>${o.annee}</td><td>${o.facture}</td><td>${o.photo?"Oui":"À ajouter"}</td></tr>`).join("")}
    </table><p class="note">Dossier vol / assurance prêt police.</p></div>`;
}
function pageIA() {
  return `<div class="top"><h2>Assistant IA</h2></div><div class="card"><p>Rédige soumissions, relances, factures sous-traitant, résume les punchs.</p></div>`;
}
function pagePunch() {
  const on = STATE.punched;
  return `<div class="top"><div><p class="muted">Portail employé — données perso seulement</p><h2>Punch</h2></div></div>
    <div class="card punch"><p class="muted">P-104 Abbeydale · rayon 120 m</p>
    <p style="margin:8px 0 18px" class="${STATE.geoOk?"ok":"bad"}">${STATE.geoOk?"Position OK — tu es sur le chantier":"Hors zone — punch bloqué"}</p>
    <button class="punch-btn" onclick="togglePunch()">${on?"PUNCH OUT":"PUNCH IN"}</button>
    <p class="muted" style="margin-top:16px">${on?"En job depuis 07:12":"Pas encore punché"}</p></div>`;
}
function pageMesHeures() {
  return `<div class="top"><h2>Mes heures</h2></div><div class="card"><table class="table">
    <tr><th>Date</th><th>Projet</th><th>In</th><th>Out</th><th>Total</th></tr>
    <tr><td>15 sept</td><td>P-104</td><td>07:12</td><td>16:05</td><td>8.9 h</td></tr>
    </table><p class="note">Pas d’accès aux heures des autres.</p></div>`;
}
function pageMesTaches() {
  return `<div class="top"><h2>Mes tâches</h2></div><div class="card"><p>P-104 · Soffit garage</p><p class="muted">Outils : échafaud, scie à onglet.</p></div>`;
}
function pageMesFactures() {
  return `<div class="top"><h2>Mes factures</h2><button class="btn sm">+ Invoice auto</button></div>
    <div class="doc"><div class="wm">SOUS-TRAITANT</div>
    <h3>Invoice Marco Siding</h3><p>P-104 · 32 h × ${money(42)}</p><p><b>${money(1344)}</b></p>
    <p class="muted">Générée depuis tes punchs.</p></div>`;
}
function pageProfil() {
  return `<div class="top"><h2>Mon profil</h2></div><div class="card"><p>${STATE.user.name}</p><p class="muted">${STATE.user.type} · rôle ${STATE.user.role}</p></div>`;
}
function render() {
  const root = document.getElementById("app");
  if (!STATE.user) { root.innerHTML = loginView(); return; }
  const map = {
    tableau: pageTableau, projets: pageProjets, equipe: pageEquipe, punchs: pagePunchs,
    catalogue: pageCatalogue, documents: pageDocuments, outils: pageOutils, ia: pageIA,
    punch: pagePunch, "mes-heures": pageMesHeures, "mes-taches": pageMesTaches,
    "mes-factures": pageMesFactures, profil: pageProfil
  };
  root.innerHTML = shell((map[STATE.page] || pageTableau)());
}
render();
