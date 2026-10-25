#!/bin/sh
# Rebuild Dad's mark files from the physics model (run from the repo root). Header = CSS only; zoom = live js/eq-physics.js over the stage file.
set -e
node tools/gen-eq-keyframes.js > /tmp/eqk.json
python3 tools/dadmark/gen-head.py "dash/img/dad-mark-v2-head-$1.svg" emerald /tmp/eqk.json
python3 tools/dadmark/gen4.py "dash/img/dad-mark-v2-$1.svg" /tmp/eqk.json
python3 tools/dadmark/gen4.py "dash/img/dad-mark-v2-stage-$1.svg" nobars /tmp/eqk.json
python3 tools/dadmark/gen-waves-css.py /tmp/eqk.json css/dad-mark-waves.css
