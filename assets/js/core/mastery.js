/**
 * mastery.js —— 阶段 B：诊断闭环（掌握度累积 / 间隔复习 / 薄弱知识点 / 每周小测）
 *
 * 边界（重要）：
 * - 掌握度只做【累积状态】，绝不每天从 dailyHistory 重算（dailyHistory 只留 90 天）。
 * - 复习「变式」只从【现有题库】里按同 knowledge.id 挑题面不同的题，
 *   不生成新题、不许用原题顶替；没有变式就记「内容缺口」，不凑数。
 * - weakKeys 只影响抽题排序，不改任何题量/达标常数。
 * - prerequisites 仍只记录在课程表里，这里不参与任何计算。
 */

import * as store from './store.js';
import { hashString, mulberry32, shuffle, sig24 } from './rng.js';
import { COURSE_UNITS, annotateQuestion, courseScope, resolveUnitId } from '../data/course-map.js';
import { mathPool } from '../data/knowledge-math.js';

/** 错题回来节奏：第 1/3/7/15/30 天（数组下标即阶段） */
export const REVIEW_INTERVALS = [1, 3, 7, 15, 30];

// B′ 硬约束：只裁 masteryTrend（90→45 天，存储紧凑化）；
// mastery.keys / reviewQueue / quizzes 一律不裁——它们是「跨 100 天不失忆」的载体。
const TREND_KEEP = 45;   // 掌握度曲线保留天数；与 store.js 的 TREND_KEEP 一致
const QUIZ_SIZE = 10;    // 每周小测固定 10 题
const QUIZ_KEEP = 12;    // 小测结果保留最近 12 周
const GAP_KEEP = 40;     // 内容缺口台账最多保留条数
const QUIZ_TYPES = ['choice', 'judge', 'input']; // 小测不出连线/排序，保证「只答一次」链路简单

/* ------------------------- knowledge.id 解析 ------------------------- */

const NAME_MAP = new Map();
for (const unit of COURSE_UNITS) {
  for (const lesson of unit.lessons) {
    for (const k of lesson.knowledge) NAME_MAP.set(k.id, k.name);
  }
}

/**
 * 一道题对应的 knowledge.id：
 *   1) 数学优先用课程结构表里的 knowledge.id（课本核对后可以整体重映射）；
 *   2) 其他科目用「科目:topic」这一级稳定键（静态题库没有 key，
 *      生成题有更细的 key，但掌握度按知识点主题聚合更合理）；
 *   3) 实在没有 topic 才退回题目自带的 key。
 * 这里不绑定任何单元 order，课本核对后可用 aliases 迁移。
 */
export function knowledgeIdOf(q) {
  if (!q) return '';
  // 逻辑/情境题不是教材知识点，不进掌握度、也不进复习队列
  if (q.category === 'logic') return '';
  const info = annotateQuestion(q);
  if (info?.knowledgeId) return info.knowledgeId;
  if (q.courseKnowledgeId) return q.courseKnowledgeId;
  if (q.subject && q.topic) return `${q.subject}:topic:${q.topic}`;
  if (q.key) return q.key;
  return '';
}

/** knowledge.id → 所属科目（用于把复习条目只投进对应科目） */
export function subjectOfKid(kid) {
  const s = String(kid || '');
  if (s.startsWith('ma-')) return 'math'; // v4 短 id
  if (s.startsWith('rj-math-')) return 'math'; // v5 规范 id
  const i = s.indexOf(':');
  return i > 0 ? s.slice(0, i) : '';
}

export function knowledgeName(kid) {
  if (!kid) return '';
  if (NAME_MAP.has(kid)) return NAME_MAP.get(kid);
  // 'math:topic:表内乘法' → 表内乘法；'zh:py:字' → 字
  const i = kid.lastIndexOf(':');
  return i >= 0 ? kid.slice(i + 1) : kid;
}

/* ------------------------- 数据结构 ------------------------- */

function ensureMastery(data) {
  if (!data.mastery || typeof data.mastery !== 'object') {
    data.mastery = { v: 1, keys: {}, masteredAt: {}, reviewAt: {}, aliases: {}, archive: {} };
  }
  if (!data.mastery.keys || typeof data.mastery.keys !== 'object') data.mastery.keys = {};
  if (!data.mastery.archive || typeof data.mastery.archive !== 'object') data.mastery.archive = {};
  if (!data.mastery.masteredAt || typeof data.mastery.masteredAt !== 'object') data.mastery.masteredAt = {};
  if (!data.mastery.reviewAt || typeof data.mastery.reviewAt !== 'object') data.mastery.reviewAt = {};
  if (!data.mastery.aliases || typeof data.mastery.aliases !== 'object') data.mastery.aliases = {};
  return data.mastery;
}

