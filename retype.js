/* 短冊の部屋：カーソルを合わせると、文字が一瞬「入力しなおされる」演出
   対象：ヘッダーのメニュー、GALLERY・ABOUT のウィンドウの題名 */
(() => {
  "use strict";

  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const TARGETS = [
    { host: ".header-item", text: "span" },
    { host: ".water-gallery", text: ".water-title" },
    { host: ".water-about", text: ".water-title" }
  ];

  TARGETS.forEach(({ host, text }) => {
    document.querySelectorAll(host).forEach((link) => {
      const el = link.querySelector(text);
      if (!el) return;

      const original = el.textContent.trim();
      let timer = null;

      function run() {
        if (timer) return;                                  // 入力中はやり直さない

        el.style.minWidth = el.offsetWidth + "px";          // 幅が揺れないように固定
        el.style.textAlign = "left";

        const stepTime = Math.max(35, Math.min(70, 420 / original.length));
        let i = 0;
        el.textContent = "_";

        timer = setInterval(() => {
          i++;
          if (i > original.length) {
            clearInterval(timer);
            timer = null;
            el.textContent = original;
            el.style.minWidth = "";
            el.style.textAlign = "";
            return;
          }
          el.textContent = original.slice(0, i) + (i < original.length ? "_" : "");
        }, stepTime);
      }

      link.addEventListener("pointerenter", run);
      link.addEventListener("focus", run);
    });
  });
})();
