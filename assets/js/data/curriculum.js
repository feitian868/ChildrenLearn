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

export const QUESTIONS_PER_TASK = 4;
export const PASS_LINE = 3; // 首答正确 ≥3 题即达标

export const LEVEL_LABEL = {
  1: '基础',
  2: '挑战'
};

export function focusOf(weekday) {
  return WEEKDAY_FOCUS[weekday] || [];
}

export function taskCountFor(subject, weekday) {
  if (weekday === 0) return 2;
  return focusOf(weekday).includes(subject) ? 3 : 2;
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
