/**
 * specs-chinese-modes-text.js —— 语文「句子 / 古诗 / 阅读 / 文言 / 成语」五族问法外壳
 *
 * 与 basic 同样的约束：每族 12 个语义不同外壳；题面带单元标签；
 * 句子/阅读用组合素材按规则生成，答案由生成规则决定，不靠随机猜。
 */

import { pick, shuffle, randInt } from '../../core/rng.js';
import { poemsForGrade, CLASSICAL_POOL, IDIOM_POOL, SN } from './specs-chinese-data.js';
import { choiceOf } from './specs-chinese-modes-basic.js';

const withTag = (tag, text) => `【${tag}】${text}`;
const wrongsOf = (pool, key, correct) => pool.map((x) => x[key]).filter((v) => v !== correct);
const SEASONS = ['春', '夏', '秋', '冬'];
const DYNASTIES = ['唐', '宋', '清', '元'];

/* ---------- 句子：组合素材与规则 ---------- */
/* 动宾搭配表：只生成「动词 + 宾语」合法的组合，避免“读了书包”这类语病 */
const VERB_OBJ = [
  ['吃', '苹果'], ['吃', '香蕉'], ['读', '课文'], ['读', '课本'],
  ['写', '作业'], ['写', '生字'], ['拿', '书包'], ['拿', '铅笔'],
  ['整理', '书包'], ['收好', '玩具'], ['擦', '黑板'], ['关', '窗户'],
  ['搬', '桌子'], ['扫', '教室'], ['洗', '衣服'], ['浇', '花']
];
/* 地点 + 动作 + 形容词搭配：同一个地点只取语义相容的词，避免“在花园里打扫教室” */
const PLACE_VERBS = [
  { p: '教室里', v: ['读书', '写字', '听讲'], adj: ['干净', '安静', '明亮'], bad: ['钓鱼', '游泳', '放风筝'] },
  { p: '操场上', v: ['跑步', '做操', '做游戏'], adj: ['干净', '热闹'], bad: ['做笔记', '听讲', '整理书包'] },
  { p: '公园里', v: ['画画', '唱歌', '散步'], adj: ['美丽', '热闹', '安静'], bad: ['听讲', '做笔记', '整理书包'] },
  { p: '家里', v: ['扫地', '浇花', '整理书包'], adj: ['干净', '安静', '热闹'], bad: ['做操', '放风筝', '钓鱼'] },
  { p: '图书馆里', v: ['看书', '读书', '做笔记'], adj: ['安静', '干净', '明亮'], bad: ['跑步', '游泳', '做操'] },
  { p: '小河边', v: ['钓鱼', '散步', '看风景'], adj: ['美丽', '安静'], bad: ['听讲', '做笔记', '整理书包'] },
  { p: '花园里', v: ['浇花', '赏花', '唱歌'], adj: ['美丽', '热闹'], bad: ['听讲', '做笔记', '做操'] },
  { p: '院子里', v: ['扫地', '浇花', '做游戏'], adj: ['干净', '安静', '热闹'], bad: ['听讲', '做笔记', '游泳'] }
];
/* 关联词例句生成器：每类关系用「主语 + 规范搭配」组合，既有变化又不产生语病 */
const CONJ_BUILDERS = [
  (rand) => { const s = pick(rand, SN.subj); return { a: `${s}生病了`, b: `${s}没来上学`, pair: '因为……所以……' }; },
  (rand) => { const s = pick(rand, SN.subj); return { a: `${s}认真复习`, b: `${s}取得了好成绩`, pair: '因为……所以……' }; },
  (rand) => { const s = pick(rand, SN.subj); return { a: '下雨了', b: `${s}不去公园`, pair: '因为……所以……' }; },
  (rand) => { const s = pick(rand, SN.subj); return { a: `${s}跑得快`, b: `${s}得了第一名`, pair: '因为……所以……' }; },
  (rand) => {
    const s = pick(rand, SN.subj);
    const v = pick(rand, ['坚持跑步', '认真学习', '按时到校', '帮助同学']);
    return { a: `${s}很累`, b: `${s}仍然${v}`, pair: '虽然……但是……' };
  },
  (rand) => {
    const s = pick(rand, SN.subj);
    const v = pick(rand, ['坚持跑步', '认真学习', '按时到校', '帮助同学']);
    return { a: `${s}年纪小`, b: `${s}仍然${v}`, pair: '虽然……但是……' };
  },
  (rand) => {
    const s = pick(rand, SN.subj);
    const v = pick(rand, ['坚持跑步', '认真学习', '按时到校', '帮助同学']);
    return { a: `${s}遇到困难`, b: `${s}仍然${v}`, pair: '虽然……但是……' };
  },
  (rand) => {
    const s = pick(rand, SN.subj);
    const v = pick(rand, ['坚持跑步', '认真学习', '按时到校', '帮助同学']);
    return { a: `${s}很忙`, b: `${s}仍然${v}`, pair: '虽然……但是……' };
  },
  (rand) => { const s = pick(rand, SN.subj); return { a: '明天下雨', b: `${s}就不去公园`, pair: '如果……就……' }; },
  (rand) => { const s = pick(rand, SN.subj); return { a: `${s}早点完成作业`, b: `${s}就能看动画片`, pair: '如果……就……' }; },
  (rand) => { const s = pick(rand, SN.subj); return { a: `${s}坚持锻炼`, b: `${s}的身体就会更好`, pair: '如果……就……' }; },
  (rand) => { const s = pick(rand, SN.subj); return { a: `${s}认真听讲`, b: `${s}就能学会新知识`, pair: '如果……就……' }; },
  (rand) => {
    const s = pick(rand, SN.subj);
    const [v1, v2] = pick(rand, [['唱歌', '跳舞'], ['画画', '弹琴'], ['跳绳', '游泳'], ['下棋', '打球'], ['读书', '写字'], ['扫地', '浇花']]);
    return { a: `${s}会${v1}`, b: `${s}还会${v2}`, pair: '不但……而且……' };
  },
  (rand) => { const s = pick(rand, SN.subj); return { a: `${s}学习好`, b: `${s}乐于助人`, pair: '不但……而且……' }; }
];
const METAPHORS = [
  ['弯弯的月亮', '小船'], ['圆圆的太阳', '火球'], ['白白的云朵', '棉花'], ['亮亮的星星', '眼睛'],
  ['绿绿的荷叶', '小伞'], ['细细的雨丝', '牛毛'], ['红红的苹果', '小灯笼'], ['长长的小河', '丝带'],
  ['圆圆的西瓜', '皮球'], ['高高的白杨', '卫士'], ['弯弯的柳条', '长发'], ['小小的露珠', '珍珠'],
  ['红红的枫叶', '手掌'], ['白白的雪花', '鹅毛'], ['圆圆的蘑菇', '小伞'], ['青青的草地', '绿毯'],
  ['亮亮的露珠', '宝石'], ['弯弯的小路', '彩带'], ['白白的棉花', '雪球'], ['圆圆的月亮', '玉盘']
];
const PERSONIFY = ['小鸟在枝头唱歌。', '花朵在风中点头。', '小溪在山间奔跑。', '云朵在天上散步。',
  '柳条在河边跳舞。', '星星在夜空眨眼睛。', '小草在雨中洗澡。', '太阳从云里探出头。',
  '蜜蜂在花丛里唱歌。', '蝴蝶在草地上跳舞。', '风儿在树林里散步。', '雨点在屋顶上敲鼓。',
  '青蛙在荷叶上唱歌。', '松鼠在树枝上聊天。', '月亮在夜空中微笑。', '蒲公英在风中旅行。',
  '向日葵朝着太阳招手。', '露珠在叶尖上打滚。', '燕子在空中跳舞。', '小溪在山谷里唱歌。'];
