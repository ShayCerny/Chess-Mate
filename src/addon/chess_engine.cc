#include <napi.h>
#include "board.h"

Napi::Value GetLegalMoves(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 1 || !info[0].IsString()) {
        Napi::TypeError::New(env, "Expected FEN string").ThrowAsJavaScriptException();
        return env.Null();
    }

    std::string fen = info[0].As<Napi::String>().Utf8Value();
    BoardState state = parseFen(fen);
    std::vector<Move> moves = getLegalMoves(state);

    Napi::Array result = Napi::Array::New(env, moves.size());
    for (size_t i = 0; i < moves.size(); i++) {
        Napi::Array pair = Napi::Array::New(env, 2);
        pair.Set(0u, Napi::Number::New(env, moves[i].from));
        pair.Set(1u, Napi::Number::New(env, moves[i].to));
        result.Set(i, pair);
    }
    return result;
}

Napi::Value IsInCheck(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 1 || !info[0].IsString()) {
        Napi::TypeError::New(env, "Expected FEN string").ThrowAsJavaScriptException();
        return env.Null();
    }

    std::string fen = info[0].As<Napi::String>().Utf8Value();
    BoardState state = parseFen(fen);
    bool result = isInCheck(state, state.turn);
    return Napi::Boolean::New(env, result);
}

Napi::Object Init(Napi::Env env, Napi::Object exports) {
    exports.Set("getLegalMoves", Napi::Function::New(env, GetLegalMoves));
    exports.Set("isInCheck", Napi::Function::New(env, IsInCheck));
    return exports;
}

NODE_API_MODULE(chess_engine, Init)
