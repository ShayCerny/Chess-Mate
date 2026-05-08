#pragma once
#include <string>
#include <vector>
#include <cstdint>

enum class Piece : uint8_t { NONE, PAWN, KNIGHT, BISHOP, ROOK, QUEEN, KING };
enum class Color : uint8_t { NONE, WHITE, BLACK };

struct Square {
    Piece piece;
    Color color;
};

struct Move {
    int from;
    int to;
};

struct BoardState {
    Square squares[64];
    Color turn;
    bool castle_wk;
    bool castle_wq;
    bool castle_bk;
    bool castle_bq;
    int en_passant; // -1 if none, else target square index (0-63)
    int full_move;
    int half_move;
};

// squares[0] = a8, squares[63] = h1 (matches TypeScript FenDecoder convention)
BoardState parseFen(const std::string& fen);
std::vector<Move> getLegalMoves(const BoardState& state);
bool isInCheck(const BoardState& state, Color color);
