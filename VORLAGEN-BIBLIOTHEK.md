# Vorlagen-Bibliothek: Bestand und Ausbau

Stand 28. Oktober 2026. Analyse der Schablonen und Vorlagen in «Schritt für Schritt» und Ideenkatalog für eine sehr grosse Bibliothek.

## 1. Was wir haben

| Bereich | Umfang | Wo | Quelle / Pipeline |
|---|---|---|---|
| Schablonen-Generator | 363 Formen in 11 Gruppen (Grundformen 20, Natur 25, Essen 11, Dinge 43, Feste 18, Tiere 53, Masken 13, Schweiz 10, Werkhilfen 109, Nähen 25, Buchstaben 36); 126 Formen bringen eine empfohlene Grösse mit (`cm`) | `vorlagen/` | `werkzeug/vorlagen/formen*.py` → `vorlagen/formen.js` |
| Figuren aus Bildern | 760 Figuren in 36 Welten (Wald & Wiese 43, Wetter & Himmel 38, Buchstaben & Zahlen bunt 36, Emojis & Gefühle 41, Flaggen & Kontinente 40, Weihnachten 40, Berge 23, Städte 24, Wetter & Himmel 38, Buchstaben & Zahlen bunt 36, Emojis & Gefühle 41, Geburtstag & Party 12, Küche & Restaurant 32, Liebe & Hochzeit 23, Kreativ & Basteln 25, Games 43, Pokémon & Sonic 32, Mario 32, Sanrio 30, Minecraft 26, Cartoons 26, Zeitlos 20, Anime 16, Disney 16, Ninjago 15, Minions 13, Superhelden 13, Fasnacht & Gesichter 12, Star Wars 11, Harry Potter 9, Dinos & Fabelwesen 8, Schweiz & Alpen 7, Alltag 6, Weltraum 5, Meer 5, Fahrzeuge 5, Frühling & Sommer 4, Piraten & Ritter 3, Tierwelt 26); die 67 Figuren der neun Welle-3-Welten und von «Geburtstag & Party», die 32 von «Küche & Restaurant», die 23 von «Liebe & Hochzeit» die 40 von «Weihnachten», die 43 von «Wald & Wiese» sowie die 26 der Tierwelt stammen aus CC0-Bildern, Quellen in `werkzeug/vorlagen/quellen-cc0.md`; Berge und Städte: 47 eigene Polygon-Silhouetten (`werkzeug/vorlagen/silhouetten.py`, CC0), Quellen in `quellen.md`; Welle 4 (Buchstaben bunt, Wetter, Emojis, Flaggen, Feste) aus Twemoji (CC-BY) und Openclipart (CC0), Quellen in `werkzeug/vorlagen/quellen.md` | `vorlagen/figuren/` | `werkzeug/vorlagen/bild.py`, 760 PNG in `werkzeug/vorlagen/bilder/` |
| Perlentiere | 302 Figuren, alle Stufe «schwer», Breite 30–60 Perlen | `vorlagen/perlen/` | `perlen.cjs`, Editor im Browser |
| Perlentier aus Bild | eigenes Bild → Rocailles-Plan mit Drahtweg | `vorlagen/perlentier-bild/` | nur lokal |
| Armbänder | 4 Arten (Perlenarmband ab 1., Flechtband ab 1., Freundschaftsband ab 3., Perlen-Webband ab 4.), 13 Muster, Pixel-Schrift für Namen | `vorlagen/armbaender/` | im HTML |
| Abpausen | Bild vergrössern, Bildschirm einfrieren, abpausen | `vorlagen/einfrieren/` | im HTML |
| Feste PDFs | Nikolausstiefel A4, Startrampe A3 (Raketenstation) | `vorlagen/`, `anleitungen/` | `nikolausstiefel.py`, Hand |
| Foto-Anleitungen mit Vorlage | 28 Anleitungen, 2 mit eigener Vorlage (Raketenstation A3 und A4) | `anleitungen/` | `anleitungen.json` |
| Schulvideos mit Vorlage | 72 von 352 Videos verweisen auf den Generator (`?form=…`) | `schule/schule.json` | Feld `vorlagen` |
| Privat (nicht im Repo) | Web-Motive als Pixelraster, Perlentier-Entwürfe, Papierflieger | `privat/` | Aufträge in `AUFTRAG.md` |

Was der Generator heute kann: Grösse frei bis 100 cm, Seitenverhältnis sperren, Anzahl und «Blatt füllen», mehrere Formen zusammen auf dem Blatt (MaxRects-Packen), Nählinie innen oder Nahtzugabe aussen, Einstichpunkte, Farbflächen mit Farbliste zum Malen, Spiegeln, Zacken und Ecken bei Stern und Vieleck, 5-cm-Kontrolllinie, Link mit allen Einstellungen, Abpausen am iPad. **Neu seit heute: Papier A4 oder A3.**

