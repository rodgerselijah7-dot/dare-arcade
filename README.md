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
/dead-rise/            Dead Rise (single-file 3D zombie FPS + icons + manifest; loads three.js r128 from cdnjs)
/api/room.js           Live match rooms for DARE Buckets, DARE Chess, DARE Connect and DARE Dice online play (Upstash Redis)
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
- Catching: once per bet, the fader can catch the dice while they fly (Catch button, or tap the dice). A caught roll doesn't count and the shooter throws again. Online, a roll stays "in the air" (`r<dice>`) until the fader's phone sends `l` (let it land) or `x` (caught), so only one player ever acts at a time. Slim catches about one roll in five when he can.
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

## Pricing
- Prices live in `games.json`; checkout charges from it and the shop and pass savings are computed from it.
- Paid (free tryout, then unlock): The Last Don $4.99, Rebel Elimination $3.99, Dead Rise $3.99, Cosmic Encounter $2.99, ORI $2.99, Break the Block $2.99, DARE Bubble Blaster $2.99. All-Access Pass $14.99 (saves $8.94).
- Free: Crowd Run, DARE Buckets, DARE Chess, DARE Connect, DARE Dice (online games stay free so anyone a friend invites can join), DARE 2048 and DARE 1010 (endless score chasers that bring players into the arcade).

## DARE Bubble Blaster
- Bubble shooter on a 10-wide hex grid. Drag to aim (the guide shows bank shots and where the bubble will land), let go to shoot, tap NEXT to swap. Arrow keys, space and S work too.
- Match 3 or more of a color to pop them: 10 points each. Bubbles left hanging fall: 20 each, doubled when 5 or more drop. Clearing the board pays 1,000 x the round and starts the next round with more rows and colors.
- Every 6 misses the ceiling drops a new row (the gold bar at the top counts down). The game ends when a bubble crosses the dashed line.
- Home screen (best, total popped, top round, Continue / New game) and a separate game screen. Saved on the phone (localStorage keys `dbub-*`).
- Paid game ($2.99, also in the All-Access Pass): rounds 1 to 3 are the free tryout. Clearing round 3, or continuing a saved game past it, shows the unlock panel from `/dare-unlock.js`.

## Chat and match alerts (DARE Buckets, DARE Chess, DARE Connect, DARE Dice)
- `dare-play.js` is shared by all four games. It adds:
  - **Match chat**: a chat button during online matches. Each player's last few messages ride inside their `/api/room` presence, so chat needs no extra server calls. Quick replies, a mute button, and typing never reaches the game controls. In Buckets the button hides during play; new messages still pop up.
  - **Find an opponent**: posts an open match to `/api/lfg`. Anyone with either game open sees a "<name> wants to play" pop-up with a Join button, and open matches are listed on the games' online screens. The listing drops when someone joins, the host leaves, or 2½ minutes after the host's page stops checking in.
  - **Match alerts**: phone notifications when someone posts an open match (Web Push through `/sw.js`). Players turn them on with the switch on a game's online screen. iPhones need the arcade on the Home Screen first (iOS 16.4+).
- Joining from an alert opens `/<game>/?join=CODE` and drops the player straight into the match.
- `/api/lfg` keys in Redis: `arc:lfg` (open matches), `arc:push` (alert subscriptions), `arc:pushthr:*` (one alert per phone per minute), `arc:vapid` (push signing keys, created on first use; set `VAPID_PUBLIC_KEY`/`VAPID_PRIVATE_KEY` env vars to use your own).
