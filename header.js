/* 短冊の部屋：ヘッダーのウィンドウ（ドラッグで移動 + 折りたたみ）。全ページ共通
   右上のボタン（－ □ ×）は、どれを押しても同じように縮小（もう一度押すと展開）する */
(() => {
  "use strict";

  const headerWindow = document.getElementById("header-window");
  const titlebar = document.getElementById("header-titlebar");
  const toggle = document.getElementById("header-toggle");
  if (!headerWindow || !titlebar) return;

  // --- ドラッグ（ボタンの上からは始めない） ---
  let dragging = false;
  let offsetX = 0;
  let offsetY = 0;

  titlebar.addEventListener("pointerdown", (event) => {
    if (event.target.closest(".header-window-controls")) return;
    if (event.pointerType === "mouse" && event.button !== 0) return;

    const rect = headerWindow.getBoundingClientRect();
    dragging = true;
    offsetX = event.clientX - rect.left;
    offsetY = event.clientY - rect.top;

    headerWindow.style.position = "fixed";
    headerWindow.style.left = rect.left + "px";
    headerWindow.style.top = rect.top + "px";
    headerWindow.style.right = "auto";
    headerWindow.style.bottom = "auto";

    event.preventDefault();
  });

  window.addEventListener("pointermove", (event) => {
    if (!dragging) return;

    const maxX = Math.max(0, window.innerWidth - headerWindow.offsetWidth);
    const maxY = Math.max(0, window.innerHeight - headerWindow.offsetHeight);

    headerWindow.style.left = Math.max(0, Math.min(event.clientX - offsetX, maxX)) + "px";
    headerWindow.style.top = Math.max(0, Math.min(event.clientY - offsetY, maxY)) + "px";
  });

  const stopDrag = () => { dragging = false; };
  window.addEventListener("pointerup", stopDrag);
  window.addEventListener("pointercancel", stopDrag);

  // --- 折りたたみ：3つのボタンのどれでも ---
  function toggleCollapse() {
    const collapsed = headerWindow.classList.toggle("is-collapsed");
    if (!toggle) return;
    toggle.textContent = collapsed ? "+" : "－";
    toggle.setAttribute("aria-expanded", String(!collapsed));
    toggle.setAttribute("aria-label", collapsed ? "メニューを展開する" : "メニューを折りたたむ");
  }

  headerWindow.querySelectorAll(".header-window-controls > *").forEach((control) => {
    if (control.tagName !== "BUTTON") {
      // □ と × はただの文字なので、ボタンとして使えるようにする
      control.setAttribute("role", "button");
      control.tabIndex = 0;
      control.setAttribute("aria-label", "メニューを折りたたむ／展開する");
      control.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          toggleCollapse();
        }
      });
    }
    control.addEventListener("click", toggleCollapse);
  });
})();

