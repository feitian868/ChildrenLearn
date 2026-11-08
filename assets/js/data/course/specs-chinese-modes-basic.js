/**
 * specs-chinese-modes-basic.js —— 语文「字音 / 拼音 / 字形 / 词语」四族问法外壳
 *
 * 每族 12 个语义不同外壳；每册每个 kid 用其中 4 个（specOffset 1/5/9），
 * 因此同一册内不同 kid 不会共用外壳。题面前缀带单元标签（ctx.tag），
 * 保证同一 grade 的不同单元不会产生完全相同的题面。
 */

import { pick, shuffle, randInt } from '../../core/rng.js';
import { SOUND_POOL, POLY_POOL, SYLLABLES, SHAPE_POOL, WORD_POOL, MEASURE_POOL, COLLOC_POOL, CONTEXT_POOL } from './specs-chinese-data.js';

const TONES = ['第一声', '第二声', '第三声', '第四声'];
const STRUCTS = ['独体', '上下', '左右', '半包围', '全包围'];
const FIRST = ['横', '竖', '撇', '捺', '点', '撇折', '撇点'];

/** 选出正确项 + 干扰项（文本），三选项起，默认四选项 */
export function choiceOf(rand, correct, wrongPool, need = 4) {
  const correctS = String(correct);
  const seen = [correctS];
  const wrongs = shuffle(rand, wrongPool.map(String)).filter((x) => x && x !== correctS);
  for (const x of wrongs) {
    if (seen.length >= need) break;
    if (!seen.includes(x)) seen.push(x);
  }
  const options = shuffle(rand, seen);
  return { type: 'choice', options, answer: options.indexOf(correctS) };
}

const wrongsOf = (pool, key, correct) => pool.map((x) => x[key]).filter((v) => v !== correct);
const withTag = (tag, text) => `【${tag}】${text}`;

const soundWrongs = (rand, correct) => {
  const list = SOUND_POOL.map((x) => x.p);
  return shuffle(rand, list.filter((p) => p !== correct)).slice(0, 3);
};

/** 去声调：逐字符映射，保留 ü；避免「wǎn → wn」这类非法拼音 */
const TONE_MAP = {
  ā: 'a', á: 'a', ǎ: 'a', à: 'a', ē: 'e', é: 'e', ě: 'e', è: 'e',
  ī: 'i', í: 'i', ǐ: 'i', ì: 'i', ō: 'o', ó: 'o', ǒ: 'o', ò: 'o',
  ū: 'u', ú: 'u', ǔ: 'u', ù: 'u', ǖ: 'ü', ǘ: 'ü', ǚ: 'ü', ǜ: 'ü'
};
const toneFree = (s) => s.replace(/[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]/g, (c) => TONE_MAP[c] || c);
const hasTone = (s) => /[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]/.test(s);

/* ============================================================
   zh-sound · 字音（12 外壳）
   ============================================================ */
