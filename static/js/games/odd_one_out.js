// US-2 なかまはずれ
import { el, button } from './util.js';

export function render(container, puzzle, ctx) {
  const grid = el('div', `odd-grid n${puzzle.items.length}`);
  puzzle.items.forEach((emoji, i) => {
    const b = button('choice pop-in', emoji, () => {
      if (i !== puzzle.answer) return ctx.wrong(b);
      b.classList.add('right');
      ctx.correct();
    });
    b.style.animationDelay = `${i * 0.1}s`;
    grid.append(b);
  });
  container.append(grid);
}
