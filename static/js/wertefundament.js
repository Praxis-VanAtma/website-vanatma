/* Wertefundament – fünf Werte wählen, im Abgleich ordnen, als Steinturm mitnehmen. Alles bleibt im Browser. */
(function () {
  var dataEl = document.getElementById('wf-data');
  if (!dataEl) return;
  var D = JSON.parse(dataEl.textContent);
  var VALUES = D.values, PICK = D.pick, TOP = Math.min(D.top, D.pick);
  var KEY = 'vanatma-wertefundament', NS = 'http://www.w3.org/2000/svg';
  var STONE = ['#6f6c58', '#878269', '#9d977d', '#b2ab91', '#c6bfa6'];
  var CAP = ['Dein Fundament', '', '', '', ''];

  // ---------- Zustand ----------
  var state = { phase: 'pick', picked: [], order: [], ans: {}, hist: [], name: '' };
  try { var sv = JSON.parse(localStorage.getItem(KEY) || 'null'); if (sv && sv.phase) state = sv; } catch (e) {}
  function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} }
  function esc(t) { return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function pk(a, b) { return a < b ? a + '|' + b : b + '|' + a; }
  function hash(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

  // ---------- Abgleich: der Sieger tritt gegen jeden an, jede Antwort wird gemerkt ----------
  var TOTAL = 0; for (var r = 0; r < TOP; r++) TOTAL += Math.max(0, PICK - 1 - r);
  function run() {
    var pool = state.order.slice(), ranked = [], steps = 0;
    while (ranked.length < TOP && pool.length) {
      var champ = pool[0];
      for (var i = 1; i < pool.length; i++) {
        var c = pool[i], k = pk(champ, c);
        if (!(k in state.ans)) return { q: [champ, c], ranked: ranked, steps: steps };
        champ = state.ans[k]; steps++;
      }
      ranked.push(champ); pool.splice(pool.indexOf(champ), 1);
    }
    return { done: true, ranked: ranked, rest: pool, steps: TOTAL };
  }

  // ---------- Elemente ----------
  var $ = function (id) { return document.getElementById(id); };
  var phPick = $('wf-pick'), phCmp = $('wf-compare'), phRes = $('wf-result');
  function show(p) { state.phase = p; save(); phPick.hidden = p !== 'pick'; phCmp.hidden = p !== 'compare'; phRes.hidden = p !== 'result'; }

  // ---------- Schritt 1: Kieselsteine ----------
  var peb = $('wf-pebbles'), cnt = $('wf-count'), go = $('wf-go');
  VALUES.forEach(function (v, i) {
    var b = document.createElement('button'); b.type = 'button'; b.className = 'wf-pebble'; b.textContent = v;
    var R = rng(hash(v)); b.style.borderRadius = [0, 0, 0, 0].map(function () { return Math.round(38 + R() * 24) + '%'; }).join(' ') + ' / ' + [0, 0, 0, 0].map(function () { return Math.round(40 + R() * 20) + '%'; }).join(' ');
    b.style.setProperty('--rot', ((R() - 0.5) * 4).toFixed(1) + 'deg');
    b.setAttribute('aria-pressed', state.picked.indexOf(v) >= 0 ? 'true' : 'false');
    b.addEventListener('click', function () {
      var at = state.picked.indexOf(v);
      if (at >= 0) state.picked.splice(at, 1);
      else if (state.picked.length < PICK) state.picked.push(v);
      else { cnt.classList.remove('nudge'); void cnt.offsetWidth; cnt.classList.add('nudge'); return; }
      b.setAttribute('aria-pressed', at >= 0 ? 'false' : 'true'); updPick(); save();
    });
    peb.appendChild(b);
  });
  function updPick() {
    var n = state.picked.length;
    cnt.innerHTML = '<b>' + n + '</b> von ' + PICK + ' gewählt';
    go.disabled = n !== PICK; peb.classList.toggle('full', n === PICK);
  }
  go.addEventListener('click', function () {
    var a = state.picked.slice();
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    state.order = a; state.ans = {}; state.hist = []; show('compare'); step(); scrollTop();
  });
  function scrollTop() { $('werte').scrollIntoView({ behavior: 'smooth', block: 'start' }); }

  // ---------- Schritt 2: Was ist dir wichtiger? ----------
  var A = $('wf-a'), B = $('wf-b'), duel = $('wf-duel'), cur = null;
  function step() {
    var s = run();
    $('wf-fill').style.width = Math.round(100 * s.steps / Math.max(1, TOTAL)) + '%';
    var f = $('wf-found'); f.innerHTML = '';
    for (var i = 0; i < TOP; i++) { var d = document.createElement('span'); if (i < s.ranked.length) { d.className = 'on'; d.title = (i + 1) + '. ' + s.ranked[i]; } f.appendChild(d); }
    if (s.done) { result(s); return; }
    cur = s.q; var flip = hash(pk(cur[0], cur[1])) % 2 === 1; if (flip) cur = [cur[1], cur[0]];
    $('wf-round').textContent = 'Platz ' + (s.ranked.length + 1) + ' von ' + TOP;
    duel.classList.remove('swap'); void duel.offsetWidth; duel.classList.add('swap');
    A.textContent = cur[0]; B.textContent = cur[1];
    [A, B].forEach(function (el) { el.style.setProperty('--fit', Math.min(1, 11 / el.textContent.length).toFixed(2)); });
  }
  function choose(w) {
    if (!cur) return; var k = pk(cur[0], cur[1]);
    state.ans[k] = w; state.hist.push(k); save();
    var btn = w === cur[0] ? A : B; btn.classList.add('chosen'); cur = null;
    setTimeout(function () { btn.classList.remove('chosen'); step(); }, 260);
  }
  A.addEventListener('click', function () { if (cur) choose(cur[0]); });
  B.addEventListener('click', function () { if (cur) choose(cur[1]); });
  document.addEventListener('keydown', function (e) {
    if (phCmp.hidden || !cur || /input|textarea/i.test((e.target.tagName || ''))) return;
    if (e.key === 'ArrowLeft') { e.preventDefault(); choose(cur[0]); }
    if (e.key === 'ArrowRight') { e.preventDefault(); choose(cur[1]); }
  });
  $('wf-back').addEventListener('click', function () {
    if (!state.hist.length) { show('pick'); updPick(); return; }
    delete state.ans[state.hist.pop()]; save(); step();
  });

  // ---------- Steinturm ----------
  function stonePath(w, h, seed) {
    var R = rng(seed), n = 12, pts = [];
    for (var i = 0; i < n; i++) {
      var a = i / n * Math.PI * 2, k = 1 + (R() - 0.5) * 0.09, s = Math.sin(a);
      var y = s * h / 2 * k * (s > 0 ? 0.86 : 0.96), x = Math.cos(a) * w / 2 * k;
      pts.push([x, y]);
    }
    var d = '';
    for (var j = 0; j < n; j++) {
      var p0 = pts[(j - 1 + n) % n], p1 = pts[j], p2 = pts[(j + 1) % n], p3 = pts[(j + 2) % n];
      if (!j) d += 'M' + r1(p1[0]) + ',' + r1(p1[1]);
      d += ' C' + r1(p1[0] + (p2[0] - p0[0]) / 6) + ',' + r1(p1[1] + (p2[1] - p0[1]) / 6) + ' ' + r1(p2[0] - (p3[0] - p1[0]) / 6) + ',' + r1(p2[1] - (p3[1] - p1[1]) / 6) + ' ' + r1(p2[0]) + ',' + r1(p2[1]);
    }
    return d + 'Z';
  }
  function r1(n) { return Math.round(n * 10) / 10; }
  function cairnSVG(ranked, opts) {
    var dims = [[300, 80], [256, 70], [214, 62], [176, 54], [142, 48]], dx = [0, -12, 9, -7, 5], rot = [-1.2, 2.2, -2.6, 1.8, -3];
    var o = '<defs><radialGradient id="wfl" cx=".35" cy=".25" r=".9"><stop offset="0" stop-color="#fff" stop-opacity=".38"/><stop offset=".55" stop-color="#fff" stop-opacity=".06"/><stop offset="1" stop-color="#000" stop-opacity=".18"/></radialGradient></defs>';
    var ground = 468;
    o += '<ellipse cx="0" cy="' + (ground + 4) + '" rx="190" ry="14" fill="#2c2b19" fill-opacity=".14"/>';
    [[-150, 1], [-128, -1], [132, 1], [158, -1], [-40, 1], [60, -1]].forEach(function (g, i) {
      var x = g[0], s = g[1];
      o += '<path d="M' + x + ',' + (ground + 6) + ' q' + (3 * s) + ',-12 ' + (8 * s) + ',-18 M' + (x + 4) + ',' + (ground + 6) + ' q' + (-2 * s) + ',-9 ' + (-1 * s) + ',-14 M' + (x + 8) + ',' + (ground + 6) + ' q' + (4 * s) + ',-7 ' + (10 * s) + ',-10" stroke="#6f7d3c" stroke-width="2.2" fill="none" stroke-linecap="round" opacity=".75"/>';
    });
    var y = ground, prevW = 380, FS = [20, 18, 16.5, 15, 14];
    ranked.forEach(function (v, i) {
      var need = v.length * FS[i] * 0.8 + 46;
      var w = Math.max(dims[i][0], Math.min(need, prevW - 16)), h = dims[i][1];
      prevW = w;
      var cy = y - h / 2 + (i ? 7 : 0);
      y = cy - h / 2 + 6;
      var col = STONE[i], txt = i < 3 ? '#f6f1e1' : '#2c2b19';
      var fs = Math.min(FS[i], (w - 38) / (v.length * 0.8));
      o += '<g class="wf-st" style="--d:' + (opts && opts.anim ? i * 0.3 : 0) + 's"><g transform="translate(' + dx[i] + ',' + r1(cy) + ') rotate(' + rot[i] + ')">' +
        '<path d="' + stonePath(w, h, hash(v)) + '" fill="' + col + '"/><path d="' + stonePath(w, h, hash(v)) + '" fill="url(#wfl)"/>' +
        '<text x="0" y="' + r1(fs * 0.36) + '" text-anchor="middle" font-family="Jost, Futura, \'Century Gothic\', sans-serif" font-size="' + r1(fs) + '" letter-spacing="' + r1(fs * 0.14) + '" fill="' + txt + '">' + esc(v.toUpperCase()) + '</text></g></g>';
    });
    return o;
  }

  // ---------- Schritt 3: Ergebnis ----------
  var lastRes = null;
  function result(s) {
    lastRes = s; show('result');
    var c = $('wf-cairn'); c.innerHTML = cairnSVG(s.ranked, { anim: true });
    c.classList.remove('built'); void c.getBoundingClientRect(); requestAnimationFrame(function () { c.classList.add('built'); });
    $('wf-rank').innerHTML = s.ranked.map(function (v, i) { return '<li style="--c:' + STONE[i] + '"><span class="n">' + (i + 1) + '</span><b>' + esc(v) + '</b>' + (CAP[i] ? '<small>' + CAP[i] + '</small>' : '') + '</li>'; }).join('');
    $('wf-more').textContent = s.rest && s.rest.length ? 'Ebenfalls wichtig für dich: ' + s.rest.join(', ') : '';
  }
  var nm = $('wf-name'); nm.value = state.name || ''; nm.addEventListener('input', function () { state.name = nm.value; save(); });
  $('wf-reset').addEventListener('click', function () {
    state = { phase: 'pick', picked: [], order: [], ans: {}, hist: [], name: state.name }; save();
    peb.querySelectorAll('.wf-pebble').forEach(function (b) { b.setAttribute('aria-pressed', 'false'); });
    updPick(); show('pick'); scrollTop();
  });

  // Start
  updPick();
  if (state.phase === 'compare' && state.order.length === PICK) { show('compare'); step(); }
  else if (state.phase === 'result' && state.order.length === PICK) { var rr = run(); if (rr.done) result(rr); else { show('compare'); step(); } }
  else show('pick');

  // ---------- Freiwillig teilen ----------
  var sf = $('wf-send'), sfStart = Date.now(), share = $('wf-share');
  if (share) share.addEventListener('toggle', function () { var fi = $('ws-first'); if (share.open && !fi.value) fi.value = (state.name || '').trim(); });
  if (sf) sf.addEventListener('submit', function (e) {
    e.preventDefault();
    var o = $('ws-out'), btn = sf.querySelector('button[type=submit]');
    var get = function (n) { var el = sf.elements[n]; return el ? el.value.trim() : ''; };
    var done = '<div class="form-done"><h3>Danke für dein Vertrauen!</h3><p>Dein Wertefundament ist bei uns angekommen. Wir melden uns persönlich bei dir.</p></div>';
    if (get('website') || Date.now() - sfStart < 3000) { sf.innerHTML = done; return; }
    if (!get('firstname') || !get('lastname') || !get('email')) { o.textContent = 'Bitte füll Vorname, Nachname und E-Mail aus.'; return; }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(get('email'))) { o.textContent = 'Bitte prüf deine E-Mail-Adresse.'; return; }
    if (!$('ws-ok').checked) { o.textContent = 'Bitte bestätige kurz deine Einwilligung.'; return; }
    var r = run(), list = r.done ? r.ranked.map(function (v, i) { return (i + 1) + '. ' + v; }).join('\n') : 'Gewählte Werte: ' + state.picked.join(', ');
    var msg = (get('message') ? get('message') + '\n\n' : '') + 'Bitte um Kontaktaufnahme.\n\nWertefundament' + ((state.name || '').trim() ? ' von ' + state.name.trim() : '') + ':\n' + list;
    var f = [['firstname', get('firstname')], ['lastname', get('lastname')], ['email', get('email')], ['telefonnummer', get('phone')], ['phone', get('phone')], ['nachricht', msg], ['message', msg]]
      .filter(function (x) { return x[1]; }).map(function (x) { return { objectTypeId: '0-1', name: x[0], value: x[1] }; });
    var body = { fields: f, context: { pageUri: location.href, pageName: document.title }, legalConsentOptions: { consent: { consentToProcess: true, text: $('ws-ok-text').textContent.trim() } } };
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
  var out = $('wf-out');
  $('wf-pdf').addEventListener('click', function () {
    var btn = this; btn.disabled = true; out.textContent = 'Dein Wertefundament wird gestaltet …';
    makePDF().then(function () { out.textContent = 'Fertig! Viel Freude mit deinem Steinturm.'; })
      .catch(function (err) { console.error(err); out.textContent = 'Das PDF ließ sich gerade nicht erstellen. Bitte versuch es gleich noch einmal.'; })
      .then(function () { btn.disabled = false; });
  });
  function loadScript(src) { return new Promise(function (res, rej) { if (window.jspdf) return res(); var s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = rej; document.head.appendChild(s); }); }
  function toDataURL(src) { return fetch(src).then(function (r) { return r.blob(); }).then(function (b) { return new Promise(function (res) { var fr = new FileReader(); fr.onload = function () { res(fr.result); }; fr.readAsDataURL(b); }); }); }
  function cairnJPG(ranked, px) {
    var s = '<svg xmlns="' + NS + '" viewBox="-235 150 470 345" width="' + px + '" height="' + Math.round(px * 345 / 470) + '">' + cairnSVG(ranked, {}) + '</svg>';
    return new Promise(function (res, rej) {
      var img = new Image();
      img.onload = function () { var c = document.createElement('canvas'); c.width = px; c.height = Math.round(px * 345 / 470); var x = c.getContext('2d'); x.fillStyle = '#ffffff'; x.fillRect(0, 0, c.width, c.height); x.drawImage(img, 0, 0, c.width, c.height); res(c.toDataURL('image/jpeg', 0.9)); };
      img.onerror = rej; img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(s);
    });
  }
  function hex(h) { h = h.replace('#', ''); return [parseInt(h.substr(0, 2), 16), parseInt(h.substr(2, 2), 16), parseInt(h.substr(4, 2), 16)]; }

  function makePDF() {
    var r = run(); if (!r.done) return Promise.reject(new Error('unvollständig'));
    return Promise.all([loadScript(D.jspdf), toDataURL(D.logo).catch(function () { return null; }), cairnJPG(r.ranked, 1200)]).then(function (x) {
      var logo = x[1], cairn = x[2];
      var doc = new window.jspdf.jsPDF({ unit: 'mm', format: 'a4' });
      var W = 210, M = 18, INK = [44, 43, 25], OLIVE = [127, 123, 47], DARK = [74, 73, 32], MUTED = [95, 92, 67], SAND = [244, 239, 225];
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

      // Seite 1
      head(); foot();
      doc.setTextColor.apply(doc, DARK); doc.setFontSize(24);
      doc.text(name ? 'Das Wertefundament von ' + name : 'Mein Wertefundament', W / 2, 45, { align: 'center' });
      doc.setFontSize(9.5); doc.setTextColor.apply(doc, MUTED); doc.text('Erstellt am ' + today, W / 2, 51.5, { align: 'center' });
      var iw = 96, ih = iw * 345 / 470; doc.addImage(cairn, 'JPEG', M - 4, 82, iw, ih);
      var lx = 118, ly = 72;
      doc.setFontSize(8); doc.setTextColor.apply(doc, OLIVE); doc.setCharSpace(0.6); doc.text('DAS TRÄGT DICH', lx, ly); doc.setCharSpace(0); ly += 10;
      r.ranked.forEach(function (v, i) {
        doc.setFillColor.apply(doc, hex(STONE[i])); doc.circle(lx + 4, ly - 1.6, 4, 'F');
        doc.setFontSize(10); doc.setTextColor(246, 241, 225); doc.text(String(i + 1), lx + 4, ly, { align: 'center' });
        doc.setFontSize(15); doc.setTextColor.apply(doc, INK); doc.text(v, lx + 12, ly);
        if (CAP[i]) { doc.setFontSize(8.5); doc.setTextColor.apply(doc, MUTED); doc.text(CAP[i], lx + 12, ly + 4.6); }
        ly += 15;
      });
      doc.setFontSize(10); doc.setTextColor.apply(doc, MUTED);
      doc.text(doc.splitTextToSize('Werte sind wie Steine, auf denen dein Leben ruht. Je bewusster du sie lebst, desto sicherer stehst du.', W - lx - M), lx, ly + 4);

      // Einladung
      var evs = D.events || [], y = 172, boxH = 42 + evs.length * 12;
      doc.setFillColor.apply(doc, SAND); doc.roundedRect(M, y, W - 2 * M, boxH, 4, 4, 'F');
      var bx = M + 8, by = y + 10;
      doc.setFontSize(8); doc.setTextColor.apply(doc, OLIVE); doc.setCharSpace(0.6); doc.text('HERZLICH EINGELADEN', bx, by); doc.setCharSpace(0);
      by += 7; doc.setFontSize(15); doc.setTextColor.apply(doc, DARK); doc.text('Wachsen in Begleitung', bx, by);
      by += 6.5; doc.setFontSize(10); doc.setTextColor.apply(doc, INK);
      var it = doc.splitTextToSize('Wenn du deinen Werten mehr Raum in deinem Leben geben möchtest, begleiten wir dich gern, im persönlichen Gespräch oder bei einer unserer Veranstaltungen in Sankt Englmar.', W - 2 * M - 16);
      doc.text(it, bx, by); by += it.length * 4.8 + 2.5;
      evs.forEach(function (e) {
        doc.setFontSize(10.5); doc.setTextColor.apply(doc, DARK); doc.textWithLink(e.title + (e.subtitle ? ' · ' + e.subtitle : ''), bx, by, { url: e.url });
        doc.setFontSize(9); doc.setTextColor.apply(doc, MUTED); doc.text(e.when + (e.where ? ' · ' + e.where : ''), bx, by + 4.4); by += 12;
      });
      doc.setFontSize(10); doc.setTextColor.apply(doc, INK);
      doc.textWithLink('Persönliches Kennenlernen: ' + D.contact.kontakt.replace(/^https?:\/\//, '').replace(/\/$/, ''), bx, by, { url: D.contact.kontakt });
      doc.setFontSize(9); doc.setTextColor.apply(doc, MUTED); doc.text(D.contact.phones.map(function (p) { return p.person + ' ' + p.display; }).join('   ·   '), bx, by + 5);

      // Seite 2: Nachspüren
      doc.addPage(); head(); foot();
      y = 44; doc.setFontSize(18); doc.setTextColor.apply(doc, DARK); doc.text('Mit deinen Werten leben', M, y); y += 7;
      doc.setFontSize(10); doc.setTextColor.apply(doc, MUTED);
      var intro = doc.splitTextToSize('Nimm dir einen ruhigen Moment für deine drei wichtigsten Werte. Schreib auf, was dir spontan in den Sinn kommt.', W - 2 * M);
      doc.text(intro, M, y); y += intro.length * 4.8 + 6;
      r.ranked.slice(0, 3).forEach(function (v, i) {
        doc.setFillColor.apply(doc, hex(STONE[i])); doc.ellipse(M + 3, y - 1.6, 3.2, 2.3, 'F');
        doc.setFontSize(14); doc.setTextColor.apply(doc, INK); doc.text(v, M + 9, y); y += 7;
        ['Wo lebst du ' + v + ' schon heute?', 'Woran würdest du merken, dass ' + v + ' noch mehr Raum in deinem Leben bekommt?', 'Ein kleiner Schritt für diese Woche:'].forEach(function (q) {
          doc.setFontSize(9.5); doc.setTextColor.apply(doc, MUTED); doc.text(q, M + 9, y); y += 8;
          doc.setDrawColor(215, 209, 186); doc.setLineWidth(0.25); doc.line(M + 9, y, W - M, y); y += 7.5;
        });
        y += 4;
      });
      doc.setFontSize(7.5); doc.setTextColor.apply(doc, MUTED);
      doc.text('Das Wertefundament ist eine Übung zur Selbstreflexion für dein Wohlbefinden und deine persönliche Entwicklung.', M, Math.min(y + 4, 276));
      for (var p = 1; p <= 2; p++) { doc.setPage(p); doc.setFontSize(7.5); doc.setTextColor.apply(doc, MUTED); doc.text(p + ' / 2', W - M, 292, { align: 'right' }); }
      doc.save('Wertefundament' + (name ? '-' + name.replace(/[^\wäöüÄÖÜß-]+/g, '-') : '') + '.pdf');
    });
  }
})();
