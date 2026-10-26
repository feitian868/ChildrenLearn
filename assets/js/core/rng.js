/**
 * rng.js —— 可复现的伪随机工具
 * 用「日期 + 年级 + 科目」做种子，保证同一天刷新页面拿到的题目一致。
 */

export function hashString(str) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** mulberry32：小而稳的种子随机数发生器 */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle(rng, list) {
  const arr = list.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function pick(rng, list) {
  return list[Math.floor(rng() * list.length)];
}

export function sample(rng, list, count) {
  return shuffle(rng, list).slice(0, count);
}

export function randInt(rng, min, max) {
  return min + Math.floor(rng() * (max - min + 1));
}
