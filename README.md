# make.fun — Live Arena

A compact, dependency-free window into competitions on make.fun.
The interface puts the live prize pool beside the cost and deadline of entry.
All competition content comes from the public make.fun API.

[![make.fun · makefun-frontend-01](https://make.fun/badge/makefun-frontend-01.svg)](https://make.fun/bounty/makefun-frontend-01?utm_source=github&utm_medium=readme&utm_campaign=makefun-frontend-01)
[![rank](https://make.fun/badge/makefun-frontend-01/dhozil/makefun-frontend-01/rank.svg)](https://make.fun/bounty/makefun-frontend-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=makefun-frontend-01)
[![reward](https://make.fun/badge/makefun-frontend-01/dhozil/makefun-frontend-01/reward.svg)](https://make.fun/bounty/makefun-frontend-01?utm_source=github&utm_medium=readme&utm_campaign=makefun-frontend-01)

## Explore

- `#/` lists open bounties by their nearest deadline, then recently closed work.
- `#/bounty/<slug>` explains the brief, rewards, dates, and current status.
- `#/bounty/<slug>/leaderboard` shows entries and their measured results.
- `#/profile/<handle>` presents a competitor's public profile and record.

## Run locally

Use Node 22 and start the included static server:

```sh
node serve.ts
```

Open the local address printed by the server.
Hash navigation works without server-side route configuration.
An internet connection is needed to retrieve live records.
Session storage retains responses; ETags revalidate them on subsequent visits.

## Package

`node main.ts` copies the application and screenshots into `/output`.
Set `MAKEFUN_OUTPUT_DIR` to choose another destination.
The entry point writes the vendor library's canonical dossier bytes unchanged.
`shots.json` describes the three intended capture views.

## License

Released under the MIT license; see LICENSE for permission and warranty terms.
