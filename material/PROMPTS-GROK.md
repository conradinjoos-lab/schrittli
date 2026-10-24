# Grok-Bildprompts für die Materialkarte

Pro Material ein Bild in Grok erzeugen, speichern als `material/<id>.png` (Dateiname = id in der Tabelle), danach `material/fotos.json` ergänzen (Liste der Dateinamen). Transparente Freisteller (PNG) oder weisser Hintergrund – beides geht; die App zeigt das Bild über dem Piktogramm.

**Grundprompt (immer gleich, Objekt einsetzen):**

> Top-down product photograph of {OBJEKT}, perfectly centered, on a seamless pure white background, soft even studio lighting, almost no shadow, no hands, no text, no other objects, photorealistic, sharp focus, square format 1:1, easy to cut out.

| id (Dateiname) | Material | {OBJEKT} |
|---|---|---|
| `wolle` | Wolle | a ball of red wool yarn |
| `garn` | Garn | a wooden spool of blue sewing thread |
| `schnur` | Schnur | a loosely coiled piece of natural cotton string |
| `schere` | Schere | a pair of children's scissors with yellow handles |
| `karton` | Karton | a rectangular piece of brown corrugated cardboard |
| `papier` | Papier | a single sheet of white paper |
| `nadel` | Nadel | a sewing needle with red thread through the eye |
| `stopfnadel` | Stumpfe Nadel | a blunt plastic tapestry needle for children |
| `filz` | Filz | a square piece of green craft felt |
| `stoff` | Stoff | a folded piece of light blue cotton fabric |
| `leim` | Leim | a white bottle of craft glue (PVA) |
| `klebeband` | Klebeband | a roll of beige masking tape |
| `heisskleber` | Heisskleber | a small hot glue gun with a glue stick |
| `zirkel` | Zirkel | a metal drawing compass, open |
| `lineal` | Lineal | a 30 cm wooden ruler |
| `bleistift` | Bleistift | a sharpened yellow pencil |
| `stifte` | Farbstifte | three felt-tip pens, red, blue and yellow, caps on |
| `hammer` | Hammer | a small claw hammer with a wooden handle |
| `naegel` | Nägel | five small steel nails |
| `holzbrett` | Holzbrett | a small rectangular pine wood board |
| `zange` | Zange | a pair of pliers |
| `perle` | Perle | three large wooden beads with holes |
| `knopf` | Knopf | four colourful plastic buttons |
| `haekelnadel` | Häkelnadel | a crochet hook with a short piece of pink yarn |
| `stricknadeln` | Stricknadeln | two wooden knitting needles crossed, with a few stitches of orange yarn |
| `strickliesel` | Strickliesel | a wooden knitting spool (knitting dolly, Strickliesel) painted like a doll, with four metal pins on top |
| `filzwolle` | Filzwolle | a fluffy bundle of unspun wool roving in orange and yellow |
| `seife` | Seife | a bar of white soap |
| `wasser` | Wasser | a shallow bowl of clear water |
| `glas` | Glas | a plain drinking glass half full of water |
| `flasche` | Flasche | an empty clear plastic bottle |
| `luftballon` | Luftballon | an inflated red balloon with a knot |
| `trinkhalm` | Trinkhalm | a few colourful plastic drinking straws |
| `waescheklammer` | Wäscheklammer | a wooden clothes peg |
| `magnet` | Magnet | a red and silver horseshoe magnet |
| `bueroklammer` | Büroklammern | a small pile of silver paper clips |
| `taschenlampe` | Taschenlampe | a small handheld flashlight |
| `ei` | Eier | two brown chicken eggs |
| `buecher` | Bücher | a stack of three hardcover books |
| `hefe` | Hefe | a cube of fresh baker's yeast on paper |
| `zucker` | Zucker | a small heap of white sugar with a teaspoon |
| `loeffel` | Löffel | a stainless steel tablespoon |
| `trichter` | Trichter | a small yellow plastic funnel |
| `backpulver` | Backpulver | a small open paper sachet of baking powder with white powder |
| `essig` | Essig | a glass bottle of clear vinegar |
| `brausetablette` | Brausetablette | a round white effervescent tablet next to its tube |
| `dose` | Dose | a small black plastic film canister with lid |
| `moos` | Moos | a small clump of green forest moss |
| `steine` | Steine | five small smooth grey pebbles |
| `sand` | Sand | a small heap of light beige sand |
| `watte` | Watte | a few white cotton balls |
| `zahnstocher` | Zahnstocher | a few wooden toothpicks |
| `frucht` | Apfel oder Orange | one orange and one red apple |
| `schuh` | Schuh | a child's sneaker with white shoelaces |
| `tuerklinke` | Türklinke | a metal door handle on a white door, close-up |
| `salz` | Salz | a small heap of white table salt |
| `pfeffer` | Pfeffer | a small heap of ground black pepper |
| `stab` | Stab | a plain round wooden stick about 40 cm long |
| `schnuersenkel` | Schnürsenkel | a pair of white shoelaces |
| `handtuch` | Handtuch | a folded light blue towel |
| `holzspatel` | Holzspatel | two wooden craft sticks (popsicle sticks) |
| `kerze` | Kerze | a white household candle |
| `eierbecher` | Eierbecher | four white ceramic egg cups |
| `zuendholzschachtel` | Zündholzschachtel | an empty small matchbox with its sliding drawer open |
| `plastikloeffel` | Plastiklöffel | a white plastic spoon |

Tipps: Wenn Grok Hände oder Schatten dazumalt, «no hands, no shadow, isolated object» ans Ende hängen. Für Schweizer Dinge (Strickliesel, Zündholzschachtel) die englische Beschreibung in der Tabelle unverändert lassen.