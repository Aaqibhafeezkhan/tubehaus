// "Send to TV": the receiving screen (a TV) waits on the server, the sender (a phone) posts commands.
// No Chromecast needed - only our own server.
import { lib, settings, local, toast, esc } from "./util.js";
import { player, navigate, popup, mi } from "./core.js";

const UA = navigator.userAgent;
export const deviceId = local.get("devId", null) || (() => {
  const id = (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36)).replace(/[^\w-]/g, "");
  local.set("devId", id);
  return id;
})();
export function deviceName() {
  if (settings.deviceName && settings.deviceName.trim()) return settings.deviceName.trim().slice(0, 40);
  if (document.documentElement.classList.contains("tv")) return "TV";
  if (/iPad/.test(UA) || (/Macintosh/.test(UA) && navigator.maxTouchPoints > 1)) return "아이패드";
  if (/iPhone|Android.*Mobile/.test(UA)) return "폰";
  return "컴퓨터";
}
const isTVPage = () => document.documentElement.classList.contains("tv");
export const receiving = () => isTVPage() || !!settings.castReceive;

// ---------------------------------------------------------------- receiving side
let running = false;
export function startReceiver() {
  if (running || !receiving()) return;
  running = true;
  let since = -1, fails = 0;
  const loop = async () => {
    if (!receiving()) { running = false; return; }
    try {
      const q = new URLSearchParams({ id: deviceId, since, name: deviceName(), tv: isTVPage() ? "1" : "0" });
      const r = await fetch(`/api/p/yt/cast/wait?${q}`, { credentials: "same-origin", cache: "no-store" });
      if (r.status === 401) { running = false; return; }     // session expired: start again after the next login
      const d = await r.json();
      since = d.seq;
      fails = 0;
      for (const c of d.cmds || []) run(c.cmd, c.from);
    } catch { fails++; await new Promise((ok) => setTimeout(ok, Math.min(30000, 2000 * fails))); }
    loop();
  };
  loop();
}
function run(cmd, from) {
  if (cmd.type === "play") {
    const sameVideo = player.info?.videoId === cmd.id;
    const url = `/watch?v=${cmd.id}${cmd.t ? `&t=${cmd.t}` : ""}${cmd.list ? `&list=${encodeURIComponent(cmd.list)}` : ""}`;
    if (sameVideo) { player.seek(cmd.t || 0); player.play(); }
    else navigate(url);
    toast(`📱 ${from || "다른 기기"}에서 보낸 영상을 재생해요`);
    // if autoplay with sound was blocked after the page change, leave it (one OK on the remote starts it)
    setTimeout(() => player.play(), 1500);
  } else if (cmd.type === "toggle") player.toggle();
  else if (cmd.type === "seek") player.seek(cmd.d || 0, true);
  else if (cmd.type === "stop") player.video.pause();
}

// ---------------------------------------------------------------- sending side
export async function castTo(v, anchor) {
  let list = [];
  try { list = (await lib("cast/devices", { quiet: true })).devices.filter((d) => d.id !== deviceId); } catch { }
  if (!list.length) {
    toast("받을 수 있는 TV가 없어요 · TV에서 홈튜브를 켜 두세요", null, null, 6000);
    return;
  }
  list.sort((a, b) => b.tv - a.tv);
  const go = async (dev) => {
    const here = player.info?.videoId === v.id;
    const t = here ? Math.floor(player.video.currentTime) : 0;
    try {
      await lib("cast/send", { method: "POST", body: { to: dev.id, from: deviceName(), cmd: { type: "play", id: v.id, t } } });
    } catch (e) { toast(e.message); return; }
    if (here) player.video.pause();
    remote(dev);
  };
  if (list.length === 1 || !anchor) return go(list[0]);
  popup(anchor, `<div class="mi" style="pointer-events:none;color:var(--fg2)">어디로 보낼까요?</div>` +
    list.map((d, i) => mi("d" + i, "tv", esc(d.name) + (d.tv ? "" : " (화면)"))).join(""), (a) => go(list[+a.slice(1)]));
}
// after sending: a toast that can pause / resume the TV
function remote(dev) {
  const send = (cmd) => lib("cast/send", { method: "POST", body: { to: dev.id, from: deviceName(), cmd } }).catch((e) => toast(e.message));
  toast(`📺 ${dev.name}에서 재생해요`, "정지 / 재생", () => { send({ type: "toggle" }); setTimeout(() => remote(dev), 300); }, 12000);
}
