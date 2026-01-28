import React, { useState } from 'react';
import { Lock, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

const Login = ({ onLogin }) => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        // Mapeia o usuário Admin para o e-mail oficial exigido pelo banco
        const email = username.toLowerCase() === 'admin' ? 'admin@minipreco.com' : username;

        try {
            const { error: authError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (authError) {
                setError("Usuário ou senha incorretos");
            } else {
                onLogin();
            }
        } catch (err) {
            setError("Erro de conexão. Tente novamente.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-[60vh] p-4">
            <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-200 max-w-md w-full">
                <div className="flex flex-col items-center gap-4 mb-8">
                    <div className="p-4 bg-slate-100 rounded-full text-slate-400">
                        <Lock size={32} />
                    </div>
                    <div className="text-center">
                        <h2 className="text-xl font-black text-slate-800 tracking-tight">Painel Admin</h2>
                        <p className="text-slate-400 text-sm font-medium">Digite suas credenciais</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Usuário</label>
                        <input
                            type="text"
                            required
                            placeholder="Ex: Admin"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:border-red-500 transition-all"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Senha</label>
                        <input
                            type="password"
                            required
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className={`w-full bg-slate-50 border-2 ${error ? 'border-red-500' : 'border-slate-100'} rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:border-red-500 transition-all`}
                        />
                    </div>

                    {error && (
                        <div className="bg-red-50 text-red-600 p-4 rounded-xl text-xs font-bold text-center border border-red-100">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl shadow-lg hover:bg-black transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="animate-spin" size={18} />
                                <span>AUTENTICANDO...</span>
                            </>
                        ) : (
                            "ENTRAR NO PAINEL"
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Login;
