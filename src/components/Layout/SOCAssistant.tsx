
import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { GoogleGenAI } from '@google/genai';
import { BrainCircuit, X, MessageSquare, Send, Sparkles, ExternalLink, Search } from 'lucide-react';

const SOCAssistant: React.FC = () => {
  const { state } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState<string | null>(null);
  const [sources, setSources] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleAsk = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setResponse(null);
    setSources([]);

    try {
      const ai = new GoogleGenAI({ apiKey: (process.env.API_KEY || process.env.GEMINI_API_KEY) as string });
      const context = `
        DADOS DA IGREJA ATUAIS:
        - Membros Totais: ${state.members.length}
        - Membros Ativos: ${state.members.filter(m => m.status === 'active').length}
        - Receita Total do Mês: ${state.transactions.filter(t => t.month === (new Date().getMonth() + 1)).reduce((a, b) => a + b.amount, 0)} Kz
        - Próximos Eventos: ${state.events.length}
        - Ativos de Patrimônio: ${state.assets.length}
        - Turmas de Escola Dominical: ${state.schoolClasses.length}

        PERGUNTA DO USUÁRIO: ${query}
        
        INSTRUÇÃO: Se a pergunta for sobre os dados acima, use-os. Se for teológica ou externa, use o Google Search para fundamentar sua resposta. Forneça uma resposta curta e profissional.
      `;

      const result = await ai.models.generateContent({
        model: 'gemini-1.5-flash',
        contents: [{ role: 'user', parts: [{ text: context }] }],
        config: {
          tools: [{ googleSearchRetrieval: {} } as any]
        }
      });

      setResponse(result.candidates?.[0]?.content?.parts?.[0]?.text || "Desculpe, a IA não conseguiu responder.");
      if (result.candidates?.[0]?.groundingMetadata?.groundingChunks) {
        const chunks = result.candidates[0].groundingMetadata.groundingChunks;
        setSources(chunks.map((c: any) => c.web).filter(Boolean));
      }
    } catch (e) {
      setResponse("Desculpe, ocorreu um erro na análise de dados.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-24 right-8 z-[1000] no-print">
      {isOpen ? (
        <div className="bg-white w-80 md:w-96 rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden animate-in slide-in-from-bottom-4 duration-300 flex flex-col">
          <div className="p-6 bg-[#1e3a8a] text-white flex justify-between items-center">
            <div className="flex items-center gap-3">
              <BrainCircuit size={20} className="text-amber-400" />
              <span className="text-xs font-black uppercase tracking-widest">SOC IA Assistant</span>
            </div>
            <button onClick={() => setIsOpen(false)}><X size={20} /></button>
          </div>

          <div className="p-6 max-h-[400px] overflow-y-auto bg-gray-50/50 flex-1 scrollbar-hide">
            {!response && !loading ? (
              <div className="text-center py-10">
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4"><Search size={24} /></div>
                <p className="text-xs font-medium text-gray-400">Olá! Pergunte algo sobre os dados da igreja ou pesquise temas bíblicos/teológicos.</p>
              </div>
            ) : loading ? (
              <div className="flex flex-col items-center py-10 gap-3">
                <Sparkles size={24} className="text-blue-600 animate-spin" />
                <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Consultando Grounding...</p>
              </div>
            ) : (
              <div className="space-y-4 animate-in fade-in">
                <div className="text-xs font-medium text-gray-700 leading-relaxed">
                  {response}
                </div>

                {sources.length > 0 && (
                  <div className="pt-4 border-t border-gray-100">
                    <p className="text-[8px] font-black text-gray-400 uppercase mb-2 tracking-widest">Fontes de Grounding:</p>
                    <div className="space-y-1">
                      {sources.map((s, i) => (
                        <a key={i} href={s.uri} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-[9px] font-bold text-blue-600 hover:underline">
                          <ExternalLink size={10} /> {s.title || "Web Source"}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="p-4 border-t bg-white flex gap-2">
            <input
              type="text"
              placeholder="Pergunte à IA..."
              className="flex-1 bg-gray-50 px-4 py-3 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-600 transition-all"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAsk()}
            />
            <button
              onClick={handleAsk}
              className="p-3 bg-blue-600 text-white rounded-xl shadow-lg hover:bg-blue-700 transition-all"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-blue-600 p-5 rounded-full text-white shadow-2xl hover:scale-110 transition-all group relative border-4 border-white"
        >
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 rounded-full border-2 border-white animate-pulse"></div>
          <MessageSquare size={28} />
        </button>
      )}
    </div>
  );
};

export default SOCAssistant;
