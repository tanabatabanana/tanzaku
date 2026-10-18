/* 短冊の部屋：カーソルが通ったところに、一瞬だけドットの赤い星を出す（マウスだけ） */
(() => {
  "use strict";

  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  let lastX = -999;
  let lastY = -999;

  window.addEventListener("pointermove", (event) => {
    if (event.pointerType !== "mouse") return;
    if (Math.hypot(event.clientX - lastX, event.clientY - lastY) < 22) return;   // 一定距離ごとに1つ
    lastX = event.clientX;
    lastY = event.clientY;

    const star = document.createElement("div");
    star.className = "cursor-star";
    star.style.left = lastX + "px";
    star.style.top = lastY + "px";
    star.style.setProperty("--sz", 12 + Math.random() * 8 + "px");
    star.style.setProperty("--rot", Math.random() * 90 - 45 + "deg");
    star.addEventListener("animationend", () => star.remove());
    setTimeout(() => star.remove(), 800);   // 念のため
    document.body.append(star);
  }, { passive: true });
})();
