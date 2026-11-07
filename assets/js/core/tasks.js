/**
 * tasks.js —— 每日任务生成
 * 同一天、同一年级生成的任务固定（刷新不会变），跨天自动换新。
 * 每科 2~3 项，每项 4 题，且至少包含 1 道 level 2 题。
 *
 * 防重复：近 365 天做过的题优先回避（recentByDay 按日期分组的签名数组），
 * 池子耗尽时按「最久没做过」兜底轮换，保证永远能出满题。
 * 难度递进：按近 7 天首答正确率自适应——
 *   正确率 ≥85% → 3 道挑战题 + 1 道「跨级拔高题」（高一年级，六年级则全挑战题）；
 *   ≥60% → 3 道挑战题；其余 → 2 道挑战题。
 */

import * as store from './store.js';
import { hashString, mulberry32, shuffle, sig24 } from '../core/rng.js';
import {
  PASS_LINE,
  QUESTIONS_PER_TASK,
  focusOf,
  passLineFor,
  taskCountFor
} from '../data/curriculum.js';
import { CHINESE_BANK, chineseGenerated } from '../data/knowledge-chinese.js';
import { ENGLISH_BANK, englishGenerated } from '../data/knowledge-english.js';
import { SCIENCE_BANK, scienceGenerated } from '../data/knowledge-science.js';
import { mathPool } from '../data/knowledge-math.js';
import { logicPool } from '../data/knowledge-logic.js';
import {
  annotateQuestion,
  courseScope
} from '../data/course-map.js';
// 阶段 B：掌握度 / 间隔复习 / 薄弱知识点加权（只影响排序，不改题量与常数）
import {
  knowledgeIdOf,
  weakKeysOf,
  dueReviewCandidates,
  commitReview
} from './mastery.js';

const STATIC_BANKS = {
  chinese: CHINESE_BANK,
  english: ENGLISH_BANK,
  science: SCIENCE_BANK
};

/** 每日参数化生成器：静态题库之外，每天再生成一批新题 */
const GENERATORS = {
  chinese: chineseGenerated,
  english: englishGenerated,
  science: scienceGenerated
};

const AVOID_DAYS = 365;       // 同一道题（题面+选项完全一致）365 天内不重复
const COOLDOWN_DAYS = 10;     // 同一知识点至少间隔 10 天再考
const ADAPT_DAYS = 7;         // 自适应看近 7 天首答正确率
const MAX_TEMPLATE_PER_DAY = 2; // 同一种问法当天最多出现 2 次（不做硬禁止，避免抽空题池导致旧题兜底）
const MAX_LOGIC_PER_TASK = 2;   // 每项任务最多 2 道逻辑/场景题，保证基础题不被挤光
const MAX_REVIEW_PER_TASK = 2;  // 每项任务最多 2 道间隔复习题，保证新内容仍占一半以上

const poolCache = new Map();

/**
 * 阶段 C：status:'pending-review' 的生成题默认【不进抽题池】，
 * 只有家长在工作台审核为 approved（写入 data.questionReview[id]）后才可见。
 * rejected / 未审核一律排除；复习变式与小测走同一过滤，保证口径一致。
 */
function approvedSetOf(data) {
  return new Set(
    Object.entries(data?.questionReview || {})
      .filter(([, v]) => v === 'approved')
      .map(([k]) => k)
  );
}

function visiblePool(pool, approved) {
  return pool.filter((q) => q.status !== 'pending-review' || approved.has(q.id));
}

/** 阶段 B：把薄弱知识点排到题池前面（真正的随机化随后在 pickQuestions 内按组打散） */
function rankWeak(pool, weakSet) {
  if (!weakSet || !weakSet.size) return pool;
  return pool
    .map((q, i) => ({
      q,
      i,
      weak: weakSet.has(knowledgeIdOf(q)) ? 0 : 1
    }))
    .sort((a, b) => (a.weak - b.weak) || (a.i - b.i))
    .map((x) => x.q);
}

