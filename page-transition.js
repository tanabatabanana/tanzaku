/* 短冊の部屋：ページ移動の演出
   ヘッダー・GALLERY / ABOUT のウィンドウ・memo のリンクで移動する時、
   今のページのウィンドウがすべて、一瞬少し上がってから、下に落ちていく。 */
(() => {
  "use strict";

  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // 演出が始まるリンク
  const LINKS = ".site-header a, .water-gallery, .water-about, .memo-window";
  // 落ちていくウィンドウ（style.css の html.is-leaving と同じ並び）
  const WINDOWS = ".site-header, .gallery, .main-window, .side-window, .investigators-page, .gallery-card, .about-card, .gallery-window, .memo-window, .char-win";

  const DURATION = 1050;   // 落ち終わるまでの時間（ミリ秒）
  let leaving = false;

  function leave(url) {
    leaving = true;

    // 窓ごとに、落ち始めと傾きを少しずつずらす
    document.querySelectorAll(WINDOWS).forEach((win) => {
      win.style.setProperty("--fd", Math.random() * 120 + "ms");
      win.style.setProperty("--fr", Math.random() * 6 - 3 + "deg");
    });

    document.documentElement.classList.add("is-leaving");
    setTimeout(() => { location.href = url; }, DURATION);
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
    leave(url.href);
  });

  // 「戻る」で戻ってきた時に、落ちたままにならないようにする
  window.addEventListener("pageshow", (event) => {
    if (!event.persisted) return;
    leaving = false;
    document.documentElement.classList.remove("is-leaving");
  });
})();
