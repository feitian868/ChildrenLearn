/**
 * question-check.js —— 入库自动检查器（阶段 C）
 *
 * 4 条断言（新题必须全过；存量题库只扫描报告、不修改）：
 *   1. answer-not-in-stem   答案不泄漏在题干
 *   2. distractors-real     干扰项构造合规：选项互异、与正确项同类、非随机词
 *   3. difficulty-declared  难度挂在规格书的递增路径上（有规格书的单元才查）
 *   4. cognitive-variety    不只换数字：同知识点 ≥4 题时问法模板 ≥2 种（题库级）
 *
 * 断言 1/2/3 是单题级：checkQuestion(q, spec?) → 违规数组（空 = 通过）。
 * 断言 4 是题库级：checkBankVariety(questions, keyOf) → 违规数组。
 *
 * 注意：断言 1/2 是启发式检查（宁可漏报、不乱报），
 * 「干扰项是不是真实易错点」最终仍靠规格书 + 人工审核兜底。
 */

const NUM_LIKE = /^-?[\d./:]+(%|°)?$/;

function correctText(q) {
  if (q.type === 'choice') return String(q.options?.[q.answer] ?? '');
  return String(q.answer ?? '');
}

function escapeReg(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** 题干陈述部分：最后一个疑问句之前的部分（无问号则整段都是陈述） */
function statementOf(prompt) {
  const parts = String(prompt || '').split(/[？?]/);
  return parts.length > 1 ? parts.slice(0, -1).join('？') : String(prompt || '');
}

/* ------------------------- 断言 1：答案不泄漏在题干 ------------------------- */

// 标点/空白：取「正确项紧邻的断言片段」时在这些字符处截断
const PUNCT = new Set([...'。，、；：？！“”‘’「」『』()（）,.;:!?\'" \n\t']);
const MARKERS = ['最', '是', '等于', '共有', '有'];

function segmentAfter(statement, idx) {
  let seg = '';
  for (let i = idx; i < statement.length; i++) {
    if (PUNCT.has(statement[i])) break;
    seg += statement[i];
  }
  return seg;
}
function segmentBefore(statement, idx) {
  let seg = '';
  for (let i = idx - 1; i >= 0; i--) {
    if (PUNCT.has(statement[i])) break;
    seg = statement[i] + seg;
  }
  return seg;
}
/** 片段里有没有「肯定式」断言词（「不是/没有」这类否定不算） */
function hasAffirmMarker(seg) {
  for (const m of MARKERS) {
    let i = seg.indexOf(m);
    while (i !== -1) {
      const prev = i > 0 ? seg[i - 1] : '';
      if (prev !== '不' && prev !== '没') return true;
      i = seg.indexOf(m, i + 1);
    }
  }
  return false;
}

function checkAnswerLeak(q) {
  const violations = [];
  const type = q.type || 'input';
  // judge / match / order 的题干形式特殊（判断题本来就把说法摆出来），不做泄漏判定
  if (type === 'judge' || type === 'match' || type === 'order') return violations;
  const correct = correctText(q);
  const statement = statementOf(q.prompt);
  if (!correct) return violations;

  if (type === 'choice') {
    // 选择题：正确项出现在题干陈述句中，且被紧邻的断言词（最/是/等于/共有）直接陈述，
    // 判定「题干已经把答案说出来了」。
    // 命中例：「三人比高矮：小华最高，小强最矮。谁最高？」→「小华」紧邻「最高」。
    // 排除例：「是双数还是单数」「甲不是第一名」「“水”的偏旁是什么」——
    //   二选一列举 / 否定陈述 / 标点隔开都不算泄漏。
    if (correct.length < 1 || !statement.includes(correct)) return violations;
    const options = Array.isArray(q.options) ? q.options.map(String) : [];
    const inStem = options.filter((o) => o && statement.includes(o));
    if (/还是|或是|或者/.test(statement) && inStem.length >= 2) return violations;
    for (let idx = statement.indexOf(correct); idx !== -1; idx = statement.indexOf(correct, idx + 1)) {
      const after = segmentAfter(statement, idx + correct.length);
      const before = segmentBefore(statement, idx);
      if (hasAffirmMarker(after) || hasAffirmMarker(before)) {
        violations.push({ rule: 'answer-not-in-stem', detail: `正确项「${correct}」在题干陈述句中被直接断言（…${before}${correct}${after}…）` });
        break;
      }
    }
    return violations;
  }

  // 填空题：答案以「= / 得 / 是 / 等于 X」的形式已写在题干里
  // （数字答案要求后面不接数字/小数点；文字答案要求长度 ≥2 避免单字误伤）
  const isNum = NUM_LIKE.test(correct);
  if (isNum || correct.length >= 2) {
    const tail = isNum ? '(?![\\d./])' : '(?![\\u4e00-\\u9fa5])';
    const re = new RegExp(`(=|＝|得|是|等于)\\s*${escapeReg(correct)}${tail}`);
    if (re.test(statement)) {
      violations.push({ rule: 'answer-not-in-stem', detail: `答案「${correct}」已在题干中以「= / 得 / 是」形式给出` });
    }
  }
  return violations;
}

/* ------------------------- 断言 2：干扰项构造合规 ------------------------- */

/** 把选项归一成数值（整数/小数/分数），非数值返回 null */
function numericValue(s) {
  const t = String(s).trim();
  if (/^-?\d+(\.\d+)?$/.test(t)) return Number(t);
  const m = t.match(/^-?(\d+)\/(\d+)$/);
  if (m) return Number(m[1]) / Number(m[2]);
  return null;
}

function checkDistractors(q) {
  const violations = [];
  if (q.type !== 'choice') return violations;
  const options = Array.isArray(q.options) ? q.options.map(String) : [];
  const correct = correctText(q);
  if (options.length < 3) violations.push({ rule: 'distractors-real', detail: `选项只有 ${options.length} 个（至少 3 个）` });
  if (!(q.answer >= 0 && q.answer < options.length)) violations.push({ rule: 'distractors-real', detail: '正确项索引越界' });
  if (new Set(options).size !== options.length) violations.push({ rule: 'distractors-real', detail: '选项有重复' });
  if (options.some((o) => !o || o.length > 60)) violations.push({ rule: 'distractors-real', detail: '存在空选项或异常超长选项（>60 字符，疑似随机词）' });
  // 类型一致：正确项是数（含分数/比/百分数），干扰项必须也是数；正确项是文字，干扰项不许是裸数
  const correctNum = NUM_LIKE.test(correct);
  const bad = options.filter((o) => NUM_LIKE.test(o) !== correctNum);
  if (bad.length) {
    violations.push({ rule: 'distractors-real', detail: `干扰项与正确项类型不一致：${bad.join('、')}（疑似随机词）` });
  }
  // 同义干扰项：与正确项数值等价（7 vs 7.0、1/2 vs 2/4）或文本仅差空格/标点，等于没有干扰
  const cv = numericValue(correct);
  const same = options.filter((o) => {
    if (o === correct) return false;
    if (cv !== null && numericValue(o) === cv) return true;
    const norm = (x) => String(x).replace(/[\s，,。.、；;：:（）()“”"']/g, '');
    return norm(o) === norm(correct);
  });
  if (same.length) {
    violations.push({ rule: 'distractors-real', detail: `同义干扰项「${same.join('、')}」与正确项等价，不构成干扰` });
  }
  return violations;
}

/* ------------------------- 断言 5：解析与答案一致 ------------------------- */

/**
 * 解析里出现「a op b = c」算式、且通篇没有再写出答案本身时，c 必须等于答案。
 * 只要解析任何位置写出了正确答案，就视为分步讲解，不判（避免中间步骤误伤）。
 */
function checkExplainConsistent(q) {
  const violations = [];
  const explain = String(q.explain || '');
  const correct = correctText(q);
  const cv = numericValue(correct);
  if (!explain || cv === null) return violations;

  // 只认「a op b = c」型算式，且两个操作数必须原样出现在题干里；
  // 这样「先凑十/先算中间数/去小数点」这类教学步骤不会被误判。
  const eqs = [...explain.matchAll(/(\d+(?:\.\d+)?)\s*([×x*+\-÷/])\s*(\d+(?:\.\d+)?)\s*[=＝]\s*(-?\d+(?:\.\d+)?)/g)];
  if (!eqs.length) return violations;
  // 解析里出现答案原文（含分数 9/5 这类）或写出了正确的数值 → 分步讲解，不判
  if (correct && explain.includes(correct)) return violations;
  const nums = [...explain.matchAll(/\d+(?:\.\d+)?/g)].map((m) => Number(m[0]));
  if (nums.some((n) => Math.abs(n - cv) < 1e-9)) return violations;
  const stem = String(q.prompt || '').replace(/\s+/g, '');
  const [aKey, op, bKey, resultKey] = [eqs[0][1], eqs[0][2], eqs[0][3], eqs[0][4]];
  if (!stem.includes(aKey) || !stem.includes(bKey)) return violations;
  if (Math.abs(Number(resultKey) - cv) > 1e-9) {
    violations.push({ rule: 'explain-consistent', detail: `解析算式 ${aKey}${op}${bKey}=${resultKey} 与答案 ${correct} 不一致` });
  }
  return violations;
}

/* ------------------------- 断言 3：难度挂在规格书路径上 ------------------------- */

function checkDifficulty(q, spec) {
  const violations = [];
  if (!spec) return violations; // 该单元没写规格书示范，不查（不推断）
  const levels = (spec.difficultyPath || []).map((d) => d.level);
  if (levels.length && !levels.includes(q.level)) {
    violations.push({ rule: 'difficulty-declared', detail: `level ${q.level} 不在难度递增路径 [${levels.join(', ')}] 内` });
  }
  if (q.askPattern && !(spec.askPatterns || []).some((p) => p.id === q.askPattern)) {
    violations.push({ rule: 'difficulty-declared', detail: `askPattern「${q.askPattern}」未在规格书 askPatterns 里声明` });
  }
  return violations;
}

/** 单题检查：返回违规数组（空 = 通过）。spec 为该单元规格书（可空） */
export function checkQuestion(q, spec = null) {
  return [
    ...checkAnswerLeak(q),
    ...checkDistractors(q),
    ...checkDifficulty(q, spec),
    ...checkExplainConsistent(q)
  ];
}

/**
 * 组级检查：新题必须覆盖规格书的难度递增路径（至少 2 个不同 level），
 * 防止「只换数字、难度没升档」。返回违规数组（空 = 通过）。
 */
export function checkSetProgression(questions, spec = null) {
  const violations = [];
  if (!spec || !(spec.difficultyPath || []).length) return violations;
  const levels = (questions || []).map((q) => q.level).filter((l) => l !== undefined);
  if (levels.length && new Set(levels).size < 2) {
    violations.push({ rule: 'difficulty-progression', detail: `整批题难度都停在 level ${levels[0]}，没有升档` });
  }
  return violations;
}

/* ------------------------- 断言 4：不只换数字（题库级） ------------------------- */

/** 问法模板：数字脱敏后的题干 + 题型（与 tasks.js 的 templateKey 同思路） */
export function templateOf(q) {
  return `${q.type || 'input'}|${String(q.prompt || '').replace(/\d+(\.\d+)?/g, '#')}`;
}

/**
 * 题库级检查：按 groupOf(q) 分组（通常返回 knowledgeId 或「科目|topic」），
 * 组内 ≥minCount 道题、但问法模板只有 1 种 → 「只换数字不改认知层级」。
 * 返回 [{ rule, group, count, template }]。
 */
export function checkBankVariety(questions, groupOf, minCount = 4) {
  const groups = new Map();
  (questions || []).forEach((q) => {
    const g = groupOf(q);
    if (!g) return;
    if (!groups.has(g)) groups.set(g, []);
    groups.get(g).push(q);
  });
  const violations = [];
  for (const [group, list] of groups) {
    if (list.length < minCount) continue;
    const templates = new Set(list.map(templateOf));
    if (templates.size < 2) {
      violations.push({
        rule: 'cognitive-variety',
        group,
        count: list.length,
        template: list[0].prompt
      });
    }
  }
  return violations;
}

/** 题库级 1/2/3 断言汇总：返回 [{ id, prompt, violations }]（只含有违规的题） */
export function scanBank(questions, specOfQ = () => null) {
  const bad = [];
  (questions || []).forEach((q) => {
    const violations = checkQuestion(q, specOfQ(q));
    if (violations.length) {
      bad.push({
        id: q.id || q.templateId || '(no id)',
        prompt: q.prompt,
        source: q.source || '',
        violations
      });
    }
  });
  return bad;
}
