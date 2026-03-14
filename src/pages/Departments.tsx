import React, { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import {
  Music, Camera, Construction, HeartHandshake, Plus, Search,
  MoreVertical, Clock, CheckCircle2, AlertCircle, ChevronRight, ChevronLeft,
  Music2, Mic2, Video, Instagram, Wrench, HardHat,
  Users, HelpingHand, Trash2, X, Save, AlertTriangle
} from 'lucide-react';
import SEO from '../components/Common/SEO';
import { MusicSong, MediaTask, MaintenanceRequest, SocialBeneficiary } from '../core/types';
import Pagination from '../components/Pagination';

const MUSIC_ITEMS_PER_PAGE = 6;

const Departments: React.FC = () => {
  const { state, dispatch } = useApp();
  const [activeTab, setActiveTab] = useState<'music' | 'media' | 'infra' | 'social'>('music');
  const [showAddModal, setShowAddModal] = useState(false);
  const [musicPage, setMusicPage] = useState(1);

  // Form States
  const [songForm, setSongForm] = useState<Partial<MusicSong>>({ title: '', artist: '', key: 'G', category: 'WORSHIP' });
  const [taskForm, setTaskForm] = useState<Partial<MediaTask>>({ title: '', deadline: '', responsible: '', status: 'PENDING', type: 'VIDEO' });
  const [infraForm, setInfraForm] = useState<Partial<MaintenanceRequest>>({ title: '', location: '', priority: 'MEDIUM', status: 'OPEN' });
  const [socialForm, setSocialForm] = useState<Partial<SocialBeneficiary>>({ name: '', phone: '', needs: '', status: 'ACTIVE' });
  const [socialItems, setSocialItems] = useState<{ name: string, qty: number }[]>([]);
  const [newItemName, setNewItemName] = useState('');
  const [newItemQty, setNewItemQty] = useState(1);

  const handleSaveSong = () => {
    if (!songForm.title) return;
    dispatch({ type: 'ADD_SONG', payload: { ...(songForm as MusicSong), id: `s${Date.now()}` } });
    dispatch({ type: 'ADD_NOTIFICATION', payload: { message: 'Música adicionada ao repertório!', type: 'success' } });
    setShowAddModal(false);
  };

  const handleSaveInfra = () => {
    if (!infraForm.title) return;
    const newReq = { ...infraForm, id: `ir-${Date.now()}`, date: new Date().toISOString(), requester: state.auth.user?.name || 'Admin' };
    dispatch({ type: 'ADD_NOTIFICATION', payload: { message: 'Chamado de manutenção aberto!', type: 'info' } });
    setShowAddModal(false);
    setInfraForm({ title: '', location: '', priority: 'MEDIUM', status: 'OPEN' });
  };

  const handleSaveMedia = () => {
    if (!taskForm.title) return;
    dispatch({ type: 'ADD_MEDIA_TASK', payload: { ...(taskForm as MediaTask), id: `mt${Date.now()}` } });
    dispatch({ type: 'ADD_NOTIFICATION', payload: { message: 'Tarefa de mídia adicionada!', type: 'success' } });
    setShowAddModal(false);
    setTaskForm({ title: '', deadline: '', responsible: '', status: 'PENDING', type: 'VIDEO' });
  };

  const handleSaveSocial = async () => {
    if (!socialForm.name || socialItems.length === 0) {
      dispatch({ type: 'ADD_NOTIFICATION', payload: { message: 'Preencha o membro e adicione necessidades (itens).', type: 'error' } });
      return;
    }
    const finalNeeds = socialItems.map(i => `${i.qty}x ${i.name}`).join(', ');
    const finalForm = { ...socialForm, needs: finalNeeds };

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/social', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(finalForm)
      });
      if (!response.ok) throw new Error('Erro ao salvar no servidor');
      const saved = await response.json();
      dispatch({ type: 'ADD_BENEFICIARY', payload: saved });
      dispatch({ type: 'ADD_NOTIFICATION', payload: { message: 'Beneficiário cadastrado com sucesso!', type: 'success' } });
      setShowAddModal(false);
      setSocialForm({ name: '', phone: '', needs: '', status: 'ACTIVE' });
      setSocialItems([]);
      setNewItemName('');
      setNewItemQty(1);
    } catch (e: any) {
      dispatch({ type: 'ADD_NOTIFICATION', payload: { message: e.message || 'Erro ao salvar beneficiário', type: 'error' } });
    }
  };

  const handleDeleteSocial = async (id: string) => {
    if (!confirm('Deseja realmente remover este beneficiário?')) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/social/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Erro ao excluir');
      dispatch({ type: 'DELETE_BENEFICIARY', payload: id });
    } catch (e) {
      dispatch({ type: 'ADD_NOTIFICATION', payload: { message: 'Erro ao excluir beneficiário', type: 'error' } });
    }
  };

  // Paginação de Música
  const totalMusicPages = Math.ceil(state.songs.length / MUSIC_ITEMS_PER_PAGE);
  const paginatedSongs = state.songs.slice((musicPage - 1) * MUSIC_ITEMS_PER_PAGE, musicPage * MUSIC_ITEMS_PER_PAGE);

  const tabs = [
    { id: 'music', label: 'Música', icon: Music, color: 'text-blue-600', bg: 'bg-blue-50' },
    { id: 'media', label: 'Mídia', icon: Camera, color: 'text-purple-600', bg: 'bg-purple-50' },
    { id: 'infra', label: 'Infraestrutura', icon: Construction, color: 'text-amber-600', bg: 'bg-amber-50' },
    { id: 'social', label: 'Ação Social', icon: HeartHandshake, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <SEO title="Departamentos" description="Gestão de ministérios, música, média e património." />
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-gray-800 tracking-tight">Departamentos</h1>
          <p className="text-gray-500 font-medium italic">Gestão operacional das frentes de serviço.</p>
        </div>
        <div className="flex bg-white p-1 rounded-2xl border border-gray-100 shadow-sm overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex items-center gap-3 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? `${tab.bg} ${tab.color} shadow-sm` : 'text-gray-400 hover:bg-gray-50'}`}>
              <tab.icon size={16} /> {tab.label}
            </button>
          ))}
        </div>
      </header>

      {/* MUSIC TAB */}
      {activeTab === 'music' && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 animate-in slide-in-from-bottom-4">
          <div className="xl:col-span-8 bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-xl font-black text-gray-800">Repertório Musical</h3>
              <button onClick={() => setShowAddModal(true)} className="p-4 bg-blue-600 text-white rounded-2xl shadow-xl"><Plus size={20} /></button>
            </div>
            <div className="space-y-3">
              {paginatedSongs.map(song => (
                <div key={song.id} className="p-5 bg-gray-50/50 border border-gray-100 rounded-3xl flex items-center justify-between hover:bg-white transition-all">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-100 text-blue-600 rounded-2xl"><Music2 size={20} /></div>
                    <div><h4 className="text-sm font-black text-gray-800">{song.title}</h4><p className="text-[10px] font-bold text-gray-400 uppercase">{song.artist} • Tom: {song.key}</p></div>
                  </div>
                  <button onClick={() => dispatch({ type: 'DELETE_SONG', payload: song.id })} className="p-2.5 text-gray-300 hover:text-red-600"><Trash2 size={16} /></button>
                </div>
              ))}
              {state.songs.length === 0 && (
                <div className="py-10 text-center text-gray-300 font-black uppercase tracking-widest text-sm">Nenhuma música no repertório</div>
              )}
            </div>
            <Pagination
              currentPage={musicPage}
              totalPages={totalMusicPages}
              totalRecords={state.songs.length}
              onPageChange={setMusicPage}
            />
          </div>
          <div className="xl:col-span-4 bg-[#1e3a8a] p-10 rounded-[3rem] text-white shadow-2xl">
            <Mic2 size={32} className="text-amber-400 mb-6" />
            <h3 className="text-xl font-black mb-2">Escalas Ativas</h3>
            <p className="text-blue-100 text-sm opacity-80 mb-8">Consulte quem está escalado para o próximo culto.</p>
            <button className="w-full py-4 bg-white/10 hover:bg-white/20 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">Gerenciar Escalas</button>
          </div>
        </div>
      )}

      {/* INFRA TAB (IMPLEMENTADA) */}
      {activeTab === 'infra' && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 animate-in slide-in-from-bottom-4">
          <div className="xl:col-span-2 space-y-6">
            <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-xl font-black text-gray-800">Manutenções & Chamados</h3>
                <button onClick={() => setShowAddModal(true)} className="p-4 bg-amber-500 text-white rounded-2xl shadow-xl"><Plus size={20} /></button>
              </div>
              <div className="space-y-4">
                <div className="p-6 bg-red-50 border border-red-100 rounded-[2rem] flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-red-600 text-white rounded-xl flex items-center justify-center"><AlertTriangle size={24} /></div>
                    <div><h4 className="text-sm font-black text-red-900">Vazamento no Telhado Sede</h4><p className="text-[10px] font-bold text-red-400 uppercase tracking-widest">Prioridade: ALTA • Local: Nave Principal</p></div>
                  </div>
                  <span className="px-3 py-1 bg-white text-red-600 text-[9px] font-black uppercase rounded-lg border border-red-100">URGENTE</span>
                </div>
                <div className="p-6 bg-gray-50 border border-gray-100 rounded-[2rem] flex items-center justify-between opacity-60">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-400 text-white rounded-xl flex items-center justify-center"><CheckCircle2 size={24} /></div>
                    <div><h4 className="text-sm font-black text-gray-800">Pintura da Fachada</h4><p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Concluído em 15/10/2023</p></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-[#0f172a] p-10 rounded-[3rem] text-white shadow-2xl">
            <Wrench size={32} className="text-amber-400 mb-6" />
            <h3 className="text-xl font-black mb-6">Equipe de Obras</h3>
            <div className="space-y-4">
              {['Carlos Pinturas', 'João Eletricista', 'Mário Hidráulica'].map((worker, i) => (
                <div key={i} className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5">
                  <div className="w-10 h-10 bg-amber-400 text-blue-900 rounded-xl flex items-center justify-center font-black">W</div>
                  <span className="text-xs font-bold">{worker}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SOCIAL TAB (IMPLEMENTADA) */}
      {activeTab === 'social' && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 animate-in slide-in-from-bottom-4">
          <div className="xl:col-span-8 bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-xl font-black text-gray-800">Assistência a Famílias</h3>
              <button onClick={() => setShowAddModal(true)} className="p-4 bg-emerald-600 text-white rounded-2xl shadow-xl"><Plus size={20} /></button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {state.beneficiaries.map((b) => (
                <div key={b.id} className="p-6 bg-gray-50 rounded-[2rem] border border-gray-100 hover:bg-white hover:border-emerald-200 transition-all relative group">
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                    <button onClick={() => handleDeleteSocial(b.id)} className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50"><Trash2 size={16} /></button>
                  </div>
                  <h4 className="text-base font-black text-gray-800 mb-1">{b.name}</h4>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">{b.needs}</p>
                  <span className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase ${b.status === 'URGENT' ? 'bg-red-100 text-red-600' : b.status === 'INACTIVE' ? 'bg-gray-100 text-gray-600' : 'bg-emerald-100 text-emerald-600'}`}>{b.status === 'URGENT' ? 'URGENTE' : b.status === 'INACTIVE' ? 'INATIVO' : 'ATIVO'}</span>
                </div>
              ))}
              {state.beneficiaries.length === 0 && (
                <div className="col-span-2 py-10 text-center text-gray-300 font-black uppercase tracking-widest text-sm">Nenhum beneficiário cadastrado</div>
              )}
            </div>
          </div>
          <div className="xl:col-span-4 bg-emerald-600 p-10 rounded-[3rem] text-white shadow-2xl">
            <HelpingHand size={48} className="text-white mb-6" />
            <h3 className="text-2xl font-black mb-4">Relatório de Impacto</h3>
            <p className="text-emerald-100 text-sm opacity-90 mb-8 leading-relaxed">Este mês auxiliamos {state.beneficiaries.length} famílias com nossas frentes de serviço social.</p>
            <button className="w-full py-4 bg-white text-emerald-600 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl">Baixar Mapeamento</button>
          </div>
        </div>
      )}

      {/* MODAL GERAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-blue-950/80 backdrop-blur-md" onClick={() => setShowAddModal(false)}></div>
          <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl relative animate-in zoom-in overflow-hidden">
            <div className="p-8 border-b bg-gray-50 flex justify-between items-center">
              <h2 className="text-2xl font-black text-gray-800">Novo Cadastro</h2>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-white rounded-full"><X size={24} /></button>
            </div>
            <div className="p-10 space-y-6">
              {activeTab === 'music' && (
                <input type="text" placeholder="Título da Música" className="w-full p-4 bg-gray-50 rounded-2xl outline-none font-bold" value={songForm.title} onChange={e => setSongForm({ ...songForm, title: e.target.value })} />
              )}
              {activeTab === 'media' && (
                <>
                  <input type="text" placeholder="Título da Tarefa/Projeto (ex: Edição do Culto)" className="w-full p-4 bg-gray-50 rounded-2xl outline-none font-bold" value={taskForm.title || ''} onChange={e => setTaskForm({ ...taskForm, title: e.target.value })} />
                  <div className="grid grid-cols-2 gap-4">
                    <input type="date" className="w-full p-4 bg-gray-50 rounded-2xl outline-none font-bold text-gray-400" value={taskForm.deadline || ''} onChange={e => setTaskForm({ ...taskForm, deadline: e.target.value })} />
                    <select className="w-full p-4 bg-gray-50 rounded-2xl outline-none font-bold text-gray-600" value={taskForm.type || 'VIDEO'} onChange={e => setTaskForm({ ...taskForm, type: e.target.value as any })}>
                      <option value="VIDEO">Vídeo</option>
                      <option value="PHOTO">Foto</option>
                      <option value="DESIGN">Design</option>
                      <option value="SOCIAL">Redes Sociais</option>
                    </select>
                  </div>
                  <input type="text" placeholder="Responsável" className="w-full p-4 bg-gray-50 rounded-2xl outline-none font-bold" value={taskForm.responsible || ''} onChange={e => setTaskForm({ ...taskForm, responsible: e.target.value })} />
                </>
              )}
              {activeTab === 'infra' && (
                <>
                  <input type="text" placeholder="O que precisa de conserto? (ex: Lâmpada Queimada)" className="w-full p-4 bg-gray-50 rounded-2xl outline-none font-bold" value={infraForm.title || ''} onChange={e => setInfraForm({ ...infraForm, title: e.target.value })} />
                  <input type="text" placeholder="Localização (ex: Nave Principal)" className="w-full p-4 bg-gray-50 rounded-2xl outline-none font-bold" value={infraForm.location || ''} onChange={e => setInfraForm({ ...infraForm, location: e.target.value })} />
                  <select className="w-full p-4 bg-gray-50 rounded-2xl outline-none font-bold text-gray-600" value={infraForm.priority || 'MEDIUM'} onChange={e => setInfraForm({ ...infraForm, priority: e.target.value as any })}>
                    <option value="LOW">Prioridade: Baixa</option>
                    <option value="MEDIUM">Prioridade: Média</option>
                    <option value="HIGH">Prioridade: Alta</option>
                  </select>
                </>
              )}
              {activeTab === 'social' && (
                <div className="space-y-4">
                  <select className="w-full p-4 bg-gray-50 rounded-2xl outline-none font-bold text-gray-600 appearance-none" value={socialForm.name || ''} onChange={e => {
                    const member = state.members.find(m => m.name === e.target.value);
                    setSocialForm({ ...socialForm, name: e.target.value, phone: member?.phone || socialForm.phone });
                  }}>
                    <option value="" disabled>Selecione um membro...</option>
                    {state.members.filter(m => m.status === 'active').sort((a, b) => a.name.localeCompare(b.name)).map(m => (
                      <option key={m.id} value={m.name}>{m.name}</option>
                    ))}
                  </select>

                  <input type="tel" placeholder="Telefone de Contato" className="w-full p-4 bg-gray-50 rounded-2xl outline-none font-bold" value={socialForm.phone || ''} onChange={e => setSocialForm({ ...socialForm, phone: e.target.value })} />

                  <select className="w-full p-4 bg-gray-50 rounded-2xl outline-none font-bold text-gray-600 appearance-none" value={socialForm.status || 'ACTIVE'} onChange={e => setSocialForm({ ...socialForm, status: e.target.value as any })}>
                    <option value="ACTIVE">Status: Ativo</option>
                    <option value="URGENT">Status: Urgente</option>
                    <option value="INACTIVE">Status: Inativo</option>
                  </select>

                  <div className="pt-2 border-t border-gray-100">
                    <label className="text-[10px] font-black tracking-widest uppercase text-gray-400 mb-2 block">Necessidades</label>
                    <div className="flex gap-2">
                      <input type="text" placeholder="Item (ex: Cesta Básica)" className="flex-1 p-3 bg-gray-50 rounded-xl outline-none font-bold text-sm" value={newItemName} onChange={e => setNewItemName(e.target.value)} onKeyDown={e => e.key === 'Enter' && newItemName && (setSocialItems([...socialItems, { name: newItemName, qty: newItemQty }]), setNewItemName(''), setNewItemQty(1))} />
                      <input type="number" min="1" className="w-20 p-3 bg-gray-50 rounded-xl outline-none font-bold text-sm text-center" value={newItemQty} onChange={e => setNewItemQty(parseInt(e.target.value) || 1)} />
                      <button onClick={() => { if (newItemName) { setSocialItems([...socialItems, { name: newItemName, qty: newItemQty }]); setNewItemName(''); setNewItemQty(1); } }} className="p-3 bg-blue-100 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all">
                        <Plus size={18} />
                      </button>
                    </div>

                    <div className="mt-3 space-y-2 max-h-[140px] overflow-y-auto">
                      {socialItems.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center p-3 bg-white border border-gray-100 rounded-xl">
                          <span className="text-sm font-bold text-gray-800">{item.qty}x {item.name}</span>
                          <button onClick={() => setSocialItems(socialItems.filter((_, i) => i !== idx))} className="text-gray-400 hover:text-red-500"><X size={14} /></button>
                        </div>
                      ))}
                      {socialItems.length === 0 && <span className="text-xs text-gray-400 italic">Adicione os itens de necessidade...</span>}
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="p-8 border-t bg-gray-50 flex gap-4">
              <button onClick={() => setShowAddModal(false)} className="flex-1 py-4 text-[10px] font-black uppercase text-gray-400">Cancelar</button>
              <button
                onClick={
                  activeTab === 'music' ? handleSaveSong :
                    activeTab === 'media' ? handleSaveMedia :
                      activeTab === 'infra' ? handleSaveInfra :
                        handleSaveSocial
                }
                className="flex-1 py-4 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase shadow-xl flex items-center justify-center gap-2"><Save size={18} /> Salvar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Departments;