const EXAGGERATE = ['嗓门大得能把屋顶掀翻', '跑得快得像一阵风', '饿得能吃下一头牛', '高兴得一蹦三尺高'];

const sentOf = (rand) => {
  const t = pick(rand, SN.thing);
  const pv = pick(rand, PLACE_VERBS);
  return {
    s: pick(rand, SN.subj),
    s2: pick(rand, SN.subj),
    pv,
    v: pick(rand, pv.v),
    p: pv.p,
    a: pick(rand, SN.adj),
    a2: pick(rand, pv.adj),
    t,
    t2: pick(rand, SN.thing.filter((x) => x !== t))
  };
};

const PUNCT_MODES = [
  { p: '。', make: (x) => `${x.s}在${x.p}${x.v}` },
  { p: '？', make: (x) => `${x.s}在${x.p}${x.v}吗` },
  { p: '！', make: (x) => `${x.p}真${x.a2}啊` }
];

/* ============================================================
   zh-sentence · 句子（12 外壳）
   ============================================================ */
export const ZH_SENTENCE_MODES = [
  {
    ask: 'zh-sentence-punct', make(rand, ctx) {
      const x = sentOf(rand);
      const m = pick(rand, PUNCT_MODES);
      return { prompt: withTag(ctx.tag, `“${m.make(x)}（　）”末尾应填什么标点？`), ...choiceOf(rand, m.p, ['。', '？', '！'].filter((p) => p !== m.p)), explain: `这句话应填“${m.p}”。` };
    }
  },
  {
    ask: 'zh-sentence-order', make(rand, ctx) {
      const x = sentOf(rand);
      const right = `${x.s}在${x.p}${x.v}。`;
      const parts = [x.s, x.p, x.v];
      const wrongs = [
        `${x.p}在${x.s}${x.v}。`,
        `${x.v}在${x.s}${x.p}。`,
        `${x.s}${x.v}在${x.p}。`
      ];
      const shown = shuffle(rand, parts);
      return { prompt: withTag(ctx.tag, `把“${shown[0]}”“${shown[1]}”“${shown[2]}”排成一句通顺的话，正确的是？`), ...choiceOf(rand, right, wrongs), explain: `通顺的顺序是：${right}` };
    }
  },
  {
    ask: 'zh-sentence-complete', make(rand, ctx) {
      const x = sentOf(rand);
      const pv = x.pv;
      const v = x.v;
      return { prompt: withTag(ctx.tag, `“${x.s}在${pv.p}（　）。”括号里填什么最合适？`), ...choiceOf(rand, v, pv.bad), explain: `填“${v}”后句子通顺：${x.s}在${pv.p}${v}。` };
    }
  },
  {
    ask: 'zh-sentence-rhetoric', make(rand, ctx) {
      const x = sentOf(rand);
      const kind = randInt(rand, 1, 4);
      const threeVerbs = shuffle(rand, SN.verb);
      const metaphor = pick(rand, METAPHORS);
      const text = kind === 1
        ? `${metaphor[0]}像${metaphor[1]}一样。`
        : kind === 2
          ? pick(rand, PERSONIFY)
          : kind === 3
            ? `有的在${threeVerbs[0]}，有的在${threeVerbs[1]}，有的在${threeVerbs[2]}。`
            : `${x.s}${pick(rand, EXAGGERATE)}。`;
      const name = ['比喻', '拟人', '排比', '夸张'][kind - 1];
      return { prompt: withTag(ctx.tag, `“${text}”用了哪种修辞手法？`), ...choiceOf(rand, name, ['比喻', '拟人', '排比', '夸张'].filter((n) => n !== name)), explain: `这句话用了${name}。` };
    }
  },
  {
    ask: 'zh-sentence-bad', make(rand, ctx) {
      const kind = randInt(rand, 1, 3);
      let text;
      let name;
      if (kind === 1) {
        const [v, o] = pick(rand, VERB_OBJ);
        text = `${v}了${o}。`;
        name = '缺少主语';
      } else if (kind === 2) {
        text = `${pick(rand, ['小明', '小红', '小华', '东东', '文文', '丁丁'])}大约 ${randInt(rand, 6, 12)} 岁左右。`;
        name = '重复啰嗦';
      } else {
        const pv = pick(rand, PLACE_VERBS);
        const v = pick(rand, pv.v);
        text = `${v}在${pv.p}${pick(rand, SN.subj)}。`;
        name = '词序颠倒';
      }
      return { prompt: withTag(ctx.tag, `“${text}”这句话的问题是？`), ...choiceOf(rand, name, ['缺少主语', '重复啰嗦', '词序颠倒', '没有毛病'].filter((n) => n !== name)), explain: `这句话的问题是${name}。` };
    }
  },
  {
    ask: 'zh-sentence-conj', make(rand, ctx) {
      const it = pick(rand, CONJ_BUILDERS)(rand);
      const pairs = ['因为……所以……', '虽然……但是……', '如果……就……', '不但……而且……'];
      return { prompt: withTag(ctx.tag, `“（　）${it.a}，（　）${it.b}。”应填哪组关联词？`), ...choiceOf(rand, it.pair, pairs.filter((p) => p !== it.pair)), explain: `这里应填“${it.pair}”。` };
    }
  },
  {
    ask: 'zh-sentence-ba', make(rand, ctx) {
      const s = pick(rand, SN.subj);
      const [v, o] = pick(rand, VERB_OBJ);
      const base = `${s}${v}了${o}。`;
      const right = `${s}把${o}${v}了。`;
      return { prompt: withTag(ctx.tag, `把“${base}”改成“把”字句，正确的是？`), ...choiceOf(rand, right, [`${o}把${s}${v}了。`, `${s}${v}把${o}了。`, `${s}被${o}${v}了。`]), explain: `“把”字句：${right}` };
    }
  },
  {
    ask: 'zh-sentence-bei', make(rand, ctx) {
      const s = pick(rand, SN.subj);
      const [v, o] = pick(rand, VERB_OBJ);
      const base = `${s}${v}了${o}。`;
      const right = `${o}被${s}${v}了。`;
      return { prompt: withTag(ctx.tag, `把“${base}”改成“被”字句，正确的是？`), ...choiceOf(rand, right, [`${s}被${o}${v}了。`, `${o}把${s}${v}了。`, `${o}${v}了${s}。`]), explain: `“被”字句：${right}` };
    }
  },
  {
    ask: 'zh-sentence-expand', make(rand, ctx) {
      const s = pick(rand, SN.subj);
      const pv = pick(rand, PLACE_VERBS);
      const v = pick(rand, pv.v);
      const base = `${s}${v}。`;
      const right = `${s}在${pv.p}${v}。`;
      return { prompt: withTag(ctx.tag, `把“${s}${v}”扩写，下面哪句更具体？`), ...choiceOf(rand, right, [base, `${s}在${pv.p}。`, `${s}。`]), explain: `加上地点后更具体：${right}` };
    }
  },
  {
    ask: 'zh-sentence-shrink', make(rand, ctx) {
      const s = pick(rand, SN.subj);
      const pv = pick(rand, PLACE_VERBS);
      const v = pick(rand, pv.v);
      const long = `${s}在${pv.p}${v}。`;
      const right = `${s}${v}。`;
      return { prompt: withTag(ctx.tag, `把“${s}在${pv.p}${v}”缩写成最简洁的句子，正确的是？`), ...choiceOf(rand, right, [`${s}在${pv.p}。`, `${pv.p}${v}。`, `${s}。`]), explain: `保留谁和做什么：${right}` };
    }
  },
  {
    ask: 'zh-sentence-kind', make(rand, ctx) {
      const x = sentOf(rand);
      const kind = randInt(rand, 1, 4);
      const pv = pick(rand, PLACE_VERBS);
      const pv2 = pick(rand, pv.v);
      const text = kind === 1 ? `${x.s}在${pv.p}${pv2}。` : kind === 2 ? `${x.s}在${pv.p}${pv2}吗？` : kind === 3 ? `${pv.p}真${pick(rand, pv.adj)}！` : '请把窗户关上。';
      const name = ['陈述句', '疑问句', '感叹句', '祈使句'][kind - 1];
      return { prompt: withTag(ctx.tag, `“${text}”是什么句式？`), ...choiceOf(rand, name, ['陈述句', '疑问句', '感叹句', '祈使句'].filter((n) => n !== name)), explain: `这是${name}。` };
    }
  },
  {
    ask: 'zh-sentence-conj-judge', make(rand, ctx) {
      const it = pick(rand, CONJ_BUILDERS)(rand);
      const truth = rand() < 0.5;
      const pairs = ['因为……所以……', '虽然……但是……', '如果……就……', '不但……而且……'];
      const shown = truth ? it.pair : pick(rand, pairs.filter((p) => p !== it.pair));
      return { prompt: withTag(ctx.tag, `“${it.a}，${it.b}。”用“${shown}”连接合适吗？`), type: 'judge', answer: truth, explain: truth ? `“${shown}”适合连接这两个分句。` : `这里应填“${it.pair}”，不是“${shown}”。` };
    }
  }
];

