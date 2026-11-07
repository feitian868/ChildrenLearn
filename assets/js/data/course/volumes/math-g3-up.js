/**
 * math-g3-up.js —— 数学 · 人教版 · 三年级上册（骨架册）
 * 来源：v4 单册 course-map.js 的 ma-u04 ~ ma-u12，按 metaGrade/metaTerm 拆出。
 * 单元 / 课 / 知识点 id 保持不变（v4 短 id 作为永久别名）。
 */

const know = (id, name, prerequisites, difficulty, objectives, typicalErrors) => ({
  id, name, prerequisites, difficulty, objectives, typicalErrors
});

export const VOLUME = {
  edition: 'renjiao-newcurriculum',
  subject: 'math',
  grade: 3,
  term: '上册',
  units: [
    {
      id: 'ma-u04', name: '长度单位', order: 4,
      metaGrade: 3, metaTerm: '上册',
      source: '人教版数学3年级上册 · 长度单位',
      lessons: [{
        id: 'ma-u04-l1', name: '长度单位换算', topic: '长度单位换算',
        knowledge: [know('ma-u04-k1', '长度单位换算', [], 1,
          ['认识毫米、厘米、分米、米、千米', '能进行相邻单位换算'],
          ['单位进率记错（把 1 米当 100 毫米）', '换算方向反了（大化小时用除法）'])]
      }]
    },
    {
      id: 'ma-u05', name: '测量', order: 5,
      metaGrade: 3, metaTerm: '上册',
      source: '人教版数学3年级上册 · 测量',
      lessons: [{
        id: 'ma-u05-l1', name: '质量单位换算', topic: '质量单位换算',
        knowledge: [know('ma-u05-k1', '质量单位换算', ['ma-u04-k1'], 1,
          ['认识克、千克、吨', '能进行质量单位换算'],
          ['克与千克进率记成 100', '吨与千克混淆'])]
      }]
    },
    {
      id: 'ma-u06', name: '万以内的加法和减法（一）', order: 6,
      metaGrade: 3, metaTerm: '上册',
      source: '人教版数学3年级上册 · 万以内的加法和减法（一）',
      lessons: [{
        id: 'ma-u06-l1', name: '找规律', topic: '找规律',
        knowledge: [know('ma-u06-k1', '找规律', ['ma-u03-k1'], 1,
          ['能观察数列相邻两项的差', '会用规律补出后面的数'],
          ['只看一个数就猜规律', '差在变大/变小时仍按等差处理'])]
      }]
    },
    {
      id: 'ma-u07', name: '万以内数的认识', order: 7,
      metaGrade: 3, metaTerm: '上册',
      source: '人教版数学3年级上册 · 万以内数的认识',
      lessons: [{
        id: 'ma-u07-l1', name: '数的大小比较', topic: '数的大小比较',
        knowledge: [know('ma-u07-k1', '数的大小比较', ['ma-u06-k1'], 1,
          ['会比较万以内数的大小', '能按位数与高位顺序比较'],
          ['位数不同时仍从个位比起', '最高位相同后不继续比下一位'])]
      }]
    },
    {
      id: 'ma-u08', name: '万以内的加法和减法（二）', order: 8,
      metaGrade: 3, metaTerm: '上册',
      source: '人教版数学3年级上册 · 万以内的加法和减法（二）',
      lessons: [
        {
          id: 'ma-u08-l1', name: '万以内的加法', topic: '万以内的加法',
          knowledge: [know('ma-u08-k1', '万以内的加法', ['ma-u07-k1'], 2,
            ['掌握三位数加三位数的进位加法', '能正确处理连续进位'],
            ['进位后忘记加 1', '数位没有对齐'])]
        },
        {
          id: 'ma-u08-l2', name: '万以内的减法', topic: '万以内的减法',
          knowledge: [know('ma-u08-k2', '万以内的减法', ['ma-u08-k1'], 2,
            ['掌握三位数减三位数的退位减法', '能处理隔位退位'],
            ['退位后十位忘记减 1', '被减数中间有 0 时不会连续退位'])]
        },
        {
          id: 'ma-u08-l3', name: '加减混合运算', topic: '加减混合运算',
          knowledge: [know('ma-u08-k3', '加减混合运算', ['ma-u08-k1', 'ma-u08-k2'], 2,
            ['按从左到右的顺序计算加减混合', '会用竖式验算'],
            ['先算后面的减法再看前面的加法', '验算时加减关系用反'])]
        }
      ]
    },
    {
      id: 'ma-u09', name: '万以内的加法和减法', order: 9,
      metaGrade: 3, metaTerm: '上册',
      source: '人教版数学3年级上册 · 万以内的加法和减法',
      lessons: [
        {
          id: 'ma-u09-l1', name: '万以内的加法', topic: '万以内的加法',
          knowledge: [know('ma-u09-k1', '万以内的加法（估算）', ['ma-u08-k3'], 2,
            ['会用估算判断结果是否合理', '能把三位数近似成整百整十'],
            ['估算时把两个数都往大取', '估算结果与精确结果差太多仍照抄'])]
        },
        {
          id: 'ma-u09-l2', name: '万以内的减法', topic: '万以内的减法',
          knowledge: [know('ma-u09-k2', '万以内的减法（估算）', ['ma-u09-k1'], 2,
            ['会用估算检验减法结果', '能说明估算与精确计算的差异'],
            ['看到「大约」仍精确计算', '把减数估大后结论方向弄反'])]
        }
      ]
    },
    {
      id: 'ma-u10', name: '多位数乘一位数', order: 10,
      metaGrade: 3, metaTerm: '上册',
      source: '人教版数学3年级上册 · 多位数乘一位数',
      lessons: [
        {
          id: 'ma-u10-l1', name: '多位数乘一位数', topic: '多位数乘一位数',
          knowledge: [know('ma-u10-k1', '多位数乘一位数', ['ma-u02-k1'], 2,
            ['掌握两位数、三位数乘一位数的竖式', '能处理进位'],
            ['进位加到下一位时漏加', '因数中间有 0 时直接跳过'])]
        },
        {
          id: 'ma-u10-l2', name: '乘法应用题', topic: '乘法应用题',
          knowledge: [know('ma-u10-k2', '乘法应用题', ['ma-u10-k1'], 2,
            ['能从「每份数 × 份数」识别乘法模型', '会写单位和答句'],
            ['把「多几个」当成倍数关系', '求总数时漏乘最后一份'])]
        }
      ]
    },
    {
      id: 'ma-u11', name: '四则运算', order: 11,
      metaGrade: 3, metaTerm: '上册',
      source: '人教版数学3年级上册 · 四则运算',
      lessons: [{
        id: 'ma-u11-l1', name: '四则混合运算', topic: '四则混合运算',
        knowledge: [know('ma-u11-k1', '四则混合运算', ['ma-u10-k2'], 2,
          ['掌握「先乘除后加减」的运算顺序', '有括号时先算括号内'],
          ['一律从左往右算', '括号前是减号时去括号不变号'])]
      }]
    },
    {
      id: 'ma-u12', name: '长方形和正方形', order: 12,
      metaGrade: 3, metaTerm: '上册',
      source: '人教版数学3年级上册 · 长方形和正方形',
      lessons: [{
        id: 'ma-u12-l1', name: '长方形的周长', topic: '长方形的周长',
        knowledge: [know('ma-u12-k1', '长方形的周长', ['ma-u05-k1'], 2,
          ['理解周长是四条边的总长', '会用（长+宽）×2 计算'],
          ['只算长+宽忘记×2', '周长与面积公式混用'])]
      }]
    }
  ]
};
