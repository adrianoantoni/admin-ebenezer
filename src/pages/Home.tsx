import React, { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Church, ArrowRight, Zap, Shield, Activity, Users, Globe, Sun, Moon } from 'lucide-react';
import { useApp } from '../context/AppContext';
import heroBg from '../assets/hero-bg.png';

const Home: React.FC = () => {
  const { state } = useApp();
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Redirect to dashboard if already authenticated
  if (state.auth.isAuthenticated) {
    return <Navigate to="/dashboard" />;
  }

  const churchName = state.churchSettings?.nomeIgreja || 'Igreja Baptista da Sapú';

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-mesh text-white' : 'bg-mesh-light text-slate-900'} overflow-x-hidden font-inter selection:bg-blue-500/30 transition-colors duration-500`}>
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 w-full z-50 px-6 py-4 flex items-center justify-between ${isDarkMode ? 'glass-morphism border-b-white/5' : 'glass-morphism-light border-b-slate-200'} transition-all`}>
        <div className="flex items-center gap-3">
          {state.churchSettings?.logo ? (
            <img 
              src={state.churchSettings.logo} 
              alt="Logo" 
              className="w-10 h-10 object-contain rounded-xl shadow-lg shadow-blue-500/10"
            />
          ) : (
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Church size={24} className="text-white" />
            </div>
          )}
          <span className={`font-poppins font-black text-xl tracking-tight hidden md:block ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
            {churchName}
          </span>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`p-2.5 rounded-xl transition-all ${isDarkMode ? 'bg-white/5 text-yellow-400 hover:bg-white/10' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          <Link 
            to="/login" 
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-sm font-black uppercase tracking-widest rounded-xl transition-all hover:scale-105 active:scale-95 shadow-lg shadow-blue-500/20 text-white flex items-center gap-2 group"
          >
            Acessar Sistema
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden">
        {/* Animated Background Elements */}
        <div className={`absolute top-1/4 -left-20 w-96 h-96 ${isDarkMode ? 'bg-blue-600/20' : 'bg-blue-400/10'} rounded-full blur-[120px] animate-pulse-soft`}></div>
        <div className={`absolute bottom-1/4 -right-20 w-96 h-96 ${isDarkMode ? 'bg-purple-600/20' : 'bg-indigo-400/10'} rounded-full blur-[120px] animate-pulse-soft`} style={{ animationDelay: '2s' }}></div>

        <div className="container mx-auto px-6 relative z-10 grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8 text-center lg:text-left animate-in fade-in slide-in-from-left-8 duration-1000">
            <div className={`inline-flex items-center gap-2 px-3 py-1 ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-blue-50 border-blue-100'} rounded-full border text-[10px] font-black uppercase tracking-[0.2em] text-blue-500`}>
              <Zap size={12} fill="currentColor" /> Futuro da Gestão Eclesiástica
            </div>
            <h1 className={`text-5xl md:text-7xl font-poppins font-black leading-tight tracking-tighter ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              Eleve sua <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-indigo-500 text-glow">Visão Ministerial</span>
            </h1>
            <p className={`text-lg ${isDarkMode ? 'text-gray-400' : 'text-slate-600'} max-w-xl mx-auto lg:mx-0 font-medium leading-relaxed`}>
              O ecossistema definitivo para a {churchName}. Tecnologia de ponta unida ao propósito eterno para uma gestão transparente, ágil e inspiradora.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
              <Link 
                to="/login" 
                className={`w-full sm:w-auto px-10 py-5 ${isDarkMode ? 'bg-white text-blue-900 hover:bg-blue-50' : 'bg-blue-600 text-white hover:bg-blue-700'} font-extrabold rounded-2xl shadow-2xl transition-all hover:-translate-y-1 active:scale-95 text-center`}
              >
                Começar Agora
              </Link>
              <div className="flex -space-x-4 grayscale opacity-50 hover:grayscale-0 transition-all">
                {[1,2,3,4].map(i => (
                  <div key={i} className={`w-10 h-10 rounded-full border-2 ${isDarkMode ? 'border-slate-900 bg-slate-800' : 'border-white bg-slate-100'} flex items-center justify-center overflow-hidden`}>
                    <Users size={16} className={isDarkMode ? 'text-white' : 'text-slate-400'} />
                  </div>
                ))}
                <span className={`pl-6 text-xs font-bold ${isDarkMode ? 'text-gray-500' : 'text-slate-400'} self-center`}>+1,200 Líderes Conectados</span>
              </div>
            </div>
          </div>

          <div className="relative animate-in fade-in slide-in-from-right-12 duration-1000">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-[3rem] blur opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
            <div className={`relative ${isDarkMode ? 'glass-card' : 'glass-card-light'} rounded-[3rem] p-4 overflow-hidden shadow-2xl animate-float`}>
              <img 
                src={heroBg} 
                alt="Futuristic Vision" 
                className={`w-full h-auto rounded-[2.2rem] shadow-inner ${isDarkMode ? 'opacity-90' : 'opacity-100'}`}
              />
              <div className={`absolute inset-0 bg-gradient-to-t ${isDarkMode ? 'from-slate-950' : 'from-white/50'} via-transparent to-transparent`}></div>
              
              <div className={`absolute bottom-10 left-10 p-6 ${isDarkMode ? 'glass-morphism' : 'glass-morphism-light'} rounded-2xl max-w-[240px]`}>
                <Activity className="text-blue-500 mb-2" size={24} />
                <h4 className={`font-bold text-sm ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Dashboard em Tempo Real</h4>
                <p className={`text-[10px] ${isDarkMode ? 'text-gray-400' : 'text-slate-500'} mt-1`}>Sincronização global de dados para decisões baseadas em evidências.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className={`py-24 ${isDarkMode ? 'bg-slate-950/50' : 'bg-slate-50'} relative overflow-hidden`}>
        <div className="container mx-auto px-6 text-center mb-20">
          <h2 className={`text-3xl md:text-5xl font-poppins font-black mb-6 tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Potencialize sua <span className="text-blue-500">Liderança</span></h2>
          <p className={isDarkMode ? 'text-gray-500' : 'text-slate-500'}>Ferramentas desenhadas por especialistas para otimizar cada área do seu ministério.</p>
        </div>

        <div className="container mx-auto px-6 grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            { icon: Users, title: 'Gestão Inteligente', desc: 'Controle total de membros, células e departamentos com IA.' },
            { icon: Activity, title: 'Monitor Financeiro', desc: 'Dízimos, ofertas e despesas com conciliação bancária automática.' },
            { icon: Globe, title: 'Impacto Social', desc: 'Acompanhe as missões e ajuda humanitária em tempo real.' },
            { icon: Shield, title: 'Segurança SOC', desc: 'Três níveis de backup e criptografia de ponta a ponta.' },
            { icon: Zap, title: 'Documentos Ágeis', desc: 'Geração instantânea de certificados e credenciais com QR code.' },
            { icon: Church, title: 'Gestão de Patrimônio', desc: 'Inventário digital com rastreamento de ativos e depreciação.' }
          ].map((f, i) => (
            <div key={i} className={`group p-8 ${isDarkMode ? 'glass-card hover:bg-white/5 border-white/5' : 'glass-card-light bg-white hover:bg-slate-50 border-slate-100'} rounded-3xl transition-all hover:-translate-y-2 cursor-pointer hover:border-blue-500/30`}>
              <div className={`w-14 h-14 ${isDarkMode ? 'bg-white/5' : 'bg-blue-50 text-blue-600'} rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-600/20 group-hover:text-blue-500 transition-colors`}>
                <f.icon size={28} />
              </div>
              <h3 className={`text-xl font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{f.title}</h3>
              <p className={`${isDarkMode ? 'text-gray-500' : 'text-slate-500'} text-sm leading-relaxed`}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className={`py-12 border-t ${isDarkMode ? 'border-white/5' : 'border-slate-200'} text-center ${isDarkMode ? 'text-gray-500' : 'text-slate-400'} text-sm`}>
        <p>&copy; {new Date().getFullYear()} {churchName}. Todos os direitos reservados.</p>
        <p className="mt-2 text-[10px] uppercase tracking-widest font-black text-gray-700 italic">Ecclésia Modern Church Architecture v4.0</p>
      </footer>
    </div>
  );
};

export default Home;
