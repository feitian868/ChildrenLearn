/**
 * question-spec.js —— 题型规格书（阶段 C）
 *
 * 边界（硬约束，来自阶段 C 指令）：
 * - 孩子学校实际课本（版本 + 册次 + 当前单元）尚未确认：本文件只写
 *   「规格书 schema + 通用能力规格 + ma-u01 一份示范」，
 *   version / grade / term 一律留空并标「骨架待核对」，
 *   不按现有题库 source 推断教材事实、不猜。
 * - 只写 ma-u01 一份示范，不铺开四科、不铺开其他单元。
 * - 规格书是「出题/审题的契约」：新题入库必须过 question-check.js 的断言，
 *   存量题库只扫描报告、不修改。
 */

/** 规格书 schema：字段清单 + 校验规则（checkSpec 使用） */
export const SPEC_SCHEMA = {
  unitId: { type: 'string', required: true, desc: '对应 course-map.js 的单元 id' },
  unitName: { type: 'string', required: true, desc: '单元名（骨架，待课本核对）' },
  version: { type: 'string', required: false, desc: '教材版本：留空 = 骨架待核对，不按 source 推断' },
  grade: { type: 'number|null', required: false, desc: '年级：留空 = 骨架待核对' },
  term: { type: 'string', required: false, desc: '册次：留空 = 骨架待核对' },
  testsWhat: { type: 'string', required: true, desc: '考什么：本单元要测的能力一句话' },
  askPatterns: { type: 'array', required: true, min: 3, max: 5, desc: '3~5 种问法（认知形式，不是换数字）' },
  distractorRules: { type: 'array', required: true, min: 3, desc: '干扰项构造规则：必须是本单元真实易错点，不许用随机词' },
  difficultyPath: { type: 'array', required: true, min: 2, desc: '难度递增路径（级别必须递增）' },
  commonErrors: { type: 'array', required: true, min: 2, desc: '易错点清单' },
  forbid: { type: 'array', required: true, min: 2, desc: '禁止条款：至少含「答案泄漏在题干」「只换数字不改认知层级」' }
};

/** 通用能力规格：不分单元、不分版本，课本核对前只写能力层 */
export const GENERIC_ABILITY_SPEC = {
  version: '',   // 骨架待核对：以孩子学校实际课本封面为准
  grade: null,   // 骨架待核对
  term: '',      // 骨架待核对
  draft: true,
  cognitiveLevels: [
    { level: 1, code: 'recall', name: '识记 / 直接计算', desc: '凭口诀、公式、定义一步得出结果' },
    { level: 2, code: 'apply', name: '应用 / 辨析', desc: '在情境中选方法、做互译、辨析易混点' }
  ],
  questionContract: {
    forbid: ['答案泄漏在题干', '只换数字不改认知层级', '干扰项使用随机词'],
    review: '新题一律 status:pending-review，家长审核 approved 后才进抽题池'
  }
};

/* ============================================================
   ma-u01 示范规格书（唯一一份，不铺开）
   ⚠ 课本核对前：unitName / 知识点来自课程表骨架，不得当作教材事实。
   ============================================================ */
const MA_U01 = {
  unitId: 'ma-u01',
  unitName: '表内乘法（骨架待核对）',
  version: '',   // 骨架待核对：不按题池 source 推断教材版本
  grade: null,   // 骨架待核对
  term: '',      // 骨架待核对
  draft: true,
  testsWhat: '熟记 1~9 乘法口诀，理解乘法是「几个几相加」的简便写法，会用口诀求积、由积回溯口诀与因数，并解决「每份数 × 份数」的简单实际问题。',
  askPatterns: [
    { id: 'product-recall', name: '口诀直算', desc: '直接求积：a × b = （ ）' },
    { id: 'inverse-recall', name: '口诀回溯', desc: '口诀补全、由积求因数、填运算符号' },
    { id: 'meaning-translate', name: '意义互译', desc: '「几个几」与乘法算式互相改写' },
    { id: 'compare-operate', name: '比较与辨析', desc: '积与数比大小、选正确的口诀' },
    { id: 'apply-solve', name: '解决问题', desc: '每份数 × 份数的生活应用题，带单位与答句意识' }
  ],
  distractorRules: [
    '口诀混淆：用相邻口诀或同积口诀做干扰（如四六二十四 ↔ 三八二十四、六七四十二 ↔ 六八四十八）',
    '乘法当加法：a × b 误算成 a + b（如 5 × 6 得 11）',
    '意义看错：份数与每份数颠倒、或没改写成乘法（如 3+3+3+3 选成 3×3 或 4+4+4）',
    '相邻得数：±1、±一份的数（如 7 × 8 = 56 干扰 55/57/48）',
    '干扰项必须与正确项同类型（数对数、口诀对口诀），禁止随机词'
  ],
  difficultyPath: [
    { level: 1, desc: '口诀回忆：直接求积、口诀补全、几个几互译' },
    { level: 2, desc: '应用辨析：解决问题、口诀辨析、填运算符号' }
  ],
  commonErrors: [
    '口诀混淆（如六七四十二记成六七四十八）',
    '乘数顺序颠倒后不会迁移（把 7 × 6 当成陌生的题）',
    '把乘法当加法算（5 × 6 写成 11）',
    '应用题漏单位、漏答句'
  ],
  forbid: [
    '答案泄漏在题干',
    '只换数字不改认知层级',
    '干扰项使用与本单元无关的随机词',
    '超出表内乘法范围（乘数或积超出 1~9 口诀表）'
  ]
};

export const UNIT_SPECS = { 'ma-u01': MA_U01 };

/** 取某单元的规格书；没有（未写示范的单元）返回 null —— 不得按 source 推断补造 */
export function specOf(unitId) {
  return UNIT_SPECS[unitId] || null;
}

/** 按 SPEC_SCHEMA 校验一份规格书，返回问题清单（空数组 = 合格） */
export function checkSpec(spec) {
  const problems = [];
  if (!spec || typeof spec !== 'object') return ['规格书不是对象'];
  for (const [field, rule] of Object.entries(SPEC_SCHEMA)) {
    const v = spec[field];
    if (rule.type === 'number|null') {
      if (v !== null && typeof v !== 'number') problems.push(`${field} 应为 number|null`);
      continue;
    }
    if (rule.type === 'array') {
      if (!Array.isArray(v)) { if (rule.required) problems.push(`缺数组字段 ${field}`); continue; }
      if (rule.min && v.length < rule.min) problems.push(`${field} 至少 ${rule.min} 条（当前 ${v.length}）`);
      if (rule.max && v.length > rule.max) problems.push(`${field} 至多 ${rule.max} 条（当前 ${v.length}）`);
      continue;
    }
    if (rule.required && (typeof v !== rule.type || (rule.type === 'string' && !v))) {
      problems.push(`缺必填字段 ${field}`);
    }
  }
  // 难度路径必须递增
  if (Array.isArray(spec.difficultyPath)) {
    for (let i = 1; i < spec.difficultyPath.length; i++) {
      if (!(spec.difficultyPath[i].level >= spec.difficultyPath[i - 1].level)) {
        problems.push('difficultyPath 级别必须递增');
        break;
      }
    }
  }
  // 禁止条款必须含两条硬禁令
  const forbid = (spec.forbid || []).join('|');
  if (!forbid.includes('答案泄漏在题干')) problems.push('forbid 缺「答案泄漏在题干」');
  if (!forbid.includes('只换数字不改认知层级')) problems.push('forbid 缺「只换数字不改认知层级」');
  return problems;
}