Was fehlt im Vergleich zum Unterricht (Wissensspeicher): 84 Einträge im Katalog brauchen eine Vorlage, Schablone oder ein Muster, die meisten davon noch ohne digitale Vorlage. Lücken nach Verfahren: Sticken 1., Stricken 6., Wickeln 5./6., Filzen 1., Sägen & Nageln 1./6., Experimentieren 6.

## 2. Wie die Bibliothek wächst

Drei Wege, vom schnellsten zum aufwendigsten:

1. **Geometrische Formen in Python** (`formen*.py`): ein Eintrag pro Form, shapely-Geometrie, sofort im Generator. Ideal für Werkhilfen, Grundformen, Netze, Raster.
2. **Motive als PNG mit schwarzer Umrisslinie** (`bild.py`): ein Bild pro Motiv, Pipeline rechnet Umriss, Farbflächen und Details. Ideal für Tiere, Figuren, Saisonmotive. Comic-Stil mit Umriss ist Pflicht.
3. **Neue Vorlagen-Art** (eigene Seite oder neuer Modus im Generator): Pixelraster, nummerierte Punkte, Abwicklungen mit Massen. Mehr Aufwand, dafür ganze Familien von Vorlagen auf einmal.

## 3. Ideenkatalog

### 3a. Werkhilfen und Raster (Weg 1, schnell)

| Verfahren | Vorlagen |
|---|---|
| Knüpfen, Flechten | Knüpfscheibe mit 8, 16 und 32 Kerben; Kumihimo-Quadratscheibe; Flechtstern (5-, 6-, 8-strahlig); Kordelscheibe; Makramee-Federgrund in 3 Grössen |
| Weben | Webrahmen 8 bis 20 cm mit Kerben alle 0,5 und 1 cm; runde Webscheibe mit 7, 9, 11, 13 Schlitzen; Spinnennetz-Webscheibe; Sternweben-Scheibe; Webblume; Lama-, Igel-, Huhn-Webrahmen (Klassenprojekt Webhuhn, Webigel); Papierweb-Blätter mit Streifen 1, 1,5, 2 cm; Perlenraster 5, 7, 9, 11 Perlen breit |
| Sticken | Lochkarten mit Punktraster (Quadrat, Kreis, Herz, Stern); Stickkarten mit vorgestochenen Linien (Haus, Boot, Baum); Kreuzstich-Raster 10 × 10 bis 30 × 30; Stickrahmen-Kreis 10, 12, 15 cm als Schnittvorlage für Stoff |
| Fadengrafik | Kreis mit 24, 36, 48 nummerierten Punkten (Einmaleins-Brett!); Quadrat, Dreieck, Herz, Stern mit nummerierten Punkten; Parabel-Kurven |
| Holz, Nageln | Nagelbild-Raster (Kreis, Herz, Stern, Buchstaben); Bohrraster für Stiftehalter (3 × 3, 4 × 4, Kreis); Mühle, Tic-Tac-Toe, Solitär, Halma-Spielfelder; Puzzle-Schnittlinien 4 bis 12 Teile |
| Falten, Schachteln | Netze: Würfel, Quader, Pyramide, Prisma, Zylinder, Kegel (auch als Giessformen für Kerzen); Faltschachtel mit Deckel in 3 Grössen; Briefumschlag; Papierhut; Laternen-Abwicklung mit Fenstern |
| Papier | Rasterpapier (Karo 5 mm, 1 cm, Punktraster, Isometrie, Linien); Lineal und Massband zum Drucken; Etiketten und Namensschilder; Lochkarte für Lochmuster |
| Formen, Ton | Ausstech-Schablonen (Blatt, Herz, Stern, Mond); Schalenschablone rund und oval; Tierplatten (Eisbär, Katze, Fuchs) für den Stiftehalter aus Tonplatte |
| Drucken | Stempelmotive für Moosgummi (einfach, spiegelverkehrt gedruckt); Schablonen zum Schablonieren (Negativformen); Buchstaben und Zahlen als Stempel |
| Experimentieren | Wärmekarussell-Spirale; Papierhelikopter; Windrad 4- und 8-flüglig; Fallschirm-Kreis; Boot und Katamaran; Zahnräder 8, 12, 16 Zähne; Sonnenuhr; Kreiselscheiben mit Mustern (Newton-Farbkreis, Benham-Scheibe) |
| Metall | Prägesterne 3 Grössen; Drahtfiguren als Biegevorlage (Herz, Stern, Name); Alufolie-Anhänger |

