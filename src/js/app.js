// ============================================================
// グローバル状態管理
// ============================================================
const state = {
  currentSection: 'dashboard',
  stealthActive: false,
  excuseArchive: [],
  alibiSchedules: [],
  settings: {
    teijiTime: '18:00',
    lag: 100,
    alertBefore: 15,
    presidentDetect: 'mid',
    historyDelete: 'logout'
  },
  stats: {
    totalEscapes: 47,
    savedHours: 12.5,
    excusesGenerated: 89,
    stealthActivations: 23
  }
};

// ============================================================
// ナビゲーション
// ============================================================
function navigate(sectionId) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const sec = document.getElementById('section-' + sectionId);
  if (sec) sec.classList.add('active');
  const nav = document.querySelector(`[data-section="${sectionId}"]`);
  if (nav
) nav.classList.add('active');
  state.currentSection = sectionId;
  // モバイル時はサイドバーを閉じる
  document.getElementById('sidebar').classList.remove('open');
}

// ============================================================
// 時計更新
// ============================================================
function updateClock() {
  const now = new Date();
  const h = String(now.getHours()).padStart(2,'0');
  const m = String(now.getMinutes()).padStart(2,'0');
  const s = String(now.getSeconds()).padStart(2,'0');
  const el = document.getElementById('clock');
  if (el) el.textContent = `${h}:${m}:${s}`;

  // 定時カウントダウン
  const teijiStr = state.settings.teijiTime || '18:00';
  const [th, tm] = teijiStr.split(':').map(Number);
  const teiji = new Date(now);
  teiji.setHours(th, tm, 0, 0);
  if (now > teiji) teiji.setDate(teiji.getDate() + 1);
  const diff = Math.max(0, teiji - now);
  const dh = Math.floor(diff / 3600000);
  const dm = Math.floor((diff % 3600000) / 60000);
  const ds = Math.floor((diff % 60000) / 1000);
  const cdEl = document.getElementById('countdown');
  if (cdEl) cdEl.textContent = `${String(dh).padStart(2,'0')}:${String(dm).padStart(2,'0')}:${String(ds).padStart(2,'0')}`;

  // 定時アラート（15分前）
  if (dh === 0 && dm === parseInt(state.settings.alertBefore || 15) && ds === 0) {
    showToast(`⏰ 定時まであと${state.settings.alertBefore}分！そろそろ言い訳を考えましょう`, 'warning');
  }
  // 定時ちょうど
  if (dh === 0 && dm === 0 && ds === 0) {
    showToast('🎉 定時です！シュッ！と消えましょう！', 'success');
  }
}

// ============================================================
// トースト通知
// ============================================================
function showToast(msg, type = 'info', duration = 4000) {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  const colors = {
    info: '#2563eb',
    success: '#16a34a',
    warning: '#d97706',
    danger: '#dc2626'
  };
  toast.style.cssText = `
    background:${colors[type] || colors.info};
    color:#fff;
    padding:12px 18px;
    border-radius:8px;
    font-size:13px;
    max-width:320px;
    box-shadow:0 4px 12px rgba(0,0,0,0.3);
    animation:slideIn 0.3s ease;
    cursor:pointer;
    line-height:1.5;
  `;
  toast.textContent = msg;
  toast.onclick = () => toast.remove();
  container.appendChild(toast);
  setTimeout(() => { toast.style.opacity = '0'; toast.style.transition = 'opacity 0.3s'; setTimeout(() => toast.remove(), 300); }, duration);
}

