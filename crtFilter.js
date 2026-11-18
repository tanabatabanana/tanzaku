/* 短冊の部屋：ブラウン管テレビ風のフィルター（全ページ共通。header.js が読み込む）
   ・画面全体に、走査線・蛍光体の細かい縞・周辺の暗がり・少しのちらつき・砂嵐・ゆっくり流れる帯をかぶせる
   ・ヘッダーのタイトルバーの「CRT」ボタンで、オン・オフを切り替える（選んだ状態は、次に開いた時も続く） */
(() => {
  "use strict";

  const KEY = "crtFilter";
  const root = document.documentElement;

  let on = true;                                          // はじめは、オン
  try { on = localStorage.getItem(KEY) !== "off"; } catch (e) { /* 保存できなくても動く */ }

  // 画面にかぶせる層（操作はそのまま通る）
  const overlay = document.createElement("div");
  overlay.className = "crt-overlay";
  overlay.setAttribute("aria-hidden", "true");
  overlay.innerHTML = '<i class="crt-roll"></i><i class="crt-grain"></i>';
  document.body.append(overlay);

  // ヘッダーの右上に、オン・オフのボタン
  const controls = document.querySelector(".header-window-controls");
  let button = null;
  if (controls) {
    button = document.createElement("button");
    button.type = "button";
    button.className = "header-crt";
    button.textContent = "CRT";
    button.title = "ブラウン管フィルターのオン・オフ";
    controls.prepend(button);
    button.addEventListener("click", () => {
      on = !on;
      try { localStorage.setItem(KEY, on ? "on" : "off"); } catch (e) { /* 何もしない */ }
      apply();
    });
  }

  function apply() {
    root.classList.toggle("crt-on", on);
    if (button) {
      button.setAttribute("aria-pressed", String(on));
      button.setAttribute("aria-label", "ブラウン管フィルター：" + (on ? "オン" : "オフ"));
    }
  }
  apply();
})();