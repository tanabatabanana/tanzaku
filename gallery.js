/* 短冊の部屋：GALLERYページ
   gallery.html の GALLERY_ITEMS（[画像のパス, 題名, 種類]）から、一覧・絞り込みボタン・拡大表示を作る */
(() => {
  "use strict";

  let items = typeof GALLERY_ITEMS !== "undefined" ? GALLERY_ITEMS.slice() : [];

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
  let kinds = ["ALL"];
  const computeKinds = () => { kinds = ["ALL"].concat([...new Set(items.map((item) => item[2]).filter(Boolean))]); };

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
      button.dataset.kind = item[2] || "";

      const img = document.createElement("img");
      img.src = src;
      img.alt = title;

      const caption = document.createElement("span");
      caption.textContent = title;

      button.append(img, caption);
      button.addEventListener("click", () => open(index, button));

      // 画像が読み込めるまで枠は出さない。読み込めなかった画像は、空の枠と影が残らないよう取り除く
      button.hidden = true;
      img.addEventListener("load", () => { button.hidden = false; });
      img.addEventListener("error", () => {
        console.warn("画像を読み込めませんでした: " + src);
        button.remove();
      });
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

  /* ---------- images/display の中に入っているものを、ディスプレイとして並べる ----------
     ファイル名は d-○○.png（○○ は、探索者の画像名 k-○○.png と同じ）。新しく入れたものも、自動で増える */
  async function exists(url) {
    try {
      return (await fetch(url, { method: "HEAD" })).ok;
    } catch (e) {
      return false;
    }
  }

  // GitHub Pages のサイトなら、フォルダの中のファイルの一覧を GitHub から取得できる
  async function listFolder(dir) {
    try {
      if (!/\.github\.io$/.test(location.hostname)) return [];
      const owner = location.hostname.split(".")[0];
      const parts = new URL(dir, location.href).pathname.split("/").filter(Boolean);
      const repo = parts.shift();
      const res = await fetch("https://api.github.com/repos/" + owner + "/" + repo + "/contents/" + parts.join("/"));
      if (!res.ok) return [];
      return (await res.json()).filter((it) => it.type === "file" && /\.(png|jpe?g|webp|gif)$/i.test(it.name)).map((it) => it.name);
    } catch (e) {
      return [];
    }
  }

  // ホームの探索者一覧から [名前, 画像名] を読み込む（題名と、並び順に使う）
  async function loadRows() {
    try {
      const res = await fetch("index.html");
      if (!res.ok) return [];
      const text = await res.text();
      return [...text.matchAll(/\["(\d+)", "([^"]*)", "([^"]*)", "([^"]*)", "([^"]*)"(?:, "x")?\]/g)]
        .map((m) => ({ no: Number(m[1]), name: m[2], img: m[3] }))
        .sort((a, b) => a.no - b.no);
    } catch (e) {
      return [];
    }
  }

  async function loadDisplayItems() {
    const rows = await loadRows();
    const order = new Map(rows.map((r, i) => [r.img, i]));
    const nameOf = new Map(rows.map((r) => [r.img, r.name]));

    let files = await listFolder("images/display/");
    if (!files.length) {
      // 一覧を取得できない時：探索者ごとに d-○○.png / .PNG があるか確かめる
      const checks = await Promise.all(rows.flatMap((r) => ["png", "PNG"].map(async (ext) => ((await exists("images/display/d-" + r.img + "." + ext)) ? "d-" + r.img + "." + ext : ""))));
      files = checks.filter(Boolean);
    }
    const keyOf = (file) => file.replace(/\.[^.]+$/, "").replace(/^d[-_]/, "");
    return files
      .sort((a, b) => (order.has(keyOf(a)) ? order.get(keyOf(a)) : 1e6) - (order.has(keyOf(b)) ? order.get(keyOf(b)) : 1e6) || a.localeCompare(b, "ja", { numeric: true }))
      .map((file) => ["images/display/" + file, nameOf.get(keyOf(file)) || keyOf(file), "DISPLAY"]);
  }

  loadDisplayItems()
    .then((list) => {
      if (list.length) items = items.filter((item) => item[2] !== "DISPLAY").concat(list);    // 見つかった時は、フォルダの中身に置き換える
    })
    .catch(() => { /* 見つからない時は、gallery.html に書いてある分をそのまま使う */ })
    .finally(() => {
      computeKinds();
      renderTabs();
      renderGrid();
    });
})();
