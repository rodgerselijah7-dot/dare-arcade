# DARE Arcade

Browser games by Dontae Amare. Static site — no build step.

```
/                      Arcade lobby (index.html)
/the-last-don/         The Last Don (single-file game + icons + manifest)
/crowd-run/            CROWD RUN (single-file game + icons + manifest)
/cosmic-encounter/     COSMIC ENCOUNTER (single-file game + icons + manifest)
/rebel-elimination/    REBEL ELIMINATION (single-file game + icons + manifest)
/ori/                  ORI (single-file game + icons + manifest)
/break-the-block/      Break the Block (single-file game + icons + manifest)
/buckets/              DARE Buckets (single-file game + icons + manifest)
/chess/                DARE Chess (single-file 3D game + icons + manifest; loads three.js r128 from cdnjs)
/connect/              DARE Connect (single-file game + icons + manifest)
/dice/                 DARE Dice (single-file 3D dice game + icons + manifest; loads three.js r128 from cdnjs)
/2048/                 DARE 2048 (single-file sliding number puzzle + icons + manifest)
/1010/                 DARE 1010 (single-file 10x10 block puzzle + icons + manifest)
/bubble/               DARE Bubble Blaster (single-file canvas bubble shooter + icons + manifest)
/dirt-line/            Dirt Line (single-file 3D BMX racer + icons + manifest; loads three.js r128 from cdnjs)
/grand-prix/           DARE Grand Prix (single-file pseudo-3D racer + icons + manifest)
/crate-digger/         Crate Digger (music trivia: index.html + questions.js + icons + manifest)
/hardwood-gridiron/    Hardwood & Gridiron (NBA + NFL trivia: index.html + questions.js + icons + manifest)
/dead-rise/            Dead Rise (single-file 3D zombie FPS + icons + manifest; loads three.js r128 from cdnjs)
/square-up/            Square Up (single-file top-down canvas zombie wave shooter + icons + manifest)
/live-fire-range/      Live Fire Range (3D shooting range: index.html + assets/ photo textures and HDRI skies + icons + manifest; loads three.js r160 from jsDelivr)
/pool/                 DARE Pool (single-file canvas 8-ball / 9-ball + icons + manifest)
/crown-rush/           Crown Rush (single-file canvas racer + icons + manifest)
/rare-rumble/          Rare Rumble (single-file canvas platform fighter + icons + manifest)
/jenga/                Jenga (single-file 3D block tower + icons + manifest; loads three.js r128 and cannon.js 0.6.2 from cdnjs)
/truth-or-dare/        Truth or Dare (single-file card game + icons + manifest; pass-the-phone and online rooms)
/lunker-lake/          Lunker Lake (single-file canvas fishing game + icons + manifest)
/api/room.js           Live match rooms for DARE Buckets, DARE Chess, DARE Connect, DARE Dice, DARE Pool, Crate Digger, Hardwood & Gridiron, Crown Rush, Rare Rumble and Truth or Dare online play (Upstash Redis)
/api/clans.js          Crown Rush clans (Upstash Redis)
/api/scores.js         Live Fire Range and Dirt Line leaderboards (Upstash Redis)
/icons/                Arcade icons
```

## Deploy (Vercel)
1. Push this folder to a new GitHub repo (e.g. `dare-arcade`).
2. Vercel → Add New → Project → import the repo. Framework preset: **Other**. No build command, output directory: root.
3. Project → Settings → Domains → add a subdomain (e.g. `games.darewear.store`).

Every push to `main` redeploys automatically.

## Adding a game
1. Make a folder: `/crowd-run/index.html` (plus its icons/manifest if wanted).
2. In the lobby `index.html`, turn its "Coming to the arcade" row into a link and change the status to "Play".
3. Commit and push.

## The Last Don settings
- Lives: 3, one regenerates every 5 minutes. To let players retry without waiting, set `LIVES_ENFORCED=false` in `the-last-don/index.html`.
- Timed levels: 90 seconds (`TIMED_SECONDS`).
- Saves (progress, stars, high score) live in each player's browser via localStorage.

## DARE Buckets online play
- Modes: Solo, Vs CPU, 2 Player (one phone) and Online (two phones with a 4-character match code).
- Online matches run through `/api/room`, using the same Upstash Redis database as checkout (keys start with `arc:room:` and expire after 10 minutes).
- Each phone polls about 6 times a second during a match and about once a second in the lobby, so a full match costs roughly 3,000 Redis commands.
- The same `buckets/index.html` also works as a Claude artifact; there it uses Claude's live rooms instead of `/api/room`.

