/**
 * _shape-chinese.js —— 语文册数据组装小工具（P3 建包用，不参与运行期逻辑）
 *
 * 单元 → 1 课 → 3 个 kid；每个 kid 4 个 specId，由 specs-chinese.js 的 12 个外壳切成 1/5/9 三段。
 * 同一单元内 3 个 kid 使用同一领域的不同外壳段（specOffset 1/5/9），
 * 不同单元使用不同领域，避免同册内共用同一外壳。
 */

export const ZH_FAMILY = {
  'zh-sound': {
    label: '字音',
    difficulty: 2,
    specCount: 4,
    kids: ['读音选择', '字音判断', '同音辨析'],
    objectives: ['能借助拼音读准字音', '能辨别形近音近的字', '能在词语中读准多音字'],
    typicalErrors: ['前后鼻音混淆', '平翘舌不分', '多音字读错语境']
  },
  'zh-pinyin': {
    label: '汉语拼音',
    difficulty: 1,
    specCount: 4,
    kids: ['声母韵母', '声调音节', '拼读规则'],
    objectives: ['能认读声母、韵母和整体认读音节', '能正确拼读带调音节', '掌握 ü 与 j q x 的拼写规则'],
    typicalErrors: ['声调标错位置', 'j q x 后误写 u', '整体认读音节拆开拼']
  },
  'zh-shape': {
    label: '字形',
    difficulty: 2,
    specCount: 4,
    kids: ['偏旁部首', '笔画笔顺', '字形结构'],
    objectives: ['能说出常见偏旁名称', '能按笔顺书写生字', '能分辨独体字与合体字'],
    typicalErrors: ['偏旁名称说错', '笔顺颠倒', '形近字混写']
  },
  'zh-word': {
    label: '词语',
    difficulty: 2,
    specCount: 4,
    kids: ['组词搭配', '词义理解', '近反义词'],
    objectives: ['能正确搭配词语', '能理解词语在句中的意思', '能找出近义词和反义词'],
    typicalErrors: ['量词误用', '搭配不当', '近反义词混淆']
  },
  'zh-poem': {
    label: '古诗',
    difficulty: 2,
    specCount: 4,
    kids: ['诗句接续', '作者题目', '诗意理解', '名句积累'],
    objectives: ['能背诵教材古诗', '能说出作者与题目', '能理解诗句大意'],
    typicalErrors: ['上下句错接', '作者张冠李戴', '诗意理解偏差']
  },
  'zh-sentence': {
    label: '句子',
    difficulty: 2,
    specCount: 4,
    kids: ['标点句序', '句式补全', '修辞病句'],
    objectives: ['能正确使用常用标点', '能把句子排列通顺', '能识别常见修辞和病句'],
    typicalErrors: ['问号感叹号误用', '句序颠倒', '关联词搭配不当']
  },
  'zh-reading': {
    label: '阅读',
    difficulty: 2,
    specCount: 4,
    kids: ['细节推断', '主旨人物', '环境写法', '过渡表达'],
    objectives: ['能提取文中关键信息', '能作出简单推断', '能概括主要内容'],
    typicalErrors: ['脱离原文推断', '主旨与细节混淆', '人物品质概括不准']
  },
  'zh-classical': {
    label: '文言',
    difficulty: 3,
    specCount: 4,
    kids: ['实词理解', '句意翻译', '出处启示', '文言句式'],
    objectives: ['能理解常见文言实词', '能说出文言句子的意思', '能从中获得启示'],
    typicalErrors: ['古今义混淆', '逐字硬译', '启示脱离原文']
  },
  'zh-idiom': {
    label: '成语',
    difficulty: 2,
    specCount: 4,
    kids: ['成语补字', '成语释义', '情境运用', '近义辨析'],
    objectives: ['能正确书写常用成语', '能理解成语意思', '能在语境中使用成语'],
    typicalErrors: ['同音字误写', '望文生义', '语境使用不当']
  }
};

const specListOf = (id, count) => Array.from({ length: count }, (_, i) => `${id}-s${String(i + 1).padStart(2, '0')}`);

/** 单元：1 课 1 组知识点；family 决定 3 个 kid 的领域与外壳段 */
export const unitZh = (id, name, order, grade, term, family) => {
  const meta = ZH_FAMILY[family];
  if (!meta) throw new Error(`未知语文领域：${family}`);
  const source = `统编版语文${grade}年级${term} · ${name}`;
  const kidCount = meta.kids.length;
  // 每个家族固定 12 个外壳：3 kid → 每人 4 段（1/5/9），4 kid → 每人 3 段（1/4/7/10）。
  const perKid = Math.max(3, Math.floor(12 / kidCount));
  const knowledge = meta.kids.map((kidName, i) => {
    const kidId = `${id}-k${i + 1}`;
    return {
      id: kidId,
      name: `${meta.label}·${kidName}`,
      prerequisites: [],
      difficulty: meta.difficulty,
      objectives: meta.objectives,
      typicalErrors: meta.typicalErrors,
      specDomain: family,
      specParams: {
        grade,
        term,
        unit: name,
        kidIndex: i,
        specCount: perKid,
        specOffset: i * perKid + 1
      },
      specIds: specListOf(kidId, perKid)
    };
  });
  return {
    id,
    name,
    order,
    metaGrade: grade,
    metaTerm: term,
    source,
    lessons: [{
      id: `${id}-l01`,
      name: `${name}基础`,
      topic: name,
      knowledge
    }]
  };
};

export const volumeZh = (grade, term, units) => ({
  edition: 'renjiao-newcurriculum',
  subject: 'chinese',
  grade,
  term,
  units
});
