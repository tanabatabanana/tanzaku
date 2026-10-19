/* 短冊の部屋：ヘッダーのウィンドウ（ドラッグで移動 + 折りたたみ）。全ページ共通
   右上のボタン（－ □ ×）は、どれを押しても同じように縮小（もう一度押すと展開）する */
(() => {
  "use strict";

  const headerWindow = document.getElementById("header-window");
  const titlebar = document.getElementById("header-titlebar");
  const toggle = document.getElementById("header-toggle");
  if (!headerWindow || !titlebar) return;

  // --- ドラッグ（ボタンの上からは始めない） ---
  let dragging = false;
  let offsetX = 0;
  let offsetY = 0;

  titlebar.addEventListener("pointerdown", (event) => {
    if (event.target.closest(".header-window-controls")) return;
    if (event.pointerType === "mouse" && event.button !== 0) return;

    const rect = headerWindow.getBoundingClientRect();
    dragging = true;
    offsetX = event.clientX - rect.left;
    offsetY = event.clientY - rect.top;

    headerWindow.style.position = "fixed";
    headerWindow.style.left = rect.left + "px";
    headerWindow.style.top = rect.top + "px";
    headerWindow.style.right = "auto";
    headerWindow.style.bottom = "auto";

    event.preventDefault();
  });

  window.addEventListener("pointermove", (event) => {
    if (!dragging) return;

    const maxX = Math.max(0, window.innerWidth - headerWindow.offsetWidth);
    const maxY = Math.max(0, window.innerHeight - headerWindow.offsetHeight);

    headerWindow.style.left = Math.max(0, Math.min(event.clientX - offsetX, maxX)) + "px";
    headerWindow.style.top = Math.max(0, Math.min(event.clientY - offsetY, maxY)) + "px";
  });

  const stopDrag = () => { dragging = false; };
  window.addEventListener("pointerup", stopDrag);
  window.addEventListener("pointercancel", stopDrag);

  // --- 折りたたみ：3つのボタンのどれでも ---
  function toggleCollapse() {
    const collapsed = headerWindow.classList.toggle("is-collapsed");
    if (!toggle) return;
    toggle.textContent = collapsed ? "+" : "－";
    toggle.setAttribute("aria-expanded", String(!collapsed));
    toggle.setAttribute("aria-label", collapsed ? "メニューを展開する" : "メニューを折りたたむ");
  }

  headerWindow.querySelectorAll(".header-window-controls > *").forEach((control) => {
    if (control.tagName !== "BUTTON") {
      // □ と × はただの文字なので、ボタンとして使えるようにする
      control.setAttribute("role", "button");
      control.tabIndex = 0;
      control.setAttribute("aria-label", "メニューを折りたたむ／展開する");
      control.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          toggleCollapse();
        }
      });
    }
    control.addEventListener("click", toggleCollapse);
  });
})();
