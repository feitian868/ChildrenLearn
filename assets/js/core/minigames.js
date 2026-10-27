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
   1. 幸运转盘
   ============================================================ */
function openWheel() {
  const ui = shell({
    title: '🎡 幸运转盘',
    desc: '点击“开始转动”，看看指针会停在哪一格。'
  });

  const labels = ['🍀 好运+1', '⭐ 超级星星', '✋ 击掌', '🦘 跳一下', '🎉 大声说耶', '😄 再笑一个'];
  const colors = ['#8ecae6', '#ffd166', '#90e0a0', '#ff8fab', '#c7b8ff', '#ffb37f'];

  const canvas = document.createElement('canvas');
  canvas.width = 360;
  canvas.height = 360;
  canvas.className = 'mini-wheel';
  ui.body.append(canvas);

  const ctx = canvas.getContext('2d');
  const step = (Math.PI * 2) / labels.length;
  let rotation = 0;
  let spinning = false;
  let raf = 0;

  const draw = () => {
    ctx.clearRect(0, 0, 360, 360);
    ctx.save();
    ctx.translate(180, 180);
    ctx.rotate(rotation);
    labels.forEach((label, i) => {
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, 166, i * step, (i + 1) * step);
      ctx.closePath();
      ctx.fillStyle = colors[i];
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.save();
      ctx.rotate(i * step + step / 2);
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.font = 'bold 19px "PingFang SC", "Microsoft YaHei", sans-serif';
      ctx.fillStyle = '#3a2b00';
      ctx.fillText(label, 150, 0);
      ctx.restore();
    });
    ctx.restore();

    ctx.beginPath();
    ctx.moveTo(180, 4);
    ctx.lineTo(162, 40);
    ctx.lineTo(198, 40);
    ctx.closePath();
    ctx.fillStyle = '#1d2340';
    ctx.fill();
  };
  draw();

  const result = el('p', { class: 'mini-result', text: '准备好了吗？' });
  const spinBtn = el('button', { class: 'btn btn-gold btn-block', type: 'button', text: '开始转动' });

  spinBtn.addEventListener('click', () => {
    if (spinning) return;
    spinning = true;
    spinBtn.disabled = true;
    result.textContent = '转呀转……';

    const winner = Math.floor(Math.random() * labels.length);
    const targetMod = ((-Math.PI / 2 - (winner + 0.5) * step) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
    const start = rotation;
    let end = start + Math.PI * 2 * 4;
    end += (targetMod - ((end % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);

    const t0 = performance.now();
    const ease = (t) => 1 - Math.pow(1 - t, 3);
    const frame = (now) => {
      const t = Math.min(1, (now - t0) / 3000);
      rotation = start + (end - start) * ease(t);
      draw();
      if (t < 1) raf = requestAnimationFrame(frame);
      else {
        spinning = false;
        sfxWin();
        result.textContent = `指针停在：${labels[winner]}`;
        spinBtn.disabled = false;
        spinBtn.textContent = '再转一次';
      }
    };
    raf = requestAnimationFrame(frame);
  });

  ui.body.append(spinBtn, result);
  ui.onCleanup(() => cancelAnimationFrame(raf));
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
  else openWheel();
}
