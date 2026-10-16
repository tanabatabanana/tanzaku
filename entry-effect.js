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

 

const active = [];

const cellWidth = 220;
const cellHeight = 115;
const cols = Math.ceil(window.innerWidth / cellWidth) + 1;
const rows = Math.ceil(window.innerHeight / cellHeight) + 1;

const positions = [];

for (let row = 0; row < rows; row++) {
  for (let col = 0; col < cols; col++) {
    positions.push({
      x: col * cellWidth - 30 + rand(-25, 25),
      y: row * cellHeight - 15 + rand(-20, 20)
    });
  }
}

// 出現する順番をランダムにする
positions.sort(() => Math.random() - 0.5);

for (let i = 0; i < positions.length; i++) {
  const data = messages[Math.floor(Math.random() * messages.length)];
  const win = makeWindow(data);
  const width = Math.min(250, window.innerWidth - 12);

  win.style.position = "absolute";
  win.style.width = width + "px";
  win.style.height = "auto";
  win.style.left = positions[i].x + "px";
  win.style.top = positions[i].y + "px";
  win.style.setProperty("--entry-rot", rand(-3, 3).toFixed(1) + "deg");
  win.style.zIndex = String(10 + i);

  overlay.append(win);
  active.push(win);

  if (i % 3 === 0) addGlitch();

  await wait(rand(20, 40));
}



    // エラーで画面を覆った状態を少し見せる
    await wait(1200);

    
    // 先に水色の方眼をフェードアウト
    overlay.classList.add("entry-hidden");

    // 方眼が消える間に、エラーを少しずつ弾けさせる
    active.forEach((win) => {
      win.style.animationDelay = (Math.random() * 0.28) + "s";
      win.classList.add("entry-popping");
    });

    // エラーが消えたものから、サイトが隙間越しに見える
    await wait(650);

    active.forEach(win => win.remove());

    overlay.remove();
    overlay = null;


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