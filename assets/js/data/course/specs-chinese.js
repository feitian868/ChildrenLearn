/**
 * specs-chinese.js —— v5 P3 语文题型规格引擎
 *
 * 口径与 specs-math 平行：
 *   · 每个 kid ≥3 个语义不同外壳（specId = {kid}-s01…），由家族 modes 按 specOffset 切分；
 *   · 同一册内不同 kid 落在互不重叠的 modes 段（1/5/9），不共用外壳；
 *   · 题面前缀带【单元标签】，保证同一 grade 不同单元题面不重复；
 *   · 新内容默认 status:'pending-review'，不直接进抽题池；
 *   · 仿真可传 simulateApproved 观察「放行后」供给，线上默认口径不变。
 */

import { randInt, pick, shuffle, hashString } from '../../core/rng.js';
import { sourceOf } from './edition-profile.js';
import { VOLUME as ZH_G1_UP } from './volumes/chinese-g1-up.js';
import { VOLUME as ZH_G1_DOWN } from './volumes/chinese-g1-down.js';
import { VOLUME as ZH_G2_UP } from './volumes/chinese-g2-up.js';
import { VOLUME as ZH_G2_DOWN } from './volumes/chinese-g2-down.js';
import { VOLUME as ZH_G3_UP } from './volumes/chinese-g3-up.js';
import { VOLUME as ZH_G3_DOWN } from './volumes/chinese-g3-down.js';
import { VOLUME as ZH_G4_UP } from './volumes/chinese-g4-up.js';
import { VOLUME as ZH_G4_DOWN } from './volumes/chinese-g4-down.js';
import { VOLUME as ZH_G5_UP } from './volumes/chinese-g5-up.js';
import { VOLUME as ZH_G5_DOWN } from './volumes/chinese-g5-down.js';
import { VOLUME as ZH_G6_UP } from './volumes/chinese-g6-up.js';
import { VOLUME as ZH_G6_DOWN } from './volumes/chinese-g6-down.js';
import { ZH_SOUND_MODES, ZH_PINYIN_MODES, ZH_SHAPE_MODES, ZH_WORD_MODES } from './specs-chinese-modes-basic.js';
import { ZH_SENTENCE_MODES, ZH_POEM_MODES, ZH_READING_MODES, ZH_CLASSICAL_MODES, ZH_IDIOM_MODES } from './specs-chinese-modes-text.js';

export const CHINESE_VOLUMES = [
  ZH_G1_UP, ZH_G1_DOWN, ZH_G2_UP, ZH_G2_DOWN,
  ZH_G3_UP, ZH_G3_DOWN, ZH_G4_UP, ZH_G4_DOWN,
  ZH_G5_UP, ZH_G5_DOWN, ZH_G6_UP, ZH_G6_DOWN
];

const REVIEW_BATCH = 'p3-chinese-batch-1';
const VARIANTS = 8;

const pad2 = (n) => String(n).padStart(2, '0');

export function specIdOf(kid, n) {
  return `${kid}-s${pad2(n)}`;
}

export function specIdsOf(kid, count = 3) {
  return Array.from({ length: count }, (_, i) => specIdOf(kid, i + 1));
}

/** 家族 → 12 个外壳 */
export const FAMILY_MODES = {
  'zh-sound': ZH_SOUND_MODES,
  'zh-pinyin': ZH_PINYIN_MODES,
  'zh-shape': ZH_SHAPE_MODES,
  'zh-word': ZH_WORD_MODES,
  'zh-sentence': ZH_SENTENCE_MODES,
  'zh-poem': ZH_POEM_MODES,
  'zh-reading': ZH_READING_MODES,
  'zh-classical': ZH_CLASSICAL_MODES,
  'zh-idiom': ZH_IDIOM_MODES
};

/** 单元标签：第X单元·册次（同一 grade 内唯一，sim 有断言；不含单元代表作名，避免把选项写进题面） */
export function unitTagOf(name, term = '') {
  const ord = /第[一二三四五六七八九十]+单元/.exec(name)?.[0] || '';
  return `${ord}${term ? `·${term}` : ''}`;
}

function makeQuestion(volume, unit, lesson, kid, specId, mode, raw) {
  const q = {
    id: `${specId}-${hashString(`${raw.prompt}|${raw.answer}`)}`,
    subject: 'chinese',
    grade: volume.grade,
    term: volume.term,
    type: raw.type || 'input',
    prompt: raw.prompt,
    answer: raw.answer,
    explain: raw.explain,
    level: mode.level || 2,
    source: sourceOf(volume, unit.name),
    topic: lesson.topic,
    edition: volume.edition,
    unitId: unit.id,
    lessonId: lesson.id,
    knowledgeId: kid.id,
    specId,
    askPattern: mode.ask,
    status: 'pending-review',
    reviewBatch: REVIEW_BATCH
  };
  if (raw.options) q.options = raw.options;
  if (raw.unit) q.unit = raw.unit;
  return q;
}

function specsOfKid(kid) {
  const modes = FAMILY_MODES[kid.specDomain] || [];
  const start = Math.max(0, (kid.specParams?.specOffset ?? 1) - 1);
  const count = Math.min(kid.specParams?.specCount ?? 3, modes.length - start);
  return Array.from({ length: Math.max(0, count) }, (_, i) => ({ specId: specIdOf(kid.id, i + 1), mode: modes[start + i] }));
}

export function specPoolOfVolume(volume, rand, { simulateApproved = false } = {}) {
  const out = [];
  const seen = new Set();
  for (const unit of volume.units) {
    const tag = unitTagOf(unit.name, volume.term);
    for (const lesson of unit.lessons) {
      for (const kid of lesson.knowledge) {
        for (const { specId, mode } of specsOfKid(kid)) {
          if (!mode) continue;
          for (let v = 0; v < VARIANTS; v += 1) {
            const raw = mode.make(rand, { tag, grade: volume.grade, term: volume.term, unit: unit.name, kidIndex: kid.specParams?.kidIndex });
            if (!raw || !raw.prompt) continue;
            const q = makeQuestion(volume, unit, lesson, kid, specId, mode, raw);
            const sig = `${q.prompt}|${q.answer}`;
            if (seen.has(sig)) continue;
            seen.add(sig);
            out.push(simulateApproved ? { ...q, status: 'approved' } : q);
          }
        }
      }
    }
  }
  return out;
}

export function specPoolOfGrade(grade, rand, opts = {}) {
  const out = [];
  for (const volume of CHINESE_VOLUMES.filter((v) => v.grade === grade)) {
    specPoolOfVolume(volume, rand, opts).forEach((q) => out.push(q));
  }
  return out;
}

export const SPEC_VARIANTS_PER_SPEC = VARIANTS;
export const CHINESE_REVIEW_BATCH = REVIEW_BATCH;

/** 兼容 specs-math 同名导出（部分脚本按统一接口读取） */
export const specPoolOfVolumeAll = specPoolOfVolume;
export { shuffle, pick, randInt };