function getPool(subject, grade, rng, dayKey = '', weakSet = null) {
  // 逻辑 / 生活场景题：用「日期 + 年级 + 科目 + logic」独立派生种子，
  // 完全不消耗原 rng 的随机序列，保证原有题目逐题可复现。
  const logic = logicPool(subject, grade,
    mulberry32(hashString(`${dayKey}:${grade}:${subject}:logic`)));
  // 数学题每次用同一日期种子重建，保证当天各科任务题目一致
  if (subject === 'math') {
    // includeSpec：规格题（默认 pending-review）随年级进池，
    // 是否可抽仍由下方 visiblePool + questionReview(approved) 决定。
    return rankWeak([...mathPool(grade, rng, { includeSpec: true }), ...logic], weakSet);
  }
  const cacheKey = `${subject}:${grade}`;
  if (!poolCache.has(cacheKey)) {
    poolCache.set(cacheKey, STATIC_BANKS[subject].filter((item) => item.grade === grade));
  }
  const staticPool = poolCache.get(cacheKey);
  const gen = GENERATORS[subject];
  // 生成题 id 由「题干+选项」内容哈希，知识点 key 用于冷却调度
  const pool = gen ? [...staticPool, ...gen(grade, rng), ...logic] : [...staticPool, ...logic];
  return rankWeak(pool, weakSet);
}

/** 掌握度弱项占比：review 态 kid / 有记录 kid（自适应第二信号） */
function weakRatioOf(data) {
  const recs = Object.values(data.mastery?.keys || {});
  if (!recs.length) return 0;
  return recs.filter((r) => r.status === 'review').length / recs.length;
}

/**
 * 难度档位：{ l2: 每项挑战题数, stretch: 是否配跨级拔高题 }
 * P1：年级 + 近 7 天正确率 + 掌握度弱项占比三信号。
 * 1~2 年级固定 2 道挑战题、不配拔高；3~6 年级保持 v4 的档位梯度。
 */
function adaptTarget(data, grade = 3) {
  const g = Number(grade) || 3;
  const today = store.todayKey();
  let correct = 0;
  let total = 0;
  for (let i = 1; i <= ADAPT_DAYS; i++) {
    const h = data.dailyHistory?.[store.shiftDateKey(today, -i)];
    if (h?.firstTry?.total) {
      correct += h.firstTry.correct;
      total += h.firstTry.total;
    }
  }
  // 无历史（新用户 / 刚换册）：用掌握度兜底，而不是一律最低档
  if (!total) {
    const recs = Object.values(data.mastery?.keys || {});
    if (recs.length >= 8) {
      const mastered = recs.filter((r) => r.status === 'mastered').length;
      if (mastered / recs.length >= 0.7) return { l2: g <= 2 ? 2 : 3, stretch: false };
    }
    return { l2: 2, stretch: false };
  }
  const acc = correct / total;
  if (g <= 2) return { l2: 2, stretch: false }; // 低年级不配拔高题
  if (acc >= 0.85) {
    // 正确率高且弱项不成片时才拔高：避免「整体正确率高、但一批 kid 还在 review」时继续加压
    return { l2: 3, stretch: weakRatioOf(data) < 0.6 };
  }
  if (acc >= 0.6) return { l2: 3, stretch: false };
  return { l2: 2, stretch: false };
}



