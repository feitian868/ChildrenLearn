/**
 * minigames.js —— 宝箱里的四个互动小游戏
 * 全部用 DOM / Canvas 实现，不依赖外部资源。
 */

import { el } from './ui.js';
import { sfxClick, sfxWin, unlockAudio } from './audio.js';
import { playNote, playSong } from './songs.js';

function shell({ title, desc, buttonText = '收下这份快乐' }) {
  unlockAudio();
  const overlay = el('div', { class: 'overlay', role: 'dialog', 'aria-modal': 'true' });
  const sheet = el('div', { class: 'sheet mini-sheet' });
  const head = el('div', { class: 'mini-head' }, [
    el('h3', { text: title }),
    desc ? el('p', { text: desc }) : null
  ]);
  const body = el('div', { class: 'mini-body' });
  const closeBtn = el('button', { class: 'btn btn-gold btn-block', type: 'button', text: buttonText });
  let cleanup = null;

  const close = () => {
    cleanup?.();
    overlay.remove();
    document.removeEventListener('keydown', onKey);
  };
  const onKey = (e) => { if (e.key === 'Escape') close(); };

  closeBtn.addEventListener('click', () => { sfxClick(); close(); });
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
  document.addEventListener('keydown', onKey);

  sheet.append(head, body, closeBtn);
  overlay.append(sheet);
  document.body.append(overlay);

  return {
    overlay,
    sheet,
    body,
    closeBtn,
    onCleanup(fn) { cleanup = fn; }
  };
}

/* ============================================================
   1. 接苹果（替换幸运转盘）
   ============================================================ */
function openCatchApple() {
  const ui = shell({
    title: '🍎 接苹果',
    desc: '20 秒内接住天上掉下来的水果，左右移动篮子。手机点屏幕左右侧，电脑按 ← → 键。'
  });

  const bar = el('div', { class: 'mini-bar' });
  const scoreNode = el('b', { text: '0' });
  const timeNode = el('b', { text: '20' });
  bar.append(
    el('span', {}, ['接住 ', scoreNode, ' 个']),
    el('span', {}, ['剩余 ', timeNode, ' 秒'])
  );

  const area = el('div', { class: 'mini-area', style: { touchAction: 'none' } });
  const basket = el('div', {
    class: 'mini-basket',
    text: '🧺',
    style: { left: '42%', bottom: '8px', position: 'absolute', fontSize: '44px', filter: 'drop-shadow(0 4px 8px rgba(0,0,0,.15))' }
  });
  area.append(basket);
  const result = el('p', { class: 'mini-result', text: '左右移动篮子，接住水果！' });
  ui.body.append(bar, area, result);

  let score = 0;
  let time = 20;
  let ended = false;
  let basketLeft = 42;  // 百分比
  const fruits = ['🍎', '🍊', '🍓', '🍇', '🍌', '🍐'];

  const setBasket = (pct) => {
    basketLeft = Math.max(0, Math.min(86, pct));
    basket.style.left = basketLeft + '%';
  };

  // 触屏：按屏幕左右半边移动
  let touchSide = null;
  const startTouch = (e) => {
    if (ended) return;
    const rect = area.getBoundingClientRect();
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    touchSide = x < rect.width / 2 ? -1 : 1;
  };
  const endTouch = () => { touchSide = null; };
  area.addEventListener('pointerdown', startTouch);
  area.addEventListener('pointerup', endTouch);
  area.addEventListener('pointerleave', endTouch);
  area.addEventListener('pointercancel', endTouch);

  // 键盘 ← →
  const keys = { ArrowLeft: false, ArrowRight: false };
  const onKeyDown = (e) => { if (keys[e.key] !== undefined) { keys[e.key] = true; e.preventDefault(); } };
  const onKeyUp = (e) => { if (keys[e.key] !== undefined) { keys[e.key] = false; e.preventDefault(); } };
  document.addEventListener('keydown', onKeyDown);
  document.addEventListener('keyup', onKeyUp);

  // 游戏主循环
  const falling = [];  // {el, x%, y%, vy}
  const spawnFruit = () => {
    if (ended) return;
    const fruit = el('div', {
      class: 'mini-fruit',
      text: fruits[Math.floor(Math.random() * fruits.length)],
      style: { position: 'absolute', top: '-40px', fontSize: '34px', transition: 'none' }
    });
    const x = 6 + Math.random() * 86;
    fruit.style.left = x + '%';
    area.append(fruit);
    falling.push({ el: fruit, x: x, y: -40, vy: 1.2 + Math.random() * 1.6 });
  };

  let lastSpawn = 0;
  let lastFrame = 0;
  const gameLoop = (now) => {
    if (ended) return;
    // 生成水果
    if (now - lastSpawn > 750) { spawnFruit(); lastSpawn = now; }
    // 移动篮子（触屏方向 + 键盘）
    if (touchSide) setBasket(basketLeft + touchSide * 2.2);
    if (keys.ArrowLeft) setBasket(basketLeft - 2.5);
    if (keys.ArrowRight) setBasket(basketLeft + 2.5);
    // 更新水果
    const areaH = area.clientHeight;
    const basketTop = areaH * 0.72;  // 篮子大致在底部 8% + 高度
    for (let i = falling.length - 1; i >= 0; i--) {
      const f = falling[i];
      f.y += f.vy;
      f.el.style.top = f.y + 'px';
      // 碰撞检测（篮子区域与水果）
      if (f.y >= basketTop && f.y <= basketTop + 50) {
        const dx = Math.abs(f.x - basketLeft - 7);  // 篮子中心在 basketLeft + 7%
        if (dx < 16) {
          // 接住了！
          score += 1;
          scoreNode.textContent = String(score);
          sfxClick();
          f.el.remove();
          falling.splice(i, 1);
          continue;
        }
      }
      // 掉出屏幕
      if (f.y > areaH + 40) {
        f.el.remove();
        falling.splice(i, 1);
      }
    }
    raf = requestAnimationFrame(gameLoop);
  };
  let raf = requestAnimationFrame(gameLoop);

  // 倒计时
  const countdown = setInterval(() => {
    time -= 1;
    timeNode.textContent = String(Math.max(0, time));
    if (time <= 0) {
      ended = true;
      clearInterval(countdown);
      cancelAnimationFrame(raf);
      falling.forEach(f => f.el.remove());
      sfxWin();
      result.textContent = `时间到！你接住了 ${score} 个水果 🎉`;
      ui.closeBtn.textContent = '我玩够了';
    }
  }, 1000);

  ui.onCleanup(() => {
    clearInterval(countdown);
    cancelAnimationFrame(raf);
    ended = true;
    document.removeEventListener('keydown', onKeyDown);
    document.removeEventListener('keyup', onKeyUp);
  });
}

