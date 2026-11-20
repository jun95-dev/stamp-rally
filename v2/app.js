"use strict";

// アトラクションの位置（x/y は画像左上を原点とした％）
const SPOTS = [
    { id: "flower-8p3x", name: "めざせ！BIGけん玉マスター", x: 75, y: 55, layer: 1 },
    { id: "forest-7k2m", name: "名所めぐりフェイスクエスト", x: 74, y: 40, layer: 2 },
    { id: "play-4q9v", name: "巨大オセロがえし", x: 84, y: 40, layer: 3 },
    { id: "lawn-6w5r", name: "親子で挑戦！チャレンジ30−30！", x: 30, y: 56, layer: 4 },
    { id: "point-5m2a", name: "めざせ頂上！ボールリフトチャレンジ", x: 27, y: 72, layer: 5 },
    { id: "point-6n3b", name: "〜Ride de Shooting!!〜\n乗り物に乗って的を狙おう！", x: 15, y: 70, layer: 6 },
    { id: "point-7p4c", name: "シニアリーダーとあそぼう！", x: 17, y: 54, layer: 7 },
    { id: "point-8r5d", name: "渋沢探検隊！", x: 84, y: 57, layer: 8 },
    { id: "point-9s6e", name: "滝野川けいさつ", x: 8, y: 56, layer: 9 }
];

// 保存領域。スタンプ情報はブラウザ内にのみ保存します。
const KEY = "forest-rally-demo-v2";
const TEST_KEY = "stamp-rally-v2-reception-test";
const EXCHANGE_KEY = "forest-rally-prize-exchanged-v1";
const $ = id => document.getElementById(id);

function load() {
    try {
        const value = JSON.parse(localStorage.getItem(KEY) || "[]");
        return Array.isArray(value)
            ? [...new Set(value.filter(id => SPOTS.some(spot => spot.id === id)))]
            : [];
    } catch {
        return [];
    }
}

let collected = load();

function isExchanged() {
    try {
        return localStorage.getItem(EXCHANGE_KEY) === "true";
    } catch {
        return false;
    }
}

function save() {
    try {
        localStorage.setItem(KEY, JSON.stringify(collected));
        return true;
    } catch {
        return false;
    }
}

function render() {
    const count = collected.length;
    $("count").textContent = count;
    $("progress").style.width = `${count / SPOTS.length * 100}%`;
    $("markers").replaceChildren();
    $("spot-list").replaceChildren();
    $("art-layers").replaceChildren();

    SPOTS.forEach((spot, index) => {
        const done = collected.includes(spot.id);
        const marker = document.createElement("button");
        marker.className = "marker" + (done ? " done" : "");
        marker.style.left = spot.x + "%";
        marker.style.top = spot.y + "%";
        marker.type = "button";
        marker.setAttribute("aria-label", spot.name + (done ? " スタンプ獲得済み" : " 未獲得"));

        if (done) {
            const image = document.createElement("img");
            image.src = "./images/stamp.png";
            image.alt = "";
            marker.append(image);
        } else {
            marker.textContent = index + 1;
        }
        marker.onclick = () => {
            $("notice").textContent = spot.name + (done ? "：スタンプ獲得済み！" : "：まだスタンプがありません");
        };
        $("markers").append(marker);

        // 獲得済みレイヤーのみ重ねる。取得順に関係なく、常に同じ重なり順。
        if (done) {
            const layerImage = document.createElement("img");
            layerImage.className = "art-layer";
            layerImage.src = `./images/layers/layer_${String(spot.layer).padStart(2, "0")}.png`;
            layerImage.alt = "";
            layerImage.setAttribute("aria-hidden", "true");
            layerImage.style.zIndex = String(spot.layer);
            $("art-layers").append(layerImage);
        }

        const row = document.createElement("div");
        row.className = "spot";
        const name = document.createElement("span");
        name.textContent = `${index + 1}. ${spot.name}`;
        const status = document.createElement("b");
        status.textContent = done ? "✓ 獲得済み" : "未獲得";
        row.append(name, status);
        $("spot-list").append(row);
    });

    $("art-board").classList.toggle("has-layers", count > 0);
    $("art-count").textContent = count === SPOTS.length
        ? "9 / 9 ポイント達成！"
        : `絵の完成まであと${SPOTS.length - count}ポイント！`;
    // 完成メッセージはスタンプをすべて集めたときのみ表示
    $("completion").hidden = count !== SPOTS.length;
    // 景品交換済みメッセージは景品交換済みのときのみ表示
    $("prize-exchanged").hidden = !isExchanged();
}

function showGame() {
    $("intro").hidden = true;
    $("game").hidden = false;
    render();
}

function claim(id) {
    const spot = SPOTS.find(item => item.id === id);
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
        collected = collected.filter(item => item !== id);
        $("notice").textContent = "保存に失敗しました。ブラウザの設定・空き容量をご確認ください。";
        return;
    }
    render();
    $("notice").textContent = collected.length === SPOTS.length
        ? `🎉 ${spot.name} のスタンプGET！ 9つの絵が全部そろったよ！`
        : `🎉 ${spot.name} のスタンプGET！ 絵の一部が現れたよ！`;
}

$("start").addEventListener("click", () => {
    if (!save()) {
        $("intro").querySelector(".note").textContent = "保存できませんでした。通常のブラウザで開いてください。";
        return;
    }
    showGame();
});

SPOTS.forEach((spot, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = `POINT ${index + 1} を取得`;
    button.addEventListener("click", () => claim(spot.id));
    $("demo-buttons").append(button);
});

$("reset").addEventListener("click", () => {
    if (!confirm("スタンプ・受付チュートリアル・景品交換の記録をすべて消去しますか？")) return;
    collected = [];
    try {
        localStorage.removeItem(KEY);
        localStorage.removeItem(TEST_KEY);
        localStorage.removeItem(EXCHANGE_KEY);
    } catch {}
    $("notice").textContent = "スタンプ・受付チュートリアル・景品交換の記録をリセットしました。";
    render();
});

const params = new URLSearchParams(location.search);
const point = params.get("point");
const exchange = params.get("exchange") === "1";
const isAdmin = params.get("admin") === "1";
$("admin-panel").hidden = !isAdmin;

if (exchange) {
    showGame();
    exchangePrize();
    history.replaceState(
        null, "",
        location.pathname + (isAdmin ? "?admin=1" : "")
    );

} else if (point) {
    showGame();
    claim(point);
    history.replaceState(
        null, "",
        location.pathname + (isAdmin ? "?admin=1" : "")
    );

} else if (collected.length > 0 || isExchanged() || isAdmin) {
    showGame();
}

function exchangePrize() {
    if (isExchanged()) {
        $("notice").textContent =
            "✓ この景品は交換済みです。";

    } else {
        try {
            localStorage.setItem(EXCHANGE_KEY, "true");

            $("notice").textContent =
                "✓ 景品交換済みになりました。スタンプラリーは引き続き楽しめます！";
        } catch {
            $("notice").textContent =
                "交換記録を保存できませんでした。係員にお知らせください。";
        }
    }

    render();

    // QR読み取り後、結果を確認しやすい位置へ移動
    const target = isExchanged()
        ? $("prize-exchanged")
        : $("notice");

    requestAnimationFrame(() => {
        target.scrollIntoView({
            block: "center",
            behavior: "auto"
        });
    });
}
