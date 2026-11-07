/**
 * sim_e2e.mjs —— 阶段 E2：端到端总验收（回答「有没有提升」的答卷）
 *
 * ┌──────────────────────────────────────────────────────────────┐
 * │ ★★ 课本封面未核对：本脚本所有教学结论均为【骨架演示】，      ★★ │
 * │ ★★ 不得解读为真实教学判断。只证明「链路通」，不证明「教得对」。★★ │
 * └──────────────────────────────────────────────────────────────┘
 *
 * 链路逐环证据（日期 / kid / 题面签名 / status / 周报文本 / 曲线点数）：
 *   环1 配置课本单元（收敛 ma-u01 + 8 道 approved）
 *   环2 当天做题（含答错，强制锚点错题）
 *   环3 错题进入 +1/+3/+7 队列
 *   环4 错题以变式回来（签名 ≠ 原题签名）
 *   环5 掌握度状态迁移（learning/review/mastered）
 *   环6 每周 10 题小测
 *   环7 周报 + 跨周对比（第 2 周起有上周快照）
 *   环8 家长看到行动指向（不越界到未学单元）
 *   环9 成长页掌握度曲线点数变化
 *
 * 跑法：node verify/sim_e2e.mjs
 */
const RealDate = Date;
// 2026-11-02 是周一：14 天恰好覆盖两个完整周（W1: 11-02~08，W2: 11-09~15）
const START = new RealDate('2026-11-02T12:00:00+08:00').getTime();
const DAY_MS = 86400000;
const DAYS = 14;
let currentMs = START;
class FakeDate extends RealDate {
  constructor(...args) { if (args.length === 0) super(currentMs); else super(...args); }
  static now() { return currentMs; }
}
globalThis.Date = FakeDate;
const mem = new Map();
globalThis.localStorage = {
  getItem: (k) => (mem.has(k) ? mem.get(k) : null),
  setItem: (k, v) => mem.set(k, String(v)),
  removeItem: (k) => mem.delete(k),
  clear: () => mem.clear()
};

const tasksApi = await import('../assets/js/core/tasks.js');
const store = await import('../assets/js/core/store.js');
const { completeTask } = await import('../assets/js/core/score.js');
const mastery = await import('../assets/js/core/mastery.js');
const { mulberry32, hashString } = await import('../assets/js/core/rng.js');
const { pendingReviewBank } = await import('../assets/js/data/knowledge-math.js');
const { courseScope } = await import('../assets/js/data/course-map.js');

const { ensureToday } = tasksApi;
let failures = 0;
function assert(label, ok, detail = '') {
  console.log(`${ok ? '✓' : '✗'} ${label}${detail ? `：${detail}` : ''}`);
  if (!ok) failures += 1;
}

/** kid 所属单元：数学 kid 形如 ma-u01-k1 → ma-u01；跨科 kid（chinese:topic:部首）原样返回 */
function unitOfKid(kid) {
  const s = String(kid);
  return s.includes(':') ? s : s.split('-').slice(0, 2).join('-');
}
/** 当前配置单元（环1 写入 course.currentUnitId） */
function configuredUnit() {
  return store.load().settings.course.currentUnitId || '';
}

console.log('┌────────────────────────────────────────────────────────┐');
console.log('│ ★ 课本封面未核对：以下全部为【骨架演示】，非真实教学判断 ★ │');
console.log('└────────────────────────────────────────────────────────┘');

/* ---------- 环 1：配置课本单元 + approved ---------- */
store.resetAll();
store.update((d) => {
  d.settings.course.version = '人教版';
  d.settings.course.grade = 3;
  d.settings.course.term = '上册';
  d.settings.course.currentUnitId = 'ma-u01';
  d.settings.course.learnedUnits = [];
  d.questionReview = d.questionReview || {};
  pendingReviewBank().forEach((q) => { d.questionReview[q.id] = 'approved'; });
});
{
  const c = store.load().settings.course;
  console.log(`\n[环1 配置单元] ${c.version} ${c.grade}年级${c.term} currentUnitId=${c.currentUnitId}，待审题全部 approved`);
  assert('环1 currentUnitId=ma-u01 已配置', c.currentUnitId === 'ma-u01');
}

