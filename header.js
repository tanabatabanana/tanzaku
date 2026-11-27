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
.header-retro, .header-bgm { background: transparent; cursor: pointer; }
.header-retro .tv-screen { fill: #8f99ad; }
.header-retro[aria-pressed="true"] .tv-screen { fill: #61b3ff; }
.header-retro .tv-lines { display: none; }
.header-retro[aria-pressed="true"] .tv-lines { display: inline; }
.retro-state { display: inline-block; margin-left: 3px; padding: 0 4px; background: #c7cfdd; color: #3b4660; font-weight: normal; }
.header-retro[aria-pressed="true"] .retro-state, .header-bgm[aria-pressed="true"] .retro-state { background: #0047ff; color: #fff; }
.header-bgm .bgm-head { fill: #8f99ad; }
.header-bgm[aria-pressed="true"] .bgm-head { fill: #0047ff; }
.header-bgm .bgm-wave { display: none; }
.header-bgm[aria-pressed="true"] .bgm-wave { display: inline; }

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
   ・画面のいちばん上の右端にある操作部の、いちばん上の行（音符のボタン「BGM ON / OFF」と、音量のつまみ）で、オン・オフと音量を切り替える。はじめは、オフ
     （音量は、次に開いた時も続く）
   ・曲は、サイトのいちばん上のフォルダにある bgm フォルダの「Floating Above the City」（mp3・m4a・ogg・wav のどれでもよい）
     曲の名前を変えたい時は、下の BGM_FILE を書きかえる
     ページごとに曲を変えたい時は、そのページの <body> に data-bgm="../bgm/○○.mp3" と書く
   ・ホームをはじめ、どのページでも、オンにすれば流れる。オンのまま別のページへ移っても、曲が続く
     （場所を覚えておいて、続きから流す。つなぎ目で、ほんの少し途切れる）
   ・曲のファイルが見つからない時は、ボタンを出さない
========================================= */
(() => {
  "use strict";

  const BGM_FILE = "bgm/Floating Above the City";   // 曲のファイル（サイトのいちばん上のフォルダからの場所。拡張子は付けない）
  const BGM_EXTENSIONS = ["mp3", "m4a", "ogg", "wav"];   // 見つかるまで、この順に探す
  const DEFAULT_VOLUME = 40;                         // はじめの音量（0〜100）。操作部のつまみで変えられる
  const KEY = "bgm";
  const VOLUME_KEY = "bgmVolume";
  const POS = "bgmPos";
  const script = document.currentScript;            // このファイルの場所（曲の場所を決める基準）。読み込みの途中でしか取れない

  // 音符のドット絵アイコン（HOME などと同じ 16×16）。オンの時は、音符の玉が青く、まわりに音が広がる
  const NOTE_ICON = '<svg class="header-icon" viewBox="0 0 16 16" shape-rendering="crispEdges" aria-hidden="true">' +
    '<path fill="#0b1f66" d="M9 2h1v10h-1zM10 2h2v1h-2zM11 3h2v2h-2zM12 5h1v2h-1zM11 7h1v1h-1z"/>' +
    '<path class="bgm-head" d="M5 10h4v1h-4zM4 11h6v2h-6zM5 13h4v1h-4z"/>' +
    '<path class="bgm-wave" fill="#0b1f66" d="M1 5h1v4h-1zM13 9h1v4h-1z"/></svg>';

  // 右上の操作部（BGM の行と、SE の行が並ぶ）の見た目。このファイルの中だけで完結させる
  const WIDGET_CSS = `
.bgm-widget { position: fixed; top: 8px; right: 8px; z-index: 9000; display: flex; flex-direction: column; gap: 5px; padding: 5px 9px; background: #fff; border: 2px solid #064bff; box-shadow: 3px 3px 0 rgba(0, 75, 255, 0.25); color: #064bff; font: 12px/1 "Courier New", monospace; }
.audio-row { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.bgm-toggle { display: flex; align-items: center; gap: 5px; min-width: 88px; margin: 0; padding: 0; background: none; border: 0; color: inherit; font: inherit; cursor: pointer; }
.bgm-toggle svg { width: 22px; height: 22px; }
.bgm-state { display: inline-block; margin-left: 2px; padding: 2px 5px; background: #c7cfdd; color: #3b4660; font-weight: normal; }
.bgm-toggle[aria-pressed="true"] .bgm-state { background: #0047ff; color: #fff; }
.bgm-head, .se-head { fill: #8f99ad; }
.bgm-toggle[aria-pressed="true"] .bgm-head, .bgm-toggle[aria-pressed="true"] .se-head { fill: #0047ff; }
.bgm-wave, .se-wave { display: none; }
.bgm-toggle[aria-pressed="true"] .bgm-wave, .bgm-toggle[aria-pressed="true"] .se-wave { display: inline; }
.bgm-volume { -webkit-appearance: none; appearance: none; width: 88px; height: 14px; margin: 0; background: transparent; cursor: pointer; }
.bgm-volume::-webkit-slider-runnable-track { height: 6px; background: #c7cfdd; border: 1px solid #064bff; }
.bgm-volume::-webkit-slider-thumb { -webkit-appearance: none; width: 10px; height: 14px; margin-top: -5px; background: #0047ff; border: 2px solid #fff; box-shadow: 0 0 0 1px #064bff; }
.bgm-volume::-moz-range-track { height: 6px; background: #c7cfdd; border: 1px solid #064bff; }
.bgm-volume::-moz-range-thumb { width: 8px; height: 12px; background: #0047ff; border: 2px solid #fff; border-radius: 0; box-shadow: 0 0 0 1px #064bff; }
.audio-all { display: none; }
/* スマホ：音量のつまみは出さない。BGM と SE を、1つのボタンにまとめる（細い縦長の形にして、ヘッダーの右に収める） */
@media (max-width: 800px) {
    .bgm-widget { top: 14px; right: 6px; width: 46px; padding: 3px 3px 4px; box-sizing: border-box; font-size: 9px; }
    .audio-row { display: none; }
    .audio-all { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
    .bgm-label i { display: none; }
}
`;

  function setup() {
    // 曲の候補（拡張子を変えて、順に試す）。<body data-bgm="..."> があれば、それだけ
    const own = document.body.dataset.bgm;
    const base = script && script.src ? script.src : location.href;
    const candidates = own ? [new URL(own, location.href).href] : BGM_EXTENSIONS.map((ext) => new URL(BGM_FILE + "." + ext, base).href);
    const trackId = own || BGM_FILE;                 // 続きから流す時の、曲の目印

    let on = false;                                  // はじめは、オフ
    try { on = localStorage.getItem(KEY) === "on"; } catch (e) { /* 保存できなくても動く */ }

    const audio = new Audio();
    audio.preload = "metadata";
    audio.loop = true;
    audio.volume = 0;
    let tried = 0;
    audio.src = candidates[0];

    // 画面のいちばん上の右端に、操作部（音符のボタン「BGM ON / OFF」と、音量のつまみ）
    const style = document.createElement("style");
    style.id = "bgm-style";
    style.textContent = WIDGET_CSS;
    document.head.append(style);

    let volume = DEFAULT_VOLUME / 100;                                       // 音量（0〜1）
    try {
      const savedVolume = localStorage.getItem(VOLUME_KEY);
      if (savedVolume !== null && !Number.isNaN(Number(savedVolume))) volume = Math.max(0, Math.min(1, Number(savedVolume) / 100));
    } catch (e) { /* はじめの音量で */ }

    // 操作部の枠（BGM の行と、SE の行が、ここに並ぶ）。先に作った方が作り、もう一方は、それを使う
    let panel = document.getElementById("audio-panel");
    if (!panel) {
      panel = document.createElement("div");
      panel.id = "audio-panel";
      panel.className = "bgm-widget";
      panel.setAttribute("role", "group");
      panel.setAttribute("aria-label", "音の設定");
      document.body.append(panel);
    }
    const widget = document.createElement("div");                           // BGM の行
    widget.className = "audio-row bgm-row";
    const button = document.createElement("button");
    button.type = "button";
    button.className = "bgm-toggle";
    button.title = "BGMのオン・オフ";
    button.innerHTML = NOTE_ICON + '<span class="bgm-label"><i>BGM </i><b class="bgm-state">OFF</b></span>';
    const stateLabel = button.querySelector(".bgm-state");
    const slider = document.createElement("input");
    slider.type = "range";
    slider.className = "bgm-volume";
    slider.min = "0";
    slider.max = "100";
    slider.step = "1";
    slider.value = String(Math.round(volume * 100));
    slider.title = "BGMの音量";
    slider.setAttribute("aria-label", "BGMの音量");
    widget.append(button, slider);
    panel.prepend(widget);                                                  // BGM の行は、いちばん上

    // 曲のファイルが開けなかった時は、次の拡張子を試す。全部だめなら、ボタンを出さない
    let missing = false;                                                    // 曲のファイルが見つからなかった
    audio.addEventListener("error", () => {
      tried++;
      if (tried < candidates.length) audio.src = candidates[tried];
      else { missing = true; widget.remove(); }
    });

    // 前のページで流れていた場所から、続きを流す
    let startAt = 0;
    try {
      const saved = JSON.parse(sessionStorage.getItem(POS) || "null");
      if (saved && saved.track === trackId) startAt = saved.t || 0;
    } catch (e) { /* 最初から流す */ }
    audio.addEventListener("loadedmetadata", () => {
      if (startAt && audio.duration && startAt < audio.duration) audio.currentTime = startAt;
      startAt = 0;
    });
    const savePosition = () => {
      try { sessionStorage.setItem(POS, JSON.stringify({ track: trackId, t: audio.currentTime })); } catch (e) { /* 何もしない */ }
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

    const start = () => audio.play().then(() => { fade(volume); return true; }).catch(() => false);
    const stop = () => fade(0, () => audio.pause());

    function apply() {
      button.setAttribute("aria-pressed", String(on));
      button.setAttribute("aria-label", "BGM：" + (on ? "オン" : "オフ"));
      stateLabel.textContent = on ? "ON" : "OFF";
    }

    // 音量のつまみ：動かすと、すぐに音量が変わる（オフの時は、次に流す時の音量になる）
    slider.addEventListener("input", () => {
      volume = Number(slider.value) / 100;
      try { localStorage.setItem(VOLUME_KEY, String(Math.round(volume * 100))); } catch (e) { /* 何もしない */ }
      if (on && !audio.paused) {
        clearInterval(fadeTimer);
        audio.volume = volume;
      }
    });

    const setOn = (value) => {
      on = value;
      try { localStorage.setItem(KEY, on ? "on" : "off"); } catch (e) { /* 何もしない */ }
      apply();
      if (on) start();
      else stop();
    };
    button.addEventListener("click", () => setOn(!on));
    window.__bgm = { isOn: () => on, set: setOn, isMissing: () => missing };      // スマホの、BGM と SE をまとめたボタンが使う

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

/* =========================================
   効果音（全ページ共通）。このファイルだけで動く
   ・クリックすると何かが起こる所（リンク・ボタン・カード・窓の×・立ち絵など）を押すと、「PC-Mouse05-1」が鳴る
   ・キャラクターの写真（ホームの探索者の写真、キャラクターページの下のカルーセルの写真）を押すと、「se_08_page_para」が鳴る
   ・キャラクターページに入った時（どこから来ても）、「Cyber13-1」が鳴る（char-transition.js が、window.__se.play("enter") で鳴らす）
   ・音のファイルは、サイトのいちばん上のフォルダの se フォルダに入れる（mp3・wav・ogg・m4a のどれでもよい）
   ・画面のいちばん上の右端にある操作部の、2行目（スピーカーのボタン「SE ON / OFF」と、音量のつまみ）で、オン・オフと音量を切り替える。はじめは、オン（音量は、次に開いた時も続く）
   ・ファイルが見つからない音は、鳴らさない（ほかの動きは、そのまま）
========================================= */
(() => {
  "use strict";

  const SE_FOLDER = "se";                              // 効果音のフォルダ（サイトのいちばん上のフォルダからの場所）
  const EXTENSIONS = ["mp3", "wav", "ogg", "m4a"];     // 見つかるまで、この順に探す
  // weight：音量のつまみ（0〜100）に、かける割合。つまみが 50 の時の音量は、click が 0.5、photo と enter が 0.6
  const SOUNDS = {
    click: { file: "PC-Mouse05-1", weight: 1 },        // クリック
    photo: { file: "se_08_page_para", weight: 1.2 },    // キャラクターの写真を押した時
    enter: { file: "Cyber13-1", weight: 1.2 }           // キャラクターページに入った時
  };
  const ENABLED_KEY = "se";
  const LEVEL_KEY = "seVolume";
  let enabled = true;                                  // はじめは、オン
  let level = 50;                                      // はじめの音量（0〜100）。操作部のつまみで変えられる
  try {
    enabled = localStorage.getItem(ENABLED_KEY) !== "off";
    const savedLevel = localStorage.getItem(LEVEL_KEY);
    if (savedLevel !== null && !Number.isNaN(Number(savedLevel))) level = Math.max(0, Math.min(100, Number(savedLevel)));
  } catch (e) { /* はじめの設定で */ }
  const script = document.currentScript;
  const base = script && script.src ? script.src : location.href;
  const bank = {};

  // 音のファイルを、読み込んでおく。開けなかった時は、次の拡張子を試す
  function open(key) {
    const sound = SOUNDS[key];
    const entry = { tried: 0, failed: false, audio: new Audio() };
    const candidates = EXTENSIONS.map((ext) => new URL(SE_FOLDER + "/" + sound.file + "." + ext, base).href);
    entry.audio.preload = "auto";
    entry.audio.addEventListener("error", () => {
      entry.tried++;
      if (entry.tried < candidates.length) entry.audio.src = candidates[entry.tried];
      else entry.failed = true;
    });
    entry.audio.src = candidates[0];
    bank[key] = entry;
    return entry;
  }

  function play(key) {
    if (!enabled || level <= 0) return;                // オフの時・音量が 0 の時は、鳴らさない
    const entry = bank[key] || open(key);
    if (entry.failed) return;
    try {
      const node = entry.audio.cloneNode(true);       // 続けて鳴らしても、前の音を止めないように、複製して鳴らす
      node.volume = Math.min(1, (level / 100) * SOUNDS[key].weight);
      const result = node.play();
      if (result && result.catch) result.catch(() => { /* ブラウザに止められた時は、鳴らさない */ });
    } catch (e) { /* 何もしない */ }
  }
  window.__se = { play };

  // 操作部の2行目：スピーカーのボタン「SE ON / OFF」と、音量のつまみ
  const SPEAKER_ICON = '<svg class="header-icon" viewBox="0 0 16 16" shape-rendering="crispEdges" aria-hidden="true">' +
    '<path fill="#0b1f66" d="M2 6h1v4h-1zM3 5h3v1h-3zM3 10h3v1h-3zM6 4h1v1h-1zM6 11h1v1h-1zM7 3h1v1h-1zM7 12h1v1h-1zM8 3h1v10h-1z"/>' +
    '<path class="se-head" d="M3 6h3v4h-3zM6 5h2v6h-2z"/>' +
    '<path class="se-wave" fill="#0b1f66" d="M10 6h1v4h-1zM12 4h1v8h-1zM14 2h1v12h-1z"/></svg>';

  // スマホ用のボタンのアイコン（音符と、音の広がり）。オンの時は、青く、音が広がる
  const NOTE_ICON_ALL = '<svg class="header-icon" viewBox="0 0 16 16" shape-rendering="crispEdges" aria-hidden="true">' +
    '<path fill="#0b1f66" d="M9 2h1v10h-1zM10 2h2v1h-2zM11 3h2v2h-2zM12 5h1v2h-1zM11 7h1v1h-1z"/>' +
    '<path class="bgm-head" d="M5 10h4v1h-4zM4 11h6v2h-6zM5 13h4v1h-4z"/>' +
    '<path class="bgm-wave" fill="#0b1f66" d="M1 5h1v4h-1zM13 9h1v4h-1z"/></svg>';

  function setupPanel() {
    let panel = document.getElementById("audio-panel");
    if (!panel) {
      panel = document.createElement("div");
      panel.id = "audio-panel";
      panel.className = "bgm-widget";
      panel.setAttribute("role", "group");
      panel.setAttribute("aria-label", "音の設定");
      document.body.append(panel);
    }
    const row = document.createElement("div");
    row.className = "audio-row se-row";
    const button = document.createElement("button");
    button.type = "button";
    button.className = "bgm-toggle se-toggle";
    button.title = "効果音のオン・オフ";
    button.innerHTML = SPEAKER_ICON + '<span class="bgm-label"><i>SE </i><b class="bgm-state">ON</b></span>';
    const stateLabel = button.querySelector(".bgm-state");
    const slider = document.createElement("input");
    slider.type = "range";
    slider.className = "bgm-volume";
    slider.min = "0";
    slider.max = "100";
    slider.step = "1";
    slider.value = String(level);
    slider.title = "効果音の音量";
    slider.setAttribute("aria-label", "効果音の音量");
    row.append(button, slider);
    panel.append(row);                                                      // SE の行は、BGM の行の下

    const apply = () => {
      button.setAttribute("aria-pressed", String(enabled));
      button.setAttribute("aria-label", "効果音：" + (enabled ? "オン" : "オフ"));
      stateLabel.textContent = enabled ? "ON" : "OFF";
    };
    apply();

    const setEnabled = (value, preview) => {
      enabled = value;
      try { localStorage.setItem(ENABLED_KEY, enabled ? "on" : "off"); } catch (e) { /* 何もしない */ }
      apply();
      if (enabled && preview) play("click");                                // オンにした時は、鳴らして、音量を確かめられるように
    };
    button.addEventListener("click", () => setEnabled(!enabled, true));
    window.__se.isOn = () => enabled;
    window.__se.set = setEnabled;
    slider.addEventListener("input", () => {
      level = Number(slider.value);
      try { localStorage.setItem(LEVEL_KEY, String(level)); } catch (e) { /* 何もしない */ }
    });
    slider.addEventListener("change", () => play("click"));                 // つまみを離した時に、鳴らして、音量を確かめられるように

    // スマホ用：BGM と SE を、まとめて、オン・オフするボタン（パソコンでは、CSS で隠れている）。つまみは、スマホでは出さない。
    // 両方がオンなら、「ON」。押すと、両方がオフになる。そうでなければ「OFF」。押すと、両方がオンになる
    const all = document.createElement("button");
    all.type = "button";
    all.className = "bgm-toggle audio-all";
    all.title = "音（BGM・効果音）のオン・オフ";
    all.innerHTML = NOTE_ICON_ALL + '<span class="bgm-label"><b class="bgm-state">OFF</b></span>';
    const allState = all.querySelector(".bgm-state");
    const bgmIsOn = () => !window.__bgm || window.__bgm.isMissing() || window.__bgm.isOn();    // 曲が無い時は、数えない
    const refreshAll = () => {
      const both = bgmIsOn() && enabled;
      all.setAttribute("aria-pressed", String(both));
      all.setAttribute("aria-label", "音（BGM・効果音）：" + (both ? "オン" : "オフ"));
      allState.textContent = both ? "ON" : "OFF";
    };
    all.addEventListener("click", () => {
      const next = !(bgmIsOn() && enabled);
      if (window.__bgm && !window.__bgm.isMissing()) window.__bgm.set(next);
      setEnabled(next, next);
      refreshAll();
    });
    panel.append(all);
    refreshAll();
    window.addEventListener("resize", refreshAll);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", setupPanel, { once: true });
  else setupPanel();

  // 3つとも、先に読み込んでおく（はじめのクリックから、すぐ鳴らせるように）
  const preload = () => Object.keys(SOUNDS).forEach((key) => { if (!bank[key]) open(key); });
  if (document.readyState === "complete") preload();
  else window.addEventListener("load", preload, { once: true });

  // クリックを見張る（ほかの処理が、クリックを止めても、先に鳴らせるよう、いちばん先に受け取る）
  const INTERACTIVE = 'a[href], button, [role="button"], summary, select, label, .investigator-card';
  document.addEventListener("click", (event) => {
    if (!event.isTrusted) return;                     // プログラムが起こしたクリックでは、鳴らさない
    const target = event.target;
    if (!target || !target.closest) return;
    if (target.closest(".bgm-volume")) return;        // 音量のつまみは、鳴らさない

    // キャラクターの写真（押せるものだけ。準備中・今のキャラクターは、押せないので鳴らさない）
    const photo = target.closest(".investigator-card, .cc-item");
    if (photo) {
      if (!photo.classList.contains("is-soon") && !photo.classList.contains("is-current")) play("photo");
      return;
    }

    // ほかに、押すと何かが起こる所（押せる形のもの、または、カーソルが指の形になるもの）
    for (let node = target; node && node.nodeType === 1 && node !== document.body; node = node.parentElement) {
      if (node.disabled) return;
      if (node.matches(INTERACTIVE) || getComputedStyle(node).cursor === "pointer") {
        play("click");
        return;
      }
    }
  }, true);
})();
