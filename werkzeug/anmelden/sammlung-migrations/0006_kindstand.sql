CREATE TABLE IF NOT EXISTS unterricht_kindstand (
 gruppeId TEXT NOT NULL REFERENCES unterricht_gruppen(id),
 kindKey TEXT NOT NULL,
 videoId TEXT NOT NULL,
 schritt INTEGER,
 max INTEGER,
 videoFertig INTEGER,
 werkFertig INTEGER,
 stand INTEGER NOT NULL,
 PRIMARY KEY (gruppeId,kindKey,videoId)
);
