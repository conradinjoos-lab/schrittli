#!/bin/bash
# Baut beide Versionen aus quelle/p1.html (HTML+CSS bis <script>) und quelle/p2.js (gesamtes JavaScript).
# Aufruf im Repo-Wurzelverzeichnis: bash quelle/bauen.sh
set -e
Q=$(dirname "$0")
node --check "$Q/p2.js"
# Kennung für Fehlermeldungen: Baudatum und kurzer Commit. Steht in beiden Ausgaben und in vorlagen/melden.js.
STAND="$(date +%Y-%m-%d)-$(git rev-parse --short HEAD 2>/dev/null || echo ohne-git)"
sed -i "s/const STAND='[^']*';/const STAND='$STAND';/" vorlagen/melden.js
{ cat "$Q/p1.html"; sed "s/__STAND__/$STAND/" "$Q/p2.js"; printf '</script>\n</body>\n</html>\n'; } > index.html
{ sed -e 's#<title>Schritt für Schritt</title>#<title>Schritt für Schritt · Schule</title>#' -e 's#apple-mobile-web-app-title" content="Schritt für Schritt"#apple-mobile-web-app-title" content="Schritt für Schritt · Schule"#' -e 's#href="grafik/marke/#href="../grafik/marke/#g' "$Q/p1.html"; echo 'window.SCHULE=true;'; sed "s/__STAND__/$STAND/" "$Q/p2.js"; printf '</script>\n</body>\n</html>\n'; } > schule/index.html
echo "gebaut ($STAND): index.html ($(wc -c < index.html) Bytes), schule/index.html ($(wc -c < schule/index.html) Bytes)"