// ============================================================
// F-01: AI言い訳錬金術
// ============================================================
const excuseDB = {
  family: {
    normal: [
      "実家のルンバが脱走したと連絡がありまして、今すぐ追跡しないといけないんです。",
      "妻/夫が「今日だけは早く帰ってきて」と朝から5回LINEしていまして…",
      "子どもの学校から『謎の植物を持ち帰った』と連絡が入りまして、植物の同定が必要で。",
      "実家の猫が初めてスマホを操作してしまい、何かを注文したらしく確認が必要です。",
      "祖母がNetflixのパスワードを変えてしまって誰も入れない緊急事態が発生しまして。"
    ],
    angry: [
      "（小声で）実は今日、家族との大切な約束がありまして…これ以上は…申し訳ありません…",
      "家族から緊急のSOSが届いておりまして、詳細はちょっと…お察しください…"
    ],
    void: [
      "家庭の事情がございまして。えっと、はい。そういう感じです。",
      "家で色々ありまして。ええ。はい。"
    ]
  },
  health: {
    normal: [
      "急激に『質の良い睡眠』を取りたくなりました。医師から指導されているもので。",
      "先ほどから急に『新鮮な外気』が必要な体調になってきまして…",
      "定期的に『孤独の時間』を摂取しないと体調を崩す体質でして、今がちょうどその時間です。",
      "かかりつけ医から『定時退社療法』を処方されておりまして、本日がその投薬日です。",
      "急に『ソファの引力』に逆らえない症状が出てきまして、これは経験上すぐ帰らないといけない。"
    ],
    angry: [
      "（額に手を当てながら）少し…頭が…申し訳ないですが、今日は…",
      "体調が芳しくなく、このままでは業務に支障が出る可能性がありまして…"
    ],
    void: [
      "なんか、ちょっと、そういう感じで。はい。",
      "体が、ちょっと。ええ。"
    ]
  },
  dimension: {
    normal: [
      "定時に帰らないと、自宅の観葉植物との契約が切れるんです。弁護士も立ち会ってて。",
      "毎日18時に自宅のWi-Fiルーターへ念を送らないと接続が不安定になる体質でして。",
      "飼っているピラニアのご飯の時間が18時丁度に設定されており、私以外が近づくと危険なんです。",
      "自宅のドアが18時を過ぎると別の次元に繋がる可能性があり、今日がその日です。",
      "占星術師に『今日17時59分以降の残業は全宇宙の運気に影響する』と言われまして。"
    ],
    angry: [
      "色々と…次元的な事情がありまして…説明が難しいんですが…はい…",
      "ちょっと、スピリチュアルな予定がありまして。はい。"
    ],
    void: [
      "なんか、宇宙的な感じで。うん。",
      "そういう予言がありまして。ええ。"
    ]
  },
  work: {
    normal: [
      "本日の業務目標を全て達成したため、これ以上残留すると過剰品質となりコスト超過が発生します。",
      "ワークライフバランス改革の一環として、本日の勤務時間最適化を実施します。",
      "明日の業務に備えた戦略的体力温存プログラムの実行時間となりました。",
      "時間外労働の削減によるコスト最適化のため、予定通り定時にて業務終了します。",
      "生産性向上のため、本日の目標工数を達成した段階での撤退を選択します。"
    ],
    angry: [
      "本日の業務目標は達成済みでして、追加タスクは明日以降での対応となります。",
      "36協定の観点から、本日はこれにて失礼させていただきます。"
    ],
    void: [
      "仕事終わったんで。はい。",
      "やること終わりました。お疲れ様です。"
    ]
  }
};

function generateExcuse() {
  const mood = document.getElementById('boss-mood').value;
  const mode = document.getElementById('excuse-mode').value;
  const hp = parseInt(document.getElementById('user-hp').value || 50);

  const db = excuseDB[mode] || excuseDB.family;
  let pool;
  if (mood === 'angry') pool = db.angry;
  else if (mood === 'void') pool = db.void;
  else pool = db.normal;

  if (!pool || pool.length === 0) pool = db.normal;
  const excuse = pool[Math.floor(Math.random() * pool.length)];

  // HP補正
  let prefix = '';
  if (hp < 30) prefix = '（限界オーラを全身から放ちながら）';
  else if (hp < 60) prefix = '（少し疲れた表情で）';
  else if (hp > 85) prefix = '（爽やかな笑顔で）';

  const fullExcuse = prefix + excuse;

  const outputEl = document.getElementById('excuse-output');
  outputEl.textContent = fullExcuse;
  outputEl.style.animation = 'none';
  setTimeout(() => { outputEl.style.animation = 'fadeIn 0.5s ease'; }, 10);

  // アーカイブに保存
  state.excuseArchive.unshift({ text: fullExcuse, mode, mood, hp, time: new Date().toLocaleTimeString() });
  if (state.excuseArchive.length > 20) state.excuseArchive.pop();
  state.stats.excusesGenerated++;
  updateArchiveDisplay();
  updateStats();

  showToast('✅ 言い訳を生成しました。上司の目を見て、3秒後に発動してください。', 'success');
}

function updateArchiveDisplay() {
  const el = document.getElementById('excuse-archive');
  if (!el) return;
  if (state.excuseArchive.length === 0) {
    el.innerHTML = '<p style="color:var(--text-light);font-size:12px;text-align:center;padding:16px;">まだ言い訳が生成されていません</p>';
    return;
  }
  el.innerHTML = state.excuseArchive.slice(0, 5).map(a => `
    <div style="padding:8px;border-bottom:1px solid var(--border-color);font-size:12px;">
      <div style="color:var(--text-light);margin-bottom:3px;">${a.time} ｜ HP:${a.hp}% ｜ ${a.mood}</div>
      <div style="color:var(--text-primary);">${a.text}</div>
    </div>
  `).join('');
}

