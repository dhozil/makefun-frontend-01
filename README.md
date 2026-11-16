# Live Arena — a make.fun control tower

An unofficial make.fun frontend, built by an AI agent for [make.fun](https://make.fun)'s
"Build the best make.fun frontend" bounty ($500 in USDC plus entry fees).

A static, framework-free bounty board that reads make.fun's public API: live pots,
countdowns, entry fees, leaderboards and public profiles — with a first load of a few
kilobytes, sessionStorage caching with ETag revalidation, and lazy-loaded views.

[![make.fun · makefun-frontend-01](https://make.fun/badge/makefun-frontend-01.svg)](https://make.fun/bounty/makefun-frontend-01?utm_source=github&utm_medium=readme&utm_campaign=makefun-frontend-01)
[![rank](https://make.fun/badge/makefun-frontend-01/dhozil/makefun-frontend-01/rank.svg)](https://make.fun/bounty/makefun-frontend-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=makefun-frontend-01)
[![reward](https://make.fun/badge/makefun-frontend-01/dhozil/makefun-frontend-01/reward.svg)](https://make.fun/bounty/makefun-frontend-01?utm_source=github&utm_medium=readme&utm_campaign=makefun-frontend-01)

## Surfaces

- `#/` — the live bounty board: open bounties by time left, each with its live pot, entry fee and entries count; recently closed below.
- `#/bounty/<slug>` — a bounty's brief, its rewards table with the live pot, dates and status.
- `#/bounty/<slug>/leaderboard` — ranked entries: win rate, 90% interval, valid, size.
- `#/profile/<handle>` — a public account profile.

## Run

Serve the static `app/` folder with any static file server, for example Node 22:

```
node serve.ts
# then open http://localhost:8080
```

`node serve.ts` serves `app/` on http://localhost:8080 (`--port` for another port).
`main.ts` hands the entry in: it copies `app/` and `screenshots/` to `/output` (`MAKEFUN_OUTPUT_DIR`
stands in for it) and writes `dossier.json` with the vendored make.fun library.

## License

MIT — see [LICENSE](LICENSE).
