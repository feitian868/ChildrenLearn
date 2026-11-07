/**
 * sim_mastery.mjs —— 阶段 B 验收（不生成新题、不改任何题量常数）
 *
 * 验证：
 *   ① 错题 30 天内至少一次以「同知识点、不同题面」的变式重现 ≥90%（逐条证据）
 *     + 每条错题在 1/3/7/15/30 五个间隔点的命中矩阵（五档完成率只作观察指标、不作门槛）
 *   ② weakKeys 真的影响抽题（固定种子 20 次对照的均值）
 *   ③ 能回答「这周掌握了什么、哪个知识点需要复习」
 *   ④ 成长页所需的每个知识点掌握度变化（曲线数据，含「5 条 vs 18 个」口径）
 *   ⑤ 跨 100 天掌握度仍连续（dailyHistory 已裁剪也不失忆）
 *   另外：每周 10 题小测的新旧口径 / 范围校验、状态迁移公式、ma-u01 收敛场景的内容缺口。
 */
const RealDate = Date;
const START = new RealDate('2026-11-06T12:00:00+08:00').getTime();
const DAY_MS = 86400000;
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
const { COURSE_UNITS, courseScope } = await import('../assets/js/data/course-map.js');
const { mulberry32, hashString } = await import('../assets/js/core/rng.js');

const { ensureToday } = tasksApi;
const short = (s, n = 30) => String(s || '').replace(/\s+/g, ' ').slice(0, n);
const deep = (v) => JSON.parse(JSON.stringify(v));
let failures = 0;
function assert(label, ok, detail = '') {
  console.log(`${ok ? '✓' : '✗'} ${label}${detail ? `：${detail}` : ''}`);
  if (!ok) failures += 1;
}

/* 主场景：当前单元 = 5（测量），允许单元里有 5 个知识点。
   ma-u03-k1（有余数的除法）全部答错，制造完整的 1/3/7/15/30 复习链；
   ma-u05-k1 前期 30% 后期 90%、ma-u04-k1 前期 40% 后期 85%，用作 weakKeys 对照与曲线波动源。 */
const WEAK_KID = 'ma-u03-k1';
const SHAKY_KID = 'ma-u05-k1';
const IMPROVING_KID = 'ma-u04-k1';
/** 分档作答策略：制造「全错链」「后期进步」「稳定掌握」三种真实形态 */
function biasFor(kid, dayIdx) {
  if (kid === WEAK_KID) return 0; // 有余数的除法：全错，走完 5 档间隔
  if (kid === SHAKY_KID) return dayIdx < 60 ? 0.3 : 0.9; // 质量单位：前期吃力、后期进步
  if (kid === IMPROVING_KID) return dayIdx < 50 ? 0.4 : 0.85; // 长度单位：中期开始进步
  return kid ? 0.92 : 0.85;
}
store.update((d) => {
  d.settings.course.version = '人教版';
  d.settings.course.grade = 3;
  d.settings.course.term = '上册';
  d.settings.course.currentUnitId = 'ma-u05';
  d.settings.course.learnedUnits = [];
});

const DAYS = 100;
const firstDate = store.todayKey();
const wrongs = [];
const appearances = [];
let day1Kid = null;
let day1Stats = null;

console.log('=== 模拟 100 天（只完成每日数学任务；ma-u03-k1 全错，其余 92% 正确）===');
for (let d = 0; d < DAYS; d += 1) {
  currentMs = START + d * DAY_MS;
  const day = ensureToday();
  const mathTasks = day.tasks.filter((t) => t.subject === 'math');
  mathTasks.forEach((t, ti) => {
    const results = t.questions.map((q, qi) => {
      const kid = mastery.knowledgeIdOf(q);
      const bias = biasFor(kid, d);
      return mulberry32(hashString(`${day.date}:${ti}:${qi}:first-try`))() < bias;
    });
    const wrongReasons = results
      .map((ok, qi) => (!ok ? { reason: ['careless', 'noknow', 'guess'][qi % 3], qIdx: qi } : null))
      .filter(Boolean);

    t.questions.forEach((q, qi) => {
      if (!results[qi]) {
        wrongs.push({
          date: day.date,
          kid: mastery.knowledgeIdOf(q),
          sig: mastery.promptSig(q),
          prompt: q.prompt,
          review: Boolean(q.review)
        });
      }
      if (q.review) {
        appearances.push({
          date: day.date,
          kid: q.reviewKid,
          orig: q.reviewOrig,
          stage: q.reviewStage,
          prompt: q.prompt
        });
      }
    });

    completeTask(t.id, {
      firstTryCorrect: results.filter(Boolean).length,
      total: t.questions.length,
      questionResults: results,
      wrongReasons
    });
  });

  if (d === 0) {
    day1Kid = mathTasks.flatMap((t) => t.questions)
      .map((q) => ({ q, kid: mastery.knowledgeIdOf(q) }))
      .find((x) => x.kid)?.kid || null;
    const dataNow = store.load();
    day1Stats = day1Kid && dataNow.mastery.keys[day1Kid]
      ? { ...dataNow.mastery.keys[day1Kid], date: day.date, kid: day1Kid }
      : null;
  }
  if (d % 20 === 19) {
    const dnow = store.load();
    console.log(`  第 ${d + 1} 天：数学任务 ${mathTasks.length} 项，掌握度知识点 ${Object.keys(dnow.mastery.keys).length} 个，待复习条目 ${Object.values(dnow.reviewQueue || {}).reduce((s, a) => s + a.length, 0)} 条`);
  }
}

