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
/grand-prix/           DARE Grand Prix (single-file pseudo-3D racer + icons + manifest)
/crate-digger/         Crate Digger (music trivia: index.html + questions.js + icons + manifest)
/dead-rise/            Dead Rise (single-file 3D zombie FPS + icons + manifest; loads three.js r128 from cdnjs)
/live-fire-range/      Live Fire Range (3D shooting range: index.html + assets/ photo textures and HDRI skies + icons + manifest; loads three.js r160 from jsDelivr)
/pool/                 DARE Pool (single-file canvas 8-ball / 9-ball + icons + manifest)
/crown-rush/           Crown Rush (single-file canvas racer + icons + manifest)
/api/room.js           Live match rooms for DARE Buckets, DARE Chess, DARE Connect, DARE Dice, DARE Pool, Crate Digger and Crown Rush online play (Upstash Redis)
/api/clans.js          Crown Rush clans (Upstash Redis)
/api/scores.js         Live Fire Range leaderboards (Upstash Redis)
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
- Paid (free tryout, then unlock): The Last Don $4.99, Rebel Elimination $3.99, Dead Rise $3.99, Cosmic Encounter $2.99, ORI $2.99, Break the Block $2.99, DARE Bubble Blaster $2.99. All-Access Pass $14.99 (saves $9.94).
- Free: Crowd Run, DARE Buckets, DARE Chess, DARE Connect, DARE Dice, Crown Rush (online games stay free so anyone a friend invites can join), Crate Digger, DARE 2048 and DARE 1010 (endless score chasers that bring players into the arcade), DARE Grand Prix, DARE Pool, Live Fire Range.

## DARE Bubble Blaster
- Bubble shooter on a 10-wide hex grid. Drag to aim (the guide shows bank shots and where the bubble will land), let go to shoot, tap NEXT to swap. Arrow keys, space and S work too.
- Match 3 or more of a color to pop them: 10 points each. Bubbles left hanging fall: 20 each, doubled when 5 or more drop. Clearing the board pays 1,000 x the round and starts the next round with more rows and colors.
- Every 6 misses the ceiling drops a new row (the gold bar at the top counts down). The game ends when a bubble crosses the dashed line.
- Home screen (best, total popped, top round, Continue / New game) and a separate game screen. Saved on the phone (localStorage keys `dbub-*`).
- Paid game ($2.99, also in the All-Access Pass): rounds 1 to 3 are the free tryout. Clearing round 3, or continuing a saved game past it, shows the unlock panel from `/dare-unlock.js`.

## Chat and match alerts (DARE Buckets, DARE Chess, DARE Connect, DARE Dice, DARE Pool, Crate Digger)
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
- First-person 3D shooting range (three.js r160 from jsDelivr, with bloom from its addons). The sky, sunlight and ground come from real photographs: four Poly Haven HDRI skies (Afternoon, Golden hour, Midday, Hazy evening; CC0) and photo textures from the three.js and Babylon.js sample libraries, all in `live-fire-range/assets/`. Each HDRI ships as two lossless PNGs (RGB and exponent), and the sun's direction and strength were measured from each photo.
- Five guns (P9 pistol, K45 SMG, AR16 carbine, M12 pump shotgun, B308 bolt rifle). Every bullet flies a real arc with drag, gravity and wind drift; each gun is zeroed (25 / 25 / 50 / 25 / 100 m). The B308 scope has a true mil reticle with elevation and windage clicks (mouse wheel and [ ], or the on-screen buttons on phones).
- Armory: optic, suppressor, extended mag, grips, bipod and shotgun choke, saved on the phone (`lfr_load`). The K45 and AR16 climb in a fixed, learnable recoil pattern shown in the armory.
- Positions: crouch, prone, lean (Q/E), and crouching at a bench rests the gun. Settings: sensitivity, field of view, graphics (Low/Medium/High), motion blur, aim depth of field, vibration and volume (`lfr_set`).
- Drills with par times and gold/silver/bronze medals: Bill Drill, El Presidente, Plate Rack, Moving Target, Popper Sweep, Long-Range Ladder, Shoot House (pop-up threats and no-shoots, +5 s / +10 s penalties) and 60-Second Score. Progress lives on the phone (`lfr_prog`).
- Free to play: every drill, the shoot house and all five guns are open to everyone. Medals from the drills unlock the guns (1, 2, 3 and 4 medals).
- Leaderboards: `/api/scores` keeps each player's best per drill in Redis sorted sets `arc:lfr:<drill>` (500 kept per drill) and names in `arc:lfr:names`. Players pick a range name on the leaderboard screen; the phone keeps a random player id (`lfr_pid`). Challenge links open a drill directly: `/live-fire-range/#bill-2.31`.
- The same game also runs as a Claude artifact, where the leaderboards use the artifact's shared database.
