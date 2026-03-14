
import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext.tsx';
import {
  Plus, Search, UserPlus, School, CheckCircle2,
  Trash2, X, Save, Users, Calendar, ClipboardCheck, ChevronLeft, ChevronRight,
  History, TrendingUp, Info, Printer
} from 'lucide-react';
import SEO from '../components/Common/SEO';
import { SchoolClass, Member } from '../core/types';
import AvatarPlaceholder from '../components/AvatarPlaceholder';
import Pagination from '../components/Pagination';

const ITEMS_PER_PAGE = 9;

const SundaySchool: React.FC = () => {
  const { state, dispatch } = useApp();
  const [showClassModal, setShowClassModal] = useState(false);
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState<SchoolClass | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [memberSearch, setMemberSearch] = useState('');
  const [modalTab, setModalTab] = useState<'current' | 'history'>('current');
  const [currentPage, setCurrentPage] = useState(1);

  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [presentIds, setPresentIds] = useState<string[]>([]);

  const [editingId, setEditingId] = useState<string | null>(null);

  const [classForm, setClassForm] = useState({ name: '', teacher: '', room: 'Sala A' });

  const filteredClasses = state.schoolClasses.filter(cls =>
    cls.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cls.teacherName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredClasses.length / ITEMS_PER_PAGE);
  const paginatedClasses = filteredClasses.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  // Filter members to exclude those already in ANY class studentIds
  const enrolledStudentIds = useMemo(() => {
    return state.schoolClasses.reduce((acc, cls) => {
      return [...acc, ...(cls.studentIds || [])];
    }, [] as string[]);
  }, [state.schoolClasses]);

  const filteredMembers = state.members.filter(m =>
    m.name.toLowerCase().includes(memberSearch.toLowerCase()) &&
    !enrolledStudentIds.includes(m.id)
  ).slice(0, 5);

  const handleSaveClass = async () => {
    if (!classForm.name || !classForm.teacher) {
      dispatch({ type: 'ADD_NOTIFICATION', payload: { message: 'Nome e Professor são obrigatórios!', type: 'error' } });
      return;
    }

    const token = localStorage.getItem('token');
    const method = editingId ? 'PUT' : 'POST';
    const url = editingId ? `/api/school/classes/${editingId}` : '/api/school/classes';

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: classForm.name,
          teacherName: classForm.teacher,
          room: classForm.room,
          ageGroup: 'Geral',
          status: 'ACTIVE'
        }),
      });

      if (!response.ok) throw new Error('Erro ao salvar turma');

      const saved = await response.json();

      const classData: SchoolClass = {
        id: editingId || saved.idTurma || saved.id,
        name: classForm.name,
        teacherName: classForm.teacher,
        room: classForm.room,
        ageGroup: 'Geral',
        studentsCount: editingId ? (state.schoolClasses.find(c => c.id === editingId)?.studentsCount || 0) : 0,
        studentIds: editingId ? (state.schoolClasses.find(c => c.id === editingId)?.studentIds || []) : [],
        attendance: editingId ? (state.schoolClasses.find(c => c.id === editingId)?.attendance || []) : []
      };

      if (editingId) {
        dispatch({ type: 'UPDATE_SCHOOL_CLASS', payload: classData });
        dispatch({ type: 'ADD_NOTIFICATION', payload: { message: 'Turma atualizada!', type: 'success' } });
      } else {
        dispatch({ type: 'ADD_SCHOOL_CLASS', payload: classData });
        dispatch({ type: 'ADD_NOTIFICATION', payload: { message: 'Turma criada com sucesso!', type: 'success' } });
      }

      setClassForm({ name: '', teacher: '', room: 'Sala A' });
      setEditingId(null);
      setShowClassModal(false);
    } catch (error) {
      console.error('Error saving class:', error);
      dispatch({ type: 'ADD_NOTIFICATION', payload: { message: 'Erro ao conectar com o servidor', type: 'error' } });
    }
  };

  const handleEnroll = async (member: Member) => {
    if (!selectedClass) return;
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`/api/school/classes/${selectedClass.id}/enroll`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ memberId: member.id })
      });

      const result = await response.json();
      if (!response.ok) {
        dispatch({ type: 'ADD_NOTIFICATION', payload: { message: result.message || 'Erro ao matricular aluno', type: 'error' } });
        return;
      }

      dispatch({ type: 'ENROLL_STUDENT', payload: { classId: selectedClass.id, memberId: member.id } });
      dispatch({ type: 'ADD_NOTIFICATION', payload: { message: `${member.name} matriculado(a)!`, type: 'success' } });

      // Update selectedClass in local state for the modal
      setSelectedClass(prev => prev ? {
        ...prev,
        studentIds: [...(prev.studentIds || []), member.id],
        studentsCount: (prev.studentIds?.length || 0) + 1
      } : null);

      setShowEnrollModal(false);
      setMemberSearch('');
    } catch (error) {
      console.error('Error enrolling student:', error);
      dispatch({ type: 'ADD_NOTIFICATION', payload: { message: 'Erro ao matricular aluno', type: 'error' } });
    }
  };

  const handleRemoveStudent = async (memberId: string, memberName: string) => {
    if (!selectedClass) {
      alert('Erro: Nenhuma turma selecionada.');
      return;
    }

    // DEBUG: Removido confirm temporariamente para teste
    // if (!window.confirm(`Deseja remover ${memberName} desta turma?`)) return;

    const token = localStorage.getItem('token');
    try {
      dispatch({ type: 'ADD_NOTIFICATION', payload: { message: 'Processando remoção...', type: 'info' } });

      const response = await fetch(`/api/school/classes/${selectedClass.id}/students/${memberId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        const errText = await response.text();
        alert(`Erro Servidor: ${response.status} - ${errText}`);
        throw new Error('Erro ao remover aluno');
      }

      dispatch({ type: 'ADD_NOTIFICATION', payload: { message: 'Aluno removido! Atualizando...', type: 'success' } });

      // Force update UI locally aggressively
      const updatedIds = selectedClass.studentIds?.filter(id => id !== memberId) || [];
      setSelectedClass(prev => prev ? { ...prev, studentIds: updatedIds, studentsCount: updatedIds.length } : null);

      dispatch({
        type: 'UPDATE_SCHOOL_CLASS',
        payload: {
          ...selectedClass,
          studentIds: updatedIds,
          studentsCount: updatedIds.length
        }
      });

    } catch (error: any) {
      console.error('Error removing student:', error);
      const errorMessage = error.response?.data?.message || (typeof error === 'string' ? error : error.message) || 'Erro ao remover aluno';
      dispatch({ type: 'ADD_NOTIFICATION', payload: { message: errorMessage, type: 'error' } });
    }
  };

  const handlePrintStudents = () => {
    if (!selectedClass) return;
    const students = selectedClass.studentIds?.map(id => state.members.find(m => m.id === id)).filter(Boolean) || [];

    const printFrame = document.createElement('iframe');
    printFrame.style.position = 'fixed';
    printFrame.style.right = '0';
    printFrame.style.bottom = '0';
    printFrame.style.width = '0';
    printFrame.style.height = '0';
    printFrame.style.border = '0';
    document.body.appendChild(printFrame);

    const churchLogo = state.churchSettings?.logo;

    const html = `
      <html>
        <head>
          <title>Lista de Turma - ${selectedClass.name}</title>
          <style>
            body { font-family: sans-serif; padding: 40px; }
            h1 { text-align: center; color: #1e40af; margin: 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            th { background-color: #f8fafc; }
            .header-container { display: flex; align-items: center; justify-content: center; position: relative; margin-bottom: 30px; border-bottom: 2px solid #1e40af; padding-bottom: 20px; min-height: 100px; }
            .logo { position: absolute; left: 0; top: 0; width: 100px; height: 100px; object-fit: contain; }
            .header-content { text-align: center; padding-left: 110px; padding-right: 110px; }
            .header-content p { margin: 5px 0; }
            .footer { margin-top: 50px; text-align: center; font-size: 10px; color: #64748b; }
          </style>
        </head>
        <body>
          <div class="header-container">
            ${churchLogo ? `<img src="${churchLogo}" class="logo" />` : ''}
            <div class="header-content">
              <h1>Escola Dominical - Lista de Alunos</h1>
              <p><strong>Turma:</strong> ${selectedClass.name}</p>
              <p><strong>Professor:</strong> ${selectedClass.teacherName} | <strong>Sala:</strong> ${selectedClass.room}</p>
              <p><strong>Data:</strong> ${new Date().toLocaleDateString()}</p>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th style="width: 50px;">Nº</th>
                <th>Nome do Aluno</th>
                <th>Telefone</th>
                <th style="width: 150px;">Assinatura / Presença</th>
              </tr>
            </thead>
            <tbody>
              ${students.map((s: any, i) => `
                <tr>
                  <td>${i + 1}</td>
                  <td>${s.name}</td>
                  <td>${s.phone || '-'}</td>
                  <td></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="footer">
            Gerado por EclesiaMaster em ${new Date().toLocaleString()}
          </div>
        </body>
      </html>
    `;

    const frameDoc = printFrame.contentWindow?.document || printFrame.contentDocument;
    if (frameDoc) {
      frameDoc.open();
      frameDoc.write(html);
      frameDoc.close();

      setTimeout(() => {
        printFrame.contentWindow?.focus();
        printFrame.contentWindow?.print();
        document.body.removeChild(printFrame);
      }, 500);
    }
  };

  const handleDeleteClass = async (id: string, name: string) => {
    if (!confirm(`Tem certeza que deseja remover a turma ${name}?`)) return;

    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`/api/school/classes/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Erro ao remover turma');

      dispatch({ type: 'DELETE_SCHOOL_CLASS', payload: id });
      dispatch({ type: 'ADD_NOTIFICATION', payload: { message: `Turma ${name} removida.`, type: 'info' } });
    } catch (error: any) {
      console.error('Error deleting class:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Erro ao remover turma no servidor';
      dispatch({ type: 'ADD_NOTIFICATION', payload: { message: errorMessage, type: 'error' } });
    }
  };

  const handleOpenAttendance = (cls: SchoolClass) => {
    setSelectedClass(cls);
    setModalTab('current');
    const today = new Date().toISOString().split('T')[0];
    const record = cls.attendance?.find(r => r.date === today);
    setPresentIds(record ? record.presentStudentIds : []);
    setShowAttendanceModal(true);
  };

  const togglePresence = (studentId: string) => {
    setPresentIds(prev => prev.includes(studentId) ? prev.filter(id => id !== studentId) : [...prev, studentId]);
  };

  const handleSaveAttendance = async () => {
    if (!selectedClass) return;
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`/api/school/classes/${selectedClass.id}/attendance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          date: attendanceDate,
          presentIds
        })
      });

      if (!response.ok) throw new Error('Erro ao salvar presença');

      dispatch({
        type: 'SAVE_ATTENDANCE',
        payload: { classId: selectedClass.id, date: attendanceDate, presentIds }
      });
      dispatch({ type: 'ADD_NOTIFICATION', payload: { message: 'Lista de presença salva!', type: 'success' } });
      setShowAttendanceModal(false);
    } catch (error) {
      console.error('Error saving attendance:', error);
      dispatch({ type: 'ADD_NOTIFICATION', payload: { message: 'Erro ao salvar presença', type: 'error' } });
    }
  };

  const getStudentAttendanceStat = (studentId: string, cls: SchoolClass) => {
    if (!cls.attendance || cls.attendance.length === 0) return 0;
    const presenceCount = cls.attendance.filter(r => r.presentStudentIds.includes(studentId)).length;
    return Math.round((presenceCount / cls.attendance.length) * 100);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <SEO title="Escola Dominical" description="Gestão de turmas e frequência escolar ministerial." />
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-gray-800 tracking-tight">Escola Dominical</h1>
          <p className="text-gray-500 font-medium italic">Gestão de turmas e frequência escolar ministerial.</p>
        </div>
        <button
          onClick={() => { setEditingId(null); setClassForm({ name: '', teacher: '', room: 'Sala A' }); setShowClassModal(true); }}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl flex items-center gap-2"
        >
          <Plus size={18} /> Nova Turma
        </button>
      </header>

      <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm">
        <div className="relative mb-8 max-w-md">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
          <input type="text" placeholder="Pesquisar turmas..." className="w-full pl-11 pr-4 py-4 bg-gray-50 border-none rounded-2xl outline-none font-bold text-sm" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginatedClasses.map(cls => (
            <div key={cls.id} className="p-8 bg-gray-50/50 rounded-[2.5rem] border border-gray-100 hover:bg-white hover:border-indigo-200 transition-all group">
              <div className="flex justify-between items-start mb-6">
                <div className="p-4 bg-indigo-100 text-indigo-600 rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-all"><School size={24} /></div>
                <div className="flex gap-1">
                  <button onClick={() => { setEditingId(cls.id); setClassForm({ name: cls.name, teacher: cls.teacherName, room: cls.room }); setShowClassModal(true); }} className="p-2 text-indigo-600 bg-white border border-indigo-50 rounded-lg hover:bg-indigo-50" title="Editar Turma"><Plus size={16} className="rotate-45" /></button>
                  <button onClick={() => { setSelectedClass(cls); setShowEnrollModal(true); }} title="Matricular Aluno" className="p-2 text-indigo-600 bg-white border border-indigo-50 rounded-lg hover:bg-indigo-50"><UserPlus size={16} /></button>
                  <button onClick={() => handleDeleteClass(cls.id, cls.name)} className="p-2 text-gray-300 hover:text-red-600"><Trash2 size={16} /></button>
                </div>
              </div>
              <h4 className="text-lg font-black text-gray-800 mb-1">{cls.name}</h4>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6">Prof. {cls.teacherName}</p>
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2 text-xs font-black text-indigo-600 bg-indigo-50 px-4 py-2 rounded-xl self-start">
                  <Users size={14} /> {cls.studentIds?.length || 0} Alunos
                </div>
                <button
                  onClick={() => handleOpenAttendance(cls)}
                  className="w-full py-4 bg-white border-2 border-indigo-100 text-indigo-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all shadow-sm flex items-center justify-center gap-2"
                >
                  <ClipboardCheck size={16} /> Diário de Classe
                </button>
              </div>
            </div>
          ))}
          {filteredClasses.length === 0 && (
            <div className="col-span-full py-20 text-center text-gray-300 font-black uppercase tracking-widest">Nenhuma turma registrada.</div>
          )}
        </div>
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalRecords={filteredClasses.length}
          onPageChange={setCurrentPage}
        />
      </div>

      {showAttendanceModal && selectedClass && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-blue-950/80 backdrop-blur-md" onClick={() => setShowAttendanceModal(false)}></div>
          <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl relative overflow-hidden animate-in zoom-in flex flex-col max-h-[90vh]">
            <div className="p-8 border-b bg-indigo-50/50 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-black text-gray-800">Classe: {selectedClass.name}</h2>
                <div className="flex gap-4 mt-2">
                  <button onClick={() => setModalTab('current')} className={`text-[9px] font-black uppercase tracking-widest pb-1 border-b-2 transition-all ${modalTab === 'current' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-400'}`}>Chamada de Hoje</button>
                  <button onClick={() => setModalTab('history')} className={`text-[9px] font-black uppercase tracking-widest pb-1 border-b-2 transition-all ${modalTab === 'history' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-400'}`}>Histórico Recente</button>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={handlePrintStudents} title="Imprimir Lista" className="p-3 bg-white text-indigo-600 rounded-xl border border-indigo-100 hover:bg-indigo-50 transition-all"><Printer size={20} /></button>
                <button onClick={() => setShowAttendanceModal(false)} className="p-2 hover:bg-white rounded-full"><X size={24} /></button>
              </div>
            </div>

            <div className="p-8 flex-1 overflow-y-auto">
              {modalTab === 'current' ? (
                <div className="space-y-6">
                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <Calendar className="text-indigo-600" />
                    <input
                      type="date"
                      className="bg-transparent border-none outline-none font-bold text-gray-700 w-full"
                      value={attendanceDate}
                      onChange={e => setAttendanceDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-3">
                    {selectedClass.studentIds?.length === 0 ? (
                      <div className="text-center py-10 text-gray-400 italic">Nenhum aluno matriculado nesta turma.</div>
                    ) : (
                      selectedClass.studentIds?.map(id => {
                        const m = state.members.find(mem => mem.id === id);
                        if (!m) return null;
                        const isPresent = presentIds.includes(id);
                        const rate = getStudentAttendanceStat(id, selectedClass);
                        return (
                          <div key={id} className="flex gap-2 group">
                            <button
                              onClick={() => togglePresence(id)}
                              className={`flex-1 p-4 rounded-2xl flex items-center justify-between border-2 transition-all ${isPresent ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-gray-50 border-transparent text-gray-600'
                                }`}
                            >
                              <div className="flex items-center gap-4">
                                <AvatarPlaceholder
                                  name={m.name}
                                  id={m.id}
                                  photoUrl={m.photoUrl}
                                  className="w-8 h-8 rounded-lg object-cover"
                                />
                                <div>
                                  <p className="font-bold text-sm text-left">{m.name}</p>
                                  <p className={`text-[8px] font-black uppercase tracking-tighter text-left ${isPresent ? 'text-indigo-200' : 'text-gray-400'}`}>
                                    Freq: {rate}% • {isPresent ? 'PRESENÇA' : 'FALTA'}
                                  </p>
                                </div>
                              </div>
                              {isPresent ? <CheckCircle2 size={20} /> : <div className="w-5 h-5 rounded-full border-2 border-gray-300"></div>}
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleRemoveStudent(m.id, m.name); }}
                              className="p-4 bg-red-50 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-sm"
                              title="Remover da Turma"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedClass.attendance && selectedClass.attendance.length > 0 ? (
                    [...selectedClass.attendance].reverse().map((rec, idx) => (
                      <div key={idx} className="p-5 bg-gray-50 rounded-[1.5rem] border border-gray-100 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <History size={18} className="text-indigo-400" />
                          <div>
                            <p className="text-sm font-black text-gray-800">{new Date(rec.date).toLocaleDateString()}</p>
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Presença: {rec.presentStudentIds.length}/{selectedClass.studentIds?.length || 0}</p>
                          </div>
                        </div>
                        <div className="bg-white px-3 py-1 rounded-lg border border-gray-100 text-[10px] font-black text-indigo-600">
                          {Math.round((rec.presentStudentIds.length / (selectedClass.studentIds?.length || 1)) * 100)}%
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-20 text-center text-gray-300 font-black uppercase text-xs tracking-widest">Sem registros históricos.</div>
                  )}
                </div>
              )}
            </div>

            <div className="p-8 border-t bg-gray-50 flex gap-4">
              <button onClick={() => setShowAttendanceModal(false)} className="flex-1 py-4 text-[10px] font-black uppercase text-gray-400">Cancelar</button>
              {modalTab === 'current' && (
                <button onClick={handleSaveAttendance} className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase shadow-xl flex items-center justify-center gap-2"><Save size={18} /> Salvar Chamada</button>
              )}
            </div>
          </div>
        </div>
      )}

      {showEnrollModal && selectedClass && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-blue-950/80 backdrop-blur-md" onClick={() => setShowEnrollModal(false)}></div>
          <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl relative overflow-hidden animate-in zoom-in">
            <div className="p-8 border-b bg-gray-50 flex justify-between items-center">
              <h2 className="text-2xl font-black text-gray-800">Matrícula EBD</h2>
              <button onClick={() => setShowEnrollModal(false)} className="p-2 hover:bg-white rounded-full"><X size={24} /></button>
            </div>
            <div className="p-10 space-y-6">
              <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl">
                <p className="text-xs font-black text-indigo-700 uppercase">Turma: {selectedClass.name}</p>
              </div>
              <input type="text" placeholder="Pesquisar membro para matricular..." className="w-full p-4 bg-gray-50 rounded-2xl outline-none font-bold text-sm" value={memberSearch} onChange={e => setMemberSearch(e.target.value)} />
              <div className="space-y-1 max-h-60 overflow-y-auto">
                {filteredMembers.map(m => (
                  <button key={m.id} onClick={() => handleEnroll(m)} className="w-full p-4 rounded-2xl hover:bg-indigo-600 hover:text-white text-left text-sm font-bold transition-all flex items-center justify-between group">
                    {m.name} <Plus size={16} className="opacity-0 group-hover:opacity-100" />
                  </button>
                ))}
                {filteredMembers.length === 0 && memberSearch && <p className="text-center py-4 text-xs text-gray-400">Nenhum membro encontrado ou já matriculado.</p>}
              </div>
            </div>
          </div>
        </div>
      )}

      {showClassModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-blue-950/80 backdrop-blur-md" onClick={() => setShowClassModal(false)}></div>
          <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl relative overflow-hidden animate-in zoom-in">
            <div className="p-8 border-b bg-gray-50 flex justify-between items-center">
              <h2 className="text-2xl font-black text-gray-800">{editingId ? 'Editar Turma' : 'Criar Nova Turma'}</h2>
              <button onClick={() => setShowClassModal(false)} className="p-2 hover:bg-white rounded-full"><X size={24} /></button>
            </div>
            <div className="p-10 space-y-6">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Nome da Classe</label>
                <input type="text" className="w-full p-4 bg-gray-50 rounded-2xl outline-none font-bold text-sm" value={classForm.name} onChange={e => setClassForm({ ...classForm, name: e.target.value })} placeholder="Ex: Jovens, Casais..." />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Professor(a)</label>
                <input type="text" className="w-full p-4 bg-gray-50 rounded-2xl outline-none font-bold text-sm" value={classForm.teacher} onChange={e => setClassForm({ ...classForm, teacher: e.target.value })} placeholder="Nome completo" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Sala / Localização</label>
                <input type="text" className="w-full p-4 bg-gray-50 rounded-2xl outline-none font-bold text-sm" value={classForm.room} onChange={e => setClassForm({ ...classForm, room: e.target.value })} placeholder="Ex: Sala 01, Templo..." />
              </div>
            </div>
            <div className="p-8 border-t bg-gray-50 flex gap-4">
              <button onClick={() => setShowClassModal(false)} className="flex-1 py-4 text-[10px] font-black uppercase text-gray-400">Cancelar</button>
              <button onClick={handleSaveClass} className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase shadow-xl flex items-center justify-center gap-2"><Save size={18} /> {editingId ? 'Salvar Alterações' : 'Abrir Turma'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SundaySchool;
