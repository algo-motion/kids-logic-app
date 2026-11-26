export function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

export function button(className, text, onTap) {
  const b = el('button', className, text);
  b.type = 'button';
  b.addEventListener('click', () => onTap(b));
  return b;
}
