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

  /* ---------- 诊断评估（v3 新增） ---------- */
  renderDiagnosis(history, last7);
}

/** 诊断性评估：学科正确率 + 薄弱知识点 + 错因分布 */
function renderDiagnosis(history, last7) {
  // 聚合近 7 天的学科首答正确率
  const subjAgg = {};
  let hasSubj = false;
  last7.forEach((key) => {
    const h = history[key];
    if (!h?.subjectStats) return;
    hasSubj = true;
    Object.entries(h.subjectStats).forEach(([sub, s]) => {
      if (!subjAgg[sub]) subjAgg[sub] = { correct: 0, total: 0 };
      subjAgg[sub].correct += s.correct || 0;
      subjAgg[sub].total += s.total || 0;
    });
  });

  // 聚合近 14 天的薄弱知识点
  const keyMiss = new Map();
  const keyTotal = new Map();
  const keyTopic = new Map();
  let hasKeys = false;
  const last14 = Array.from({ length: 14 }, (_, i) => store.shiftDateKey(store.todayKey(), i - 13));
  last14.forEach((key) => {
    const h = history[key];
    (h?.weakKeys || []).forEach((wk) => {
      hasKeys = true;
      keyMiss.set(wk.key, (keyMiss.get(wk.key) || 0) + wk.miss);
      keyTotal.set(wk.key, (keyTotal.get(wk.key) || 0) + (wk.total || 1));
      keyTopic.set(wk.key, wk.topic);
    });
  });
  const weakList = Array.from(keyMiss.entries())
    .map(([key, miss]) => ({ key, topic: keyTopic.get(key) || key, miss, total: keyTotal.get(key) || 1 }))
    .sort((a, b) => b.miss - a.miss)
    .slice(0, 5);

  // 聚合近 7 天的错因分布
  const reasonAgg = { careless: 0, noknow: 0, guess: 0 };
  let hasReasons = false;
  last7.forEach((key) => {
    const h = history[key];
    if (!h?.wrongReasons) return;
    hasReasons = true;
    Object.entries(h.wrongReasons).forEach(([k, v]) => { reasonAgg[k] = (reasonAgg[k] || 0) + v; });
  });
  const reasonTotal = reasonAgg.careless + reasonAgg.noknow + reasonAgg.guess;

  // 如果三项数据全空，跳过诊断卡（避免旧数据用户看到空卡片）
  if (!hasSubj && !hasKeys && !hasReasons) return;

  const SUBJECT_COLORS = { chinese: '#ff8a65', english: '#7986cb', math: '#4fc3f7', science: '#81c784' };

  const card = el('div', { class: 'card gp-diagnosis' }, [
    el('div', { class: 'gp-dia-head' }, [
      el('h3', { text: '💡 本周诊断报告' }),
      el('span', { class: 'chip chip-line', text: '近 7 天' })
    ])
  ]);

  // --- 学科正确率 ---
  if (hasSubj) {
    const subjCard = el('div', { class: 'gp-dia-section' }, [el('h4', { text: '📊 各科首答正确率' })]);
    const subjList = el('div', { class: 'gp-subj-list' });
    store.SUBJECTS.forEach((sub) => {
      const agg = subjAgg[sub];
      const meta = store.SUBJECT_META[sub];
      if (!agg || !agg.total) return;
      const rate = Math.round((agg.correct / agg.total) * 100);
      const rateColor = rate >= 85 ? 'var(--ok)' : rate >= 60 ? 'var(--accent)' : 'var(--bad)';
      subjList.append(el('div', { class: 'gp-subj-row' }, [
        el('span', { class: 'gp-subj-icon', text: meta.icon }),
        el('span', { class: 'gp-subj-name', text: meta.name }),
        el('div', { class: 'gp-subj-bar' }, [
          el('i', {
            class: 'gp-subj-fill',
            style: { width: `${rate}%`, background: SUBJECT_COLORS[sub] }
          })
        ]),
        el('span', { class: 'gp-subj-rate', style: { color: rateColor }, text: `${rate}%` })
      ]));
    });
    if (subjList.childElementCount > 0) subjCard.append(subjList);
    card.append(subjCard);
  }

  // --- 薄弱知识点 TOP ---
  if (hasKeys && weakList.length > 0) {
    const weakCard = el('div', { class: 'gp-dia-section' }, [el('h4', { text: '🎯 最近容易出错的知识点' })]);
    const weakListEl = el('div', { class: 'gp-weak-list' });
    weakList.forEach((w, rank) => {
      weakListEl.append(el('div', { class: 'gp-weak-row' }, [
        el('span', { class: 'gp-weak-rank', text: rank + 1 }),
        el('span', { class: 'gp-weak-topic', text: w.topic }),
        el('span', { class: 'gp-weak-miss', text: `错 ${w.miss} 次` })
      ]));
    });
    weakCard.append(weakListEl, el('p', { class: 'gp-dia-tip', text: '建议回到对应任务，把这些知识点多练两遍。' }));
    card.append(weakCard);
  }

  // --- 错因分布 ---
  if (hasReasons && reasonTotal > 0) {
    const reasonCard = el('div', { class: 'gp-dia-section' }, [el('h4', { text: '🔍 错题原因分布' })]);
    const reasonList = el('div', { class: 'gp-reason-list' });
    const reasonLabels = {
      careless: { icon: '🙈', text: '粗心 / 看错了', color: '#ffb74d' },
      noknow:   { icon: '🤔', text: '不会做',         color: '#e57373' },
      guess:    { icon: '🎲', text: '随便猜的',       color: '#ba68c8' }
    };
    ['careless', 'noknow', 'guess'].forEach((k) => {
      const count = reasonAgg[k] || 0;
      const pct = reasonTotal ? Math.round((count / reasonTotal) * 100) : 0;
      const info = reasonLabels[k];
      reasonList.append(el('div', { class: 'gp-reason-row' }, [
        el('span', { class: 'gp-reason-icon', text: info.icon }),
        el('span', { class: 'gp-reason-name', text: info.text }),
        el('div', { class: 'gp-reason-bar' }, [
          el('i', { class: 'gp-reason-fill', style: { width: `${pct}%`, background: info.color } })
        ]),
        el('span', { class: 'gp-reason-val', text: `${count} 次 · ${pct}%` })
      ]));
    });
    reasonCard.append(reasonList);
    // 如果粗心占比 > 50%，给个性化建议
    if (reasonAgg.careless > reasonAgg.noknow && reasonAgg.careless > reasonAgg.guess && reasonTotal >= 4) {
      reasonCard.append(el('p', { class: 'gp-dia-tip', text: '💡 粗心居多，可以试试"做题前用笔指读一遍题面"，减少漏看条件。' }));
    } else if (reasonAgg.noknow > reasonAgg.careless && reasonTotal >= 3) {
      reasonCard.append(el('p', { class: 'gp-dia-tip', text: '💡 不会做的题比较多，建议和爸爸妈妈一起看看解析，理解了再练。' }));
    }
    card.append(reasonCard);
  }

  app.append(card);
}

function stat(icon, value, label) {
  return el('div', { class: 'gp-stat' }, [
    el('span', { class: 'gp-stat-icon', text: icon }),
    el('b', { text: value }),
    el('small', { text: label })
  ]);
}

render();
