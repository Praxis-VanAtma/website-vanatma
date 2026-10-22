/* Wertesternbild – sieben Werte wählen, im Abgleich ordnen, als echtes Sternbild sehen. Alles bleibt im Browser. */
(function () {
  var dataEl = document.getElementById('wf-data');
  if (!dataEl) return;
  var D = JSON.parse(dataEl.textContent);
  var VALUES = D.values, PICK = D.pick, TOP = Math.min(D.top, D.pick);
  var KEY = 'vanatma-wertesternbild-v2', NS = 'http://www.w3.org/2000/svg';
  var STAR = ['#fff4cf', '#fbeec4', '#f6e6b8', '#efdcaa', '#e8d39f', '#e0ca95', '#d8c18c'];
  var STONE = STAR;

  // ---------- Zustand ----------
  var state = { phase: 'pick', picked: [], order: [], ans: {}, hist: [], name: '' };
  try { var sv = JSON.parse(localStorage.getItem(KEY) || 'null'); if (sv && sv.phase) state = sv; } catch (e) {}
  function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} }
  function esc(t) { return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function pk(a, b) { return a < b ? a + '|' + b : b + '|' + a; }
  function hash(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

  // ---------- Abgleich: jeder Wert mit jedem, jede Paarung genau einmal ----------
  // Reihenfolge der Paare nach dem Rundenturnier-Prinzip, damit sich die Werte abwechseln.
  function schedule(list) {
    var L = list.slice(); if (L.length % 2) L.push(null);
    var n = L.length, out = [];
    for (var r = 0; r < n - 1; r++) {
      for (var i = 0; i < n / 2; i++) { var a = L[i], b = L[n - 1 - i]; if (a && b) out.push(r % 2 ? [b, a] : [a, b]); }
      L.splice(1, 0, L.pop());
    }
    return out;
  }
  var TOTAL = PICK * (PICK - 1) / 2;
  function run() {
    var pairs = schedule(state.order), done = 0;
    for (var i = 0; i < pairs.length; i++) {
      var k = pk(pairs[i][0], pairs[i][1]);
      if (!(k in state.ans)) return { q: pairs[i], steps: done, ranked: [] };
      done++;
    }
    // Rangfolge: meiste Siege zuerst; bei Gleichstand entscheidet der direkte Vergleich
    var wins = {}; state.order.forEach(function (v) { wins[v] = 0; });
    pairs.forEach(function (p) { wins[state.ans[pk(p[0], p[1])]]++; });
    var sb = {}; state.order.forEach(function (v) { sb[v] = 0; });
    pairs.forEach(function (p) { var w = state.ans[pk(p[0], p[1])], l = w === p[0] ? p[1] : p[0]; sb[w] += wins[l]; });
    var ranked = state.order.slice().sort(function (x, y) {
      if (wins[y] !== wins[x]) return wins[y] - wins[x];
      var w = state.ans[pk(x, y)]; if (w) return w === x ? -1 : 1;
      if (sb[y] !== sb[x]) return sb[y] - sb[x];
      return state.order.indexOf(x) - state.order.indexOf(y);
    });
    return { done: true, ranked: ranked.slice(0, TOP), rest: [], steps: TOTAL, wins: wins };
  }

  // ---------- Elemente ----------
  var $ = function (id) { return document.getElementById(id); };
  var phPick = $('wf-pick'), phCmp = $('wf-compare'), phRes = $('wf-result');
  function show(p) { state.phase = p; save(); phPick.hidden = p !== 'pick'; phCmp.hidden = p !== 'compare'; phRes.hidden = p !== 'result'; }

  // ---------- Schritt 1: Sternenhimmel ----------
  var peb = $('wf-pebbles'), cnt = $('wf-count'), go = $('wf-go');
  VALUES.forEach(function (v, i) {
    var b = document.createElement('button'); b.type = 'button'; b.className = 'wf-pebble'; b.textContent = v;
    var R = rng(hash(v));
    b.style.setProperty('--y', Math.round((R() - 0.5) * 18) + 'px'); b.style.setProperty('--tw', (2.5 + R() * 3).toFixed(1) + 's'); b.style.setProperty('--td', (R() * 3).toFixed(1) + 's');
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
    var lit = Math.floor(TOP * s.steps / Math.max(1, TOTAL));
    for (var i = 0; i < TOP; i++) { var d = document.createElement('span'); d.textContent = '✦'; if (i < lit) d.className = 'on'; f.appendChild(d); }
    if (s.done) { result(s); scrollTop(); return; }
    cur = s.q; var flip = hash(pk(cur[0], cur[1])) % 2 === 1; if (flip) cur = [cur[1], cur[0]];
    $('wf-round').textContent = 'Frage ' + (s.steps + 1) + ' von ' + TOTAL;
    duel.classList.remove('swap'); void duel.offsetWidth; duel.classList.add('swap');
    A.textContent = cur[0]; B.textContent = cur[1];
    [A, B].forEach(function (el) { var n = el.textContent.length; el.style.setProperty('--fit', Math.min(1, 11 / n).toFixed(2)); el.style.setProperty('--fitm', Math.min(1, 8.5 / n).toFixed(2)); });
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
  $('wf-new').addEventListener('click', function () {
    state.ans = {}; state.hist = []; state.order = []; show('pick'); updPick(); save(); scrollTop();
  });
  $('wf-back').addEventListener('click', function () {
    if (!state.hist.length) { show('pick'); updPick(); return; }
    delete state.ans[state.hist.pop()]; save(); step();
  });

  // ---------- Sternbilder (echte Muster, Sterne nach Helligkeit sortiert) ----------
  // Jeder Stern: [Name, x, y]; Reihenfolge = vom hellsten zum schwächsten. Linien als Index-Paare.
  var CONS = [
    { name: 'Großer Wagen', art: 'im Großen Wagen', text: 'Seit Jahrtausenden weist er den Menschen den Weg nach Norden. Deine Werte sind dein innerer Kompass.',
      stars: [['Alioth', 100, 8], ['Dubhe', 0, 0], ['Alkaid', 178, 26], ['Mizar', 138, 4], ['Merak', 4, 44], ['Phecda', 56, 52], ['Megrez', 60, 14]],
      lines: [[1, 4], [4, 5], [5, 6], [6, 1], [6, 0], [0, 3], [3, 2]] },
    { name: 'Kleiner Wagen', art: 'im Kleinen Wagen', text: 'An seiner Deichsel leuchtet der Polarstern, der ruhende Punkt am Himmel. Deine Werte schenken dir Halt und Richtung.',
      stars: [['Polaris', 0, 0], ['Kochab', 98, 46], ['Pherkad', 126, 66], ['Epsilon', 52, 38], ['Zeta', 72, 70], ['Yildun', 28, 18], ['Eta', 102, 92]],
      lines: [[0, 5], [5, 3], [3, 4], [4, 1], [1, 2], [2, 6], [6, 4]] },
    { name: 'Orion', art: 'im Orion', text: 'Der Himmelsjäger steht kraftvoll und klar über dem Winterwald. Deine Werte schenken dir Mut und Ausrichtung.',
      stars: [['Rigel', 104, 172], ['Beteigeuze', 0, 0], ['Bellatrix', 92, 12], ['Alnilam', 52, 90], ['Alnitak', 36, 96], ['Saiph', 18, 176], ['Mintaka', 68, 84]],
      lines: [[1, 2], [1, 4], [2, 6], [4, 3], [3, 6], [4, 5], [6, 0], [5, 0]] },
    { name: 'Plejaden', art: 'in den Plejaden, dem Siebengestirn', text: 'Sieben Schwestern, eng miteinander verbunden. Deine Werte wirken wie eine Gemeinschaft zusammen.',
      stars: [['Alkyone', 52, 40], ['Atlas', 92, 46], ['Elektra', 8, 24], ['Maia', 24, 8], ['Merope', 34, 48], ['Taygeta', 44, 0], ['Pleione', 94, 30]],
      lines: [[2, 3], [3, 5], [5, 0], [2, 4], [4, 0], [0, 1], [1, 6]] },
    { name: 'Schwan', art: 'im Schwan', text: 'Mit weit geöffneten Flügeln zieht er durch die Milchstraße, ein Sinnbild für Wandlung. Deine Werte tragen dich wie Flügel.',
      stars: [['Deneb', 64, 0], ['Sadr', 62, 56], ['Gienah', 14, 80], ['Delta', 112, 40], ['Albireo', 58, 172], ['Zeta', -16, 116], ['Eta', 60, 112]],
      lines: [[0, 1], [1, 6], [6, 4], [3, 1], [1, 2], [2, 5]] },
    { name: 'Löwe', art: 'im Löwen', text: 'Ein Bild für Herzenskraft und Großzügigkeit. Deine Werte strahlen aus dir heraus in die Welt.',
      stars: [['Regulus', 0, 92], ['Algieba', 16, 40], ['Denebola', 172, 70], ['Zosma', 128, 44], ['Ras Elased', -14, 4], ['Chertan', 132, 76], ['Adhafera', 22, 14]],
      lines: [[0, 1], [1, 6], [6, 4], [1, 3], [3, 2], [2, 5], [5, 0]] }
  ];
  function pickCons(ranked) { return CONS[hash(ranked.join('>')) % CONS.length]; }
  function layout(c, box) {
    var xs = c.stars.map(function (s) { return s[1]; }), ys = c.stars.map(function (s) { return s[2]; });
    var minx = Math.min.apply(0, xs), maxx = Math.max.apply(0, xs), miny = Math.min.apply(0, ys), maxy = Math.max.apply(0, ys);
    var sc = Math.min(box.w / Math.max(1, maxx - minx), box.h / Math.max(1, maxy - miny));
    var ox = box.x + (box.w - (maxx - minx) * sc) / 2, oy = box.y + (box.h - (maxy - miny) * sc) / 2;
    return c.stars.map(function (s) { return [ox + (s[1] - minx) * sc, oy + (s[2] - miny) * sc]; });
  }
  function treeline() {
    var R = rng(42), d = 'M0,460 L0,410', x = 0;
    while (x < 640) { var w = 10 + R() * 16, h = 28 + R() * 46, b = 408 + R() * 10; d += ' L' + r1(x) + ',' + r1(b) + ' L' + r1(x + w / 2) + ',' + r1(b - h) + ' L' + r1(x + w) + ',' + r1(b); x += w * (0.55 + R() * 0.3); }
    return d + ' L640,460Z';
  }
  function skySVG(ranked, opts) {
    var c = pickCons(ranked), P = layout(c, { x: 120, y: 70, w: 400, h: 250 });
    var o = '<defs><linearGradient id="wfn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#151a2c"/><stop offset=".7" stop-color="#2a2d45"/><stop offset="1" stop-color="#3b3a4f"/></linearGradient>' +
      '<radialGradient id="wfg"><stop offset="0" stop-color="#fff8e1"/><stop offset=".25" stop-color="#f6dd92" stop-opacity=".75"/><stop offset="1" stop-color="#f6dd92" stop-opacity="0"/></radialGradient></defs>';
    o += '<rect width="640" height="460" fill="url(#wfn)"' + (opts && opts.round ? ' rx="18"' : '') + '/>';
    var R = rng(hash(ranked.join('|')) || 7);
    for (var i = 0; i < 140; i++) o += '<circle cx="' + r1(R() * 640) + '" cy="' + r1(R() * 400) + '" r="' + r1(R() * 1.1 + .3) + '" fill="#fff" opacity="' + (R() * .55 + .15).toFixed(2) + '"/>';
    o += '<path d="M-20,140 C160,90 420,260 660,190" stroke="#fff" stroke-opacity=".05" stroke-width="70" fill="none"/>';
    o += '<g class="wf-lines">' + c.lines.map(function (l, k) { var a = P[l[0]], b = P[l[1]]; return '<line class="wf-ln" style="--k:' + k + '" x1="' + r1(a[0]) + '" y1="' + r1(a[1]) + '" x2="' + r1(b[0]) + '" y2="' + r1(b[1]) + '" stroke="#e9dcae" stroke-opacity=".5" stroke-width="1.4" stroke-dasharray="3 5"/>'; }).join('') + '</g>';
    var cx = P.reduce(function (s, p) { return s + p[0]; }, 0) / P.length, cy = P.reduce(function (s, p) { return s + p[1]; }, 0) / P.length;
    var boxes = [], cores = ranked.map(function (v, i) { return 7.5 - i * 0.75; });
    function hit(b) {
      if (b.x < 8 || b.x + b.w > 632 || b.y < 14 || b.y + b.h > 392) return true;
      for (var k = 0; k < boxes.length; k++) { var o2 = boxes[k]; if (b.x < o2.x + o2.w + 4 && b.x + b.w + 4 > o2.x && b.y < o2.y + o2.h + 2 && b.y + b.h + 2 > o2.y) return true; }
      for (var j = 0; j < P.length; j++) { var r = cores[j] * 2.3 + 3, q = P[j]; if (q[0] + r > b.x && q[0] - r < b.x + b.w && q[1] + r > b.y && q[1] - r < b.y + b.h) return true; }
      for (var m = 0; m < c.lines.length; m++) {
        var A = P[c.lines[m][0]], B = P[c.lines[m][1]], n = Math.ceil(Math.hypot(B[0] - A[0], B[1] - A[1]) / 5);
        for (var t = 1; t < n; t++) { var px = A[0] + (B[0] - A[0]) * t / n, py = A[1] + (B[1] - A[1]) * t / n; if (px > b.x - 2 && px < b.x + b.w + 2 && py > b.y - 2 && py < b.y + b.h + 2) return true; }
      }
      return false;
    }
    var labels = ranked.map(function (v, i) {
      var p = P[i], core = cores[i], fs0 = i ? 13.5 - i * 0.4 : 16, dx = p[0] - cx, dy = p[1] - cy, first = null;
      for (var sv = 0; sv < 3; sv++) {
        var fs = fs0 * [1, 0.86, 0.74][sv], tw = v.length * fs * 0.78, th = fs;
        for (var gm = 0; gm < 2; gm++) {
          var gap = (core * 2.3 + 8) * (gm ? 1.8 : 1);
          var cand = [['start', p[0] + gap, p[1] + fs * .36], ['end', p[0] - gap, p[1] + fs * .36], ['middle', p[0], p[1] + gap + fs * .8], ['middle', p[0], p[1] - gap],
            ['start', p[0] + gap * .7, p[1] + gap + fs * .5], ['end', p[0] - gap * .7, p[1] + gap + fs * .5], ['start', p[0] + gap * .7, p[1] - gap * .7], ['end', p[0] - gap * .7, p[1] - gap * .7]];
          cand.sort(function (a2, b2) { function sc(c2) { var bx = c2[0] === 'start' ? c2[1] + tw / 2 : c2[0] === 'end' ? c2[1] - tw / 2 : c2[1]; return -((bx - p[0]) * dx + (c2[2] - p[1]) * dy); } return sc(a2) - sc(b2); });
          if (!first) first = { a: cand[0][0], x: cand[0][1], y: cand[0][2], fs: fs };
          for (var k = 0; k < cand.length; k++) {
            var c2 = cand[k], bx = c2[0] === 'start' ? c2[1] : c2[0] === 'end' ? c2[1] - tw : c2[1] - tw / 2, bb = { x: bx, y: c2[2] - th * .8, w: tw, h: th };
            if (!hit(bb)) { boxes.push(bb); return { a: c2[0], x: c2[1], y: c2[2], fs: fs }; }
          }
        }
      }
      return first;
    });
    ranked.forEach(function (v, i) {
      var p = P[i], g = 46 - i * 4.6, core = cores[i], L = labels[i];
      o += '<g class="wf-star" style="--i:' + i + '"><circle cx="' + r1(p[0]) + '" cy="' + r1(p[1]) + '" r="' + r1(g) + '" fill="url(#wfg)"/>' +
        '<path d="M' + r1(p[0]) + ',' + r1(p[1] - core * 2.2) + ' L' + r1(p[0] + core * .35) + ',' + r1(p[1] - core * .35) + ' L' + r1(p[0] + core * 2.2) + ',' + r1(p[1]) + ' L' + r1(p[0] + core * .35) + ',' + r1(p[1] + core * .35) + ' L' + r1(p[0]) + ',' + r1(p[1] + core * 2.2) + ' L' + r1(p[0] - core * .35) + ',' + r1(p[1] + core * .35) + ' L' + r1(p[0] - core * 2.2) + ',' + r1(p[1]) + ' L' + r1(p[0] - core * .35) + ',' + r1(p[1] - core * .35) + 'Z" fill="#fffaf0" opacity=".9"/>' +
        '<circle cx="' + r1(p[0]) + '" cy="' + r1(p[1]) + '" r="' + r1(core * .8) + '" fill="#fffdf6"/>' +
        '<text x="' + r1(L.x) + '" y="' + r1(L.y) + '" text-anchor="' + L.a + '" font-family="Jost, Futura, \'Century Gothic\', sans-serif" font-size="' + L.fs + '" letter-spacing="' + r1(L.fs * .14) + '" fill="#f1e8c9">' + esc(v.toUpperCase()) + '</text></g>';
    });
    o += '<path d="' + treeline() + '" fill="#121626"/>';
    o += '<text x="320" y="446" text-anchor="middle" font-family="Jost, Futura, sans-serif" font-size="11" letter-spacing="2.6" fill="#a9a6c4">' + esc(c.name.toUpperCase()) + '</text>';
    return o;
  }
  function r1(n) { return Math.round(n * 10) / 10; }

  // ---------- Schritt 3: Ergebnis ----------
  function result(s) {
    show('result');
    var c = pickCons(s.ranked), sky = $('wf-sky'); sky.innerHTML = skySVG(s.ranked, { round: true });
    sky.classList.remove('lit'); void sky.getBoundingClientRect(); requestAnimationFrame(function () { sky.classList.add('lit'); });
    $('wf-cname').textContent = 'Deine Werte leuchten ' + c.art;
    $('wf-cdesc').textContent = c.text;
    $('wf-rank').innerHTML = s.ranked.map(function (v, i) { return '<li style="--s:' + (1 - i * 0.09).toFixed(2) + '"><span class="n">' + (i + 1) + '</span><b>' + esc(v) + '</b>' + (i ? '' : '<small>Dein hellster Stern</small>') + '</li>'; }).join('');
    $('wf-more').textContent = '';
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
    var done = '<div class="form-done"><h3>Danke für dein Vertrauen!</h3><p>Dein Wertesternbild ist bei uns angekommen. Wir melden uns persönlich bei dir.</p></div>';
    if (get('website') || Date.now() - sfStart < 3000) { sf.innerHTML = done; return; }
    if (!get('firstname') || !get('lastname') || !get('email')) { o.textContent = 'Bitte füll Vorname, Nachname und E-Mail aus.'; return; }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(get('email'))) { o.textContent = 'Bitte prüf deine E-Mail-Adresse.'; return; }
    if (!$('ws-ok').checked) { o.textContent = 'Bitte bestätige kurz deine Einwilligung.'; return; }
    var r = run(), list = r.done ? 'Sternbild: ' + pickCons(r.ranked).name + '\n' + r.ranked.map(function (v, i) { return (i + 1) + '. ' + v; }).join('\n') : 'Gewählte Werte: ' + state.picked.join(', ');
    var msg = (get('message') ? get('message') + '\n\n' : '') + 'Bitte um Kontaktaufnahme.\n\nWertesternbild' + ((state.name || '').trim() ? ' von ' + state.name.trim() : '') + ':\n' + list;
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
    var btn = this; btn.disabled = true; out.textContent = 'Dein Wertesternbild wird gestaltet …';
    makePDF().then(function () { out.textContent = 'Fertig! Viel Freude mit deinem Sternbild.'; })
      .catch(function (err) { console.error(err); out.textContent = 'Das PDF ließ sich gerade nicht erstellen. Bitte versuch es gleich noch einmal.'; })
      .then(function () { btn.disabled = false; });
  });
  function loadScript(src) { return new Promise(function (res, rej) { if (window.jspdf) return res(); var s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = rej; document.head.appendChild(s); }); }
  function toDataURL(src) { return fetch(src).then(function (r) { return r.blob(); }).then(function (b) { return new Promise(function (res) { var fr = new FileReader(); fr.onload = function () { res(fr.result); }; fr.readAsDataURL(b); }); }); }
  function skyJPG(ranked, px) {
    var h = Math.round(px * 460 / 640), s = '<svg xmlns="' + NS + '" viewBox="0 0 640 460" width="' + px + '" height="' + h + '">' + skySVG(ranked, {}) + '</svg>';
    return new Promise(function (res, rej) {
      var img = new Image();
      img.onload = function () { var c = document.createElement('canvas'); c.width = px; c.height = h; c.getContext('2d').drawImage(img, 0, 0, px, h); res(c.toDataURL('image/jpeg', 0.9)); };
      img.onerror = rej; img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(s);
    });
  }
  function makePDF() {
    var r = run(); if (!r.done) return Promise.reject(new Error('unvollständig'));
    var c = pickCons(r.ranked);
    return Promise.all([loadScript(D.jspdf), toDataURL(D.logo).catch(function () { return null; }), skyJPG(r.ranked, 1600)]).then(function (x) {
      var logo = x[1], sky = x[2];
      var doc = new window.jspdf.jsPDF({ unit: 'mm', format: 'a4' });
      var W = 210, M = 18, INK = [44, 43, 25], OLIVE = [127, 123, 47], DARK = [74, 73, 32], MUTED = [95, 92, 67], SAND = [244, 239, 225], NIGHT = [42, 45, 69];
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
      doc.text(name ? 'Das Wertesternbild von ' + name : 'Mein Wertesternbild', W / 2, 45, { align: 'center' });
      doc.setFontSize(9.5); doc.setTextColor.apply(doc, MUTED); doc.text('Erstellt am ' + today, W / 2, 51.5, { align: 'center' });
      var iw = W - 2 * M, ih = iw * 460 / 640; doc.addImage(sky, 'JPEG', M, 57, iw, ih);
      var y = 57 + ih + 10;
      doc.setFontSize(14); doc.setTextColor.apply(doc, DARK); doc.text('Deine Werte leuchten ' + c.art, M, y); y += 6;
      doc.setFontSize(10); doc.setTextColor.apply(doc, MUTED); var ct = doc.splitTextToSize(c.text, W - 2 * M); doc.text(ct, M, y); y += ct.length * 4.8 + 5;
      r.ranked.forEach(function (v, i) {
        var col = i < 4 ? 0 : 1, row = i < 4 ? i : i - 4, xx = M + col * 88, yy = y + row * 9;
        doc.setFillColor.apply(doc, NIGHT); doc.circle(xx + 3.5, yy - 1.4, 3.5, 'F');
        doc.setFontSize(9); doc.setTextColor(246, 236, 200); doc.text(String(i + 1), xx + 3.5, yy, { align: 'center' });
        doc.setFontSize(12.5); doc.setTextColor.apply(doc, INK); doc.text(v, xx + 10, yy);
        if (!i) { doc.setFontSize(8); doc.setTextColor.apply(doc, MUTED); doc.text('Dein hellster Stern', xx + 10 + doc.getTextWidth(v) * 12.5 / 8 + 3, yy); }
      });
      // Seite 2
      doc.addPage(); head(); foot();
      y = 44; doc.setFontSize(18); doc.setTextColor.apply(doc, DARK); doc.text('Deinen Sternen folgen', M, y); y += 7;
      doc.setFontSize(10); doc.setTextColor.apply(doc, MUTED);
      var intro = doc.splitTextToSize('Nimm dir einen ruhigen Moment für deine drei hellsten Sterne. Schreib auf, was dir spontan in den Sinn kommt.', W - 2 * M);
      doc.text(intro, M, y); y += intro.length * 4.8 + 5;
      r.ranked.slice(0, 3).forEach(function (v, i) {
        doc.setFillColor.apply(doc, NIGHT); doc.circle(M + 2.5, y - 1.6, 2.5, 'F');
        doc.setFontSize(13.5); doc.setTextColor.apply(doc, INK); doc.text(v, M + 8, y); y += 6.5;
        ['Wo leuchtet ' + v + ' in deinem Leben schon heute?', 'Ein kleiner Schritt, mit dem ' + v + ' in dieser Woche noch mehr Raum bekommt:'].forEach(function (q) {
          doc.setFontSize(9.5); doc.setTextColor.apply(doc, MUTED); doc.text(q, M + 8, y); y += 7.5;
          doc.setDrawColor(215, 209, 186); doc.setLineWidth(0.25); doc.line(M + 8, y, W - M, y); y += 7.5;
        });
        y += 3;
      });
      var evs = D.events || [], boxH = 42 + evs.length * 12; y = Math.max(y + 2, 276 - boxH - 4);
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
      for (var p = 1; p <= 2; p++) { doc.setPage(p); doc.setFontSize(7.5); doc.setTextColor.apply(doc, MUTED); doc.text(p + ' / 2', W - M, 292, { align: 'right' }); }
      doc.save('Wertesternbild' + (name ? '-' + name.replace(/[^\wäöüÄÖÜß-]+/g, '-') : '') + '.pdf');
    });
  }
})();
