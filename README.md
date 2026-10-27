# Pixel Chefs

A Jackbox-style party game for the Four Kitchens Web Chefs. Each round shows a
teammate's headshot as chunky pixels that sharpen over time; everyone races on
their own device to pick the right name. Faster correct answers score more.

Built on Spacefast Zero (Preact client, live queries, per-space MySQL).

## Play

1. Open the app, enter a name, **Host a new game**.
2. Share the 4-letter room code or invite link (`/#/ABCD`).
3. Host picks rounds/seconds and hits **Everybody's in!**

Scoring: up to 1000 points, decaying linearly with time (min 100), plus a +250
First Blood bonus for the first correct answer. Wrong answers score 0 and lock
you out for that round.

## Develop

```sh
npm install
npm run dev          # sf dev with sqlite state
```

Open the private URL `sf dev` prints. Each browser tab is its own player, so you
can test multiplayer with several tabs.

## Refresh the roster

```sh
npm run fetch-team
```

Scrapes fourkitchens.com/team and regenerates `shared/team.ts` and
`client/chef-images.ts` (320px JPEGs bundled into the client, keyed by opaque ids).

## Deploy

```sh
sf publish
```

The Space is private by default; share access with the team rather than making it public.

## Layout

- `server/index.ts`: schema, the `game` live query, and mutations (rooms, rounds, answers, scoring)
- `shared/scoring.ts`: points formula, pixel stages, palette
- `client/App.tsx`: hash routing and screen switching; screens in `Home`, `Lobby`, `Round`, `Reveal`, `Podium`
- `client/PixelImage.tsx`: canvas pixelation
