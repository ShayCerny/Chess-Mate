#include "board.h"
#include <sstream>
#include <cctype>
#include <cmath>

// "e3" -> index. squares[0]=a8, so rank 8 is row 0, rank 1 is row 7.
static int algebraicToIndex(const std::string& sq) {
    if (sq.size() < 2) return -1;
    int col = sq[0] - 'a';
    int rank = sq[1] - '0';
    int row = 8 - rank;
    if (col < 0 || col > 7 || row < 0 || row > 7) return -1;
    return row * 8 + col;
}

BoardState parseFen(const std::string& fen) {
    BoardState state = {};
    for (int i = 0; i < 64; i++) state.squares[i] = {Piece::NONE, Color::NONE};
    state.en_passant = -1;

    std::istringstream ss(fen);
    std::string ranks_str, turn_str, castles_str, ep_str, half_str, full_str;
    ss >> ranks_str >> turn_str >> castles_str >> ep_str >> half_str >> full_str;

    int idx = 0;
    for (char c : ranks_str) {
        if (c == '/') continue;
        if (std::isdigit(c)) {
            idx += c - '0';
        } else {
            Color color = std::isupper(c) ? Color::WHITE : Color::BLACK;
            Piece piece = Piece::NONE;
            switch (std::tolower(c)) {
                case 'p': piece = Piece::PAWN;   break;
                case 'n': piece = Piece::KNIGHT; break;
                case 'b': piece = Piece::BISHOP; break;
                case 'r': piece = Piece::ROOK;   break;
                case 'q': piece = Piece::QUEEN;  break;
                case 'k': piece = Piece::KING;   break;
                default: break;
            }
            if (idx < 64) state.squares[idx++] = {piece, color};
        }
    }

    state.turn    = (turn_str == "w") ? Color::WHITE : Color::BLACK;
    state.castle_wk = (castles_str.find('K') != std::string::npos);
    state.castle_wq = (castles_str.find('Q') != std::string::npos);
    state.castle_bk = (castles_str.find('k') != std::string::npos);
    state.castle_bq = (castles_str.find('q') != std::string::npos);

    if (ep_str != "-") state.en_passant = algebraicToIndex(ep_str);
    state.half_move = half_str.empty() ? 0 : std::stoi(half_str);
    state.full_move = full_str.empty() ? 1 : std::stoi(full_str);

    return state;
}

// Returns true if `square` is attacked by any piece of `by_color`.
static bool isAttacked(const BoardState& state, int square, Color by_color) {
    int col = square % 8;

    // Pawn attacks
    if (by_color == Color::WHITE) {
        // White pawns move toward rank 8 (lower indices), attacking diagonally up
        if (col > 0 && square + 9 < 64 &&
            state.squares[square + 9].piece == Piece::PAWN &&
            state.squares[square + 9].color == Color::WHITE) return true;
        if (col < 7 && square + 7 < 64 &&
            state.squares[square + 7].piece == Piece::PAWN &&
            state.squares[square + 7].color == Color::WHITE) return true;
    } else {
        // Black pawns move toward rank 1 (higher indices), attacking diagonally down
        if (col < 7 && square - 7 >= 0 &&
            state.squares[square - 7].piece == Piece::PAWN &&
            state.squares[square - 7].color == Color::BLACK) return true;
        if (col > 0 && square - 9 >= 0 &&
            state.squares[square - 9].piece == Piece::PAWN &&
            state.squares[square - 9].color == Color::BLACK) return true;
    }

    // Knight attacks
    int row = square / 8;
    const int knight_offs[] = {-17, -15, -10, -6, 6, 10, 15, 17};
    for (int off : knight_offs) {
        int t = square + off;
        if (t < 0 || t >= 64) continue;
        if (std::abs(t % 8 - col) > 2) continue;
        if (std::abs(t / 8 - row) > 2) continue;
        if (state.squares[t].piece == Piece::KNIGHT && state.squares[t].color == by_color) return true;
    }

    // Diagonal rays (bishop / queen)
    const int diag[] = {-9, -7, 7, 9};
    for (int d : diag) {
        int prev_col = col;
        int curr = square + d;
        while (curr >= 0 && curr < 64) {
            int cc = curr % 8;
            if (std::abs(cc - prev_col) != 1) break;
            const Square& sq = state.squares[curr];
            if (sq.color != Color::NONE) {
                if (sq.color == by_color && (sq.piece == Piece::BISHOP || sq.piece == Piece::QUEEN)) return true;
                break;
            }
            prev_col = cc;
            curr += d;
        }
    }

    // Orthogonal rays (rook / queen)
    const int orth[] = {-8, 8, -1, 1};
    for (int d : orth) {
        int prev_col = col;
        int curr = square + d;
        while (curr >= 0 && curr < 64) {
            int cc = curr % 8;
            if ((d == -1 || d == 1) && std::abs(cc - prev_col) != 1) break;
            const Square& sq = state.squares[curr];
            if (sq.color != Color::NONE) {
                if (sq.color == by_color && (sq.piece == Piece::ROOK || sq.piece == Piece::QUEEN)) return true;
                break;
            }
            prev_col = cc;
            curr += d;
        }
    }

    // King proximity
    const int king_offs[] = {-9, -8, -7, -1, 1, 7, 8, 9};
    for (int off : king_offs) {
        int t = square + off;
        if (t < 0 || t >= 64) continue;
        if (std::abs(t % 8 - col) > 1) continue;
        if (state.squares[t].piece == Piece::KING && state.squares[t].color == by_color) return true;
    }

    return false;
}