/* ============================================================
   zh-poem · 古诗（12 外壳）
   ============================================================ */
const poemPoolOf = (ctx) => poemsForGrade(ctx.grade);

export const ZH_POEM_MODES = [
  {
    ask: 'zh-poem-next', make(rand, ctx) {
      const it = pick(rand, poemPoolOf(ctx));
      return { prompt: withTag(ctx.tag, `“${it.l1}”的下一句是？`), ...choiceOf(rand, it.l2, wrongsOf(poemPoolOf(ctx), 'l2', it.l2)), explain: `《${it.t}》：${it.l1}${it.l2}` };
    }
  },
  {
    ask: 'zh-poem-author', make(rand, ctx) {
      const it = pick(rand, poemPoolOf(ctx));
      return { prompt: withTag(ctx.tag, `《${it.t}》的作者是？`), ...choiceOf(rand, it.a, wrongsOf(poemPoolOf(ctx), 'a', it.a)), explain: `《${it.t}》的作者是${it.a}。` };
    }
  },
  {
    ask: 'zh-poem-source', make(rand, ctx) {
      const it = pick(rand, poemPoolOf(ctx));
      return { prompt: withTag(ctx.tag, `“${it.l1}”出自哪首诗？`), ...choiceOf(rand, it.t, wrongsOf(poemPoolOf(ctx), 't', it.t)), explain: `“${it.l1}”出自《${it.t}》。` };
    }
  },
  {
    ask: 'zh-poem-meaning', make(rand, ctx) {
      const it = pick(rand, poemPoolOf(ctx));
      return { prompt: withTag(ctx.tag, `“${it.l1}”的意思是？`), ...choiceOf(rand, it.m, wrongsOf(poemPoolOf(ctx), 'm', it.m)), explain: `“${it.l1}”的意思是：${it.m}` };
    }
  },
  {
    ask: 'zh-poem-recite', make(rand, ctx) {
      const it = pick(rand, poemPoolOf(ctx));
      return { prompt: withTag(ctx.tag, `《${it.t}》中，“${it.l1}”后面应该接哪一句？`), ...choiceOf(rand, it.l2, wrongsOf(poemPoolOf(ctx), 'l2', it.l2)), explain: `《${it.t}》第二句是“${it.l2}”。` };
    }
  },
  {
    ask: 'zh-poem-theme', make(rand, ctx) {
      const it = pick(rand, poemPoolOf(ctx));
      return { prompt: withTag(ctx.tag, `《${it.t}》主要写了什么？`), ...choiceOf(rand, it.th, wrongsOf(poemPoolOf(ctx), 'th', it.th)), explain: `《${it.t}》${it.th}。` };
    }
  },
  {
    ask: 'zh-poem-scene', make(rand, ctx) {
      const it = pick(rand, poemPoolOf(ctx));
      return { prompt: withTag(ctx.tag, `《${it.t}》写到的景物是？`), ...choiceOf(rand, it.sc, wrongsOf(poemPoolOf(ctx), 'sc', it.sc)), explain: `《${it.t}》写到的景物有${it.sc}。` };
    }
  },
  {
    ask: 'zh-poem-season', make(rand, ctx) {
      // 题目本身不得含正确季节字（如《夏日绝句》），否则答案写进题面
      const it = pick(rand, poemPoolOf(ctx).filter((x) => !x.t.includes(x.se)));
      return { prompt: withTag(ctx.tag, `《${it.t}》写的是哪个季节？`), ...choiceOf(rand, it.se, SEASONS.filter((s) => s !== it.se)), explain: `《${it.t}》写的是${it.se}季。` };
    }
  },
  {
    ask: 'zh-poem-dynasty', make(rand, ctx) {
      const it = pick(rand, poemPoolOf(ctx));
      return { prompt: withTag(ctx.tag, `《${it.t}》的作者生活在哪个朝代？`), ...choiceOf(rand, it.d, DYNASTIES.filter((d) => d !== it.d)), explain: `${it.a}是${it.d}代诗人。` };
    }
  },
  {
    ask: 'zh-poem-pair', make(rand, ctx) {
      const it = pick(rand, poemPoolOf(ctx));
      const others = poemPoolOf(ctx).filter((x) => x.t !== it.t).map((x) => `${x.l1}${x.l2}`);
      return { prompt: withTag(ctx.tag, `下面哪两句出自《${it.t}》？`), ...choiceOf(rand, `${it.l1}${it.l2}`, others), explain: `《${it.t}》：${it.l1}${it.l2}` };
    }
  },
  {
    ask: 'zh-poem-mood', make(rand, ctx) {
      const it = pick(rand, poemPoolOf(ctx));
      return { prompt: withTag(ctx.tag, `《${it.t}》表达了怎样的情感？`), ...choiceOf(rand, it.mo, wrongsOf(poemPoolOf(ctx), 'mo', it.mo)), explain: `《${it.t}》表达了${it.mo}之情。` };
    }
  },
  {
    ask: 'zh-poem-author-judge', make(rand, ctx) {
      const it = pick(rand, poemPoolOf(ctx));
      const truth = rand() < 0.5;
      const claim = truth ? it.a : pick(rand, poemPoolOf(ctx).filter((x) => x.a !== it.a)).a;
      return { prompt: withTag(ctx.tag, `《${it.t}》是${claim}写的。这句话对吗？`), type: 'judge', answer: truth, explain: `《${it.t}》的作者是${it.a}。` };
    }
  }
];

