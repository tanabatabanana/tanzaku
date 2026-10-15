/* 短冊の部屋 入室演出 */


console.log("entry-effect.js 読み込み成功");

(() => {
  "use strict";

  const messages = [
    { title: "ERROR", text: "ERROR 404 :\nOEKAKI TANOSI", symbol: "×" },
    { title: "WARNING", text: "WARNING：\nDRAWING", symbol: "!" },
    { title: "SYSTEM ERROR", text: "CODE MUZUKASI", symbol: "×" },
    { title: "WARNING", text: "あなたは誰ですか？", symbol: "!" },
    { title: "ERROR", text: "DRAWING is not found.", symbol: "×" },
    { title: "SYSTEM FAILURE", text: "ERROR 404 : OEKAKI TANOSI", symbol: "×" },
    { title: "CONNECTION WARNING", text: "接続先を確認できません", symbol: "!" },
    { title: "INFORMATION", text: "こちら短冊の部屋です。", symbol: "i" },
    { title: "ERROR", text: "UNKNOWN USER", symbol: "×" },
    { title: "WARNING", text: "SYSTEM IS CONFUSED", symbol: "!" },
    { title: "SYSTEM ERROR", text: "CODE MUZUKASI", symbol: "×" },
    { title: "ERROR 404", text: "MEMORY NOT FOUND", symbol: "×" }
  ];

  const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
  const rand = (min, max) => Math.random() * (max - min) + min;

  let started = false;
  let overlay = null;
  let intro = null;

  function makeWindow(data, isIntro = false) {
    const win = document.createElement("section");
    win.className = "entry-window " + (isIntro ? "entry-intro" : "entry-error");

    const titlebar = document.createElement("div");
    titlebar.className = "entry-titlebar";

    const title = document.createElement("span");
    title.textContent = data.title;

    const close = document.createElement("span");
    close.className = "entry-close";
    close.textContent = "×";

    titlebar.append(title, close);

    const content = document.createElement("div");
    content.className = "entry-content";

    const symbol = document.createElement("span");
    symbol.className = "entry-symbol";
    symbol.textContent = data.symbol;

    const message = document.createElement("div");
    message.className = "entry-message";
    message.textContent = data.text;

    content.append(symbol, message);
    win.append(titlebar, content);

    if (isIntro) {
      win.setAttribute("role", "dialog");
      win.setAttribute("aria-modal", "true");

      const actions = document.createElement("div");
      actions.className = "entry-actions";

      const button = document.createElement("button");
      button.className = "entry-ok";
      button.type = "button";
      button.textContent = "OK";

      actions.append(button);
      win.append(actions);
    }

    return win;
  }

  function addGlitch() {
    if (!overlay) return;

    const line = document.createElement("i");
    line.className = "entry-glitch";
    line.style.top = rand(5, 95) + "%";
    line.style.left = rand(0, 78) + "%";
    line.style.width = rand(35, 190) + "px";

    overlay.append(line);
    setTimeout(() => line.remove(), 360);
  }

  async function startChaos() {
    if (started || !overlay) return;

    started = true;
    document.removeEventListener("keydown", onKey);

    if (intro) intro.remove();

 
const count = window.innerWidth < 600 ? 18 : 32;
const active = [];

for (let i = 0; i < count; i++) {
  const data = messages[Math.floor(Math.random() * messages.length)];
  const win = makeWindow(data);

  const width = Math.min(
    rand(210, 290),
    window.innerWidth - 24
  );

  win.style.width = width + "px";
  win.style.height = rand(105, 145) + "px";
  win.style.position = "absolute";
  win.style.left = rand(0, Math.max(0, window.innerWidth - width)) + "px";
  win.style.top = rand(0, Math.max(0, window.innerHeight - 145)) + "px";
  win.style.setProperty("--entry-rot", rand(-3, 3).toFixed(1) + "deg");
  win.style.zIndex = String(10 + i);

  overlay.append(win);
  active.push(win);

  if (i % 2 === 0) addGlitch();

  await wait(rand(25, 55));
}


    await wait(1000);

    
const delays = active.map(() => Math.random() * 220);

active.forEach((win, i) => {
  win.style.animationDelay = delays[i] + "ms";
  win.classList.add("entry-popping");
});

await wait(600);

active.forEach(win => win.remove());

if (Math.random() < 0.35) addGlitch();


    await wait(320);
    overlay.classList.add("entry-hidden");

    await wait(500);
    overlay.remove();
    overlay = null;
  }

  function onKey(event) {
    if (!started && (event.key === "Enter" || event.key === " ")) {
      event.preventDefault();
      startChaos();
    }
  }

  function start() {
    if (document.getElementById("entry-overlay")) return;

    overlay = document.createElement("div");
    overlay.id = "entry-overlay";
    overlay.setAttribute("aria-label", "短冊の部屋 入室画面");

    intro = makeWindow({
      title: "INFORMATION",
      text: "こちら短冊の部屋です",
      symbol: "i"
    }, true);

    overlay.append(intro);
    document.body.append(overlay);

    const okButton = intro.querySelector(".entry-ok");
    okButton.addEventListener("click", startChaos);

    document.addEventListener("keydown", onKey);

    overlay.addEventListener("pointerdown", event => {
      if (!started && !event.target.closest(".entry-ok")) {
        startChaos();
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();