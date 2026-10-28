CREATE TABLE IF NOT EXISTS sammlungen (
 id TEXT PRIMARY KEY, name TEXT NOT NULL, tokenHash TEXT NOT NULL UNIQUE,
 erstellt TEXT NOT NULL, aktiv INTEGER NOT NULL DEFAULT 1, version INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS schulwerke (
 id TEXT PRIMARY KEY, sammlungId TEXT NOT NULL REFERENCES sammlungen(id),
 videoId TEXT NOT NULL, titel TEXT NOT NULL, name TEXT NOT NULL,
 klasse INTEGER NOT NULL CHECK(klasse BETWEEN 1 AND 6),
 sterne INTEGER NOT NULL CHECK(sterne BETWEEN 1 AND 5),
 erstellt INTEGER NOT NULL, foto BLOB, geloescht INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS schulwerke_sammlung ON schulwerke(sammlungId, erstellt DESC);
CREATE TRIGGER IF NOT EXISTS schulwerke_neu AFTER INSERT ON schulwerke BEGIN
 UPDATE sammlungen SET version=version+1 WHERE id=NEW.sammlungId;
END;
CREATE TRIGGER IF NOT EXISTS schulwerke_geaendert AFTER UPDATE ON schulwerke BEGIN
 UPDATE sammlungen SET version=version+1 WHERE id=NEW.sammlungId;
END;
