import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import {
  Building2, Save, Upload, Palette, Target,
  Users, Database, ShieldCheck, Mail, Phone,
  Globe, MapPin, Hash, Facebook, Instagram,
  Youtube, Info, Church, Download, Trash2,
  RefreshCw, CheckCircle2
} from 'lucide-react';
import SEO from '../components/Common/SEO';
import { ChurchSettings, ChurchLeader } from '../core/types';
import AvatarPlaceholder from '../components/AvatarPlaceholder';

const defaultSettings = {
  endereco: { logradouro: '', numero: '', bairro: '', cidade: '', estado: '', cep: '' },
  redesSociais: { facebook: '', instagram: '', youtube: '' },
  cores: { primaria: '#1e40af', secundaria: '#f59e0b' },
  lideranca: []
};

const getSafeSettings = (s: any): ChurchSettings => ({
  ...s,
  endereco: { ...defaultSettings.endereco, ...(s?.endereco || {}) },
  redesSociais: { ...defaultSettings.redesSociais, ...(s?.redesSociais || {}) },
  cores: { ...defaultSettings.cores, ...(s?.cores || {}) },
  lideranca: s?.lideranca || []
} as ChurchSettings);

const SettingsPage: React.FC = () => {
  const { state, dispatch } = useApp();
  const [activeTab, setActiveTab] = useState<'institucional' | 'visual' | 'lideranca' | 'visao' | 'sistema'>('institucional');
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState<ChurchSettings>(() => getSafeSettings(state.churchSettings));
  const logoInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    setSettings(getSafeSettings(state.churchSettings));
  }, [state.churchSettings]);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      dispatch({ type: 'ADD_NOTIFICATION', payload: { message: 'Selecione um ficheiro de imagem válido (PNG, JPG, SVG).', type: 'error' } });
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      dispatch({ type: 'ADD_NOTIFICATION', payload: { message: 'A imagem deve ter no máximo 2MB.', type: 'error' } });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setSettings(prev => ({ ...prev, logo: base64 }));
      dispatch({ type: 'ADD_NOTIFICATION', payload: { message: 'Logo carregado! Clique em "Salvar Alterações" para persistir.', type: 'success' } });
    };
    reader.readAsDataURL(file);

    // Reset input so the same file can be selected again
    e.target.value = '';
  };

  const handleSave = async () => {
    setIsSaving(true);
    const token = localStorage.getItem('token');
    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(settings),
      });

      if (!response.ok) throw new Error('Erro ao salvar configurações');

      const saved = await response.json();

      dispatch({ type: 'UPDATE_CHURCH_SETTINGS', payload: saved });
      dispatch({
        type: 'ADD_NOTIFICATION',
        payload: { message: 'Configurações institucionais atualizadas!', type: 'success' }
      });
      dispatch({
        type: 'ADD_LOG',
        payload: {
          id: `log-set-${Date.now()}`,
          userId: state.auth.user?.id || 'sys',
          userName: state.auth.user?.name || 'Admin',
          action: 'UPDATE_SETTINGS',
          category: 'SYSTEM',
          severity: 'MEDIUM',
          target: 'Configurações Globais',
          timestamp: new Date().toISOString(),
          ip: '127.0.0.1'
        }
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      dispatch({ type: 'ADD_NOTIFICATION', payload: { message: 'Erro ao salvar configurações', type: 'error' } });
    } finally {
      setIsSaving(false);
    }
  };

  const handleBackup = () => {
    const backupData = {
      timestamp: new Date().toISOString(),
      app: "EclesiaMaster",
      data: state
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `EclesiaMaster_Backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    dispatch({ type: 'ADD_NOTIFICATION', payload: { message: 'Backup forense exportado com sucesso!', type: 'success' } });
  };

  const tabs = [
    { id: 'institucional', label: 'Institucional', icon: Building2 },
    { id: 'visual', label: 'Identidade Visual', icon: Palette },
    { id: 'lideranca', label: 'Liderança', icon: Users },
    { id: 'visao', label: 'Missão & Visão', icon: Target },
    { id: 'sistema', label: 'Sistema & Segurança', icon: Database },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20 no-print">
      <SEO title="Configurações" description="Personalize as informações e preferências do sistema." />
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-gray-800 tracking-tight">Configurações</h1>
          <p className="text-gray-500 font-medium italic">Gestão da estrutura ministerial e parâmetros do sistema.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all shadow-xl shadow-blue-200 flex items-center gap-3 active:scale-95 disabled:opacity-50"
        >
          {isSaving ? <RefreshCw size={18} className="animate-spin" /> : <Save size={18} />}
          {isSaving ? 'Gravando...' : 'Salvar Alterações'}
        </button>
      </header>

      <div className="bg-white rounded-[3rem] shadow-sm border border-gray-100 overflow-hidden flex flex-col lg:flex-row min-h-[600px]">
        {/* Navegação Lateral */}
        <aside className="lg:w-80 bg-gray-50/50 border-r border-gray-100 p-8 flex flex-col gap-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-4 px-6 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id
                ? 'bg-blue-600 text-white shadow-lg'
                : 'text-gray-400 hover:bg-white hover:text-blue-600'
                }`}
            >
              <tab.icon size={18} /> {tab.label}
            </button>
          ))}
        </aside>

        {/* Conteúdo Central */}
        <main className="flex-1 p-12 overflow-y-auto">
          {activeTab === 'institucional' && (
            <div className="space-y-10 animate-in slide-in-from-right-4">
              <div className="flex items-center gap-4 mb-2">
                <div className="p-3 bg-blue-100 text-blue-600 rounded-2xl"><Info size={24} /></div>
                <div>
                  <h2 className="text-2xl font-black text-gray-800 tracking-tight">Dados Institucionais</h2>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Informações fiscais e de contato oficial</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4 flex items-center gap-2"><Church size={12} /> Nome da Instituição</label>
                  <input type="text" className="w-full p-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-blue-600 outline-none font-bold transition-all" value={settings.nomeIgreja} onChange={e => setSettings({ ...settings, nomeIgreja: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4 flex items-center gap-2"><Hash size={12} /> CNPJ</label>
                  <input type="text" className="w-full p-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-blue-600 outline-none font-bold transition-all" value={settings.cnpj} onChange={e => setSettings({ ...settings, cnpj: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4 flex items-center gap-2"><Phone size={12} /> Telefone Principal</label>
                  <input type="text" className="w-full p-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-blue-600 outline-none font-bold transition-all" value={settings.telefone} onChange={e => setSettings({ ...settings, telefone: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4 flex items-center gap-2"><Mail size={12} /> E-mail Oficial</label>
                  <input type="email" className="w-full p-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-blue-600 outline-none font-bold transition-all" value={settings.email} onChange={e => setSettings({ ...settings, email: e.target.value })} />
                </div>
              </div>

              <div className="pt-8 border-t border-gray-100">
                <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2"><MapPin size={14} /> Localização Sede</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-2 space-y-1">
                    <input type="text" placeholder="Logradouro" className="w-full p-4 bg-gray-50 rounded-2xl border-none outline-none font-bold text-sm" value={settings.endereco.logradouro} onChange={e => setSettings({ ...settings, endereco: { ...settings.endereco, logradouro: e.target.value } })} />
                  </div>
                  <input type="text" placeholder="Número" className="w-full p-4 bg-gray-50 rounded-2xl border-none outline-none font-bold text-sm" value={settings.endereco.numero} onChange={e => setSettings({ ...settings, endereco: { ...settings.endereco, numero: e.target.value } })} />
                </div>
              </div>

              <div className="pt-8 border-t border-gray-100">
                <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2"><Globe size={14} /> Presença Digital</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="relative group">
                    <Facebook className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-600" size={18} />
                    <input type="text" placeholder="facebook.com/..." className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-2xl border-none outline-none font-bold text-sm" value={settings.redesSociais.facebook} onChange={e => setSettings({ ...settings, redesSociais: { ...settings.redesSociais, facebook: e.target.value } })} />
                  </div>
                  <div className="relative group">
                    <Instagram className="absolute left-4 top-1/2 -translate-y-1/2 text-pink-600" size={18} />
                    <input type="text" placeholder="instagram.com/..." className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-2xl border-none outline-none font-bold text-sm" value={settings.redesSociais.instagram} onChange={e => setSettings({ ...settings, redesSociais: { ...settings.redesSociais, instagram: e.target.value } })} />
                  </div>
                  <div className="relative group">
                    <Youtube className="absolute left-4 top-1/2 -translate-y-1/2 text-red-600" size={18} />
                    <input type="text" placeholder="youtube.com/..." className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-2xl border-none outline-none font-bold text-sm" value={settings.redesSociais.youtube} onChange={e => setSettings({ ...settings, redesSociais: { ...settings.redesSociais, youtube: e.target.value } })} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'visual' && (
            <div className="space-y-10 animate-in slide-in-from-right-4 text-center lg:text-left">
              {/* Hidden file input */}
              <input
                ref={logoInputRef}
                type="file"
                accept="image/png,image/jpeg,image/svg+xml,image/webp"
                className="hidden"
                onChange={handleLogoUpload}
              />

              <div className="flex flex-col lg:flex-row items-center gap-10">
                <div className="relative group cursor-pointer" onClick={() => logoInputRef.current?.click()}>
                  <div className="w-48 h-48 bg-gray-50 rounded-[3rem] border-8 border-white shadow-2xl flex items-center justify-center overflow-hidden transition-all group-hover:scale-105">
                    {settings.logo ? <img src={settings.logo} className="w-full h-full object-contain" alt="Logo da Igreja" /> : <Church size={64} className="text-gray-200" />}
                  </div>
                  <div className="absolute inset-0 bg-blue-900/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all rounded-[3rem]">
                    <Upload className="text-white" size={32} />
                  </div>
                </div>
                <div className="space-y-4 max-w-sm">
                  <h2 className="text-2xl font-black text-gray-800 tracking-tight">Identidade da Marca</h2>
                  <p className="text-sm text-gray-500 font-medium">Carregue o brasão oficial ou logotipo da congregação. Formatos sugeridos: PNG transparente ou SVG.</p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => logoInputRef.current?.click()}
                      className="px-6 py-3 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-blue-700 transition-all flex items-center gap-2"
                    >
                      <Upload size={14} /> Substituir Imagem
                    </button>
                    {settings.logo && (
                      <button
                        onClick={() => setSettings(prev => ({ ...prev, logo: undefined }))}
                        className="px-4 py-3 bg-red-50 text-red-500 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-red-100 transition-all flex items-center gap-2"
                      >
                        <Trash2 size={14} /> Remover
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-10 border-t border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-4">
                  <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2"><Palette size={14} /> Cor Primária</h3>
                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
                    <input type="color" className="w-12 h-12 rounded-lg cursor-pointer border-none bg-transparent" value={settings.cores.primaria} onChange={e => setSettings({ ...settings, cores: { ...settings.cores, primaria: e.target.value } })} />
                    <span className="font-mono font-black text-sm uppercase text-gray-800">{settings.cores.primaria}</span>
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2"><Palette size={14} /> Cor Secundária</h3>
                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
                    <input type="color" className="w-12 h-12 rounded-lg cursor-pointer border-none bg-transparent" value={settings.cores.secundaria} onChange={e => setSettings({ ...settings, cores: { ...settings.cores, secundaria: e.target.value } })} />
                    <span className="font-mono font-black text-sm uppercase text-gray-800">{settings.cores.secundaria}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'lideranca' && (
            <div className="space-y-10 animate-in slide-in-from-right-4">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-black text-gray-800 tracking-tight">Corpo Ministerial</h2>
                <button className="p-3 bg-blue-600 text-white rounded-xl shadow-lg hover:bg-blue-700 transition-all active:scale-95"><Users size={20} /></button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {settings.lideranca.length === 0 ? (
                  <div className="col-span-full py-20 text-center border-2 border-dashed border-gray-100 rounded-[3rem]">
                    <Users size={48} className="text-gray-200 mx-auto mb-4" />
                    <p className="text-sm font-black text-gray-300 uppercase tracking-widest">Nenhum líder cadastrado no organograma.</p>
                  </div>
                ) : (
                  settings.lideranca.map(leader => (
                    <div key={leader.id} className="p-6 bg-gray-50 rounded-[2rem] border border-gray-100 flex items-center gap-4">
                      <AvatarPlaceholder
                        name={leader.name}
                        id={leader.id}
                        photoUrl={leader.photoUrl}
                        className="w-14 h-14 rounded-2xl object-cover"
                      />
                      <div className="flex-1">
                        <h4 className="text-sm font-black text-gray-800">{leader.name}</h4>
                        <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest">{leader.role}</p>
                      </div>
                      <button className="p-2 text-gray-300 hover:text-red-600 transition-colors"><Trash2 size={16} /></button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'visao' && (
            <div className="space-y-10 animate-in slide-in-from-right-4">
              <div className="space-y-4">
                <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-4 flex items-center gap-2"><Target size={14} /> Nossa Missão</h3>
                <textarea className="w-full p-8 bg-gray-50 rounded-[2.5rem] border-none outline-none font-medium text-gray-700 h-32 resize-none" placeholder="Qual o propósito fundamental da igreja?" value={settings.missao} onChange={e => setSettings({ ...settings, missao: e.target.value })} />
              </div>
              <div className="space-y-4">
                <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-4 flex items-center gap-2"><Target size={14} /> Nossa Visão</h3>
                <textarea className="w-full p-8 bg-gray-50 rounded-[2.5rem] border-none outline-none font-medium text-gray-700 h-32 resize-none" placeholder="Onde a igreja quer chegar nos próximos 10 anos?" value={settings.visao} onChange={e => setSettings({ ...settings, visao: e.target.value })} />
              </div>
              <div className="space-y-4">
                <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-4 flex items-center gap-2"><CheckCircle2 size={14} /> Nossos Valores</h3>
                <textarea className="w-full p-8 bg-gray-50 rounded-[2.5rem] border-none outline-none font-medium text-gray-700 h-32 resize-none" placeholder="Quais os princípios inegociáveis?" value={settings.valores} onChange={e => setSettings({ ...settings, valores: e.target.value })} />
              </div>
            </div>
          )}

          {activeTab === 'sistema' && (
            <div className="space-y-10 animate-in slide-in-from-right-4">
              <div className="bg-blue-900 p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
                  <Database size={48} className="text-amber-400" />
                  <div className="flex-1">
                    <h3 className="text-xl font-black mb-2">Backup Forense de Dados</h3>
                    <p className="text-sm text-blue-200 leading-relaxed font-medium">Exporte toda a base de dados (membros, finanças, eventos e logs) em um arquivo criptografado para custódia administrativa externa.</p>
                  </div>
                  <button onClick={handleBackup} className="px-8 py-4 bg-amber-400 text-blue-950 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center gap-3 hover:bg-white transition-all active:scale-95">
                    <Download size={18} /> Iniciar Snapshot
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6">
                <div className="p-8 bg-gray-50 rounded-[2.5rem] border border-gray-100 flex items-center gap-6">
                  <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-blue-600 shadow-sm"><ShieldCheck size={28} /></div>
                  <div>
                    <h4 className="text-sm font-black text-gray-800">Proteção de Dados</h4>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Ativo • Criptografia AES-256</p>
                  </div>
                </div>
                <div className="p-8 bg-gray-50 rounded-[2.5rem] border border-gray-100 flex items-center gap-6">
                  <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm"><CheckCircle2 size={28} /></div>
                  <div>
                    <h4 className="text-sm font-black text-gray-800">Status do Servidor</h4>
                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Operacional • Latência 24ms</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default SettingsPage;
