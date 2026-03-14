
import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Marriage } from '../core/types';
import {
  Heart, Plus, Calendar, MapPin, User, ShieldCheck,
  MoreVertical, X, Save, Printer, Award, Church,
  CheckCircle2, Clock, AlertCircle, Search, Edit, BellRing,
  Trash2, Filter, ChevronLeft, ChevronRight, FileSpreadsheet, FileText
} from 'lucide-react';
import SEO from '../components/Common/SEO';
import Pagination from '../components/Pagination';

const ITEMS_PER_PAGE = 5;

const Marriages: React.FC = () => {
  const { state, dispatch } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedMarriage, setSelectedMarriage] = useState<Marriage | null>(null);
  const [showCertificate, setShowCertificate] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [groomSearch, setGroomSearch] = useState('');
  const [brideSearch, setBrideSearch] = useState('');
  const [showGroomDropdown, setShowGroomDropdown] = useState(false);
  const [showBrideDropdown, setShowBrideDropdown] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const [formData, setFormData] = useState<Partial<Marriage>>({
    groomName: '', groomIsMember: true, brideName: '', brideIsMember: true,
    date: '', time: '', location: '', officiant: '', witnesses: '',
    status: 'IN_PROCESS', documentationStatus: 'PENDING'
  });

  const stats = {
    inProcess: state.marriages.filter(m => m.status === 'IN_PROCESS').length,
    performed: state.marriages.filter(m => m.status === 'PERFORMED').length,
    canceled: state.marriages.filter(m => m.status === 'CANCELED').length
  };

  const getDaysRemaining = (dateStr: string) => {
    if (!dateStr) return 999;
    const wedding = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    wedding.setHours(0, 0, 0, 0);
    const diffTime = wedding.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const futureMarriages = state.marriages.filter(m => {
    const weddingDate = new Date(m.date);
    weddingDate.setHours(0, 0, 0, 0);
    return m.status === 'IN_PROCESS' && weddingDate >= today;
  });

  const historyMarriages = state.marriages.filter(m => {
    const weddingDate = new Date(m.date);
    weddingDate.setHours(0, 0, 0, 0);
    return m.status !== 'IN_PROCESS' || weddingDate < today;
  });

  const filteredMarriages = historyMarriages.filter(m =>
    m.groomName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.brideName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredMarriages.length / ITEMS_PER_PAGE);
  const paginatedMarriages = filteredMarriages.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handleSave = async () => {
    if (!formData.groomName || !formData.brideName || !formData.date) {
      dispatch({ type: 'ADD_NOTIFICATION', payload: { message: 'Campos obrigatórios em falta!', type: 'error' } });
      return;
    }

    const token = localStorage.getItem('token');
    const method = editingId ? 'PUT' : 'POST';
    const url = editingId ? `/api/marriages/${editingId}` : '/api/marriages';

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Erro ao salvar casamento');

      const saved = await response.json();

      const rawStatus = saved.status || formData.status || 'IN_PROCESS';
      const mappedStatus = rawStatus === 'EM_PROCESSO' ? 'IN_PROCESS' :
        rawStatus === 'REALIZADO' ? 'PERFORMED' :
          rawStatus === 'CANCELADO' ? 'CANCELED' : rawStatus;

      const marriageData: Marriage = {
        ...formData,
        ...saved,
        id: saved.idCasamento || saved.id || editingId,
        status: mappedStatus
      } as Marriage;

      if (editingId) {
        dispatch({ type: 'UPDATE_MARRIAGE', payload: marriageData });
        dispatch({ type: 'ADD_NOTIFICATION', payload: { message: 'Processo atualizado!', type: 'success' } });
      } else {
        dispatch({ type: 'ADD_MARRIAGE', payload: marriageData });
        dispatch({ type: 'ADD_NOTIFICATION', payload: { message: 'Novo casamento agendado!', type: 'success' } });
      }

      setShowModal(false);
      setEditingId(null);
    } catch (error) {
      console.error('Error saving marriage:', error);
      dispatch({ type: 'ADD_NOTIFICATION', payload: { message: 'Erro ao conectar com o servidor', type: 'error' } });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja remover este registro?')) return;

    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`/api/marriages/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Erro ao remover casamento');

      dispatch({ type: 'ADD_NOTIFICATION', payload: { message: 'Registro removido com sucesso', type: 'info' } });
      window.location.reload();
    } catch (error: any) {
      console.error('Error deleting marriage:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Erro ao remover casamento no servidor';
      dispatch({ type: 'ADD_NOTIFICATION', payload: { message: errorMessage, type: 'error' } });
    }
  };

  const getStatusBadge = (status: Marriage['status'], dateStr: string) => {
    const days = getDaysRemaining(dateStr);
    switch (status) {
      case 'IN_PROCESS':
        return <span className={`px-3 py-1 text-[10px] font-black uppercase rounded-full ${days <= 3 ? 'bg-amber-100 text-amber-700 animate-pulse' : 'bg-blue-100 text-blue-700'}`}>Em Processo</span>;
      case 'PERFORMED': return <span className="px-3 py-1 bg-green-100 text-green-700 text-[10px] font-black uppercase rounded-full">Realizado</span>;
      case 'CANCELED': return <span className="px-3 py-1 bg-red-100 text-red-700 text-[10px] font-black uppercase rounded-full">Cancelado</span>;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <SEO title="Casamentos" description="Gestão de registros e certificados de casamentos." />
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-gray-800 tracking-tight">Casamentos</h1>
          <p className="text-gray-500 font-medium italic">Gestão de processos e registros matrimoniais.</p>
        </div>
        <button onClick={() => {
          setFormData({
            groomName: '', groomIsMember: true, brideName: '', brideIsMember: true,
            date: '', time: '', location: '', officiant: '', witnesses: '',
            status: 'IN_PROCESS', documentationStatus: 'PENDING'
          });
          setEditingId(null);
          setShowModal(true);
        }} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl text-[11px] font-black uppercase tracking_widest shadow-xl flex items-center gap-2">
          <Plus size={18} /> Novo Registro
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex items-center gap-6">
          <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center"><Clock size={28} /></div>
          <div><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Em Processo</p><h3 className="text-3xl font-black text-gray-800">{stats.inProcess}</h3></div>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex items-center gap-6">
          <div className="w-14 h-14 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center"><CheckCircle2 size={28} /></div>
          <div><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Realizados</p><h3 className="text-3xl font-black text-gray-800">{stats.performed}</h3></div>
        </div>
        <div className="bg-[#1e3a8a] p-8 rounded-[2.5rem] shadow-xl text-white flex items-center gap-6">
          <div className="w-14 h-14 bg-white/10 text-amber-400 rounded-2xl flex items-center justify-center"><Heart size={28} /></div>
          <div><p className="text-[10px] font-black text-blue-200 uppercase tracking-widest">Total Registros</p><h3 className="text-3xl font-black text-white">{state.marriages.length}</h3></div>
        </div>
      </div>

      {futureMarriages.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <BellRing className="text-amber-500 animate-bounce" size={24} />
            <h2 className="text-2xl font-black text-gray-800">Próximos Casamentos</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {futureMarriages.map(m => {
              const days = getDaysRemaining(m.date);
              return (
                <div key={m.id} className={`bg-white p-8 rounded-[3rem] border-2 shadow-xl transition-all hover:scale-[1.02] ${days <= 3 ? 'border-amber-400/50' : 'border-blue-50'}`}>
                  <div className="flex justify-between items-start mb-6">
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                      <Heart size={24} />
                    </div>
                    {days <= 7 && (
                      <div className={`px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-2 ${days <= 3 ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                        <AlertCircle size={14} />
                        {days === 0 ? 'É Hoje!' : `${days} dias restantes`}
                      </div>
                    )}
                  </div>

                  <h3 className="text-xl font-black text-gray-800 mb-2 truncate">{m.groomName} & {m.brideName}</h3>
                  <div className="space-y-3 mb-8">
                    <div className="flex items-center gap-2 text-gray-500 italic text-sm font-medium">
                      <Calendar size={14} className="text-blue-500" />
                      {new Date(m.date + 'T12:00:00').toLocaleDateString('pt-AO', { day: '2-digit', month: 'long', year: 'numeric', timeZone: 'Africa/Luanda' })}
                    </div>
                    {m.time && (
                      <div className="flex items-center gap-2 text-gray-500 italic text-sm font-medium">
                        <Clock size={14} className="text-blue-500" />
                        {m.time}
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-gray-500 italic text-sm font-medium">
                      <MapPin size={14} className="text-blue-500" />
                      {m.location || 'Local não definido'}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button onClick={() => { setEditingId(m.id); setFormData(m); setShowModal(true); }} className="flex-1 py-3 bg-blue-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg hover:bg-blue-700 transition-colors">
                      Gerenciar
                    </button>
                    <button onClick={() => { setSelectedMarriage(m); setShowCertificate(true); }} className="p-3 bg-amber-100 text-amber-600 rounded-xl hover:bg-amber-200 transition-colors">
                      <Award size={18} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <div className="bg-white rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-gray-50 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1">
            <Search size={18} className="text-gray-400" />
            <input type="text" placeholder="Pesquisar noivos no histórico..." className="flex-1 outline-none text-sm font-bold" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Histórico de Registros</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-8 py-5 text-[10px] font-black uppercase text-gray-400 tracking-widest">Casal</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase text-gray-400 tracking-widest">Data</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase text-gray-400 tracking-widest text-center">Status</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase text-gray-400 tracking-widest text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginatedMarriages.length > 0 ? paginatedMarriages.map(m => (
                <tr key={m.id} className="hover:bg-blue-50/30 transition-colors">
                  <td className="px-8 py-5">
                    <p className="text-sm font-black text-gray-800">{m.groomName} & {m.brideName}</p>
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{m.officiant}</p>
                  </td>
                  <td className="px-8 py-5 text-xs font-bold text-gray-600">{new Date(m.date + 'T12:00:00').toLocaleDateString('pt-AO', { timeZone: 'Africa/Luanda' })}</td>
                  <td className="px-8 py-5 text-center">{getStatusBadge(m.status, m.date)}</td>
                  <td className="px-8 py-5 text-right flex justify-end gap-2">
                    <button onClick={() => { setEditingId(m.id); setFormData(m); setShowModal(true); }} className="p-2 text-gray-400 hover:text-blue-600 transition-colors"><Edit size={16} /></button>
                    <button onClick={() => { setSelectedMarriage(m); setShowCertificate(true); }} className="p-2 text-gray-400 hover:text-amber-600 transition-colors"><Award size={16} /></button>
                    <button onClick={() => handleDelete(m.id)} className="p-2 text-gray-400 hover:text-red-600 transition-colors"><Trash2 size={16} /></button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={4} className="px-8 py-20 text-center">
                    <p className="text-gray-400 font-black uppercase text-[10px] tracking-widest">Nenhum registro encontrado no histórico</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalRecords={filteredMarriages.length}
          onPageChange={setCurrentPage}
        />
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-blue-950/80 backdrop-blur-md" onClick={() => setShowModal(false)}></div>
          <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl relative animate-in zoom-in overflow-hidden">
            <div className="p-8 border-b bg-gray-50 flex justify-between items-center">
              <h2 className="text-2xl font-black text-gray-800">{editingId ? 'Editar Casamento' : 'Novo Casamento'}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-white rounded-full"><X size={24} /></button>
            </div>
            <div className="p-10 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                {/* GROOM MEMBER SELECTOR */}
                <div className="space-y-1 relative">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Nome do Noivo</label>
                  {formData.groomName ? (
                    <div className="w-full p-4 bg-blue-50 rounded-2xl flex items-center justify-between border border-blue-200">
                      <div className="flex items-center gap-3">
                        <User size={16} className="text-blue-600" />
                        <span className="text-sm font-black text-blue-800">{formData.groomName}</span>
                      </div>
                      <button onClick={() => { setFormData({ ...formData, groomName: '' }); setGroomSearch(''); }} className="p-1 hover:bg-blue-200 rounded-lg transition-colors">
                        <X size={14} className="text-blue-600" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="relative">
                        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                        <input
                          type="text"
                          placeholder="Pesquisar membro..."
                          className="w-full pl-11 p-4 bg-gray-50 rounded-2xl outline-none font-bold text-sm focus:ring-2 focus:ring-blue-600"
                          value={groomSearch}
                          onChange={e => { setGroomSearch(e.target.value); setShowGroomDropdown(true); }}
                          onFocus={() => setShowGroomDropdown(true)}
                        />
                      </div>
                      {showGroomDropdown && groomSearch.length > 0 && (
                        <div className="absolute top-full left-0 w-full mt-1 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 max-h-[200px] overflow-y-auto">
                          {state.members.filter(m => m.name.toLowerCase().includes(groomSearch.toLowerCase())).length === 0 ? (
                            <p className="p-4 text-sm text-gray-400 text-center">Nenhum membro encontrado</p>
                          ) : (
                            state.members.filter(m => m.name.toLowerCase().includes(groomSearch.toLowerCase())).slice(0, 8).map(m => (
                              <button
                                key={m.id}
                                onClick={() => { setFormData({ ...formData, groomName: m.name, groomIsMember: true }); setGroomSearch(''); setShowGroomDropdown(false); }}
                                className="w-full p-3 flex items-center gap-3 hover:bg-blue-50 transition-colors text-left"
                              >
                                <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center text-[10px] font-black">
                                  {m.name.charAt(0)}
                                </div>
                                <div>
                                  <p className="text-sm font-bold text-gray-800">{m.name}</p>
                                  <p className="text-[9px] text-gray-400 uppercase font-black">Membro</p>
                                </div>
                              </button>
                            ))
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* BRIDE MEMBER SELECTOR */}
                <div className="space-y-1 relative">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Nome da Noiva</label>
                  {formData.brideName ? (
                    <div className="w-full p-4 bg-pink-50 rounded-2xl flex items-center justify-between border border-pink-200">
                      <div className="flex items-center gap-3">
                        <Heart size={16} className="text-pink-600" />
                        <span className="text-sm font-black text-pink-800">{formData.brideName}</span>
                      </div>
                      <button onClick={() => { setFormData({ ...formData, brideName: '' }); setBrideSearch(''); }} className="p-1 hover:bg-pink-200 rounded-lg transition-colors">
                        <X size={14} className="text-pink-600" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="relative">
                        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                        <input
                          type="text"
                          placeholder="Pesquisar membro..."
                          className="w-full pl-11 p-4 bg-gray-50 rounded-2xl outline-none font-bold text-sm focus:ring-2 focus:ring-pink-600"
                          value={brideSearch}
                          onChange={e => { setBrideSearch(e.target.value); setShowBrideDropdown(true); }}
                          onFocus={() => setShowBrideDropdown(true)}
                        />
                      </div>
                      {showBrideDropdown && brideSearch.length > 0 && (
                        <div className="absolute top-full left-0 w-full mt-1 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 max-h-[200px] overflow-y-auto">
                          {state.members.filter(m => m.name.toLowerCase().includes(brideSearch.toLowerCase())).length === 0 ? (
                            <p className="p-4 text-sm text-gray-400 text-center">Nenhum membro encontrado</p>
                          ) : (
                            state.members.filter(m => m.name.toLowerCase().includes(brideSearch.toLowerCase())).slice(0, 8).map(m => (
                              <button
                                key={m.id}
                                onClick={() => { setFormData({ ...formData, brideName: m.name, brideIsMember: true }); setBrideSearch(''); setShowBrideDropdown(false); }}
                                className="w-full p-3 flex items-center gap-3 hover:bg-pink-50 transition-colors text-left"
                              >
                                <div className="w-8 h-8 bg-pink-100 text-pink-600 rounded-xl flex items-center justify-center text-[10px] font-black">
                                  {m.name.charAt(0)}
                                </div>
                                <div>
                                  <p className="text-sm font-bold text-gray-800">{m.name}</p>
                                  <p className="text-[9px] text-gray-400 uppercase font-black">Membro</p>
                                </div>
                              </button>
                            ))
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input type="date" className="w-full p-4 bg-gray-50 rounded-2xl outline-none font-bold" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} />
                <input type="time" className="w-full p-4 bg-gray-50 rounded-2xl outline-none font-bold" value={formData.time} onChange={e => setFormData({ ...formData, time: e.target.value })} />
              </div>
              <input type="text" placeholder="Pastor Oficiante" className="w-full p-4 bg-gray-50 rounded-2xl outline-none font-bold" value={formData.officiant} onChange={e => setFormData({ ...formData, officiant: e.target.value })} />
              <select className="w-full p-4 bg-gray-50 rounded-2xl outline-none font-bold" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value as any })}>
                <option value="IN_PROCESS">Em Processo</option>
                <option value="PERFORMED">Realizado</option>
                <option value="CANCELED">Cancelado</option>
              </select>
            </div>
            <div className="p-8 border-t bg-gray-50 flex gap-4">
              <button onClick={() => setShowModal(false)} className="flex-1 py-4 text-[10px] font-black uppercase text-gray-400">Cancelar</button>
              <button onClick={handleSave} className="flex-1 py-4 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase shadow-xl flex items-center justify-center gap-2"><Save size={18} /> Salvar</button>
            </div>
          </div>
        </div>
      )}
    </div >
  );
};

export default Marriages;
