/**
 * specs-english-util.js —— 英语规格外壳共用的小工具
 * 只做「选项去重 / 音节 / 元音 / 字母」这类机械处理，不含任何题库语义。
 */

import { shuffle, sample } from '../../core/rng.js';

export const VOWELS = 'aeiou';

export function vowelsOf(word) {
  const seen = new Set();
  for (const ch of word.toLowerCase()) if (VOWELS.includes(ch)) seen.add(ch);
  return [...seen];
}

export function vowelCountOf(word) {
  let n = 0;
  for (const ch of word.toLowerCase()) if (VOWELS.includes(ch)) n += 1;
  return n;
}

/** 近似音节数：元音字母组 + 结尾不发音 e 归并（足够覆盖小学词表） */
export function syllableCount(word) {
  const w = word.toLowerCase();
  const groups = w.match(/[aeiouy]+/g) || [];
  let n = groups.length;
  if (/e$/.test(w) && !/[aeiou]{2,}e$/.test(w) && n > 1) n -= 1;
  return Math.max(1, n);
}

/** 构造 4 选 1；wrongs 不足 3 个时返回 null，由调用方换素材 */
export function choiceOf(rand, correct, wrongs, meta) {
  const pool = [];
  for (const w of wrongs) {
    if (w === undefined || w === null) continue;
    if (w === correct) continue;
    if (pool.includes(w)) continue;
    pool.push(w);
  }
  if (pool.length < 3) return null;
  const picked = sample(rand, pool, 3);
  const options = shuffle(rand, [correct, ...picked]);
  return { ...meta, type: 'choice', options, answer: options.indexOf(correct) };
}

/** 把句子里的目标词换成横线（只替换第一次出现的完整词） */
export function blankOut(sentence, word) {
  const re = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
  return re.test(sentence) ? sentence.replace(re, '___') : sentence.replace(word, '___');
}

export function distinctLetters(rand, correct, n = 3) {
  const all = 'abcdefghijklmnopqrstuvwxyz'.split('').filter((c) => c !== correct.toLowerCase());
  return sample(rand, all, n);
}