const finalData = deep(store.load());
const lastDate = store.shiftDateKey(firstDate, DAYS - 1);

/* ------------------------- ① 30 天内变式重现 ------------------------- */
console.log('\n=== ① 错题 30 天内以变式重现 ===');
console.log('口径（写死）：');
console.log('  origSig = hashString(type|prompt|answer)，是错题原题的完整题面签名；');
console.log('  「同 origSig」= 变式来自同一条错题（队列条目里记录的 origSig）；');
console.log('  「不同题面」= 变式 promptSig ≠ 原题 origSig，且 ≠ 上一次变式的 lastSig（题面文字再校验一次）；');
console.log(`  只统计：首次答错（非复习题）、且原题 +30 天 ≤ 模拟末日（${lastDate}）的错题。`);
const eligible = wrongs.filter((w) => (
  !w.review && w.kid && store.shiftDateKey(w.date, 30) <= lastDate
));
const wrongBySig = new Map();
eligible.forEach((w) => { if (!wrongBySig.has(w.sig)) wrongBySig.set(w.sig, w); });

// 同一条错题的复习变式出场记录
const appsByOrig = new Map();
appearances.forEach((a) => {
  if (!appsByOrig.has(a.orig)) appsByOrig.set(a.orig, []);
  appsByOrig.get(a.orig).push(a);
});
const hitOf = (w) => {
  const end = store.shiftDateKey(w.date, 30);
  return (appsByOrig.get(w.sig) || []).find((a) => (
    a.kid === w.kid && a.date > w.date && a.date <= end && short(a.prompt) !== short(w.prompt)
  ));
};
let hits = 0;
const hitRows = [];
eligible.forEach((w) => {
  const found = hitOf(w);
  if (found) hits += 1;
  hitRows.push({ w, found });
});
console.log(`原始错题（不含复习题本身）${eligible.length} 道；30 天内以变式重现 ${hits} 道 = ${eligible.length ? (100 * hits / eligible.length).toFixed(1) : '—'}%`);
hitRows.slice(0, 12).forEach(({ w, found }) => {
  const dist = found ? Math.round((new RealDate(found.date).getTime() - new RealDate(w.date).getTime()) / DAY_MS) : null;
  console.log(`  ${w.date} ${w.kid.padEnd(12)}「${short(w.prompt, 22)}」→ ${found ? `${found.date}（+${dist} 天 · 第 ${found.stage + 1} 次）「${short(found.prompt, 22)}」` : '未重现（内容缺口或队列积压）'}`);
});
assert('① 30 天内至少一次变式重现 ≥90%', eligible.length > 0 && hits / eligible.length >= 0.9,
  `${(100 * hits / (eligible.length || 1)).toFixed(1)}%`);

