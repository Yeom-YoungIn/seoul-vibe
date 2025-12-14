import { useState } from 'react';

function App() {
  const [count, setCount] = useState(0);

  return (
    <main className="app">
      <header className="hero">
        <p className="eyebrow">Monorepo Sandbox</p>
        <h1>Seoul Vibe</h1>
        <p>React client living inside a monorepo with a NestJS backend.</p>
      </header>

      <section className="card">
        <p>Try clicking the button to check that React is working:</p>
        <button type="button" onClick={() => setCount((prev) => prev + 1)}>
          Count is {count}
        </button>
      </section>
    </main>
  );
}

export default App;
