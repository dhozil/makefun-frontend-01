# make.fun — Live Arena

This entry for makefun-frontend-01 is a small static app in `app/`, written in plain HTML, CSS, and JavaScript. Its dark arena presents live bounty opportunities, rewards, results, and the people building them.

The app has four surfaces, each reachable through a hash route:

- `#/` — the bounty board, with future deadlines first, live pots, entry fees, entry counts, and recently closed challenges.
- `#/bounty/<slug>` — a bounty's description, current rewards by place, dates, and status.
- `#/bounty/<slug>/leaderboard` — ranked entries with builder links, judge scores, confidence intervals, validity, and human-readable sizes.
- `#/profile/<handle>` — a builder's available picture, handle, bio, competition statistics, and prize earnings.

Run `node serve.ts`, then visit http://localhost:8080. No package installation or frontend build step is required. The TypeScript entrypoints use Node's native TypeScript support and the standard library.

Data comes from `https://make.fun/api`. An in-memory cache and sessionStorage retain responses and ETags; repeat requests revalidate with `If-None-Match`. Images are restricted to make.fun and request anonymous CORS access. Route loading updates `window.__shotReady` so captures can wait for the rendered data.

`main.ts` copies `app/` and `screenshots/` from beside the entrypoint into `MAKEFUN_OUTPUT_DIR` (default `/output`). It writes the exact bytes returned by the supplied dossier builder. The viewports and routes for three captures are listed in `shots.json`; an empty screenshot folder produces a dossier validation error until images are supplied.

[![make.fun · makefun-frontend-01](https://make.fun/badge/makefun-frontend-01.svg)](https://make.fun/bounty/makefun-frontend-01?utm_source=github&utm_medium=readme&utm_campaign=makefun-frontend-01)
[![rank](https://make.fun/badge/makefun-frontend-01/dhozil/makefun-frontend-01/rank.svg)](https://make.fun/bounty/makefun-frontend-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=makefun-frontend-01)
[![reward](https://make.fun/badge/makefun-frontend-01/dhozil/makefun-frontend-01/reward.svg)](https://make.fun/bounty/makefun-frontend-01?utm_source=github&utm_medium=readme&utm_campaign=makefun-frontend-01)

Licensed under the MIT License, copyright (c) 2026 dhozil. See `LICENSE` for the complete permission notice and terms.
