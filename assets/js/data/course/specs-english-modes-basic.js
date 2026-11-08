/**
 * specs-english-modes-basic.js —— 词汇 / 拼写 / 语音 三族的 12 外壳
 *
 * 每个外壳返回 { prompt, type, options, answer, explain, level }；
 * 题干统一带【Unit N·册次】前缀，保证同一 grade 内不同单元题面不重复。
 */

import { randInt, pick, sample, shuffle } from '../../core/rng.js';
import {
  EN_WORDS, EN_CATS, EN_CONTEXTS, RHYME_SETS, DIGRAPH_BANK, BLEND_BANK,
  SILENT_E, SOUND_E, LETTER_SOUNDS, FORMS_BANK, PLURAL_BANK,
  CAPITAL_BANK, UPPER_BANK
} from './specs-english-data.js';
import { choiceOf, vowelsOf, vowelCountOf, syllableCount, distinctLetters, blankOut } from './specs-english-util.js';

const p = (ctx, text) => `【${ctx.tag}】${text}`;
const catPool = (cat) => EN_WORDS.filter((w) => w.cat === cat);
const otherCat = (rand, cats, cat, n = 3) => sample(rand, cats.filter((c) => c !== cat), n);
const wordPool = (cat, exclude) => EN_WORDS.filter((w) => w.cat === cat && w.en !== exclude);

function numChoice(rand, correct, meta) {
  const vals = [];
  for (const v of [correct, correct + 1, correct + 2, Math.max(1, correct - 1), correct + 3]) {
    if (v >= 1 && !vals.includes(v)) vals.push(v);
  }
  const picked = vals.slice(0, 4);
  const options = shuffle(rand, picked.map(String));
  return { ...meta, type: 'choice', options, answer: options.indexOf(String(correct)) };
}

function corruptions(word) {
  const out = [];
  const chars = word.split('');
  if (chars.length < 4) return out;
  const swap = chars.slice();
  [swap[0], swap[1]] = [swap[1], swap[0]];
  out.push(swap.join(''));
  out.push(word.slice(0, 1) + word.slice(2));
  out.push(word.slice(0, -1));
  out.push(word + word.slice(-1));
  return out.filter((w, i, a) => w !== word && a.indexOf(w) === i);
}

/* ============================ 词汇族 ============================ */

