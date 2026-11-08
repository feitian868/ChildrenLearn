/**
 * specs-science-util.js —— 科学规格外壳共用的小工具
 * 只做「题面前缀 / 选项去重 / 判断题构造」，不含任何题库语义。
 */

import { shuffle, sample } from '../../core/rng.js';

/** 题面前缀：所有科学题统一带【单元标签·册次】，保证同一 grade 内题面不重复 */
export const p = (ctx, text) => `【${ctx.tag}】${text}`;

/** 从若干同义问法里挑一种，拉开同一外壳的题面供给 */
export function ph(rand, list) {
  return list[Math.floor(rand() * list.length)];
}

/**
 * 构造 4 选 1；wrongs 不足 minWrong 个时返回 null，由调用方换素材。
 * 选项按字符串去重，正确项必须落在选项里。
 */
export function choiceOf(rand, correct, wrongs, meta, minWrong = 3) {
  const pool = [];
  for (const w of wrongs) {
    if (w === undefined || w === null) continue;
    if (String(w) === String(correct)) continue;
    if (pool.includes(String(w))) continue;
    pool.push(String(w));
  }
  if (pool.length < minWrong) return null;
  const picked = sample(rand, pool, minWrong);
  const options = shuffle(rand, [String(correct), ...picked]);
  return { ...meta, type: 'choice', options, answer: options.indexOf(String(correct)) };
}

/** 数值 4 选 1：围绕正确答案造近邻干扰项 */
export function numChoice(rand, correct, meta) {
  const set = new Set([Number(correct)]);
  let guard = 0;
  while (set.size < 4 && guard < 30) {
    guard += 1;
    const v = Number(correct) + [1, -1, 2, -2, 3, 4][Math.floor(rand() * 6)];
    if (v >= 0 && v !== Number(correct)) set.add(v);
  }
  const options = shuffle(rand, [...set].map(String));
  return { ...meta, type: 'choice', options, answer: options.indexOf(String(correct)) };
}

/** 判断题：answer 为布尔值，题干把说法摆出来 */
export function judgeOf(truth, meta) {
  return { ...meta, type: 'judge', answer: !!truth };
}

/** 去掉 undefined / 重复项 */
export function uniq(list) {
  return [...new Set(list.filter((x) => x !== undefined && x !== null))];
}

export { shuffle, sample };
