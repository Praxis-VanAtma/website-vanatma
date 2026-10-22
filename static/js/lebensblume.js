/* Lebensblume – Selbstreflexion in neun Blütenblättern. Alles bleibt im Browser. */
(function () {
  var dataEl = document.getElementById('lb-data');
  if (!dataEl) return;
  var D = JSON.parse(dataEl.textContent);
  var AREAS = D.areas, N = AREAS.length, STEP = 360 / N;
  var NS = 'http://www.w3.org/2000/svg';
  var R0 = 44, RMAX = 252, RLAB = 290;
  var KEY = 'vanatma-lebensblume';

  // ---------- Zustand ----------
  var state = { name: '', v: {} };
  try { var saved = JSON.parse(localStorage.getItem(KEY) || 'null'); if (saved && saved.v) state = saved; } catch (e) {}
  AREAS.forEach(function (a) {
    var s = state.v[a.key] || {};
    state.v[a.key] = { now: num(s.now, 50), goal: num(s.goal, 90), vision: s.vision || '', steps: (s.steps || ['', '', '']).slice(0, 3), today: s.today || '' };
    while (state.v[a.key].steps.length < 3) state.v[a.key].steps.push('');
  });
  function num(x, d) { x = parseInt(x, 10); return isNaN(x) ? d : Math.max(0, Math.min(100, x)); }
  var saveT;
  function save() { clearTimeout(saveT); saveT = setTimeout(function () { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} }, 250); }

  // ---------- Geometrie ----------
  function len(v) { return R0 + 10 + (RMAX - R0 - 10) * v / 100; }
  function petal(L) {
    var hw = L * 0.25, tx = L * 0.05;
    return 'M0,0 C' + f(hw * 1.05) + ',' + f(-L * 0.16) + ' ' + f(hw * 1.28) + ',' + f(-L * 0.64) + ' ' + f(tx) + ',' + f(-L) +
      ' C' + f(-hw * 0.95) + ',' + f(-L * 0.7) + ' ' + f(-hw * 1.02) + ',' + f(-L * 0.2) + ' 0,0 Z';
  }
  function vein(L) { return 'M0,' + f(-R0 + 4) + ' Q' + f(L * 0.07) + ',' + f(-L * 0.6) + ' ' + f(L * 0.045) + ',' + f(-L * 0.93); }
  function f(n) { return Math.round(n * 10) / 10; }
  function rad(i) { return (i * STEP - 90) * Math.PI / 180; }

  // ---------- SVG (Seite und PDF teilen sich die Form) ----------
  function flowerSVG(opts) {
    var o = '<defs>';
    AREAS.forEach(function (a, i) {
      o += '<linearGradient id="lbg' + i + '" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="' + (-RMAX) + '">' +
        '<stop offset="0" stop-color="' + a.color + '" stop-opacity=".55"/><stop offset=".55" stop-color="' + a.color + '" stop-opacity=".85"/>' +
        '<stop offset="1" stop-color="' + a.color + '" stop-opacity="1"/></linearGradient>';
    });
    o += '</defs>';
    AREAS.forEach(function (a, i) {
      var s = state.v[a.key], Ln = len(s.now), Lg = len(s.goal);
      o += '<g class="lb-petal" data-i="' + i + '" transform="rotate(' + (i * STEP) + ')">' +
        '<path d="' + petal(RMAX) + '" fill="' + a.color + '" fill-opacity=".07" stroke="' + a.color + '" stroke-opacity=".22" stroke-width="1"/>' +
        '<path class="p-now" d="' + petal(Ln) + '" fill="url(#lbg' + i + ')"/>' +
        '<path class="p-vein" d="' + vein(Ln) + '" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="1.6" stroke-linecap="round"/>' +
        '<path class="p-goal" d="' + petal(Lg) + '" fill="none" stroke="' + a.color + '" stroke-width="2.4" stroke-dasharray="7 6" stroke-linecap="round"/>' +
        '</g>';
    });
    o += '<circle r="' + (R0 + 6) + '" fill="#fbf8ef" stroke="#4a4920" stroke-opacity=".18" stroke-width="1.5"/>';
    AREAS.forEach(function (a, i) {
      var r = R0 - 12, x = Math.cos(rad(i)) * r, y = Math.sin(rad(i)) * r;
      o += '<circle cx="' + f(x) + '" cy="' + f(y) + '" r="4.2" fill="' + a.color + '"/>';
    });
    if (opts && opts.labels) {
      o += '<text class="lb-ich" x="0" y="9" text-anchor="middle">ich</text>';
      AREAS.forEach(function (a, i) {
        var c = Math.cos(rad(i)), sn = Math.sin(rad(i)), x = c * RLAB, y = sn * RLAB;
        var anchor = c > 0.35 ? 'start' : (c < -0.35 ? 'end' : 'middle');
        var dy = sn < -0.8 ? -14 : (sn > 0.8 ? 16 : 0);
        o += '<g class="lb-label" data-i="' + i + '" transform="translate(' + f(x) + ',' + f(y + dy) + ')">' +
          '<text text-anchor="' + anchor + '" class="lb-lt">' + esc(a.short) + '</text>' +
          '<text text-anchor="' + anchor + '" y="17" class="lb-lv" data-lv="' + i + '">' + valText(a) + '</text></g>';
      });
    }
    return o;
  }
  function valText(a) { var s = state.v[a.key]; return s.now + ' % · Ziel ' + s.goal + ' %'; }
  function esc(t) { return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  var svg = document.getElementById('lb-svg');
  svg.innerHTML = flowerSVG({ labels: true });

  function updatePetal(i) {
    var a = AREAS[i], s = state.v[a.key], g = svg.querySelector('.lb-petal[data-i="' + i + '"]');
    g.querySelector('.p-now').setAttribute('d', petal(len(s.now)));
    g.querySelector('.p-vein').setAttribute('d', vein(len(s.now)));
    g.querySelector('.p-goal').setAttribute('d', petal(len(s.goal)));
    svg.querySelector('[data-lv="' + i + '"]').textContent = valText(a);
  }

  // ---------- Karten ----------
  var wrap = document.getElementById('lb-areas');
  AREAS.forEach(function (a, i) {
    var s = state.v[a.key], id = 'lb-' + a.key;
    var card = document.createElement('article');
    card.className = 'lb-card'; card.id = id; card.style.setProperty('--c', a.color); card.setAttribute('data-i', i);
    card.innerHTML =
      '<header><span class="lb-dot"></span><div><h3>' + esc(a.name) + '</h3><p>' + esc(a.hint) + '</p></div></header>' +
      '<div class="lb-range"><label for="' + id + '-now">Heute</label><input type="range" min="0" max="100" step="5" id="' + id + '-now" value="' + s.now + '"><output>' + s.now + ' %</output></div>' +
      '<div class="lb-range"><label for="' + id + '-goal">Mein Ziel</label><input type="range" min="0" max="100" step="5" id="' + id + '-goal" value="' + s.goal + '"><output>' + s.goal + ' %</output></div>' +
      '<details' + (s.vision || s.today || s.steps.join('') ? ' open' : '') + '><summary>Dein Weg zum Ziel</summary>' +
      '<label for="' + id + '-vis">Wie sieht es aus, wenn dieses Blütenblatt voll blüht? Wie fühlst du dich, was hat sich verändert?</label>' +
      '<textarea id="' + id + '-vis" rows="3">' + esc(s.vision) + '</textarea>' +
      '<label>Deine nächsten drei Schritte</label>' +
      [0, 1, 2].map(function (k) { return '<input type="text" class="lb-step" data-k="' + k + '" aria-label="Schritt ' + (k + 1) + '" placeholder="' + (k + 1) + '. Schritt" value="' + esc(s.steps[k]) + '">'; }).join('') +
      '<label for="' + id + '-today">Was kannst du heute schon dafür tun?</label>' +
      '<input type="text" id="' + id + '-today" value="' + esc(s.today) + '"></details>';
    wrap.appendChild(card);

    var rn = card.querySelector('#' + id + '-now'), rg = card.querySelector('#' + id + '-goal');
    var on = rn.nextElementSibling, og = rg.nextElementSibling;
    rn.addEventListener('input', function () { s.now = +rn.value; on.textContent = s.now + ' %'; if (s.goal < s.now) { s.goal = s.now; rg.value = s.goal; og.textContent = s.goal + ' %'; } updatePetal(i); save(); });
    rg.addEventListener('input', function () { s.goal = +rg.value; og.textContent = s.goal + ' %'; updatePetal(i); save(); });
    card.querySelector('textarea').addEventListener('input', function (e) { s.vision = e.target.value; save(); });
    card.querySelectorAll('.lb-step').forEach(function (el) { el.addEventListener('input', function () { s.steps[+el.getAttribute('data-k')] = el.value; save(); }); });
    card.querySelector('#' + id + '-today').addEventListener('input', function (e) { s.today = e.target.value; save(); });
    card.addEventListener('mouseenter', function () { focusPetal(i); });
    card.addEventListener('mouseleave', function () { focusPetal(-1); });
    card.addEventListener('focusin', function () { focusPetal(i); });
    card.addEventListener('focusout', function () { focusPetal(-1); });
  });
  function focusPetal(i) { svg.classList.toggle('has-focus', i >= 0); svg.querySelectorAll('[data-i]').forEach(function (g) { g.classList.toggle('on', +g.getAttribute('data-i') === i); }); }
  svg.addEventListener('click', function (e) {
    var g = e.target.closest('[data-i]'); if (!g) return;
    var c = document.getElementById('lb-' + AREAS[+g.getAttribute('data-i')].key);
    c.scrollIntoView({ behavior: 'smooth', block: 'center' }); c.classList.add('pulse'); setTimeout(function () { c.classList.remove('pulse'); }, 1200);
  });

  var nameIn = document.getElementById('lb-name');
  nameIn.value = state.name || '';
  nameIn.addEventListener('input', function () { state.name = nameIn.value; save(); });

  document.getElementById('lb-reset').addEventListener('click', function () {
    if (!window.confirm('Möchtest du deine Lebensblume neu beginnen? Deine bisherigen Eingaben auf diesem Gerät werden dabei geleert.')) return;
    try { localStorage.removeItem(KEY); } catch (e) {}
    location.reload();
  });

  // ---------- PDF ----------
  var out = document.getElementById('lb-out');
  document.getElementById('lb-pdf').addEventListener('click', function () {
    var btn = this; btn.disabled = true; out.textContent = 'Deine Lebensblume wird gestaltet …';
    makePDF().then(function () { out.textContent = 'Fertig! Viel Freude mit deiner Lebensblume.'; })
      .catch(function (err) { console.error(err); out.textContent = 'Das PDF ließ sich gerade nicht erstellen. Bitte versuch es gleich noch einmal.'; })
      .then(function () { btn.disabled = false; });
  });

  function loadScript(src) {
    return new Promise(function (res, rej) {
      if (window.jspdf) return res();
      var s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = rej; document.head.appendChild(s);
    });
  }
  function toDataURL(src) {
    return fetch(src).then(function (r) { return r.blob(); }).then(function (b) {
      return new Promise(function (res) { var fr = new FileReader(); fr.onload = function () { res(fr.result); }; fr.readAsDataURL(b); });
    });
  }
  function flowerPNG(px) {
    var s = '<svg xmlns="' + NS + '" viewBox="-270 -270 540 540" width="' + px + '" height="' + px + '">' + flowerSVG({ labels: false }) + '</svg>';
    return new Promise(function (res, rej) {
      var img = new Image();
      img.onload = function () {
        var c = document.createElement('canvas'); c.width = c.height = px; var ctx = c.getContext('2d');
        ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, px, px); ctx.drawImage(img, 0, 0, px, px); res(c.toDataURL('image/jpeg', 0.9));
      };
      img.onerror = rej;
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(s);
    });
  }
  function hex(h) { h = h.replace('#', ''); return [parseInt(h.substr(0, 2), 16), parseInt(h.substr(2, 2), 16), parseInt(h.substr(4, 2), 16)]; }

  function makePDF() {
    return Promise.all([loadScript(D.jspdf), toDataURL(D.logo).catch(function () { return null; }), flowerPNG(1400)]).then(function (r) {
      var logo = r[1], flower = r[2];
      var doc = new window.jspdf.jsPDF({ unit: 'mm', format: 'a4' });
      var W = 210, M = 18, INK = [44, 43, 25], OLIVE = [127, 123, 47], DARK = [74, 73, 32], MUTED = [95, 92, 67], SAND = [244, 239, 225];
      var name = (state.name || '').trim();
      var today = new Date().toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' });

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
      function newPage() { doc.addPage(); head(); foot(); return 42; }

      // Seite 1: die Blume
      head(); foot();
      doc.setTextColor.apply(doc, DARK); doc.setFontSize(24);
      doc.text(name ? 'Die Lebensblume von ' + name : 'Meine Lebensblume', W / 2, 45, { align: 'center' });
      doc.setFontSize(9.5); doc.setTextColor.apply(doc, MUTED); doc.text('Erstellt am ' + today, W / 2, 51.5, { align: 'center' });

      var size = 112, cx = W / 2, cy = 116;
      doc.addImage(flower, 'JPEG', cx - size / 2, cy - size / 2, size, size);
      var k = size / 540, rl = 262 * k;
      AREAS.forEach(function (a, i) {
        var c = Math.cos(rad(i)), sn = Math.sin(rad(i)), x = cx + c * rl, y = cy + sn * rl;
        var al = c > 0.35 ? 'left' : (c < -0.35 ? 'right' : 'center');
        if (sn < -0.8) y -= 3; if (sn > 0.8) y += 4;
        doc.setFontSize(8.5); doc.setTextColor.apply(doc, hex(a.color)); doc.text(a.short.toUpperCase(), x, y, { align: al });
        doc.setFontSize(7.5); doc.setTextColor.apply(doc, MUTED); doc.text(state.v[a.key].now + ' % · Ziel ' + state.v[a.key].goal + ' %', x, y + 3.6, { align: al });
      });

      var y = 186;
      doc.setFontSize(8); doc.setTextColor.apply(doc, MUTED);
      doc.text('Gefüllt: wo du heute stehst    Gestrichelt: wohin deine Blume wachsen darf', W / 2, y, { align: 'center' });
      y = 195;
      AREAS.forEach(function (a) {
        var s = state.v[a.key], col = hex(a.color);
        doc.setFillColor.apply(doc, col); doc.circle(M + 2, y - 1.2, 1.6, 'F');
        doc.setFontSize(10); doc.setTextColor.apply(doc, INK); doc.text(a.name, M + 6, y);
        var bx = 92, bw = 62;
        doc.setFillColor(236, 231, 214); doc.roundedRect(bx, y - 3, bw, 3.4, 1.7, 1.7, 'F');
        doc.setFillColor.apply(doc, col); if (s.now > 0) doc.roundedRect(bx, y - 3, Math.max(3.4, bw * s.now / 100), 3.4, 1.7, 1.7, 'F');
        doc.setDrawColor.apply(doc, DARK); doc.setLineWidth(0.5); var gx = bx + bw * s.goal / 100; doc.line(gx, y - 4, gx, y + 1.4);
        doc.setFontSize(8.5); doc.setTextColor.apply(doc, MUTED); doc.text(s.now + ' %  ·  Ziel ' + s.goal + ' %', W - M, y, { align: 'right' });
        y += 9;
      });

      // Seite 2: mein Weg
      var filled = AREAS.filter(function (a) { var s = state.v[a.key]; return s.vision.trim() || s.today.trim() || s.steps.join('').trim(); });
      y = newPage();
      doc.setFontSize(18); doc.setTextColor.apply(doc, DARK); doc.text('Mein Weg zum Ziel', M, y); y += 9;
      if (!filled.length) {
        doc.setFontSize(10.5); doc.setTextColor.apply(doc, INK);
        var t0 = doc.splitTextToSize('Hier ist Platz für deine Gedanken. Nimm dir für jedes Blütenblatt, das wachsen möchte, einen ruhigen Moment: Wie sieht es aus, wenn es voll blüht? Was sind deine nächsten drei Schritte? Und was kannst du heute schon dafür tun?', W - 2 * M);
        doc.text(t0, M, y); y += t0.length * 5.2 + 6;
        for (var l = 0; l < 14; l++) { doc.setDrawColor(220, 214, 192); doc.line(M, y, W - M, y); y += 9; }
      }
      filled.forEach(function (a) {
        var s = state.v[a.key], col = hex(a.color), blocks = [];
        if (s.vision.trim()) blocks.push(['So sieht mein Ziel aus', [s.vision.trim()]]);
        var st = s.steps.map(function (x, n) { return x.trim() ? (n + 1) + '. ' + x.trim() : ''; }).filter(Boolean);
        if (st.length) blocks.push(['Meine nächsten Schritte', st]);
        if (s.today.trim()) blocks.push(['Heute tue ich', [s.today.trim()]]);
        var need = 14; blocks.forEach(function (b) { need += 6 + b[1].reduce(function (n, t) { return n + doc.splitTextToSize(t, W - 2 * M - 6).length * 5; }, 0); });
        if (y + Math.min(need, 80) > 272) y = newPage();
        doc.setFillColor.apply(doc, col); doc.circle(M + 2, y - 1.5, 2, 'F');
        doc.setFontSize(13); doc.setTextColor.apply(doc, col); doc.text(a.name, M + 7, y);
        doc.setFontSize(9); doc.setTextColor.apply(doc, MUTED); doc.text(s.now + ' %  ·  Ziel ' + s.goal + ' %', W - M, y, { align: 'right' });
        y += 7;
        blocks.forEach(function (b) {
          if (y > 268) y = newPage();
          doc.setFontSize(8); doc.setTextColor.apply(doc, OLIVE); doc.setCharSpace(0.4); doc.text(b[0].toUpperCase(), M + 7, y); doc.setCharSpace(0); y += 4.8;
          doc.setFontSize(10.5); doc.setTextColor.apply(doc, INK);
          b[1].forEach(function (t) {
            doc.splitTextToSize(t, W - 2 * M - 7).forEach(function (ln) { if (y > 274) y = newPage(); doc.text(ln, M + 7, y); y += 5; });
          });
          y += 2.5;
        });
        y += 5;
      });

      // Einladung
      var evs = D.events || [];
      var boxH = 46 + evs.length * 13;
      if (y + boxH > 276) y = newPage();
      y += 2;
      doc.setFillColor.apply(doc, SAND); doc.roundedRect(M, y, W - 2 * M, boxH, 4, 4, 'F');
      var bx2 = M + 8, by = y + 11;
      doc.setFontSize(8); doc.setTextColor.apply(doc, OLIVE); doc.setCharSpace(0.6); doc.text('HERZLICH EINGELADEN', bx2, by); doc.setCharSpace(0);
      by += 7; doc.setFontSize(15); doc.setTextColor.apply(doc, DARK); doc.text('Wachsen in Begleitung', bx2, by);
      by += 6.5; doc.setFontSize(10); doc.setTextColor.apply(doc, INK);
      var it = doc.splitTextToSize('Wenn du dir für ein Blütenblatt Unterstützung wünschst, begleiten wir dich gern, im persönlichen Gespräch oder bei einer unserer Veranstaltungen in Sankt Englmar.', W - 2 * M - 16);
      doc.text(it, bx2, by); by += it.length * 4.8 + 3;
      evs.forEach(function (e) {
        doc.setFontSize(10.5); doc.setTextColor.apply(doc, DARK); doc.textWithLink(e.title + (e.subtitle ? ' · ' + e.subtitle : ''), bx2, by, { url: e.url });
        doc.setFontSize(9); doc.setTextColor.apply(doc, MUTED); doc.text(e.when + (e.where ? ' · ' + e.where : ''), bx2, by + 4.5);
        by += 13;
      });
      doc.setFontSize(10); doc.setTextColor.apply(doc, INK);
      var ph = D.contact.phones.map(function (p) { return p.person + ' ' + p.display; }).join('   ·   ');
      doc.textWithLink('Persönliches Kennenlernen: ' + D.contact.kontakt.replace(/^https?:\/\//, '').replace(/\/$/, ''), bx2, by, { url: D.contact.kontakt });
      doc.setFontSize(9); doc.setTextColor.apply(doc, MUTED); doc.text(ph, bx2, by + 5);

      var yN = y + boxH + 8;
      if (yN < 276) {
        doc.setFontSize(7.5); doc.setTextColor.apply(doc, MUTED);
        doc.text(doc.splitTextToSize('Die Lebensblume ist eine Übung zur Selbstreflexion für dein Wohlbefinden und deine persönliche Entwicklung.', W - 2 * M), M, yN);
      }

      var pages = doc.getNumberOfPages();
      for (var p = 1; p <= pages; p++) { doc.setPage(p); doc.setFontSize(7.5); doc.setTextColor.apply(doc, MUTED); doc.text(p + ' / ' + pages, W - M, 292, { align: 'right' }); }
      var fn = 'Lebensblume' + (name ? '-' + name.replace(/[^\wäöüÄÖÜß-]+/g, '-') : '') + '.pdf';
      doc.save(fn);
    });
  }
})();
