import { BrowserRouter, Routes, Route, Link } from 'react-router';
import Home from './pages/Home.jsx';
import CreateQuiz from './pages/CreateQuiz.jsx';
import Lobby from './pages/Lobby.jsx';
import Game from './pages/Game.jsx';
import Result from './pages/Result.jsx';
import ConnectionBanner from './components/ConnectionBanner.jsx';

function App() {
  return (
    <BrowserRouter>
      <div className="relative flex min-h-screen flex-col bg-cyber-bg font-sans text-cyber-text">
        <div className="cyber-backdrop pointer-events-none fixed inset-0 z-0" />
        <div className="cyber-scanlines pointer-events-none fixed inset-0 z-0" />

        <div className="relative z-10 flex min-h-screen flex-col">
          <ConnectionBanner />
          <header className="border-b border-cyber-border bg-cyber-surface/80 px-4 py-4 backdrop-blur">
            <Link to="/" className="inline-block">
              <h1 className="glitch-text neon-cyan font-display text-xl font-bold tracking-widest text-cyber-cyan">
                NEW FAMILY 3000
              </h1>
            </Link>
          </header>
          <main className="mx-auto w-full max-w-md flex-1 px-4 py-6">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/create" element={<CreateQuiz />} />
              <Route path="/lobby/:roomCode" element={<Lobby />} />
              <Route path="/game/:roomCode" element={<Game />} />
              <Route path="/result/:roomCode" element={<Result />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;