/* ------------------------- ①-b 五个间隔点命中矩阵 ------------------------- */
console.log('\n=== ①-b 每条错题的 1/3/7/15/30 间隔点命中 ===');
console.log('口径（写死）：间隔是「相对上一次复习」的 +1/+3/+7/+15/+30 天；');
console.log('      相对原题的五档累计天数 = +1 / +4 / +11 / +26 / +56，S5 落在第 56 天（超出 ① 的 30 天窗口属正常）；');
console.log('      某一档答对即终止后续间隔（Ebbinghaus 式），所以「—」不一定是失败。五档完成率是观察指标、不作门槛。');
const stageHits = [0, 0, 0, 0, 0];
const stageDates = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 };
const fullChain = [];
eligible.forEach((w) => {
  const apps = (appsByOrig.get(w.sig) || []).sort((a, b) => (a.date < b.date ? -1 : 1));
  const pick = (s) => apps.find((a) => a.stage === s);
  const cells = [];
  for (let s = 0; s < 5; s++) {
    const a = pick(s);
    if (a) {
      stageHits[s] += 1;
      stageDates[s] += 1;
      const off = Math.round((new RealDate(a.date).getTime() - new RealDate(w.date).getTime()) / DAY_MS);
      cells.push(`S${s + 1}✓(+${off}d)`);
    } else {
      cells.push(`S${s + 1}—`);
    }
  }
  if (pick(0) && pick(1) && pick(2) && pick(3) && pick(4)) fullChain.push(w.sig);
  if (hitRows.findIndex((r) => r.w === w) < 10) {
    console.log(`  ${w.date} ${w.kid.padEnd(12)} ${cells.join(' ')}`);
  }
});
console.log(`各档命中题数：${stageHits.map((n, i) => `S${i + 1}=${n}`).join(' / ')}（共 ${eligible.length} 道错题）`);
console.log(`【观察指标 · 不作门槛】五档完成率：${stageHits.map((n, i) => `S${i + 1}=${eligible.length ? (100 * n / eligible.length).toFixed(1) : '—'}%`).join(' / ')}`);
console.log(`【观察指标 · 不作门槛】完整走完 5 档的错题 ${fullChain.length} 道（证明间隔序列真的按 1→3→7→15→30 推进）`);

/* ------------------------- ② weakKeys 固定种子 20 次对照 ------------------------- */
console.log('\n=== ② weakKeys 是否真的影响抽题（固定种子 20 次对照）===');
console.log('代码位置：assets/js/core/tasks.js → rankWeak()（getPool 返回前排序） + pickQuestions() 里的 weakShuffle()');
const weak = mastery.weakKeysOf(finalData, 8);
const weakSet = new Set(weak.map((w) => w.kid));
console.log(`weakKeys（${weak.length} 个）：${weak.map((w) => `${w.kid} ${Math.round(w.rate * 100)}%`).join('、') || '无'}`);
const mathOf = (day) => day.tasks.filter((t) => t.subject === 'math').flatMap((t) => t.questions);
const ratioOf = (day, freshOnly = false) => {
  // freshOnly：排除「到期的复习题」，只看向新题池时 weakKeys 的排序影响
  const qs = mathOf(day).filter((q) => !freshOnly || !q.review);
  const hit = qs.filter((q) => weakSet.has(mastery.knowledgeIdOf(q))).length;
  return { total: qs.length, hit };
};
// B′ 新结构：清空「题面回避 + 知识点冷却」= recentByDay / recentKeys 一起清
const baseSnap = deep({ recentByDay: {}, recentKeys: {} });
const masterySnap = deep(finalData.mastery);
const RUNS = 20;
const withRuns = [];
const withoutRuns = [];
for (let i = 0; i < RUNS; i++) {
  currentMs = START + (DAYS + 60 + i) * DAY_MS;
  const KEY = store.todayKey();
  // 带 weakKeys（复习队列清空、课程收敛关闭：全年级池里知识点多于当日槽位，排序才有对照意义）
  store.update((d) => {
    d.recentByDay = deep(baseSnap.recentByDay);
    d.recentKeys = deep(baseSnap.recentKeys);
    d.reviewQueue = {};
    d.mastery = deep(masterySnap);
    d.settings.course.currentUnitId = null;
    delete d.days[KEY];
  });
  const withDay = ensureToday();
  const w = ratioOf(withDay, true);
  withRuns.push(w);
  // 同一天、同题库、清空 weakKeys（复习队列同样清空，保证只对比排序）
  store.update((d) => {
    d.recentByDay = deep(baseSnap.recentByDay);
    d.recentKeys = deep(baseSnap.recentKeys);
    d.reviewQueue = {};
    d.mastery = { v: 1, keys: {}, masteredAt: {}, aliases: {} };
    d.settings.course.currentUnitId = null;
    delete d.days[KEY];
  });
  const withoutDay = ensureToday();
  const wo = ratioOf(withoutDay, true);
  withoutRuns.push(wo);
  if (i < 10) console.log(`  第 ${i + 1} 次（排除复习题）：带 weak ${w.hit}/${w.total} · 清空 ${wo.hit}/${wo.total}`);
}
const mean = (arr, key) => arr.reduce((s, x) => s + x[key], 0) / arr.length;
const withMean = mean(withRuns, 'hit');
const withoutMean = mean(withoutRuns, 'hit');
const totalMean = mean(withRuns, 'total');
console.log(`20 次均值：带 weakKeys 命中 ${withMean.toFixed(2)}/${totalMean.toFixed(2)} = ${(100 * withMean / totalMean).toFixed(1)}%；清空 ${withoutMean.toFixed(2)}/${totalMean.toFixed(2)} = ${(100 * withoutMean / totalMean).toFixed(1)}%`);
console.log('说明：weakKeys 只影响排序，不改题量；效果被两条既有规则限制——①逻辑/拓展题在同档内仍先占位（logicFirst）；②同一天同一科目同一知识点最多 1 题。因此命中差异来自「弱知识点能否挤进当天有限的槽位」。');
assert('② weakKeys 改变了薄弱知识点抽题分布（20 次均值）', withMean > withoutMean + 0.3,
  `带 weak ${withMean.toFixed(2)} 道 vs 清空 ${withoutMean.toFixed(2)} 道`);

