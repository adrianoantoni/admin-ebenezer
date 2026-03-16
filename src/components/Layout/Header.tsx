
import React, { useState, useMemo, useEffect } from 'react';
import {
  Bell, Search, Menu, LogOut, Settings, User as UserIcon,
  X, ShieldCheck, Mail, Clock, Save, Camera, UserCog, Upload, RefreshCw, Edit2
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useNavigate } from 'react-router-dom';
import AvatarPlaceholder from '../AvatarPlaceholder';

const Header: React.FC<{ onMenuClick: () => void }> = ({ onMenuClick }) => {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();

  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showProfileDrawer, setShowProfileDrawer] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    photoUrl: ''
  });

  useEffect(() => {
    if (showSettingsModal && state.auth.user) {
      setFormData({
        name: state.auth.user.name,
        email: state.auth.user.email,
        photoUrl: state.auth.user.photoUrl || ''
      });
    }
  }, [showSettingsModal, state.auth.user]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    dispatch({ type: 'LOGOUT' });
    navigate('/login');
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        dispatch({ type: 'ADD_NOTIFICATION', payload: { message: 'A imagem deve ter menos de 2MB!', type: 'error' } });
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, photoUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!state.auth.user) return;

    setIsSaving(true);
    const token = localStorage.getItem('token');

    try {
      const response = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: formData.name,
          photoUrl: formData.photoUrl
        })
      });

      if (!response.ok) throw new Error('Erro ao atualizar perfil');

      const updatedUser = await response.json();

      dispatch({ type: 'UPDATE_AUTH_USER', payload: updatedUser });
      dispatch({ type: 'ADD_NOTIFICATION', payload: { message: 'Perfil atualizado com sucesso!', type: 'success' } });

      dispatch({
        type: 'ADD_LOG',
        payload: {
          id: `log-prof-${Date.now()}`,
          userId: updatedUser.id,
          userName: updatedUser.name,
          action: 'UPDATE_PROFILE',
          category: 'SECURITY',
          severity: 'LOW',
          target: 'Configurações de Perfil',
          timestamp: new Date().toISOString(),
          ip: '127.0.0.1',
          details: 'Dados de perfil e fotografia persistidos no banco de dados.'
        }
      });

      setSuccessMessage(true);

      setTimeout(() => {
        setSuccessMessage(false);
        setShowSettingsModal(false);
      }, 1000);
    } catch (error) {
      console.error('Error updating profile:', error);
      dispatch({ type: 'ADD_NOTIFICATION', payload: { message: 'Erro ao salvar perfil no servidor.', type: 'error' } });
    } finally {
      setIsSaving(false);
    }
  };

  const openSettings = () => {
    setShowProfileDrawer(false);
    setShowProfileMenu(false);
    setShowSettingsModal(true);
  };

  return (
    <header className="sticky top-0 bg-white/90 backdrop-blur-lg h-16 border-b border-gray-200 px-4 md:px-8 flex items-center justify-between z-50 pt-[env(safe-area-inset-top)]">
      <div className="flex items-center gap-4">
        <button 
          onClick={onMenuClick} 
          className="p-2.5 bg-gray-50 hover:bg-gray-100 text-gray-800 rounded-xl md:hidden border border-gray-100 shadow-sm active:scale-95 transition-all"
          aria-label="Toggle Menu"
        >
          <Menu size={22} strokeWidth={2.5} />
        </button>
        <div className="relative hidden sm:block">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Pesquisar..."
            className="pl-10 pr-4 py-2 bg-gray-100 border-transparent focus:bg-white focus:ring-2 focus:ring-blue-500 rounded-xl outline-none transition-all w-64 text-sm"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        <button className="p-2 hover:bg-gray-100 rounded-full relative transition-colors">
          <Bell size={20} className="text-gray-600" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>

        <div className="h-8 w-[1px] bg-gray-200 mx-1 hidden md:block"></div>

        <div className="relative flex items-center gap-2">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-3 p-1.5 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <div className="hidden md:flex flex-col items-end min-w-[120px]">
              <span className="text-sm font-black text-gray-800 leading-tight truncate max-w-[180px]">{state.auth.user?.name}</span>
              <span className="text-[9px] uppercase tracking-tighter font-black text-blue-600">{state.auth.user?.role}</span>
            </div>
            <div className="relative shrink-0">
              <AvatarPlaceholder
                name={state.auth.user?.name || 'User'}
                id={state.auth.user?.id || 'guest'}
                photoUrl={state.auth.user?.photoUrl}
                className="w-10 h-10 rounded-full border-2 border-white shadow-sm object-cover"
              />
            </div>
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-3xl shadow-2xl border border-gray-100 py-3 z-50 animate-in fade-in zoom-in duration-200 origin-top-right">
              <div className="px-6 py-4 border-b border-gray-50 flex flex-col items-center">
                <AvatarPlaceholder
                  name={state.auth.user?.name || 'User'}
                  id={state.auth.user?.id || 'guest'}
                  photoUrl={state.auth.user?.photoUrl}
                  className="w-14 h-14 rounded-full mb-2 object-cover"
                />
                <span className="text-xs font-black text-gray-800 text-center">{state.auth.user?.name}</span>
              </div>
              <button
                onClick={() => { setShowProfileDrawer(true); setShowProfileMenu(false); }}
                className="flex items-center gap-3 w-full px-6 py-3.5 text-sm font-bold text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
              >
                <UserIcon size={18} /> Resumo do Perfil
              </button>
              <button
                onClick={openSettings}
                className="flex items-center gap-3 w-full px-6 py-3.5 text-sm font-bold text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
              >
                <Settings size={18} /> Editar Definições
              </button>
              <div className="h-[1px] bg-gray-100 my-2 mx-6"></div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 w-full px-6 py-3.5 text-sm font-bold text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut size={18} /> Terminar Sessão
              </button>
            </div>
          )}
        </div>
      </div>

      {showProfileDrawer && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div className="absolute inset-0 bg-blue-950/40 backdrop-blur-sm animate-in fade-in" onClick={() => setShowProfileDrawer(false)}></div>
          <div className="bg-white w-full max-w-md h-full shadow-2xl relative flex flex-col animate-in slide-in-from-right duration-500">
            <div className="p-10 pt-20 bg-gradient-to-br from-blue-900 to-indigo-950 text-white shrink-0 relative overflow-hidden">
              <button onClick={() => setShowProfileDrawer(false)} className="absolute top-8 right-8 p-3 hover:bg-white/10 rounded-full transition-colors text-white"><X size={24} /></button>
              <div className="flex flex-col items-center gap-6">
                <div className="relative">
                  <AvatarPlaceholder
                    name={state.auth.user?.name || 'User'}
                    id={state.auth.user?.id || 'guest'}
                    photoUrl={state.auth.user?.photoUrl}
                    className="w-32 h-32 rounded-[2.5rem] object-cover border-4 border-white/20 shadow-2xl"
                  />
                  <div className="absolute -bottom-2 -right-2 bg-amber-400 p-2.5 rounded-2xl shadow-lg border-2 border-white text-blue-900">
                    <ShieldCheck size={24} />
                  </div>
                </div>
                <div className="text-center">
                  <h2 className="text-3xl font-black">{state.auth.user?.name}</h2>
                  <p className="text-[10px] font-black uppercase tracking-[0.25em] text-blue-200 mt-2">{state.auth.user?.role}</p>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-12 space-y-8">
              <div className="space-y-4">
                <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Informações de Acesso</p>
                <div className="space-y-3">
                  <div className="flex items-center gap-4 bg-gray-50 p-5 rounded-[1.5rem] border border-gray-100">
                    <Mail className="text-blue-600" size={18} />
                    <div className="flex-1 overflow-hidden">
                      <p className="text-[9px] font-black text-gray-400 uppercase">E-mail Corporativo</p>
                      <p className="text-sm font-bold text-gray-800 truncate">{state.auth.user?.email}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-10 border-t bg-gray-50">
              <button
                onClick={openSettings}
                className="w-full py-5 bg-[#1e3a8a] text-white rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 hover:bg-blue-800 transition-colors"
              >
                <UserCog size={18} /> Editar Fotografia e Dados
              </button>
            </div>
          </div>
        </div>
      )}

      {showSettingsModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-[#0f172a]/95 backdrop-blur-xl animate-in fade-in duration-500"
            onClick={() => !isSaving && setShowSettingsModal(false)}
          ></div>

          <div className="bg-white w-full max-w-lg rounded-[3.5rem] shadow-[0_35px_100px_-15px_rgba(0,0,0,0.6)] relative z-[10001] overflow-hidden animate-in zoom-in duration-300">
            <div className="p-8 border-b bg-gray-50/50 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-600 rounded-2xl text-white shadow-lg">
                  <Settings size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-gray-800 tracking-tight">Editar Meu Perfil</h2>
                </div>
              </div>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="p-3 hover:bg-gray-200 rounded-full transition-colors text-gray-400"
              >
                <X size={26} />
              </button>
            </div>

            <form onSubmit={handleUpdateProfile} className="p-10 space-y-10 overflow-visible">
              <div className="flex flex-col items-center gap-8 py-4">
                <label htmlFor="photo-upload" className="relative group cursor-pointer block mt-4">
                  <input id="photo-upload" type="file" className="hidden" accept="image/*" onChange={handlePhotoChange} />
                  <div className="relative p-2 bg-gray-200 rounded-[3.5rem] shadow-inner">
                    <AvatarPlaceholder
                      name={state.auth.user?.name || 'User'}
                      id={state.auth.user?.id || 'guest'}
                      photoUrl={formData.photoUrl}
                      className="w-40 h-40 rounded-[3rem] object-cover border-4 border-white shadow-2xl group-hover:scale-105 transition-all duration-300"
                    />
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 rounded-[3rem] m-2">
                    <Camera className="text-white" size={44} />
                  </div>
                  <div className="absolute -bottom-2 -right-2 bg-blue-600 p-4 rounded-2xl text-white border-4 border-white shadow-2xl flex items-center justify-center hover:bg-blue-500 transition-colors">
                    <Upload size={20} />
                  </div>
                </label>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Clique na imagem para alterar</p>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Nome de Exibição</label>
                  <input
                    type="text"
                    className="w-full px-6 py-5 bg-gray-50 border-2 border-transparent focus:border-blue-600 focus:bg-white rounded-[1.5rem] outline-none text-base font-bold transition-all shadow-inner"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="pt-6 flex gap-4">
                <button type="button" onClick={() => setShowSettingsModal(false)} className="flex-1 py-5 text-[11px] font-black uppercase text-gray-400 tracking-widest hover:text-gray-600 transition-colors">Descartar</button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className={`flex-1 py-5 text-white rounded-[1.5rem] text-[11px] font-black uppercase tracking-widest shadow-2xl flex items-center justify-center gap-3 transition-all ${successMessage ? 'bg-green-600' : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                >
                  {isSaving ? <RefreshCw size={20} className="animate-spin" /> : successMessage ? <ShieldCheck size={20} /> : <Save size={20} />}
                  {isSaving ? 'Gravando...' : successMessage ? 'Sucesso!' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
