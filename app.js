"use strict";

// ============================================================
// 設定・共通処理
// ============================================================

// QRコードには ?point=forest-7k2m などのURLを埋め込みます。
const SPOTS = [
    { id: "flower-8p3x", name: "花の広場", letter: "た", x: 22, y: 27 },
    { id: "forest-7k2m", name: "森のひろば", letter: "ん", x: 75, y: 26 },
    { id: "play-4q9v", name: "あそび広場", letter: "け", x: 25, y: 78 },
    { id: "lawn-6w5r", name: "芝生広場", letter: "ん", x: 77, y: 77 }
];

const KEY = "forest-rally-demo-v1";
const ANSWER = "たんけん";
const $ = id => document.getElementById(id);

// ============================================================
// スタンプの読み込み・保存
// ============================================================

function load() {
    try {
        const value = JSON.parse(localStorage.getItem(KEY) || "[]");
        return Array.isArray(value)
            ? value.filter(id => SPOTS.some(spot => spot.id === id))
            : [];
    } catch {
        return [];
    }
}

let collected = load();

function save() {
    try {
        localStorage.setItem(KEY, JSON.stringify(collected));
        return true;
    } catch {
        return false;
    }
}

// ============================================================
// 画面描画
// ============================================================

function render() {
    const count = collected.length;

    $("count").textContent = count;
    $("progress").style.width = `${count / 4 * 100}%`;

    $("markers").replaceChildren();
    $("letters").replaceChildren();
    $("spot-list").replaceChildren();

    SPOTS.forEach((spot, index) => {
        const done = collected.includes(spot.id);

        // マップ上のポイント（獲得済みならスタンプ画像）
        const marker = document.createElement("button");
        marker.className = "marker" + (done ? " done" : "");
        marker.style.left = spot.x + "%";
        marker.style.top = spot.y + "%";
        marker.type = "button";
        marker.setAttribute(
            "aria-label",
            spot.name + (done ? " スタンプ獲得済み" : " 未獲得")
        );

        if (done) {
            const image = document.createElement("img");
            image.src = "./images/stamp.png";
            image.alt = "";
            marker.append(image);
        } else {
            marker.textContent = index + 1;
        }

        marker.onclick = () => {
            $("notice").textContent = spot.name + (
                done ? "：スタンプ獲得済み！" : "：まだスタンプがありません"
            );
        };
        $("markers").append(marker);

        // 獲得したひみつの文字
        const letter = document.createElement("div");
        letter.className = "letter" + (done ? " got" : "");

        const small = document.createElement("small");
        small.textContent = `POINT ${index + 1}`;

        letter.append(small, document.createTextNode(done ? spot.letter : "？"));
        $("letters").append(letter);

        // ポイントごとの獲得状況
        const row = document.createElement("div");
        row.className = "spot";

        const name = document.createElement("span");
        name.textContent = `${index + 1}. ${spot.name}`;

        const status = document.createElement("b");
        status.textContent = done ? "✓ 獲得済み" : "未獲得";

        row.append(name, status);
        $("spot-list").append(row);
    });
}

function showGame() {
    $("intro").hidden = true;
    $("game").hidden = false;
    render();
}

// ============================================================
// スタンプ取得
// ============================================================

function claim(id) {
    const spot = SPOTS.find(spot => spot.id === id);

    if (!spot) {
        $("notice").textContent = "このQRコードは対象外です。";
        return;
    }

    if (collected.includes(id)) {
        $("notice").textContent = `${spot.name} は取得済みです。`;
        return;
    }

    collected.push(id);

    if (!save()) {
        $("notice").textContent = "保存に失敗しました。ブラウザの設定・空き容量をご確認ください。";
        collected = collected.filter(item => item !== id);
        return;
    }

    render();
    $("notice").textContent = `🎉 ${spot.name} のスタンプGET！ 文字「${spot.letter}」が現れた！`;
}

// ============================================================
// ボタン・フォームのイベント
// ============================================================

// ゲーム開始
$("start").addEventListener("click", () => {
    try {
        localStorage.setItem(KEY, JSON.stringify(collected));
    } catch {}

    showGame();
});

// ゴールで答え合わせ
$("answer-form").addEventListener("submit", event => {
    event.preventDefault();

    const result = $("result");
    const input = $("answer").value
        .normalize("NFKC")
        .replace(/[\s　]/g, "");

    result.className = "result";

    if (collected.length < 4) {
        result.textContent = "まずは4つのスタンプを全部集めてね！";
        result.classList.add("error");
    } else if (input === ANSWER) {
        result.textContent = "🎉 大正解！ たんけんコンプリート！ ゴールの係員にこの画面を見せてね。";
        result.classList.add("success");
    } else {
        result.textContent = "おしい！ 集めた文字をポイント順につないでみよう。";
        result.classList.add("error");
    }
});

// 管理者用：ポイントを手動取得するボタン
SPOTS.forEach((spot, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = `POINT ${index + 1} を取得`;
    button.addEventListener("click", () => claim(spot.id));
    $("demo-buttons").append(button);
});

// 管理者用：スタンプをすべてリセット
$("reset").addEventListener("click", () => {
    if (!confirm("獲得したスタンプをすべて消去しますか？")) {
        return;
    }

    collected = [];

    try {
        localStorage.removeItem(KEY);
    } catch {}

    $("answer").value = "";
    $("result").textContent = "";
    $("result").className = "result";
    $("notice").textContent = "デモ記録をリセットしました。";
    render();
});

// ============================================================
// URLパラメータに応じた初期表示
// ============================================================

const params = new URLSearchParams(location.search);
const point = params.get("point");
const isAdmin = params.get("admin") === "1";

// 管理者モードの場合だけデモ操作・リセット機能を表示
$("admin-panel").hidden = !isAdmin;

if (point) {
    showGame();
    claim(point);
    history.replaceState(null, "", location.pathname);
} else if (collected.length > 0 || isAdmin) {
    showGame();
}
