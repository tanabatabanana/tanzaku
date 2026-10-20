/* 短冊の部屋：探索者のページへの移動演出（ホーム ⇄ キャラクターページ）
   ホームで探索者の写真を押す → 写真が浮かび上がる → 波が下から押し寄せて、写真以外を飲み込む → 移動
   キャラクターページに着く → 波が引いていく → 写真が履歴書の写真のところに飛んで、貼られる */
(() => {
  "use strict";

  const KEY = "charFly";
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const LIFT = "translateY(-28px) scale(1.14) rotate(-3deg)";          // 浮かび上がった時の写真
  const HIDDEN = "translateY(calc(100% + 60px))";                       // 波が画面の下にいる時
  const COVER = "translateY(0)";                                        // 波が画面をおおった時
  const isChar = document.body.classList.contains("page-char");

  // 波のカーテン（上のふちが波打っている）
  function makeCurtain() {
    let d = "M0 45 q37.5 -45 75 0";
    for (let i = 0; i < 31; i++) d += " t75 0";
    d += " V90 H0 Z";

    const curtain = document.createElement("div");
    curtain.className = "wave-curtain";
    curtain.setAttribute("aria-hidden", "true");
    curtain.innerHTML =
      '<svg class="wave-edge" viewBox="0 0 2400 90" preserveAspectRatio="none"><path d="' + d + '"/></svg>' +
      '<div class="wave-body"></div>';
    curtain.style.transform = HIDDEN;
    return curtain;
  }

  // 飛んでいく写真（探索者一覧のカードと同じ、白い枠つき）
  function makeFly(src, rect) {
    const fly = document.createElement("div");
    fly.className = "fly-photo";
    fly.style.left = rect.left + "px";
    fly.style.top = rect.top + "px";
    fly.style.width = rect.width + "px";
    fly.style.height = rect.height + "px";

    const inner = document.createElement("div");
    inner.className = "fly-inner";
    const img = new Image();
    img.src = src;
    img.alt = "";
    inner.append(img);
    fly.append(inner);
    return fly;
  }

  /* =========================
     ホーム側：写真を押した時
  ========================= */
  function depart() {
    if (reduce) return;
    let leaving = false;
    let card = null;

    document.addEventListener("click", (event) => {
      if (leaving || event.defaultPrevented) return;
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      card = event.target.closest(".investigator-card");
      if (!card) return;

      const url = new URL(card.href, location.href);
      const photo = card.querySelector(".photo-normal");
      if (url.origin !== location.origin || !photo) return;

      event.preventDefault();
      leaving = true;

      const rect = card.getBoundingClientRect();
      const fly = makeFly(photo.currentSrc || photo.src, rect);
      document.body.append(fly);
      card.style.visibility = "hidden";

      // 写真が浮かび上がる
      fly.animate([{ transform: "none" }, { transform: LIFT }], { duration: 450, easing: "cubic-bezier(0.2, 0.9, 0.3, 1.2)", fill: "forwards" });

      // 波が下から押し寄せて、写真以外を飲み込む
      const curtain = makeCurtain();
      document.body.append(curtain);
      setTimeout(() => {
        curtain.animate([{ transform: HIDDEN }, { transform: COVER }], { duration: 1000, easing: "cubic-bezier(0.5, 0, 0.25, 1)", fill: "forwards" });
      }, 200);

      setTimeout(() => {
        try {
          sessionStorage.setItem(KEY, JSON.stringify({ src: photo.currentSrc || photo.src, left: rect.left, top: rect.top, width: rect.width, height: rect.height }));
        } catch (e) { /* 保存できなくても、そのまま移動する */ }
        location.href = url.href;
      }, 1300);
    });

    // 「戻る」で戻ってきた時に、波や写真が残らないようにする
    window.addEventListener("pageshow", (event) => {
      if (!event.persisted) return;
      leaving = false;
      document.querySelectorAll(".wave-curtain, .fly-photo").forEach((node) => node.remove());
      if (card) card.style.visibility = "";
    });
  }

  /* =========================
     キャラクターページ側：着いた時
  ========================= */
  async function arrive() {
    const root = document.documentElement;
    let data = null;
    try {
      data = JSON.parse(sessionStorage.getItem(KEY) || "null");
      sessionStorage.removeItem(KEY);
    } catch (e) { /* 何もしない */ }

    if (!data || reduce) {
      root.classList.remove("arriving");
      return;
    }

    window.__charFlying = true;      // character.js が、写真を最初から貼らないための目印
    try { history.scrollRestoration = "manual"; } catch (e) { /* 何もしない */ }
    window.scrollTo(0, 0);

    // 波が画面をおおった状態から始める
    const curtain = makeCurtain();
    curtain.style.transform = COVER;
    document.body.append(curtain);
    const fly = makeFly(data.src, data);
    fly.style.transform = LIFT;
    document.body.append(fly);
    root.classList.remove("arriving");

    // 画像・フォント・データが読み込まれるまで待つ
    if (document.readyState !== "complete") {
      await new Promise((resolve) => window.addEventListener("load", resolve, { once: true }));
    }
    if (document.fonts && document.fonts.ready) await document.fonts.ready;
    await wait(500);

    // 波が引いていく
    curtain.animate([{ transform: COVER }, { transform: HIDDEN }], { duration: 1100, easing: "cubic-bezier(0.5, 0, 0.25, 1)", fill: "forwards" })
      .finished.then(() => curtain.remove());

    // 写真が、履歴書の写真のところに飛んでいって貼られる
    await wait(300);
    const target = document.getElementById("resume-photo");
    if (!target) {
      fly.remove();
      return;
    }
    const t = target.getBoundingClientRect();
    await fly.animate(
      [
        { left: data.left + "px", top: data.top + "px", width: data.width + "px", height: data.height + "px", transform: LIFT },
        { left: t.left + "px", top: t.top + "px", width: t.width + "px", height: t.height + "px", transform: "none" }
      ],
      { duration: 800, easing: "cubic-bezier(0.4, 0, 0.2, 1)", fill: "forwards" }
    ).finished;

    target.classList.add("is-pasted");
    fly.remove();
    window.__charFlying = false;
  }

  if (isChar) arrive();
  else depart();
})();
