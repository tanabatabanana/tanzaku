/* 短冊の部屋：探索者のページへの移動演出（ホーム ⇄ キャラクターページ）
   ホームで探索者の写真を押す → 写真が浮かび上がる → 波が下から押し寄せて、写真以外を飲み込む → 移動
   キャラクターページに着く → 波が引いていく → 写真が履歴書の写真のところに飛んで、貼られる
   演出で何かが失敗しても、必ず移動するようにしてある。移動先のページがまだ無い時は、演出を元に戻して知らせる。 */
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
    let d = "M0 45 q75 -28 150 0";                 // なだらかな波（高さ±14、波1つの長さ300）
    for (let i = 0; i < 15; i++) d += " t150 0";
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

  async function pageExists(url) {
    try {
      return (await fetch(url, { method: "HEAD" })).ok;
    } catch (e) {
      return true;           // 確かめられない時（ファイルを直接開いた時など）は、そのまま移動する
    }
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
      const src = photo.currentSrc || photo.src;
      const exists = pageExists(url.href);
      let fly = null;
      let curtain = null;

      // 演出のどこかで失敗しても移動できるよう、移動の予約を先にしておく
      setTimeout(async () => {
        if (await exists) {
          try {
            sessionStorage.setItem(KEY, JSON.stringify({ src, left: rect.left, top: rect.top, width: rect.width, height: rect.height }));
          } catch (e) { /* 保存できなくても移動する */ }
          location.href = url.href;
          return;
        }

        // 移動先のページがまだ無い時：演出を元に戻して知らせる
        try {
          if (curtain) curtain.animate([{ transform: COVER }, { transform: HIDDEN }], { duration: 900, easing: "ease-in-out", fill: "forwards" }).finished.then(() => curtain.remove());
          if (fly) fly.remove();
          card.style.visibility = "";
          const notice = document.createElement("div");
          notice.className = "char-notice";
          notice.textContent = "このキャラクターのページは、まだありません";
          notice.style.left = Math.max(8, Math.min(rect.left, window.innerWidth - 240)) + "px";
          notice.style.top = Math.max(8, rect.top + rect.height / 2) + "px";
          document.body.append(notice);
          setTimeout(() => notice.remove(), 2600);
        } catch (e) { console.warn(e); }
        leaving = false;
      }, 1900);                              // 波が上がりきって、少し待ってから移動する

      try {
        fly = makeFly(src, rect);
        document.body.append(fly);
        card.style.visibility = "hidden";

        // 写真が浮かび上がる
        fly.animate([{ transform: "none" }, { transform: LIFT }], { duration: 650, easing: "cubic-bezier(0.2, 0.9, 0.3, 1.2)", fill: "forwards" });

        // 波が下から押し寄せて、写真以外を飲み込む
        curtain = makeCurtain();
        document.body.append(curtain);
        setTimeout(() => {
          try {
            curtain.animate([{ transform: HIDDEN }, { transform: COVER }], { duration: 1500, easing: "cubic-bezier(0.45, 0, 0.3, 1)", fill: "forwards" });
          } catch (e) { console.warn(e); }
        }, 200);
      } catch (e) {
        console.warn(e);
      }
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

    try {
      // 画像・フォント・データが読み込まれるまで待つ（長くても3秒）
      if (document.readyState !== "complete") {
        await Promise.race([new Promise((resolve) => window.addEventListener("load", resolve, { once: true })), wait(3000)]);
      }
      if (document.fonts && document.fonts.ready) await Promise.race([document.fonts.ready, wait(1500)]);
      await wait(500);

      // 波が引いていく
      curtain.animate([{ transform: COVER }, { transform: HIDDEN }], { duration: 1700, easing: "cubic-bezier(0.45, 0, 0.3, 1)", fill: "forwards" })
        .finished.then(() => curtain.remove());

      // 写真が、履歴書の写真のところに飛んでいって貼られる
      await wait(300);
      const target = document.getElementById("resume-photo");
      if (target) {
        const t = target.getBoundingClientRect();
        fly.classList.add("to-white");
        await fly.animate(
          [
            { left: data.left + "px", top: data.top + "px", width: data.width + "px", height: data.height + "px", transform: LIFT },
            { left: t.left + "px", top: t.top + "px", width: t.width + "px", height: t.height + "px", transform: "none" }
          ],
          { duration: 1100, easing: "cubic-bezier(0.4, 0, 0.2, 1)", fill: "forwards" }
        ).finished;
      }
    } catch (e) {
      console.warn(e);
    } finally {
      // 何があっても、波も写真の控えも消して、写真は貼った状態にする
      const target = document.getElementById("resume-photo");
      if (target) target.classList.add("is-pasted");
      fly.remove();
      curtain.remove();
      root.classList.remove("arriving");
      window.__charFlying = false;
    }
  }

  if (isChar) arrive();
  else depart();
})();
