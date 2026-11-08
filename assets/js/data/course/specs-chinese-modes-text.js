/**
 * specs-chinese-modes-text.js —— 语文「句子 / 古诗 / 阅读 / 文言 / 成语」五族问法外壳
 *
 * 与 basic 同样的约束：每族 12 个语义不同外壳；题面带单元标签；
 * 句子/阅读用组合素材按规则生成，答案由生成规则决定，不靠随机猜。
 */

import { pick, shuffle, randInt } from '../../core/rng.js';
import { POEM_POOL, CLASSICAL_POOL, IDIOM_POOL, SN } from './specs-chinese-data.js';
import { choiceOf } from './specs-chinese-modes-basic.js';

const withTag = (tag, text) => `【${tag}】${text}`;
const wrongsOf = (pool, key, correct) => pool.map((x) => x[key]).filter((v) => v !== correct);
const SEASONS = ['春', '夏', '秋', '冬'];
const DYNASTIES = ['唐', '宋', '清', '元'];

/* ---------- 句子：组合素材与规则 ---------- */
const MODAL_VERB = ['吃', '拿', '读', '写', '画', '收好'];
const OBJ = ['苹果', '书包', '课本', '铅笔', '画纸', '玩具'];

const sentOf = (rand) => {
  const t = pick(rand, SN.thing);
  return {
    s: pick(rand, SN.subj),
    s2: pick(rand, SN.subj),
    v: pick(rand, SN.verb),
    v2: pick(rand, SN.verb),
    v3: pick(rand, SN.verb),
    p: pick(rand, SN.place),
    a: pick(rand, SN.adj),
    t,
    t2: pick(rand, SN.thing.filter((x) => x !== t))
  };
};

