/* 短冊の部屋：背景にランダムに並ぶ飾り（エラー画面「風」）
   画面に固定した背景の層に置くので、スクロールすると窓の下から見え隠れする。読み込むたびに配置が変わる。 */
(() => {
  "use strict";

  // [クラス名, 中身]。見た目は style.css の .deco-* にある
  const TYPES = [
    ["deco-stack", ""],
    ["deco-big", "TANZAKU<br>(TANZAKU<br>TANZAKU"],
    ["deco-tape", "OEKAKI"],
    ["deco-tape", "TANOSII"],
    ["deco-tape", "予期せぬお絵描きが発生しました"],
    ["deco-glitch", ""],
    ["deco-check", ""],
    ["deco-circle", "×"],
    ["deco-warn", "!"],
    ["deco-cursor", ""],
    ["deco-404", "404<small>OEKAKI FOUND</small>"]
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
  const extra = vw < 700 ? 0 : 4;

  const list = TYPES.slice();
  for (let i = 0; i < extra; i++) {
    list.push(TYPES[Math.floor(Math.random() * TYPES.length)]);
  }

  const placed = [];
  const minGap = Math.min(vw, vh) * 0.2;   // 飾り同士がなるべく近づかないようにする

  list.forEach(([className, html]) => {
    const el = document.createElement("div");
    el.className = className;
    if (html) el.innerHTML = html;           // 上の固定の文字列だけを入れている

    let x = 0;
    let y = 0;
    for (let tries = 0; tries < 30; tries++) {
      x = rand(-0.02, 0.9) * vw;
      y = rand(0.02, 0.95) * vh;
      if (!placed.some((p) => Math.hypot(p.x - x, p.y - y) < minGap)) break;
    }
    placed.push({ x, y });

    el.style.left = (x / vw) * 100 + "%";
    el.style.top = (y / vh) * 100 + "%";
    el.style.setProperty("--r", rand(-12, 12) + "deg");
    el.style.setProperty("--s", String(rand(0.85, 1.2) * base));

    layer.append(el);
  });
})();
