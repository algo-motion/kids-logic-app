// US-1 パターン「つぎは どれ?」
import { el, button } from './util.js';

export function render(container, puzzle, ctx) {
  const row = el('div', 'sequence');
  puzzle.items.forEach((emoji, i) => {
    const tile = el('div', 'tile pop-in', emoji);
    tile.style.animationDelay = `${i * 0.12}s`;
    row.append(tile);
  });
  const question = el('div', 'tile tile-question', '❓');
  row.append(question);

  const choices = el('div', 'choices');
  puzzle.choices.forEach((emoji, i) => {
    choices.append(button('choice', emoji, (b) => {
      if (i !== puzzle.answer) return ctx.wrong(b);
      question.textContent = emoji;
      question.classList.add('filled');
      b.classList.add('right');
      ctx.correct();
    }));
  });

  container.append(row, choices);
}
