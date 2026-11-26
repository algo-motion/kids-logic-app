"""Flask アプリ（Vercel のエントリポイント）。API 契約: specs/001-logic-games/contracts/api.md"""

import sys
from pathlib import Path

from flask import Flask, jsonify, render_template, request

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from logic.puzzles import GAMES, generate  # noqa: E402

app = Flask(
    __name__,
    template_folder=str(ROOT / "templates"),
    static_folder=str(ROOT / "static"),
)
app.json.ensure_ascii = False


@app.get("/")
def home():
    return render_template("index.html")


@app.get("/api/health")
def health():
    return jsonify(status="ok")


@app.get("/api/games")
def games():
    return jsonify(games=GAMES)


@app.get("/api/puzzles")
def puzzles():
    game = request.args.get("game", "")
    try:
        level = int(request.args.get("level", 1))
        count = int(request.args.get("count", 5))
        seed = request.args.get("seed")
        seed = int(seed) if seed is not None else None
    except ValueError:
        return jsonify(error="level, count, seed must be integers"), 400
    try:
        items = generate(game, level, count, seed)
    except ValueError as e:
        return jsonify(error=str(e)), 400
    return jsonify(game=game, level=items[0]["level"], puzzles=items)


if __name__ == "__main__":
    app.run(debug=True, port=5000)
