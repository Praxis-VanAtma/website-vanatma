# Website VanAtma

Website der **VanAtma Praxis für Naturmedizin und Bewusstsein** in Sankt Englmar.
Statische Website, gebaut mit `build.py` (Python, Jinja2, Markdown) und veröffentlicht über GitHub Pages.

## Inhalte pflegen

| Was | Wo |
|---|---|
| Praxisdaten, Telefon, Navigation, HubSpot-IDs | `content/data/site.yaml` |
| Angebote (Kacheln und Detailseiten) | `content/data/offers.yaml` |
| Veranstaltungen | `content/data/events.yaml` (vergangene verschwinden automatisch) |
| Häufige Fragen | `content/data/faq.yaml` |
| Blogbeiträge | `content/blog/*.md` (eine Datei pro Beitrag) |
| Impressum, Datenschutz | `content/pages/*.md` |
| Fotos | `static/img/` (Dateinamen siehe unten) |

Jede Änderung auf `main` wird automatisch gebaut und veröffentlicht.

## Fotos

Liegt ein Foto mit dem passenden Namen in `static/img/`, erscheint es automatisch.
Fehlt es, zeigt die Seite eine ruhige Waldfläche als Platzhalter.

| Datei | Motiv | Canva-Ordner |
|---|---|---|
| `logo.png` | Logo, quadratisch, transparent | – |
| `hero-start.jpg` | Waldlichtung im Morgenlicht, quer | 03 Natur |
| `statement-wald.jpg` | Nebel über dem Wald, quer | 03 Natur |
| `statement-licht.jpg` | Sonnenlicht im Wald, quer | 03 Natur |
| `hero-philosophie.jpg` | Alter Baum mit Wurzeln, quer | 03 Natur |
| `hero-angebote.jpg`, `hero-blog.jpg`, `hero-faq.jpg`, `hero-veranstaltungen.jpg` | Stimmungsbilder, quer | 03 Natur / 05 Veranstaltungen |
| `kontakt-praxis.jpg`, `kontakt-garten.jpg`, `anfahrt.jpg`, `philosophie-praxis.jpg` | Praxis, Eingang, Garten | 01 Praxis |
| `team-steffi.jpg`, `team-stephan.jpg`, `team-beide.jpg` | Porträts | 02 Team |
| `angebot-<name>.jpg` | je Angebot, siehe `offers.yaml` | 04 Angebote |
| `event-<name>.jpg` | je Veranstaltung, siehe `events.yaml` | 05 Veranstaltungen |
| `blog-<name>.jpg` | je Beitrag | 06 Blog |
| `og.jpg` | Vorschaubild für Social Media, 1200×630 | – |

Querformat-Bilder mindestens 2000 px breit, als JPG mit etwa 80 % Qualität.

## Lokal bauen

```
pip install -r requirements.txt
python3 build.py
```