### 3b. Schnittmuster Nähen und Filzen (Weg 1 und 2)

Mit Nahtzugabe und Einstichpunkten direkt aus dem Generator. Grosse Teile brauchen A3.

- 1.–2. Klasse: Nadelkissen, Filzsäckchen mit Klappe, Eierwärmer, Fingerpuppen (5 Tiere), Schlüsselanhänger, Lavendelsäckli, Nikolausgesicht aus Filz, Handpuppe Grundform.
- 3.–4. Klasse: Täschli mit Klappe und Knopf, Etui flach und mit Reissverschluss, Topflappen, Wärmekissen, Kuschelmonster (KUMO, 6 Grundkörper), Sockendrache-Teile, Filz-Etui mit Tic-Tac-Toe (Klassenprojekt).
- 5.–6. Klasse: Turnsack (A3), Lesekissen Knochen (A3), Plüschtier-Fisch (A3), Lunchbag, Utensilo, Kissenhülle 40 × 40, Kabelorganizer, Fleece-Schal mit Fransen (Masse), Leder-Etui, Mütze aus Fleece (4 Segmente).
- Filzen: Nassfilz-Schablonen (Blume, Ball-Hohlform, Etui), Filzblumen 3 Grössen (Klassenprojekt), Eierwärmer-Hohlform.

### 3c. Motive (Weg 2, Comic-PNG mit Umriss)

| Thema | Motive |
|---|---|
| Herbst | Ahorn-, Eichen-, Kastanienblatt, Kastanie, Pilz, Kürbis, Igel, Eichhörnchen, Herbstbaum (Klassenprojekt), Drachen |
| Advent, Winter | Engel, Tannenbaum, Rentier, Lebkuchenmann, Kerze, Schneemann, Glocke, Zuckerstange, Geschenk, Stern 3D, Schlitten, Pinguin |
| Fasnacht | Clown, Konfetti-Formen, Maskenfamilie (Katze, Fuchs, Superheld, Schmetterling) mit Augenlöchern |
| Frühling, Ostern | Osterhase, Ei (glatt, gemustert), Küken, Tulpe, Narzisse, Schmetterling, Marienkäfer, Biene, Regenbogen |
| Sommer | Sonne, Glace, Boot, Krebs, Muschel, Seestern, Wal, Flip-Flop, Sonnenbrille |
| Schweiz | Edelweiss, Kuh mit Glocke, Alphorn, Schweizer Kreuz, Berge, Matterhorn, Steinbock, Murmeltier, Fondue-Caquelon |
| Fahrzeuge | Auto, Lastwagen, Traktor, Flugzeug, Rakete, Heissluftballon, Zug, Bagger, Velo |
| Dinos, Urzeit | T-Rex, Triceratops, Stegosaurus, Brachiosaurus, Pterodactylus, Mammut |
| Meer | Clownfisch, Hai, Oktopus, Schildkröte, Delfin, Qualle (Klassenprojekt Kordel-Qualle), Seepferd |
| Fabelwesen | Drache, Einhorn, Meerjungfrau, Fee, Roboter, Alien, Monster-Familie |
| Weltraum | Planet mit Ring, Astronaut, Sternschnuppe, Mond mit Gesicht, Ufo |
| Alltag | Haus, Schlüssel, Krone, Uhr, Brille, Hut, Schuh, Kleid, Hose, T-Shirt, Socke, Fäustling |
| Gesichter | Emoji-Familie (froh, traurig, wütend, müde) für Gefühle-Stempel |
| Piraten, Ritter | Schwert (Klassenprojekt, A3), Schild, Krone, Totenkopf-Flagge, Schatztruhe, Helm |

### 3d. Neue Vorlagen-Arten (Weg 3)

