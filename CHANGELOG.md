# Changelog

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