/* ------------------------- 状态迁移公式 ------------------------- */
console.log('\n=== 状态迁移公式（seen 只是次数，不等于掌握）===');
// weakKeys 对照把日期推到了 160 天之后；③④⑤/小测必须回到主场景的末日
currentMs = START + (DAYS - 1) * DAY_MS;
store.update((d) => {
  d.settings.course.version = '人教版';
  d.settings.course.grade = 3;
  d.settings.course.term = '上册';
  d.settings.course.currentUnitId = 'ma-u05';
  d.settings.course.learnedUnits = [];
});
console.log('  答对：status = mastered 当且仅当');
console.log('        (已是 mastered 且累积正确率 ≥75%)');
console.log('        || (seen ≥3 且累积正确率 ≥80%)');
console.log('        || (连续答对 streak ≥3 且累积正确率 ≥75%)；否则 learning');
console.log('  答错：status = review（并进入/推进间隔队列）');
const snap = mastery.masterySnapshot(finalData);
console.log(`  实测：${snap.filter((x) => x.status === 'mastered').length} 个 mastered / ${snap.filter((x) => x.status === 'learning').length} 个 learning / ${snap.filter((x) => x.status === 'review').length} 个 review`);
snap.slice(0, 6).forEach((x) => console.log(`    ${x.name.padEnd(12)} seen=${x.seen} correct=${x.correct} rate=${x.rate}% streak=${x.streak} → ${x.status}`));

/* ------------------------- ③ 周报 ------------------------- */
console.log('\n=== ③ 本周掌握了什么 / 哪个知识点要复习 ===');
const report = mastery.weeklyReport(finalData, lastDate);
console.log('结论：', report.sentence);
console.log(`本周新掌握：${report.newMasteredNames.join('、') || '无'}`);
console.log(`需要复习：${report.needReviewNames.join('、') || '无'}；7 天内到期复习 ${report.dueNext7} 道`);
assert('③ 能给出掌握 / 待复习结论', report.newMasteredNames.length > 0 || report.needReviewNames.length > 0, report.sentence);

/* ------------------------- ④ 掌握度曲线 ------------------------- */
console.log('\n=== ④ 成长页：每个知识点的掌握度变化（近 30 天）===');
const { dates, series } = mastery.masterySeries(finalData, 30, 6);
const allKnow = COURSE_UNITS.flatMap((u) => u.lessons.flatMap((l) => l.knowledge)).length;
const scoped = COURSE_UNITS
  .filter((u) => u.order <= 5)
  .flatMap((u) => u.lessons.flatMap((l) => l.knowledge)).length;
