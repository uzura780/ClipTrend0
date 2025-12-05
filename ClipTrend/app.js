const API_URL = "https://script.google.com/macros/s/AKfycbxR7Z60Rxgguq1dNv6TRNMYczxM6eHhVCnEAm9geb1FuZqixtIrRFjPOjNjNP9WKBv_Uw/exec"; // ←あなたのデプロイURLに変更
const genres = ["music","game","anime","sns"];
let votes = {music:{},game:{},anime:{},sns:{}};
let voteHistory = JSON.parse(localStorage.getItem("voteHistory")) || {};

const genreSelect = document.getElementById("genreSelect");
genreSelect.innerHTML = genres.map(g => `<option value="${g}">${capitalize(g)}</option>`).join("");

const countdownDiv = document.getElementById("countdown");

function capitalize(s){return s.charAt(0).toUpperCase()+s.slice(1);}
function todayStr(){const d=new Date();return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;}

// ===== ランキング表示 =====
function updateRankings(){
  genres.forEach(g => showTop5(g));
}

// ===== グローバル関数化（ボタン用） =====
window.showTop5 = function(genre){
  const list = document.getElementById(`${genre}Rank`);
  const sorted = Object.entries(votes[genre] || {}).sort((a,b)=>b[1]-a[1]);
  const top5 = sorted.slice(0,5);
  list.innerHTML = top5.map(([name,count],i)=>`<li>${i+1}位：${name}（${count}票）</li>`).join("");
}

window.showAll = function(genre){
  const list = document.getElementById(`${genre}Rank`);
  const sorted = Object.entries(votes[genre] || {}).sort((a,b)=>b[1]-a[1]);
  list.innerHTML = sorted.map(([name,count],i)=>`<li>${i+1}位：${name}（${count}票）</li>`).join("");
}

// ===== カウントダウン =====
function updateCountdown(lastResetISO){
  const lastReset = new Date(lastResetISO);
  const resetTime = new Date(lastReset.getTime() + 7*24*60*60*1000);
  let diff = resetTime - new Date();
  if(diff < 0) diff = 0;

  const days = Math.floor(diff / (1000*60*60*24));
  diff -= days*1000*60*60*24;
  const hours = Math.floor(diff / (1000*60*60));
  diff -= hours*1000*60*60;
  const minutes = Math.floor(diff / (1000*60));
  diff -= minutes*1000*60;
  const seconds = Math.floor(diff / 1000);

  countdownDiv.textContent = `ランキングリセットまであと ${days}日 ${hours}時間 ${minutes}分 ${seconds}秒`;
}

// ===== サーバーからランキング取得 =====
async function loadServerRankings(){
  try{
    const res = await fetch(API_URL);
    const data = await res.json();
    votes = data.votes || data;
    localStorage.setItem("inputVotes", JSON.stringify(votes));
    updateRankings();

    if(data.lastReset){
      updateCountdown(data.lastReset);
      setInterval(()=>updateCountdown(data.lastReset), 1000);
    }
  }catch(e){console.error("ランキング取得失敗", e);}
}

// ===== 投票ボタン =====
document.getElementById("voteBtn").addEventListener("click", async ()=>{
  const g = genreSelect.value;
  const item = document.getElementById("itemInput").value.trim();
  if(!g || !item){ alert("ジャンルとアイテムを入力してください"); return; }

  const today = todayStr();
  if(voteHistory[g] === today){
    alert("このジャンルには今日すでに投票しています！");
    return;
  }

  try{
    await fetch(`${API_URL}?genre=${encodeURIComponent(g)}&item=${encodeURIComponent(item)}`);
  }catch(e){console.error("送信失敗", e);}

  if(!votes[g][item]) votes[g][item]=0;
  votes[g][item]++;
  localStorage.setItem("inputVotes", JSON.stringify(votes));

  voteHistory[g] = today;
  localStorage.setItem("voteHistory", JSON.stringify(voteHistory));

  await loadServerRankings();
  document.getElementById("itemInput").value = "";
  alert("投票ありがとうございました！");
});

// ===== 初期表示 =====
loadServerRankings();
