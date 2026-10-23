# Changelog

## v0.6.1 — 2026-10-23

### Fixed
- docker compose: the TubeHaus container gets `NET_ADMIN` (inside its own network namespace only); without it WARP
  never finishes connecting and every YouTube request fails
- docker compose: invidious-companion gets `NETWORKING_FETCH_RETRY_INITIAL_DEBOUNCE` and
  `NETWORKING_FETCH_RETRY_DEBOUNCE_MULTIPLIER`; without them its PO-token job never succeeds

### Added
- A public instance to try TubeHaus without installing it: https://try.168-107-27-85.sslip.io

## v0.6.0 — 2026-10-23

### Added
- **Public instance mode** (`TUBEHAUS_PUBLIC=1` / `HT_PUBLIC_MODE=1`): each visitor's library lives in their own
  browser, the server stores nothing about visitors and only fetches feeds, parses imports and converts exports;
  send to TV and server downloads are off. A note in Settings reminds visitors to export backups
- **Load limits**: max viewers at once (`HT_MAX_VIEWERS`), max quality (`HT_MAX_HEIGHT`), requests per visitor per
  minute (`HT_RATE_PER_MIN`, 120 on public instances) and concurrent requests (`HT_MAX_CONNECTIONS`, 256)
- Many people opening the same uncached video, or the same channel feeds, at once cause a single YouTube request;
  idle connections are dropped after 30 s; public instances don't pre-load recommended videos
- Bengali interface, the 13th language (thanks @rahul05ranjan, #16)

### Changed
- Hindi: a native speaker's review of strings that read unnaturally (thanks @rahul05ranjan, #17)

## v0.5.0 — 2026-10-23

### Added
- **Calm mode** (Settings → Playback): the home screen shows only new videos from your subscriptions; Shorts,
  trending, the explore menu and recommended videos are hidden everywhere; nothing plays after a video ends (playlists
  still continue); comments stay folded behind a button. Shorts links open as regular videos
- README: a Thanks section for everyone who helped

## v0.4.0 — 2026-10-23

### Added
- **Import from file** (Settings → My data, and the subscriptions page): Google Takeout subscriptions CSV and
  `watch-history.json`, Invidious export, NewPipe, FreeTube, OPML, and TubeHaus backups. Channel names and pictures,
  and the titles of videos that come as bare IDs, are filled in afterwards. Importing the same file twice adds nothing (#15)
- **Export**: a full TubeHaus backup (re-importable), Invidious format, Takeout-style CSV, or OPML (#14)
- `GET /api/p/yt/export?format=tubehaus|invidious|csv|opml`, `POST /api/p/yt/import`

## v0.3.0 — 2026-10-22

### Added
- **Shorts recommendations learned on your own server.** Watch time, loops, likes, dislikes and swipes move a score
  per channel and per topic; the next Shorts come from subscriptions, liked channels, liked topics and popular Shorts,
  with every fourth slot for something new and at most two per channel. Stored in `shorts.json` next to the library;
  reset under History. New endpoints: `GET /api/p/yt/shorts/next`, `POST /api/p/yt/shorts/sig`, `POST /api/p/yt/shorts/reset`

### Fixed
- Trending (gaming) and the popular Shorts lists sent the literal text `${REGION}` instead of your region

## v0.2.1 — 2026-10-22

### Added
- Turkish interface (thanks @SakarPaisen, #8)
- Privacy headers in the Caddy configs (no referrer to other sites, no FLoC/Topics, no framing) and a robots.txt that keeps search engines out
- CI starts the server and checks it answers; the image workflow smoke-tests the published image
- Pull requests are labeled automatically by the files they touch; CodeRabbit review settings

## v0.2.0 — 2026-10-22

### Added
- `--doctor` self-check: `docker compose exec tubehaus python3 /app/server/tubehaus_server.py --doctor` tests WARP,
  YouTube, Invidious, a real video lookup and the optional tools
- `GET /api/p/health` and a Docker healthcheck for the TubeHaus container
- Optional built-in login for the docker compose setup (`TUBEHAUS_AUTH=basic`)
- [Troubleshooting](docs/TROUBLESHOOTING.md) and [Updating and backups](docs/UPGRADING.md) guides
- Server unit tests and a translation completeness check, both run in CI
- **Prebuilt images** for amd64 and arm64 (`ghcr.io/biolend83/tubehaus`): `docker compose pull` instead of compiling whisper.cpp on your server
- CodeQL code scanning

### Changed
- docker compose uses the prebuilt image (`--build` still builds from the checkout)
- Server log lines are tagged `[tag]` instead of `ha[tag]`

### Fixed
- The library file is always read and written as UTF-8, whatever the system locale
- Subtitle cache paths are validated inside the cache function too (CodeQL)
- Caption text is cleaned with DOMParser instead of innerHTML

## v0.1.0 — 2026-10-22

First public release.

- YouTube-identical web app (home, search, channels, playlists, subscriptions, history, library, trending)
- Cloudflare WARP egress with automatic re-connect when YouTube flags the address
- Live streams with live captions (whisper.cpp)
- One library shared by every device, send to TV, TV mode
- Full-quality offline downloads
- 11 languages
- docker compose setup for x86-64 and ARM64
