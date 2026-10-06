/* =========================
   赤い8bit風 十字カーソル
========================= */

const canvas = document.createElement("canvas");

canvas.width = 32;
canvas.height = 32;

const ctx = canvas.getContext("2d");

ctx.fillStyle = "#ff0000";

/* 上 */
ctx.fillRect(14, 2, 4, 10);

/* 下 */
ctx.fillRect(14, 20, 4, 10);

/* 左 */
ctx.fillRect(2, 14, 10, 4);

/* 右 */
ctx.fillRect(20, 14, 10, 4);

/* 真ん中 */
ctx.fillRect(10, 10, 12, 12);


/* カーソルに設定 */

const cursorImage = canvas.toDataURL();

document.body.style.cursor =
    `url(${cursorImage}) 16 16, crosshair`;


/* =========================
   クリックすると星が弾ける
========================= */

document.addEventListener("click", function (event) {

    /* 8方向に飛ばす */
    for (let i = 0; i < 8; i++) {

        const star = document.createElement("div");

        star.classList.add("click-star");

        /* クリックした場所 */
        star.style.left = event.clientX + "px";
        star.style.top = event.clientY + "px";

        /* 飛ぶ方向 */
        const angle = (Math.PI * 2 / 8) * i;

        /* 飛ぶ距離 */
        const distance = 40 + Math.random() * 75;

        const x = Math.cos(angle) * distance;
        const y = Math.sin(angle) * distance;

        star.style.setProperty("--x", x + "px");
        star.style.setProperty("--y", y + "px");

        document.body.appendChild(star);

        /* アニメーション終了後に消す */
        setTimeout(function () {
            star.remove();
        }, 500);
    }

});
/* =========================
   両端に浮かぶネオン星
========================= */

function createFloatingStar() {

    /* 外側：上に移動する */

    const star = document.createElement("div");

    star.classList.add("floating-star");


    /* 内側：ゆらゆら揺れる */

    const starShape = document.createElement("div");


    /* 星の種類 */

    const types = [
        "star-cross",
        "star-sparkle",
        "star-diamond",
        "star-small",
        "star-plus"
    ];

    const type =
        types[Math.floor(Math.random() * types.length)];


    starShape.classList.add(
        "star-shape",
        type
    );


    /* =========================
       左右どちらに出すか
    ========================= */

    const side =
        Math.random() < 0.5
            ? "left"
            : "right";


    let x;

    if (side === "left") {

        x = 2 + Math.random() * 15;

    } else {

        x = 83 + Math.random() * 15;

    }


    /* =========================
       縦位置
    ========================= */

    const y =
        Math.random() * window.innerHeight;


    star.style.left = x + "vw";

    star.style.top = y + "px";


    /* =========================
       サイズ
    ========================= */

    const size =
        30 + Math.random() * 32;


    star.style.setProperty(
        "--star-size",
        size + "px"
    );


    /* =========================
       色
    ========================= */
const colors = [

    /* 黄色系 */
    "#fff799",
    "#fff3a3",
    "#ffeaa0",
    "#fff6c7",

    /* シアン・水色系 */
    "#8fffe8",
    "#a8fff0",
    "#9eefff",
    "#b8f4ff",

    /* ピンク系 */
    "#ff9eeb",
    "#ffb3ef",
    "#ffc0f2",
    "#ffa8d8",

    /* 黄緑系 */
    "#d5ff8a",
    "#caff9e",
    "#e2ffb8",

    /* 紫系 */
    "#d6a8ff",
    "#e2b8ff",
    "#c9b6ff",

    /* オレンジ系 */
    "#ffc38a",
    "#ffd0a8",

    /* 白っぽいキラキラ */
    "#fffde8",
    "#f5ffff",
    "#fff0fa"

];


    const color =
        colors[
            Math.floor(
                Math.random() * colors.length
            )
        ];


    star.style.setProperty(
        "--star-color",
        color
    );


    /* =========================
       動く時間
    ========================= */

    const duration =
        4 + Math.random() * 4;


    star.style.setProperty(
        "--duration",
        duration + "s"
    );


    /* =========================
       横揺れの幅
    ========================= */

    const sway =
        15 + Math.random() * 20;


    star.style.setProperty(
        "--sway",
        sway + "px"
    );


    /* 星を中に入れる */

    star.appendChild(starShape);

    document.body.appendChild(star);


    /* アニメーション終了後削除 */

    setTimeout(() => {

        star.remove();

    }, duration * 1000);

}


/* =========================
   最初は少しだけ出す
========================= */

setTimeout(createFloatingStar, 1000);

setTimeout(createFloatingStar, 3500);

setTimeout(createFloatingStar, 7000);


/* =========================
   ランダムな間隔で出現
========================= */

function scheduleNextStar() {

    const delay =
        300 + Math.random() * 500;


    setTimeout(() => {

        createFloatingStar();

        scheduleNextStar();

    }, delay);

}


scheduleNextStar();
/* =========================
   スマホ：1タップで画像変更
   2タップでリンク先へ移動
========================= */

document.addEventListener("DOMContentLoaded", function () {

    const cards = document.querySelectorAll(".investigator-card");

    cards.forEach(function (card) {

        let firstTap = false;
        let tapTimer = null;

        card.addEventListener("click", function (event) {

            /* PCでは今まで通り */
            if (window.innerWidth > 800) {
                return;
            }

            /* 2回目のタップ */
            if (firstTap) {

                clearTimeout(tapTimer);
                firstTap = false;

                /* リンク先へ移動 */
                return;
            }

            /* 1回目のタップ */
            event.preventDefault();

            firstTap = true;

            /* 画像を切り替える */
            card.classList.add("mobile-tapped");

            /* 1秒以内に2回目がなければ元に戻す */
            tapTimer = setTimeout(function () {

                firstTap = false;
                card.classList.remove("mobile-tapped");

            }, 1000);

        });

    });

});

/* =========================
   いあきゃら探索者データ読み込み
========================= */

let iacharaInvestigators = [];

fetch("data/investigators.json")
    .then(function (response) {

        if (!response.ok) {
            throw new Error("investigators.json を読み込めませんでした");
        }

        return response.json();

    })
    .then(function (data) {

        iacharaInvestigators = data;

        console.log("いあきゃら探索者データを読み込みました");
        console.log(iacharaInvestigators);

    })
    .catch(function (error) {

        console.error("探索者データの読み込みに失敗しました:", error);

    });