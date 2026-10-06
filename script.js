/* =========================
   いあきゃら探索者データ
   読み込み・検索・ソート
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
            "いあきゃら探索者データを読み込みました",
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
   名前を比較しやすくする
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
   カードといあきゃらデータを対応させる
========================= */

function findInvestigatorData(card) {

    const nameElement =
        card.querySelector(".name-text");

    if (!nameElement) {
        return null;
    }

    const cardName =
        normalizeName(nameElement.textContent);

    const result =
        iacharaInvestigators.find(function (investigator) {

            if (
                !investigator ||
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

        });

    if (!result) {

        console.warn(
            "いあきゃらデータが見つかりません:",
            nameElement.textContent
        );

    }

    return result || null;

}


/* =========================
   能力値を取得
========================= */

function getValue(data, label) {

    if (!data || !data.data) {
        return null;
    }


    /* STR / CON / POW / DEX / APP / SIZ / INT / EDU */

    if (Array.isArray(data.data.params)) {

        const param =
            data.data.params.find(function (item) {

                return item.label === label;

            });

        if (param) {

            const value =
                Number(param.value);

            if (!Number.isNaN(value)) {
                return value;
            }

        }

    }


    /* HP / MP / SAN */

    if (Array.isArray(data.data.status)) {

        const status =
            data.data.status.find(function (item) {

                return item.label === label;

            });

        if (status) {

            const value =
                Number(status.value);

            if (!Number.isNaN(value)) {
                return value;
            }

        }

    }


    /* イニシアチブ */

    if (label === "initiative") {

        const value =
            Number(data.data.initiative);

        if (!Number.isNaN(value)) {
            return value;
        }

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


    if (!grid) {

        console.error(
            "investigator-grid が見つかりません"
        );

        return;

    }


    if (!statSelect) {

        console.error(
            "stat-select が見つかりません"
        );

        return;

    }


    if (!skillInput) {

        console.error(
            "skill-search-input が見つかりません"
        );

        return;

    }


    const cards =
        Array.from(
            grid.querySelectorAll(
                ".investigator-card"
            )
        );


    console.log(
        "探索者カード数:",
        cards.length
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
                skillInput.value
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
                skillInput.value
            );

        }
    );


    console.log(
        "探索者の検索・ソート機能を準備しました"
    );

}


/* =========================
   並べ替え・検索
========================= */

function sortInvestigators(
    grid,
    cards,
    selectedStat,
    skillText
) {

    const searchText =
        skillText
            .trim()
            .toLowerCase();


    const results = [];


    cards.forEach(function (card) {

        const data =
            findInvestigatorData(card);


        /* =========================
           技能検索中
        ========================= */

        if (searchText !== "") {

            if (!data) {

                card.style.display =
                    "none";

                return;

            }


            const skills =
                getSkills(data);


            const matchedSkill =
                skills.find(function (skill) {

                    return skill.name
                        .toLowerCase()
                        .includes(searchText);

                });


            if (!matchedSkill) {

                card.style.display =
                    "none";

                return;

            }


            card.style.display =
                "";


            results.push({

                card: card,

                value: matchedSkill.value,

                label: matchedSkill.name,

                originalOrder:
                    Number(
                        card.dataset.originalOrder
                    )

            });

            return;

        }


        /* =========================
           通常の能力値ソート
        ========================= */

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

            value: value,

            label: selectedStat,

            originalOrder:
                Number(
                    card.dataset.originalOrder
                )

        });

    });


    /* =========================
       数値の大きい順
    ========================= */

    if (
        selectedStat ||
        searchText !== ""
    ) {

        results.sort(function (a, b) {

            const valueA =
                a.value === null
                    ? -1
                    : a.value;

            const valueB =
                b.value === null
                    ? -1
                    : b.value;


            /* 数値が違えば大きい順 */

            if (valueA !== valueB) {

                return valueB - valueA;

            }


            /* 同じ値なら元の順番 */

            return (
                a.originalOrder -
                b.originalOrder
            );

        });

    }


    /* =========================
       実際にカードを並べ直す
    ========================= */

    results.forEach(function (item) {

        grid.appendChild(
            item.card
        );


        updateValueDisplay(
            item.card,
            item.label,
            item.value
        );

    });


    console.log(
        "並び替え:",
        selectedStat ||
        (searchText
            ? "技能：" + searchText
            : "元の順番")
    );

}


/* =========================
   カード上部の数値表示
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
        document.createElement(
            "div"
        );


    display.className =
        "investigator-value";


    let displayLabel =
        label;


    if (label === "initiative") {

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