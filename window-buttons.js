/* 短冊の部屋：ウィンドウの×ボタン
   ・ディスプレイ / FA / CHAT の× … ぽよんと跳ねる
   ・探索者一覧の×           … 縮小して、ランダムな1枚だけ残る。その横に通過シナリオ名と能力値を出す（もう一度押すと元に戻る） */
(() => {
  "use strict";

  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // 右上の×の上に、押せるボタンを重ねる
  function addCloseButton(win, onClick) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "win-x";
    button.setAttribute("aria-label", "ウィンドウの×ボタン");
    if (win.getAttribute("aria-hidden") === "true") button.tabIndex = -1;
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      onClick(win);
    });
    win.append(button);
  }

  /* ---------- ぽよん ---------- */
  function poyon(win) {
    if (reduce) return;
    win.classList.remove("is-poyon");
    void win.offsetWidth;                    // 連打しても、最初からやり直せるように
    win.classList.add("is-poyon");
    win.addEventListener("animationend", function done(event) {
      if (event.target !== win) return;      // 中身のアニメーションでは外さない
      win.classList.remove("is-poyon");
      win.removeEventListener("animationend", done);
    });
  }

  document.querySelectorAll(".gallery, .side-window").forEach((win) => addCloseButton(win, poyon));

  /* ---------- 探索者一覧：縮小して1枚だけ残る ---------- */
  const page = document.querySelector(".investigators-page");
  if (!page) return;

  const STAT_ORDER = ["STR", "CON", "POW", "DEX", "APP", "SIZ", "INT", "EDU"];

  function cell(label, value) {
    const item = document.createElement("div");
    const key = document.createElement("b");
    key.textContent = label;
    item.append(key, " " + value);
    return item;
  }

  // 残った1枚の横に出す、名前・通過シナリオ・能力値（技能値は出さない）
  function buildInfo(card) {
    const info = document.createElement("div");
    info.className = "collapse-info";

    const name = document.createElement("div");
    name.className = "ci-name";
    const nameEl = card.querySelector(".name-text");
    name.textContent = nameEl ? nameEl.textContent.trim() : "";

    const bubble = card.querySelector(".scenario-bubble");
    const scenario = bubble && bubble.childNodes[0] ? bubble.childNodes[0].textContent.trim() : "";
    const role = bubble && bubble.childNodes[2] ? bubble.childNodes[2].textContent.trim() : "";
    const scenarioRow = document.createElement("div");
    scenarioRow.className = "ci-scenario";
    const label = document.createElement("b");
    label.textContent = "通過シナリオ";
    scenarioRow.append(label, scenario + (role ? "（" + role + "）" : ""));

    info.append(name, scenarioRow);

    // いあきゃらのデータ（script.js が読み込んだもの）から、能力値を出す
    const data = typeof findInvestigatorData === "function" ? findInvestigatorData(card) : null;
    const stats = document.createElement("div");
    stats.className = "ci-stats";

    if (data && data.data) {
      const params = data.data.params || [];
      const status = data.data.status || [];
      STAT_ORDER.forEach((key) => {
        const found = params.find((p) => p.label === key);
        if (found) stats.append(cell(key, found.value));
      });
      status.forEach((s) => stats.append(cell(s.label, s.value)));
    }
    if (!stats.children.length) {
      stats.textContent = "NO DATA";
    }

    info.append(stats);
    return info;
  }

  function clearPick() {
    page.querySelectorAll(".is-pick").forEach((card) => card.classList.remove("is-pick"));
    page.querySelectorAll(".collapse-info").forEach((info) => info.remove());
  }

  function pickRandom() {
    const cards = Array.from(page.querySelectorAll(".investigator-card"));
    if (!cards.length) return;
    const card = cards[Math.floor(Math.random() * cards.length)];
    card.classList.add("is-pick", "is-in");   // is-in：スクロールで出てくる演出が済んでいない場合でも見えるように
    page.querySelector(".investigator-grid").append(buildInfo(card));
  }

  function toggleCollapse() {
    const startHeight = page.offsetHeight;

    if (page.classList.contains("is-collapsed")) {
      page.classList.remove("is-collapsed");
      clearPick();
    } else {
      pickRandom();
      page.classList.add("is-collapsed");
    }

    const endHeight = page.offsetHeight;
    if (reduce || startHeight === endHeight) return;

    // 高さをなめらかに変える（ぽよんと少し弾む）
    const reset = () => {
      page.style.height = "";
      page.style.overflow = "";
      page.style.transition = "";
    };
    page.style.height = startHeight + "px";
    page.style.overflow = "hidden";
    void page.offsetHeight;
    page.style.transition = "height 0.5s cubic-bezier(0.3, 1.3, 0.5, 1)";
    page.style.height = endHeight + "px";

    page.addEventListener("transitionend", function done(event) {
      if (event.target !== page || event.propertyName !== "height") return;
      reset();
      page.removeEventListener("transitionend", done);
    });
    setTimeout(reset, 700);   // 念のため
  }

  addCloseButton(page, toggleCollapse);
})();

