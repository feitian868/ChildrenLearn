/**
 * pet.js —— 宠物乐园独立页
 * 首次访问弹窗领养；之后渲染大舞台 + 4 Tab
 */

import * as store from '../core/store.js';
import { el, clear, toast } from '../core/ui.js';
import { sfxClick, sfxWin, unlockAudio } from '../core/audio.js';
import {
  stateOf, createPet, feed, touch, play, clean,
  equipDeco, unequipDeco, changeScene, changeNickname,
  LEVEL_THRESHOLDS,
} from '../core/pet.js?v=20261031a';
import { SPECIES, DECO_SVG, SCENES, sceneOf } from '../data/pet-assets.js';
import { PET_FOODS, PET_DECOS, PET_SCENES } from '../data/pet-shop.js';

const app = document.getElementById('pet-app');
let currentTab = 'feed';

/* ============================================================
   入口
   ============================================================ */
unlockAudio();
render();

function render() {
  const pet = stateOf();
  clear(app);
  if (!pet) {
    app.append(renderAdoptModal());
  } else {
    app.append(renderArena(pet));
  }
}

/* ============================================================
   领养弹窗
   ============================================================ */
function renderAdoptModal() {
  let selected = null;
  const nameInput = el('input', {
    class: 'adopt-name-input',
    type: 'text',
    maxlength: 8,
    placeholder: '给宠物起个名字',
  });

  const grid = el('div', { class: 'adopt-grid' });
  const cards = SPECIES.map((s) => {
    const card = el('div', { class: 'adopt-card', 'data-species': s.id });
    card.innerHTML = s.svg;
    card.append(el('div', { class: 'species-name', text: `${s.emoji} ${s.name}` }));
    card.addEventListener('click', () => {
      selected = s.id;
      cards.forEach((c) => c.classList.toggle('selected', c === card));
    });
    return card;
  });
  cards.forEach((c) => grid.append(c));

  const confirmBtn = el('button', {
    class: 'btn btn-gold btn-block', type: 'button', text: '确认领养', disabled: true,
  });
  confirmBtn.addEventListener('click', () => {
    if (!selected) return;
    const res = createPet(selected, nameInput.value);
    if (res.ok) { sfxWin(); render(); }
    else toast(res.reason || '领养失败', 'bad');
  });

  // 选中宠物后才能点确认
  const check = () => { confirmBtn.disabled = !selected; };
  cards.forEach((c) => c.addEventListener('click', check));

  const sheet = el('div', { class: 'sheet adopt-modal', style: 'max-width:600px;' });
  sheet.append(
    el('h2', { text: '🐾 选一只宠物陪你学习' }),
    el('p', { style: 'color:var(--ink2); font-size:13px; margin:6px 0 14px;', text: '选好之后永久绑定哦，照顾它每天都能获得成长值！' }),
    grid,
    el('div', { style: 'margin-bottom:8px' }, [nameInput]),
    confirmBtn,
    el('p', { style: 'text-align:center; font-size:12px; color:var(--ink2); margin-top:10px;', text: '送你 2 个小饼干，赶紧去喂它吧！' }),
  );
  return sheet;
}

/* ============================================================
   大舞台
   ============================================================ */