/* ---------- 14 天模拟，逐环收集证据 ---------- */
const errors = [];
let anchor = null;            // 环2 锚点错题 { date, kid, sig, prompt }
const statusLog = [];         // 环5 状态迁移事件
const prevStatus = new Map(); // kid → 上次 status
const reviewSeen = [];        // 环4 变式回来的题
const anchorReviews = [];     // 收尾1a：锚点错题【自己】的变式轨迹
let quizCount = 0;            // 环6 小测次数
let reportW2 = null;          // 环7 第 2 周周报
let reportW1 = null;          // 第 1 周周报
let curveDay1 = 0;            // 环9 第 1 天曲线非空点数
let curveDay14 = 0;

function answerFor(date, taskId, q, qi) {
  return mulberry32(hashString(`${date}:${taskId}:${qi}:e2e`))() < 0.8;
}

for (let d = 0; d < DAYS; d += 1) {
  currentMs = START + d * DAY_MS;
  const n = d + 1;
  try {
    const day = ensureToday();
    const date = day.date;

    // —— 环2：当天做题（第 1 天强制第一道数学题答错作锚点）——
    day.tasks.forEach((t) => {
      const results = t.questions.map((q, qi) => answerFor(date, t.id, q, qi));
      if (n === 1 && t.subject === 'math' && !anchor && t.questions.length) {
        results[0] = false;
        const q = t.questions[0];
        anchor = {
          date,
          kid: mastery.knowledgeIdOf(q),
          sig: mastery.promptSig(q),
          prompt: String(q.prompt).slice(0, 40)
        };
      }
      const wrongReasons = results
        .map((ok, qi) => (!ok ? { reason: ['careless', 'noknow', 'guess'][qi % 3], qIdx: qi } : null))
        .filter(Boolean);
      completeTask(t.id, {
        firstTryCorrect: results.filter(Boolean).length,
        total: t.questions.length,
        questionResults: results,
        wrongReasons
      });
    });

    if (n === 1 && anchor) {
      console.log(`\n[环2 当天做题含答错] ${date} 锚点错题：kid=${anchor.kid} sig=${anchor.sig} 「${anchor.prompt}…」`);
      assert('环2 锚点错题已制造且挂到知识点', Boolean(anchor.kid), anchor.kid);
    }

    // —— 环3：错题进入 +1 队列（第 1 天答题后检查）——
    if (n === 1 && anchor) {
      const queue = store.load().reviewQueue || {};
      const dueKey = store.shiftDateKey(date, 1);
      const entries = (queue[dueKey] || []).map((raw) => String(raw).split('~'));
      const hit = entries.find(([kid]) => kid === anchor.kid);
      console.log(`[环3 错题入队] reviewQueue[${dueKey}]（+1 天）共 ${entries.length} 条；锚点条目：${hit ? `${hit[0]} stage=${hit[1]} origSig=${hit[2]}` : '未找到'}`);
      assert('环3 锚点错题进入 +1 天队列（stage=0）', Boolean(hit && hit[1] === '0'), hit ? `due=${dueKey}` : '缺失');
    }

    // —— 环4：变式回来（到期日任务里 review:true 的题，签名必须 ≠ 原题）——
    const reviews = day.tasks.flatMap((t) => t.questions).filter((q) => q.review);
    reviews.forEach((q) => {
      const sig = mastery.promptSig(q);
      reviewSeen.push({ date, kid: q.reviewKid, sig, origSig: q.reviewOrig, same: sig === q.reviewOrig });
      if (anchor && q.reviewKid === anchor.kid) {
        anchorReviews.push({ date, kid: q.reviewKid, origSig: q.reviewOrig, sig, same: sig === q.reviewOrig });
      }
    });
    if (n === 2) {
      const r0 = reviewSeen[0];
      if (r0) {
        const u0 = unitOfKid(r0.kid);
        const sameUnit = u0 === configuredUnit();
        console.log(`[环4 变式回来] ${r0.date} 第 1 道复习题：kid=${r0.kid} 变式sig=${r0.sig} 原题sig=${r0.origSig} 所属单元=${u0}（${sameUnit ? '当前单元' : '跨科历史错题复习——复习队列不受教材收敛限制，此处只作签名证据'}）→ ${r0.same ? '相同（违规！）' : '不同（真变式）'}`);
      } else {
        console.log('[环4 变式回来] 第 2 天无到期复习题（继续观察后续天数）');
      }
    }

    // —— 环5：掌握度状态迁移追踪 ——
    const keys = store.load().mastery.keys || {};
    Object.entries(keys).forEach(([kid, rec]) => {
      const prev = prevStatus.get(kid);
      if (prev !== undefined && prev !== rec.status) {
        statusLog.push({ date, kid, from: prev, to: rec.status });
      }
      prevStatus.set(kid, rec.status);
    });

    // —— 环6：每周一小测（周一，与 sim_approved 同口径：前 7 题对）——
    if (store.weekdayOf(date) === 1) {
      const quiz = mastery.buildWeeklyQuiz(store.load(), store.load().grade, date);
      if (quiz.items.length) {
        const items = quiz.items.map((q, i) => ({ kid: q.kid, kind: q.quizKind, ok: i < 7 }));
        store.update((dd) => {
          mastery.saveQuizResult(dd, {
            weekKey: quiz.weekKey, date, total: quiz.items.length, correct: 7, items
          });
        });
        quizCount += 1;
        console.log(`[环6 小测] ${date} ${quiz.weekKey}：${quiz.items.length} 题，答对 7（旧 ${items.filter((x) => x.kind === 'old').length} / 新 ${items.filter((x) => x.kind !== 'old').length}）`);
      }
    }

    // —— E1 快照 + 环7/8：周报 ——
    store.update((dd) => { mastery.captureWeeklySnapshot(dd); });
    const report = mastery.weeklyReport(store.load(), date);
    if (n === 7) reportW1 = report;
    if (n === 8) {
      reportW2 = report;
      const c = report.compare;
      console.log(`\n[环7 周报·跨周对比] ${date}（第 2 周第 1 天，上周起点 ${c.prevWeekStart}）`);
      console.log(`  周结论：${report.sentence}`);
      console.log(`  新掌握 ${c.newMastered.cur}（上周 ${c.newMastered.prev}）· 退步回复习 ${c.regressed.cur}（上周 ${c.regressed.prev}）· 待复习 ${c.needReview.cur}（上周 ${c.needReview.prev === null ? '—' : c.needReview.prev}）`);
      console.log(`[环8 行动指向] ${report.action ? report.action.sentence : '（无薄弱点，无需行动建议）'}`);
    }
    if (n === DAYS) {
      const c = report.compare;
      console.log(`\n[环7 周报·第 14 天] ${date}：新掌握 ${c.newMastered.cur}（上周 ${c.newMastered.prev}）· 退步 ${c.regressed.cur}（上周 ${c.regressed.prev}）· 待复习 ${c.needReview.cur}（上周 ${c.needReview.prev === null ? '—' : c.needReview.prev}）`);
      console.log(`  周结论：${report.sentence}`);
    }

    // —— 环9：成长页曲线点数 ——
    const { series } = mastery.masterySeries(store.load(), 30, 6);
    const pts = series.reduce((s, x) => s + x.points.filter((p) => p.value !== null).length, 0);
    if (n === 1) curveDay1 = pts;
    if (n === DAYS) curveDay14 = pts;
  } catch (e) {
    errors.push(`第 ${n} 天：${e.message}`);
  }
}