/* ホームの探索者一覧：カーソルを合わせると出る、シナリオ名の吹き出しを、アバウトの吹き出しと同じ、ドット絵の吹き出し（角は階段状・しっぽは左下）にする */
(() => {
  "use strict";

  const TAIL = 4;                                   // しっぽの、いちばん左の壁の場所

  function pixelSvg(cols, rows, dot) {
    const black = new Set();
    const white = new Set();
    const put = (set, x, y) => set.add(x + "," + y);
    for (let y = 0; y < rows; y++) {
      const cut = y === 0 || y === rows - 1 ? 3 : y === 1 || y === rows - 2 ? 2 : y === 2 || y === rows - 3 ? 1 : 0;   // 角を階段状に欠く
      for (let x = cut; x < cols - cut; x++) put(white, x, y);
      if (y === 0 || y === rows - 1) {
        for (let x = 3; x <= cols - 4; x++) {
          if (y === rows - 1 && x > TAIL && x < TAIL + 4) continue;                // しっぽの口
          put(black, x, y);
        }
      } else {
        put(black, cut, y);
        put(black, cols - 1 - cut, y);
      }
    }
    for (let r = 0; r < 2; r++) {                                                  // しっぽ：1段ごとに1ドットずつ右へずれながら、下へ
      put(black, TAIL + r, rows + r);
      put(black, TAIL + 4 + r, rows + r);
      for (let x = TAIL + 1 + r; x <= TAIL + 3 + r; x++) put(white, x, rows + r);
    }
    for (let x = TAIL + 2; x <= TAIL + 6; x++) put(black, x, rows + 2);

    const NS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("viewBox", "0 0 " + cols + " " + (rows + 3));
    svg.setAttribute("width", cols * dot);
    svg.setAttribute("height", (rows + 3) * dot);
    svg.setAttribute("shape-rendering", "crispEdges");
    svg.setAttribute("class", "sp-bg");
    const fill = (set, color) => {
      let d = "";
      for (let y = 0; y < rows + 3; y++) {
        for (let x = 0; x < cols; ) {
          if (!set.has(x + "," + y)) { x++; continue; }
          let run = 0;
          while (set.has(x + run + "," + y)) run++;
          d += "M" + x + " " + y + "h" + run + "v1h-" + run + "z";
          x += run;
        }
      }
      const path = document.createElementNS(NS, "path");
      path.setAttribute("d", d);
      path.setAttribute("fill", color);
      svg.append(path);
    };
    fill(white, "#fff");
    fill(black, "#111");
    return svg;
  }

  function decorate() {
    const dot = window.matchMedia("(max-width: 800px)").matches ? 3 : 4;
    document.querySelectorAll(".scenario-bubble").forEach((bubble) => {
      if (bubble.dataset.pixel) return;
      bubble.dataset.pixel = "1";

      // 中の文字（シナリオ名・HO）を包んで、大きさを測る
      const text = document.createElement("span");
      text.className = "sb-text";
      while (bubble.firstChild) text.append(bubble.firstChild);
      bubble.classList.add("is-pixel");
      bubble.append(text);
      const textW = Math.ceil(text.offsetWidth);
      const textH = Math.ceil(text.offsetHeight);

      const cols = Math.max(14, Math.ceil(textW / dot) + 6);
      const rows = Math.max(7, Math.ceil(textH / dot) + 4);
      bubble.style.width = cols * dot + "px";
      bubble.style.height = (rows + 3) * dot + "px";
      text.style.position = "absolute";
      text.style.left = 3 * dot + "px";
      text.style.top = (rows * dot - textH) / 2 + "px";
      text.style.width = textW + "px";
      bubble.prepend(pixelSvg(cols, rows, dot));

      // 写真の上に出す。しっぽの先が、写真の左上のあたりに来る
      bubble.style.top = -((rows + 3) * dot) + 6 + "px";
      bubble.style.left = "-6px";
    });
  }

  // 文字の大きさを測るので、フォントの読み込みが終わってから
  const loaded = document.readyState === "complete" ? Promise.resolve() : new Promise((resolve) => window.addEventListener("load", resolve, { once: true }));
  Promise.all([loaded, document.fonts ? document.fonts.ready : Promise.resolve()]).then(decorate);
})();