function renderArena(pet) {
  const arena = el('div', { class: 'pet-page' });

  // 顶部返回
  const topBar = el('div', { style: 'display:flex; align-items:center; justify-content:space-between; padding:10px 14px; background:white; border-bottom:1px solid #eee;' }, [
    el('button', { class: 'btn btn-ghost', type: 'button', text: '← 回工作台', onclick: () => {
      sfxClick(); window.location.href = 'index.html';
    }}),
    el('div', { style: 'font-weight:700; font-size:15px;' }, { text: `${pet.speciesEmoji} ${pet.nickname} · Lv.${pet.level}` }),
    el('button', { class: 'btn btn-ghost', type: 'button', text: '🔄', title: '刷新', onclick: () => render() }),
  ]);

  // 乐园舞台
  const sceneWrap = el('div', { class: 'pet-arena', style: { background: pet.sceneData.bg } });
  sceneWrap.innerHTML = pet.sceneData.extra || '';

  // 宠物 SVG
  const petSvg = el('div', { class: `pet-wrap ${pet.moodClass}` });
  petSvg.innerHTML = pet.speciesSvg;
  petSvg.addEventListener('click', () => {
    sfxClick();
    petSvg.classList.remove('pet-petting');
    void petSvg.offsetWidth; // 强制重放
    petSvg.classList.add('pet-petting');
    touch();
    spawnParticles(sceneWrap, '🤲', 1);
    render(); // 刷新状态条
  });
  sceneWrap.append(petSvg);

  // 舞台上的快捷互动按钮
  const actionRow = el('div', { style: {
    position: 'absolute', bottom: '12px', left: '50%', transform: 'translateX(-50%)',
    display: 'flex', gap: '8px', zIndex: '10',
  } }, [
    el('button', { class: 'btn btn-ghost', type: 'button', text: '🤲 抚摸', title: '无限次', onclick: () => {
      sfxClick(); petSvg.classList.remove('pet-petting'); void petSvg.offsetWidth; petSvg.classList.add('pet-petting');
      touch(); spawnParticles(sceneWrap, '💖', 1); render();
    }}),
    el('button', { class: 'btn btn-ghost', type: 'button', text: '🎾 玩耍' + (pet.daily.played ? ' ✓' : ''), title: '每天一次', onclick: () => {
      sfxClick();
      const r = play();
      if (!r.ok) { toast(r.reason === 'daily-limit' ? '今天玩过啦，明天再来' : r.reason, 'bad'); return; }
      spawnParticles(sceneWrap, '⭐', 5);
      render();
    }}),
    el('button', { class: 'btn btn-ghost', type: 'button', text: '🛁 清洁' + (pet.daily.cleaned ? ' ✓' : ''), title: '每天一次', onclick: () => {
      sfxClick();
      const r = clean();
      if (!r.ok) { toast(r.reason === 'daily-limit' ? '今天清洁过啦' : r.reason, 'bad'); return; }
      spawnParticles(sceneWrap, '✨', 3);
      render();
    }}),
  ]);
  sceneWrap.append(actionRow);

  arena.append(topBar, sceneWrap);

  // 状态条（饥饿/心情/等级进度）
  const bars = renderBars(pet);
  arena.append(bars);

  // 底部 Tab 栏
  const tabBar = el('div', { class: 'pet-tabs' });
  const tabs = [
    { id: 'feed',  label: '🍪 喂养' },
    { id: 'deco',  label: '💄 装饰' },
    { id: 'scene', label: '🏖️ 乐园' },
    { id: 'me',    label: '📖 我的' },
  ];
  tabs.forEach((t) => {
    const btn = el('button', { class: 'tab' + (t.id === currentTab ? ' active' : ''), type: 'button', text: t.label });
    btn.addEventListener('click', () => { currentTab = t.id; render(); });
    tabBar.append(btn);
  });

  arena.append(tabBar, renderPanel(pet));
  return arena;
}

function renderBars(pet) {
  const expNext = pet.levelNextAt - (LEVEL_THRESHOLDS[pet.level - 1] ?? 0);
  const expCur  = pet.exp - (LEVEL_THRESHOLDS[pet.level - 1] ?? 0);
  const expPct = expNext > 0 ? Math.round((expCur / expNext) * 100) : 100;

  const wrap = el('div', { style: { padding: '10px 16px', background: 'white', borderBottom: '1px solid #eee' } });
  wrap.append(
    barRow('🍖', '饥饿', pet.hunger),
    barRow('💚', '心情', pet.mood),
    el('div', { style: { fontSize: '12px', color: 'var(--ink2)', marginTop: '4px', display: 'flex', justifyContent: 'space-between' } }, [
      el('span', { text: `Lv.${pet.level} → Lv.${pet.level + 1}` }),
      el('span', { text: `${expCur} / ${expNext} (${expPct}%)` }),
    ]),
    el('div', { class: 'pet-level-bar' }, [el('div', { class: 'fill', style: { width: expPct + '%' } })]),
  );
  return wrap;
}