/* ---------- 汇总断言 ---------- */
console.log('\n=== 逐环证据汇总 ===');
console.log(`[环4] 14 天变式回来共 ${reviewSeen.length} 道；签名与原题相同的 ${reviewSeen.filter((r) => r.same).length} 道`);
const curUnit = configuredUnit();
const inCurUnit = reviewSeen.filter((r) => unitOfKid(r.kid) === curUnit).length;
const outCurUnit = reviewSeen.length - inCurUnit;
console.log(`[环4 单元归属] 当前单元(${curUnit}) ${inCurUnit} 道；其他 ${outCurUnit} 道为跨科/他单元历史错题复习（复习队列不受教材收敛限制，保留证据不删）`);
assert('环4 变式题数 >0 且签名全部 ≠ 原题（绝不拿原题顶替）',
  reviewSeen.length > 0 && reviewSeen.every((r) => !r.same),
  `${reviewSeen.length} 道，0 道复用原题`);

// 收尾1a：锚点错题【自己】的变式轨迹（不再拿跨科首条当代表证据）
if (anchor) {
  if (anchorReviews.length) {
    const curUnit = configuredUnit();
    let allInCurUnit = true;
    console.log(`[收尾1a 锚点自身变式] kid=${anchor.kid} 共回来 ${anchorReviews.length} 次（逐条校验 kid 是否属于当前单元 ${curUnit}）：`);
    anchorReviews.forEach((r) => {
      const unit = unitOfKid(r.kid);
      const inCurUnit = unit === curUnit;
      allInCurUnit = allInCurUnit && inCurUnit;
      console.log(`  ${r.date} kid=${r.kid} 原题sig=${r.origSig} 变式sig=${r.sig} same=${r.same} 所属单元=${unit} 是否同单元=${inCurUnit ? '是' : '否'}`);
    });
    assert('收尾1a 锚点错题以自己的变式回来、签名 ≠ 原题、且 kid 逐条属于当前单元',
      anchorReviews.every((r) => !r.same && r.kid === anchor.kid) && allInCurUnit,
      anchorReviews.map((r) => `${r.date} ${r.origSig}→${r.sig}`).join('；'));
  } else {
    console.log(`[收尾1a 锚点自身变式] kid=${anchor.kid} 14 天内没有作为复习题回来（题池该知识点未产生可用变式，记 contentGaps）`);
  }
}

