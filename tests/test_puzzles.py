"""受け入れ基準 AC-1〜AC-4 を問題生成の性質として検証する。"""

import pytest

from logic.puzzles import ALL_EMOJI, COMPARE_RULES, PATTERN_SHOWN, category_of, generate

SEEDS = range(40)
LEVELS = [1, 2, 3]


def many(game, level):
    for seed in SEEDS:
        yield from generate(game, level, count=5, seed=seed)


# --- 共通 ---

def test_unknown_game_raises():
    with pytest.raises(ValueError):
        generate("chess")


def test_level_and_count_are_clamped():
    puzzles = generate("pattern", level=9, count=99, seed=1)
    assert len(puzzles) == 10
    assert all(p["level"] == 3 for p in puzzles)
    assert len(generate("pattern", level=-1, count=0, seed=1)) == 1


def test_seed_is_deterministic():
    assert generate("size_order", 2, seed=7) == generate("size_order", 2, seed=7)


@pytest.mark.parametrize("game", ["pattern", "odd_one_out", "size_order", "compare_count"])
def test_common_fields(game):
    for p in generate(game, 1, seed=3):
        assert {"id", "game", "level", "prompt", "items", "choices", "answer"} <= p.keys()
        assert p["game"] == game


# --- US-1 パターン ---

def unit_length(items):
    for n in range(1, len(items)):
        if all(items[i] == items[i % n] for i in range(len(items))):
            return n
    return len(items)


@pytest.mark.parametrize("level", LEVELS)
def test_pattern_choices_and_answer(level):  # AC-1.1, AC-1.2
    for p in many("pattern", level):
        items, choices = p["items"], p["choices"]
        assert len(items) == PATTERN_SHOWN
        assert len(choices) == 3 and len(set(choices)) == 3
        n = unit_length(items)
        assert choices[p["answer"]] == items[PATTERN_SHOWN % n]


@pytest.mark.parametrize("level,expected", [(1, {"AB"}), (2, {"AAB", "ABB"}), (3, {"ABC"})])
def test_pattern_shape_by_level(level, expected):  # AC-1.3
    for p in many("pattern", level):
        items = p["items"]
        n = unit_length(items)
        letters = {}
        shape = "".join(letters.setdefault(e, "ABC"[len(letters)]) for e in items[:n])
        assert shape in expected


# --- US-2 なかまはずれ ---

@pytest.mark.parametrize("level,size", [(1, 4), (2, 4), (3, 5)])
def test_odd_one_out_exactly_one(level, size):  # AC-2.1, AC-2.2
    for p in many("odd_one_out", level):
        items = p["items"]
        assert len(items) == size
        cats = [category_of(e) for e in items]
        odd = [i for i, c in enumerate(cats) if cats.count(c) == 1]
        assert odd == [p["answer"]]


def test_odd_one_out_level1_same_picture_level2_distinct():  # AC-2.2
    for p in many("odd_one_out", 1):
        others = [e for i, e in enumerate(p["items"]) if i != p["answer"]]
        assert len(set(others)) == 1
    for p in many("odd_one_out", 2):
        others = [e for i, e in enumerate(p["items"]) if i != p["answer"]]
        assert len(set(others)) == 3


# --- US-3 おおきい じゅん ---

@pytest.mark.parametrize("level,size", [(1, 3), (2, 4), (3, 5)])
def test_size_order(level, size):  # AC-3.1〜3.3
    for p in many("size_order", level):
        sizes = [it["size"] for it in p["items"]]
        assert len(sizes) == size
        assert len(set(sizes)) == size
        assert sorted(p["answer"]) == list(range(size))
        ordered = [sizes[i] for i in p["answer"]]
        assert ordered == sorted(sizes, reverse=True)
        assert p["answer"] != list(range(size))
        assert len({it["emoji"] for it in p["items"]}) == 1
        assert p["items"][0]["emoji"] in ALL_EMOJI


# --- US-4 どっちが おおい ---

@pytest.mark.parametrize("level", LEVELS)
def test_compare_count(level):  # AC-4.1〜4.3
    max_count, min_diff = COMPARE_RULES[level]
    for p in many("compare_count", level):
        left, right = p["items"]
        assert left["emoji"] != right["emoji"]
        assert 1 <= left["count"] <= max_count and 1 <= right["count"] <= max_count
        assert abs(left["count"] - right["count"]) >= min_diff
        bigger = 0 if left["count"] > right["count"] else 1
        assert p["answer"] == bigger