export function pickQuestions(rng, pool, used, usedKeys, recent, l2t, dayKey, quota = QUESTIONS_PER_TASK, usedTemplates = new Map(), allowShort = false, review = [], weakSet = null, textbookFirst = false, passLine = PASS_LINE) {
  const avail = pool.filter((item) => !used.has(item.id));
  // 知识点冷却起点：key 在 COOLDOWN_DAYS 内考过，本轮先让位给别的知识点
  const coolFrom = store.shiftDateKey(dayKey, -COOLDOWN_DAYS);
  const keyHot = (item) => {
    if (!item.key) return '';
    const d = recent.keyDate(item.key);
    return d && d >= coolFrom ? d : '';
  };
  // 第一优先一定是「365 天内没出现过的题面」，冷却只是同档内的排序偏好，
  // 不能因为知识点冷却把已出过的题顶上来（否则会出现同年重复）。
  // 内容签名命中（跨年级同题，含拔高题用过的）也按「做过」处理。
  const seenAt = (item) => recent.seenAt(item);
  const unseen = avail.filter((item) => !seenAt(item));
  const seenBefore = avail
    .filter((item) => seenAt(item))
    .sort((a, b) => (seenAt(a) < seenAt(b) ? -1 : 1));
  const split = (list) => {
    // 阶段 B：薄弱知识点在「未做过 / 已冷却」两组里都排到前面，
    // 再在组内洗牌，保证既影响分布、又不会把同一天固定成同一道题。
    const weakShuffle = (arr) => {
      if (!weakSet || !weakSet.size) return shuffle(rng, arr);
      const weak = arr.filter((item) => weakSet.has(knowledgeIdOf(item)));
      const rest = arr.filter((item) => !weakSet.has(knowledgeIdOf(item)));
      return [...shuffle(rng, weak), ...shuffle(rng, rest)];
    };
    const fresh = weakShuffle(list.filter((item) => !keyHot(item)));
    const cool = weakShuffle(list.filter((item) => keyHot(item)));
    return { fresh, cool };
  };
  const l2 = split(unseen.filter((item) => item.level === 2));
  const l1 = split(unseen.filter((item) => item.level === 1));
  // 逻辑 / 场景题优先占位：只在同档内排到前面，不改配额、不改兜底顺序，
  // 因此不会破坏 365 天题面不重复，也不会让基础题被完全挤掉。
  // C 收尾（家长拍板 A）：课程收敛模式下反过来——教材题优先占位，逻辑题补空位。
  // 未配置教材的模式保持原样，防回归数字不变。
  const logicFirst = (list) => (textbookFirst
    ? [...list.filter((x) => x.category !== 'logic'), ...list.filter((x) => x.category === 'logic')]
    : [...list.filter((x) => x.category === 'logic'), ...list.filter((x) => x.category !== 'logic')]);
  l2.fresh = logicFirst(l2.fresh);
  l2.cool = logicFirst(l2.cool);
  l1.fresh = logicFirst(l1.fresh);
  l1.cool = logicFirst(l1.cool);

  // 收敛模式下给每项预留 1 个拓展位：教材题填满也不把逻辑题清空（仍受 MAX_LOGIC_PER_TASK 限制）
  const reserveLogic = textbookFirst && quota > passLine;
  const effQuota = reserveLogic ? quota - 1 : quota;

  const picked = [];
  let logicCount = 0;
  // 阶段 B：到期的错题变式优先占位，但仍受每项题量与拓展题上限约束
  let reviewCount = 0;
  review.forEach((q) => {
    if (picked.length >= quota || reviewCount >= MAX_REVIEW_PER_TASK) return;
    if (used.has(q.id) || picked.some((p) => p.id === q.id)) return;
    if (q.category === 'logic' && logicCount >= MAX_LOGIC_PER_TASK) return;
    picked.push(q);
    used.add(q.id); // 同一天多任务不能重复投放同一条复习变式
    reviewCount += 1;
    if (q.key) usedKeys.add(q.key);
    if (q.category === 'logic') logicCount += 1;
  });
  const take = (list, upTo, allowSameKey = false) => {
    for (const q of list) {
      if (picked.length >= upTo) break;
      if (picked.includes(q)) continue;
      // 同一天同一科目不重复考同一个知识点（兜底轮换时才允许复用）
      if (!allowSameKey && q.key && usedKeys.has(q.key)) continue;
      // 逻辑/场景题每项最多 MAX_LOGIC_PER_TASK 道；兜底阶段放行，保证能凑满。
      // 课程收敛模式（allowShort）下不放行：宁可当天题少，也不让拓展题挤掉教材题。
      if (q.category === 'logic' && logicCount >= MAX_LOGIC_PER_TASK && (allowShort || !allowSameKey)) continue;
      // 模板硬冷却：容量够时，当天不再出现同款问法；
      // 池子见底时（allowSameKey=true 的兜底分支）才放行，保证任务能凑满
      const tk = templateKey(q);
      if (!allowSameKey && (usedTemplates.get(tk) || 0) >= MAX_TEMPLATE_PER_DAY) continue;
      picked.push(q);
      if (q.key) usedKeys.add(q.key);
      if (q.category === 'logic') logicCount += 1;
      usedTemplates.set(tk, (usedTemplates.get(tk) || 0) + 1);
    }
  };

  take([...l2.fresh, ...l2.cool], Math.min(l2t, effQuota)); // 1. L2 配到目标数
  take([...l1.fresh, ...l1.cool], effQuota);                // 2. 没用过的 L1 补
  take([...l2.fresh, ...l2.cool], effQuota);                // 3. 不够先用没用过的 L2 补
  // 3.1 收敛模式：教材题先填满预留位，再补 1 道逻辑题，保证拓展不归零
  if (reserveLogic && picked.length < quota) {
    take(
      [...l2.fresh, ...l2.cool, ...l1.fresh, ...l1.cool].filter((q) => q.category === 'logic'),
      picked.length + 1
    );
  }
  // 3.5 模板上限抡住了未用过的题时：放宽上限，但坚持「未做过」，
  //     避免为凑数退到第 4 步拿旧题，破坏 365 天不重复
  if (picked.length < quota) {
    take([...l2.fresh, ...l2.cool, ...l1.fresh, ...l1.cool], quota, true);
  }
  // 4. 最后才用「最久未做」的旧题兜底；不分级别——365 天不重是硬约束，
  //    池子见底时宁可挑战题配比略降，也不能拿窗口内的旧 L2 造成重复
  take(seenBefore, quota, true);
  // 启用课程收敛时：题量不足也接受（不拿未学单元凑数），但每项不得低于达标线；
  // 拓展题严格受 MAX_LOGIC_PER_TASK 限制，不再有兜底放行的后门。
  if (picked.length < quota && (!allowShort || !picked.length)) return [];
  if (allowShort && picked.length < passLine) return [];
  picked.forEach((item) => used.add(item.id));
  return picked;
}

