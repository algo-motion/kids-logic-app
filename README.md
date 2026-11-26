# 🧩 ろんりあそび

4〜5 歳向けの論理あそび Web アプリ（Python / Flask、Vercel にデプロイ可能）。
仕様駆動開発（Spec-driven development）で作成しています。

| ドキュメント | 内容 |
|---|---|
| [.specify/memory/constitution.md](.specify/memory/constitution.md) | 憲章（変えない原則） |
| [specs/001-logic-games/spec.md](specs/001-logic-games/spec.md) | 機能仕様（WHAT / WHY） |
| [specs/001-logic-games/plan.md](specs/001-logic-games/plan.md) | 技術計画（HOW） |
| [specs/001-logic-games/contracts/api.md](specs/001-logic-games/contracts/api.md) | API 契約 |
| [specs/001-logic-games/tasks.md](specs/001-logic-games/tasks.md) | タスク |

## ゲーム
- 🔁 **つぎは どれ?** — きまりを見つけて、つぎの絵をえらぶ
- 🔍 **なかまはずれ** — ひとつだけ ちがう なかまを見つける
- 📏 **おおきい じゅん** — 大きいものから順にタップ
- ⚖️ **どっちが おおい?** — 数が多いほうをえらぶ

## ローカルで動かす
```bash
python -m venv .venv
# Windows: .venv\Scripts\activate   macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt pytest
pytest
python app.py           # http://localhost:5000
```

## Vercel にデプロイ
```bash
npm i -g vercel
vercel          # プレビュー
vercel --prod   # 本番
```
または GitHub に push して Vercel ダッシュボードからリポジトリをインポート（設定変更は不要）。

## 手動確認チェックリスト（AC-0.x / AC-5.x）
- [ ] ホームに 4 つのゲームが表示され、レベル（★）と星の数が見える
- [ ] ゲームを選ぶと問題文が読み上げられる／🔊 でもう一度読み上げられる
- [ ] 正解で星のアニメーションと「すごいね!」、自動で次の問題へ進む
- [ ] 不正解で絵がゆれて「もういちど やってみよう」、やり直せる
- [ ] 5 問後にごほうび画面と紙吹雪が出る
- [ ] 1 回目正解が 3 問つづくとレベルアップ表示、再読み込み後も残る
- [ ] 幅 360px のスマートフォンでも横スクロールが出ない