static int findKing(const BoardState& state, Color color) {
    for (int i = 0; i < 64; i++) {
        if (state.squares[i].piece == Piece::KING && state.squares[i].color == color) return i;
    }
    return -1;
}

bool isInCheck(const BoardState& state, Color color) {
    int k = findKing(state, color);
    if (k < 0) return false;
    Color enemy = (color == Color::WHITE) ? Color::BLACK : Color::WHITE;
    return isAttacked(state, k, enemy);
}

static BoardState applyMove(const BoardState& state, const Move& m) {
    BoardState next = state;
    Square moving = next.squares[m.from];

    // En passant capture: remove the captured pawn
    if (moving.piece == Piece::PAWN && m.to == state.en_passant && state.en_passant >= 0) {
        int direction = (moving.color == Color::WHITE) ? 8 : -8;
        next.squares[state.en_passant + direction] = {Piece::NONE, Color::NONE};
    }

    // Castling: move rook
    if (moving.piece == Piece::KING) {
        int diff = m.to - m.from;
        if (diff == 2) {  // Kingside: rook from h-file to f-file
            next.squares[m.from + 1] = next.squares[m.from + 3];
            next.squares[m.from + 3] = {Piece::NONE, Color::NONE};
        } else if (diff == -2) {  // Queenside: rook from a-file to d-file
            next.squares[m.from - 1] = next.squares[m.from - 4];
            next.squares[m.from - 4] = {Piece::NONE, Color::NONE};
        }
    }

    // Move piece
    next.squares[m.to]   = moving;
    next.squares[m.from] = {Piece::NONE, Color::NONE};

    // Pawn promotion (auto-queen)
    if (moving.piece == Piece::PAWN) {
        int to_row = m.to / 8;
        if ((moving.color == Color::WHITE && to_row == 0) ||
            (moving.color == Color::BLACK && to_row == 7)) {
            next.squares[m.to].piece = Piece::QUEEN;
        }
    }

    // Update castling rights
    if (moving.piece == Piece::KING) {
        if (moving.color == Color::WHITE) { next.castle_wk = false; next.castle_wq = false; }
        else                              { next.castle_bk = false; next.castle_bq = false; }
    }
    if (moving.piece == Piece::ROOK || state.squares[m.to].piece == Piece::ROOK) {
        if (m.from == 63 || m.to == 63) next.castle_wk = false;
        if (m.from == 56 || m.to == 56) next.castle_wq = false;
        if (m.from == 7  || m.to == 7)  next.castle_bk = false;
        if (m.from == 0  || m.to == 0)  next.castle_bq = false;
    }

    // Update en passant target
    if (moving.piece == Piece::PAWN && std::abs(m.to - m.from) == 16) {
        next.en_passant = (m.from + m.to) / 2;
    } else {
        next.en_passant = -1;
    }

    next.turn = (state.turn == Color::WHITE) ? Color::BLACK : Color::WHITE;
    return next;
}

