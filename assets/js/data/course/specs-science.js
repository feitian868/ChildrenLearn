/**
 * specs-science.js —— v5 P5 科学题型规格引擎
 *
 * 口径与 specs-english 平行：
 *   · 每个 kid 4 个外壳（specId = {kid}-s01…s04），由家族 modes 按 specOffset 切分；
 *   · 同一册内不同 kid 落在互不重叠的 (family, 段) 上（建包时已校验）；
 *   · 题面前缀带【第X单元·册次】，保证同一 grade 内不同单元题面不重复；
 *   · 新内容默认 status:'pending-review'，不直接进抽题池；
 *   · 仿真可传 simulateApproved 观察「放行后」供给，线上默认口径不变。
 */

import { hashString, pick, randInt, shuffle } from '../../core/rng.js';
import { sourceOf } from './edition-profile.js';
import { VOLUME as SC_G1_UP } from './volumes/science-g1-up.js';
import { VOLUME as SC_G1_DOWN } from './volumes/science-g1-down.js';
import { VOLUME as SC_G2_UP } from './volumes/science-g2-up.js';
import { VOLUME as SC_G2_DOWN } from './volumes/science-g2-down.js';
import { VOLUME as SC_G3_UP } from './volumes/science-g3-up.js';
import { VOLUME as SC_G3_DOWN } from './volumes/science-g3-down.js';
import { VOLUME as SC_G4_UP } from './volumes/science-g4-up.js';
import { VOLUME as SC_G4_DOWN } from './volumes/science-g4-down.js';
import { VOLUME as SC_G5_UP } from './volumes/science-g5-up.js';
import { VOLUME as SC_G5_DOWN } from './volumes/science-g5-down.js';
import { VOLUME as SC_G6_UP } from './volumes/science-g6-up.js';
import { VOLUME as SC_G6_DOWN } from './volumes/science-g6-down.js';
import { SC_LIFE_MODES, SC_ENV_MODES } from './specs-science-modes-life.js';
import { SC_MATTER_MODES, SC_FORCE_MODES } from './specs-science-modes-phys.js';
import { SC_EARTH_MODES, SC_INQUIRY_MODES, SC_TECH_MODES } from './specs-science-modes-earth.js';

export const SCIENCE_VOLUMES = [
  SC_G1_UP, SC_G1_DOWN, SC_G2_UP, SC_G2_DOWN,
  SC_G3_UP, SC_G3_DOWN, SC_G4_UP, SC_G4_DOWN,
  SC_G5_UP, SC_G5_DOWN, SC_G6_UP, SC_G6_DOWN
];

const REVIEW_BATCH = 'p5-science-batch-1';
/** 每个规格的变式尝试数：区县科学一年约 830~1250 题，需要 ≥2 倍题面供给 */
const VARIANTS = 24;

const pad2 = (n) => String(n).padStart(2, '0');

export function specIdOf(kid, n) {
  return `${kid}-s${pad2(n)}`;
}

export function specIdsOf(kid, count = 4) {
  return Array.from({ length: count }, (_, i) => specIdOf(kid, i + 1));
}

/** 家族 → 12 个外壳 */
export const FAMILY_MODES = {
  'sc-life': SC_LIFE_MODES,
  'sc-env': SC_ENV_MODES,
  'sc-matter': SC_MATTER_MODES,
  'sc-force': SC_FORCE_MODES,
  'sc-earth': SC_EARTH_MODES,
  'sc-inquiry': SC_INQUIRY_MODES,
  'sc-tech': SC_TECH_MODES
};

/** 单元标签：第X单元·册次（同一 grade 内唯一，sim 有断言） */
export function unitTagOf(name, term = '') {
  const ord = /第[一二三四五六七八九十]+单元/.exec(name)?.[0] || '';
  return `${term ? `${ord}·${term}` : ord}`;
}

function makeQuestion(volume, unit, lesson, kid, specId, mode, raw) {
  const q = {
    id: `${specId}-${hashString(`${raw.prompt}|${raw.answer}`)}`,
    subject: 'science',
    grade: volume.grade,
    term: volume.term,
    type: raw.type || 'choice',
    prompt: raw.prompt,
    answer: raw.answer,
    explain: raw.explain,
    level: raw.level || mode.level || 2,
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
  const count = Math.min(kid.specParams?.specCount ?? 4, modes.length - start);
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
            // 同一册内题面唯一（R1 按题面判重）
            if (seen.has(q.prompt)) continue;
            seen.add(q.prompt);
            if (q.type === 'choice' && !(q.answer >= 0 && q.answer < q.options.length)) continue;
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
  for (const volume of SCIENCE_VOLUMES.filter((v) => v.grade === grade)) {
    specPoolOfVolume(volume, rand, opts).forEach((q) => out.push(q));
  }
  return out;
}

export const SPEC_VARIANTS_PER_SPEC = VARIANTS;
export const SCIENCE_REVIEW_BATCH = REVIEW_BATCH;

/** 兼容其他规格引擎的统一接口 */
export const specPoolOfVolumeAll = specPoolOfVolume;
export { shuffle, pick, randInt };
