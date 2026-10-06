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

    for (let i = 0; i < 8; i++) {

        const star = document.createElement("div");

        star.classList.add("click-star");

        star.style.left = event.clientX + "px";
        star.style.top = event.clientY + "px";

        const angle = (Math.PI * 2 / 8) * i;

        const distance = 40 + Math.random() * 75;

        const x = Math.cos(angle) * distance;
        const y = Math.sin(angle) * distance;

        star.style.setProperty("--x", x + "px");
        star.style.setProperty("--y", y + "px");

        document.body.appendChild(star);

        setTimeout(function () {
            star.remove();
        }, 500);

    }

});


/* =========================
   両端に浮かぶネオン星
========================= */

function createFloatingStar() {

    const star = document.createElement("div");

    star.classList.add("floating-star");


    const starShape = document.createElement("div");


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


    const y =
        Math.random() * window.innerHeight;


    star.style.left = x + "vw";
    star.style.top = y + "px";


    const size =
        30 + Math.random() * 32;


    star.style.setProperty(
        "--star-size",
        size + "px"
    );


    const colors = [

        "#fff799",
        "#fff3a3",
        "#ffeaa0",
        "#fff6c7",

        "#8fffe8",
        "#a8fff0",
        "#9eefff",
        "#b8f4ff",

        "#ff9eeb",
        "#ffb3ef",
        "#ffc0f2",
        "#ffa8d8",

        "#d5ff8a",
        "#caff9e",
        "#e2ffb8",

        "#d6a8ff",
        "#e2b8ff",
        "#c9b6ff",

        "#ffc38a",
        "#ffd0a8",

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


    const duration =
        4 + Math.random() * 4;


    star.style.setProperty(
        "--duration",
        duration + "s"
    );


    const sway =
        15 + Math.random() * 20;


    star.style.setProperty(
        "--sway",
        sway + "px"
    );


    star.appendChild(starShape);

    document.body.appendChild(star);


    setTimeout(() => {

        star.remove();

    }, duration * 1000);

}


/* 最初は少しだけ出す */

setTimeout(createFloatingStar, 1000);
setTimeout(createFloatingStar, 3500);
setTimeout(createFloatingStar, 7000);


/* ランダムな間隔で出現 */

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
   スマホ：
   1タップで画像変更
   2タップでリンク先へ移動
========================= */

document.addEventListener("DOMContentLoaded", function () {

    const cards =
        document.querySelectorAll(
            ".investigator-card"
        );


    cards.forEach(function (card) {

        let firstTap = false;

        let tapTimer = null;


        card.addEventListener(
            "click",
            function (event) {

                /* PCでは今まで通り */

                if (window.innerWidth > 800) {
                    return;
                }


                /* 2回目のタップ */

                if (firstTap) {

                    clearTimeout(tapTimer);

                    firstTap = false;

                    return;

                }


                /* 1回目のタップ */

                event.preventDefault();

                firstTap = true;


                /* 画像を切り替える */

                card.classList.add(
                    "mobile-tapped"
                );


                /* 1秒以内に2回目がなければ元に戻す */

                tapTimer =
                    setTimeout(function () {

                        firstTap = false;

                        card.classList.remove(
                            "mobile-tapped"
                        );

                    }, 1000);

            }
        );

    });

});



/* =========================
   いあきゃら探索者データ
========================= */

let iacharaInvestigators = [];



/* =========================
   データ読み込み
========================= */

fetch("data/investigators.json")

    .then(function (response) {

        if (!response.ok) {

            throw new Error(
                "investigators.json を読み込めませんでした"
            );

        }

        return response.json();

    })

    .then(function (data) {

        iacharaInvestigators = data;

        console.log(
            "いあきゃら探索者データを読み込みました"
        );

        console.log(
            iacharaInvestigators
        );

        setupInvestigatorSearch();

    })

    .catch(function (error) {

        console.error(
            "探索者データの読み込みに失敗しました:",
            error
        );

    });



/* =========================
   名前を整える
========================= */

function normalizeName(name) {

    if (!name) {
        return "";
    }

    return String(name)

        .replace(/\s+/g, "")

        .replace(/[（(].*?[）)]/g, "")

        .trim()

        .toLowerCase();

}



/* =========================
   名前から探索者データを探す
========================= */

function findInvestigatorData(card) {

    const nameElement =
        card.querySelector(".name-text");


    if (!nameElement) {
        return null;
    }


    const cardName =
        normalizeName(
            nameElement.textContent
        );


    /* 完全一致 */

    let result =
        iacharaInvestigators.find(
            function (investigator) {

                if (
                    !investigator.data ||
                    !investigator.data.name
                ) {
                    return false;
                }

                const dataName =
                    normalizeName(
                        investigator.data.name
                    );

                return dataName === cardName;

            }
        );


    if (result) {
        return result;
    }


    /*
       完全一致しなかった場合、
       JSON側の名前にHTML側の名前が
       含まれているかも調べる
    */

    result =
        iacharaInvestigators.find(
            function (investigator) {

                if (
                    !investigator.data ||
                    !investigator.data.name
                ) {
                    return false;
                }

                const dataName =
                    normalizeName(
                        investigator.data.name
                    );

                return (
                    dataName.includes(cardName) ||
                    cardName.includes(dataName)
                );

            }
        );


    return result || null;

}



/* =========================
   版を取得
========================= */

function getEdition(data) {

    if (
        !data ||
        !data.data ||
        data.data.edition === undefined
    ) {
        return null;
    }

    return Number(
        data.data.edition
    );

}



/* =========================
   能力値を取得
========================= */

function getValue(data, label) {

    if (
        !data ||
        !data.data
    ) {
        return null;
    }


    /*
       STR / CON / POW / DEX
       APP / SIZ / INT / EDU
    */

    if (data.data.params) {

        const param =
            data.data.params.find(
                function (item) {

                    return (
                        item.label === label
                    );

                }
            );


        if (param) {

            let value =
                Number(param.value);


            /*
               7版の場合

               基本能力値を
               5で割って切り捨てる
            */

            if (
                getEdition(data) === 7 &&
                [
                    "STR",
                    "CON",
                    "POW",
                    "DEX",
                    "APP",
                    "SIZ",
                    "INT",
                    "EDU"
                ].includes(label)
            ) {

                value =
                    Math.floor(
                        value / 5
                    );

            }


            return value;

        }

    }


    /*
       HP / MP / SAN
    */

    if (data.data.status) {

        const status =
            data.data.status.find(
                function (item) {

                    return (
                        item.label === label
                    );

                }
            );


        if (status) {

            return Number(
                status.value
            );

        }

    }


    /*
       イニシアチブ
    */

    if (label === "initiative") {

        return Number(
            data.data.initiative
        );

    }


    return null;

}



/* =========================
   技能を取得
========================= */

function getSkills(data) {

    if (
        !data ||
        !data.data ||
        !data.data.commands
    ) {

        return [];

    }


    const commands =
        data.data.commands;


    const skills = [];


    const regex =
        /CCB<=([0-9]+)\s+【([^】]+)】/g;


    let match;


    while (
        (match = regex.exec(commands))
        !== null
    ) {

        skills.push({

            name: match[2],

            value: Number(match[1])

        });

    }


    return skills;

}



/* =========================
   探索者検索UIの準備
========================= */

function setupInvestigatorSearch() {

    const grid =
        document.querySelector(
            ".investigator-grid"
        );


    const statSelect =
        document.querySelector(
            "#stat-select"
        );


    const skillInput =
        document.querySelector(
            "#skill-search-input"
        );


    if (
        !grid ||
        !statSelect ||
        !skillInput
    ) {

        console.error(
            "探索者検索用のHTMLが見つかりません"
        );

        return;

    }


    const cards =
        Array.from(
            grid.querySelectorAll(
                ".investigator-card"
            )
        );


    /*
       元の順番を保存
    */

    cards.forEach(
        function (card, index) {

            card.dataset.originalOrder =
                index;

        }
    );


    /*
       版の絞り込みを作る
    */

    createEditionFilter();


    const editionSelect =
        document.querySelector(
            "#edition-select"
        );


    /*
       能力値変更
    */

    statSelect.addEventListener(
        "change",
        function () {

            sortInvestigators(
                grid,
                cards,
                statSelect.value,
                skillInput.value,
                editionSelect
                    ? editionSelect.value
                    : ""
            );

        }
    );


    /*
       技能検索
    */

    skillInput.addEventListener(
        "input",
        function () {

            sortInvestigators(
                grid,
                cards,
                statSelect.value,
                skillInput.value,
                editionSelect
                    ? editionSelect.value
                    : ""
            );

        }
    );


    /*
       版変更
    */

    if (editionSelect) {

        editionSelect.addEventListener(
            "change",
            function () {

                sortInvestigators(
                    grid,
                    cards,
                    statSelect.value,
                    skillInput.value,
                    editionSelect.value
                );

            }
        );

    }


    /*
       最初の表示
    */

    sortInvestigators(
        grid,
        cards,
        "",
        "",
        ""
    );

}



/* =========================
   6版 / 7版フィルター作成
========================= */

function createEditionFilter() {

    /*
       すでにHTMLにある場合は何もしない
    */

    if (
        document.querySelector(
            "#edition-select"
        )
    ) {

        return;

    }


    const tools =
        document.querySelector(
            ".investigator-tools"
        );


    if (!tools) {
        return;
    }


    const wrapper =
        document.createElement("div");


    wrapper.className =
        "edition-filter";


    const label =
        document.createElement("label");


    label.setAttribute(
        "for",
        "edition-select"
    );


    label.textContent =
        "版で絞り込み";


    const select =
        document.createElement("select");


    select.id =
        "edition-select";


    select.innerHTML = `

        <option value="">
            すべて
        </option>

        <option value="6">
            6版
        </option>

        <option value="7">
            7版
        </option>

    `;


    wrapper.appendChild(label);

    wrapper.appendChild(select);

    tools.appendChild(wrapper);

}



/* =========================
   並べ替え・検索・絞り込み
========================= */

function sortInvestigators(
    grid,
    cards,
    selectedStat,
    skillText,
    selectedEdition
) {

    const searchText =
        skillText
            .trim()
            .toLowerCase();


    const results = [];


    cards.forEach(
        function (card) {

            const data =
                findInvestigatorData(
                    card
                );


            /*
               まず版で絞り込む
            */

            if (
                selectedEdition !== "" &&
                (
                    !data ||
                    String(
                        getEdition(data)
                    ) !==
                    String(selectedEdition)
                )
            ) {

                card.style.display =
                    "none";

                return;

            }


            /*
               技能検索
            */

            if (searchText !== "") {

                if (!data) {

                    card.style.display =
                        "none";

                    return;

                }


                const skills =
                    getSkills(data);


                const matchedSkill =
                    skills.find(
                        function (skill) {

                            return skill.name
                                .toLowerCase()
                                .includes(
                                    searchText
                                );

                        }
                    );


                if (!matchedSkill) {

                    card.style.display =
                        "none";

                    return;

                }


                card.style.display =
                    "";


                results.push({

                    card: card,

                    data: data,

                    value:
                        matchedSkill.value,

                    label:
                        matchedSkill.name

                });


                return;

            }


            /*
               通常表示

               ★ここが今回の重要ポイント

               JSONにデータがない人も
               display:none にしない
            */

            card.style.display = "";


            let value = null;


            if (selectedStat) {

                value =
                    getValue(
                        data,
                        selectedStat
                    );

            }


            results.push({

                card: card,

                data: data,

                value: value,

                label: selectedStat

            });

        }
    );



    /*
       並べ替え
    */

    if (
        selectedStat ||
        searchText !== ""
    ) {

        results.sort(
            function (a, b) {

                /*
                   データがある人を上にする
                */

                const valueA =
                    a.value === null
                        ? -1
                        : a.value;


                const valueB =
                    b.value === null
                        ? -1
                        : b.value;


                if (
                    valueA !== valueB
                ) {

                    return (
                        valueB -
                        valueA
                    );

                }


                /*
                   同じ値なら
                   元の順番
                */

                return (
                    Number(
                        a.card.dataset
                            .originalOrder
                    ) -
                    Number(
                        b.card.dataset
                            .originalOrder
                    )
                );

            }
        );

    }



    /*
       カードを並べ直す
    */

    results.forEach(
        function (item) {

            grid.appendChild(
                item.card
            );


            updateValueDisplay(
                item.card,
                item.label,
                item.value
            );

        }
    );

}



/* =========================
   カード上の数値表示
========================= */

function updateValueDisplay(
    card,
    label,
    value
) {

    const old =
        card.querySelector(
            ".investigator-value"
        );


    if (old) {
        old.remove();
    }


    if (
        !label ||
        value === null
    ) {

        return;

    }


    const display =
        document.createElement("div");


    display.className =
        "investigator-value";


    let displayLabel =
        label;


    if (
        label === "initiative"
    ) {

        displayLabel =
            "INIT";

    }


    display.textContent =
        displayLabel +
        " : " +
        value;


    card.appendChild(
        display
    );

}