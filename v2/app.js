"use strict";

// B版：マップ上の位置は仮配置（x/y は画像左上を原点とした％）
// 既存4ポイントのQRコードIDは引き継ぎ、新しい4ポイントを追加します。
const SPOTS = [
    { id: "flower-8p3x", name: "花の広場", x: 22, y: 27, layer: 1 },
    { id: "forest-7k2m", name: "森のひろば", x: 75, y: 26, layer: 2 },
    { id: "play-4q9v", name: "あそび広場", x: 25, y: 78, layer: 3 },
    { id: "lawn-6w5r", name: "芝生広場", x: 77, y: 77, layer: 4 },
    { id: "point-5m2a", name: "ポイント5（仮）", x: 47, y: 17, layer: 5 },
    { id: "point-6n3b", name: "ポイント6（仮）", x: 50, y: 43, layer: 6 },
    { id: "point-7p4c", name: "ポイント7（仮）", x: 18, y: 52, layer: 7 },
    { id: "point-8r5d", name: "ポイント8（仮）", x: 55, y: 84, layer: 8 }
];

// A版とは別の保存領域。スタンプ情報はブラウザ内にのみ保存します。
const KEY = "forest-rally-demo-v2";
const TEST_KEY = "stamp-rally-v2-reception-test";
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
        ? "8 / 8 ポイント達成！"
        : `絵の完成まであと${SPOTS.length - count}ポイント！`;
    $("completion").hidden = count !== SPOTS.length;
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
        ? `🎉 ${spot.name} のスタンプGET！ 8つの絵が全部そろったよ！`
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
    if (!confirm("本編のスタンプと受付チュートリアルの記録をすべて消去しますか？")) return;
    collected = [];
    try {
        localStorage.removeItem(KEY);
        localStorage.removeItem(TEST_KEY);
    } catch {}
    $("notice").textContent = "本編と受付チュートリアルの記録をリセットしました。";
    render();
});

const params = new URLSearchParams(location.search);
const point = params.get("point");
const isAdmin = params.get("admin") === "1";
$("admin-panel").hidden = !isAdmin;

if (point) {
    showGame();
    claim(point);
    history.replaceState(null, "", location.pathname + (isAdmin ? "?admin=1" : ""));
} else if (collected.length > 0 || isAdmin) {
    showGame();
}
