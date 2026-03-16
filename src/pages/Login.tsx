import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { UserRole } from '../core/types';
import { Church, Lock, Mail, Eye, EyeOff, X, Send, CheckCircle2 } from 'lucide-react';

const Login: React.FC = () => {
  const { dispatch } = useApp();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Estados para Recuperação de Senha
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoverySent, setRecoverySent] = useState(false);
  const [recoveryLoading, setRecoveryLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        dispatch({ type: 'ADD_NOTIFICATION', payload: { message: data.message || 'Erro ao realizar login', type: 'error' } });
        setLoading(false);
        return;
      }

      const { user, token } = data;
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('token', token);
      dispatch({ type: 'LOGIN_SUCCESS', payload: user });

      dispatch({
        type: 'ADD_LOG',
        payload: {
          id: Math.random().toString(),
          userId: user.id,
          userName: user.name,
          action: 'LOGIN',
          category: 'LOGIN',
          severity: 'LOW',
          target: 'Sistema',
          timestamp: new Date().toISOString(),
          ip: '127.0.0.1'
        }
      });
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Login error:', error);
      let errorMsg = 'Erro desconhecido ao conectar com o servidor.';

      // Detectar erro de conexão (servidor off)
      if (error instanceof TypeError || error.name === 'TypeError' || error.message?.includes('Failed to fetch')) {
        errorMsg = 'SERVIDOR OFFLINE 🔴: Verifique se o backend está rodando no terminal (npm run dev:all).';
      }

      dispatch({ type: 'ADD_NOTIFICATION', payload: { message: errorMsg, type: 'error' } });
    } finally {
      setLoading(false);
    }
  };

  const handleRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryLoading(true);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: recoveryEmail }),
      });

      const data = await response.json();

      if (!response.ok) {
        dispatch({ type: 'ADD_NOTIFICATION', payload: { message: data.message || 'Erro ao enviar e-mail de recuperação', type: 'error' } });
        return;
      }

      setRecoverySent(true);
    } catch (error) {
      console.error('Recovery error:', error);
      dispatch({ type: 'ADD_NOTIFICATION', payload: { message: 'Erro ao conectar com o servidor.', type: 'error' } });
    } finally {
      setRecoveryLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="bg-white rounded-[2.5rem] shadow-2xl p-8 md:p-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>

          <div className="flex flex-col items-center mb-10">
            <div className="w-20 h-20 bg-amber-500 rounded-3xl flex items-center justify-center shadow-xl shadow-amber-500/30 rotate-6 mb-6">
              <Church size={40} className="text-white -rotate-6" />
            </div>
            <h1 className="text-3xl font-poppins font-black text-gray-800 tracking-tight">Igreja Baptista da Sapú</h1>
            <p className="text-gray-400 font-medium text-center mt-2 px-6">
              Gestão inteligente para o corpo de Cristo
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">E-mail Corporativo</label>
              <div className="relative group">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent focus:border-blue-600 focus:bg-white rounded-2xl outline-none transition-all font-medium text-gray-700"
                  placeholder="seu@email.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center ml-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Senha de Acesso</label>
                <button
                  type="button"
                  onClick={() => { setShowRecoveryModal(true); setRecoverySent(false); setRecoveryEmail(''); }}
                  className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline"
                >
                  Esqueci a senha?
                </button>
              </div>
              <div className="relative group">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-4 bg-gray-50 border-2 border-transparent focus:border-blue-600 focus:bg-white rounded-2xl outline-none transition-all font-medium text-gray-700"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold py-4 rounded-2xl shadow-xl shadow-blue-700/30 transition-all active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                'Acessar Sistema'
              )}
            </button>
          </form>

          <div className="mt-12 text-center">
            <p className="text-gray-400 text-sm">
              Não tem acesso? <span className="text-blue-600 font-bold cursor-pointer hover:underline">Solicite ao administrador</span>
            </p>

            {/* Dev Banner - Mostra credenciais apenas em ambiente dev */}
            <div className="mt-6 p-4 bg-yellow-50 rounded-xl border border-yellow-200 text-left animate-in fade-in slide-in-from-bottom-4">
              <p className="text-[10px] font-black text-yellow-600 uppercase mb-2 tracking-widest flex items-center gap-2">
                <Lock size={10} /> Ambiente de Desenvolvimento
              </p>
              <div className="text-xs text-yellow-800 font-mono space-y-1.5">
                <div className="flex justify-between border-b border-yellow-200 pb-1">
                  <span>Admin:</span>
                  <span className="font-bold select-all">adriano@test.com / admin123</span>
                </div>
                <div className="flex justify-between pt-1">
                  <span>Pastor:</span>
                  <span className="font-bold select-all">carlos@test.com / admin123</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL: Recuperação de Senha */}
      {showRecoveryModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-blue-950/80 backdrop-blur-md animate-in fade-in" onClick={() => setShowRecoveryModal(false)}></div>
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl relative overflow-hidden animate-in zoom-in duration-300">
            <div className="p-10 text-center">
              {!recoverySent ? (
                <>
                  <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Lock size={32} />
                  </div>
                  <h2 className="text-2xl font-black text-gray-800 mb-2">Recuperar Senha</h2>
                  <p className="text-gray-500 text-sm mb-8 leading-relaxed">Insira o e-mail cadastrado e enviaremos as instruções para redefinir sua senha.</p>

                  <form onSubmit={handleRecovery} className="space-y-4">
                    <div className="relative">
                      <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="email"
                        placeholder="seu@e-mail.com"
                        required
                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent focus:border-blue-600 focus:bg-white rounded-2xl outline-none font-medium"
                        value={recoveryEmail}
                        onChange={(e) => setRecoveryEmail(e.target.value)}
                      />
                    </div>
                    <button
                      disabled={recoveryLoading}
                      className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                    >
                      {recoveryLoading ? (
                        <div className="w-5 h-5 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                      ) : (
                        <><Send size={16} /> Enviar Link</>
                      )}
                    </button>
                  </form>
                </>
              ) : (
                <div className="animate-in fade-in duration-500">
                  <div className="w-16 h-16 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 size={32} />
                  </div>
                  <h2 className="text-2xl font-black text-gray-800 mb-2">E-mail Enviado!</h2>
                  <p className="text-gray-500 text-sm mb-8 leading-relaxed">
                    Verifique sua caixa de entrada em <span className="font-bold text-gray-800">{recoveryEmail}</span>. Não esqueça de checar o spam.
                  </p>
                  <button
                    onClick={() => setShowRecoveryModal(false)}
                    className="w-full py-4 bg-gray-100 text-gray-800 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-gray-200 transition-all"
                  >
                    Voltar ao Login
                  </button>
                </div>
              )}

              <button
                onClick={() => setShowRecoveryModal(false)}
                className="mt-6 text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-gray-600"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;