/**
 * 从高一（或同）年级题池抽 1 道拔高题：优先未出现过的 L2，
 * 成功返回带 stretch 标记的副本，抽不到返回 null。
 * ownSigs：本年级题池的内容签名，避免跨年级共用生成器时抽到与本年级完全相同的题。
 */
function pickStretch(rng, pool, used, usedKeys, recent, dayKey, ownSigs, usedTemplates) {
  const coolFrom = store.shiftDateKey(dayKey, -COOLDOWN_DAYS);
  const keyHot = (item) => {
    if (!item.key) return false;
    const d = recent.keyDate(item.key);
    return Boolean(d && d >= coolFrom);
  };
  const avail = pool.filter((item) => (
    !used.has(item.id) && !recent.seenQuestion(item) && !ownSigs.has(contentSig(item))
    && (usedTemplates.get(templateKey(item)) || 0) < MAX_TEMPLATE_PER_DAY
  ));
  const prefer = shuffle(rng, avail.filter((item) => (
    item.level === 2 && !keyHot(item) && !(item.key && usedKeys.has(item.key))
  )));
  const rest = shuffle(rng, avail.filter((item) => !prefer.includes(item)));
  const q = prefer[0] || rest[0];
  if (!q) return null;
  used.add(q.id);
  if (q.key) usedKeys.add(q.key);
  const tk = templateKey(q);
  usedTemplates.set(tk, (usedTemplates.get(tk) || 0) + 1);
  return { ...q, stretch: true };
}

/** 题目内容签名：题干 + 选项（排序后）+ 答案文本，跨年级判重用；与选项顺序无关 */
export function contentSig(q) {
  // 题面口径：同一句题干（不论选项/答案如何排列）视为「已出现过」，
  // 确保 365 天窗口内不重复出题面（R1 口径与 templateKey 分离）。
  return `prompt|${q.type}|${String(q.prompt || '')}`;
}

/**
 * 题面签名（24 位 Base36，5 字符）：recentByDay 里按日期分组存的就是它。
 * 跨年级同内容的题 id 前缀不同（g3/g4），仅靠 id 回避挡不住
 * 「本年级做过 → 拔高又抽到」和「拔高做过 → 本年级又抽到」，
 * 因此回避与落盘统一用内容签名；纯 id 不再单独记录（同内容必同签名，语义等价）。
 */
function sigOf(q) {
  return sig24(contentSig(q));
}

