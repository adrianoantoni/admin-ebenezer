import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Church, Lock, Eye, EyeOff, CheckCircle2, AlertTriangle, ArrowLeft } from 'lucide-react';

const ResetPassword: React.FC = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const { dispatch } = useApp();

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            dispatch({ type: 'ADD_NOTIFICATION', payload: { message: 'As senhas não coincidem!', type: 'error' } });
            return;
        }

        if (password.length < 6) {
            dispatch({ type: 'ADD_NOTIFICATION', payload: { message: 'A senha deve ter pelo menos 6 caracteres.', type: 'error' } });
            return;
        }

        setLoading(true);

        try {
            const response = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, newPassword: password }),
            });

            const data = await response.json();

            if (!response.ok) {
                dispatch({ type: 'ADD_NOTIFICATION', payload: { message: data.message || 'Erro ao redefinir senha', type: 'error' } });
                return;
            }

            setSuccess(true);
            dispatch({ type: 'ADD_NOTIFICATION', payload: { message: 'Senha redefinida com sucesso!', type: 'success' } });
        } catch (error) {
            console.error('Reset password error:', error);
            dispatch({ type: 'ADD_NOTIFICATION', payload: { message: 'Erro ao conectar com o servidor.', type: 'error' } });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-950 flex items-center justify-center p-4">
            <div className="w-full max-w-md animate-in fade-in zoom-in duration-500">
                <div className="bg-white rounded-[2.5rem] shadow-2xl p-8 md:p-12 relative overflow-hidden text-center">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>

                    <div className="flex flex-col items-center mb-8">
                        <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                            <Church size={32} />
                        </div>
                        <h1 className="text-2xl font-black text-gray-800 tracking-tight">Ecclésia Master</h1>
                        <p className="text-gray-400 font-medium text-sm mt-1">Defina sua nova senha de acesso</p>
                    </div>

                    {!success ? (
                        <form onSubmit={handleResetPassword} className="space-y-6 text-left">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nova Senha</label>
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

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Confirmar Senha</label>
                                <div className="relative group">
                                    <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent focus:border-blue-600 focus:bg-white rounded-2xl outline-none transition-all font-medium text-gray-700"
                                        placeholder="••••••••"
                                        required
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-blue-700 hover:bg-blue-800 text-white font-black uppercase tracking-widest text-[11px] py-4 rounded-2xl shadow-xl shadow-blue-700/30 transition-all active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    'Redefinir Senha'
                                )}
                            </button>
                        </form>
                    ) : (
                        <div className="animate-in fade-in duration-500">
                            <div className="w-20 h-20 bg-green-50 text-green-600 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-inner">
                                <CheckCircle2 size={40} />
                            </div>
                            <h2 className="text-2xl font-black text-gray-800 mb-2">Tudo Pronto!</h2>
                            <p className="text-gray-500 text-sm mb-10 leading-relaxed">
                                Sua senha foi atualizada com sucesso. Você já pode acessar sua conta.
                            </p>
                            <button
                                onClick={() => navigate('/login')}
                                className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-blue-700 transition-all shadow-xl flex items-center justify-center gap-2"
                            >
                                <ArrowLeft size={16} /> Ir para o Login
                            </button>
                        </div>
                    )}

                    <button
                        onClick={() => navigate('/login')}
                        className="mt-8 text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-gray-600 flex items-center justify-center gap-2 mx-auto"
                    >
                        Voltar ao Login
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;
