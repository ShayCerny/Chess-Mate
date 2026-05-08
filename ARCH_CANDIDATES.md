# Architecture Deepening Candidates

Generated: 2026-05-07

---

## 1. Move Execution split across GameManager + BoardClass

**Files:** `GameManager.tsx:89–173`, `BoardClass.ts`

**Problem:** A single move involves: en passant detection (GameManager ~lines 97–116), piece movement (BoardClass.move()), snapshot creation (GameManager), FEN refresh (GameManager), IPC call, and game status update — all in different places. Understanding what happens when a pawn moves two squares requires reading three files.

**Solution:** A single Move Execution module that takes a board + move intent and returns the resulting board state, move classification, and captured piece. One call, all the side-state.

**Benefits:** Locality: en passant logic, castling, snapshots concentrate in one place. Tests exercise a move fully without React. Deletion test: if you deleted it, the en passant + snapshot complexity would spray across every caller.

---

## 2. Move History model mismatch (half-turn vs full-turn)

**Files:** `GameManager.tsx:180–230`, `types.ts` (`IFullTurnMove` / `IHalfTurnMove`)

**Problem:** `pastMoves` stores `IFullTurnMove` (white+black pairs) but undo works at the half-turn level. Lines 184–196 have a conditional branch to handle "did black move yet?" The split mental model makes the undo/redo seam fragile.

**Solution:** Use a single half-turn stack throughout. `PastMoveTable` groups them visually into rows; the undo/redo seam operates on individual entries.

**Benefits:** Undo/redo interface becomes push/pop. The full-turn grouping becomes a view concern, not a state invariant.

---

## 3. IPC bridge is a shallow pass-through (no Rules module)

**Files:** `main/events.ts`, `main/preload.cts`, `GameManager.tsx` (all `window.electronAPI.*` calls)

**Problem:** `preload.cts` exposes `getLegalMoves(fen)` and `isInCheck(fen)` directly to GameManager, which constructs FEN strings and unpacks results. There's no module that says "given this board, what moves are legal and is the game over?" The IPC protocol leaks into the UI layer.

**Solution:** A renderer-side Rules module that encapsulates the IPC calls, FEN serialization, and returns structured results (legal moves per piece, game status) in one async call.

**Benefits:** FEN serialization is no longer scattered. GameManager talks in board terms. The seam can be adapted (e.g., swap in a WASM engine) without touching GameManager.

---

## 4. GameManager is a god module mixing game orchestration with UI state

**Files:** `GameManager.tsx` (307 lines)

**Problem:** GameManager conflates two concerns that change for different reasons: game orchestration (move execution, undo/redo, status) and UI state (selectedSquare, modalVisible, resignConfirmVisible). Bugs in game logic are only findable by mounting React.

**Solution:** Extract a pure Game module (no hooks, no JSX) holding the game state machine. GameManager becomes a thin wrapper translating UI events to Game calls.

**Benefits:** The Game module is testable without React. Game logic bugs surface in unit tests, not integration tests.
