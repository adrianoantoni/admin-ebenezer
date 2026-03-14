
import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  Package, CheckCircle2, AlertCircle, Plus, Search, DollarSign, Wrench, Calendar,
  Trash2, Edit, Building2, Car, Laptop, Sofa, ChevronRight, X, Save, Tag, Shield, Info, Printer
} from 'lucide-react';
import SEO from '../components/Common/SEO';
import { Asset } from '../core/types';
import Pagination from '../components/Pagination';

const Patrimony: React.FC = () => {
  const { state, dispatch } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(8);

  const [formData, setFormData] = useState<Partial<Asset>>({
    name: '', code: '', category: 'EQUIPMENT',
    purchaseDate: new Date().toISOString().split('T')[0],
    purchaseValue: 0, currentValue: 0, status: 'GOOD'
  });

  const filteredAssets = state.assets.filter(asset => {
    const matchesSearch = asset.name.toLowerCase().includes(searchTerm.toLowerCase()) || asset.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategory === 'ALL' || asset.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const totalPages = Math.ceil(filteredAssets.length / itemsPerPage);
  const paginatedAssets = filteredAssets.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleItemsPerPageChange = (newLimit: number) => {
    setItemsPerPage(newLimit);
    setCurrentPage(1);
  };

  const handleSaveAsset = async () => {
    if (!formData.name || !formData.code) {
      dispatch({ type: 'ADD_NOTIFICATION', payload: { message: 'Preencha o Nome e o Código!', type: 'error' } });
      return;
    }

    const token = localStorage.getItem('token');
    const method = editingAsset ? 'PUT' : 'POST';
    const url = editingAsset ? `/api/inventory/${editingAsset.id}` : '/api/inventory';

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Erro ao salvar ativo');

      const savedAsset = await response.json();

      const assetData: Asset = {
        ...formData,
        id: savedAsset.idPatrimonio || savedAsset.id || (editingAsset ? editingAsset.id : Math.random().toString(36).substr(2, 9))
      } as Asset;

      if (editingAsset) {
        dispatch({ type: 'UPDATE_ASSET', payload: assetData });
        dispatch({ type: 'ADD_NOTIFICATION', payload: { message: 'Ativo atualizado!', type: 'success' } });
      } else {
        dispatch({ type: 'ADD_ASSET', payload: assetData });
        dispatch({ type: 'ADD_NOTIFICATION', payload: { message: 'Bem registrado no inventário!', type: 'success' } });
      }
      setShowAddModal(false);
    } catch (error) {
      console.error('Error saving asset:', error);
      dispatch({ type: 'ADD_NOTIFICATION', payload: { message: 'Erro ao conectar com o servidor', type: 'error' } });
    }
  };

  const handleDeleteAsset = async (id: string, name: string) => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`/api/inventory/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Erro ao remover ativo');

      dispatch({ type: 'DELETE_ASSET', payload: id });
      dispatch({ type: 'ADD_NOTIFICATION', payload: { message: `Ativo "${name}" removido do inventário.`, type: 'info' } });

      dispatch({
        type: 'ADD_LOG', payload: {
          id: `log-pat-${Date.now()}`,
          userId: state.auth.user?.id || 'sys',
          userName: state.auth.user?.name || 'Admin',
          action: 'DELETE_ASSET',
          category: 'ASSETS',
          severity: 'MEDIUM',
          target: name,
          timestamp: new Date().toISOString(),
          ip: '127.0.0.1'
        }
      });
    } catch (error) {
      console.error('Error deleting asset:', error);
      dispatch({ type: 'ADD_NOTIFICATION', payload: { message: 'Erro ao remover ativo no servidor', type: 'error' } });
    }
  };

  const handleOpenAdd = () => {
    setEditingAsset(null);
    setFormData({
      name: '',
      code: `PAT-${Math.floor(1000 + Math.random() * 9000)}`,
      category: 'EQUIPMENT',
      purchaseDate: new Date().toISOString().split('T')[0],
      purchaseValue: 0,
      currentValue: 0,
      status: 'GOOD'
    });
    setShowAddModal(true);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <SEO title="Património" description="Gestão de bens, imóveis e equipamentos da igreja." />
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-gray-800 tracking-tight">Patrimônio</h1>
          <p className="text-gray-500 font-medium italic">Controle total de bens e depreciação ministerial.</p>
        </div>
        <div className="flex gap-4">
          <button onClick={() => window.print()} className="p-4 bg-white border-2 border-gray-100 rounded-2xl text-gray-400 hover:text-blue-600 transition-all shadow-sm"><Printer size={20} /></button>
          <button onClick={handleOpenAdd} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl flex items-center gap-2 transition-all active:scale-95"><Plus size={18} /> Novo Ativo</button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Itens Totais</p>
          <h3 className="text-4xl font-black text-gray-800 tracking-tighter">{state.assets.length}</h3>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Valor Patrimonial</p>
          <h3 className="text-3xl font-black text-blue-600 tracking-tighter">{state.assets.reduce((a, b) => a + b.currentValue, 0).toLocaleString()} Kz</h3>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Manutenção</p>
          <h3 className="text-4xl font-black text-amber-500 tracking-tighter">{state.assets.filter(a => a.status === 'NEED_REPAIR').length}</h3>
        </div>
        <div className="bg-[#1e3a8a] p-8 rounded-[2.5rem] shadow-xl text-white">
          <p className="text-[10px] font-black text-blue-200 uppercase tracking-widest mb-1">Estado Crítico</p>
          <h3 className="text-4xl font-black text-red-400 tracking-tighter">{state.assets.filter(a => a.status === 'DAMAGED').length}</h3>
        </div>
      </div>

      <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center gap-4 mb-8">
          <Search size={18} className="text-gray-300" />
          <input type="text" placeholder="Pesquisar por código ou nome..." className="flex-1 outline-none font-bold text-sm" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
        <div className="space-y-4">
          {paginatedAssets.length === 0 ? (
            <div className="py-20 text-center">
              <Package size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-400 font-black uppercase tracking-widest text-sm">Nenhum ativo encontrado</p>
              <p className="text-gray-300 text-xs mt-2">Adicione bens ao patrimônio clicando em "Novo Ativo"</p>
            </div>
          ) : (
            paginatedAssets.map(asset => (
              <div key={asset.id} className="p-6 bg-gray-50/50 rounded-[2.5rem] border border-gray-100 flex items-center justify-between hover:bg-white hover:border-blue-200 transition-all group">
                <div className="flex items-center gap-6">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm ${asset.status === 'GOOD' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600 animate-pulse'}`}>
                    {asset.category === 'REAL_ESTATE' ? <Building2 size={24} /> : asset.category === 'VEHICLE' ? <Car size={24} /> : <Laptop size={24} />}
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-gray-800">{asset.name}</h4>
                    <div className="flex items-center gap-2">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{asset.code} • {asset.category}</p>
                      {asset.status !== 'GOOD' && <span className="text-[8px] font-black text-red-600 bg-red-50 px-2 py-0.5 rounded uppercase tracking-widest">Requer Atenção</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-8">
                  <div className="text-right"><p className="text-sm font-black text-gray-800">{asset.currentValue.toLocaleString()} Kz</p></div>
                  <div className="flex gap-2">
                    <button onClick={() => { setEditingAsset(asset); setFormData(asset); setShowAddModal(true); }} className="p-3 bg-white border border-gray-100 rounded-xl text-gray-400 hover:text-blue-600 transition-all"><Edit size={16} /></button>
                    <button onClick={() => handleDeleteAsset(asset.id, asset.name)} className="p-3 bg-white border border-gray-100 rounded-xl text-gray-300 hover:text-red-600 transition-all"><Trash2 size={16} /></button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalRecords={filteredAssets.length}
          onPageChange={setCurrentPage}
        />
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-blue-950/80 backdrop-blur-md" onClick={() => setShowAddModal(false)}></div>
          <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl relative animate-in zoom-in overflow-hidden">
            <div className="p-8 border-b bg-gray-50 flex justify-between items-center">
              <h2 className="text-2xl font-black text-gray-800">{editingAsset ? 'Editar Ativo' : 'Registrar Ativo'}</h2>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-white rounded-full transition-colors"><X size={24} /></button>
            </div>
            <div className="p-10 space-y-6">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Nome do Bem</label>
                <input type="text" className="w-full p-4 bg-gray-50 rounded-2xl outline-none font-bold text-sm" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Código Patrimonial</label>
                <input type="text" className="w-full p-4 bg-gray-50 rounded-2xl outline-none font-bold text-sm" value={formData.code} onChange={e => setFormData({ ...formData, code: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Valor Compra</label>
                  <input type="number" className="w-full p-4 bg-gray-50 rounded-2xl outline-none font-bold text-sm" value={formData.purchaseValue} onChange={e => setFormData({ ...formData, purchaseValue: Number(e.target.value) })} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Valor Atual</label>
                  <input type="number" className="w-full p-4 bg-gray-50 rounded-2xl outline-none font-bold text-sm" value={formData.currentValue} onChange={e => setFormData({ ...formData, currentValue: Number(e.target.value) })} />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Estado de Conservação</label>
                <select className="w-full p-4 bg-gray-50 rounded-2xl outline-none font-bold text-sm" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value as any })}>
                  <option value="GOOD">Em Bom Estado</option>
                  <option value="NEED_REPAIR">Necessita Reparo</option>
                  <option value="DAMAGED">Danificado / Obsoleto</option>
                </select>
              </div>
            </div>
            <div className="p-8 border-t bg-gray-50 flex gap-4">
              <button onClick={() => setShowAddModal(false)} className="flex-1 py-4 text-[10px] font-black uppercase text-gray-400">Cancelar</button>
              <button onClick={handleSaveAsset} className="flex-1 py-4 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase shadow-xl flex items-center justify-center gap-2 active:scale-95 transition-all"><Save size={18} /> {editingAsset ? 'Atualizar' : 'Gravar Bem'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Patrimony;