1. **Buchstaben und Zahlen als Form.** Alphabet und 0–9 in einer runden Schrift; Name eingeben, alle Buchstaben kommen aufs Blatt. Für Türschilder, Filzbuchstaben, Nagelbilder, Stempel. Grösster einzelner Gewinn, weil jedes Kind seinen Namen will.
2. **Nummerierte Punkte** auf jeder Form (Fadengrafik, Nagelbild): Punkte durchnummeriert, Abstand wählbar. Baut auf den Einstichpunkten auf.
3. **Pixel-Editor für Zählmuster:** gibt es schon als `vorlagen/zaehlmuster/` (Raster zeichnen, Kreuzstich und Weben, A4/A3, Farblegende); dasselbe Raster taugt auch für Bügelperlen. Die privaten Web-Motive bleiben privat.
4. **Netze mit Massen:** eingebaut (Welle 3). In der Gruppe «Werkhilfen» stehen «Quader nach Mass» und «Schachtel offen nach Mass»: Breite × Tiefe × Höhe in cm eingeben, Klebelaschen und Falzlinien kommen automatisch; das Netz wird im Browser gerechnet (Clipper-Union), in der Adresse als `m=8x5x4`, auch in Listen.
5. **Poster-Modus:** eingebaut (Welle 3). Passt eine Form nicht aufs Blatt, wird sie automatisch auf bis zu 30 Blätter gekachelt (1 cm Überlappung, Passkreuze, Klebestreifen rechts und unten, Schneidelinie links und oben, Übersichtskarte pro Blatt); Grössen-Chips bis 40 cm (A4) bzw. 60 cm (A3).
6. **Masken mit Augenlöchern** und Gummiband-Löchern: eingebaut (Welle 3) als Gruppe «Masken» (`formen_masken.py`), dazu die Gefühle-Gesichter.
7. **Mehrteilige Schnittmuster** mit Passzeichen und Fadenlauf-Pfeil.
8. **Vorlagen-Sammlungen:** fertige Listen pro Klassenprojekt («Lesekissen 5. Klasse» = Link mit `liste=…`), direkt aus der Anleitung aufrufbar.

## 4. Vorschlag für die Reihenfolge

| Welle | Inhalt | Aufwand |
|---|---|---|
| 1 | Erledigt am 28. Oktober 2026: A3-Druck; 113 Werkhilfen, Raster, Netze und Spielbretter aus 3a (`formen_scheiben.py`, `formen_raster.py`, `formen_spiele.py`, `formen_netze.py`, `formen_weitere.py`, dazu die bisherigen Web- und Werkhilfen in der neuen Gruppe «Werkhilfen»); 25 Schnittmuster aus 3b in der Gruppe «Nähen» (`formen_naehen.py`). Nicht als eigene Formen gebaut, weil die Grundformen sie schon abdecken: Ausstech-, Schalen- und Stempel-Schablonen, Prägesterne (Stern mit Zacken-Regler, Spiegeln-Schalter); nummerierte Punkte folgen in Welle 2 | erledigt |
| 2 | Erledigt am 28. Oktober 2026: Buchstaben A–Z und Zahlen 0–9 als eigene Gruppe «Buchstaben» (`formen_schrift.py`, DejaVu Sans fett, Ecken ausgerundet, mit Wortfeld im Generator: ein Wort tippen, alle Buchstaben gleich hoch aufs Blatt); nummerierte Fadengrafik-Punkte, Winkel-Fadengrafik und Einmaleins-Kreis (`formen_punkte.py`); Saisonmotive Eichenblatt, Kastanienblatt, Tannenzapfen, Flugdrache, Rentier, Schlitten, Faltstern 3D (`formen_saison.py`) | erledigt |
| 3 | Erledigt am 28. Oktober 2026: Netz-Generator (Quader und offene Schachtel nach Mass, `m=…`), Poster-Modus (bis 30 Blätter, Passkreuze), Pixel-Editor = bestehende `zaehlmuster/`, 61 neue Motive: Gruppen «Masken» (`formen_masken.py`, 13) und «Schweiz» (`formen_schweiz.py`, 10), Themen Weltraum/Meer/Fahrzeuge/Dinos/Fabelwesen/Alltag/Piraten & Ritter/Frühling & Sommer (`formen_themen.py`, 38) | erledigt |

Stand nach Welle 4: 363 Formen im Generator, dazu die 760 Figuren und 302 Perlentiere, also rund 1360 Vorlagen plus unbegrenzt viele über Editor, Namen und Netze.

## 5. A3-Druck (eingebaut)

- Im Generator unter «Papier» A4 oder A3 wählen. Blatt, Nutzfläche, Legende, Farbliste und Fusszeile richten sich nach dem Papier; die Druckseite stellt sich mit auf A3.
- Schnellwahl bei A3 zusätzlich 20, 25 und 30 cm. Nutzfläche A3: 27,7 × 37,2 cm.
- Bei «Zu gross für ein A4-Blatt» steht neu der Hinweis «Mit Papier A3 hat es Platz», wenn es stimmt.
- Im Link: `?form=herz&b=30&papier=a3`. Links aus der App ohne `papier` bleiben A4.
- Im Druckfenster muss A3 als Papier gewählt sein und «Tatsächliche Grösse» oder 100 %; die 5-cm-Linie zeigt, ob es stimmt.
