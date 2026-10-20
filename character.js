/* 短冊の部屋：キャラクターページ
   データは ../data/investigators.json から読む（名前で探す）。
   履歴書・能力値のチャート・立ち絵のひとこと・顔アップのプレイヤー・説明のタイピング・後ろのウィンドウの視差スクロール */
(() => {
  "use strict";

  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const body = document.body;
  const $ = (id) => document.getElementById(id);
  const rand = (min, max) => Math.random() * (max - min) + min;
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const NAME = body.dataset.character;
  const FACE_DIR = body.dataset.faces;
  // 顔アップのファイル名のパターン（{n}=1,2,3… / {nn}=01,02,03…）。名前が違う場合は、ここに足す
  const FACE_PATTERNS = ["hyo_xiao{n}.png", "hyo_xiao_{n}.png", "hyo_xiao{nn}.png", "xiao{n}.png", "{n}.png", "{nn}.png", "hyo{n}.png"];

  $("tachie-img").src = body.dataset.tatie;
  $("resume-img").src = body.dataset.photo;
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

  function fill(d) {
    const dash = "—";
    const rawName = d ? String(d.name).replace(/[（(].*?[）)]/g, "").trim() : NAME;
    const yomi = d && /[（(](.*?)[）)]/.exec(String(d.name));

    $("r-name").textContent = rawName;
    $("r-yomi").textContent = yomi ? yomi[1] : dash;
    $("r-gender").textContent = (d && d.gender) || dash;
    $("r-age").textContent = (d && d.age) || dash;
    $("r-height").textContent = (d && d.height) || dash;
    $("r-birth").textContent = (d && d.birthscenario) || dash;

    // 通過シナリオ（配列でも、1つの文字列でも）
    const go = d ? [].concat(d.GOscenario || []).filter(Boolean) : [];
    const list = $("r-go");
    (go.length ? go : [dash]).forEach((name) => list.append(el("li", "", String(name).trim())));

    // 能力値（技能値は載せない）
    const grid = $("r-statgrid");
    const params = (d && d.params) || [];
    const status = (d && d.status) || [];
    params.concat(status).forEach((p) => {
      const cell = el("div");
      cell.append(el("b", "", p.label), " " + p.value);
      grid.append(cell);
    });
    drawRadar(params, d && Number(d.edition));

    info = { text: (d && d.information) || "", lines: d ? [].concat(d.hitokoto || []).filter(Boolean) : [] };
    setupTyping();
  }

  /* =========================
     ④ STR〜INT のフローチャート（レーダーチャート）
  ========================= */
  function drawRadar(params, edition) {
    const svg = $("radar");
    const KEYS = ["STR", "CON", "POW", "DEX", "APP", "SIZ", "INT"];
    const max = edition === 7 ? 90 : 18;
    const R = 80;
    const N = KEYS.length;
    const NS = "http://www.w3.org/2000/svg";
    const make = (tag, attrs) => {
      const node = document.createElementNS(NS, tag);
      Object.entries(attrs).forEach(([k, v]) => node.setAttribute(k, v));
      svg.append(node);
      return node;
    };
    const point = (i, r) => [Math.sin((2 * Math.PI * i) / N) * r, -Math.cos((2 * Math.PI * i) / N) * r];
    const poly = (r) => KEYS.map((_, i) => point(i, r).map((n) => n.toFixed(1)).join(",")).join(" ");

    [1 / 3, 2 / 3, 1].forEach((k) => make("polygon", { points: poly(R * k), fill: "none", stroke: "#9aa7ff", "stroke-width": 1 }));
    KEYS.forEach((_, i) => {
      const [x, y] = point(i, R);
      make("line", { x1: 0, y1: 0, x2: x, y2: y, stroke: "#111", "stroke-width": 1.5 });
    });

    const values = KEYS.map((k) => {
      const p = params.find((q) => q.label === k);
      return Math.min(1, Math.max(0, Number(p ? p.value : 0) / max));
    });
    const data = values.map((v, i) => point(i, R * v).map((n) => n.toFixed(1)).join(",")).join(" ");
    make("polygon", { points: data, fill: "rgba(255,230,0,0.75)", stroke: "#111", "stroke-width": 2 });

    KEYS.forEach((k, i) => {
      const [x, y] = point(i, R + 15);
      const t = make("text", { x, y: y + 4, "text-anchor": "middle", "font-size": 12, "font-family": "Courier New, monospace", fill: "#0047ff" });
      t.textContent = k;
    });
  }

  /* =========================
     ⑥ 立ち絵をタップすると、ひとこと話す
  ========================= */
  const tachie = $("tachie");
  const speech = $("speech");
  let spoken = 0;
  let hideTimer = null;

  tachie.addEventListener("click", () => {
    if (!info.lines.length) return;
    speech.hidden = true;
    void speech.offsetWidth;                         // 続けてタップしても、ポップをやり直す
    speech.textContent = info.lines[spoken++ % info.lines.length];
    speech.hidden = false;

    if (!reduce) {
      tachie.classList.remove("is-poyon");
      void tachie.offsetWidth;
      tachie.classList.add("is-poyon");
      tachie.addEventListener("animationend", function done(e) {
        if (e.target !== tachie) return;
        tachie.classList.remove("is-poyon");
        tachie.removeEventListener("animationend", done);
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

  async function findFaces() {
    for (const pattern of FACE_PATTERNS) {
      const found = [];
      let misses = 0;
      for (let n = 0; n <= 60; n++) {
        const name = pattern.replace("{nn}", String(n).padStart(2, "0")).replace("{n}", n);
        if (await exists(FACE_DIR + name)) {
          found.push(FACE_DIR + name);
          misses = 0;
        } else if (found.length ? ++misses >= 3 : n >= 2) {
          break;                                     // 見つかったあとに3つ続けて無い／最初の数個に無い → このパターンは終わり
        }
      }
      if (found.length) return found;
    }
    return [];
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
      faceCount.textContent = "NO FACE";
      console.warn("顔アップの画像が見つかりません。" + FACE_DIR + " のファイル名を、character.js の FACE_PATTERNS に合わせてください。");
      return;
    }
    showFace(0);
  });

  /* =========================
     ⑧ 説明：見えた瞬間にタイピングされる
  ========================= */
  function setupTyping() {
    const target = $("info-text");
    const win = $("win-info");
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
      const w = rand(220, 380);
      win.style.width = w + "px";
      win.style.height = rand(170, 300) + "px";
      win.style.left = rand(-4, 55) + "%";
      win.style.top = ((i + rand(0, 0.6)) / count) * (docH + extra) + "px";
      back.append(win);
    }
    onScroll();
  }

  function onScroll() {
    back.style.transform = "translate3d(0," + window.scrollY * SPEED + "px,0)";
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  let resizeTimer = null;
  window.addEventListener("resize", () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(buildBack, 200); });
  window.addEventListener("load", buildBack);
  buildBack();
})();
