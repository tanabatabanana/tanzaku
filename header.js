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
   ・ヘッダーのメニュー（HOME などのアイコンの並び）の「RETRO ON / OFF」ボタンで、オン・オフを切り替える（選んだ状態は、次に開いた時も続く）
========================================= */
(() => {
  "use strict";

  const KEY = "crtFilter";
  // テレビのドット絵アイコン（HOME などと同じ 16×16）。オンの時は、画面が明るく、走査線が出る
  const TV_ICON = '<svg class="header-icon" viewBox="0 0 16 16" shape-rendering="crispEdges" aria-hidden="true">' +
    '<path fill="#0b1f66" d="M5 0h1v1h-1zM10 0h1v1h-1zM6 1h1v1h-1zM9 1h1v1h-1zM7 2h2v1h-2zM1 3h14v1h-14zM1 4h1v9h-1zM14 4h1v9h-1zM1 13h14v1h-14zM3 14h2v1h-2zM11 14h2v1h-2z"/>' +
    '<path fill="#0047ff" d="M2 4h12v9h-12z"/>' +
    '<path fill="#0b1f66" d="M3 5h8v1h-8zM3 6h1v5h-1zM10 6h1v5h-1zM3 11h8v1h-8z"/>' +
    '<path class="tv-screen" d="M4 6h6v5h-6z"/>' +
    '<path class="tv-lines" fill="#ffffff" opacity=".55" d="M4 7h6v1h-6zM4 9h6v1h-6z"/>' +
    '<path fill="#ffe600" d="M12 6h1v1h-1z"/>' +
    '<path fill="#ffffff" d="M12 8h1v1h-1zM12 10h1v1h-1z"/></svg>';
  const root = document.documentElement;
  const CSS = `
.crt-overlay { position: fixed; inset: 0; z-index: 2147483000; display: none; pointer-events: none; animation: crt-flicker 0.14s steps(2) infinite; }
html.crt-on .crt-overlay { display: block; }

/* 走査線と、蛍光体の細かい縞（赤・緑・青） */
.crt-overlay::before {
    content: "";
    position: absolute;
    inset: 0;
    background:
        repeating-linear-gradient(0deg, rgba(0, 0, 0, 0.14) 0 1px, rgba(0, 0, 0, 0) 1px 3px),
        repeating-linear-gradient(90deg, rgba(255, 0, 0, 0.04) 0 1px, rgba(0, 255, 0, 0.04) 1px 2px, rgba(0, 0, 255, 0.04) 2px 3px);
    /* 走査線と縞は、中央では、よく見るとわかるくらいに薄く、端に向かって濃くなる */
    -webkit-mask-image: radial-gradient(ellipse at center, rgba(0, 0, 0, 0.22) 0%, rgba(0, 0, 0, 0.22) 38%, #000 100%);
    mask-image: radial-gradient(ellipse at center, rgba(0, 0, 0, 0.22) 0%, rgba(0, 0, 0, 0.22) 38%, #000 100%);
}
/* 周辺が暗い（ブラウン管の丸み）。色は少しこく、コントラストは少し強く */
.crt-overlay::after {
    content: "";
    position: absolute;
    inset: 0;
    background: radial-gradient(ellipse at center, rgba(255, 255, 255, 0) 74%, rgba(0, 0, 25, 0.34) 100%);
    box-shadow: inset 0 0 90px rgba(0, 0, 0, 0.24);
    -webkit-backdrop-filter: contrast(1) saturate(1.04) brightness(1.13);
    backdrop-filter: contrast(1) saturate(1.04) brightness(1.13);
}
/* ゆっくり流れる、明るい帯 */
.crt-roll { position: absolute; left: 0; right: 0; top: -20%; height: 18%; background: linear-gradient(to bottom, rgba(255, 255, 255, 0), rgba(255, 255, 255, 0.025), rgba(255, 255, 255, 0)); animation: crt-roll 8s linear infinite; }
/* 細かい砂嵐 */
.crt-grain {
    position: absolute;
    inset: 0;
    opacity: 0.025;
    mix-blend-mode: overlay;
    background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E") 0 0 / 160px 160px;
    animation: crt-grain 0.6s steps(1, end) infinite;
}
@keyframes crt-roll { from { top: -20%; } to { top: 110%; } }
@keyframes crt-grain { 0% { background-position: 0 0; } 25% { background-position: -40px 25px; } 50% { background-position: 30px -35px; } 75% { background-position: -20px -45px; } }
@keyframes crt-flicker { 0% { opacity: 1; } 50% { opacity: 0.97; } 100% { opacity: 1; } }
@media (prefers-reduced-motion: reduce) { .crt-overlay, .crt-roll, .crt-grain { animation: none; } }

/* ヘッダーのメニューの「RETRO」ボタン（HOME などのアイコンと同じ並び）。ON・OFF が、色と文字と、テレビの画面でわかる */
.header-retro { background: transparent; cursor: pointer; }
.header-retro .tv-screen { fill: #8f99ad; }
.header-retro[aria-pressed="true"] .tv-screen { fill: #61b3ff; }
.header-retro .tv-lines { display: none; }
.header-retro[aria-pressed="true"] .tv-lines { display: inline; }
.retro-state { display: inline-block; margin-left: 3px; padding: 0 4px; background: #c7cfdd; color: #3b4660; font-weight: normal; }
.header-retro[aria-pressed="true"] .retro-state { background: #0047ff; color: #fff; }

/* スマホ：ちかちかしないよう、動きをすべて止める（ちらつき・流れる帯・砂嵐）。走査線は、もっと薄く */
@media (max-width: 900px), (pointer: coarse) {
    .crt-overlay { animation: none; }
    .crt-roll, .crt-grain { display: none; }
    .crt-overlay::before { opacity: 0.55; }
    .crt-overlay::after { -webkit-backdrop-filter: none; backdrop-filter: none; }
    .retro-state { margin-left: 1px; padding: 0 2px; }
}
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

    // ヘッダーのメニュー（HOME などのアイコンの並び）に、「RETRO  ON / OFF」のボタン。テレビのアイコン付き
    const menu = document.querySelector(".header-menu");
    let button = null;
    let stateLabel = null;
    if (menu) {
      button = document.createElement("button");
      button.type = "button";
      button.className = "header-item header-retro";
      button.title = "ブラウン管フィルターのオン・オフ";
      button.innerHTML = TV_ICON + '<span>RETRO <b class="retro-state">ON</b></span>';
      stateLabel = button.querySelector(".retro-state");
      menu.append(button);
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
        stateLabel.textContent = on ? "ON" : "OFF";
      }
    }
    apply();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", setup, { once: true });
  else setup();
})();

/* =========================================
   BGM（全ページ共通）。このファイルだけで動く
   ・ヘッダーのタイトルバー（－ □ × の左）の「BGM」ボタンで、オン・オフを切り替える。はじめは、オフ
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