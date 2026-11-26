# 技術計画: ろんりあそび（001-logic-games）

- **入力**: [spec.md](spec.md)
- **作成日**: 2026-11-26

## 1. 技術スタック
| 項目 | 選定 | 理由 |
|---|---|---|
| 言語 / ランタイム | Python 3.12（Vercel Python Runtime） | 要件 NFR-5。ローカルは 3.12 以上で動作。 |
| Web フレームワーク | Flask 3 | WSGI アプリを `api/index.py` から公開するだけで Vercel で動く。 |
| フロントエンド | HTML + CSS + 素の JavaScript（ES Modules） | ビルド不要（憲章 第7条）、軽量（NFR-1）。 |
| 音声 | Web Speech API `speechSynthesis`（`ja-JP`） | 文字に頼らない指示（憲章 第2条）。追加ライブラリ不要。 |
| 永続化 | ブラウザの `localStorage` | 端末内のみに保存（憲章 第1条）。 |
| テスト | pytest + Flask テストクライアント | 受け入れ基準をサーバー側の問題生成で検証する。 |
| フォント | Zen Maru Gothic（Google Fonts） | 丸ゴシックで子ども向けに読みやすい。 |

## 2. 全体構成
```
ブラウザ ──GET /──────────────▶ Flask (api/index.py) ──▶ templates/index.html
   │      GET /static/*  ─────▶ static/ (CSS, JS)
   │      GET /api/puzzles ───▶ logic/puzzles.py（問題生成・純粋関数）
   │
   └─ ゲーム進行・正誤判定・星/レベル保存はすべてクライアント側
```
- Vercel では `vercel.json` の rewrites で全パスを `api/index` に送る。
- 正誤判定をクライアントで行うことで、ゲーム中に通信が不要になる（NFR-2）。
  子ども向けの練習アプリであり、正解データがクライアントに見えることは問題としない。

## 3. ディレクトリ構成
```
kids-logic-app/
├─ .specify/memory/constitution.md
├─ specs/001-logic-games/{spec.md, plan.md, tasks.md, contracts/api.md}
├─ api/index.py            # Flask アプリ（Vercel のエントリポイント）
├─ logic/puzzles.py        # 問題生成ロジック
├─ templates/index.html
├─ static/css/style.css
├─ static/js/app.js        # 画面遷移・進行・音声・保存
├─ static/js/games/{pattern,odd_one_out,size_order,compare_count}.js
├─ tests/{test_puzzles.py, test_api.py}
├─ requirements.txt / vercel.json / README.md
```

## 4. データモデル（Puzzle）
すべてのゲームで共通の形を返す。`items` と `answer` の中身はゲームごとに異なる。

| フィールド | 型 | 説明 |
|---|---|---|
| `id` | string | 一意な ID |
| `game` | string | `pattern` / `odd_one_out` / `size_order` / `compare_count` |
| `level` | int | 1〜3 |
| `prompt` | string | 読み上げる問題文（ひらがな） |
| `items` | array | 表示する要素 |
| `choices` | array | 選択肢（ない場合は空配列） |
| `answer` | int \| int[] | 正解 |

| game | items | choices | answer |
|---|---|---|---|
| pattern | 絵文字の並び（5 個） | 絵文字 3 個 | 正解の choices インデックス |
| odd_one_out | 絵文字 4〜5 個 | `[]`（items をタップ） | なかまはずれの items インデックス |
| size_order | `{emoji, size}`（size は 1〜5） | `[]` | 大きい順の items インデックス列 |
| compare_count | `[{emoji, count}, {emoji, count}]`（左, 右） | `[]` | 多いほうのインデックス（0=左, 1=右） |

## 5. 問題生成（logic/puzzles.py）
- 公開関数: `generate(game, level, count=5, seed=None) -> list[dict]`
  - `seed` を渡すと `random.Random(seed)` で決定的に生成（テスト用）。
  - 不正な `game` は `ValueError`。`level` は 1〜3、`count` は 1〜10 に丸める。
- 絵文字カテゴリ `CATEGORIES`: どうぶつ / くだもの / のりもの / おかし（各 8 種）。
- 各ゲームの生成規則は spec.md の US-1〜US-4 に従う。
  - pattern: 単位（AB, AAB/ABB, ABC）を作り 5 個展開、6 個目を正解とする。誤答は単位内の別要素＋単位外の絵文字。
  - size_order: 大きさの候補 L1 = {1,3,5} / L2 = {1..5} から 4 つ / L3 = {1..5} すべて。シャッフル後、降順と一致したら再シャッフル。
  - compare_count: レベル別の範囲と最小差を満たすまで再抽選。

## 6. API
詳細は [contracts/api.md](contracts/api.md)。
- `GET /` — SPA 本体
- `GET /api/health` — 稼働確認
- `GET /api/games` — ゲーム一覧
- `GET /api/puzzles?game=&level=&count=` — 問題の取得

## 7. フロントエンド設計
- 画面: ホーム / ゲーム / ごほうび の 3 画面を `hidden` 切り替えで表示する SPA。
- ゲームモジュールの共通インターフェース:
  ```js
  export function render(container, puzzle, ctx)
  // ctx.correct()        正解（問題クリア）
  // ctx.wrong(element)   不正解（element をゆらす）
  ```
- 進行（app.js）: 5 問取得 → 1 問ずつ描画 → `correct` で星アニメ＋音声 → 次へ → 5 問後ごほうび画面。
- 保存キー `ronri-asobi:v1` に `{ [game]: { level, stars, streak } }` を JSON で保存。
  `localStorage` が使えない環境では例外を握りつぶしてメモリ上で動作する。
- アニメーション: CSS keyframes（`pop`, `shake`, `bounce`, `star-burst`, `confetti`）。
  `prefers-reduced-motion` で動きを抑制（NFR-6）。

## 8. デプロイ
- `vercel.json`:
  ```json
  { "rewrites": [{ "source": "/(.*)", "destination": "/api/index" }] }
  ```
- `requirements.txt` に Flask のみ。Vercel が `api/index.py` の `app`（WSGI）を検出して起動する。
- `templates/` と `static/` は `api/index.py` からの絶対パスで参照する。

## 9. テスト方針
| 受け入れ基準 | テスト |
|---|---|
| AC-1.1〜1.3 | `test_pattern_*`（単位のくりかえし、選択肢、レベル別の単位） |
| AC-2.1〜2.2 | `test_odd_one_out_*` |
| AC-3.1〜3.3 | `test_size_order_*` |
| AC-4.1〜4.3 | `test_compare_count_*` |
| API 契約 | `test_api.py` |
- 各ゲーム × 各レベルで多数の seed を回し、性質（プロパティ）を検証する。
- UI（AC-0.x, AC-5.x）は README の手動確認チェックリストで検証する。
