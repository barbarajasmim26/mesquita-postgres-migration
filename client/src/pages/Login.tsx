import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { Lock, Building2, Eye, EyeOff } from "lucide-react";

const VALID_USER = "barbara";
const VALID_PASSWORD = "mesquitaimoveis";

export default function Login() {
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [, setLocation] = useLocation();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!usuario || !senha) {
      toast.error("Preencha todos os campos");
      return;
    }

    setCarregando(true);

    // Simular delay de autenticação
    setTimeout(() => {
      if (usuario === VALID_USER && senha === VALID_PASSWORD) {
        // Salvar no localStorage
        localStorage.setItem("auth_user", usuario);
        localStorage.setItem("auth_token", "token_" + Date.now());
        toast.success("Login realizado com sucesso!");
        setLocation("/");
      } else {
        toast.error("Usuário ou senha inválidos");
        setCarregando(false);
      }
    }, 500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      {/* Elementos decorativos */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -z-10" />

      <div className="w-full max-w-md relative z-10">
        {/* Card */}
        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-3xl shadow-2xl p-8">
          {/* Logo/Header */}
          <div className="flex justify-center mb-8">
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white p-4 rounded-2xl shadow-lg">
              <Building2 className="w-8 h-8" />
            </div>
          </div>

          <h1 className="text-3xl font-bold text-center text-white mb-2">
            Gestão de Imóveis
          </h1>
          <p className="text-center text-slate-400 text-sm mb-8">
            Sistema de Gerenciamento de Aluguéis
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Campo Usuário */}
            <div>
              <label className="block text-sm font-semibold text-slate-200 mb-2">
                Usuário
              </label>
              <input
                type="text"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                placeholder="barbara"
                disabled={carregando}
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all disabled:opacity-50"
              />
            </div>

            {/* Campo Senha */}
            <div>
              <label className="block text-sm font-semibold text-slate-200 mb-2">
                Senha
              </label>
              <div className="relative">
                <input
                  type={mostrarSenha ? "text" : "password"}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="••••••••••••"
                  disabled={carregando}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all disabled:opacity-50 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenha(!mostrarSenha)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300 transition-colors"
                  disabled={carregando}
                >
                  {mostrarSenha ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Botão Submit */}
            <button
              type="submit"
              disabled={carregando}
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold py-3 px-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-xl mt-6"
            >
              {carregando ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Autenticando...
                </>
              ) : (
                <>
                  <Lock className="w-5 h-5" />
                  Entrar
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-slate-700/50">
            <p className="text-center text-slate-400 text-xs">
              Sistema de Gestão de Aluguéis v1.0
            </p>
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-slate-800/30 backdrop-blur border border-slate-700/30 rounded-2xl p-4">
          <p className="text-slate-300 text-xs text-center">
            <span className="font-semibold">Credenciais de Acesso:</span>
            <br />
            Usuário: <code className="bg-slate-900/50 px-2 py-1 rounded text-blue-400">barbara</code>
            <br />
            Senha: <code className="bg-slate-900/50 px-2 py-1 rounded text-blue-400">mesquitaimoveis</code>
          </p>
        </div>
      </div>
    </div>
  );
}