/**
 * 把 recentByDay / recentKeys 一次性整理成查询结构（每天 buildDay 只建一次）：
 *   sigs: Map<sig24, 最近出现日期>   题面回避与「最久没做过」排序用
 *   keys: { [key]: 最近使用日期 }    知识点冷却用
 *   seenQuestion(q): boolean         给 mastery 复习变式加权用
 */
function buildRecent(data) {
  const sigs = new Map();
  const byDay = data?.recentByDay || {};
  Object.keys(byDay).sort().forEach((date) => {
    const arr = byDay[date];
    if (!Array.isArray(arr)) return;
    arr.forEach((s) => sigs.set(s, date)); // 日期升序，后写的覆盖，留下最近日期
  });
  const keys = data?.recentKeys || {};
  return {
    sigs,
    keys,
    seenAt: (q) => sigs.get(sigOf(q)) || '',
    keyDate: (k) => keys[k] || '',
    seenQuestion: (q) => sigs.has(sigOf(q))
  };
}

/**
 * 模板键：把掉数字后的题干 + 题型。
 * 用于认知去重：题面去重只能挡住「换了个数字」，
 * 模板去重才能避免「一天再出现六次同样的配对题」。
 */
export function templateKey(q) {
  return `t:${hashString(`${q.type}|${String(q.prompt || '').replace(/\d+(\.\d+)?/g, '#')}`)}`;
}

function titleOf(questions) {
  const topics = [];
  questions.forEach((q) => {
    if (q.topic && !topics.includes(q.topic)) topics.push(q.topic);
  });
  return topics.slice(0, 2).join(' · ');
}

