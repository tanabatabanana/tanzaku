/* 短冊の部屋：ABOUTページ
   ・通過済みシナリオ：data/scenarios.js（SCENARIO_TEXT / SCENARIOS）に、ホームの探索者一覧から「出身の探索者」を自動で付けて、検索できる一覧にする
     ☆付き（外部卓）には、青い小さな星。出身の探索者がいるシナリオは、カーソルを合わせると、吹き出しで顔が出る
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
  // シナリオ名を照らし合わせる用：記号（。、！？・☆ など）も無視する
  const key = (s) => String(s).normalize("NFKC").toLowerCase().replace(/[\s\u3000。、．，.,・!?！？☆★…「」『』()（）\-－―~〜]/g, "");

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
  const HEADING = /^(英語タイトル|[ぁ-ん]行)$/;                // 「あ行」「英語タイトル」などの、見出しだけの行
  const NO_OFFICIAL = "正式名称がまだ無いシナリオ（略称）";          // 貼りつけた一覧に無く、ホームの一覧にだけあるシナリオの見出し
  const INVISIBLE = /[\u200B-\u200D\uFEFF]/g;                  // 見えない文字（ゼロ幅スペースなど）

  // 貼りつけた文章を、1行ずつ読み取る。「正式名称☆　：略称」の形（☆・略称は無くてもよい）
  function parseText(text) {
    const entries = [];
    let group = "";
    String(text).split(/\r?\n/).forEach((raw) => {
      const line = raw.replace(INVISIBLE, "").trim();
      if (!line) return;
      if (HEADING.test(line)) { group = line; return; }

      // 「：」の前に空白（全角スペース）がある時だけ、そのあとを略称とみなす（「探索者：Uの証言」のような題名の中の「：」は、そのまま）
      const m = line.match(/^(.*?)[\s\u3000]+：\s*(.+)$/);
      const left = m ? m[1] : line;
      const abbr = m ? m[2].trim() : "";
      const external = /[☆★]/.test(left);
      const official = left.replace(/[☆★]/g, "").trim();

      // 略称が無い題名に、全角スペースで区切った続きがある時（例：「狂気山脈　カエラズノケン」）は、最後の部分も、探索者との照合に使う
      const aliases = [abbr, official];
      if (!abbr && /\u3000/.test(official)) aliases.push(official.split(/\u3000+/).pop());

      entries.push({ short: abbr || official, official, note: "", external, group, aliases: aliases.filter(Boolean), pcs: [] });
    });
    return entries;
  }

  function buildScenarios(pcs) {
    const entries = parseText(SCENARIO_TEXT_DATA);
    const find = (name) => {
      const k = key(name);
      return k ? entries.find((e) => e.aliases.some((a) => key(a) === k)) : undefined;
    };

    // SCENARIOS（["略称", "正式名称", "ひとこと", 外部卓か]）。貼りつけた文章に同じシナリオがあれば、そこにひとこと等を足す
    SCENARIO_DATA.forEach(([short, official = "", note = "", external = false]) => {
      let star = !!external;
      if (/[☆★]/.test(short)) { star = true; short = short.replace(/[☆★]/g, "").trim(); }
      if (/[☆★]/.test(official)) { star = true; official = official.replace(/[☆★]/g, "").trim(); }
      const found = find(short) || (official && find(official));
      if (found) {
        if (note && !found.note) found.note = note;
        if (star) found.external = true;
        if (official && !found.official) found.official = official;
      } else {
        entries.push({ short, official, note, external: star, group: NO_OFFICIAL, aliases: [short, official].filter(Boolean), pcs: [] });
      }
    });

    // ホームの探索者一覧にある略称（出身シナリオ）：該当するシナリオに、探索者を付ける。一覧に無ければ、略称だけで追加する
    pcs.forEach(([name, img, scenario, ho]) => {
      if (!scenario) return;
      let entry = find(scenario);
      if (!entry) {
        entry = { short: scenario, official: "", note: "", external: false, group: NO_OFFICIAL, aliases: [scenario], pcs: [] };
        entries.push(entry);
      }
      entry.pcs.push({ name, img, ho });
    });
    return entries;
  }

  const list = $("sc-list");
  const input = $("sc-search-input");
  const count = $("sc-count");
  let scenarios = [];

  /* ---------- カーソルを合わせると、出身の探索者の顔が、吹き出しで出る ---------- */
  const pop = el("div", "sc-pop");
  pop.hidden = true;
  pop.setAttribute("aria-hidden", "true");
  document.body.append(pop);
  let popRow = null;

  function showPop(row, entry) {
    popRow = row;
    pop.textContent = "";
    entry.pcs.forEach((pc) => {
      const figure = el("figure", "pop-face");
      const img = el("img");
      img.src = "images/kao/k-" + pc.img + ".png";
      img.alt = pc.name;
      img.addEventListener("error", () => figure.classList.add("is-empty"));
      figure.append(img, el("figcaption", "", pc.name + (pc.ho ? "（" + pc.ho + "）" : "")));
      pop.append(figure);
    });
    pop.hidden = false;
    pop.classList.remove("is-below");

    // 行の上に出す。上に入らない時は、下に出す
    const r = row.getBoundingClientRect();
    const w = pop.offsetWidth;
    const h = pop.offsetHeight;
    const left = Math.max(8, Math.min(r.left + 24, window.innerWidth - w - 8));
    let top = r.top - h - 12;
    if (top < 8) { top = r.bottom + 12; pop.classList.add("is-below"); }
    pop.style.left = left + "px";
    pop.style.top = top + "px";
    pop.style.setProperty("--tail", Math.max(14, Math.min(r.left + 40 - left, w - 28)) + "px");
  }

  function hidePop() {
    pop.hidden = true;
    popRow = null;
  }

  // スマホなど、カーソルを合わせられない時は、タップで出し入れする
  document.addEventListener("click", (event) => {
    if (!popRow) return;
    if (!popRow.contains(event.target)) hidePop();
  });

  function renderScenarios() {
    const q = norm(input.value);
    list.textContent = "";
    hidePop();

    const hits = scenarios.filter((s) => !q || norm([s.short, s.official, s.note].concat(s.pcs.map((p) => p.name + (p.ho || ""))).join(" ")).includes(q));

    let lastGroup = null;
    hits.forEach((s) => {
      if (s.group && s.group !== lastGroup) {                       // 「あ行」などの見出し
        list.append(el("div", "sc-group", s.group));
        lastGroup = s.group;
      }

      const row = el("div", "sc-row" + (s.external ? " is-external" : "") + (s.pcs.length ? " has-pcs" : ""));
      if (s.external) {
        const star = el("span", "sc-star", "★");                     // 外部卓
        star.setAttribute("title", "外部卓");
        row.append(star);
      }

      const title = el("b", "sc-title");
      title.append(s.official || s.short);
      if (s.official && s.official !== s.short) title.append(el("small", "", "略称：" + s.short));
      row.append(title);

      const box = el("div", "sc-pcs");
      s.pcs.forEach((pc) => box.append(el("span", "", pc.name + (pc.ho ? "（" + pc.ho + "）" : ""))));
      if (s.note) box.append(el("p", "sc-note", s.note));
      row.append(box);

      if (s.pcs.length) {
        row.addEventListener("pointerenter", (e) => { if (e.pointerType !== "touch") showPop(row, s); });
        row.addEventListener("pointerleave", (e) => { if (e.pointerType !== "touch") hidePop(); });
        row.addEventListener("click", (e) => { if (popRow === row) hidePop(); else showPop(row, s); });
      }
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
