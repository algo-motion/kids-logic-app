# API 契約: ろんりあそび

すべてのレスポンスは JSON（`/` を除く）。認証なし。

## GET /api/health
稼働確認。
```json
{ "status": "ok" }
```

## GET /api/games
ゲーム一覧。
```json
{
  "games": [
    { "id": "pattern",       "title": "つぎは どれ?",     "icon": "🔁" },
    { "id": "odd_one_out",   "title": "なかまはずれ",     "icon": "🔍" },
    { "id": "size_order",    "title": "おおきい じゅん",  "icon": "📏" },
    { "id": "compare_count", "title": "どっちが おおい?", "icon": "⚖️" }
  ]
}
```

## GET /api/puzzles
問題を取得する。

| パラメータ | 必須 | 型 | 既定値 | 説明 |
|---|---|---|---|---|
| `game` | ○ | string | — | ゲーム ID |
| `level` | | int | 1 | 1〜3 に丸める |
| `count` | | int | 5 | 1〜10 に丸める |
| `seed` | | int | なし | 指定すると同じ問題を再現する |

### 200 OK
```json
{
  "game": "pattern",
  "level": 1,
  "puzzles": [
    {
      "id": "pattern-1-0-48213",
      "game": "pattern",
      "level": 1,
      "prompt": "つぎに くるのは どれかな?",
      "items": ["🍎", "🍌", "🍎", "🍌", "🍎"],
      "choices": ["🐶", "🍌", "🍎"],
      "answer": 1
    }
  ]
}
```

### 400 Bad Request
`game` が不正、または `level` / `count` / `seed` が整数でない場合。
```json
{ "error": "unknown game: foo" }
```