export function buildDay(key, grade, data) {
  const weekday = store.weekdayOf(key);
  const focus = focusOf(weekday);
  const tasks = [];
  const recent = buildRecent(data); // 365 天题面签名 + 知识点冷却日期，当天只建一次
  const adapt = adaptTarget(data || {}, grade);
  const passLine = passLineFor(grade);
  const usedTemplates = new Map(); // 当日全局模板计数（跨科目）
  const courseScopes = {};        // 各科是否启用了课程单元收敛（阶段 A）
  // 六年级没有更高年级，拔高档转为「全挑战题」
  const wantStretch = adapt.stretch && grade < 6;
  // 阶段 B：薄弱知识点集合只用于排序加权（来自累积掌握度，不读 dailyHistory）
  const weakSet = new Set(weakKeysOf(data || {}, 8).map((w) => w.kid));

  // 阶段 C：待审题（pending-review）未 approved 一律不进池
  const approved = approvedSetOf(data);

  store.SUBJECTS.forEach((subject) => {
    const meta = store.SUBJECT_META[subject];
    const count = taskCountFor(subject, weekday, grade);
    const rng = mulberry32(hashString(`${key}:${grade}:${subject}`));
    const rawPool = visiblePool(getPool(subject, grade, rng, key, weakSet), approved);
    // 抽题范围收敛：当前单元 + 已学单元；未配置教材时 scope 为 null，保持全年级题池
    const scope = courseScope(data?.settings?.course, subject);
    let pool = rawPool;
    let scopeInfo = null;
    let allowShort = false; // 启用课程收敛后，题量不足允许当天少于配额（不拿未学单元凑数）
    let plannedCount = count; // 教材断供时收缩的项数（先缩项，不用拓展题凑满固定项数）
    if (scope) {
      // 只有启用收敛时才给题目挂课程结构字段，避免未配置时把体积写进 localStorage
      const annotated = rawPool.map((q) => {
        if (q.category === 'logic') return { ...q, courseTrack: 'extension' };
        const info = annotateQuestion(q);
        return info
          ? {
            ...q,
            courseTrack: 'textbook',
            courseUnitId: info.unitId,
            courseLessonId: info.lessonId,
            courseKnowledgeId: info.knowledgeId
          }
          : q;
      });
      const allowed = new Set(scope.allowed);
      // 教材题只能来自「当前单元 + 已学单元」；逻辑题作为拓展题保留，不计入教材题比例
      const textbook = annotated.filter((q) => q.courseTrack === 'textbook' && allowed.has(q.courseUnitId));
      const extension = annotated.filter((q) => q.courseTrack === 'extension');
      if (textbook.length) {
        pool = [...textbook, ...extension];
        allowShort = true;
        // 先按可用教材题量收缩项数：每项至少 2 道教材，才能同时满足
        // 「每项 3~4 道 / 每项拓展 ≤2 道 / 拓展占比 ≤50%」且不提前学未学单元。
        plannedCount = Math.min(count, Math.max(1, Math.floor(textbook.length / 2)));
        const needed = count * QUESTIONS_PER_TASK;
        scopeInfo = {
          currentUnitId: scope.currentUnitId,
          currentUnitName: scope.currentUnitName,
          allowedUnits: [...allowed],
          textbookAvailable: textbook.length,
          extensionAvailable: extension.length,
          desiredTaskCount: count,
          plannedTaskCount: plannedCount,
          // 不足时不再向后扩围（不提前学未学单元），改为收缩项数
          shortage: textbook.length < needed
        };
      } else {
        // 该年级题池完全挂不上课程结构（如四年级还没建表）→ 不启用收敛，避免当天无题
        console.warn('[tasks] 课程结构未覆盖该年级题池，本日仍用全年级题池', subject, grade);
      }
    }
    const stretchEnabled = wantStretch && !scopeInfo;
    // 拔高题取自高一年级当天题池（用高一年级自己的种子，题目与其当天一致）
    const stretchPool = stretchEnabled
      ? visiblePool(getPool(subject, grade + 1, mulberry32(hashString(`${key}:${grade + 1}:${subject}`)), key), approved)
      : null;
    // 阶段 B：当天到期的错题变式（只从现有池里选；找不到会记内容缺口）
    const reviewQs = dueReviewCandidates(data || {}, key, subject, pool, recent);
    const used = new Set();
    const usedKeys = new Set();
    // 跨科目全局：避免一天里四科都凑同一种问法
    // 本年级题池内容签名：跨年级共用的生成器可能产出完全相同的题，拔高题需避开
    const ownSigs = stretchEnabled ? new Set(pool.map(contentSig)) : null;
    for (let i = 0; i < plannedCount; i++) {
      // 先占拔高题位，再按剩余名额抽本年级题，保证拔高题优先拿到知识点
      const stretchQ = stretchEnabled
        ? pickStretch(rng, stretchPool, used, usedKeys, recent, key, ownSigs, usedTemplates)
        : null;
      const quota = stretchQ ? QUESTIONS_PER_TASK - 1 : QUESTIONS_PER_TASK;
      const l2t = stretchQ ? Math.min(adapt.l2, quota) : (adapt.stretch ? QUESTIONS_PER_TASK : adapt.l2);
      const questions = pickQuestions(rng, pool, used, usedKeys, recent, l2t, key, quota, usedTemplates, allowShort, reviewQs, weakSet, !!scopeInfo, passLine);
      if (!questions.length) break;
      if (stretchQ) questions.push(stretchQ);
      tasks.push({
        id: `${subject}-${key}-${i + 1}`,
        subject,
        subjectName: meta.name,
        icon: meta.icon,
        grade,
        title: titleOf(questions),
        questions: questions.map((q) => ({ ...q })),
        level2: questions.filter((q) => q.level === 2).length,
        done: false,
        doneAt: null,
        firstTryCorrect: null,
        attempts: 0
      });
    }
    // 记录「实际抽到」的教材/拓展题数，供工作台如实显示（可抽池 ≠ 实际出题）
    if (scopeInfo) {
      const subjectTasks = tasks.filter((t) => t.subject === subject);
      const pickedQs = subjectTasks.flatMap((t) => t.questions);
      scopeInfo.taskCount = subjectTasks.length;
      scopeInfo.quota = subjectTasks.length * QUESTIONS_PER_TASK;
      scopeInfo.textbookPicked = pickedQs.filter((q) => q.courseTrack === 'textbook').length;
      scopeInfo.extensionPicked = pickedQs.filter((q) => q.courseTrack === 'extension').length;
      courseScopes[subject] = scopeInfo;
    }
    // 阶段 B：真正进了当天任务的复习变式，才推进到下一阶段（没进任务的条目留在队列里等下次）
    const placedReview = tasks
      .filter((t) => t.subject === subject)
      .flatMap((t) => t.questions)
      .filter((q) => q.reviewEntry);
    const committed = new Set();
    placedReview.forEach((q) => {
      if (committed.has(q.reviewEntry)) return;
      committed.add(q.reviewEntry);
      commitReview(data || {}, key, q.reviewEntry, q);
    });
  });

  return {
    date: key,
    grade,
    weekday,
    focus,
    tasks,
    // 阶段 A：仅在启用课程单元收敛时记录范围，未配置时不写字段（避免无谓体积）
    ...(Object.keys(courseScopes).length ? { courseScope: courseScopes } : {}),
    chest: {
      unlocked: false,
      opened: false,
      rewardId: null,
      rewardName: null,
      rewardType: null
    },
    allDoneBonus: 0,
    celebrated: false,
    streakBonus: 0,
    generatedAt: Date.now()
  };
}

