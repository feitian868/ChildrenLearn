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
import { sourceOf, EDITION_ID } from './course/edition-profile.js';
import { buildAliasMap } from './course/id-spec.js';

export const MATH_VOLUMES = [
  MATH_G1_UP, MATH_G1_DOWN, MATH_G2_UP, MATH_G2_DOWN,
  MATH_G3_UP, MATH_G3_DOWN, MATH_G4_UP, MATH_G4_DOWN,
  MATH_G5_UP, MATH_G5_DOWN, MATH_G6_UP, MATH_G6_DOWN
];

export const COURSE_SUBJECT = 'math';

/** 仅保留下拉可选版本；实际用书由 editionProfile 决定（不再要求真人翻封面） */
export const COURSE_VERSIONS = ['人教版', '北师大版', '苏教版'];

export const COURSE_BOOKS = MATH_VOLUMES.map((v) => ({
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
  note: 'P2 已建数学 1~6 年级上下册共 12 册；2 年级单元是前置复习单元，不再混挂进三上教材。'
    + '其余三科 36 册只登记目录，待 P3~P5 建包。'
};

/* ------------------------- 合并已建册 ------------------------- */

const VOLUME_BY_UNIT = new Map();

export const COURSE_UNITS = [];
for (const volume of MATH_VOLUMES) {
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

export const ID_ALIASES = buildAliasMap(MATH_VOLUMES);

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
  if (!course || course.subject !== subject || !course.currentUnitId) return null;
  const currentId = resolveUnitId(course.currentUnitId);
  const current = COURSE_UNITS.find((u) => u.id === currentId);
  if (!current) return null;
  const learned = new Set((course.learnedUnits || []).map(resolveUnitId));
  const allowed = new Set(
    COURSE_UNITS
      .filter((u) => u.order <= current.order || learned.has(u.id))
      .map((u) => u.id)
  );
  return {
    currentUnitId: current.id,
    currentUnitName: current.name,
    currentOrder: current.order,
    allowed
  };
}
