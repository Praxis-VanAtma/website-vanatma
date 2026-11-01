/* Archetypen-Kreis – 18 Situationen, Auswertung, Schritt „Spüren“, Ergebnis als Perlenkreis und PDF. Alles bleibt im Browser. */
(function () {
  var dataEl = document.getElementById('ak-data');
  if (!dataEl) return;
  var D = JSON.parse(dataEl.textContent);
  var ARC = D.archetypes, QS = D.questions, N = QS.length, PICK = 3, TOPN = 5;
  var BY = {}; ARC.forEach(function (a, i) { a.i = i; BY[a.id] = a; });
  var KEY = 'vanatma-archetypenkreis-v1', NS = 'http://www.w3.org/2000/svg';

  // ---------- Zustand ----------
  function fresh(name) { return { phase: 'intro', seed: (Math.random() * 1e9) | 0, ans: [], sel: null, chosen: [], name: name || '' }; }
  var state = fresh();
  try { var sv = JSON.parse(localStorage.getItem(KEY) || 'null'); if (sv && sv.phase && Array.isArray(sv.ans)) state = sv; } catch (e) {}
  function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} }
  function esc(t) { return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function r1(n) { return Math.round(n * 10) / 10; }
  function full(a) { return a.name + (a.alt ? ' (' + a.alt + ')' : ''); }

  // ---------- Auswertung ----------
  function scores() {
    var s = {}, best = {}, worst = {};
    ARC.forEach(function (a) { s[a.id] = 0; best[a.id] = 0; worst[a.id] = 0; });
    state.ans.forEach(function (x) { s[x.b] += 2; best[x.b]++; s[x.w] -= 1; worst[x.w]++; });
    var ranked = ARC.map(function (a) { return a.id; }).sort(function (x, y) {
      return (s[y] - s[x]) || (best[y] - best[x]) || (worst[x] - worst[y]) || (BY[x].i - BY[y].i);
    });
    var top = ranked.slice(0, TOPN), cut = s[ranked[TOPN - 1]];
    for (var i = TOPN; i < ranked.length && top.length < 7; i++) if (s[ranked[i]] === cut) top.push(ranked[i]);
    return { s: s, ranked: ranked, top: top };
  }
  function quietOf(sc, chosen) { for (var i = sc.ranked.length - 1; i >= 0; i--) if (chosen.indexOf(sc.ranked[i]) < 0) return sc.ranked[i]; return null; }
  function chosenSorted(sc) { return state.chosen.slice().sort(function (a, b) { return sc.ranked.indexOf(a) - sc.ranked.indexOf(b); }); }

  // ---------- Perlenkreis ----------
  // opts: { p: id-Präfix, top: [], chosen: [], quiet: id, s: Punkte, pdf: true }
  var R = 200;
  function pos(i, r) { var t = (i * 30 - 90) * Math.PI / 180; return [Math.cos(t) * r, Math.sin(t) * r]; }
  function ringSVG(o) {
    o = o || {}; var p = o.p || 'ak', pdf = !!o.pdf;
    var top = o.top || [], ch = o.chosen || [], focus = o.feel ? top : ch.length ? ch : top, res = ch.length && !o.feel;
    var ink = pdf ? '#2c2b19' : 'var(--ink)', muted = pdf ? '#6b6748' : 'var(--muted)', gold = '#b39a5a';
    var out = '<defs>' +
      '<radialGradient id="' + p + '-moss" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#f4f2e3" class="ak-m1"/><stop offset=".72" stop-color="#e3e6cb" class="ak-m2"/><stop offset="1" stop-color="#e3e6cb" stop-opacity="0" class="ak-m2"/></radialGradient>' +
      '<radialGradient id="' + p + '-shine" cx=".34" cy=".3" r=".75"><stop offset="0" stop-color="#fff" stop-opacity=".8"/><stop offset=".32" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".28"/></radialGradient>' +
      '<radialGradient id="' + p + '-halo"><stop offset="0" stop-color="#fff3c4" stop-opacity=".95"/><stop offset=".45" stop-color="#f6dd92" stop-opacity=".45"/><stop offset="1" stop-color="#f6dd92" stop-opacity="0"/></radialGradient></defs>';
    if (pdf) out += '<rect x="-440" y="-300" width="880" height="600" fill="#ffffff"/>';
    out += '<circle r="292" fill="url(#' + p + '-moss)"/>';
    // Phasen: Bögen und Namen im Inneren
    [['Vorbereitung', 0], ['Reise', 4], ['Rückkehr', 8]].forEach(function (ph) {
      var a0 = (ph[1] * 30 - 90 - 12) * Math.PI / 180, a1 = ((ph[1] + 3) * 30 - 90 + 12) * Math.PI / 180, rr = 150;
      out += '<path d="M' + r1(Math.cos(a0) * rr) + ',' + r1(Math.sin(a0) * rr) + ' A' + rr + ',' + rr + ' 0 0 1 ' + r1(Math.cos(a1) * rr) + ',' + r1(Math.sin(a1) * rr) + '" fill="none" stroke="' + gold + '" stroke-opacity=".45" stroke-width="1.2" stroke-dasharray="2 5"/>';
      var m = pos(ph[1] + 1.5, 112);
      out += '<text x="' + r1(m[0]) + '" y="' + r1(m[1] + 4) + '" text-anchor="middle" font-family="Jost, Futura, \'Century Gothic\', sans-serif" font-size="12.5" letter-spacing="2.4" style="fill:' + muted + '" fill-opacity=".85">' + ph[0].toUpperCase() + '</text>';
    });
    // Faden und Zwischenperlen
    out += '<circle r="' + R + '" fill="none" stroke="' + gold + '" stroke-width="2.2"/>';
    for (var k = 0; k < 12; k++) { var q = pos(k + 0.5, R); out += '<circle cx="' + r1(q[0]) + '" cy="' + r1(q[1]) + '" r="4.2" fill="' + gold + '"/>'; }
    // Mitte
    out += '<circle r="9" fill="' + gold + '"/><circle r="9" fill="url(#' + p + '-shine)"/>';
    var mx = 1; if (o.s) ARC.forEach(function (a) { mx = Math.max(mx, o.s[a.id]); });
    ARC.forEach(function (a, i) {
      var c = pos(i, R), isC = ch.indexOf(a.id) >= 0, isT = top.indexOf(a.id) >= 0, dim = focus.length && focus.indexOf(a.id) < 0;
      var lit = isT && !res, rad = isC ? 33 : lit ? 27 : 21;
      if (o.s && !isC && res) rad = 15 + 7 * Math.max(0, o.s[a.id]) / mx;
      var cls = 'ak-bead' + (isC ? ' is-c' : '') + (isT ? ' is-t' : '') + (dim ? ' is-dim' : '') + (o.quiet === a.id ? ' is-q' : '');
      out += '<g class="' + cls + '" data-id="' + a.id + '" style="--i:' + i + '"' + (o.click && isT ? ' role="button" tabindex="0" aria-label="' + esc(full(a)) + '"' : '') + '>';
      if (isC || lit) out += '<circle class="ak-halo' + (isC ? ' big' : '') + '" cx="' + r1(c[0]) + '" cy="' + r1(c[1]) + '" r="' + (isC ? 66 : 50) + '" fill="url(#' + p + '-halo)"/>';
      out += '<circle cx="' + r1(c[0]) + '" cy="' + r1(c[1]) + '" r="' + r1(rad) + '" fill="' + a.color + '"' + (dim ? ' fill-opacity=".55"' : '') + '/>';
      out += '<circle cx="' + r1(c[0]) + '" cy="' + r1(c[1]) + '" r="' + r1(rad) + '" fill="url(#' + p + '-shine)"/>';
      if (o.quiet === a.id) out += '<circle cx="' + r1(c[0]) + '" cy="' + r1(c[1]) + '" r="' + r1(rad + 7) + '" fill="none" stroke="' + gold + '" stroke-width="1.6" stroke-dasharray="3 4"/>';
      // Beschriftung außen
      var L = pos(i, R + rad + 16), cs = Math.cos((i * 30 - 90) * Math.PI / 180), anc = Math.abs(cs) < 0.2 ? 'middle' : cs > 0 ? 'start' : 'end';
      var sn = Math.sin((i * 30 - 90) * Math.PI / 180), y = L[1] + (sn > 0.5 ? 14 : sn < -0.5 ? -8 : 5);
      var strong = isC || lit, fs = strong ? 17 : 14.5;
      if (pdf) fs *= 0.88;
      out += '<text x="' + r1(L[0]) + '" y="' + r1(y) + '" text-anchor="' + anc + '" font-family="Jost, Futura, \'Century Gothic\', sans-serif" font-size="' + fs + '" letter-spacing="' + r1(fs * .12) + '" font-weight="' + (strong ? 500 : 400) + '" style="fill:' + ink + '"' + (dim ? ' fill-opacity=".5"' : '') + '>' + esc(a.name.toUpperCase()) + '</text>';
      if (a.alt) out += '<text x="' + r1(L[0]) + '" y="' + r1(y + fs * 1.05) + '" text-anchor="' + anc + '" font-family="Mulish, \'Segoe UI\', sans-serif" font-size="11.5" font-style="italic" style="fill:' + muted + '"' + (dim ? ' fill-opacity=".5"' : '') + '>(' + esc(a.alt) + ')</text>';
      out += '</g>';
    });
    return out;
  }

  // ---------- Elemente ----------
  var $ = function (id) { return document.getElementById(id); };
  var PH = { intro: $('ak-intro'), q: $('ak-q'), feel: $('ak-feel'), res: $('ak-res') };
  function show(p) { state.phase = p; save(); Object.keys(PH).forEach(function (k) { PH[k].hidden = k !== p; }); }
  function scrollTop() { $('kreis').scrollIntoView({ behavior: 'smooth', block: 'start' }); }

  $('ak-ring-i').innerHTML = ringSVG({ p: 'aki' });
  $('ak-start').addEventListener('click', function () { if (state.ans.length >= N) { feel(); } else { show('q'); ask(); } scrollTop(); });

  // ---------- Situationen ----------
  var ansEl = $('ak-ans'), prog = $('ak-prog');
  for (var j = 0; j < N; j++) prog.appendChild(document.createElement('span'));
  function order(qi) {
    var a = QS[qi].a.slice(), rand = rng(state.seed + qi * 7919);
    for (var i = a.length - 1; i > 0; i--) { var k = Math.floor(rand() * (i + 1)); var t = a[i]; a[i] = a[k]; a[k] = t; }
    return a;
  }
  var busy = false;
  function ask() {
    var qi = state.ans.length; if (qi >= N) { feel(); return; }
    $('ak-count').textContent = 'Situation ' + (qi + 1) + ' von ' + N;
    $('ak-scene').textContent = QS[qi].q;
    $('ak-ask').innerHTML = state.sel ? 'Und was passt <b>am wenigsten</b> zu dir?' : 'Was passt <b>am ehesten</b> zu dir?';
    PH.q.classList.toggle('worst', !!state.sel);
    prog.querySelectorAll('span').forEach(function (s, i) { s.className = i < qi ? 'on' : i === qi ? 'now' : ''; });
    ansEl.innerHTML = '';
    order(qi).forEach(function (x) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'ak-a'; b.dataset.id = x[0];
      b.innerHTML = '<span class="ak-atxt">' + esc(x[1]) + '</span><span class="ak-tag"></span>';
      if (state.sel === x[0]) { b.classList.add('best'); b.querySelector('.ak-tag').textContent = 'am ehesten'; }
      b.addEventListener('click', function () { pick(x[0], b); });
      ansEl.appendChild(b);
    });
    ansEl.classList.remove('swap'); void ansEl.offsetWidth; ansEl.classList.add('swap');
  }
  function pick(id, b) {
    if (busy) return;
    if (!state.sel) { state.sel = id; save(); ask(); return; }
    if (state.sel === id) { state.sel = null; save(); ask(); return; }
    b.classList.add('worst'); b.querySelector('.ak-tag').textContent = 'am wenigsten';
    state.ans.push({ b: state.sel, w: id }); state.sel = null; save(); busy = true;
    setTimeout(function () { busy = false; if (state.ans.length >= N) { feel(); scrollTop(); } else ask(); }, 420);
  }
  $('ak-back').addEventListener('click', function () {
    if (busy) return;
    if (state.sel) state.sel = null;
    else if (state.ans.length) { var last = state.ans.pop(); state.sel = last.b; }
    else { show('intro'); save(); return; }
    save(); ask();
  });

  // ---------- Spüren ----------
  var topEl = $('ak-top'), pc = $('ak-pcount'), conf = $('ak-confirm');
  function feel() {
    var sc = scores();
    state.chosen = state.chosen.filter(function (id) { return sc.top.indexOf(id) >= 0; });
    show('feel');
    topEl.innerHTML = '';
    sc.top.forEach(function (id) {
      var a = BY[id], b = document.createElement('button'); b.type = 'button'; b.className = 'ak-pick'; b.dataset.id = id;
      b.style.setProperty('--c', a.color);
      b.innerHTML = '<span class="ak-dot"></span><span><b>' + esc(a.name) + (a.alt ? ' <small>(' + esc(a.alt) + ')</small>' : '') + '</b><span class="ak-ess">' + esc(a.essence) + '</span></span>';
      b.addEventListener('click', function () { toggle(id); });
      topEl.appendChild(b);
    });
    updFeel(sc);
  }
  function toggle(id) {
    var at = state.chosen.indexOf(id);
    if (at >= 0) state.chosen.splice(at, 1);
    else if (state.chosen.length < PICK) state.chosen.push(id);
    else { pc.classList.remove('nudge'); void pc.offsetWidth; pc.classList.add('nudge'); return; }
    save(); updFeel(scores());
  }
  function updFeel(sc) {
    topEl.querySelectorAll('.ak-pick').forEach(function (b) { b.setAttribute('aria-pressed', state.chosen.indexOf(b.dataset.id) >= 0 ? 'true' : 'false'); });
    topEl.classList.toggle('full', state.chosen.length === PICK);
    pc.innerHTML = '<b>' + state.chosen.length + '</b> von ' + PICK + ' gewählt';
    conf.disabled = state.chosen.length !== PICK;
    $('ak-ring-f').innerHTML = ringSVG({ p: 'akf', top: sc.top, chosen: state.chosen, click: true, feel: true });
  }
  $('ak-ring-f').addEventListener('click', function (e) { var g = e.target.closest && e.target.closest('.ak-bead.is-t'); if (g) toggle(g.dataset.id); });
  $('ak-ring-f').addEventListener('keydown', function (e) { var g = e.target.closest && e.target.closest('.ak-bead.is-t'); if (g && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); toggle(g.dataset.id); } });
  conf.addEventListener('click', function () { result(); scrollTop(); });

  // ---------- Ergebnis ----------
  function result() {
    var sc = scores(), ch = chosenSorted(sc), qu = quietOf(sc, ch);
    show('res');
    var ring = $('ak-ring-r'); ring.innerHTML = ringSVG({ p: 'akr', chosen: ch, quiet: qu, s: sc.s });
    ring.classList.remove('lit'); void ring.getBoundingClientRect(); requestAnimationFrame(function () { ring.classList.add('lit'); });
    $('ak-three').innerHTML = ch.map(function (id, n) {
      var a = BY[id];
      return '<article class="ak-arc" style="--c:' + a.color + ';--n:' + n + '"><header><span class="ak-dot"></span><div><h3>' + esc(a.name) + (a.alt ? ' <small>(' + esc(a.alt) + ')</small>' : '') + '</h3><p class="ak-ess">' + esc(a.essence) + '</p></div></header>' +
        '<dl><div><dt>Grundantrieb</dt><dd>' + esc(a.drive) + '</dd></div><div><dt>Deine Gabe</dt><dd>' + esc(a.gift) + '</dd></div><div><dt>Im Schatten</dt><dd>' + esc(a.shadow) + '</dd></div><div><dt>Zum Nachspüren</dt><dd class="ak-qq">' + esc(a.question) + '</dd></div></dl></article>';
    }).join('');
    var q = BY[qu];
    $('ak-quiet').innerHTML = q ? '<span class="ak-dot" style="--c:' + q.color + '"></span><div><p class="eyebrow">Dein leiser Archetyp</p><h3>' + esc(full(q)) + '</h3><p>Diese Kraft ist bei dir gerade leise und darf wachsen. ' + esc(q.invite) + '</p></div>' : '';
  }
  $('ak-change').addEventListener('click', function () { feel(); scrollTop(); });
  var nm = $('ak-name'); nm.value = state.name || ''; nm.addEventListener('input', function () { state.name = nm.value; save(); });
  $('ak-reset').addEventListener('click', function () { state = fresh(state.name); save(); show('intro'); scrollTop(); });

  // Start
  if (state.phase === 'q' && state.ans.length < N) { show('q'); ask(); }
  else if ((state.phase === 'feel' || state.phase === 'q') && state.ans.length >= N) feel();
  else if (state.phase === 'res' && state.ans.length >= N && state.chosen.length === PICK) result();
  else show('intro');

  // ---------- Freiwillig teilen ----------
  var sf = $('ak-send'), sfStart = Date.now(), share = $('ak-share');
  if (share) share.addEventListener('toggle', function () { var fi = $('as-first'); if (share.open && !fi.value) fi.value = (state.name || '').trim(); });
  if (sf) sf.addEventListener('submit', function (e) {
    e.preventDefault();
    var o = $('as-out'), btn = sf.querySelector('button[type=submit]');
    var get = function (n) { var el = sf.elements[n]; return el ? el.value.trim() : ''; };
    var done = '<div class="form-done"><h3>Danke für dein Vertrauen!</h3><p>Dein Archetypen-Kreis ist bei uns angekommen. Wir melden uns persönlich bei dir.</p></div>';
    if (get('website') || Date.now() - sfStart < 3000) { sf.innerHTML = done; return; }
    if (!get('firstname') || !get('lastname') || !get('email')) { o.textContent = 'Bitte füll Vorname, Nachname und E-Mail aus.'; return; }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(get('email'))) { o.textContent = 'Bitte prüf deine E-Mail-Adresse.'; return; }
    if (!$('as-ok').checked) { o.textContent = 'Bitte bestätige kurz deine Einwilligung.'; return; }
    var list;
    if (state.ans.length >= N) {
      var sc = scores(), ch = chosenSorted(sc), qu = quietOf(sc, ch);
      list = (ch.length === PICK ? 'Meine drei Archetypen: ' + ch.map(function (id) { return BY[id].name; }).join(', ') + '\n' : '') +
        'Die fünf stärksten: ' + sc.top.map(function (id) { return BY[id].name + ' (' + sc.s[id] + ')'; }).join(', ') + '\n' +
        (qu ? 'Leiser Archetyp: ' + BY[qu].name : '');
    } else list = 'Noch in Bearbeitung: ' + state.ans.length + ' von ' + N + ' Situationen beantwortet.';
    var msg = (get('message') ? get('message') + '\n\n' : '') + 'Bitte um Kontaktaufnahme.\n\nArchetypen-Kreis' + ((state.name || '').trim() ? ' von ' + state.name.trim() : '') + ':\n' + list;
    var f = [['firstname', get('firstname')], ['lastname', get('lastname')], ['email', get('email')], ['telefonnummer', get('phone')], ['phone', get('phone')], ['nachricht', msg], ['message', msg]]
      .filter(function (x) { return x[1]; }).map(function (x) { return { objectTypeId: '0-1', name: x[0], value: x[1] }; });
    var body = { fields: f, context: { pageUri: location.href, pageName: document.title }, legalConsentOptions: { consent: { consentToProcess: true, text: $('as-ok-text').textContent.trim() } } };
    btn.disabled = true; o.textContent = 'Wird gesendet …';
    fetch('https://api.hsforms.com/submissions/v3/integration/submit/' + sf.dataset.portal + '/' + sf.dataset.form, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      .then(function (res) { if (!res.ok) throw res; return res.json(); })
      .then(function () { sf.innerHTML = done; })
      .catch(function (err) {
        if (err && err.json) err.json().then(function (j) { console.warn('HubSpot', j); }).catch(function () {});
        btn.disabled = false; o.innerHTML = 'Beim Senden ist etwas schiefgegangen. Schreib uns gern direkt an <a href="mailto:' + sf.dataset.to + '">' + sf.dataset.to + '</a>.';
      });
  });

  // ---------- PDF ----------
  var out = $('ak-out');
  $('ak-pdf').addEventListener('click', function () {
    var btn = this; btn.disabled = true; out.textContent = 'Dein Archetypen-Kreis wird gestaltet …';
    makePDF().then(function () { out.textContent = 'Fertig! Viel Freude mit deinem Archetypen-Kreis.'; })
      .catch(function (err) { console.error(err); out.textContent = 'Das PDF ließ sich gerade nicht erstellen. Bitte versuch es gleich noch einmal.'; })
      .then(function () { btn.disabled = false; });
  });
  function loadScript(src) { return new Promise(function (res, rej) { if (window.jspdf) return res(); var s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = rej; document.head.appendChild(s); }); }
  function toDataURL(src) { return fetch(src).then(function (r) { return r.blob(); }).then(function (b) { return new Promise(function (res) { var fr = new FileReader(); fr.onload = function () { res(fr.result); }; fr.readAsDataURL(b); }); }); }
  function ringJPG(o, px) {
    var h = Math.round(px * 600 / 880), s = '<svg xmlns="' + NS + '" viewBox="-440 -300 880 600" width="' + px + '" height="' + h + '">' + ringSVG(o) + '</svg>';
    return new Promise(function (res, rej) {
      var img = new Image();
      img.onload = function () { var c = document.createElement('canvas'); c.width = px; c.height = h; var g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, px, h); g.drawImage(img, 0, 0, px, h); res(c.toDataURL('image/jpeg', 0.9)); };
      img.onerror = rej; img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(s);
    });
  }
  function rgb(hex) { var n = parseInt(hex.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
  function makePDF() {
    if (state.ans.length < N || state.chosen.length !== PICK) return Promise.reject(new Error('unvollständig'));
    var sc = scores(), ch = chosenSorted(sc), qu = quietOf(sc, ch);
    return Promise.all([loadScript(D.jspdf), toDataURL(D.logo).catch(function () { return null; }), ringJPG({ p: 'akp', chosen: ch, quiet: qu, s: sc.s, pdf: true }, 1500)]).then(function (x) {
      var logo = x[1], img = x[2];
      var doc = new window.jspdf.jsPDF({ unit: 'mm', format: 'a4' });
      var W = 210, M = 18, TW = W - 2 * M, INK = [44, 43, 25], OLIVE = [127, 123, 47], DARK = [74, 73, 32], MUTED = [95, 92, 67], SAND = [244, 239, 225];
      var name = (state.name || '').trim(), today = new Date().toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' });
      function head() {
        if (logo) doc.addImage(logo, 'PNG', M, 12, 14, 14, 'logo', 'FAST');
        doc.setFont('helvetica', 'normal'); doc.setTextColor.apply(doc, INK); doc.setFontSize(15); doc.text('VanAtma', M + 18, 19);
        doc.setFontSize(7.5); doc.setTextColor.apply(doc, OLIVE); doc.setCharSpace(0.6); doc.text('PRAXIS FÜR NATURMEDIZIN UND BEWUSSTSEIN', M + 18, 24); doc.setCharSpace(0);
        doc.setDrawColor.apply(doc, OLIVE); doc.setLineWidth(0.3); doc.line(M, 31, W - M, 31);
      }
      function foot() {
        doc.setDrawColor(210, 204, 180); doc.setLineWidth(0.2); doc.line(M, 282, W - M, 282);
        doc.setFontSize(7.5); doc.setTextColor.apply(doc, MUTED);
        doc.text('VanAtma · ' + D.contact.street + ' · ' + D.contact.city + ' · ' + D.contact.email + ' · ' + D.contact.web, W / 2, 287, { align: 'center' });
      }
      function dot(a, xx, yy, r) { doc.setFillColor.apply(doc, rgb(a.color)); doc.circle(xx, yy, r, 'F'); }
      function para(t, xx, yy, w, fs, col) { doc.setFontSize(fs); doc.setTextColor.apply(doc, col); var l = doc.splitTextToSize(t, w); doc.text(l, xx, yy); return yy + l.length * fs * 0.42; }
      // Seite 1
      head(); foot();
      doc.setTextColor.apply(doc, DARK); doc.setFontSize(24);
      doc.text(name ? 'Der Archetypen-Kreis von ' + name : 'Mein Archetypen-Kreis', W / 2, 45, { align: 'center' });
      doc.setFontSize(9.5); doc.setTextColor.apply(doc, MUTED); doc.text('Erstellt am ' + today, W / 2, 51.5, { align: 'center' });
      var iw = 160, ih = iw * 600 / 880; doc.addImage(img, 'JPEG', (W - iw) / 2, 55, iw, ih);
      var y = 55 + ih + 6;
      doc.setFontSize(8); doc.setTextColor.apply(doc, OLIVE); doc.setCharSpace(0.6); doc.text('DEINE DREI ARCHETYPEN', M, y); doc.setCharSpace(0); y += 7;
      ch.forEach(function (id) {
        var a = BY[id];
        dot(a, M + 3, y - 1.5, 3);
        doc.setFontSize(13.5); doc.setTextColor.apply(doc, INK); doc.text(full(a), M + 9, y); y += 5.2;
        y = para(a.essence, M + 9, y, TW - 9, 10, MUTED) + 1.2;
        y = para('Deine Gabe: ' + a.gift, M + 9, y, TW - 9, 9.5, INK) + 0.6;
        y = para('Im Schatten: ' + a.shadow, M + 9, y, TW - 9, 9.5, INK) + 5;
      });
      // Seite 2
      doc.addPage(); head(); foot();
      y = 44; doc.setFontSize(18); doc.setTextColor.apply(doc, DARK); doc.text('Deinen Archetypen begegnen', M, y); y += 7;
      y = para('Nimm dir einen ruhigen Moment für jede deiner drei Kräfte. Lies die Frage, schließ kurz die Augen und schreib auf, was dir spontan in den Sinn kommt.', M, y, TW, 10, MUTED) + 5;
      ch.forEach(function (id) {
        var a = BY[id];
        dot(a, M + 2.5, y - 1.6, 2.5);
        doc.setFontSize(13); doc.setTextColor.apply(doc, INK); doc.text(a.name, M + 8, y); y += 6;
        doc.setFontSize(10); doc.setTextColor.apply(doc, MUTED); doc.text(a.question, M + 8, y); y += 7;
        for (var l = 0; l < 2; l++) { doc.setDrawColor(215, 209, 186); doc.setLineWidth(0.25); doc.line(M + 8, y, W - M, y); y += 7.5; }
        y += 2;
      });
      if (qu) {
        var q = BY[qu];
        dot(q, M + 2.5, y - 1.6, 2.5);
        doc.setFontSize(13); doc.setTextColor.apply(doc, INK); doc.text('Dein leiser Archetyp: ' + full(q), M + 8, y); y += 5.5;
        y = para('Diese Kraft ist bei dir gerade leise und darf wachsen. ' + q.invite, M + 8, y, TW - 8, 10, MUTED) + 3;
      }
      var evs = D.events || [], boxH = 46 + evs.length * 12; y = Math.max(y + 4, 270 - boxH);
      doc.setFillColor.apply(doc, SAND); doc.roundedRect(M, y, TW, boxH, 4, 4, 'F');
      var bx = M + 8, by = y + 10;
      doc.setFontSize(8); doc.setTextColor.apply(doc, OLIVE); doc.setCharSpace(0.6); doc.text('HERZLICH EINGELADEN', bx, by); doc.setCharSpace(0);
      by += 7; doc.setFontSize(15); doc.setTextColor.apply(doc, DARK); doc.text('Archetypen-Kreis in Trance', bx, by);
      by += 6.5; by = para('In einer Einzelsitzung begleitet dich Stephan Dietl in einer Trance oder Hypnose zu deinem inneren Archetypen-Kreis. Dort begegnest du deinen Kräften von innen, ganz in deinem Tempo.', bx, by, TW - 16, 10, INK) + 2.5;
      evs.forEach(function (e) {
        doc.setFontSize(10.5); doc.setTextColor.apply(doc, DARK); doc.textWithLink(e.title + (e.subtitle ? ' · ' + e.subtitle : ''), bx, by, { url: e.url });
        doc.setFontSize(9); doc.setTextColor.apply(doc, MUTED); doc.text(e.when + (e.where ? ' · ' + e.where : ''), bx, by + 4.4); by += 12;
      });
      doc.setFontSize(10); doc.setTextColor.apply(doc, INK);
      doc.textWithLink('Einzelsitzung anfragen: ' + D.contact.kontakt.replace(/^https?:\/\//, '').replace(/\/$/, ''), bx, by, { url: D.contact.kontakt });
      var ph = D.contact.phones.filter(function (p) { return /Stephan/.test(p.person); }); if (!ph.length) ph = D.contact.phones;
      doc.setFontSize(9); doc.setTextColor.apply(doc, MUTED); doc.text(ph.map(function (p) { return p.person + ' ' + p.display; }).join('   ·   '), bx, by + 5);
      doc.setFontSize(7.5); doc.setTextColor.apply(doc, MUTED);
      doc.text('Eine Übung zur Selbstreflexion für dein Wohlbefinden und deine persönliche Entwicklung, angelehnt an die zwölf Archetypen von Carol S. Pearson.', W / 2, 278, { align: 'center' });
      for (var p = 1; p <= 2; p++) { doc.setPage(p); doc.setFontSize(7.5); doc.setTextColor.apply(doc, MUTED); doc.text(p + ' / 2', W - M, 292, { align: 'right' }); }
      doc.save('Archetypen-Kreis' + (name ? '-' + name.replace(/[^\wäöüÄÖÜß-]+/g, '-') : '') + '.pdf');
    });
  }
})();