/** 旧 id → 新 id 的重映射（课本核对后 unit / knowledge id 可能改） */
function resolveKid(m, kid) {
  let cur = kid;
  for (let i = 0; i < 5 && m.aliases[cur]; i++) cur = m.aliases[cur];
  return cur;
}

/**
 * 题面签名（24 位 Base36，5 字符）：复习队列 origSig/lastSig 与小测去重统一用它。
 * 碰撞只会「多排队 / 多跳过」（变式选择变保守），不会把原题误判成变式之外的身份。
 */
function promptSig(q) {
  return sig24(`${q?.type || ''}|${q?.prompt || ''}|${q?.answer ?? ''}`);
}

/** 供验收脚本使用（与队列里的签名保持同一算法） */
export { promptSig };

/* ------------------------- 掌握度累积 ------------------------- */

/**
 * 一次任务完成后，把每道题的首次作答结果累积进掌握度。
 * 必须由 score.completeTask 在 save 前调用；这里只改内存对象，不自己落盘。
 */
export function applyTaskOutcome(data, day, task, result = {}) {
  if (!data || !day || !task) return null;
  const qs = Array.isArray(task.questions) ? task.questions : [];
  const per = Array.isArray(result.questionResults)
    ? result.questionResults
    : (Array.isArray(task.questionResults) ? task.questionResults : null);
  if (!per || !per.length) return null;

  const reasons = new Map(
    (result.wrongReasons || task.wrongReasons || []).map((w) => [w.qIdx, w.reason])
  );
  const m = ensureMastery(data);
  const touched = [];

  qs.forEach((q, i) => {
    const kid = resolveKid(m, knowledgeIdOf(q));
    if (!kid) return;
    if (!m.keys[kid]) {
      // 历史归档里的 kid 重新作答时搬回活跃层，不丢累积值
      if (m.archive[kid]) {
        m.keys[kid] = unpackRecord(m.archive[kid]);
        delete m.archive[kid];
      } else {
        m.keys[kid] = { status: 'learning', seen: 0, correct: 0, lastSeen: null, streak: 0 };
      }
    }
    const rec = m.keys[kid];
    const ok = Boolean(per[i]);

    rec.seen += 1;
    if (ok) {
      rec.correct += 1;
      rec.streak += 1;
    } else {
      rec.streak = 0;
      if (q.review) {
        // 复习变式仍答错：沿 1/3/7/15/30 序列推进下一档；答对则序列自然结束
        scheduleNext(data, day.date, kid, q.reviewOrig, promptSig(q),
          q.reviewReason || 'n', q.reviewLevel || q.level || 1, q.reviewStage || 0);
      } else {
        scheduleWrong(data, day.date, q, kid, reasons.get(i));
      }
    }
    rec.lastSeen = day.date;

    const rate = rec.correct / rec.seen;
    let status;
    if (ok) {
      // 掌握必须同时看累积正确率和连续正确，避免「低正确率 + 偶然三连」被判掌握
      const stayMastered = rec.status === 'mastered' && rate >= 0.75;
      const solid = rec.seen >= 3 && rate >= 0.8;
      const hot = rec.streak >= 3 && rate >= 0.75;
      status = (stayMastered || solid || hot) ? 'mastered' : 'learning';
    } else {
      status = 'review';
    }
    // 只在「第一次」达到掌握时记日期，供「本周新掌握」统计
    if (status === 'mastered' && rec.status !== 'mastered') m.masteredAt[kid] = day.date;
    // 每次退步回 review 都刷新日期，供「跨周对比 · 退步回 review」统计
    if (status === 'review') m.reviewAt[kid] = day.date;
    rec.status = status;
    touched.push(kid);
  });

  recordTrend(data, day.date, touched);
  // P0：活跃知识点过多时，把长期未动且不在复习队列里的记录归档（现有量不触发）
  compactMastery(data, { today: day.date });
  return { kids: touched };
}

/** 掌握度曲线快照：每天只记当天动过的知识点，紧凑、体积小 */
function recordTrend(data, date, kids) {
  if (!kids.length) return;
  const trend = data.masteryTrend || (data.masteryTrend = {});
  const row = trend[date] || (trend[date] = {});
  const m = data.mastery;
  kids.forEach((kid) => {
    const r = recordOf(m, kid);
    if (r) row[kid] = Math.round(100 * r.correct / (r.seen || 1));
  });
  const cutoff = store.shiftDateKey(date, -(TREND_KEEP - 1));
  Object.keys(trend).forEach((k) => { if (k < cutoff) delete trend[k]; });
}

/* ------------------------- 间隔复习队列 ------------------------- */

