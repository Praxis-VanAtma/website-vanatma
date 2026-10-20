#!/usr/bin/env python3
"""Baut die VanAtma-Website aus content/ und templates/ nach _site/.

Aufruf:  python3 build.py
Umgebungsvariablen:
  BASE_PATH   Pfad-Präfix, wenn die Seite in einem Unterordner läuft
              (z. B. "/website-vanatma" auf GitHub Pages ohne eigene Domain).
              Bei eigener Domain leer lassen.
  NOINDEX     "1" setzt noindex für Testumgebungen.
"""
import datetime as dt
import html
import json
import os
import re
import shutil
from pathlib import Path

import markdown
import yaml
from jinja2 import Environment, FileSystemLoader, select_autoescape
from markupsafe import Markup

ROOT = Path(__file__).parent
CONTENT = ROOT / "content"
STATIC = ROOT / "static"
OUT = ROOT / "_site"
BASE = os.environ.get("BASE_PATH", "").rstrip("/")
NOINDEX = os.environ.get("NOINDEX", "") == "1" or bool(BASE)
TODAY = dt.date.today()

MONTHS = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli",
          "August", "September", "Oktober", "November", "Dezember"]
MONTHS_SHORT = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug",
                "Sep", "Okt", "Nov", "Dez"]


def load_yaml(name):
    return yaml.safe_load((CONTENT / "data" / name).read_text(encoding="utf-8"))


SITE = load_yaml("site.yaml")
OFFERS_DATA = load_yaml("offers.yaml")
GROUPS = OFFERS_DATA["groups"]
OFFERS = OFFERS_DATA["offers"]
EVENTS = load_yaml("events.yaml")["events"]


# ---------- Helfer ----------
def url(path="/"):
    if path.startswith("http") or path.startswith("mailto:") or path.startswith("tel:") or path.startswith("#"):
        return path
    return f"{BASE}{path}"


def abs_url(path="/"):
    return SITE["url"].rstrip("/") + path


def image(name):
    """Liefert die URL eines Bildes, falls es in static/img liegt, sonst None."""
    if name and (STATIC / "img" / name).exists():
        return url(f"/assets/img/{name}")
    return None


def md(text, inline=False):
    out = markdown.markdown(text or "", extensions=["extra", "sane_lists", "nl2br"])
    if inline:
        out = re.sub(r"^<p>(.*)</p>$", r"\1", out.strip(), flags=re.S)
    return Markup(out)


def date_de(d, short=False):
    if isinstance(d, str):
        d = dt.date.fromisoformat(d)
    if short:
        return f"{d.day}. {MONTHS_SHORT[d.month - 1]}"
    return f"{d.day}. {MONTHS[d.month - 1]} {d.year}"


def offer_url(o):
    return o.get("link") or f"/angebote/{o['slug']}/"


def read_front_matter(path):
    raw = path.read_text(encoding="utf-8")
    m = re.match(r"^---\n(.*?)\n---\n(.*)$", raw, re.S)
    if not m:
        return {}, raw
    return yaml.safe_load(m.group(1)) or {}, m.group(2)


def reading_time(text):
    words = len(re.findall(r"\w+", text))
    return max(1, round(words / 200))


# ---------- Inhalte laden ----------
POSTS = []
for p in sorted((CONTENT / "blog").glob("*.md")):
    meta, body = read_front_matter(p)
    if meta.get("draft"):
        continue
    meta["slug"] = p.stem
    meta["body"] = md(body)
    meta["minutes"] = reading_time(body)
    d = meta.get("date")
    meta["date"] = d if isinstance(d, dt.date) else dt.date.fromisoformat(str(d))
    POSTS.append(meta)
POSTS.sort(key=lambda x: x["date"], reverse=True)

for e in EVENTS:
    for k in ("start", "end"):
        if e.get(k) and not isinstance(e[k], dt.date):
            e[k] = dt.date.fromisoformat(str(e[k]))
    e["day"] = f"{e['start'].day}." if not e.get("end") else f"{e['start'].day}.–{e['end'].day}."
    e["month"] = MONTHS_SHORT[e["start"].month - 1]
    e["year"] = e["start"].year
UPCOMING = sorted([e for e in EVENTS if (e.get("end") or e["start"]) >= TODAY], key=lambda e: e["start"])

OFFERS_BY_SLUG = {o["slug"]: o for o in OFFERS}
PAGES = {}
for p in (CONTENT / "pages").glob("*.md"):
    meta, body = read_front_matter(p)
    meta["body"] = md(body)
    PAGES[p.stem] = meta


