/* 短冊の部屋：キャラクターページ
   データは ../data/investigators.json から読む（名前で探す）。
   左：名前・立ち絵・床の格子（画面の大きさに合わせて配置）／右：履歴書・チャート・プレイヤー・ディスプレイ・説明 */
(() => {
  "use strict";

  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
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
      setText("r-birth", (d && d.birthscenario) || dash);
    });

    step("性別", () => renderGender(d && d.gender));

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

    // チャートの窓が見えたら、ぶわっと広がる
    const win = svg.closest(".win-radar");
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
  const tachieBtn = $("tachie");
  const speech = $("speech");

  // 床：下の辺が広く、奥の辺が狭い台形。左辺の傾き(ALPHA)に、名前の下の辺も合わせる
  const FLOOR = { W: 640, H: 200, topY: 78, inset: 200 };
  const ALPHA = Math.atan2(FLOOR.H - FLOOR.topY, FLOOR.inset);
  const BETA = (14 * Math.PI) / 180;     // 名前の上の辺の傾き（右下がり）

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
  let lastH = 0;

  function layoutStage() {
    const sw = stage.clientWidth || window.innerWidth;
    const sh = stage.clientHeight || Math.round(window.innerHeight * 0.8);
    if (sw === lastW && sh === lastH) return;   // 大きさが変わっていない時（スマホでアドレスバーが動いた時など）は、何もしない
    lastW = sw;
    lastH = sh;

    const cx = sw * 0.38;                                       // 立ち絵と床の中心（右に名前が入る分、少し左寄り）
    const floorW = Math.min(620, sw * 1.3);
    const k = floorW / FLOOR.W;
    const floorH = FLOOR.H * k;
    floor.style.left = cx + "px";
    floor.style.width = floorW + "px";
    floor.style.height = floorH + "px";
    const floorBottom = parseFloat(getComputedStyle(floor).bottom) || 0;

    // 立ち絵：足が床の中ほどに立つ。できるだけ大きく
    const feet = floorBottom + floorH * 0.3;
    tachieBtn.style.left = cx + "px";
    tachieBtn.style.bottom = feet + "px";
    const th = Math.max(120, sh - feet - 8);
    tachieBtn.style.height = th + "px";

    // 名前：縦書き。下の辺は、床の左辺をそのまま延ばした線の上に置く（同じ傾き）
    const text = [...nameEl.textContent.trim()];
    const n = Math.max(1, text.length);
    const fs = Math.min(sh * 0.23, (sh * 0.46) / n, sw * 0.34);
    const rows = Math.max(1, Math.floor((sh * 0.5) / fs));
    const cols = Math.ceil(n / rows);
    const w = cols * fs;
    const h = Math.min(n, rows) * fs;

    // 立ち絵の右うしろに置く（左の端が、立ち絵のうしろに少しかくれる）
    const ratio = tachieImg.naturalWidth && tachieImg.naturalHeight ? tachieImg.naturalWidth / tachieImg.naturalHeight : 0.45;
    const tachieRight = cx + (th * ratio) / 2;
    const floorLeftX = cx - floorW / 2;                         // 床の左のかど
    const bottomLeftX = Math.max(6, Math.min(tachieRight - w * 0.35, sw - w - 6));
    // 名前の下の辺：床の左辺の線の上（床の左のかどから、右上へ同じ傾きで）
    const bottomLeftY = sh - floorBottom - Math.max(0, bottomLeftX - floorLeftX) * Math.tan(ALPHA);

    nameEl.style.fontSize = fs + "px";
    nameEl.style.width = w + "px";
    nameEl.style.height = h + "px";
    nameEl.style.left = bottomLeftX + "px";
    nameEl.style.top = bottomLeftY - h + "px";
    // 1文字の名前など、背が低い時は、右端がつぶれすぎないよう、傾きをゆるめる（背が高い名前は、床の左辺と同じ傾きのまま）
    const tanA = Math.tan(ALPHA);
    const tanB = Math.tan(BETA);
    const soften = Math.min(1, (0.55 * h) / (w * (tanA + tanB)));
    nameEl.style.transform = quadMatrix(
      [[0, 0], [w, 0], [w, h], [0, h]],
      [[0, 0], [w, w * tanB * soften], [w, h - w * tanA * soften], [0, h]]   // 上の辺は右下がり、下の辺は右上がり
    );

    speech.style.left = cx + "px";
    speech.style.top = sh * 0.22 + "px";
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

  tachieBtn.addEventListener("click", () => {
    if (!info.lines.length) return;
    speech.hidden = true;
    void speech.offsetWidth;                         // 続けてタップしても、ポップをやり直す
    speech.textContent = info.lines[spoken++ % info.lines.length];
    speech.hidden = false;

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
