/**
 * course/index.js —— 48 册懒加载索引（P0）
 *
 * - 目录（48 册）常驻，体积很小；
 * - 单元内容按册动态 import，首屏只解析当前册；
 * - 未建册返回空 units（不伪造单元名）。
 *
 * 同步场景（抽题 / 掌握度）走 course-map.js 的静态兼容门面，
 * 只静态引入已建的 4 册骨架；其余 44 册一律走这里按需加载。
 */

import { VOLUME_CATALOG, BUILT_VOLUME_KEYS, volumeKeyOf, EDITION_ID } from './edition-profile.js';

const LOADERS = {
  'math:1:上册': () => import('./volumes/math-g1-up.js'),
  'math:1:下册': () => import('./volumes/math-g1-down.js'),
  'math:2:上册': () => import('./volumes/math-g2-up.js'),
  'math:2:下册': () => import('./volumes/math-g2-down.js'),
  'math:3:上册': () => import('./volumes/math-g3-up.js'),
  'math:3:下册': () => import('./volumes/math-g3-down.js'),
  'math:4:上册': () => import('./volumes/math-g4-up.js'),
  'math:4:下册': () => import('./volumes/math-g4-down.js'),
  'math:5:上册': () => import('./volumes/math-g5-up.js'),
  'math:5:下册': () => import('./volumes/math-g5-down.js'),
  'math:6:上册': () => import('./volumes/math-g6-up.js'),
  'math:6:下册': () => import('./volumes/math-g6-down.js'),
  'chinese:1:上册': () => import('./volumes/chinese-g1-up.js'),
  'chinese:1:下册': () => import('./volumes/chinese-g1-down.js'),
  'chinese:2:上册': () => import('./volumes/chinese-g2-up.js'),
  'chinese:2:下册': () => import('./volumes/chinese-g2-down.js'),
  'chinese:3:上册': () => import('./volumes/chinese-g3-up.js'),
  'chinese:3:下册': () => import('./volumes/chinese-g3-down.js'),
  'chinese:4:上册': () => import('./volumes/chinese-g4-up.js'),
  'chinese:4:下册': () => import('./volumes/chinese-g4-down.js'),
  'chinese:5:上册': () => import('./volumes/chinese-g5-up.js'),
  'chinese:5:下册': () => import('./volumes/chinese-g5-down.js'),
  'chinese:6:上册': () => import('./volumes/chinese-g6-up.js'),
  'chinese:6:下册': () => import('./volumes/chinese-g6-down.js')
};

const CACHE = new Map();

export function listVolumes() {
  return VOLUME_CATALOG.map((v) => ({ ...v, built: Boolean(LOADERS[v.key]) }));
}

export function builtVolumeKeys() {
  return Object.keys(LOADERS);
}

export function volumeMetaOf(subject, grade, term) {
  const key = volumeKeyOf(subject, grade, term);
  return listVolumes().find((v) => v.key === key) || null;
}

/** 按册加载：未建册返回 { units: [] }，不读取任何虚构内容 */
export async function loadVolume(subject, grade, term) {
  const key = volumeKeyOf(subject, grade, term);
  const meta = volumeMetaOf(subject, grade, term);
  if (!meta) throw new Error(`未登记的册：${key}`);
  if (CACHE.has(key)) return CACHE.get(key);
  const loader = LOADERS[key];
  if (!loader) {
    const empty = { ...meta, edition: EDITION_ID, units: [] };
    CACHE.set(key, empty);
    return empty;
  }
  const mod = await loader();
  const volume = { ...meta, ...mod.VOLUME, key };
  CACHE.set(key, volume);
  return volume;
}

/** 已建册全部加载（验收脚本用；孩子端不会调这个） */
export async function loadBuiltVolumes() {
  const out = [];
  for (const key of BUILT_VOLUME_KEYS) {
    const [subject, grade, term] = key.split(':');
    out.push(await loadVolume(subject, Number(grade), term));
  }
  return out;
}