## DARE Chess online play
- Modes: Tutorial, Vs Computer (Novice, Club, Master) and Online (two phones with a 4-character match code).
- Online matches use the same `/api/room` as DARE Buckets (rooms are named `ch-<code>`, so they never collide with Buckets rooms).
- Each phone sends the full move list of the current game with every poll, so a dropped request never loses a move. It polls about every 0.7s while waiting on the opponent, 1.5s on its own turn, and 1s in the lobby, roughly 2,000 to 3,000 Redis commands for a 20-minute game.
- The host picks colors; colors swap on every rematch. A player who stays disconnected for 45 seconds loses the game.

## DARE Connect online play
- Modes: Vs CPU, 2 Player (one phone) and Online (two phones with a 4-character match code).
- Online matches use the same `/api/room` (rooms are named `dc-<code>`, so they never collide with Buckets or Chess rooms).
- Each phone sends the full move list of the current game with every poll ("3D4A2R…"), so a dropped request never loses a move. It polls about every 0.7s while waiting on the opponent, 1.5s on its own turn, and 1s in the lobby.
- Gold always moves first. The host is gold in the first game and colors swap on every rematch. Leaving mid-game counts as a loss, and a player who stays disconnected for 45 seconds loses the game.
- The same `connect/index.html` also works as a Claude artifact, with Vs CPU and 2 Player only.

## DARE Dice (street craps)
- Two 3D dice (three.js r128, red and gold) thrown off a brick wall onto night pavement. Play cash only; each player starts with $1,000.
- The shooter calls a bet with cash buttons ($5, $20, $100, All in) or types any amount (tap the amount). The fader fades all of it or covers part; the bet is whatever the fader covers. Both stacks go on the ground as the pot.
- Come-out: 7 or 11 wins, 2, 3 or 12 is craps and loses (the shooter keeps the dice). Anything else is the point: hit it again to win, a 7 first is a seven-out, the shooter loses and the dice pass. Whoever breaks the other player wins.
- Catching: up to 3 times per bet, the fader can catch the dice while they fly (Catch button, or tap the dice). A caught roll doesn't count and the shooter throws again. Online, a roll stays "in the air" (`r<dice>`) until the fader's phone sends `l` (let it land) or `x` (caught), so only one player ever acts at a time. Slim catches about one roll in five when he can.
- Rolling: hold the Roll button to shake the dice, let go to throw. On phones, shaking the phone throws them too (device motion; iPhones ask for motion access the first time a player taps Play, a bill or Roll). Players can turn it off with the Shake button.
- Solo: play Slim, who calls his own shots when he has the dice and sometimes only covers part of a big bet. The game is saved on the phone (Resume).
- Online: rooms are named `dd-<code>` on `/api/room`. Every move is a token in the acting player's presence: `a<amount>` (call), `c<amount>` (fade/cover), `r<die1><die2>` (roll). Only one player can act at a time, so the lists never fork, and each phone replays the other's new tokens. The host gets the dice first; first dice swap on every rematch. The host sets the buy-in in the lobby ($100, $500, $1K, $5K or any amount from $10 to $1,000,000); it rides in the host's presence as `bi`, and the guest's lobby shows it before the match starts.

## DARE 2048
- Classic 4x4 sliding merge puzzle. Each tile value is a rank: 2 Spark, 4 Dream, 8 Plan, 16 Grind, 32 Hustle, 64 Focus, 128 Rise, 256 Boss, 512 Mogul, 1024 Legend, 2048 Crown, and Rare beyond.
- Swipe, arrow keys or WASD. Three undos per game. The game in progress, best score and sound setting are saved on the phone (localStorage keys `d2048-*`). Reaching 2048 offers Keep going or New game.

