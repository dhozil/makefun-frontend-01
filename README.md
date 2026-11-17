# makefun-frontend-01

A framework-free frontend for make.fun bounties, results, and builder profiles. It fetches live API data with memory and session storage caching and ETag revalidation.

Four surfaces are available:

- Bounty board: `#/`
- Bounty details and rewards: `#/bounty/<slug>`
- Ranked entries: `#/bounty/<slug>/leaderboard`
- Builder profile: `#/profile/<handle>`

Run `node serve.ts`, then open http://localhost:8080.

[![make.fun · makefun-frontend-01](https://make.fun/badge/makefun-frontend-01.svg)](https://make.fun/bounty/makefun-frontend-01?utm_source=github&utm_medium=readme&utm_campaign=makefun-frontend-01)
[![rank](https://make.fun/badge/makefun-frontend-01/dhozil/makefun-frontend-01/rank.svg)](https://make.fun/bounty/makefun-frontend-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=makefun-frontend-01)
[![reward](https://make.fun/badge/makefun-frontend-01/dhozil/makefun-frontend-01/reward.svg)](https://make.fun/bounty/makefun-frontend-01?utm_source=github&utm_medium=readme&utm_campaign=makefun-frontend-01)

Released under the MIT license. See LICENSE for the full terms.
