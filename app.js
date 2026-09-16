const KEY = "gm.v3";
const USERS = {
  admin: { pass: "admin", name: "Patrick", role: "admin", type: "salarie", portal: "admin", taux: 0 },
  comptable: { pass: "demo", name: "Comptable", role: "comptable", type: "salarie", portal: "admin", taux: 0 },
  secretaire: { pass: "demo", name: "Secrétaire", role: "secretaire", type: "salarie", portal: "admin", taux: 0 },
  employe: { pass: "demo", name: "Alex Tremblay", role: "employe", type: "salarie", portal: "staff", taux: 35 },
  soustraitant: { pass: "demo", name: "Marco Siding", role: "sous-traitant", type: "sous-traitant", portal: "staff", taux: 42 }
};
function seed() {
  return {
    cie: { nom: "Hailite Xteriors", ville: "Calgary, AB", slogan: "When hail hits… Hailite nails it.", otJour: 8, otSem: 44 },
    projets: [{ id: "P-104", nom: "Abbeydale — 12 Abalone", client: "Famille Roy", lat: 51.060, lng: -113.950, rayon: 150, pi2: 1840, taches: "Soffit garage\nFascia sud", outils: "Échafaud\nScie à onglet", statut: "Actif", hold: false, holdRaison: "" }],
    produits: [
      { sku: "VIN-D4", nom: "Vinyle D4 White", four: 1.85, sous: 2.4, client: 4.15, unite: "pi²" },
      { sku: "FAS-6", nom: "Fascia alu 6\"", four: 6.1, sous: 8.2, client: 14.5, unite: "pi lin." }
    ],
    outils: [
      { id: "OUT-12", nom: "Scie à onglet DeWalt", annee: "2023", facture: "HD-88421", site: "P-104", note: "Garage" },
      { id: "OUT-07", nom: "Échafaud Werner", annee: "2021", facture: "manquante", site: "P-104", note: "2 cadres" }
    ],
    docs: [{ id: "FAC-1001", type: "Facture", projet: "P-104", dest: "Famille Roy", montant: 6420, note: "Siding + soffit", date: "2026-09-15", relance: false }],
    photos: [{ projet: "P-104", mur: "Sud", type: "avant", note: "Grêle 2024", pi2: 420 }],
    punches: [], invoicesST: [], aiLog: []
  };
}
let DB = load(), USER = null, PAGE = "dash", POS = null, TOAST = "", MODAL = null, SEL = 0;
function load() { try { return Object.assign(seed(), JSON.parse(localStorage.getItem(KEY)) || {}); } catch { return seed(); } }
function save() { localStorage.setItem(KEY, JSON.stringify(DB)); }
function toast(m) { TOAST = m; render(); setTimeout(() => { TOAST = ""; render(); }, 2200); }
function money(n) { return new Intl.NumberFormat("fr-CA", { style: "currency", currency: "CAD" }).format(+n || 0); }
function uid(p) { return p + "-" + Math.random().toString(36).slice(2, 6).toUpperCase(); }
function can$() { return USER && (USER.role === "admin" || USER.role === "comptable"); }
function val(id) { const el = document.getElementById(id); return el ? el.value : ""; }
function esc(s) { return String(s || "").replace(/"/g, "&quot;"); }
function fmt(ts) { return new Date(ts).toLocaleString("fr-CA", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }); }
function haversine(a, b) {
  if (!a || !b) return 99999;
  const R = 6371000, to = x => x * Math.PI / 180;
  const dLat = to(b.lat - a.lat), dLng = to(b.lng - a.lng);
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(to(a.lat)) * Math.cos(to(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}
function locate(cb) {
  if (!navigator.geolocation) return toast("GPS non dispo");
  navigator.geolocation.getCurrentPosition(
    pos => { POS = { lat: pos.coords.latitude, lng: pos.coords.longitude }; if (cb) cb(); render(); },
    () => toast("GPS refusé")
  );
}
function fill(u, p) { document.getElementById("u").value = u; document.getElementById("p").value = p; }
function login() {
  const u = (document.getElementById("u").value || "").trim().toLowerCase();
  const f = USERS[u];
  if (!f || f.pass !== document.getElementById("p").value) return toast("Identifiant invalide");
  USER = { id: u, ...f }; PAGE = f.portal === "admin" ? "dash" : "punch"; render();
}
function logout() { USER = null; render(); }
function go(p) { PAGE = p; MODAL = null; render(); }
function otSplit(heures) {
  const cap = DB.cie.otJour || 8;
  return { reg: Math.min(heures, cap), ot: Math.max(0, heures - cap) };
}
function weekHours(name) {
  const now = Date.now();
  return DB.punches.filter(p => p.qui === name && p.out && (now - p.in) < 7 * 86400000).reduce((s, p) => s + (p.heures || 0), 0);
}
function table(rows, heads, map) {
  if (!rows.length) return `<p class="muted">Rien encore.</p>`;
  return `<table><tr>${heads.map(h => `<th>${h}</th>`).join("")}</tr>${rows.map(r => `<tr>${map(r).map(c => `<td>${c}</td>`).join("")}</tr>`).join("")}</table>`;
}
function openForm(title, fields, onsave) {
  window._saveModal = onsave;
  MODAL = `<div class="modal" onclick="if(event.target===this){MODAL=null;render()}"><div class="sheet"><h3>${title}</h3>${fields.map(f => `<label>${f.label}</label>${f.type === "textarea" ? `<textarea id="${f.id}">${f.val || ""}</textarea>` : f.type === "select" ? `<select id="${f.id}">${f.opts}</select>` : `<input id="${f.id}" type="${f.type || "text"}" value="${esc(f.val || "")}">`}`).join("")}<div class="row" style="margin-top:14px"><button class="btn sm" onclick="_saveModal()">Enregistrer</button><button class="btn ghost sm" onclick="MODAL=null;render()">Annuler</button></div></div></div>`;
  render();
}
function loginView() {
  return `<div class="login"><div class="login-card"><div class="brand"><div class="mark">GM</div><h1>Grok Manager</h1></div><p class="sub">Punch GPS, deux portails, 3 prix, OT Alberta, hold météo.</p><label>Identifiant</label><input id="u"><label>Mot de passe</label><input id="p" type="password"><div style="height:14px"></div><button class="btn block" onclick="login()">Entrer</button><div class="chips"><button class="chip" onclick="fill('admin','admin')"><b>Admin</b>admin / admin</button><button class="chip" onclick="fill('comptable','demo')"><b>Comptable</b>chiffres</button><button class="chip" onclick="fill('secretaire','demo')"><b>Secrétaire</b>pas les marges</button><button class="chip" onclick="fill('employe','demo')"><b>Employé</b>employe / demo</button><button class="chip" onclick="fill('soustraitant','demo')"><b>Sous-traitant</b>soustraitant / demo</button></div></div></div>`;
}
function shell(html) {
  const admin = USER.portal === "admin";
  const items = admin ? [["dash","Tableau"],["projets","Projets GPS"],["equipe","Équipe"],["punchs","Punchs + OT"],["catalogue","Catalogue"],["docs","Devis & factures"],["outils","Outils"],["photos","Photos murs"],["meteo","Hold météo"],["settings","Compagnie"]] : [["punch","Punch"],["heures","Mes heures"],...(USER.role === "sous-traitant" ? [["st","Mes invoices"]] : []),["taches","Mes tâches"]];
  return `<div class="shell"><aside class="side"><div class="brand" style="margin:4px 8px 14px"><div class="mark">GM</div><strong>Grok Manager</strong></div>${items.map(([id,l]) => `<button class="nav ${PAGE===id?"on":""}" onclick="go('${id}')">${l}</button>`).join("")}<div class="grow"></div><div class="who"><b>${USER.name}</b>${USER.role}<br><button class="btn ghost sm" style="margin-top:8px" onclick="logout()">Quitter</button></div></aside><main class="main">${html}${aiBox()}</main></div>${TOAST?`<div class="toast">${TOAST}</div>`:""}${MODAL||""}`;
}
function aiBox() {
  return `<aside class="ai"><b style="color:var(--gold2);font-size:13px">Assistant IA</b><p class="muted" style="font-size:12px;margin:6px 0">Soumission auto, résumé punchs.</p><div class="row"><button class="btn sm" onclick="aiQuote()">Soumission</button><button class="btn ghost sm" onclick="aiResume()">Résumé</button></div></aside>`;
}
function aiQuote() {
  const p = DB.projets[0]; if (!p) return toast("Pas de projet");
  const vin = DB.produits[0];
  const tot = (vin ? p.pi2 * vin.client : 0) + p.pi2 * 2.1;
  DB.docs.unshift({ id: uid("SOU"), type: "Soumission", projet: p.id, dest: p.client, montant: Math.round(tot), note: `IA · ${p.pi2} pi² × ${vin ? vin.nom : "mat"} + MO`, date: new Date().toISOString().slice(0,10), relance: false });
  save(); toast("Soumission IA " + money(tot)); go("docs");
}
function aiResume() {
  const n = DB.punches.length, h = DB.punches.reduce((s,p)=>s+(p.heures||0),0);
  toast(`${n} punchs · ${h.toFixed(1)} h · ${DB.projets.filter(p=>p.hold).length} hold`);
}
function avgMarge() {
  if (!DB.produits.length) return 0;
  return Math.round(DB.produits.map(p => (p.client-p.four)/Math.max(p.client,.01)*100).reduce((a,b)=>a+b,0)/DB.produits.length);
}
function pageDash() {
  const hide = !can$();
  const h = DB.punches.reduce((s,p)=>s+(p.heures||0),0);
  const fact = DB.docs.filter(d=>d.type==="Facture").reduce((s,d)=>s+d.montant,0);
  const att = DB.punches.filter(p=>p.out && !p.approved && p.type!=="sous-traitant").length;
  return `<div class="head"><div><p class="muted">${DB.cie.nom}</p><h2>Tableau de bord</h2></div><span class="badge ${att?"warn":"ok"}">${att} punch(s) à approuver</span></div><div class="grid g4"><div class="card"><div class="kpi">Projets<b>${DB.projets.filter(p=>p.statut!=="Clos").length}</b></div></div><div class="card"><div class="kpi">Heures<b>${h.toFixed(1)} h</b></div></div><div class="card ${hide?"lock":""}"><div class="kpi">Facturé<b>${money(fact)}</b></div></div><div class="card ${hide?"lock":""}"><div class="kpi">Marge cat.<b>${avgMarge()}%</b></div></div></div>${hide?`<p class="note">Chiffres masqués pour ${USER.role}.</p>`:""}<div class="card" style="margin-top:14px">${table(DB.projets,["id","nom","statut","pi²","météo"],p=>[p.id,p.nom,p.statut,p.pi2,p.hold?`<span class="badge warn">HOLD</span>`:`<span class="badge ok">OK</span>`])}</div>`;
}
function pageProjets() {
  return `<div class="head"><h2>Projets + géofence</h2><button class="btn sm" onclick="newProjet()">+ Projet</button></div><div class="grid g2">${DB.projets.map(p=>`<div class="card"><div class="kpi">${p.id} · ${p.statut} ${p.hold?"· HOLD":""}</div><h3 style="margin:6px 0">${p.nom}</h3><p class="muted">${p.client} · ${p.pi2} pi²</p><p>GPS ${(+p.lat).toFixed(4)}, ${(+p.lng).toFixed(4)} · rayon ${p.rayon} m</p><p><b>Tâches</b><br>${(p.taches||"").replace(/\n/g," · ")}</p><p class="muted">Outils : ${(p.outils||"").replace(/\n/g,", ")}</p></div>`).join("")}</div>`;
}
function newProjet() {
  openForm("Nouveau projet",[{id:"nom",label:"Nom chantier"},{id:"client",label:"Client"},{id:"pi2",label:"Pieds carrés",type:"number"},{id:"rayon",label:"Rayon GPS m",type:"number",val:"150"},{id:"taches",label:"Tâches",type:"textarea"},{id:"outils",label:"Outils requis",type:"textarea"}],()=>{
    const nom=val("nom"); if(!nom) return toast("Nom requis");
    const add=(lat,lng)=>{ DB.projets.unshift({id:uid("P"),nom,client:val("client"),lat,lng,rayon:+val("rayon")||150,pi2:+val("pi2")||0,taches:val("taches"),outils:val("outils"),statut:"Actif",hold:false}); save(); MODAL=null; toast("Projet créé"); render(); };
    if(POS) add(POS.lat,POS.lng); else locate(()=>add(POS?POS.lat:51.0447,POS?POS.lng:-114.0719));
  });
}
function pageEquipe() {
  return `<div class="head"><h2>Équipe & accès</h2></div><div class="card">${table(Object.entries(USERS).map(([id,u])=>({id,...u})),["compte","nom","rôle","type","taux"],u=>[u.id,u.name,u.role,u.type,u.taux?money(u.taux)+"/h":"—"])}</div><p class="note">Salarié : OT 1.5× après ${DB.cie.otJour}h/jour ou ${DB.cie.otSem}h/sem.</p>`;
}
function pagePunchs() {
  return `<div class="head"><h2>Punchs + overtime</h2></div><div class="card">${table(DB.punches.slice().reverse(),["qui","projet","in","h","rég","OT","ok"],p=>{const s=otSplit(p.heures||0);return[p.qui,p.projet,fmt(p.in),(p.heures||0).toFixed(2),s.reg.toFixed(2),s.ot?`<span class="badge warn">${s.ot.toFixed(2)}</span>`:"0",p.approved?"Oui":(p.out?`<button class="btn sm" onclick="approve('${p.in}')">OK</button>`:"ouvert")];})}</div>`;
}
function approve(id){ const p=DB.punches.find(x=>String(x.in)===String(id)); if(p){p.approved=true;save();toast("Punch approuvé");render();}}
function pageCatalogue() {
  const hide=!can$();
  return `<div class="head"><h2>Catalogue 3 prix</h2><button class="btn sm" onclick="newProd()">+ Produit</button></div><div class="card ${hide?"lock":""}">${table(DB.produits,["sku","nom","fournisseur","sous-traitant","client","marge"],p=>[p.sku,p.nom,money(p.four),money(p.sous),money(p.client),Math.round((p.client-p.four)/Math.max(p.client,.01)*100)+"%"])}</div>`;
}
function newProd(){ openForm("Produit",[{id:"sku",label:"SKU"},{id:"nom",label:"Nom"},{id:"four",label:"Prix fournisseur",type:"number"},{id:"sous",label:"Prix sous-traitant",type:"number"},{id:"client",label:"Prix client",type:"number"}],()=>{DB.produits.unshift({sku:val("sku")||uid("SKU"),nom:val("nom"),four:+val("four"),sous:+val("sous"),client:+val("client")});save();MODAL=null;toast("Produit ajouté");render();}); }
function pageDocs() {
  return `<div class="head"><h2>Devis · contrats · factures</h2><div class="row"><button class="btn sm" onclick="newDoc('Soumission')">Soumission</button><button class="btn ghost sm" onclick="newDoc('Contrat')">Contrat</button><button class="btn ghost sm" onclick="newDoc('Facture')">Facture</button></div></div><div class="grid g2"><div class="card">${table(DB.docs,["#","type","montant","relance"],d=>[d.id,d.type,money(d.montant),d.relance?"envoyée":`<button class="btn sm" onclick="relance('${d.id}')">Relancer</button>`])}</div>${previewDoc(DB.docs[SEL]||DB.docs[0])}</div>`;
}
function previewDoc(d){ if(!d) return `<div class="card muted">Aucun document.</div>`; return `<div class="doc"><div class="wm">${DB.cie.nom}</div><p class="muted">${DB.cie.nom} · ${DB.cie.ville}</p><h3>${d.type} ${d.id}</h3><p>${d.dest||""} · ${d.projet}</p><p style="margin-top:10px">${d.note||""}</p><p><b>${money(d.montant)}</b></p><p class="muted">${DB.cie.slogan}</p><button class="btn sm" style="margin-top:12px" onclick="window.print()">Imprimer / PDF</button></div>`; }
function newDoc(type){ const p0=DB.projets[0]; openForm(type,[{id:"projet",label:"Projet",val:p0?p0.id:""},{id:"dest",label:"Client"},{id:"montant",label:"Montant CAD",type:"number"},{id:"note",label:"Détail",type:"textarea"}],()=>{DB.docs.unshift({id:uid(type.slice(0,3).toUpperCase()),type,projet:val("projet"),dest:val("dest"),montant:+val("montant")||0,note:val("note"),date:new Date().toISOString().slice(0,10),relance:false});save();MODAL=null;toast(type+" créée");render();}); }
function relance(id){ const d=DB.docs.find(x=>x.id===id); if(d){d.relance=true;save();toast("Relance notée pour "+d.dest);render();} }
function pageOutils(){ return `<div class="head"><h2>Registre d'outils</h2><div class="row"><button class="btn sm" onclick="newOutil()">+ Outil</button><button class="btn ghost sm" onclick="exportAssurance()">Dossier assurance</button></div></div><div class="card">${table(DB.outils,["id","nom","année","facture","chantier"],o=>[o.id,o.nom,o.annee,o.facture,o.site||"—"])}</div>`; }
function newOutil(){ const opts=DB.projets.map(p=>`<option>${p.id}</option>`).join(""); openForm("Outil",[{id:"nom",label:"Nom / modèle"},{id:"annee",label:"Année"},{id:"facture",label:"# Facture"},{id:"site",label:"Chantier",type:"select",opts}],()=>{DB.outils.unshift({id:uid("OUT"),nom:val("nom"),annee:val("annee"),facture:val("facture"),site:val("site"),note:""});save();MODAL=null;toast("Outil enregistré");render();}); }
function exportAssurance(){ navigator.clipboard?.writeText(DB.outils.map(o=>`${o.id} | ${o.nom} | ${o.annee} | facture ${o.facture} | site ${o.site}`).join("\n")); toast("Liste copiée"); }
function pagePhotos(){ return `<div class="head"><h2>Photos murs + pi²</h2><button class="btn sm" onclick="newPhoto()">+ Entrée</button></div><div class="card">${table(DB.photos,["projet","mur","type","pi²","note"],p=>[p.projet,p.mur,p.type,p.pi2,p.note])}</div>`; }
function newPhoto(){ openForm("Mur",[{id:"projet",label:"Projet",val:DB.projets[0]?DB.projets[0].id:""},{id:"mur",label:"Mur"},{id:"type",label:"avant ou après",val:"avant"},{id:"pi2",label:"Pi²",type:"number"},{id:"note",label:"Note"}],()=>{DB.photos.unshift({projet:val("projet"),mur:val("mur"),type:val("type"),pi2:+val("pi2")||0,note:val("note")});save();MODAL=null;toast("Mur enregistré");render();}); }
function pageMeteo(){ return `<div class="head"><h2>Hold météo</h2></div><div class="grid">${DB.projets.map(p=>`<div class="card"><b>${p.nom}</b><p class="muted">${p.hold?"CHANTIER FERMÉ — "+(p.holdRaison||"météo"):"Ouvert"}</p><button class="btn sm" style="margin-top:8px" onclick="toggleHold('${p.id}')">${p.hold?"Rouvrir":"Hold"}</button></div>`).join("")}</div>`; }
function toggleHold(id){ const p=DB.projets.find(x=>x.id===id); if(!p) return; p.hold=!p.hold; p.holdRaison=p.hold?"Vent / pluie":""; save(); toast(p.hold?"Hold activé":"Chantier rouvert"); render(); }
function pageSettings(){ return `<div class="head"><h2>Compagnie</h2></div><div class="card"><label>Nom</label><input id="cnom" value="${esc(DB.cie.nom)}"><label>Ville</label><input id="cville" value="${esc(DB.cie.ville)}"><label>Slogan / filigrane</label><input id="cslogan" value="${esc(DB.cie.slogan)}"><label>OT heures / jour</label><input id="otj" type="number" value="${DB.cie.otJour}"><label>OT heures / semaine</label><input id="ots" type="number" value="${DB.cie.otSem}"><button class="btn sm" style="margin-top:12px" onclick="saveCie()">Sauver</button></div>`; }
function saveCie(){ DB.cie.nom=val("cnom"); DB.cie.ville=val("cville"); DB.cie.slogan=val("cslogan"); DB.cie.otJour=+val("otj")||8; DB.cie.otSem=+val("ots")||44; save(); toast("Compagnie à jour"); }
function openPunch(){
  const open=DB.punches.find(p=>p.qui===USER.name&&!p.out);
  const projet=DB.projets[0];
  const dist=projet&&POS?Math.round(haversine(POS,projet)):null;
  const ok=dist!=null&&dist<=(projet.rayon||150)&&!(projet&&projet.hold);
  return `<div class="head"><div><p class="muted">Portail personnel</p><h2>Punch</h2></div><button class="btn ghost sm" onclick="locate()">Localiser</button></div><div class="card punch"><p class="muted">${projet?projet.nom+" · "+projet.rayon+" m":"Aucun projet"}</p>${projet&&projet.hold?`<p class="badge warn">HOLD MÉTÉO</p>`:""}<p>${POS?POS.lat.toFixed(5)+", "+POS.lng.toFixed(5):"GPS pas encore lu"}</p><p class="${ok?"ok":"bad"}">${projet&&projet.hold?"Chantier fermé":dist==null?"Localise-toi":ok?dist+" m — OK":dist+" m — TROP LOIN"}</p><button class="pbtn" onclick="doPunch(${ok})">${open?"PUNCH OUT":"PUNCH IN"}</button><p class="muted">${open?"Depuis "+fmt(open.in):"Semaine : "+weekHours(USER.name).toFixed(1)+" h"}</p></div>`;
}
function doPunch(ok){
  if(!ok) return toast("Punch refusé (GPS ou hold)");
  const open=DB.punches.find(p=>p.qui===USER.name&&!p.out);
  const projet=DB.projets[0];
  if(open){ open.out=Date.now(); open.heures=Math.max(0,(open.out-open.in)/3600000); const s=otSplit(open.heures); toast("Out · "+open.heures.toFixed(2)+" h"+(s.ot?" dont OT "+s.ot.toFixed(2):"")); }
  else { DB.punches.push({qui:USER.name,type:USER.type,projet:projet?projet.id:"—",in:Date.now(),out:null,heures:0,ok:true,approved:false}); toast("Punch in"); }
  save(); render();
}
function pageHeures(){ const mine=DB.punches.filter(p=>p.qui===USER.name); const tot=mine.reduce((s,p)=>s+(p.heures||0),0); const ot=mine.reduce((s,p)=>s+otSplit(p.heures||0).ot,0); return `<div class="head"><h2>Mes heures</h2><span class="badge ok">${tot.toFixed(1)} h · OT ${ot.toFixed(1)}</span></div><div class="card">${table(mine.slice().reverse(),["projet","in","h","OT"],p=>{const s=otSplit(p.heures||0);return[p.projet,fmt(p.in),(p.heures||0).toFixed(2),s.ot.toFixed(2)];})}</div>`; }
function pageST(){ const h=DB.punches.filter(p=>p.qui===USER.name&&p.heures).reduce((s,p)=>s+p.heures,0); const taux=USER.taux||42; return `<div class="head"><h2>Mes invoices</h2><button class="btn sm" onclick="makeST(${h},${taux})">Générer</button></div><div class="doc"><div class="wm">SOUS-TRAITANT</div><p class="muted">${USER.name} → ${DB.cie.nom}</p><h3>Invoice</h3><p>${h.toFixed(2)} h × ${money(taux)}</p><p><b>${money(h*taux)}</b></p></div>`; }
function makeST(h,taux){ DB.invoicesST.unshift({date:new Date().toISOString().slice(0,10),h,total:h*taux}); save(); toast("Invoice créée"); render(); }
function pageTaches(){ const p=DB.projets[0]; return `<div class="head"><h2>Mes tâches</h2></div><div class="card">${p?`<b>${p.nom}</b><p>${(p.taches||"").replace(/\n/g,"<br>")}</p><p class="muted">Outils : ${p.outils||"—"}</p>${p.hold?`<p class="badge warn">HOLD</p>`:""}`:"Aucune"}</div>`; }
function render(){ const root=document.getElementById("app"); if(!USER){ root.innerHTML=loginView()+(TOAST?`<div class="toast">${TOAST}</div>`:""); return; } const map={dash:pageDash,projets:pageProjets,equipe:pageEquipe,punchs:pagePunchs,catalogue:pageCatalogue,docs:pageDocs,outils:pageOutils,photos:pagePhotos,meteo:pageMeteo,settings:pageSettings,punch:openPunch,heures:pageHeures,st:pageST,taches:pageTaches}; root.innerHTML=shell((map[PAGE]||pageDash)()); }
render();
