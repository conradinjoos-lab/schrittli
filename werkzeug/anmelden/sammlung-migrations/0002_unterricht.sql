CREATE TABLE IF NOT EXISTS unterricht_gruppen (
 id TEXT PRIMARY KEY,
 name TEXT NOT NULL,
 tokenHash TEXT NOT NULL UNIQUE,
 policy TEXT NOT NULL DEFAULT '{"mode":"closed","title":"Alles geschlossen","ids":[]}',
 revision INTEGER NOT NULL DEFAULT 1,
 erstellt INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS unterricht_geraete (
 gruppeId TEXT NOT NULL REFERENCES unterricht_gruppen(id),
 id TEXT NOT NULL,
 name TEXT NOT NULL,
 gesehen INTEGER NOT NULL,
 revision INTEGER NOT NULL DEFAULT 0,
 PRIMARY KEY (gruppeId,id)
);
CREATE TABLE IF NOT EXISTS unterricht_favoriten (
 id TEXT PRIMARY KEY,
 name TEXT NOT NULL,
 policy TEXT NOT NULL
);
