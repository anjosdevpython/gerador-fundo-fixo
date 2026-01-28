import { supabase } from '../lib/supabase';

const Login = ({ onLogin }) => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        const { error: authError } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (authError) {
            setError("E-mail ou senha incorretos");
            setIsLoading(false);
        } else {
            onLogin();
        }
    };

    return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white p-8 rounded-3xl shadow-xl border border-slate-200 max-w-md w-full"
            >
                <div className="flex flex-col items-center gap-4 mb-8">
                    <div className="p-4 bg-slate-100 rounded-full text-slate-400">
                        <Lock size={32} />
                    </div>
                    <div className="text-center">
                        <h2 className="text-xl font-black text-slate-800">Acesso Restrito</h2>
                        <p className="text-slate-400 text-sm">Digite a senha administrativa</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                        type="email"
                        placeholder="E-mail"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 text-center text-sm font-bold outline-none focus:border-red-500 transition-all"
                    />
                    <input
                        type="password"
                        placeholder="Senha"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={`w-full bg-slate-50 border-2 ${error ? 'border-red-500' : 'border-slate-100'} rounded-2xl px-6 py-4 text-center text-sm font-bold outline-none focus:border-red-500 transition-all`}
                    />
                    {error && <p className="text-red-500 text-center text-xs font-bold">{error}</p>}
                    <button
                        disabled={isLoading}
                        className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl shadow-lg hover:bg-black transition-all active:scale-95 disabled:opacity-50"
                    >
                        {isLoading ? "AUTENTICANDO..." : "ENTRAR NO PAINEL"}
                    </button>
                </form>
            </motion.div>
        </div>
    );
};

export default Login;
