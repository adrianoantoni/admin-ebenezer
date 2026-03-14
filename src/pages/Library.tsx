
import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext.tsx';
import {
  Library, Plus, Search, Book, User,
  X, Save, Edit3, Trash2, CheckCircle2, AlertCircle,
  ArrowRightLeft, RotateCcw, Clock, ShieldAlert, Calendar,
  ShieldX, Info, AlertTriangle, ChevronLeft, ChevronRight,
  BookOpen, UserPlus, GraduationCap, Printer
} from 'lucide-react';
import SEO from '../components/Common/SEO';
import { LibraryBook, Member } from '../core/types';
import Pagination from '../components/Pagination';

const ITEMS_PER_PAGE = 6;

const LibraryPage: React.FC = () => {
  const { state, dispatch } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [showLoanModal, setShowLoanModal] = useState(false);
  const [editingBook, setEditingBook] = useState<LibraryBook | null>(null);
  const [selectedBookForAction, setSelectedBookForAction] = useState<LibraryBook | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [memberSearch, setMemberSearch] = useState('');
  const [loanDays, setLoanDays] = useState(7);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(6);

  const [bookForm, setBookForm] = useState({ title: '', author: '', category: 'Teologia', quantity: 1 });

  const isOverdue = (dateStr: string) => {
    return new Date(dateStr) < new Date();
  };

  const overdueCount = useMemo(() => {
    return state.books.reduce((acc, book) =>
      acc + (book.borrowers || []).filter(br => isOverdue(br.dueDate)).length, 0
    );
  }, [state.books]);

  const filteredBooks = state.books.filter(b =>
    b.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.author.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredBooks.length / itemsPerPage);
  const paginatedBooks = filteredBooks.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleItemsPerPageChange = (newLimit: number) => {
    setItemsPerPage(newLimit);
    setCurrentPage(1);
  };

  const filteredMembers = state.members.filter(m =>
    m.name.toLowerCase().includes(memberSearch.toLowerCase())
  ).slice(0, 5);

  const handleSaveBook = async () => {
    if (!bookForm.title || !bookForm.author) return;

    const token = localStorage.getItem('token');
    try {
      if (editingBook) {
        // TODO: Implementar PUT no backend se necessário, por enquanto simulando com POST novo ou apenas ignorando
        dispatch({ type: 'UPDATE_BOOK', payload: { ...editingBook, title: bookForm.title, author: bookForm.author, totalQuantity: bookForm.quantity } });
        dispatch({ type: 'ADD_NOTIFICATION', payload: { message: 'Obra atualizada!', type: 'success' } });
      } else {
        const response = await fetch('/api/library/books', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(bookForm),
        });

        if (!response.ok) throw new Error('Erro ao salvar livro');
        const saved = await response.json();

        const newBook: LibraryBook = {
          id: saved.idLivro || saved.id,
          title: bookForm.title,
          author: bookForm.author,
          category: bookForm.category,
          totalQuantity: bookForm.quantity,
          availableQuantity: bookForm.quantity,
          borrowers: []
        };
        dispatch({ type: 'ADD_BOOK', payload: newBook });
        dispatch({ type: 'ADD_NOTIFICATION', payload: { message: 'Obra adicionada ao acervo!', type: 'success' } });
      }
      setShowModal(false);
    } catch (error) {
      console.error('Error saving book:', error);
    }
  };

  const handleLoan = async (member: Member) => {
    if (!selectedBookForAction || selectedBookForAction.availableQuantity <= 0) return;

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + loanDays);

    const token = localStorage.getItem('token');
    try {
      const response = await fetch('/api/library/loans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          bookId: selectedBookForAction.id,
          memberId: member.id,
          dueDate: dueDate.toISOString()
        }),
      });

      if (!response.ok) throw new Error('Erro ao registrar empréstimo');

      dispatch({
        type: 'LOAN_BOOK',
        payload: {
          bookId: selectedBookForAction.id,
          borrower: {
            memberId: member.id,
            memberName: member.name,
            loanDate: new Date().toISOString(),
            dueDate: dueDate.toISOString()
          }
        }
      });

      dispatch({ type: 'ADD_NOTIFICATION', payload: { message: 'Empréstimo registrado!', type: 'success' } });
      setShowLoanModal(false);
    } catch (error) {
      console.error('Error loaning book:', error);
    }
  };

  const handleReturn = async (bookId: string, memberId: string) => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch('/api/library/returns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ bookId, memberId }),
      });

      if (!response.ok) throw new Error('Erro ao devolver livro');

      dispatch({ type: 'RETURN_BOOK', payload: { bookId, memberId } });
      dispatch({ type: 'ADD_NOTIFICATION', payload: { message: 'Livro devolvido!', type: 'success' } });
    } catch (error) {
      console.error('Error returning book:', error);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <SEO title="Biblioteca" description="Gestão do acervo de livros e empréstimos da igreja." />
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-gray-800 tracking-tight">Biblioteca Ministerial</h1>
          <p className="text-gray-500 font-medium italic">Gestão de acervo e fluxo de empréstimos.</p>
        </div>
        <button
          onClick={() => { setEditingBook(null); setBookForm({ title: '', author: '', category: 'Teologia', quantity: 1 }); setShowModal(true); }}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl flex items-center gap-2"
        >
          <Plus size={18} /> Novo Título
        </button>
      </header>

      {overdueCount > 0 && (
        <div className="bg-red-600 p-8 rounded-[2.5rem] text-white shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6 animate-pulse">
          <div className="flex items-center gap-6">
            <div className="p-4 bg-white/20 rounded-2xl"><AlertTriangle size={32} /></div>
            <div>
              <h3 className="text-xl font-black">Crise de Devolução Detectada</h3>
              <p className="text-red-100 text-xs font-bold uppercase tracking-widest">Existem {overdueCount} obras com prazo expirado no sistema.</p>
            </div>
          </div>
          <button onClick={() => setSearchTerm('')} className="bg-white text-red-600 px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:scale-105 transition-all">Verificar Atrasos</button>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-6">
          <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm">
            <div className="relative mb-8">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
              <input type="text" placeholder="Pesquisar obra ou autor..." className="w-full pl-11 pr-4 py-4 bg-gray-50 border-none rounded-2xl outline-none font-bold text-sm" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
            <div className="space-y-4">
              {paginatedBooks.length === 0 ? (
                <div className="py-20 text-center">
                  <Library size={48} className="mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-400 font-black uppercase tracking-widest text-sm">Nenhum livro encontrado</p>
                  <p className="text-gray-300 text-xs mt-2">Adicione obras ao acervo clicando em "Novo Título"</p>
                </div>
              ) : (
                paginatedBooks.map(book => {
                  const hasOverdue = (book.borrowers || []).some(br => isOverdue(br.dueDate));
                  return (
                    <div key={book.id} className={`p-6 rounded-[2.5rem] border flex items-center justify-between hover:scale-[1.01] transition-all ${hasOverdue ? 'bg-red-50 border-red-200' : 'bg-gray-50/50 border-gray-100 hover:bg-white'}`}>
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${hasOverdue ? 'bg-red-600 text-white' : book.availableQuantity > 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                          {hasOverdue ? <ShieldX size={20} /> : <Book size={20} />}
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-gray-800">{book.title}</h4>
                          <div className="flex items-center gap-2">
                            <p className="text-[10px] font-bold text-gray-400 uppercase">{book.author} • {book.availableQuantity}/{book.totalQuantity} Disponíveis</p>
                            {hasOverdue && <span className="text-[8px] font-black text-red-600 bg-red-100 px-2 py-0.5 rounded-md uppercase tracking-widest">Atraso Crítico</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => { setSelectedBookForAction(book); setShowLoanModal(true); }}
                          disabled={book.availableQuantity <= 0}
                          className="p-3 bg-white border border-gray-100 rounded-xl text-blue-600 hover:bg-blue-600 hover:text-white transition-all disabled:opacity-30"
                        >
                          <ArrowRightLeft size={18} />
                        </button>
                        <button onClick={() => dispatch({ type: 'DELETE_BOOK', payload: book.id })} className="p-3 bg-white border border-gray-100 rounded-xl text-gray-300 hover:text-red-600 transition-all"><Trash2 size={18} /></button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalRecords={filteredBooks.length}
              onPageChange={setCurrentPage}
            />
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-[#1e3a8a] p-8 rounded-[3rem] text-white shadow-2xl overflow-hidden relative">
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-12 -mt-12 blur-xl"></div>
            <Clock size={32} className="text-amber-400 mb-6" />
            <h3 className="text-xl font-black mb-6">Empréstimos Ativos</h3>
            <div className="space-y-4">
              {state.books.flatMap(b => (b.borrowers || []).map(br => ({ ...br, bookTitle: b.title, bookId: b.id }))).map((loan, idx) => (
                <div key={idx} className={`p-4 rounded-2xl border flex items-center justify-between transition-all ${isOverdue(loan.dueDate) ? 'bg-red-600 border-red-400 text-white' : 'bg-white/10 border-white/10'}`}>
                  <div className="flex-1 overflow-hidden mr-4">
                    <p className={`text-xs font-bold truncate ${isOverdue(loan.dueDate) ? 'text-white' : 'text-blue-100'}`}>{loan.memberName}</p>
                    <p className={`text-[9px] font-black uppercase truncate ${isOverdue(loan.dueDate) ? 'text-red-100' : 'text-blue-200'}`}>{loan.bookTitle}</p>
                    <p className={`text-[8px] font-black uppercase mt-1 ${isOverdue(loan.dueDate) ? 'text-yellow-300' : 'text-emerald-300'}`}>
                      Devol: {new Date(loan.dueDate).toLocaleDateString()}
                    </p>
                  </div>
                  <button onClick={() => handleReturn(loan.bookId, loan.memberId)} className="p-2 bg-emerald-500 rounded-lg hover:bg-emerald-600 text-white transition-all active:scale-95"><RotateCcw size={14} /></button>
                </div>
              ))}
              {state.books.every(b => !b.borrowers || b.borrowers.length === 0) && (
                <div className="py-10 text-center text-blue-300 font-bold text-xs uppercase tracking-widest">Sem movimentação.</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showLoanModal && selectedBookForAction && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-blue-950/80 backdrop-blur-md" onClick={() => setShowLoanModal(false)}></div>
          <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl relative overflow-hidden animate-in zoom-in">
            <div className="p-8 border-b bg-gray-50 flex justify-between items-center">
              <h2 className="text-2xl font-black text-gray-800">Empréstimo de Obra</h2>
              <button onClick={() => setShowLoanModal(false)} className="p-2 hover:bg-white rounded-full"><X size={24} /></button>
            </div>
            <div className="p-10 space-y-6">
              <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl flex items-center gap-4">
                <Book className="text-blue-600" />
                <div><p className="text-xs font-black">{selectedBookForAction.title}</p><p className="text-[9px] font-bold text-gray-400 uppercase">Estoque Disponível: {selectedBookForAction.availableQuantity}</p></div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Período (Dias)</label>
                <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-2xl">
                  <Calendar size={18} className="text-gray-400" />
                  <input type="number" className="bg-transparent outline-none font-bold w-full" value={loanDays} onChange={e => setLoanDays(Number(e.target.value))} />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Membro Requisitante</label>
                <input type="text" placeholder="Pesquisar membro..." className="w-full p-4 bg-gray-50 rounded-2xl outline-none font-bold text-sm" value={memberSearch} onChange={e => setMemberSearch(e.target.value)} />
                <div className="mt-2 space-y-1">
                  {filteredMembers.map(m => (
                    <button key={m.id} onClick={() => handleLoan(m)} className="w-full p-3 rounded-xl hover:bg-blue-600 hover:text-white text-left text-xs font-bold transition-all flex items-center justify-between group">
                      {m.name} <Plus size={14} className="opacity-0 group-hover:opacity-100" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-blue-950/80 backdrop-blur-md" onClick={() => setShowModal(false)}></div>
          <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl relative overflow-hidden animate-in zoom-in">
            <div className="p-8 border-b bg-gray-50 flex justify-between items-center">
              <h2 className="text-2xl font-black text-gray-800">{editingBook ? 'Editar Obra' : 'Nova Obra'}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-white rounded-full"><X size={24} /></button>
            </div>
            <div className="p-10 space-y-6">
              <input type="text" placeholder="Título do Livro" className="w-full p-4 bg-gray-50 rounded-2xl outline-none font-bold" value={bookForm.title} onChange={e => setBookForm({ ...bookForm, title: e.target.value })} />
              <input type="text" placeholder="Autor" className="w-full p-4 bg-gray-50 rounded-2xl outline-none font-bold" value={bookForm.author} onChange={e => setBookForm({ ...bookForm, author: e.target.value })} />
              <div className="grid grid-cols-2 gap-4">
                <select className="w-full p-4 bg-gray-50 rounded-2xl outline-none font-bold" value={bookForm.category} onChange={e => setBookForm({ ...bookForm, category: e.target.value })}>
                  <option value="Teologia">Teologia</option>
                  <option value="Vida Cristã">Vida Cristã</option>
                  <option value="Liderança">Liderança</option>
                  <option value="Escatologia">Escatologia</option>
                </select>
                {/* FIX: Changed ...formData to ...bookForm on the line below */}
                <input type="number" placeholder="Qtd" className="w-full p-4 bg-gray-50 rounded-2xl outline-none font-bold" value={bookForm.quantity} onChange={e => setBookForm({ ...bookForm, quantity: Number(e.target.value) })} />
              </div>
            </div>
            <div className="p-8 border-t bg-gray-50 flex gap-4">
              <button onClick={() => setShowModal(false)} className="flex-1 py-4 text-[10px] font-black uppercase text-gray-400">Cancelar</button>
              <button onClick={handleSaveBook} className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase shadow-xl flex items-center justify-center gap-2 transition-all active:scale-95"><Save size={18} /> Salvar Obra</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LibraryPage;
