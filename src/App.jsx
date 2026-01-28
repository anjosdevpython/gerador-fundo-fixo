import React, { useState, useEffect } from 'react';
import {
  HashRouter as Router,
  Routes,
  Route,
  Link
} from 'react-router-dom';
import { Lock, Send, Loader2 } from 'lucide-react';

const Generator = React.lazy(() => import('./components/Generator'));
const HistoryDashboard = React.lazy(() => import('./components/HistoryDashboard'));
const Login = React.lazy(() => import('./components/Login'));

// --- Componente Raiz (Navegação) ---
const App = () => {
  const [history, setHistory] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);

  // Wrapper para proteção de rota
  const ProtectedRoute = ({ children }) => {
    if (!isAdmin) {
      return <Login onLogin={() => setIsAdmin(true)} />;
    }
    return children;
  };

  useEffect(() => {
    const saved = localStorage.getItem('fundo_history');
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  const saveToHistory = (record) => {
    const newHistory = [record, ...history];
    setHistory(newHistory);
    localStorage.setItem('fundo_history', JSON.stringify(newHistory));
  };

  return (
    <Router>
      <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col items-center">
        {/* Main Content */}
        <main className="w-full max-w-6xl p-4 md:p-8">
          <React.Suspense fallback={
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-slate-400 gap-4">
              <Loader2 className="animate-spin" size={32} />
              <p className="text-xs font-black uppercase tracking-widest">Carregando...</p>
            </div>
          }>
            <Routes>
              <Route path="/" element={<Generator onSaveRecord={saveToHistory} />} />
              <Route
                path="/registros"
                element={
                  <ProtectedRoute>
                    <HistoryDashboard />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </React.Suspense>

          <footer className="mt-12 text-center space-y-2 py-12 border-t border-slate-200/60 relative">
            <p className="text-slate-400 text-xs font-medium tracking-wide">
              Desenvolvido por: <a href="https://allananjos.dev.br/" target="_blank" rel="noreferrer" className="text-red-600 font-black hover:underline">Allan Anjos</a>
            </p>
            <div className="flex items-center justify-center gap-1.5 text-slate-300 text-[9px] font-bold uppercase tracking-widest">
              <Send size={10} /> Sincronizado via Supabase 🍏
            </div>

            {/* Subtle Admin Link */}
            <Link to="/registros" className="absolute bottom-4 right-4 text-slate-200/50 hover:text-slate-400 transition-colors">
              <Lock size={12} title="Painel Admin" />
            </Link>
          </footer>
        </main>
      </div>
    </Router>
  );
};

export default App;