std::vector<Move> getLegalMoves(const BoardState& state) {
    std::vector<Move> legal;
    Color my  = state.turn;
    Color opp = (my == Color::WHITE) ? Color::BLACK : Color::WHITE;

    auto tryAdd = [&](int from, int to) {
        if (to < 0 || to >= 64) return;
        if (state.squares[to].color == my) return;
        Move mv{from, to};
        BoardState next = applyMove(state, mv);
        if (!isInCheck(next, my)) legal.push_back(mv);
    };

    for (int from = 0; from < 64; from++) {
        if (state.squares[from].color != my) continue;
        Piece piece = state.squares[from].piece;
        int col = from % 8;
        int row = from / 8;

        switch (piece) {
            case Piece::PAWN: {
                int dir       = (my == Color::WHITE) ? -8 : 8;
                int start_row = (my == Color::WHITE) ?  6 : 1;

                // Single push
                int fwd = from + dir;
                if (fwd >= 0 && fwd < 64 && state.squares[fwd].color == Color::NONE) {
                    tryAdd(from, fwd);
                    // Double push
                    if (row == start_row) {
                        int fwd2 = from + dir * 2;
                        if (state.squares[fwd2].color == Color::NONE) tryAdd(from, fwd2);
                    }
                }

                // Captures and en passant
                for (int dc : {dir - 1, dir + 1}) {
                    int cap = from + dc;
                    if (cap < 0 || cap >= 64) continue;
                    if (std::abs(cap % 8 - col) != 1) continue;
                    if (state.squares[cap].color == opp) tryAdd(from, cap);
                    else if (cap == state.en_passant)   tryAdd(from, cap);
                }
                break;
            }

            case Piece::KNIGHT: {
                for (int off : {-17, -15, -10, -6, 6, 10, 15, 17}) {
                    int to = from + off;
                    if (to < 0 || to >= 64) continue;
                    if (std::abs(to % 8 - col) > 2) continue;
                    tryAdd(from, to);
                }
                break;
            }

            case Piece::BISHOP: {
                for (int d : {-9, -7, 7, 9}) {
                    int pc = col, curr = from + d;
                    while (curr >= 0 && curr < 64) {
                        int cc = curr % 8;
                        if (std::abs(cc - pc) != 1) break;
                        if (state.squares[curr].color == my) break;
                        tryAdd(from, curr);
                        if (state.squares[curr].color == opp) break;
                        pc = cc; curr += d;
                    }
                }
                break;
            }

            case Piece::ROOK: {
                for (int d : {-8, 8, -1, 1}) {
                    int pc = col, curr = from + d;
                    while (curr >= 0 && curr < 64) {
                        int cc = curr % 8;
                        if ((d == -1 || d == 1) && std::abs(cc - pc) != 1) break;
                        if (state.squares[curr].color == my) break;
                        tryAdd(from, curr);
                        if (state.squares[curr].color == opp) break;
                        pc = cc; curr += d;
                    }
                }
                break;
            }

            case Piece::QUEEN: {
                for (int d : {-9, -8, -7, -1, 1, 7, 8, 9}) {
                    int pc = col, curr = from + d;
                    while (curr >= 0 && curr < 64) {
                        int cc = curr % 8;
                        if (d != -8 && d != 8 && std::abs(cc - pc) != 1) break;
                        if (state.squares[curr].color == my) break;
                        tryAdd(from, curr);
                        if (state.squares[curr].color == opp) break;
                        pc = cc; curr += d;
                    }
                }
                break;
            }

            case Piece::KING: {
                for (int off : {-9, -8, -7, -1, 1, 7, 8, 9}) {
                    int to = from + off;
                    if (to < 0 || to >= 64) continue;
                    if (std::abs(to % 8 - col) > 1) continue;
                    tryAdd(from, to);
                }

                // Castling — king must not currently be in check
                if (isInCheck(state, my)) break;

                if (my == Color::WHITE && from == 60) {
                    if (state.castle_wk &&
                        state.squares[61].color == Color::NONE &&
                        state.squares[62].color == Color::NONE &&
                        !isAttacked(state, 61, opp) &&
                        !isAttacked(state, 62, opp)) tryAdd(from, 62);
                    if (state.castle_wq &&
                        state.squares[59].color == Color::NONE &&
                        state.squares[58].color == Color::NONE &&
                        state.squares[57].color == Color::NONE &&
                        !isAttacked(state, 59, opp) &&
                        !isAttacked(state, 58, opp)) tryAdd(from, 58);
                }
                if (my == Color::BLACK && from == 4) {
                    if (state.castle_bk &&
                        state.squares[5].color == Color::NONE &&
                        state.squares[6].color == Color::NONE &&
                        !isAttacked(state, 5, opp) &&
                        !isAttacked(state, 6, opp)) tryAdd(from, 6);
                    if (state.castle_bq &&
                        state.squares[3].color == Color::NONE &&
                        state.squares[2].color == Color::NONE &&
                        state.squares[1].color == Color::NONE &&
                        !isAttacked(state, 3, opp) &&
                        !isAttacked(state, 2, opp)) tryAdd(from, 2);
                }
                break;
            }

            default: break;
        }
    }

    return legal;
}

