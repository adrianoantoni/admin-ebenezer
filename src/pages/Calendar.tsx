
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import {
  Calendar as CalendarIcon, Clock, MapPin, ChevronLeft, ChevronRight, Plus,
  Users, User, Wrench, X, CheckCircle2,
  CalendarDays, CalendarRange, Info, Bell, Trash2, Edit, Save, Share2,
  Repeat, Star, Heart, GraduationCap, Coffee, AlertTriangle, Search, UserPlus,
  List, Volume2, Eye
} from 'lucide-react';
import SEO from '../components/Common/SEO';
import { ChurchEvent, EventCategory, Member } from '../core/types';
import AvatarPlaceholder from '../components/AvatarPlaceholder';

type ViewMode = 'MONTH' | 'WEEK' | 'DAY';

const CATEGORY_STYLES: Record<EventCategory, { bg: string, text: string, icon: any, label: string, border: string }> = {
  CULT: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200', icon: Star, label: 'Culto Regular' },
  MEETING: { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200', icon: Users, label: 'Reunião ADM' },
  SPECIAL: { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200', icon: CalendarIcon, label: 'Evento Especial' },
  MARRIAGE: { bg: 'bg-pink-100', text: 'text-pink-700', border: 'border-pink-200', icon: Heart, label: 'Casamento' },
  REHEARSAL: { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200', icon: GraduationCap, label: 'Ensaio/Treino' },
  CELL: { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200', icon: Coffee, label: 'Célula' },
  BAPTISM: { bg: 'bg-cyan-100', text: 'text-cyan-700', border: 'border-cyan-200', icon: Info, label: 'Batismo' },
  BIRTHDAY: { bg: 'bg-indigo-100', text: 'text-indigo-700', border: 'border-indigo-200', icon: Bell, label: 'Aniversário' },
  COMMEMORATIVE: { bg: 'bg-teal-100', text: 'text-teal-700', border: 'border-teal-200', icon: Star, label: 'Data Comemorativa' },
};

const CalendarPage: React.FC = () => {
  const { state, dispatch } = useApp();
  const [viewMode, setViewMode] = useState<ViewMode>('MONTH');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');
  const [selectedDayDate, setSelectedDayDate] = useState<string | null>(null);
  const [showDayEventsModal, setShowDayEventsModal] = useState(false);
  const [deadlineAlerts, setDeadlineAlerts] = useState<ChurchEvent[]>([]);
  const [showDeadlineAlert, setShowDeadlineAlert] = useState(false);
  const alertSoundRef = useRef<HTMLAudioElement | null>(null);

  // Form State
  // Fix: Removed 'resources' property which is not defined in ChurchEvent type
  const [formData, setFormData] = useState<Partial<ChurchEvent>>({
    title: '', date: '', time: '', category: 'CULT', description: '', location: '', responsible: '', isRecurring: false, invitedMemberIds: []
  });

  // Combine state.events with dynamically generated birthdays
  const allEvents = useMemo(() => {
    const dynamicBirthdays = state.members
      .filter(m => m.birthDate && m.status === 'active')
      .map(m => {
        try {
          const bdateParts = m.birthDate.split('-');
          if (bdateParts.length !== 3) return null;

          const currentYear = currentDate.getFullYear();
          const eventDateStr = `${currentYear}-${bdateParts[1]}-${bdateParts[2]}`;

          return {
            id: `bday-${m.id}-${currentYear}`,
            title: `Aniversário: ${m.name.split(' ')[0]}`,
            date: eventDateStr,
            time: '00:00',
            category: 'BIRTHDAY' as EventCategory,
            description: `Celebração do aniversário de ${m.name}. Felicite-o(a)!`,
            location: '',
            responsible: 'Comunhão',
            isRecurring: true,
            invitedMemberIds: [],
            checkInList: []
          };
        } catch (e) {
          return null;
        }
      }).filter(Boolean) as ChurchEvent[];

    return [...state.events, ...dynamicBirthdays];
  }, [state.events, state.members, currentDate]);

  const selectedEvent = useMemo(() => {
    return allEvents.find(e => e.id === selectedEventId) || null;
  }, [allEvents, selectedEventId]);

  const upcomingAlerts = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tenDaysLater = new Date();
    tenDaysLater.setDate(today.getDate() + 10);

    return allEvents.filter(e => {
      const eventDate = new Date(e.date);
      return eventDate >= today && eventDate <= tenDaysLater;
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [allEvents]);

  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days = [];
    for (let i = 0; i < firstDayOfMonth; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));
    return days;
  }, [currentDate]);

  const handlePrev = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const handleNext = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  // Fix timezone: use local date formatting instead of toISOString()
  const formatLocalDate = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const openAddEvent = (date?: Date) => {
    setFormData({
      title: '',
      date: date ? formatLocalDate(date) : formatLocalDate(new Date()),
      time: '19:00',
      category: 'CULT',
      description: '',
      location: 'Templo Sede',
      responsible: '',
      isRecurring: false,
      invitedMemberIds: []
    });
    setIsEditing(false);
    setShowEventModal(true);
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Tem certeza que deseja excluir este planejamento?')) return;
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/events/${eventId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Erro ao excluir');
      dispatch({ type: 'DELETE_EVENT', payload: eventId });
      setSelectedEventId(null);
      dispatch({ type: 'ADD_NOTIFICATION', payload: { message: 'Planejamento excluído!', type: 'success' } });
    } catch (error) {
      dispatch({ type: 'ADD_NOTIFICATION', payload: { message: 'Erro ao excluir planejamento', type: 'error' } });
    }
  };

  const openDayEvents = (dateStr: string) => {
    setSelectedDayDate(dateStr);
    setShowDayEventsModal(true);
  };

  const dayEventsForModal = useMemo(() => {
    if (!selectedDayDate) return [];
    return allEvents.filter(e => e.date === selectedDayDate);
  }, [allEvents, selectedDayDate]);

  // Deadline alert system
  useEffect(() => {
    const checkDeadlines = () => {
      const now = new Date();
      const todayStr = formatLocalDate(now);
      const expiredOrDue = allEvents.filter(e => {
        // Ignorar aniversarios para o sistema de "Prazo" critico com alarme visual no centro da tela (opcional)
        // Aqui incluimos todos os eventos com deadline critico
        if (e.category === 'BIRTHDAY') return false;
        return e.date <= todayStr && e.date >= formatLocalDate(new Date(now.getTime() - 86400000 * 2)); // Mostra ate 2 dias atras
      });
      if (expiredOrDue.length > 0) {
        setDeadlineAlerts(expiredOrDue);
        setShowDeadlineAlert(true);
        // Play alert sound
        try {
          const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.frequency.value = 880;
          osc.type = 'sine';
          gain.gain.value = 0.15;
          osc.start();
          gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.8);
          osc.stop(audioCtx.currentTime + 0.8);
        } catch (e) { /* audio not available */ }
      }
    };
    // Desabilitado temporariamente para não perturbar constantemente
    // checkDeadlines();
    // const interval = setInterval(checkDeadlines, 60000); // Check every minute
    // return () => clearInterval(interval);
  }, [allEvents]);

  const handleSaveEvent = async () => {
    if (!formData.title || !formData.date) return;

    const token = localStorage.getItem('token');
    const method = isEditing ? 'PUT' : 'POST';
    const url = isEditing ? `/api/events/${selectedEventId}` : '/api/events';

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Erro ao salvar evento');

      const savedEvent = await response.json();

      const newEvent: ChurchEvent = {
        ...(formData as ChurchEvent),
        id: savedEvent.idEvento || savedEvent.id || (isEditing && selectedEvent ? selectedEvent.id : Math.random().toString(36).substr(2, 9)),
        checkInList: isEditing && selectedEvent ? selectedEvent.checkInList : [],
        invitedMemberIds: formData.invitedMemberIds || []
      };

      if (isEditing) {
        dispatch({ type: 'UPDATE_EVENT', payload: newEvent });
      } else {
        dispatch({ type: 'ADD_EVENT', payload: newEvent });
      }
      setShowEventModal(false);
      setSelectedEventId(null);
    } catch (error) {
      console.error('Error saving event:', error);
      dispatch({ type: 'ADD_NOTIFICATION', payload: { message: 'Erro ao conectar com o servidor', type: 'error' } });
    }
  };

  const toggleCheckIn = (eventId: string) => {
    const event = state.events.find(e => e.id === eventId);
    if (!event) return;
    const userId = state.auth.user?.id || 'guest';
    const newList = event.checkInList?.includes(userId)
      ? event.checkInList.filter(id => id !== userId)
      : [...(event.checkInList || []), userId];
    dispatch({ type: 'UPDATE_EVENT', payload: { ...event, checkInList: newList } });
  };

  const toggleMemberInvite = (memberId: string) => {
    const currentInvited = formData.invitedMemberIds || [];
    const updated = currentInvited.includes(memberId)
      ? currentInvited.filter(id => id !== memberId)
      : [...currentInvited, memberId];
    setFormData({ ...formData, invitedMemberIds: updated });
  };

  const filteredMembers = useMemo(() => {
    if (!memberSearch) return [];
    return state.members.filter(m => m.name.toLowerCase().includes(memberSearch.toLowerCase())).slice(0, 5);
  }, [state.members, memberSearch]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20 no-print">
      <SEO title="Calendário" description="Agenda de cultos, eventos e atividades da igreja." />
      {/* HEADER SECTION */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-gray-800 tracking-tight">Agenda de Actividades</h1>
          <p className="text-gray-500 font-medium italic">Monitoramento centralizado de compromissos e presença.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-white border-2 border-gray-100 rounded-2xl p-1.5 flex gap-1 shadow-sm">
            {['MONTH', 'WEEK', 'DAY'].map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode as ViewMode)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === mode ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-50'
                  }`}
              >
                {mode === 'MONTH' ? 'Mês' : mode === 'WEEK' ? 'Semana' : 'Dia'}
              </button>
            ))}
          </div>
          <button
            onClick={() => openAddEvent()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl flex items-center gap-2 active:scale-95 transition-all"
          >
            <Plus size={18} /> Novo Evento
          </button>
        </div>
      </header>

      {/* 10-DAY ALERTS BANNER */}
      {upcomingAlerts.length > 0 && (
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
          {upcomingAlerts.map(event => {
            const diff = Math.ceil((new Date(event.date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
            return (
              <div key={`alert-${event.id}`} className="min-w-[300px] bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-2xl flex items-center justify-between shadow-sm animate-in slide-in-from-top duration-300">
                <div className="flex items-center gap-4">
                  <div className="bg-amber-500 p-2 rounded-xl text-white shadow-lg shadow-amber-200">
                    <AlertTriangle size={20} className="animate-pulse" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-amber-900 uppercase tracking-widest">Actividade Próxima</p>
                    <p className="text-sm font-bold text-gray-800 truncate max-w-[150px]">{event.title}</p>
                    <p className="text-[10px] text-amber-700 font-bold uppercase">Em {diff} dias • {event.time}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedEventId(event.id)} className="p-2 hover:bg-amber-200 rounded-full text-amber-600 transition-colors"><ChevronRight size={18} /></button>
              </div>
            );
          })}
        </div>
      )}

      {/* EVENT DETAIL AT THE TOP */}
      {selectedEvent && (
        <div className="bg-white rounded-[2.5rem] border-2 border-blue-100 shadow-2xl overflow-hidden animate-in slide-in-from-top-4 duration-500 relative">
          <button onClick={() => setSelectedEventId(null)} className="absolute top-6 right-6 p-2 bg-gray-100 hover:bg-red-50 hover:text-red-600 rounded-full transition-all z-10"><X size={24} /></button>

          <div className="grid grid-cols-1 lg:grid-cols-12">
            {/* Left Header Color Strip */}
            <div className={`lg:col-span-4 p-10 ${CATEGORY_STYLES[selectedEvent.category].bg} flex flex-col justify-center`}>
              <div className="bg-white w-16 h-16 rounded-[1.5rem] shadow-xl flex items-center justify-center mb-6 text-blue-600">
                {React.createElement(CATEGORY_STYLES[selectedEvent.category].icon, { size: 32 })}
              </div>
              <h2 className="text-3xl font-black text-gray-800 tracking-tighter leading-tight mb-2">{selectedEvent.title}</h2>
              <span className="text-[10px] font-black uppercase text-blue-600 tracking-widest">{CATEGORY_STYLES[selectedEvent.category].label}</span>

              <div className="mt-8 space-y-3">
                <div className="flex items-center gap-3 text-sm font-bold text-gray-700 bg-white/50 p-3 rounded-2xl">
                  <CalendarIcon size={18} /> {new Date(selectedEvent.date).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-3 text-sm font-bold text-gray-700 bg-white/50 p-3 rounded-2xl">
                  <Clock size={18} /> {selectedEvent.time}
                </div>
                <div className="flex items-center gap-3 text-sm font-bold text-gray-700 bg-white/50 p-3 rounded-2xl">
                  <MapPin size={18} /> {selectedEvent.location}
                </div>
              </div>
            </div>

            {/* Right Info Section */}
            <div className="lg:col-span-8 p-10 bg-white flex flex-col">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-6">
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Responsável Principal</p>
                    <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                      <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center font-black">PA</div>
                      <span className="text-sm font-bold text-gray-800">{selectedEvent.responsible || 'Secretaria Executiva'}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Descrição & Notas</p>
                    <p className="text-sm text-gray-600 leading-relaxed font-medium">{selectedEvent.description || 'Nenhuma descrição detalhada fornecida para este evento.'}</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Cotação de Presença</p>
                    <div className="bg-gray-50 p-6 rounded-[2rem] border border-gray-100">
                      <div className="flex justify-between items-end mb-4">
                        <div>
                          <p className="text-3xl font-black text-blue-600 tracking-tighter">{selectedEvent.checkInList?.length || 0}</p>
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Participantes Reais</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-black text-gray-400 tracking-tighter">{selectedEvent.invitedMemberIds?.length || selectedEvent.participantsCount || 0}</p>
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Esperados</p>
                        </div>
                      </div>
                      <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-600 transition-all duration-1000"
                          style={{ width: `${Math.min(100, ((selectedEvent.checkInList?.length || 0) / (selectedEvent.invitedMemberIds?.length || selectedEvent.participantsCount || 1)) * 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <button
                      onClick={() => toggleCheckIn(selectedEvent.id)}
                      className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-xl ${selectedEvent.checkInList?.includes(state.auth.user?.id || 'guest')
                        ? 'bg-green-600 text-white shadow-green-200'
                        : 'bg-white border-2 border-blue-600 text-blue-600 hover:bg-blue-50'
                        }`}
                    >
                      <CheckCircle2 size={18} /> {selectedEvent.checkInList?.includes(state.auth.user?.id || 'guest') ? 'Presença Confirmada' : 'Realizar Check-in'}
                    </button>
                    <button
                      onClick={() => { setIsEditing(true); setFormData({ ...selectedEvent }); setShowEventModal(true); }}
                      className="p-4 bg-gray-50 text-gray-400 hover:text-blue-600 rounded-2xl border border-gray-100 transition-all"
                    >
                      <Edit size={20} />
                    </button>
                    <button
                      onClick={() => handleDeleteEvent(selectedEvent.id)}
                      className="p-4 bg-gray-50 text-gray-400 hover:text-red-600 rounded-2xl border border-gray-100 transition-all"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              </div>

              {/* List of specifically invited members */}
              {selectedEvent.invitedMemberIds && selectedEvent.invitedMemberIds.length > 0 && (
                <div className="mt-8 pt-8 border-t border-gray-50">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Membros Convocados ({selectedEvent.invitedMemberIds.length})</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedEvent.invitedMemberIds.map(id => {
                      const m = state.members.find(member => member.id === id);
                      return m ? (
                        <div key={id} className="flex items-center gap-2 bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-xl">
                          <AvatarPlaceholder
                            name={m.name}
                            id={m.id}
                            photoUrl={m.photoUrl}
                            className="w-6 h-6 rounded-lg object-cover"
                          />
                          <span className="text-[10px] font-bold text-gray-700">{m.name.split(' ')[0]}</span>
                          {selectedEvent.checkInList?.includes(m.id) && <CheckCircle2 size={12} className="text-green-500" />}
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CALENDAR MAIN VIEW */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-9 bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden flex flex-col">
          <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
            <h2 className="text-2xl font-black text-gray-800 tracking-tight capitalize">
              {currentDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}
            </h2>
            <div className="flex gap-2">
              <button onClick={handlePrev} className="p-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors shadow-sm"><ChevronLeft size={20} /></button>
              <button onClick={() => setCurrentDate(new Date())} className="px-6 py-2.5 bg-white border border-gray-200 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm">Hoje</button>
              <button onClick={handleNext} className="p-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors shadow-sm"><ChevronRight size={20} /></button>
            </div>
          </div>

          <div className="p-8">
            <div className="grid grid-cols-7 gap-4">
              {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                <div key={day} className="text-center text-[10px] font-black text-gray-300 uppercase tracking-widest py-2">{day}</div>
              ))}

              {calendarDays.map((date, i) => {
                const dateStr = date ? formatLocalDate(date) : '';
                const dayEvents = allEvents.filter(e => e.date === dateStr);
                const todayStr = formatLocalDate(new Date());
                const isToday = dateStr === todayStr;
                const isPast = date ? dateStr < todayStr : false;
                const hasExpired = dayEvents.some(e => e.date < todayStr && e.category !== 'BIRTHDAY');

                return (
                  <div
                    key={i}
                    className={`min-h-[110px] border-2 rounded-[1.5rem] p-3 transition-all group relative ${!date ? 'bg-gray-50/30 border-transparent' : 'bg-white border-gray-50 hover:border-blue-200 hover:shadow-lg hover:-translate-y-0.5'
                      } ${isToday ? 'ring-4 ring-blue-50 border-blue-600 bg-blue-50/20' : ''} ${hasExpired ? 'border-red-200 bg-red-50/20' : ''} ${isPast ? 'opacity-70 bg-gray-50' : ''}`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className={`text-xs font-black ${isToday ? 'text-blue-600' : hasExpired ? 'text-red-500' : isPast ? 'text-gray-300' : 'text-gray-400'}`}>
                        {date ? date.getDate() : ''}
                      </span>
                      {date && (
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {dayEvents.length > 0 && (
                            <button
                              onClick={(e) => { e.stopPropagation(); openDayEvents(dateStr); }}
                              className="w-6 h-6 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all text-[8px] font-black"
                              title="Ver todos"
                            >
                              <List size={12} />
                            </button>
                          )}
                          {!isPast && (
                            <button
                              onClick={(e) => { e.stopPropagation(); openAddEvent(date); }}
                              className="w-6 h-6 bg-green-100 text-green-600 rounded-lg flex items-center justify-center hover:bg-green-600 hover:text-white transition-all"
                              title="Adicionar"
                            >
                              <Plus size={12} />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                    {dayEvents.length > 0 && (
                      <div className="absolute top-2 right-2 opacity-100 group-hover:opacity-0 transition-opacity">
                        <span className="w-5 h-5 bg-blue-600 text-white rounded-full text-[8px] font-black flex items-center justify-center shadow-sm">{dayEvents.length}</span>
                      </div>
                    )}
                    <div className="space-y-1 overflow-y-auto scrollbar-hide max-h-[60px]">
                      {dayEvents.slice(0, 2).map(event => (
                        <div
                          key={event.id}
                          onClick={(e) => { e.stopPropagation(); setSelectedEventId(event.id); }}
                          className={`px-2 py-1 rounded-lg text-[8px] font-black truncate transition-all cursor-pointer ${CATEGORY_STYLES[event.category]?.bg || 'bg-gray-100'} ${CATEGORY_STYLES[event.category]?.text || 'text-gray-700'} ${CATEGORY_STYLES[event.category]?.border || 'border-gray-200'} border shadow-sm hover:scale-[1.02]`}
                        >
                          {event.time} {event.title}
                        </div>
                      ))}
                      {dayEvents.length > 2 && (
                        <button
                          onClick={(e) => { e.stopPropagation(); openDayEvents(dateStr); }}
                          className="text-[8px] font-black text-blue-600 hover:underline w-full text-left pl-1"
                        >
                          +{dayEvents.length - 2} mais...
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sidebar Categories Legend */}
        <div className="lg:col-span-3 space-y-8">
          <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
            <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-6">Legenda Ministerial</h3>
            <div className="space-y-4">
              {(Object.keys(CATEGORY_STYLES) as EventCategory[]).map(cat => (
                <div key={cat} className="flex items-center gap-4 group cursor-pointer">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${CATEGORY_STYLES[cat].bg} ${CATEGORY_STYLES[cat].text}`}>
                    {React.createElement(CATEGORY_STYLES[cat].icon, { size: 18 })}
                  </div>
                  <span className="text-xs font-black text-gray-600 group-hover:text-blue-600 uppercase tracking-tight">{CATEGORY_STYLES[cat].label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 rounded-[2.5rem] text-white shadow-xl shadow-blue-200 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
            <CalendarIcon size={32} className="text-amber-400 mb-4" />
            <h4 className="text-lg font-black mb-2 leading-tight">Gestão Inteligente</h4>
            <p className="text-xs font-medium text-blue-100 leading-relaxed">Seus eventos têm cotação de presença automática. Convide membros e monitore o check-in.</p>
          </div>
        </div>
      </div>

      {/* EVENT CREATION MODAL */}
      {showEventModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-blue-950/80 backdrop-blur-md animate-in fade-in" onClick={() => setShowEventModal(false)}></div>
          <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl relative overflow-hidden animate-in zoom-in duration-300 flex flex-col max-h-[90vh]">
            <div className="p-8 border-b bg-gray-50/50 flex justify-between items-center shrink-0">
              <div>
                <h2 className="text-2xl font-black text-gray-800 tracking-tight">{isEditing ? 'Ajustar Actividade' : 'Novo Planejamento'}</h2>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Configurações de equipe e participantes</p>
              </div>
              <button onClick={() => setShowEventModal(false)} className="p-2 hover:bg-white rounded-full transition-colors"><X size={24} /></button>
            </div>

            <div className="p-10 space-y-6 overflow-y-auto scrollbar-hide">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2 space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Título da Actividade</label>
                  <input type="text" className="w-full p-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 text-sm font-bold" value={formData.title || ''} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="Ex: Conferência Ministerial 2024" />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Data</label>
                  <input type="date" min={formatLocalDate(new Date())} className="w-full p-4 bg-gray-50 rounded-2xl outline-none text-sm font-bold focus:ring-2 focus:ring-blue-600" value={formData.date || ''} onChange={e => setFormData({ ...formData, date: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Horário</label>
                  <input type="time" className="w-full p-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 text-sm font-bold" value={formData.time || ''} onChange={e => setFormData({ ...formData, time: e.target.value })} />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Categoria</label>
                  <select className="w-full p-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 text-sm font-bold" value={formData.category || 'CULT'} onChange={e => setFormData({ ...formData, category: e.target.value as EventCategory })}>
                    {(Object.keys(CATEGORY_STYLES) as EventCategory[]).map(cat => (
                      <option key={cat} value={cat}>{CATEGORY_STYLES[cat].label}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Local</label>
                  <input type="text" className="w-full p-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 text-sm font-bold" value={formData.location || ''} onChange={e => setFormData({ ...formData, location: e.target.value })} placeholder="Templo Sede" />
                </div>
              </div>

              {/* ADD MEMBERS TO ACTIVITY FIELD */}
              <div className="space-y-3 pt-4 border-t border-gray-50">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Convocar Membros Específicos</label>
                  <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg">{(formData.invitedMemberIds || []).length} Adicionados</span>
                </div>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                  <input
                    type="text"
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 text-sm font-bold"
                    placeholder="Pesquisar membro para convocar..."
                    value={memberSearch}
                    onChange={e => setMemberSearch(e.target.value)}
                  />
                  {filteredMembers.length > 0 && (
                    <div className="absolute top-full left-0 w-full mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 p-2 space-y-1">
                      {filteredMembers.map(m => (
                        <button
                          key={m.id}
                          onClick={() => { toggleMemberInvite(m.id); setMemberSearch(''); }}
                          className={`w-full p-3 rounded-xl flex items-center justify-between text-left transition-all hover:bg-gray-50 ${formData.invitedMemberIds?.includes(m.id) ? 'bg-blue-50' : ''}`}
                        >
                          <div className="flex items-center gap-3">
                            <AvatarPlaceholder
                              name={m.name}
                              id={m.id}
                              photoUrl={m.photoUrl}
                              className="w-8 h-8 rounded-lg object-cover"
                            />
                            <span className="text-sm font-bold text-gray-800">{m.name}</span>
                          </div>
                          {formData.invitedMemberIds?.includes(m.id) ? <X size={16} className="text-red-500" /> : <UserPlus size={16} className="text-blue-600" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto scrollbar-hide">
                  {(formData.invitedMemberIds || []).map(id => {
                    const m = state.members.find(member => member.id === id);
                    return m ? (
                      <div key={id} className="flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase border border-blue-100">
                        {m.name.split(' ')[0]}
                        <button onClick={() => toggleMemberInvite(id)} className="p-0.5 hover:bg-blue-200 rounded-md"><X size={12} /></button>
                      </div>
                    ) : null;
                  })}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Recursos & Descrição</label>
                <textarea className="w-full p-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 text-sm font-medium h-24 resize-none" value={formData.description || ''} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Instruções para a equipe técnica e avisos..." />
              </div>
            </div>

            <div className="p-8 bg-gray-50 border-t flex gap-4 shrink-0">
              <button onClick={() => setShowEventModal(false)} className="flex-1 py-4 text-xs font-black uppercase text-gray-400">Descartar</button>
              <button onClick={handleSaveEvent} className="flex-1 py-4 bg-blue-600 text-white rounded-2xl text-xs font-black uppercase shadow-xl flex items-center justify-center gap-2 active:scale-95 transition-all"><Save size={18} /> {isEditing ? 'Atualizar Actividade' : 'Publicar Agenda'}</button>
            </div>
          </div>
        </div>
      )}

      {/* DAY EVENTS LISTING MODAL */}
      {showDayEventsModal && selectedDayDate && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-blue-950/80 backdrop-blur-md animate-in fade-in" onClick={() => setShowDayEventsModal(false)}></div>
          <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl relative overflow-hidden animate-in zoom-in duration-300 flex flex-col max-h-[80vh]">
            <div className="p-8 border-b bg-gray-50/50 flex justify-between items-center shrink-0">
              <div>
                <h2 className="text-2xl font-black text-gray-800 tracking-tight">Planejamentos do Dia</h2>
                <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mt-1">
                  {new Date(selectedDayDate + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
              <button onClick={() => setShowDayEventsModal(false)} className="p-2 hover:bg-white rounded-full transition-colors"><X size={24} /></button>
            </div>

            <div className="p-6 overflow-y-auto space-y-3">
              {dayEventsForModal.length === 0 ? (
                <div className="text-center py-12">
                  <CalendarIcon size={48} className="mx-auto text-gray-200 mb-4" />
                  <p className="text-gray-400 font-bold">Nenhum planejamento para este dia.</p>
                </div>
              ) : (
                dayEventsForModal.map(event => {
                  const catStyle = CATEGORY_STYLES[event.category] || CATEGORY_STYLES.SPECIAL;
                  return (
                    <div key={event.id} className={`p-5 rounded-2xl border ${catStyle.border} ${catStyle.bg} transition-all hover:shadow-md`}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h4 className={`text-sm font-black ${catStyle.text} truncate`}>{event.title}</h4>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-[9px] font-black text-gray-500 uppercase flex items-center gap-1"><Clock size={10} /> {event.time}</span>
                            <span className="text-[9px] font-black text-gray-500 uppercase flex items-center gap-1"><MapPin size={10} /> {event.location}</span>
                          </div>
                          {event.description && <p className="text-[10px] text-gray-500 mt-2 line-clamp-2">{event.description}</p>}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => { setSelectedEventId(event.id); setShowDayEventsModal(false); }}
                            className="w-8 h-8 bg-white rounded-xl flex items-center justify-center text-blue-600 hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                            title="Ver detalhes"
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            onClick={() => { setIsEditing(true); setFormData({ ...event }); setShowDayEventsModal(false); setShowEventModal(true); }}
                            className="w-8 h-8 bg-white rounded-xl flex items-center justify-center text-amber-600 hover:bg-amber-600 hover:text-white transition-all shadow-sm"
                            title="Editar"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={() => { handleDeleteEvent(event.id); }}
                            className="w-8 h-8 bg-white rounded-xl flex items-center justify-center text-red-600 hover:bg-red-600 hover:text-white transition-all shadow-sm"
                            title="Excluir"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50/50 shrink-0">
              {(!selectedDayDate || selectedDayDate >= formatLocalDate(new Date())) && (
                <button
                  onClick={() => { setShowDayEventsModal(false); openAddEvent(new Date(selectedDayDate + 'T12:00:00')); }}
                  className="w-full py-4 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 hover:bg-blue-700 transition-all active:scale-95"
                >
                  <Plus size={16} /> Adicionar Novo Planejamento
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* DEADLINE ALERT FLOATING BANNER */}
      {showDeadlineAlert && deadlineAlerts.length > 0 && (
        <div className="fixed bottom-6 right-6 z-[300] max-w-md w-full animate-in slide-in-from-bottom-4 duration-500">
          <div className="bg-red-600 rounded-[2rem] shadow-2xl shadow-red-600/30 overflow-hidden">
            <div className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center animate-pulse">
                  <Volume2 size={24} className="text-white" />
                </div>
                <div>
                  <h4 className="text-white font-black text-sm">⚠️ Prazos Vencidos!</h4>
                  <p className="text-red-100 text-[10px] font-bold">{deadlineAlerts.length} planejamento(s) com prazo atingido ou excedido</p>
                </div>
              </div>
              <button onClick={() => setShowDeadlineAlert(false)} className="p-2 bg-white/10 rounded-xl hover:bg-white/20 transition-all text-white">
                <X size={18} />
              </button>
            </div>
            <div className="px-6 pb-4 max-h-[200px] overflow-y-auto space-y-2">
              {deadlineAlerts.slice(0, 5).map(event => (
                <div key={event.id} className="bg-white/10 p-3 rounded-xl flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-white text-xs font-black truncate">{event.title}</p>
                    <p className="text-red-200 text-[9px] font-bold">{event.date} • {event.time}</p>
                  </div>
                  <button
                    onClick={() => { setSelectedEventId(event.id); setShowDeadlineAlert(false); }}
                    className="text-[8px] font-black text-white bg-white/20 px-3 py-1.5 rounded-lg hover:bg-white/30 transition-all shrink-0 ml-2"
                  >
                    Ver
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarPage;