/* ============================================================
   2. 泡泡大作战
   ============================================================ */
function openBubble() {
  const ui = shell({
    title: '🫧 泡泡大作战',
    desc: '20 秒内戳破尽可能多的泡泡，点一下就算。'
  });

  const bar = el('div', { class: 'mini-bar' });
  const scoreNode = el('b', { text: '0' });
  const timeNode = el('b', { text: '20' });
  bar.append(
    el('span', {}, ['已戳破 ', scoreNode, ' 个']),
    el('span', {}, ['剩余 ', timeNode, ' 秒'])
  );

  const area = el('div', { class: 'mini-area' });
  const result = el('p', { class: 'mini-result', text: '加油，越快越好！' });
  ui.body.append(bar, area, result);

  let score = 0;
  let time = 20;
  let ended = false;

  const spawn = () => {
    if (ended) return;
    const bubble = el('button', {
      class: 'mini-bubble',
      type: 'button',
      text: ['🫧', '🎈', '💧', '🫧'][Math.floor(Math.random() * 4)],
      'aria-label': '戳泡泡'
    });
    bubble.style.left = `${4 + Math.random() * 76}%`;
    bubble.style.top = `${6 + Math.random() * 70}%`;
    bubble.style.animationDelay = `${Math.random() * 0.3}s`;
    bubble.addEventListener('click', () => {
      if (ended) return;
      score += 1;
      scoreNode.textContent = String(score);
      sfxClick();
      bubble.remove();
    });
    area.append(bubble);
    setTimeout(() => bubble.remove(), 2600);
  };

  for (let i = 0; i < 5; i++) spawn();

  const spawnTimer = setInterval(spawn, 420);
  const countdown = setInterval(() => {
    time -= 1;
    timeNode.textContent = String(Math.max(0, time));
    if (time <= 0) {
      ended = true;
      clearInterval(spawnTimer);
      clearInterval(countdown);
      area.querySelectorAll('.mini-bubble').forEach((b) => b.remove());
      sfxWin();
      result.textContent = `时间到！你一共戳破了 ${score} 个泡泡 🎉`;
      ui.closeBtn.textContent = '我玩够了';
    }
  }, 1000);

  ui.onCleanup(() => {
    clearInterval(spawnTimer);
    clearInterval(countdown);
    ended = true;
  });
}

