
import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  ShieldCheck, User, Globe, Clock, Monitor,
  Search, Filter, ShieldAlert, CheckCircle2,
  AlertTriangle, Download, ChevronRight,
  Shield, Key, DollarSign, Users, Package, Settings,
  Eye, Info, Database, FileJson, List, LayoutList,
  ArrowDownToLine, RefreshCw, X, Send, AlertOctagon,
  Terminal, ShieldQuestion, Activity, Fingerprint,
  Network, FileText, LayoutGrid, Library, GraduationCap,
  ChevronLeft
} from 'lucide-react';
import SEO from '../components/Common/SEO';
import { AuditCategory, AuditLog, AuditSeverity } from '../core/types';
import Pagination from '../components/Pagination';
import AvatarPlaceholder from '../components/AvatarPlaceholder';

const CATEGORY_MAP: Record<AuditCategory, { label: string, color: string, icon: any }> = {
  LOGIN: { label: 'Acessos', color: 'bg-green-500', icon: Key },
  MEMBERS: { label: 'Membros', color: 'bg-blue-500', icon: Users },
  FINANCE: { label: 'Financeiro', color: 'bg-purple-500', icon: DollarSign },
  SECURITY: { label: 'Segurança', color: 'bg-red-600', icon: ShieldAlert },
  EXPORT: { label: 'Exportação', color: 'bg-amber-500', icon: Download },
  SYSTEM: { label: 'Sistema', color: 'bg-gray-600', icon: Settings },
  MARRIAGE: { label: 'Casamentos', color: 'bg-pink-500', icon: Shield },
  ASSETS: { label: 'Patrimônio', color: 'bg-indigo-500', icon: Package },
  CELLS: { label: 'Células', color: 'bg-orange-500', icon: Network },
  DOCUMENTS: { label: 'Documentos', color: 'bg-cyan-500', icon: FileText },
  DEPARTMENTS: { label: 'Departamentos', color: 'bg-sky-500', icon: LayoutGrid },
  LIBRARY: { label: 'Biblioteca', color: 'bg-teal-500', icon: Library },
  SCHOOL: { label: 'EBD', color: 'bg-emerald-600', icon: GraduationCap }
};

const SEVERITY_COLORS: Record<AuditSeverity, string> = {
  LOW: 'text-gray-400 bg-gray-50 border-gray-100',
  MEDIUM: 'text-amber-600 bg-amber-50 border-amber-100',
  HIGH: 'text-red-600 bg-red-50 border-red-100'
};

