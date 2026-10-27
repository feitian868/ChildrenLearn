/**
 * fx.js —— 全屏庆祝动画、彩带、成就反馈
 */

import { el } from './ui.js';
import { sfxWin, sfxDaily, sfxChest, unlockAudio, speakCongrats, stopSpeak } from './audio.js';
import { currentUser } from './store.js';

/** 当前用户称呼：直接返回用户名，不替换成"你" */
export function playerName() {
  try {
    const name = currentUser();
    return name || '小朋友';
  } catch {
    return '小朋友';
  }
}

const PALETTE = ['#ffd166', '#ff8fab', '#8ecae6', '#90e0a0', '#c7b8ff', '#ffb37f'];

function startConfetti(canvas, { count = 90, duration = 2600, strength = 1 } = {}) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  const resize = () => {
    canvas.width = Math.floor(window.innerWidth * dpr);
    canvas.height = Math.floor(window.innerHeight * dpr);
  };
  resize();
  window.addEventListener('resize', resize);

  const W = window.innerWidth;
  const H = window.innerHeight;
  const particles = Array.from({ length: count }, () => ({
    x: W * (0.2 + Math.random() * 0.6),
    y: H * (0.28 + Math.random() * 0.2),
    vx: (Math.random() - 0.5) * 8 * strength,
    vy: (Math.random() - 0.9) * 7 * strength,
    size: 6 + Math.random() * 8,
    color: PALETTE[Math.floor(Math.random() * PALETTE.length)],
    rot: Math.random() * Math.PI,
    vr: (Math.random() - 0.5) * 0.25,
    shape: Math.random() > 0.5 ? 'rect' : 'circle'
  }));

  let raf = 0;
  const started = performance.now();

  function frame(now) {
    const elapsed = now - started;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    particles.forEach((p) => {
      p.vy += 0.16;
      p.vx *= 0.995;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, 1 - elapsed / duration);
      if (p.shape === 'rect') ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      else {
        ctx.beginPath();
        ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    });

    if (elapsed < duration) raf = requestAnimationFrame(frame);
    else {
      window.removeEventListener('resize', resize);
    }
  }
  raf = requestAnimationFrame(frame);

  return () => {
    cancelAnimationFrame(raf);
    window.removeEventListener('resize', resize);
  };
}

/**
 * 全屏庆祝
 * @param {object} opts
 * @param {string} opts.emoji 大表情
 * @param {string} opts.title 成就词/标题
 * @param {string} [opts.subtitle] 副标题
 * @param {number} [opts.points] 本次获得积分
 * @param {'task'|'daily'|'chest'} [opts.variant]
 * @param {string} [opts.buttonText]
 * @param {string} [opts.speech] 自定义祝贺语音文案（默认由 title/points 生成）
 * @param {Function} [opts.onClose]
 */
export function celebrate({
  emoji = '🎉',
  title = '太棒了！',
  subtitle = '',
  points = 0,
  variant = 'task',
  buttonText = '继续',
  speech,
  onClose
} = {}) {
  unlockAudio();
  if (variant === 'daily') sfxDaily();
  else if (variant === 'chest') sfxChest();
  else sfxWin();

  // 祝贺语音：稍晚于音效起播（200ms），避免相互盖住，也降低被“继续”按钮提前取消的概率
  const who = playerName();
  const spoken = speech || (points
    ? `${title}！${who}太棒了！获得 ${points} 积分。`
    : `${title}！${who}太棒了！`);
  speakCongrats(spoken, 200);

  const overlay = el('div', { class: 'fx', role: 'dialog', 'aria-modal': 'true' });
  const canvas = el('canvas');
  const inner = el('div', { class: 'fx-inner' });
  inner.append(el('div', { class: 'fx-emoji', text: emoji }));
  inner.append(el('div', { class: 'fx-title', text: title }));
  inner.append(el('div', { class: 'fx-cheer', text: `${who} 太棒了！` }));
  if (subtitle) inner.append(el('div', { class: 'fx-sub', text: subtitle }));
  if (points) inner.append(el('div', { class: 'fx-points', text: `+${points} 积分` }));

  const btn = el('button', {
    class: 'btn btn-gold',
    type: 'button',
    text: buttonText
  });
  inner.append(btn);
  overlay.append(canvas, inner);
  document.body.append(overlay);

  const stop = startConfetti(canvas, {
    count: variant === 'daily' ? 160 : 100,
    duration: variant === 'daily' ? 3200 : 2400,
    strength: variant === 'daily' ? 1.25 : 1
  });

  let closed = false;
  function close() {
    if (closed) return;
    closed = true;
    stop();
    stopSpeak();
    overlay.remove();
    document.removeEventListener('keydown', onKey);
    onClose?.();
  }
  function onKey(e) {
    if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') close();
  }
  btn.addEventListener('click', close);
  document.addEventListener('keydown', onKey);

  return close;
}

/** 轻量一次性彩带（宝箱、兑换等） */
export function burst(points = 60) {
  unlockAudio();
  sfxChest();
  const overlay = el('div', {
    class: 'fx',
    style: { background: 'rgba(20,25,50,.18)', backdropFilter: 'blur(2px)' }
  });
  const canvas = el('canvas');
  overlay.append(canvas);
  document.body.append(overlay);
  const stop = startConfetti(canvas, { count: points, duration: 1800 });
  setTimeout(() => {
    stop();
    overlay.remove();
  }, 1900);
}