/* ============================================================
   zh-reading · 阅读（12 外壳，故事按组合规则生成）
   ============================================================ */
/* 事情、品质、主题成套出现，避免“捡到钱包 → 关心集体”这类错配 */
const STORY_PAIRS = [
  { p: '校园里', a: '捡到一个钱包交给老师', t: '诚实守信', theme: '拾金不昧的事' },
  { p: '操场上', a: '帮助摔倒的同学', t: '乐于助人', theme: '主动帮助同学的事' },
  { p: '公园里', a: '把受伤的小鸟送到救助站', t: '爱护小动物', theme: '爱护小鸟的事' },
  { p: '教室前', a: '扶起被风吹倒的花盆', t: '关心集体', theme: '爱护公物的事' },
  { p: '公交车上', a: '把座位让给老人', t: '乐于助人', theme: '给老人让座的事' },
  { p: '教室里', a: '主动打扫卫生', t: '勤劳能干', theme: '主动打扫卫生的事' },
  { p: '教室里', a: '给同学讲解难题', t: '乐于助人', theme: '帮助同学的事' },
  { p: '图书馆里', a: '为班级整理图书', t: '关心集体', theme: '整理图书的事' }
];
const METHOD_ITEMS = [
  { text: '课桌的高度大约是 70 厘米。', name: '列数字' },
  { text: '大象比一只小狗重得多。', name: '作比较' },
  { text: '白白的云朵像一朵朵棉花。', name: '打比方' },
  { text: '文具，例如铅笔、橡皮，都是学习用品。', name: '举例子' }
];