// ── Evaluation ────────────────────────────────────────────────────────────────

static int pieceValue(Piece p) {
    switch (p) {
        case Piece::PAWN:   return 100;
        case Piece::KNIGHT: return 320;
        case Piece::BISHOP: return 330;
        case Piece::ROOK:   return 500;
        case Piece::QUEEN:  return 900;
        case Piece::KING:   return 20000;
        default:            return 0;
    }
}

// Returns material balance from White's perspective (positive = good for White).
// Structured as a separate function so piece-square tables, mobility, and king
// safety can be added here without touching the search algorithm.
static int evaluate(const BoardState& state) {
    int score = 0;
    for (int i = 0; i < 64; i++) {
        const Square& sq = state.squares[i];
        if (sq.color == Color::NONE) continue;
        int val = pieceValue(sq.piece);
        score += (sq.color == Color::WHITE) ? val : -val;
    }
    return score;
}

// ── Search ────────────────────────────────────────────────────────────────────

static const int INF = 1000000;

static int minimax(const BoardState& state, int depth, int alpha, int beta) {
    std::vector<Move> moves = getLegalMoves(state);

    if (moves.empty()) {
        if (isInCheck(state, state.turn))
            return (state.turn == Color::WHITE) ? -INF : INF; // checkmate
        return 0; // stalemate
    }

    if (depth == 0) return evaluate(state);

    if (state.turn == Color::WHITE) {
        int best = -INF;
        for (const Move& m : moves) {
            int val = minimax(applyMove(state, m), depth - 1, alpha, beta);
            if (val > best) best = val;
            if (val > alpha) alpha = val;
            if (beta <= alpha) break;
        }
        return best;
    } else {
        int best = INF;
        for (const Move& m : moves) {
            int val = minimax(applyMove(state, m), depth - 1, alpha, beta);
            if (val < best) best = val;
            if (val < beta) beta = val;
            if (beta <= alpha) break;
        }
        return best;
    }
}

Move getBestMove(const BoardState& state, int difficulty) {
    int depth;
    switch (difficulty) {
        case 1:  depth = 3; break; // Medium
        case 2:  depth = 4; break; // Hard
        default: depth = 2; break; // Easy
    }

    std::vector<Move> moves = getLegalMoves(state);
    if (moves.empty()) return {-1, -1};

    Move best = moves[0];
    bool isWhite = (state.turn == Color::WHITE);
    int bestVal = isWhite ? -INF - 1 : INF + 1;

    for (const Move& m : moves) {
        int val = minimax(applyMove(state, m), depth - 1, -INF, INF);
        if ((isWhite && val > bestVal) || (!isWhite && val < bestVal)) {
            bestVal = val;
            best = m;
        }
    }

    return best;
}
