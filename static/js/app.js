// 画面遷移・進行・保存・音声（spec.md US-0, US-5）
import * as pattern from './games/pattern.js';
import * as oddOneOut from './games/odd_one_out.js';
import * as sizeOrder from './games/size_order.js';
import * as compareCount from './games/compare_count.js';

const MODULES = {
  pattern,
  odd_one_out: oddOneOut,
  size_order: sizeOrder,
  compare_count: compareCount,
};
const FALLBACK_GAMES = [
  { id: 'pattern', title: 'つぎは どれ?', icon: '🔁' },
  { id: 'odd_one_out', title: 'なかまはずれ', icon: '🔍' },
  { id: 'size_order', title: 'おおきい じゅん', icon: '📏' },
  { id: 'compare_count', title: 'どっちが おおい?', icon: '⚖️' },
];
const PRAISES = ['すごいね!', 'やったね!', 'せいかい!', 'じょうず!'];
const RETRY = 'もういちど やってみよう';
const STORE_KEY = 'ronri-asobi:v1';
const PER_SESSION = 5;
const STREAK_TO_LEVEL_UP = 3;
const MAX_LEVEL = 3;

const $ = (id) => document.getElementById(id);
const screens = { home: $('home'), play: $('play'), reward: $('reward') };

let games = FALLBACK_GAMES;
let session = null;

// ---------- 保存（端末内のみ） ----------
let memoryStore = {};

function loadStore() {
  try {
    return JSON.parse(localStorage.getItem(STORE_KEY)) || memoryStore;
  } catch {
    return memoryStore;
  }
}

function saveStore(store) {
  memoryStore = store;
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(store));
  } catch { /* プライベートモードなどでは保存しない */ }
}

function progressOf(gameId) {
  return { level: 1, stars: 0, streak: 0, ...loadStore()[gameId] };
}

function saveProgress(gameId, progress) {
  saveStore({ ...loadStore(), [gameId]: progress });
}

// ---------- 音声 ----------
let jaVoice = null;

function pickVoice() {
  if (!('speechSynthesis' in window)) return;
  jaVoice = speechSynthesis.getVoices().find((v) => v.lang.startsWith('ja')) || null;
}

function speak(text) {
  if (!('speechSynthesis' in window)) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'ja-JP';
  if (jaVoice) u.voice = jaVoice;
  u.rate = 0.9;
  u.pitch = 1.2;
  speechSynthesis.speak(u);
}

// ---------- 画面 ----------
function show(name) {
  Object.entries(screens).forEach(([key, node]) => { node.hidden = key !== name; });
  window.scrollTo(0, 0);
}

function renderHome() {
  const list = $('game-list');
  list.replaceChildren();
  games.forEach((g, i) => {
    const p = progressOf(g.id);
    const card = document.createElement('button');
    card.type = 'button';
    card.className = `game-card c${i} pop-in`;
    card.style.animationDelay = `${i * 0.08}s`;
    card.innerHTML = `
      <span class="game-icon">${g.icon}</span>
      <span class="game-title">${g.title}</span>
      <span class="game-meta">
        <span class="game-level" aria-label="レベル ${p.level}">${'★'.repeat(p.level)}${'☆'.repeat(MAX_LEVEL - p.level)}</span>
        <span class="game-stars">⭐ ${p.stars}</span>
      </span>`;
    card.addEventListener('click', () => startGame(g.id));
    list.append(card);
  });
  show('home');
}

function renderProgress() {
  const bar = $('progress');
  bar.replaceChildren();
  for (let i = 0; i < PER_SESSION; i++) {
    const dot = document.createElement('span');
    dot.className = 'dot';
    if (i < session.index) dot.classList.add(session.results[i] ? 'star' : 'done');
    if (i === session.index) dot.classList.add('current');
    dot.textContent = i < session.index && session.results[i] ? '⭐' : '';
    bar.append(dot);
  }
}

// ---------- 進行 ----------
async function startGame(gameId) {
  const { level } = progressOf(gameId);
  session = { gameId, puzzles: [], index: 0, mistakes: 0, results: [], locked: true };
  show('play');
  $('prompt').textContent = '';
  $('board').replaceChildren(Object.assign(document.createElement('p'), {
    className: 'loading', textContent: 'じゅんび ちゅう…',
  }));
  renderProgress();
  try {
    const res = await fetch(`/api/puzzles?game=${gameId}&level=${level}&count=${PER_SESSION}`);
    if (!res.ok) throw new Error(res.status);
    session.puzzles = (await res.json()).puzzles;
  } catch {
    const retry = document.createElement('button');
    retry.className = 'big-btn again';
    retry.textContent = '🔄 もういちど';
    retry.addEventListener('click', () => startGame(gameId));
    $('board').replaceChildren(
      Object.assign(document.createElement('p'), { className: 'loading', textContent: 'つながらないよ…' }),
      retry,
    );
    return;
  }
  renderPuzzle();
}

