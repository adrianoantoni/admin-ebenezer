
import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  Shield, UserPlus, Key, ShieldCheck,
  Mail, Settings, Clock, X, Save,
  UserCog, Trash2, Eye, EyeOff, Lock,
  CheckCircle2, AlertCircle, Search, ChevronLeft, ChevronRight
} from 'lucide-react';
import { User, UserRole } from '../core/types';
import AvatarPlaceholder from '../components/AvatarPlaceholder';
import Pagination from '../components/Pagination';

const ROLE_INFO: Record<UserRole, { label: string, color: string, icon: any }> = {
  SUPER_ADMIN: { label: 'Super Admin', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: ShieldCheck },
  PASTOR: { label: 'Pastor/Líder', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: Shield },
  TREASURER: { label: 'Tesoureiro', color: 'bg-purple-100 text-purple-700 border-purple-200', icon: Key },
  SECRETARY: { label: 'Secretário', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: UserCog },
  USER: { label: 'Padrão', color: 'bg-gray-100 text-gray-700 border-gray-200', icon: Clock },
};

const ITEMS_PER_PAGE = 8;

const UsersPage: React.FC = () => {
  const { state, dispatch } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: UserRole.USER,
    password: '',
    confirmPassword: ''
  });

  // Filtragem
  const filteredUsers = useMemo(() => {
    return state.users.filter(user =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [state.users, searchTerm]);

  // Paginação
  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredUsers.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredUsers, currentPage]);

  const handleOpenEdit = (user: User) => {
    setEditingId(user.id);
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      password: '',
      confirmPassword: ''
    });
    setShowModal(true);
  };


  const handleSave = async () => {
    if (!formData.name || !formData.email) {
      dispatch({ type: 'ADD_NOTIFICATION', payload: { message: 'Nome e Email são obrigatórios!', type: 'error' } });
      return;
    }

    if (!editingId && (!formData.password || formData.password !== formData.confirmPassword)) {
      dispatch({ type: 'ADD_NOTIFICATION', payload: { message: 'As senhas não coincidem ou estão vazias!', type: 'error' } });
      return;
    }

    try {
      const url = editingId ? `/api/users/${editingId}` : '/api/users';
      const method = editingId ? 'PUT' : 'POST';
      const token = localStorage.getItem('token');

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          nome: formData.name,
          email: formData.email,
          perfil: formData.role === 'SUPER_ADMIN' ? 'ADMIN' :
                  formData.role === 'TREASURER' ? 'TESOUREIRO' :
                  formData.role === 'SECRETARY' ? 'SECRETARIO' :
                  formData.role === 'USER' ? 'MEMBRO' : formData.role,
          senha: formData.password
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao salvar usuário');
      }

      const savedUser = await response.json();
      
      if (editingId) {
        dispatch({ type: 'UPDATE_USER', payload: savedUser });
        dispatch({ type: 'ADD_NOTIFICATION', payload: { message: 'Perfil de operador atualizado!', type: 'success' } });
      } else {
        dispatch({ type: 'ADD_USER', payload: savedUser });
        dispatch({ type: 'ADD_NOTIFICATION', payload: { message: 'Novo operador registrado com sucesso!', type: 'success' } });
      }

      setShowModal(false);
      setEditingId(null);
      setFormData({ name: '', email: '', role: UserRole.USER, password: '', confirmPassword: '' });
    } catch (error: any) {
      dispatch({ type: 'ADD_NOTIFICATION', payload: { message: error.message || 'Erro ao conectar com o servidor', type: 'error' } });
    }
  };

  const handleResetPassword = async (user: User) => {
    if (!confirm(`Deseja enviar um e-mail de redefinição de senha para ${user.name}?`)) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/users/${user.id}/reset-password`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Falha ao disparar recuperação');

      dispatch({ type: 'ADD_NOTIFICATION', payload: { message: `E-mail de recuperação enviado para ${user.email}`, type: 'success' } });
    } catch (error: any) {
      dispatch({ type: 'ADD_NOTIFICATION', payload: { message: error.message, type: 'error' } });
    }
  };

  const handleDeleteUser = async (id: string, name: string) => {
    if (id === state.auth.user?.id) {
      dispatch({ type: 'ADD_NOTIFICATION', payload: { message: 'Você não pode excluir seu próprio acesso!', type: 'error' } });
      return;
    }

    if (confirm(`Tem certeza que deseja revogar o acesso de ${name}?`)) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/users/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Erro ao revogar acesso');

        dispatch({ type: 'ADD_NOTIFICATION', payload: { message: `Acesso de ${name} revogado.`, type: 'info' } });
        // Rematricular ou filtrar localmente
        const currentUsers = state.users.filter(u => u.id !== id);
        dispatch({ type: 'SYNC_STORAGE', payload: { users: currentUsers } });
      } catch (error: any) {
        dispatch({ type: 'ADD_NOTIFICATION', payload: { message: error.message, type: 'error' } });
      }
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">

      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-gray-800 tracking-tight">Operadores & IAM</h1>
          <p className="text-gray-500 font-medium italic">Gestão de identidades e matriz de privilégios de acesso.</p>
        </div>
        <button
          onClick={() => { setShowModal(true); setEditingId(null); setFormData({ name: '', email: '', role: UserRole.USER, password: '', confirmPassword: '' }); }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all shadow-xl shadow-blue-200 flex items-center gap-2 active:scale-95"
        >
          <UserPlus size={18} /> Novo Operador
        </button>
      </header>

      <div className="bg-white rounded-[3rem] shadow-sm border border-gray-100 overflow-hidden flex flex-col">
        {/* Barra de Pesquisa */}
        <div className="p-8 border-b border-gray-50 bg-gray-50/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Lista de Acessos Autorizados</h3>
          <div className="relative w-full md:w-80">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Pesquisar por nome ou e-mail..."
              className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 focus:border-blue-600 rounded-2xl outline-none text-xs font-bold transition-all shadow-sm"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-8 py-5 text-[10px] font-black uppercase text-gray-400 tracking-widest">Operador</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase text-gray-400 tracking-widest">Nível de Acesso</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase text-gray-400 tracking-widest text-center">Último Login</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase text-gray-400 tracking-widest text-right">Acções</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginatedUsers.map(user => {
                const Role = ROLE_INFO[user.role];
                return (
                  <tr key={user.id} className="hover:bg-blue-50/30 transition-all group">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <AvatarPlaceholder
                          name={user.name}
                          id={user.id}
                          photoUrl={user.photoUrl}
                          className="w-10 h-10 rounded-xl object-cover shadow-sm border-2 border-white"
                        />
                        <div>
                          <p className="text-sm font-black text-gray-800">{user.name}</p>
                          <p className="text-[10px] text-gray-400 font-bold">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border self-start w-fit ${Role.color}`}>
                        <Role.icon size={12} />
                        <span className="text-[9px] font-black uppercase tracking-widest">{Role.label}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-center">
                      <p className="text-xs font-bold text-gray-600">{new Date(user.lastLogin).toLocaleDateString()}</p>
                      <p className="text-[9px] text-gray-400 font-black uppercase">{new Date(user.lastLogin).toLocaleTimeString()}</p>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleResetPassword(user)}
                          className="p-3 bg-gray-50 text-gray-400 hover:text-amber-600 hover:bg-white rounded-xl transition-all shadow-sm"
                          title="Enviar link de redefinição"
                        >
                          <Key size={16} />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(user)}
                          className="p-3 bg-gray-50 text-gray-400 hover:text-blue-600 hover:bg-white rounded-xl transition-all shadow-sm"
                          title="Configurações"
                        >
                          <Settings size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id, user.name)}
                          className="p-3 bg-gray-50 text-gray-300 hover:text-red-600 hover:bg-white rounded-xl transition-all shadow-sm"
                          title="Revogar Acesso"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {paginatedUsers.length === 0 && (
            <div className="py-20 text-center space-y-4">
              <AlertCircle className="mx-auto text-gray-200" size={48} />
              <p className="text-gray-400 font-black uppercase text-[10px] tracking-widest">Nenhum operador localizado para esta pesquisa.</p>
            </div>
          )}
        </div>

        {/* Paginação */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalRecords={filteredUsers.length}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* MODAL DE USUÁRIO COM SENHA */}
      {showModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-blue-950/80 backdrop-blur-md animate-in fade-in" onClick={() => setShowModal(false)}></div>
          <div className="bg-white w-full max-w-lg rounded-[3.5rem] shadow-2xl relative overflow-hidden animate-in zoom-in duration-300 flex flex-col max-h-[95vh]">
            <div className="p-8 border-b bg-gray-50/50 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg">
                  <UserCog size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-gray-800 tracking-tight">{editingId ? 'Editar Operador' : 'Novo Registro de Acesso'}</h2>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Defina credenciais e privilégios</p>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-white rounded-full transition-colors"><X size={24} /></button>
            </div>

            <div className="p-10 space-y-6 overflow-y-auto">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Nome Completo</label>
                <input
                  type="text"
                  placeholder="Ex: João Baptista"
                  className="w-full p-4 bg-gray-50 border-2 border-transparent focus:border-blue-600 rounded-2xl outline-none font-bold text-sm transition-all"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Email de Acesso</label>
                <input
                  type="email"
                  placeholder="email@instituicao.com"
                  className="w-full p-4 bg-gray-50 border-2 border-transparent focus:border-blue-600 rounded-2xl outline-none font-bold text-sm transition-all"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Tipo de Usuário (Role)</label>
                <select
                  className="w-full p-4 bg-gray-50 border-2 border-transparent focus:border-blue-600 rounded-2xl outline-none font-bold text-sm transition-all"
                  value={formData.role}
                  onChange={e => setFormData({ ...formData, role: e.target.value as UserRole })}
                >
                  {Object.entries(ROLE_INFO).map(([key, info]) => (
                    <option key={key} value={key}>{info.label}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Senha</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="w-full pl-12 pr-12 py-4 bg-gray-50 border-2 border-transparent focus:border-blue-600 rounded-2xl outline-none font-bold text-sm transition-all"
                      value={formData.password}
                      onChange={e => setFormData({ ...formData, password: e.target.value })}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Verificar Senha</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className={`w-full pl-12 pr-4 py-4 bg-gray-50 border-2 outline-none font-bold text-sm transition-all rounded-2xl ${formData.confirmPassword && formData.password !== formData.confirmPassword ? 'border-red-500' : 'border-transparent focus:border-blue-600'
                        }`}
                      value={formData.confirmPassword}
                      onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                <p className="text-[9px] font-black text-red-600 uppercase tracking-widest ml-2">Atenção: As senhas não coincidem!</p>
              )}
            </div>

            <div className="p-8 border-t bg-gray-50 flex gap-4">
              <button onClick={() => setShowModal(false)} className="flex-1 py-4 text-[10px] font-black uppercase text-gray-400 tracking-widest hover:text-gray-600">Descartar</button>
              <button
                onClick={handleSave}
                className="flex-1 py-4 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase shadow-xl flex items-center justify-center gap-2 active:scale-95 transition-all shadow-blue-200"
              >
                <Save size={18} /> {editingId ? 'Salvar Alterações' : 'Concluir Registro'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default UsersPage;