// ============================================================
// F-02: ステルス迷彩
// ============================================================
function activateStealth() {
  if (state.stealthActive) return;
  state.stealthActive = true;
  document.getElementById('stealth-indicator').style.display = 'block';
  document.getElementById('stealth-overlay').style.display = 'flex';
  state.stats.stealthActivations++;
  updateStats();

  // タイピング音エフェクト（Web Audio API）
  playTypingSound();

  showToast('🥷 ステルスモード発動！スペースキー×2で解除', 'info', 8000);
}

function deactivateStealth() {
  if (!state.stealthActive) return;
  state.stealthActive = false;
  document.getElementById('stealth-indicator').style.display = 'none';
  document.getElementById('stealth-overlay').style.display = 'none';
  showToast('✅ ステルス解除。お疲れ様でした。', 'success');
}

// スペースキー2連打検出
let spaceCount = 0;
let spaceTimer = null;
document.addEventListener('keydown', (e) => {
  if (e.code === 'Space') {
    e.preventDefault();
    spaceCount++;
    clearTimeout(spaceTimer);
    spaceTimer = setTimeout(() => { spaceCount = 0; }, 600);
    if (spaceCount >= 2) {
      spaceCount = 0;
      if (state.stealthActive) deactivateStealth();
      else activateStealth();
    }
  }
  // Escキーで解除
  if (e.code === 'Escape' && state.stealthActive) deactivateStealth();
});

function playTypingSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    function typeClick(time) {
      const buf = ctx.createBuffer(1, ctx.sampleRate * 0.05, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 3);
      const src = ctx.createBufferSource();
      src.buffer = buf;
      const gain = ctx.createGain();
      gain.gain.value = 0.15;
      src.connect(gain);
      gain.connect(ctx.destination);
      src.start(time);
    }
    for (let i = 0; i < 30; i++) {
      if (Math.random() > 0.3) typeClick(ctx.currentTime + i * 0.08 + Math.random() * 0.04);
    }
  } catch(e) { /* ブラウザ非対応 */ }
}

// ダミースプレッドシートのセルクリック
function cellClick(el) {
  document.querySelectorAll('.ss-cell.selected').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');
  const addr = el.dataset.addr || 'A1';
  document.getElementById('cell-addr').textContent = addr;
  document.getElementById('formula-bar').value = el.textContent || '';
}

// ============================================================
// F-03: アリバイ工作
// ============================================================
function scheduleAlibi() {
  const time = document.getElementById('alibi-time').value;
  const msg = document.getElementById('alibi-message').value.trim();
  const platform = document.getElementById('alibi-platform').value;

  if (!time || !msg) { showToast('⚠️ 時刻とメッセージを入力してください', 'warning'); return; }

  const schedule = { id: Date.now(), time, msg, platform, status: 'pending' };
  state.alibiSchedules.unshift(schedule);
  renderAlibiList();
  showToast(`✅ ${platform}に「${time}」送信予約完了。アリバイ確立。`, 'success');
  document.getElementById('alibi-message').value = '';
}

function renderAlibiList() {
  const el = document.getElementById('alibi-list');
  if (!el) return;
  if (state.alibiSchedules.length === 0) {
    el.innerHTML = '<p style="color:var(--text-light);font-size:12px;text-align:center;padding:16px;">予約済みメッセージはありません</p>';
    return;
  }
  el.innerHTML = state.alibiSchedules.map(s => `
    <div style="display:flex;align-items:center;gap:8px;padding:8px;border-bottom:1px solid var(--border-color);font-size:12px;">
      <span style="color:var(--accent-blue);font-weight:bold;min-width:48px;">${s.time}</span>
      <span style="flex:1;color:var(--text-primary);">${s.msg}</span>
      <span style="color:var(--text-light);min-width:60px;">${s.platform}</span>
      <span style="color:${s.status==='pending'?'var(--accent-yellow)':'var(--accent-green)'};">${s.status==='pending'?'⏳待機':'✅送信済'}</span>
      <button onclick="removeAlibi(${s.id})" style="background:none;border:none;color:var(--accent-red);cursor:pointer;font-size:14px;">✕</button>
    </div>
  `).join('');
}

function removeAlibi(id) {
  state.alibiSchedules = state.alibiSchedules.filter(s => s.id !== id);
  renderAlibiList();
}