export const ZH_SOUND_MODES = [
  {
    ask: 'zh-sound-read', make(rand, ctx) {
      const it = pick(rand, SOUND_POOL);
      return { prompt: withTag(ctx.tag, `“${it.z}”的正确读音是？`), ...choiceOf(rand, it.p, soundWrongs(rand, it.p)), explain: `“${it.z}”读作 ${it.p}。` };
    }
  },
  {
    ask: 'zh-sound-judge', make(rand, ctx) {
      const it = pick(rand, SOUND_POOL);
      const bad = pick(rand, SOUND_POOL.filter((x) => x.p !== it.p)).p;
      const truth = rand() < 0.5;
      const claim = truth ? it.p : bad;
      return { prompt: withTag(ctx.tag, `“${it.z}”读作“${claim}”。这句话对吗？`), type: 'judge', answer: truth, explain: truth ? `“${it.z}”确实读作 ${it.p}。` : `“${it.z}”读作 ${it.p}，不是 ${bad}。` };
    }
  },
  {
    ask: 'zh-sound-word', make(rand, ctx) {
      const it = pick(rand, SOUND_POOL);
      return { prompt: withTag(ctx.tag, `词语“${it.w}”中，“${it.z}”读作？`), ...choiceOf(rand, it.p, soundWrongs(rand, it.p)), explain: `“${it.w}”中“${it.z}”读作 ${it.p}。` };
    }
  },
  {
    ask: 'zh-sound-poly', make(rand, ctx) {
      const it = pick(rand, POLY_POOL);
      const inA = rand() < 0.5;
      const word = inA ? it.wa : it.wb;
      const correct = inA ? it.a : it.b;
      return { prompt: withTag(ctx.tag, `“${word}”中的“${it.z}”读作？`), ...choiceOf(rand, correct, [inA ? it.b : it.a, ...soundWrongs(rand, correct)], 4), explain: `“${word}”中“${it.z}”读作 ${correct}。` };
    }
  },
  {
    ask: 'zh-sound-char', make(rand, ctx) {
      const it = pick(rand, SOUND_POOL);
      const others = SOUND_POOL.filter((x) => x.z !== it.z).map((x) => x.z);
      return { prompt: withTag(ctx.tag, `读音是“${it.p}”的字是？`), ...choiceOf(rand, it.z, others), explain: `“${it.z}”读作 ${it.p}。` };
    }
  },
  {
    ask: 'zh-sound-tone', make(rand, ctx) {
      const it = pick(rand, SOUND_POOL);
      return { prompt: withTag(ctx.tag, `“${it.z}”是第几声？`), ...choiceOf(rand, TONES[it.t - 1], TONES.filter((x, i) => i !== it.t - 1)), explain: `“${it.z}”读作 ${it.p}，是${TONES[it.t - 1]}。` };
    }
  },
  {
    ask: 'zh-sound-flat', make(rand, ctx) {
      const list = SOUND_POOL.filter((x) => ['zh', 'ch', 'sh', 'r', 'z', 'c', 's'].includes(x.i));
      const it = pick(rand, list);
      const flat = ['z', 'c', 's'].includes(it.i);
      return { prompt: withTag(ctx.tag, `“${it.z}”的声母是平舌音还是翘舌音？`), ...choiceOf(rand, flat ? '平舌音' : '翘舌音', ['平舌音', '翘舌音', '整体认读音节'], 3), explain: `“${it.z}”的声母是 ${it.i}，属于${flat ? '平舌音' : '翘舌音'}。` };
    }
  },
  {
    ask: 'zh-sound-nasal', make(rand, ctx) {
      const list = SOUND_POOL.filter((x) => x.f.endsWith('n') || x.f.endsWith('ng'));
      const it = pick(rand, list);
      const front = it.f.endsWith('n');
      return { prompt: withTag(ctx.tag, `“${it.z}”的韵母是前鼻音还是后鼻音？`), ...choiceOf(rand, front ? '前鼻音' : '后鼻音', ['前鼻音', '后鼻音', '单韵母'], 3), explain: `“${it.z}”的韵母是 ${it.f}，属于${front ? '前鼻音' : '后鼻音'}。` };
    }
  },
  {
    ask: 'zh-sound-spell', make(rand, ctx) {
      const it = pick(rand, SOUND_POOL);
      const otherInitial = pick(rand, ['b', 'p', 'm', 'f', 'd', 't', 'n', 'l', 'g', 'k', 'h', 'j', 'q', 'x', 'zh', 'ch', 'sh', 'r', 'z', 'c', 's'].filter((x) => x !== it.i));
      const bad = [toneFree(it.p), `${it.i}${it.f}`, `${otherInitial}${it.f}`].filter((x) => x && x !== it.p);
      return { prompt: withTag(ctx.tag, `下面哪个是“${it.z}”的正确拼音？`), ...choiceOf(rand, it.p, [...bad, ...soundWrongs(rand, it.p)]), explain: `“${it.z}”的正确拼音是 ${it.p}。` };
    }
  },
  {
    ask: 'zh-sound-initial', make(rand, ctx) {
      const it = pick(rand, SOUND_POOL.filter((x) => ['zh', 'ch', 'sh', 'r', 'z', 'c', 's', 'b', 'p', 'm', 'f', 'd', 't', 'n', 'l', 'g', 'k', 'h', 'j', 'q', 'x'].includes(x.i)));
      if (!it) return null;
      const wrongs = ['b', 'p', 'm', 'f', 'd', 't', 'n', 'l', 'g', 'k', 'h', 'j', 'q', 'x', 'zh', 'ch', 'sh', 'r', 'z', 'c', 's'].filter((x) => x !== it.i);
      return { prompt: withTag(ctx.tag, `“${it.z}”的声母是？`), ...choiceOf(rand, it.i, wrongs), explain: `“${it.z}”读作 ${it.p}，声母是 ${it.i}。` };
    }
  },
  {
    ask: 'zh-sound-final', make(rand, ctx) {
      const it = pick(rand, SOUND_POOL);
      const wrongs = SYLLABLES.map((x) => x.f).filter((f) => f !== it.f);
      return { prompt: withTag(ctx.tag, `“${it.z}”的韵母是？`), ...choiceOf(rand, it.f, wrongs), explain: `“${it.z}”读作 ${it.p}，韵母是 ${it.f}。` };
    }
  },
  {
    ask: 'zh-sound-error', make(rand, ctx) {
      const it = pick(rand, SOUND_POOL);
      const bad = pick(rand, SOUND_POOL.filter((x) => x.p !== it.p)).p;
      const truth = rand() < 0.5;
      const claim = truth ? it.p : bad;
      return { prompt: withTag(ctx.tag, `“${it.w}”里“${it.z}”的读音是“${claim}”。这样判断对吗？`), type: 'judge', answer: truth, explain: truth ? `“${it.w}”中“${it.z}”读作 ${it.p}。` : `“${it.w}”中“${it.z}”读作 ${it.p}，不是 ${bad}。` };
    }
  }
];

