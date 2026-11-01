/* Archetypen-Kreis – 18 Situationen, Auswertung, Schritt „Spüren“, Ergebnis als sanftes Rad mit Symbolen und PDF. Alles bleibt im Browser. */
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

  // ---------- Symbole (eigene Linienzeichnungen, 24er Raster) ----------
  var ICON = {
    sun: '<circle cx="12" cy="12" r="4"/>' + [0, 45, 90, 135, 180, 225, 270, 315].map(function (d) { var t = d * Math.PI / 180; return '<line x1="' + r1(12 + Math.cos(t) * 6.8) + '" y1="' + r1(12 + Math.sin(t) * 6.8) + '" x2="' + r1(12 + Math.cos(t) * 9.6) + '" y2="' + r1(12 + Math.sin(t) * 9.6) + '"/>'; }).join(''),
    rings: '<circle cx="9" cy="12" r="5.2"/><circle cx="15" cy="12" r="5.2"/>',
    shield: '<path d="M12 3 L19 6 V11 C19 16 15.5 19.5 12 21 C8.5 19.5 5 16 5 11 V6 Z"/><path d="M12 6.5 V17.5"/>',
    bowl: '<path d="M12 9.6 C10.6 7.4 7.4 8.4 8.6 10.9 L12 14 L15.4 10.9 C16.6 8.4 13.4 7.4 12 9.6Z"/><path d="M3.5 14.5 H20.5 C20.2 18.4 16.6 20.8 12 20.8 C7.4 20.8 3.8 18.4 3.5 14.5Z"/>',
    compass: '<circle cx="12" cy="12" r="9"/><path d="M12 5.5 L14.3 12 L12 18.5 L9.7 12Z"/><circle cx="12" cy="12" r=".9"/>',
    bolt: '<path d="M13.5 2.5 L5.5 13.5 H11 L10 21.5 L18.5 10 H13 Z"/>',
    heart: '<path d="M12 20 C5 15 3 11.5 3 8.5 C3 5.5 5.5 3.5 8 3.5 C10 3.5 11.3 4.8 12 6 C12.7 4.8 14 3.5 16 3.5 C18.5 3.5 21 5.5 21 8.5 C21 11.5 19 15 12 20Z"/>',
    spiral: '<path d="M12 12 C12 11 13.5 11 13.5 12.2 C13.5 14 11 14.5 10 13 C8.5 11 10 8.5 12.5 8.5 C15.5 8.5 17.5 11 17 14 C16.5 17.5 13 19 10 18.3 C6.5 17.5 4.5 14 5 10.5 C5.6 6.5 9 4 13 4.3"/>',
    crown: '<path d="M3.5 17 L4.5 7.5 L9 11.5 L12 5 L15 11.5 L19.5 7.5 L20.5 17 Z"/><path d="M3.5 20 H20.5"/>',
    spark: '<path d="M11 3 C11.7 8.6 14.4 11.3 20 12 C14.4 12.7 11.7 15.4 11 21 C10.3 15.4 7.6 12.7 2 12 C7.6 11.3 10.3 8.6 11 3Z"/><path d="M18.5 2.5 V7.5 M16 5 H21"/>',
    owl: '<path d="M6 9.5 C6 6 7.5 3.5 7.5 3.5 L10 6.2 C11.3 5.9 12.7 5.9 14 6.2 L16.5 3.5 C16.5 3.5 18 6 18 9.5 V14 C18 18 15.2 21 12 21 C8.8 21 6 18 6 14 Z"/><circle cx="9.6" cy="11" r="1.9"/><circle cx="14.4" cy="11" r="1.9"/><path d="M11.2 13.6 L12 15.2 L12.8 13.6"/>',
    jester: '<circle cx="12" cy="12" r="9"/><path d="M7.6 10 Q9 8.4 10.4 10 M13.6 10 Q15 8.4 16.4 10"/><path d="M7.2 13.2 Q12 19.6 16.8 13.2 Z"/><path d="M5.5 5.5 L3 3 M18.5 5.5 L21 3"/>'
  };
  function icon(k, x, y, sz, col, w) { return '<g transform="translate(' + r1(x - sz / 2) + ',' + r1(y - sz / 2) + ') scale(' + r1(sz / 24 * 100) / 100 + ')" fill="none" stroke="' + col + '" stroke-width="' + (w || 1.6) + '" stroke-linecap="round" stroke-linejoin="round">' + ICON[k] + '</g>'; }
  function iconSVG(a, sz) { return '<svg class="ak-ic" viewBox="0 0 48 48" width="' + sz + '" height="' + sz + '" aria-hidden="true"><circle cx="24" cy="24" r="22" fill="#f3e6c8" stroke="' + a.color + '" stroke-width="2.5"/>' + icon(a.icon, 24, 24, 28, '#3b2e1d', 1.7) + '</svg>'; }

  // ---------- Das sanfte Rad ----------
  // opts: { p: Präfix, top: [], chosen: [], quiet: id, s: Punkte, feel, click, pdf, compact }
  var R0 = 136, R1 = 300, PHS = D.phases || [];
  function ang(i) { return (i * 30 - 90) * Math.PI / 180; }
  function P(a, r) { return r1(Math.cos(a) * r) + ',' + r1(Math.sin(a) * r); }
  function pt(a, r) { return [r1(Math.cos(a) * r), r1(Math.sin(a) * r)]; }
  function arc(r, a0, a1, rev) { return 'M' + P(rev ? a1 : a0, r) + ' A' + r + ',' + r + ' 0 0 ' + (rev ? 0 : 1) + ' ' + P(rev ? a0 : a1, r); }
  function sector(ra, rb, a0, a1) { return 'M' + P(a0, ra) + ' L' + P(a0, rb) + ' A' + rb + ',' + rb + ' 0 0 1 ' + P(a1, rb) + ' L' + P(a1, ra) + (ra ? ' A' + ra + ',' + ra + ' 0 0 0 ' + P(a0, ra) : '') + 'Z'; }
  function soft(ra, rb, a0, a1, fill) { var g = 7; return '<path d="' + sector(ra + g, Math.max(ra + g + 1, rb - g), a0 + g / rb, a1 - g / rb) + '" fill="' + fill + '" stroke="' + fill + '" stroke-width="' + 2 * g + '" stroke-linejoin="round"/>'; }
  function box(o) { return o.compact ? '-372 -372 744 744' : '-620 -440 1240 880'; }
  function ringSVG(o) {
    o = o || {}; var p = o.p || 'ak', pdf = !!o.pdf;
    var top = o.top || [], ch = o.chosen || [], res = ch.length && !o.feel;
    var ink = pdf ? '#2c2b19' : 'var(--ink)', muted = pdf ? '#5f5c43' : 'var(--muted)', card = pdf ? '#fbf8ef' : 'var(--card)';
    var len = {}, sc = o.s;
    if (sc) { var vals = ARC.map(function (a) { return sc[a.id]; }), mn = Math.min.apply(0, vals), mx = Math.max.apply(0, vals);
      ARC.forEach(function (a) { len[a.id] = 0.14 + 0.86 * (mx > mn ? (sc[a.id] - mn) / (mx - mn) : 0.5); }); }
    else ARC.forEach(function (a, i) { len[a.id] = [0.78, 0.62, 0.7, 0.86, 0.66, 0.74, 0.82, 0.6, 0.72, 0.88, 0.64, 0.76][i]; });
    var out = '<defs><radialGradient id="' + p + '-glow"><stop offset="0" stop-color="#fff3c4" stop-opacity=".95"/><stop offset=".5" stop-color="#f6dd92" stop-opacity=".45"/><stop offset="1" stop-color="#f6dd92" stop-opacity="0"/></radialGradient></defs>';
    if (pdf) out += '<rect x="-620" y="-440" width="1240" height="880" fill="#ffffff"/>';
    out += '<circle r="' + (R1 + 62) + '" style="fill:' + (pdf ? '#f1ecdb' : 'var(--ak-wheel)') + '"/>';
    ARC.forEach(function (a, i) {
      var a0 = ang(i) - 13 * Math.PI / 180, a1 = ang(i) + 13 * Math.PI / 180, isC = ch.indexOf(a.id) >= 0, isT = top.indexOf(a.id) >= 0;
      var rr = R0 + (R1 - R0) * len[a.id], op = !sc ? 0.62 : o.feel ? (isC ? 1 : isT ? 0.85 : 0.3) : res ? (isC ? 1 : o.quiet === a.id ? 0.38 : 0.6) : 0.7;
      var glow = isC || (o.feel && isT && !ch.length);
      out += '<g class="ak-seg' + (isT ? ' is-t' : '') + (isC ? ' is-c' : '') + '" data-id="' + a.id + '" style="--i:' + i + '"' + (o.click && isT ? ' role="button" tabindex="0" aria-label="' + esc(a.name) + '" aria-pressed="' + (isC ? 'true' : 'false') + '"' : '') + '>';
      out += '<g opacity=".14">' + soft(R0, R1, a0, a1, a.color) + '</g>';
      if (glow) { var m = pt(ang(i), rr - 24); out += '<circle class="ak-halo" cx="' + m[0] + '" cy="' + m[1] + '" r="104" fill="url(#' + p + '-glow)"/>'; }
      out += '<g class="ak-fill" opacity="' + op + '">' + soft(R0, rr, a0, a1, a.color) + '</g>';
      if (res && o.quiet === a.id) out += '<path d="' + sector(R0 + 2, R1 - 2, a0 + .01, a1 - .01) + '" fill="none" stroke="#7f7b2f" stroke-width="1.6" stroke-dasharray="4 6" stroke-linejoin="round"/>';
      var mc = pt(ang(i), R1 + 32), big = isC || (o.feel && isT);
      out += '<circle cx="' + mc[0] + '" cy="' + mc[1] + '" r="' + (big ? 27 : 23) + '" fill="#f3e6c8" stroke="' + a.color + '" stroke-width="' + (big ? 3.2 : 2.2) + '"/>' + icon(a.icon, mc[0], mc[1], big ? 32 : 28, '#3b2e1d', 1.7);
      if (!o.compact) {
        var t = ang(i), c = Math.cos(t), sn = Math.sin(t), anc = Math.abs(c) < .2 ? 'middle' : c > 0 ? 'start' : 'end', L = pt(t, R1 + 80), y = L[1] + (sn > .5 ? 24 : sn < -.5 ? -24 : 2);
        var strong = isC || (o.feel && isT), fs = (strong ? 27 : 23) * (pdf ? 0.84 : 1), ms = 23 * (pdf ? 0.88 : 1), dim = sc && !strong && o.quiet !== a.id;
        out += '<text x="' + L[0] + '" y="' + r1(y) + '" text-anchor="' + anc + '" font-family="Jost, Futura, \'Century Gothic\', sans-serif" font-size="' + fs + '" font-weight="' + (strong ? 500 : 400) + '" letter-spacing="2" style="fill:' + ink + '"' + (dim ? ' fill-opacity=".65"' : '') + '>' + esc(a.name.toUpperCase()) + '</text>';
        out += '<text x="' + L[0] + '" y="' + r1(y + ms * 1.15) + '" text-anchor="' + anc + '" font-family="\'Cormorant Garamond\', Georgia, serif" font-style="italic" font-size="' + r1(ms) + '" style="fill:' + muted + '">' + (res && o.quiet === a.id ? 'leise · ' : '') + esc(a.motto) + '</text>';
      }
      out += '</g>';
    });
    // Mitte mit den drei Phasen
    out += '<circle r="' + (R0 - 6) + '" style="fill:' + card + '"/>';
    PHS.forEach(function (ph, k) {
      var r = R0 - 12, a0 = ang(4 * k) - 15 * Math.PI / 180 + .02, a1 = ang(4 * k + 3) + 15 * Math.PI / 180 - .02, rev = Math.sin((a0 + a1) / 2) > .2;
      out += '<path d="' + sector(0, r, a0, a1) + '" fill="' + ph.color + '" fill-opacity=".4" style="stroke:' + card + '" stroke-width="3"/>';
      out += '<path id="' + p + 'n' + k + '" d="' + arc(r - (rev ? 50 : 22), a0 + .12, a1 - .12, rev) + '" fill="none"/><path id="' + p + 'd' + k + '" d="' + arc(r - (rev ? 26 : 46), a0 + .12, a1 - .12, rev) + '" fill="none"/>';
      out += '<text font-family="Jost, Futura, sans-serif" font-size="' + (o.compact ? 19 : 17) + '" letter-spacing="' + (o.compact ? 1.6 : 3) + '" style="fill:' + ink + '"><textPath href="#' + p + 'n' + k + '" startOffset="50%" text-anchor="middle">' + esc(ph.name.toUpperCase()) + '</textPath></text>';
      out += '<text font-family="\'Cormorant Garamond\', Georgia, serif" font-style="italic" font-size="' + (o.compact ? 19.5 : 19) + '" style="fill:' + muted + '"><textPath href="#' + p + 'd' + k + '" startOffset="50%" text-anchor="middle">' + esc(ph.motto) + '</textPath></text>';
    });
    out += '<circle r="28" fill="#fbf8ef" stroke="#d8cfae"/><path d="M-12,0 C-12,-9 -2,-9 0,0 C2,9 12,9 12,0 C12,-9 2,-9 0,0 C-2,9 -12,9 -12,0Z" fill="none" stroke="#7f7b2f" stroke-width="2"/>';
    return out;
  }
  var mqS = window.matchMedia ? window.matchMedia('(max-width: 640px)') : { matches: false };
  function draw(id, o) { var el = document.getElementById(id); o.compact = mqS.matches; el.setAttribute('viewBox', box(o)); el.innerHTML = ringSVG(o); el._o = o; return el; }
  if (mqS.addEventListener) mqS.addEventListener('change', function () { ['ak-ring-i', 'ak-ring-f', 'ak-ring-r'].forEach(function (id) { var el = document.getElementById(id); if (el._o) draw(id, el._o); }); });

  // ---------- Elemente ----------
  var $ = function (id) { return document.getElementById(id); };
  var PH = { intro: $('ak-intro'), q: $('ak-q'), feel: $('ak-feel'), res: $('ak-res') };
  function show(p) { state.phase = p; save(); Object.keys(PH).forEach(function (k) { PH[k].hidden = k !== p; }); }
  function scrollTop() { $('kreis').scrollIntoView({ behavior: 'smooth', block: 'start' }); }

  draw('ak-ring-i', { p: 'aki' });
  document.querySelectorAll('[data-ak]').forEach(function (el) { var a = BY[el.dataset.ak]; if (a) el.innerHTML = iconSVG(a, 44); });
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
      b.innerHTML = '<span class="ak-ico">' + iconSVG(a, 46) + '</span><span><span class="ak-motto">' + esc(a.motto) + '</span><b>' + esc(a.name) + (a.alt ? ' <small>(' + esc(a.alt) + ')</small>' : '') + '</b><span class="ak-ess">' + esc(a.essence) + '</span></span>';
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
    draw('ak-ring-f', { p: 'akf', top: sc.top, chosen: state.chosen, click: true, feel: true, s: sc.s });
  }
  $('ak-ring-f').addEventListener('click', function (e) { var g = e.target.closest && e.target.closest('.ak-seg.is-t'); if (g) toggle(g.dataset.id); });
  $('ak-ring-f').addEventListener('keydown', function (e) { var g = e.target.closest && e.target.closest('.ak-seg.is-t'); if (g && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); toggle(g.dataset.id); } });
  conf.addEventListener('click', function () { result(); scrollTop(); });

  // ---------- Ergebnis ----------
  function result() {
    var sc = scores(), ch = chosenSorted(sc), qu = quietOf(sc, ch);
    show('res');
    var ring = draw('ak-ring-r', { p: 'akr', chosen: ch, quiet: qu, s: sc.s });
    ring.classList.remove('lit'); void ring.getBoundingClientRect(); requestAnimationFrame(function () { ring.classList.add('lit'); });
    $('ak-three').innerHTML = ch.map(function (id, n) {
      var a = BY[id];
      return '<article class="ak-arc" style="--c:' + a.color + ';--n:' + n + '"><header><span class="ak-ico">' + iconSVG(a, 54) + '</span><div><span class="ak-motto">' + esc(a.motto) + '</span><h3>' + esc(a.name) + (a.alt ? ' <small>(' + esc(a.alt) + ')</small>' : '') + '</h3><p class="ak-ess">' + esc(a.essence) + '</p></div></header>' +
        '<dl><div><dt>Grundantrieb</dt><dd>' + esc(a.drive) + '</dd></div><div><dt>Deine Gabe</dt><dd>' + esc(a.gift) + '</dd></div><div><dt>Im Schatten</dt><dd>' + esc(a.shadow) + '</dd></div><div><dt>Zum Nachspüren</dt><dd class="ak-qq">' + esc(a.question) + '</dd></div></dl></article>';
    }).join('');
    var q = BY[qu];
    $('ak-quiet').innerHTML = q ? '<span class="ak-ico">' + iconSVG(q, 46) + '</span><div><p class="eyebrow">Dein leiser Archetyp</p><h3>' + esc(full(q)) + ' <small>· ' + esc(q.motto) + '</small></h3><p>Diese Kraft ist bei dir gerade leise und darf wachsen. ' + esc(q.invite) + '</p></div>' : '';
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
    var h = Math.round(px * 880 / 1240), s = '<svg xmlns="' + NS + '" viewBox="-620 -440 1240 880" width="' + px + '" height="' + h + '">' + ringSVG(o) + '</svg>';
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
      var iw = 160, ih = iw * 880 / 1240; doc.addImage(img, 'JPEG', (W - iw) / 2, 55, iw, ih);
      var y = 55 + ih + 6;
      doc.setFontSize(8); doc.setTextColor.apply(doc, OLIVE); doc.setCharSpace(0.6); doc.text('DEINE DREI ARCHETYPEN', M, y); doc.setCharSpace(0); y += 7;
      ch.forEach(function (id) {
        var a = BY[id];
        dot(a, M + 3, y - 1.5, 3);
        doc.setFontSize(13.5); doc.setTextColor.apply(doc, INK); doc.text(full(a), M + 9, y);
        var nw = doc.getTextWidth(full(a)); doc.setFontSize(10); doc.setTextColor.apply(doc, OLIVE); doc.text('·  ' + a.motto, M + 9 + nw + 3, y); y += 5.2;
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
