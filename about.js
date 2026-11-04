/* 短冊の部屋：ABOUTページ
   ■ データの整理（上から順に）
      1. 探索者       … { name, img, scenario(出身シナリオの略称), ho, lost }   ホームの探索者一覧 ＋ data/investigators.json のロスト
      2. シナリオ     … { name(正式名称), short(略称), external(外部卓), group(あ行など), note, aliases, pcs(出身の探索者) }
                        data/scenarios.js の SCENARIO_TEXT / SCENARIOS から作り、1 の探索者を付ける
      3. 表示         … 通過済みシナリオの一覧（検索・五十音順・外部卓の星・吹き出しの顔）／探索者の総数／顔の一覧（ロストは赤いバツ） */
(() => {
  "use strict";

  /* ============================================================
     設定
  ============================================================ */
  // ここに登録しない探索者たちの人数。総勢・ロストの数に、それぞれ足して表示する
  const EXTRA_TOTAL = 19;
  const EXTRA_LOST = 7;

  const NO_OFFICIAL = "正式名称がまだ無いシナリオ（略称）";   // 貼りつけた一覧に無く、ホームの一覧にだけあるシナリオの見出し
  // 五十音順の、見出しの並び
  const GROUP_ORDER = ["英語タイトル", "あ行", "か行", "さ行", "た行", "な行", "は行", "ま行", "や行", "ら行", "わ行", NO_OFFICIAL];

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
  // 探索者の名前を照らし合わせる用：括弧の中（読み）と空白を無視する
  const nameKey = (s) => String(s).normalize("NFKC").replace(/[（(].*?[）)]/g, "").replace(/\s+/g, "").toLowerCase();

  /* ============================================================
     1. 探索者のデータ
  ============================================================ */
  // ホームの探索者一覧（index.html）から読み込む。読み込めない時は、予備のデータを使う
  async function loadPcs() {
    let rows = [];
    try {
      const res = await fetch("index.html");
      if (!res.ok) throw new Error("index.html を読み込めませんでした");
      const text = await res.text();
      rows = [...text.matchAll(/\["(\d+)", "([^"]*)", "([^"]*)", "([^"]*)", "([^"]*)"(?:, "x")?\]/g)]
        .map((m) => ({ no: Number(m[1]), row: [m[2], m[3], m[4], m[5]] }))
        .sort((a, b) => a.no - b.no)
        .map((item) => item.row);
    } catch (e) { /* 予備のデータを使う */ }
    if (!rows.length) rows = FALLBACK_PCS;
    return rows.map(([name, img, scenario, ho]) => ({ name, img, scenario, ho, lost: false }));
  }

  // data/investigators.json から、ロストした探索者を調べる（{ lost: true }）
  async function loadLost() {
    try {
      const res = await fetch("data/investigators.json");
      if (!res.ok) return null;
      const data = await res.json();
      const names = data.filter((e) => e && e.data && e.data.lost === true).map((e) => nameKey(e.data.name));
      return { names, count: names.length };
    } catch (e) {
      return null;
    }
  }

  function markLost(pcs, lostInfo) {
    if (!lostInfo) return;
    pcs.forEach((pc) => {
      const k = nameKey(pc.name);
      pc.lost = lostInfo.names.some((n) => n === k || (Math.min(n.length, k.length) >= 3 && (n.includes(k) || k.includes(n))));
    });
  }

  /* ============================================================
     2. シナリオのデータ
  ============================================================ */
  const HEADING = /^(英語タイトル|[ぁ-ん]行)$/;                // 「あ行」「英語タイトル」などの、見出しだけの行
  const INVISIBLE = /[\u200B-\u200D\uFEFF]/g;                  // 見えない文字（ゼロ幅スペースなど）

  // 貼りつけた文章を、1行ずつ読み取る。「正式名称☆　：略称」の形（☆・略称は無くてもよい）
  function parseScenarioText(text) {
    const list = [];
    let group = "";
    String(text).split(/\r?\n/).forEach((raw) => {
      const line = raw.replace(INVISIBLE, "").trim();
      if (!line) return;
      if (HEADING.test(line)) { group = line; return; }

      // 「：」の前に空白（全角スペース）がある時だけ、そのあとを略称とみなす（「探索者：Uの証言」のような題名の中の「：」は、そのまま）
      const m = line.match(/^(.*?)[\s\u3000]+：\s*(.+)$/);
      const left = m ? m[1] : line;
      const short = m ? m[2].trim() : "";
      const name = left.replace(/[☆★]/g, "").trim();

      // 略称が無い題名に、全角スペースで区切った続きがある時（例：「狂気山脈　カエラズノケン」）は、最後の部分も、探索者との照合に使う
      const aliases = [short, name];
      if (!short && /\u3000/.test(name)) aliases.push(name.split(/\u3000+/).pop());

      list.push({ name, short: short || name, external: /[☆★]/.test(left), group, note: "", aliases: aliases.filter(Boolean), pcs: [] });
    });
    return list;
  }

  // 名前（正式名称・略称のどちらでも）から、シナリオを探す
  const findScenario = (list, name) => {
    const k = key(name);
    return k ? list.find((s) => s.aliases.some((a) => key(a) === k)) : undefined;
  };

  // SCENARIOS（["略称", "正式名称", "ひとこと", 外部卓か]）を足す。同じシナリオが貼りつけた文章にあれば、ひとこと等だけ足す
  function mergeScenarioArray(list) {
    SCENARIO_DATA.forEach(([short, name = "", note = "", external = false]) => {
      let star = !!external;
      if (/[☆★]/.test(short)) { star = true; short = short.replace(/[☆★]/g, "").trim(); }
      if (/[☆★]/.test(name)) { star = true; name = name.replace(/[☆★]/g, "").trim(); }
      const found = findScenario(list, short) || (name && findScenario(list, name));
      if (found) {
        if (note && !found.note) found.note = note;
        if (star) found.external = true;
        if (name && found.name === found.short && name !== short) found.name = name;
      } else {
        list.push({ name: name || short, short, external: star, group: NO_OFFICIAL, note, aliases: [short, name].filter(Boolean), pcs: [] });
      }
    });
  }

  // 探索者の出身シナリオ（略称）から、該当するシナリオに、探索者を付ける。一覧に無ければ、略称だけで追加する
  function attachPcs(list, pcs) {
    pcs.forEach((pc) => {
      if (!pc.scenario) return;
      let scenario = findScenario(list, pc.scenario);
      if (!scenario) {
        scenario = { name: pc.scenario, short: pc.scenario, external: false, group: NO_OFFICIAL, note: "", aliases: [pc.scenario], pcs: [] };
        list.push(scenario);
      }
      scenario.pcs.push(pc);
    });
  }

  // 五十音順：見出し（英語タイトル → あ行 … わ行 → 略称だけのもの）の順に並べる。
  // 見出しの中は、貼りつけた一覧の並び（五十音順に書いてある）のまま。略称だけのものは、略称の五十音順
  function sortScenarios(list) {
    const rank = (g) => { const i = GROUP_ORDER.indexOf(g || NO_OFFICIAL); return i < 0 ? GROUP_ORDER.length : i; };
    const indexed = list.map((s, i) => ({ s, i }));
    indexed.sort((a, b) => rank(a.s.group) - rank(b.s.group)
      || (a.s.group === NO_OFFICIAL || !a.s.group ? a.s.short.localeCompare(b.s.short, "ja") : 0)
      || a.i - b.i);
    return indexed.map((x) => x.s);
  }

  function buildScenarios(pcs) {
    const list = parseScenarioText(SCENARIO_TEXT_DATA);
    mergeScenarioArray(list);
    attachPcs(list, pcs);
    list.forEach((s) => { if (!s.group) s.group = NO_OFFICIAL; });
    return sortScenarios(list);
  }

  /* ============================================================
     3. 表示
  ============================================================ */
  const list = $("sc-list");
  const input = $("sc-search-input");
  const count = $("sc-count");
  let scenarios = [];

  const pcLabel = (pc) => pc.name + (pc.ho ? "（" + pc.ho + "）" : "");

  // 顔の画像（ロストした探索者は、赤いバツ印を重ねる）
  function faceImage(pc, figure) {
    const img = el("img");
    img.src = "images/kao/k-" + pc.img + ".png";
    img.alt = pc.name;
    figure.append(img);
    if (pc.lost) figure.append(el("span", "face-x"));
    return img;
  }

  /* ---------- カーソルを合わせると、出身の探索者の顔が、吹き出しで出る ---------- */
  const pop = el("div", "sc-pop");
  pop.hidden = true;
  pop.setAttribute("aria-hidden", "true");
  document.body.append(pop);
  let popRow = null;

  function showPop(row, scenario) {
    popRow = row;
    pop.textContent = "";
    scenario.pcs.forEach((pc) => {
      const figure = el("figure", "pop-face" + (pc.lost ? " is-lost" : ""));
      faceImage(pc, figure).addEventListener("error", () => figure.classList.add("is-empty"));
      figure.append(el("figcaption", "", pcLabel(pc)));
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
    if (popRow && !popRow.contains(event.target)) hidePop();
  });

  /* ---------- 通過済みシナリオの一覧 ---------- */
  function renderScenarios() {
    const q = norm(input.value);
    list.textContent = "";
    hidePop();

    const hits = scenarios.filter((s) => !q || norm([s.name, s.short, s.note].concat(s.pcs.map(pcLabel)).join(" ")).includes(q));

    let lastGroup = null;
    hits.forEach((s) => {
      if (s.group !== lastGroup) {                                 // 「あ行」などの見出し
        list.append(el("div", "sc-group", s.group));
        lastGroup = s.group;
      }

      const row = el("div", "sc-row" + (s.external ? " is-external" : "") + (s.pcs.length ? " has-pcs" : ""));
      if (s.external) {
        const star = el("span", "sc-star", "★");                     // 外部卓
        star.setAttribute("title", "外部卓");
        row.append(star);
      }

      // 「正式名称：略称」の並び（正式名称が無い時は、略称だけ）
      const title = el("b", "sc-title");
      title.append(el("span", "sc-name", s.name));
      if (s.name !== s.short) title.append(el("span", "sc-short", "：" + s.short));
      row.append(title);

      const box = el("div", "sc-pcs");
      s.pcs.forEach((pc) => box.append(el("span", pc.lost ? "is-lost" : "", pcLabel(pc))));
      if (s.note) box.append(el("p", "sc-note", s.note));
      row.append(box);

      if (s.pcs.length) {
        row.addEventListener("pointerenter", (e) => { if (e.pointerType !== "touch") showPop(row, s); });
        row.addEventListener("pointerleave", (e) => { if (e.pointerType !== "touch") hidePop(); });
        row.addEventListener("click", () => { if (popRow === row) hidePop(); else showPop(row, s); });
      }
      list.append(row);
    });

    if (!hits.length) list.append(el("div", "sc-empty", "見つかりませんでした"));
    count.textContent = hits.length + " / " + scenarios.length + " 件";
  }

  /* ---------- 探索者の総数（総勢）とロストの数 ---------- */
  function renderCounts(pcs, lostInfo) {
    const heading = $("face-heading");
    if (!heading) return;
    // 登録されている探索者に、登録しない人たちの分（EXTRA_*）を足す。探索者が1人増えるごとに、総勢も自動で増える
    const lost = lostInfo ? lostInfo.count + EXTRA_LOST : 13;
    heading.textContent = "総勢：" + (pcs.length + EXTRA_TOTAL) + "　ロスト：" + lost;
  }

  /* ---------- 顔のアイコン：顔が上、名前が下 ---------- */
  function renderFaces(pcs) {
    const grid = $("face-grid");
    if (!grid) return;
    pcs.forEach((pc) => {
      const figure = el("figure", "face" + (pc.lost ? " is-lost" : ""));
      const img = faceImage(pc, figure);
      img.addEventListener("error", () => figure.remove());         // 画像が無い人は、空の枠を出さない
      figure.append(el("figcaption", "", pc.name));
      grid.append(figure);
    });
  }

  input.addEventListener("input", renderScenarios);

  Promise.all([loadPcs(), loadLost()]).then(([pcs, lostInfo]) => {
    markLost(pcs, lostInfo);
    scenarios = buildScenarios(pcs);
    renderScenarios();
    renderCounts(pcs, lostInfo);
    renderFaces(pcs);
  });
})();
