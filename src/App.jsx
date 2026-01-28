import React, { useState, useEffect } from 'react';
import {
  HashRouter as Router,
  Routes,
  Route,
  Link
} from 'react-router-dom';
import { Lock, Send, Loader2 } from 'lucide-react';

import { supabase } from './lib/supabase';

import Generator from './components/Generator';
import HistoryDashboard from './components/HistoryDashboard';
import Login from './components/Login';

// Wrapper para proteção de rota
const ProtectedRoute = ({ isAdmin, isLoadingSession, onLogin, children }) => {
  if (isLoadingSession) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-slate-400 gap-4">
        <Loader2 className="animate-spin" size={32} />
        <p className="text-[10px] font-black uppercase tracking-widest">Verificando Acesso...</p>
      </div>
    );
  }
  if (!isAdmin) {
    return <Login onLogin={onLogin} />;
  }
  return children;
};

// --- Componente Raiz (Navegação) ---
const App = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoadingSession, setIsLoadingSession] = useState(true);

  useEffect(() => {
    // 1. Verifica sessão atual
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setIsAdmin(!!session);
      } catch (err) {
        console.error("Erro ao recuperar sessão:", err);
      } finally {
        setIsLoadingSession(false);
      }
    };

    checkSession();

    // 2. Escuta mudanças na autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAdmin(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    if (window.confirm("Deseja realmente sair do painel?")) {
      await supabase.auth.signOut();
    }
  };

  return (
    <Router>
      <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col items-center">
        {/* Main Content */}
        <main className="w-full max-w-6xl p-4 md:p-8">
          <Routes>
            <Route path="/" element={<Generator onSaveRecord={() => null} />} />
            <Route
              path="/registros"
              element={
                <ProtectedRoute
                  isAdmin={isAdmin}
                  isLoadingSession={isLoadingSession}
                  onLogin={() => setIsAdmin(true)}
                >
                  <HistoryDashboard onLogout={handleLogout} />
                </ProtectedRoute>
              }
            />
          </Routes>

          <footer className="mt-12 text-center space-y-2 py-12 border-t border-slate-200/60 relative">
            <p className="text-slate-400 text-xs font-medium tracking-wide">
              Desenvolvido com muito café por: <a href="https://allananjos.dev.br/" target="_blank" rel="noreferrer" className="text-red-600 font-black hover:underline">Allan Anjos</a>
            </p>
            <div className="flex items-center justify-center gap-1.5 text-slate-300 text-[9px] font-bold uppercase tracking-widest">
              Sincronizado via Supabase 🍏
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