/**
 * 条目编码成一个紧凑字符串（按日期分组的字符串数组，不每题一个对象）：
 *   kid~stage~origSig~lastSig~reason~level
 */
function encodeEntry(kid, stage, origSig, lastSig, reason, level) {
  return `${kid}~${stage}~${origSig}~${lastSig}~${reason || 'n'}~${level || 1}`;
}

/**
 * 旧队列条目的签名是 32 位十进制数字；截断为 24 位 Base36 后与新格式逐位一致
 * （同一哈希输入串），迁移不丢复习语义。新签名固定 5 字符（padStart），
 * 只有「纯数字且长度 ≠5」才按旧数字处理，避免把新签名误当旧数字。
 */
function sigOfLegacy(v) {
  const s = String(v || '');
  if (!s) return '';
  if (/^\d+$/.test(s) && s.length !== 5) {
    return ((Number(s) >>> 0) & 0xffffff).toString(36).padStart(5, '0');
  }
  return s;
}

function decodeEntry(raw) {
  const [kid, stage, origSig, lastSig, reason, level] = String(raw || '').split('~');
  if (!kid) return null;
  return {
    kid,
    stage: Number(stage) || 0,
    origSig: sigOfLegacy(origSig),
    lastSig: sigOfLegacy(lastSig),
    reason: reason || 'n',
    level: Number(level) || 1
  };
}

function reasonChar(reason) {
  if (reason === 'careless') return 'c';
  if (reason === 'noknow') return 'n';
  if (reason === 'guess') return 'g';
  return 'n';
}

function queueOf(data) {
  if (!data.reviewQueue || typeof data.reviewQueue !== 'object') data.reviewQueue = {};
  return data.reviewQueue;
}

function pushEntry(queue, dateKey, raw) {
  const arr = queue[dateKey] || (queue[dateKey] = []);
  if (arr.includes(raw)) return;
  if (arr.length >= 60) return; // 单日兜底上限，避免异常数据撑爆存储
  arr.push(raw);
}

/** 错题入队：第 1 天回来；之后每答一次（被投放到当天任务）就推进到 3/7/15/30 天 */
function scheduleWrong(data, date, q, kid, reason) {
  const queue = queueOf(data);
  const sig = promptSig(q);
  const raw = encodeEntry(kid, 0, sig, sig, reasonChar(reason), q.level || 1);
  pushEntry(queue, store.shiftDateKey(date, REVIEW_INTERVALS[0]), raw);
  // origDate 按签名单独存一份（不随每条队列重复存）；只记「首次出错」，
  // 复习链走完再次答错不覆盖。间隔算法本身不变（仍相对上次复习 +1/+3/+7/+15/+30）
  const orig = data.reviewOrig || (data.reviewOrig = {});
  if (!orig[sig]) orig[sig] = date;
}

/** 复习变式答错后推进到下一档（1→3→7→15→30 天） */
function scheduleNext(data, date, kid, origSig, lastSig, reason, level, stage) {
  const nextStage = stage + 1;
  if (nextStage >= REVIEW_INTERVALS.length) return;
  const queue = queueOf(data);
  const raw = encodeEntry(kid, nextStage, origSig, lastSig, reason || 'n', level || 1);
  pushEntry(queue, store.shiftDateKey(date, REVIEW_INTERVALS[nextStage]), raw);
}

/**
 * 当前到期、且属于该科目的复习候选。
 * - 从现有题池里按同 knowledge.id 找「题面不同」的变式；绝不生成新题。
 * - 找不到变式 → 记内容缺口并丢弃该条目（不拿原题凑数）。
 * - 返回的题目带 reviewEntry，真正被抽进任务后由 commitReview 推进到下一阶段。
 */
export function dueReviewCandidates(data, dayKey, subject, pool, recent) {
  const queue = queueOf(data);
  const dates = Object.keys(queue).filter((d) => d <= dayKey).sort();
  const out = [];
  const seen = new Set();
  const reserved = new Set(); // 同一天同一知识点不能把同一道变式发给多条错题

  for (const date of dates) {
    const arr = queue[date];
    if (!Array.isArray(arr)) { delete queue[date]; continue; }
    for (const raw of arr) {
      if (seen.has(raw)) continue;
      const e = decodeEntry(raw);
      if (!e || subjectOfKid(e.kid) !== subject) continue;
      const q = findVariant(pool, e.kid, e.origSig, e.lastSig, e.reason, e.level, recent, reserved);
      if (!q) {
        recordGap(data, e.kid, `第 ${e.stage + 1} 次复习无同知识点变式`);
        continue;
      }
      seen.add(raw);
      reserved.add(q.id);
      reserved.add(promptSig(q));
      out.push({
        ...q,
        review: true,
        reviewEntry: raw,
        reviewKid: e.kid,
        reviewOrig: e.origSig,
        reviewStage: e.stage,
        reviewReason: e.reason,
        reviewLevel: e.level
      });
    }
  }
  return out;
}

