/**
 * sim_course4.mjs —— 四科课程收敛验收
 *
 * 场景：
 *   1. 默认未配置：四科都没有范围（全年级题池）
 *   2. 语文整册模式：范围 = 所选这一册的全部单元，不跨册
 *   3. 数学单元模式不受影响：仍按「当前单元 + 已学单元」
 *   4. 未配置的英语/科学保持全年级题池
 *   5. 跨科脏数据（数学 currentUnitId 写成语文单元）不会污染范围
 */
const RealDate = Date;
const START = new RealDate('2026-11-09T12:00:00+08:00').getTime();
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

const { ensureToday, regenerateToday } = await import('../assets/js/core/tasks.js');
const store = await import('../assets/js/core/store.js');
const cm = await import('../assets/js/data/course-map.js');

let failed = 0;
function assert(name, ok, detail = '') {
  if (!ok) failed += 1;
  console.log(`  ${ok ? '✔' : '✘'} ${name}${detail ? `（${detail}）` : ''}`);
}
const scopeOf = (subject) => cm.courseScope(cm.courseFor(store.load().settings, subject), subject);

/** 当天某科题里，能挂课程表的题是否全部落在范围内 */
function checkTextbookInScope(day, subject, scope) {
  const qs = day.tasks.filter((t) => t.subject === subject).flatMap((t) => t.questions);
  const annotated = qs.map((q) => ({
    q,
    bookTrack: q.courseTrack === 'textbook',
    unitId: q.courseUnitId || ((q.category === 'logic') ? null : (cm.annotateQuestion(q)?.unitId || null))
  }));
  const textbook = annotated.filter((x) => x.unitId);
  const outside = textbook.filter((x) => !scope.allowed.has(x.unitId));
  return { qs, textbook, outside };
}

console.log('=== 场景 1 · 默认未配置：四科都不收敛 ===');
const day0 = ensureToday();
for (const s of ['math', 'chinese', 'english', 'science']) {
  assert(`${s} 无范围`, scopeOf(s) === null);
  assert(`${s} 当天有题`, day0.tasks.filter((t) => t.subject === s).length > 0,
    `${day0.tasks.filter((t) => t.subject === s).length} 项`);
}

console.log('\n=== 场景 2 · 语文整册模式 ===');
const zhBook = cm.booksOfSubject('chinese').find((b) => b.grade === 3 && b.term === '上册')
  || cm.booksOfSubject('chinese')[0];
console.log(`  选用：${zhBook.grade}年级${zhBook.term}（${zhBook.unitCount} 个单元，${zhBook.key}）`);
store.update((d) => {
  const by = d.settings.courseBySubject || (d.settings.courseBySubject = {});
  by.chinese = by.chinese || {};
  Object.assign(by.chinese, {
    subject: 'chinese',
    mode: 'book',
    version: '人教版',
    grade: zhBook.grade,
    term: zhBook.term,
    bookKey: zhBook.key,
    currentUnitId: zhBook.firstUnitId,
    learnedUnits: []
  });
});
const dayZh = regenerateToday(3);
const zhScope = scopeOf('chinese');
assert('语文有范围', Boolean(zhScope));
assert('语文范围模式为整册', zhScope?.mode === 'book', zhScope?.mode);
assert('语文范围 = 该册全部单元', zhScope?.allowed.size === zhBook.unitCount,
  `${zhScope?.allowed.size} / ${zhBook.unitCount}`);
const bookIds = new Set(cm.unitsOfBook(zhBook.key).map((u) => u.id));
assert('语文范围不含其他册', [...zhScope.allowed].every((id) => bookIds.has(id)));
const zhCheck = checkTextbookInScope(dayZh, 'chinese', zhScope);
assert('语文教材题全部落在本册', zhCheck.outside.length === 0,
  `${zhCheck.outside.length} 道越界 / 共 ${zhCheck.textbook.length} 道可挂课程表`);
assert('当天记录 courseScope.chinese 为整册', dayZh.courseScope?.chinese?.mode === 'book',
  dayZh.courseScope?.chinese?.mode || '无');

console.log('\n=== 场景 3 · 数学单元模式不受影响 ===');
const maBook = cm.booksOfSubject('math').find((b) => b.grade === 3 && b.term === '上册');
store.update((d) => {
  Object.assign(d.settings.course, {
    subject: 'math',
    mode: 'unit',
    grade: maBook.grade,
    term: maBook.term,
    bookKey: maBook.key,
    currentUnitId: maBook.firstUnitId
  });
});
const dayMa = regenerateToday(3);
const maScope = scopeOf('math');
assert('数学范围是单元模式', maScope?.mode !== 'book', maScope?.mode);
assert('数学范围只含数学单元', [...maScope.allowed].every((id) => cm.volumeKeyOfUnit(id).startsWith('math:')),
  `${maScope.allowed.size} 个`);
const maCheck = checkTextbookInScope(dayMa, 'math', maScope);
assert('数学教材题全部落在范围里', maCheck.outside.length === 0,
  `${maCheck.outside.length} 道越界 / 共 ${maCheck.textbook.length} 道`);

console.log('\n=== 场景 4 · 未配置的英语/科学仍用全年级题池 ===');
assert('英语仍无范围', scopeOf('english') === null);
assert('科学仍无范围', scopeOf('science') === null);
assert('英语当天有题', dayMa.tasks.filter((t) => t.subject === 'english').length > 0);
assert('科学当天有题', dayMa.tasks.filter((t) => t.subject === 'science').length > 0);

console.log('\n=== 场景 5 · 跨科脏数据不污染范围 ===');
store.update((d) => { d.settings.course.currentUnitId = zhBook.firstUnitId; });
const dayDirty = regenerateToday(3);
assert('数学范围被拒绝（语文单元 id）', scopeOf('math') === null);
assert('数学当天仍有题（回退全年级题池）', dayDirty.tasks.filter((t) => t.subject === 'math').length > 0);
assert('语文整册范围不受影响', scopeOf('chinese')?.allowed.size === zhBook.unitCount);

console.log(`\n${failed === 0 ? '全部通过' : `${failed} 项失败`}（共 21 项断言）`);
process.exit(failed === 0 ? 0 : 1);
