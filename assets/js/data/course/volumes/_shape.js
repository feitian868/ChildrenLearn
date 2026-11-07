/**
 * _shape.js —— 新册数据组装小工具（P2 建包用，不参与运行期逻辑）
 */

const specListOf = (id) => [`${id}-s01`, `${id}-s02`, `${id}-s03`];

/** 知识点：difficulty 1~4；specDomain + specParams 决定 3 种问法 */
export const know = (id, name, difficulty, specDomain, specParams, objectives, typicalErrors, prerequisites = []) => ({
  id,
  name,
  prerequisites,
  difficulty,
  objectives,
  typicalErrors,
  specDomain,
  specParams,
  specIds: specListOf(id)
});

/** 单元：1 课 1 知识点组（课时名取单元名 + 基础）；topic 缺省取单元名，
 *  存量单元可用第 7 参数保留 v4 的 lesson topic，避免旧题 source||topic 索引断裂 */
export const unit = (id, name, order, grade, term, knowledge, topic = name) => ({
  id,
  name,
  order,
  metaGrade: grade,
  metaTerm: term,
  source: `人教版数学${grade}年级${term} · ${name}`,
  lessons: [{
    id: `${id}-l1`,
    name: `${name}基础`,
    topic,
    knowledge
  }]
});

export const volume = (grade, term, units) => ({
  edition: 'renjiao-newcurriculum',
  subject: 'math',
  grade,
  term,
  units
});
