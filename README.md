# KI-Portfolio

Kleine Anwendungen, die zeigen, wie sich die Anthropic-API praktisch einsetzen lässt.
Stack: Python (Flask) + vanilla JavaScript + Claude Opus 4.7 via Server-Sent Events.

---

## LehrerBrief — KI-Schreibassistent für Lehrkräfte

**Live-Demo:** https://lehrerbrief.onrender.com

Formularbasiertes Tool, das professionelle Briefe an Eltern, Schulleitung oder Kollegen
in Sekunden generiert — inkl. passendem Ton, Anrede und Grußformel. Der Text wird per
SSE direkt während der Generierung in die UI gestreamt.

- Quellcode: [`02-textgenerator/`](./02-textgenerator)
- Tech: Flask, Anthropic SDK, flask-limiter, vanilla JS/CSS
- Schutz: Rate-Limit (5 Briefe/h, 20/d pro IP) + Spending-Limit im Anthropic-Konto

> Gehostet auf Render Free Tier. Nach 15 Min Inaktivität schläft der Service —
> der erste Request nach langer Pause kann ~30 Sekunden dauern.

---

## Mathewes Coffee & Deli — Website mit KI-Assistent

**Live-Demo:** https://mathewes.onrender.com

Komplette Landing-Page für einen fiktiven Hamburger Gastro-Betrieb, inklusive
eingebettetem Chat-Assistenten (Bubble unten rechts). Claude bekommt pro Request
die aktuellen Standorte, Öffnungszeiten, Preise und FAQs aus einer SQLite-DB als
System-Prompt injiziert — Änderungen in der DB wirken sofort, ohne Neustart.

- Quellcode: [`01-chatbot/`](./01-chatbot)
- Tech: Flask, Anthropic SDK, SQLite, flask-limiter, GSAP + Lenis (Smooth Scroll)
- Schutz: Rate-Limit (10 Nachrichten/h, 40/d pro IP) + Spending-Limit im Anthropic-Konto

> Gehostet auf Render Free Tier. Nach 15 Min Inaktivität schläft der Service —
> der erste Request nach langer Pause kann ~30 Sekunden dauern.

---

## Lokale Entwicklung

Voraussetzungen: Python 3.9+, Umgebungsvariable `ANTHROPIC_API_KEY`.

```bash
# LehrerBrief
cd 02-textgenerator
pip install -r requirements.txt
python app.py                      # http://localhost:5001

# Chatbot
cd 01-chatbot
python setup_db.py                 # SQLite-DB neu aufbauen
python app.py                      # http://localhost:5000
```
