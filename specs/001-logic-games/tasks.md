# タスク: ろんりあそび（001-logic-games）

- **入力**: [spec.md](spec.md), [plan.md](plan.md)
- `[P]` = 他のタスクと並行して進められる
- 各タスクは完了したら `[x]` にする

## フェーズ 1: セットアップ
- [x] T001 プロジェクト構成を作成（`requirements.txt`, `.gitignore`）
- [x] T002 Flask の骨組みと `GET /api/health`（`app.py`）

## フェーズ 2: 仕様
- [x] T003 憲章（`.specify/memory/constitution.md`）
- [x] T004 機能仕様（`spec.md`）
- [x] T005 技術計画（`plan.md`）と API 契約（`contracts/api.md`）
- [x] T006 タスク分解（本ファイル）

## フェーズ 3: 問題生成（テスト先行）
- [x] T007 カテゴリデータと `generate()` の入口・入力の丸め（`logic/puzzles.py`）
- [x] T008 [P] パターン生成とテスト（AC-1.1〜1.3）
- [x] T009 [P] なかまはずれ生成とテスト（AC-2.1〜2.2）
- [x] T010 [P] おおきいじゅん生成とテスト（AC-3.1〜3.3）
- [x] T011 [P] どっちがおおい生成とテスト（AC-4.1〜4.3）

## フェーズ 4: API
- [x] T012 `GET /api/games`, `GET /api/puzzles` とエラー処理
- [x] T013 API テスト（`tests/test_api.py`）

## フェーズ 5: フロントエンド
- [x] T014 画面の骨組み（ホーム / ゲーム / ごほうび）と共通スタイル
- [x] T015 進行管理・保存・音声（`static/js/app.js`）（AC-0.x, AC-5.x）
- [x] T016 [P] パターン UI（`games/pattern.js`）
- [x] T017 [P] なかまはずれ UI（`games/odd_one_out.js`）
- [x] T018 [P] おおきいじゅん UI（`games/size_order.js`）
- [x] T019 [P] どっちがおおい UI（`games/compare_count.js`）
- [x] T020 アニメーション（正解・不正解・ごほうび）と reduced-motion 対応

## フェーズ 6: 仕上げ
- [x] T021 レスポンシブ確認（360px〜1366px）、タップ領域 64px 以上
- [x] T022 README（ローカル実行・デプロイ・手動確認チェックリスト）
- [ ] T023 Vercel へデプロイし、本番で手動確認チェックリストを実施
- [x] T024 本番で 404 になる問題の修正: Vercel の Flask ゼロコンフィグ構成へ移行
      （`api/index.py` → `app.py`、`static/` → `public/static/`、`vercel.json` 削除）