const AuditLogs: React.FC = () => {
  const { state, dispatch } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<AuditCategory | 'ALL'>('ALL');
  const [viewMode, setViewMode] = useState<'timeline' | 'table'>('table');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [showInconsistencyModal, setShowInconsistencyModal] = useState(false);
  const [inconsistencyNote, setInconsistencyNote] = useState('');
  const [sessionFilter, setSessionFilter] = useState<{ userId: string, ip: string } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const filteredLogs = useMemo(() => {
    return state.logs.filter(log => {
      if (sessionFilter) {
        return log.userId === sessionFilter.userId && log.ip === sessionFilter.ip;
      }
      const matchesSearch =
        log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.target.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.ip.includes(searchTerm);
      const matchesCategory = selectedCategory === 'ALL' || log.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [state.logs, searchTerm, selectedCategory, sessionFilter]);

  const totalPages = Math.ceil(filteredLogs.length / ITEMS_PER_PAGE);
  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory, sessionFilter]);

  useEffect(() => {
    if (filteredLogs.length > 0) {
      if (!selectedLog || !filteredLogs.some(l => l.id === selectedLog.id)) {
        setSelectedLog(filteredLogs[0]);
      }
    }
  }, [filteredLogs]);

  const handleSystemBackup = () => {
    const backupPayload = {
      timestamp: new Date().toISOString(),
      metadata: { source: `${state.churchSettings?.nomeIgreja || 'Eclesia Master'} SOC Console`, version: "3.0" },
      data: state
    };
    const blob = new Blob([JSON.stringify(backupPayload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${state.churchSettings?.nomeIgreja || 'Eclesia Master'}_Backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    dispatch({ type: 'ADD_NOTIFICATION', payload: { message: 'Snapshot de segurança gerado!', type: 'success' } });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <SEO title="Logs de Auditoria" description="Histórico de ações e alterações realizadas no sistema." />
      <div className="bg-gradient-to-br from-[#0f172a] to-[#1e3a8a] p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full -mr-48 -mt-48 blur-3xl"></div>
        <div className="relative z-10 flex flex-col xl:flex-row items-center justify-between gap-10">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-amber-400 text-blue-900 rounded-3xl flex items-center justify-center shadow-2xl shadow-amber-400/20">
              <ShieldCheck size={40} />
            </div>
            <div>
              <h1 className="text-4xl font-black tracking-tight mb-2">SOC - Centro de Segurança</h1>
              <p className="text-blue-100 font-medium opacity-80 max-w-xl leading-relaxed">Monitoramento forense em tempo real.</p>
            </div>
          </div>
          <button onClick={handleSystemBackup} className="bg-white/10 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/10 hover:bg-white/20 transition-all flex items-center gap-3">
            <Database size={20} className="text-amber-400" />
            <span className="text-xs font-bold">Exportar Backup Forense</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-1 space-y-6">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="Pesquisar registros..." className="w-full pl-11 pr-4 py-3 bg-gray-50 border-none rounded-2xl outline-none text-sm font-medium" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
            <select className="bg-gray-50 px-4 py-3 rounded-2xl text-xs font-black uppercase" value={selectedCategory} onChange={e => setSelectedCategory(e.target.value as any)}>
              <option value="ALL">Todas Categorias</option>
              {Object.entries(CATEGORY_MAP).map(([val, info]) => <option key={val} value={val}>{info.label}</option>)}
            </select>
          </div>

          <div className="bg-white rounded-[3rem] shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="px-8 py-5 text-[10px] font-black uppercase text-gray-400 tracking-widest text-left">Data e Hora</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase text-gray-400 tracking-widest">Ação</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase text-gray-400 tracking-widest text-center">Risco</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paginatedLogs.map(log => (
                  <tr key={log.id} className="hover:bg-blue-50/30 cursor-pointer" onClick={() => setSelectedLog(log)}>
                    <td className="px-8 py-5">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-gray-800">{new Date(log.timestamp).toLocaleDateString('pt-AO', { timeZone: 'Africa/Luanda' })}</span>
                        <span className="text-[9px] text-gray-400 font-bold">{new Date(log.timestamp).toLocaleTimeString('pt-AO', { timeZone: 'Africa/Luanda' })}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className="text-xs font-black text-gray-800">{log.action}</span>
                      <p className="text-[9px] text-gray-400 uppercase font-black">{log.category}</p>
                    </td>
                    <td className="px-8 py-5 text-center">
                      <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase border ${SEVERITY_COLORS[log.severity]}`}>{log.severity}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalRecords={filteredLogs.length}
              onPageChange={setCurrentPage}
            />
          </div>
        </div>

        <div className="lg:w-[400px] shrink-0">
          <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-gray-100 sticky top-24">
            {selectedLog ? (
              <div className="space-y-8">
                <div className="bg-gray-50/50 p-8 rounded-[2.5rem] border border-gray-100 text-center">
                  <div className="relative inline-block mb-4">
                    <AvatarPlaceholder
                      name={selectedLog.userName}
                      id={selectedLog.userId}
                      photoUrl={selectedLog.userPhotoUrl}
                      className="w-20 h-20 rounded-2xl object-cover shadow-lg mx-auto"
                    />
                    <div className={`absolute -bottom-2 -right-2 w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-lg ${CATEGORY_MAP[selectedLog.category].color}`}>
                      {React.createElement(CATEGORY_MAP[selectedLog.category].icon, { size: 14 })}
                    </div>
                  </div>
                  <h4 className="text-xl font-black text-gray-800 leading-tight mb-2">{selectedLog.action}</h4>
                  <div className="flex flex-col gap-1 items-center">
                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Executor: {selectedLog.userName}</p>
                    {selectedLog.userEmail && <p className="text-[9px] text-gray-500 font-medium">{selectedLog.userEmail}</p>}
                    {selectedLog.userPhone && selectedLog.userPhone !== 'N/A' && <p className="text-[9px] text-gray-500 font-medium">{selectedLog.userPhone}</p>}
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-2xl">
                    <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Origem IP</p>
                    <p className="text-sm font-mono font-black text-gray-700">{selectedLog.ip}</p>
                  </div>
                  <div className="bg-[#0f172a] text-blue-100 p-6 rounded-[2rem] text-xs font-mono overflow-auto max-h-[400px]">
                    {(() => {
                      try {
                        const details = JSON.parse(selectedLog.details || '{}');
                        return (
                          <div className="space-y-4">
                            {details.userAgent && (
                              <div className="pb-4 border-b border-white/5">
                                <p className="text-[10px] text-gray-500 uppercase font-black mb-1">User Agent</p>
                                <p className="text-[11px] leading-relaxed break-all">{details.userAgent}</p>
                              </div>
                            )}
                            {details.dadosAnteriores && (
                              <div className="pb-4 border-b border-white/5">
                                <p className="text-[10px] text-red-400 uppercase font-black mb-1">Dados Anteriores</p>
                                <pre className="text-[10px] whitespace-pre-wrap">{JSON.stringify(details.dadosAnteriores, null, 2)}</pre>
                              </div>
                            )}
                            {details.dadosNovos && (
                              <div className="pb-4">
                                <p className="text-[10px] text-green-400 uppercase font-black mb-1">Novos Dados</p>
                                <pre className="text-[10px] whitespace-pre-wrap">{JSON.stringify(details.dadosNovos, null, 2)}</pre>
                              </div>
                            )}
                            {!details.dadosAnteriores && !details.dadosNovos && !details.userAgent && (
                              <p className="text-gray-500 italic">Sem detalhes adicionais</p>
                            )}
                          </div>
                        );
                      } catch (e) {
                        return <span>{selectedLog.details}</span>;
                      }
                    })()}
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-20 text-center text-gray-300 font-black uppercase text-xs tracking-widest">Selecione um evento</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuditLogs;
