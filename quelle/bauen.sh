#!/bin/bash
# Baut beide Versionen aus quelle/p1.html (HTML+CSS bis <script>) und quelle/p2.js (gesamtes JavaScript).
# Aufruf im Repo-Wurzelverzeichnis: bash quelle/bauen.sh
set -e
Q=$(dirname "$0")
node --check "$Q/p2.js"
{ cat "$Q/p1.html"; cat "$Q/p2.js"; printf '</script>\n</body>\n</html>\n'; } > index.html
{ sed -e 's#<title>Schrittli</title>#<title>Schrittli Schule</title>#' -e 's#apple-mobile-web-app-title" content="Schrittli"#apple-mobile-web-app-title" content="Schrittli Schule"#' -e 's#"name":"Schrittli","short_name":"Schrittli"#"name":"Schrittli Schule","short_name":"Schule"#' "$Q/p1.html"; echo 'window.SCHULE=true;'; cat "$Q/p2.js"; printf '</script>\n</body>\n</html>\n'; } > schule/index.html
echo "gebaut: index.html ($(wc -c < index.html) Bytes), schule/index.html ($(wc -c < schule/index.html) Bytes)"
