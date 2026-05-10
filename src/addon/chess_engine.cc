#include <napi.h>
#include "board.h"

Napi::Value GetGameState(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 1 || !info[0].IsString()) {
        Napi::TypeError::New(env, "Expected FEN string").ThrowAsJavaScriptException();
        return env.Null();
    }

    std::string fen = info[0].As<Napi::String>().Utf8Value();
    BoardState state = parseFen(fen);

    std::vector<Move> moves = getLegalMoves(state);
    Napi::Array movesArr = Napi::Array::New(env, moves.size());
    for (size_t i = 0; i < moves.size(); i++) {
        Napi::Array pair = Napi::Array::New(env, 2);
        pair.Set(0u, Napi::Number::New(env, moves[i].from));
        pair.Set(1u, Napi::Number::New(env, moves[i].to));
        movesArr.Set(i, pair);
    }

    Napi::Value checkSquare = env.Null();
    if (isInCheck(state, state.turn)) {
        for (int i = 0; i < 64; i++) {
            if (state.squares[i].piece == Piece::KING && state.squares[i].color == state.turn) {
                checkSquare = Napi::Number::New(env, i);
                break;
            }
        }
    }

    Napi::Object result = Napi::Object::New(env);
    result.Set("moves", movesArr);
    result.Set("checkSquare", checkSquare);
    return result;
}

Napi::Value GetBestMove(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 2 || !info[0].IsString() || !info[1].IsNumber()) {
        Napi::TypeError::New(env, "Expected FEN string and difficulty number").ThrowAsJavaScriptException();
        return env.Null();
    }

    std::string fen = info[0].As<Napi::String>().Utf8Value();
    int difficulty = info[1].As<Napi::Number>().Int32Value();
    BoardState state = parseFen(fen);
    Move move = getBestMove(state, difficulty);

    if (move.from == -1 && move.to == -1) return env.Null();

    Napi::Array result = Napi::Array::New(env, 2);
    result.Set(0u, Napi::Number::New(env, move.from));
    result.Set(1u, Napi::Number::New(env, move.to));
    return result;
}

Napi::Object Init(Napi::Env env, Napi::Object exports) {
    exports.Set("getGameState", Napi::Function::New(env, GetGameState));
    exports.Set("getBestMove", Napi::Function::New(env, GetBestMove));
    return exports;
}

NODE_API_MODULE(chess_engine, Init)
