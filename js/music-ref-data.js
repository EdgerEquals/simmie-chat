/* MUSIC REFERENCE DATA for Dad's mark sound (js/logo-sound-dad.js). Rule 11, the external-data exception (Danny 15:25 AWST 25 Oct 2026):
   the ONLY fixed values allowed are real, documented, externally sourced ones, kept here with their sources. js/logo-sound-dad.js still
   pumps every one of them (depth <= 0.146) and never uses them as hard limits for anything other than keeping notes inside real ranges.
   Pitches are MIDI note numbers in 12-tone equal temperament, A4 = 440 Hz = MIDI 69 (ISO 16:1975), f = 440 x 2^((n - 69)/12).
   Ranges are the usual sounding orchestral ranges, as charted in standard orchestration references (S. Adler, The Study of Orchestration;
   Vienna Symphonic Library Instrumentology pages). Psychoacoustic values are cited per entry. Loaded only when Dad's zoom opens. */
(function(G0){
  var W=typeof window!=='undefined'?window:G0;
  W.MusicRef={
    // instrument ranges (sounding pitch, MIDI): low .. practical high
    cello:      {lo:36, hi:81, note:'C2 (65.4 Hz) .. A5; open strings C2 G2 D3 A3'},
    contrabass: {lo:28, hi:67, note:'E1 (41.2 Hz) on the 4-string bass (C1 with an extension) .. G4; sounds an octave below written'},
    horn:       {lo:35, hi:77, note:'horn in F, sounding B1 (61.7 Hz) .. F5'},
    timpani:    {lo:38, hi:60, note:'a standard set of four, D2 (73.4 Hz) .. C4'},
    celesta:    {lo:60, hi:108, note:'5-octave celesta sounds an octave above written: C4 .. C8 (4186 Hz)'},
    violinHarmonics:{lo:79, hi:100, note:'natural/artificial harmonics region G5 .. E7 (2637 Hz)'},
    pianoA0:    {midi:21, hz:27.5, note:'lowest key of the 88-key piano; bottom of the 27-40 Hz sub range Danny asked for'},
    // intervals and tuning (equal temperament)
    tritoneCents:600, semitoneCents:100,
    // roughness / beating: sensory dissonance peaks when two tones are about 1/4 of a critical band apart
    // (R. Plomp and W. J. M. Levelt 1965, Tonal consonance and critical bandwidth, J. Acoust. Soc. Am. 38:548);
    // critical band as ERB = 24.7 x (4.37 f/1000 + 1) Hz (B. R. Glasberg and B. C. J. Moore 1990, Hearing Research 47:103)
    roughPeakCB:0.25, erb:function(f){return 24.7*(4.37*f/1000+1);},
    // phone-safe sub: small speakers cannot reproduce 27-40 Hz, but the ear hears the missing fundamental from its harmonics
    // (J. F. Schouten 1940; E. Terhardt 1974, Pitch, consonance, and harmony, J. Acoust. Soc. Am. 55:1061). Harmonics used: 2, 3, 4.
    subHarmonics:[1,2,3,4]
  };
})(this);