/* ============================================================
   zh-pinyin · 汉语拼音（12 外壳）
   ============================================================ */
const initialWrongs = (correct) => ['b', 'p', 'm', 'f', 'd', 't', 'n', 'l', 'g', 'k', 'h', 'j', 'q', 'x', 'zh', 'ch', 'sh', 'r', 'z', 'c', 's', 'y', 'w'].filter((x) => x !== correct);

export const ZH_PINYIN_MODES = [
  {
    ask: 'zh-pinyin-initial', make(rand, ctx) {
      const it = pick(rand, SYLLABLES.filter((x) => x.i));
      return { prompt: withTag(ctx.tag, `音节“${it.s}”的声母是？`), ...choiceOf(rand, it.i, initialWrongs(it.i)), explain: `音节 ${it.s} 的声母是 ${it.i}。` };
    }
  },
  {
    ask: 'zh-pinyin-final', make(rand, ctx) {
      const it = pick(rand, SYLLABLES);
      return { prompt: withTag(ctx.tag, `音节“${it.s}”的韵母是？`), ...choiceOf(rand, it.f, SYLLABLES.map((x) => x.f).filter((f) => f !== it.f)), explain: `音节 ${it.s} 的韵母是 ${it.f}。` };
    }
  },
  {
    ask: 'zh-pinyin-tone', make(rand, ctx) {
      const it = pick(rand, SYLLABLES);
      return { prompt: withTag(ctx.tag, `音节“${it.s}”是第几声？`), ...choiceOf(rand, TONES[it.t - 1], TONES.filter((x, i) => i !== it.t - 1)), explain: `音节 ${it.s} 是${TONES[it.t - 1]}。` };
    }
  },
  {
    ask: 'zh-pinyin-blend', make(rand, ctx) {
      const it = pick(rand, SYLLABLES.filter((x) => x.i && x.f && !x.whole));
      const wrongs = SYLLABLES.map((x) => x.s).filter((s) => s !== it.s);
      return { prompt: withTag(ctx.tag, `“${it.i}”和“${it.f}”拼成什么？`), ...choiceOf(rand, it.s, wrongs), explain: `${it.i} 和 ${it.f} 拼成 ${it.s}。` };
    }
  },
  {
    ask: 'zh-pinyin-whole', make(rand, ctx) {
      const it = pick(rand, SYLLABLES);
      return { prompt: withTag(ctx.tag, `“${it.s}”是整体认读音节吗？`), type: 'judge', answer: it.whole, explain: it.whole ? `${it.s} 是整体认读音节。` : `${it.s} 不是整体认读音节。` };
    }
  },
  {
    ask: 'zh-pinyin-write', make(rand, ctx) {
      const it = pick(rand, SYLLABLES.filter((x) => hasTone(x.s)));
      const plain = toneFree(it.s);
      const bad = [it.s.replace('ü', 'u'), it.s.replace('ü', 'v'), plain.replace('ü', 'u')].filter((x) => x !== plain);
      const others = SYLLABLES.filter((x) => toneFree(x.s) !== plain).map((x) => toneFree(x.s));
      return { prompt: withTag(ctx.tag, `音节“${it.s}”去掉声调后写作下面哪个？`), ...choiceOf(rand, plain, [...bad, ...others]), explain: `“${it.s}”去掉声调写作 ${plain}。` };
    }
  },
  {
    ask: 'zh-pinyin-compound', make(rand, ctx) {
      const list = SYLLABLES.filter((x) => /(ai|ei|ui|ao|ou|iu|ie|üe|er|ia|ua|uo|üan|iao|ian|uan)/.test(x.f));
      const it = pick(rand, list);
      return { prompt: withTag(ctx.tag, `音节“${it.s}”的韵母是复韵母吗？`), type: 'judge', answer: /(ai|ei|ui|ao|ou|iu|ie|üe|er|ia|ua|uo|üan|iao|ian|uan)/.test(it.f), explain: `${it.s} 的韵母是 ${it.f}。` };
    }
  },
  {
    ask: 'zh-pinyin-nasal', make(rand, ctx) {
      const list = SYLLABLES.filter((x) => x.f.endsWith('n') || x.f.endsWith('ng'));
      const it = pick(rand, list);
      const front = it.f.endsWith('n');
      return { prompt: withTag(ctx.tag, `音节“${it.s}”的韵母是前鼻音还是后鼻音？`), ...choiceOf(rand, front ? '前鼻音' : '后鼻音', ['前鼻音', '后鼻音', '单韵母'], 3), explain: `${it.s} 的韵母是 ${it.f}。` };
    }
  },
  {
    ask: 'zh-pinyin-three', make(rand, ctx) {
      const it = pick(rand, SYLLABLES);
      return { prompt: withTag(ctx.tag, `“${it.s}”是三拼音节吗？`), type: 'judge', answer: it.three, explain: it.three ? `${it.s} 是三拼音节。` : `${it.s} 不是三拼音节。` };
    }
  },
  {
    ask: 'zh-pinyin-pair', make(rand, ctx) {
      const a = pick(rand, SYLLABLES);
      const b = pick(rand, SYLLABLES.filter((x) => x.whole !== a.whole));
      const target = a.whole ? a.s : b.s;
      return { prompt: withTag(ctx.tag, `“${a.s}”和“${b.s}”中，哪个是整体认读音节？`), ...choiceOf(rand, target, [a.whole ? b.s : a.s, '都不是整体认读音节'], 3), explain: `${target} 是整体认读音节。` };
    }
  },
  {
    ask: 'zh-pinyin-toneless', make(rand, ctx) {
      const it = pick(rand, SYLLABLES.filter((x) => /[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]/.test(x.s)));
      const plain = it.s.replace(/[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]/g, (c) => {
        const map = { ā: 'a', á: 'a', ǎ: 'a', à: 'a', ē: 'e', é: 'e', ě: 'e', è: 'e', ī: 'i', í: 'i', ǐ: 'i', ì: 'i', ō: 'o', ó: 'o', ǒ: 'o', ò: 'o', ū: 'u', ú: 'u', ǔ: 'u', ù: 'u', ǖ: 'ü', ǘ: 'ü', ǚ: 'ü', ǜ: 'ü' };
        return map[c] || c;
      });
      return { prompt: withTag(ctx.tag, `音节“${it.s}”去掉声调后读什么？`), ...choiceOf(rand, plain, SYLLABLES.map((x) => x.s).filter((s) => s !== it.s).concat(['ba'])), explain: `${it.s} 去掉声调读 ${plain}。` };
    }
  },
  {
    ask: 'zh-pinyin-kinds', make(rand, ctx) {
      const it = pick(rand, SYLLABLES.filter((x) => x.i && x.f && !x.whole));
      return { prompt: withTag(ctx.tag, `音节“${it.s}”是两拼音节还是三拼音节？`), ...choiceOf(rand, it.three ? '三拼音节' : '两拼音节', ['两拼音节', '三拼音节', '整体认读音节'], 3), explain: `${it.s} 是${it.three ? '三拼音节' : '两拼音节'}。` };
    }
  }
];