export const EN_WORD_MODES = [
  {
    level: 1, ask: '词义（英→中）',
    make(rand, ctx) {
      const w = pick(rand, EN_WORDS);
      const wrongs = sample(rand, EN_WORDS.filter((x) => x.zh !== w.zh).map((x) => x.zh), 3);
      return choiceOf(rand, w.zh, wrongs, {
        prompt: p(ctx, `“${w.en}”是什么意思？`),
        explain: `${w.en} 的意思是“${w.zh}”。`, level: 1
      });
    }
  },
  {
    level: 1, ask: '词义（中→英）',
    make(rand, ctx) {
      const w = pick(rand, EN_WORDS);
      const wrongs = sample(rand, EN_WORDS.filter((x) => x.en !== w.en).map((x) => x.en), 3);
      return choiceOf(rand, w.en, wrongs, {
        prompt: p(ctx, `“${w.zh}”用英语怎么说？`),
        explain: `“${w.zh}”的英文是 ${w.en}。`, level: 1
      });
    }
  },
  {
    level: 1, ask: '词义判断',
    make(rand, ctx) {
      const w = pick(rand, EN_WORDS);
      const truth = rand() < 0.5;
      const shot = truth ? w.zh : pick(rand, EN_WORDS.filter((x) => x.zh !== w.zh)).zh;
      return {
        prompt: p(ctx, `“${w.en}”的意思是“${shot}”。这句话对吗？`),
        type: 'judge', answer: truth,
        explain: `${w.en} 的意思是“${w.zh}”。`, level: 1
      };
    }
  },
  {
    level: 2, ask: '语境词义',
    make(rand, ctx) {
      const c = pick(rand, EN_CONTEXTS);
      const wrongs = sample(rand, EN_WORDS.filter((x) => x.zh !== c.zh).map((x) => x.zh), 3);
      return choiceOf(rand, c.zh, wrongs, {
        prompt: p(ctx, `句子“${c.s}”中“${c.word}”是什么意思？`),
        explain: `${c.s} 的意思是“……${c.zh}……”。`, level: 2
      });
    }
  },
  {
    level: 2, ask: '词类归属',
    make(rand, ctx) {
      const w = pick(rand, EN_WORDS);
      return choiceOf(rand, w.cat, otherCat(rand, EN_CATS, w.cat, 3), {
        prompt: p(ctx, `“${w.en}”属于下面哪一类？`),
        explain: `${w.en}（${w.zh}）属于“${w.cat}”类。`, level: 2
      });
    }
  },
  {
    level: 2, ask: '同类词',
    make(rand, ctx) {
      const w = pick(rand, EN_WORDS);
      const same = wordPool(w.cat, w.en);
      if (same.length < 1) return null;
      const correct = pick(rand, same).en;
      const wrongs = sample(rand, EN_WORDS.filter((x) => x.cat !== w.cat).map((x) => x.en), 3);
      return choiceOf(rand, correct, wrongs, {
        prompt: p(ctx, `下面哪个单词和“${w.en}”属于同一类？`),
        explain: `${w.en} 和 ${correct} 都属于“${w.cat}”类。`, level: 2
      });
    }
  },
  {
    level: 2, ask: '找不同类',
    make(rand, ctx) {
      const cats = EN_CATS.filter((c) => catPool(c).length >= 4);
      const cat = pick(rand, cats);
      const oddCat = pick(rand, EN_CATS.filter((c) => c !== cat));
      const three = sample(rand, catPool(cat).map((w) => w.en), 3);
      const odd = pick(rand, catPool(oddCat)).en;
      return choiceOf(rand, odd, three, {
        prompt: p(ctx, `下面哪个单词和其他三个不是同一类？`),
        explain: `${odd} 属于“${oddCat}”类，另外三个属于“${cat}”类。`, level: 2
      });
    }
  },
  {
    level: 2, ask: '同类判断',
    make(rand, ctx) {
      const a = pick(rand, EN_WORDS);
      const same = rand() < 0.5;
      const b = same ? pick(rand, EN_WORDS.filter((x) => x.cat === a.cat && x.en !== a.en))
        : pick(rand, EN_WORDS.filter((x) => x.cat !== a.cat));
      return {
        prompt: p(ctx, `“${a.en}”和“${b.en}”是同一类单词吗？`),
        type: 'judge', answer: a.cat === b.cat,
        explain: `${a.en} 属于“${a.cat}”类，${b.en} 属于“${b.cat}”类。`, level: 2
      };
    }
  },
  {
    level: 2, ask: '补全单词',
    make(rand, ctx) {
      const w = pick(rand, EN_WORDS.filter((x) => x.en.length >= 4));
      const chars = w.en.split('');
      const idxs = chars.map((c, i) => (c !== '_' && chars.indexOf(c) === i ? i : -1)).filter((i) => i >= 0 && i > 0 && i < chars.length - 1);
      if (idxs.length < 1) return null;
      const at = pick(rand, idxs);
      const letter = chars[at];
      const masked = chars.map((c, i) => (i === at ? '_' : c)).join('');
      return choiceOf(rand, letter, distinctLetters(rand, letter, 3), {
        prompt: p(ctx, `单词“${masked}”（${w.zh}）缺少的字母是？`),
        explain: `完整单词是 ${w.en}，缺的是字母 ${letter}。`, level: 2
      });
    }
  },
  {
    level: 2, ask: '正确拼写',
    make(rand, ctx) {
      const w = pick(rand, EN_WORDS.filter((x) => x.en.length >= 4));
      const wrongs = corruptions(w.en);
      if (wrongs.length < 3) return null;
      return choiceOf(rand, w.en, wrongs, {
        prompt: p(ctx, `下面哪个是“${w.zh}”的正确拼写？`),
        explain: `“${w.zh}”拼写为 ${w.en}。`, level: 2
      });
    }
  },
  {
    level: 2, ask: '元音个数',
    make(rand, ctx) {
      const w = pick(rand, EN_WORDS.filter((x) => x.en.length >= 3));
      const n = vowelCountOf(w.en);
      return numChoice(rand, n, {
        prompt: p(ctx, `单词“${w.en}”中有几个元音字母？`),
        explain: `${w.en} 中有 ${n} 个元音字母。`, level: 2
      });
    }
  },
  {
    level: 1, ask: '首字母',
    make(rand, ctx) {
      const w = pick(rand, EN_WORDS);
      const letter = w.en[0];
      return choiceOf(rand, letter, distinctLetters(rand, letter, 3), {
        prompt: p(ctx, `单词“${w.en}”的第一个字母是？`),
        explain: `${w.en} 的第一个字母是 ${letter}。`, level: 1
      });
    }
  }
];

