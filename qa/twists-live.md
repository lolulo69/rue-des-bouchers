# Twists live: per-twist audit (§12e.2, §13.O)

Each twist is staged by `src/scene/twistLive.js`, driven by the twist data: the id picks the staging, the **times come from
`tw.sim.events[n].at`** (each moment fires at its minute, in the 3D street and in the audio), and `tw.props`
(string or `{ id, from?, until? }`) are shown at their times for any twist without a dedicated staging. Moments use the stage
library (`src/scene/stage.js`) and positional audio sources (`audio.emitter`). A line cue `twist:<id>:<n>` (stageCues.js)
is covered by moment n.

Screenshots: `qa/art-live/twist-<id>-setup.jpg` (before the first moment) and `twist-<id>-m<n>.jpg` (a few seconds after
moment n), taken by a QA script that runs each twist in a free night and steps the clock to each event time. No console
errors on any of the 26 twists.

**Text-only twists: 0 / 26.** Every twist has something seen all evening and every narrated moment is staged at its time.

| Twist | All evening (seen / heard) | Moments: time → on screen + sound | vs text |
|---|---|---|---|
| martine_dinner | White tablecloth on the estaminet table that bites the corridor; from 20:49 the black sedan parked at the rue de la Barre end; Martine seated at the table (wine) | **20:50** sedan door, Martine walks up the street to the terrace and sits · **23:05** the whole terrace and Martine raise their glasses (cheer anim), her toast (voice), glasses clink, cheers | ✔ |
| saturday_van | Delivery van in the corridor, hazard lights blinking + hazard ticking (until 23:02) | **21:10** the driver unloads (keg rattles) then walks off to the place · **23:00** van reverses up the street (engine, reversing beeps, horn, a glass breaks), then gone | ✔ |
| inspector_surprise_night | Delphine in a beige trench at a Goulot table, tea cup, notebook, writing, looking at the estaminet | **22:10** she writes (writing anim, paper sound) | ✔ |
| inspector_announced_night | New geranium planters in front of every estaminet table (the sim keeps 6 per table, corridor clear) | **23:30** a voice (« elle est rentrée ») and a chair dragged: the sim brings two tables back out | ✔ |
| inspector_quiet_night | AC unit on the estaminet façade; early evening Dédé « waters the geraniums » and whistles out of tune | **22:30** AC fan spins, AC hum (positional), Dédé gestures | ✔ |
| exhaust_eve | « MAINTENANCE PRÉVENTIVE » sign by the door; **steam off** and the hum gone (S.exhaustOff → art + audio) | **21:30** a customer protests (surprised, voice), the waiter comes to the table and answers | ✔ |
| exhaust_won_night | Steam at 1.5× (full-steam prop), hum louder in the flat | **22:15** cardboard « FRITES » stand appears on the terrace, Dédé beside it greeting and shouting, applause, a big puff of frying smoke from the duct | ✔ |
| exhaust_lost_night | Steam at 1.5× | **23:20** Ghislain smokes right under Pilou's window, turns toward the duct / the window, satisfied (40 s) | ✔ |
| football_match | Big screen under the estaminet awning facing the street (a live match, scores), 18 standing supporters with red-and-white scarves, the commentator's voice at the screen, chants every 25–50 s | **21:12** screen « BUT ! », everyone cheers, red flare smoke + red glow, crowd « OUAIS ! » + applause + chant · **21:47** screen « RATÉ… », supporters slump (sad), a crowd « ooooh » · **22:50** screen « VICTOIRE ! », cheers + flare, then the supporters sing for 80 s with chants | ✔ |
| birthday_t4 | Balloons tied at table 4 all evening (the cake stays hidden) | **23:40** the terrace lights dim, the cake with 8 flickering candles (candle glow) is carried from the door to table 4, the table then the whole terrace sing « Joyeux anniversaire » (twice), candles blown out, cheers | ✔ |
| influencer_night | Ring light glowing on its tripod in the corridor, the influencer posing / filming | **21:30** « Coucou les loulous ! » three takes (voice + shutter), the terrace waves and poses on take three | ✔ |
| hen_party | The EVJF at the Mal Lunés: pink sashes, the bride's veil and tiara, one holds the megaphone; megaphone bursts every 25–50 s | **22:30** megaphone siren + « MARION ON T'AIME », the group cheers · **23:15** the bride walks to Biloute (shown) with a paper to sign, the group cheers, Biloute barks | ✔ |
| drache_night | Blue tarpaulin on poles over the estaminet terrace; rain from the weather system | **21:15** downpour (rain FX + rain audio), customers open umbrellas, shouts and chairs dragged under the awning | ✔ |
| heatwave | Fans in windows (spinning) + fan whir on the terrace, lit open windows up and down the street, ice buckets with bottles on the tables | **00:30** one customer asleep on his chair (snoring), another sings | ✔ |
| guide_tour | — (the group is only in the street around its stop) | **22:00–22:15** the guide walks in from the rue de la Barre with her yellow flag and 14 tourists (some filming), talking (voice) · **22:15** stop under Pilou's window: tourists face the cobbles (the canal), then turn to Pilou's window · **22:30** they leave toward the place | ✔ |
| regis_party | N°27 (odd side, plaque « 27 »): windows flashing pink / blue / violet / yellow on the beat, muffled bass and kick through the walls, three students smoking / drinking on the doorstep, bottles on the pavement | **00:10** the bass gets louder, windows rattle · **01:00** 16 students come down with a glowing speaker box: music in the street, cheers | ✔ |
| carbonnade_contest | Jury table (3 jurors, name cards, notebooks, casseroles) + golden trophy | **21:30** the jury tastes and writes, the music ducks (« on entend la gaine ») · **22:10** Dédé raises the trophy (cheer anim), jury cheers, crowd cheer + applause | ✔ |
| busker | From 21:00 the accordionist at the corridor edge between Pilou's door (n°10) and the terrace, facing the window, hat and coins at his feet; musette (positional) all evening | **21:00** the terrace sings the refrain (sing anim + chant) · **23:00** Dédé walks over with a beer, gives it, the busker drinks then plays again | ✔ |
| power_cut | Normal until 22:40 | **22:40** street lamps, signs and windows go dark, candles in windows and on every terrace table (warm glow), the hum stops, a generator putters near the Goulot, the street quiets · **23:25** lights back, the duct restarts « like a tractor » (big puff + cough), one table applauds, another grumbles | ✔ |
| waiter_last_night | His red suitcase by the estaminet door; he whistles while serving (every 20–40 s) | **00:30** apron left on a chair, he waves up at Pilou's window, then runs off toward the place with his suitcase | ✔ |
| fete_voisins | Place Maurice-Schumann until 22:00: trestle tables with gingham, bunting across, the « FÊTE DES VOISINS » banner, neighbours with drinks | **20:45** a neighbour gives a 3-minute speech (voice), applause · **22:00** packed up with pointed chair-scraping, the stand disappears | ✔ |
| fire_inspection | — (the truck only comes for its visit) | **22:15** red fire truck with blue lights drives in from the rue de la Barre (engine) · **22:20** it stops, reverses, two firefighters measure the corridor with the tape, the radio crackles, one states the width, Dédé holds a paper (« procès-verbal ») · **22:40** gone | ✔ |
| delandre_walk | — | **23:00** the mayor and his adviser (umbrella) walk up from the rue de la Barre, stop at the estaminet, the mayor speaks; Dédé rushes chairs in (rush anim, chairs clattering), then the mayor walks on to the place | ✔ |
| lost_dog | « PERDU BILOUTE » posters on three façades; Biloute absent | **21:30** Jérémie walks the corridor calling « BILOUTE ! » every 10–16 s (until 22:50), three customers answer « oui ? » (wave + voices) · **22:50** Biloute under estaminet table 3 with a fry in his mouth, the table cheers, he barks, Dédé laughs | ✔ |
| tv_crew | Until 22:30: camera on tripod (GRAND NORD TV), camera operator, boom operator with boom and fuzzy mic, LED panel lighting Dédé at his door; Dédé talks to camera | **21:00** Dédé's wink: he turns to Pilou's window mid-sentence · **22:30** the crew is gone, chairs clatter as tables come back out | ✔ |
| street_sweeper | — | **23:30** the sweeper-washer drives through the whole street (orange beacon, spinning brushes, water jets, motor + brushes + spray audio), customers jump up, chairs clatter, wet patches on the cobbles | ✔ |

## Notes
- Moments fire from the clock (`min >= at`), not from event delivery, so a reload mid-night or QA stepping still plays them.
- Cast members are borrowed for a moment (Dédé, Ghislain, Jérémie, Biloute, the waiter, customers) and given back exactly
  as they were.
- The night lines of a twist (`barks`, `klaas`) use the generic cues (`bark`, `klaas_writes`); the twist's own moment lines
  are covered by `twist:<id>:<n>`.
