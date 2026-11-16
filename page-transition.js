/* 短冊の部屋：ページ移動の演出（青が広がって、移動先でその中心からサイトが広がる）
   ヘッダー・GALLERY / ABOUT のウィンドウ・memo のリンクを押すと、押した所から青い円が広がって画面をおおい、移動する。
   移動先のページでは、同じ場所を中心に、青い円の中からサイトが広がって現れる。 */
(() => {
  "use strict";

  const KEY = "rippleFrom";
  const BLUE = "#0047ff";
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const root = document.documentElement;

  const LINKS = ".site-header a, .water-gallery, .water-about, .memo-window";
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  // 点（x, y）から、画面のいちばん遠い角までの距離
  const farthest = (x, y) => Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));

  let leaving = false;

  // 青い画面の間に出す LOADING の窓
  function makeLoading() {
    const node = document.createElement("div");
    node.className = "ripple-loading";
    node.setAttribute("role", "status");
    node.innerHTML = '<div class="rl-bar">LOADING</div><div class="rl-msg">NOW LOADING...</div>' +
      '<div class="rl-track"><i class="rl-fill"></i></div><div class="rl-pct">0%</div>';
    const fill = node.querySelector(".rl-fill");
    const pct = node.querySelector(".rl-pct");
    return {
      node,
      set(ratio) {
        const v = Math.max(0, Math.min(100, Math.round(ratio * 100)));
        fill.style.setProperty("--p", v + "%");
        pct.textContent = v + "%";
      }
    };
  }

  /* =========================
     出る側：押した所から、青が広がる
  ========================= */
  function leave(url, x, y) {
    leaving = true;
    try { sessionStorage.setItem(KEY, JSON.stringify({ x, y })); } catch (e) { /* 保存できなくても移動する */ }

    const ripple = document.createElement("div");
    ripple.className = "ripple";
    ripple.setAttribute("aria-hidden", "true");
    document.body.append(ripple);

    const radius = farthest(x, y) + 4;
    ripple.animate(
      [{ clipPath: "circle(0px at " + x + "px " + y + "px)" }, { clipPath: "circle(" + radius + "px at " + x + "px " + y + "px)" }],
      { duration: 700, easing: "cubic-bezier(0.6, 0, 0.3, 1)", fill: "forwards" }
    );

    setTimeout(() => { location.href = url; }, 750);
  }

  document.addEventListener("click", (event) => {
    if (reduce || leaving || event.defaultPrevented) return;
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

    const link = event.target.closest("a[href]");
    if (!link || !link.matches(LINKS)) return;
    if (link.target && link.target !== "_self") return;
    if (link.hasAttribute("download")) return;

    const url = new URL(link.href, location.href);
    if (url.origin !== location.origin) return;
    if (url.pathname === location.pathname && url.search === location.search) return;   // 同じページ内の移動はそのまま

    event.preventDefault();

    // マウス・タッチは押した場所から。キーボードで押した時は、リンクの中心から
    let x;
    let y;
    if (event.detail === 0) {
      const box = link.getBoundingClientRect();
      x = box.left + box.width / 2;
      y = box.top + box.height / 2;
    } else {
      x = event.clientX;
      y = event.clientY;
    }
    leave(url.href, x, y);
  });

  /* =========================
     着く側：同じ場所を中心に、サイトが広がる
  ========================= */
  async function arrive() {
    let from = null;
    try {
      from = JSON.parse(sessionStorage.getItem(KEY) || "null");
      sessionStorage.removeItem(KEY);
    } catch (e) { /* 何もしない */ }

    if (!from || reduce) {
      root.classList.remove("ripple-in");
      return;
    }

    const cover = document.createElement("div");
    cover.className = "ripple-cover";
    cover.setAttribute("aria-hidden", "true");
    // 中心が透明な円になっている背景。円が大きくなると、サイトが見えてくる
    const paint = (r) => {
      cover.style.background = "radial-gradient(circle at " + from.x + "px " + from.y + "px, transparent " + r + "px, " + BLUE + " " + (r + 1) + "px)";
    };

    try {
      paint(0);
      document.body.append(cover);
      root.classList.remove("ripple-in");

      // 読み込みが終わるまで待つ（長くても2秒）
      if (document.readyState !== "complete") {
        await Promise.race([new Promise((resolve) => window.addEventListener("load", resolve, { once: true })), wait(2000)]);
      }
      await wait(150);

      // ページが「準備ができた」と知らせる時（ギャラリー：全部の画像の読み込み）は、それまで青い画面のまま待つ。時間がかかる時は LOADING を出す
      if (window.__pageReady) {
        let loading = null;
        let poll = null;
        const showTimer = setTimeout(() => {
          loading = makeLoading();
          document.body.append(loading.node);
          poll = setInterval(() => loading.set(window.__pageProgress || 0), 100);
        }, 300);
        await Promise.race([window.__pageReady, wait(21000)]);
        clearTimeout(showTimer);
        if (poll) clearInterval(poll);
        if (loading) {
          loading.set(1);
          await wait(300);
          loading.node.remove();
        }
      }

      const radius = farthest(from.x, from.y) + 4;
      const duration = 750;
      const start = performance.now();
      await new Promise((resolve) => {
        const frame = (now) => {
          const t = Math.min(1, (now - start) / duration);
          paint(radius * (1 - Math.pow(1 - t, 3)));
          if (t < 1) requestAnimationFrame(frame);
          else resolve();
        };
        requestAnimationFrame(frame);
      });
    } catch (e) {
      console.warn(e);
    } finally {
      cover.remove();
      root.classList.remove("ripple-in");
    }
  }

  // 「戻る」で戻ってきた時に、青い円が残らないようにする
  window.addEventListener("pageshow", (event) => {
    if (!event.persisted) return;
    leaving = false;
    document.querySelectorAll(".ripple, .ripple-cover").forEach((node) => node.remove());
    root.classList.remove("ripple-in");
  });

  arrive();
})();
