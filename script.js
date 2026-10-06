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
        normalizeName(
            nameElement.textContent
        );

    return iacharaInvestigators.find(
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
    ) || null;

}


/* =========================
   版を取得
========================= */

function getEdition(data) {

    if (
        !data ||
        !data.edition
    ) {
        return null;
    }

    return Number(data.edition);

}


/* =========================
   7版の能力値を6版相当に変換
========================= */

function convertValue(
    value,
    data,
    label
) {

    if (
        value === null ||
        value === undefined ||
        Number.isNaN(Number(value))
    ) {
        return null;
    }

    const numericValue =
        Number(value);


    /*
       7版の能力値だけ1/5する。

       HP / MP / SAN / INIT は
       そのまま。

       能力値：
       STR
       CON
       POW
       DEX
       APP
       SIZ
       INT
       EDU
    */

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

        return Math.floor(
            numericValue / 5
        );

    }


    return numericValue;

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


    /* STR / CON / POWなど */

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

            return convertValue(
                param.value,
                data,
                label
            );

        }

    }


    /* HP / MP / SAN */

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

            return convertValue(
                status.value,
                data,
                label
            );

        }

    }


    /* イニシアチブ */

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
        document.querySelector(
            "#edition-select"
        );


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

    cards.forEach(
        function (card, index) {

            card.dataset.originalOrder =
                index;

        }
    );


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


    /* 6版 / 7版変更 */

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


/* =========================
   並べ替え・検索
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


            /* -------------------------
               データがない場合
            ------------------------- */

            if (!data) {

                card.style.display =
                    "none";

                return;

            }


            /* -------------------------
               版フィルター
            ------------------------- */

            const edition =
                getEdition(data);


            if (
                selectedEdition !== "" &&
                String(edition) !==
                String(selectedEdition)
            ) {

                card.style.display =
                    "none";

                return;

            }


            /* -------------------------
               表示
            ------------------------- */

            card.style.display = "";


            /* -------------------------
               技能検索
            ------------------------- */

            if (searchText !== "") {

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


            /* -------------------------
               能力値
            ------------------------- */

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


    /* -------------------------
       並べ替え
    ------------------------- */

    if (
        selectedStat ||
        searchText !== ""
    ) {

        results.sort(
            function (a, b) {

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
                        valueB - valueA
                    );

                }


                return (
                    Number(
                        a.card.dataset
                            .originalOrder
                    )
                    -
                    Number(
                        b.card.dataset
                            .originalOrder
                    )
                );

            }
        );

    }


    /* -------------------------
       カードを並べ直す
    ------------------------- */

    results.forEach(
        function (item) {

            grid.appendChild(
                item.card
            );


            updateValueDisplay(
                item.card,
                item.label,
                item.value,
                item.data
            );

        }
    );


    /* -------------------------
       版表示を更新
    ------------------------- */

    cards.forEach(
        function (card) {

            const data =
                findInvestigatorData(
                    card
                );

            updateEditionDisplay(
                card,
                data
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
    value,
    data
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


/* =========================
   6版 / 7版表示
========================= */

function updateEditionDisplay(
    card,
    data
) {

    const old =
        card.querySelector(
            ".investigator-edition"
        );


    if (old) {
        old.remove();
    }


    if (!data) {
        return;
    }


    const edition =
        getEdition(data);


    if (
        edition !== 6 &&
        edition !== 7
    ) {
        return;
    }


    const display =
        document.createElement(
            "div"
        );


    display.className =
        "investigator-edition";


    display.textContent =
        edition + "版";


    card.appendChild(
        display
    );

}