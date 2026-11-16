/**
 * _shape-english.js —— 英语册数据组装小工具（P4 建包用，不参与运行期逻辑）
 *
 * 单元 → 1 课 → 3 个 kid；每个 kid 4 个 specId，由 specs-english.js 的 12 个外壳切成 1/5/9 三段。
 * 同一册内不同单元使用不同领域，避免同册内共用同一外壳。
 */

export const EN_FAMILY = {
  'en-letter': {
    label: '字母',
    difficulty: 1,
    specCount: 4,
    kids: ['字母认读', '大小写与顺序', '字母在单词中'],
    objectives: ['能认读 26 个字母的大小写', '能按字母表顺序说出前后字母', '能找到单词的开头与结尾字母'],
    typicalErrors: ['大小写混淆', '字母顺序颠倒', '首尾字母看错']
  },
  'en-word': {
    label: '词汇',
    difficulty: 1,
    specCount: 4,
    kids: ['词义理解', '词类归属', '词形语境'],
    objectives: ['能听懂并说出常用单词', '能按类别归纳单词', '能在语境中理解词义'],
    typicalErrors: ['中英词义对不上', '同类词混淆', '脱离语境猜词']
  },
  'en-spelling': {
    label: '拼写',
    difficulty: 2,
    specCount: 4,
    kids: ['字母顺序', '补全单词', '词形变化'],
    objectives: ['能认读单词首尾字母', '能补全缺字母的单词', '能写出常见词形变化'],
    typicalErrors: ['字母顺序颠倒', '漏写字母', '复数或动词形式写错']
  },
  'en-phonics': {
    label: '语音',
    difficulty: 2,
    specCount: 4,
    kids: ['首尾音', '音节押韵', '字母组合'],
    objectives: ['能听辨单词首尾音', '能数出音节并辨认押韵', '能认读常见字母组合'],
    typicalErrors: ['首音听错', '音节数数错', 'sh/ch/th 混淆']
  },
  'en-sentence': {
    label: '句子',
    difficulty: 2,
    specCount: 4,
    kids: ['句意理解', '补全句子', '语序标点'],
    objectives: ['能理解句子意思', '能补全常用句型', '能排列语序并正确使用标点'],
    typicalErrors: ['句意理解偏差', 'be 动词缺失', '语序颠倒']
  },
  'en-grammar': {
    label: '语法',
    difficulty: 3,
    specCount: 4,
    kids: ['be动词与代词', '时态与单复数', '介词与疑问词'],
    objectives: ['能正确使用 be 动词和代词', '能按语境选择时态和单复数', '能使用常用介词和疑问词'],
    typicalErrors: ['be 动词与人称不匹配', '第三人称单数漏 s', '时态混用']
  },
  'en-dialogue': {
    label: '交际',
    difficulty: 2,
    specCount: 4,
    kids: ['问候应答', '信息询问', '礼貌用语'],
    objectives: ['能用英语问候和告别', '能询问姓名、年龄、颜色、时间等信息', '能在情景中使用礼貌用语'],
    typicalErrors: ['问句答句不匹配', '称呼与场景不合', '礼貌用语缺失']
  }
};

const specListOf = (id, count) => Array.from({ length: count }, (_, i) => `${id}-s${String(i + 1).padStart(2, '0')}`);

/** 单元：1 课 1 组知识点；family 决定 3 个 kid 的领域与外壳段 */
export const unitEn = (id, name, order, grade, term, family) => {
  const meta = EN_FAMILY[family];
  if (!meta) throw new Error(`未知英语领域：${family}`);
  const kidCount = meta.kids.length;
  // 每个家族固定 12 个外壳：3 kid → 每人 4 段（1/5/9）。
  const perKid = Math.max(3, Math.floor(12 / kidCount));
  const knowledge = meta.kids.map((kidName, i) => {
    const kidId = `${id}-k${i + 1}`;
    return {
      id: kidId,
      name: `${meta.label}·${kidName}`,
      prerequisites: [],
      difficulty: grade <= 2 ? Math.min(2, meta.difficulty) : meta.difficulty,
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
    source: name,
    lessons: [{
      id: `${id}-l01`,
      name: `${name}基础`,
      topic: name,
      knowledge
    }]
  };
};

export const volumeEn = (grade, term, track, units, sourceLabel) => ({
  edition: 'renjiao-newcurriculum',
  subject: 'english',
  grade,
  term,
  track,
  sourceLabel,
  units
});