/**
 * 只从现有池里选变式：同 knowledge.id + 题面与「原题/上一次变式」都不同。
 * 错因决定方向，但方向只影响排序，不改变「必须同知识点」这条硬约束。
 */
export function findVariant(pool, kid, origSig, lastSig, reason, level, recent, reserved = null) {
  const cands = (pool || []).filter((q) => (
    knowledgeIdOf(q) === kid
    && promptSig(q) !== origSig
    && promptSig(q) !== lastSig
    && q.category !== 'logic'
    && !(reserved && (reserved.has(q.id) || reserved.has(promptSig(q))))
  ));
  if (!cands.length) return null;
  const weight = (q) => {
    let s = 0;
    if (!recent || typeof recent.seenQuestion !== 'function' || !recent.seenQuestion(q)) s += 2; // 优先没最近出现过的
    if (reason === 'c') {
      if ((q.level || 1) === level) s += 2;                  // 粗心：换数字，同难度
    } else if (reason === 'n') {
      if ((q.level || 1) === Math.max(1, level - 1)) s += 3; // 不会：降一档
    } else if (reason === 'g') {
      if (q.type === 'choice') s += 3;                       // 猜：换选择题做辨析
    }
    return s;
  };
  return cands.slice().sort((a, b) => weight(b) - weight(a))[0];
}

/** 变式真的被抽进当天任务后：移出队列；答错时再由 applyTaskOutcome 推进下一档 */
export function commitReview(data, dayKey, raw) {
  const queue = queueOf(data);
  for (const date of Object.keys(queue)) {
    const arr = queue[date];
    if (!Array.isArray(arr)) continue;
    const i = arr.indexOf(raw);
    if (i >= 0) {
      arr.splice(i, 1);
      if (!arr.length) delete queue[date];
      break;
    }
  }
}

/** 内容缺口台账（运行时记录，阶段 C 按题型规格书补内容） */
export function recordGap(data, kid, reason) {
  const gaps = data.contentGaps || (data.contentGaps = {});
  const today = store.todayKey();
  const item = gaps[kid] || (gaps[kid] = { first: today, count: 0 });
  item.last = today;
  item.reason = reason;
  item.count += 1;
  const keys = Object.keys(gaps);
  if (keys.length > GAP_KEEP) {
    keys.sort((a, b) => (gaps[a].last < gaps[b].last ? -1 : 1));
    keys.slice(0, keys.length - GAP_KEEP).forEach((k) => { delete gaps[k]; });
  }
}

export function contentGapSummary(data) {
  return Object.entries(data.contentGaps || {})
    .map(([kid, g]) => ({ kid, name: knowledgeName(kid), count: g.count, last: g.last, reason: g.reason }))
    .sort((a, b) => b.count - a.count);
}

/* ------------------------- weakKeys ------------------------- */

/**
 * 需要加权的薄弱知识点：看过至少 2 次，正确率 < 80% 或最近一次答错。
 * 只用于抽题排序，不影响题量、难度配额与达标线。
 */
export function weakKeysOf(data, limit = 8) {
  const m = ensureMastery(data);
  const list = [];
  Object.entries(m.keys).forEach(([rawKid, rec]) => {
    if (!rec || rec.seen < 2) return;
    const rate = rec.correct / (rec.seen || 1);
    if (rate >= 0.8 && rec.status !== 'review') return;
    list.push({
      kid: resolveKid(m, rawKid),
      rate,
      seen: rec.seen,
      status: rec.status,
      lastSeen: rec.lastSeen
    });
  });
  return list
    .sort((a, b) => (a.rate - b.rate) || (b.seen - a.seen))
    .slice(0, limit);
}

/** 重置掌握度（不动积分/任务/历史；供工作台入口调用） */
export function resetMastery(data) {
  data.mastery = { v: 1, keys: {}, masteredAt: {}, reviewAt: {}, aliases: {} };
  data.masteryTrend = {};
  data.reviewQueue = {};
  data.contentGaps = {};
  data.weeklySnapshots = {};
  return data;
}

/**
 * 迁移知识点 id：课本核对后 unit/knowledge id 可能整体改名。
 * - 记入 aliases，后续新写入自动映射到新 id；
 * - 已有掌握度 / 掌握日期 / 复习队列 / 曲线里的旧 id 一并搬过去。
 */
