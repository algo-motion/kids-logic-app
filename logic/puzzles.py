"""問題生成ロジック（specs/001-logic-games/spec.md の US-1〜US-4）。

すべて純粋関数。seed を渡すと同じ問題を再現できる。
"""

import random

CATEGORIES = {
    "どうぶつ": ["🐶", "🐱", "🐰", "🐻", "🐼", "🐸", "🐵", "🦁"],
    "くだもの": ["🍎", "🍌", "🍇", "🍓", "🍊", "🍑", "🍒", "🍉"],
    "のりもの": ["🚗", "🚌", "🚲", "🚂", "🚀", "🚒", "🚁", "🚜"],
    "おかし": ["🍰", "🍩", "🍪", "🍭", "🍦", "🧁", "🍫", "🍬"],
}
ALL_EMOJI = [e for emojis in CATEGORIES.values() for e in emojis]

GAMES = [
    {"id": "pattern", "title": "つぎは どれ?", "icon": "🔁"},
    {"id": "odd_one_out", "title": "なかまはずれ", "icon": "🔍"},
    {"id": "size_order", "title": "おおきい じゅん", "icon": "📏"},
    {"id": "compare_count", "title": "どっちが おおい?", "icon": "⚖️"},
]

PROMPTS = {
    "pattern": "つぎに くるのは どれかな?",
    "odd_one_out": "なかまはずれは どれかな?",
    "size_order": "おおきい じゅんに タッチしてね",
    "compare_count": "おおいのは どっちかな?",
}

PATTERN_SHOWN = 5
SIZE_SETS = {1: [1, 3, 5], 2: None, 3: [1, 2, 3, 4, 5]}  # None = 1〜5 から 4 つ
COMPARE_RULES = {1: (5, 2), 2: (8, 2), 3: (10, 1)}  # level: (最大数, 最小差)


def category_of(emoji):
    for name, emojis in CATEGORIES.items():
        if emoji in emojis:
            return name
    raise KeyError(emoji)


def _clamp(value, low, high):
    return max(low, min(high, value))


def _pattern(rng, level):
    if level == 1:
        shape = "AB"
    elif level == 2:
        shape = rng.choice(["AAB", "ABB"])
    else:
        shape = "ABC"
    symbols = rng.sample(ALL_EMOJI, len(set(shape)) + 2)
    letter_map = dict(zip(sorted(set(shape)), symbols))
    unit = [letter_map[c] for c in shape]
    items = [unit[i % len(unit)] for i in range(PATTERN_SHOWN)]
    correct = unit[PATTERN_SHOWN % len(unit)]

    distractors = [s for s in dict.fromkeys(unit) if s != correct]
    outsiders = [s for s in symbols if s not in unit]
    choices = [correct] + (distractors + outsiders)[:2]
    rng.shuffle(choices)
    return {"items": items, "choices": choices, "answer": choices.index(correct)}


def _odd_one_out(rng, level):
    main_cat, odd_cat = rng.sample(list(CATEGORIES), 2)
    odd = rng.choice(CATEGORIES[odd_cat])
    if level == 1:
        items = [rng.choice(CATEGORIES[main_cat])] * 3
    else:
        items = rng.sample(CATEGORIES[main_cat], 3 if level == 2 else 4)
    answer = rng.randrange(len(items) + 1)
    items.insert(answer, odd)
    return {"items": items, "choices": [], "answer": answer}


def _size_order(rng, level):
    sizes = SIZE_SETS[level] or rng.sample(range(1, 6), 4)
    sizes = list(sizes)
    descending = sorted(sizes, reverse=True)
    while True:
        rng.shuffle(sizes)
        if sizes != descending:
            break
    emoji = rng.choice(ALL_EMOJI)
    items = [{"emoji": emoji, "size": s} for s in sizes]
    answer = sorted(range(len(sizes)), key=lambda i: -sizes[i])
    return {"items": items, "choices": [], "answer": answer}


def _compare_count(rng, level):
    max_count, min_diff = COMPARE_RULES[level]
    while True:
        left, right = rng.randint(1, max_count), rng.randint(1, max_count)
        if abs(left - right) >= min_diff:
            break
    left_emoji, right_emoji = rng.sample(ALL_EMOJI, 2)
    items = [
        {"emoji": left_emoji, "count": left},
        {"emoji": right_emoji, "count": right},
    ]
    return {"items": items, "choices": [], "answer": 0 if left > right else 1}


_GENERATORS = {
    "pattern": _pattern,
    "odd_one_out": _odd_one_out,
    "size_order": _size_order,
    "compare_count": _compare_count,
}


def generate(game, level=1, count=5, seed=None):
    if game not in _GENERATORS:
        raise ValueError(f"unknown game: {game}")
    level = _clamp(level, 1, 3)
    count = _clamp(count, 1, 10)
    rng = random.Random(seed)
    puzzles = []
    for i in range(count):
        body = _GENERATORS[game](rng, level)
        puzzles.append({
            "id": f"{game}-{level}-{i}-{rng.randrange(100000)}",
            "game": game,
            "level": level,
            "prompt": PROMPTS[game],
            **body,
        })
    return puzzles
