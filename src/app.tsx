/**
 * KYCAR - root component (lot D1 scaffolding).
 *
 * This is deliberately not a screen: routing (D8), the filter bar and URL state (D5), and the
 * actual screens (D6/D7) are out of this lot's scope. `App` only proves the Preact + Vite +
 * TypeScript pipeline renders something, and gives later lots a mount point to replace.
 */

export function App() {
  return (
    <main>
      <h1>KYCAR</h1>
      <p>
        Echafaudage du projet (lot D1). Le routeur, le bandeau de filtres et les ecrans
        d&apos;analyse sont construits dans les lots suivants (D2-D8).
      </p>
    </main>
  );
}
