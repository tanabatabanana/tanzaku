/* 短冊の部屋：タイトルの左右のウィンドウ
   左：いただいたファンアート … images/kaitemorota/kaki1.png, kaki2.png ... を自動で見つけてランダム表示（5秒ごと／クリックで次へ）
   右：通過したシナリオが、チャット風にランダムに連投される */
(() => {
  "use strict";

  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const rand = (min, max) => Math.random() * (max - min) + min;

  /* =========================
     左：ファンアート
     フォルダに kaki<番号>.png を入れるだけで、増えても自動で表示される（番号は1から。途中の欠番は9個まで許容）
  ========================= */
  const FA_DIR = "images/kaitemorota/";
  const FA_NAME = "kaki";
  const FA_EXT = "png";
  const FA_MAX = 300;          // 探す上限の番号
  const FA_INTERVAL = 5000;    // 自動で切り替える間隔（ミリ秒）

  const frame = document.getElementById("fa-frame");
  const img = document.getElementById("fa-img");

  async function exists(url) {
    try {
      const res = await fetch(url, { method: "HEAD" });
      return res.ok;
    } catch (e) {
      // fetch が使えない環境（ファイルを直接開いた時など）は、画像として読めるかで確かめる
      return new Promise((resolve) => {
        const probe = new Image();
        probe.onload = () => resolve(true);
        probe.onerror = () => resolve(false);
        probe.src = url;
      });
    }
  }

  async function findFiles() {
    const found = [];
    for (let start = 1; start <= FA_MAX; start += 10) {
      const numbers = Array.from({ length: 10 }, (_, i) => start + i);
      const hits = await Promise.all(
        numbers.map(async (n) => ((await exists(`${FA_DIR}${FA_NAME}${n}.${FA_EXT}`)) ? n : 0))
      );
      const ok = hits.filter(Boolean);
      found.push(...ok);
      if (!ok.length) break;   // 10個続けて無ければ、そこで終わり
    }
    return found.map((n) => `${FA_DIR}${FA_NAME}${n}.${FA_EXT}`);
  }

  async function setupFanart() {
    if (!frame || !img) return;

    const list = await findFiles();
    if (!list.length) {
      frame.disabled = true;
      return;
    }

    let current = -1;
    let timer = null;

    function show() {
      let next;
      do {
        next = Math.floor(Math.random() * list.length);
      } while (list.length > 1 && next === current);
      current = next;

      const url = list[next];
      const pre = new Image();
      pre.onload = () => {
        img.classList.remove("is-shown");
        setTimeout(() => {
          img.src = url;
          img.classList.add("is-shown");
        }, reduce ? 0 : 200);
      };
      pre.src = url;
    }

    function restart() {
      clearInterval(timer);
      timer = setInterval(() => { if (!document.hidden) show(); }, FA_INTERVAL);
    }

    frame.addEventListener("click", () => { show(); restart(); });
    show();
    restart();
  }

  /* =========================
     右：チャット
     通過したシナリオ名は INVESTIGATORS（index.html）から集める。あとで about のデータにつなぎ替えやすいよう、ここだけ見ればよい
  ========================= */
  const log = document.getElementById("chat-log");

  function scenarioNames() {
    try {
      if (typeof INVESTIGATORS !== "undefined") {
        const names = [...new Set(INVESTIGATORS.map((row) => row[3]).filter(Boolean))];
        if (names.length) return names;
      }
    } catch (e) { /* 何もしない */ }
    return ["短冊の部屋"];
  }

  function setupChat() {
    if (!log) return;

    const names = scenarioNames();
    let side = "other";
    let visible = true;

    if ("IntersectionObserver" in window) {
      new IntersectionObserver((entries) => { visible = entries[0].isIntersecting; }).observe(log);
    }

    const two = (n) => String(n).padStart(2, "0");

    function post() {
      if (document.hidden || !visible) return;
      if (Math.random() < 0.4) side = side === "me" ? "other" : "me";   // 同じ側が続くことが多い = 連投

      const msg = document.createElement("div");
      msg.className = "chat-msg" + (side === "me" ? " me" : "");

      if (side === "other") {
        const ava = document.createElement("span");
        ava.className = "chat-ava";
        ava.textContent = "短";
        msg.append(ava);
      }

      const bubble = document.createElement("div");
      bubble.className = "chat-bubble";
      bubble.textContent = names[Math.floor(Math.random() * names.length)];

      const now = new Date();
      const time = document.createElement("span");
      time.className = "chat-time";
      time.textContent = two(now.getHours()) + ":" + two(now.getMinutes());

      msg.append(bubble, time);
      log.append(msg);
      while (log.children.length > 14) log.firstChild.remove();   // 古いものは上に流れて消える
    }

    function tick() {
      post();
      // ときどき間が空き、あとは短い間隔で連続して届く
      const wait = reduce ? 4000 : Math.random() < 0.3 ? rand(2500, 4500) : rand(700, 1800);
      setTimeout(tick, wait);
    }

    setTimeout(post, 300);
    setTimeout(post, 900);
    setTimeout(tick, 1600);
  }

  setupFanart();
  setupChat();
})();
