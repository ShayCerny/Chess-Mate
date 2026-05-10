# C++ Engine Tests

Standalone Catch2 test suite for `board.cpp` — runs without node-gyp, Electron, or NAPI.

## Requirements

| Tool | Minimum version |
|------|----------------|
| CMake | 3.14 |
| C++ compiler | MSVC 2019 / GCC 9 / Clang 10 (C++17) |
| git | any — used by CMake FetchContent to download Catch2 |

Catch2 is downloaded automatically on the first `cmake` configure. No submodule or manual install required.

## Running (Windows)

```powershell
.\tests\build-and-run.ps1
```

## Running (macOS / Linux)

```sh
cmake -S tests -B tests/build
cmake --build tests/build
ctest --test-dir tests/build --output-on-failure
```

## What is tested

| Area | Test cases |
|------|------------|
| `parseFen` | Starting position fields; en passant target square |
| Castling | Legal kingside / queenside; illegal through check; illegal with no rights; illegal on rook-moved side |
| En passant | Capture move present; captured pawn removed from correct square |
| Promotion | Promotion move generated; auto-queen applied |
| Check | `isInCheck` with queen/rook attacker; quiet position; discovered check via ray |
| Move filter | Moves that expose king to check are absent from `getLegalMoves` |
| Stalemate | Empty move list and not in check |
| `getBestMove` | Easy / Medium / Hard each return a legal move; returns `{-1,-1}` when no moves; chosen move does not leave king in check |
