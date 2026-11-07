/* 短冊の部屋：ABOUTページ
   ■ データの整理（上から順に）
      1. 探索者   … { name, img, scenario(出身シナリオの略称), ho, lost }   ホームの探索者一覧 ＋ data/investigators.json のロスト
      2. シナリオ … { name(正式名称), short(略称), external(外部卓), group(あ行など), note, aliases, pcs(出身の探索者) }
                    data/scenarios.json（見出しごと・五十音順）から作り、1 の探索者を付ける
      3. 表示     … 通過済みシナリオの一覧（「正式名称：略称」・検索・五十音順・外部卓の星）
                    シナリオ名か探索者名をクリックすると、探索者の顔が、名前の欄の上に出る／探索者の総数／顔の一覧（ロストは赤いバツ） */
(() => {
  "use strict";

  /* ============================================================
     設定
  ============================================================ */
  // ここに登録しない探索者たちの人数。総勢・ロストの数に、それぞれ足して表示する
  const EXTRA_TOTAL = 19;
  const EXTRA_LOST = 7;

  const NO_OFFICIAL = "略称だけのシナリオ（正式名称がまだありません）";   // data/scenarios.json に無く、ホームの一覧にだけあるシナリオの見出し

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
  // ホームの探索者一覧（index.html）から読み込む
  async function loadPcs() {
    try {
      const res = await fetch("index.html");
      if (!res.ok) throw new Error("index.html を読み込めませんでした");
      const text = await res.text();
      return [...text.matchAll(/\["(\d+)", "([^"]*)", "([^"]*)", "([^"]*)", "([^"]*)"(?:, "x")?\]/g)]
        .map((m) => ({ no: Number(m[1]), name: m[2], img: m[3], scenario: m[4], ho: m[5], lost: false }))
        .sort((a, b) => a.no - b.no);
    } catch (e) {
      console.warn(e);
      return [];
    }
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
  // data/scenarios.json：{ groups: [ { group: "あ行", items: [ { name, short, external, note, aliases } ] } ] }
  async function loadScenarioFile() {
    try {
      const res = await fetch("data/scenarios.json");
      if (!res.ok) throw new Error("data/scenarios.json を読み込めませんでした");
      const data = await res.json();
      const list = [];
      (data.groups || []).forEach((g) => {
        (g.items || []).forEach((item) => {
          const name = String(item.name || "").trim();
          const short = String(item.short || name).trim();
          if (!name) return;
          list.push({
            name,
            short,
            external: !!item.external,
            group: g.group || "",
            note: item.note || "",
            aliases: [short, name].concat(item.aliases || []).filter(Boolean),
            pcs: []
          });
        });
      });
      return list;
    } catch (e) {
      console.error(e);
      return [];
    }
  }

  // 名前（正式名称・略称・別名のどれでも）から、シナリオを探す
  const findScenario = (list, name) => {
    const k = key(name);
    return k ? list.find((s) => s.aliases.some((a) => key(a) === k)) : undefined;
  };

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

  // 五十音順：data/scenarios.json の並び（見出しごとに五十音順）のまま。略称だけのものは、最後に、略称の五十音順
  function sortScenarios(list) {
    const fileOrder = list.filter((s) => s.group !== NO_OFFICIAL);
    const rest = list.filter((s) => s.group === NO_OFFICIAL).sort((a, b) => a.short.localeCompare(b.short, "ja"));
    return fileOrder.concat(rest);
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
  function faceFigure(pc, className) {
    const figure = el("figure", className + (pc.lost ? " is-lost" : ""));
    const img = el("img");
    img.src = "images/kao/k-" + pc.img + ".png";
    img.alt = pc.name;
    img.addEventListener("error", () => figure.classList.add("is-empty"));
    figure.append(img);
    if (pc.lost) figure.append(el("span", "face-x"));
    return figure;
  }

  /* ---------- 通過済みシナリオの一覧 ---------- */
  function renderRow(s) {
    const row = el("div", "sc-row" + (s.external ? " is-external" : "") + (s.pcs.length ? " has-pcs" : ""));
    if (s.external) {
      const star = el("span", "sc-star", "★");                       // 外部卓
      star.setAttribute("title", "外部卓");
      row.append(star);
    }

    // 「正式名称：略称」の並び（略称が無い時は、正式名称だけ）
    const title = el("b", "sc-title");
    title.append(el("span", "sc-name", s.name));
    if (s.name !== s.short) title.append(el("span", "sc-short", "：" + s.short));
    row.append(title);

    // 右側：探索者の名前の欄。その上に、探索者の顔が出る（クリックで出し入れ）
    const box = el("div", "sc-pcs");
    const faces = el("div", "sc-faces");
    faces.hidden = true;
    const chips = el("div", "sc-chips");
    box.append(faces, chips);

    let shown = null;                                                // 顔を出している探索者（"all" = 全員、探索者の名前、null = 出していない）
    const chipOf = new Map();
    const showFaces = (mode) => {
      shown = shown === mode ? null : mode;
      faces.textContent = "";
      const targets = shown === "all" ? s.pcs : s.pcs.filter((pc) => pc.name === shown);
      targets.forEach((pc) => faces.append(faceFigure(pc, "sc-face")));
      faces.hidden = shown === null;
      chipOf.forEach((chip, name) => chip.classList.toggle("is-active", shown === "all" || shown === name));
    };

    s.pcs.forEach((pc) => {
      const chip = el("button", "sc-chip" + (pc.lost ? " is-lost" : ""), pcLabel(pc));
      chip.type = "button";
      chip.addEventListener("click", () => showFaces(pc.name));       // 探索者名をクリック：その探索者の顔
      chipOf.set(pc.name, chip);
      chips.append(chip);
    });
    if (s.note) box.append(el("p", "sc-note", s.note));
    row.append(box);

    if (s.pcs.length) {
      title.classList.add("is-clickable");
      title.tabIndex = 0;
      title.setAttribute("role", "button");
      title.addEventListener("click", () => showFaces("all"));        // シナリオ名をクリック：出身の探索者の顔
      title.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); showFaces("all"); } });
    }
    return row;
  }

  function renderScenarios() {
    const q = norm(input.value);
    list.textContent = "";

    const hits = scenarios.filter((s) => !q || norm([s.name, s.short, s.note].concat(s.pcs.map(pcLabel)).join(" ")).includes(q));

    let lastGroup = null;
    hits.forEach((s) => {
      if (s.group !== lastGroup) {                                    // 「あ行」などの見出し
        list.append(el("div", "sc-group", s.group));
        lastGroup = s.group;
      }
      list.append(renderRow(s));
    });

    if (!hits.length) list.append(el("div", "sc-empty", scenarios.length ? "見つかりませんでした" : "シナリオのデータを読み込めませんでした"));
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
      const figure = faceFigure(pc, "face");
      figure.querySelector("img").addEventListener("error", () => figure.remove());   // 画像が無い人は、空の枠を出さない
      figure.append(el("figcaption", "", pc.name));
      grid.append(figure);
    });
  }

  input.addEventListener("input", renderScenarios);

  Promise.all([loadPcs(), loadLost(), loadScenarioFile()]).then(([pcs, lostInfo, fileScenarios]) => {
    markLost(pcs, lostInfo);
    attachPcs(fileScenarios, pcs);
    scenarios = sortScenarios(fileScenarios);
    renderScenarios();
    renderCounts(pcs, lostInfo);
    renderFaces(pcs);
  });
})();