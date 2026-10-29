CREATE TABLE IF NOT EXISTS wuensche (
 id TEXT PRIMARY KEY, schluessel TEXT NOT NULL UNIQUE, name TEXT NOT NULL, text TEXT,
 anzahl INTEGER NOT NULL DEFAULT 1, status TEXT NOT NULL DEFAULT 'neu',
 hinweis TEXT, titel TEXT, welt TEXT, svg TEXT, grund TEXT, figur TEXT,
 versuche INTEGER NOT NULL DEFAULT 0, erstellt INTEGER NOT NULL, geaendert INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS wuensche_status ON wuensche(status,erstellt);
CREATE TABLE IF NOT EXISTS wunsch_kosten (
 zeit INTEGER NOT NULL, wunsch TEXT NOT NULL, eingabe INTEGER NOT NULL, ausgabe INTEGER NOT NULL, usd REAL NOT NULL
);
CREATE INDEX IF NOT EXISTS wunsch_kosten_zeit ON wunsch_kosten(zeit);
