"use strict";

// 本編のスタンプとは独立した受付チュートリアル用の保存キー。
// app.js の管理者リセットでも同じキーを削除します。
const TEST_KEY = "stamp-rally-v2-reception-test";
const VALID_CHECKS = ["1", "2"];
const $ = id => document.getElementById(id);

// 受付チェックの獲得状況を localStorage から読み込む
function readChecks() {
    try {
        const saved = JSON.parse(localStorage.getItem(TEST_KEY) || "[]");
        return Array.isArray(saved)
            ? VALID_CHECKS.filter(id => saved.includes(id))
            : [];
    } catch {
        return [];
    }
}

// 受付チェックの獲得状況を localStorage に保存する
function saveChecks(checks) {
    try {
        localStorage.setItem(TEST_KEY, JSON.stringify(checks));
        // 同じページでの保存・読み出しができることも確認する。
        const confirmed = readChecks();
        return checks.every(id => confirmed.includes(id));
    } catch {
        return false;
    }
}

const params = new URLSearchParams(location.search);
const check = params.get("check");
let checks = readChecks();
let storageError = false;

// URLのcheckパラメータが有効で、まだ獲得していない場合は、獲得済みにする
if (VALID_CHECKS.includes(check) && !checks.includes(check)) {
    const nextChecks = [...checks, check];
    if (saveChecks(nextChecks)) {
        checks = readChecks();
    } else {
        storageError = true;
    }
}

// URLのcheckを消しても、獲得状況はlocalStorageから復元されます。
if (check) {
    try { history.replaceState(null, "", location.pathname); } catch {}
}

// 受付チェックの獲得状況を画面に反映する
VALID_CHECKS.forEach(id => {
    const step = $("test-step-" + id);
    const done = checks.includes(id);
    step.classList.toggle("done", done);
    step.querySelector("span").textContent = done ? "✓ クリア" : "まだ";
});

// 受付チェックの獲得状況に応じて、画面のメッセージを切り替える
if (storageError) {
    $("test-emoji").textContent = "⚠️";
    $("test-title").textContent = "保存を確認できませんでした";
    $("test-message").textContent = "通常モードのSafari・Chromeで試してください。";
} else if (checks.length === VALID_CHECKS.length) {
    $("test-emoji").textContent = "🎉";
    $("test-title").textContent = "スタンプラリースタート！";
    $("test-message").textContent = "準備ができました。 9つのポイントを巡って、ひみつの絵を完成させよう！";
    $("test-go").hidden = false;
} else if (checks.length === 1) {
    $("test-emoji").textContent = "✨";
    $("test-title").textContent = "スマホの動作確認";
    $("test-message").textContent = "もう1つのQRコードを、標準カメラで読み取ってね！";
} else {
    $("test-emoji").textContent = "🧭";
    $("test-title").textContent = "スマホの動作確認";
    $("test-message").textContent = "受付にある2つのQRコードを、スマホの標準カメラで読み取ってね！";
}
