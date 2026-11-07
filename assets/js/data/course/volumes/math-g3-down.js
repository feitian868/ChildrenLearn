/**
 * math-g3-down.js —— 数学 · 人教版 · 三年级下册（骨架册）
 * 来源：v4 单册 course-map.js 的 ma-u13 / ma-u14，按 metaGrade/metaTerm 拆出。
 */

const know = (id, name, prerequisites, difficulty, objectives, typicalErrors) => ({
  id, name, prerequisites, difficulty, objectives, typicalErrors
});

export const VOLUME = {
  edition: 'renjiao-newcurriculum',
  subject: 'math',
  grade: 3,
  term: '下册',
  units: [
    {
      id: 'ma-u13', name: '面积', order: 13,
      metaGrade: 3, metaTerm: '下册',
      source: '人教版数学3年级下册 · 面积',
      lessons: [{
        id: 'ma-u13-l1', name: '长方形的面积', topic: '长方形的面积',
        knowledge: [know('ma-u13-k1', '长方形的面积', ['ma-u12-k1'], 2,
          ['理解面积是面的大小', '会用长×宽计算面积并带单位'],
          ['面积单位写成厘米', '长与宽单位不统一就直接相乘'])]
      }]
    },
    {
      id: 'ma-u14', name: '除数是一位数的除法', order: 14,
      metaGrade: 3, metaTerm: '下册',
      source: '人教版数学3年级下册 · 除数是一位数的除法',
      lessons: [{
        id: 'ma-u14-l1', name: '除数是一位数的除法', topic: '除数是一位数的除法',
        knowledge: [know('ma-u14-k1', '除数是一位数的除法', ['ma-u13-k1'], 2,
          ['掌握三位数除以一位数的竖式', '会处理商中间或末尾有 0'],
          ['商中间漏写 0', '余数没有落下继续除'])]
      }]
    }
  ]
};