const PUNCT_MODES = [
  { p: '。', make: (x) => `${x.s}在${x.p}${x.v}` },
  { p: '？', make: (x) => `${x.s}在${x.p}${x.v}吗` },
  { p: '！', make: (x) => `${x.p}真${x.a}啊` }
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
      return { prompt: withTag(ctx.tag, `“${x.s}在${x.p}（　）。”括号里填什么最合适？`), ...choiceOf(rand, x.v, SN.verb.filter((v) => v !== x.v)), explain: `填“${x.v}”后句子通顺：${x.s}在${x.p}${x.v}。` };
    }
  },
  {
    ask: 'zh-sentence-rhetoric', make(rand, ctx) {
      const x = sentOf(rand);
      const kind = randInt(rand, 1, 4);
      const text = kind === 1
        ? `${x.a}的${x.t}像${x.t2}一样。`
        : kind === 2
          ? `${x.t}在${x.p}说话了。`
          : kind === 3
            ? `有的${x.v}，有的${x.v2}，有的${x.v3}。`
            : `${x.s}的嗓门大得能把屋顶掀翻。`;
      const name = ['比喻', '拟人', '排比', '夸张'][kind - 1];
      return { prompt: withTag(ctx.tag, `“${text}”用了哪种修辞手法？`), ...choiceOf(rand, name, ['比喻', '拟人', '排比', '夸张'].filter((n) => n !== name)), explain: `这句话用了${name}。` };
    }
  },
  {
    ask: 'zh-sentence-bad', make(rand, ctx) {
      const x = sentOf(rand);
      const kind = randInt(rand, 1, 3);
      const text = kind === 1 ? `在${x.p}${x.v}。` : kind === 2 ? `${x.s}大约${randInt(rand, 6, 12)}岁左右。` : `${x.v}在${x.p}${x.s}。`;
      const name = ['缺少主语', '重复啰嗦', '词序颠倒'][kind - 1];
      return { prompt: withTag(ctx.tag, `“${text}”这句话的问题是？`), ...choiceOf(rand, name, ['缺少主语', '重复啰嗦', '词序颠倒', '没有毛病'].filter((n) => n !== name)), explain: `这句话的问题是${name}。` };
    }
  },
  {
    ask: 'zh-sentence-conj', make(rand, ctx) {
      const x = sentOf(rand);
      const kind = randInt(rand, 1, 4);
      const pair = ['因为……所以……', '虽然……但是……', '如果……就……', '不但……而且……'][kind - 1];
      const text = kind === 1
        ? `（　）${x.s}${x.v}，（　）${x.s2}也${x.v2}。`
        : kind === 2
          ? `（　）${x.a}，（　）${x.s}仍然${x.v}。`
          : kind === 3
            ? `（　）明天${x.v}，我们（　）不去${x.p}。`
            : `${x.s}（　）会${x.v}，（　）会${x.v2}。`;
      return { prompt: withTag(ctx.tag, `“${text}”应填哪组关联词？`), ...choiceOf(rand, pair, ['因为……所以……', '虽然……但是……', '如果……就……', '不但……而且……'].filter((p) => p !== pair)), explain: `这里应填“${pair}”。` };
    }
  },
  {
    ask: 'zh-sentence-ba', make(rand, ctx) {
      const s = pick(rand, SN.subj);
      const o = pick(rand, OBJ);
      const v = pick(rand, MODAL_VERB);
      const base = `${s}${v}了${o}。`;
      const right = `${s}把${o}${v}了。`;
      return { prompt: withTag(ctx.tag, `把“${base}”改成“把”字句，正确的是？`), ...choiceOf(rand, right, [`${o}把${s}${v}了。`, `${s}${v}把${o}了。`, `${s}被${o}${v}了。`]), explain: `“把”字句：${right}` };
    }
  },
  {
    ask: 'zh-sentence-bei', make(rand, ctx) {
      const s = pick(rand, SN.subj);
      const o = pick(rand, OBJ);
      const v = pick(rand, MODAL_VERB);
      const base = `${s}${v}了${o}。`;
      const right = `${o}被${s}${v}了。`;
      return { prompt: withTag(ctx.tag, `把“${base}”改成“被”字句，正确的是？`), ...choiceOf(rand, right, [`${s}被${o}${v}了。`, `${o}把${s}${v}了。`, `${o}${v}了${s}。`]), explain: `“被”字句：${right}` };
    }
  },
  {
    ask: 'zh-sentence-expand', make(rand, ctx) {
      const x = sentOf(rand);
      const base = `${x.s}${x.v}。`;
      const right = `${x.s}在${x.p}认真地${x.v}。`;
      return { prompt: withTag(ctx.tag, `把“${base}”扩写，下面哪句更具体？`), ...choiceOf(rand, right, [base, `${x.s}在${x.p}。`, `${x.v}。`]), explain: `加了地点和样子：${right}` };
    }
  },
  {
    ask: 'zh-sentence-shrink', make(rand, ctx) {
      const x = sentOf(rand);
      const long = `${x.s}在${x.p}认真地${x.v}。`;
      const right = `${x.s}${x.v}。`;
      return { prompt: withTag(ctx.tag, `把“${long}”缩写成最简洁的句子，正确的是？`), ...choiceOf(rand, right, [`${x.s}在${x.p}。`, `${x.p}${x.v}。`, `${x.s}认真地。`]), explain: `保留谁和做什么：${right}` };
    }
  },
  {
    ask: 'zh-sentence-kind', make(rand, ctx) {
      const x = sentOf(rand);
      const kind = randInt(rand, 1, 4);
      const text = kind === 1 ? `${x.s}在${x.p}${x.v}。` : kind === 2 ? `${x.s}在${x.p}${x.v}吗？` : kind === 3 ? `${x.p}真${x.a}！` : `请${x.s}${x.v}。`;
      const name = ['陈述句', '疑问句', '感叹句', '祈使句'][kind - 1];
      return { prompt: withTag(ctx.tag, `“${text}”是什么句式？`), ...choiceOf(rand, name, ['陈述句', '疑问句', '感叹句', '祈使句'].filter((n) => n !== name)), explain: `这是${name}。` };
    }
  },
  {
    ask: 'zh-sentence-conj-judge', make(rand, ctx) {
      const x = sentOf(rand);
      const truth = rand() < 0.5;
      const pair = truth ? '因为……所以……' : '虽然……但是……';
      const clause = x.s + x.v;
      return { prompt: withTag(ctx.tag, `“${clause}”用“${pair}”连接合适吗？`), type: 'judge', answer: truth, explain: truth ? `“${pair}”适合表示因果。` : `“${pair}”表示转折，不适合这里的因果。` };
    }
  }
];

