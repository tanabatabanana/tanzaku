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


    /* =========================
       HTML側の名前
    ========================= */

    const cardName =
        nameElement.textContent.trim();


    if (!cardName) {
        return null;
    }


    /* =========================
       名前を検索用に整える
    ========================= */

    function normalizeSearchName(name) {

        if (!name) {
            return "";
        }


        return String(name)

            .normalize("NFKC")

            /* 括弧の中身を削除 */

            .replace(
                /[（(][^）)]*[）)]/g,
                ""
            )

            /* 空白を削除 */

            .replace(/\s+/g, "")

            /* 中点を統一 */

            .replace(/[・･]/g, "")

            /* 記号をある程度無視 */

            .replace(
                /[「」『』【】［］\[\]「」]/g,
                ""
            )

            .toLowerCase()

            .trim();

    }


    /* =========================
       HTML側の名前
    ========================= */

    const normalizedCardName =
        normalizeSearchName(
            cardName
        );


    if (!normalizedCardName) {
        return null;
    }


    /* =========================
       JSONの探索者を調べる
    ========================= */

    for (
        const investigator
        of iacharaInvestigators
    ) {

        if (
            !investigator ||
            !investigator.data ||
            !investigator.data.name
        ) {

            continue;

        }


        const dataName =
            investigator.data.name;


        const normalizedDataName =
            normalizeSearchName(
                dataName
            );


        if (!normalizedDataName) {
            continue;
        }


        /* =========================
           完全一致
        ========================= */

        if (
            normalizedCardName ===
            normalizedDataName
        ) {

            return investigator;

        }


        /* =========================
           前方一致・部分一致
        ========================= */

        if (
            normalizedCardName.length >= 4 &&
            normalizedDataName.length >= 4
        ) {

            if (
                normalizedDataName.includes(
                    normalizedCardName
                ) ||
                normalizedCardName.includes(
                    normalizedDataName
                )
            ) {

                return investigator;

            }

        }

    }


    /* =========================
       括弧内の名前も調べる
    ========================= */

    const cardParts =
        cardName
            .normalize("NFKC")
            .split(
                /[・･／/]/g
            )
            .map(
                function (part) {

                    return normalizeSearchName(
                        part
                    );

                }
            )
            .filter(
                function (part) {

                    return part.length >= 3;

                }
            );


    for (
        const investigator
        of iacharaInvestigators
    ) {

        if (
            !investigator ||
            !investigator.data ||
            !investigator.data.name
        ) {

            continue;

        }


        const dataName =
            investigator.data.name;


        const normalizedDataName =
            normalizeSearchName(
                dataName
            );


        for (
            const part
            of cardParts
        ) {

            if (
                part.length >= 4 &&
                normalizedDataName.includes(
                    part
                )
            ) {

                return investigator;

            }

        }

    }


    /* =========================
       見つからなかった
    ========================= */

    console.warn(
        "対応する探索者データが見つかりません:",
        cardName
    );


    return null;

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
        String(data.data.commands);

    const skills = [];

    /*
       いあきゃらのコマンドには、

       CCB<=65 【目星】
       CC<=65 【目星】
       1D100<=65 【目星】

       など複数の形式があるため、
       すべて対応する。
    */

    const regex =
        /(?:CCB|CC|1D100)\s*<=\s*(\d+)\s*【([^】]+)】/gi;

    let match;

    while (
        (match = regex.exec(commands)) !== null
    ) {

        const skillName =
            match[2].trim();

        const skillValue =
            Number(match[1]);

        /*
           STR × 5 などの能力値判定は
           技能検索に入れない
        */

        if (
            skillName === "STR × 5" ||
            skillName === "CON × 5" ||
            skillName === "POW × 5" ||
            skillName === "DEX × 5" ||
            skillName === "APP × 5" ||
            skillName === "SIZ × 5" ||
            skillName === "INT × 5" ||
            skillName === "EDU × 5" ||
            skillName === "STR" ||
            skillName === "CON" ||
            skillName === "POW" ||
            skillName === "DEX" ||
            skillName === "APP" ||
            skillName === "SIZ" ||
            skillName === "INT" ||
            skillName === "EDU"
        ) {
            continue;
        }

        skills.push({

            name:
                skillName,

            value:
                skillValue

        });

    }

    return skills;

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

/* =========================
   探索者検索・並べ替え
========================= */

