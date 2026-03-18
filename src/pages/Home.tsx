import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Church, ArrowRight, Zap, Shield, Activity, Users, Globe } from 'lucide-react';
import { useApp } from '../context/AppContext';
import heroBg from '../assets/hero-bg.png';

const Home: React.FC = () => {
  const { state } = useApp();

  // Redirect to dashboard if already authenticated
  if (state.auth.isAuthenticated) {
    return <Navigate to="/dashboard" />;
  }

  const churchName = state.churchSettings?.nomeIgreja || 'Igreja Baptista da Sapú';

  return (
    <div className="min-h-screen bg-mesh text-white overflow-x-hidden font-inter selection:bg-blue-500/30">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 w-full z-50 px-6 py-4 flex items-center justify-between glass-morphism border-b-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Church size={24} className="text-white" />
          </div>
          <span className="font-poppins font-black text-xl tracking-tight hidden md:block">
            {churchName.split(' ')[0]}<span className="text-blue-500">Master</span>
          </span>
        </div>
        
        <Link 
          to="/login" 
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-sm font-black uppercase tracking-widest rounded-xl transition-all hover:scale-105 active:scale-95 shadow-lg shadow-blue-500/20 flex items-center gap-2 group"
        >
          Acessar Sistema
          <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
        </Link>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-blue-600/20 rounded-full blur-[120px] animate-pulse-soft"></div>
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-purple-600/20 rounded-full blur-[120px] animate-pulse-soft" style={{ animationDelay: '2s' }}></div>

        <div className="container mx-auto px-6 relative z-10 grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8 text-center lg:text-left animate-in fade-in slide-in-from-left-8 duration-1000">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/10 text-[10px] font-black uppercase tracking-[0.2em] text-blue-400">
              <Zap size={12} fill="currentColor" /> Futuro da Gestão Eclesiástica
            </div>
            <h1 className="text-5xl md:text-7xl font-poppins font-black leading-tight tracking-tighter">
              Eleve sua <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400 text-glow">Visão Ministerial</span>
            </h1>
            <p className="text-lg text-gray-400 max-w-xl mx-auto lg:mx-0 font-medium leading-relaxed">
              O ecossistema definitivo para a {churchName}. Tecnologia de ponta unida ao propósito eterno para uma gestão transparente, ágil e inspiradora.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
              <Link 
                to="/login" 
                className="w-full sm:w-auto px-10 py-5 bg-white text-blue-900 font-extrabold rounded-2xl shadow-2xl hover:bg-blue-50 transition-all hover:-translate-y-1 active:scale-95 text-center"
              >
                Começar Agora
              </Link>
              <div className="flex -space-x-4 grayscale opacity-50 hover:grayscale-0 transition-all">
                {[1,2,3,4].map(i => (
                  <div key={i} className="w-10 h-10 rounded-full border-2 border-slate-900 bg-slate-800 flex items-center justify-center overflow-hidden">
                    <Users size={16} />
                  </div>
                ))}
                <span className="pl-6 text-xs font-bold text-gray-500 self-center">+1,200 Líderes Conectados</span>
              </div>
            </div>
          </div>

          <div className="relative animate-in fade-in slide-in-from-right-12 duration-1000">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-[3rem] blur opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative glass-card rounded-[3rem] p-4 overflow-hidden shadow-2xl animate-float">
              <img 
                src={heroBg} 
                alt="Futuristic Vision" 
                className="w-full h-auto rounded-[2.2rem] shadow-inner opacity-90"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent"></div>
              
              <div className="absolute bottom-10 left-10 p-6 glass-morphism rounded-2xl max-w-[240px]">
                <Activity className="text-blue-400 mb-2" size={24} />
                <h4 className="font-bold text-sm">Dashboard em Tempo Real</h4>
                <p className="text-[10px] text-gray-400 mt-1">Sincronização global de dados para decisões baseadas em evidências.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 bg-slate-950/50 relative overflow-hidden">
        <div className="container mx-auto px-6 text-center mb-20">
          <h2 className="text-3xl md:text-5xl font-poppins font-black mb-6 tracking-tight">Potencialize sua <span className="text-blue-500">Liderança</span></h2>
          <p className="text-gray-500 max-w-2xl mx-auto">Ferramentas desenhadas por especialistas para otimizar cada área do seu ministério.</p>
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
            <div key={i} className="group p-8 glass-card rounded-3xl hover:bg-white/5 transition-all hover:-translate-y-2 cursor-pointer border-white/5 hover:border-blue-500/30">
              <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-600/20 group-hover:text-blue-400 transition-colors">
                <f.icon size={28} />
              </div>
              <h3 className="text-xl font-bold mb-3">{f.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-white/5 text-center text-gray-500 text-sm">
        <p>&copy; {new Date().getFullYear()} {churchName}. Todos os direitos reservados.</p>
        <p className="mt-2 text-[10px] uppercase tracking-widest font-black text-gray-700 italic">Ecclésia Modern Church Architecture v4.0</p>
      </footer>
    </div>
  );
};

export default Home;