console.log('[环5 状态迁移] 事件流：');
statusLog.slice(0, 12).forEach((s) => console.log(`  ${s.date} ${s.kid}：${s.from} → ${s.to}`));
if (anchor) {
  const mine = statusLog.filter((s) => s.kid === anchor.kid);
  console.log(`  锚点 kid=${anchor.kid} 迁移：${mine.map((s) => `${s.from}→${s.to}`).join('，') || '（无变化）'}`);
}
assert('环5 掌握度状态迁移真实发生（≥1 次）', statusLog.length > 0, `${statusLog.length} 次迁移`);

assert('环6 小测至少 2 次（两个周一）', quizCount >= 2, `${quizCount} 次`);

assert('环7 第 2 周周报 hasPrev=true（上周快照存在）', Boolean(reportW2 && reportW2.compare.hasPrev));
if (reportW2) {
  const c = reportW2.compare;
  assert('环7 跨周三类数字均为实测 number',
    [c.newMastered.cur, c.newMastered.prev, c.regressed.cur, c.regressed.prev, c.needReview.cur].every((x) => typeof x === 'number')
    && (c.needReview.prev === null || typeof c.needReview.prev === 'number'),
    `新掌握 ${c.newMastered.prev}→${c.newMastered.cur}，退步 ${c.regressed.prev}→${c.regressed.cur}，待复习 ${c.needReview.prev}→${c.needReview.cur}`);
}

