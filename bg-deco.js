/* 短冊の部屋：背景にランダムに並ぶ飾り（エラー画面「風」）
   画面に固定した背景の層に置くので、スクロールすると窓の下から見え隠れする。
   中央は空け、左右の端に寄せて置く。読み込むたびに種類・配置が変わる。 */
(() => {
  "use strict";

  // [クラス名, 中身]。見た目は style.css の .deco-* にある（押せない飾り。本物のエラーに見えないよう赤いアイコンやOKは使わない）
  const MUST = [
    ["deco-tape deco-tape-wrap", "An unexpected drawing has occurred."]   // いつも1つは出す
  ];
  const TYPES = [
    ["deco-stack", ""],
    ["deco-big", "TANZAKU<br>(TANZAKU<br>TANZAKU"],
    ["deco-big2", "OEKAKI"],
    ["deco-tape", "OEKAKI"],
    ["deco-tape", "TANOSII"],
    ["deco-tape", "NOW LOADING..."],
    ["deco-tape", "NO SIGNAL"],
    ["deco-glitch", ""],
    ["deco-check", ""],
    ["deco-circle", "−"],
    ["deco-warn", "!"],
    ["deco-cursor", ""],
    ["deco-404", "404<small>OEKAKI FOUND</small>"],
    ["deco-loading", '<div>OEKAKI 72%</div><div class="dl-bar"><i></i></div>'],
    ["deco-face", "(・ω・)"],
    ["deco-star", ""],
    ["deco-heart", ""],
    ["deco-barcode", ""],
    ["deco-scan", ""],
    ["deco-dots", ""],
    ["deco-plus", "+ + +<br>+ + +"]
  ];

  const rand = (min, max) => Math.random() * (max - min) + min;

  const layer = document.createElement("div");
  layer.className = "bgdeco";
  layer.setAttribute("aria-hidden", "true");
  document.body.prepend(layer);

  const vw = window.innerWidth;
  const vh = window.innerHeight;

  // 狭い画面では小さく・少なくする
  const base = Math.max(0.45, Math.min(1, vw / 1100));
  const count = vw < 700 ? 8 : 14;

  // 種類をシャッフルして、必須のもの + 好きな数だけ選ぶ
  const shuffled = TYPES.slice().sort(() => Math.random() - 0.5);
  const list = MUST.concat(shuffled.slice(0, count - MUST.length));

  const placed = [];
  const minGap = Math.min(vw, vh) * 0.18;   // 飾り同士がなるべく近づかないようにする

  list.forEach(([className, html], index) => {
    const el = document.createElement("div");
    el.className = className;
    if (html) el.innerHTML = html;           // 上の固定の文字列だけを入れている

    const scale = rand(0.85, 1.2) * base;
    el.style.setProperty("--r", rand(-12, 12) + "deg");
    el.style.setProperty("--s", String(scale));
    layer.append(el);

    // 幅は拡大後の大きさで測る（transform-origin が中央なので、拡大分は左右に等しく広がる）
    const w = el.offsetWidth * scale;
    const h = el.offsetHeight * scale;
    const grow = (el.offsetWidth * (scale - 1)) / 2;

    // 左右交互に、画面の端に寄せる（左端：-3%〜10%、右端：右から-2%〜18%）
    let x = 0;
    let y = 0;
    const left = index % 2 === 0;
    for (let tries = 0; tries < 30; tries++) {
      x = left ? rand(-0.03, 0.1) * vw + grow : vw - w - rand(-0.02, 0.18) * vw + grow;
      y = rand(0.02, 0.9) * vh;
      if (!placed.some((p) => Math.hypot(p.x - x, p.y - y) < minGap)) break;
    }
    placed.push({ x, y });

    el.style.left = x + "px";
    el.style.top = Math.min(y, vh - h) + "px";
  });
})();
