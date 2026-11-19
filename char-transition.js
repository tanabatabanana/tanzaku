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
     キャラクターからキャラクターへの移動（カルーセルの写真を押した時）
     ・押した写真が浮かび上がる → 移動先で、履歴書の写真のところに飛んで貼られる
     ・ウィンドウ群が上へ上がっていき、移動先では、下から次のウィンドウ群が出てくる（character.js のスライド）
     ・立ち絵は、テレビの電源が切れるように「ブチッ」と消え、次の立ち絵は、ブラウン管のノイズとともに映る
     ・名前は、ノイズとともに文字化けして、わけの分からない文字列になってから、次の名前に変わる
  ========================= */
  const GLYPHS = "ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄ0123456789ABCDEF#%&@<>/\\|=+*縺繧譁蟄励";
  const randomChar = () => GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
  const randomText = (n) => Array.from({ length: n }, randomChar).join("");

  // 電源が切れるように、横に広がった線になって、点になって、消える
  function crtOff(el) {
    if (!el) return;
    el.animate([
      { transform: "scale(1, 1)", filter: "brightness(1)", opacity: 1, offset: 0 },
      { transform: "scale(1.04, 0.012)", filter: "brightness(5) contrast(1.4)", opacity: 1, offset: 0.4 },
      { transform: "scale(0.012, 0.012)", filter: "brightness(8)", opacity: 1, offset: 0.75 },
      { transform: "scale(0, 0)", filter: "brightness(8)", opacity: 0, offset: 1 }
    ], { duration: 520, easing: "cubic-bezier(0.7, 0, 1, 0.6)", fill: "forwards" });
  }

  // 電源が入るように、点 → 線 → 画面と広がる。ちらつきながら、映る
  function crtOn(el) {
    if (!el) return;
    const anim = el.animate([
      { transform: "scale(0, 0)", filter: "brightness(8)", opacity: 0, offset: 0 },
      { transform: "scale(0.012, 0.012)", filter: "brightness(8)", opacity: 1, offset: 0.12 },
      { transform: "scale(1.04, 0.012)", filter: "brightness(5) contrast(1.4)", opacity: 1, offset: 0.3 },
      { transform: "scale(1.02, 1.05)", filter: "brightness(2)", opacity: 1, offset: 0.55 },
      { transform: "scale(1, 1)", filter: "brightness(1.4)", opacity: 1, offset: 0.68 },
      { transform: "scale(1, 1)", filter: "brightness(1.15)", opacity: 1, offset: 0.8 },
      { transform: "scale(1, 1)", filter: "brightness(1)", opacity: 1, offset: 1 }
    ], { duration: 950, easing: "linear", fill: "both" });
    // 映ったあとは、演出の状態を残さない（立ち絵をタップした時の、ぽよんと跳ねる動きなどが、きちんと動くように）
    anim.finished.then(() => anim.cancel()).catch(() => { /* 何もしない */ });
  }

  // ブラウン管のノイズ（立ち絵のまわりに、砂嵐をかぶせる）
  function crtNoise(host) {
    if (!host) return;
    const noise = document.createElement("div");
    noise.className = "crt-noise";
    noise.setAttribute("aria-hidden", "true");
    host.append(noise);
    setTimeout(() => noise.remove(), 1100);
  }

  // 名前：文字化けして、わけの分からない文字列になる
  function garble(el) {
    if (!el) return;
    const length = [...el.textContent].length;
    el.classList.add("is-glitch");
    setInterval(() => { el.textContent = randomText(length); }, 55);
  }

  // 名前：わけの分からない文字列から、1文字ずつ、本当の名前に変わっていく
  function decode(el, finalText, hold, resolveMs) {
    if (!el) return Promise.resolve();
    const chars = [...finalText];
    const start = performance.now();
    el.classList.add("is-glitch");
    return new Promise((resolve) => {
      const timer = setInterval(() => {
        const elapsed = performance.now() - start;
        const done = elapsed < hold ? 0 : Math.min(chars.length, Math.floor(((elapsed - hold) / resolveMs) * chars.length) + 1);
        el.textContent = chars.map((c, i) => (i < done ? c : randomChar())).join("");
        if (done >= chars.length) {
          clearInterval(timer);
          el.textContent = finalText;
          el.classList.remove("is-glitch");
          resolve();
        }
      }, 55);
    });
  }

  // カルーセルの写真を押した時（キャラクターのページ）
  function departChar() {
    if (reduce) return;
    let leaving = false;

    document.addEventListener("click", (event) => {
      if (leaving || event.defaultPrevented) return;
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const item = event.target.closest(".cc-item");
      if (!item || !item.href) return;                                // 準備中・今のキャラクターは、押せない
      const url = new URL(item.href, location.href);
      const card = item.querySelector(".cc-card");
      const photo = item.querySelector("img");
      if (url.origin !== location.origin || !card || !photo) return;

      event.preventDefault();
      leaving = true;

      const rect = card.getBoundingClientRect();
      const src = photo.currentSrc || photo.src;

      // 演出のどこかで失敗しても移動できるよう、移動の予約を先にしておく
      setTimeout(() => {
        try {
          sessionStorage.setItem(KEY, JSON.stringify({ mode: "char", src, left: rect.left, top: rect.top, width: rect.width, height: rect.height }));
        } catch (e) { /* 保存できなくても移動する */ }
        location.href = url.href;
      }, 1100);

      try {
        // 押した写真が、浮かび上がる
        const fly = makeFly(src, rect);
        document.body.append(fly);
        card.style.visibility = "hidden";
        fly.animate([{ transform: "none" }, { transform: LIFT }], { duration: 450, easing: "cubic-bezier(0.2, 0.9, 0.3, 1.2)", fill: "forwards" });

        // ウィンドウ群が、上へ上がっていく
        document.querySelectorAll(".char-win").forEach((win, i) => {
          win.animate([{ translate: "0 0" }, { translate: "0 -130vh" }], { duration: 750, delay: i * 40, easing: "cubic-bezier(0.5, 0, 0.9, 0.4)", fill: "forwards" });
        });
        const back = document.getElementById("back-windows");
        if (back) back.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 500, fill: "forwards" });

        // 立ち絵：テレビの電源が切れるように消える。名前：文字化けする
        crtOff(document.getElementById("tachie"));
        garble(document.getElementById("stage-name"));
      } catch (e) {
        console.warn(e);
      }
    });

    // 「戻る」で戻ってきた時に、演出の途中の状態が残らないよう、読み込みなおす
    window.addEventListener("pageshow", (event) => { if (event.persisted && leaving) location.reload(); });
  }

  // キャラクターのページに着いた時（カルーセルから来た時）
  async function arriveChar(data) {
    const root = document.documentElement;
    window.__charFlying = true;                                       // character.js が、写真を最初から貼らないための目印
    try { history.scrollRestoration = "manual"; } catch (e) { /* 何もしない */ }
    window.scrollTo(0, 0);

    // カルーセルで押した写真が、浮かんだまま、そこにある
    const fly = makeFly(data.src, data);
    fly.style.transform = LIFT;
    document.body.append(fly);
    const nameEl = document.getElementById("stage-name");

    try {
      if (document.readyState !== "complete") {
        await Promise.race([new Promise((resolve) => window.addEventListener("load", resolve, { once: true })), wait(3000)]);
      }
      if (document.fonts && document.fonts.ready) await Promise.race([document.fonts.ready, wait(1500)]);
      await wait(350);                                                // この間に、ウィンドウ群が、下からスライドして出てくる

      // 立ち絵：電源が入るように映る（ノイズは入れない）。名前：文字化けから、本当の名前へ
      const finalName = nameEl ? nameEl.textContent : "";
      root.classList.remove("char-in", "arriving");
      crtOn(document.getElementById("tachie"));
      const decoding = decode(nameEl, finalName, 650, 550);
      await wait(800);

      // 写真が、履歴書の写真のところに飛んでいって貼られる
      const target = document.getElementById("resume-photo");
      if (target) {
        const t = target.getBoundingClientRect();
        await fly.animate(
          [
            { left: data.left + "px", top: data.top + "px", width: data.width + "px", height: data.height + "px", transform: LIFT },
            { left: t.left + "px", top: t.top + "px", width: t.width + "px", height: t.height + "px", transform: "none" }
          ],
          { duration: 900, easing: "cubic-bezier(0.4, 0, 0.2, 1)", fill: "forwards" }
        ).finished;
      }
      await decoding;
    } catch (e) {
      console.warn(e);
    } finally {
      // 何があっても、写真は貼った状態にして、演出の控えを消す
      const target = document.getElementById("resume-photo");
      if (target) target.classList.add("is-pasted");
      fly.remove();
      root.classList.remove("char-in", "arriving");
      if (nameEl) nameEl.classList.remove("is-glitch");
      window.__charFlying = false;
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
      root.classList.remove("arriving", "char-in");
      return;
    }
    if (data.mode === "char") return arriveChar(data);              // カルーセルの写真から来た時

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

  if (isChar) {
    arrive();
    departChar();
  } else {
    depart();
  }
})();