/* =========================================
   ブラウン管テレビ風のフィルター（全ページ共通）。このファイルだけで動く（style.css や、ほかのファイルは要らない）
   ・画面全体に、走査線・蛍光体の細かい縞・周辺の暗がり・少しのちらつき・砂嵐・ゆっくり流れる帯をかぶせる
   ・ヘッダーのタイトルバーの「CRT」ボタンで、オン・オフを切り替える（選んだ状態は、次に開いた時も続く）
========================================= */
(() => {
  "use strict";

  const KEY = "crtFilter";
  const root = document.documentElement;
  const CSS = `
.crt-overlay { position: fixed; inset: 0; z-index: 9990; display: none; pointer-events: none; animation: crt-flicker 0.14s steps(2) infinite; }
html.crt-on .crt-overlay { display: block; }

/* 走査線と、蛍光体の細かい縞（赤・緑・青） */
.crt-overlay::before {
    content: "";
    position: absolute;
    inset: 0;
    background:
        repeating-linear-gradient(0deg, rgba(0, 0, 0, 0.2) 0 1px, rgba(0, 0, 0, 0) 1px 3px),
        repeating-linear-gradient(90deg, rgba(255, 0, 0, 0.05) 0 1px, rgba(0, 255, 0, 0.05) 1px 2px, rgba(0, 0, 255, 0.05) 2px 3px);
}
/* 周辺が暗い（ブラウン管の丸み）。色は少しこく、コントラストは少し強く */
.crt-overlay::after {
    content: "";
    position: absolute;
    inset: 0;
    background: radial-gradient(ellipse at center, rgba(255, 255, 255, 0) 56%, rgba(0, 0, 25, 0.36) 100%);
    box-shadow: inset 0 0 110px rgba(0, 0, 0, 0.32);
    -webkit-backdrop-filter: contrast(1.08) saturate(1.18) brightness(1.02);
    backdrop-filter: contrast(1.08) saturate(1.18) brightness(1.02);
}
/* ゆっくり流れる、明るい帯 */
.crt-roll { position: absolute; left: 0; right: 0; top: -20%; height: 18%; background: linear-gradient(to bottom, rgba(255, 255, 255, 0), rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0)); animation: crt-roll 8s linear infinite; }
/* 細かい砂嵐 */
.crt-grain {
    position: absolute;
    inset: 0;
    opacity: 0.07;
    mix-blend-mode: overlay;
    background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E") 0 0 / 160px 160px;
    animation: crt-grain 0.6s steps(1, end) infinite;
}
@keyframes crt-roll { from { top: -20%; } to { top: 110%; } }
@keyframes crt-grain { 0% { background-position: 0 0; } 25% { background-position: -40px 25px; } 50% { background-position: 30px -35px; } 75% { background-position: -20px -45px; } }
@keyframes crt-flicker { 0% { opacity: 1; } 50% { opacity: 0.95; } 100% { opacity: 1; } }
@media (prefers-reduced-motion: reduce) { .crt-overlay, .crt-roll, .crt-grain { animation: none; } }

/* ヘッダーの「CRT」ボタン：オンの時は、色が反転する */
.header-window-controls .header-crt { width: auto; padding: 0 6px; font: bold 11px/1 "Courier New", monospace; letter-spacing: 0.04em; }
.header-window-controls .header-crt[aria-pressed="true"] { background: var(--blue); color: #fff; }
.header-window-controls .header-crt[aria-pressed="true"]:hover { background: #fff; color: var(--blue); }
`;

  function setup() {
    if (document.getElementById("crt-style")) return;               // 二重に作らない

    let on = true;                                                  // はじめは、オン
    try { on = localStorage.getItem(KEY) !== "off"; } catch (e) { /* 保存できなくても動く */ }

    const style = document.createElement("style");
    style.id = "crt-style";
    style.textContent = CSS;
    document.head.append(style);

    // 画面にかぶせる層（操作はそのまま通る）
    const overlay = document.createElement("div");
    overlay.className = "crt-overlay";
    overlay.setAttribute("aria-hidden", "true");
    overlay.innerHTML = '<i class="crt-roll"></i><i class="crt-grain"></i>';
    document.body.append(overlay);

    // ヘッダーの右上に、オン・オフのボタン（－ □ × の左）
    const controls = document.querySelector(".header-window-controls");
    let button = null;
    if (controls) {
      button = document.createElement("button");
      button.type = "button";
      button.className = "header-crt";
      button.textContent = "CRT";
      button.title = "ブラウン管フィルターのオン・オフ";
      controls.prepend(button);
      button.addEventListener("click", () => {
        on = !on;
        try { localStorage.setItem(KEY, on ? "on" : "off"); } catch (e) { /* 何もしない */ }
        apply();
      });
    }

    function apply() {
      root.classList.toggle("crt-on", on);
      if (button) {
        button.setAttribute("aria-pressed", String(on));
        button.setAttribute("aria-label", "ブラウン管フィルター：" + (on ? "オン" : "オフ"));
      }
    }
    apply();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", setup, { once: true });
  else setup();
})();

/* =========================================
   BGM（全ページ共通）。このファイルだけで動く
   ・ヘッダーのタイトルバーの「BGM」ボタン（CRT の隣）で、オン・オフを切り替える。はじめは、オフ
   ・曲は、サイトのいちばん上のフォルダの audio/bgm.mp3（下の BGM_FILE で変えられる）
     ページごとに曲を変えたい時は、そのページの <body> に data-bgm="../audio/○○.mp3" と書く
   ・オンのまま別のページへ移っても、曲が続く（場所を覚えておいて、続きから流す。つなぎ目で、ほんの少し途切れる）
   ・曲のファイルが見つからない時は、ボタンを出さない
========================================= */
(() => {
  "use strict";

  const BGM_FILE = "audio/bgm.mp3";                  // 曲のファイル（サイトのいちばん上のフォルダからの場所）
  const VOLUME = 0.4;                                // 音量（0〜1）
  const KEY = "bgm";
  const POS = "bgmPos";
  const script = document.currentScript;            // このファイルの場所（曲の場所を決める基準）。読み込みの途中でしか取れない

  function setup() {
    const controls = document.querySelector(".header-window-controls");
    if (!controls) return;

    const own = document.body.dataset.bgm;
    const src = own ? new URL(own, location.href).href : new URL(BGM_FILE, script && script.src ? script.src : location.href).href;

    let on = false;                                  // はじめは、オフ
    try { on = localStorage.getItem(KEY) === "on"; } catch (e) { /* 保存できなくても動く */ }

    const audio = new Audio();
    audio.preload = "metadata";
    audio.loop = true;
    audio.volume = 0;
    audio.src = src;

    // ヘッダーの右上に、ボタン（CRT があれば、その右隣）
    const button = document.createElement("button");
    button.type = "button";
    button.className = "header-crt header-bgm";
    button.textContent = "BGM";
    button.title = "BGMのオン・オフ";
    const crt = controls.querySelector(".header-crt");
    if (crt) crt.after(button);
    else controls.prepend(button);

    // 曲のファイルが無い・開けない時は、ボタンを出さない
    audio.addEventListener("error", () => { button.remove(); });

    // 前のページで流れていた場所から、続きを流す
    let startAt = 0;
    try {
      const saved = JSON.parse(sessionStorage.getItem(POS) || "null");
      if (saved && saved.src === src) startAt = saved.t || 0;
    } catch (e) { /* 最初から流す */ }
    audio.addEventListener("loadedmetadata", () => {
      if (startAt && audio.duration && startAt < audio.duration) audio.currentTime = startAt;
    }, { once: true });
    const savePosition = () => {
      try { sessionStorage.setItem(POS, JSON.stringify({ src, t: audio.currentTime })); } catch (e) { /* 何もしない */ }
    };
    setInterval(() => { if (!audio.paused) savePosition(); }, 1000);
    window.addEventListener("pagehide", savePosition);

    // 音量を、少しずつ変える（急に鳴ったり、止まったりしないように）
    let fadeTimer = null;
    const fade = (to, done) => {
      clearInterval(fadeTimer);
      fadeTimer = setInterval(() => {
        const diff = to - audio.volume;
        if (Math.abs(diff) <= 0.04) {
          audio.volume = to;
          clearInterval(fadeTimer);
          if (done) done();
        } else {
          audio.volume = Math.max(0, Math.min(1, audio.volume + Math.sign(diff) * 0.04));
        }
      }, 40);
    };

    const start = () => audio.play().then(() => { fade(VOLUME); return true; }).catch(() => false);
    const stop = () => fade(0, () => audio.pause());

    function apply() {
      button.setAttribute("aria-pressed", String(on));
      button.setAttribute("aria-label", "BGM：" + (on ? "オン" : "オフ"));
    }

    button.addEventListener("click", () => {
      on = !on;
      try { localStorage.setItem(KEY, on ? "on" : "off"); } catch (e) { /* 何もしない */ }
      apply();
      if (on) start();
      else stop();
    });

    // 画面を見ていない間は、止める
    document.addEventListener("visibilitychange", () => {
      if (!on) return;
      if (document.hidden) audio.pause();
      else start();
    });

    apply();

    // 前のページでオンにしていた時：すぐに流してみる。ブラウザに止められたら、最初のクリックやキー入力で流す
    if (on) {
      start().then((ok) => {
        if (ok) return;
        const onGesture = (event) => {
          if (event.target.closest && event.target.closest(".header-bgm")) return;       // ボタン自身の操作では、流さない
          ["pointerdown", "keydown"].forEach((type) => document.removeEventListener(type, onGesture));
          if (on) start();
        };
        ["pointerdown", "keydown"].forEach((type) => document.addEventListener(type, onGesture));
      });
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", setup, { once: true });
  else setup();
})();