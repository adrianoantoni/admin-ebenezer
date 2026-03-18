import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../context/AppContext';
import { GoogleGenAI } from "@google/genai";
import {
  TrendingUp, Calendar, Users, Package, Activity,
  Printer, Sparkles, BrainCircuit, Church,
  CheckCircle2, ArrowRight, BarChart3, AlertCircle,
  TrendingDown, Info, ShieldCheck, FileText, UserPlus, CircleDot, Download, Search, Filter, RefreshCcw, LayoutDashboard, Database, Mail
} from 'lucide-react';
import SEO from '../components/Common/SEO';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, AreaChart, Area, Cell, Legend, PieChart, Pie
} from 'recharts';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

const MONTH_NAMES = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez"
];

const Reports: React.FC = () => {
  const { state } = useApp();
  const [activeTab, setActiveTab] = useState<'finance' | 'members' | 'assets' | 'events' | 'tithes'>('finance');
  const [period, setPeriod] = useState<'monthly' | 'quarterly' | 'semiannual' | 'annual'>('annual');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [availableYears, setAvailableYears] = useState<number[]>([new Date().getFullYear()]);
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Buscar anos disponíveis do backend
  useEffect(() => {
    const fetchYears = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/fiscal-years', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const anos = await res.json();
          setAvailableYears(anos.map((a: any) => a.ano));

          // Buscar ano ativo
          const activeRes = await fetch('/api/fiscal-years/active', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (activeRes.ok) {
            const anoAtivo = await activeRes.json();
            setSelectedYear(anoAtivo.ano);
          }
        }
      } catch (error) {
        console.error('Erro ao buscar anos:', error);
      }
    };
    fetchYears();
  }, []);

  // Ativar ano ao trocar seleção
  const handleYearChange = async (year: number) => {
    try {
      const token = localStorage.getItem('token');
      // Buscar o ID do ano fiscal
      const res = await fetch('/api/fiscal-years', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const anos = await res.json();
        const anoFiscal = anos.find((a: any) => a.ano === year);
        if (anoFiscal) {
          // Ativar o ano
          await fetch(`/api/fiscal-years/${anoFiscal.idAno}/activate`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          setSelectedYear(year);
        }
      }
    } catch (error) {
      console.error('Erro ao ativar ano:', error);
    }
  };

  // Lógica de BI Financeiro Consolidado com Agregação por Período
  const financeSummary = useMemo(() => {
    const monthlyData = MONTH_NAMES.map((name, index) => {
      const monthNum = index + 1;
      const monthTrans = state.transactions.filter(t => t.month === monthNum && t.year === selectedYear);
      const paidTrans = monthTrans.filter(t => !t.status || t.status === 'PAGO');

      const tithes = paidTrans.filter(t => t.type === 'TITHES').reduce((acc, t) => acc + t.amount, 0);
      const offerings = paidTrans.filter(t => t.type === 'OFFERING').reduce((acc, t) => acc + t.amount, 0);
      const expenses = monthTrans.filter(t => t.type === 'EXPENSE').reduce((acc, t) => acc + t.amount, 0);

      const pending = state.members.reduce((acc, member) => {
        const hasPaid = paidTrans.some(t =>
          t.memberId === member.id &&
          (t.type === 'TITHES')
        );

        if (!hasPaid) {
          const entryDate = new Date(member.conversionDate || '2000-01-01');
          const checkDate = new Date(selectedYear, monthNum - 1, 1);
          if (checkDate >= new Date(entryDate.getFullYear(), entryDate.getMonth(), 1)) {
            const isEligibleForTithe = ['TRABALHADOR', 'NEGOCIO', 'COMERCIANTE'].includes(member.employmentStatus || '');
            const valorDevido = isEligibleForTithe 
              ? (member.expectedTithe && member.expectedTithe > 0 ? member.expectedTithe : 1000)
              : 0;
            return acc + valorDevido;
          }
        }
        return acc;
      }, 0);

      return {
        name,
        monthIndex: index,
        dizimos: tithes,
        ofertas: offerings,
        despesas: expenses,
        pendente: pending,
        totalReceita: tithes + offerings,
        saldo: (tithes + offerings) - expenses
      };
    });

    if (period === 'annual' || period === 'monthly') return monthlyData;

    if (period === 'quarterly') {
      const quarters = ["1º Trimestre", "2º Trimestre", "3º Trimestre", "4º Trimestre"];
      return quarters.map((name, i) => {
        const start = i * 3;
        const months = monthlyData.slice(start, start + 3);
        return {
          name,
          dizimos: months.reduce((acc, m) => acc + m.dizimos, 0),
          ofertas: months.reduce((acc, m) => acc + m.ofertas, 0),
          despesas: months.reduce((acc, m) => acc + m.despesas, 0),
          pendente: months.reduce((acc, m) => acc + m.pendente, 0),
          totalReceita: months.reduce((acc, m) => acc + m.totalReceita, 0),
          saldo: months.reduce((acc, m) => acc + m.saldo, 0)
        };
      });
    }

    if (period === 'semiannual') {
      const semesters = ["1º Semestre", "2º Semestre"];
      return semesters.map((name, i) => {
        const start = i * 6;
        const months = monthlyData.slice(start, start + 6);
        return {
          name,
          dizimos: months.reduce((acc, m) => acc + m.dizimos, 0),
          ofertas: months.reduce((acc, m) => acc + m.ofertas, 0),
          despesas: months.reduce((acc, m) => acc + m.despesas, 0),
          pendente: months.reduce((acc, m) => acc + m.pendente, 0),
          totalReceita: months.reduce((acc, m) => acc + m.totalReceita, 0),
          saldo: months.reduce((acc, m) => acc + m.saldo, 0)
        };
      });
    }

    return monthlyData;
  }, [state.transactions, state.members, selectedYear, period]);

  // BI de Membros
  const memberStats = useMemo(() => {
    const total = state.members.length;
    const active = state.members.filter(m => m.status === 'active').length;
    const inactive = total - active;

    const roleDist = state.members.reduce((acc: any, m) => {
      acc[m.role] = (acc[m.role] || 0) + 1;
      return acc;
    }, {});

    const pieData = Object.entries(roleDist).map(([name, value]) => ({ name, value }));

    return { total, active, inactive, pieData };
  }, [state.members]);

  // Análise de Dízimos
  const titheAnalysis = useMemo(() => {
    return state.members.map(member => {
      // Determinar o intervalo de meses com base no período
      let startMonth = 1;
      let endMonth = 12;

      if (period === 'monthly') {
        const now = new Date();
        startMonth = now.getMonth() + 1;
        endMonth = startMonth;
      } else if (period === 'quarterly') {
        const q = Math.floor(new Date().getMonth() / 3);
        startMonth = (q * 3) + 1;
        endMonth = startMonth + 2;
      } else if (period === 'semiannual') {
        const s = new Date().getMonth() < 6 ? 0 : 1;
        startMonth = (s * 6) + 1;
        endMonth = startMonth + 5;
      }

      // Se for ano atual, não olhar para o futuro
      const today = new Date();
      if (selectedYear === today.getFullYear()) {
        endMonth = Math.min(endMonth, today.getMonth() + 1);
      }

      const memberTithings = state.transactions.filter(t =>
        t.memberId === member.id &&
        t.year === selectedYear &&
        t.type === 'TITHES' &&
        t.month >= startMonth &&
        t.month <= endMonth &&
        (!t.status || t.status === 'PAGO')
      );

      const monthsPaid = new Set(memberTithings.map(t => t.month)).size;
      const totalPaid = memberTithings.reduce((acc, t) => acc + t.amount, 0);
      
      let monthsUnpaid = 0;
      let totalPending = 0;

      for (let m = startMonth; m <= endMonth; m++) {
        const hasPaid = memberTithings.some(t => t.month === m);
        if (!hasPaid) {
          const entryDate = new Date(member.conversionDate || '2000-01-01');
          const checkDate = new Date(selectedYear, m - 1, 1);
          const startOfEntryMonth = new Date(entryDate.getFullYear(), entryDate.getMonth(), 1);
          
          if (checkDate >= startOfEntryMonth) {
            const isEligibleForTithe = ['TRABALHADOR', 'NEGOCIO', 'COMERCIANTE'].includes(member.employmentStatus || '');
            if (isEligibleForTithe) {
              monthsUnpaid++;
              const titheValue = member.expectedTithe && member.expectedTithe > 0 ? member.expectedTithe : 1000;
              totalPending += titheValue;
            }
          }
        }
      }

      const monthStatus = Array.from({ length: 12 }, (_, i) => {
        const m = i + 1;
        const hasPaid = memberTithings.some(t => t.month === m);
        const entryDate = new Date(member.conversionDate || '2000-01-01');
        const checkDate = new Date(selectedYear, i, 1);
        const startOfEntryMonth = new Date(entryDate.getFullYear(), entryDate.getMonth(), 1);
        
        let status: 'paid' | 'pending' | 'future' = 'future';
        if (hasPaid) status = 'paid';
        else if (checkDate >= startOfEntryMonth && checkDate <= today) status = 'pending';
        
        return { month: m, status };
      });

      return {
        id: member.id,
        name: member.name,
        monthsPaid,
        monthsUnpaid,
        totalPaid,
        totalPending,
        expectedTithe: member.expectedTithe || 0,
        monthStatus
      };
    });
  }, [state.members, state.transactions, selectedYear, period]);

  const titheTotals = useMemo(() => {
    return titheAnalysis.reduce((acc, cur) => ({
      monthsPaid: acc.monthsPaid + cur.monthsPaid,
      monthsUnpaid: acc.monthsUnpaid + cur.monthsUnpaid,
      totalPaid: acc.totalPaid + cur.totalPaid,
      totalPending: acc.totalPending + cur.totalPending,
      overall: acc.overall + cur.totalPaid + cur.totalPending
    }), { monthsPaid: 0, monthsUnpaid: 0, totalPaid: 0, totalPending: 0, overall: 0 });
  }, [titheAnalysis]);

  const totals = useMemo(() => {
    return financeSummary.reduce((acc, cur) => ({
      dizimos: acc.dizimos + cur.dizimos,
      ofertas: acc.ofertas + cur.ofertas,
      pendente: acc.pendente + cur.pendente,
      despesas: acc.despesas + cur.despesas,
      totalReceita: acc.totalReceita + cur.totalReceita,
      saldo: acc.saldo + cur.saldo
    }), { dizimos: 0, ofertas: 0, pendente: 0, despesas: 0, totalReceita: 0, saldo: 0 });
  }, [financeSummary]);

  const handleAiAnalysis = async () => {
    setIsGeneratingAi(true);
    setAiInsight(null);
    try {
      const ai = new GoogleGenAI({ apiKey: (process.env.API_KEY || process.env.GEMINI_API_KEY) as string });
      const prompt = `
        Aja como um Consultor Analítico Sênior para a {state.churchSettings?.nomeIgreja || 'Igreja Baptista da Sapú'}. 
        Com base nos dados consolidados do ano ${selectedYear}, gere um RELATÓRIO EXECUTIVO DE GESTÃO ESTRATÉGICA para ser apresentado na reunião dos representantes da empresa.

        PONTOS DE DADOS CHAVE:
        - Receita Bruta Consolidada: ${totals.totalReceita.toLocaleString()} Kz
        - Composição da Receita: Dízimos (${totals.dizimos.toLocaleString()} Kz) | Ofertas (${totals.ofertas.toLocaleString()} Kz)
        - Despesas Operacionais Totais: ${totals.despesas.toLocaleString()} Kz
        - Índice de Inadimplência (Dízimos Pendentes): ${totals.pendente.toLocaleString()} Kz
        - Superávit/Déficit Líquido: ${totals.saldo.toLocaleString()} Kz
        - Crescimento de Membresia: ${state.members.length} totais, sendo ${memberStats.active} ativos.

        A ESTRUTURA DO RELATÓRIO DEVE SEGUIR:
        1. PARECER EXECUTIVO: Resumo de alto nível da saúde financeira da organização.
        2. ANÁLISE DE EFICIÊNCIA OPERACIONAL: Como as despesas estão impactando a sustentabilidade?
        3. ESTRATÉGIA DE RETENÇÃO E ENGAJAMENTO: Projeções baseadas na membresia ativa vs inadimplência.
        4. MATRIZ DE RISCO: Identificar ameaças financeiras de curto prazo (Ex: desproporção despesas/receitas).
        5. RECOMENDAÇÕES ESTRATÉGICAS: 3 ações imediatas para otimização de recursos.

        O tom deve ser profissional, direto, analítico e formal. Use tópicos e seções bem definidas.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-1.5-flash',
        contents: [{ role: 'user', parts: [{ text: prompt }] }]
      });
      setAiInsight(response.candidates?.[0]?.content?.parts?.[0]?.text || "Sem resposta da IA.");
    } catch (error) {
      setAiInsight("Falha ao processar análise inteligente.");
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleDownloadPDF = async () => {
    // Para o "Baixar PDF" principal, agora sempre usamos a IMPRESSÃO NATIVA
    // É o método mais robusto, suporta multi-página perfeitamente e evita arquivos corrompidos.
    const element = document.getElementById('full-report-print-view');
    if (!element) return;

    setIsGeneratingPdf(true);

    try {
      // Pequeno delay para garantir que o estado de "Gerando..." seja percebido
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Acionar impressão nativa do navegador
      window.print();
    } catch (error) {
      console.error('Erro ao acionar impressão', error);
      alert('Erro ao abrir janela de impressão.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleDownloadExpensesPDF = async () => {
    setIsGeneratingPdf(true);

    try {
      // Buscar todas as saídas do ano selecionado
      const token = localStorage.getItem('token');
      const res = await fetch('/api/finance/expenses', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) {
        throw new Error('Erro ao buscar saídas');
      }

      const allExpenses = await res.json();
      const yearExpenses = allExpenses.filter((e: any) => e.year === selectedYear);

      // Agrupar por mês
      const monthlyExpenses = MONTH_NAMES.map((monthName, idx) => {
        const monthNum = idx + 1;
        const monthItems = yearExpenses.filter((e: any) => e.month === monthNum);
        const total = monthItems.reduce((acc: number, e: any) => acc + e.amount, 0);
        return { monthName, items: monthItems, total };
      });

      const grandTotal = yearExpenses.reduce((acc: number, e: any) => acc + e.amount, 0);

      // Criar PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      pdf.setProperties({
        title: `Relatório de Saídas - ${selectedYear}`,
        author: `${state.churchSettings?.nomeIgreja || 'Igreja Baptista da Sapú'} System`
      });
      pdf.setFontSize(18);
      pdf.text(`Relatório de Saídas - ${selectedYear}`, 20, 20);

      pdf.setFontSize(10);
      let yPos = 35;

      monthlyExpenses.forEach((month) => {
        if (month.items.length === 0) return;

        // Verificar se precisa de nova página
        if (yPos > 270) {
          pdf.addPage();
          yPos = 20;
        }

        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`${month.monthName} - Total: ${month.total.toLocaleString()} Kz`, 20, yPos);
        yPos += 7;

        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');

        month.items.forEach((item: any) => {
          if (yPos > 280) {
            pdf.addPage();
            yPos = 20;
          }

          const line = `  ${item.date} | ${item.category} | ${item.amount.toLocaleString()} Kz | ${item.method}`;
          pdf.text(line, 25, yPos);
          yPos += 5;

          if (item.description) {
            pdf.setFont('helvetica', 'italic');
            pdf.text(`    ${item.description.substring(0, 80)}`, 25, yPos);
            pdf.setFont('helvetica', 'normal');
            yPos += 5;
          }
        });

        yPos += 5;
      });

      // Total geral
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`TOTAL ANUAL: ${grandTotal.toLocaleString()} Kz`, 20, yPos + 10);

      // Salvar via Blob
      const blob = pdf.output('blob');
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Saidas_${selectedYear}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erro ao gerar PDF de saídas:', error);
      alert('Erro ao gerar PDF de saídas');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleDownloadDebtPDF = async () => {
    setIsGeneratingPdf(true);

    try {
      const debtors = state.members.map(member => {
        let totalPendingAmount = 0;
        let pendingMonthsCount = 0;
        const pendingMonthsList: string[] = [];

        // Verificar cada mês do ano selecionado até o mês atual
        const currentMonth = new Date().getFullYear() === selectedYear ? new Date().getMonth() + 1 : 12;

        for (let m = 1; m <= currentMonth; m++) {
          const hasPaid = state.transactions.some(t =>
            t.memberId === member.id &&
            t.month === m &&
            t.year === selectedYear &&
            t.type === 'TITHES'
          );

          if (!hasPaid) {
            const entryDate = new Date(member.conversionDate || '2000-01-01');
            const checkDate = new Date(selectedYear, m - 1, 1);
            if (checkDate >= new Date(entryDate.getFullYear(), entryDate.getMonth(), 1)) {
              const isEligibleForTithe = ['TRABALHADOR', 'NEGOCIO', 'COMERCIANTE'].includes(member.employmentStatus || '');
              
              if (isEligibleForTithe) {
                // Aplica o mesmo fallback da UI (1000 Kz se não houver dizimo esperado definido)
                const valorDevido = member.expectedTithe && member.expectedTithe > 0 
                  ? member.expectedTithe 
                  : 1000;
                
                totalPendingAmount += valorDevido;
                pendingMonthsCount++;
                pendingMonthsList.push(MONTH_NAMES[m - 1]);
              }
            }
          }
        }

        return {
          name: member.name,
          pendingAmount: totalPendingAmount,
          monthsCount: pendingMonthsCount,
          months: pendingMonthsList
        };
      }).filter(d => d.pendingAmount > 0);

      const grandTotalDebt = debtors.reduce((acc, d) => acc + d.pendingAmount, 0);

      // Criar PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      pdf.setProperties({
        title: `Pendências de Dízimos - ${selectedYear}`,
        author: `${state.churchSettings?.nomeIgreja || 'Igreja Baptista da Sapú'} System`
      });
      pdf.setFontSize(20);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`Relatório de Dízimos Pendentes - ${selectedYear}`, 20, 20);

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Gerado em: ${new Date().toLocaleDateString()}`, 20, 28);

      let yPos = 40;

      // Cabeçalho da Tabela
      pdf.setFillColor(30, 58, 138); // Blue 900
      pdf.rect(20, yPos, 170, 8, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Membro', 25, yPos + 6);
      pdf.text('Meses', 110, yPos + 6);
      pdf.text('Total a Pagar', 160, yPos + 6, { align: 'right' });

      yPos += 13;
      pdf.setTextColor(0, 0, 0);
      pdf.setFont('helvetica', 'normal');

      debtors.forEach((debtor, index) => {
        if (yPos > 270) {
          pdf.addPage();
          yPos = 20;
        }

        pdf.text(debtor.name, 25, yPos);
        pdf.text(debtor.monthsCount.toString(), 115, yPos);
        pdf.text(`${debtor.pendingAmount.toLocaleString()} Kz`, 185, yPos, { align: 'right' });

        pdf.setFontSize(8);
        pdf.setTextColor(220, 38, 38); // Text Red 600
        pdf.text(`Meses Pendentes: ${debtor.months.join(', ')}`, 25, yPos + 5);
        pdf.setFontSize(10);
        pdf.setTextColor(0, 0, 0);

        yPos += 12;
        pdf.setDrawColor(240, 240, 240);
        pdf.line(20, yPos - 8, 190, yPos - 8);
      });

      // Total Final
      yPos += 5;
      if (yPos > 270) {
        pdf.addPage();
        yPos = 20;
      }
      pdf.setFillColor(254, 243, 199); // Amber 100
      pdf.rect(20, yPos, 170, 12, 'F');
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0, 0, 0); // Garantir cor preta no texto do total
      pdf.text(`TOTAL PENDENTE GERAL:`, 25, yPos + 8);
      pdf.text(`${grandTotalDebt.toLocaleString()} Kz`, 185, yPos + 8, { align: 'right' });

      // Salvar via Blob
      const blob = pdf.output('blob');
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Pendencias_Dizimos_${selectedYear}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erro ao gerar PDF de dívidas:', error);
      alert('Erro ao gerar PDF de dívidas');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20 sm:p-0">
      <SEO title="Relatórios" description="Gere relatórios estatísticos e gerenciais da igreja." />
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 no-print">
        <div>
          <h1 className="text-4xl font-black text-gray-800 tracking-tight">Business Intelligence</h1>
          <p className="text-gray-500 font-medium italic">Monitoramento analítico e tendências ministeriais.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-white border-2 border-gray-100 rounded-2xl px-4 py-2 flex items-center gap-2 shadow-sm">
            <Filter size={18} className="text-purple-600" />
            <select value={period} onChange={e => setPeriod(e.target.value as any)} className="text-sm font-black bg-transparent outline-none">
              <option value="annual">Anual</option>
              <option value="semiannual">Semestral</option>
              <option value="quarterly">Trimestral</option>
              <option value="monthly">Mensal</option>
            </select>
          </div>
          <button onClick={handleDownloadPDF} className="p-4 bg-white border-2 border-gray-100 rounded-2xl text-gray-400 hover:text-blue-600 transition-all shadow-sm flex items-center gap-2">
            <Printer size={20} /> <span className="text-[10px] font-black uppercase tracking-widest hidden md:inline">Baixar PDF</span>
          </button>
          {activeTab === 'finance' && (
            <>
              <button onClick={handleDownloadExpensesPDF} className="p-4 bg-red-50 border-2 border-red-100 rounded-2xl text-red-600 hover:bg-red-600 hover:text-white transition-all shadow-sm flex items-center gap-2">
                <Download size={20} /> <span className="text-[10px] font-black uppercase tracking-widest hidden md:inline">PDF Saídas</span>
              </button>
              <button onClick={handleDownloadDebtPDF} className="p-4 bg-amber-50 border-2 border-amber-100 rounded-2xl text-amber-700 hover:bg-amber-600 hover:text-white transition-all shadow-sm flex items-center gap-2">
                <AlertCircle size={20} /> <span className="text-[10px] font-black uppercase tracking-widest hidden md:inline">PDF Dívidas</span>
              </button>
            </>
          )}
        </div>
      </header>

      <div className="flex items-center gap-3 no-print">
        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Ano Fiscal:</label>
        <div className="bg-white border-2 border-gray-100 rounded-xl px-3 py-1 flex items-center gap-2 shadow-sm">
          <Calendar size={14} className="text-blue-600" />
          <select value={selectedYear} onChange={e => handleYearChange(Number(e.target.value))} className="text-xs font-black bg-transparent outline-none">
            {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-white p-2 rounded-[2rem] border border-gray-100 shadow-sm flex flex-wrap gap-2 no-print">
        {[
          { id: 'finance', label: 'Finanças', icon: TrendingUp },
          { id: 'members', label: 'Membros', icon: Users },
          { id: 'tithes', label: 'Dízimos', icon: CheckCircle2 },
          { id: 'assets', label: 'Patrimônio', icon: Package },
          { id: 'events', label: 'Actividades', icon: Activity },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 min-w-[120px] flex items-center justify-center gap-3 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-50'
              }`}
          >
            <tab.icon size={18} /> {tab.label}
          </button>
        ))}
      </div>

      <div id="report-content" className="space-y-8 animate-in fade-in duration-500 bg-white p-8 md:p-12 rounded-[3.5rem] print:shadow-none shadow-sm border border-gray-100">
        {/* LOGO E HEADER DO RELATÓRIO - APENAS PRINT/PDF */}
        <div className="flex items-start justify-between mb-12 border-b-2 border-blue-900 pb-8">
          <div className="flex items-center gap-6">
            {state.churchSettings?.logo ? (
              <img src={state.churchSettings.logo} alt="Logo" className="w-24 h-24 object-contain" />
            ) : (
              <Church size={60} className="text-blue-900" />
            )}
            <div>
              <h1 className="text-3xl font-black text-blue-900 uppercase tracking-tight">{state.churchSettings?.nomeIgreja || 'Igreja Baptista da Sapú'}</h1>
              <p className="text-sm font-bold text-gray-500 italic mt-1">{state.churchSettings?.denominacao || 'Ministério de Evangelização'}</p>
              <div className="flex gap-4 mt-3">
                <div className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-[10px] font-black uppercase tracking-widest">Relatório {activeTab.toUpperCase()}</div>
                <div className="px-3 py-1 bg-amber-100 text-amber-700 rounded-lg text-[10px] font-black uppercase tracking-widest">Exercício {selectedYear}</div>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Data de Emissão</p>
            <p className="text-sm font-black text-gray-800">{new Date().toLocaleDateString('pt-BR')}</p>
          </div>
        </div>

        {activeTab === 'finance' && (
          <div className="space-y-12 animate-in slide-in-from-bottom-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 no-print">
              <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100 italic">
                <p className="text-[10px] font-black text-blue-900 uppercase tracking-widest mb-1">Dízimos</p>
                <p className="text-2xl font-black text-blue-600">{totals.dizimos.toLocaleString()} Kz</p>
              </div>
              <div className="bg-purple-50 p-6 rounded-3xl border border-purple-100 italic">
                <p className="text-[10px] font-black text-purple-900 uppercase tracking-widest mb-1">Ofertas</p>
                <p className="text-2xl font-black text-purple-600">{totals.ofertas.toLocaleString()} Kz</p>
              </div>
              <div className="bg-red-50 p-6 rounded-3xl border border-red-100 italic">
                <p className="text-[10px] font-black text-red-900 uppercase tracking-widest mb-1">Despesas</p>
                <p className="text-2xl font-black text-red-600">{totals.despesas.toLocaleString()} Kz</p>
              </div>
              <div className="bg-green-50 p-6 rounded-3xl border border-green-100 italic">
                <p className="text-[10px] font-black text-green-900 uppercase tracking-widest mb-1">Saldo Líquido</p>
                <p className="text-2xl font-black text-green-600">{totals.saldo.toLocaleString()} Kz</p>
              </div>
            </div>

            <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm">
              <h3 className="text-2xl font-black text-gray-800 mb-10">Balanço do Exercício {selectedYear} ({period === 'annual' ? 'Anual' : period === 'quarterly' ? 'Trimestral' : period === 'semiannual' ? 'Semestral' : 'Mensal'})</h3>
              <div className="h-[400px] min-h-[400px] w-full overflow-hidden">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} debounce={200}>
                  <AreaChart data={financeSummary}>
                    <defs>
                      <linearGradient id="colorRec" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#1e40af" stopOpacity={0.1} /><stop offset="95%" stopColor="#1e40af" stopOpacity={0} /></linearGradient>
                      <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ef4444" stopOpacity={0.1} /><stop offset="95%" stopColor="#ef4444" stopOpacity={0} /></linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} />
                    <Tooltip />
                    <Area type="monotone" dataKey="totalReceita" name="Receitas" stroke="#1e40af" fillOpacity={1} fill="url(#colorRec)" />
                    <Area type="monotone" dataKey="despesas" name="Despesas" stroke="#ef4444" fillOpacity={1} fill="url(#colorExp)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden">
              <h3 className="text-2xl font-black text-gray-800 mb-8 border-l-4 border-blue-600 pl-4 uppercase tracking-tight">Detalhamento Financeiro</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b-2 border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      <th className="py-4">Mês/Período</th>
                      <th className="py-4 text-right">Dízimos</th>
                      <th className="py-4 text-right">Ofertas</th>
                      <th className="py-4 text-right border-l border-gray-50 pl-4">Receita Total</th>
                      <th className="py-4 text-right">Despesas</th>
                      <th className="py-4 text-right bg-blue-50/50 px-4 rounded-t-xl">Saldo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {financeSummary.map((m, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/50 transition-colors group">
                        <td className="py-4 font-black text-gray-700">{m.name}</td>
                        <td className="py-4 text-right font-bold text-blue-600">{m.dizimos.toLocaleString()} Kz</td>
                        <td className="py-4 text-right font-bold text-purple-600">{m.ofertas.toLocaleString()} Kz</td>
                        <td className="py-4 text-right font-black text-indigo-900 border-l border-gray-50 pl-4">{(m.dizimos + m.ofertas).toLocaleString()} Kz</td>
                        <td className="py-4 text-right font-bold text-red-500">{m.despesas.toLocaleString()} Kz</td>
                        <td className={`py-4 text-right font-black px-4 ${m.saldo >= 0 ? 'text-green-600 bg-green-50/20' : 'text-red-700 bg-red-50/20'}`}>
                          {m.saldo.toLocaleString()} Kz
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-900 text-white rounded-b-2xl overflow-hidden">
                      <td className="py-6 px-4 font-black rounded-bl-3xl">TOTAL CONSOLIDADO</td>
                      <td className="py-6 text-right font-black text-blue-300">{totals.dizimos.toLocaleString()} Kz</td>
                      <td className="py-6 text-right font-black text-purple-300">{totals.ofertas.toLocaleString()} Kz</td>
                      <td className="py-6 text-right font-black text-indigo-200 border-l border-white/10 pl-4">{totals.totalReceita.toLocaleString()} Kz</td>
                      <td className="py-6 text-right font-black text-red-300">{totals.despesas.toLocaleString()} Kz</td>
                      <td className={`py-6 text-right font-black px-4 rounded-br-3xl text-xl ${totals.saldo >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {totals.saldo.toLocaleString()} Kz
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              <div className="mt-8 p-6 bg-blue-50 rounded-[2rem] border border-blue-100 flex items-center justify-between">
                <div>
                  <h4 className="text-[10px] font-black text-blue-900 uppercase tracking-widest mb-1">Saldo Líquido Presumido</h4>
                  <p className="text-gray-500 text-xs italic">Valor calculado com base em todas as entradas e saídas confirmadas do período.</p>
                </div>
                <div className="text-right">
                  <span className="text-3xl font-black text-green-600">{totals.saldo.toLocaleString()} Kz</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'tithes' && (
          <div className="space-y-12 animate-in slide-in-from-bottom-4">
            <header className="flex items-center justify-between no-print">
              <div>
                <h3 className="text-2xl font-black text-gray-800 tracking-tight">Análise Detalhada de Dízimos</h3>
                <p className="text-gray-500 text-sm italic">Monitoramento de adimplência e projeções financeiras por membro.</p>
              </div>
              <div className="flex gap-4">
                <div className="bg-green-50 px-6 py-3 rounded-2xl border border-green-100 flex flex-col items-end">
                  <span className="text-[8px] font-black text-green-700 uppercase tracking-widest">Total Arrecadado</span>
                  <span className="text-lg font-black text-green-600">{titheAnalysis.reduce((acc, a) => acc + a.totalPaid, 0).toLocaleString()} Kz</span>
                </div>
                <div className="bg-red-50 px-6 py-3 rounded-2xl border border-red-100 flex flex-col items-end">
                  <span className="text-[8px] font-black text-red-700 uppercase tracking-widest">Déficit Projetado</span>
                  <span className="text-lg font-black text-red-600">{titheAnalysis.reduce((acc, a) => acc + a.totalPending, 0).toLocaleString()} Kz</span>
                </div>
              </div>
            </header>

            <div className="bg-white rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                    <th className="py-6 px-8">Membro</th>
                    <th className="py-6 text-center">Status</th>
                    <th className="py-6 text-center">Meses Pagos</th>
                    <th className="py-6 text-center">Meses Pendentes</th>
                    <th className="py-6 text-right">Total Pago</th>
                    <th className="py-6 text-right px-8">Pendente</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {titheAnalysis.map((member) => (
                    <tr key={member.id} className="hover:bg-gray-50/50 transition-colors border-b border-gray-100 last:border-0">
                      <td className="py-5 px-8">
                        <div className="flex flex-col gap-2">
                          <p className="text-gray-900 font-black flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                            {member.name}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-[10px] text-gray-400 pl-4 italic">
                              Compromisso: {member.expectedTithe.toLocaleString()} Kz
                            </p>
                            <span className="text-[8px] px-2 py-0.5 bg-gray-100 text-gray-500 rounded font-black uppercase tracking-tighter">
                              {member.employmentStatus === 'TRABALHADOR' ? 'Trabalhador' :
                               member.employmentStatus === 'NEGOCIO' ? 'Negócio' :
                               member.employmentStatus === 'DESEMPREGADO' ? 'Desempregado' : 'Outro'}
                            </span>
                          </div>
                          <div className="flex gap-1 no-print pl-4">
                            {member.monthStatus.map((m, i) => (
                              <div 
                                key={i} 
                                title={MONTH_NAMES[i]}
                                className={`w-7 h-5 rounded-md flex items-center justify-center text-[7px] font-black transition-all ${
                                  m.status === 'paid' ? 'bg-green-600 text-white shadow-sm shadow-green-200' : 
                                  m.status === 'pending' ? 'bg-gray-100 text-gray-400 border border-gray-200' : 'bg-gray-50 text-gray-200'
                                }`}
                              >
                                {MONTH_NAMES[i].substring(0, 3).toUpperCase()}
                              </div>
                            ))}
                          </div>
                        </div>
                      </td>
                      <td className="py-5 text-center">
                        <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${member.monthsUnpaid === 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {member.monthsUnpaid === 0 ? 'ADIMPLENTE' : 'PENDENTE'}
                        </span>
                      </td>
                      <td className="py-5 text-center font-black text-blue-600">{member.monthsPaid}</td>
                      <td className="py-5 text-center font-black text-red-600">{member.monthsUnpaid}</td>
                      <td className="py-5 text-right font-black text-gray-800">{member.totalPaid.toLocaleString()} Kz</td>
                      <td className="py-5 text-right px-8 font-black text-red-600">{member.totalPending.toLocaleString()} Kz</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-100 font-black text-gray-800 italic">
                    <td className="py-6 px-8 border-t-2 border-gray-200">BALANÇO GERAL DO PERÍODO</td>
                    <td className="py-6 text-center border-t-2 border-gray-200">-</td>
                    <td className="py-6 text-center border-t-2 border-gray-200 text-blue-600 text-lg">{titheTotals.monthsPaid}</td>
                    <td className="py-6 text-center border-t-2 border-gray-200 text-red-600">
                      <p className="text-[7px] uppercase tracking-tighter opacity-50">Total Meses não Pago</p>
                      <span className="text-xl">{titheTotals.monthsUnpaid}</span>
                    </td>
                    <td className="py-6 text-right border-t-2 border-gray-200 text-lg">{titheTotals.totalPaid.toLocaleString()} Kz</td>
                    <td className="py-6 text-right px-8 border-t-2 border-gray-200 text-red-600">
                      <p className="text-[7px] uppercase tracking-tighter opacity-50">Total Dívida Pendente (Kz)</p>
                      <span className="text-xl">{titheTotals.totalPending.toLocaleString()} Kz</span>
                    </td>
                  </tr>
                  <tr className="bg-blue-900 text-white">
                    <td colSpan={4} className="py-4 px-8 rounded-bl-3xl">PATRIMÔNIO PROJETADO (PAGO + PENDENTE):</td>
                    <td colSpan={2} className="py-4 px-8 text-right text-xl font-black rounded-br-3xl text-amber-400">
                      {titheTotals.overall.toLocaleString()} Kz
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 no-print">
              <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
                <h4 className="text-lg font-black text-gray-800 mb-6">Métricas de Engajamento</h4>
                <div className="space-y-4">
                  {[
                    { label: 'Total de Membros Analisados', value: titheAnalysis.length, color: 'blue' },
                    { label: 'Membros 100% Adimplentes', value: titheAnalysis.filter(a => a.monthsUnpaid === 0).length, color: 'green' },
                    { label: 'Membros com Pendências', value: titheAnalysis.filter(a => a.monthsUnpaid > 0).length, color: 'amber' },
                  ].map((stat, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                      <span className="text-xs font-bold text-gray-500">{stat.label}</span>
                      <span className={`text-lg font-black text-${stat.color}-600`}>{stat.value}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-gradient-to-br from-blue-900 to-indigo-900 p-8 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden">
                <div className="relative z-10">
                  <h4 className="text-lg font-black mb-4">Eficiência de Arrecadação</h4>
                  <p className="text-sm opacity-70 mb-8 leading-relaxed">A arrecadação atual representa <strong>{((titheAnalysis.reduce((acc, a) => acc + a.totalPaid, 0) / (titheAnalysis.reduce((acc, a) => acc + a.totalPaid, 0) + titheAnalysis.reduce((acc, a) => acc + a.totalPending, 0)) || 1) * 100).toFixed(1)}%</strong> do potencial máximo estimado para o período selecionado.</p>
                  <div className="w-full bg-white/10 h-4 rounded-full overflow-hidden">
                    <div 
                      className="bg-amber-400 h-full rounded-full transition-all duration-1000" 
                      style={{ width: `${(titheAnalysis.reduce((acc, a) => acc + a.totalPaid, 0) / (titheAnalysis.reduce((acc, a) => acc + a.totalPaid, 0) + titheAnalysis.reduce((acc, a) => acc + a.totalPending, 0)) || 0) * 100}%` }}
                    />
                  </div>
                </div>
                <Activity className="absolute -right-8 -bottom-8 w-48 h-48 opacity-10" />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'members' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in slide-in-from-bottom-4">
            <div className="lg:col-span-2 bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm">
              <h3 className="text-xl font-black text-gray-800 mb-8">Distribuição Hierárquica</h3>
              <div className="h-[300px] min-h-[300px] w-full overflow-hidden">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} debounce={200}>
                  <BarChart data={memberStats.pieData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#1e40af" radius={[10, 10, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center">
              <CircleDot size={48} className="text-blue-600 mb-6" />
              <h3 className="text-4xl font-black text-gray-800 mb-2">{memberStats.total}</h3>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Membros Registrados</p>
              <div className="w-full mt-10 space-y-4">
                <div className="flex justify-between p-4 bg-green-50 rounded-2xl">
                  <span className="text-xs font-black text-green-700">ATIVOS</span>
                  <span className="text-xs font-black text-green-700">{memberStats.active}</span>
                </div>
                <div className="flex justify-between p-4 bg-gray-50 rounded-2xl">
                  <span className="text-xs font-black text-gray-500">INATIVOS</span>
                  <span className="text-xs font-black text-gray-500">{memberStats.inactive}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {(activeTab === 'assets' || activeTab === 'events') && (
          <div className="p-20 text-center bg-white rounded-[3rem] border border-gray-100 border-dashed">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Sparkles size={32} className="text-blue-200" />
            </div>
            <h3 className="text-xl font-black text-gray-800">Módulo Analítico em Processamento</h3>
            <p className="text-gray-400 text-sm">Estamos compilando os dados de patrimônio e actividades para gerar gráficos preditivos.</p>
          </div>
        )}
      </div>

      {/* VIEW DE IMPRESSÃO CONSOLIDADA - PORTAL PARA FORA DO ROOT */}
      {createPortal(
        <div id="full-report-print-view" className="hidden print:block bg-white p-0 text-gray-900 font-sans w-full">
          <style dangerouslySetInnerHTML={{
            __html: `
            @media print {
              html, body { 
                margin: 0 !important; 
                padding: 0 !important; 
                background: white !important; 
                height: auto !important; 
                overflow: visible !important; 
              }
              #root { display: none !important; }
              #full-report-print-view { 
                display: block !important;
                position: static !important;
                width: 100% !important;
                margin: 0 !important;
                padding: 20px !important;
              }
              .no-print { display: none !important; }
              table { page-break-inside: auto; width: 100% !important; border-collapse: collapse; font-size: 10pt; }
              tr { page-break-inside: avoid; page-break-after: auto; }
              thead { display: table-header-group; }
              tfoot { display: table-footer-group; }
              .section-break { page-break-before: always; margin-top: 40px; }
              .chart-container { width: 100% !important; height: 350px !important; }
              h1, h2, h3 { color: #1e3a8a !important; margin-bottom: 20px; page-break-after: avoid; }
              th { background-color: #f3f4f6 !important; -webkit-print-color-adjust: exact; color-adjust: exact; }
              .bg-blue-900 { background-color: #1e3a8a !important; color: white !important; -webkit-print-color-adjust: exact; }
              .bg-amber-400 { background-color: #fbbf24 !important; color: #1e3a8a !important; -webkit-print-color-adjust: exact; }
            }
          `}} />

          {/* Header Identical to report-content */}
          <div className="flex items-start justify-between mb-12 border-b-4 border-blue-900 pb-8">
          <div className="flex items-center gap-6">
            {state.churchSettings?.logo ? (
              <img src={state.churchSettings.logo} alt="Logo" className="w-32 h-32 object-contain" />
            ) : (
              <Church size={80} className="text-blue-900" />
            )}
            <div>
              <h1 className="text-4xl font-black text-blue-900 uppercase tracking-tight">{state.churchSettings?.nomeIgreja || 'Igreja Baptista da Sapú'}</h1>
              <p className="text-lg font-bold text-gray-500 italic mt-1">{state.churchSettings?.denominacao || 'Ministério de Evangelização'}</p>
              <div className="mt-4 px-4 py-2 bg-blue-900 text-white rounded-xl text-xs font-black uppercase tracking-widest inline-block">
                RELATÓRIO CONSOLIDADO DE GESTÃO - {selectedYear}
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Data de Emissão</p>
            <p className="text-lg font-black text-gray-800">{new Date().toLocaleDateString('pt-BR')}</p>
          </div>
        </div>

        {/* Seção 1: Resumo Financeiro */}
        <div className="mb-12">
          <h2 className="text-2xl font-black border-l-8 border-blue-900 pl-4 mb-8">01. BALANÇO FINANCEIRO ({period.toUpperCase()})</h2>
          <div className="grid grid-cols-4 gap-4 mb-10">
            <div className="border-2 border-gray-100 p-4 rounded-2xl">
              <p className="text-[10px] font-bold text-gray-400 uppercase">Dízimos</p>
              <p className="text-xl font-black text-blue-600">{totals.dizimos.toLocaleString()} Kz</p>
            </div>
            <div className="border-2 border-gray-100 p-4 rounded-2xl">
              <p className="text-[10px] font-bold text-gray-400 uppercase">Ofertas</p>
              <p className="text-xl font-black text-purple-600">{totals.ofertas.toLocaleString()} Kz</p>
            </div>
            <div className="border-2 border-gray-100 p-4 rounded-2xl">
              <p className="text-[10px] font-bold text-gray-400 uppercase">Despesas</p>
              <p className="text-xl font-black text-red-600">{totals.despesas.toLocaleString()} Kz</p>
            </div>
            <div className="border-2 border-gray-100 p-4 rounded-2xl bg-gray-50">
              <p className="text-[10px] font-bold text-gray-400 uppercase">Saldo Líquido</p>
              <p className="text-xl font-black text-green-600">{totals.saldo.toLocaleString()} Kz</p>
            </div>
          </div>

          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-3 px-4 text-left font-black text-xs uppercase">Mês/Período</th>
                <th className="py-3 px-4 text-right font-black text-xs uppercase">Dízimos</th>
                <th className="py-3 px-4 text-right font-black text-xs uppercase">Ofertas</th>
                <th className="py-3 px-4 text-right font-black text-xs uppercase">Receita Total</th>
                <th className="py-3 px-4 text-right font-black text-xs uppercase">Despesas</th>
                <th className="py-3 px-4 text-right font-black text-xs uppercase">Saldo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {financeSummary.map((m, idx) => (
                <tr key={idx}>
                  <td className="py-3 px-4 font-bold">{m.name}</td>
                  <td className="py-3 px-4 text-right">{m.dizimos.toLocaleString()}</td>
                  <td className="py-3 px-4 text-right">{m.ofertas.toLocaleString()}</td>
                  <td className="py-3 px-4 text-right font-black">{(m.dizimos + m.ofertas).toLocaleString()}</td>
                  <td className="py-3 px-4 text-right text-red-600">{m.despesas.toLocaleString()}</td>
                  <td className={`py-3 px-4 text-right font-black ${m.saldo >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {m.saldo.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-blue-900 text-white">
                <td className="py-4 px-4 font-black">TOTAL</td>
                <td className="py-4 px-4 text-right font-black">{totals.dizimos.toLocaleString()}</td>
                <td className="py-4 px-4 text-right font-black">{totals.ofertas.toLocaleString()}</td>
                <td className="py-4 px-4 text-right font-black">{totals.totalReceita.toLocaleString()}</td>
                <td className="py-4 px-4 text-right font-black">{totals.despesas.toLocaleString()}</td>
                <td className="py-4 px-4 text-right font-black">{totals.saldo.toLocaleString()} Kz</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Seção 2: Detalhamento de Dízimos */}
        <div className="section-break">
          <h2 className="text-2xl font-black border-l-8 border-amber-500 pl-4 mb-8">02. DETALHAMENTO ANALÍTICO DE DÍZIMOS</h2>
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-3 px-4 text-left font-black text-xs uppercase">Membro</th>
                <th className="py-3 px-4 text-center font-black text-xs uppercase">Status</th>
                <th className="py-3 px-4 text-center font-black text-xs uppercase">Pagos</th>
                <th className="py-3 px-4 text-center font-black text-xs uppercase">Pendentes</th>
                <th className="py-3 px-4 text-right font-black text-xs uppercase">Total Pago</th>
                <th className="py-3 px-4 text-right font-black text-xs uppercase">Pendente (Kz)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {titheAnalysis.map((member) => (
                <tr key={member.id}>
                  <td className="py-4 px-4 border-b border-gray-100">
                    <p className="font-bold text-sm">{member.name}</p>
                    <div className="flex items-center gap-2 mb-2">
                      <p className="text-[8px] text-gray-400 italic">Compromisso: {member.expectedTithe.toLocaleString()} Kz</p>
                      <span className="text-[6px] px-1 bg-gray-100 text-gray-500 rounded font-black uppercase">
                        {member.employmentStatus === 'TRABALHADOR' ? 'Trab.' :
                         member.employmentStatus === 'NEGOCIO' ? 'Neg.' :
                         member.employmentStatus === 'DESEMPREGADO' ? 'Des.' : 'Outro'}
                      </span>
                    </div>
                    <div className="flex gap-1 mb-2">
                      {member.monthStatus.map((m, i) => (
                        <div 
                          key={i} 
                          className={`w-6 h-4 rounded-sm flex items-center justify-center text-[6px] font-black ${
                            m.status === 'paid' ? 'bg-green-600 text-white' : 
                            m.status === 'pending' ? 'bg-gray-300 text-gray-700' : 'bg-gray-100 text-gray-400'
                          }`}
                        >
                          {MONTH_NAMES[i].substring(0, 3).toUpperCase()}
                        </div>
                      ))}
                    </div>
                    {member.monthsUnpaid > 0 && (
                      <p className="text-[10px] font-bold text-red-600 mt-1 max-w-[200px] leading-tight">
                        <span className="opacity-70">Pendentes:</span> {member.monthStatus.map((m, i) => m.status === 'pending' ? MONTH_NAMES[i] : null).filter(Boolean).join(', ')}
                      </p>
                    )}
                  </td>
                  <td className="py-4 px-4 text-center border-b border-gray-100">
                    <span className={`text-[10px] font-black uppercase ${member.monthsUnpaid > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {member.monthsUnpaid === 0 ? 'ADIMPLENTE' : 'PENDENTE'}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-center font-bold border-b border-gray-100">{member.monthsPaid}</td>
                  <td className="py-4 px-4 text-center font-black text-red-600 border-b border-gray-100 text-lg">{member.monthsUnpaid}</td>
                  <td className="py-4 px-4 text-right border-b border-gray-100">{member.totalPaid.toLocaleString()}</td>
                  <td className="py-4 px-4 text-right font-black text-red-600 border-b border-gray-100 text-lg">{member.totalPending.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-200 font-black italic">
                <td colSpan={2} className="py-3 px-4">RESUMO ANALÍTICO:</td>
                <td className="py-3 px-4 text-center text-blue-800">{titheTotals.monthsPaid}</td>
                <td className="py-3 px-4 text-center text-red-600 border-l border-gray-100">
                  <p className="text-[6px] font-black uppercase tracking-tighter opacity-70">Total Meses não Pago</p>
                  <span className="text-sm font-black">{titheTotals.monthsUnpaid}</span>
                </td>
                <td className="py-3 px-4 text-right border-l border-gray-100">{titheTotals.totalPaid.toLocaleString()}</td>
                <td className="py-3 px-4 text-right text-red-600 border-l border-gray-100 bg-red-50/50">
                   <p className="text-[6px] font-black uppercase tracking-tighter opacity-70">Total Dívida Pendente (Kz)</p>
                   <span className="text-sm font-black">{titheTotals.totalPending.toLocaleString()}</span>
                </td>
              </tr>
              <tr className="bg-blue-900 text-white font-black">
                <td colSpan={4} className="py-4 px-4">VALOR TOTAL ESTIMADO (DÍZIMOS):</td>
                <td colSpan={2} className="py-4 px-4 text-right text-xl text-amber-400">
                  {titheTotals.overall.toLocaleString()} Kz
                </td>
              </tr>
            </tfoot>
          </table>
          <div className="mt-8 p-6 bg-gray-900 text-white rounded-2xl flex justify-between items-center">
            <span className="font-black uppercase tracking-widest text-xs">Eficiência de Arrecadação:</span>
            <span className="text-3xl font-black text-amber-400">
              {((titheAnalysis.reduce((acc, a) => acc + a.totalPaid, 0) / (titheAnalysis.reduce((acc, a) => acc + a.totalPaid, 0) + titheAnalysis.reduce((acc, a) => acc + a.totalPending, 0)) || 1) * 100).toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Resumo Executivo Final */}
        <div className="section-break mt-12 bg-gray-50 p-10 rounded-[3rem] border-2 border-blue-100">
          <h2 className="text-2xl font-black text-blue-900 mb-8 uppercase tracking-tight">III. Resumo Executivo Consolidado</h2>
          <div className="grid grid-cols-2 gap-16">
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6">Fluxo de Caixa (Financeiro)</p>
              <div className="space-y-4">
                <div className="flex justify-between text-sm font-medium"><span>Receita Mensal/Período:</span> <span className="font-black">{totals.totalReceita.toLocaleString()} Kz</span></div>
                <div className="flex justify-between text-sm font-medium text-red-600"><span>Despesa Mensal/Período:</span> <span className="font-black">{totals.despesas.toLocaleString()} Kz</span></div>
                <div className="flex justify-between text-xl font-black pt-6 border-t-2 border-gray-100">
                  <span>SALDO REAL:</span> 
                  <span className={totals.saldo >= 0 ? 'text-green-600' : 'text-red-600'}>{totals.saldo.toLocaleString()} Kz</span>
                </div>
              </div>
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6">Patrimônio em Dízimos</p>
              <div className="space-y-4">
                <div className="flex justify-between text-sm font-medium"><span>Total Pago (Membros):</span> <span className="font-black text-blue-600">{titheTotals.totalPaid.toLocaleString()} Kz</span></div>
                <div className="flex justify-between text-sm font-medium text-red-600"><span>Meses Pendentes:</span> <span className="font-black">{titheTotals.monthsUnpaid} mes(es)</span></div>
                <div className="flex justify-between text-sm font-medium text-red-600"><span>Total em Dívida:</span> <span className="font-black">{titheTotals.totalPending.toLocaleString()} Kz</span></div>
                <div className="flex justify-between text-xl font-black pt-6 border-t-2 border-gray-100">
                  <span>TOTAL ESTIMADO:</span> 
                  <span className="text-blue-900">{titheTotals.overall.toLocaleString()} Kz</span>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-10 p-6 bg-blue-900 text-white rounded-2xl flex justify-between items-center">
            <span className="font-black uppercase tracking-widest text-xs">Eficiência Global de Arrecadação:</span>
            <span className="text-2xl font-black text-amber-400">
              {((titheTotals.totalPaid / (titheTotals.totalPaid + titheTotals.totalPending) || 1) * 100).toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Footer for formal validation */}
        <div className="mt-20 pt-10 border-t-2 border-gray-200 flex justify-between italic text-gray-400 text-xs">
          <p>Documento gerado eletronicamente pelo sistema {state.churchSettings?.nomeIgreja || 'Igreja Baptista da Sapú'}.</p>
          <p>Assinatura do Tesoureiro/Responsável: __________________________________________</p>
        </div>
      </div>,
      document.body
      )}

      {isGeneratingPdf && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white p-12 rounded-[3.5rem] shadow-2xl border border-blue-50 flex flex-col items-center gap-8">
            <div className="w-20 h-20 border-8 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
            <div className="text-center">
              <h3 className="text-2xl font-black text-gray-800">Gerando Relatório PDF</h3>
              <p className="text-gray-400 font-medium">Capturando métricas e gráficos consolidados...</p>
            </div>
          </div>
        </div>
      )}

      <div className="mt-12 bg-[#1e3a8a] p-12 rounded-[4rem] text-white shadow-2xl relative overflow-hidden no-print">
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
          <BrainCircuit size={64} className="text-amber-400" />
          <div className="flex-1">
            <h2 className="text-3xl font-black mb-2">Relatório Executivo IA</h2>
            <p className="opacity-80 text-blue-100">Gere um parecer estratégico baseado nos dados analíticos consolidados.</p>
          </div>
          <button onClick={handleAiAnalysis} disabled={isGeneratingAi} className="px-10 py-5 bg-white text-blue-900 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-400 transition-all">
            {isGeneratingAi ? 'Processando...' : 'Compilar Dados com IA'}
          </button>
        </div>
        {aiInsight && <div className="mt-12 bg-white/10 p-10 rounded-[3rem] border border-white/10 text-sm leading-relaxed whitespace-pre-wrap">{aiInsight}</div>}
      </div>
    </div >
  );
};

export default Reports;
