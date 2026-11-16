/**
 * specs-english.js —— v5 P4 英语题型规格引擎
 *
 * 口径与 specs-chinese / specs-math 平行：
 *   · 每个 kid ≥3 个语义不同外壳（specId = {kid}-s01…），由家族 modes 按 specOffset 切分；
 *   · 同一册内不同 kid 落在互不重叠的 modes 段（1/5/9），不共用外壳；
 *   · 题面前缀带【Unit N·册次】，保证同一 grade 不同单元题面不重复；
 *   · 新内容默认 status:'pending-review'，不直接进抽题池；
 *   · 仿真可传 simulateApproved 观察「放行后」供给，线上默认口径不变。
 */

import { hashString, pick, randInt, shuffle } from '../../core/rng.js';
import { sourceOf } from './edition-profile.js';
import { VOLUME as EN_G1_UP } from './volumes/english-g1-up.js';
import { VOLUME as EN_G1_DOWN } from './volumes/english-g1-down.js';
import { VOLUME as EN_G2_UP } from './volumes/english-g2-up.js';
import { VOLUME as EN_G2_DOWN } from './volumes/english-g2-down.js';
import { VOLUME as EN_G3_UP } from './volumes/english-g3-up.js';
import { VOLUME as EN_G3_DOWN } from './volumes/english-g3-down.js';
import { VOLUME as EN_G4_UP } from './volumes/english-g4-up.js';
import { VOLUME as EN_G4_DOWN } from './volumes/english-g4-down.js';
import { VOLUME as EN_G5_UP } from './volumes/english-g5-up.js';
import { VOLUME as EN_G5_DOWN } from './volumes/english-g5-down.js';
import { VOLUME as EN_G6_UP } from './volumes/english-g6-up.js';
import { VOLUME as EN_G6_DOWN } from './volumes/english-g6-down.js';
import { EN_WORD_MODES, EN_SPELLING_MODES, EN_PHONICS_MODES, EN_LETTER_MODES } from './specs-english-modes-basic.js';
import { EN_SENTENCE_MODES, EN_GRAMMAR_MODES, EN_DIALOGUE_MODES } from './specs-english-modes-text.js';

export const ENGLISH_VOLUMES = [
  EN_G1_UP, EN_G1_DOWN, EN_G2_UP, EN_G2_DOWN,
  EN_G3_UP, EN_G3_DOWN, EN_G4_UP, EN_G4_DOWN,
  EN_G5_UP, EN_G5_DOWN, EN_G6_UP, EN_G6_DOWN
];

const REVIEW_BATCH = 'p4-english-batch-1';
// 每个规格 12 个变式：英语库比语文小（12 册 210 kid），加宽变式保证
// 365 天题面不重复和每 kid 的全年题面供给。
const VARIANTS = 24;

const pad2 = (n) => String(n).padStart(2, '0');

export function specIdOf(kid, n) {
  return `${kid}-s${pad2(n)}`;
}

export function specIdsOf(kid, count = 3) {
  return Array.from({ length: count }, (_, i) => specIdOf(kid, i + 1));
}

/** 家族 → 12 个外壳 */
export const FAMILY_MODES = {
  'en-letter': EN_LETTER_MODES,
  'en-word': EN_WORD_MODES,
  'en-spelling': EN_SPELLING_MODES,
  'en-phonics': EN_PHONICS_MODES,
  'en-sentence': EN_SENTENCE_MODES,
  'en-grammar': EN_GRAMMAR_MODES,
  'en-dialogue': EN_DIALOGUE_MODES
};

/**
 * 一年级：所有单元都用字母族外壳（Aa-Zz 起步），但按单元轮转外壳段、
 * 并按单元分字母带 —— 否则同册内不同单元的题面只差「Unit N」，
 * 而模板去重会把数字归一成「#」，判成共用同一外壳。
 */
const G1_BANDS = ['ABCDE', 'FGHIJ', 'KLMN', 'OPQR', 'STUV', 'WXYZ'];
const g1Modes = (unitIndex) => {
  const base = FAMILY_MODES['en-letter'];
  const rot = (unitIndex % 3) * 4;
  return base.slice(rot).concat(base.slice(0, rot));
};
const g1Band = (unitIndex) => G1_BANDS[unitIndex % G1_BANDS.length];

/** 单元标签：Unit N·册次（同一 grade 内唯一，sim 有断言） */
export function unitTagOf(name, term = '') {
  const unit = /Unit\s*\d+/i.exec(name)?.[0] || '';
  return `${unit}${term ? `·${term}` : ''}`;
}

function makeQuestion(volume, unit, lesson, kid, specId, mode, raw) {
  const q = {
    id: `${specId}-${hashString(`${raw.prompt}|${raw.answer}`)}`,
    subject: 'english',
    grade: volume.grade,
    term: volume.term,
    type: raw.type || 'choice',
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

function specsOfKid(kid, modes = FAMILY_MODES[kid.specDomain] || []) {
  const start = Math.max(0, (kid.specParams?.specOffset ?? 1) - 1);
  const count = Math.min(kid.specParams?.specCount ?? 3, modes.length - start);
  return Array.from({ length: Math.max(0, count) }, (_, i) => ({ specId: specIdOf(kid.id, i + 1), mode: modes[start + i] }));
}

export function specPoolOfVolume(volume, rand, { simulateApproved = false } = {}) {
  const out = [];
  // seen 按 kid 去重：同 kid 内 prompt 必须唯一，不同 kid 间允许相同（R3 的 templateKey 已保证同册共享外壳为 0）
  const seenByKid = new Map();
  volume.units.forEach((unit, unitIndex) => {
    const tag = unitTagOf(unit.name, volume.term);
    const band = volume.grade === 1 ? g1Band(unitIndex) : undefined;
    for (const lesson of unit.lessons) {
      for (const kid of lesson.knowledge) {
        const seen = seenByKid.get(kid.id) || new Set();
        seenByKid.set(kid.id, seen);
        const modes = volume.grade === 1 ? g1Modes(unitIndex) : (FAMILY_MODES[kid.specDomain] || []);
        for (const { specId, mode } of specsOfKid(kid, modes)) {
          if (!mode) continue;
          for (let v = 0; v < VARIANTS; v += 1) {
            const raw = mode.make(rand, { tag, grade: volume.grade, term: volume.term, unit: unit.name, kidIndex: kid.specParams?.kidIndex, band });
            if (!raw || !raw.prompt) continue;
            const q = makeQuestion(volume, unit, lesson, kid, specId, mode, raw);
            // 同一 kid 内 prompt 唯一：变式可能只是换选项顺序，若按 prompt|answer(索引)
            // 去重，同日会抽到两道题干完全相同的题（R1 判重按题面口径）。
            const sig = q.prompt;
            if (seen.has(sig)) continue;
            seen.add(sig);
            out.push(simulateApproved ? { ...q, status: 'approved' } : q);
          }
        }
      }
    }
  });
  return out;
}

export function specPoolOfGrade(grade, rand, opts = {}) {
  const out = [];
  for (const volume of ENGLISH_VOLUMES.filter((v) => v.grade === grade)) {
    specPoolOfVolume(volume, rand, opts).forEach((q) => out.push(q));
  }
  return out;
}

export const SPEC_VARIANTS_PER_SPEC = VARIANTS;
export const ENGLISH_REVIEW_BATCH = REVIEW_BATCH;

/** 兼容 specs-math 同名导出（部分脚本按统一接口读取） */
export const specPoolOfVolumeAll = specPoolOfVolume;
export { shuffle, pick, randInt };
