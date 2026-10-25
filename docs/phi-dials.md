# Golden-ratio dials and the one closed loop (js/phi-dials.js)

Page-side build of the Kids Club core standard "golden-ratio dials, one closed feedback loop" (the standard itself lives in the shared Kids Club layer on the box; this note only says how these pages apply it). The same files run on this chat page and on Rebella, including the dashboard.

- Loading: js/ratio-pump.js loads js/phi-adapt.js, then js/season-pumps.js, then js/phi-dials.js when the browser is idle after load. They are three same-origin static files. The dials make no network request, and `data-dials="off"` on the ratio-pump tag skips them.
- One store: the existing usage record in this browser (localStorage `phiAdapt.v1`). It holds component ids with open, tap and linger counts, and nothing typed, no chat and no personal details. The dials sit in its extension slot `x.dials`, along with the move log, the proposals, the ratio summary and the level reading.
- One dial shape: rungs are powers of 1/phi, with closed below the last one. A dial moves one rung at a time and glides there (free-wheel). Each dial has a floor and a ceiling, both rungs, and only Danny changes them. When the loop wants to go past one of them, it writes a proposal on the device and applies nothing.
- Dial 1, information filter: sets the share of each component's events that passes from the visit into the long-term profile, and from the profile into the ratio summary.
- Dial 2, kid pace: nudges animation speed on the page's existing timing, within Danny's range (RatioPump.setUser).
- Dial 3, season pump: follows the Season pumps standard in the shared Kids Club layer (js/season-pumps.js, see below). It sets palette warmth and rest calm on the background layer.
- The off-device gate is off. Nothing leaves the device.
- Default rungs (floor / default / ceiling): filter 0.146 / 0.382 / 0.618; pace factor 0.854 / 1 / 1.236; season strength closed / 0.146 / 0.382.

## Season pumps (js/season-pumps.js)

Page-side build of the Season pumps standard, which Dial 3 points to. The standard itself lives in the shared Kids Club layer; this note says how these pages apply it.

- Inputs: the date, the time and the one coarse city point (-32.0, 115.9). No feed, no network request and no storage. Nothing about the kid is read or sent.
- Clocks, worked out on the device: the sun's height and day length (NOAA solar equations), the M2 and S2 equilibrium tide clocks and their spring-neap beat, the synodic month (for the beat's phase), the anomalistic month (for perigee), and the year (Meeus, Astronomical Algorithms). The values are asserted, not verified, until they are checked against JPL Horizons. Evection, the slow lunar apsidal and nodal cycles, and Schumann resonance are left out.
- One shared formula for each output: base x the product over pumps of (swing)^(weight x cos(2 pi x phase) / 2). The weight is phi to the minus (phi-steps between the pump's period and the output's timescale). The swings are cited ratios: perigee/apogee lunar tide, perihelion/aphelion solar tide, spring/neap from the equilibrium tide amplitudes, and this year's longest/shortest day at the city point.
- Base: Dial 3's live rung is the peak of each output, so the product is read as a share of its own peak and the tint stays at or under the rung (closed up to 0.382).
- Outputs, on the background layer: warmth (a sepia tint, on the year's timescale) and rest calm (softer colour, on the day's timescale). Rest comes from the sun's height: it eases in from sunset to the end of civil dusk and eases out through dawn, with no hard switch.
- WCAG safe-side floor: after the formula, the tint steps down by phi until the page's own text and background keep their contrast, up to the WCAG AA 4.5:1 line.
- Reduced motion: the clocks are read on load and when the page comes back into view, with no change while she is looking. `data-dials="off"` skips this file with the dials.
- Self-check: tools/phi_selfcheck.py lists any number in the code that is not phi, a cited clock or physical constant, or a measured anchor.
