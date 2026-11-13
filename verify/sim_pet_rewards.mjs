/**
 * _pet_rewards.mjs —— 临时校验：宠物升级奖励（发放/自动佩戴/防重复/老存档补发）
 */
const mem = new Map();
globalThis.localStorage = {
  getItem: (k) => (mem.has(k) ? mem.get(k) : null),
  setItem: (k, v) => mem.set(k, String(v)),
  removeItem: (k) => mem.delete(k),
  clear: () => mem.clear()
};

const store = await import('../assets/js/core/store.js');
const pet = await import('../assets/js/core/pet.js');

let pass = 0;
let fail = 0;
const ok = (cond, msg) => {
  if (cond) { pass += 1; console.log('  ✓', msg); }
  else { fail += 1; console.log('  ✗', msg); }
};

pet.createPet('cat', '测试猫');
store.update((d) => { d.pet.exp = 19; });

// 1) Lv.1 → Lv.2：+3 喂食跨过 20
const r1 = pet.feed('cookie');
ok(r1.ok && r1.leveledUp, '喂食跨过阈值会升级');
ok(r1.rewards.length === 1 && r1.rewards[0].level === 2, '返回 Lv.2 奖励');
ok((store.load().pet.inventory.food.carrot || 0) === 2, 'Lv.2 奖励胡萝卜 ×2 进背包');

// 2) 连续读档不重复发
const invBefore = JSON.stringify(store.load().pet.inventory.food);
pet.stateOf();
pet.stateOf();
ok(JSON.stringify(store.load().pet.inventory.food) === invBefore, '重复读档不重复发奖励');
ok(store.load().pet.claimedLevel === 2, 'claimedLevel 记录到 Lv.2');

// 3) Lv.2 → Lv.3：解锁红围巾并自动戴上（neck 槽位空）
store.update((d) => { d.pet.exp = 49; });
const r2 = pet.feed('cookie');
ok(r2.leveledUp && r2.rewards[0].level === 3, '升到 Lv.3');
const p2 = store.load().pet;
ok(p2.ownedDeco.includes('scarf'), 'Lv.3 解锁红围巾');
ok(p2.wear.neck === 'scarf', '红围巾自动戴上（升级后可见变化）');
ok((p2.inventory.food.cookie || 0) >= 2, 'Lv.3 同时发小饼干');

// 4) 连续跳多级：Lv.3 → Lv.10
store.update((d) => {
  d.pet.exp = 1099;
  d.pet.inventory.food.cookie = 5;
});
const r3 = pet.feed('cookie');
ok(r3.leveledUp && r3.rewards.length === 7, '一次跨 7 级，逐级发 7 份奖励');
const p3 = store.load().pet;
ok(p3.level === 10, '等级到 Lv.10');
ok(p3.ownedDeco.includes('crown'), 'Lv.10 解锁小皇冠');
ok(p3.ownedScene.includes('candy'), 'Lv.10 解锁乐园「糖果王国」');
ok(p3.wear.head === 'red-bow', 'Lv.6 的蝴蝶结先占住头部槽位，后面的帽子/皇冠不强行替换');

// 5) 满级后不再发奖励、不再升级
const r4 = pet.feed('cookie');
ok(!r4.leveledUp && r4.rewards.length === 0, '满级后不再升级发奖');

// 6) 老存档补发：删掉 claimedLevel，按 exp 对应等级补发
store.update((d) => {
  d.pet.exp = 420;
  delete d.pet.claimedLevel;
  d.pet.ownedDeco = [];
  d.pet.ownedScene = ['garden'];
  d.pet.wear = { head: null, neck: null, face: null, back: null };
});
const view = pet.stateOf();
const p6 = store.load().pet;
ok(p6.claimedLevel === p6.level, '老存档补发后 claimedLevel 对齐当前等级');
ok(p6.ownedDeco.includes('scarf'), '老存档补发拿到 Lv.3 红围巾');
ok(p6.ownedScene.includes('home'), '老存档补发拿到 Lv.5 乐园');
ok(view.level === 7 && view.levelTier === 3, 'Lv.7 光环档位为 3');
ok(!!view.nextReward && view.nextReward === pet.LEVEL_REWARDS[view.level + 1]?.label, '进度条显示下一级奖励');

console.log(`\n== 结果：通过 ${pass} / 失败 ${fail} ==`);
process.exit(fail ? 1 : 0);
