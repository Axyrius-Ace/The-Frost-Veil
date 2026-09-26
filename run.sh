#!/usr/bin/env bash
# macOS / Linux equivalent of run.bat
cd "$(dirname "$0")"
[ -f node_modules/phaser/package.json ] || npm install --no-fund --no-audit
( for i in $(seq 1 90); do curl -s http://localhost:5173 >/dev/null && break; sleep 0.7; done
  if command -v google-chrome >/dev/null; then google-chrome http://localhost:5173
  elif [ "$(uname)" = "Darwin" ]; then open -a "Google Chrome" http://localhost:5173 || open http://localhost:5173
  else xdg-open http://localhost:5173; fi ) &
npm run dev