/**
 * 把今天用到的题写进 recentByDay / recentKeys，并裁剪 365 天前的记录。
 * recentByDay 按日期分组存签名数组：当天同签名只存一次（同一天拔高 ↔ 本年级
 * 可能抽到同内容题），体积约为旧「每题 3 条 KV」的 1/3 以下。
 */
export function markUsed(data, day) {
  const byDay = data.recentByDay || (data.recentByDay = {});
  const keys = data.recentKeys || (data.recentKeys = {});
  const arr = byDay[day.date] || (byDay[day.date] = []);
  const have = new Set(arr);
  day.tasks.forEach((t) => t.questions.forEach((q) => {
    const s = sigOf(q);
    if (!have.has(s)) { arr.push(s); have.add(s); }
    if (q.key) keys[q.key] = day.date;
  }));
  const cutoff = store.shiftDateKey(day.date, -AVOID_DAYS);
  Object.keys(byDay).forEach((d) => { if (d < cutoff) delete byDay[d]; });
  Object.keys(keys).forEach((k) => { if (keys[k] < cutoff) delete keys[k]; });
}

/** 保证今天的任务已经生成，返回今天的 day 对象 */
export function ensureToday() {
  const data = store.load();
  const key = store.todayKey();
  let day = data.days[key];

  if (day && Array.isArray(day.tasks) && day.tasks.length && day.grade === data.grade) {
    return day;
  }
  if (day && day.chest?.opened) {
    // 已经领过宝箱的当天不重排，避免奖励丢失
    return day;
  }

  day = buildDay(key, data.grade, data);
  // 重建（如年级变化）时继承当天已入账的奥数积分，避免与 profile.points 不一致
  const prevOlympic = data.days[key]?.olympicEarned;
  if (prevOlympic) day.olympicEarned = prevOlympic;
  data.days[key] = day;
  markUsed(data, day);
  store.save(data);
  return day;
}

/** 切换年级时重新生成今天的任务（积分与历史保留） */
export function regenerateToday(grade) {
  const data = store.load();
  const key = store.todayKey();
  const oly = data.days[key]?.olympicEarned || 0;
  data.grade = grade;
  delete data.days[key];
  // 占位让 ensureToday 重建时继承当天奥数积分（积分已入账 profile，不能丢）
  if (oly) data.days[key] = { date: key, olympicEarned: oly };
  store.save(data);
  return ensureToday();
}

export function getTaskById(taskId) {
  const day = ensureToday();
  return day.tasks.find((t) => t.id === taskId) || null;
}

export function subjectProgress(day) {
  const map = {};
  store.SUBJECTS.forEach((subject) => {
    const list = day.tasks.filter((t) => t.subject === subject);
    map[subject] = {
      total: list.length,
      done: list.filter((t) => t.done).length
    };
  });
  return map;
}

export function dayProgress(day) {
  const total = day.tasks.length;
  const done = day.tasks.filter((t) => t.done).length;
  return { total, done, percent: total ? Math.round((done / total) * 100) : 0 };
}

export function allSubjectsDone(day) {
  return store.SUBJECTS.every((subject) => {
    const list = day.tasks.filter((t) => t.subject === subject);
    return list.length > 0 && list.every((t) => t.done);
  });
}

/** 找到某科下一项未完成的任务（工作台“开始”按钮用） */
export function nextTaskOf(day, subject) {
  const list = day.tasks.filter((t) => t.subject === subject);
  return list.find((t) => !t.done) || list[0] || null;
}
