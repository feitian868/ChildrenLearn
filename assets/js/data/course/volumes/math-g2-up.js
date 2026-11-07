/**
 * math-g2-up.js —— 数学 · 人教版 · 二年级上册（骨架册）
 *
 * 来源：v4 阶段 A 单册 course-map.js 的 ma-u01 / ma-u02，按单元自带的
 * metaGrade/metaTerm 拆进本册。单元 / 课 / 知识点 id 保持不变（v4 短 id
 * 作为永久别名，规范 id 见 course/id-spec.js），避免 P0 改写存量掌握度。
 */

const know = (id, name, prerequisites, difficulty, objectives, typicalErrors) => ({
  id, name, prerequisites, difficulty, objectives, typicalErrors
});

export const VOLUME = {
  edition: 'renjiao-newcurriculum',
  subject: 'math',
  grade: 2,
  term: '上册',
  units: [
    {
      id: 'ma-u01', name: '表内乘法（一）（二）', order: 1,
      metaGrade: 2, metaTerm: '上册',
      source: '人教版数学2年级上册 · 表内乘法（一）（二）',
      lessons: [{
        id: 'ma-u01-l1', name: '表内乘法', topic: '表内乘法',
        knowledge: [know('ma-u01-k1', '表内乘法', [], 1,
          ['熟记 1~9 的乘法口诀', '能根据口诀求积'],
          ['口诀混淆（如六七四十二记成六七四十八）', '乘数顺序颠倒后不会迁移'])]
      }]
    },
    {
      id: 'ma-u02', name: '表内乘法（二）', order: 2,
      metaGrade: 2, metaTerm: '上册',
      source: '人教版数学2年级上册 · 表内乘法（二）',
      lessons: [{
        id: 'ma-u02-l1', name: '乘加、乘减', topic: '乘加、乘减',
        knowledge: [know('ma-u02-k1', '乘加、乘减', ['ma-u01-k1'], 1,
          ['理解先乘后加减的运算顺序', '能把图形情境转成乘加/乘减算式'],
          ['从左往右算，先加后乘', '乘减时多减 1 个数'])]
      }]
    }
  ]
};