// 环8：行动指向不越界——已配置数学单元时，建议的 kid 必须是数学、且属于当前/已学单元
if (reportW2 && reportW2.action) {
  const kid = reportW2.action.kid;
  const scope = courseScope(store.load().settings.course, 'math');
  const unit = String(kid).startsWith('ma-') ? String(kid).split('-').slice(0, 2).join('-') : null;
  // 配置了数学单元 ⇒ 必须是数学知识点且 unit ∈ allowed；不许跨科（语文/英语）也不许越单元
  const ok = scope ? (unit !== null && scope.allowed.has(unit)) : true;
  assert('环8 行动指向落在当前单元范围内（不越界到未学单元/跨科）',
    Boolean(ok), `建议 kid=${kid} unit=${unit || '非数学（跨科！）'} scope=${scope ? [...scope.allowed].join('/') : '未配置'}`);
} else {
  console.log('  （环8 第 2 周无范围内薄弱点，不给行动建议——宁缺不越界，不断言）');
}

// 收尾1b 反向验证：未配置单元时 scope=null，建议放开到全科（薄弱点来自作答历史，不算越界）
store.update((d) => { d.settings.course.currentUnitId = ''; });
const noUnitScope = courseScope(store.load().settings.course, 'math');
const freeReport = mastery.weeklyReport(store.load());
console.log(`[收尾1b 未配置单元] courseScope=${noUnitScope ? '非空' : 'null'}，建议=${freeReport.action ? freeReport.action.kid : '无'}`);
assert('收尾1b 未配置单元时 scope=null（建议不受单元范围限制）',
  noUnitScope === null, freeReport.action ? `建议 ${freeReport.action.kid}` : '无建议');

// 收尾1c 正面用例：构造一个数学薄弱点（seen=3 / 正确 1，正确率 0.33 < 0.8），
// 建议必须指向这个数学知识点，而不是被过滤成 null 或跳去别的科目。
store.update((d) => {
  d.settings.course.currentUnitId = 'ma-u01';
  d.mastery = d.mastery || { v: 1, keys: {}, masteredAt: {}, reviewAt: {}, aliases: {} };
  d.mastery.keys['ma-u01-k2'] = {
    ...(d.mastery.keys['ma-u01-k2'] || {}),
    seen: 3, correct: 1, status: 'learning', lastSeen: store.todayKey()
  };
});
{
  const weakScope = courseScope(store.load().settings.course, 'math');
  const weakReport = mastery.weeklyReport(store.load());
  const act = weakReport.action;
  const actUnit = act ? String(act.kid).split('-').slice(0, 2).join('-') : null;
  const inScope = Boolean(act && actUnit && weakScope && weakScope.allowed.has(actUnit));
  console.log(`[收尾1c 数学薄弱点正面用例] 构造 ma-u01-k2（seen=3/correct=1）→ 建议 kid=${act ? act.kid : '无'} unit=${actUnit || '—'}`);
  if (act) console.log(`  建议文案：${act.sentence}`);
  assert('收尾1c 有数学薄弱点时建议指向数学且在当前单元范围内（不返回 null、不跨科）', inScope,
    `${act ? act.kid : 'null'} / allowed=${weakScope ? [...weakScope.allowed].join('/') : '无'}`);
}

console.log(`[环9 曲线变化] 掌握度曲线非空点数：第 1 天 ${curveDay1} → 第 14 天 ${curveDay14}`);
assert('环9 成长页曲线点数增长', curveDay14 > curveDay1, `${curveDay1} → ${curveDay14}`);

assert('全流程运行 errors = 0', errors.length === 0, errors.join('；') || '无');

console.log('\n┌────────────────────────────────────────────────────────┐');
console.log('│ ★ 再次标注：课本封面未核对，以上为【骨架演示】证据      ★ │');
console.log('└────────────────────────────────────────────────────────┘');
console.log(failures ? `\n✗ ${failures} 项未通过` : '\n✓ 端到端全链路通过（9 环证据齐，errors=0）');
process.exit(failures ? 1 : 0);
