import { component$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import TicTacToe from "../components/tictactoe/tictactoe";

/**
 * Main landing page: centered Tic Tac Toe game.
 */
export default component$(() => {
  return (
    <div style={{
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '80vh',
      background: "#f7faff",
    }}>
      <TicTacToe />
    </div>
  );
});

export const head: DocumentHead = {
  title: "Tic Tac Toe – Modern Qwik Game",
  meta: [
    {
      name: "description",
      content:
        "Modern Qwik-based Tic Tac Toe game: play locally with a friend or vs computer AI.",
    },
  ],
};