## DARE 1010
- 10x10 block puzzle. Three blocks at a time (19 shapes: dots, lines of 2 to 5, 2x2 and 3x3 squares, small and big L's); drag them onto the board. Full rows and columns clear. The game ends when none of the remaining blocks fit.
- Scoring: 1 point per square placed, plus 10, 30, 60, 100... for clearing 1, 2, 3, 4... lines at once, multiplied by the clear streak (up to x5) when you clear on back-to-back moves.
- Home screen (best, total lines, games, Continue / New game) and a separate game screen. Game, best and stats are saved on the phone (localStorage keys `d1010-*`).

## DARE Grand Prix
- Pole Position style pseudo-3D racer drawn on a 2D canvas (segment road with curves and hills, sprites scaled by depth, parallax backgrounds). No libraries.
- Three tracks: Downtown Nights, Sunset Coast, Red Rock Canyon (each a list of road sections in `TRACKS`; rivals get a little faster on the later tracks).
- Qualifying: one timed lap with slower traffic. The lap time sets your grid spot against seven rival times (based on the track's flat-out lap time); running out of time starts you last.
- Race: three laps against seven rivals with a countdown clock; each completed lap adds time. Gas is automatic; steer and brake (buttons, tilt or arrow keys / A D, Down or Space to brake). Hitting a roadside sign or post at speed crashes the car; bumping a rival slows you.
- Records per track (best lap, best race time, best finish, wins) saved on the phone (localStorage keys `dgp-*`).
- Look: sprites drawn at 2x, rolling tyre frames, brake-light glow, tyre smoke / off-road dust, crash fireball and flash, speed lines, kerbs + shoulders + edge lines, lamp light pools at night, grandstands and pit garages on the start straight, horizon haze, LO/HI gear and rev meter, a lap progress rail with every car, and a light scanline overlay.

## Pricing
- Prices live in `games.json`; checkout charges from it and the shop and pass savings are computed from it.
- Paid (free tryout, then unlock): The Last Don $4.99, Rebel Elimination $3.99, Dead Rise $3.99, Cosmic Encounter $2.99, ORI $2.99, Break the Block $2.99, DARE Bubble Blaster $2.99, Square Up $2.99, Dirt Line $2.99. All-Access Pass $14.99 (saves $15.92).
- Free: Crowd Run, DARE Buckets, DARE Chess, DARE Connect, DARE Dice, Crown Rush (online games stay free so anyone a friend invites can join), Crate Digger, Hardwood & Gridiron, DARE 2048 and DARE 1010 (endless score chasers that bring players into the arcade), DARE Grand Prix, DARE Pool, Live Fire Range, Truth or Dare.

## DARE Bubble Blaster
- Bubble shooter on a 10-wide hex grid. Drag to aim (the guide shows bank shots and where the bubble will land), let go to shoot, tap NEXT to swap. Arrow keys, space and S work too.
- Match 3 or more of a color to pop them: 10 points each. Bubbles left hanging fall: 20 each, doubled when 5 or more drop. Clearing the board pays 1,000 x the round and starts the next round with more rows and colors.
- Every 6 misses the ceiling drops a new row (the gold bar at the top counts down). The game ends when a bubble crosses the dashed line.
- Home screen (best, total popped, top round, Continue / New game) and a separate game screen. Saved on the phone (localStorage keys `dbub-*`).
- Paid game ($2.99, also in the All-Access Pass): rounds 1 to 3 are the free tryout. Clearing round 3, or continuing a saved game past it, shows the unlock panel from `/dare-unlock.js`.

## Dirt Line
- 3D BMX racer (three.js r128). Custom 2D bike physics at 240 Hz drives a 3D rider and bike; crashes switch the rider to a ragdoll while the bike stays on the ground.
- Race mode: three AI riders from the gate, medals per track. Trick Jam: score run with nine tricks (trick, style and flair buttons plus a lean), combos and landing grades. Ghosts, replays with slow-mo, photo mode, a garage (tag, number, kit, frame, helmet) and a guided First Ride tutorial.
- Paid game ($2.99, also in the All-Access Pass): First Ride, Rookie Loop and Pro Rhythm are the free tryout. Big Air, Desert Mesa, Pine Ridge and Night Session show the unlock panel from `/dare-unlock.js`.
- Leaderboards use `/api/scores?game=dl`: best race time per track (`t-<track>`) and best Trick Jam score (`j-<track>`) in `arc:dl:*`, rider names in `arc:dl:names`. The page runs in arcade mode because it sets `window.DL_ARCADE=true` before loading.
- Progress is saved on the phone (localStorage keys `dirtline*` and `dl_pid`).

## Chat and match alerts (DARE Buckets, DARE Chess, DARE Connect, DARE Dice, DARE Pool, Crate Digger, Hardwood & Gridiron, Truth or Dare)
- `dare-play.js` is shared by all five games. It adds:
  - **Match chat**: a chat button during online matches. Each player's last few messages ride inside their `/api/room` presence, so chat needs no extra server calls. Quick replies, a mute button, and typing never reaches the game controls. In Buckets the button hides during play; new messages still pop up.
  - **Find an opponent**: posts an open match to `/api/lfg`. Anyone with either game open sees a "<name> wants to play" pop-up with a Join button, and open matches are listed on the games' online screens. The listing drops when someone joins, the host leaves, or 2½ minutes after the host's page stops checking in.
  - **Match alerts**: phone notifications when someone posts an open match (Web Push through `/sw.js`). Players turn them on with the switch on a game's online screen. iPhones need the arcade on the Home Screen first (iOS 16.4+).
- Joining from an alert opens `/<game>/?join=CODE` and drops the player straight into the match.
- `/api/lfg` keys in Redis: `arc:lfg` (open matches), `arc:push` (alert subscriptions), `arc:pushthr:*` (one alert per phone per minute), `arc:vapid` (push signing keys, created on first use; set `VAPID_PUBLIC_KEY`/`VAPID_PRIVATE_KEY` env vars to use your own).

## Crate Digger
- Music trivia across hip hop, R&B and soul, pop and neo soul, 1970s to 2026. Players pick a genre (or all) on the home screen. Four question types: Trivia (four choices), Who's from where (hometowns), Name the year (slider from 1970 to 2026, one year off still counts for 60% of the points) and Which came first (tap three releases oldest first).
- Questions live in `crate-digger/questions.js`: `mc` (four-choice questions with category, era `c`/`n`, difficulty 1 to 3 and a liner note), `rel` (releases with years, used for Name the year and Which came first) and `ori` (artist hometowns). Every item has a genre `g`: `hh` hip hop, `rnb` R&B and soul, `pop`, `neo` neo soul. Add new questions by appending lines; keep each `id` unique.
- Classic round: 10, 20, 30 or 50 questions (the player picks; saved on the phone) filtered by genre, era (All, Classics, New era 2020+) and category (13 categories plus Hometowns and Timeline). Difficulty follows the streak: easy at the start, medium from a 2-streak, hard from 5. A wrong answer on a hard question halves the streak instead of resetting it. Grades go by percentage, and players get one 50/50 per 10 questions.
- Variety: each round rotates evenly through the genres in the mix, never repeats an artist, never puts the same category back to back, caps any one category at a fifth of the round, never runs the same question type three times in a row, and caps Name the year and Which came first at 15% and hometowns at 20% of the round. Difficulty leans toward the streak's level without locking to it. If a narrow mix runs out, these rules relax one at a time.
- No repeats: each phone remembers which questions and releases it has seen (`dcd-seen`) and serves unseen ones first, including the three releases in each Which came first, then starts over once a mix is used up.
- Daily Dig: the same 10 questions for everyone each day (seeded from the Central Time date, fixed easy-to-hard plan), one try, with a copyable result grid. Daily Dig #1 is October 15, 2026.
- Head to head: rooms `cd-<code>` on `/api/room`. The host's question count and genre (from the home screen) set the race; the host starts each race with a random seed and both phones build the same questions from it, then play at their own pace, each sending its points per question (`p`) so the other sees the score live. Rematches, chat, Find an opponent and match alerts work like the other online games (`crate-digger` in `dare-play.js` and `/api/lfg`).
- Landing page: opening `/crate-digger/` from the arcade shows a landing screen first (record-in-a-crate art, question count, Start digging, Daily Dig and Race a friend buttons, the three modes, one live sample of each question type, and a crate per genre that opens a classic round in that genre). Tapping the Crate Digger logo inside the game returns to it. Match invite links (`?join=CODE`) skip it.
- Sound is synthesized with Web Audio (808 kick on correct, record scratch on wrong, hi-hat ticks in the last 5 seconds). Saved on the phone: localStorage keys `dcd-*`.

## Hardwood & Gridiron
- NBA and NFL trivia, 2000 to 2026. Built on the same format as Crate Digger: landing page, Daily Huddle, classic rounds, and head-to-head races, plus a solo Two-Minute Drill.
- Questions live in `hardwood-gridiron/questions.js` as compact rows: `MC` (four-choice: league, year, category, difficulty 1 to 3, question, answer, three wrong answers, a note), `TL` (events with years, used for Name the year and Which came first) and `COL` (players and their college, used for College; an optional sixth field lists other schools the player attended so they never show up as wrong answers). League is `nba` or `nfl`; the year sets the era (2000s, 2010s, 2020s). Super Bowls go by the year the game was played. Ids are built from the question text.
- Categories: Champions, MVPs, Draft, Records, Moves, Moments, Coaches, Halftime (NFL) and Texas teams, plus College and Timeline.
- Classic round: 10, 20, 30 or 50 questions filtered by league (Both, NBA, NFL), era and category. Streak-driven difficulty, streak multipliers (x2 from 3 in a row, x3 "on fire" from 6), one 50/50 per 10 questions and one Timeout (+10 seconds) per round. Leagues alternate evenly when both are in play. No repeats until a mix is used up (`dhg-seen`).
- Daily Huddle: the same 10 questions for everyone each day (seeded from the Central Time date), alternating NBA and NFL, one try, with a copyable grid. Daily Huddle #1 is October 30, 2026.
- Two-Minute Drill: 120 seconds of four-choice and College questions from the chosen league and era; a miss takes 5 seconds off. Best drill score is saved separately.
- Head to head: rooms `hg-<code>` on `/api/room`. The host's question count, league and era set the race; both phones build the same questions from the host's seed and send points per question (`p`). Rematches, chat, Find an opponent and match alerts work like the other online games (`hardwood-gridiron` in `dare-play.js` and `/api/lfg`).
- Lifetime NBA and NFL accuracy shows on the home screen. Sound is synthesized with Web Audio (net swish and crowd on correct, arena horn on wrong, whistle chirps in the last 5 seconds). Saved on the phone: localStorage keys `dhg-*`.

## DARE Pool
- Portrait canvas pool table, no libraries. Three games: **8-Ball** (bar rules, any pocket for the 8), **Tournament 8-Ball** (call the 8 by tapping a pocket; after contact a ball must sink or hit a rail) and **9-Ball** (lowest ball first, sink the 9 on any legal shot, the 9 respots if it drops on a foul). Fouls give ball in hand anywhere; the break is from behind the head string.
- Physics run at 240 steps a second with interpolated drawing. Balls slide then roll, so follow, draw and stun come from real spin; side spin (english) changes rail rebounds. Pockets have jaw facings, so fast or badly angled balls rattle out. Balls are drawn as lit 3D spheres whose numbers and stripes roll with the spin. Sunk balls roll into a ball return in the right rail.
- Controls: drag on the table to aim, the Fine wheel for small turns (it accelerates: slow drags move a fraction of a degree, quick flicks swing the cue, and it shows the aim angle while turning; arrow keys work on desktop, Shift for bigger steps), drag the gold knob left to pull the cue (the knob shows the power %, and the phone buzzes harder as the pull builds), and the cue-ball button for follow, draw and english.
- Settings (menu and pause): Aim sensitivity 1 to 5 and Power sensitivity 1 to 5 (both default 4; power 4 reaches full power in about half the bar), sound and vibration. Saved as `dpool-aim`, `dpool-pow`, `dpool-buzz`. The aim guide is long on Easy, shorter on Pro and barely there on Legend.
- CPU: Easy aims by ghost-ball geometry. Pro and Legend simulate dozens of candidate shots (power and spin variants) on a copy of the table, pick the pot that leaves the best next shot, and play safeties when nothing good is on. Thinking runs a few milliseconds per frame so the game never freezes.
- Online: rooms are named `dp-<code>` on `/api/room`, with chat, Find an opponent and match alerts from `dare-play.js`. The host picks the game in the lobby and breaks the first rack; the break swaps on every rematch. The shooting phone runs each shot and publishes it in its presence as `sh`: the stroke (angle, power, spin, cue spot, called pocket), the whole table afterwards and the rules state. The other phone replays the stroke on its own table and then snaps to the published table, so both phones always agree, and a phone that misses a shot jumps straight to the latest table. `am` streams the live aim so the opponent watches the cue move. A player disconnected for 45 seconds loses; leaving mid-game counts as a loss.
- Replays: shots that sink two or more balls, banks, combos and game winners offer a slow-motion replay; the game-over screen can replay the winning shot.
- Stats, 16 badges, and a Locker of cues and felts earned by winning and by badges are saved on the phone (localStorage keys `dpool-*`). Free to play: every mode and CPU level is open.

## Crown Rush
- Landscape game: on an upright phone the whole game turns sideways (Settings picks which way), and on Android it goes full screen and locks landscape when a race starts.
- Side-scrolling rooftop racer on a 2D canvas, no libraries. 16 runners (each with a trait and a ★ special), six maps (Southside Rooftops, Stockyards Rails, Neon Freeway, Frostbite Docks, Magma Works, Jungle Ruins), 16 items with level II versions, slides, dashes, tricks, wall jumps and ground pounds.
- Modes: Quick race and Crown Cup against three bots, Time trial against your best ghost, and Online. Upgrades, wardrobe, body mods, trails, daily challenges, ranks and replays are saved on the phone (localStorage key `crownrush.v2`).
- Online: up to 4 racers per room on `/api/room` (rooms are named `cr-<name>`: `cr-quick` for Quick match, `cr-r-<code>` for private rooms, `cr-clan-<id>` for clan rooms). Each phone polls about 6 times a second while racing and every 0.6s in the lobby. A racer's presence carries their look, `s` (position, motion flags, item, finish time) and `ev` (the last 12 item/special uses), so each phone replays the others' items locally and each player's own phone decides whether they got hit. The host picks the track and starts the race with `go` (race id, track, racers). Upgrades are off online so races are fair.
- Private rooms post to Find an opponent and match alerts through `dare-play.js` (`crown-rush` in `/api/lfg`); joining from an alert opens `/crown-rush/?join=CODE`.
- Clans (`/api/clans`): players have no accounts, so each phone makes a random player id and secret key (localStorage `crownrush.pid` / `crownrush.pkey`); the server keeps a hash of the key so only that phone can change its racer. Starting a clan costs 100 in-game coins. Every finished race adds the player's rank points to their clan (at most 80 per save). Redis keys: `arc:cr:clans`, `arc:cr:players`. Limits: 300 clans, 5,000 players.
- The same file also runs as a Claude artifact, where online play uses Claude's live rooms and clans use the artifact's shared database.

## Live Fire Range
- First-person 3D shooting game (three.js r160 from jsDelivr, with bloom from its addons). The sky, sunlight and ground come from real photographs: four Poly Haven HDRI skies (Afternoon, Golden hour, Midday, Hazy evening; CC0) and photo textures from the three.js and Babylon.js sample libraries, all in `live-fire-range/assets/`. Each HDRI ships as two lossless PNGs (RGB and exponent), and the sun's direction and strength were measured from each photo.
- Six venues: Main Range (7 to 150 m with the shoot house), South Side Bays (three practical pistol bays with a swinger), Long Range Valley (steel at 300, 500, 700, 850 and 1,000 m, three wind flags), Container Yard (pop-up threats among shipping containers), Tactical Obstacle Course (vault walls, tire run, crawl under wire, window port, climb wall) and 3-Gun Ridge (pistol, shotgun with flying clays, rifle to 300 m). Each venue sits far from the others under the same sky; `VENUES` in the game holds their layout.
- 30 guns in five classes. DARE originals (P9, K45, AR16, M12, B308) plus Glock 17, 19, 43X and 21, Canik TP9SFx and METE SFT, Smith & Wesson M&P9 M2.0, Shield Plus, Model 686 and M&P15 Sport III, PSA Dagger, PA-15 and PSAK-47 GF3, Sig Sauer P320 and MCX Spear LT, Beretta 92FS, HK MP5A3, CZ Scorpion EVO 3 S1, Kel-Tec SUB-2000, Daniel Defense DDM4 V7, Mossberg 590A1, Remington 870, Benelli M4, Ruger Precision Rifle and Barrett M107A1. Models are procedural, built per family (striker pistol, revolver, AR, AK, MP5, Scorpion, SUB-2000, pump and semi shotgun, chassis bolt gun, Barrett). Brand and model names are trademarks of their owners and are used without a license.
- Every bullet flies a real arc with drag, gravity and wind drift, and moving targets (mover, swinger, clays) need lead. Scopes have a true mil reticle, elevation and windage clicks (mouse wheel, Shift for whole mils, [ ]) and a range card (DOPE) for the gun in hand.
- Armory: per gun, optic (iron, red dot, holographic, 1-6x LPVO, 8/12/20x scopes), muzzle (compensator, brake, suppressor), magazine (extended, drum), grip (vertical, angled, bipod), laser, shotgun choke. Three equipped slots: sidearm, primary, secondary (keys 1 to 3). Select-fire guns switch with B. Saved on the phone (`lfr_load`, `lfr_equip`, `lfr_pref`).
- Movement: sprint, crouch, prone, lean, mantle over walls up to 1.35 m and climb walls up to 2 m with Space, step over tires. Crouching at a bench or going prone rests the gun.
- 15 drills with par times and gold/silver/bronze medals. Medals unlock gun classes: pistols at the start, SMGs and carbines at 1 medal, rifles at 2, shotguns at 3, precision rifles at 4. Progress lives on the phone (`lfr_prog`).
- Free to play.
- Leaderboards: `/api/scores` keeps each player's best per drill in Redis sorted sets `arc:lfr:<drill>` (500 kept per drill) and names in `arc:lfr:names`. Players pick a range name on the leaderboard screen; the phone keeps a random player id (`lfr_pid`). Challenge links open a drill directly: `/live-fire-range/#bill-2.31`.
- The same game also runs as a Claude artifact, where the leaderboards use the artifact's shared database.

## Rare Rumble online play
- Modes: Stock, Timed, Stamina, Team battle, Climb (six rounds to the Titan), Training and Online (up to four players with a 4-letter code, or Quick match).
- Fighters: Don, Volt, Brick, Nova, Sable, Juno, Riot, Glace and Roy. Roy is the tallest; his Double Barrel (neutral B) holds two shells, and B with both spent reloads instead (about half a second). His shell count rides in the match snapshot so every phone shows it.
- Phones in a match open a direct WebRTC link to each other (data channel, STUN only, no TURN), introduced through a short-lived pair room `cb-<code>.p.<peer>.<peer>` on `/api/room`. Inputs and snapshots go phone to phone while it's open; the HUD shows `direct` or `server`. If a link can't open (some cellular networks block it) or drops, play continues over `/api/room` and the link is retried after 30 seconds.
- The host's phone runs the match. Guests send their inputs in presence; the host sends the match state back as numbered snapshots, with hits and KOs numbered too so a guest that misses a snapshot still sees each one once. Each guest shows its own fighter's moves at once and eases toward the host's position.
- Over `/api/room` the game polls about 10 times a second during a match (every 0.4s once every link is direct), every 0.6s in a match lobby, and every 1.5s in the open-match list (room `rr-lobby`, only while the Online page is open). Match rooms are named `cb-<code>`.
- Messages that would be live events in a Claude artifact ride inside each player's presence as a short numbered queue (`_ev`), and the host trims snapshots to stay under the 4 KB presence limit.
- A dropped player becomes a CPU after about 3 seconds; reopening the game and tapping Rejoin puts them back in their slot. Players who join mid-match watch until it ends.
- The same `rare-rumble/index.html` source also runs as a Claude artifact; there it uses Claude's live rooms instead of `/api/room`.

## Square Up online play
- Co-op for up to 4 players: Host a match, share the 4-letter code, and the host taps Start once at least one friend has joined. The host's chosen map is used.
- The host's phone runs the game (zombies, damage, waves, perks, the paywall). Each guest moves their own character on their own phone and sends position, aim and buttons as presence (`inp`); the host sends numbered snapshots (`snap`, about 10 to 20 a second) with every player, zombie, prop, pickup and map hazard, plus a short numbered event list (explosions, kills, toasts) so a guest that misses a snapshot still sees each moment once.
- Shared: score, combo, weapon unlocks, perks (the host picks for the squad), and the free tryout (the host's unlock decides whether the squad goes past wave 5). Per player: health, ammo, grenades and Second Wind.
- A player at 0 health goes down; a teammate standing next to them for 2.5 seconds revives them, and clearing a wave revives everyone. The run ends when the whole squad is down. Waves, zombie health and crate drops scale with the number of players.
- Transport is the same as Rare Rumble: `/api/room` rooms named `su-<code>`, with direct WebRTC links between phones when a network allows them. A guest who stops sending for about 4 seconds drops out; if the host disappears for 9 seconds the guests' match ends.
- The same source also runs as a Claude artifact; there it uses Claude's live rooms instead of `/api/room`.

## Truth or Dare
- Card game for 2 to 12 players on one phone (pass it around), or 2 to 8 online with everyone on their own phone. Opens on a title screen (Continue, New game, Play online, How to play, House cards, and this phone's games / cards flipped / dares done).
- Three heat levels: **Chill** (anybody), **Party** (embarrassing; mixes in about 28% Chill cards) and **Spicy** (18+: dating, crushes, confidence and romance; bold but never sexual, with no kissing or touching dares; mixes in about 38% Party cards). Spicy asks once that everyone is 18+, and cards that name another player show a reminder that it only happens if that player is up for it.
- 360 built-in cards (60 truths and 60 dares per level) in `DECK` inside `truth-or-dare/index.html`. In a card, `{l}` is the next player, `{r}` the previous player and `{p}` a random other player; `|30` at the end adds a 30-second timer.
- Scoring: truth +1, dare +2, Double Dare (10% of dares) +4, chicken out -1. Two free swaps per player per game. Rounds: 3, 5, 10 or no limit. The end screen crowns the top score (ties share it) with Most daring, Open book, Double trouble and Biggest chicken awards.
- Saved on the phone (localStorage `dtod-cfg`, `dtod-mine`, `dtod-game`). Online games are never saved; they live on the host's phone.
- **Online** (Play online): rooms are `td-<code>` on `/api/room`. The host's phone runs the table: it shuffles, draws, scores and moves the turn, and publishes the whole table in its presence as `st` (`g` game id, `v` version, `ph` pick/card/over, heat, rounds, round, turn, the current card, the last score event, and every player as `[peer, name, score, truths, dares, chickens, swaps, doubles, away]`). Guests act by putting `act: {g, v, a}` in their presence (`a` is truth, dare, random, done, chicken or swap); the host applies it once, only when `v` matches and only from the player whose turn it is. Everyone sees every card; only the player on turn can pick or mark it done.
- The host picks heat and rounds in the lobby and starts with 2 or more players. People who join mid-game are seated at the end (up to 8; extra people watch). A player gone 5 seconds is marked away and skipped; if the player on turn stays gone 20 seconds their turn is skipped. The host can also skip a player or end the game from the menu. If the host leaves, everyone else waits 45 seconds, then returns to the title screen. Play again (host) starts a new game with whoever is still in the room.
- Polling: the host every 0.6s, guests every 0.9s (0.4s while their move is on its way), 1.2s in the lobby. A 20-minute game with 8 phones is roughly 15,000 `/api/room` calls. All phones on one Wi-Fi share the room API's 1,500-per-minute per-IP limit; 8 phones use about 800.
- Group chat, Find players (`truth-or-dare` in `/api/lfg`), match alerts and `?join=CODE` invite links come from `dare-play.js`, whose chat now labels each message with the sender's name when a game passes one (`receive(peer, list, name)`).
- The same game also runs as a Claude artifact, where online rooms use Claude's live rooms (people the artifact is shared with), without chat, Find players or alerts.

## Seasonal enter page
- All of October (Central time) the enter page turns into a Halloween night, with a glowing orange "ARCADE", "Enter if you dare" and a countdown to Halloween. It switches back on November 1 by itself.
- A spider walks along the top edge of the Enter button, drawn by `/halloween-spider.js` on its own small canvas: eight legs with hips, knees and feet (two-bone IK), the alternating four-leg gait real spiders use (feet stay planted while the body moves, then step), pauses with leg twitches and feeling pedipalps, and turns around in place. The static SVG in `.hw-bug` is the fallback.
- Premium touches: the scene fades up from black and the title letters rise in one by one ("DARE" in a carved bone gradient, "ARCADE" in ember orange that flickers like it's lit). The scene shifts in layers with the mouse (desktop) or phone tilt (where the phone allows it). Lightning forks behind the hills every 14 to 28 seconds and lights the clouds. The Enter button is lit from inside with a slow sheen; tapping it throws a burst of embers, then the page pushes into the scene and fades to the lobby.
- Sound is off until the viewer taps the speaker in the top bar (remembered on the phone as `dare-hw-sound`): synthesized wind, an owl now and then, thunder with each lightning strike and a whoosh on Enter. Nothing is downloaded; it's all Web Audio.
- The scene is painted by `/halloween.js` on one canvas at up to 2x pixel density, loaded only while the Halloween enter page is showing: a textured moon (seas, craters, limb darkening), twinkling stars, drifting noise clouds and two layers of ground fog, a far treeline with a lit chapel, a gnarled tree drawn branch by branch, moon-rimmed headstones, an iron fence and grass, shaded jack-o'-lanterns that flicker and light the ground, bats with flapping wings, rising embers, a vignette and film grain. Static layers are drawn once per screen size; each frame only composites them and moves the animated parts. It stops when the gate closes, and draws one still frame for people with reduced motion turned on.
- Preview it any time with `/?season=halloween`; `/?season=off` shows the normal page. Styles are under `html.halloween` in `index.html`.

## Smooth opening (Home Screen launch)
- The app's splash and theme colors are black (`manifest.webmanifest`), and while the enter page is up the page's `theme-color` is switched to black so the status bar matches; it goes back to the light/dark values when the lobby opens.
- The enter page's text stays hidden until its fonts (Bebas Neue, Crimson Pro) have loaded, at most 1 second, then fades in, so the title never jumps from a fallback font. The Halloween letter reveal starts at that moment.
- The Halloween scene makes its moon, cloud and fog textures in a background worker (falls back to the main thread after the first frames), so the page doesn't freeze while it opens. Film grain is a CSS layer. If frames come slower than ~45 a second, the scene steps its resolution down (2x, 1.5x, 1x) so it stays smooth.