/* ============================================================
   zh-shape · 字形（12 外壳）
   ============================================================ */
const shapeWrongs = (key, correct) => SHAPE_POOL.map((x) => x[key]).filter((v) => v !== correct);
const sameStruct = (it) => SHAPE_POOL.filter((x) => x.z !== it.z && x.s === it.s);
const diffStruct = (it) => SHAPE_POOL.filter((x) => x.z !== it.z && x.s !== it.s);

export const ZH_SHAPE_MODES = [
  {
    ask: 'zh-shape-radical', make(rand, ctx) {
      const it = pick(rand, SHAPE_POOL);
      return { prompt: withTag(ctx.tag, `“${it.z}”的偏旁是？`), ...choiceOf(rand, it.r, shapeWrongs('r', it.r)), explain: `“${it.z}”的偏旁是“${it.r}”。` };
    }
  },
  {
    ask: 'zh-shape-radical-name', make(rand, ctx) {
      const it = pick(rand, SHAPE_POOL);
      return { prompt: withTag(ctx.tag, `“${it.z}”的偏旁名称是？`), ...choiceOf(rand, it.rn, shapeWrongs('rn', it.rn)), explain: `“${it.z}”的偏旁是“${it.r}”，叫${it.rn}。` };
    }
  },
  {
    ask: 'zh-shape-strokes', make(rand, ctx) {
      const it = pick(rand, SHAPE_POOL);
      return { prompt: withTag(ctx.tag, `“${it.z}”一共有几画？`), ...choiceOf(rand, it.n, [it.n + 1, it.n - 1, it.n + 2, it.n - 2, it.n + 3].filter((n) => n > 0)), explain: `“${it.z}”一共有 ${it.n} 画。` };
    }
  },
  {
    ask: 'zh-shape-structure', make(rand, ctx) {
      const it = pick(rand, SHAPE_POOL);
      return { prompt: withTag(ctx.tag, `“${it.z}”是什么结构？`), ...choiceOf(rand, it.s, STRUCTS.filter((x) => x !== it.s)), explain: `“${it.z}”是${it.s}结构。` };
    }
  },
  {
    ask: 'zh-shape-single', make(rand, ctx) {
      const it = pick(rand, SHAPE_POOL);
      return { prompt: withTag(ctx.tag, `“${it.z}”是独体字还是合体字？`), ...choiceOf(rand, it.s === '独体' ? '独体字' : '合体字', ['独体字', '合体字', '形声字'], 3), explain: `“${it.z}”是${it.s === '独体' ? '独体字' : '合体字'}。` };
    }
  },
  {
    ask: 'zh-shape-single-judge', make(rand, ctx) {
      const it = pick(rand, SHAPE_POOL);
      return { prompt: withTag(ctx.tag, `“${it.z}”是独体字。这句话对吗？`), type: 'judge', answer: it.s === '独体', explain: `“${it.z}”是${it.s}结构。` };
    }
  },
  {
    ask: 'zh-shape-first', make(rand, ctx) {
      const it = pick(rand, SHAPE_POOL);
      return { prompt: withTag(ctx.tag, `“${it.z}”的第一笔是？`), ...choiceOf(rand, it.f, FIRST.filter((x) => x !== it.f)), explain: `“${it.z}”的第一笔是${it.f}。` };
    }
  },
  {
    ask: 'zh-shape-order', make(rand, ctx) {
      const it = pick(rand, SHAPE_POOL);
      const rule = it.s === '左右' ? '从左到右' : it.s === '上下' ? '从上到下' : it.s === '半包围' ? '从外到内' : '先横后竖';
      return { prompt: withTag(ctx.tag, `写“${it.z}”时，笔顺规则是？`), ...choiceOf(rand, rule, ['从左到右', '从上到下', '从外到内', '先横后竖'].filter((x) => x !== rule)), explain: `“${it.z}”是${it.s}结构，笔顺规则是${rule}。` };
    }
  },
  {
    ask: 'zh-shape-same-struct', make(rand, ctx) {
      const it = pick(rand, SHAPE_POOL.filter((x) => sameStruct(x).length >= 3 && diffStruct(x).length >= 2));
      return { prompt: withTag(ctx.tag, `“${it.z}”和下面哪个字结构相同？`), ...choiceOf(rand, pick(rand, sameStruct(it)).z, diffStruct(it).map((x) => x.z)), explain: `“${it.z}”是${it.s}结构。` };
    }
  },
  {
    ask: 'zh-shape-diff-struct', make(rand, ctx) {
      const it = pick(rand, SHAPE_POOL.filter((x) => sameStruct(x).length >= 2 && diffStruct(x).length >= 1));
      return { prompt: withTag(ctx.tag, `“${it.z}”和下面哪个字结构不同？`), ...choiceOf(rand, pick(rand, diffStruct(it)).z, sameStruct(it).map((x) => x.z)), explain: `“${it.z}”是${it.s}结构，另一个字不是。` };
    }
  },
  {
    ask: 'zh-shape-facts', make(rand, ctx) {
      const it = pick(rand, SHAPE_POOL);
      const others = SHAPE_POOL.filter((x) => x.z !== it.z);
      const right = `${it.n}画，第一笔是${it.f}`;
      const wrongs = others.map((x) => `${x.n}画，第一笔是${x.f}`);
      return { prompt: withTag(ctx.tag, `下面哪一项正确说出了“${it.z}”的笔画和第一笔？`), ...choiceOf(rand, right, wrongs), explain: `“${it.z}”一共 ${it.n} 画，第一笔是${it.f}。` };
    }
  },
  {
    ask: 'zh-shape-pair', make(rand, ctx) {
      const a = pick(rand, SHAPE_POOL);
      const b = pick(rand, SHAPE_POOL.filter((x) => x.z !== a.z && x.s === a.s));
      const same = b ? true : false;
      const other = b || pick(rand, diffStruct(a));
      return { prompt: withTag(ctx.tag, `“${a.z}”和“${other.z}”的结构相同吗？`), type: 'judge', answer: same, explain: `“${a.z}”是${a.s}结构，“${other.z}”是${other.s}结构。` };
    }
  }
];

