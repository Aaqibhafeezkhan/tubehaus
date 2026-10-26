# TubeHaus

[![Release](https://img.shields.io/github/v/release/biolend83/tubehaus)](https://github.com/biolend83/tubehaus/releases)
[![License: AGPL-3.0](https://img.shields.io/badge/license-AGPL--3.0-blue)](LICENSE)
[![Check](https://github.com/biolend83/tubehaus/actions/workflows/check.yml/badge.svg)](https://github.com/biolend83/tubehaus/actions/workflows/check.yml)
![Docker: amd64 | arm64](https://img.shields.io/badge/docker-amd64%20%7C%20arm64-2496ED?logo=docker&logoColor=white)
[![Built on Invidious](https://img.shields.io/badge/built%20on-Invidious-orange)](https://invidious.io)
[![Featured in selfh.st Weekly](https://img.shields.io/badge/featured%20in-selfh.st%20weekly-2ea44f)](https://selfh.st/weekly/2026-10-23/)

**English** · [한국어](README.ko.md)

**YouTube without ads, a Google account or tracking: run it on your own server, or install the app on your device.**

Both look and work like YouTube (same layout, same keyboard shortcuts), and both keep your subscriptions and
history to yourself instead of in a Google account.

## Two ways to use TubeHaus

TubeHaus comes in two separate forms. They share the look and the name, but they work differently:

| | 🖥️ **Server version** (this branch, `main`) | 📱 **App** (branches `android-app`, `windows-app`, `mac-app`, `linux-app`) |
|---|---|---|
| **What you install** | A server: docker compose on a VPS, a home PC or a Raspberry Pi | An app on each device: Android (phones, tablets, Android TV / Google TV), Windows, macOS or Linux |
| **How you watch** | In any browser: phones, iPhone/iPad, PCs, TVs. Add it to the home screen to use it like an app | In the app on that device |
| **Who talks to YouTube** | Your server, through Invidious and Cloudflare WARP. Your devices only ever talk to your server | The device itself, with the app's own YouTube engine. No Invidious and no TubeHaus server in between |
| **What YouTube sees** | A Cloudflare WARP address, not your home or your device | Your device's own internet address, like any YouTube app |
| **Where your library lives** | On the server, shared by every device and person using it | On that device only. Move it between devices with export/import |
| **Only here** | Live captions (whisper.cpp), send to TV, full-quality downloads, TV mode, iPhone/iPad | Offline downloads, background play and picture-in-picture (Android), mpv player (desktop), recommendations learned on the device |
| **You need** | A server and basic Docker | Nothing else |

**Not sure?** Want it on one phone or PC, today, with nothing to set up? Get the app.
Want one library for the whole household, iPhone/iPad support, or to keep YouTube away from your devices' addresses? Run the server.

- **📱 Get the app (beta):** [Android APK](https://github.com/biolend83/tubehaus/releases/download/app-v0.5.2/TubeHaus-0.5.2.apk) (Android 8+) · [Windows](https://github.com/biolend83/tubehaus/releases/download/app-v0.5.2/TubeHaus-0.5.2.msi) · [macOS](https://github.com/biolend83/tubehaus/releases/download/app-v0.5.2/TubeHaus-0.5.2-mac-arm64.dmg) · [Linux .deb](https://github.com/biolend83/tubehaus/releases/download/app-v0.5.2/TubeHaus-0.5.2-linux-amd64.deb) · [.rpm](https://github.com/biolend83/tubehaus/releases/download/app-v0.5.2/TubeHaus-0.5.2-linux-x86_64.rpm) · [all files](https://github.com/biolend83/tubehaus/releases/latest).
  Install notes and source per platform: [`android-app`](https://github.com/biolend83/tubehaus/tree/android-app), [`windows-app`](https://github.com/biolend83/tubehaus/tree/windows-app), [`mac-app`](https://github.com/biolend83/tubehaus/tree/mac-app), [`linux-app`](https://github.com/biolend83/tubehaus/tree/linux-app)
- **🖥️ Run the server:** see [Quick start (Docker)](#quick-start-docker) below. The rest of this README is about the server version.
- **👉 Try the server version without installing anything:** [try.168-107-27-85.sslip.io](https://try.168-107-27-85.sslip.io). It's a small public instance I run: sign-up required, up to 15 viewers at a time, 720p. There your library stays in your own browser, not on the server.

The server version is built on top of [Invidious](https://invidious.io) and
[invidious-companion](https://github.com/iv-org/invidious-companion), which do the hard work of talking to
YouTube. TubeHaus adds its own front end and a small server next to them. All credit to the Invidious team.

![TubeHaus home screen](docs/screenshot-home.jpg)

## Why the server version

**⚡ Fast**
- **Instant clicks.** Video pages come from a local cache that refreshes in the background, and the videos you are most likely to open next are fetched before you click (measured: about 1-2 s cold, a few milliseconds warm)
- **Live streams that don't stall.** The server pulls segments ahead of the player over kept-alive connections and serves a longer, gap-free playlist with exact segment timing, so the timeline never jumps
- **Always the best quality.** It never lowers resolution on its own. It prefers 60 fps and the codec your device decodes in hardware (checked with MediaCapabilities), switches codec instead of resolution when frames drop, and sizes the buffer from the bitrate so even 8K fits the browser's media buffer

**🔒 Private**
- **Your devices never talk to Google.** Video, thumbnails and pages are streamed through your own server; no Google account, cookies or YouTube scripts in your browser
- **YouTube never sees your home IP.** Everything your server asks YouTube goes out through Cloudflare WARP
- **No accounts, no telemetry.** Subscriptions, history, resume positions and playlists are files on your server, shared by your household and nobody else

**🛡️ Doesn't get blocked**
- YouTube refuses most VPS and cloud addresses ("Sign in to confirm you're not a bot"). TubeHaus routes YouTube traffic through **Cloudflare WARP in proxy mode**, and when YouTube flags the address anyway it **reconnects WARP for a fresh one and replays the request automatically** (rate-limited). Playback, live streams and downloads keep working on a cheap cloud VM

**🎙️ Live captions**
- YouTube gives no captions for live streams. TubeHaus transcribes them on the fly with [whisper.cpp](https://github.com/ggml-org/whisper.cpp), a few seconds ahead of playback, on a single CPU core

**🌿 Calm mode**
- One switch in Settings turns YouTube back into a tool: the home screen is only new videos from your subscriptions, Shorts, trending and recommended videos disappear everywhere, nothing autoplays after a video, and comments stay folded until you open them. Search still works, so you watch what you came for

**🧠 Shorts that learn from you, on your server**
- The Shorts feed learns what you like from how you watch: how long you watched, whether you looped it, liked it or swiped it away. It keeps a score per channel and per topic (tags, hashtags, genre) in a small file on your server, and picks the next Shorts from your subscriptions, channels you like, topics you like and what's popular, with every fourth slot left for something new. No Google account, nothing leaves your server, and you can reset it any time under History

**🌍 13 languages:** 한국어 · English · 日本語 · 简体中文 · Español · Português · Français · Deutsch · Русский · हिन्दी · Bahasa Indonesia · Türkçe · বাংলা —
chosen on the first visit (English until you pick one) and changeable any time under **Language** in the
account menu or Settings. View counts and dates follow each language's own style.

## Everything else

- YouTube-identical UI: home, search, channels, playlists, subscriptions, history, library, trending
- Custom player on [Shaka Player](https://github.com/shaka-project/shaka-player) (DASH/HLS): chapters, storyboard seek previews, SponsorBlock, speed, sleep timer, stats, mini player, theater mode, ambient mode, Media Session (lock screen / Bluetooth keys)
- **One library for every device**: subscriptions (with an RSS-based feed), watch history, resume positions, Watch Later, likes, playlists
- **Send to TV**: pick a video on your phone and it starts on the TV (no Chromecast; open screens long-poll the server)
- **High-quality offline save**: 1080p/4K come as separate video and audio; the server fetches both and merges them with ffmpeg
- **Translated subtitles** for videos that have none in your language
- **TV mode**: full remote-control navigation (arrows / OK / Back) for TV browsers
- Dislike counts (Return YouTube Dislike), comments, transcripts

Optional lookups the browser makes itself: SponsorBlock (by a hash prefix, not the video ID) and Return YouTube Dislike.

*(Formerly HomeTube, renamed to avoid a clash with an unrelated project of the same name.)*

## How it fits together

```
browser ──► Caddy ─┬─ /y/*, page navigations ─────────► web/ (the app)
                   ├─ /api/p/*, /api/v1/videos/* ─────► TubeHaus server ──┐
                   ├─ /companion/* ───────────────────► invidious-companion ─┤
                   └─ everything else ────────────────► Invidious          │
                                                                           ▼
                                                          Cloudflare WARP (proxy mode)
                                                                           │
                                                                        YouTube
```

TubeHaus uses [Invidious](https://github.com/iv-org/invidious) as its YouTube backend and adds its own server next to it. Invidious' companion `private_url` points at the TubeHaus server, which passes everything
through and patches in what is missing (live HLS URLs, an empty `storyboards` key some old
videos lack, WARP rotation when YouTube blocks).

## Requirements

- **Server:** Linux with Docker and docker compose, x86-64 or ARM64 (a free Oracle Cloud ARM VM works fine)
- **CPU / RAM:** 2+ cores and about 4 GB RAM for the whole stack. Live captions use about one more core, only while someone watches a live stream with captions on
- **Disk:** about 10-20 GB, mostly Docker images. Videos are streamed, not stored, so this doesn't grow with use
- **A hostname** for HTTPS (a domain, or a free wildcard DNS name such as sslip.io), or plain HTTP on a LAN

## Quick start (Docker)

One command brings up everything: Caddy, the TubeHaus server with Cloudflare WARP built in,
the PO-token provider for live streams, whisper.cpp for live captions, and the official
Invidious + companion + PostgreSQL images. Works on x86-64 and ARM64.

```sh
git clone https://github.com/biolend83/tubehaus && cd tubehaus
cp .env.example .env        # set your domain and three secrets
docker compose pull         # prebuilt images, amd64 and arm64
docker compose up -d
```

To build the TubeHaus image yourself instead (for example after changing the code), use
`docker compose up -d --build`. The first build takes a few minutes because of whisper.cpp.

Then open your domain. WARP registers itself on first start and keeps its registration in a
volume; the companion reaches YouTube through it as well.

**No domain, or your own reverse proxy?** Caddy can serve plain HTTP on any port. In `.env`:

```sh
# plain HTTP on a LAN, at http://192.168.1.10:8080
TUBEHAUS_SITE=:80
TUBEHAUS_HTTP_BIND=8080
TUBEHAUS_URL=http://192.168.1.10:8080
TUBEHAUS_DOMAIN=192.168.1.10
TUBEHAUS_HTTPS=false
TUBEHAUS_EXTERNAL_PORT=8080

# behind your own nginx, Traefik or Caddy, which handles HTTPS for tube.example.com
TUBEHAUS_SITE=:80
TUBEHAUS_HTTP_BIND=127.0.0.1:8080       # only your proxy reaches it
TUBEHAUS_HTTPS_BIND=127.0.0.1:8443      # unused, kept off the public 443
TUBEHAUS_URL=https://tube.example.com
TUBEHAUS_DOMAIN=tube.example.com
TUBEHAUS_HTTPS=true
TUBEHAUS_EXTERNAL_PORT=443
```

Then point your proxy at `http://127.0.0.1:8080` for everything, unbuffered (video and live streams), e.g. in nginx:
`proxy_pass http://127.0.0.1:8080; proxy_buffering off; proxy_read_timeout 1h; proxy_set_header Host $host;`

**Add a login before you expose it.** TubeHaus has no accounts of its own. The simplest option is the built-in
password: set `TUBEHAUS_AUTH=basic`, `TUBEHAUS_USER` and `TUBEHAUS_PASSWORD_HASH` in `.env` (the hash comes from
`docker compose run --rm caddy caddy hash-password`; write every `$` as `$$`). Or put Authelia, Authentik or a
passkey gate in front with `forward_auth`.

**Check that everything works:**

```sh
docker compose exec tubehaus python3 /app/server/tubehaus_server.py --doctor
```

It tests WARP, YouTube, Invidious, a real video lookup and the optional tools, one line each.
If something fails, see [Troubleshooting](docs/TROUBLESHOOTING.md). To update or back up, see
[Updating and backups](docs/UPGRADING.md).

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
- Invidious config: point the companion's `private_url` at TubeHaus, e.g.
  `invidious_companion: [{ private_url: "http://172.17.0.1:3010/companion", public_url: "https://tube.example.com/companion" }]`
  (then bind TubeHaus to an address the container can reach, e.g. `HT_BIND=172.17.0.1`)

### 3. TubeHaus server

```sh
git clone https://github.com/biolend83/tubehaus /opt/tubehaus
cd /opt/tubehaus && cp .env.example .env    # edit it
sudo cp deploy/tubehaus.service /etc/systemd/system/ && sudo systemctl enable --now tubehaus
```

Optional extras:
- **Live streams:** [yt-dlp](https://github.com/yt-dlp/yt-dlp) with the
  [bgutil-ytdlp-pot-provider](https://github.com/Brainicism/bgutil-ytdlp-pot-provider) plugin (PO tokens keep live URLs alive)
- **Live captions:** build whisper.cpp and download `ggml-base-q5_1.bin`; set `HT_WHISPER_BIN` / `HT_WHISPER_MODEL`
- **Offline save:** `ffmpeg`

### 4. Reverse proxy: Caddy or nginx

Copy `web/` to `/srv/tubehaus/web` and adapt [`deploy/Caddyfile.example`](deploy/Caddyfile.example) for Caddy. If you use nginx instead, start from [`deploy/nginx.conf.example`](deploy/nginx.conf.example) and replace the hostname, TLS certificate paths and upstream addresses for your setup. The nginx example keeps long-lived API, companion and download requests unbuffered with extended timeouts.

**TubeHaus has no accounts.** Anyone who can open it shares the same library. Put your own
login in front (Caddy `basic_auth`, or `forward_auth` to Authelia / Authentik / a passkey gate)
before exposing it. Set `window.TUBEHAUS_LOGIN_URL` in `index.html` if expired sessions should
be sent to your login page.

## FAQ

**Is this a replacement for Invidious?**
No, it runs alongside it. Invidious and its companion fetch everything from YouTube; TubeHaus is a
YouTube-style front end plus a server that adds live streams, live captions, a shared library, send to TV,
downloads and WARP egress. The docker compose file runs the official Invidious images for you.

**Can I use my existing Invidious instance (or keep using Yattee, FreeTube, ...)?**
Yes, follow *Manual setup* and point TubeHaus at it. Apps that talk to Invidious keep working, and if the
companion goes out through WARP they benefit from it too. Live streams and WARP rotation work best when
TubeHaus sits in front of the companion as described.

**Where does the content come from? Does it store videos?**
Everything comes from YouTube. Nothing is stored except your library (subscriptions, history, playlists) and
short-lived files for offline downloads.

**Is there a recommendation algorithm?**
For Shorts, yes, and it runs entirely on your server (see *Shorts that learn from you* above). For regular videos you
get your subscriptions feed, trending and category tabs, and YouTube's per-video related list. Nothing is learned by
Google, since no Google account is involved.

**Age-restricted videos?**
They usually don't play, since there's no signed-in account to pass the age check. That is the same as Invidious.

**Can I bring my subscriptions in, and take my data out?**
Yes. Under Settings → My data (or the subscriptions page), **Import from file** takes Google Takeout (the
subscriptions CSV and `watch-history.json`), Invidious, NewPipe and FreeTube exports, OPML, and TubeHaus backups.
**Export** gives you a full TubeHaus backup (subscriptions, history, resume points, playlists, likes), an
Invidious-format file, a Takeout-style CSV, or OPML for any feed reader. Your data is never stuck here.

**Does anything phone home?**
No. There are no accounts and no telemetry. The only outside requests are YouTube (through Invidious and WARP)
and, from the browser, the optional SponsorBlock and Return YouTube Dislike lookups.

**How do phones and TVs connect?**
It's a web app: open your address in the browser, or use "Add to Home Screen" to install it like an app.
TV browsers get a TV mode with remote-control navigation.
On Android you can also skip the server entirely with the [TubeHaus app](https://github.com/biolend83/tubehaus/tree/android-app).

## Running a public instance

Want to let people try TubeHaus without installing it? Set `TUBEHAUS_PUBLIC=1` in `.env` (or `HT_PUBLIC_MODE=1`
for a manual install). Then:

- **Every visitor's library lives in their own browser.** Subscriptions, history, resume points and playlists are
  kept in the browser's local storage; the server stores nothing about its visitors, and visitors never see each
  other's data. A note in Settings tells them to export a backup now and then
- **The server only does stateless work:** fetching feeds for the channels a browser sends, parsing imports and
  converting exports, and playing video
- **Switched off:** send to TV and server-side downloads (they would be shared between strangers), and Shorts
  recommendations don't learn

**Handling a crowd.** TubeHaus protects itself, and your YouTube access, when many people show up at once:

| Setting (`.env`) | Default | What it does |
|---|---|---|
| `TUBEHAUS_MAX_VIEWERS` | `0` (off) | people watching at once; newcomers beyond it get "busy, try again in a few minutes", people already watching are never cut off |
| `TUBEHAUS_MAX_HEIGHT` | `0` (off) | highest quality offered, e.g. `1080`, to keep bandwidth in check |
| `TUBEHAUS_RATE_PER_MIN` | `120` on public instances | API requests per visitor per minute; more get "slow down" (429) |
| `HT_MAX_CONNECTIONS` | `256` | requests handled at the same time; beyond it the server answers "busy" at once instead of falling over |

Always on: when many people open the same video (or the same channel feeds) at once, YouTube is asked once and the
answer is shared; live streams are fetched once per stream however many people watch; idle connections are dropped
after 30 seconds; and public instances don't pre-load recommended videos.

**The ready-made public setup.** `deploy/docker-compose.public.yml` puts all of this together the way the instance
above runs:

- **Anubis** in front: every visitor's browser solves a short proof-of-work check ("Making sure you're not a bot")
  before anything else loads, which keeps scrapers and bulk bots out
- **Sign-up required** (`HT_ACCOUNTS=1`): a user name and a password, no e-mail or other personal details. Passwords are
  stored as PBKDF2 hashes (600,000 rounds); sessions are signed HttpOnly cookies; sign-ups and log-ins are rate-limited
  per network
- Invidious' own accounts and admin pages switched off, only the player's reads allowed on the companion, load limits,
  memory/CPU caps, no access log

```sh
docker compose --env-file .env -f deploy/docker-compose.public.yml up -d
```

Also firewall the box so the containers can reach the internet only: no private networks, no cloud metadata
service, none of your other servers.

Before you open one, keep in mind:

- **Bandwidth:** video is streamed through your server. Watch your provider's traffic limits
- **YouTube blocks:** many viewers on one address get it flagged sooner; WARP rotation helps but has limits
- **Trust:** visitors' requests pass through your server. Be clear about what you log (TubeHaus logs no viewing
  history), and don't put the built-in password on it
- Leave `TUBEHAUS_AUTH=none`, and consider rate limiting in Caddy

**Public instances**

| Address | Region | Limits | Run by |
|---|---|---|---|
| [try.168-107-27-85.sslip.io](https://try.168-107-27-85.sslip.io) | South Korea | 15 viewers, 720p | the maintainer |

Running one? [Add it here](https://github.com/biolend83/tubehaus/issues/new?template=public_instance.yml) (or in the [discussion](https://github.com/biolend83/tubehaus/discussions/18)) so
others can find it.

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
| `HT_DOWNLOAD_DIR` | `/var/tmp/tubehaus-dl` | offline save workspace |
| `HT_PUBLIC_MODE` | `0` | public instance: libraries stay in visitors' browsers (see above) |
| `HT_ACCOUNTS`, `HT_MAX_ACCOUNTS` | `0`, `1000` | require sign-up (user name + password) before anything else |
| `HT_MAX_VIEWERS`, `HT_MAX_HEIGHT`, `HT_RATE_PER_MIN`, `HT_MAX_CONNECTIONS` | `0`, `0`, `120` public / `0`, `256` | load limits (see *Handling a crowd*) |

## Translations

Interface text lives in `web/y/lang/<code>.js` (the key is the original Korean text). The 13 languages are complete
and no new ones are being added for now, so each can be kept up to date with every release. Corrections to the
existing translations are very welcome.

## Community

- **Questions and setup help:** [Discussions](https://github.com/biolend83/tubehaus/discussions) (please include the `--doctor` output)
- **Bugs and feature requests:** [Issues](https://github.com/biolend83/tubehaus/issues/new/choose)
- **Contributing:** see [CONTRIBUTING.md](CONTRIBUTING.md). Start with a [`good first issue`](https://github.com/biolend83/tubehaus/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22); [ROADMAP.md](ROADMAP.md) shows what's planned and [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) maps the code
- **Security problems:** report them privately, see [SECURITY.md](SECURITY.md)
- **What changed:** [CHANGELOG.md](CHANGELOG.md) and [Releases](https://github.com/biolend83/tubehaus/releases)

## Thanks

People who made TubeHaus better, with code, translations, testing or ideas:

**Code and design**
- <img src="https://github.com/Aaqibhafeezkhan.png?size=48" width="24" height="24" alt=""> [@Aaqibhafeezkhan](https://github.com/Aaqibhafeezkhan): the house-and-play icon, remembering the playback speed, an nginx example, Spanish polish (#28, #29, #30, #31)
- <img src="https://github.com/bh-official.png?size=48" width="24" height="24" alt=""> [@bh-official](https://github.com/bh-official): the exact upload date on hover, and tests for exact upload times (#26, #27)
- <img src="https://github.com/onyks-os.png?size=48" width="24" height="24" alt=""> [@onyks-os](https://github.com/onyks-os): the first contribution, fixing the install instructions (#1)

**Translations**
- <img src="https://github.com/SakarPaisen.png?size=48" width="24" height="24" alt=""> [@SakarPaisen](https://github.com/SakarPaisen): Turkish (#8)
- <img src="https://github.com/rahul05ranjan.png?size=48" width="24" height="24" alt=""> [@rahul05ranjan](https://github.com/rahul05ranjan): Bengali, and a Hindi review by a native speaker (#16, #17)

**Ideas and bug reports**
- <img src="https://github.com/JamesMowery.png?size=48" width="24" height="24" alt=""> [@JamesMowery](https://github.com/JamesMowery): import from file and data export (which became v0.4.0), and the wrong posted time on new videos (#14, #15, #20)

**Testing the apps** (on [r/DigitalEscapeTools](https://www.reddit.com/r/DigitalEscapeTools/))
- [u/Proper_Witness9173](https://www.reddit.com/user/Proper_Witness9173/): brightness and volume swipes, the tablet layout, comments beside the video, picture-in-picture and most of 0.3.8
- [u/DryYam2258](https://www.reddit.com/user/DryYam2258/): the first Mac tester; asked for text size, removing subscriptions and channel pictures, and suggested subscription groups
- [u/Gloomy_Acadia_445](https://www.reddit.com/user/Gloomy_Acadia_445/): asked for Linux, which led to the .deb, .rpm and tar.gz builds
- [u/Victor_Orbis35](https://www.reddit.com/user/Victor_Orbis35/): reported "mpv is missing" on Windows, which turned out to be a missing Vulkan runtime (fixed in 0.3.5)

Opened a useful issue, sent a pull request or tested an app? You belong here too.

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