const storyOf = (rand) => ({
  n: pick(rand, SN.rn),
  c: pick(rand, SN.rc),
  ...pick(rand, STORY_PAIRS)
});

const storyBody = (x) => `${x.c}，${x.n}在${x.p}${x.a}。大家都竖起了大拇指。`;

export const ZH_READING_MODES = [
  {
    ask: 'zh-reading-detail', make(rand, ctx) {
      const x = storyOf(rand);
      const body = storyBody(x);
      return { prompt: withTag(ctx.tag, `读句子：“${body}”这件事发生在哪里？`), ...choiceOf(rand, x.p, SN.rp.filter((p) => p !== x.p)), explain: `${x.n}在${x.p}${x.a}。` };
    }
  },
  {
    ask: 'zh-reading-infer', make(rand, ctx) {
      const x = storyOf(rand);
      const body = storyBody(x);
      return { prompt: withTag(ctx.tag, `读句子：“${body}”从这件事可以看出${x.n}是个怎样的孩子？`), ...choiceOf(rand, x.t, SN.rt.filter((t) => t !== x.t)), explain: `${x.n}${x.a}，说明${x.n}${x.t}。` };
    }
  },
  {
    ask: 'zh-reading-main', make(rand, ctx) {
      const x = storyOf(rand);
      const body = storyBody(x);
      return { prompt: withTag(ctx.tag, `读句子：“${body}”这段话主要写了什么？`), ...choiceOf(rand, x.theme, ['在公园里玩耍的事', '认真学习的事', '和别人争吵的事']), explain: `这段话主要写${x.n}${x.a}，是${x.theme}。` };
    }
  },
  {
    ask: 'zh-reading-person', make(rand, ctx) {
      const x = storyOf(rand);
      const body = storyBody(x);
      return { prompt: withTag(ctx.tag, `读句子：“${body}”${x.n}的品质可以用哪个词概括？`), ...choiceOf(rand, x.t, SN.rt.filter((t) => t !== x.t)), explain: `${x.n}${x.a}，体现了${x.t}的品质。` };
    }
  },
  {
    ask: 'zh-reading-scene', make(rand, ctx) {
      const outdoor = STORY_PAIRS.filter((v) => ['校园里', '操场上', '公园里', '教室前'].includes(v.p));
      const base = storyOf(rand);
      const x = { ...base, ...pick(rand, outdoor) };
      const body = `${x.c}，${x.p}的景色十分美丽，${x.n}在这里${x.a}。`;
      return { prompt: withTag(ctx.tag, `读句子：“${body}”写“${x.p}的景色十分美丽”有什么作用？`), ...choiceOf(rand, '为事情发生提供美好的环境', ['说明天气很好', '为了凑字数', '告诉读者地点很远', '说明没有人在场']), explain: `环境描写烘托了美好的氛围，为事情发生做铺垫。` };
    }
  },
  {
    ask: 'zh-reading-transition', make(rand, ctx) {
      const x = storyOf(rand);
      return { prompt: withTag(ctx.tag, `“${x.c}，${x.n}在${x.p}${x.a}。大家都竖起了大拇指。____”横线上补哪一句最合适？`), ...choiceOf(rand, '可是，接下来发生了一件意外的事。', ['今天的天气很好。', '这件事就这样结束了。', '从此以后这里再也没有人来。']), explain: `“可是，接下来发生了一件意外的事。”承接上文、引出下文，是过渡句。` };
    }
  },
  {
    ask: 'zh-reading-method', make(rand, ctx) {
      const it = pick(rand, METHOD_ITEMS);
      return { prompt: withTag(ctx.tag, `“${it.text}”用了哪种说明方法？`), ...choiceOf(rand, it.name, ['列数字', '作比较', '打比方', '举例子'].filter((n) => n !== it.name)), explain: `这句话用了${it.name}。` };
    }
  },
  {
    ask: 'zh-reading-order', make(rand, ctx) {
      const x = storyOf(rand);
      const body = `${x.c}，${x.n}在${x.p}${x.a}。过了一会儿，${x.n}才离开。`;
      return { prompt: withTag(ctx.tag, `读句子：“${body}”这段话是按什么顺序写的？`), ...choiceOf(rand, '事情发展的顺序', ['由远及近的空间顺序', '从整体到部分的顺序', '总—分—总顺序']), explain: `“${x.c}”“过了一会儿”是时间推进，按事情发展的顺序写。` };
    }
  },
  {
    ask: 'zh-reading-paragraph', make(rand, ctx) {
      const x = storyOf(rand);
      const body = storyBody(x);
      return { prompt: withTag(ctx.tag, `读句子：“${body}”这一段的主要意思是？`), ...choiceOf(rand, x.theme, ['在公园里玩耍', '认真学习', '和别人争吵']), explain: `这一段写${x.n}${x.a}，主要意思是${x.theme}。` };
    }
  },
  {
    ask: 'zh-reading-pronoun', make(rand, ctx) {
      const x = storyOf(rand);
      const name = pick(rand, SN.rn.filter((n) => !['小丽', '小美'].includes(n)));
      const body = `${name}在${x.p}${x.a}，大家都夸他${x.t}。`;
      return { prompt: withTag(ctx.tag, `读句子：“${body}”句中的“他”指谁？`), ...choiceOf(rand, name, SN.rn.filter((n) => n !== name)), explain: `“他”指的是${name}。` };
    }
  },
  {
    ask: 'zh-reading-express', make(rand, ctx) {
      const x = storyOf(rand);
      const body = `${x.c}，${x.n}在${x.p}${x.a}。这件事让我明白，${x.t}是一种可贵的品质。`;
      return { prompt: withTag(ctx.tag, `读句子：“${body}”这段话的表达方法是？`), ...choiceOf(rand, '先写事，再写感想', ['只写景', '只写人物外貌', '先写感想，再写事']), explain: `先叙述事情，最后写明白的道理，这是先写事再写感想。` };
    }
  },
  {
    ask: 'zh-reading-open', make(rand, ctx) {
      const x = storyOf(rand);
      const body = `${x.n}${x.a}。`;
      return { prompt: withTag(ctx.tag, `读句子：“${body}”你认为${x.n}的做法值得学习吗？`), ...choiceOf(rand, `值得，因为这是${x.t}的表现`, ['不值得，因为太麻烦', '值得，因为能得到奖励', '不值得，因为会被嘲笑']), explain: `${x.a}是${x.t}的表现，值得学习。` };
    }
  }
];

