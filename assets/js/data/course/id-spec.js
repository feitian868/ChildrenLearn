/**
 * id-spec.js —— v5 id 命名规范（P0 冻结，之后不再改）
 *
 *   unit     rj-math-g3-up-u01
 *   lesson   rj-math-g3-up-u01-l02
 *   knowledge rj-math-g3-up-u01-l02-k03
 *   题        rj-math-g3-up-u01-l02-k03-s02-gen / -static-01
 *
 * v4 的 ma-u01-k1 等短 id 作为【永久别名】保留：本文件只提供
 * 规范 id 构造 + 别名映射生成，不重写存量数据；掌握度真实重映射
 * 由 mastery.migrateKnowledgeId 按册执行，并须先贴连续性证据。
 */

import { ID_NAMING } from './edition-profile.js';

export const ID_SPEC_VERSION = ID_NAMING.version;

const pad2 = (n) => String(n).padStart(2, '0');

export function volumeCodeOf({ grade, term }) {
  return `g${Number(grade)}-${term === '下册' ? 'down' : 'up'}`;
}

export function unitIdOf({ editionAbbr = 'rj', subject, grade, term }, unitNo) {
  return `${editionAbbr}-${subject}-${volumeCodeOf({ grade, term })}-u${pad2(unitNo)}`;
}

export function lessonIdOf(unitId, lessonNo) {
  return `${unitId}-l${pad2(lessonNo)}`;
}

export function knowledgeIdOf(unitId, lessonNo, no) {
  return `${lessonIdOf(unitId, lessonNo)}-k${pad2(no)}`;
}

export function questionIdOf(kid, specNo, kind = 'gen') {
  return `${kid}-s${pad2(specNo)}-${kind === 'static' ? 'static-01' : 'gen'}`;
}

/**
 * 由「已建册 + 单元数据」生成 legacy → canonical 映射。
 * 规则：unit 序号 = 该册内单元顺序；lesson 序号 = 单元内顺序；
 *       knowledge 序号 = 课内顺序。返回结构可直接喂给迁移工具。
 */
export function buildAliasMap(volumes) {
  const aliases = { units: {}, lessons: {}, knowledge: {} };
  for (const volume of volumes) {
    const units = Array.isArray(volume.units) ? volume.units : [];
    units.forEach((unit, ui) => {
      const canonicalUnit = unitIdOf(volume, ui + 1);
      aliases.units[unit.id] = canonicalUnit;
      (unit.lessons || []).forEach((lesson, li) => {
        const canonicalLesson = lessonIdOf(canonicalUnit, li + 1);
        aliases.lessons[lesson.id] = canonicalLesson;
        (lesson.knowledge || []).forEach((k, ki) => {
          aliases.knowledge[k.id] = knowledgeIdOf(canonicalUnit, li + 1, ki + 1);
        });
      });
    });
  }
  return aliases;
}

/** 校验别名表：1:1、无重复 canonical、无自映射；返回问题列表（空 = 通过） */
export function checkAliasMap(aliases) {
  const problems = [];
  for (const group of ['units', 'lessons', 'knowledge']) {
    const seen = new Map();
    for (const [from, to] of Object.entries(aliases[group] || {})) {
      if (!from || !to) problems.push(`${group}: 空 id`);
      else if (from === to) problems.push(`${group}: ${from} 自映射`);
      if (seen.has(to)) problems.push(`${group}: ${to} 被 ${seen.get(to)} 与 ${from} 重复映射`);
      else seen.set(to, from);
    }
  }
  return problems;
}
