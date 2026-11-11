/**
 * course-map.js —— 课程结构门面（P0：多册分包后的同步兼容层）
 *
 * 数据来源已拆到 data/course/volumes/*.js，按册（edition/grade/term）分包；
 * 本文件只做三件事：
 *   1) 把已建的 4 册数学骨架合并成 v4 兼容的 COURSE_UNITS（保留短 id）；
 *   2) 出处（source）一律由【结构化索引】生成，不再信任题目自带字符串；
 *   3) 提供同步 annotateQuestion / courseScope（抽题与掌握度都是同步链路）。
 *
 * 未建册走 course/index.js 的懒加载，不进入首屏。
 * v4 短 id（ma-u01 / ma-u01-k1）作为永久别名保留，规范 id 见 course/id-spec.js。
 *
 * ⚠ prerequisites 仍【只记录、不参与任何计算】，解冻条件见 ROADMAP §5（P2）。
 */

import { VOLUME as MATH_G1_UP } from './course/volumes/math-g1-up.js';
import { VOLUME as MATH_G1_DOWN } from './course/volumes/math-g1-down.js';
import { VOLUME as MATH_G2_UP } from './course/volumes/math-g2-up.js';
import { VOLUME as MATH_G2_DOWN } from './course/volumes/math-g2-down.js';
import { VOLUME as MATH_G3_UP } from './course/volumes/math-g3-up.js';
import { VOLUME as MATH_G3_DOWN } from './course/volumes/math-g3-down.js';
import { VOLUME as MATH_G4_UP } from './course/volumes/math-g4-up.js';
import { VOLUME as MATH_G4_DOWN } from './course/volumes/math-g4-down.js';
import { VOLUME as MATH_G5_UP } from './course/volumes/math-g5-up.js';
import { VOLUME as MATH_G5_DOWN } from './course/volumes/math-g5-down.js';
import { VOLUME as MATH_G6_UP } from './course/volumes/math-g6-up.js';
import { VOLUME as MATH_G6_DOWN } from './course/volumes/math-g6-down.js';
import { CHINESE_VOLUMES } from './course/specs-chinese.js';
import { ENGLISH_VOLUMES } from './course/specs-english.js';
import { SCIENCE_VOLUMES } from './course/specs-science.js';
import { sourceOf, EDITION_ID } from './course/edition-profile.js';
import { buildAliasMap } from './course/id-spec.js';

export const MATH_VOLUMES = [
  MATH_G1_UP, MATH_G1_DOWN, MATH_G2_UP, MATH_G2_DOWN,
  MATH_G3_UP, MATH_G3_DOWN, MATH_G4_UP, MATH_G4_DOWN,
  MATH_G5_UP, MATH_G5_DOWN, MATH_G6_UP, MATH_G6_DOWN
];

export const ALL_VOLUMES = [...MATH_VOLUMES, ...CHINESE_VOLUMES, ...ENGLISH_VOLUMES, ...SCIENCE_VOLUMES];

export const COURSE_SUBJECT = 'math';

/** 仅保留下拉可选版本；实际用书由 editionProfile 决定（不再要求真人翻封面） */
export const COURSE_VERSIONS = ['人教版', '北师大版', '苏教版'];

export const COURSE_BOOKS = ALL_VOLUMES.map((v) => ({
  edition: v.edition,
  subject: v.subject,
  grade: v.grade,
  term: v.term,
  key: `${v.subject}:${v.grade}:${v.term}`
}));

export const COURSE_META = {
  subject: 'math',
  subjectName: '数学',
  edition: EDITION_ID,
  version: '人教版',
  grade: null, // 当前孩子所在年级仍由 store.settings.grade 决定，不在这里写死
  term: '',
  books: COURSE_BOOKS,
  draft: true,
  note: '数学、语文、英语、科学各 12 册（1~6 年级上下册）均已建成，教材题已按四批放行。'
};

/* ------------------------- 合并已建册 ------------------------- */

const VOLUME_BY_UNIT = new Map();

export const COURSE_UNITS = [];
for (const volume of ALL_VOLUMES) {
  const volumeKey = `${volume.subject}:${volume.grade}:${volume.term}`;
  for (const unit of volume.units) {
    // 出处由索引生成；单元自带的 source 只作 v4 展示文案兼容
    unit.edition = volume.edition;
    unit.grade = volume.grade;
    unit.term = volume.term;
    unit.volumeKey = volumeKey;
    unit.source = sourceOf(volume, unit.name);
    VOLUME_BY_UNIT.set(unit.id, volumeKey);
    COURSE_UNITS.push(unit);
  }
}
COURSE_UNITS.sort((a, b) => a.order - b.order);

/* ------------------------- 别名（v4 短 id → 规范 id） ------------------------- */

export const ID_ALIASES = buildAliasMap(ALL_VOLUMES);

const UNIT_ID_MAP = new Map();
for (const unit of COURSE_UNITS) {
  UNIT_ID_MAP.set(unit.id, unit.id);
  UNIT_ID_MAP.set(ID_ALIASES.units[unit.id], unit.id);
}

