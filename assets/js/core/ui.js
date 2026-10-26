/**
 * ui.js —— 通用 DOM 与小交互工具
 */

export function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value == null || value === false) continue;
    if (key === 'text') node.textContent = value;
    else if (key === 'html') node.innerHTML = value;
    else if (key === 'class') node.className = value;
    else if (key === 'dataset') Object.assign(node.dataset, value);
    else if (key === 'style' && typeof value === 'object') Object.assign(node.style, value);
    else if (key.startsWith('on') && typeof value === 'function') {
      node.addEventListener(key.slice(2).toLowerCase(), value);
    } else if (key in node && key !== 'list') {
      node[key] = value;
    } else {
      node.setAttribute(key, value === true ? '' : value);
    }
  }
  const list = Array.isArray(children) ? children : [children];
  list.forEach((child) => {
    if (child == null || child === false) return;
    node.append(child instanceof Node ? child : document.createTextNode(String(child)));
  });
  return node;
}

export function qs(selector, root = document) {
  return root.querySelector(selector);
}

export function clear(node) {
  while (node.firstChild) node.removeChild(node.firstChild);
}

/* ------------------------- 轻提示 ------------------------- */

let toastNode = null;
let toastTimer = 0;

export function toast(message, type = '') {
  if (!toastNode) {
    toastNode = el('div', { class: 'toast', role: 'status' });
    document.body.append(toastNode);
  }
  toastNode.textContent = message;
  toastNode.className = `toast show ${type}`.trim();
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toastNode.className = 'toast';
  }, 2200);
}

/* ------------------------- 对话框 ------------------------- */

/**
 * @param {{title:string, body:string, actions?:Array<{label:string,value:any,kind?:string}>}} options
 * @returns {Promise<any>} 选择结果；关闭返回 null
 */
export function dialog({ title, body, actions }) {
  return new Promise((resolve) => {
    const list = actions && actions.length ? actions : [{ label: '知道了', value: true }];
    const overlay = el('div', { class: 'overlay', role: 'dialog', 'aria-modal': 'true' });
    const sheet = el('div', { class: 'sheet' });

    sheet.append(el('h3', { text: title }));
    if (body) sheet.append(el('p', { text: body }));

    const actionRow = el('div', { class: 'sheet-actions' });
    list.forEach((action) => {
      const btn = el('button', {
        class: `btn ${action.kind === 'primary' ? 'btn-primary' : action.kind === 'danger' ? 'btn-danger' : 'btn-ghost'}`,
        type: 'button',
        text: action.label
      });
      btn.addEventListener('click', () => close(action.value));
      actionRow.append(btn);
    });
    sheet.append(actionRow);
    overlay.append(sheet);

    function close(value) {
      overlay.remove();
      document.removeEventListener('keydown', onKey);
      resolve(value);
    }
    function onKey(e) {
      if (e.key === 'Escape') close(null);
    }
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) close(null);
    });
    document.addEventListener('keydown', onKey);
    document.body.append(overlay);
    const first = sheet.querySelector('button');
    if (first) first.focus({ preventScroll: true });
  });
}

/* ------------------------- 长按 ------------------------- */

/** 长按触发（家长核对入口用），移动超过 12px 取消 */
export function longPress(node, ms, onLongPress) {
  let timer = 0;
  let startX = 0;
  let startY = 0;

  const cancel = () => {
    clearTimeout(timer);
    timer = 0;
  };
  const start = (e) => {
    if (e.button != null && e.button !== 0) return;
    startX = e.clientX;
    startY = e.clientY;
    cancel();
    timer = setTimeout(() => {
      timer = 0;
      navigator.vibrate?.(30);
      onLongPress();
    }, ms);
  };
  const move = (e) => {
    if (!timer) return;
    if (Math.abs(e.clientX - startX) > 12 || Math.abs(e.clientY - startY) > 12) cancel();
  };

  node.addEventListener('pointerdown', start);
  node.addEventListener('pointermove', move);
  node.addEventListener('pointerup', cancel);
  node.addEventListener('pointercancel', cancel);
  node.addEventListener('pointerleave', cancel);
  node.addEventListener('contextmenu', (e) => e.preventDefault());
}

export function vibrate(ms = 20) {
  navigator.vibrate?.(ms);
}