function barRow(icon, label, pct) {
  return el('div', { style: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' } }, [
    el('span', { style: { width: '40px', fontSize: '13px' } }, { text: icon + ' ' + label }),
    el('div', { style: { flex: 1, height: '8px', background: '#eee', borderRadius: '4px', overflow: 'hidden' } }, [
      el('div', { style: { width: pct + '%', height: '100%', background: icon === '💚' ? 'linear-gradient(90deg,#6BCB77,#4DA6FF)' : 'linear-gradient(90deg,#FF6B6B,#FFD93D)', borderRadius: '4px', transition: 'width .35s' } }),
    ]),
    el('span', { style: { width: '36px', textAlign: 'right', fontSize: '12px', color: 'var(--ink2)' } }, { text: pct + '%' }),
  ]);
}

/* ============================================================
   Tab 面板
   ============================================================ */
function renderPanel(pet) {
  const panel = el('div', { class: 'pet-panel active', style: { maxHeight: '40vh', overflowY: 'auto' } });
  const invFoods = pet.inventory?.food || {};

  if (currentTab === 'feed') {
    panel.append(
      el('h3', { text: '🍪 宠物背包' }),
      el('p', { style: { fontSize: '12px', color: 'var(--ink2)', marginBottom: '10px' }, text: '食物不够了？去商店积分兑换，或者开宝箱有概率送食物包！' }),
      el('div', { class: 'panel-grid' },
        PET_FOODS.map((f) => {
          const count = invFoods[f.id] || 0;
          const box = el('div', { class: 'panel-item' + (count > 0 ? ' can-buy' : ' disabled'), title: `饥饿+${f.hunger} 心情+${f.mood}` }, [
            el('div', { class: 'emoji', text: f.emoji }),
            el('div', { class: 'name', text: f.name }),
            count > 0 ? el('div', { class: 'count', text: `× ${count}` }) : el('div', { class: 'price', text: '背包里没有' }),
          ]);
          box.addEventListener('click', () => {
            if (count <= 0) { toast('去商店兑换点食物吧～', 'bad'); return; }
            const res = feed(f.id);
            if (res.ok) {
              sfxClick();
              toast(`吃饱啦！饥饿 +${f.hunger}`, 'ok');
              if (res.leveledUp) toast('🎉 升级啦！', 'ok');
              spawnParticles(document.querySelector('.pet-arena') || document.body, '💖', 2);
              render();
            }
          });
          return box;
        })
      ),
    );
  }

  else if (currentTab === 'deco') {
    const worn = pet.wear;
    panel.append(
      el('h3', { text: '💄 我的装饰' }),
      el('p', { style: { fontSize: '12px', color: 'var(--ink2)', marginBottom: '10px' }, text: '4 个位置，穿上后宠物会戴上对应的装饰' }),
      el('div', { class: 'panel-grid' },
        PET_DECOS.map((d) => {
          const owned = pet.ownedDeco.includes(d.id);
          const wornHere = worn[d.slot] === d.id;
          const cls = 'panel-item' + (owned ? (wornHere ? ' equipped' : ' owned') : ' disabled');
          const box = el('div', { class: cls, title: owned ? (wornHere ? '点一下脱下' : '点一下穿上') : '去商店解锁' }, [
            el('div', { class: 'emoji', text: d.emoji }),
            el('div', { class: 'name', text: d.name }),
            owned
              ? (wornHere ? el('div', { class: 'count', text: '✓ 已戴上' }) : el('div', { class: 'count', style: { color: '#4DA6FF' }, text: '点击穿上' }))
              : el('div', { class: 'price', text: `未解锁 (${d.cost}分)` }),
          ]);
          box.addEventListener('click', () => {
            if (!owned) { toast('去商店解锁吧', 'bad'); return; }
            sfxClick();
            if (wornHere) { unequipDeco(d.slot); toast('脱下了', 'ok'); }
            else { equipDeco(d.id); toast('穿上啦！', 'ok'); }
            render();
          });
          return box;
        })
      ),
    );
  }

  else if (currentTab === 'scene') {
    panel.append(
      el('h3', { text: '🏖️ 乐园场景' }),
      el('p', { style: { fontSize: '12px', color: 'var(--ink2)', marginBottom: '10px' }, text: '解锁后点击就切换乐园背景' }),
      el('div', { class: 'panel-grid' },
        PET_SCENES.map((s) => {
          const owned = pet.ownedScene.includes(s.id);
          const cur = pet.scene === s.id;
          const cls = 'panel-item' + (owned ? (cur ? ' equipped' : ' owned') : ' disabled');
          const box = el('div', { class: cls, title: owned ? (cur ? '当前场景' : '点击切换') : '去商店解锁' }, [
            el('div', { class: 'emoji', text: s.emoji }),
            el('div', { class: 'name', text: s.name }),
            owned
              ? (cur ? el('div', { class: 'count', text: '✓ 当前' }) : el('div', { class: 'count', style: { color: '#4DA6FF' }, text: '点击切换' }))
              : (s.cost === 0 ? el('div', { class: 'price', text: '初始' }) : el('div', { class: 'price', text: `${s.cost} 积分` })),
          ]);
          box.addEventListener('click', () => {
            if (!owned) { toast('去商店解锁吧', 'bad'); return; }
            if (cur) return;
            sfxClick(); changeScene(s.id); render();
          });
          return box;
        })
      ),
    );
  }

  else if (currentTab === 'me') {
    panel.append(
      el('h3', { text: '📖 我的宠物' }),
      el('div', { class: 'pet-stats', style: { marginBottom: '12px' } }, [
        el('div', { class: 'pet-stat-box' }, [el('div', { class: 'num', text: pet.level }), el('div', { class: 'lbl', text: '等级' })]),
        el('div', { class: 'pet-stat-box' }, [el('div', { class: 'num', text: pet.exp }), el('div', { class: 'lbl', text: '累计成长值' })]),
        el('div', { class: 'pet-stat-box' }, [el('div', { class: 'num', text: pet.hunger + '%' }), el('div', { class: 'lbl', text: '当前饥饿度' })]),
        el('div', { class: 'pet-stat-box' }, [el('div', { class: 'num', text: pet.mood + '%' }), el('div', { class: 'lbl', text: '当前心情值' })]),
      ]),
      el('h3', { text: '改个名字', style: { fontSize: '14px', marginTop: '12px' } }),
      el('div', { style: { display: 'flex', gap: '8px', marginTop: '6px' } }, [
        el('input', {
          class: 'adopt-name-input',
          style: 'margin-bottom:0',
          type: 'text',
          value: pet.nickname,
          maxlength: 8,
          placeholder: '最多 8 个字',
          id: 'nick-input',
        }),
        el('button', { class: 'btn btn-gold', type: 'button', text: '保存', onclick: () => {
          const v = document.getElementById('nick-input')?.value;
          const r = changeNickname(v);
          if (r.ok) { sfxClick(); toast('改好啦！', 'ok'); render(); }
          else toast(r.reason || '失败', 'bad');
        }}),
      ]),
      el('h3', { text: '今天', style: { fontSize: '14px', marginTop: '16px' } }),
      el('ul', { style: { fontSize: '13px', color: 'var(--ink2)', lineHeight: '1.9', paddingLeft: '18px', marginTop: '4px' } }, [
        el('li', { text: `玩耍：${pet.daily.played ? '玩过啦 ✓' : '还没玩'}` }),
        el('li', { text: `清洁：${pet.daily.cleaned ? '清洁过啦 ✓' : '还没清洁'}` }),
        el('li', { text: `背包食物：${Object.entries(invFoods).map(([k, n]) => PET_FOODS.find((f) => f.id === k)?.emoji + n).join(' ') || '空空如也'}` }),
      ]),
    );
  }

  return panel;
}

/* ============================================================
   粒子效果（爱心 / 星星）
   ============================================================ */
function spawnParticles(container, emoji, count = 1) {
  const rect = container.getBoundingClientRect();
  const cx = rect.width / 2 + (Math.random() * 60 - 30);
  const cy = rect.height * 0.5 + (Math.random() * 40 - 20);
  for (let i = 0; i < count; i++) {
    const p = el('div', { class: 'particle', text: emoji });
    p.style.left = cx + 'px';
    p.style.top  = cy + 'px';
    container.append(p);
    setTimeout(() => p.remove(), 1200);
  }
}