/* ============================================================
   3. 记忆翻牌
   ============================================================ */
function openMemory() {
  const ui = shell({
    title: '🃏 记忆翻牌',
    desc: '翻开两张卡片，找出一模一样的图案。'
  });

  const icons = ['🍎', '🐱', '🌈', '🚀', '🍰', '🐟'];
  const deck = shuffle([...icons, ...icons]);
  let first = null;
  let second = null;
  let lock = false;
  let matched = 0;

  const grid = el('div', { class: 'mini-grid' });
  const result = el('p', { class: 'mini-result', text: '翻开两张相同的卡片试试。' });
  ui.body.append(grid, result);

  const cards = deck.map((icon, idx) => {
    const btn = el('button', { class: 'mini-card', type: 'button', text: '', 'aria-label': '卡片' });
    btn.dataset.icon = icon;
    btn.dataset.index = String(idx);
    btn.addEventListener('click', () => {
      if (lock || btn.classList.contains('is-open') || btn.classList.contains('is-matched')) return;
      sfxClick();
      btn.textContent = icon;
      btn.classList.add('is-open');

      if (!first) {
        first = btn;
        return;
      }
      second = btn;
      if (first.dataset.icon === second.dataset.icon) {
        first.classList.add('is-matched');
        second.classList.add('is-matched');
        matched += 1;
        first = null;
        second = null;
        sfxClick();
        if (matched === icons.length) {
          sfxWin();
          result.textContent = '全部找到啦！你的记忆力真棒 🎉';
        }
        return;
      }

      lock = true;
      result.textContent = '不一样，再记一记……';
      setTimeout(() => {
        first.textContent = '';
        second.textContent = '';
        first.classList.remove('is-open');
        second.classList.remove('is-open');
        first = null;
        second = null;
        lock = false;
      }, 720);
    });
    return btn;
  });

  cards.forEach((card) => grid.append(card));
  ui.onCleanup(() => { lock = true; });
}

/* ============================================================
   4. 小小钢琴
   ============================================================ */
function openPiano() {
  const ui = shell({
    title: '🎹 小小钢琴',
    desc: '点彩色琴键就能弹出声音，从左到右声音越来越高。'
  });

  const keys = [
    { n: 'C4', label: 'Do', color: '#ff8fab' },
    { n: 'D4', label: 'Re', color: '#ffb37f' },
    { n: 'E4', label: 'Mi', color: '#ffd166' },
    { n: 'F4', label: 'Fa', color: '#90e0a0' },
    { n: 'G4', label: 'Sol', color: '#8ecae6' },
    { n: 'A4', label: 'La', color: '#c7b8ff' },
    { n: 'B4', label: 'Si', color: '#f2a7d5' },
    { n: 'C5', label: 'Do↑', color: '#ff8fab' }
  ];

  const row = el('div', { class: 'mini-keys' });
  const result = el('p', { class: 'mini-result', text: '随便点一点，听听每个键的声音。' });

  keys.forEach((k) => {
    const btn = el('button', {
      class: 'mini-key',
      type: 'button',
      'aria-label': `琴键 ${k.label}`,
      text: k.label
    });
    btn.style.setProperty('--key', k.color);
    btn.addEventListener('click', () => {
      playNote(k.n, 0.6);
      btn.classList.add('is-hit');
      setTimeout(() => btn.classList.remove('is-hit'), 180);
      result.textContent = `这是：${k.label}`;
    });
    row.append(btn);
  });

  const demoBtn = el('button', { class: 'btn btn-gold btn-block', type: 'button', text: '🎵 听一段《小星星》' });
  let handle = null;
  demoBtn.addEventListener('click', () => {
    sfxClick();
    if (handle) {
      handle.stop();
      handle = null;
      demoBtn.textContent = '🎵 听一段《小星星》';
      result.textContent = '停下来啦，想听就再点一次。';
      return;
    }
    demoBtn.textContent = '⏸ 停止';
    result.textContent = '跟着旋律一起哼一哼～';
    handle = playSong('twinkle', {
      onEnd: () => {
        handle = null;
        demoBtn.textContent = '🎵 听一段《小星星》';
        result.textContent = '听完啦，你也可以自己弹 🎶';
      }
    });
  });

  ui.body.append(row, demoBtn, result);
  ui.onCleanup(() => {
    handle?.stop();
    handle = null;
  });
}

function shuffle(list) {
  const arr = list.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function openMinigame(game) {
  if (game === 'bubble') openBubble();
  else if (game === 'memory') openMemory();
  else if (game === 'piano') openPiano();
  else openCatchApple();
}
