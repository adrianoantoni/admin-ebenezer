import React, { useState, useRef, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Member } from '../core/types';
import SEO from '../components/Common/SEO';
import {
  Search, Plus, X, Edit, Printer, Award, Camera, Save, User, Trash2, Upload, ChevronLeft, ChevronRight, Filter, Briefcase, DollarSign,
  Mail, Phone, MapPin, Edit2, UserPlus, MoreVertical, Shield, CheckCircle2
} from 'lucide-react';
import AvatarPlaceholder from '../components/AvatarPlaceholder';
import Pagination from '../components/Pagination';
import { jsPDF } from 'jspdf';

const ITEMS_PER_PAGE = 8;

const Members: React.FC = () => {
  const { state, dispatch } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'personal' | 'ecclesial' | 'family'>('personal');

  const [formData, setFormData] = useState<Partial<Member>>({
    name: '', bi: '', gender: 'M', maritalStatus: 'SINGLE',
    naturality: '', province: 'Luanda', profession: '', schooling: '',
    birthDate: '', fatherName: '', motherName: '', conversionDate: '',
    baptismDate: '', role: 'Membro', department: 'Geral', status: 'active',
    expectedTithe: 0, employmentStatus: 'NAO_TRABALHA', email: '', phone: '', address: '', photoUrl: '',
    fatherless: false, motherless: false,
    family: { spouse: '', children: [] }
  });

  const filteredMembers = useMemo(() => {
    return state.members.filter(m =>
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) || m.bi.includes(searchTerm)
    );
  }, [state.members, searchTerm]);

  const totalPages = Math.ceil(filteredMembers.length / ITEMS_PER_PAGE);
  const paginatedMembers = filteredMembers.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        dispatch({ type: 'ADD_NOTIFICATION', payload: { message: 'A foto deve ter menos de 2MB!', type: 'error' } });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, photoUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveMember = async () => {
    if (!formData.name || !formData.bi) {
      dispatch({ type: 'ADD_NOTIFICATION', payload: { message: 'Nome e BI são obrigatórios para o registo!', type: 'error' } });
      return;
    }

    const token = localStorage.getItem('token');
    const method = editingMemberId ? 'PUT' : 'POST';
    const url = editingMemberId ? `/api/members/${editingMemberId}` : '/api/members';

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Erro ao salvar membro');

      const savedMember = await response.json();

      // Mapear de volta para o formato do frontend se o backend retornar formato diferente
      const memberData: Member = {
        ...formData,
        id: savedMember.idMembro || savedMember.id || editingMemberId,
        name: savedMember.nomeCompleto || savedMember.name || formData.name,
      } as Member;

      if (editingMemberId) {
        dispatch({ type: 'UPDATE_MEMBER', payload: memberData });
        dispatch({ type: 'ADD_NOTIFICATION', payload: { message: 'Cadastro ministerial atualizado!', type: 'success' } });
      } else {
        dispatch({ type: 'ADD_MEMBER', payload: memberData });
        dispatch({ type: 'ADD_NOTIFICATION', payload: { message: 'Membro integrado com sucesso!', type: 'success' } });
      }

      setShowAddModal(false);
      resetForm();
    } catch (error) {
      console.error('Error saving member:', error);
      dispatch({ type: 'ADD_NOTIFICATION', payload: { message: 'Erro ao conectar com o servidor', type: 'error' } });
    }
  };

  const handleDeleteMember = async (id: string, name: string) => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`/api/members/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Erro ao remover membro');

      dispatch({ type: 'DELETE_MEMBER', payload: id });
      dispatch({ type: 'ADD_NOTIFICATION', payload: { message: `Membro ${name} removido dos registos ativos.`, type: 'info' } });
      dispatch({
        type: 'ADD_LOG', payload: {
          id: `log-mem-${Date.now()}`,
          userId: state.auth.user?.id || 'sys',
          userName: state.auth.user?.name || 'Admin',
          action: 'DELETE_MEMBER',
          category: 'MEMBERS',
          severity: 'HIGH',
          target: name,
          timestamp: new Date().toISOString(),
          ip: '127.0.0.1'
        }
      });
    } catch (error) {
      console.error('Error deleting member:', error);
      dispatch({ type: 'ADD_NOTIFICATION', payload: { message: 'Erro ao remover membro no servidor', type: 'error' } });
    }
  };

  const handlePrintCategory = (status: Member['employmentStatus'] | 'ALL') => {
    const titleMap: Record<string, string> = {
      'TRABALHADOR': 'Trabalhadores',
      'NEGOCIO': 'Negócio Próprio',
      'DESEMPREGADO': 'Desempregados',
      'NAO_TRABALHA': 'Não Trabalha / Estudantes',
      'ALL': 'Todos os Membros'
    };

    const maritalMap: Record<string, string> = {
      'SINGLE': 'Solteiro(a)',
      'MARRIED': 'Casado(a)',
      'DIVORCED': 'Divorciado(a)',
      'WIDOW': 'Viúvo(a)',
      'CONCUBINAGE': 'Amasseba'
    };

    const schoolingMap: Record<string, string> = {
      'ENSINO_BASE': 'Ensino Base',
      'ENSINO_MEDIO': 'Ensino Médio',
      'LICENCIATURA': 'Licenciatura',
      'MESTRADO': 'Mestrado',
      'DOUTORAMENTO': 'Doutoramento'
    };

    const categoryTitle = titleMap[status || 'ALL'];
    const churchLogo = state.churchSettings?.logo;

    const doc = new jsPDF('l', 'mm', 'a4'); // Landscape orientation
    const churchName = state.churchSettings?.nomeIgreja || 'Eclesia Master';

    const membersToPrint = status === 'ALL'
      ? state.members
      : state.members.filter(m => m.employmentStatus === status);

    // Header
    let currentY = 15;
    
    // Add Logo if exists
    if (churchLogo) {
      try {
        doc.addImage(churchLogo, 'PNG', 10, 8, 35, 35);
      } catch (e) {
        console.error('Error adding logo to PDF:', e);
      }
    }

    doc.setFontSize(18);
    doc.setTextColor(30, 58, 138); // Blue 900
    doc.text(churchName, 148, currentY, { align: 'center' });

    doc.setFontSize(14);
    doc.setTextColor(71, 85, 105); // Slate 600
    doc.text(`Relatório de Membros: ${categoryTitle}`, 148, currentY + 10, { align: 'center' });

    doc.setFontSize(9);
    doc.text(`Gerado em: ${new Date().toLocaleDateString()} às ${new Date().toLocaleTimeString()}`, 148, currentY + 17, { align: 'center' });

    // Table Header
    let y = 45;
    doc.setFillColor(30, 58, 138);
    doc.rect(10, y, 277, 10, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('Nome', 12, y + 7);
    doc.text('BI', 70, y + 7);
    doc.text('Telefone', 100, y + 7);
    doc.text('E-mail', 130, y + 7);
    doc.text('Est. Civil', 175, y + 7);
    doc.text('Habilitações', 200, y + 7);
    doc.text('Situação Prof.', 235, y + 7);
    doc.text('Cargo', 265, y + 7);

    y += 18;
    doc.setTextColor(51, 65, 85);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);

    membersToPrint.forEach((m, index) => {
      if (y > 185) {
        doc.addPage();
        y = 20;
        doc.setFillColor(30, 58, 138);
        doc.rect(10, y - 5, 277, 8, 'F');
        y += 5;
      }

      doc.text(m.name.substring(0, 35), 12, y);
      doc.text(m.bi || '---', 70, y);
      doc.text(m.phone || '---', 100, y);
      doc.text((m.email || '---').substring(0, 25), 130, y);
      doc.text(maritalMap[m.maritalStatus as string] || '---', 175, y);
      doc.text(schoolingMap[m.schooling as string] || m.schooling || '---', 200, y);
      doc.text(titleMap[m.employmentStatus as string] || m.employmentStatus || '---', 235, y);
      doc.text(m.role || 'Membro', 265, y);

      doc.setDrawColor(241, 245, 249);
      doc.line(10, y + 3, 287, y + 3);
      y += 8;
    });

    // Footer
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 58, 138);
    doc.text(`Total de Membros nesta listagem: ${membersToPrint.length}`, 12, y + 5);

    doc.save(`Relatorio_Membros_${categoryTitle.replace(/\s+/g, '_')}.pdf`);
    dispatch({ type: 'ADD_NOTIFICATION', payload: { message: `Relatório de ${categoryTitle} gerado com sucesso!`, type: 'info' } });
  };

  const resetForm = () => {
    setEditingMemberId(null);
    setActiveTab('personal');
    setFormData({
      name: '', bi: '', gender: 'M', maritalStatus: 'SINGLE',
      naturality: '', province: 'Luanda', profession: '', schooling: '',
      birthDate: '', fatherName: '', motherName: '', conversionDate: '',
      baptismDate: '', role: 'Membro', department: 'Geral', status: 'active',
      expectedTithe: 0, employmentStatus: 'NAO_TRABALHA', email: '', phone: '', address: '', photoUrl: '',
      family: { spouse: '', children: [] }
    });
  };

  // Apenas membros Trabalhadores ou com Negócio podem ter valor de dízimo fixo
  const isEligibleForTithe = formData.employmentStatus === 'TRABALHADOR' || formData.employmentStatus === 'NEGOCIO';

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <SEO title="Membros" description="Gestão completa do rol de membros da igreja." />
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
        <div>
          <h1 className="text-4xl font-black text-gray-800 tracking-tight">Membros da Igreja</h1>
          <p className="text-gray-500 font-medium italic">Base de dados ministerial unificada e segura.</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowAddModal(true); }}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-xl active:scale-95"
        >
          <Plus size={18} /> Novo Registo
        </button>
      </header>

      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 no-print">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Pesquisar por nome ou BI..."
            className="w-full pl-12 pr-6 py-4 bg-gray-50 border-none rounded-2xl outline-none text-sm font-bold"
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handlePrintCategory('TRABALHADOR')}
            title="Imprimir Trabalhadores"
            className="p-4 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-2xl transition-all shadow-sm flex items-center gap-2"
          >
            <Briefcase size={18} />
            <span className="text-[9px] font-black uppercase tracking-widest hidden xl:inline">Trabalhadores</span>
          </button>
          <button
            onClick={() => handlePrintCategory('NEGOCIO')}
            title="Imprimir Negócios"
            className="p-4 bg-purple-50 text-purple-600 hover:bg-purple-600 hover:text-white rounded-2xl transition-all shadow-sm flex items-center gap-2"
          >
            <DollarSign size={18} />
            <span className="text-[9px] font-black uppercase tracking-widest hidden xl:inline">Negócios</span>
          </button>
          <button
            onClick={() => handlePrintCategory('DESEMPREGADO')}
            title="Imprimir Desempregados"
            className="p-4 bg-amber-50 text-amber-600 hover:bg-amber-600 hover:text-white rounded-2xl transition-all shadow-sm flex items-center gap-2"
          >
            <Filter size={18} />
            <span className="text-[9px] font-black uppercase tracking-widest hidden xl:inline">Desempregados</span>
          </button>
          <button
            onClick={() => handlePrintCategory('NAO_TRABALHA')}
            title="Imprimir Não Trabalha/Estudante"
            className="p-4 bg-gray-100 text-gray-600 hover:bg-gray-600 hover:text-white rounded-2xl transition-all shadow-sm flex items-center gap-2"
          >
            <User size={18} />
            <span className="text-[9px] font-black uppercase tracking-widest hidden xl:inline">Estudantes</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden no-print">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-8 py-5 text-[10px] font-black uppercase text-gray-400 tracking-widest">Membro / Cargo</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase text-gray-400 tracking-widest">BI / Identidade</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase text-gray-400 tracking-widest">Contacto / Morada</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase text-gray-400 tracking-widest">Estatuto Prof. / Escolaridade</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase text-gray-400 tracking-widest text-center">Status</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase text-gray-400 tracking-widest text-right">Acções</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginatedMembers.map(member => (
                <tr key={member.id} className="hover:bg-blue-50/40 transition-colors">
                  <td className="px-8 py-4">
                    <div className="flex items-center gap-4">
                      <AvatarPlaceholder
                        name={member.name}
                        id={member.id}
                        photoUrl={member.photoUrl}
                        className="w-12 h-12 rounded-2xl object-cover shadow-sm border-2 border-white"
                      />
                      <div>
                        <p className="text-sm font-black text-gray-800">{member.name}</p>
                        <p className="text-[10px] text-blue-600 font-black uppercase tracking-widest">{member.role}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-4 font-mono text-xs font-bold text-gray-600">
                    <div>{member.bi}</div>
                    <div className="text-[10px] text-gray-400 lowercase">{member.maritalStatus}</div>
                  </td>
                  <td className="px-8 py-4">
                    <div className="text-xs font-bold text-gray-700">{member.phone || '---'}</div>
                    <div className="text-[10px] text-gray-400 truncate max-w-[150px]">{member.address || '---'}</div>
                  </td>
                  <td className="px-8 py-4">
                    <div className="text-[10px] font-black text-blue-600 uppercase tracking-tight">{member.employmentStatus?.replace('_', ' ')}</div>
                    <div className="text-[10px] text-gray-400">{member.schooling?.replace('_', ' ')}</div>
                  </td>
                  <td className="px-8 py-4 text-center">
                    <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-lg ${member.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{member.status}</span>
                  </td>
                  <td className="px-8 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => { setEditingMemberId(member.id); setFormData(member); setShowAddModal(true); }} className="p-3 bg-gray-50 text-gray-400 hover:text-blue-600 rounded-xl transition-all"><Edit size={16} /></button>
                      <button onClick={() => handleDeleteMember(member.id, member.name)} className="p-3 bg-gray-50 text-gray-400 hover:text-red-600 rounded-xl transition-all"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {paginatedMembers.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-8 py-20 text-center text-gray-300 font-black uppercase tracking-widest">Nenhum membro encontrado</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalRecords={filteredMembers.length}
          onPageChange={setCurrentPage}
        />
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-blue-950/60 backdrop-blur-sm animate-in fade-in" onClick={() => setShowAddModal(false)}></div>
          <div className="bg-white w-full max-w-5xl rounded-[3rem] shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in duration-300">
            <div className="p-8 border-b flex justify-between items-center bg-gray-50/50">
              <h2 className="text-2xl font-black text-gray-800">{editingMemberId ? 'Editar Perfil Ministerial' : 'Novo Cadastro de Membro'}</h2>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-white rounded-full transition-colors text-gray-400"><X size={24} /></button>
            </div>

            <div className="flex bg-gray-50 px-8 py-2 gap-8 border-b border-gray-100 shrink-0">
              <button onClick={() => setActiveTab('personal')} className={`py-4 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all ${activeTab === 'personal' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400'}`}>Dados Pessoais</button>
              <button onClick={() => setActiveTab('ecclesial')} className={`py-4 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all ${activeTab === 'ecclesial' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400'}`}>Eclesiástico</button>
              <button onClick={() => setActiveTab('family')} className={`py-4 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all ${activeTab === 'family' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400'}`}>Família & Morada</button>
            </div>

            <div className="p-10 overflow-y-auto space-y-8 flex-1">
              {activeTab === 'personal' && (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
                  <div className="md:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-2">Nome Completo</label>
                      <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full p-4 bg-gray-50 border-2 border-transparent focus:border-blue-600 focus:bg-white rounded-2xl outline-none transition-all text-sm font-bold" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-2">Nº BI (Identidade)</label>
                      <input type="text" value={formData.bi} onChange={e => setFormData({ ...formData, bi: e.target.value })} className="w-full p-4 bg-gray-50 border-2 border-transparent focus:border-blue-600 focus:bg-white rounded-2xl outline-none transition-all text-sm font-bold" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-2">Data de Nascimento</label>
                      <input type="date" value={formData.birthDate} onChange={e => setFormData({ ...formData, birthDate: e.target.value })} className="w-full p-4 bg-gray-50 rounded-2xl outline-none font-bold" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-2">Género</label>
                      <select value={formData.gender} onChange={e => setFormData({ ...formData, gender: e.target.value as any })} className="w-full p-4 bg-gray-50 rounded-2xl outline-none font-bold">
                        <option value="M">Masculino</option>
                        <option value="F">Feminino</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-2">Estado Civil</label>
                      <select value={formData.maritalStatus} onChange={e => setFormData({ ...formData, maritalStatus: e.target.value as any })} className="w-full p-4 bg-gray-50 rounded-2xl outline-none font-bold">
                        <option value="SINGLE">Solteiro(a)</option>
                        <option value="MARRIED">Casado(a)</option>
                        <option value="DIVORCED">Divorciado(a)</option>
                        <option value="WIDOW">Viúvo(a)</option>
                      </select>
                    </div>
                    <div className="md:col-span-2 flex gap-6 pt-4">
                      <label className="flex items-center gap-2 cursor-pointer group">
                        <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${formData.fatherless ? 'bg-blue-600 border-blue-600' : 'border-gray-300 group-hover:border-blue-400'}`}>
                          {formData.fatherless && <Filter size={14} className="text-white" />}
                        </div>
                        <input type="checkbox" checked={formData.fatherless} onChange={e => setFormData({ ...formData, fatherless: e.target.checked })} className="hidden" />
                        <span className="text-xs font-bold text-gray-600 group-hover:text-blue-600 transition-colors">Órfão de Pai</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer group">
                        <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${formData.motherless ? 'bg-blue-600 border-blue-600' : 'border-gray-300 group-hover:border-blue-400'}`}>
                          {formData.motherless && <Filter size={14} className="text-white" />}
                        </div>
                        <input type="checkbox" checked={formData.motherless} onChange={e => setFormData({ ...formData, motherless: e.target.checked })} className="hidden" />
                        <span className="text-xs font-bold text-gray-600 group-hover:text-blue-600 transition-colors">Órfão de Mãe</span>
                      </label>
                    </div>
                  </div>
                  <div className="md:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-2">Naturalidade</label>
                      <input type="text" value={formData.naturality} onChange={e => setFormData({ ...formData, naturality: e.target.value })} className="w-full p-4 bg-gray-50 rounded-2xl outline-none font-bold" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-2">Província</label>
                      <select value={formData.province} onChange={e => setFormData({ ...formData, province: e.target.value })} className="w-full p-4 bg-gray-50 rounded-2xl outline-none font-bold">
                        <option value="Luanda">Luanda</option>
                        <option value="Benguela">Benguela</option>
                        <option value="Huambo">Huambo</option>
                        <option value="Huila">Huíla</option>
                        <option value="Cabinda">Cabinda</option>
                        <option value="Cunene">Cunene</option>
                        <option value="Namibe">Namibe</option>
                        <option value="Uige">Uíge</option>
                        <option value="Zaire">Zaire</option>
                        <option value="Kwanza Norte">Kwanza Norte</option>
                        <option value="Kwanza Sul">Kwanza Sul</option>
                        <option value="Malanje">Malanje</option>
                        <option value="Moxico">Moxico</option>
                        <option value="Lunda Norte">Lunda Norte</option>
                        <option value="Lunda Sul">Lunda Sul</option>
                        <option value="Bie">Bié</option>
                        <option value="Cuando Cubango">Cuando Cubango</option>
                      </select>
                    </div>
                    <div className="space-y-1 md:col-span-2">
                      <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-2">Habilitações Literárias</label>
                      <select value={formData.schooling} onChange={e => setFormData({ ...formData, schooling: e.target.value })} className="w-full p-4 bg-gray-50 rounded-2xl outline-none font-bold">
                        <option value="">Selecione...</option>
                        <option value="ENSINO_BASE">Ensino de Base</option>
                        <option value="ENSINO_MEDIO">Ensino Médio</option>
                        <option value="LICENCIATURA">Licenciatura</option>
                        <option value="MESTRADO">Mestrado</option>
                        <option value="DOUTORAMENTO">Doutoramento</option>
                      </select>
                    </div>
                  </div>
                  <div className="md:col-span-4 flex flex-col items-center">
                    <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                      <div className="w-48 h-48 rounded-[3.5rem] bg-gray-100 border-8 border-white shadow-2xl overflow-hidden flex items-center justify-center group-hover:scale-105 transition-all">
                        {formData.photoUrl ? <img src={formData.photoUrl} className="w-full h-full object-cover" /> : <Camera size={48} className="text-gray-300" />}
                        <div className="absolute inset-0 bg-blue-900/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Upload className="text-white" size={32} />
                        </div>
                      </div>
                    </div>
                    <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest mt-6 bg-blue-50 px-4 py-1.5 rounded-full">Carregar Foto 3x4</p>
                  </div>
                </div>
              )}

              {activeTab === 'ecclesial' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-2">Cargo / Função</label>
                    <input type="text" value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })} className="w-full p-4 bg-gray-50 rounded-2xl outline-none font-bold" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-2">Departamento</label>
                    <input type="text" value={formData.department} onChange={e => setFormData({ ...formData, department: e.target.value })} className="w-full p-4 bg-gray-50 rounded-2xl outline-none font-bold" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-2">Data de Conversão</label>
                    <input type="date" value={formData.conversionDate} onChange={e => setFormData({ ...formData, conversionDate: e.target.value })} className="w-full p-4 bg-gray-50 rounded-2xl outline-none font-bold" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-2">Situação Profissional</label>
                    <div className="relative">
                      <Briefcase size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      <select
                        value={formData.employmentStatus}
                        onChange={e => {
                          const newStatus = e.target.value as any;
                          setFormData({
                            ...formData,
                            employmentStatus: newStatus,
                            // Se deixar de ser trabalhador, zera a expectativa de dízimo
                            expectedTithe: (newStatus === 'TRABALHADOR' || newStatus === 'NEGOCIO') ? formData.expectedTithe : 0
                          });
                        }}
                        className="w-full pl-12 p-4 bg-gray-50 rounded-2xl outline-none font-bold text-sm"
                      >
                        <option value="TRABALHADOR">Trabalhador</option>
                        <option value="NEGOCIO">Negócio Próprio</option>
                        <option value="DESEMPREGADO">Desempregado</option>
                        <option value="NAO_TRABALHA">Não Trabalha / Estudante</option>
                      </select>
                    </div>
                  </div>

                  {(formData.employmentStatus === 'TRABALHADOR' || formData.employmentStatus === 'NEGOCIO') && (
                    <div className="space-y-1 animate-in fade-in slide-in-from-top-2">
                      <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-2">Profissão / Actividade</label>
                      <input type="text" value={formData.profession} onChange={e => setFormData({ ...formData, profession: e.target.value })} className="w-full p-4 bg-gray-50 rounded-2xl outline-none font-bold" />
                    </div>
                  )}

                  {isEligibleForTithe && (
                    <div className="md:col-span-2 p-6 bg-blue-50 border-2 border-blue-100 rounded-[2rem] animate-in slide-in-from-top-2">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-600 text-white rounded-xl shadow-lg">
                          <DollarSign size={20} />
                        </div>
                        <div className="flex-1">
                          <label className="text-[10px] font-black uppercase text-blue-600 tracking-widest ml-1">Valor do Dízimo Mensal (Compromisso)</label>
                          <input
                            type="number"
                            value={formData.expectedTithe}
                            onChange={e => setFormData({ ...formData, expectedTithe: Number(e.target.value) })}
                            placeholder="0,00"
                            className="w-full p-4 mt-2 bg-white border-none rounded-2xl outline-none text-xl font-black text-blue-900"
                          />
                          <p className="text-[9px] font-bold text-blue-400 mt-2 uppercase tracking-tight italic">Este valor será sugerido e BLOQUEADO no momento do lançamento do dízimo.</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'family' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-2">Telefone Móvel</label>
                    <input type="tel" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="w-full p-4 bg-gray-50 rounded-2xl outline-none font-bold" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-2">Morada / Bairro</label>
                    <input type="text" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} className="w-full p-4 bg-gray-50 rounded-2xl outline-none font-bold" />
                  </div>
                </div>
              )}
            </div>

            <div className="p-8 bg-gray-50 border-t flex gap-4 shrink-0">
              <button onClick={() => setShowAddModal(false)} className="flex-1 py-4 text-xs font-black uppercase tracking-widest text-gray-400 hover:text-gray-600 transition-colors">Descartar</button>
              <button onClick={handleSaveMember} className="flex-1 py-4 bg-blue-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 active:scale-95 transition-all"><Save size={18} /> {editingMemberId ? 'Actualizar Registo' : 'Finalizar Cadastro'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Members;
