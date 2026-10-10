"use strict";
// デモ用: QRコードには ?point=forest-7k2m などのURLを埋め込みます。
const SPOTS=[
 {id:"flower-8p3x",name:"花の広場",letter:"た",x:22,y:27},
 {id:"forest-7k2m",name:"森のひろば",letter:"ん",x:75,y:26},
 {id:"play-4q9v",name:"あそび広場",letter:"け",x:25,y:78},
 {id:"lawn-6w5r",name:"芝生広場",letter:"ん",x:77,y:77}
];
const KEY="forest-rally-demo-v1";const ANSWER="たんけん";
const $=id=>document.getElementById(id);
function load(){try{const value=JSON.parse(localStorage.getItem(KEY)||"[]");return Array.isArray(value)?value.filter(v=>SPOTS.some(s=>s.id===v)):[]}catch{return []}}
let collected=load();
function save(){try{localStorage.setItem(KEY,JSON.stringify(collected));return true}catch{return false}}
function render(){const count=collected.length;$("count").textContent=count;$("progress").style.width=`${count/4*100}%`;
 $("markers").replaceChildren();$("letters").replaceChildren();$("spot-list").replaceChildren();
 SPOTS.forEach((s,i)=>{const done=collected.includes(s.id);const b=document.createElement("button");b.className="marker"+(done?" done":"");b.style.left=s.x+"%";b.style.top=s.y+"%";b.type="button";b.setAttribute("aria-label",s.name+(done?" スタンプ獲得済み":" 未獲得"));if(done){const img=document.createElement("img");img.src="./images/stamp.png";img.alt="";b.append(img)}else b.textContent=i+1;b.onclick=()=>{$("notice").textContent=s.name+(done?"：スタンプ獲得済み！":"：まだスタンプがありません")};$("markers").append(b);
 const letter=document.createElement("div");letter.className="letter"+(done?" got":"");const small=document.createElement("small");small.textContent=`POINT ${i+1}`;letter.append(small,document.createTextNode(done?s.letter:"？"));$("letters").append(letter);
 const row=document.createElement("div");row.className="spot";const name=document.createElement("span");name.textContent=`${i+1}. ${s.name}`;const status=document.createElement("b");status.textContent=done?"✓ 獲得済み":"未獲得";row.append(name,status);$("spot-list").append(row)})}
function showGame(){ $("intro").hidden=true;$("game").hidden=false;render() }
function claim(id){const spot=SPOTS.find(s=>s.id===id);if(!spot){$("notice").textContent="このQRコードは対象外です。";return}if(collected.includes(id)){$("notice").textContent=`${spot.name} は取得済みです。`;return}collected.push(id);if(!save()){$("notice").textContent="保存に失敗しました。ブラウザの設定・空き容量をご確認ください。";collected=collected.filter(x=>x!==id);return}render();$("notice").textContent=`🎉 ${spot.name} のスタンプGET！ 文字「${spot.letter}」が現れた！`}
$("start").addEventListener("click",()=>{try{localStorage.setItem(KEY,JSON.stringify(collected))}catch{}showGame()});
$("answer-form").addEventListener("submit",e=>{e.preventDefault();const result=$("result");const input=$("answer").value.normalize("NFKC").replace(/[\s　]/g,"");result.className="result";if(collected.length<4){result.textContent="まずは4つのスタンプを全部集めてね！";result.classList.add("error")}else if(input===ANSWER){result.textContent="🎉 大正解！ たんけんコンプリート！ ゴールの係員にこの画面を見せてね。";result.classList.add("success")}else{result.textContent="おしい！ 集めた文字をポイント順につないでみよう。";result.classList.add("error")}});
SPOTS.forEach((s,i)=>{const b=document.createElement("button");b.type="button";b.textContent=`POINT ${i+1} を取得`;b.addEventListener("click",()=>claim(s.id));$("demo-buttons").append(b)});
$("reset").addEventListener("click",()=>{if(!confirm("獲得したスタンプをすべて消去しますか？"))return;collected=[];try{localStorage.removeItem(KEY)}catch{}$("answer").value="";$("result").textContent="";$("result").className="result";$("notice").textContent="デモ記録をリセットしました。";render()});
const params = new URLSearchParams(location.search);
const point = params.get("point");
const isAdmin = params.get("admin") === "1";

// 管理者モードの場合だけデモ操作・リセット機能を表示
$("admin-panel").hidden = !isAdmin;
if(point){showGame();claim(point);history.replaceState(null,"",location.pathname)}else if(collected.length){showGame()}
