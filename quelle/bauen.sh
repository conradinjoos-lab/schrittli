#!/bin/bash
# Baut beide Versionen aus quelle/p1.html (HTML+CSS bis <script>) und quelle/p2.js (gesamtes JavaScript).
# Aufruf im Repo-Wurzelverzeichnis: bash quelle/bauen.sh
set -e
node "$(dirname "$0")/bauen.cjs"
