/* 短冊の部屋：memo.exe の文字が、1文字ずつ入力されていく */
(() => {
  "use strict";

  const TEXT = "短冊についての情報はこちらをクリック";

  const el = document.getElementById("memo-text");
  const win = document.querySelector(".memo-window");
  if (!el || !win) return;

  if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
    el.textContent = TEXT;
    return;
  }

  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const rand = (min, max) => Math.random() * (max - min) + min;

  let visible = false;
  new IntersectionObserver((entries) => { visible = entries[0].isIntersecting; }).observe(win);

  // 画面に見えていない間・タブが裏にある間は止める
  async function untilVisible() {
    while (!visible || document.hidden) await wait(300);
  }

  async function loop() {
    for (;;) {
      await untilVisible();
      for (let i = 1; i <= TEXT.length; i++) {          // 入力
        el.textContent = TEXT.slice(0, i);
        await wait(rand(70, 140));
      }
      await wait(4000);
      for (let i = TEXT.length - 1; i >= 0; i--) {       // 消す
        el.textContent = TEXT.slice(0, i);
        await wait(25);
      }
      await wait(600);
    }
  }

  loop();
})();