const recorded = Object.keys(finalData.mastery.keys).length;
console.log(`曲线天数：${dates.length}（${dates[0]} → ${dates[dates.length - 1]}），曲线 ${series.length} 条`);
console.log(`口径：课程表全部知识点 ${allKnow} 个；本次收敛范围（单元 ≤5）${scoped} 个；本模拟有作答记录 ${recorded} 个；`);
console.log('      成长页只画「最近 30 天有记录」的知识点，且默认最多 6 条（避免一屏 18 条线），不是只掌握了 6 个。');
let varied = 0;
series.forEach((s) => {
  const vals = s.points.filter((p) => p.value !== null).map((p) => p.value);
  const distinct = [...new Set(vals)];
  if (distinct.length >= 2) varied += 1;
  console.log(`  ${s.name.padEnd(12)} 当前 ${s.rate ?? '—'}% · 变化 ${distinct.length >= 2 ? `${vals[0]}% → ${vals[vals.length - 1]}%` : '（本段无变化）'}`);
});
assert('④ 至少 2 个知识点出现掌握度变化曲线', varied >= 2, `${varied} 条有变化`);
assert('④ 曲线条数受默认上限约束（不是全部知识点）', series.length <= 6, `${series.length} 条 / 上限 6`);

/* ------------------------- 每周小测 ------------------------- */
console.log('\n=== 每周 10 题小测 ===');
const quiz = mastery.buildWeeklyQuiz(finalData, 3, lastDate);
const scope = courseScope(finalData.settings.course, 'math');
const outside = quiz.items.filter((q) => !scope || !q.unitId || !scope.allowed.has(q.unitId));
const oldN = quiz.items.filter((q) => q.quizKind === 'old').length;
const newN = quiz.items.length - oldN;
const newKids = [...new Set(quiz.items.filter((q) => q.quizKind === 'new').map((q) => `${q.kid}(${mastery.masterySnapshot(finalData).find((x) => x.kid === q.kid)?.status || '?'})`))];
console.log(`本周小测：${quiz.items.length} 题（旧知识点 ${oldN} / 新知识点 ${newN}），weekKey=${quiz.weekKey}`);
console.log(`「新」的口径 = 尚未达到 mastered 的知识点（不是「新题面」）；且只从当前 + 已学单元里选。`);
console.log(`新知识点：${newKids.join('、') || '无'}；范围外题 ${outside.length} 道`);
const items = quiz.items.map((q, i) => ({ kid: q.kid, kind: q.quizKind, ok: i < 7 }));
store.update((d) => {
  mastery.saveQuizResult(d, {
    weekKey: quiz.weekKey,
    date: lastDate,
    total: quiz.items.length,
    correct: 7,
    items
  });
});
const savedQuiz = mastery.latestQuiz(store.load());
console.log(`结果单独存：${savedQuiz.weekKey} ${savedQuiz.correct}/${savedQuiz.total}（旧 ${savedQuiz.oldCount} / 新 ${savedQuiz.newCount}），不加积分、不重做`);
assert('小测新旧知识点混合', oldN > 0 && newN > 0, `旧 ${oldN} / 新 ${newN}`);
assert('小测为 10 题', quiz.items.length === 10, `${quiz.items.length} 题`);
assert('小测只用当前/已学单元（不提前考未学）', outside.length === 0,
  outside.length ? `${outside.length} 道在范围外` : '0 道越界');

/* ------------------------- ⑤ 100 天掌握度连续 ------------------------- */
console.log('\n=== ⑤ 跨 100 天掌握度是否连续（dailyHistory 已裁剪）===');
const rec = day1Kid ? finalData.mastery.keys[day1Kid] : null;
const histDay1 = finalData.dailyHistory?.[day1Stats?.date];
console.log(`第 1 天知识点：${day1Kid || '无'}`);
console.log(`第 1 天记录：${day1Stats ? `seen=${day1Stats.seen} correct=${day1Stats.correct} lastSeen=${day1Stats.lastSeen}` : '无'}`);
console.log(`第 100 天累积：${rec ? `seen=${rec.seen} correct=${rec.correct} streak=${rec.streak} status=${rec.status} lastSeen=${rec.lastSeen}` : '无'}`);
console.log(`dailyHistory[${day1Stats?.date || '—'}] 是否已被 90 天窗口裁掉：${histDay1 ? '否' : '是'}`);
assert('⑤ 掌握度不依赖 dailyHistory、100 天后仍连续',
  Boolean(rec) && rec.seen >= (day1Stats?.seen || 0) && rec.correct >= (day1Stats?.correct || 0),
  `seen ${day1Stats?.seen ?? 0} → ${rec?.seen ?? 0}`);

