#include <catch2/catch_test_macros.hpp>
#include "board.h"
#include <algorithm>
#include <vector>

// Index helper: squares[0]=a8, squares[63]=h1
// sq('e',1) == 60, sq('e',8) == 4
static int sq(char file, int rank) {
    return (8 - rank) * 8 + (file - 'a');
}

static bool hasMove(const std::vector<Move>& moves, int from, int to) {
    return std::any_of(moves.begin(), moves.end(),
        [from, to](const Move& m){ return m.from == from && m.to == to; });
}

// ── parseFen ──────────────────────────────────────────────────────────────────

TEST_CASE("parseFen: starting position", "[parseFen]") {
    auto s = parseFen("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1");
    REQUIRE(s.turn == Color::WHITE);
    REQUIRE(s.castle_wk);
    REQUIRE(s.castle_wq);
    REQUIRE(s.castle_bk);
    REQUIRE(s.castle_bq);
    REQUIRE(s.en_passant == -1);
    REQUIRE(s.squares[sq('e',1)].piece == Piece::KING);
    REQUIRE(s.squares[sq('e',1)].color == Color::WHITE);
    REQUIRE(s.squares[sq('e',8)].piece == Piece::KING);
    REQUIRE(s.squares[sq('e',8)].color == Color::BLACK);
}

TEST_CASE("parseFen: en passant target square stored correctly", "[parseFen]") {
    // After 1.e4, en passant target is e3
    auto s = parseFen("rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1");
    REQUIRE(s.en_passant == sq('e',3));
}

// ── Castling ──────────────────────────────────────────────────────────────────

TEST_CASE("Castling: kingside legal when path is clear", "[castling]") {
    auto s = parseFen("r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1");
    auto moves = getLegalMoves(s);
    REQUIRE(hasMove(moves, sq('e',1), sq('g',1)));
}

TEST_CASE("Castling: queenside legal when path is clear", "[castling]") {
    auto s = parseFen("r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1");
    auto moves = getLegalMoves(s);
    REQUIRE(hasMove(moves, sq('e',1), sq('c',1)));
}

TEST_CASE("Castling: illegal when passing through check", "[castling]") {
    // Black rook on d8 controls d1 — white cannot castle queenside through d1
    auto s = parseFen("3rk3/8/8/8/8/8/8/R3K3 w Q - 0 1");
    auto moves = getLegalMoves(s);
    REQUIRE_FALSE(hasMove(moves, sq('e',1), sq('c',1)));
}

TEST_CASE("Castling: illegal when king has moved (no castling rights)", "[castling]") {
    auto s = parseFen("r3k2r/8/8/8/8/8/8/R3K2R w - - 0 1");
    auto moves = getLegalMoves(s);
    REQUIRE_FALSE(hasMove(moves, sq('e',1), sq('g',1)));
    REQUIRE_FALSE(hasMove(moves, sq('e',1), sq('c',1)));
}

TEST_CASE("Castling: illegal on the side whose rook has moved", "[castling]") {
    // Only kingside rights remain
    auto s = parseFen("r3k2r/8/8/8/8/8/8/R3K2R w K - 0 1");
    auto moves = getLegalMoves(s);
    REQUIRE(hasMove(moves, sq('e',1), sq('g',1)));
    REQUIRE_FALSE(hasMove(moves, sq('e',1), sq('c',1)));
}

// ── En passant ────────────────────────────────────────────────────────────────

TEST_CASE("En passant: capture move present in legal moves", "[en_passant]") {
    // Black pawn d4, white pawn on e4 (just double-pushed) — en passant target e3
    auto s = parseFen("k7/8/8/8/3pP3/8/8/7K b - e3 0 1");
    auto moves = getLegalMoves(s);
    REQUIRE(hasMove(moves, sq('d',4), sq('e',3)));
}

TEST_CASE("En passant: captured pawn removed from correct square", "[en_passant]") {
    auto s = parseFen("k7/8/8/8/3pP3/8/8/7K b - e3 0 1");
    BoardState after = applyMove(s, {sq('d',4), sq('e',3)});
    // White pawn on e4 must be captured and removed
    REQUIRE(after.squares[sq('e',4)].piece == Piece::NONE);
    // Black pawn now on e3
    REQUIRE(after.squares[sq('e',3)].piece == Piece::PAWN);
    REQUIRE(after.squares[sq('e',3)].color == Color::BLACK);
}

// ── Promotion ─────────────────────────────────────────────────────────────────

TEST_CASE("Promotion: pawn on back rank generates promotion move", "[promotion]") {
    // White pawn on e7, can advance to e8
    auto s = parseFen("k7/4P3/8/8/8/8/8/7K w - - 0 1");
    auto moves = getLegalMoves(s);
    REQUIRE(hasMove(moves, sq('e',7), sq('e',8)));
}