/* ============================================================
   zh-word · 词语（12 外壳）
   ============================================================ */
const wordWrongs = (key, correct) => WORD_POOL.map((x) => x[key]).filter((v) => v !== correct);

export const ZH_WORD_MODES = [
  {
    ask: 'zh-word-form', make(rand, ctx) {
      const it = pick(rand, WORD_POOL);
      const others = WORD_POOL.filter((x) => !x.w.includes(it.zi)).map((x) => x.w);
      return { prompt: withTag(ctx.tag, `“${it.zi}”可以组成下面哪个词语？`), ...choiceOf(rand, it.w, others), explain: `“${it.zi}”可以组成“${it.w}”。` };
    }
  },
  {
    ask: 'zh-word-measure', make(rand, ctx) {
      const it = pick(rand, MEASURE_POOL);
      const wrongs = ['个', '只', '条', '把', '张', '匹', '朵', '本', '支', '座', '颗', '双', '件', '头', '辆', '扇'].filter((q) => q !== it.q);
      return { prompt: withTag(ctx.tag, `一（　）${it.n}，括号里填哪个量词？`), ...choiceOf(rand, it.q, wrongs), explain: `“${it.n}”用“${it.q}”作量词。` };
    }
  },
  {
    ask: 'zh-word-colloc', make(rand, ctx) {
      const it = pick(rand, COLLOC_POOL);
      const wrongs = COLLOC_POOL.filter((x) => x.a !== it.a).map((x) => x.a);
      return { prompt: withTag(ctx.tag, `（　）的${it.t}，括号里填哪个词最合适？`), ...choiceOf(rand, it.a, wrongs), explain: `“${it.a}的${it.t}”搭配恰当。` };
    }
  },
  {
    ask: 'zh-word-mean', make(rand, ctx) {
      const it = pick(rand, WORD_POOL);
      return { prompt: withTag(ctx.tag, `“${it.w}”的意思是？`), ...choiceOf(rand, it.m, wordWrongs('m', it.m)), explain: `“${it.w}”的意思是：${it.m}。` };
    }
  },
  {
    ask: 'zh-word-syn', make(rand, ctx) {
      const it = pick(rand, WORD_POOL);
      return { prompt: withTag(ctx.tag, `和“${it.w}”意思相近的是？`), ...choiceOf(rand, it.syn, wordWrongs('syn', it.syn)), explain: `“${it.w}”的近义词是“${it.syn}”。` };
    }
  },
  {
    ask: 'zh-word-ant', make(rand, ctx) {
      const it = pick(rand, WORD_POOL);
      return { prompt: withTag(ctx.tag, `和“${it.w}”意思相反的是？`), ...choiceOf(rand, it.ant, wordWrongs('ant', it.ant)), explain: `“${it.w}”的反义词是“${it.ant}”。` };
    }
  },
  {
    ask: 'zh-word-fill', make(rand, ctx) {
      const it = pick(rand, CONTEXT_POOL);
      const wrongs = CONTEXT_POOL.filter((x) => x.a !== it.a).map((x) => x.a);
      return { prompt: withTag(ctx.tag, `${it.s}括号里应填哪个词？`), ...choiceOf(rand, it.a, wrongs), explain: `这里应填“${it.a}”。` };
    }
  },
  {
    ask: 'zh-word-colloc-judge', make(rand, ctx) {
      const it = pick(rand, COLLOC_POOL);
      const truth = rand() < 0.5;
      const adj = truth ? it.a : pick(rand, COLLOC_POOL.filter((x) => x.a !== it.a)).a;
      return { prompt: withTag(ctx.tag, `“${adj}的${it.t}”这个搭配对吗？`), type: 'judge', answer: truth, explain: truth ? `“${it.a}的${it.t}”搭配恰当。` : `“${adj}的${it.t}”搭配不恰当。` };
    }
  },
  {
    ask: 'zh-word-ant-judge', make(rand, ctx) {
      const it = pick(rand, WORD_POOL);
      const truth = rand() < 0.5;
      const claim = truth ? it.ant : it.syn;
      return { prompt: withTag(ctx.tag, `“${it.w}”的反义词是“${claim}”。这句话对吗？`), type: 'judge', answer: truth, explain: `“${it.w}”的反义词是“${it.ant}”。` };
    }
  },
  {
    ask: 'zh-word-measure-judge', make(rand, ctx) {
      const it = pick(rand, MEASURE_POOL);
      const truth = rand() < 0.5;
      const q = truth ? it.q : pick(rand, ['个', '只', '条', '把', '张', '匹', '朵', '本', '支', '座', '颗', '双', '件', '头', '辆', '扇'].filter((x) => x !== it.q));
      return { prompt: withTag(ctx.tag, `“一${q}${it.n}”中的量词用得对吗？`), type: 'judge', answer: truth, explain: `“${it.n}”用“${it.q}”作量词。` };
    }
  },
  {
    ask: 'zh-word-kind', make(rand, ctx) {
      const it = pick(rand, WORD_POOL);
      const kinds = ['动作', '事物', '样子'];
      return { prompt: withTag(ctx.tag, `“${it.w}”属于下面哪一类？`), ...choiceOf(rand, it.c, kinds.filter((x) => x !== it.c)), explain: `“${it.w}”是表示${it.c}的词语。` };
    }
  },
  {
    ask: 'zh-word-syn-judge', make(rand, ctx) {
      const it = pick(rand, WORD_POOL);
      const truth = rand() < 0.5;
      const claim = truth ? it.syn : it.ant;
      return { prompt: withTag(ctx.tag, `“${it.w}”和“${claim}”意思相近。这句话对吗？`), type: 'judge', answer: truth, explain: `“${it.w}”的近义词是“${it.syn}”，反义词是“${it.ant}”。` };
    }
  }
];
