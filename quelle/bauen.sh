#!/bin/bash
# Baut beide Versionen aus quelle/p1.html (HTML+CSS bis <script>) und quelle/p2.js (gesamtes JavaScript).
# Aufruf im Repo-Wurzelverzeichnis: bash quelle/bauen.sh
set -e
Q=$(dirname "$0")
node --check "$Q/p2.js"
{ cat "$Q/p1.html"; cat "$Q/p2.js"; printf '</script>\n</body>\n</html>\n'; } > index.html
{ sed -e 's#<title>Schritt für Schritt</title>#<title>Schritt für Schritt · Schule</title>#' -e 's#apple-mobile-web-app-title" content="Schritt für Schritt"#apple-mobile-web-app-title" content="Schritt für Schritt · Schule"#' -e 's#"name":"Schritt f%C3%BCr Schritt","short_name":"Schritt f%C3%BCr Schritt"#"name":"Schritt f%C3%BCr Schritt Schule","short_name":"Schule"#' -e 's#href="grafik/figuren/icon.png"#href="../grafik/figuren/icon.png"#' "$Q/p1.html"; echo 'window.SCHULE=true;'; cat "$Q/p2.js"; printf '</script>\n</body>\n</html>\n'; } > schule/index.html
echo "gebaut: index.html ($(wc -c < index.html) Bytes), schule/index.html ($(wc -c < schule/index.html) Bytes)"