export function migrateKnowledgeId(data, from, to) {
  if (!from || !to || from === to) return { ok: false, reason: '新旧 id 不能为空且必须不同' };
  const m = ensureMastery(data);
  m.aliases[from] = to;

  if (m.keys[from]) {
    const src = m.keys[from];
    if (m.keys[to]) {
      const dst = m.keys[to];
      dst.seen += src.seen;
      dst.correct += src.correct;
      dst.streak = Math.max(dst.streak, src.streak);
      dst.lastSeen = [dst.lastSeen, src.lastSeen].filter(Boolean).sort().pop() || dst.lastSeen;
      dst.status = dst.status === 'mastered' || src.status === 'mastered' ? 'mastered' : src.status;
    } else {
      m.keys[to] = src;
    }
    delete m.keys[from];
  }
  if (m.masteredAt[from]) {
    const oldDate = m.masteredAt[from];
    m.masteredAt[to] = m.masteredAt[to] && m.masteredAt[to] < oldDate ? m.masteredAt[to] : oldDate;
    delete m.masteredAt[from];
  }
  if (m.reviewAt && m.reviewAt[from]) {
    const oldDate = m.reviewAt[from];
    m.reviewAt[to] = m.reviewAt[to] && m.reviewAt[to] > oldDate ? m.reviewAt[to] : oldDate;
    delete m.reviewAt[from];
  }
  Object.values(data.reviewQueue || {}).forEach((arr) => {
    if (!Array.isArray(arr)) return;
    for (let i = 0; i < arr.length; i++) {
      const e = decodeEntry(arr[i]);
      if (!e || e.kid !== from) continue;
      arr[i] = encodeEntry(to, e.stage, e.origSig, e.lastSig, e.reason, e.level);
    }
  });
  Object.values(data.masteryTrend || {}).forEach((row) => {
    if (row && row[from] !== undefined) {
      row[to] = Math.max(row[to] ?? 0, row[from]);
      delete row[from];
    }
  });
  // P0：内容缺口台账与历史归档同样按 kid 键保存，迁移时必须一并搬走，否则会静默丢失
  if (data.contentGaps && data.contentGaps[from]) {
    const old = data.contentGaps[from];
    const cur = data.contentGaps[to];
    data.contentGaps[to] = cur
      ? {
        first: cur.first < old.first ? cur.first : old.first,
        last: cur.last > old.last ? cur.last : old.last,
        count: (cur.count || 0) + (old.count || 0),
        reason: cur.reason || old.reason
      }
      : old;
    delete data.contentGaps[from];
  }
  if (m.archive && m.archive[from]) {
    if (m.archive[to]) {
      const dst = unpackRecord(m.archive[to]);
      const src = unpackRecord(m.archive[from]);
      dst.seen += src.seen;
      dst.correct += src.correct;
      dst.streak = Math.max(dst.streak, src.streak);
      dst.lastSeen = [dst.lastSeen, src.lastSeen].filter(Boolean).sort().pop() || dst.lastSeen;
      dst.status = dst.status === 'mastered' || src.status === 'mastered' ? 'mastered' : src.status;
      m.archive[to] = packRecord(dst);
    } else {
      m.archive[to] = m.archive[from];
    }
    delete m.archive[from];
  }
  return { ok: true };
}

/* ------------------------- 周报 ------------------------- */

export function weekStartKey(dateKey = store.todayKey()) {
  const wd = store.weekdayOf(dateKey); // 0=周日
  const delta = wd === 0 ? -6 : 1 - wd; // 统一按周一为一周起点
  return store.shiftDateKey(dateKey, delta);
}

/** math 知识点的所属单元 id：'ma-u01-k1' → 'ma-u01'；非数学 kid 返回 null（无单元概念，不过滤） */
function unitOfKid(kid) {
  const s = String(kid || '');
  if (s.startsWith('rj-math-')) {
    // v5 规范 id：rj-math-g3-up-u01-l02-k03 → rj-math-g3-up-u01 → 解析回当前册的单元 id
    const canonical = s.split('-').slice(0, 5).join('-');
    return resolveUnitId(canonical) || null;
  }
  if (!s.startsWith('ma-')) return null;
  const parts = s.split('-');
  return parts.length >= 2 ? `${parts[0]}-${parts[1]}` : null;
}

const ARCHIVE_STATUS = { learning: 0, review: 1, mastered: 2 };
const ARCHIVE_STATUS_NAME = ['learning', 'review', 'mastered'];

/** 归档压缩格式：[状态码, seen, correct, lastSeen, streak] —— 比同结构对象约省 30% 体积 */
function packRecord(rec) {
  return [
    ARCHIVE_STATUS[rec.status] ?? 0,
    rec.seen || 0,
    rec.correct || 0,
    rec.lastSeen || '',
    rec.streak || 0
  ];
}

