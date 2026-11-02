#!/usr/bin/env node
/**
 * bump-version.js —— 一键统一全站静态资源版本号
 *
 * 用法：
 *   node bump-version.js              // 自动用 YYYYMMDDa
 *   node bump-version.js 20261103b    // 指定版本号
 *
 * 约定（重要）：
 *   - 版本号只加在 HTML 的 <link>/<script> 上；
 *   - JS 内部的 import 一律不带 ?v=，否则同一模块会被引擎当成两个 URL
 *     加载成两份实例（store.js 的 memoryCache、audio.js 的 AudioContext
 *     等模块级单例会因此分裂，导致数据读写不一致）。
 *   - 依赖模块的缓存由服务端 Cache-Control: no-cache 保证（见 _srv.js），
 *     若部署到第三方静态托管，请一并给 HTML 设置 no-cache。
 *
 * 每次改完 CSS / JS 后跑一次本脚本即可，不再手工改十几处版本号。
 */

const fs = require('fs');
const path = require('path');

const root = __dirname;
const now = new Date();
const auto = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}a`;
const ver = (process.argv[2] || auto).trim();

if (!/^[A-Za-z0-9]+$/.test(ver)) {
  console.error('版本号只能包含字母和数字，例如 20261102a');
  process.exit(1);
}

let changed = 0;
for (const name of fs.readdirSync(root)) {
  if (!name.endsWith('.html')) continue;
  const file = path.join(root, name);
  const src = fs.readFileSync(file, 'utf8');
  // 1) 修正历史遗留的引号错位：attr="path"?v=xxx -> attr="path?v=xxx"
  const fixed = src.replace(/(href|src)="([^"]+)"(\?v=[A-Za-z0-9]+)/g, '$1="$2$3"');
  // 2) 统一所有版本号
  const out = fixed.replace(/\?v=[A-Za-z0-9]+/g, `?v=${ver}`);
  if (out !== src) {
    fs.writeFileSync(file, out);
    changed++;
    console.log('  ✓', name);
  }
}

// 3) 守卫：JS 内部 import 不允许再出现 ?v=
let violations = 0;
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p);
    else if (entry.name.endsWith('.js')) {
      const hits = fs.readFileSync(p, 'utf8').match(/\.js\?v=[A-Za-z0-9]+/g);
      if (hits) {
        violations += hits.length;
        console.error(`  ✗ ${path.relative(root, p)} 仍有 ${hits.length} 处 import 带版本号`);
      }
    }
  }
}
walk(path.join(root, 'assets', 'js'));

console.log(`\n版本号 → ${ver}；更新 ${changed} 个 HTML；JS import 违规 ${violations} 处。`);
if (violations) process.exit(1);