function setupInvestigatorSearch() {

    const grid =
        document.querySelector(".investigator-grid");

    const statSelect =
        document.querySelector("#stat-select");

    const skillInput =
        document.querySelector("#skill-search-input");

    const editionSelect =
        document.querySelector("#edition-select");


    /* =========================
       HTML確認
    ========================= */

    if (
        !grid ||
        !statSelect ||
        !skillInput ||
        !editionSelect
    ) {

        console.error(
            "探索者検索用のHTMLが見つかりません"
        );

        return;
    }


    /* =========================
       探索者カード取得
    ========================= */

    const cards =
        Array.from(
            grid.querySelectorAll(
                ".investigator-card"
            )
        );


    /* =========================
       元の並び順を保存
    ========================= */

    cards.forEach(
        function (card, index) {

            card.dataset.originalOrder =
                index;

        }
    );


    /* =========================
       能力値並び替え
    ========================= */

    statSelect.addEventListener(
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


    /* =========================
       技能検索
    ========================= */

    skillInput.addEventListener(
        "input",
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


    /* =========================
       版・状態フィルター
    ========================= */

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


    /* =========================
       最初の表示
    ========================= */

    sortInvestigators(
        grid,
        cards,
        "",
        "",
        ""
    );

}



/* =========================
   探索者を検索・並べ替え
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


    /* =========================
       全カードを確認
    ========================= */

    cards.forEach(
        function (card) {

            const data =
                findInvestigatorData(card);


            /* =========================
               ロスト判定
            ========================= */

            const isLost =
                !!(
                    data &&
                    data.data &&
                    data.data.lost === true
                );


            if (isLost) {

                card.classList.add(
                    "is-lost"
                );

            } else {

                card.classList.remove(
                    "is-lost"
                );

            }


            /* =========================
               LOST表示
            ========================= */

            const photoArea =
                card.querySelector(
                    ".photo-area"
                );


            if (photoArea) {

                let lostLabel =
                    photoArea.querySelector(
                        ".lost-label"
                    );


                if (isLost) {

                    if (!lostLabel) {

                        lostLabel =
                            document.createElement(
                                "span"
                            );

                        lostLabel.className =
                            "lost-label";

                        lostLabel.textContent =
                            "LOST";

                        photoArea.appendChild(
                            lostLabel
                        );

                    }

                } else {

                    if (lostLabel) {

                        lostLabel.remove();

                    }

                }

            }


            /* =========================
               6版フィルター
            ========================= */

            if (
                selectedEdition === "6"
            ) {

                if (
                    !data ||
                    getEdition(data) !== 6
                ) {

                    card.style.display =
                        "none";

                    return;
                }

            }


            /* =========================
               7版フィルター
            ========================= */

            if (
                selectedEdition === "7"
            ) {

                if (
                    !data ||
                    getEdition(data) !== 7
                ) {

                    card.style.display =
                        "none";

                    return;
                }

            }


            /* =========================
               生存フィルター
            ========================= */

            if (
                selectedEdition === "alive"
            ) {

                if (isLost) {

                    card.style.display =
                        "none";

                    return;
                }

            }


            /* =========================
               ロストフィルター
            ========================= */

            if (
                selectedEdition === "lost"
            ) {

                if (!isLost) {

                    card.style.display =
                        "none";

                    return;
                }

            }


            /* =========================
               技能検索
            ========================= */

            if (
                searchText !== ""
            ) {

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


                /* 技能がなければ非表示 */

                if (!matchedSkill) {

                    card.style.display =
                        "none";

                    return;
                }


                /* 技能があれば表示 */

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


            /* =========================
               通常表示
            ========================= */

            card.style.display =
                "";


            let value =
                null;


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


    /* =========================
       数値の大きい順に並べる
    ========================= */

    results.sort(
        function (a, b) {

            const aValue =
                a.value === null
                    ? -1
                    : a.value;


            const bValue =
                b.value === null
                    ? -1
                    : b.value;


            /* 数値が違えば大きい順 */

            if (
                bValue !== aValue
            ) {

                return (
                    bValue -
                    aValue
                );

            }


            /* =========================
               同じ数値なら
               元の並び順
            ========================= */

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


    /* =========================
       カードを実際に並べ直す
    ========================= */

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
   探索者検索を起動
========================= */

setupInvestigatorSearch();