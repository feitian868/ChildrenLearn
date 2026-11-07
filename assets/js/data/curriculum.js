/**
 * curriculum.js —— 年级、星期侧重、题量与达标线
 * 想调整"每天每科几项"或"每项几题"，只改这里即可。
 */

export const GRADES = [1, 2, 3, 4, 5, 6];

export const GRADE_LABEL = {
  1: '一年级',
  2: '二年级',
  3: '三年级',
  4: '四年级',
  5: '五年级',
  6: '六年级'
};

/** 星期侧重：重点科目当天 3 项，其余 2 项；周日全科复习各 2 项 */
export const WEEKDAY_FOCUS = {
  0: [],
  1: ['chinese'],
  2: ['math'],
  3: ['english'],
  4: ['science'],
  5: ['chinese', 'math'],
  6: ['english', 'science']
};

export const WEEKDAY_FOCUS_TEXT = {
  0: '周日 · 四科复习',
  1: '周一 · 语文日',
  2: '周二 · 数学日',
  3: '周三 · 英语日',
  4: '周四 · 科学日',
  5: '周五 · 语文 + 数学',
  6: '周六 · 英语 + 科学'
};

export const QUESTIONS_PER_TASK = 4; // ★ 硬禁区，年级差异靠「项数 + 达标线」实现
export const PASS_LINE = 3; // 三年级达标线（保持 v4 口径，兼容旧引用）

/**
 * P1 年级差异化：每日任务项数（每科）。
 * 三年级沿用 v4 的 2 项（重点日 3 项），保证 A~E 防回归基线不变。
 * 题量只动「项数」，不动 QUESTIONS_PER_TASK。
 */
export const TASK_BASE_BY_GRADE = { 1: 1, 2: 2, 3: 2, 4: 3, 5: 3, 6: 4 };

/** 达标线：1~2 年级 2 题；3~6 年级 3 题（每题组题量仍为 4） */
export const PASS_LINE_BY_GRADE = { 1: 2, 2: 2, 3: 3, 4: 3, 5: 3, 6: 3 };

export function passLineFor(grade = 3) {
  return PASS_LINE_BY_GRADE[Number(grade)] ?? PASS_LINE;
}

/** 4 档难度标签（P1 统一口径；题池目前只有 1~2 档，3~4 档待 P2 内容补齐） */
export const LEVEL_LABEL = {
  1: '识记',
  2: '理解',
  3: '应用',
  4: '迁移'
};

export function focusOf(weekday) {
  return WEEKDAY_FOCUS[weekday] || [];
}

export function taskCountFor(subject, weekday, grade = 3) {
  const base = TASK_BASE_BY_GRADE[Number(grade)] ?? TASK_BASE_BY_GRADE[3];
  if (weekday === 0) return base; // 周日：四科复习，不加码
  return focusOf(weekday).includes(subject) ? base + 1 : base;
}

export function focusTextOf(weekday) {
  return WEEKDAY_FOCUS_TEXT[weekday] || '';
}

/** 各科小提示，用于游戏页底部 */
export const SUBJECT_TIP = {
  chinese: '慢慢读一遍题目，再选答案。答错会给小提示，不扣分。',
  english: '点小喇叭可以听发音，大声跟读一遍再作答。',
  math: '可以在心里先算一遍，再用键盘输入答案。',
  science: '想一想生活中的现象，再判断对错。'
};
