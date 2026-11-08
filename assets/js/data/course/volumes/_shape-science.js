/**
 * _shape-science.js —— 科学册数据组装（P5 建包用，不参与运行期逻辑）
 *
 * 与语文/英语不同，科学每个单元按「3 个不同领域」组 3 个知识点：
 *   aspects 用 `family@段` 表达，段 1/2/3 对应家族内 4 个外壳的一段（offset 1/5/9）。
 * 同一册内 (family, 段) 必须唯一 —— 保证同册不同 kid 不共用外壳。
 */

export const SC_FAMILY = {
  'sc-life': {
    label: '生命世界',
    difficulty: 2,
    specCount: 4,
    kids: ['分类与特征', '生长与繁殖', '人体与健康'],
    objectives: ['能按特征给动植物分类', '能说出繁殖与生长的主要阶段', '了解人体主要器官与健康习惯'],
    typicalErrors: ['把动物类别混淆', '生长顺序颠倒', '把有害微生物当成有益']
  },
  'sc-env': {
    label: '生物与环境',
    difficulty: 2,
    specCount: 4,
    kids: ['食物链与依存', '栖息与适应', '人类与环境'],
    objectives: ['能说出食物链中的取食关系', '能举例说明生物适应环境的方式', '能判断人类活动对环境的影响'],
    typicalErrors: ['食物链箭头方向写反', '把适应现象解释成偶然', '把环保做法与污染行为混淆']
  },
  'sc-matter': {
    label: '物质科学',
    difficulty: 2,
    specCount: 4,
    kids: ['材料性质', '状态与变化', '混合与用途'],
    objectives: ['能描述常见材料的性质', '能判断物态与变化类型', '能选择合适的方法分离混合物'],
    typicalErrors: ['把溶解与浮沉混淆', '把物理变化说成化学变化', '分离方法选错']
  },
  'sc-force': {
    label: '力与能量',
    difficulty: 2,
    specCount: 4,
    kids: ['力与运动', '电磁声光', '能量转换'],
    objectives: ['能识别生活中常见的力', '能判断简单电路、磁极与声光现象', '能说出常见能量转换'],
    typicalErrors: ['同极异极判断相反', '把绝缘体当成导体', '能量转化方向说反']
  },
  'sc-earth': {
    label: '地球与宇宙',
    difficulty: 2,
    specCount: 4,
    kids: ['天气与水', '地球与地表', '宇宙与资源'],
    objectives: ['能使用天气观测工具', '能说出水循环与地表变化', '能区分可再生与不可再生资源'],
    typicalErrors: ['昼夜与四季成因混淆', '把月球当成光源', '资源分类混淆']
  },
  'sc-inquiry': {
    label: '科学探究',
    difficulty: 3,
    specCount: 4,
    kids: ['观察与测量', '实验与变量', '安全与记录'],
    objectives: ['能选择合适的观察与测量工具', '能找出对比实验中的变量', '能根据现象作出合理解释'],
    typicalErrors: ['变量与常量混淆', '只做一次实验就下结论', '实验安全操作不规范']
  },
  'sc-tech': {
    label: '技术与工程',
    difficulty: 3,
    specCount: 4,
    kids: ['结构与原理', '设计与制作', '技术与社会'],
    objectives: ['能说出常见作品的工作原理', '能按合理顺序完成设计与制作', '能说明技术对生活的影响'],
    typicalErrors: ['制作顺序颠倒', '结构与功能不匹配', '忽视材料特点']
  }
};

const SPEC_PER_KID = 4;
const CN = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];

const specListOf = (id, count) => Array.from({ length: count }, (_, i) => `${id}-s${String(i + 1).padStart(2, '0')}`);

/**
 * 单元：3 个知识点，每个用 `family@段` 指定领域和外壳段。
 * 例：unitSc(..., ['sc-life@3', 'sc-force@2', 'sc-inquiry@1'])
 */
export const unitSc = (id, rawName, order, grade, term, aspects) => {
  if (!Array.isArray(aspects) || aspects.length !== 3) {
    throw new Error(`科学单元 ${id} 需要 3 个 aspects`);
  }
  const uNo = String(id).slice(-2);
  const idx = Number(uNo) - 1;
  const name = `第${CN[idx] || idx + 1}单元 ${rawName}`;
  // 科学为 P5 新建科目：册内 id 用短名（sc-g1-up-u01），规范 id（rj-science-...）由别名表生成，
  // 与数学 ma-u01 / 语文等旧册同一口径，避免别名表出现「自映射」。
  const legacyId = `sc-g${grade}-${term === '上册' ? 'up' : 'down'}-u${uNo}`;
  const knowledge = aspects.map((aspect, i) => {
    const m = /^([a-z-]+)@([123])$/.exec(aspect);
    if (!m) throw new Error(`科学单元 ${id} 的 aspect 格式应为 family@1|2|3，收到 ${aspect}`);
    const family = m[1];
    const seg = Number(m[2]);
    const meta = SC_FAMILY[family];
    if (!meta) throw new Error(`未知科学领域：${family}`);
    const kidId = `${legacyId}-k${i + 1}`;
    return {
      id: kidId,
      name: `${meta.label}·${meta.kids[seg - 1] || meta.kids[0]}`,
      prerequisites: [],
      difficulty: meta.difficulty,
      objectives: meta.objectives,
      typicalErrors: meta.typicalErrors,
      specDomain: family,
      specParams: {
        grade,
        term,
        unit: rawName,
        kidIndex: i,
        specCount: SPEC_PER_KID,
        specOffset: (seg - 1) * SPEC_PER_KID + 1
      },
      specIds: specListOf(kidId, SPEC_PER_KID)
    };
  });
  return {
    id: legacyId,
    name,
    order,
    metaGrade: grade,
    metaTerm: term,
    source: `人教/鄂教科学${grade}年级${term} · ${name}`,
    lessons: [{
      id: `${legacyId}-l01`,
      name: `${rawName}基础`,
      topic: rawName,
      knowledge
    }]
  };
};

/** 册：校验同册 (family, 段) 唯一，防止同册不同 kid 共用外壳 */
export const volumeSc = (grade, term, units) => {
  const seen = new Set();
  for (const unit of units) {
    for (const kid of unit.lessons[0].knowledge) {
      const key = `${kid.specDomain}@${kid.specParams.specOffset}`;
      if (seen.has(key)) throw new Error(`科学 ${grade}${term} 册内外壳重复：${key}（单元 ${unit.id}）`);
      seen.add(key);
    }
  }
  return { edition: 'renjiao-newcurriculum', subject: 'science', grade, term, units };
};