/* ============================================================
   zh-classical · 文言（12 外壳）
   ============================================================ */
export const ZH_CLASSICAL_MODES = [
  {
    ask: 'zh-classical-word', make(rand, ctx) {
      const it = pick(rand, CLASSICAL_POOL);
      return { prompt: withTag(ctx.tag, `“${it.s}”中“${it.w}”的意思是？`), ...choiceOf(rand, it.wm, wrongsOf(CLASSICAL_POOL, 'wm', it.wm)), explain: `“${it.w}”在这里是“${it.wm}”的意思。` };
    }
  },
  {
    ask: 'zh-classical-translate', make(rand, ctx) {
      const it = pick(rand, CLASSICAL_POOL);
      return { prompt: withTag(ctx.tag, `“${it.s}”的意思是？`), ...choiceOf(rand, it.tr, wrongsOf(CLASSICAL_POOL, 'tr', it.tr)), explain: `句意：${it.tr}` };
    }
  },
  {
    ask: 'zh-classical-source', make(rand, ctx) {
      const it = pick(rand, CLASSICAL_POOL);
      return { prompt: withTag(ctx.tag, `“${it.s}”出自哪篇课文？`), ...choiceOf(rand, it.src, wrongsOf(CLASSICAL_POOL, 'src', it.src)), explain: `这句话出自《${it.src}》。` };
    }
  },
  {
    ask: 'zh-classical-quality', make(rand, ctx) {
      const it = pick(rand, CLASSICAL_POOL);
      return { prompt: withTag(ctx.tag, `“${it.s}”表现了人物怎样的品质？`), ...choiceOf(rand, it.q, wrongsOf(CLASSICAL_POOL, 'q', it.q)), explain: `这里表现了${it.q}的品质。` };
    }
  },
  {
    ask: 'zh-classical-lesson', make(rand, ctx) {
      const it = pick(rand, CLASSICAL_POOL);
      return { prompt: withTag(ctx.tag, `“${it.s}”给我们的启示是？`), ...choiceOf(rand, it.les, wrongsOf(CLASSICAL_POOL, 'les', it.les)), explain: `启示：${it.les}` };
    }
  },
  {
    ask: 'zh-classical-translate-judge', make(rand, ctx) {
      const it = pick(rand, CLASSICAL_POOL);
      const truth = rand() < 0.5;
      const claim = truth ? it.tr : pick(rand, CLASSICAL_POOL.filter((x) => x.tr !== it.tr)).tr;
      return { prompt: withTag(ctx.tag, `“${it.s}”的意思是“${claim}”。这句话对吗？`), type: 'judge', answer: truth, explain: `正确句意：${it.tr}` };
    }
  },
  {
    ask: 'zh-classical-word-judge', make(rand, ctx) {
      const it = pick(rand, CLASSICAL_POOL);
      const truth = rand() < 0.5;
      const claim = truth ? it.wm : pick(rand, CLASSICAL_POOL.filter((x) => x.wm !== it.wm)).wm;
      return { prompt: withTag(ctx.tag, `“${it.s}”中“${it.w}”的意思是“${claim}”。这句话对吗？`), type: 'judge', answer: truth, explain: `“${it.w}”在句中是“${it.wm}”的意思。` };
    }
  },
  {
    ask: 'zh-classical-modern', make(rand, ctx) {
      const it = pick(rand, CLASSICAL_POOL);
      return { prompt: withTag(ctx.tag, `“${it.w}”在句中的意思和现代常用意思一样吗？`), type: 'judge', answer: it.wm === it.mod, explain: it.wm === it.mod ? `意思相同：${it.wm}。` : `句中义是“${it.wm}”，现代常用义是“${it.mod}”，不一样。` };
    }
  },
  {
    ask: 'zh-classical-source-judge', make(rand, ctx) {
      const it = pick(rand, CLASSICAL_POOL);
      const truth = rand() < 0.5;
      const claim = truth ? it.src : pick(rand, CLASSICAL_POOL.filter((x) => x.src !== it.src)).src;
      return { prompt: withTag(ctx.tag, `“${it.s}”出自《${claim}》。这句话对吗？`), type: 'judge', answer: truth, explain: `这句话出自《${it.src}》。` };
    }
  },
  {
    ask: 'zh-classical-blank', make(rand, ctx) {
      const it = pick(rand, CLASSICAL_POOL);
      return { prompt: withTag(ctx.tag, `“${it.s.replace(it.w, '（　）')}”括号处应填的词是？`), ...choiceOf(rand, it.w, wrongsOf(CLASSICAL_POOL, 'w', it.w)), explain: `括号处应填“${it.w}”。` };
    }
  },
  {
    ask: 'zh-classical-person', make(rand, ctx) {
      const it = pick(rand, CLASSICAL_POOL);
      return { prompt: withTag(ctx.tag, `“${it.s}”这段文言出自哪个故事？`), ...choiceOf(rand, it.src, wrongsOf(CLASSICAL_POOL, 'src', it.src)), explain: `这段文言出自《${it.src}》。` };
    }
  },
  {
    ask: 'zh-classical-theme', make(rand, ctx) {
      const it = pick(rand, CLASSICAL_POOL);
      return { prompt: withTag(ctx.tag, `“${it.s}”讲的主要道理是？`), ...choiceOf(rand, it.les, wrongsOf(CLASSICAL_POOL, 'les', it.les)), explain: `主要道理：${it.les}` };
    }
  }
];

