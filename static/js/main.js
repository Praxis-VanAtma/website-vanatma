(function () {
  // Menü am Handy
  var btn = document.getElementById('menu-btn'), nav = document.getElementById('nav');
  if (btn && nav) btn.addEventListener('click', function () {
    var open = nav.classList.toggle('open');
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
  });

  // Thema im Kontaktformular aus Link übernehmen (?thema=...)
  var topic = document.getElementById('c-topic');
  if (topic) {
    var t = new URLSearchParams(location.search).get('thema');
    if (t) {
      var norm = function (x) { return x.toLowerCase().replace(/[^a-zäöüß]/g, ''); }, nt = norm(t);
      var isEvent = /^Anmeldung:/.test(t);
      for (var i = 0; i < topic.options.length; i++) {
        var o = topic.options[i];
        if ((isEvent && o.value === 'Anmeldung zu einer Veranstaltung') || (!isEvent && o.value && (norm(o.text).indexOf(nt) === 0 || nt.indexOf(norm(o.text)) === 0)) || o.text === t) { topic.selectedIndex = i; break; }
      }
      var msgField = document.getElementById('h-msg');
      if (isEvent && msgField && !msgField.value) msgField.value = t + '\n\n';
    }
  }

  // Kontaktformular: direkte Übermittlung an HubSpot
  var hf = document.getElementById('hs-api-form'), hfStart = Date.now();
  if (hf) hf.addEventListener('submit', function (e) {
    e.preventDefault();
    // Spamschutz: verstecktes Feld und Mindestzeit
    if (hf.elements['website'].value || Date.now() - hfStart < 3000) { hf.innerHTML = '<div class="form-done"><h3>Danke für deine Nachricht!</h3><p>Wir melden uns persönlich bei dir.</p></div>'; return; }
    var out = document.getElementById('h-out'), btn = hf.querySelector('button[type=submit]');
    var get = function (n) { var el = hf.elements[n]; return el ? el.value.trim() : ''; };
    if (!get('firstname') || !get('lastname') || !get('email') || !get('message')) { out.textContent = 'Bitte füll Vorname, Nachname, E-Mail und Nachricht aus.'; return; }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(get('email'))) { out.textContent = 'Bitte prüf deine E-Mail-Adresse.'; return; }
    if (!document.getElementById('h-ok').checked) { out.textContent = 'Bitte bestätige kurz den Hinweis zum Datenschutz.'; return; }
    // Feldnamen wie im HubSpot-Formular (Nachricht und Telefon sind eigene Eigenschaften)
    var map = [['firstname', 'firstname'], ['lastname', 'lastname'], ['email', 'email'], ['phone', 'telefonnummer'], ['phone', 'phone'],
      ['worum_geht_es_', 'worum_geht_es_'], ['message', 'nachricht'], ['message', 'message']];
    var fields = map.filter(function (m) { return get(m[0]); })
      .map(function (m) { return { objectTypeId: '0-1', name: m[1], value: get(m[0]) }; });
    var body = { fields: fields, context: { pageUri: location.href, pageName: document.title },
      legalConsentOptions: { consent: { consentToProcess: true, text: document.getElementById('h-ok-text').textContent.trim() } } };
    btn.disabled = true; out.textContent = 'Wird gesendet …';
    fetch('https://api.hsforms.com/submissions/v3/integration/submit/' + hf.dataset.portal + '/' + hf.dataset.form,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      .then(function (r) { if (!r.ok) throw r; return r.json(); })
      .then(function () {
        hf.innerHTML = '<div class="form-done"><h3>Danke für deine Nachricht!</h3><p>Wir melden uns persönlich bei dir.</p></div>';
      })
      .catch(function (err) {
        if (err && err.json) err.json().then(function (j) { console.warn('HubSpot', j); }).catch(function () {});
        btn.disabled = false;
        out.innerHTML = 'Beim Senden ist etwas schiefgegangen. Schreib uns bitte direkt an <a href="mailto:' + hf.dataset.to + '">' + hf.dataset.to + '</a>.';
      });
  });

  // Kontaktformular ohne HubSpot: öffnet das E-Mail-Programm mit vorbereiteter Nachricht
  var cf = document.getElementById('mail-form');
  if (cf) cf.addEventListener('submit', function (e) {
    e.preventDefault();
    var f = cf.elements, msg = document.getElementById('c-out');
    if (!f['c-ok'].checked) { msg.textContent = 'Bitte bestätige kurz den Hinweis zum Datenschutz.'; return; }
    var to = cf.getAttribute('data-to');
    var subject = 'Anfrage: ' + f['c-topic'].value;
    var body = 'Name: ' + f['c-name'].value + '\nE-Mail: ' + f['c-mail'].value + (f['c-phone'].value ? '\nTelefon: ' + f['c-phone'].value : '') + '\n\n' + f['c-msg'].value;
    location.href = 'mailto:' + to + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
    msg.textContent = 'Dein E-Mail-Programm öffnet sich mit deiner Nachricht. Schick sie einfach ab, wir melden uns persönlich.';
  });

  var nf = document.getElementById('news-form');
  if (nf) nf.addEventListener('submit', function (e) {
    e.preventDefault();
    var to = nf.getAttribute('data-to'), mail = nf.elements['n-mail'].value, out = document.getElementById('n-out');
    if (!nf.elements['n-ok'].checked) { out.textContent = 'Bitte bestätige kurz deine Anmeldung.'; return; }
    location.href = 'mailto:' + to + '?subject=' + encodeURIComponent('Newsletter-Anmeldung') + '&body=' + encodeURIComponent('Bitte nehmt mich in den VanAtma-Newsletter auf: ' + mail);
    out.textContent = 'Danke! Dein E-Mail-Programm öffnet sich mit der Anmeldung.';
  });

  // IHHT-Sauerstoffkurve
  var svg = document.getElementById('o2');
  if (svg) {
    var NS = 'http://www.w3.org/2000/svg', W = 560, H = 290, L = 44, R = 80, T = 14, B = 34, pw = W - L - R, ph = H - T - B, yMin = 5, yMax = 40, tMax = 40;
    function x(t) { return L + t / tMax * pw } function y(v) { return T + (yMax - v) / (yMax - yMin) * ph }
    function el(n, a, txt) { var e = document.createElementNS(NS, n); for (var k in a) e.setAttribute(k, a[k]); if (txt != null) e.textContent = txt; svg.appendChild(e); return e }
    [10, 20, 30, 40].forEach(function (v) { el('line', { x1: L, x2: W - R, y1: y(v), y2: y(v), 'class': 'gr' }); el('text', { x: L - 8, y: y(v) + 4, 'text-anchor': 'end', 'class': 'ax' }, v + ' %') });
    [0, 10, 20, 30, 40].forEach(function (t) { el('text', { x: x(t), y: H - 10, 'text-anchor': 'middle', 'class': 'ax' }, t + ' Min.') });
    var pts = [[0, 21], [2, 21]], t = 2, phs = [], hy = [12.5, 12, 11.5, 11.5], hp = [34, 35, 34, 35];
    for (var i = 0; i < 4; i++) { var s = t; pts.push([t + .6, hy[i]]); t += 5; pts.push([t - .4, hy[i]]); phs.push(['hypo', s, t, hy[i]]); var s2 = t; pts.push([t + .5, hp[i]]); t += 3; pts.push([t - .4, hp[i]]); phs.push(['hyper', s2, t, hp[i]]) }
    pts.push([t + .6, 21]); pts.push([tMax, 21]);
    phs.forEach(function (p) { var top = p[0] === 'hypo' ? y(21) : y(p[3]), bot = p[0] === 'hypo' ? y(p[3]) : y(21); el('rect', { x: x(p[1]), y: top, width: x(p[2]) - x(p[1]), height: bot - top, 'class': p[0], rx: 3 }) });
    el('line', { x1: L, x2: W - R, y1: y(21), y2: y(21), 'class': 'base' });
    el('text', { x: W - R + 8, y: y(21) + 4, 'class': 'ax' }, 'Raumluft 21 %'); el('text', { x: W - R + 8, y: y(34.5) + 4, 'class': 'ax' }, '≈ 30–40 %'); el('text', { x: W - R + 8, y: y(12) + 4, 'class': 'ax' }, '≈ 10–15 %');
    el('path', { d: 'M' + pts.map(function (p) { return x(p[0]).toFixed(1) + ' ' + y(p[1]).toFixed(1) }).join(' L '), 'class': 'ln' });
  }

  // YouTube erst nach Klick laden (datensparsam)
  document.querySelectorAll('.yt').forEach(function (box) {
    var b = box.querySelector('.yt-play');
    if (b) b.addEventListener('click', function () {
      var f = document.createElement('iframe');
      f.src = 'https://www.youtube-nocookie.com/embed/' + box.dataset.id + '?autoplay=1&rel=0';
      f.allow = 'autoplay; encrypted-media; picture-in-picture'; f.allowFullscreen = true; f.title = 'YouTube-Video';
      b.replaceWith(f);
    });
  });
})();