/* ============================ 拼写族 ============================ */

export const EN_SPELLING_MODES = [
  {
    level: 1, ask: '首字母',
    make(rand, ctx) {
      const w = pick(rand, EN_WORDS);
      const letter = w.en[0];
      return choiceOf(rand, letter, distinctLetters(rand, letter, 3), {
        prompt: p(ctx, `单词“${w.en}”由哪个字母开头？`),
        explain: `${w.en} 以 ${letter} 开头。`, level: 1
      });
    }
  },
  {
    level: 1, ask: '尾字母',
    make(rand, ctx) {
      const w = pick(rand, EN_WORDS);
      const letter = w.en[w.en.length - 1];
      return choiceOf(rand, letter, distinctLetters(rand, letter, 3), {
        prompt: p(ctx, `单词“${w.en}”由哪个字母结尾？`),
        explain: `${w.en} 以 ${letter} 结尾。`, level: 1
      });
    }
  },
  {
    level: 1, ask: '字母个数',
    make(rand, ctx) {
      const w = pick(rand, EN_WORDS);
      const n = w.en.length;
      return numChoice(rand, n, {
        prompt: p(ctx, `单词“${w.en}”一共有几个字母？`),
        explain: `${w.en} 由 ${n} 个字母组成。`, level: 1
      });
    }
  },
  {
    level: 2, ask: '补全单词',
    make(rand, ctx) {
      const w = pick(rand, EN_WORDS.filter((x) => x.en.length >= 4));
      const chars = w.en.split('');
      const idxs = chars.map((c, i) => (chars.indexOf(c) === i ? i : -1)).filter((i) => i >= 0 && i > 0 && i < chars.length - 1);
      if (idxs.length < 1) return null;
      const at = pick(rand, idxs);
      const letter = chars[at];
      const masked = chars.map((c, i) => (i === at ? '_' : c)).join('');
      return choiceOf(rand, letter, distinctLetters(rand, letter, 3), {
        prompt: p(ctx, `补全单词：${masked}（${w.zh}），横线处应填？`),
        explain: `完整单词是 ${w.en}，缺的是字母 ${letter}。`, level: 2
      });
    }
  },
  {
    level: 2, ask: '正确拼写',
    make(rand, ctx) {
      const w = pick(rand, EN_WORDS.filter((x) => x.en.length >= 4));
      const wrongs = corruptions(w.en);
      if (wrongs.length < 3) return null;
      return choiceOf(rand, w.en, wrongs, {
        prompt: p(ctx, `“${w.zh}”的正确拼写是哪一个？`),
        explain: `“${w.zh}”的拼写是 ${w.en}。`, level: 2
      });
    }
  },
  {
    level: 2, ask: '全大写',
    make(rand, ctx) {
      const w = pick(rand, UPPER_BANK);
      const cap = w[0].toUpperCase() + w.slice(1);
      return choiceOf(rand, w.toUpperCase(), [w, cap, cap + 'e'], {
        prompt: p(ctx, `单词“${w}”写成全大写是？`),
        explain: `${w} 的全大写形式是 ${w.toUpperCase()}。`, level: 2
      });
    }
  },
  {
    level: 2, ask: '句首大写',
    make(rand, ctx) {
      const w = pick(rand, UPPER_BANK);
      const cap = w[0].toUpperCase() + w.slice(1);
      return choiceOf(rand, cap, [w, w.toUpperCase(), w.slice(1)], {
        prompt: p(ctx, `“${w}”放在句首时，正确写法是？`),
        explain: `句首单词首字母要大写，应写成 ${cap}。`, level: 2
      });
    }
  },
  {
    level: 2, ask: '元音个数',
    make(rand, ctx) {
      const w = pick(rand, EN_WORDS.filter((x) => x.en.length >= 3));
      const n = vowelCountOf(w.en);
      return numChoice(rand, n, {
        prompt: p(ctx, `单词“${w.en}”中的元音字母有几个？`),
        explain: `${w.en} 中有 ${n} 个元音字母。`, level: 2
      });
    }
  },
  {
    level: 3, ask: '复数形式',
    make(rand, ctx) {
      const it = pick(rand, PLURAL_BANK);
      const wrongs = [
        it.en, `${it.pl}s`, `${it.pl}es`, `${it.en}s`, `${it.en}es`
      ];
      return choiceOf(rand, it.pl, wrongs, {
        prompt: p(ctx, `“${it.zh}”的复数形式是？`),
        explain: `${it.en} 的复数形式是 ${it.pl}。`, level: 3
      });
    }
  },
  {
    level: 3, ask: '第三人称单数',
    make(rand, ctx) {
      const it = pick(rand, FORMS_BANK);
      const wrongs = [it.en, `${it.en}s`, `${it.en}es`, `${it.en}ies`, it.ing];
      return choiceOf(rand, it.third, wrongs, {
        prompt: p(ctx, `动词“${it.en}”（${it.zh}）的第三人称单数形式是？`),
        explain: `${it.en} 的第三人称单数是 ${it.third}。`, level: 3
      });
    }
  },
  {
    level: 3, ask: '现在分词',
    make(rand, ctx) {
      const it = pick(rand, FORMS_BANK);
      const wrongs = [it.en, `${it.en}ing`, `${it.en}ed`, it.third];
      return choiceOf(rand, it.ing, wrongs, {
        prompt: p(ctx, `动词“${it.en}”（${it.zh}）的现在分词形式是？`),
        explain: `${it.en} 的现在分词是 ${it.ing}。`, level: 3
      });
    }
  },
  {
    level: 3, ask: '过去式',
    make(rand, ctx) {
      const it = pick(rand, FORMS_BANK);
      const wrongs = [it.en, `${it.en}ed`, `${it.en}d`, it.ing];
      return choiceOf(rand, it.past, wrongs, {
        prompt: p(ctx, `动词“${it.en}”（${it.zh}）的过去式是？`),
        explain: `${it.en} 的过去式是 ${it.past}。`, level: 3
      });
    }
  }
];