function insertTemplate(type) {
  const templates = {
    morning: 'ふう、ひと段落…明日も頑張ります💪（※深夜4時12分の孤独な戦士より）',
    late: 'まだやってます…終わりが見えない…でも諦めない…（チラ見推奨）',
    early: '本日も24時間365日対応できる体制でお待ちしております。いつでもどうぞ。'
  };
  const el = document.getElementById('alibi-message');
  if (el) el.value = templates[type] || '';
}

// ============================================================
// F-04: 脱出ルート最適化
// ============================================================
const radarData = [
  { angle: 45, dist: 60, name: '先輩A', risk: 'high', label: '話しかけてくる先輩' },
  { angle: 160, dist: 45, name: '上司B', risk: 'critical', label: '仕事を振る上司' },
  { angle: 220, dist: 75, name: '同僚C', risk: 'low', label: '無害な同僚' },
  { angle: 300, dist: 55, name: '部長D', risk: 'high', label: '謎の圧力を放つ部長' },
  { angle: 10, dist: 80, name: '新人E', risk: 'low', label: '質問してくる新人' }
];

function drawRadar() {
  const canvas = document.getElementById('radar-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const cx = W / 2, cy = H / 2, R = Math.min(W, H) / 2 - 20;

  ctx.clearRect(0, 0, W, H);

  // 背景
  ctx.fillStyle = '#0a0f1e';
  ctx.fillRect(0, 0, W, H);

  // 同心円
  for (let i = 1; i <= 4; i++) {
    ctx.beginPath();
    ctx.arc(cx, cy, R * i / 4, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(0,255,65,0.2)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // 十字線
  ctx.strokeStyle = 'rgba(0,255,65,0.3)';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(cx - R, cy); ctx.lineTo(cx + R, cy); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx, cy - R); ctx.lineTo(cx, cy + R); ctx.stroke();

  // スキャンライン
  const scanAngle = (Date.now() / 2000) % (Math.PI * 2);
  const grad = ctx.createConicalGradient ? null : null;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.arc(cx, cy, R, scanAngle - 0.4, scanAngle);
  ctx.fillStyle = 'rgba(0,255,65,0.15)';
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + Math.cos(scanAngle) * R, cy + Math.sin(scanAngle) * R);
  ctx.strokeStyle = 'rgba(0,255,65,0.8)';
  ctx.lineWidth = 2;
  ctx.stroke();

  // 脅威ブリップ
  radarData.forEach(d => {
    const rad = (d.angle - 90) * Math.PI / 180;
    const x = cx + Math.cos(rad) * (d.dist / 100) * R;
    const y = cy + Math.sin(rad) * (d.dist / 100) * R;
    const color = d.risk === 'critical' ? '#ff4444' : d.risk === 'high' ? '#ffaa00' : '#00ff41';

    // ブリップ
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();

    // ラベル
    ctx.fillStyle = color;
    ctx.font = '10px monospace';
    ctx.fillText(d.name, x + 8, y + 4);
  });

  // 自分（中心）
  ctx.beginPath();
  ctx.arc(cx, cy, 6, 0, Math.PI * 2);
  ctx.fillStyle = '#00aaff';
  ctx.fill();
  ctx.fillStyle = '#00aaff';
  ctx.font = 'bold 10px monospace';
  ctx.fillText('YOU', cx + 8, cy + 4);

  // 目標（エレベーター）
  ctx.beginPath();
  ctx.arc(cx - R * 0.7, cy + R * 0.1, 6, 0, Math.PI * 2);
  ctx.fillStyle = '#00ff41';
  ctx.fill();
  ctx.strokeStyle = '#00ff41';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#00ff41';
  ctx.font = '9px monospace';
  ctx.fillText('EXIT', cx - R * 0.7 + 8, cy + R * 0.1 + 4);

  requestAnimationFrame(drawRadar);
}

function calcEscapeRoute() {
  const layout = document.getElementById('office-layout').value;
  const avoid = document.getElementById('avoid-type').value;

  const routes = {
    open: {
      boss: '非推奨: 上司の死角となる大型モニター列を伝い、東側非常階段を経由。推定所要時間: 45秒',
      senior: '壁沿いルートで先輩の視野角外を通過。コピー機の陰で一時停止後、ダッシュ推奨',
      all: '現在リスクレベル：CRITICAL。トイレに立つふりをして荷物を小分けで出す作戦を推奨'
    },
    partitioned: {
      boss: 'パーテーション活用: 上司席の対角線ルートで死角を確保。カーディガンは椅子に残置。',
      senior: '先輩の席背面通路を低姿勢で通過。17:58に「お腹痛い」フラグを立てておくと尚良。',
      all: 'パーテーション迷路を最大活用。北側非常口経由の完全ステルスルートを推奨。'
    },
    remote: {
      boss: 'カメラOFF推奨。Slackに「少し席を外します」と投稿してそのままログアウト。',
      senior: 'ステータスを「集中モード」に変更後、Wi-Fiを切断。消えた実績あり。',
      all: 'PC画面を暗くして「会議に入ります」と書いてシャットダウン。完璧。'
    }
  };

  const result = (routes[layout] || routes.open)[avoid] || routes.open.boss;
  const el = document.getElementById('route-result');
  el.style.display = 'block';
  el.innerHTML = `
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
      <span style="font-size:20px;">🗺️</span>
      <strong style="color:var(--accent-green);">最適脱出ルート確立</strong>
    </div>
    <p style="color:var(--text-primary);font-size:13px;line-height:1.7;">${result}</p>
    <div style="margin-top:8px;padding:8px;background:var(--bg-primary);border-radius:6px;font-size:12px;color:var(--text-light);">
      ⚠️ 実行前に必ず周囲の状況を目視確認してください。本ルートは参考情報です。
    </div>
  `;
  showToast('🗺️ 脱出ルートを計算しました', 'success');
}

// ============================================================
// 統計更新
// ============================================================
function updateStats() {
  const ids = ['stat-escapes','stat-hours','stat-excuses','stat-stealth'];
  const vals = [state.stats.totalEscapes, state.stats.savedHours, state.stats.excusesGenerated, state.stats.stealthActivations];
  ids.forEach((id, i) => { const el = document.getElementById(id); if (el) el.textContent = vals[i]; });
}

// ============================================================
// 設定
// ============================================================
function saveSettings() {
  state.settings.teijiTime = document.getElementById('settings-teiji-time').value || '18:00';
  state.settings.lag = document.getElementById('settings-lag').value || 100;
  state.settings.alertBefore = document.getElementById('settings-alert-before').value || 15;
  state.settings.presidentDetect = document.getElementById('settings-president-detect').value || 'mid';
  state.settings.historyDelete = document.getElementById('settings-history-delete').value || 'logout';
  showToast('⚙️ 設定を保存しました', 'success');
}

function clearAllData() {
  if (confirm('本当に全データを消去しますか？\n（「最初から何もなかった」状態になります）')) {
    state.excuseArchive = [];
    state.alibiSchedules = [];
    state.stats = { totalEscapes: 0, savedHours: 0, excusesGenerated: 0, stealthActivations: 0 };
    updateArchiveDisplay();
    renderAlibiList();
    updateStats();
    showToast('🗑️ 全データ消去完了。あなたは最初からここにいませんでした。', 'info');
  }
}

function exportData() {
  const data = JSON.stringify({ stats: state.stats, excuseArchive: state.excuseArchive, alibiSchedules: state.alibiSchedules }, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'syut_data_' + new Date().toISOString().slice(0,10) + '.json';
  a.click();
  URL.revokeObjectURL(url);
  showToast('📤 データを書き出しました（証拠として保管してください）', 'info');
}

// ============================================================
// 社長検知デモ
// ============================================================
function triggerPresidentAlert() {
  showToast('🚨 ALERT: 社長/役員クラスの存在を検知！日経電子版に切り替えます…', 'danger', 6000);
  document.getElementById('stealth-overlay').style.display = 'flex';
  setTimeout(() => {
    if (state.stealthActive) return;
    document.getElementById('stealth-overlay').style.display = 'none';
  }, 5000);
}

// ============================================================
// HP スライダー表示更新
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  const hpInput = document.getElementById('user-hp');
  const hpVal = document.getElementById('hp-value');
  if (hpInput && hpVal) {
    hpInput.addEventListener('input', () => {
      const v = hpInput.value;
      let label = '';
      if (v >= 80) label = '元気';
      else if (v >= 50) label = '普通';
      else if (v >= 20) label = '消耗';
      else label = '瀕死';
      hpVal.textContent = `${v}% (${label})`;
    });
  }

  // 初期化
  updateStats();
  updateArchiveDisplay();
  renderAlibiList();
  setInterval(updateClock, 1000);
  updateClock();

  // レーダー描画
  setTimeout(drawRadar, 500);

  // デフォルトの設定値を反映
  const teijiEl = document.getElementById('settings-teiji-time');
  if (teijiEl) teijiEl.value = state.settings.teijiTime;

  // 起動トースト
  setTimeout(() => showToast('🍋 シュッ！(Syut!) 起動完了。本日も定時退社を全力支援します。', 'success', 5000), 1000);
});