/* 短冊の部屋：タイトルまわりにランダムにポップする窓（エラー風の飾り）
   見た目は entry-effect.css の .entry-window / .entry-error を流用。入室演出が終わってから動き出す。 */
(() => {
  "use strict";

  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const MESSAGES = [
    { title: "ERROR", text: "ERROR 404 :\nOEKAKI TANOSI", symbol: "×" },
    { title: "WARNING", text: "WARNING：\nDRAWING", symbol: "!" },
    { title: "SYSTEM ERROR", text: "CODE MUZUKASI", symbol: "×" },
    { title: "WARNING", text: "モチーフ探し楽しい！", symbol: "!" },
    { title: "ERROR", text: "DRAWING is not found.", symbol: "×" },
    { title: "CONNECTION WARNING", text: "構図似ちゃうの嫌", symbol: "!" },
    { title: "INFORMATION", text: "こちら短冊の部屋です。", symbol: "i" },
    { title: "ERROR", text: "UNKNOWN USER", symbol: "×" },
    { title: "WARNING", text: "BUKI TUKURUNO SUKI", symbol: "!" },
    { title: "ERROR 404", text: "SYNARIO TUKURU", symbol: "×" }
  ];

  const MAX_AT_ONCE = 4;
  let active = 0;

  const rand = (min, max) => Math.random() * (max - min) + min;

  function makeWindow(data) {
    const win = document.createElement("section");
    win.className = "entry-window entry-error title-popup";
    win.setAttribute("aria-hidden", "true");

    const bar = document.createElement("div");
    bar.className = "entry-titlebar";
    const title = document.createElement("span");
    title.textContent = data.title;
    const close = document.createElement("span");
    close.className = "entry-close";
    close.textContent = "×";
    bar.append(title, close);

    const content = document.createElement("div");
    content.className = "entry-content";
    const symbol = document.createElement("span");
    symbol.className = "entry-symbol";
    symbol.textContent = data.symbol;
    const message = document.createElement("div");
    message.className = "entry-message";
    message.textContent = data.text;
    content.append(symbol, message);

    win.append(bar, content);
    return win;
  }

  function spawn() {
    const area = document.querySelector(".main-window");
    if (!area || document.hidden || active >= MAX_AT_ONCE) return;

    const r = area.getBoundingClientRect();
    if (r.bottom < 0 || r.top > window.innerHeight) return;   // 画面に見えていない時は出さない

    const vw = document.documentElement.clientWidth;
    const w = Math.min(rand(190, 250), vw * 0.6);

    const win = makeWindow(MESSAGES[Math.floor(Math.random() * MESSAGES.length)]);
    win.style.width = w + "px";
    win.style.setProperty("--entry-rot", rand(-4, 4) + "deg");

    // タイトルの窓の少し外側〜内側のどこかにランダムに置く
    let x = rand(r.left - 120, r.right - w + 120);
    x = Math.max(6, Math.min(x, vw - w - 6));
    const y = Math.max(4, rand(r.top - 60, r.bottom - 100) + window.scrollY);

    win.style.left = x + window.scrollX + "px";
    win.style.top = y + "px";

    document.body.append(win);
    active++;

    setTimeout(() => {
      win.classList.add("entry-popping");
      setTimeout(() => { win.remove(); active--; }, 300);
    }, rand(2200, 4200));
  }

  function loop() {
    spawn();
    setTimeout(loop, rand(900, 2200));
  }

  // 入室演出（#entry-overlay）が消えてから始める
  function waitForEntry() {
    if (document.getElementById("entry-overlay")) {
      setTimeout(waitForEntry, 300);
      return;
    }
    loop();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => setTimeout(waitForEntry, 0));
  } else {
    waitForEntry();
  }
})();
