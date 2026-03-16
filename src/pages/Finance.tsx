import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  Search, CheckCircle2, AlertCircle, Save,
  TrendingDown, Info, Trash2, Edit2, X, MoreVertical, FileText, Download, Printer, MinusCircle, Heart, PlusCircle, ShieldAlert,
  Calendar, DollarSign, Wallet, ArrowRight
} from 'lucide-react';
import SEO from '../components/Common/SEO';
import { Member, Transaction } from '../core/types';
import AvatarPlaceholder from '../components/AvatarPlaceholder';
import Pagination from '../components/Pagination';

const MONTHS = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez"
];

const Finance: React.FC = () => {
  const { state, dispatch } = useApp();
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [fiscalYears, setFiscalYears] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'PAYMENT' | 'OFFERING' | 'EXPENSE' | 'DETAILS'>('PAYMENT');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 8;

  const [formData, setFormData] = useState<Partial<Transaction>>({
    amount: 0,
    method: 'CASH',
    description: '',
    category: 'Geral'
  });

  const stats = useMemo(() => {
    const yearTrans = state.transactions.filter(t => t.year === selectedYear);
    const paidTrans = yearTrans.filter(t => !t.status || t.status === 'PAGO');

    return {
      tithes: paidTrans.filter(t => t.type === 'TITHES').reduce((acc, t) => acc + t.amount, 0),
      offerings: paidTrans.filter(t => t.type === 'OFFERING').reduce((acc, t) => acc + t.amount, 0),
      expenses: yearTrans.filter(t => t.type === 'EXPENSE').reduce((acc, t) => acc + t.amount, 0),
      total: paidTrans.filter(t => t.type === 'TITHES' || t.type === 'OFFERING').reduce((acc, t) => acc + t.amount, 0)
    };
  }, [state.transactions, selectedYear]);

  // Estado para Dívida Global
  const [globalDebt, setGlobalDebt] = useState({ total: 0, count: 0 });

  const fetchFiscalYears = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      console.log('🔵 Frontend: Buscando anos fiscais...');
      const res = await fetch('/api/fiscal-years', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        console.log('✅ Frontend: Anos recebidos:', data);
        if (Array.isArray(data)) {
          setFiscalYears(data);
          const active = data.find((af: any) => af.ativo);
          if (active) {
            setSelectedYear(active.ano);
          } else if (data.length > 0) {
            setSelectedYear(data[0].ano);
          }
        }
      } else {
        console.error('❌ Frontend: Erro na resposta do servidor', res.status);
      }
    } catch (e) {
      console.error('❌ Frontend: Erro ao buscar anos fiscais:', e);
    }
  };

  React.useEffect(() => {
    if (state.auth.isAuthenticated) {
      fetchFiscalYears();
      
      // Auto-inicializar/verificar ano ativo
      const initFiscalYear = async () => {
        try {
          const token = localStorage.getItem('token');
          await fetch('/api/fiscal-years/active', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
        } catch (e) {
          console.error('Erro na auto-inicialização:', e);
        }
      };
      initFiscalYear();
    }
  }, [state.auth.isAuthenticated]);

  React.useEffect(() => {
    const fetchDebt = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/finance/stats/debt', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          console.log('Debt API Response:', data);
          setGlobalDebt({ total: data.totalDebt, count: data.totalDebtors });
        }
      } catch (e) {
        console.error('Erro ao buscar dívida:', e);
      }
    };
    fetchDebt();
    // Atualizar dívida quando houver nova transação? Idealmente sim, mas por simplicidade no load e quando adicionar.
  }, [state.transactions, state.members]);

  // FILTRO: Apenas membros trabalhadores ou com negócio aparecem para pagar dízimo
  const filteredMembers = useMemo(() => {
    return state.members.filter(m => {
      const matchesSearch = searchTerm ? (m.name.toLowerCase().includes(searchTerm.toLowerCase()) || m.bi.includes(searchTerm)) : true;
      const isEligible = (m.expectedTithe || 0) > 0;
      return matchesSearch && isEligible;
    });
  }, [state.members, searchTerm]);

  const totalPages = Math.ceil(filteredMembers.length / ITEMS_PER_PAGE);
  const paginatedMembers = filteredMembers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Reset page when search changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const getTitheStatus = (member: Member, monthNum: number, year: number) => {
    const trans = state.transactions.find(t =>
      t.memberId === member.id &&
      t.month === monthNum &&
      t.year === year &&
      t.type === 'TITHES'
    );
    if (trans) return trans.status || 'PAGO';

    const entryDate = new Date(member.conversionDate || '2000-01-01');
    const checkDate = new Date(year, monthNum - 1, 1);
    const startOfEntryMonth = new Date(entryDate.getFullYear(), entryDate.getMonth(), 1);

    if (checkDate < startOfEntryMonth) return 'ISENTO';

    const today = new Date();
    // Se o ano atual for o selecionado e o mês já passou, é DÍVIDA (se não for PENDENTE explícito no banco)
    const isPast = (year < today.getFullYear()) || (year === today.getFullYear() && monthNum < today.getMonth() + 1);

    if (isPast) return 'DIVIDA';

    // Para meses do ano selecionado que ainda não chegaram (FUTURO dentro do ano)
    return (year === today.getFullYear()) ? 'FUTURO_PENDENTE' : 'FUTURO';
  };

  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  // Helper para buscar transação
  const getTransaction = (memberId: string, month: number, year: number) => {
    return state.transactions.find(t =>
      t.memberId === memberId &&
      t.month === month &&
      t.year === year &&
      t.memberId === memberId &&
      t.month === month &&
      t.year === year &&
      (t.type === 'TITHES' || (t as any).status === 'PENDENTE')
    );
  };

  const handleMonthClick = (member: Member, monthIdx: number) => {
    const monthNum = monthIdx + 1;

    // 1. Verificar se já existe um lançamento
    const existingTrans = getTransaction(member.id, monthNum, selectedYear);

    if (existingTrans) {
      if ((existingTrans as any).status === 'PAGO' || !existingTrans.status) {
        // Se já está pago -> Abrir DETALHES para Editar/Anular
        setSelectedMember(member);
        setSelectedTransaction(existingTrans);
        setModalType('DETAILS');
        setFormData({
          amount: existingTrans.amount,
          method: existingTrans.method,
          description: existingTrans.description,
          category: existingTrans.category
        });
        setShowModal(true);
        return;
      }

      // Se está PENDENTE -> Abrir modal de recebimento PARA LIQUIDAR O PENDENTE
      setSelectedMember(member);
      setSelectedMonth(monthNum);
      setSelectedTransaction(existingTrans); // Guardar para saber que é um update do pendente
      setModalType('PAYMENT');
      setIsAnonymous(false);
      setFormData({
        amount: existingTrans.amount || member.expectedTithe || 0,
        method: existingTrans.method || 'CASH',
        description: existingTrans.description || `Dízimo Ministerial - ${MONTHS[monthIdx]} / ${selectedYear}`,
        category: existingTrans.category || 'Dízimo'
      });
      setShowModal(true);
      return;
    }

    // 2. REGRA DE OURO: Bloqueio de meses anteriores não pagos
    // Verifica estritamente se há meses anteriores pendentes no ano atual
    for (let i = 0; i < monthIdx; i++) {
      const checkMonth = i + 1;
      const status = getTitheStatus(member, checkMonth, selectedYear);

      // Se o mês anterior não estiver PAGO E não for ISENTO (antes da entrada), bloqueia
      // Nota: Se for ISENTO, podemos pular. Se for DIVIDA ou PENDENTE, bloqueia.
      if (status === 'DIVIDA' || status === 'PENDENTE') {
        dispatch({
          type: 'ADD_NOTIFICATION',
          payload: {
            message: `BLOQUEIO: O mês de ${MONTHS[i]} está em aberto. A cronologia é obrigatória.`,
            type: 'error'
          }
        });
        return;
      }
    }

    // Abrir modal de recebimento se passar na regra
    setSelectedMember(member);
    setSelectedMonth(monthNum);
    setModalType('PAYMENT');
    setIsAnonymous(false);
    setFormData({
      amount: member.expectedTithe || 0,
      method: 'CASH',
      description: `Dízimo Ministerial - ${MONTHS[monthIdx]} / ${selectedYear}`,
      category: 'Dízimo'
    });
    setShowModal(true);
  };

  const handleDelete = async () => {
    if (!selectedTransaction) return;
    if (!confirm('Tem certeza que deseja ANULAR este lançamento? A cronologia pode ser afetada.')) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/finance/tithes/${selectedTransaction.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Erro ao anular');
      }

      if (data.reverted) {
        dispatch({ type: 'UPDATE_TRANSACTION', payload: data.reverted });
      } else {
        dispatch({ type: 'DELETE_TRANSACTION', payload: selectedTransaction.id });
      }

      dispatch({ type: 'ADD_NOTIFICATION', payload: { message: data.message || 'Lançamento anulado com sucesso.', type: 'success' } });
      setShowModal(false);
    } catch (e: any) {
      console.error('Error deleting transaction:', e);
      const errorMessage = e.response?.data?.message || e.message || 'Erro ao anular lançamento';
      dispatch({ type: 'ADD_NOTIFICATION', payload: { message: errorMessage, type: 'error' } });
    }
  };

  const handleUpdate = async () => {
    if (!selectedTransaction) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/finance/tithes/${selectedTransaction.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: formData.amount,
          method: formData.method,
          description: formData.description,
          category: formData.category
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Erro ao atualizar');
      }

      // Atualizar estado local
      const updated = await res.json(); // Se o backend retornar o obj atualizado
      // Precisamos atualizar o transaction no state global
      // Por simplificação, vamos recarregar ou fazer um dispatch de UPDATE
      // Vamos fazer um dispatch simples de remoção e adicão rapida ou criar TYPE UPDATE
      // Como não temos UPDATE, removemos e adicionamos

      // Mock update no frontend
      const newTrans = { ...selectedTransaction, amount: formData.amount || 0, method: formData.method as any, description: formData.description || '', category: formData.category || 'Geral' };
      dispatch({ type: 'UPDATE_TRANSACTION', payload: newTrans });

      dispatch({ type: 'ADD_NOTIFICATION', payload: { message: 'Lançamento atualizado!', type: 'success' } });
      setShowModal(false);
    } catch (e: any) {
      console.error(e);
      dispatch({ type: 'ADD_NOTIFICATION', payload: { message: e.message || 'Erro ao atualizar.', type: 'error' } });
    }
  };

  const handleLaunch = async () => {
    if (modalType === 'DETAILS') {
      // Se estiver em modo detalhes e clicou em salvar (edição)
      handleUpdate();
      return;
    }

    if ((formData.amount || 0) <= 0) {
      dispatch({ type: 'ADD_NOTIFICATION', payload: { message: 'O valor deve ser maior que zero!', type: 'error' } });
      return;
    }

    const token = localStorage.getItem('token');
    const endpoint = modalType === 'PAYMENT' ? '/api/finance/tithes' :
      modalType === 'OFFERING' ? '/api/finance/offerings' : '/api/finance/expenses';

    const payload = {
      ...formData,
      date: new Date().toISOString().split('T')[0],
      memberId: isAnonymous || modalType === 'EXPENSE' ? undefined : selectedMember?.id,
      month: modalType === 'PAYMENT' ? selectedMonth : (new Date().getMonth() + 1),
      year: selectedYear,
      // Enviar data de referência explícita (YYYY-MM-DD) para evitar timezone shift (Jan 1 -> Dec 31)
      referenceDate: modalType === 'PAYMENT'
        ? `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`
        : undefined
    };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Erro ao registrar transação');
      }

      const savedTrans = await response.json();

      // Mapear para o formato do frontend para o dispatch
      // O backend retorna idDizimo, idOferta ou idSaida. Precisamos normalizar para 'id'.
      const actualId = savedTrans.idDizimo || savedTrans.idOferta || savedTrans.idSaida || savedTrans.id;

      const newTrans: Transaction = {
        id: actualId,
        date: payload.date,
        month: payload.month,
        year: payload.year,
        amount: formData.amount || 0,
        type: modalType === 'PAYMENT' ? 'TITHES' : modalType === 'OFFERING' ? 'OFFERING' : 'EXPENSE',
        method: formData.method as any || 'CASH',
        description: formData.description || '',
        memberId: payload.memberId,
        memberName: isAnonymous ? 'Anônimo' : modalType === 'EXPENSE' ? 'Saída: ' + (formData.category || 'Geral') : (selectedMember?.name || 'Contribuinte'),
        category: formData.category || 'Geral',
      };

      // Se já existia um pendente com este ID, atualiza. Caso contrário, adiciona.
      const exists = state.transactions.some(t => t.id === newTrans.id);
      if (exists) {
        dispatch({ type: 'UPDATE_TRANSACTION', payload: newTrans });
      } else {
        dispatch({ type: 'ADD_TRANSACTION', payload: newTrans });
      }
      dispatch({ type: 'ADD_NOTIFICATION', payload: { message: 'Lançamento financeiro realizado com sucesso!', type: 'success' } });
      setShowModal(false);
    } catch (error: any) {
      console.error('Error launching transaction:', error);
      dispatch({ type: 'ADD_NOTIFICATION', payload: { message: error.message || 'Erro ao conectar com o servidor', type: 'error' } });
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <SEO title="Financeiro" description="Controle de dízimos, ofertas e saídas financeiras." />
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-gray-800 tracking-tight">Tesouraria Ministerial</h1>
          <p className="text-gray-500 font-medium italic">Controle financeiro estrito e conformidade cronológica.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl shadow-sm border border-gray-100">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Ano Fiscal:</span>
            <Calendar size={18} className="text-blue-600" />
            <select
              value={selectedYear}
              onChange={async (e) => {
                const newYear = Number(e.target.value);
                const af = fiscalYears.find(f => f.ano === newYear);
                if (af && !af.ativo) {
                  if (confirm(`Deseja ativar o Ano Fiscal de ${newYear}?`)) {
                    try {
                      const token = localStorage.getItem('token');
                      const res = await fetch(`/api/fiscal-years/${af.idAno}/activate`, {
                        method: 'PUT',
                        headers: { 'Authorization': `Bearer ${token}` }
                      });
                      if (res.ok) {
                        await fetchFiscalYears();
                        dispatch({ type: 'ADD_NOTIFICATION', payload: { message: `Ano Fiscal ${newYear} ativado!`, type: 'success' } });
                      }
                    } catch (err) {
                      console.error(err);
                    }
                  }
                }
                setSelectedYear(newYear);
              }}
              className="text-sm font-black bg-transparent outline-none cursor-pointer"
            >
              {fiscalYears.length > 0 ? (
                fiscalYears.map(af => (
                  <option key={af.idAno} value={af.ano}>
                    {af.ano} {af.ativo ? '(Ativo)' : ''}
                  </option>
                ))
              ) : (
                <option value={selectedYear}>{selectedYear} (Nenhum cadastrado)</option>
              )}
            </select>
          </div>

          <button
            onClick={async () => {
              const currentYear = new Date().getFullYear();
              const lastYear = fiscalYears.length > 0 ? Math.max(...fiscalYears.map(f => f.ano)) : (currentYear - 1);
              const nextYear = lastYear + 1;
              if (confirm(`Deseja iniciar o Ano Fiscal de ${nextYear}?`)) {
                try {
                  const token = localStorage.getItem('token');
                  const res = await fetch('/api/fiscal-years', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ ano: nextYear, ativar: true })
                  });
                  if (res.ok) {
                    await fetchFiscalYears();
                    dispatch({ type: 'ADD_NOTIFICATION', payload: { message: `Ano Fiscal ${nextYear} criado e ativado!`, type: 'success' } });
                  }
                } catch (err) {
                  console.error(err);
                }
              }
            }}
            className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl transition-all active:scale-95"
            title="Iniciar Novo Ano Fiscal"
          >
            <PlusCircle size={20} />
          </button>
          <button
            onClick={async () => {
              if (!confirm(`Deseja gerar o carnê de dízimos para TODOS os membros ativos em ${selectedYear}? Isso criará registros pendentes.`)) return;
              try {
                const token = localStorage.getItem('token');
                const res = await fetch('/api/finance/tithes/generate', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                  body: JSON.stringify({ year: selectedYear })
                });
                const data = await res.json();
                if (res.ok) {
                  dispatch({ type: 'ADD_NOTIFICATION', payload: { message: data.message, type: 'success' } });
                  // Force reload transactions logic here if needed, or user manually reloads
                  window.location.reload();
                } else {
                  throw new Error(data.message);
                }
              } catch (e: any) {
                dispatch({ type: 'ADD_NOTIFICATION', payload: { message: e.message || 'Erro', type: 'error' } });
              }
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all shadow-xl flex items-center gap-2"
          >
            <Calendar size={18} /> Gerar Carnê {selectedYear}
          </button>
          <button
            onClick={() => { setModalType('EXPENSE'); setShowModal(true); setFormData({ amount: 0, method: 'CASH', category: 'Manutenção' }); }}
            className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all shadow-xl flex items-center gap-2"
          >
            <MinusCircle size={18} /> Registar Saída
          </button>
          <button
            onClick={() => { setSelectedMember(null); setIsAnonymous(true); setModalType('OFFERING'); setShowModal(true); setFormData({ amount: 0, method: 'CASH' }); }}
            className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all shadow-xl flex items-center gap-2"
          >
            <Heart size={18} /> Registar Oferta
          </button>
        </div>
      </header>

      {/* Cards de Saldo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Entrada Dízimos</p>
          <h3 className="text-2xl font-black text-blue-600 tracking-tighter">{stats.tithes.toLocaleString()} Kz</h3>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Entrada Ofertas</p>
          <h3 className="text-2xl font-black text-purple-600 tracking-tighter">{stats.offerings.toLocaleString()} Kz</h3>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Saída de Caixa</p>
          <h3 className="text-2xl font-black text-red-600 tracking-tighter">{stats.expenses.toLocaleString()} Kz</h3>
        </div>
        <div className="bg-[#1e3a8a] p-8 rounded-[2.5rem] shadow-xl text-white">
          <p className="text-[10px] font-black text-blue-200 uppercase tracking-widest mb-1">Saldo Consolidado</p>
          <h3 className="text-2xl font-black text-amber-400 tracking-tighter">{(stats.total - stats.expenses).toLocaleString()} Kz</h3>
        </div>
        <div className="bg-red-50 p-8 rounded-[2.5rem] border border-red-100 shadow-sm relative overflow-hidden group">
          <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <ShieldAlert size={64} className="text-red-900" />
          </div>
          <p className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-1">Dívida Global Estimada</p>
          <h3 className="text-2xl font-black text-red-600 tracking-tighter">{globalDebt.total.toLocaleString()} Kz</h3>
          <p className="text-[9px] font-bold text-red-400 mt-1">{globalDebt.count} membros em atraso</p>
        </div>
      </div>

      <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm space-y-8">
        <div className="relative">
          <Search size={22} className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300" />
          <input
            type="text"
            placeholder="Pesquisar membros pagadores (Membros com compromisso financeiro)..."
            className="w-full pl-16 pr-8 py-5 bg-gray-50 border-2 border-transparent focus:border-blue-600 focus:bg-white rounded-[2rem] outline-none text-sm font-bold transition-all shadow-inner"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="space-y-4">
          {paginatedMembers.map(member => (
            <div key={member.id} className="p-6 bg-gray-50/50 rounded-[2.5rem] border border-gray-100 flex flex-col xl:flex-row xl:items-center justify-between gap-6 hover:bg-white transition-all group">
              <div className="flex items-center gap-4 min-w-[320px]">
                <AvatarPlaceholder
                  name={member.name}
                  id={member.id}
                  photoUrl={member.photoUrl}
                  className="w-14 h-14 rounded-2xl object-cover shadow-sm border-2 border-white"
                />
                <div>
                  <h4 className="text-sm font-black text-gray-800">{member.name}</h4>
                  <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest">
                    Compromisso: {member.expectedTithe?.toLocaleString() || '0'} Kz • {member.employmentStatus?.replace('_', ' ')}
                  </p>
                </div>
                {/* Botão de Gerar Próximo Ano Individual */}
                <button
                  onClick={async (e) => {
                    e.stopPropagation();
                    // Verificar se o ano atual está 100% pago
                    const allPaid = MONTHS.every((_, i) => {
                      const s = getTitheStatus(member, i + 1, selectedYear);
                      return s === 'PAGO' || s === 'ISENTO';
                    });

                    if (!allPaid) {
                      alert(`Para gerar o carnê de ${selectedYear + 1}, o membro precisa quitar todas as pendências de ${selectedYear}.`);
                      return;
                    }

                    if (!confirm(`Gerar carnê de ${selectedYear + 1} para ${member.name}?`)) return;

                    try {
                      const token = localStorage.getItem('token');
                      const res = await fetch('/api/finance/tithes/generate-member', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                        body: JSON.stringify({ year: selectedYear + 1, memberId: member.id })
                      });

                      if (res.ok) {
                        dispatch({ type: 'ADD_NOTIFICATION', payload: { message: `Carnê de ${selectedYear + 1} gerado para ${member.name}!`, type: 'success' } });
                        // Atualizar lista de anos
                        await fetchFiscalYears();
                        setSelectedYear(selectedYear + 1);
                      }
                    } catch (err) {
                      console.error(err);
                      alert('Erro ao gerar carnê individual.');
                    }
                  }}
                  className={`p-2 rounded-full transition-all ${MONTHS.every((_, i) => {
                    const s = getTitheStatus(member, i + 1, selectedYear);
                    return s === 'PAGO' || s === 'ISENTO';
                  })
                    ? 'bg-blue-100 text-blue-600 hover:bg-blue-200 cursor-pointer'
                    : 'bg-gray-100 text-gray-300 cursor-not-allowed'
                    }`}
                  title="Gerar Carnê do Próximo Ano (Requer Quitação do Atual)"
                >
                  <ArrowRight size={16} />
                </button>
              </div>
              <div className="flex-1 grid grid-cols-4 md:grid-cols-6 xl:grid-cols-12 gap-1.5">
                {MONTHS.map((name, idx) => {
                  const status = getTitheStatus(member, idx + 1, selectedYear);
                  return (
                    <button
                      key={idx}
                      onClick={() => handleMonthClick(member, idx)}
                      className={`h-12 rounded-xl flex flex-col items-center justify-center border-2 active:scale-95 transition-all shadow-sm ${status === 'PAGO' ? 'bg-emerald-600 border-emerald-700 text-white' :
                        status === 'PENDENTE' ? 'bg-amber-100 border-amber-200 text-amber-600' :
                          status === 'DIVIDA' ? 'bg-red-50 border-red-100 text-red-400' :
                            status === 'FUTURO_PENDENTE' ? 'bg-gray-50 border-gray-100 text-gray-300' :
                              status === 'ISENTO' ? 'bg-gray-100 border-gray-200 text-gray-300' : 'bg-white border-gray-50 text-gray-200'}`}
                    >
                      <span className="text-[9px] font-black uppercase tracking-tighter">{name}</span>
                      {status === 'PAGO' ? <CheckCircle2 size={8} className="mt-0.5" /> : status === 'DIVIDA' ? <ShieldAlert size={8} className="mt-0.5" /> : status === 'PENDENTE' ? <AlertCircle size={8} className="mt-0.5" /> : null}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {filteredMembers.length === 0 && (
            <div className="text-center py-20 flex flex-col items-center">
              <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                <Wallet size={48} className="text-gray-300" />
              </div>
              <h3 className="text-xl font-black text-gray-800 mb-2">Nenhum Dizimista Encontrado</h3>
              <p className="text-gray-500 font-medium max-w-md mx-auto">
                Não há membros cadastrados com situação "Trabalhador" ou "Negócio Próprio" que correspondam à sua pesquisa.
              </p>
            </div>
          )}
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalRecords={filteredMembers.length}
          onPageChange={setCurrentPage}
        />
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-blue-950/80 backdrop-blur-md" onClick={() => setShowModal(false)}></div>
          <div className="bg-white w-full max-w-lg rounded-[3.5rem] shadow-2xl relative overflow-hidden flex flex-col animate-in zoom-in max-h-[90vh]">
            <div className={`p-8 border-b ${modalType === 'PAYMENT' || modalType === 'DETAILS' ? 'bg-emerald-50' : modalType === 'EXPENSE' ? 'bg-red-50' : 'bg-purple-50'}`}>
              <div className="flex items-center gap-4">
                <div className={`p-4 rounded-2xl text-white ${modalType === 'PAYMENT' || modalType === 'DETAILS' ? 'bg-emerald-600' : modalType === 'EXPENSE' ? 'bg-red-600' : 'bg-purple-600'}`}>
                  {modalType === 'PAYMENT' ? <Wallet size={24} /> : modalType === 'EXPENSE' ? <MinusCircle size={24} /> : modalType === 'DETAILS' ? <CheckCircle2 size={24} /> : <Heart size={24} />}
                </div>
                <div>
                  <h2 className="text-2xl font-black text-gray-800">
                    {modalType === 'PAYMENT' ? 'Receber Dízimo' : modalType === 'EXPENSE' ? 'Registar Saída' : modalType === 'DETAILS' ? 'Detalhes do Lançamento' : 'Lançar Oferta'}
                  </h2>
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                    {!isAnonymous && selectedMember ? selectedMember.name : 'Operação Ministerial'}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-8 space-y-6 overflow-y-auto">
              {modalType === 'DETAILS' && (selectedTransaction?.status === 'PAGO' || !selectedTransaction?.status) && (
                <div className="mb-4 p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                  <p className="text-xs font-bold text-emerald-800 mb-1">STATUS: LIQUIDADO ✅</p>
                  <p className="text-[10px] text-emerald-600">Este mês já consta como pago no sistema. Você pode corrigir valores ou anular o lançamento caso tenha sido um erro.</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Valor (Kz)</label>
                  <input
                    type="number"
                    value={formData.amount}
                    onChange={e => setFormData({ ...formData, amount: Number(e.target.value) })}
                    disabled={modalType === 'PAYMENT' || modalType === 'DETAILS'}
                    className={`w-full p-4 rounded-2xl outline-none text-xl font-black text-blue-900 border-2 border-transparent transition-all ${modalType === 'PAYMENT' || modalType === 'DETAILS' ? 'bg-gray-100 opacity-70 border-gray-200 cursor-not-allowed shadow-inner' : 'bg-gray-50 focus:border-blue-600'}`}
                  />
                  {modalType === 'PAYMENT' && <p className="text-[8px] font-black text-blue-600 uppercase mt-1 ml-2 tracking-tighter">Valor fixo ministerial bloqueado.</p>}
                  {modalType === 'DETAILS' && <p className="text-[8px] font-black text-amber-600 uppercase mt-1 ml-2 tracking-tighter">Lançamento consolidado. Valor não editável.</p>}
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Método</label>
                  <select value={formData.method} onChange={e => setFormData({ ...formData, method: e.target.value as any })} className="w-full p-4 bg-gray-50 rounded-2xl outline-none font-bold text-sm">
                    <option value="CASH">Dinheiro Físico</option>
                    <option value="PIX">TPA / Multicaixa</option>
                    <option value="TRANSFER">Transferência Bancária</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Categoria</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                  disabled={modalType === 'DETAILS'}
                  className={`w-full p-4 rounded-2xl outline-none font-bold text-sm ${modalType === 'DETAILS' ? 'bg-gray-100 opacity-70 cursor-not-allowed' : 'bg-gray-50'}`}
                  placeholder={modalType === 'EXPENSE' ? 'Ex: Manutenção, Construção, Missões...' : 'Geral'}
                />
              </div>
              <textarea
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                disabled={modalType === 'DETAILS'}
                className={`w-full p-4 rounded-2xl outline-none text-sm h-24 resize-none border-2 border-transparent transition-all font-medium ${modalType === 'DETAILS' ? 'bg-gray-100 opacity-70 cursor-not-allowed' : 'bg-gray-50 focus:border-blue-600'}`}
                placeholder="Notas e observações internas..."
              />
            </div>

            <div className="p-8 border-t bg-gray-50 flex gap-4">
              <button onClick={() => setShowModal(false)} className="flex-1 py-4 text-[11px] font-black uppercase text-gray-400 tracking-widest hover:text-gray-600">Fechar</button>

              {modalType === 'DETAILS' ? (
                <>
                  <button
                    id="btn-anular"
                    onClick={handleDelete}
                    className="flex-1 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 active:scale-95 transition-all text-white bg-red-600 hover:bg-red-700"
                  >
                    <X size={18} /> Anular
                  </button>
                </>
              ) : (
                <button onClick={handleLaunch} className={`flex-1 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 active:scale-95 transition-all text-white ${modalType === 'EXPENSE' ? 'bg-red-600' : 'bg-blue-600'}`}>
                  <Save size={18} /> {modalType === 'EXPENSE' ? 'Confirmar Saída' : 'Confirmar Recebimento'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div >
  );
};

export default Finance;
