
import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import {
  AppState, User, UserRole, Member, Transaction, Asset, ChurchEvent,
  AuditLog, Marriage, SchoolClass, LibraryBook, MusicSong, MusicScale,
  MediaTask, SocialBeneficiary, MaintenanceRequest, Cell, Notification, ChurchSettings
} from '../core/types';

type Action =
  | { type: 'LOGIN_SUCCESS'; payload: User }
  | { type: 'LOGOUT' }
  | { type: 'UPDATE_AUTH_USER'; payload: User }
  | { type: 'UPDATE_CHURCH_SETTINGS'; payload: ChurchSettings }
  | { type: 'ADD_MEMBER'; payload: Member }
  | { type: 'UPDATE_MEMBER'; payload: Member }
  | { type: 'DELETE_MEMBER'; payload: string }
  | { type: 'ADD_TRANSACTION'; payload: Transaction }
  | { type: 'UPDATE_TRANSACTION'; payload: Transaction }
  | { type: 'DELETE_TRANSACTION'; payload: string }
  | { type: 'REMOVE_TRANSACTION'; payload: string }
  | { type: 'ADD_ASSET'; payload: Asset }
  | { type: 'UPDATE_ASSET'; payload: Asset }
  | { type: 'DELETE_ASSET'; payload: string }
  | { type: 'ADD_EVENT'; payload: ChurchEvent }
  | { type: 'UPDATE_EVENT'; payload: ChurchEvent }
  | { type: 'DELETE_EVENT'; payload: string }
  | { type: 'ADD_CELL'; payload: Cell }
  | { type: 'DELETE_CELL'; payload: string }
  | { type: 'ADD_SCHOOL_CLASS'; payload: SchoolClass }
  | { type: 'UPDATE_SCHOOL_CLASS'; payload: SchoolClass }
  | { type: 'DELETE_SCHOOL_CLASS'; payload: string }
  | { type: 'SAVE_ATTENDANCE'; payload: { classId: string, date: string, presentIds: string[] } }
  | { type: 'ENROLL_STUDENT'; payload: { classId: string, memberId: string } }
  | { type: 'ADD_BOOK'; payload: LibraryBook }
  | { type: 'UPDATE_BOOK'; payload: LibraryBook }
  | { type: 'DELETE_BOOK'; payload: string }
  | { type: 'LOAN_BOOK'; payload: { bookId: string, borrower: { memberId: string, memberName: string, loanDate: string, dueDate: string } } }
  | { type: 'RETURN_BOOK'; payload: { bookId: string, memberId: string } }
  | { type: 'ADD_SONG'; payload: MusicSong }
  | { type: 'DELETE_SONG'; payload: string }
  | { type: 'ADD_MEDIA_TASK'; payload: MediaTask }
  | { type: 'UPDATE_MEDIA_TASK'; payload: MediaTask }
  | { type: 'ADD_BENEFICIARY'; payload: SocialBeneficiary }
  | { type: 'UPDATE_BENEFICIARY'; payload: SocialBeneficiary }
  | { type: 'DELETE_BENEFICIARY'; payload: string }
  | { type: 'ADD_LOG'; payload: AuditLog }
  | { type: 'ADD_USER'; payload: User }
  | { type: 'UPDATE_USER'; payload: User }
  | { type: 'ADD_MARRIAGE'; payload: Marriage }
  | { type: 'UPDATE_MARRIAGE'; payload: Marriage }
  | { type: 'ADD_NOTIFICATION'; payload: { message: string, type: Notification['type'] } }
  | { type: 'REMOVE_NOTIFICATION'; payload: string }
  | { type: 'SYNC_STORAGE'; payload: Partial<ExtendedAppState> };

interface ExtendedAppState extends AppState {
  users: User[];
  departments: any[];
}

const defaultChurchSettings: ChurchSettings = {
  nomeIgreja: 'Igreja EclesiaMaster',
  sigla: 'IEM',
  cnpj: '00.000.000/0001-00',
  dataFundacao: '2010-01-01',
  denominacao: 'Cristã Evangélica',
  telefone: '(11) 99999-9999',
  email: 'contato@eclesiamaster.com',
  website: 'www.eclesiamaster.com',
  endereco: {
    logradouro: 'Rua das Oliveiras',
    numero: '100',
    bairro: 'Jardim Canaã',
    cidade: 'São Paulo',
    estado: 'SP',
    cep: '00000-000'
  },
  redesSociais: {
    facebook: 'facebook.com/eclesiamaster',
    instagram: 'instagram.com/eclesiamaster'
  },
  cores: {
    primaria: '#1e40af',
    secundaria: '#f59e0b'
  },
  missao: 'Propagar o evangelho através do amor e da tecnologia.',
  visao: 'Ser referência em gestão eclesiástica em toda a América Latina.',
  valores: 'Fé, Integridade, Inovação e Serviço.',
  lideranca: []
};

