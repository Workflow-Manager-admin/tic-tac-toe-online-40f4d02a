import { component$, useStore, useStylesScoped$, $ } from "@builder.io/qwik";
// Qwik CSS modules should use the ?inline suffix for useStylesScoped$
// See: https://qwik.dev/docs/concepts/css/#css-modules--usestilesscoped
import tttCss from "./tictactoe.module.css?inline";
// Helper types
type Player = "X" | "O";
type GameMode = "local" | "ai";
type Cell = null | Player;

const WIN_LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8], // rows
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8], // columns
  [0, 4, 8],
  [2, 4, 6], // diagonals
];

// Utility for winner
function checkWinner(board: Cell[]): { winner: Player | null; line: number[]; draw: boolean } {
  for (const line of WIN_LINES) {
    const [a, b, c] = line;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a], line, draw: false };
    }
  }
  const draw = board.every((cell) => !!cell);
  return { winner: null, line: [], draw };
}

// Called after AI makes a move
function postAiMove(state: any) {
  const { winner, line, draw } = checkWinner(state.board);

  if (winner) {
    state.winner = winner;
    state.winningLine = line;
    state.statusMsg = `Player O (Yellow) wins!`;
    state.score[winner]++;
    state.inProgress = false;
    return;
  }
  if (draw) {
    state.draw = true;
    state.statusMsg = "It's a draw!";
    state.inProgress = false;
    return;
  }
  // If not over, switch back turn
  state.current = "X";
}

/**
 * PUBLIC_INTERFACE
 * Tic Tac Toe main component for Qwik.
 */
