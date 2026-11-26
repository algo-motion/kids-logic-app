"""API 契約（contracts/api.md）の検証。"""

import pytest

from app import app


@pytest.fixture
def client():
    return app.test_client()


def test_home(client):
    res = client.get("/")
    assert res.status_code == 200
    assert "ろんりあそび" in res.get_data(as_text=True)


def test_health(client):
    assert client.get("/api/health").get_json() == {"status": "ok"}


def test_games(client):
    ids = [g["id"] for g in client.get("/api/games").get_json()["games"]]
    assert ids == ["pattern", "odd_one_out", "size_order", "compare_count"]


def test_puzzles_default(client):
    body = client.get("/api/puzzles?game=pattern").get_json()
    assert body["game"] == "pattern"
    assert body["level"] == 1
    assert len(body["puzzles"]) == 5


def test_puzzles_seed_reproducible(client):
    url = "/api/puzzles?game=compare_count&level=2&count=3&seed=42"
    assert client.get(url).get_json() == client.get(url).get_json()


def test_puzzles_clamped(client):
    body = client.get("/api/puzzles?game=size_order&level=7&count=50").get_json()
    assert body["level"] == 3
    assert len(body["puzzles"]) == 10


@pytest.mark.parametrize("query", ["game=foo", "", "game=pattern&level=abc", "game=pattern&seed=x"])
def test_puzzles_bad_request(client, query):
    res = client.get(f"/api/puzzles?{query}")
    assert res.status_code == 400
    assert "error" in res.get_json()


def test_static_served(client):
    assert client.get("/static/js/app.js").status_code == 200