const initialState: ExtendedAppState = {
  auth: { user: null, isAuthenticated: false, loading: true },
  members: [], marriages: [], transactions: [], assets: [],
  events: [], logs: [], users: [], cells: [], schoolClasses: [],
  books: [], songs: [], scales: [], mediaTasks: [],
  beneficiaries: [], maintenances: [], notifications: [],
  departments: [],
  churchSettings: defaultChurchSettings
};

const appReducer = (state: ExtendedAppState, action: Action): ExtendedAppState => {
  switch (action.type) {
    case 'SYNC_STORAGE':
      return {
        ...state,
        ...action.payload,
        auth: { ...state.auth, loading: false },
        churchSettings: action.payload.churchSettings || state.churchSettings
      };
    case 'LOGIN_SUCCESS':
      return { ...state, auth: { user: action.payload, isAuthenticated: true, loading: false } };
    case 'LOGOUT':
      return { ...initialState, auth: { user: null, isAuthenticated: false, loading: false } };

    case 'UPDATE_AUTH_USER':
      return {
        ...state,
        auth: { ...state.auth, user: action.payload },
        users: state.users.map(u => u.id === action.payload.id ? action.payload : u)
      };

    case 'UPDATE_CHURCH_SETTINGS':
      return { ...state, churchSettings: action.payload };

    // Toasts
    case 'ADD_NOTIFICATION':
      return { ...state, notifications: [...state.notifications, { id: Math.random().toString(), ...action.payload }] };
    case 'REMOVE_NOTIFICATION':
      return { ...state, notifications: state.notifications.filter(n => n.id !== action.payload) };

    // Sunday School Attendance
    case 'SAVE_ATTENDANCE':
      return {
        ...state,
        schoolClasses: state.schoolClasses.map(c => {
          if (c.id !== action.payload.classId) return c;
          const existing = c.attendance || [];
          const filtered = existing.filter(r => r.date !== action.payload.date);
          return {
            ...c,
            attendance: [...filtered, { date: action.payload.date, presentStudentIds: action.payload.presentIds }]
          };
        })
      };

    // Cells CRUD
    case 'ADD_CELL': return { ...state, cells: [action.payload, ...(state.cells || [])] };
    case 'DELETE_CELL': return { ...state, cells: state.cells.filter(c => c.id !== action.payload) };

    // Library real logic
    case 'LOAN_BOOK':
      return {
        ...state,
        books: state.books.map(b => b.id === action.payload.bookId
          ? { ...b, availableQuantity: b.availableQuantity - 1, borrowers: [...b.borrowers, action.payload.borrower] }
          : b)
      };
    case 'RETURN_BOOK':
      return {
        ...state,
        books: state.books.map(b => b.id === action.payload.bookId
          ? { ...b, availableQuantity: b.availableQuantity + 1, borrowers: b.borrowers.filter(br => br.memberId !== action.payload.memberId) }
          : b)
      };

    // Sunday School real enrollment
    case 'ENROLL_STUDENT':
      return {
        ...state,
        schoolClasses: state.schoolClasses.map(c => c.id === action.payload.classId
          ? { ...c, studentIds: [...(c.studentIds || []), action.payload.memberId], studentsCount: (c.studentIds?.length || 0) + 1 }
          : c)
      };

    // User & Marriage CRUD
    case 'ADD_USER': return { ...state, users: [action.payload, ...state.users] };
    case 'UPDATE_USER': return { ...state, users: state.users.map(u => u.id === action.payload.id ? action.payload : u) };
    case 'ADD_MARRIAGE': return { ...state, marriages: [action.payload, ...state.marriages] };
    case 'UPDATE_MARRIAGE': return { ...state, marriages: state.marriages.map(m => m.id === action.payload.id ? action.payload : m) };

    // CRUD Patterns
    case 'ADD_MEMBER': return { ...state, members: [action.payload, ...state.members] };
    case 'UPDATE_MEMBER': return { ...state, members: state.members.map(m => m.id === action.payload.id ? action.payload : m) };
    case 'DELETE_MEMBER': return { ...state, members: state.members.filter(m => m.id !== action.payload) };
    case 'ADD_TRANSACTION': return { ...state, transactions: [action.payload, ...state.transactions] };
    case 'UPDATE_TRANSACTION': return { ...state, transactions: state.transactions.map(t => t.id === action.payload.id ? action.payload : t) };
    case 'DELETE_TRANSACTION':
    case 'REMOVE_TRANSACTION':
      return { ...state, transactions: state.transactions.filter(t => t.id !== action.payload) };
    case 'ADD_ASSET': return { ...state, assets: [action.payload, ...state.assets] };
    case 'UPDATE_ASSET': return { ...state, assets: state.assets.map(a => a.id === action.payload.id ? action.payload : a) };
    case 'DELETE_ASSET': return { ...state, assets: state.assets.filter(a => a.id !== action.payload) };
    case 'ADD_EVENT': return { ...state, events: [action.payload, ...state.events] };
    case 'UPDATE_EVENT': return { ...state, events: state.events.map(e => e.id === action.payload.id ? action.payload : e) };
    case 'DELETE_EVENT': return { ...state, events: state.events.filter(e => e.id !== action.payload) };
    case 'ADD_SCHOOL_CLASS': return { ...state, schoolClasses: [action.payload, ...state.schoolClasses] };
    case 'UPDATE_SCHOOL_CLASS': return { ...state, schoolClasses: state.schoolClasses.map(c => c.id === action.payload.id ? action.payload : c) };
    case 'DELETE_SCHOOL_CLASS': return { ...state, schoolClasses: state.schoolClasses.filter(c => c.id !== action.payload) };
    case 'ADD_BOOK': return { ...state, books: [action.payload, ...state.books] };
    case 'UPDATE_BOOK': return { ...state, books: state.books.map(b => b.id === action.payload.id ? action.payload : b) };
    case 'DELETE_BOOK': return { ...state, books: state.books.filter(b => b.id !== action.payload) };
    case 'ADD_SONG': return { ...state, songs: [action.payload, ...state.songs] };
    case 'DELETE_SONG': return { ...state, songs: state.songs.filter(s => s.id !== action.payload) };
    case 'ADD_MEDIA_TASK': return { ...state, mediaTasks: [action.payload, ...state.mediaTasks] };
    case 'UPDATE_MEDIA_TASK': return { ...state, mediaTasks: state.mediaTasks.map(t => t.id === action.payload.id ? action.payload : t) };
    case 'ADD_BENEFICIARY': return { ...state, beneficiaries: [action.payload, ...state.beneficiaries] };
    case 'UPDATE_BENEFICIARY': return { ...state, beneficiaries: state.beneficiaries.map(b => b.id === action.payload.id ? action.payload : b) };
    case 'DELETE_BENEFICIARY': return { ...state, beneficiaries: state.beneficiaries.filter(b => b.id !== action.payload) };
    case 'ADD_LOG': return { ...state, logs: [action.payload, ...state.logs] };

    default: return state;
  }
};