function unpackRecord(a) {
  if (!Array.isArray(a)) return a;
  return {
    status: ARCHIVE_STATUS_NAME[a[0]] || 'learning',
    seen: a[1] || 0,
    correct: a[2] || 0,
    lastSeen: a[3] || null,
    streak: a[4] || 0
  };
}

/** 掌握度记录读取：活跃常驻优先，历史归档兜底（P0 分层） */
function recordOf(m, kid) {
  if (m.keys[kid]) return m.keys[kid];
  const a = m.archive ? m.archive[kid] : null;
  return a ? unpackRecord(a) : null;
}

/**
 * mastery 分层（P0）：活跃常驻 / 历史归档压缩。
 * - 只在活跃健数超过 minActive 时触发，现有数据量不改变任何口径；
 * - review 态与仍在复习队列里的 kid 永远不归档；
 * - 归档只搬累积记录，masteredAt / reviewAt 留在原处供周报统计。
 */
export function compactMastery(data, { today = store.todayKey(), idleDays = 120, minActive = 600 } = {}) {
  const m = ensureMastery(data);
  const total = Object.keys(m.keys).length;
  if (total < minActive) return { moved: 0, active: total, archived: Object.keys(m.archive).length };
  const cutoff = store.shiftDateKey(today, -idleDays);
  const queued = new Set();
  Object.values(data.reviewQueue || {}).forEach((list) => {
    (list || []).forEach((entry) => queued.add(String(entry).split('~')[0]));
  });
  let moved = 0;
  for (const [kid, rec] of Object.entries(m.keys)) {
    if (!rec || rec.status === 'review' || queued.has(kid)) continue;
    if ((rec.lastSeen || '') && rec.lastSeen >= cutoff) continue;
    m.archive[kid] = packRecord(rec);
    delete m.keys[kid];
    moved += 1;
  }
  return { moved, active: Object.keys(m.keys).length, archived: Object.keys(m.archive).length };
}

/**
 * 行动指向（E1）：建议必须落在当前单元范围内，不得越界到未学单元。
 * - 已配置课本（courseScope 非空）：只从「当前单元 + 已学单元」的薄弱点里挑；
 * - 未配置课本：薄弱点全部来自孩子的作答历史，天然是学过的内容，不越界。
 * 每天几道与复习配额 MAX_REVIEW_PER_TASK=2 一致（常数不改，只引用）。
 */
function actionFor(data, need) {
  if (!need.length) return null;
  const scope = courseScope(data?.settings?.course, 'math');
  // 已配置数学单元：建议只能落在「当前单元 + 已学单元」内的数学知识点。
  // 旧写法 `!u || scope.allowed.has(u)` 会让语文/英语知识点无条件通过，
  // 家长配的是数学单元却收到「练英语情景对话」的建议——这就是越界，已修。
  // 范围内没有薄弱点时宁可不给建议（action=null），也不跨科/跨单元推荐。
  const inScope = scope
    ? need.filter((kid) => {
      const u = unitOfKid(kid);
      return u !== null && scope.allowed.has(u);
    })
    : need;
  const target = inScope[0];
  if (!target) return null;
  return {
    kid: target,
    name: knowledgeName(target),
    perDay: 2,
    sentence: `建议本周优先练「${knowledgeName(target)}」：每天的任务已自动安插它的复习题（每天最多 2 道），连续练 3 天再看曲线是否回升。`
  };
}

/**
 * 周报快照（E1 跨周对比用）：每周记录「待复习」数量。
 * 新掌握/退步可由 masteredAt/reviewAt 精确重建任意周，只有「上周时点的待复习数」
 * 无法事后重建，所以快照只存这一个数（体积最小，保留最近 12 周）。
 * 由 growth.js 渲染周报前调用一次（store.update 包裹）。
 */
export function captureWeeklySnapshot(data, today = store.todayKey()) {
  const ws = weekStartKey(today);
  const snaps = data.weeklySnapshots || (data.weeklySnapshots = {});
  snaps[ws] = { need: weakKeysOf(data, 6).length, savedAt: today };
  const keys = Object.keys(snaps).sort();
  if (keys.length > QUIZ_KEEP) keys.slice(0, keys.length - QUIZ_KEEP).forEach((k) => { delete snaps[k]; });
  return snaps[ws];
}