# ---------- Schema.org ----------
def org_schema():
    a = SITE["address"]
    return {
        "@type": ["MedicalBusiness", "HealthAndBeautyBusiness"],
        "@id": abs_url("/#praxis"),
        "name": SITE["long_name"],
        "alternateName": SITE["name"],
        "slogan": SITE["claim"],
        "url": abs_url("/"),
        "email": SITE["email"],
        "telephone": SITE["phones"][0]["tel"],
        "address": {"@type": "PostalAddress", "streetAddress": a["street"], "postalCode": a["zip"],
                    "addressLocality": a["city"], "addressRegion": a["region"], "addressCountry": a["country"]},
        "geo": {"@type": "GeoCoordinates", "latitude": a["lat"], "longitude": a["lng"]},
        "areaServed": SITE["areas"],
        "sameAs": [v for v in SITE["social"].values() if v],
        "founder": [{"@type": "Person", "name": SITE["people"]["steffi"]["name"], "jobTitle": "Ärztin"},
                    {"@type": "Person", "name": SITE["people"]["stephan"]["name"]}],
        "knowsAbout": [o["title"] for o in OFFERS],
    }


def jsonld(*items):
    graph = [org_schema()] + [i for i in items if i]
    data = {"@context": "https://schema.org", "@graph": graph}
    return Markup('<script type="application/ld+json">' + json.dumps(data, ensure_ascii=False) + "</script>")


def breadcrumb(items):
    return {"@type": "BreadcrumbList", "itemListElement": [
        {"@type": "ListItem", "position": i + 1, "name": n, "item": abs_url(u)} for i, (n, u) in enumerate(items)]}


def faq_schema(faq):
    if not faq:
        return None
    return {"@type": "FAQPage", "mainEntity": [
        {"@type": "Question", "name": f["q"], "acceptedAnswer": {"@type": "Answer", "text": f["a"]}} for f in faq]}


# ---------- Rendern ----------
env = Environment(loader=FileSystemLoader(ROOT / "templates"), autoescape=select_autoescape(["html"]),
                  trim_blocks=True, lstrip_blocks=True)
env.globals.update(site=SITE, url=url, abs_url=abs_url, image=image, md=md, date_de=date_de,
                   offer_url=offer_url, groups=GROUPS, offers=OFFERS, offers_by_slug=OFFERS_BY_SLUG,
                   upcoming=UPCOMING, posts=POSTS, noindex=NOINDEX, year=TODAY.year, base=BASE)

SITEMAP = []


def render(template, path, **ctx):
    ctx.setdefault("canonical", abs_url(path))
    html_out = env.get_template(template).render(path=path, **ctx)
    target = OUT / path.lstrip("/")
    if path.endswith("/"):
        target = target / "index.html"
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(html_out, encoding="utf-8")
    if ctx.get("sitemap", True):
        SITEMAP.append(path)


