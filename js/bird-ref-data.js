/* BIRD REFERENCE DATA (Danny 15:25 AWST 25 Oct 2026): a DOCUMENTED EXCEPTION to the no-fixed-params rule. These are real field values
   from the cited sources. js/rebella-zoom-life.js never uses them raw: each one is multiplied by its own pump (depth <= 0.146, children
   of the Rebella logo node in the PhiPumps tree), so the birds keep their real character while still breathing with the page.
   Loaded lazily with the Rebella zoom (never on page load). Values marked ESTIMATED are not field measurements. */
(function(){
  'use strict';
  var REF = Object.freeze({
    // ---------- Willie wagtail, Rhipidura leucophrys ('jidi jidi') ----------
    wagtail: Object.freeze({
      // Time budget, Stevens (2002), Corella 26: 50-52.
      // Used as the probability weights of the behaviour state machine. 'Other' (subduing prey etc., 10.4%) is folded into the hawk sally,
      // where prey are caught and handled.
      budget: Object.freeze({ perch: 0.54, preen: 0.15, hop: 0.12, sally: 0.104, fly: 0.086 }),
      // Tail wagging: side to side in the horizontal plane, at variable rates, mostly on the ground or right after alighting; tail-fanning
      // also occurs. Jackson & Elgar (1993), Emu 93: 284.
      wagPlane: 'horizontal', wagMostlyAfterAlighting: true, fans: true,
      // Typical wag rate and swing: ESTIMATED from field video descriptions (variable rate; not a published figure).
      wagHz: 3.0, wagSwingDeg: 35, // ESTIMATED
      // Time of day: Webb-Pullman & Elgar (1998),
      // Aust. J. Zool. 46: 137. Tail-wagging more frequent at dawn and dusk; wing-flashing and aerial
      // catches peak around midday; wagging higher in shade / overcast. Shape weights used here: dawn/dusk wag boost and midday flash boost.
      dawnHour: 6.0, duskHour: 18.5, middayHour: 12.5, wagDawnDuskBoost: 0.382, flashMiddayBoost: 0.382, overcastWagBoost: 0.146,
      // Flight: short, jerky, erratic sallies with sudden twists to hawk insects (Jackson & Elgar 1993; Birds of the World account).
      sally: Object.freeze({ jerky: true, twistsPerSally: 2 }),
      // Morphology (typical field-guide ranges): mass 17-24 g, length 19-21.5 cm, wingspan ~0.29 m (typical).
      massKg: 0.020, spanM: 0.29, aspectRatio: 5.0, // aspect ratio ESTIMATED for a small passerine
      // Wingbeat frequency ESTIMATED with Pennycuick C.J. (1990) "Predicting wingbeat frequency and wavelength of birds", J. Exp. Biol.
      // 150: 171-185: f = m^(3/8) g^(1/2) b^(-23/24) S^(-1/3) rho^(-3/8), S = b^2 / AR, g 9.81, rho 1.23 -> 8.5 Hz.
      wingbeatHz: 8.54 // ESTIMATED (Pennycuick 1990)
    }),
    // ---------- Bluebird (Eastern bluebird, Sialia sialis, as the 'bluebird of happiness' model) ----------
    bluebird: Object.freeze({
      // Foraging: perch-to-ground drop ('ground sallying') is ~79-80% of foraging attempts; hovering uncommon.
      // Pinkowski (1977), Wilson Bulletin; Cornell Lab, All About Birds;
      // Birds of the World account. Flight: low, with fast but irregular wingbeats.
      perchDrop: 0.795, hoverShare: 0.05, // hoverShare ESTIMATED ('uncommon')
      lowFlight: true, irregularWingbeat: 0.146, // irregularity ESTIMATED (fraction of beat-to-beat variation)
      massKg: 0.030, spanM: 0.30, aspectRatio: 5.5, // typical mass 27-34 g, wingspan 25-32 cm; aspect ratio ESTIMATED
      wingbeatHz: 9.72 // ESTIMATED (Pennycuick 1990, same formula)
    })
  });
  window.BirdRef = REF;
})();
