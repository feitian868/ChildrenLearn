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

  // 底部按钮区：默认只放"收下"按钮；小游戏结束时 setRestart 后变成"再来一局"+"收下"
  const actionRow = el('div', { class: 'mini-actions' });
  const restartBtn = el('button', {
    class: 'btn btn-ghost',
    type: 'button',
    text: '🔄 再来一局',
    style: 'display:none'
  });
  const closeBtn = el('button', { class: 'btn btn-gold', type: 'button', text: buttonText });
  actionRow.append(restartBtn, closeBtn);

  let cleanup = null;
  let restartFn = null;

  const close = () => {
    cleanup?.();
    overlay.remove();
    document.removeEventListener('keydown', onKey);
  };
  const onKey = (e) => { if (e.key === 'Escape') close(); };

  restartBtn.addEventListener('click', () => { sfxClick(); restartFn?.(); });
  closeBtn.addEventListener('click', () => { sfxClick(); close(); });
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
  document.addEventListener('keydown', onKey);

  sheet.append(head, body, actionRow);
  overlay.append(sheet);
  document.body.append(overlay);

  return {
    overlay,
    sheet,
    body,
    closeBtn,
    /** 小游戏内部调用，让 shell 显示"再来一局"按钮。fn 会在关闭不弹窗的前提下重置游戏。 */
    setRestart(fn) { restartFn = fn; restartBtn.style.display = ''; },
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

  const fruits = ['🍎', '🍊', '🍓', '🍇', '🍌', '🍐'];

  // 键盘 ← →
  const keys = { ArrowLeft: false, ArrowRight: false };
  const onKeyDown = (e) => { if (keys[e.key] !== undefined) { keys[e.key] = true; e.preventDefault(); } };
  const onKeyUp = (e) => { if (keys[e.key] !== undefined) { keys[e.key] = false; e.preventDefault(); } };

  // 触屏
  let touchSide = null;
  const startTouch = (e) => {
    if (!runtime || runtime.ended) return;
    const rect = area.getBoundingClientRect();
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    touchSide = x < rect.width / 2 ? -1 : 1;
  };
  const endTouch = () => { touchSide = null; };
  area.addEventListener('pointerdown', startTouch);
  area.addEventListener('pointerup', endTouch);
  area.addEventListener('pointerleave', endTouch);
  area.addEventListener('pointercancel', endTouch);

  let runtime = null;  // 当前这局的 timer/raf/state
  let basketLeft = 42;

  const setBasket = (pct) => {
    basketLeft = Math.max(0, Math.min(86, pct));
    basket.style.left = basketLeft + '%';
  };

  const spawnFruit = () => {
    if (!runtime || runtime.ended) return;
    const fruit = el('div', {
      class: 'mini-fruit',
      text: fruits[Math.floor(Math.random() * fruits.length)],
      style: { position: 'absolute', top: '-40px', fontSize: '34px', transition: 'none' }
    });
    const x = 6 + Math.random() * 86;
    fruit.style.left = x + '%';
    area.append(fruit);
    runtime.falling.push({ el: fruit, x: x, y: -40, vy: 1.2 + Math.random() * 1.6 });
  };

  const stopRound = () => {
    if (!runtime) return;
    runtime.ended = true;
    clearInterval(runtime.countdown);
    cancelAnimationFrame(runtime.raf);
    runtime.falling.forEach(f => f.el.remove());
    runtime.falling.length = 0;
  };

  const startRound = () => {
    stopRound();
    // 重置 UI
    scoreNode.textContent = '0';
    timeNode.textContent = '20';
    result.textContent = '左右移动篮子，接住水果！';
    basketLeft = 42;
    basket.style.left = basketLeft + '%';
    area.querySelectorAll('.mini-fruit').forEach((f) => f.remove());
    // 隐藏 restart 按钮，恢复"收下"文字
    ui.closeBtn.textContent = '收下这份快乐';
    ui.setRestart(null);  // 清空 restart 按钮（shell 里需要支持 setRestart(null) 隐藏按钮）

    const falling = [];
    let score = 0;
    let time = 20;
    let lastSpawn = 0;

    const gameLoop = (now) => {
      if (!runtime || runtime.ended) return;
      if (now - lastSpawn > 750) { spawnFruit(); lastSpawn = now; }
      if (touchSide) setBasket(basketLeft + touchSide * 2.2);
      if (keys.ArrowLeft) setBasket(basketLeft - 2.5);
      if (keys.ArrowRight) setBasket(basketLeft + 2.5);
      const areaH = area.clientHeight;
      const basketTop = areaH * 0.72;
      for (let i = falling.length - 1; i >= 0; i--) {
        const f = falling[i];
        f.y += f.vy;
        f.el.style.top = f.y + 'px';
        if (f.y >= basketTop && f.y <= basketTop + 50) {
          const dx = Math.abs(f.x - basketLeft - 7);
          if (dx < 16) {
            score += 1;
            scoreNode.textContent = String(score);
            sfxClick();
            f.el.remove();
            falling.splice(i, 1);
            continue;
          }
        }
        if (f.y > areaH + 40) {
          f.el.remove();
          falling.splice(i, 1);
        }
      }
      if (runtime) runtime.raf = requestAnimationFrame(gameLoop);
    };

    const countdown = setInterval(() => {
      if (!runtime || runtime.ended) return;
      time -= 1;
      timeNode.textContent = String(Math.max(0, time));
      if (time <= 0) {
        runtime.ended = true;
        clearInterval(countdown);
        cancelAnimationFrame(runtime.raf);
        falling.forEach(f => f.el.remove());
        sfxWin();
        result.textContent = `时间到！你接住了 ${score} 个水果 🎉`;
        ui.closeBtn.textContent = '收下';
        ui.setRestart(startRound);
      }
    }, 1000);

    const raf = requestAnimationFrame(gameLoop);
    runtime = { ended: false, falling, raf, countdown };
  };

  // 让 setRestart(null) 可以隐藏按钮
  const origSetRestart = ui.setRestart;
  ui.setRestart = (fn) => {
    if (fn) origSetRestart(fn);
    else {
      // 隐藏：通过修改 DOM 直接处理
      const row = ui.sheet.querySelector('.mini-actions');
      const restartBtn = row?.querySelector('.btn-ghost');
      if (restartBtn) restartBtn.style.display = 'none';
    }
  };

  document.addEventListener('keydown', onKeyDown);
  document.addEventListener('keyup', onKeyUp);
  ui.onCleanup(() => {
    stopRound();
    document.removeEventListener('keydown', onKeyDown);
    document.removeEventListener('keyup', onKeyUp);
  });

  startRound();
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

  let runtime = null;

  const stopRound = () => {
    if (!runtime) return;
    runtime.ended = true;
    clearInterval(runtime.spawnTimer);
    clearInterval(runtime.countdown);
    area.querySelectorAll('.mini-bubble').forEach((b) => b.remove());
  };

  const startRound = () => {
    stopRound();
    scoreNode.textContent = '0';
    timeNode.textContent = '20';
    result.textContent = '加油，越快越好！';
    area.querySelectorAll('.mini-bubble').forEach((b) => b.remove());
    ui.closeBtn.textContent = '收下';
    // 隐藏 restart 按钮
    const row = ui.sheet.querySelector('.mini-actions');
    const rb = row?.querySelector('.btn-ghost');
    if (rb) rb.style.display = 'none';

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
      bubble.style.left = `${4 + Math.random() * 88}%`;
      bubble.style.top = `${8 + Math.random() * 80}%`;
      bubble.style.animationDelay = `${Math.random() * 0.6}s, ${Math.random() * 0.5}s`;
      const size = 44 + Math.round(Math.random() * 24);
      bubble.style.setProperty('--tap', `${size}px`);
      bubble.addEventListener('click', (e) => {
        e.preventDefault();
        if (ended) return;
        score += 1;
        scoreNode.textContent = String(score);
        sfxClick();
        bubble.style.transition = 'transform .12s, opacity .18s';
        bubble.style.transform = 'translate(-50%, -50%) scale(1.4)';
        bubble.style.opacity = '0';
        setTimeout(() => bubble.remove(), 180);
      });
      area.append(bubble);
      setTimeout(() => {
        bubble.style.transition = 'opacity .4s';
        bubble.style.opacity = '0';
        setTimeout(() => bubble.remove(), 420);
      }, 2800);
    };

    for (let i = 0; i < 5; i++) setTimeout(spawn, i * 120);

    const spawnTimer = setInterval(spawn, 420);
    const countdown = setInterval(() => {
      if (ended) return;
      time -= 1;
      timeNode.textContent = String(Math.max(0, time));
      if (time <= 0) {
        ended = true;
        clearInterval(spawnTimer);
        clearInterval(countdown);
        area.querySelectorAll('.mini-bubble').forEach((b) => b.remove());
        sfxWin();
        result.textContent = `时间到！你一共戳破了 ${score} 个泡泡 🎉`;
        ui.closeBtn.textContent = '收下';
        ui.setRestart(startRound);
      }
    }, 1000);

    runtime = { ended: false, spawnTimer, countdown };
  };

  ui.onCleanup(() => stopRound());
  startRound();
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
  const grid = el('div', { class: 'mini-grid' });
  const result = el('p', { class: 'mini-result', text: '翻开两张相同的卡片试试。' });
  ui.body.append(grid, result);

  let first = null;
  let second = null;
  let lock = false;

  const hideRestartBtn = () => {
    const row = ui.sheet.querySelector('.mini-actions');
    const rb = row?.querySelector('.btn-ghost');
    if (rb) rb.style.display = 'none';
  };

  const startRound = () => {
    lock = true;  // 洗牌期间锁点击
    grid.innerHTML = '';
    first = second = null;

    const deck = shuffle([...icons, ...icons]);
    let matched = 0;
    result.textContent = '翻开两张相同的卡片试试。';
    ui.closeBtn.textContent = '收下';
    hideRestartBtn();

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
            ui.closeBtn.textContent = '收下';
            ui.setRestart(startRound);
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
    lock = false;
  };

  ui.onCleanup(() => { lock = true; });
  startRound();
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