/** 单元 id 解析：兼容 v4 短 id 与 v5 规范 id（旧存档 settings 不改也能用） */
export function resolveUnitId(id) {
  return UNIT_ID_MAP.get(id) || id;
}

export function volumeKeyOfUnit(unitId) {
  return VOLUME_BY_UNIT.get(resolveUnitId(unitId)) || '';
}

/** 某科某一册的全部单元（整册收敛用） */
export function unitsOfBook(volumeKey) {
  return COURSE_UNITS.filter((u) => u.volumeKey === volumeKey);
}

/** 某科的可选册次（按年级、上下册排序），供课程设置的下拉使用 */
export function booksOfSubject(subject) {
  const seen = new Set();
  const list = [];
  for (const u of COURSE_UNITS) {
    if (!String(u.volumeKey || '').startsWith(`${subject}:`)) continue;
    if (seen.has(u.volumeKey)) continue;
    seen.add(u.volumeKey);
    list.push({
      key: u.volumeKey,
      grade: u.grade,
      term: u.term,
      edition: u.edition,
      firstUnitId: u.id,
      unitCount: COURSE_UNITS.filter((x) => x.volumeKey === u.volumeKey).length
    });
  }
  return list.sort((a, b) => (a.grade - b.grade) || (a.term === b.term ? 0 : a.term === '上册' ? -1 : 1));
}

/**
 * 取某一科的课程配置。
 * 数学沿用 settings.course（v4 存量字段，不迁移）；
 * 语文/英语/科学存在 settings.courseBySubject[subject]。
 */
export function courseFor(settings, subject) {
  if (!settings) return null;
  if (subject === 'math') return settings.course || null;
  return (settings.courseBySubject || {})[subject] || null;
}

/* ------------------------- 题目 → 课程结构 映射 ------------------------- */

const INDEX = new Map();
for (const unit of COURSE_UNITS) {
  for (const lesson of unit.lessons) {
    const key = `${unit.source}||${lesson.topic}`;
    if (INDEX.has(key)) {
      INDEX.get(key).knowledgeIds.push(...lesson.knowledge.map((k) => k.id));
    } else {
      INDEX.set(key, {
        unitId: unit.id,
        unitName: unit.name,
        unitOrder: unit.order,
        lessonId: lesson.id,
        lessonName: lesson.name,
        knowledgeId: lesson.knowledge[0]?.id || '',
        knowledgeIds: lesson.knowledge.map((k) => k.id),
        knowledgeName: lesson.knowledge[0]?.name || '',
        difficulty: lesson.knowledge[0]?.difficulty ?? 1,
        // ★ 出处由索引生成
        source: unit.source,
        edition: unit.edition,
        volumeKey: unit.volumeKey,
        grade: unit.grade,
        term: unit.term
      });
    }
  }
}

/**
 * 按【结构化索引】把题挂到课程表：
 * 题自带 source 只用于定位（必须与索引生成的出处完全一致），
 * 返回值里的 source 才是展示/落库口径。
 * 挂不上返回 null（逻辑题、跨年级拔高题、未建册内容）。
 */
export function annotateQuestion(q) {
  if (!q) return null;
  return INDEX.get(`${q.source || ''}||${q.topic || ''}`) || null;
}

/** 供工作台/家长视图使用的出处文案（不是教材事实推断，是索引生成） */
export function sourceOfQuestion(q) {
  return annotateQuestion(q)?.source || (q?.source || '');
}

/**
 * 取某一科的单元范围。
 * currentUnitId 未设置 → 返回 null（不启用单元收敛，保持全年级题池）。
 * 范围只包含「当前单元 + 已学单元」，不存在向后扩围的分支。
 */
export function courseScope(course, subject) {
  if (!course || !course.currentUnitId) return null;
  if (course.subject && course.subject !== subject) return null;
  const currentId = resolveUnitId(course.currentUnitId);
  const current = COURSE_UNITS.find((u) => u.id === currentId);
  if (!current) return null;
  // 只在本册同一学科内收敛，避免语文/英语/科学的单元混进数学范围
  const sameSubject = (u) => String(u.volumeKey || '').startsWith(`${subject}:`);
  if (!sameSubject(current)) return null;
  // 整册模式（语文）：范围 = 当前所在一册的全部单元
  if (course.mode === 'book') {
    return {
      mode: 'book',
      currentUnitId: current.id,
      currentUnitName: current.name,
      currentOrder: current.order,
      bookKey: current.volumeKey,
      bookName: `${current.grade}年级${current.term}`,
      grade: current.grade,
      term: current.term,
      allowed: new Set(unitsOfBook(current.volumeKey).map((u) => u.id))
    };
  }
  const learned = new Set((course.learnedUnits || []).map(resolveUnitId));
  const allowed = new Set(
    COURSE_UNITS
      .filter((u) => sameSubject(u) && (u.order <= current.order || learned.has(u.id)))
      .map((u) => u.id)
  );
  return {
    mode: 'unit',
    currentUnitId: current.id,
    currentUnitName: current.name,
    currentOrder: current.order,
    grade: current.grade,
    term: current.term,
    allowed
  };
}
