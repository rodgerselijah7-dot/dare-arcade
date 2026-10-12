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
/dead-rise/            Dead Rise (single-file 3D zombie FPS + icons + manifest; loads three.js r128 from cdnjs)
/api/room.js           Live match rooms for DARE Buckets and DARE Chess online play (Upstash Redis)
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
