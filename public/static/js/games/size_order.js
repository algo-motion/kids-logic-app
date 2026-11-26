// US-3 おおきい じゅん
import { el, button } from './util.js';

export function render(container, puzzle, ctx) {
  let step = 0;
  const row = el('div', 'size-row');
  puzzle.items.forEach((item, i) => {
    const b = button('size-item pop-in', '', () => {
      if (b.disabled) return;
      if (puzzle.answer[step] !== i) return ctx.wrong(b);
      step += 1;
      b.disabled = true;
      b.classList.add('done');
      b.append(el('span', 'badge', String(step)));
      if (step === puzzle.answer.length) ctx.correct();
    });
    b.append(el('span', 'size-emoji', item.emoji));
    b.style.setProperty('--size', item.size);
    b.style.animationDelay = `${i * 0.1}s`;
    row.append(b);
  });
  container.append(row);
}
