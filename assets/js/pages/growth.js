/**
 * growth.js —— 成长记录独立页
 * 统计总览 + 近 7 天柱状图 + 近 30 天格子图 + 每日明细（最多 90 天）
 */

import * as store from '../core/store.js';
import { ensureToday } from '../core/tasks.js';
import { el, clear } from '../core/ui.js';
import { unlockAudio } from '../core/audio.js';

const app = document.getElementById('app');

function chip(text, cls = '') {
  return el('span', { class: `chip ${cls}`.trim(), text });
}

function render() {
  const data = store.load();
  ensureToday(); // 打开本页也算“打开系统”，补齐今日任务与昨日快照
  const fresh = store.load();
  const history = store.historyWithToday(fresh);
  const today = store.todayKey();

  const entries = Object.entries(history).sort(([a], [b]) => (a < b ? 1 : -1)); // 新 → 旧
  const activeDays = entries.filter(([, h]) => h.completed > 0);
  const fullDays = entries.filter(([, h]) => h.total && h.completed >= h.total);
  const chestDays = entries.filter(([, h]) => h.chestOpened);
  const totalEarned = entries.reduce((s, [, h]) => s + (h.pointsEarned || 0), 0);

  unlockAudio();
  clear(app);

  /* ---------- 顶栏 ---------- */
  const back = el('a', { class: 'btn btn-ghost gp-back', href: 'index.html', text: '← 工作台' });
  back.addEventListener('click', () => unlockAudio());

  app.append(
    el('div', { class: 'gp-top' }, [
      back,
      el('div', { class: 'gp-heading' }, [
        el('h1', { text: `📈 成长记录` }),
        el('p', { text: `${store.currentUser()} · 数据保存在本机浏览器，最多保留最近 90 天` })
      ])
    ]),

    /* ---------- 统计总览 ---------- */
    el('div', { class: 'card gp-stats' }, [
      stat('⭐', fresh.profile.points || 0, '当前积分'),
      stat('🔥', fresh.profile.streak || 0, '连续打卡'),
      stat('📅', activeDays.length, '打卡天数'),
      stat('🏆', fullDays.length, '全完成天数'),
      stat('🎁', chestDays.length, '开宝箱次数'),
      stat('✨', totalEarned, '累计得分')
    ])
  );

  /* ---------- 近 7 天柱状图 ---------- */
  const last7 = Array.from({ length: 7 }, (_, i) => store.shiftDateKey(today, i - 6));
  const bars = el('div', { class: 'growth-bars gp-bars' });
  last7.forEach((key) => {
    const h = history[key];
    const ratio = !h || !h.total ? 0 : h.completed / h.total;
    const pct = Math.round(ratio * 100);
    const [, , dd] = key.split('-').map(Number);
    bars.append(el('div', { class: 'g-bar-col' }, [
      el('span', { class: 'g-bar-num', text: h ? `+${h.pointsEarned}` : '' }),
      el('div', { class: 'g-bar-track' }, [
        el('i', {
          class: `g-bar ${pct >= 100 ? 'is-full' : ''}`,
          style: { height: `${Math.max(pct, h ? 4 : 0)}%` },
          title: `${store.formatDateCN(key)}：完成 ${h?.completed ?? 0}/${h?.total ?? 0}`
        })
      ]),
      el('span', { class: 'g-bar-label', text: key === today ? '今天' : `${dd}日` })
    ]));
  });
  app.append(el('div', { class: 'card growth' }, [
    el('div', { class: 'growth-sec' }, [el('h4', { text: '最近 7 天' }), bars])
  ]));

  /* ---------- 近 30 天格子图 ---------- */
  const last30 = Array.from({ length: 30 }, (_, i) => store.shiftDateKey(today, i - 29));
  const cells = el('div', { class: 'growth-grid' });
  last30.forEach((key) => {
    const h = history[key];
    const ratio = !h || !h.total ? null : h.completed / h.total;
    const level = ratio === null ? 0 : ratio >= 1 ? 4 : ratio >= 0.66 ? 3 : ratio >= 0.33 ? 2 : 1;
    cells.append(el('span', {
      class: `g-cell lv${level}${key === today ? ' is-today' : ''}`,
      title: `${store.formatDateCN(key)}${h ? `：完成 ${h.completed}/${h.total}，+${h.pointsEarned} 分${h.chestOpened ? '，开了宝箱' : ''}` : '：无记录'}`
    }));
  });
  app.append(el('div', { class: 'card growth' }, [
    el('div', { class: 'growth-sec' }, [
      el('h4', { text: '最近 30 天' }),
      cells,
      el('div', { class: 'growth-legend' }, [
        el('span', { text: '少' }),
        el('span', { class: 'g-cell lv1' }), el('span', { class: 'g-cell lv2' }),
        el('span', { class: 'g-cell lv3' }), el('span', { class: 'g-cell lv4' }),
        el('span', { text: '多' })
      ])
    ])
  ]));

  /* ---------- 每日明细 ---------- */
  const detail = el('div', { class: 'card gp-detail' }, [el('h3', { text: '每日明细' })]);
  if (!entries.length) {
    detail.append(el('p', { class: 'gp-empty', text: '还没有历史记录，完成今天的任务后明天就会看到啦。' }));
  } else {
    const table = el('table', { class: 'answer-table gp-table' });
    table.append(el('thead', {}, [
      el('tr', {}, [
        el('th', { text: '日期' }),
        el('th', { text: '完成' }),
        el('th', { text: '得分' }),
        el('th', { text: '宝箱' }),
        el('th', { text: '连续' })
      ])
    ]));
    const tbody = el('tbody');
    entries.forEach(([key, h]) => {
      const full = h.total && h.completed >= h.total;
      tbody.append(el('tr', {}, [
        el('td', { text: key === today ? `${store.formatDateCN(key)}（今天）` : store.formatDateCN(key) }),
        el('td', {}, [
          el('span', { class: `gp-ratio ${full ? 'is-full' : ''}`, text: `${h.completed}/${h.total}` })
        ]),
        el('td', { text: `+${h.pointsEarned || 0}` }),
        el('td', { text: h.chestOpened ? '🎁 已开' : '—' }),
        el('td', { text: h.streak ? `${h.streak} 天` : '—' })
      ]));
    });
    table.append(tbody);
    detail.append(table);
  }
  app.append(detail);

  app.append(el('div', { class: 'wb-foot', text: '历史快照在每天首次打开时自动写入，只保留最近 90 天。' }));
}

function stat(icon, value, label) {
  return el('div', { class: 'gp-stat' }, [
    el('span', { class: 'gp-stat-icon', text: icon }),
    el('b', { text: value }),
    el('small', { text: label })
  ]);
}

render();