def build():
    if OUT.exists():
        shutil.rmtree(OUT)
    OUT.mkdir()
    shutil.copytree(STATIC, OUT / "assets")

    render("index.html", "/", nav="start",
           title=f"{SITE['long_name']} in Sankt Englmar",
           description="Praxis für Naturmedizin und Bewusstsein in Sankt Englmar im Bayerischen Wald. IHHT, Eigenbluttherapie, Akupunktur, sanfte Ästhetik, schamanische Begleitung, Reiki, Hypnose und Retreats.",
           schema=jsonld({"@type": "WebSite", "url": abs_url("/"), "name": SITE["long_name"], "inLanguage": "de-DE"}))

    render("angebote.html", "/angebote/", nav="angebote",
           title="Unsere Angebote · VanAtma Sankt Englmar",
           description="Alle Angebote der Praxis VanAtma in Sankt Englmar: IHHT, Eigenbluttherapie, Akupunktur, sanfte Ästhetik, Microneedling, schamanische Begleitung, Reiki, Hypnose, Retreats.",
           schema=jsonld(breadcrumb([("Start", "/"), ("Angebote", "/angebote/")])))

    for o in OFFERS:
        if o.get("link"):
            continue
        person = o.get("person")
        provider = {"@id": abs_url("/#praxis")}
        service = {"@type": "Service", "name": o["title"], "serviceType": o["title"], "description": o["seo_description"],
                   "provider": provider, "areaServed": "Bayerischer Wald", "url": abs_url(offer_url(o))}
        render("offer.html", offer_url(o), nav="angebote", o=o, person=person,
               title=o.get("seo_title") or f"{o['title']} · VanAtma", description=o.get("seo_description", o["short"]),
               schema=jsonld(service, breadcrumb([("Start", "/"), ("Angebote", "/angebote/"), (o["title"], offer_url(o))]),
                             faq_schema(o.get("faq"))))

    render("philosophie.html", "/philosophie/", nav="philosophie",
           title="Philosophie und Longevity · VanAtma Sankt Englmar",
           description="Longevity bei VanAtma: ein langes, gesundes Leben entsteht, wenn Körper, Geist und Seele im Einklang sind. Unsere Haltung in Sankt Englmar.",
           schema=jsonld(breadcrumb([("Start", "/"), ("Philosophie", "/philosophie/")])))

    ev_schema = []
    for e in UPCOMING:
        s = {"@type": "Event", "name": f"{e['title']} · {e['subtitle']}", "startDate": e["start"].isoformat() + (f"T{e['start_time']}" if e.get("start_time") else ""),
             "endDate": (e.get("end") or e["start"]).isoformat() + (f"T{e['end_time']}" if e.get("end_time") else ""),
             "eventStatus": "https://schema.org/EventScheduled", "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
             "location": {"@type": "Place", "name": SITE["long_name"], "address": org_schema()["address"]},
             "description": " ".join(e["description"]), "organizer": {"@id": abs_url("/#praxis")},
             "url": abs_url(f"/veranstaltungen/{e['slug']}/")}
        if e.get("price_value"):
            s["offers"] = {"@type": "Offer", "price": e["price_value"], "priceCurrency": "EUR", "availability": "https://schema.org/InStock",
                           "url": abs_url(f"/veranstaltungen/{e['slug']}/")}
        ev_schema.append(s)
        render("event.html", f"/veranstaltungen/{e['slug']}/", nav="veranstaltungen", e=e,
               title=f"{e['title']} · {e['subtitle']} · VanAtma", description=f"{e['when']} in Sankt Englmar. " + e["description"][0][:110],
               schema=jsonld(s, breadcrumb([("Start", "/"), ("Veranstaltungen", "/veranstaltungen/"), (e["title"], f"/veranstaltungen/{e['slug']}/")])))
    render("events.html", "/veranstaltungen/", nav="veranstaltungen",
           title="Veranstaltungen, Retreats und Seminare · VanAtma",
           description="Retreats, Seminare und Kreise in Sankt Englmar im Bayerischen Wald. Alle Termine der Praxis VanAtma.",
           schema=jsonld(*ev_schema))

    render("blog.html", "/blog/", nav="blog", title="Blog · Heilraum Wissenswertes · VanAtma",
           description="Impulse und neue Erkenntnisse aus Naturmedizin, Longevity und Seelenarbeit von der Praxis VanAtma in Sankt Englmar.")
    for p in POSTS:
        author = SITE["people"].get(p.get("author", "stephan"), {})
        s = {"@type": "BlogPosting", "headline": p["title"], "datePublished": p["date"].isoformat(),
             "author": {"@type": "Person", "name": author.get("name", "")}, "publisher": {"@id": abs_url("/#praxis")},
             "description": p.get("excerpt", ""), "inLanguage": "de-DE", "mainEntityOfPage": abs_url(f"/blog/{p['slug']}/")}
        render("post.html", f"/blog/{p['slug']}/", nav="blog", p=p, author=author,
               title=f"{p['title']} · VanAtma Blog", description=p.get("excerpt", ""),
               schema=jsonld(s, breadcrumb([("Start", "/"), ("Blog", "/blog/"), (p["title"], f"/blog/{p['slug']}/")])))

    faq = load_yaml("faq.yaml")["faq"]
    render("faq.html", "/faq/", nav="", faq=faq, title="Häufige Fragen · VanAtma Sankt Englmar",
           description="Antworten auf häufige Fragen zur Praxis VanAtma in Sankt Englmar: Termine, Abrechnung, IHHT, Energiearbeit, Retreats und Gutscheine.",
           schema=jsonld(faq_schema(faq)))

    render("kontakt.html", "/kontakt/", nav="kontakt", title="Kontakt · VanAtma Sankt Englmar",
           description="Kontakt zur Praxis VanAtma, Bayerweg 57, 94379 Sankt Englmar. Termine nach Vereinbarung, Privatpraxis.")

    for key in ("impressum", "datenschutz"):
        pg = PAGES[key]
        render("legal.html", f"/{key}/", nav="", pg=pg, title=f"{pg['title']} · VanAtma", description=pg["title"],
               sitemap=key == "impressum")

    render("404.html", "/404.html", nav="", title="Seite nicht gefunden · VanAtma", description="", sitemap=False)

    # sitemap, robots, llms
    urls = "".join(f"<url><loc>{abs_url(p)}</loc><lastmod>{TODAY.isoformat()}</lastmod></url>" for p in SITEMAP)
    (OUT / "sitemap.xml").write_text(f'<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">{urls}</urlset>', encoding="utf-8")
    if NOINDEX:
        robots = "User-agent: *\nDisallow: /\n"
    else:
        robots = "User-agent: *\nAllow: /\n\n# KI-Suchdienste ausdrücklich willkommen\nUser-agent: GPTBot\nAllow: /\nUser-agent: OAI-SearchBot\nAllow: /\nUser-agent: ClaudeBot\nAllow: /\nUser-agent: PerplexityBot\nAllow: /\nUser-agent: Google-Extended\nAllow: /\n\n" + f"Sitemap: {abs_url('/sitemap.xml')}\n"
    (OUT / "robots.txt").write_text(robots, encoding="utf-8")
    (OUT / "llms.txt").write_text(env.get_template("llms.txt").render(), encoding="utf-8")
    (OUT / ".nojekyll").write_text("")
    if (ROOT / "CNAME").exists():
        shutil.copy(ROOT / "CNAME", OUT / "CNAME")
    print(f"Fertig: {len(SITEMAP)} Seiten nach {OUT}")


if __name__ == "__main__":
    build()