/* ------------------------- 收敛场景：ma-u01 的变式/内容缺口 ------------------------- */
console.log('\n=== 收敛场景附加：currentUnitId = ma-u01（40 天，表内乘法全错）===');
store.resetAll();
store.update((d) => {
  d.settings.course.version = '人教版';
  d.settings.course.grade = 3;
  d.settings.course.term = '上册';
  d.settings.course.currentUnitId = 'ma-u01';
  d.settings.course.learnedUnits = [];
});
currentMs = START;
const convWrongs = [];
const convApps = [];
for (let d = 0; d < 40; d += 1) {
  currentMs = START + d * DAY_MS;
  const day = ensureToday();
  const mathTasks = day.tasks.filter((t) => t.subject === 'math');
  mathTasks.forEach((t, ti) => {
    const results = t.questions.map(() => false); // 全部答错，最大化复习压力
    const wrongReasons = results.map((_, qi) => ({ reason: ['careless', 'noknow', 'guess'][qi % 3], qIdx: qi }));
    t.questions.forEach((q, qi) => {
      convWrongs.push({ date: day.date, kid: mastery.knowledgeIdOf(q), sig: mastery.promptSig(q), prompt: q.prompt, review: Boolean(q.review) });
      if (q.review) convApps.push({ date: day.date, orig: q.reviewOrig, stage: q.reviewStage, prompt: q.prompt });
    });
    completeTask(t.id, {
      firstTryCorrect: 0,
      total: t.questions.length,
      questionResults: results,
      wrongReasons
    });
  });
}
const convData = deep(store.load());
const convGaps = mastery.contentGapSummary(convData);
const lastConvDay = ensureToday();
const available = lastConvDay.courseScope?.math?.textbookAvailable ?? 0;
const pickedTextbook = mathOf(lastConvDay).filter((q) => q.courseTrack === 'textbook');
const poolPrompts = new Set(pickedTextbook.map((q) => q.prompt));
const poolForms = new Set(pickedTextbook.map((q) => String(q.prompt || '').replace(/\d+(\.\d+)?/g, '#')));
console.log(`ma-u01 每天可抽教材题 ${available} 道；今日实际抽到 ${pickedTextbook.length} 道（不同题面 ${poolPrompts.size} 个 / 不同问法 ${poolForms.size} 种）`);
console.log(`内容缺口 ${convGaps.length} 条${convGaps.length ? `：${convGaps.map((g) => `${g.name}×${g.count}（${g.reason}）`).join('、')}` : ''}`);
console.log(`40 天内原始错题 ${convWrongs.filter((w) => !w.review).length} 道，复习变式出场 ${convApps.length} 次`);
const lastConv = store.todayKey();
console.log(`第 40 天（${lastConv}）复习队列条目 ${Object.values(convData.reviewQueue || {}).reduce((s, a) => s + a.length, 0)} 条`);
assert('收敛场景会如实记录内容缺口（不拿原题凑数）', convGaps.length > 0, `${convGaps.length} 条`);
console.log('结论：ma-u01 只有 4 道题面、1 种问法，变式供给有限 → 这是【内容缺口】，归阶段 C 补，不用凑数掩盖。');

/* ------------------------- 迁移 / 重置入口 ------------------------- */
console.log('\n=== 重置 / 迁移入口 ===');
const clone = deep(finalData);
const target = mastery.migrateKnowledgeId(clone, day1Kid, `${day1Kid}-renamed`);
console.log(`迁移 ${day1Kid} → ${day1Kid}-renamed：${target.ok ? '✓' : '✗'}，alias=${clone.mastery.aliases[day1Kid]}，keys 命中=${Boolean(clone.mastery.keys[`${day1Kid}-renamed`])}`);
mastery.resetMastery(clone);
console.log(`重置后：keys=${Object.keys(clone.mastery.keys).length}，reviewQueue=${Object.keys(clone.reviewQueue).length}，trend=${Object.keys(clone.masteryTrend).length}`);

console.log('\n=== 结论 ===');
console.log(`① 变式重现 ${(100 * hits / (eligible.length || 1)).toFixed(1)}% · 五档全中 ${fullChain.length} 条 · ② weakKeys 均值 ${withMean.toFixed(2)} vs ${withoutMean.toFixed(2)} 道 · ③ 周报可答 · ④ 曲线 ${series.length} 条（上限 6）· ⑤ 100 天连续`);
console.log(failures === 0 ? '全部断言通过' : `存在 ${failures} 项未通过`);
process.exitCode = failures === 0 ? 0 : 1;
