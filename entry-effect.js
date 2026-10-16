/* 短冊の部屋 入室演出 */


console.log("entry-effect.js 読み込み成功");

(() => {
  "use strict";

  const messages = [
    { title: "ERROR", text: "ERROR 404 :\nOEKAKI TANOSI", symbol: "×" },
    { title: "WARNING", text: "WARNING：\nDRAWING", symbol: "!" },
    { title: "SYSTEM ERROR", text: "CODE MUZUKASI", symbol: "×" },
    { title: "WARNING", text: "モチーフ探し楽しい！", symbol: "!" },
    { title: "ERROR", text: "DRAWING is not found.", symbol: "×" },
    { title: "SYSTEM FAILURE", text: "ERROR 404 : OEKAKI TANOSI", symbol: "×" },
    { title: "CONNECTION WARNING", text: "構図似ちゃうの嫌", symbol: "!" },
    { title: "INFORMATION", text: "こちら短冊の部屋です。", symbol: "i" },
    { title: "ERROR", text: "UNKNOWN USER", symbol: "×" },
    { title: "WARNING", text: "BUKI TUKURUNO SUKI", symbol: "!" },
    { title: "SYSTEM ERROR", text: "CODE MUZUKASI", symbol: "×" },
    { title: "ERROR 404", text: "SYNARIO TUKURU", symbol: "×" }
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
  const screenW = window.innerWidth;
  const screenH = window.innerHeight;

  // 画面全体を覆うように、ランダムな位置へ多めに配置
  const count = Math.max(
    45,
    Math.ceil((screenW * screenH) / 18000)
  );

  for (let i = 0; i < count; i++) {
    const data = messages[Math.floor(Math.random() * messages.length)];
    const win = makeWindow(data);

    const width = Math.min(rand(220, 310), screenW - 12);

    win.style.position = "absolute";
    win.style.width = width + "px";
    win.style.height = "auto";
    win.style.left =
      rand(-15, Math.max(-15, screenW - width + 15)) + "px";
    win.style.top =
      rand(-15, Math.max(-15, screenH - 110)) + "px";
    win.style.setProperty(
      "--entry-rot",
      rand(-8, 8).toFixed(1) + "deg"
    );
    win.style.zIndex = String(10 + i);

    overlay.append(win);
    active.push(win);

    if (i % 3 === 0) addGlitch();

    // 何個かまとめて出現させる
    if (i % 5 === 4) {
      await wait(rand(15, 35));
    }
  }

  // 画面をエラーで覆った状態を見せる
  await wait(1200);

  // 方眼を消し始め、エラーは少しずつずれて弾ける
  overlay.classList.add("entry-hidden");

  active.forEach(win => {
    win.style.animationDelay = (Math.random() * 0.28) + "s";
    win.classList.add("entry-popping");
  });

  // 消える隙間からサイトが見える
  await wait(650);

  active.forEach(win => win.remove());

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