function renderPuzzle() {
  const puzzle = session.puzzles[session.index];
  session.mistakes = 0;
  session.locked = false;
  renderProgress();
  $('prompt').textContent = puzzle.prompt;
  const board = $('board');
  board.replaceChildren();
  board.className = `board game-${puzzle.game}`;
  MODULES[puzzle.game].render(board, puzzle, { correct: onCorrect, wrong: onWrong });
  speak(puzzle.prompt);
}

function onCorrect() {
  if (session.locked) return;
  session.locked = true;
  const firstTry = session.mistakes === 0;
  session.results.push(firstTry);

  const p = progressOf(session.gameId);
  let leveledUp = false;
  if (firstTry) {
    p.stars += 1;
    p.streak += 1;
    if (p.streak >= STREAK_TO_LEVEL_UP && p.level < MAX_LEVEL) {
      p.level += 1;
      p.streak = 0;
      leveledUp = true;
    }
  } else {
    p.streak = 0;
  }
  saveProgress(session.gameId, p);

  starBurst();
  speak(leveledUp ? 'レベル アップ! すごいね!' : PRAISES[Math.floor(Math.random() * PRAISES.length)]);
  if (leveledUp) toast('🎉 レベル アップ!');

  setTimeout(() => {
    session.index += 1;
    if (session.index < session.puzzles.length) renderPuzzle();
    else showReward();
  }, leveledUp ? 2000 : 1400);
}

function onWrong(node) {
  if (session.locked) return;
  session.mistakes += 1;
  node.classList.remove('pop-in', 'shake');
  void node.offsetWidth; // アニメーションを再始動させる
  node.classList.add('shake');
  speak(RETRY);
}

function showReward() {
  const stars = session.results.filter(Boolean).length;
  const box = $('reward-stars');
  box.replaceChildren();
  for (let i = 0; i < PER_SESSION; i++) {
    const s = document.createElement('span');
    s.className = `reward-star ${i < stars ? 'on' : 'off'}`;
    s.style.animationDelay = `${0.2 + i * 0.18}s`;
    s.textContent = i < stars ? '⭐' : '☆';
    box.append(s);
  }
  show('reward');
  confetti();
  speak(`よく できました! ほしが ${stars}こ`);
}

// ---------- 演出 ----------
function starBurst() {
  const fx = $('fx');
  for (let i = 0; i < 12; i++) {
    const s = document.createElement('span');
    s.className = 'burst';
    s.textContent = i % 3 ? '⭐' : '✨';
    const angle = (Math.PI * 2 * i) / 12;
    s.style.setProperty('--dx', `${Math.cos(angle) * 160}px`);
    s.style.setProperty('--dy', `${Math.sin(angle) * 160}px`);
    fx.append(s);
    s.addEventListener('animationend', () => s.remove());
  }
}

function confetti() {
  const fx = $('fx');
  const colors = ['#ff6b6b', '#ffd93d', '#6bcB77', '#4d96ff', '#c77dff'];
  for (let i = 0; i < 40; i++) {
    const c = document.createElement('span');
    c.className = 'confetti';
    c.style.left = `${Math.random() * 100}vw`;
    c.style.background = colors[i % colors.length];
    c.style.animationDelay = `${Math.random() * 0.8}s`;
    c.style.setProperty('--spin', `${Math.random() * 720 - 360}deg`);
    fx.append(c);
    c.addEventListener('animationend', () => c.remove());
  }
}

function toast(text) {
  const t = $('toast');
  t.textContent = text;
  t.hidden = false;
  setTimeout(() => { t.hidden = true; }, 1800);
}

// ---------- 起動 ----------
$('btn-home').addEventListener('click', () => { window.speechSynthesis?.cancel(); renderHome(); });
$('btn-speak').addEventListener('click', () => {
  if (session?.puzzles[session.index]) speak(session.puzzles[session.index].prompt);
});
$('btn-again').addEventListener('click', () => startGame(session.gameId));
$('btn-back').addEventListener('click', renderHome);

if ('speechSynthesis' in window) {
  pickVoice();
  speechSynthesis.addEventListener?.('voiceschanged', pickVoice);
}

fetch('/api/games')
  .then((r) => (r.ok ? r.json() : Promise.reject()))
  .then((data) => { games = data.games; })
  .catch(() => {})
  .finally(renderHome);
renderHome();