export default component$(() => {
  // Correct: pass string (from ?inline) to useStylesScoped$
  useStylesScoped$(tttCss);

  const state = useStore({
    board: Array<Cell>(9).fill(null),
    current: "X" as Player,
    mode: "local" as GameMode,
    winner: null as null | Player,
    winningLine: [] as number[],
    draw: false,
    score: { X: 0, O: 0 },
    statusMsg: "",
    lastStarting: "O" as Player,
    inProgress: true,
  });

  // PUBLIC_INTERFACE
  const resetBoard = $(() => {
    // Switch starting player each game for fairness
    state.current = state.lastStarting === "X" ? "O" : "X";
    state.lastStarting = state.current;
    state.board = Array<Cell>(9).fill(null);
    state.winner = null;
    state.winningLine = [];
    state.draw = false;
    state.statusMsg = "";
    state.inProgress = true;

    // If AI mode and AI is to start
    if (state.mode === "ai" && state.current === "O") {
      aiMove();
    }
  });

  // PUBLIC_INTERFACE
  const setMode = $((mode: GameMode) => {
    if (state.mode !== mode) {
      state.mode = mode;
      state.score = { X: 0, O: 0 };
      resetBoard();
    }
  });

  // PUBLIC_INTERFACE
  const handleCellClick = $((idx: number) => {
    // Game over, ignore
    if (state.board[idx] || state.winner || state.draw || !state.inProgress) return;

    // Human move
    state.board[idx] = state.current;

    // Check for win/draw
    const { winner, line, draw } = checkWinner(state.board);
    if (winner) {
      state.winner = winner;
      state.winningLine = line;
      state.statusMsg = `Player ${winner === "X" ? "X (Red)" : "O (Yellow)"} wins!`;
      state.score[winner]++;
      state.inProgress = false;
      return;
    }
    if (draw) {
      state.draw = true;
      state.statusMsg = "It's a draw!";
      state.inProgress = false;
      return;
    }

    // Swap turn
    state.current = state.current === "X" ? "O" : "X";

    // AI move, if enabled & not game over
    if (state.mode === "ai" && state.inProgress && state.current === "O") {
      setTimeout(() => {
        aiMove();
      }, 250); // slight delay for UX
    }
  });

  // --- Simple AI: Random, or win/block if possible
  const aiMove = $(() => {
    // Only act if it's O's turn, game not over
    if (state.winner || state.draw || state.current !== "O" || !state.inProgress) return;

    // 1. Win if possible
    for (const line of WIN_LINES) {
      const [a, b, c] = line;
      const cells = [state.board[a], state.board[b], state.board[c]];
      const oCount = cells.filter((v) => v === "O").length;
      const empty = cells.indexOf(null);
      if (oCount === 2 && empty !== -1) {
        const idx = line[empty];
        state.board[idx] = "O";
        postAiMove(state);
        return;
      }
    }
    // 2. Block X from winning
    for (const line of WIN_LINES) {
      const [a, b, c] = line;
      const cells = [state.board[a], state.board[b], state.board[c]];
      const xCount = cells.filter((v) => v === "X").length;
      const empty = cells.indexOf(null);
      if (xCount === 2 && empty !== -1) {
        const idx = line[empty];
        state.board[idx] = "O";
        postAiMove(state);
        return;
      }
    }
    // 3. Take center if free
    if (state.board[4] == null) {
      state.board[4] = "O";
      postAiMove(state);
      return;
    }
    // 4. Take a random empty spot
    const emptyCells = state.board.map((v, i) => (v == null ? i : -1)).filter((v) => v !== -1);
    if (emptyCells.length > 0) {
      const pickIdx = emptyCells[Math.floor(Math.random() * emptyCells.length)];
      state.board[pickIdx] = "O";
      postAiMove(state);
    }
  });

  // Helper for cell ARIA/label
  function getCellLabel(idx: number) {
    const r = Math.floor(idx / 3) + 1;
    const c = (idx % 3) + 1;
    return `row ${r} column ${c}`;
  }

  // Styling helpers
  function cellClass(idx: number): string {
    let base = "ttt-cell";
    if (state.board[idx]) base += " " + state.board[idx]?.toLowerCase();
    if (state.winningLine.includes(idx)) base += " winning";
    return base;
  }

  // Initial AI move if needed
  if (
    typeof window !== "undefined" &&
    state.mode === "ai" &&
    state.board.filter((x) => x != null).length === 0 &&
    state.current === "O"
  ) {
    setTimeout(() => {
      aiMove();
    }, 160);
  }

  // --- UI ---
  return (
    <div class="ttt-wrapper">
      <div class="ttt-title">Tic Tac Toe</div>

      <div class="ttt-score-row">
        <span class="ttt-score-label">
          <span class="ttt-score-x">X (Red):</span> {state.score.X}
        </span>
        <span class="ttt-score-label">
          <span class="ttt-score-o">O (Yellow):</span> {state.score.O}
        </span>
      </div>

      <div class="ttt-controls" style="margin-bottom:6px;">
        <button
          class={["ttt-mode-btn", state.mode === "local" && "active"]}
          onClick$={() => setMode("local")}
          aria-pressed={state.mode === "local"}
        >
          Local 2-Player
        </button>
        <button
          class={["ttt-mode-btn", state.mode === "ai" && "active"]}
          onClick$={() => setMode("ai")}
          aria-pressed={state.mode === "ai"}
        >
          Vs Computer
        </button>
        <button class="ttt-reset-btn" type="button" onClick$={resetBoard}>
          Reset
        </button>
      </div>

      <div class="ttt-turn-label">
        {state.inProgress &&
          `Current turn: ${
            state.current === "X"
              ? 'X (Red)' + (state.mode === "ai" ? " (You)" : "")
              : state.mode === "ai"
              ? "O (Yellow) (AI)"
              : "O (Yellow)"
          }`}
      </div>
      <div class="ttt-status-msg" aria-live="assertive">
        {state.statusMsg}
      </div>
      <div
        class="ttt-board"
        role="grid"
        aria-label="Tic Tac Toe 3 by 3 grid"
        tabIndex={0}
      >
        {state.board.map((cell, idx) => (
          <button
            type="button"
            key={idx}
            class={cellClass(idx)}
            aria-label={`Cell ${getCellLabel(idx)}${
              cell ? ": " + cell : ""
            }`}
            aria-disabled={!!cell || !!state.winner || !!state.draw}
            onClick$={() => handleCellClick(idx)}
            tabIndex={cell || state.winner || state.draw ? -1 : 0}
            style={{}}
          >
            {cell}
          </button>
        ))}
      </div>
    </div>
  );
});
