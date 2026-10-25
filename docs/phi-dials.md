# Golden-ratio dials and the one closed loop (js/phi-dials.js)

Page-side build of the Kids Club core standard "golden-ratio dials, one closed feedback loop" (the standard itself lives in the shared Kids Club layer on the box; this note only says how these pages apply it). The same files run on this chat page and on Rebella, including the dashboard.

- Loading: js/ratio-pump.js loads js/phi-adapt.js and then js/phi-dials.js when the browser is idle after load. They are two same-origin static files. The dials make no network request, and `data-dials="off"` on the ratio-pump tag skips them.
- One store: the existing usage record in this browser (localStorage `phiAdapt.v1`). It holds component ids with open, tap and linger counts, and nothing typed, no chat and no personal details. The dials sit in its extension slot `x.dials`, along with the move log, the proposals, the ratio summary and the level reading.
- One dial shape: rungs are powers of 1/phi, with closed below the last one. A dial moves one rung at a time and glides there (free-wheel). Each dial has a floor and a ceiling, both rungs, and only Danny changes them. When the loop wants to go past one of them, it writes a proposal on the device and applies nothing.
- Dial 1, information filter: sets the share of each component's events that passes from the visit into the long-term profile, and from the profile into the ratio summary.
- Dial 2, kid pace: nudges animation speed on the page's existing timing, within Danny's range (RatioPump.setUser).
- Dial 3, season pump: day length at the city point (NOAA solar equations) sets palette warmth on the background layer only.
- The off-device gate is off. Nothing leaves the device.
- Default rungs (floor / default / ceiling): filter 0.146 / 0.382 / 0.618; pace factor 0.854 / 1 / 1.236; season strength closed / 0.146 / 0.382.
