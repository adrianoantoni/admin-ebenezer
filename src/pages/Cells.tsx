
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Network, Plus, Search, MapPin, Clock, MoreVertical, X, Save, Users, Trash2, AlertCircle, ChevronLeft } from 'lucide-react';
import SEO from '../components/Common/SEO';
import { Cell } from '../core/types';
import Pagination from '../components/Pagination';

const Cells: React.FC = () => {
  const { state, dispatch } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState<Partial<Cell>>({
    name: '', leaderName: '', hostName: '', address: '', dayOfWeek: 'Quarta-feira', time: '19:00', status: 'ACTIVE'
  });
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 6;

  const filteredCells = (state.cells || []).filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.leaderName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredCells.length / ITEMS_PER_PAGE);
  const paginatedCells = filteredCells.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  // Reset page when search changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handleSave = () => {
    if (!formData.name || !formData.leaderName) {
      dispatch({ type: 'ADD_NOTIFICATION', payload: { message: 'Nome e Líder são obrigatórios!', type: 'error' } });
      return;
    }

    const newCell: Cell = {
      ...(formData as Cell),
      id: Math.random().toString(36).substr(2, 9),
      membersCount: 0,
      leaderId: 'm-sys'
    };

    dispatch({ type: 'ADD_CELL', payload: newCell });
    dispatch({ type: 'ADD_NOTIFICATION', payload: { message: 'Célula registrada com sucesso!', type: 'success' } });

    dispatch({
      type: 'ADD_LOG', payload: {
        id: `log-cell-${Date.now()}`,
        action: 'CREATE_CELL',
        userId: state.auth.user?.id || 'sys',
        userName: state.auth.user?.name || 'Admin',
        category: 'CELLS',
        severity: 'LOW',
        target: newCell.name,
        timestamp: new Date().toISOString(),
        ip: '127.0.0.1'
      }
    });

    setShowModal(false);
    setFormData({ name: '', leaderName: '', hostName: '', address: '', dayOfWeek: 'Quarta-feira', time: '19:00', status: 'ACTIVE' });
  };

  const handleDelete = (id: string, name: string) => {
    dispatch({ type: 'DELETE_CELL', payload: id });
    dispatch({ type: 'ADD_NOTIFICATION', payload: { message: `Célula ${name} removida.`, type: 'info' } });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <SEO title="Células" description="Gestão de pequenos grupos e células de multiplicação." />
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-gray-800 tracking-tight">Células & Grupos</h1>
          <p className="text-gray-500 font-medium italic">Gestão da visão celular e multiplicação ministerial.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all shadow-xl flex items-center gap-2"
        >
          <Plus size={18} /> Nova Célula
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Células Ativas</p>
          <h3 className="text-4xl font-black text-blue-600 tracking-tighter">{filteredCells.length}</h3>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Liderança</p>
          <h3 className="text-4xl font-black text-emerald-600 tracking-tighter">{filteredCells.length} Líderes</h3>
        </div>
        <div className="bg-[#1e3a8a] p-8 rounded-[2.5rem] shadow-xl text-white">
          <p className="text-[10px] font-black text-blue-200 uppercase tracking-widest mb-1">Média de Frequência</p>
          <h3 className="text-4xl font-black text-amber-400 tracking-tighter">85%</h3>
        </div>
      </div>

      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <div className="relative mb-8">
          <Search size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" />
          <input
            type="text"
            placeholder="Pesquisar por célula ou líder..."
            className="w-full pl-14 pr-6 py-4 bg-gray-50 border-none rounded-2xl outline-none text-sm font-bold"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginatedCells.map(cell => (
            <div key={cell.id} className="bg-gray-50/50 p-8 rounded-[2.5rem] border border-gray-100 hover:bg-white hover:border-blue-200 transition-all group">
              <div className="flex justify-between items-start mb-6">
                <div className="p-4 bg-blue-600 text-white rounded-2xl shadow-lg">
                  <Network size={20} />
                </div>
                <button onClick={() => handleDelete(cell.id, cell.name)} className="p-2 text-gray-300 hover:text-red-600 transition-colors"><Trash2 size={18} /></button>
              </div>
              <h4 className="text-xl font-black text-gray-800 mb-1">{cell.name}</h4>
              <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-8">Líder: {cell.leaderName}</p>

              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-4 text-xs text-gray-500 font-bold"><MapPin size={16} className="text-blue-400" /> {cell.address}</div>
                <div className="flex items-center gap-4 text-xs text-gray-500 font-bold"><Clock size={16} className="text-blue-400" /> {cell.dayOfWeek} às {cell.time}</div>
                <div className="flex items-center gap-4 text-xs text-gray-500 font-bold"><Users size={16} className="text-blue-400" /> Multiplicação Ativa</div>
              </div>

              <button className="w-full py-4 bg-white border-2 border-gray-100 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all shadow-sm">Lançar Relatório</button>
            </div>
          ))}
          {filteredCells.length === 0 && (
            <div className="col-span-full py-20 text-center text-gray-300 font-black uppercase tracking-widest">Nenhum grupo registrado.</div>
          )}
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalRecords={filteredCells.length}
          onPageChange={setCurrentPage}
        />
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-blue-950/80 backdrop-blur-md" onClick={() => setShowModal(false)}></div>
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl relative overflow-hidden animate-in zoom-in">
            <div className="p-8 border-b bg-gray-50/50 flex justify-between items-center">
              <h2 className="text-2xl font-black text-gray-800">Novo Grupo de Crescimento</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-white rounded-full"><X size={24} /></button>
            </div>
            <div className="p-10 space-y-6">
              <input type="text" placeholder="Nome do Grupo" className="w-full p-4 bg-gray-50 rounded-2xl outline-none font-bold text-sm" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
              <div className="grid grid-cols-2 gap-4">
                <input type="text" placeholder="Nome do Líder" className="w-full p-4 bg-gray-50 rounded-2xl outline-none font-bold text-sm" value={formData.leaderName} onChange={e => setFormData({ ...formData, leaderName: e.target.value })} />
                <input type="text" placeholder="Anfitrião" className="w-full p-4 bg-gray-50 rounded-2xl outline-none font-bold text-sm" value={formData.hostName} onChange={e => setFormData({ ...formData, hostName: e.target.value })} />
              </div>
              <input type="text" placeholder="Endereço Completo" className="w-full p-4 bg-gray-50 rounded-2xl outline-none font-bold text-sm" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} />
              <div className="grid grid-cols-2 gap-4">
                <select className="w-full p-4 bg-gray-50 rounded-2xl outline-none font-bold text-sm" value={formData.dayOfWeek} onChange={e => setFormData({ ...formData, dayOfWeek: e.target.value })}>
                  <option>Segunda-feira</option><option>Terça-feira</option><option>Quarta-feira</option><option>Quinta-feira</option><option>Sexta-feira</option><option>Sábado</option>
                </select>
                <input type="time" className="w-full p-4 bg-gray-50 rounded-2xl outline-none font-bold text-sm" value={formData.time} onChange={e => setFormData({ ...formData, time: e.target.value })} />
              </div>
            </div>
            <div className="p-8 bg-gray-50 border-t flex gap-4">
              <button onClick={() => setShowModal(false)} className="flex-1 py-4 text-[10px] font-black uppercase text-gray-400">Cancelar</button>
              <button onClick={handleSave} className="flex-1 py-4 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase shadow-xl flex items-center justify-center gap-2"><Save size={18} /> Salvar Grupo</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cells;
