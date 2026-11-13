/* 短冊の部屋：キャラクターページ
   データは ../data/investigators.json から読む（名前で探す）。
   左：名前・立ち絵・床の格子（画面の大きさに合わせて配置）／右：履歴書・チャート・プレイヤー・ディスプレイ・説明 */
(() => {
  "use strict";

  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let slideObserver = null;                    // ウィンドウのスライド（あとから増える窓も、これで出す）。ファイルの先頭で宣言しておく
  const body = document.body;
  const $ = (id) => document.getElementById(id);
  const rand = (min, max) => Math.random() * (max - min) + min;
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const NAME = body.dataset.character;
  const FACE_DIR = body.dataset.faces;
  // 顔アップのファイル名を、自動で探す時の候補（名前が違う時は、HTML の data-face-files に直接書く）
  const FACE_BASES = ["hyo_xiao", "hyo-xiao", "hyo_xiaomao", "hyo-xiaomao", "xiao", "xiaomao"];
  const FACE_SEPS = ["", "_", "-"];

  // 画像を読み込む。見つからない時は、拡張子を変えて順に試す（.png / .PNG / .webp / .jpg …）
  function loadImage(img, src, label) {
    if (!src) return;
    const exts = ["png", "PNG", "webp", "jpg", "jpeg", "gif"];
    const base = src.replace(/\.[A-Za-z0-9]+$/, "");
    const tries = [src].concat(exts.map((e) => base + "." + e)).filter((v, i, a) => a.indexOf(v) === i);
    let i = 0;
    img.onerror = () => {
      i++;
      if (i < tries.length) {
        img.src = tries[i];
      } else {
        img.onerror = null;
        console.warn(label + " の画像が見つかりません: " + src);
      }
    };
    img.src = tries[0];
  }
  document.title = NAME + " | 短冊の部屋";
  const srH1 = document.querySelector("h1.sr-only");
  if (srH1) srH1.textContent = NAME;
  $("tachie-img").alt = NAME + "の立ち絵";
  $("resume-img").alt = NAME + "の写真";
  const dispImg = $("display-img");
  if (dispImg) dispImg.alt = NAME + "のディスプレイ";

  const tachieImg = $("tachie-img");
  loadImage(tachieImg, body.dataset.tatie, "立ち絵");
  loadImage($("resume-img"), body.dataset.photo, "履歴書の写真");
  loadImage($("display-img"), body.dataset.display, "ディスプレイ");
  // ホームから写真が飛んでくる場合は、着いてから貼る（char-transition.js）。そうでなければ、最初から貼ってある
  if (!window.__charFlying) $("resume-photo").classList.add("is-pasted");

  const plain = (s) => String(s || "").replace(/[（(].*?[）)]/g, "").replace(/\s+/g, "");
  const el = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };

  let info = { text: "", lines: [] };

  /* =========================
     データを読み込んで、履歴書などを埋める
  ========================= */
  fetch("../data/investigators.json")
    .then((res) => res.json())
    .then((list) => {
      const found = list.find((e) => e && e.data && plain(e.data.name) === plain(NAME));
      fill(found ? found.data : null);
    })
    .catch((err) => {
      console.error("探索者データを読み込めませんでした:", err);
      fill(null);
    });

  // 性別：「男・女」と、その下の「その他」のうち、当てはまるものを丸で囲む（男・女以外は「その他」）
  function renderGender(value) {
    const box = $("r-gender");
    const g = String(value || "").trim();
    const pick = /^男/.test(g) ? "男" : /^女/.test(g) ? "女" : g ? "その他" : "";
    const mark = (label) => (label === pick ? el("span", "gm", label) : document.createTextNode(label));
    box.textContent = "";
    const line1 = el("span", "gl");
    line1.append(mark("男"), "・", mark("女"));
    const line2 = el("span", "gl");
    line2.append(mark("その他"));
    box.append(line1, line2);
  }

  // 欄が無い（HTMLとJSの版がずれている）時や、どこかの欄でエラーが出た時も、ほかの欄は表示するようにする
  const setText = (id, text) => {
    const node = $(id);
    if (node) node.textContent = text;
  };
  const step = (label, fn) => {
    try {
      fn();
    } catch (e) {
      console.error(label + " でエラー:", e);
    }
  };

  // ホームの探索者一覧（index.html）から、この探索者の HO を探す
  async function findHo() {
    try {
      const res = await fetch("../index.html");
      if (!res.ok) return "";
      const text = await res.text();
      for (const m of text.matchAll(/\["(\d+)", "([^"]*)", "([^"]*)", "([^"]*)", "([^"]*)"(?:, "x")?\]/g)) {
        if (plain(m[2]) === plain(NAME)) return m[5];
      }
    } catch (e) { /* 何もしない */ }
    return "";
  }

  function fill(d) {
    const dash = "—";

    // ひとこと・説明は最初に決める（ほかの欄で何かあっても、しゃべる・説明は動くように）
    info = { text: (d && d.information) || "", lines: d ? [].concat(d.hitokoto || []).filter(Boolean) : [] };
    step("説明", () => {
      setText("info-ghost", info.text);      // 見えない全文：窓の大きさを、最初から全文に合わせて固定する
      setupTyping();
    });

    step("基本の欄", () => {
      const rawName = d ? String(d.name).replace(/[（(].*?[）)]/g, "").trim() : NAME;
      const yomi = d && /[（(](.*?)[）)]/.exec(String(d.name));
      setText("r-name", rawName);
      setText("r-yomi", yomi ? yomi[1] : dash);
      const age = d && d.age;
      setText("r-age", /^\d+$/.test(String(age || "")) ? age + " 歳" : age || dash);
      const height = d && d.height !== undefined && d.height !== null ? String(d.height).trim() : "";
      setText("r-height", height ? (/cm$/i.test(height) ? height : height + "cm") : dash);          // 最後は必ず cm
      setText("r-job", (d && (d.job || d.syokugyo)) || body.dataset.job || dash);                     // 職業
      setText("r-drawn", (d && d.drawn) || body.dataset.drawn || dash);                              // 描いた日（例：2023.11）
      // 出身シナリオ名の横に、（HO名）。HOは、データの ho／HO、<body> の data-ho、ホームの一覧の順で探す
      const birth = (d && d.birthscenario) || "";
      const hoNow = (d && (d.ho || d.HO)) || body.dataset.ho || "";
      setText("r-birth", birth ? birth + (hoNow ? "（" + hoNow + "）" : "") : dash);
      if (birth && !hoNow) {
        findHo().then((ho) => { if (ho) setText("r-birth", birth + "（" + ho + "）"); });
      }
    });

    step("性別", () => renderGender(d ? d.gender || d.sex || d["性別"] || d.seibetsu || body.dataset.gender : body.dataset.gender));

    // 通過シナリオ（配列でも、1つの文字列でも）
    step("通過シナリオ", () => {
      const go = d ? [].concat(d.GOscenario || []).filter(Boolean) : [];
      const list = $("r-go");
      if (!list) return;
      const rows = Math.max(5, go.length);                       // 履歴書の欄のように、空の罫線の行も並べる
      for (let i = 0; i < rows; i++) {
        const li = el("li", i < go.length ? "" : "is-blank");
        li.append(el("span", "", i < go.length ? String(go[i]).trim() : ""));
        list.append(li);
      }
    });

    // 能力値（技能値と SAN は載せない）
    const params = (d && d.params) || [];
    step("能力値", () => {
      const grid = $("r-statgrid");
      if (!grid) return;
      const status = ((d && d.status) || []).filter((s) => s.label !== "SAN");
      params.concat(status).forEach((p) => {
        const cell = el("div");
        cell.append(el("b", "", p.label), " " + p.value);
        grid.append(cell);
      });
    });
    step("チャート", () => drawRadar(params, d && Number(d.edition)));
  }

  /* =========================
     ④ STR〜INT のチャート（最大値18。18を超えた分は、チャートの外にはみ出す）
  ========================= */
  function drawRadar(params, edition) {
    const svg = $("radar");
    if (!svg) return;
    const KEYS = ["STR", "CON", "POW", "DEX", "APP", "SIZ", "INT"];
    const MAX = 18;
    const R = 80;
    const N = KEYS.length;
    const NS = "http://www.w3.org/2000/svg";
    const group = (cls) => {
      const g = document.createElementNS(NS, "g");
      g.setAttribute("class", cls);
      svg.append(g);
      return g;
    };
    const make = (parent, tag, attrs) => {
      const node = document.createElementNS(NS, tag);
      Object.entries(attrs).forEach(([k, v]) => node.setAttribute(k, v));
      parent.append(node);
      return node;
    };
    const point = (i, r) => [Math.sin((2 * Math.PI * i) / N) * r, -Math.cos((2 * Math.PI * i) / N) * r];
    const poly = (r) => KEYS.map((_, i) => point(i, r).map((n) => n.toFixed(1)).join(",")).join(" ");

    const grid = group("radar-grid");
    [1 / 3, 2 / 3, 1].forEach((k) => make(grid, "polygon", { points: poly(R * k), fill: "none", stroke: "#9aa7ff", "stroke-width": 1 }));

    const axes = group("radar-axes");
    KEYS.forEach((_, i) => {
      const [x, y] = point(i, R);
      make(axes, "line", { x1: 0, y1: 0, x2: x, y2: y, stroke: "#111", "stroke-width": 1.5 });
    });

    // 7版の能力値は5倍になっているので、6版と同じ目盛りに戻す
    const scale = edition === 7 ? 5 : 1;
    const values = KEYS.map((k) => {
      const p = params.find((q) => q.label === k);
      return Math.max(0, Number(p ? p.value : 0) / scale / MAX);      // 1を超えたら、外にはみ出す
    });
    const data = group("radar-data");
    make(data, "polygon", { points: values.map((v, i) => point(i, R * v).map((n) => n.toFixed(1)).join(",")).join(" "), fill: "rgba(255,230,0,0.75)", stroke: "#111", "stroke-width": 2 });

    const labels = group("radar-labels");
    KEYS.forEach((k, i) => {
      const [x, y] = point(i, R + 15);
      const t = make(labels, "text", { x, y: y + 4, "text-anchor": "middle", "font-size": 12, "font-family": "Courier New, monospace", fill: "#0047ff" });
      t.textContent = k;
    });

    // チャートの窓が見えたら、ぶわっと広がる。窓の×を押すと、もう一度広がる
    const win = svg.closest(".win-radar");
    if (win) {
      const again = document.createElement("button");
      again.type = "button";
      again.className = "win-x";
      again.setAttribute("aria-label", "チャートをもう一度広げる");
      again.addEventListener("click", () => {
        win.classList.remove("is-bloom");
        void win.offsetWidth;
        win.classList.add("is-bloom");
      });
      win.append(again);
    }
    if (win && "IntersectionObserver" in window) {
      const io = new IntersectionObserver((entries) => {
        if (!entries[0].isIntersecting) return;
        io.disconnect();
        win.classList.add("is-bloom");
      }, { threshold: 0.35 });
      io.observe(win);
    } else if (win) {
      win.classList.add("is-bloom");
    }
  }

  /* =========================
     左：名前・立ち絵・床の格子
  ========================= */
  const stage = $("stage");
  const floor = $("stage-floor");
  const nameEl = $("stage-name");
  nameEl.textContent = NAME.replace(/\s+/g, "");           // 大きい名前（data-character から入る）
  const tachieBtn = $("tachie");
  const speech = $("speech");

  // 床：下の辺が広く、奥の辺が狭い台形。左辺の傾き(ALPHA)に、名前の下の辺も合わせる
  const FLOOR = { W: 640, H: 200, topY: 78, inset: 200 };
  const ALPHA = Math.atan2(FLOOR.H - FLOOR.topY, FLOOR.inset);
  const TACHIE_LIMIT = 0.86;             // 立ち絵の高さの上限：画面に入る最大の高さに対する割合（小さくすると、立ち絵も小さくなる）

  function buildFloor() {
    const NS = "http://www.w3.org/2000/svg";
    const make = (parent, tag, attrs) => {
      const node = document.createElementNS(NS, tag);
      Object.entries(attrs).forEach(([k, v]) => node.setAttribute(k, v));
      parent.append(node);
      return node;
    };
    const { W, H, topY, inset } = FLOOR;
    floor.setAttribute("viewBox", "0 0 " + W + " " + H);

    // ぼかし・奥ほど薄くなるマスク
    const defs = make(floor, "defs", {});
    const blur = make(defs, "filter", { id: "floor-blur", x: "-5%", y: "-10%", width: "110%", height: "120%" });
    make(blur, "feGaussianBlur", { stdDeviation: 2.6 });
    const gradient = (id, stops) => {
      const g = make(defs, "linearGradient", { id, x1: 0, y1: 0, x2: 0, y2: 1 });
      stops.forEach(([offset, opacity]) => make(g, "stop", { offset, "stop-color": "#fff", "stop-opacity": opacity }));
    };
    gradient("floor-g-far", [[0, 1], [0.6, 0]]);
    gradient("floor-g-near", [[0.3, 0], [0.75, 1]]);
    ["far", "near"].forEach((id) => {
      const mask = make(defs, "mask", { id: "floor-m-" + id });
      make(mask, "rect", { width: W, height: H, fill: "url(#floor-g-" + id + ")" });
    });

    const draw = (group) => {
      make(group, "polygon", { points: [[0, H], [W, H], [W - inset, topY], [inset, topY]].map((p) => p.join(",")).join(" "), fill: "rgba(255,255,255,0.16)" });
      const line = (x1, y1, x2, y2) => make(group, "line", { x1, y1, x2, y2, stroke: "#3a4cff", "stroke-width": 2.2, "stroke-opacity": 0.85 });
      for (let k = 0; k <= 10; k++) line((W * k) / 10, H, inset + ((W - 2 * inset) * k) / 10, topY);   // 奥へ伸びる線（k=0 が左辺）
      for (let i = 0; i <= 7; i++) {
        const y = topY + (H - topY) * Math.pow(i / 7, 1.7);                                         // 手前ほど間隔が広い横の線
        const x = inset * (1 - (y - topY) / (H - topY));
        line(x, y, W - x, y);
      }
    };
    draw(make(floor, "g", { mask: "url(#floor-m-far)", filter: "url(#floor-blur)" }));
    draw(make(floor, "g", { mask: "url(#floor-m-near)" }));
  }

  // 4つの点を、別の4つの点に移す変形（matrix3d）。名前の文字を、上下を斜めにした形にするために使う
  function quadMatrix(src, dst) {
    const A = [];
    const b = [];
    for (let i = 0; i < 4; i++) {
      const [x, y] = src[i];
      const [X, Y] = dst[i];
      A.push([x, y, 1, 0, 0, 0, -x * X, -y * X]);
      b.push(X);
      A.push([0, 0, 0, x, y, 1, -x * Y, -y * Y]);
      b.push(Y);
    }
    for (let c = 0; c < 8; c++) {                       // 連立方程式を解く
      let p = c;
      for (let r = c + 1; r < 8; r++) if (Math.abs(A[r][c]) > Math.abs(A[p][c])) p = r;
      [A[c], A[p]] = [A[p], A[c]];
      [b[c], b[p]] = [b[p], b[c]];
      for (let r = 0; r < 8; r++) {
        if (r === c) continue;
        const f = A[r][c] / A[c][c];
        for (let k = c; k < 8; k++) A[r][k] -= f * A[c][k];
        b[r] -= f * b[c];
      }
    }
    const h = b.map((v, i) => v / A[i][i]);            // h11 h12 h13 h21 h22 h23 h31 h32
    return "matrix3d(" + [h[0], h[3], 0, h[6], h[1], h[4], 0, h[7], 0, 0, 1, 0, h[2], h[5], 0, 1].join(",") + ")";
  }

  let lastW = 0;
  const metrics = { cx: 0, tachieTop: 0 };
  let lastH = 0;

  function layoutStage() {
    const sw = stage.clientWidth || window.innerWidth;
    const sh = stage.clientHeight || Math.round(window.innerHeight * 0.8);
    if (sw === lastW && sh === lastH) return;   // 大きさが変わっていない時（スマホでアドレスバーが動いた時など）は、何もしない
    lastW = sw;
    lastH = sh;

    const cx = sw * 0.38;                                       // 立ち絵と床の中心（右に名前が入る分、少し左寄り）
    const floorW = Math.min(620, sw - 8);                       // 床は、ステージの幅の中に収める（左下が切れないように）
    const k = floorW / FLOOR.W;
    const floorH = FLOOR.H * k;
    const floorCx = Math.max(floorW / 2 + 4, Math.min(cx, sw - floorW / 2 - 4));   // 床の中心：ステージの中に収まる位置
    floor.style.left = floorCx + "px";
    floor.style.width = floorW + "px";
    floor.style.height = floorH + "px";
    const floorBottom = parseFloat(getComputedStyle(floor).bottom) || 0;

    // 立ち絵：足が床の中ほどに立つ。高さの上限（th）を決めて、どんな立ち絵も、縦横の比率を変えずに、その高さに合わせて表示する
    // （横長で画面の幅に入らない時だけ、比率を保ったまま小さくする）。上限は、画面に入る最大の高さの 86%
    const feet = floorBottom + floorH * 0.3;
    const th = Math.max(120, (sh - feet - 8) * TACHIE_LIMIT);
    const ratio = tachieImg.naturalWidth && tachieImg.naturalHeight ? tachieImg.naturalWidth / tachieImg.naturalHeight : 0.45;
    const shownH = Math.min(th, (sw * 0.92) / ratio);
    tachieBtn.style.left = cx + "px";
    tachieBtn.style.bottom = feet + "px";
    tachieBtn.style.height = shownH + "px";

    // 名前：縦書き。立ち絵の右うしろ。左辺は立ち絵の高さの上限（th）の 1/2、右辺は th（右がひろがる形）。文字は、その形に合わせて縦に伸びる
    const text = [...nameEl.textContent.trim()];
    const n = Math.max(1, text.length);
    const fs = Math.min(sh * 0.23, (sh * 0.46) / n, sw * 0.34);
    const rows = Math.max(1, Math.floor((sh * 0.5) / fs));
    const cols = Math.ceil(n / rows);
    const w = cols * fs;
    const h0 = Math.min(n, rows) * fs;                          // 文字が並ぶ、もとの高さ

    // 左辺は、床の格子の右奥の角にそろえる（立ち絵が変わっても動かない）。左辺の下の端が、その角の高さに来る。
    // 右辺の下の端が画面の下から出る時は、その分だけ上げる
    const cornerX = floorCx - floorW / 2 + (FLOOR.W - FLOOR.inset) * k;
    const left = Math.max(6, Math.min(cornerX, sw - w - 6));
    const nameTop = sh - feet - shownH / 2 - th / 2;             // 名前の高さの中心 = 立ち絵の高さの中心

    nameEl.style.fontSize = fs + "px";
    nameEl.style.width = w + "px";
    nameEl.style.height = h0 + "px";
    nameEl.style.left = left + "px";
    nameEl.style.top = nameTop + "px";
    nameEl.style.transform = quadMatrix(
      [[0, 0], [w, 0], [w, h0], [0, h0]],
      [[0, th / 4], [w, 0], [w, th], [0, (th * 3) / 4]]         // 左辺：th/2（上下の真ん中にそろえる）、右辺：th
    );

    metrics.cx = cx;                                            // 吹き出しを、立ち絵の上に出すための位置
    metrics.tachieTop = sh - feet - shownH;
  }

  buildFloor();
  layoutStage();
  if ("ResizeObserver" in window) new ResizeObserver(layoutStage).observe(stage);   // 大きさが決まった時・変わった時に、配置しなおす
  window.addEventListener("load", layoutStage);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(layoutStage);
  let resizeTimer = null;
  window.addEventListener("resize", () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(layoutStage, 150); });

  /* =========================
     全身立ち絵の差分（t_○○.png、t_○○2.png、t_○○3.png … があれば、ボタンで切り替える）
  ========================= */
  const switchBox = $("tachie-switch");
  let tachieList = [body.dataset.tatie];
  let tachieNow = 0;

  tachieImg.addEventListener("load", () => { lastW = 0; layoutStage(); });     // 立ち絵の幅が分かったら、名前の位置を決めなおす

  function switchTachie(i) {
    if (i === tachieNow || !tachieList[i]) return;
    tachieNow = i;
    switchBox.querySelectorAll("button").forEach((b, k) => b.setAttribute("aria-pressed", String(k === i)));
    tachieBtn.classList.add("is-switching");
    setTimeout(() => {
      const probe = new Image();
      probe.onload = probe.onerror = () => {
        tachieImg.src = tachieList[i];
        tachieBtn.classList.remove("is-switching");
      };
      probe.src = tachieList[i];
    }, reduce ? 0 : 180);
  }

  async function setupTachieVariants() {
    const m = /^(.*?)(\.[A-Za-z0-9]+)$/.exec(body.dataset.tatie || "");
    if (!m) return;
    let misses = 0;
    for (let n = 2; n <= 20; n++) {
      const url = m[1] + n + m[2];
      if (await exists(url)) {
        tachieList.push(url);
        misses = 0;
      } else if (++misses >= 2) {
        break;
      }
    }
    if (tachieList.length < 2) return;                       // 差分が無い時は、ボタンを出さない

    const labels = (body.dataset.tatieLabels || "").split(",").map((s) => s.trim());
    tachieList.forEach((_, i) => {
      const button = el("button", "", labels[i] || (i === 0 ? "通常" : "差分" + (i + 1)));
      button.type = "button";
      button.setAttribute("aria-pressed", String(i === 0));
      button.addEventListener("click", () => switchTachie(i));
      switchBox.append(button);
    });
    switchBox.hidden = false;
  }
  setupTachieVariants();

  /* =========================
     ⑥ 立ち絵をタップすると、ひとこと話す
  ========================= */
  let spoken = 0;
  let hideTimer = null;

  // 吹き出し：ドット絵の枠（角は階段状、しっぽは右下に向かう）。文字の大きさに合わせて、ドットの数を決めて描く
  const DOT = 5;                                    // ドット1つの大きさ（px）
  function drawSpeech(text) {
    speech.textContent = "";
    speech.hidden = false;
    speech.style.visibility = "hidden";

    // 文字の大きさは、吹き出しとは別の場所で、先に測る（最初のタップで、まだ大きさの決まっていない吹き出しの幅に引っぱられて、縦長にならないように）
    const probe = el("span", "sp-text sp-probe", text);
    probe.style.maxWidth = Math.max(200, Math.min(340, stage.clientWidth - 24)) + "px";
    document.body.append(probe);
    const textW = Math.ceil(probe.offsetWidth);
    const textH = Math.ceil(probe.offsetHeight);
    probe.remove();
    const label = el("span", "sp-text", text);
    const cols = Math.max(24, Math.ceil(textW / DOT) + 6);
    const rows = Math.max(7, Math.ceil(textH / DOT) + 4);

    // 黒い枠のドットと、白い中身のドットを、場所で数えて決める
    const black = new Set();
    const white = new Set();
    const put = (set, x, y) => set.add(x + "," + y);
    const tail = 4;                                 // しっぽの、いちばん左の壁の場所（吹き出しの左側）
    for (let y = 0; y < rows; y++) {
      const cut = y === 0 || y === rows - 1 ? 3 : y === 1 || y === rows - 2 ? 2 : y === 2 || y === rows - 3 ? 1 : 0;   // 角を階段状に欠く
      for (let x = cut; x < cols - cut; x++) put(white, x, y);
      if (y === 0 || y === rows - 1) {
        for (let x = 3; x <= cols - 4; x++) {
          if (y === rows - 1 && x > tail && x < tail + 4) continue;                                                   // しっぽの口
          put(black, x, y);
        }
      } else {
        put(black, cut, y);
        put(black, cols - 1 - cut, y);
      }
    }
    // しっぽ：右下に向かって、1段ごとに1ドットずつ右へずれる
    const down = rows;
    for (let r = 0; r < 2; r++) {
      put(black, tail + r, down + r);
      put(black, tail + 4 + r, down + r);
      for (let x = tail + 1 + r; x <= tail + 3 + r; x++) put(white, x, down + r);
    }
    for (let x = tail + 2; x <= tail + 6; x++) put(black, x, down + 2);

    const NS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("viewBox", "0 0 " + cols + " " + (rows + 3));
    svg.setAttribute("width", cols * DOT);
    svg.setAttribute("height", (rows + 3) * DOT);
    svg.setAttribute("shape-rendering", "crispEdges");
    const fillPath = (set, color) => {
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
    fillPath(white, "#fff");
    fillPath(black, "#111");

    speech.textContent = "";
    svg.classList.add("sp-bg");
    label.style.width = textW + "px";
    label.style.left = 3 * DOT + "px";
    label.style.top = (rows * DOT - textH) / 2 + "px";
    speech.append(svg, label);
    speech.style.width = cols * DOT + "px";
    speech.style.height = (rows + 3) * DOT + "px";

    // 立ち絵の上に出す。しっぽの先が、立ち絵の頭のあたりに来る
    const tipX = (tail + 4.5) * DOT;
    speech.style.left = Math.max(4, Math.min(metrics.cx - tipX, stage.clientWidth - cols * DOT - 4)) + "px";
    speech.style.top = Math.max(4, metrics.tachieTop - (rows + 3) * DOT + 2 * DOT) + "px";
    speech.style.visibility = "";
  }

  tachieBtn.addEventListener("click", () => {
    if (!info.lines.length) return;
    speech.hidden = true;
    void speech.offsetWidth;                         // 続けてタップしても、ポップをやり直す
    drawSpeech(info.lines[spoken++ % info.lines.length]);

    if (!reduce) {
      tachieBtn.classList.remove("is-poyon");
      void tachieBtn.offsetWidth;
      tachieBtn.classList.add("is-poyon");
      tachieBtn.addEventListener("animationend", function done(e) {
        if (e.target !== tachieBtn) return;
        tachieBtn.classList.remove("is-poyon");
        tachieBtn.removeEventListener("animationend", done);
      });
    }
    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => { speech.hidden = true; }, 3500);
  });

  /* =========================
     ⑦ 顔アップ（音楽プレイヤー風）
  ========================= */
  const faceImg = $("face-img");
  const faceCount = $("face-count");
  const faceEmpty = $("face-empty");
  const faceBar = $("face-progress");
  const playBtn = $("pl-play");
  let faces = [];
  let index = 0;
  let playing = false;
  let playTimer = null;

  async function exists(url) {
    try {
      return (await fetch(url, { method: "HEAD" })).ok;
    } catch (e) {
      return new Promise((resolve) => {
        const probe = new Image();
        probe.onload = () => resolve(true);
        probe.onerror = () => resolve(false);
        probe.src = url;
      });
    }
  }

  // GitHub Pages のサイトなら、フォルダの中のファイルの一覧を GitHub から取得できる（名前の付け方が分からなくても見つかる）
  async function listFolder(dirUrl) {
    try {
      if (!/\.github\.io$/.test(location.hostname)) return [];
      const owner = location.hostname.split(".")[0];
      const parts = new URL(dirUrl, location.href).pathname.split("/").filter(Boolean);   // 例：["tanzaku", "images", "hyojyo", "hyo_xiao"]
      const repo = parts.shift();
      const res = await fetch("https://api.github.com/repos/" + owner + "/" + repo + "/contents/" + parts.join("/"));
      if (!res.ok) return [];
      return (await res.json())
        .filter((item) => item.type === "file" && /\.(png|jpe?g|webp|gif)$/i.test(item.name))
        .map((item) => item.name)
        .sort((a, b) => a.localeCompare(b, "ja", { numeric: true }));
    } catch (e) {
      return [];
    }
  }

  async function findFaces() {
    // ファイル名を直接書いてある時は、その順に使う
    const listed = (body.dataset.faceFiles || "").split(",").map((s) => s.trim()).filter(Boolean);
    if (listed.length) return listed.map((name) => FACE_DIR + name);

    // 名前の付け方の候補を全部、最初の数枚だけ同時に確かめる
    const patterns = [];
    ["png", "jpg", "jpeg", "webp"].forEach((ext) => {        // 1.png, 2.png, 3.png … のような、数字だけの名前
      patterns.push("{n}." + ext);
      patterns.push("{nn}." + ext);
    });
    FACE_BASES.forEach((base) => FACE_SEPS.forEach((sep) => {
      patterns.push(base + sep + "{n}.png");
      patterns.push(base + sep + "{nn}.png");
    }));
    const nameOf = (pattern, n) => pattern.replace("{nn}", String(n).padStart(2, "0")).replace("{n}", n);

    const firstHit = await Promise.all(patterns.map(async (pattern) => {
      for (const n of [1, 0, 2]) if (await exists(FACE_DIR + nameOf(pattern, n))) return n;
      return -1;
    }));
    const found = firstHit.findIndex((n) => n >= 0);
    if (found < 0) return (await listFolder(FACE_DIR)).map((name) => FACE_DIR + name);   // 付け方が分からない時は、フォルダの中身を調べる

    // 見つかった付け方で、続きの番号を順に探す（欠番は2つまで許容）
    const result = [];
    let misses = 0;
    for (let n = 0; n <= 80; n++) {
      if (await exists(FACE_DIR + nameOf(patterns[found], n))) {
        result.push(FACE_DIR + nameOf(patterns[found], n));
        misses = 0;
      } else if (result.length && ++misses >= 3) {
        break;
      }
    }
    return result;
  }

  function showFace(i) {
    if (!faces.length) return;
    index = (i + faces.length) % faces.length;
    faceImg.src = faces[index];
    faceCount.textContent = index + 1 + " / " + faces.length;
    faceBar.style.width = ((index + 1) / faces.length) * 100 + "%";
  }

  function setPlaying(on) {
    playing = on;
    clearInterval(playTimer);
    playBtn.textContent = on ? "❚❚" : "▶";
    playBtn.setAttribute("aria-pressed", String(on));
    if (on) playTimer = setInterval(() => showFace(index + 1), 1600);
  }

  $("pl-first").addEventListener("click", () => showFace(0));
  $("pl-prev").addEventListener("click", () => showFace(index - 1));
  $("pl-next").addEventListener("click", () => showFace(index + 1));
  $("pl-last").addEventListener("click", () => showFace(faces.length - 1));
  playBtn.addEventListener("click", () => setPlaying(!playing));
  faceImg.addEventListener("click", () => showFace(index + 1));

  findFaces().then((list) => {
    faces = list;
    if (!faces.length) {
      faceImg.hidden = true;
      faceEmpty.hidden = false;
      faceEmpty.textContent = "表情の画像が見つかりません\n" + FACE_DIR;
      faceEmpty.style.whiteSpace = "pre-line";
      console.warn("顔アップの画像が見つかりません。" + FACE_DIR + " の中のファイル名を、character01.html の data-face-files に、カンマ区切りで書いてください。例：data-face-files=\"a.png,b.png\"");
      return;
    }
    showFace(0);
  });

  /* =========================
     ⑧ 説明：見えた瞬間にタイピングされる（窓の大きさは、見えない全文で最初から決まっている）
  ========================= */
  function setupTyping() {
    const target = $("info-text");
    const win = $("win-info");
    if (!target || !win) return;
    if (reduce) {
      target.textContent = info.text;
      return;
    }
    const io = new IntersectionObserver(async (entries) => {
      if (!entries[0].isIntersecting) return;
      io.disconnect();
      for (let i = 1; i <= info.text.length; i++) {
        target.textContent = info.text.slice(0, i);
        await wait(rand(18, 42));
      }
    }, { threshold: 0.35 });
    io.observe(win);
  }

  /* =========================
     ⑩ 後ろのウィンドウ：前のウィンドウよりゆっくり動く
  ========================= */
  const right = $("char-right");
  const back = $("back-windows");
  const SPEED = 0.4;     // 前のウィンドウの動きのうち、打ち消す割合（0.4 → 後ろは0.6倍の速さで動く）

  function buildBack() {
    back.textContent = "";
    const docH = right.offsetHeight;
    const extra = Math.max(0, docH - window.innerHeight) * SPEED;
    back.style.top = -extra + "px";
    back.style.height = docH + extra + "px";

    const count = Math.max(4, Math.round((docH + extra) / 380));
    for (let i = 0; i < count; i++) {
      const win = el("div", "back-win");
      win.style.width = rand(220, 380) + "px";
      win.style.height = rand(170, 300) + "px";
      win.style.left = rand(-4, 50) + "%";
      win.style.top = ((i + rand(0, 0.6)) / count) * (docH + extra) + "px";
      back.append(win);
    }
    onScroll();
  }

  function onScroll() {
    back.style.transform = "translate3d(0," + window.scrollY * SPEED + "px,0)";
  }

  let backW = window.innerWidth;
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", () => {
    if (window.innerWidth === backW) return;      // スマホでアドレスバーが動いただけの時は、作り直さない
    backW = window.innerWidth;
    buildBack();
  });
  window.addEventListener("load", buildBack);
  buildBack();

  /* =========================
     ウィンドウが、下（波の中）からスライドして表示される
  ========================= */
  if (!reduce && "IntersectionObserver" in window) {
    document.documentElement.classList.add("js-slide");
    slideObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-in");
        slideObserver.unobserve(entry.target);
      });
    }, { threshold: 0.08 });
    document.querySelectorAll(".char-win").forEach((win) => slideObserver.observe(win));
  }

  /* =========================
     ファンアート（FA.exe）
     data-fa="kaki_xiao" なら、images/kaitemorota/ の kaki_xiao1.png、kaki_xiao2.png … を探して、
     ディスプレイの右横に、1つずつ小さく出す（5秒ごとに切り替わる）。クリックすると、大きく表示される
  ========================= */
  const FA_DIR = body.dataset.faDir || "../images/kaitemorota/";
  const FA_PREFIX = body.dataset.fa || "";

  async function findFanart() {
    if (!FA_PREFIX) return [];
    const escaped = FA_PREFIX.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pattern = new RegExp("^" + escaped + "\\d+\\.[a-z0-9]+$", "i");              // 例：kaki_xiao1.png（kaki_xiaoyu1.png は含めない）
    const names = (await listFolder(FA_DIR)).filter((name) => pattern.test(name));
    if (names.length) return names.map((name) => FA_DIR + name);                       // GitHub Pages なら、フォルダの一覧から（拡張子は何でもよい）
    const found = [];                                                                  // 一覧を取れない時は、番号を順に確かめる（.png）
    let misses = 0;
    for (let n = 1; n <= 60; n++) {
      const url = FA_DIR + FA_PREFIX + n + ".png";
      if (await exists(url)) { found.push(url); misses = 0; } else if (++misses >= 2) break;
    }
    return found;
  }

  // 大きく表示（ギャラリーの拡大表示と同じ見た目）。ディスプレイ・ファンアートで使う
  function openViewer(files, start, title) {
    let box = document.getElementById("fa-viewer");
    if (!box) {
      box = el("div", "lightbox");
      box.id = "fa-viewer";
      box.hidden = true;
      const win = el("div", "lightbox-window");
      win.setAttribute("role", "dialog");
      win.setAttribute("aria-modal", "true");
      const close = el("button", "lightbox-close");
      close.type = "button";
      close.setAttribute("aria-label", "閉じる");
      const big = el("img");
      const bar = el("div", "lightbox-bar");
      const prev = el("button", "", "◀");
      prev.type = "button";
      const cap = el("span", "");
      cap.id = "fa-viewer-cap";
      const next = el("button", "", "▶");
      next.type = "button";
      bar.append(prev, cap, next);
      win.append(close, big, bar);
      box.append(win);
      document.body.append(box);

      box._win = win;
      box._bar = bar;
      box._i = 0;
      box._show = (n) => {
        box._i = (n + box._files.length) % box._files.length;
        big.src = box._files[box._i];
        cap.textContent = box._files.length > 1 ? box._i + 1 + " / " + box._files.length : "";
      };
      const closeIt = () => { box.hidden = true; };
      close.addEventListener("click", closeIt);
      prev.addEventListener("click", () => box._show(box._i - 1));
      next.addEventListener("click", () => box._show(box._i + 1));
      box.addEventListener("click", (e) => { if (e.target === box) closeIt(); });
      document.addEventListener("keydown", (e) => {
        if (box.hidden) return;
        if (e.key === "Escape") closeIt();
        if (e.key === "ArrowLeft") box._show(box._i - 1);
        if (e.key === "ArrowRight") box._show(box._i + 1);
      });
    }
    box._files = files;
    box._win.style.setProperty("--title", '"' + (title || "FA.exe") + '"');
    box._win.setAttribute("aria-label", title === "DISPLAY.exe" ? "ディスプレイの拡大表示" : "ファンアートの拡大表示");
    box._bar.classList.toggle("is-single", files.length < 2);          // 1枚だけの時は、前へ・次へのボタンを隠す
    box._show(start);
    box.hidden = false;
  }

  // ディスプレイは、クリックすると、大きく表示される
  if (dispImg) {
    dispImg.addEventListener("click", () => openViewer([dispImg.currentSrc || dispImg.src], 0, "DISPLAY.exe"));
  }

  // ファンアートが複数ある時は、1枚ずつ別の窓（FA.exe）にして、前の窓の右端に、次の窓の左上が少し重なるように、重ねていく
  async function setupFanart() {
    const stack = $("fa-stack");
    if (!stack) return;
    const files = await findFanart();
    if (!files.length) return;                                   // ファンアートが無いキャラクターには、窓は出ない

    const wins = files.map((url, i) => {
      const win = el("aside", "char-win win-fa");
      win.setAttribute("aria-label", "ファンアート " + (i + 1));
      const button = el("button", "fa-thumb");
      button.type = "button";
      button.setAttribute("aria-label", "ファンアートを大きく表示");
      const img = el("img");
      img.src = url;
      img.alt = NAME + "のファンアート " + (i + 1);
      button.append(img);
      button.addEventListener("click", () => openViewer(files, i, "FA.exe"));
      win.append(button);
      stack.append(win);
      if (slideObserver) slideObserver.observe(win);
      else win.classList.add("is-in");
      return win;
    });

    const STEP_Y = 18;                                           // 重ねるたびに、少しずつ下へ
    const arrange = () => {
      const w = wins[0].offsetWidth || 132;
      const room = stack.clientWidth;
      // 横は、窓の幅から22px引いた分ずつずらす（前の窓の右端に、次の窓の左上が22px重なる）。場所が足りない時は、重なりを増やす
      const step = wins.length > 1 ? Math.max(36, Math.min(w - 22, (room - w) / (wins.length - 1))) : 0;
      wins.forEach((win, i) => {
        win.style.left = i * step + "px";
        win.style.top = i * STEP_Y + "px";
        win.style.zIndex = String(3 + i);
      });
      stack.style.height = (wins.length - 1) * STEP_Y + wins[0].offsetHeight + "px";
    };
    arrange();
    window.addEventListener("resize", arrange);
    window.addEventListener("load", arrange);
  }
  setupFanart();

  /* =========================
     ウィンドウの後ろで、データが下から上へ上っていく
     （この探索者の能力値・名前・シナリオ名と、数字の羅列が、ゆっくり上って、消える）
  ========================= */
  if (!reduce) {
    const layer = el("div", "data-rise");
    layer.setAttribute("aria-hidden", "true");
    document.body.prepend(layer);

    const COLORS = ["rgba(0, 71, 255, 0.5)", "rgba(0, 71, 255, 0.32)", "rgba(255, 0, 200, 0.32)", "rgba(0, 150, 210, 0.45)"];
    // 意味のない文字列：英数字・記号・半角カナを、でたらめに並べる（縦書きで上っていく）
    const CHARS = "0123456789ABCDEFabcdef<>/\\|=+*#%$&@ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ";
    const gibberish = () => Array.from({ length: 6 + Math.floor(Math.random() * 12) }, () => CHARS[Math.floor(Math.random() * CHARS.length)]).join("");

    let active = 0;
    const spawn = () => {
      if (!document.hidden && active < 26) {
        const bit = el("span", "data-bit", gibberish());
        const duration = rand(11, 22);
        bit.style.left = rand(0, 96) + "%";
        bit.style.fontSize = rand(12, 22) + "px";
        bit.style.color = COLORS[Math.floor(Math.random() * COLORS.length)];
        bit.style.setProperty("--dur", duration + "s");
        layer.append(bit);
        bit.style.setProperty("--rise", -(layer.clientHeight + bit.offsetHeight + 40) + "px");     // 縦に長い文字列も、画面の外まで上る
        active++;
        setTimeout(() => { bit.remove(); active--; }, duration * 1000 + 200);
      }
      setTimeout(spawn, rand(300, 700));
    };
    spawn();
  }

  /* =========================
     ページの一番下：波が少し上がって、ほかのキャラクターの顔と名前が、カルーセルで出る（押すと、そのキャラクターのページへ）
  ========================= */
  const waves = document.querySelector(".char-waves");
  const track = $("cc-track");
  let carouselReady = false;

  // ホームの探索者一覧から、番号・名前・画像名を読み込む
  async function loadRows() {
    try {
      const res = await fetch("../index.html");
      if (!res.ok) return [];
      const text = await res.text();
      return [...text.matchAll(/\["(\d+)", "([^"]*)", "([^"]*)", "([^"]*)", "([^"]*)"(?:, "x")?\]/g)]
        .map((m) => ({ no: Number(m[1]), name: m[2], img: m[3] }))
        .sort((a, b) => a.no - b.no);
    } catch (e) {
      return [];
    }
  }

  async function buildCarousel() {
    carouselReady = true;
    const rows = await loadRows();
    if (!rows.length || !track) return;

    const here = /character(\d+)\.html/.exec(location.pathname);
    const hereNo = here ? Number(here[1]) : -1;
    const items = rows.map((r) => {
      const no = String(r.no).padStart(2, "0");
      const a = el("a", "cc-item");
      a.href = "character" + no + ".html";
      const img = el("img");
      img.src = "../images/kao/k-" + r.img + ".png";
      img.alt = "";
      img.loading = "lazy";
      a.append(img, el("span", "", r.name));
      if (r.no === hereNo) {                                     // 今見ているキャラクター
        a.classList.add("is-current");
        a.removeAttribute("href");
        a.setAttribute("aria-current", "page");
      }
      track.append(a);
      return { a, no };
    });

    // ページがまだ無いキャラクターは、「準備中」にして、押せないようにする
    for (let i = 0; i < items.length; i += 8) {
      await Promise.all(items.slice(i, i + 8).map(async ({ a, no }) => {
        if (a.classList.contains("is-current")) return;
        if (!(await exists("character" + no + ".html"))) {
          a.classList.add("is-soon");
          a.removeAttribute("href");
          a.title = "準備中";
        }
      }));
    }
    const current = track.querySelector(".is-current");
    if (current) track.scrollLeft = current.offsetLeft - track.clientWidth / 2 + current.offsetWidth / 2;   // 今のキャラクターを、真ん中に
  }

  // 左右のボタンと、自動で少しずつ進める動き
  if (track) {
    const stepOf = () => { const item = track.querySelector(".cc-item"); return (item ? item.offsetWidth : 84) + 14; };
    const move = (dir) => track.scrollBy({ left: dir * stepOf() * 3, behavior: reduce ? "auto" : "smooth" });
    const prev = $("cc-prev");
    const next = $("cc-next");
    if (prev) prev.addEventListener("click", () => move(-1));
    if (next) next.addEventListener("click", () => move(1));

    let hover = false;
    track.addEventListener("pointerenter", () => { hover = true; });
    track.addEventListener("pointerleave", () => { hover = false; });
    setInterval(() => {
      if (reduce || hover || !waves || !waves.classList.contains("is-up")) return;
      if (track.scrollLeft >= track.scrollWidth - track.clientWidth - 4) track.scrollTo({ left: 0, behavior: "smooth" });
      else track.scrollBy({ left: stepOf(), behavior: "smooth" });
    }, 3500);
  }

  // ページの一番下まで来たら、波が上がる
  const atBottom = () => window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 24;
  const checkBottom = () => {
    const up = atBottom();
    if (waves) waves.classList.toggle("is-up", up);
    document.body.classList.toggle("is-bottom", up);
    if (up && !carouselReady) buildCarousel();
  };
  window.addEventListener("scroll", checkBottom, { passive: true });
  window.addEventListener("resize", checkBottom);
  window.addEventListener("load", checkBottom);

  /* =========================
     右下の、ページの一番上に戻るボタン
  ========================= */
  const toTop = $("to-top");
  if (toTop) {
    const toggle = () => toTop.classList.toggle("is-visible", window.scrollY > 240);   // 少しスクロールしたら出てくる
    window.addEventListener("scroll", toggle, { passive: true });
    toggle();
    toTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" }));
  }
})();