TEST_CASE("Promotion: pawn auto-promotes to queen", "[promotion]") {
    auto s = parseFen("k7/4P3/8/8/8/8/8/7K w - - 0 1");
    BoardState after = applyMove(s, {sq('e',7), sq('e',8)});
    REQUIRE(after.squares[sq('e',8)].piece == Piece::QUEEN);
    REQUIRE(after.squares[sq('e',8)].color == Color::WHITE);
}

// ── Check ─────────────────────────────────────────────────────────────────────

TEST_CASE("isInCheck: detects king in check from queen", "[check]") {
    // Black queen on d1 attacks white king on e1 orthogonally
    auto s = parseFen("k7/8/8/8/8/8/8/3qK3 w - - 0 1");
    REQUIRE(isInCheck(s, Color::WHITE));
    REQUIRE_FALSE(isInCheck(s, Color::BLACK));
}

TEST_CASE("isInCheck: not in check in quiet position", "[check]") {
    auto s = parseFen("k7/8/8/8/8/8/8/7K w - - 0 1");
    REQUIRE_FALSE(isInCheck(s, Color::WHITE));
    REQUIRE_FALSE(isInCheck(s, Color::BLACK));
}

TEST_CASE("isInCheck: discovered check via rook ray", "[check]") {
    // Black rook on a1, white king on e1 — rook attacks along rank 1
    auto s = parseFen("k7/8/8/8/8/8/8/r3K3 w - - 0 1");
    REQUIRE(isInCheck(s, Color::WHITE));
}

TEST_CASE("getLegalMoves: moves that expose king are filtered", "[check]") {
    // White king in check from rook on a1 — d1 and f1 remain under attack
    auto s = parseFen("k7/8/8/8/8/8/8/r3K3 w - - 0 1");
    auto moves = getLegalMoves(s);
    REQUIRE_FALSE(hasMove(moves, sq('e',1), sq('d',1)));
    REQUIRE_FALSE(hasMove(moves, sq('e',1), sq('f',1)));
    REQUIRE(hasMove(moves, sq('e',1), sq('d',2)));
    REQUIRE(hasMove(moves, sq('e',1), sq('e',2)));
    REQUIRE(hasMove(moves, sq('e',1), sq('f',2)));
}

// ── Stalemate ─────────────────────────────────────────────────────────────────

TEST_CASE("Stalemate: no legal moves and not in check", "[stalemate]") {
    // Black king a8, white queen b6, white king h1 — black is stalemated
    auto s = parseFen("k7/8/1Q6/8/8/8/8/7K b - - 0 1");
    auto moves = getLegalMoves(s);
    REQUIRE(moves.empty());
    REQUIRE_FALSE(isInCheck(s, Color::BLACK));
}

// ── getBestMove ───────────────────────────────────────────────────────────────

static bool moveInLegal(const BoardState& s, Move m) {
    if (m.from == -1) return false;
    return hasMove(getLegalMoves(s), m.from, m.to);
}

TEST_CASE("getBestMove: Easy (depth 2) returns a legal move", "[getBestMove]") {
    auto s = parseFen("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1");
    Move m = getBestMove(s, 0);
    REQUIRE(moveInLegal(s, m));
}

TEST_CASE("getBestMove: Medium (depth 3) returns a legal move", "[getBestMove]") {
    // Simple two-king position for speed
    auto s = parseFen("k7/8/8/8/8/8/8/4K3 w - - 0 1");
    Move m = getBestMove(s, 1);
    REQUIRE(moveInLegal(s, m));
}

TEST_CASE("getBestMove: Hard (depth 4) returns a legal move", "[getBestMove]") {
    // Simple two-king position for speed
    auto s = parseFen("k7/8/8/8/8/8/8/4K3 w - - 0 1");
    Move m = getBestMove(s, 2);
    REQUIRE(moveInLegal(s, m));
}

TEST_CASE("getBestMove: returns {-1,-1} when no legal moves exist", "[getBestMove]") {
    // Stalemate — no moves available
    auto s = parseFen("k7/8/1Q6/8/8/8/8/7K b - - 0 1");
    Move m = getBestMove(s, 0);
    REQUIRE(m.from == -1);
    REQUIRE(m.to == -1);
}

TEST_CASE("getBestMove: chosen move does not leave own king in check", "[getBestMove]") {
    // White in check from black rook on a1 — any legal move must escape check
    auto s = parseFen("k7/8/8/8/8/8/8/r3K3 w - - 0 1");
    Move m = getBestMove(s, 0);
    REQUIRE(moveInLegal(s, m));
    BoardState after = applyMove(s, m);
    REQUIRE_FALSE(isInCheck(after, Color::WHITE));
}
