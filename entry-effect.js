
/* 短冊の部屋 入室演出 */
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

  const wait = ms =>
    new Promise(resolve => setTimeout(resolve, ms));

  const rand = (min, max) =>
    Math.random() * (max - min) + min;

  function makeWindow(data, intro = false) {
    const win = document.createElement("section");
    win.className = "entry-window " +
      (intro ? "entry-intro" : "entry-error");

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

    if (intro) {
      win.setAttribute("role", "dialog");
      win.setAttribute("aria-modal", "true");

      const actions = document.createElement("div");
      actions.className = "entry-actions";

      const button = document.createElement("button");
      button.className = "entry-ok";
      button.type = "button";
      button.textContent = "OK";

      button.addEventListener("click", startChaos);
      actions.append(button);
      win.append(actions);
    }

    return win;
  }

  function addGlitch(overlay) {
    const line = document.createElement("i");
    line.className = "entry-glitch";
    line.style.top = rand(5, 95) + "%";
    line.style.left = rand(0, 78) + "%";
    line.style.width = rand(35, 190) + "px";

    overlay.append(line);
    setTimeout(() => line.remove(), 360);
  }

  function start() {
    if (document.getElementById("entry-overlay")) return;

    const overlay = document.createElement("div");
    overlay.id = "entry-overlay";
    overlay.setAttribute("aria-label", "短冊の部屋 入室画面");

    const intro = makeWindow({
      title: "INFORMATION",
      text: "こちら短冊の部屋です",
      symbol: "i"
    }, true);

    overlay.append(intro);
    document.body.append(overlay);

    let started = false;

    function onKey(event) {
      if (!started && (event.key === "Enter" || event.key === " ")) {
        event.preventDefault();
        startChaos();
      }
    }

    function onTap(event) {
      if (!started && !event.target.closest(".entry-ok")) {
        startChaos();
      }
    }

    document.addEventListener("keydown", onKey);
    overlay.addEventListener("pointerdown", onTap);

    async function startChaos() {
      if (started) return;
      started = true;

      document.removeEventListener("keydown", onKey);
      overlay.removeEventListener("pointerdown", onTap);

      intro.remove();

      // エラーウィンドウが次々に出現
      const count = window.innerWidth < 600 ? 10 : 15;
      const active = [];

      for (let i = 0; i < count; i++) {
        const data = messages[
          Math.floor(Math.random() * messages.length)
        ];

        const win = makeWindow(data);

        const width = Math.min(
          rand(220, 340),
          window.innerWidth - 18
        );

        win.style.width = width + "px";
        win.style.left = rand(
          4,
          Math.max(5, window.innerWidth - width - 4)
        ) + "px";

        win.style.top = rand(
          5,
          Math.max(6, window.innerHeight - 155)
        ) + "px";

        win.style.setProperty(
          "--entry-rot",
          rand(-4, 4).toFixed(1) + "deg"
        );

        win.style.zIndex = String(10 + i);

        overlay.append(win);
        active.push(win);

        if (i % 3 === 0) addGlitch(overlay);

        await wait(rand(65, 115));
      }

      // エラーが画面いっぱいになった状態を少し見せる
      await wait(1000);

      // 一つずつランダムに弾けて消える
      while (active.length > 0) {
        const index = Math.floor(
          Math.random() * active.length
        );

        const win = active.splice(index, 1)[0];
        win.classList.add("entry-popping");

        await wait(rand(75, 135));
        win.remove();

        if (Math.random() < 0.35) {
          addGlitch(overlay);
        }
      }

      // 入室画面を消して、元のサイトを表示
      await wait(320);
      overlay.classList.add("entry-hidden");

      await wait(500);
      overlay.remove();
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
