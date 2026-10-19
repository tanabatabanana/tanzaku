/* 短冊の部屋：GALLERYページ
   gallery.html の GALLERY_ITEMS（[画像のパス, 題名, 種類]）から、一覧・絞り込みボタン・拡大表示を作る */
(() => {
  "use strict";

  const items = typeof GALLERY_ITEMS !== "undefined" ? GALLERY_ITEMS : [];

  const grid = document.getElementById("gallery-grid");
  const tabs = document.getElementById("gallery-tabs");
  const box = document.getElementById("lightbox");
  const boxImg = document.getElementById("lb-img");
  const boxCaption = document.getElementById("lb-caption");
  if (!grid || !tabs || !box) return;

  let filter = "ALL";
  let shown = [];
  let current = 0;
  let opener = null;

  // ---- 絞り込みボタン（使われている種類から自動で作る） ----
  const kinds = ["ALL"].concat([...new Set(items.map((item) => item[2]).filter(Boolean))]);

  function renderTabs() {
    tabs.textContent = "";
    if (kinds.length <= 2) return;           // 種類が1つだけなら、ボタンは出さない
    kinds.forEach((kind) => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = kind;
      button.setAttribute("aria-pressed", String(kind === filter));
      button.addEventListener("click", () => {
        filter = kind;
        renderTabs();
        renderGrid();
      });
      tabs.append(button);
    });
  }

  // ---- 一覧 ----
  function renderGrid() {
    grid.textContent = "";
    shown = items.filter((item) => filter === "ALL" || item[2] === filter);

    shown.forEach((item, index) => {
      const [src, title] = item;

      const button = document.createElement("button");
      button.type = "button";
      button.className = "gallery-item";

      const img = document.createElement("img");
      img.src = src;
      img.alt = title;
      img.loading = "lazy";

      const caption = document.createElement("span");
      caption.textContent = title;

      button.append(img, caption);
      button.addEventListener("click", () => open(index, button));
      grid.append(button);
    });
  }

  // ---- 拡大表示 ----
  function show(index) {
    current = (index + shown.length) % shown.length;
    const [src, title] = shown[current];
    boxImg.src = src;
    boxImg.alt = title;
    boxCaption.textContent = title;
  }

  function open(index, from) {
    opener = from;
    show(index);
    box.hidden = false;
    document.getElementById("lb-close").focus();
  }

  function close() {
    box.hidden = true;
    boxImg.removeAttribute("src");
    if (opener) opener.focus();
  }

  document.getElementById("lb-close").addEventListener("click", close);
  document.getElementById("lb-prev").addEventListener("click", () => show(current - 1));
  document.getElementById("lb-next").addEventListener("click", () => show(current + 1));
  box.addEventListener("click", (event) => { if (event.target === box) close(); });   // 外側を押すと閉じる

  document.addEventListener("keydown", (event) => {
    if (box.hidden) return;
    if (event.key === "Escape") close();
    if (event.key === "ArrowLeft") show(current - 1);
    if (event.key === "ArrowRight") show(current + 1);
  });

  renderTabs();
  renderGrid();
})();
