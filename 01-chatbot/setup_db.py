import sqlite3

conn = sqlite3.connect('mathewes.db')
c = conn.cursor()

# ===========================
# TABELLEN ERSTELLEN
# ===========================
c.executescript("""
    DROP TABLE IF EXISTS standorte;
    DROP TABLE IF EXISTS öffnungszeiten;
    DROP TABLE IF EXISTS produkte;
    DROP TABLE IF EXISTS faq;

    CREATE TABLE standorte (
        id          INTEGER PRIMARY KEY,
        name        TEXT NOT NULL,
        adresse     TEXT,
        telefon     TEXT,
        besonderheiten TEXT
    );

    CREATE TABLE öffnungszeiten (
        id          INTEGER PRIMARY KEY,
        standort_id INTEGER,
        tage        TEXT,
        zeiten      TEXT,
        FOREIGN KEY (standort_id) REFERENCES standorte(id)
    );

    CREATE TABLE produkte (
        id          INTEGER PRIMARY KEY,
        kategorie   TEXT NOT NULL,
        name        TEXT NOT NULL,
        preis       REAL NOT NULL
    );

    CREATE TABLE faq (
        id          INTEGER PRIMARY KEY,
        frage       TEXT NOT NULL,
        antwort     TEXT NOT NULL
    );
""")

# ===========================
# STANDORTE
# ===========================
c.executemany("INSERT INTO standorte VALUES (?,?,?,?,?)", [
    (1, 'Coffee & Deli — Perle Hamburg', 'Gerhard-Hauptmann-Platz 50', '040 320 89 888', 'Sitzplätze, WLAN, Catering-Abholung'),
    (2, 'Bahnhofsbäcker — BF Harburg',  'Hannoverschestr. 85, Harburg', None,            'Frühester Start, To-Go, Bahnhofslage'),
    (3, 'Grillstation & ZOB',            'Hamburg ZOB',                 None,            'Grillspezialitäten, Busbahnhof'),
])

# ===========================
# ÖFFNUNGSZEITEN
# ===========================
c.executemany("INSERT INTO öffnungszeiten (standort_id, tage, zeiten) VALUES (?,?,?)", [
    (1, 'Mo–Sa', '08:00 – 20:00'),
    (1, 'So',    'geschlossen'),
    (2, 'Mo–Fr', '04:00 – 19:30'),
    (2, 'Sa–So', '04:00 – 19:00'),
    (3, 'täglich', 'auf Anfrage'),
])

# ===========================
# PRODUKTE
# ===========================
c.executemany("INSERT INTO produkte (kategorie, name, preis) VALUES (?,?,?)", [
    # Kaffee
    ('kaffee', 'Espresso',                2.20),
    ('kaffee', 'Cappuccino',              3.40),
    ('kaffee', 'Latte Macchiato',         3.80),
    ('kaffee', 'Filterkaffee',            2.50),
    ('kaffee', 'Flat White',              3.60),
    # Frühstück
    ('frühstück', 'Butter-Croissant',          2.20),
    ('frühstück', 'Käsebrötchen',              2.80),
    ('frühstück', 'Schinken-Käse-Brötchen',    3.20),
    ('frühstück', 'Obstsalat',                 3.90),
    ('frühstück', 'Rührei auf Toast',          4.50),
    ('frühstück', 'Frühstücks-Set (Kaffee + Brötchen)', 5.50),
    # Mittagessen
    ('mittagessen', 'Tagesgericht (wechselnd)', 7.90),
    ('mittagessen', 'Suppe des Tages',          4.50),
    ('mittagessen', 'Hausgemachte Limo',         2.80),
    ('mittagessen', 'Bio-Tee',                  2.50),
])

# ===========================
# FAQ
# ===========================
c.executemany("INSERT INTO faq (frage, antwort) VALUES (?,?)", [
    ('Kann ich online bestellen?',           'Aktuell nur telefonisch oder per E-Mail für Catering-Anfragen.'),
    ('Gibt es vegetarische Optionen?',       'Ja, täglich. Vegane Produkte bitte vor Ort erfragen.'),
    ('Bietet ihr Lieferservice an?',         'Kein Lieferservice — nur Abholung oder Catering vor Ort.'),
    ('Wie kann ich Catering anfragen?',      'Per E-Mail: info@mathewes-coffee.de oder Tel: 040 320 89 888. Ab 10 Personen.'),
])

conn.commit()
conn.close()
print("✓ Datenbank erfolgreich erstellt: mathewes.db")
