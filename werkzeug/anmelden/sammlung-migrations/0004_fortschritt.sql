CREATE TABLE IF NOT EXISTS unterricht_fortschritt (
 gruppeId TEXT NOT NULL REFERENCES unterricht_gruppen(id),
 geraetId TEXT NOT NULL,
 videoId TEXT NOT NULL,
 schritte TEXT NOT NULL,
 stand INTEGER NOT NULL,
 PRIMARY KEY (gruppeId,geraetId,videoId)
);
