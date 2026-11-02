/* 共享测量模块（规范 v10「改一处量一次」的护栏）
   教训：过去的错误全是「读错了」而不是「算错了」——
   选错元素 / HSL 标尺 / L 值 / WCAG 线性分支 / 正则误读科学计数法 / 注入元素污染计数。
   所以这里先做已知答案 fixture，读不准就拒绝报数。 */
(function (global) {
  'use strict';

  /* ---------- 1. 矩阵解析（唯一入口，禁止在别处手写正则） ---------- */
  function parseMatrix(tx) {
    if (!tx || tx === 'none') return { deg: null, scaleY: null, raw: tx };
    try {
      const m = new DOMMatrixReadOnly(tx);
      return {
        deg: Math.atan2(m.b, m.a) * 180 / Math.PI,
        scaleY: m.d,
        raw: tx
      };
    } catch (e) {
      return { deg: null, scaleY: null, raw: tx };
    }
  }
  function readTransform(el) {
    return parseMatrix(getComputedStyle(el).transform);
  }

  /* ---------- 2. 已知答案 fixture ---------- */
  const FIXTURES = [
    ['matrix(1, 0, 0, 5.55112e-17, 0, 0)', 'scaleY', 0.00],
    ['matrix(1, 0, 0, 1.11022e-16, 0, 0)', 'scaleY', 0.00],
    ['matrix(1, 0, 0, 0.35, 0, 0)', 'scaleY', 0.35],
    ['matrix(0, 0, 0, 0, 0, 0)', 'scaleY', 0.00],
    ['matrix(0.9945, -0.1045, 0.1045, 0.9945, 0, 0)', 'deg', -6.00],
    ['none', 'scaleY', null]
  ];
  function selfTest() {
    const results = FIXTURES.map(([tx, key, exp]) => {
      const got = parseMatrix(tx)[key];
      const ok = exp === null ? got === null : Math.abs(got - exp) < 0.005;
      return { tx, key, exp, got, ok };
    });
    return { ok: results.every(r => r.ok), results };
  }

  /* ---------- 3. 统计范围只认 svg.pet 子树（排除注入元素） ---------- */
  function scopedAnimations(svg) {
    return document.getAnimations().filter(a => {
      const t = a.effect && a.effect.target;
      return t && t.nodeType === 1 && svg.contains(t);
    });
  }

  /* ---------- 4. 像素采样：SVG → data URL → canvas → getImageData ---------- */
  /* 为什么不用截图：截图在部分环境不可用，但取像素与截图无关。
     CSS 动画的当前帧不会随 XMLSerializer 序列化，所以先把计算后的 matrix 内联进克隆。 */
  function renderToCanvas(svg, px) {
    px = px || 400;
    const clone = svg.cloneNode(true);
    clone.querySelectorAll('[data-joint]').forEach(n => n.remove());
    const src = [...svg.querySelectorAll('*')];
    const dst = [...clone.querySelectorAll('*')];
    src.forEach((el, i) => {
      const d = dst[i];
      if (!d || !d.style) return;
      const cs = getComputedStyle(el);
      if (cs.transform && cs.transform !== 'none') {
        d.style.transform = cs.transform;
        /* 关键：克隆脱离了页面样式表，transform-origin 不会自动带上。
           不内联它就会回退到 view-box 的 50% 50% = (100,100)，
           于是 torso 髋点 (100,176)、眼睛 (100,74)、颈点等全被错位渲染。
           （阶段 4 发现：头 +13° 在克隆里跑到了反方向，就是这条漏了） */
        d.style.transformOrigin = cs.transformOrigin;
      }
      d.style.transformBox = 'view-box';
    });
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    clone.setAttribute('width', '200');
    clone.setAttribute('height', '200');
    clone.setAttribute('viewBox', '0 0 200 200');
    const xml = new XMLSerializer().serializeToString(clone);
    const url = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(xml);
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const cv = document.createElement('canvas');
        cv.width = px; cv.height = px;
        const ctx = cv.getContext('2d');
        ctx.clearRect(0, 0, px, px);
        ctx.drawImage(img, 0, 0, px, px);
        let data;
        try {
          data = ctx.getImageData(0, 0, px, px);
        } catch (e) { return reject(e); }
        resolve({
          px,
          data,
          /* viewBox 坐标 → 画布像素 */
          at(x, y) {
            const ix = Math.round(x * px / 200), iy = Math.round(y * px / 200);
            if (ix < 0 || iy < 0 || ix >= px || iy >= px) return null;
            const o = (iy * px + ix) * 4;
            return { r: data.data[o], g: data.data[o + 1], b: data.data[o + 2], a: data.data[o + 3] };
          }
        });
      };
      img.onerror = () => reject(new Error('SVG data URL 渲染失败'));
      img.src = url;
    });
  }

  /* 区域内「无绘制」（alpha < 阈值）的像素统计，返回数量与包围盒 */
  function sampleRegion(view, x0, y0, x1, y1, alphaMax) {
    alphaMax = alphaMax == null ? 40 : alphaMax;
    let n = 0, minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (let y = y0; y <= y1; y += 0.5) {
      for (let x = x0; x <= x1; x += 0.5) {
        const p = view.at(x, y);
        if (!p) continue;
        if (p.a < alphaMax) {
          n++;
          if (x < minX) minX = x;
          if (y < minY) minY = y;
          if (x > maxX) maxX = x;
          if (y > maxY) maxY = y;
        }
      }
    }
    return {
      count: n,
      emptyPx: n,
      bbox: n ? { x: minX, y: minY, w: maxX - minX, h: maxY - minY } : null
    };
  }

  /* 区域内出现最多的颜色（用于确认这块像素到底是谁画的） */
  function topColors(view, x0, y0, x1, y1, limit) {
    limit = limit || 6;
    const map = new Map();
    for (let y = y0; y <= y1; y += 0.5) {
      for (let x = x0; x <= x1; x += 0.5) {
        const p = view.at(x, y);
        if (!p) continue;
        const k = `${p.r},${p.g},${p.b},${p.a}`;
        map.set(k, (map.get(k) || 0) + 1);
      }
    }
    return [...map.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([k, n]) => ({ rgb: k, n }));
  }

  /* 区域内与参考色（背景/草地）接近的像素数 + 包围盒 —— 穿帮判据 */
  function countNear(view, x0, y0, x1, y1, ref, tol) {
    tol = tol == null ? 10 : tol;
    let n = 0, minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (let y = y0; y <= y1; y += 0.5) {
      for (let x = x0; x <= x1; x += 0.5) {
        const p = view.at(x, y);
        if (!p) continue;
        if (Math.abs(p.r - ref.r) <= tol && Math.abs(p.g - ref.g) <= tol && Math.abs(p.b - ref.b) <= tol) {
          n++;
          if (x < minX) minX = x;
          if (y < minY) minY = y;
          if (x > maxX) maxX = x;
          if (y > maxY) maxY = y;
        }
      }
    }
    return {
      count: n,
      bbox: n ? { x: minX, y: minY, w: maxX - minX, h: maxY - minY } : null
    };
  }

  /* ---------- 5. 角色隐藏差帧法（零硬编码穿帮判据，阶段 5 六只场景通用） ----------
     A = 正常帧，B = 同一 freeze 下把角色子树 visibility:hidden。
     楔形区里 |A-B| < tol 的像素 = 角色根本没画到那里 = 直接看到背景 = 穿帮。
     这样不需要知道草地/竹林/黄昏的具体颜色，也不受 vignette 径向提亮影响。 */
  function diffHoles(a, b, x0, y0, x1, y1, tol) {
    tol = tol == null ? 12 : tol;
    let holes = 0, drawn = 0;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (let y = y0; y <= y1; y += 0.5) {
      for (let x = x0; x <= x1; x += 0.5) {
        const p = a.at(x, y), q = b.at(x, y);
        if (!p || !q) continue;
        const d = Math.abs(p.r - q.r) + Math.abs(p.g - q.g) + Math.abs(p.b - q.b);
        if (d < tol) {
          holes++;
          if (x < minX) minX = x;
          if (y < minY) minY = y;
          if (x > maxX) maxX = x;
          if (y > maxY) maxY = y;
        } else {
          drawn++;
        }
      }
    }
    return {
      holes,
      drawn,
      bbox: holes ? { x: minX, y: minY, w: maxX - minX, h: maxY - minY } : null
    };
  }

  global.PM = {
    parseMatrix, readTransform, selfTest, scopedAnimations,
    renderToCanvas, sampleRegion, topColors, countNear, diffHoles
  };
})(window);