/** 这周掌握了什么、哪个知识点需要复习（③ 的答案来源）+ E1 跨周对比与行动指向 */
export function weeklyReport(data, today = store.todayKey()) {
  const m = ensureMastery(data);
  const start = weekStartKey(today);
  const prevStart = store.shiftDateKey(start, -7);
  const prevEnd = store.shiftDateKey(start, -1);
  const inRange = (d, a, b) => Boolean(d) && d >= a && d <= b;

  const newly = Object.entries(m.masteredAt)
    .filter(([kid, d]) => inRange(d, start, today) && recordOf(m, kid)?.status === 'mastered')
    .map(([kid]) => kid)
    .map((kid) => resolveKid(m, kid));
  const need = weakKeysOf(data, 6).map((w) => w.kid);
  const dueNow = reviewDueCount(data, today, 7);
  const newNames = [...new Set(newly.map(knowledgeName))];
  const needNames = [...new Set(need.map(knowledgeName))];
  const quote = (names) => names.map((n) => `「${n}」`).join('、');
  let sentence;
  if (newNames.length && needNames.length) {
    sentence = `本周掌握了 ${newNames.length} 个知识点（${quote(newNames)}）；${needNames.length} 个还需要复习（${quote(needNames)}）。`;
  } else if (newNames.length) {
    sentence = `本周掌握了 ${newNames.length} 个知识点（${quote(newNames)}），没有明显需要复习的知识点。`;
  } else if (needNames.length) {
    sentence = `本周还没有新掌握的知识点，建议先复习 ${needNames.length} 个薄弱知识点（${quote(needNames)}）。`;
  } else {
    sentence = '本周还没有足够的作答记录，完成几项任务后就能看到掌握度变化。';
  }

  // —— 跨周对比（本周 vs 上周）：新掌握 / 退步回 review / 待复习 三类数量变化 ——
  const prevNewCount = Object.entries(m.masteredAt)
    .filter(([kid, d]) => inRange(d, prevStart, prevEnd)).length;
  const regressed = Object.entries(m.reviewAt || {})
    .filter(([kid, d]) => inRange(d, start, today) && recordOf(m, kid)?.status === 'review')
    .map(([kid]) => resolveKid(m, kid));
  const prevRegressedCount = Object.entries(m.reviewAt || {})
    .filter(([, d]) => inRange(d, prevStart, prevEnd)).length;
  const prevSnap = (data.weeklySnapshots || {})[prevStart] || null;
  const compare = {
    prevWeekStart: prevStart,
    // 上周三项全无可考 → 第一周使用，提示「下周起可见对比」
    hasPrev: prevSnap !== null || prevNewCount > 0 || prevRegressedCount > 0,
    newMastered: { cur: newNames.length, prev: prevNewCount },
    regressed: { cur: regressed.length, prev: prevRegressedCount },
    needReview: { cur: needNames.length, prev: prevSnap ? prevSnap.need : null }
  };

  return {
    weekStart: start,
    newMastered: newly,
    newMasteredNames: newNames,
    needReview: need,
    needReviewNames: needNames,
    dueNext7: dueNow,
    sentence,
    compare,
    action: actionFor(data, need)
  };
}

/** 未来 days 天内到期的复习条目数（只读，不改队列） */
export function reviewDueCount(data, fromKey, days = 7) {
  const queue = data.reviewQueue || {};
  const end = store.shiftDateKey(fromKey, days - 1);
  let n = 0;
  Object.entries(queue).forEach(([date, arr]) => {
    if (date >= fromKey && date <= end && Array.isArray(arr)) n += arr.length;
  });
  return n;
}

/* ------------------------- 每周 10 题小测 ------------------------- */

function uniqByPrompt(list) {
  const seen = new Set();
  return list.filter((q) => {
    const sig = promptSig(q);
    if (seen.has(sig)) return false;
    seen.add(sig);
    return true;
  });
}

/**
 * 生成每周小测：10 题、新旧知识点混合、只从现有数学题池里选（不生成新题）。
 * 当前单元设置了范围时，小测也只用「当前单元 + 已学单元」，不提前考未学内容。
 */