/* ============================================================
   zh-poem · 古诗（12 外壳）
   ============================================================ */
export const ZH_POEM_MODES = [
  {
    ask: 'zh-poem-next', make(rand, ctx) {
      const it = pick(rand, POEM_POOL);
      return { prompt: withTag(ctx.tag, `“${it.l1}”的下一句是？`), ...choiceOf(rand, it.l2, wrongsOf(POEM_POOL, 'l2', it.l2)), explain: `《${it.t}》：${it.l1}${it.l2}` };
    }
  },
  {
    ask: 'zh-poem-author', make(rand, ctx) {
      const it = pick(rand, POEM_POOL);
      return { prompt: withTag(ctx.tag, `《${it.t}》的作者是？`), ...choiceOf(rand, it.a, wrongsOf(POEM_POOL, 'a', it.a)), explain: `《${it.t}》的作者是${it.a}。` };
    }
  },
  {
    ask: 'zh-poem-source', make(rand, ctx) {
      const it = pick(rand, POEM_POOL);
      return { prompt: withTag(ctx.tag, `“${it.l1}”出自哪首诗？`), ...choiceOf(rand, it.t, wrongsOf(POEM_POOL, 't', it.t)), explain: `“${it.l1}”出自《${it.t}》。` };
    }
  },
  {
    ask: 'zh-poem-meaning', make(rand, ctx) {
      const it = pick(rand, POEM_POOL);
      return { prompt: withTag(ctx.tag, `“${it.l1}”的意思是？`), ...choiceOf(rand, it.m, wrongsOf(POEM_POOL, 'm', it.m)), explain: `“${it.l1}”的意思是：${it.m}` };
    }
  },
  {
    ask: 'zh-poem-recite', make(rand, ctx) {
      const it = pick(rand, POEM_POOL);
      return { prompt: withTag(ctx.tag, `《${it.t}》中，“${it.l1}”后面应该接哪一句？`), ...choiceOf(rand, it.l2, wrongsOf(POEM_POOL, 'l2', it.l2)), explain: `《${it.t}》第二句是“${it.l2}”。` };
    }
  },
  {
    ask: 'zh-poem-theme', make(rand, ctx) {
      const it = pick(rand, POEM_POOL);
      return { prompt: withTag(ctx.tag, `《${it.t}》主要写了什么？`), ...choiceOf(rand, it.th, wrongsOf(POEM_POOL, 'th', it.th)), explain: `《${it.t}》${it.th}。` };
    }
  },
  {
    ask: 'zh-poem-scene', make(rand, ctx) {
      const it = pick(rand, POEM_POOL);
      return { prompt: withTag(ctx.tag, `《${it.t}》写到的景物是？`), ...choiceOf(rand, it.sc, wrongsOf(POEM_POOL, 'sc', it.sc)), explain: `《${it.t}》写到的景物有${it.sc}。` };
    }
  },
  {
    ask: 'zh-poem-season', make(rand, ctx) {
      // 题目本身不得含正确季节字（如《夏日绝句》），否则答案写进题面
      const it = pick(rand, POEM_POOL.filter((x) => !x.t.includes(x.se)));
      return { prompt: withTag(ctx.tag, `《${it.t}》写的是哪个季节？`), ...choiceOf(rand, it.se, SEASONS.filter((s) => s !== it.se)), explain: `《${it.t}》写的是${it.se}季。` };
    }
  },
  {
    ask: 'zh-poem-dynasty', make(rand, ctx) {
      const it = pick(rand, POEM_POOL);
      return { prompt: withTag(ctx.tag, `《${it.t}》的作者生活在哪个朝代？`), ...choiceOf(rand, it.d, DYNASTIES.filter((d) => d !== it.d)), explain: `${it.a}是${it.d}代诗人。` };
    }
  },
  {
    ask: 'zh-poem-pair', make(rand, ctx) {
      const it = pick(rand, POEM_POOL);
      const others = POEM_POOL.filter((x) => x.t !== it.t).map((x) => `${x.l1}${x.l2}`);
      return { prompt: withTag(ctx.tag, `下面哪两句出自《${it.t}》？`), ...choiceOf(rand, `${it.l1}${it.l2}`, others), explain: `《${it.t}》：${it.l1}${it.l2}` };
    }
  },
  {
    ask: 'zh-poem-mood', make(rand, ctx) {
      const it = pick(rand, POEM_POOL);
      return { prompt: withTag(ctx.tag, `《${it.t}》表达了怎样的情感？`), ...choiceOf(rand, it.mo, wrongsOf(POEM_POOL, 'mo', it.mo)), explain: `《${it.t}》表达了${it.mo}之情。` };
    }
  },
  {
    ask: 'zh-poem-author-judge', make(rand, ctx) {
      const it = pick(rand, POEM_POOL);
      const truth = rand() < 0.5;
      const claim = truth ? it.a : pick(rand, POEM_POOL.filter((x) => x.a !== it.a)).a;
      return { prompt: withTag(ctx.tag, `《${it.t}》是${claim}写的。这句话对吗？`), type: 'judge', answer: truth, explain: `《${it.t}》的作者是${it.a}。` };
    }
  }
];

