// US-4 どっちが おおい?
import { el, button } from './util.js';

export function render(container, puzzle, ctx) {
  const wrap = el('div', 'compare');
  puzzle.items.forEach((group, i) => {
    const b = button(`group side-${i}`, '', () => {
      if (i !== puzzle.answer) return ctx.wrong(b);
      b.classList.add('right');
      ctx.correct();
    });
    for (let k = 0; k < group.count; k++) {
      const item = el('span', 'group-item pop-in', group.emoji);
      item.style.animationDelay = `${k * 0.06}s`;
      b.append(item);
    }
    wrap.append(b);
  });
  container.append(wrap);
}