/* ============================================================
   zh-idiom · 成语（12 外壳）
   ============================================================ */
const idiomCatOf = (d) => (/[一二三四五六七八九十百千万]/.test(d) ? '含数字'
  : /[鸟兽鱼虫马牛羊犬鸡鸭虎蛇鼠龙兔]/.test(d) ? '含动物'
    : /[红黄蓝绿白黑紫青]/.test(d) ? '含颜色'
      : '其他');
const wrongIdioms = (correct) => IDIOM_POOL.map((x) => x.d).filter((d) => d !== correct);
const wrongMeans = (correct) => IDIOM_POOL.map((x) => x.m).filter((m) => m !== correct);
const blankIdiom = (it) => it.d.slice(0, it.idx) + '（　）' + it.d.slice(it.idx + 1);

export const ZH_IDIOM_MODES = [
  {
    ask: 'zh-idiom-char', make(rand, ctx) {
      const it = pick(rand, IDIOM_POOL);
      return { prompt: withTag(ctx.tag, `“${blankIdiom(it)}”括号处应填哪个字？`), ...choiceOf(rand, it.c, wrongIdioms(it.d).map((d) => d[it.idx]).concat([it.d[0], it.d[1], it.d[2], it.d[3]])), explain: `这个成语是“${it.d}”。` };
    }
  },
  {
    ask: 'zh-idiom-mean', make(rand, ctx) {
      const it = pick(rand, IDIOM_POOL);
      return { prompt: withTag(ctx.tag, `“${it.d}”的意思是？`), ...choiceOf(rand, it.m, wrongMeans(it.m)), explain: `“${it.d}”：${it.m}` };
    }
  },
  {
    ask: 'zh-idiom-context', make(rand, ctx) {
      const it = pick(rand, IDIOM_POOL);
      // 题面把成语挖空，避免答案直接写在句子里
      const stem = it.cs.replace(it.d, '（　）');
      return { prompt: withTag(ctx.tag, `“${stem}”括号处用哪个成语最合适？`), ...choiceOf(rand, it.d, wrongIdioms(it.d)), explain: `这里用“${it.d}”最合适。` };
    }
  },
  {
    ask: 'zh-idiom-syn', make(rand, ctx) {
      const it = pick(rand, IDIOM_POOL);
      return { prompt: withTag(ctx.tag, `和“${it.d}”意思相近的成语是？`), ...choiceOf(rand, it.syn, wrongsOf(IDIOM_POOL, 'syn', it.syn)), explain: `“${it.d}”的近义成语是“${it.syn}”。` };
    }
  },
  {
    ask: 'zh-idiom-ant', make(rand, ctx) {
      const it = pick(rand, IDIOM_POOL);
      return { prompt: withTag(ctx.tag, `和“${it.d}”意思相反的成语是？`), ...choiceOf(rand, it.ant, wrongsOf(IDIOM_POOL, 'ant', it.ant)), explain: `“${it.d}”的反义成语是“${it.ant}”。` };
    }
  },
  {
    ask: 'zh-idiom-mean-judge', make(rand, ctx) {
      const it = pick(rand, IDIOM_POOL);
      const truth = rand() < 0.5;
      const claim = truth ? it.m : pick(rand, IDIOM_POOL.filter((x) => x.m !== it.m)).m;
      return { prompt: withTag(ctx.tag, `“${it.d}”的意思是“${claim}”。这句话对吗？`), type: 'judge', answer: truth, explain: `“${it.d}”：${it.m}` };
    }
  },
  {
    ask: 'zh-idiom-char-judge', make(rand, ctx) {
      const it = pick(rand, IDIOM_POOL);
      const truth = rand() < 0.5;
      const claim = truth ? it.c : pick(rand, IDIOM_POOL.filter((x) => x.d !== it.d)).c;
      return { prompt: withTag(ctx.tag, `“${it.d}”中缺少的字是“${claim}”。这句话对吗？`), type: 'judge', answer: truth, explain: `“${it.d}”中缺少的字是“${it.c}”。` };
    }
  },
  {
    ask: 'zh-idiom-kind', make(rand, ctx) {
      const it = pick(rand, IDIOM_POOL);
      const cat = idiomCatOf(it.d);
      return { prompt: withTag(ctx.tag, `“${it.d}”属于下面哪一类？`), ...choiceOf(rand, cat, ['含数字', '含动物', '含颜色', '其他'].filter((x) => x !== cat)), explain: `“${it.d}”属于${cat}的成语。` };
    }
  },
  {
    ask: 'zh-idiom-syn-judge', make(rand, ctx) {
      const it = pick(rand, IDIOM_POOL);
      const truth = rand() < 0.5;
      const claim = truth ? it.syn : it.ant;
      return { prompt: withTag(ctx.tag, `“${it.d}”和“${claim}”意思相近。这句话对吗？`), type: 'judge', answer: truth, explain: `“${it.d}”的近义成语是“${it.syn}”，反义是“${it.ant}”。` };
    }
  },
  {
    ask: 'zh-idiom-situation', make(rand, ctx) {
      const it = pick(rand, IDIOM_POOL);
      return { prompt: withTag(ctx.tag, `下面哪个情境适合用“${it.d}”？`), ...choiceOf(rand, it.cs, wrongsOf(IDIOM_POOL, 'cs', it.cs)), explain: `“${it.d}”：${it.m}。${it.cs}` };
    }
  },
  {
    ask: 'zh-idiom-length', make(rand, ctx) {
      const it = pick(rand, IDIOM_POOL);
      const CN_NUM = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
      const label = `${CN_NUM[it.d.length]}个字`;
      return { prompt: withTag(ctx.tag, `“${it.d}”是几个字的成语？`), ...choiceOf(rand, label, ['三个字', '四个字', '五个字', '六个字'].filter((x) => x !== label)), explain: `“${it.d}”是${label}的成语。` };
    }
  },
  {
    ask: 'zh-idiom-match', make(rand, ctx) {
      const it = pick(rand, IDIOM_POOL);
      return { prompt: withTag(ctx.tag, `下面哪个成语的意思是“${it.m}”？`), ...choiceOf(rand, it.d, wrongIdioms(it.d)), explain: `这个成语是“${it.d}”。` };
    }
  }
];
