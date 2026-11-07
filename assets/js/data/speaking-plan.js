/**
 * speaking-plan.js —— 听说练习的发音难度分级 + 跨天复习队列（纯函数，node 可直接验证）
 *
 * 四级发音难度：单音节词 → 多音节词 → 连读/失去爆破 → 句子重音语调。
 * 复习队列：练过当天登记 → origin+1 天 → origin+3 天 → origin+7 天 → 毕业。
 * 这里不做任何评分/通过判定，只负责「什么时候再练一次」。
 */

export const LEVELS = [
  { id: 1, name: '单音节词' },
  { id: 2, name: '多音节词' },
  { id: 3, name: '连读 / 失去爆破' },
  { id: 4, name: '句子重音语调' }
];

export const REVIEW_OFFSETS = [1, 3, 7];

export function levelName(level) {
  const hit = LEVELS.find((l) => l.id === level);
  return hit ? hit.name : LEVELS[0].name;
}

/** 粗略数音节：元音组数量，结尾不发音的 e 减一 */
export function syllableCount(word) {
  const w = String(word || '').toLowerCase().replace(/[^a-z]/g, '');
  if (!w) return 0;
  let groups = (w.match(/[aeiouy]+/g) || []).length;
  if (w.endsWith('e') && groups > 1) groups -= 1;
  return Math.max(1, groups);
}

/**
 * 发音难度分级：
 *   单词 1 个音节 → 1；≥2 个音节 → 2；
 *   3 个词以内的短句（连读/弱读/失去爆破高发）→ 3；
 *   4 个词以上的句子（重音与语调）→ 4。
 */
export function levelOfItem(item) {
  const text = String(item?.text || '');
  if (item?.type === 'word') return syllableCount(text) <= 1 ? 1 : 2;
  const words = text.split(/\s+/).filter(Boolean).length;
  return words <= 3 ? 3 : 4;
}

function pad(n) { return String(n).padStart(2, '0'); }

function addDays(key, delta) {
  const [y, m, d] = key.split('-').map(Number);
  const date = new Date(y, m - 1, d + delta);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/**
 * 练完一项后计算下一次复现：
 *   - 第一次练（prev 为空）→ origin+1 天
 *   - 到期复习练完 → 按 origin+3 / origin+7 推进
 *   - origin+7 那天练完 → 返回 null（毕业，移出队列）
 *   - 未到复习日重复练同一项 → 原样保留，不跳级
 */
export function scheduleNext(prev, todayKey, level) {
  if (!prev) {
    return {
      kind: null, text: '', zh: '', level,
      origin: todayKey, step: 0, due: addDays(todayKey, REVIEW_OFFSETS[0])
    };
  }
  if (prev.due > todayKey) return prev;
  if (prev.step >= REVIEW_OFFSETS.length - 1) return null;
  const step = prev.step + 1;
  return { ...prev, step, level, due: addDays(prev.origin, REVIEW_OFFSETS[step]) };
}

/** 队列里到期（含逾期）的条目，按发音难度从易到难 */
export function dueEntries(queue, todayKey, kind) {
  return Object.entries(queue || {})
    .filter(([, e]) => e && e.kind === kind && e.due <= todayKey)
    .sort((a, b) => (a[1].level - b[1].level) || (a[1].due < b[1].due ? -1 : 1));
}