/* ============================================================
   zh-reading · 阅读（12 外壳，故事按组合规则生成）
   ============================================================ */
const storyOf = (rand) => ({
  n: pick(rand, SN.rn),
  c: pick(rand, SN.rc),
  p: pick(rand, SN.rp),
  a: pick(rand, SN.ra),
  o: pick(rand, SN.ro),
  t: pick(rand, SN.rt),
  t2: pick(rand, SN.rt)
});

const storyBody = (x) => `${x.c}，${x.n}在${x.p}${x.a}。大家都向他学习。`;

export const ZH_READING_MODES = [
  {
    ask: 'zh-reading-detail', make(rand, ctx) {
      const x = storyOf(rand);
      const body = storyBody(x);
      return { prompt: withTag(ctx.tag, `读句子：“${body}”${x.n}在哪里${x.a}？`), ...choiceOf(rand, x.p, SN.rp.filter((p) => p !== x.p)), explain: `${x.n}在${x.p}${x.a}。` };
    }
  },
  {
    ask: 'zh-reading-infer', make(rand, ctx) {
      const x = storyOf(rand);
      const body = storyBody(x);
      return { prompt: withTag(ctx.tag, `读句子：“${body}”从这件事可以看出${x.n}是个怎样的孩子？`), ...choiceOf(rand, x.t, SN.rt.filter((t) => t !== x.t)), explain: `他${x.a}，说明他${x.t}。` };
    }
  },
  {
    ask: 'zh-reading-main', make(rand, ctx) {
      const x = storyOf(rand);
      const body = storyBody(x);
      return { prompt: withTag(ctx.tag, `读句子：“${body}”这段话主要写了什么？`), ...choiceOf(rand, '主动帮助别人的事', ['在公园里玩耍的事', '认真学习的事', '和别人争吵的事']), explain: `这段话主要写${x.n}${x.a}，是主动帮助别人的事。` };
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
      const x = storyOf(rand);
      const body = `${x.c}，${x.p}的景色十分美丽，${x.n}在这里${x.a}。`;
      return { prompt: withTag(ctx.tag, `读句子：“${body}”写“${x.p}的景色十分美丽”有什么作用？`), ...choiceOf(rand, '为事情发生提供美好的环境', ['说明天气很好', '为了凑字数', '告诉读者地点很远', '说明没有人在场']), explain: `环境描写烘托了美好的氛围，为事情发生做铺垫。` };
    }
  },
  {
    ask: 'zh-reading-transition', make(rand, ctx) {
      const x = storyOf(rand);
      return { prompt: withTag(ctx.tag, `“${x.c}，${x.n}在${x.p}${x.a}。大家都向他学习。____”横线上补哪一句最合适？`), ...choiceOf(rand, '可是，接下来发生了一件意外的事。', ['今天的天气很好。', '大家都向他学习。', '从此以后他再也没有出门。']), explain: `“可是，接下来发生了一件意外的事。”承接上文、引出下文，是过渡句。` };
    }
  },
  {
    ask: 'zh-reading-method', make(rand, ctx) {
      const x = storyOf(rand);
      const kind = randInt(rand, 1, 4);
      const text = kind === 1 ? `${x.o}的长度大约是${randInt(rand, 20, 80)}厘米。` : kind === 2 ? `${x.o}比一支铅笔长一些。` : kind === 3 ? `${x.o}像一条小船。` : `${x.o}，例如${x.n}用的那种。`;
      const name = ['列数字', '作比较', '打比方', '举例子'][kind - 1];
      return { prompt: withTag(ctx.tag, `“${text}”用了哪种说明方法？`), ...choiceOf(rand, name, ['列数字', '作比较', '打比方', '举例子'].filter((n) => n !== name)), explain: `这句话用了${name}。` };
    }
  },
  {
    ask: 'zh-reading-order', make(rand, ctx) {
      const x = storyOf(rand);
      const body = `${x.c}，${x.n}在${x.p}${x.a}。过了一会儿，他又帮助了一位同学。`;
      return { prompt: withTag(ctx.tag, `读句子：“${body}”这段话是按什么顺序写的？`), ...choiceOf(rand, '事情发展的顺序', ['由远及近的空间顺序', '从整体到部分的顺序', '总—分—总顺序']), explain: `“${x.c}”“过了一会儿”是时间推进，按事情发展的顺序写。` };
    }
  },
  {
    ask: 'zh-reading-paragraph', make(rand, ctx) {
      const x = storyOf(rand);
      const body = storyBody(x);
      return { prompt: withTag(ctx.tag, `读句子：“${body}”这一段的主要意思是？`), ...choiceOf(rand, '主动帮助别人', ['在公园里玩耍', '认真学习', '和别人争吵']), explain: `这一段写${x.n}${x.a}，主要意思是主动帮助别人。` };
    }
  },
  {
    ask: 'zh-reading-pronoun', make(rand, ctx) {
      const x = storyOf(rand);
      const body = `${x.n}在${x.p}${x.a}，大家都夸他${x.t}。`;
      return { prompt: withTag(ctx.tag, `读句子：“${body}”句中的“他”指谁？`), ...choiceOf(rand, x.n, SN.rn.filter((n) => n !== x.n)), explain: `“他”指的是${x.n}。` };
    }
  },
  {
    ask: 'zh-reading-express', make(rand, ctx) {
      const x = storyOf(rand);
      const body = `${x.c}，${x.n}在${x.p}${x.a}。这件事让我明白，帮助别人，自己也快乐。`;
      return { prompt: withTag(ctx.tag, `读句子：“${body}”这段话的表达方法是？`), ...choiceOf(rand, '先写事，再写感想', ['只写景', '只写人物外貌', '先写感想，再写事']), explain: `先叙述事情，最后写明白的道理，这是先写事再写感想。` };
    }
  },
  {
    ask: 'zh-reading-open', make(rand, ctx) {
      const x = storyOf(rand);
      const body = `${x.n}看到同学有困难，主动${x.a}。`;
      return { prompt: withTag(ctx.tag, `读句子：“${body}”你认为${x.n}的做法值得学习吗？`), ...choiceOf(rand, '值得，因为帮助别人是美德', ['不值得，因为太麻烦', '值得，因为能得到奖励', '不值得，因为会被嘲笑']), explain: `主动${x.a}是助人为乐的表现，值得学习。` };
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
      return { prompt: withTag(ctx.tag, `“${it.d}”是几个字的成语？`), ...choiceOf(rand, `${it.d.length}个字`, ['三个字', '四个字', '五个字', '六个字'].filter((x) => x !== `${it.d.length}个字`)), explain: `“${it.d}”是${it.d.length}个字的成语。` };
    }
  },
  {
    ask: 'zh-idiom-match', make(rand, ctx) {
      const it = pick(rand, IDIOM_POOL);
      return { prompt: withTag(ctx.tag, `下面哪个成语的意思是“${it.m}”？`), ...choiceOf(rand, it.d, wrongIdioms(it.d)), explain: `这个成语是“${it.d}”。` };
    }
  }
];
