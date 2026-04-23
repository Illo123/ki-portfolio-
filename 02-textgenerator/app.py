from flask import Flask, request, Response, send_from_directory
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from werkzeug.middleware.proxy_fix import ProxyFix
import anthropic
import json

app = Flask(__name__, static_folder='.', static_url_path='')
# Render terminates TLS and sets X-Forwarded-For — trust one hop so rate-limit keys use the real client IP.
app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1, x_host=1)

limiter = Limiter(
    key_func=get_remote_address,
    app=app,
    default_limits=['60 per hour'],
)

client = anthropic.Anthropic()

VORLAGEN = {
    'eltern': {
        'elternbrief':       'einen allgemeinen Elternbrief',
        'elterngespräch':    'eine Einladung zum Elterngespräch',
        'verhaltensauffälligkeit': 'ein Schreiben über Verhaltensauffälligkeiten',
        'leistungsrückgang': 'ein Schreiben über einen Leistungsrückgang',
        'klassenfahrt':      'einen Informationsbrief zur Klassenfahrt/zum Schulausflug',
        'fehlzeiten':        'ein Schreiben wegen unentschuldigter Fehlzeiten',
        'lob':               'einen Lobbrief für besondere Leistungen oder Verhalten',
    },
    'schulleitung': {
        'krankmeldung':      'eine Krankmeldung',
        'urlaubsantrag':     'einen Urlaubsantrag',
        'vorfallsbericht':   'einen Vorfallsbericht',
        'anschaffungsantrag':'einen Antrag zur Beschaffung von Unterrichtsmaterial',
        'bericht':           'einen allgemeinen Bericht / eine Rückmeldung',
    },
    'kollegen': {
        'vertretung':        'eine Vertretungsanfrage',
        'besprechung':       'eine Einladung zur Besprechung oder Teamsitzung',
        'info':              'eine allgemeine Information ans Kollegium',
        'aufgabenübergabe':  'eine Aufgabenübergabe bei Abwesenheit',
        'danke':             'eine Dankesnachricht an Kollegen',
    },
}

TON = {
    'formell':    'sehr formell und professionell',
    'freundlich': 'freundlich und wertschätzend, aber professionell',
    'sachlich':   'sachlich und klar, ohne Floskeln',
}

EMPFAENGER_ANREDE = {
    'eltern':       'Sehr geehrte Damen und Herren / Sehr geehrte Erziehungsberechtigte',
    'schulleitung': 'Sehr geehrte Schulleitung',
    'kollegen':     'Liebe Kolleginnen und Kollegen',
}

@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/generieren', methods=['POST'])
@limiter.limit('5 per hour; 20 per day')
def generieren():
    data        = request.get_json()
    empfänger   = data.get('empfänger', 'eltern')
    texttyp     = data.get('texttyp', '')
    details     = data.get('details', '')
    ton         = data.get('ton', 'freundlich')
    absender    = data.get('absender', '')
    klasse      = data.get('klasse', '')

    if not details:
        return {'error': 'Keine Details angegeben'}, 400

    vorlagen    = VORLAGEN.get(empfänger, VORLAGEN['eltern'])
    typ_text    = vorlagen.get(texttyp, list(vorlagen.values())[0])
    ton_text    = TON.get(ton, TON['freundlich'])
    anrede      = EMPFAENGER_ANREDE.get(empfänger, '')

    prompt = f"""Du bist Lehrer/in an einer deutschen Schule und schreibst {typ_text} an: {empfänger}.

Ton: {ton_text}
Anrede: {anrede}
{"Klasse/Schüler: " + klasse if klasse else ""}
{"Absender (Unterschrift): " + absender if absender else "Absender: [Lehrername]"}

Inhalt und Anlass:
{details}

Schreibe einen vollständigen, professionellen Brief auf Deutsch.
Beginne direkt mit der Anrede — kein einleitender Kommentar.
Nutze einen passenden Betreff. Achte auf korrekte Grußformel und Unterschrift."""

    def stream():
        with client.messages.stream(
            model='claude-opus-4-7',
            max_tokens=1200,
            messages=[{'role': 'user', 'content': prompt}],
        ) as s:
            for text in s.text_stream:
                yield f"data: {json.dumps({'text': text})}\n\n"
        yield "data: [DONE]\n\n"

    return Response(stream(), mimetype='text/event-stream',
                    headers={'Cache-Control': 'no-cache', 'X-Accel-Buffering': 'no'})


if __name__ == '__main__':
    app.run(debug=True, port=5001, threaded=True)