/* ============================ 语音族 ============================ */

const PH_WORDS = [...EN_WORDS.map((w) => w.en), ...BLEND_BANK.map((b) => b.en), ...DIGRAPH_BANK.map((d) => d.en)];
const UNIQ_PH = [...new Set(PH_WORDS)];

export const EN_PHONICS_MODES = [
  {
    level: 1, ask: '首字母',
    make(rand, ctx) {
      const w = pick(rand, EN_WORDS);
      const letter = w.en[0];
      return choiceOf(rand, letter, distinctLetters(rand, letter, 3), {
        prompt: p(ctx, `单词“${w.en}”的首字母是？`),
        explain: `${w.en} 的首字母是 ${letter}。`, level: 1
      });
    }
  },
  {
    level: 2, ask: '相同首音',
    make(rand, ctx) {
      const w = pick(rand, EN_WORDS);
      const initial = w.en[0];
      const same = UNIQ_PH.filter((x) => x[0] === initial && x !== w.en);
      if (same.length < 1) return null;
      const correct = pick(rand, same);
      const wrongs = sample(rand, UNIQ_PH.filter((x) => x[0] !== initial), 3);
      return choiceOf(rand, correct, wrongs, {
        prompt: p(ctx, `下面哪个单词和“${w.en}”开头读音相同？`),
        explain: `${w.en} 和 ${correct} 都以 ${initial} 开头。`, level: 2
      });
    }
  },
  {
    level: 2, ask: '相同尾字母',
    make(rand, ctx) {
      const w = pick(rand, EN_WORDS);
      const tail = w.en[w.en.length - 1];
      const same = UNIQ_PH.filter((x) => x[x.length - 1] === tail && x !== w.en);
      if (same.length < 1) return null;
      const correct = pick(rand, same);
      const wrongs = sample(rand, UNIQ_PH.filter((x) => x[x.length - 1] !== tail), 3);
      return choiceOf(rand, correct, wrongs, {
        prompt: p(ctx, `下面哪个单词和“${w.en}”结尾字母相同？`),
        explain: `${w.en} 和 ${correct} 都以 ${tail} 结尾。`, level: 2
      });
    }
  },
  {
    level: 2, ask: '元音字母',
    make(rand, ctx) {
      const w = pick(rand, EN_WORDS.filter((x) => vowelsOf(x.en).length === 1));
      if (!w) return null;
      const v = vowelsOf(w.en)[0];
      const wrongs = sample(rand, [...'aeiou'].filter((c) => c !== v), 3);
      return choiceOf(rand, v, wrongs, {
        prompt: p(ctx, `单词“${w.en}”中的元音字母是？`),
        explain: `${w.en} 中的元音字母是 ${v}。`, level: 2
      });
    }
  },
  {
    level: 2, ask: '音节数',
    make(rand, ctx) {
      const w = pick(rand, EN_WORDS);
      const n = syllableCount(w.en);
      return numChoice(rand, n, {
        prompt: p(ctx, `单词“${w.en}”有几个音节？`),
        explain: `${w.en} 有 ${n} 个音节。`, level: 2
      });
    }
  },
  {
    level: 2, ask: '押韵',
    make(rand, ctx) {
      const set = pick(rand, RHYME_SETS);
      const target = pick(rand, set);
      const partner = pick(rand, set.filter((x) => x !== target));
      const wrongs = sample(rand, UNIQ_PH.filter((x) => !set.includes(x)), 3);
      return choiceOf(rand, partner, wrongs, {
        prompt: p(ctx, `下面哪个单词和“${target}”押韵？`),
        explain: `${target} 和 ${partner} 押韵。`, level: 2
      });
    }
  },
  {
    level: 2, ask: '字母组合',
    make(rand, ctx) {
      const dgs = [...new Set(DIGRAPH_BANK.map((d) => d.dg))];
      const dg = pick(rand, dgs);
      const good = DIGRAPH_BANK.filter((d) => d.dg === dg);
      const correct = pick(rand, good).en;
      const wrongs = sample(rand, UNIQ_PH.filter((x) => !x.includes(dg)), 3);
      return choiceOf(rand, correct, wrongs, {
        prompt: p(ctx, `下面哪个单词含有字母组合 ${dg}？`),
        explain: `${correct} 中含有字母组合 ${dg}。`, level: 2
      });
    }
  },
  {
    level: 2, ask: '不发音的 e',
    make(rand, ctx) {
      const silent = rand() < 0.5;
      const w = silent ? pick(rand, SILENT_E) : pick(rand, SOUND_E);
      return {
        prompt: p(ctx, `单词“${w}”结尾的字母 e 要发音。这句话对吗？`),
        type: 'judge', answer: !silent,
        explain: silent ? `${w} 结尾的 e 不发音。` : `${w} 结尾的 e 要发音。`, level: 2
      };
    }
  },
  {
    level: 2, ask: '起始字母组合',
    make(rand, ctx) {
      const it = pick(rand, BLEND_BANK);
      const blends = [...new Set(BLEND_BANK.map((b) => b.blend))];
      const wrongs = sample(rand, blends.filter((b) => b !== it.blend), 3);
      return choiceOf(rand, it.blend, wrongs, {
        prompt: p(ctx, `单词“${it.en}”以哪两个字母开头？`),
        explain: `${it.en} 以 ${it.blend} 开头。`, level: 2
      });
    }
  },
  {
    level: 3, ask: '字母组合发音',
    make(rand, ctx) {
      const it = pick(rand, LETTER_SOUNDS);
      const wrongs = sample(rand, LETTER_SOUNDS.filter((x) => x.sound !== it.sound).map((x) => x.sound), 3);
      return choiceOf(rand, it.sound, wrongs, {
        prompt: p(ctx, `字母组合 ${it.letters} 通常发什么音？`),
        explain: `${it.letters} 通常发 ${it.sound}。`, level: 3
      });
    }
  },
  {
    level: 2, ask: '字母组合判断',
    make(rand, ctx) {
      const dgs = [...new Set(DIGRAPH_BANK.map((d) => d.dg))];
      const dg = pick(rand, dgs);
      const truth = rand() < 0.5;
      const w = truth ? pick(rand, DIGRAPH_BANK.filter((d) => d.dg === dg)).en
        : pick(rand, UNIQ_PH.filter((x) => !x.includes(dg)));
      return {
        prompt: p(ctx, `单词“${w}”中含有字母组合 ${dg}。这句话对吗？`),
        type: 'judge', answer: w.includes(dg),
        explain: w.includes(dg) ? `${w} 中含有 ${dg}。` : `${w} 中不含 ${dg}。`, level: 2
      };
    }
  },
  {
    level: 2, ask: '元音个数',
    make(rand, ctx) {
      const w = pick(rand, EN_WORDS);
      const n = vowelCountOf(w.en);
      return numChoice(rand, n, {
        prompt: p(ctx, `单词“${w.en}”里有几个元音字母？`),
        explain: `${w.en} 中有 ${n} 个元音字母。`, level: 2
      });
    }
  }
];