const AppContext = createContext<{ state: ExtendedAppState; dispatch: React.Dispatch<Action> } | undefined>(undefined);

export const AppProvider = ({ children }: { children?: ReactNode }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Intercetador Global de Fetch para expiração de sessão
  useEffect(() => {
    const { fetch: originalFetch } = window;
    window.fetch = async (...args) => {
      try {
        const response = await originalFetch(...args);
        
        // Se receber 401 (Não autorizado) ou 403 (Proibido/Expirado) em rotas de API
        if ((response.status === 401 || response.status === 403)) {
          const url = typeof args[0] === 'string' ? args[0] : (args[0] as Request).url;
          
          // Não deslogar se for a própria rota de login ou refresh
          if (url.includes('/api/') && !url.includes('/login') && !url.includes('/auth/')) {
            console.log('⚠️ Sessão expirada detectada via Fetch Interceptor. Redirecionando...');
            dispatch({ type: 'LOGOUT' });
            
            // Notificar apenas uma vez (evitar spam de mensagens)
            if (!state.notifications.some(n => n.message.includes('Sessão expirada'))) {
              dispatch({ 
                type: 'ADD_NOTIFICATION', 
                payload: { 
                  message: 'Sua sessão expirou devido a inatividade. Por favor, entre novamente.', 
                  type: 'error' 
                } 
              });
            }
          }
        }
        return response;
      } catch (error) {
        throw error;
      }
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, [dispatch, state.notifications]);

  useEffect(() => {
    const savedAuth = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (savedAuth && token) {
      dispatch({ type: 'LOGIN_SUCCESS', payload: JSON.parse(savedAuth) });
    } else {
      dispatch({ type: 'SYNC_STORAGE', payload: {} });
    }
  }, []);

  // Novo useEffect para carregar dados do banco quando logado
  useEffect(() => {
    if (state.auth.isAuthenticated) {
      const fetchData = async () => {
        const token = localStorage.getItem('token');
        const headers = { 'Authorization': `Bearer ${token}` };

        const safeFetch = async (url: string) => {
          try {
            const res = await fetch(url, { headers });
            if (!res.ok) throw new Error(`Status: ${res.status}`);
            return await res.json();
          } catch (e) {
            console.error(`Error fetching ${url}:`, e);
            return null;
          }
        };

        const [
          members, tithes, offerings, expenses, inventory, events,
          marriages, departments, schoolClasses, libraryBooks, settings, users, auditLogs, social
        ] = await Promise.all([
          safeFetch('/api/members'),
          safeFetch('/api/finance/tithes'),
          safeFetch('/api/finance/offerings'),
          safeFetch('/api/finance/expenses'),
          safeFetch('/api/inventory'),
          safeFetch('/api/events'),
          safeFetch('/api/marriages'),
          safeFetch('/api/departments'),
          safeFetch('/api/school/classes'),
          safeFetch('/api/library/books'),
          safeFetch('/api/settings'),
          safeFetch('/api/users'),
          safeFetch('/api/audit'),
          safeFetch('/api/social')
        ]);

        console.log('--- SYNC DEBUG ---');
        console.log('Members:', members?.length || 0);
        console.log('Users:', users?.length || 0);
        console.log('Marriages:', marriages?.length || 0);
        console.log('Tithes:', tithes?.length || 0);
        console.log('Offerings:', offerings?.length || 0);
        console.log('Expenses:', expenses?.length || 0);
        console.log('Total Transactions:', (tithes?.length || 0) + (offerings?.length || 0) + (expenses?.length || 0));

        const payload: Partial<ExtendedAppState> = {};
        if (members) payload.members = members;
        if (users) payload.users = users;
        if (tithes || offerings || expenses) payload.transactions = [
          ...(tithes || []),
          ...(offerings || []),
          ...(expenses || [])
        ];
        if (inventory) {
          payload.assets = inventory.map((a: any) => ({
            ...a,
            category: a.category === 'IMÓVEL' ? 'REAL_ESTATE' :
              a.category === 'VEICULO' ? 'VEHICLE' :
                a.category === 'EQUIPAMENTO' ? 'EQUIPMENT' :
                  a.category === 'MOBILIARIO' ? 'FURNITURE' : a.category,
            status: a.status === 'BOM' ? 'GOOD' :
              a.status === 'REPARO' ? 'NEED_REPAIR' :
                a.status === 'DANIFICADO' ? 'DAMAGED' : 'GOOD'
          }));
        }
        if (events) payload.events = events;
        if (departments) payload.departments = departments;
        if (marriages) {
          payload.marriages = marriages.map((m: any) => ({
            ...m,
            status: m.status === 'EM_PROCESSO' ? 'IN_PROCESS' :
              m.status === 'REALIZADO' ? 'PERFORMED' :
                m.status === 'CANCELADO' ? 'CANCELED' : m.status
          }));
        }
        if (schoolClasses) payload.schoolClasses = schoolClasses;
        if (libraryBooks) payload.books = libraryBooks;
        if (settings) payload.churchSettings = settings;
        if (auditLogs) payload.logs = auditLogs;
        if (social) payload.beneficiaries = social;

        if (Object.keys(payload).length > 0) {
          dispatch({ type: 'SYNC_STORAGE', payload });
        }
      };

      fetchData();
    }
  }, [state.auth.isAuthenticated]);

  useEffect(() => {
    if (!state.auth.loading) {
      const { auth, notifications, members, transactions, assets, events, logs, users, cells, schoolClasses, books, songs, scales, mediaTasks, beneficiaries, maintenances, departments, ...dataToSave } = state;
      try {
        localStorage.setItem('eclesia_master_db', JSON.stringify(dataToSave));
        if (auth.user) localStorage.setItem('user', JSON.stringify(auth.user));
      } catch (e) {
        console.error('Error saving to localStorage:', e);
      }
    }
  }, [state]);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) throw new Error('useApp must be used within an AppProvider');
  return context;
};
