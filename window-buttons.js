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
