from flask import Flask, request, Response, send_from_directory
import anthropic
import sqlite3
import json
import os

app = Flask(__name__, static_folder='.', static_url_path='')
client = anthropic.Anthropic()

def lade_daten_aus_db():
    """Liest alle aktuellen Daten aus der Datenbank und gibt sie als Text zurück."""
    conn = sqlite3.connect('mathewes.db')
    conn.row_factory = sqlite3.Row
    c = conn.cursor()

    # Standorte + Öffnungszeiten
    standorte = c.execute("SELECT * FROM standorte").fetchall()
    zeiten    = c.execute("SELECT * FROM öffnungszeiten").fetchall()
    produkte  = c.execute("SELECT * FROM produkte ORDER BY kategorie, preis").fetchall()
    faqs      = c.execute("SELECT * FROM faq").fetchall()
    conn.close()

    # Zu lesbarem Text zusammenbauen
    text = "=== STANDORTE ===\n"
    for s in standorte:
        text += f"\n{s['name']}\nAdresse: {s['adresse']}\n"
        if s['telefon']:
            text += f"Telefon: {s['telefon']}\n"
        oz = [z for z in zeiten if z['standort_id'] == s['id']]
        text += "Öffnungszeiten: " + ", ".join(f"{z['tage']}: {z['zeiten']}" for z in oz) + "\n"
        if s['besonderheiten']:
            text += f"Besonderheiten: {s['besonderheiten']}\n"

    text += "\n=== ANGEBOT & PREISE ===\n"
    aktuelle_kategorie = None
    for p in produkte:
        if p['kategorie'] != aktuelle_kategorie:
            aktuelle_kategorie = p['kategorie']
            text += f"\n[{aktuelle_kategorie.upper()}]\n"
        text += f"  {p['name']}: {p['preis']:.2f} €\n"

    text += "\n=== HÄUFIGE FRAGEN ===\n"
    for f in faqs:
        text += f"\nF: {f['frage']}\nA: {f['antwort']}\n"

    return text

def erstelle_system_prompt():
    daten = lade_daten_aus_db()
    return f"""Du bist der freundliche digitale Assistent von Mathewes Coffee & Deli Hamburg.
Du beantwortest Fragen zu Standorten, Öffnungszeiten, Angebot und Preisen.
Antworte immer auf Deutsch, freundlich und präzise.

Aktuelle Daten aus unserer Datenbank:

{daten}

Antworte nur auf Basis dieser Daten. Erfinde keine Produkte oder Preise."""

@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/chat', methods=['POST'])
def chat():
    data = request.get_json()
    messages = data.get('messages', [])

    def stream():
        with client.messages.stream(
            model='claude-opus-4-7',
            max_tokens=1024,
            system=erstelle_system_prompt(),
            messages=messages,
        ) as stream:
            for text in stream.text_stream:
                yield f"data: {json.dumps({'text': text})}\n\n"
        yield "data: [DONE]\n\n"

    return Response(stream(), mimetype='text/event-stream',
                    headers={'Cache-Control': 'no-cache', 'X-Accel-Buffering': 'no'})

if __name__ == '__main__':
    app.run(debug=True, port=5000, threaded=True)
