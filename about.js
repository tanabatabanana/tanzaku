/* 短冊の部屋：ABOUTページ
   ・通過済みシナリオ：data/scenarios.js の SCENARIOS（略称・正式名称）に、ホームの探索者一覧から「通った探索者」を自動で付けて、検索できる一覧にする
   ・アイコン（顔）：ホームの探索者一覧から作る */
(() => {
  "use strict";

  const SCENARIO_DATA = typeof SCENARIOS !== "undefined" ? SCENARIOS : [];
  const FALLBACK_PCS = typeof ABOUT_PCS !== "undefined" ? ABOUT_PCS : [];

  const $ = (id) => document.getElementById(id);
  const el = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };
  // 検索用に、全角・半角・大文字小文字・空白をそろえる
  const norm = (s) => String(s).normalize("NFKC").toLowerCase().replace(/\s+/g, "");

  /* ---------- 探索者の一覧：ホーム（index.html）から読み込む。読み込めない時は、予備のデータを使う ---------- */
  async function loadPcs() {
    try {
      const res = await fetch("index.html");
      if (!res.ok) throw new Error("index.html を読み込めませんでした");
      const text = await res.text();
      const rows = [...text.matchAll(/\["(\d+)", "([^"]*)", "([^"]*)", "([^"]*)", "([^"]*)"(?:, "x")?\]/g)]
        .map((m) => ({ no: Number(m[1]), row: [m[2], m[3], m[4], m[5]] }))
        .sort((a, b) => a.no - b.no)
        .map((item) => item.row);
      if (rows.length) return rows;
    } catch (e) { /* 予備のデータを使う */ }
    return FALLBACK_PCS;
  }

  /* ---------- 通過済みシナリオ ---------- */
  function buildScenarios(pcs) {
    const byShort = new Map();
    SCENARIO_DATA.forEach(([short, official = "", note = ""]) => {
      byShort.set(short, { short, official, note, pcs: [] });
    });
    pcs.forEach(([name, , short, ho]) => {
      if (!short) return;
      if (!byShort.has(short)) byShort.set(short, { short, official: "", note: "", pcs: [] });   // 一覧に書いていない略称も、自動で出す
      byShort.get(short).pcs.push(name + (ho ? "（" + ho + "）" : ""));
    });
    return [...byShort.values()];
  }

  const list = $("sc-list");
  const input = $("sc-search-input");
  const count = $("sc-count");
  let scenarios = [];

  function renderScenarios() {
    const q = norm(input.value);
    list.textContent = "";

    const hits = scenarios.filter((s) => !q || norm([s.short, s.official, s.note].concat(s.pcs).join(" ")).includes(q));

    hits.forEach((s) => {
      const row = el("div", "sc-row");

      const title = el("b", "sc-title");
      title.append(s.official || s.short);
      if (s.official) title.append(el("small", "", "略称：" + s.short));
      row.append(title);

      const box = el("div", "sc-pcs");
      s.pcs.forEach((pc) => box.append(el("span", "", pc)));
      if (s.note) box.append(el("p", "sc-note", s.note));
      row.append(box);

      list.append(row);
    });

    if (!hits.length) list.append(el("div", "sc-empty", "見つかりませんでした"));
    count.textContent = hits.length + " / " + scenarios.length + " 件";
  }

  /* ---------- アイコン（顔） ---------- */
  function renderFaces(pcs) {
    const grid = $("face-grid");
    pcs.forEach(([name, image]) => {
      const figure = el("figure", "face");
      const img = el("img");
      img.src = "images/kao/k-" + image + ".png";
      img.alt = name;
      img.loading = "lazy";
      img.addEventListener("error", () => figure.remove());       // 画像が無い人は、空の枠を出さない
      figure.append(img, el("figcaption", "", name));
      grid.append(figure);
    });
  }

  input.addEventListener("input", renderScenarios);

  loadPcs().then((pcs) => {
    scenarios = buildScenarios(pcs);
    renderScenarios();
    renderFaces(pcs);
  });
})();
