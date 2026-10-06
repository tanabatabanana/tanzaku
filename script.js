/* =========================
   いあきゃら探索者データ
   読み込み・検索・ソート
   6版 / 7版対応
========================= */

let iacharaInvestigators = [];


/* =========================
   7版探索者
========================= */

const seventhEditionNames = [
    "ミクス・パーシャル",
    "隼高 翔太"
];


/* =========================
   7版かどうか判定
========================= */

function isSeventhEdition(data) {

    if (!data || !data.data || !data.data.name) {
        return false;
    }

    const name = normalizeName(data.data.name);

    return seventhEditionNames.some(function (target) {

        return normalizeName(target) === name;

    });

}


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
   いあきゃらデータを探す
========================= */

function findInvestigatorData(card) {

    const nameElement =
        card.querySelector(".name-text");

    if (!nameElement) {
        return null;
    }

    const cardName =
        normalizeName(nameElement.textContent);

    return iacharaInvestigators.find(function (investigator) {

        if (
            !investigator.data ||
            !investigator.data.name
        ) {
            return false;
        }

        const dataName =
            normalizeName(investigator.data.name);

        return dataName === cardName;

    }) || null;

}


/* =========================
   版を取得
========================= */

function getEdition(data) {

    if (isSeventhEdition(data)) {
        return 7;
    }

    return 6;

}


/* =========================
   能力値を取得
========================= */

function getValue(data, label) {

    if (!data || !data.data) {
        return null;
    }

    let value = null;


    /* =========================
       STR / CON / POW / DEX
       APP / SIZ / INT / EDU
    ========================= */

    if (data.data.params) {

        const param =
            data.data.params.find(function (item) {

                return item.label === label;

            });

        if (param) {

            value = Number(param.value);

        }

    }


    /* =========================
       HP / MP / SAN
    ========================= */

    if (value === null && data.data.status) {

        const status =
            data.data.status.find(function (item) {

                return item.label === label;

            });

        if (status) {

            value = Number(status.value);

        }

    }


    /* =========================
       イニシアチブ
    ========================= */

    if (
        value === null &&
        label === "initiative"
    ) {

        value = Number(
            data.data.initiative
        );

    }


    if (
        value === null ||
        Number.isNaN(value)
    ) {

        return null;

    }


    /* =========================
       7版の基本能力値だけ1/5
    ========================= */

    const basicStats = [
        "STR",
        "CON",
        "POW",
        "DEX",
        "APP",
        "SIZ",
        "INT",
        "EDU"
    ];

    if (
        getEdition(data) === 7 &&
        basicStats.includes(label)
    ) {

        value = Math.floor(value / 5);

    }


    return value;

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
        (match = regex.exec(commands)) !== null
    ) {

        skills.push({

            name: match[2],

            value: Number(match[1])

        });

    }


    return skills;

}


/* =========================
   版フィルターを作る
========================= */

function createEditionFilter() {

    const tools =
        document.querySelector(".investigator-tools");

    if (!tools) {
        return null;
    }


    /* すでに存在する場合 */

    let editionBox =
        document.querySelector(".edition-filter");

    if (editionBox) {

        return editionBox.querySelector(
            "#edition-select"
        );

    }


    /* 新しく作る */

    editionBox =
        document.createElement("div");

    editionBox.className =
        "edition-filter";


    editionBox.innerHTML = `

        <label for="edition-select">
            版で絞り込み
        </label>

        <select id="edition-select">

            <option value="">
                すべて
            </option>

            <option value="6">
                6版
            </option>

            <option value="7">
                7版
            </option>

        </select>

    `;


    tools.insertBefore(
        editionBox,
        tools.firstChild
    );


    return editionBox.querySelector(
        "#edition-select"
    );

}


/* =========================
   検索・ソートの準備
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

    const editionSelect =
        createEditionFilter();


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


    const cards =
        Array.from(
            grid.querySelectorAll(
                ".investigator-card"
            )
        );


    /* 元の順番を保存 */

    cards.forEach(function (card, index) {

        card.dataset.originalOrder =
            index;

    });


    /* 能力値変更 */

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


    /* 技能検索 */

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


    /* 6版 / 7版 */

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


    /* 最初の表示 */

    sortInvestigators(
        grid,
        cards,
        "",
        "",
        ""
    );

}


/* =========================
   並べ替え・絞り込み
========================= */

function sortInvestigators(
    grid,
    cards,
    selectedStat,
    skillKeyword,
    selectedEdition
) {

    const keyword =
        skillKeyword
            .trim()
            .toLowerCase();


    const results = [];


    cards.forEach(function (card) {

        const data =
            findInvestigatorData(card);


        /* データがないカード */

        if (!data) {

            card.style.display =
                "none";

            return;

        }


        /* =========================
           版で絞り込み
        ========================= */

        const edition =
            getEdition(data);


        if (
            selectedEdition &&
            String(edition) !==
            String(selectedEdition)
        ) {

            card.style.display =
                "none";

            return;

        }


        /* =========================
           技能検索
        ========================= */

        let skillValue = null;


        if (keyword) {

            const skills =
                getSkills(data);


            const matchedSkill =
                skills.find(function (skill) {

                    return skill.name
                        .toLowerCase()
                        .includes(keyword);

                });


            if (!matchedSkill) {

                card.style.display =
                    "none";

                return;

            }


            skillValue =
                matchedSkill.value;

        }


        card.style.display =
            "";


        results.push({

            card: card,

            data: data,

            edition: edition,

            statValue:
                selectedStat
                    ? getValue(
                        data,
                        selectedStat
                    )
                    : null,

            skillValue:
                skillValue,

            originalOrder:
                Number(
                    card.dataset.originalOrder
                )

        });

    });


    /* =========================
       並べ替え
    ========================= */

    results.sort(function (a, b) {


        /* 技能検索中 */

        if (keyword) {

            const aValue =
                a.skillValue ?? -Infinity;

            const bValue =
                b.skillValue ?? -Infinity;

            if (aValue !== bValue) {

                return bValue - aValue;

            }

        }


        /* 能力値ソート */

        if (selectedStat) {

            const aValue =
                a.statValue ?? -Infinity;

            const bValue =
                b.statValue ?? -Infinity;

            if (aValue !== bValue) {

                return bValue - aValue;

            }

        }


        /* 元の順番 */

        return (
            a.originalOrder -
            b.originalOrder
        );

    });


    /* =========================
       グリッドへ戻す
    ========================= */

    results.forEach(function (item) {

        grid.appendChild(item.card);

    });


    /* =========================
       数値表示
    ========================= */

    updateValueDisplay(
        results,
        selectedStat,
        keyword
    );

}


/* =========================
   数値表示
========================= */

function updateValueDisplay(
    results,
    selectedStat,
    keyword
) {

    results.forEach(function (item) {

        const card =
            item.card;


        /* 古い表示を削除 */

        const old =
            card.querySelector(
                ".investigator-value"
            );

        if (old) {

            old.remove();

        }


        let text = "";


        /* 技能検索 */

        if (keyword) {

            text =
                "技能値："
                + item.skillValue;

        }


        /* 能力値ソート */

        else if (selectedStat) {

            let label =
                selectedStat;


            if (
                selectedStat ===
                "initiative"
            ) {

                label =
                    "イニシアチブ";

            }


            text =
                label +
                "："
                +
                item.statValue;

        }


        if (!text) {

            return;

        }


        const value =
            document.createElement(
                "div"
            );

        value.className =
            "investigator-value";

        value.textContent =
            text;


        card.appendChild(value);

    });

}