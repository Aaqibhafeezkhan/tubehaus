# HomeTube

**A YouTube-identical front end for your own Invidious — plus the things Invidious can't do:
live streams, live captions, one library shared across all your devices, and a server
that keeps working from a cloud VPS thanks to Cloudflare WARP.**

HomeTube is a single-page web app that looks and behaves like classic YouTube (same URLs,
same layout, same keyboard shortcuts), backed by a small Python server that runs next to
[Invidious](https://github.com/iv-org/invidious). It is built for one household: no ads, no
tracking, your subscriptions and history stay on your server.

**11 languages:** 한국어 · English · 日本語 · 简体中文 · Español · Português · Français · Deutsch · Русский · हिन्दी · Bahasa Indonesia —
chosen on the first visit (the browser's language is preselected) and changeable any time under **Language** in the
account menu or Settings. View counts and dates follow each language's own style.

## Features

**Watching**
- YouTube-identical UI: home, search, channels, playlists, subscriptions, history, library, trending
- Custom player on [Shaka Player](https://github.com/shaka-project/shaka-player) (DASH/HLS): chapters, storyboard seek previews, SponsorBlock, speed, sleep timer, stats, mini player, theater mode, ambient mode, Media Session (lock screen / Bluetooth keys)
- Always the best quality — it never lowers resolution on its own. Prefers 60 fps and the codec your device decodes in hardware (checked with MediaCapabilities); switches codec, not resolution, when frames drop
- Buffer sized from the track bitrate, so 8K does not overflow the browser's ~150 MB media buffer
- Dislike counts (Return YouTube Dislike), comments, transcripts

**What Invidious doesn't have**
- **Live streams** — HLS through the server, with segments pulled ahead of the player over kept-alive connections, a rebuilt longer playlist window, and exact segment durations/discontinuities so the timeline never jumps
- **Live captions** — YouTube provides none for live streams; HomeTube transcribes them on the fly with [whisper.cpp](https://github.com/ggml-org/whisper.cpp), a few seconds ahead of playback (one CPU core is enough)
- **Translated subtitles** for videos that have none in your language (in your interface language)
- **One library for every device** — subscriptions (with an RSS-based feed), watch history, resume positions, Watch Later, likes, playlists
- **Send to TV** — pick a video on your phone, it starts on the TV (no Chromecast; open screens long-poll the server)
- **High-quality offline save** — 1080p/4K come as separate video and audio; the server fetches both and merges them with ffmpeg
- **Instant clicks** — a cache in front of `/api/v1/videos` with background refresh and prefetching of the next likely videos
- **TV mode** — full remote-control navigation (arrows / OK / Back) for TV browsers

**Runs from a cloud server: Cloudflare WARP**

YouTube refuses most VPS and cloud addresses ("Sign in to confirm you're not a bot").
HomeTube sends all YouTube traffic through **Cloudflare WARP in proxy mode**, and when YouTube
flags the WARP address anyway it **reconnects WARP for a fresh address and replays the request
automatically** (rate-limited). This is what keeps playback, live streams and downloads working
on a cheap cloud VM.

## How it fits together

```
browser ──► Caddy ─┬─ /y/*, page navigations ─────────► web/ (the app)
                   ├─ /api/p/*, /api/v1/videos/* ─────► HomeTube server ──┐
                   ├─ /companion/* ───────────────────► invidious-companion ─┤
                   └─ everything else ────────────────► Invidious          │
                                                                           ▼
                                                          Cloudflare WARP (proxy mode)
                                                                           │
                                                                        YouTube
```

Invidious' companion `private_url` points at the HomeTube server, which passes everything
through and patches in what is missing (live HLS URLs, an empty `storyboards` key some old
videos lack, WARP rotation when YouTube blocks).

## Quick start (Docker)

One command brings up everything: Caddy, the HomeTube server with Cloudflare WARP built in,
the PO-token provider for live streams, whisper.cpp for live captions, and the official
Invidious + companion + PostgreSQL images. Works on x86-64 and ARM64.

```sh
git clone https://github.com/<you>/hometube && cd hometube
cp .env.example .env        # set your domain and three secrets
docker compose up -d        # first build takes a few minutes (whisper.cpp)
```

Then open your domain. WARP registers itself on first start and keeps its registration in a
volume; the companion reaches YouTube through it as well. Add a login to
`deploy/Caddyfile.docker` before you expose it (see *Caddy* below).

## Manual setup

You need a Linux server with Python 3.10+, [Caddy](https://caddyserver.com), and Docker for Invidious.

### 1. Cloudflare WARP in proxy mode

Install the official client ([pkg.cloudflareclient.com](https://pkg.cloudflareclient.com)), then —
**set proxy mode before connecting**, or the whole server's routing moves into WARP:

```sh
warp-cli --accept-tos registration new
warp-cli --accept-tos mode proxy        # listens on 127.0.0.1:40000
warp-cli --accept-tos connect
curl -x http://127.0.0.1:40000 https://www.cloudflare.com/cdn-cgi/trace   # warp=on
```

Containers can't reach 127.0.0.1 on the host, so re-expose it on the Docker bridge for the companion:

```sh
socat TCP-LISTEN:18080,bind=172.17.0.1,fork,reuseaddr TCP:127.0.0.1:40000   # run it as a service
```

(Unofficial WARP clients such as `wgcf` get rate-limited by Cloudflare; use the official one.)

### 2. Invidious + companion

Follow the [Invidious installation guide](https://docs.invidious.io/installation/) with
[invidious-companion](https://github.com/iv-org/invidious-companion). Then:

- companion: `PROXY=socks5://172.17.0.1:18080` (WARP) and publish it on `127.0.0.1:8282`
- Invidious config: point the companion's `private_url` at HomeTube, e.g.
  `invidious_companion: [{ private_url: "http://172.17.0.1:3010/companion", public_url: "https://tube.example.com/companion" }]`
  (then bind HomeTube to an address the container can reach, e.g. `HT_BIND=172.17.0.1`)

### 3. HomeTube server

```sh
git clone https://github.com/<you>/hometube /opt/hometube
cd /opt/hometube && cp .env.example .env    # edit it
sudo cp deploy/hometube.service /etc/systemd/system/ && sudo systemctl enable --now hometube
```

Optional extras:
- **Live streams:** [yt-dlp](https://github.com/yt-dlp/yt-dlp) with the
  [bgutil-ytdlp-pot-provider](https://github.com/Brainicism/bgutil-ytdlp-pot-provider) plugin (PO tokens keep live URLs alive)
- **Live captions:** build whisper.cpp and download `ggml-base-q5_1.bin`; set `HT_WHISPER_BIN` / `HT_WHISPER_MODEL`
- **Offline save:** `ffmpeg`

### 4. Caddy

Copy `web/` to `/srv/hometube/web` and adapt [`deploy/Caddyfile.example`](deploy/Caddyfile.example).

**HomeTube has no accounts.** Anyone who can open it shares the same library. Put your own
login in front (Caddy `basic_auth`, or `forward_auth` to Authelia / Authentik / a passkey gate)
before exposing it. Set `window.HOMETUBE_LOGIN_URL` in `index.html` if expired sessions should
be sent to your login page.

## Configuration

All settings are environment variables — see [`.env.example`](.env.example).

| Variable | Default | |
|---|---|---|
| `HT_BIND`, `HT_PORT` | `127.0.0.1`, `3010` | where the API listens |
| `HT_STATE` | `./state` | library and subtitle cache |
| `HT_INVIDIOUS` | `http://127.0.0.1:3000` | Invidious |
| `HT_COMPANION` | `http://127.0.0.1:8282` | invidious-companion |
| `HT_PUBLIC_URL` | `http://localhost:8080` | the address browsers use |
| `HT_YT_PROXY` | `127.0.0.1:40000` | WARP proxy (empty = direct) |
| `HT_WARP_ROTATE` | `1` | reconnect WARP when YouTube blocks |
| `HT_YTDLP` | `yt-dlp` | for live streams |
| `HT_WHISPER_BIN`, `HT_WHISPER_MODEL`, `HT_WHISPER_LANG` | empty, empty, `auto` | live captions |
| `HT_SUB_LANG`, `HT_LIBRETRANSLATE` | `en`, empty | default subtitle translation target (the app asks for its own language), optional fallback |
| `HT_DOWNLOAD_DIR` | `/var/tmp/hometube-dl` | offline save workspace |

## Translations

Interface text lives in `web/y/lang/<code>.js` (the key is the original Korean text). To add a language, copy
`en.js`, translate the values, and add the code to `LANGS` in `web/y/i18n.js`. Corrections are very welcome.

## Credits

- [Invidious](https://github.com/iv-org/invidious) and [invidious-companion](https://github.com/iv-org/invidious-companion) (AGPL-3.0) — the backend this sits on
- [Shaka Player](https://github.com/shaka-project/shaka-player) (Apache-2.0) — bundled in `web/y/lib/`
- Layout after [varun-jasti/Youtube-UI-UX](https://github.com/varun-jasti/Youtube-UI-UX) (MIT); progress bar and volume after [pncsoares/youtube-video-player-clone](https://github.com/pncsoares/youtube-video-player-clone) (MIT)
- Icons: Material Symbols (Apache-2.0)
- [whisper.cpp](https://github.com/ggml-org/whisper.cpp) (MIT), [SponsorBlock](https://sponsor.ajay.app), [Return YouTube Dislike](https://returnyoutubedislike.com)
- Cloudflare WARP

## License

AGPL-3.0, like Invidious.

This project is not affiliated with YouTube or Google. Use it for your own household, and
respect the terms of the services you connect to.
