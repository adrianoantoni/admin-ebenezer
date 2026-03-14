
import React, { useState, useMemo } from 'react';
import { Users, DollarSign, Calendar as CalendarIcon, Cake, ArrowUpRight, TrendingDown, ChevronDown, CalendarDays } from 'lucide-react';
import { useApp } from '../context/AppContext';
import SEO from '../components/Common/SEO';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import AvatarPlaceholder from '../components/AvatarPlaceholder';

const StatCard = ({ title, value, subValue, icon: Icon, color, isDeficit, onClick, className }: any) => (
  <div
    onClick={onClick}
    className={`bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 flex items-center gap-6 hover:shadow-xl transition-all group border-b-4 ${isDeficit ? 'border-b-red-600' : 'border-b-transparent hover:border-b-blue-600'} ${className || ''}`}
  >
    <div className={`${isDeficit ? 'bg-red-600' : color} w-16 h-16 rounded-2xl text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
      <Icon size={32} />
    </div>
    <div>
      <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{title}</h3>
      <div className="flex items-baseline gap-2">
        <span className={`text-2xl font-black tracking-tighter ${isDeficit ? 'text-red-600' : 'text-gray-800'}`}>{value}</span>
        {subValue && !isDeficit && (
          <span className="text-[10px] font-bold text-green-500 bg-green-50 px-2 py-0.5 rounded-lg flex items-center gap-1">
            <ArrowUpRight size={10} /> {subValue}
          </span>
        )}
        {isDeficit && (
          <span className="text-[9px] font-black text-red-600 bg-red-50 px-2 py-0.5 rounded-lg flex items-center gap-1">
            <TrendingDown size={10} /> DÉFICIT
          </span>
        )}
      </div>
    </div>
  </div>
);

const Dashboard: React.FC = () => {
  const { state } = useApp();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [showBirthdayModal, setShowBirthdayModal] = useState(false);

  // Buscar anos disponíveis do backend
  React.useEffect(() => {
    const fetchYears = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/fiscal-years', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const anos = await res.json();
          const anosList = anos.map((a: any) => a.ano);
          setAvailableYears(anosList);

          // Buscar ano ativo para definir como inicial
          const activeRes = await fetch('/api/fiscal-years/active', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (activeRes.ok) {
            const anoAtivo = await activeRes.json();
            setSelectedYear(anoAtivo.ano);
          } else if (anosList.length > 0) {
            // Fallback para o ano mais recente se não houver ativo
            setSelectedYear(Math.max(...anosList));
          }
        }
      } catch (error) {
        console.error('Erro ao buscar anos fiscais:', error);
      }
    };
    fetchYears();
  }, []);

  const currentMonth = new Date().getMonth() + 1;
  const isCurrentYear = selectedYear === new Date().getFullYear();

  // Filtrar transações apenas do ano selecionado
  const yearTransactions = useMemo(() => {
    return state.transactions.filter(t => t.year === selectedYear);
  }, [state.transactions, selectedYear]);

  // KPI: Receita Mensal
  const monthlyRevenue = useMemo(() => {
    const monthToQuery = isCurrentYear ? currentMonth : 12;
    return yearTransactions
      .filter(t => t.month === monthToQuery && (t.type === 'TITHES' || t.type === 'OFFERING'))
      .filter(t => !t.status || t.status === 'PAGO')
      .reduce((acc, t) => acc + t.amount, 0);
  }, [yearTransactions, currentMonth, isCurrentYear]);

  const monthlyExpenses = useMemo(() => {
    const monthToQuery = isCurrentYear ? currentMonth : 12;
    return yearTransactions
      .filter(t => t.month === monthToQuery && t.type === 'EXPENSE')
      .reduce((acc, t) => acc + t.amount, 0);
  }, [yearTransactions, currentMonth, isCurrentYear]);

  const isMonthlyDeficit = monthlyExpenses > monthlyRevenue;

  const birthdayMembers = useMemo(() => {
    const todayMonth = new Date().getMonth() + 1;
    return state.members.filter(m => {
      if (!m.birthDate) return false;
      const bMonth = new Date(m.birthDate).getMonth() + 1;
      return bMonth === todayMonth;
    }).sort((a, b) => {
      const dayA = new Date(a.birthDate!).getDate();
      const dayB = new Date(b.birthDate!).getDate();
      return dayA - dayB;
    });
  }, [state.members]);

  const birthdaysCount = birthdayMembers.length;

  const upcomingEventsCount = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    return state.events.filter(e => e.date >= todayStr).length;
  }, [state.events]);

  const barData = useMemo(() => {
    const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    const paidOnly = yearTransactions.filter(t => !t.status || t.status === 'PAGO');
    return months.map((name, index) => {
      const m = index + 1;

      const dizimos = paidOnly
        .filter(t => t.month === m && t.type === 'TITHES')
        .reduce((acc, t) => acc + t.amount, 0);

      const ofertas = paidOnly
        .filter(t => t.month === m && t.type === 'OFFERING')
        .reduce((acc, t) => acc + t.amount, 0);

      return { name, dizimos, ofertas };
    });
  }, [yearTransactions]);

  const pieData = useMemo(() => {
    const types = [
      { name: 'Dízimos', key: 'TITHES', color: '#1e40af' },
      { name: 'Ofertas', key: 'OFFERING', color: '#f59e0b' },
      { name: 'Despesas', key: 'EXPENSE', color: '#ef4444' }
    ];
    const paidOnly = yearTransactions.filter(t => !t.status || t.status === 'PAGO' || t.type === 'EXPENSE');
    return types.map(t => ({
      name: t.name,
      value: paidOnly.filter(tr => tr.type === t.key).reduce((acc, tr) => acc + tr.amount, 0),
      color: t.color
    })).filter(d => d.value > 0);
  }, [yearTransactions]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <SEO title="Painel de Controle" description="Visão geral da gestão da sua igreja." />
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-gray-800 tracking-tight">Painel de Gestão</h1>
          <p className="text-gray-500 font-medium italic">Monitoramento consolidado do exercício de {selectedYear}.</p>
        </div>

        <div className="flex items-center gap-3 bg-white px-6 py-3 rounded-2xl border border-gray-100 shadow-sm">
          <CalendarDays size={18} className="text-blue-600" />
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mr-2">Exercício:</span>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="bg-transparent outline-none text-sm font-black text-gray-800 cursor-pointer"
          >
            {availableYears.length > 0 ? (
              availableYears.map(y => (
                <option key={y} value={y}>{y}</option>
              ))
            ) : (
              <option value={selectedYear}>{selectedYear}</option>
            )}
          </select>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Membros Registrados" value={state.members.length} subValue="+0" icon={Users} color="bg-blue-600" />
        <StatCard
          title={isCurrentYear ? "Saldo do Mês Atual" : "Média Mensal do Ano"}
          value={`${(monthlyRevenue - monthlyExpenses).toLocaleString()} Kz`}
          subValue={isCurrentYear ? "+12%" : undefined}
          icon={DollarSign}
          color="bg-emerald-500"
          isDeficit={isMonthlyDeficit}
        />
        <StatCard title="Atividades em Agenda" value={upcomingEventsCount} icon={CalendarIcon} color="bg-amber-500" />
        <StatCard
          title="Aniversariantes"
          value={birthdaysCount}
          icon={Cake}
          color="bg-purple-500"
          onClick={() => setShowBirthdayModal(true)}
          className="cursor-pointer hover:bg-purple-50 transition-colors"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-10 rounded-[3rem] shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-xl font-black text-gray-800 tracking-tight">Evolução de Arrecadação</h2>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Métricas consolidadas de Jan a Dez de {selectedYear}</p>
            </div>
            <div className="hidden md:flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-700"></div>
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Dízimos</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Ofertas</span>
              </div>
            </div>
          </div>
          {/* Adicionado h-[350px] e min-h-[350px] para garantir espaço para o Recharts */}
          <div className="w-full h-[350px] min-h-[350px] overflow-hidden">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} debounce={200}>
              <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: '900' }}
                  dy={15}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: '900' }}
                  dx={-10}
                />
                <Tooltip
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.15)', padding: '16px' }}
                  itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                />
                <Bar dataKey="dizimos" name="Dízimos" fill="#1e40af" radius={[6, 6, 0, 0]} barSize={24} />
                <Bar dataKey="ofertas" name="Ofertas" fill="#f59e0b" radius={[6, 6, 0, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-gray-100 flex flex-col">
          <h2 className="text-xl font-black text-gray-800 mb-2 tracking-tight">Distribuição Bruta</h2>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-10">Acumulado de {selectedYear}</p>
          <div className="flex-1 h-[300px] min-h-[300px] overflow-hidden">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} debounce={200}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={75}
                  outerRadius={100}
                  paddingAngle={8}
                  dataKey="value"
                  animationBegin={0}
                  animationDuration={1500}
                >
                  {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-8 space-y-4">
            {pieData.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-2xl bg-gray-50/50 border border-transparent hover:border-gray-100 transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: item.color }}></div>
                  <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{item.name}</span>
                </div>
                <span className="text-sm font-black text-gray-800 tracking-tight">{item.value.toLocaleString()} Kz</span>
              </div>
            ))}
            {pieData.length === 0 && (
              <p className="text-center text-xs text-gray-400 italic py-4">Sem movimentações em {selectedYear}</p>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Aniversariantes */}
      {showBirthdayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in" onClick={() => setShowBirthdayModal(false)}></div>
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl relative overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in duration-300">
            <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div>
                <h3 className="text-xl font-black text-gray-800 tracking-tight">Aniversariantes do Mês</h3>
                <p className="text-[10px] font-black text-purple-500 uppercase tracking-widest">Celebrando a Vida</p>
              </div>
              <button
                onClick={() => setShowBirthdayModal(false)}
                className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-colors"
              >
                <span className="font-black text-lg">✕</span>
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              {birthdayMembers.length === 0 ? (
                <div className="text-center py-12">
                  <Cake size={48} className="mx-auto text-gray-200 mb-4" />
                  <p className="text-gray-400 font-bold">Nenhum aniversariante este mês.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {birthdayMembers.map(member => {
                    const day = new Date(member.birthDate!).getDate();
                    const isToday = new Date().getDate() === day && new Date().getMonth() === new Date(member.birthDate!).getMonth();

                    return (
                      <div key={member.id} className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${isToday ? 'bg-purple-50 border-purple-200 shadow-md' : 'bg-white border-gray-100 hover:border-purple-100'}`}>
                        <div className="relative">
                          <AvatarPlaceholder
                            name={member.name}
                            id={member.id}
                            photoUrl={member.photoUrl}
                            className={`w-14 h-14 rounded-2xl object-cover shadow-sm ${isToday ? 'ring-2 ring-purple-500 ring-offset-2' : ''}`}
                          />
                          {isToday && (
                            <div className="absolute -top-2 -right-2 bg-purple-600 text-white text-[8px] font-black px-2 py-1 rounded-lg shadow-sm animate-bounce">
                              HOJE!
                            </div>
                          )}
                        </div>

                        <div className="flex-1">
                          <h4 className="font-black text-gray-800 text-sm">{member.name}</h4>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">{member.role}</p>
                        </div>

                        <div className="flex flex-col items-center justify-center bg-gray-50 w-12 h-12 rounded-xl border border-gray-100">
                          <span className="text-[8px] font-black text-gray-400 uppercase">DIA</span>
                          <span className={`text-lg font-black ${isToday ? 'text-purple-600' : 'text-gray-800'}`}>{day}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-50 bg-gray-50/30">
              <button
                onClick={() => setShowBirthdayModal(false)}
                className="w-full py-4 bg-purple-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-purple-700 transition-all shadow-lg shadow-purple-200"
              >
                Fechar Lista
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
