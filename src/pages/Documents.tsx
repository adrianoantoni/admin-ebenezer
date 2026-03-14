import React, { useState, useMemo } from 'react';
import SEO from '../components/Common/SEO';
import { useApp } from '../context/AppContext.tsx';
import {
  FileText, Award, Printer, ChevronRight, X, Church,
  ShieldCheck, Mail, UserPlus, Send, Search, ChevronLeft,
  CheckCircle2, Clock, Filter
} from 'lucide-react';
import { Member } from '../core/types';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { DocumentTemplate } from '../components/DocumentTemplate';
import AvatarPlaceholder from '../components/AvatarPlaceholder';
import Pagination from '../components/Pagination';

const MEMBERS_PER_PAGE = 5;

const Documents: React.FC = () => {
  const { state } = useApp();
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);

  const filteredMembers = state.members.filter(m =>
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.bi.includes(searchTerm)
  );

  const totalPages = Math.ceil(filteredMembers.length / MEMBERS_PER_PAGE);
  const paginatedMembers = filteredMembers.slice((currentPage - 1) * MEMBERS_PER_PAGE, currentPage * MEMBERS_PER_PAGE);

  const selectedMember = state.members.find(m => m.id === selectedMemberId);

  const docTypes = [
    { id: 'baptism', label: 'Certificado de Batismo', icon: Award, color: 'text-blue-600', bg: 'bg-blue-50' },
    { id: 'member', label: 'Certificado de Membresia', icon: ShieldCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { id: 'transfer', label: 'Carta de Transferência', icon: Send, color: 'text-purple-600', bg: 'bg-purple-50' },
    { id: 'registration', label: 'Ficha de Cadastro', icon: UserPlus, color: 'text-amber-600', bg: 'bg-amber-50' },
  ];

  const handlePrint = () => window.print();

  const handleGeneratePDF = async () => {
    if (!selectedMember || !selectedDoc) return;
    setIsGenerating(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 100));

      const element = document.getElementById('hidden-doc-template');
      if (!element) throw new Error('Template element not found');

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      const imgWidth = 297;
      const imgHeight = 210;

      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      const pdfBlob = pdf.output('bloburl');
      window.open(pdfBlob, '_blank');

    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Erro ao gerar PDF. Tente novamente.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <SEO title="Documentos" description="Emissão de certificados, cartas e documentos eclesiásticos." />
      <style>{`
        @media print {
          @page { size: A4 landscape; margin: 0; }
          body * { visibility: hidden !important; }
          #doc-print-area, #doc-print-area * { visibility: visible !important; display: block !important; }
          #doc-print-area {
            position: fixed !important; left: 0 !important; top: 0 !important;
            width: 297mm !important; height: 210mm !important;
            background: white !important; z-index: 9999999 !important;
            padding: 0 !important; margin: 0 !important;
          }
        }
      `}</style>

      <header className="no-print">
        <h1 className="text-4xl font-black text-gray-800 tracking-tight">Emissão de Documentos</h1>
        <p className="text-gray-500 font-medium italic">Gerador de certificados e declarações oficiais ministeriais.</p>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 no-print">
        <div className="xl:col-span-4 space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-8">1. Selecione o Documento</h3>
            <div className="space-y-3">
              {docTypes.map(doc => (
                <button
                  key={doc.id}
                  onClick={() => setSelectedDoc(doc.id)}
                  className={`w-full p-5 rounded-2xl border-2 transition-all flex items-center gap-4 text-left ${selectedDoc === doc.id
                    ? 'bg-blue-600 border-blue-600 text-white shadow-xl translate-x-2'
                    : 'bg-gray-50 border-transparent text-gray-500 hover:bg-white hover:border-blue-100'
                    }`}
                >
                  <div className={`p-3 rounded-xl ${selectedDoc === doc.id ? 'bg-white/20' : doc.bg}`}>
                    <doc.icon size={20} className={selectedDoc === doc.id ? 'text-white' : doc.color} />
                  </div>
                  <span className="text-[11px] font-black uppercase tracking-widest">{doc.label}</span>
                </button>
              ))}
            </div>
          </div>

          {selectedMember && selectedDoc && (
            <div className="bg-blue-900 p-8 rounded-[2.5rem] text-white shadow-2xl animate-in slide-in-from-left">
              <CheckCircle2 size={32} className="text-amber-400 mb-6" />
              <h4 className="text-lg font-black mb-2">Pronto para Gerar!</h4>
              <p className="text-xs text-blue-200 font-medium leading-relaxed mb-8">O documento para <span className="text-white font-bold">{selectedMember.name}</span> foi configurado com sucesso.</p>
              <button
                onClick={handleGeneratePDF}
                disabled={isGenerating}
                className="w-full py-4 bg-amber-400 text-blue-950 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating ? (
                  <div className="w-4 h-4 border-2 border-blue-950/30 border-t-blue-950 rounded-full animate-spin"></div>
                ) : (
                  <><Printer size={18} /> Visualizar e Imprimir (PDF)</>
                )}
              </button>
            </div>
          )}
        </div>

        <div className="xl:col-span-8 bg-white rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden flex flex-col">
          <div className="p-8 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-black text-gray-800">2. Escolha o Membro</h3>
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Base Ministerial Ativa</p>
            </div>
            <div className="relative w-full md:w-72">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
              <input
                type="text"
                placeholder="Pesquisar por nome ou BI..."
                className="w-full pl-11 pr-4 py-3 bg-gray-50 border-none rounded-2xl outline-none text-xs font-bold"
                value={searchTerm}
                onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              />
            </div>
          </div>

          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-8 py-5 text-[10px] font-black uppercase text-gray-400 tracking-widest">Identificação</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase text-gray-400 tracking-widest">Cargo</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase text-gray-400 tracking-widest text-center">Status</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase text-gray-400 tracking-widest text-right">Seleção</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paginatedMembers.map(m => (
                  <tr
                    key={m.id}
                    className={`hover:bg-blue-50/20 transition-colors cursor-pointer ${selectedMemberId === m.id ? 'bg-blue-50' : ''}`}
                    onClick={() => setSelectedMemberId(m.id)}
                  >
                    <td className="px-8 py-4">
                      <div className="flex items-center gap-3">
                        <AvatarPlaceholder
                          name={m.name}
                          id={m.id}
                          photoUrl={m.photoUrl}
                          className="w-10 h-10 rounded-xl object-cover shadow-sm"
                        />
                        <div>
                          <p className="text-sm font-black text-gray-800">{m.name}</p>
                          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">BI: {m.bi}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-4 text-xs font-bold text-gray-500 uppercase">{m.role}</td>
                    <td className="px-8 py-4 text-center">
                      <span className={`px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${m.status === 'active' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                        }`}>
                        {m.status}
                      </span>
                    </td>
                    <td className="px-8 py-4 text-right">
                      <div className={`w-6 h-6 rounded-full border-4 mx-auto md:mr-0 flex items-center justify-center transition-all ${selectedMemberId === m.id ? 'bg-blue-600 border-blue-100' : 'bg-gray-100 border-transparent'
                        }`}>
                        {selectedMemberId === m.id && <CheckCircle2 size={12} className="text-white" />}
                      </div>
                    </td>
                  </tr>
                ))}
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
      </div>

      {isPreviewOpen && selectedMember && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-6 no-print">
          <div className="absolute inset-0 bg-blue-950/90 backdrop-blur-xl animate-in fade-in" onClick={() => setIsPreviewOpen(false)}></div>
          <div className="bg-white w-full max-w-5xl rounded-[3.5rem] shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in duration-300">
            <div className="p-8 border-b flex justify-between items-center bg-gray-50">
              <div>
                <h3 className="text-xl font-black">Visualização Ministerial</h3>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Conferência de Dados Antes da Impressão</p>
              </div>
              <button onClick={() => setIsPreviewOpen(false)} className="p-2 hover:bg-white rounded-full"><X size={24} /></button>
            </div>

            <div className="p-12 overflow-y-auto bg-gray-200 flex justify-center">
              <div id="doc-print-area" className="flex justify-center">
                <DocumentTemplate
                  member={selectedMember}
                  type={selectedDoc}
                  churchSettings={state.churchSettings}
                  transactions={state.transactions.filter(t => t.memberId === selectedMemberId)}
                />
              </div>
            </div>

            <div className="p-10 border-t bg-gray-50 flex justify-end gap-4">
              <button onClick={() => setIsPreviewOpen(false)} className="px-8 py-4 bg-gray-100 text-gray-400 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-gray-200">Fechar</button>
              <button onClick={handlePrint} className="px-12 py-5 bg-blue-700 text-white rounded-2xl font-black uppercase tracking-widest flex items-center gap-3 shadow-xl hover:bg-blue-800 transition-all active:scale-95"><Printer size={20} /> Confirmar Impressão</button>
            </div>
          </div>
        </div>
      )}

      {selectedMember && selectedDoc && (
        <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
          <div id="hidden-doc-template">
            <DocumentTemplate
              member={selectedMember}
              type={selectedDoc}
              churchSettings={state.churchSettings}
              transactions={state.transactions.filter(t => t.memberId === selectedMemberId)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Documents;
