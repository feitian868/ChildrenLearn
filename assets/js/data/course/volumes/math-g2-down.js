/**
 * math-g2-down.js —— 数学 · 人教版 · 二年级下册（骨架册）
 * 来源：v4 单册 course-map.js 的 ma-u03，按 metaGrade/metaTerm 拆出。
 */

const know = (id, name, prerequisites, difficulty, objectives, typicalErrors) => ({
  id, name, prerequisites, difficulty, objectives, typicalErrors
});

export const VOLUME = {
  edition: 'renjiao-newcurriculum',
  subject: 'math',
  grade: 2,
  term: '下册',
  units: [
    {
      id: 'ma-u03', name: '有余数的除法', order: 3,
      metaGrade: 2, metaTerm: '下册',
      source: '人教版数学2年级下册 · 有余数的除法',
      lessons: [{
        id: 'ma-u03-l1', name: '有余数的除法', topic: '有余数的除法',
        knowledge: [know('ma-u03-k1', '有余数的除法', ['ma-u01-k1'], 1,
          ['理解余数必须比除数小', '会用竖式求商和余数'],
          ['余数大于或等于除数', '商少算 1，余数多一个除数'])]
      }]
    }
  ]
};