export function buildWeeklyQuiz(data, grade, dayKey = store.todayKey()) {
  const scope = courseScope(data?.settings?.course, 'math');
  const rng = mulberry32(hashString(`${dayKey}:${grade}:math:quiz`));
  // 阶段 C：待审题未 approved 不进小测，与每日任务同一过滤口径
  const approved = new Set(
    Object.entries(data?.questionReview || {})
      .filter(([, v]) => v === 'approved')
      .map(([k]) => k)
  );
  const pool = mathPool(grade, mulberry32(hashString(`${dayKey}:${grade}:math:quizpool`)))
    .filter((q) => q.status !== 'pending-review' || approved.has(q.id))
    .map((q) => {
      const info = annotateQuestion(q);
      return {
        ...q,
        kid: info?.knowledgeId || knowledgeIdOf(q),
        unitId: info?.unitId || null
      };
    })
    .filter((q) => (
      q.kid
      && QUIZ_TYPES.includes(q.type)
      && (!scope || (q.unitId && scope.allowed.has(q.unitId)))
    ));

  const unique = uniqByPrompt(pool);
  const m = ensureMastery(data);
  const mastered = new Set(
    Object.entries(m.keys)
      .filter(([, rec]) => rec.status === 'mastered')
      .map(([kid]) => resolveKid(m, kid))
  );
  const old = unique.filter((q) => mastered.has(q.kid));
  const fresh = unique.filter((q) => !mastered.has(q.kid));

  const picked = [];
  const takeFrom = (list, n) => {
    shuffle(rng, list).forEach((q) => {
      if (picked.length >= QUIZ_SIZE || n <= 0) return;
      if (picked.some((p) => p.id === q.id || promptSig(p) === promptSig(q))) return;
      picked.push(q);
      n -= 1;
    });
  };
  takeFrom(old, 5);   // 旧知识点：已掌握的
  takeFrom(fresh, 5); // 新知识点：还没掌握的
  takeFrom(fresh, QUIZ_SIZE - picked.length);
  takeFrom(old, QUIZ_SIZE - picked.length);

  const items = shuffle(rng, picked).map((q) => ({
    ...q,
    quizKind: mastered.has(q.kid) ? 'old' : 'new'
  }));
  return {
    weekKey: `W${weekStartKey(dayKey)}`,
    date: dayKey,
    items
  };
}

/** 小测结果单独存：按周一条，只留最近 12 周；items 用数组压缩，不重复题目正文 */
export function saveQuizResult(data, { weekKey, date, total, correct, items }) {
  const quizzes = data.quizzes || (data.quizzes = {});
  quizzes[weekKey] = {
    date,
    total,
    correct,
    items: items.map((it) => [it.kid, it.ok ? 1 : 0, it.kind === 'old' ? 1 : 0])
  };
  const keys = Object.keys(quizzes).sort();
  if (keys.length > QUIZ_KEEP) {
    keys.slice(0, keys.length - QUIZ_KEEP).forEach((k) => { delete quizzes[k]; });
  }
  return quizzes[weekKey];
}

export function latestQuiz(data) {
  const quizzes = data.quizzes || {};
  const keys = Object.keys(quizzes).sort();
  if (!keys.length) return null;
  const key = keys[keys.length - 1];
  const q = quizzes[key];
  return {
    weekKey: key,
    date: q.date,
    total: q.total,
    correct: q.correct,
    oldCount: (q.items || []).filter((x) => x[2]).length,
    newCount: (q.items || []).filter((x) => !x[2]).length
  };
}

/* ------------------------- 成长页数据 ------------------------- */

/** 掌握度曲线：最近 30 天里出现过的知识点，各自按天给出 0~100 的掌握度 */
export function masterySeries(data, days = 30, limit = 6) {
  const trend = data.masteryTrend || {};
  const today = store.todayKey();
  const dates = Array.from({ length: days }, (_, i) => store.shiftDateKey(today, i - (days - 1)));
  const m = ensureMastery(data);

  // 选「最近有记录」的知识点，最多 limit 条，避免成长页线太多
  const lastSeen = new Map();
  Object.entries(trend).forEach(([date, row]) => {
    Object.keys(row || {}).forEach((kid) => {
      if (!lastSeen.has(kid) || lastSeen.get(kid) < date) lastSeen.set(kid, date);
    });
  });
  const kids = [...lastSeen.entries()]
    .sort((a, b) => (a[1] < b[1] ? 1 : -1))
    .map(([kid]) => kid)
    .slice(0, limit);

  const series = kids.map((kid) => {
    let last = null;
    const points = dates.map((date) => {
      const v = trend[date]?.[kid];
      if (typeof v === 'number') last = v;
      return { date, value: last };
    });
    const current = recordOf(m, kid);
    return {
      kid,
      name: knowledgeName(kid),
      rate: current ? Math.round(100 * current.correct / (current.seen || 1)) : null,
      points
    };
  });
  return { dates, series };
}

/* ------------------------- 测试/诊断用 ------------------------- */

/** 供脚本与工作台展示：当前掌握度快照 */
export function masterySnapshot(data) {
  const m = ensureMastery(data);
  return Object.entries(m.keys)
    .map(([kid, rec]) => ({
      kid,
      name: knowledgeName(kid),
      status: rec.status,
      seen: rec.seen,
      correct: rec.correct,
      rate: Math.round(100 * rec.correct / (rec.seen || 1)),
      streak: rec.streak,
      lastSeen: rec.lastSeen,
      masteredAt: m.masteredAt[kid] || null
    }))
    .sort((a, b) => (a.rate - b.rate));
}
