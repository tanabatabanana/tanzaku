/* 短冊の部屋：ABOUTページ
   ・通過済みシナリオ：data/scenarios.js（SCENARIO_TEXT / SCENARIOS）に、ホームの探索者一覧から「通った探索者」を自動で付けて、検索できる一覧にする
     ☆付きのシナリオには、青い小さな星（外部卓）を付ける
   ・探索者の総数（総勢）とロストの数：ホームの探索者一覧と、data/investigators.json から数える */
(() => {
  "use strict";

  const SCENARIO_DATA = typeof SCENARIOS !== "undefined" ? SCENARIOS : [];
  const SCENARIO_TEXT_DATA = typeof SCENARIO_TEXT !== "undefined" ? SCENARIO_TEXT : "";
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

  /* ---------- シナリオの一覧 ---------- */
  const STAR = /^[☆★]\s*/;

  // 「☆正式名称：略称」の形の、貼りつけた文章を、1行ずつ読み取る
  function parseText(text) {
    return String(text).split(/\r?\n/).map((line) => line.trim()).filter(Boolean).map((line) => {
      const external = STAR.test(line);
      line = line.replace(STAR, "");
      const at = line.lastIndexOf("：");                      // 全角の「：」のあとが略称
      const official = at >= 0 ? line.slice(0, at).trim() : line;
      const short = at >= 0 ? line.slice(at + 1).trim() : line;
      return { short: short || official, official: short ? official : "", note: "", external };
    });
  }

  function buildScenarios(pcs) {
    const byShort = new Map();
    const put = (entry) => {
      const old = byShort.get(entry.short);
      byShort.set(entry.short, Object.assign({ pcs: [] }, old || {}, entry, { pcs: [] }));
    };

    // SCENARIOS（["略称", "正式名称", "ひとこと", 外部卓か]）
    SCENARIO_DATA.forEach(([short, official = "", note = "", external = false]) => {
      let star = !!external;
      if (STAR.test(short)) { star = true; short = short.replace(STAR, ""); }
      if (STAR.test(official)) { star = true; official = official.replace(STAR, ""); }
      put({ short, official, note, external: star });
    });
    // 貼りつけた文章（SCENARIO_TEXT）は、同じ略称があれば、こちらを優先。先に並べる
    const fromText = parseText(SCENARIO_TEXT_DATA);
    const ordered = new Map();
    fromText.forEach((e) => ordered.set(e.short, e));
    fromText.forEach((e) => { const old = byShort.get(e.short); byShort.set(e.short, Object.assign({ pcs: [] }, old || {}, e, { pcs: [] })); });

    // ホームの探索者一覧にある略称は、書いていなくても、自動で出す。通った探索者を付ける
    pcs.forEach(([name, , short, ho]) => {
      if (!short) return;
      if (!byShort.has(short)) byShort.set(short, { short, official: "", note: "", external: false, pcs: [] });
      byShort.get(short).pcs.push(name + (ho ? "（" + ho + "）" : ""));
    });

    const all = [...byShort.values()];
    return all.filter((s) => ordered.has(s.short)).sort((a, b) => [...ordered.keys()].indexOf(a.short) - [...ordered.keys()].indexOf(b.short))
      .concat(all.filter((s) => !ordered.has(s.short)));
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
      const row = el("div", "sc-row" + (s.external ? " is-external" : ""));
      if (s.external) {
        const star = el("span", "sc-star", "★");           // 外部卓
        star.setAttribute("title", "外部卓");
        row.append(star);
      }

      const title = el("b", "sc-title");
      title.append(s.official || s.short);
      if (s.official && s.official !== s.short) title.append(el("small", "", "略称：" + s.short));
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

  /* ---------- 探索者の総数（総勢）とロストの数 ---------- */
  async function countLost() {
    try {
      const res = await fetch("data/investigators.json");
      if (!res.ok) return null;
      const data = await res.json();
      return data.filter((e) => e && e.data && e.data.lost === true).length;
    } catch (e) {
      return null;
    }
  }

  async function renderCounts(pcs) {
    const heading = $("face-heading");
    if (!heading) return;
    const lost = await countLost();
    // 総勢は、ホームの一覧の人数。探索者が1人増えるごとに、自動で増える
    heading.textContent = "総勢：" + pcs.length + "　ロスト：" + (lost === null ? "13" : lost);
  }

  /* ---------- 顔のアイコン（見出しの下に並べる） ---------- */
  function renderFaces(pcs) {
    const grid = $("face-grid");
    if (!grid) return;
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
    renderCounts(pcs);
    renderFaces(pcs);
  });
})();
