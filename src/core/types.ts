
export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  PASTOR = 'PASTOR',
  TREASURER = 'TREASURER',
  SECRETARY = 'SECRETARY',
  USER = 'USER'
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  photoUrl?: string;
  lastLogin: string;
}

export interface ChurchLeader {
  id: string;
  name: string;
  role: string;
  photoUrl?: string;
  termStart: string;
  termEnd?: string;
}

export interface ChurchSettings {
  nomeIgreja: string;
  sigla?: string;
  cnpj: string;
  dataFundacao: string;
  denominacao: string;
  telefone: string;
  email: string;
  website?: string;
  endereco: {
    logradouro: string;
    numero: string;
    bairro: string;
    cidade: string;
    estado: string;
    cep: string;
  };
  redesSociais: {
    facebook?: string;
    instagram?: string;
    youtube?: string;
  };
  logo?: string;
  cores: {
    primaria: string;
    secundaria: string;
  };
  missao: string;
  visao: string;
  valores: string;
  lideranca: ChurchLeader[];
}

export type AuditCategory = 'LOGIN' | 'MEMBERS' | 'FINANCE' | 'SECURITY' | 'EXPORT' | 'SYSTEM' | 'MARRIAGE' | 'ASSETS' | 'CELLS' | 'DOCUMENTS' | 'DEPARTMENTS' | 'LIBRARY' | 'SCHOOL';
export type AuditSeverity = 'LOW' | 'MEDIUM' | 'HIGH';

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  userEmail?: string;
  userPhone?: string;
  userPhotoUrl?: string;
  action: string;
  category: AuditCategory;
  severity: AuditSeverity;
  target: string;
  timestamp: string;
  ip: string;
  device?: string;
  details?: string;
  isSuspicious?: boolean;
}

export interface Cell {
  id: string;
  name: string;
  leaderId: string;
  leaderName: string;
  hostName: string;
  address: string;
  dayOfWeek: string;
  time: string;
  membersCount: number;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface AttendanceRecord {
  date: string;
  presentStudentIds: string[];
}

export interface SchoolClass {
  id: string;
  name: string;
  teacherName: string;
  ageGroup: string;
  room: string;
  studentsCount: number;
  studentIds?: string[];
  attendance?: AttendanceRecord[];
}

export interface BookBorrower {
  memberId: string;
  memberName: string;
  loanDate: string;
  dueDate: string;
}

export interface LibraryBook {
  id: string;
  title: string;
  author: string;
  category: string;
  totalQuantity: number;
  availableQuantity: number;
  borrowers: BookBorrower[];
}

export interface MusicSong {
  id: string;
  title: string;
  artist: string;
  key: string;
  link?: string;
  bpm?: number;
  category: 'WORSHIP' | 'CELEBRATION' | 'HYMN' | 'SPECIAL';
}

export interface MusicScale {
  id: string;
  date: string;
  leader: string;
  musicians: { role: string, name: string }[];
  songs: string[];
}

export interface MediaTask {
  id: string;
  title: string;
  deadline: string;
  responsible: string;
  status: 'PENDING' | 'RECORDING' | 'EDITING' | 'DONE';
  type: 'VIDEO' | 'SOCIAL_MEDIA' | 'LIVE_STREAM' | 'DESIGN';
}

export interface SocialBeneficiary {
  id: string;
  name: string;
  phone: string;
  needs: string;
  lastAidDate?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'URGENT';
}

export interface MaintenanceRequest {
  id: string;
  title: string;
  location: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'OPEN' | 'IN_PROGRESS' | 'FINISHED';
  requester: string;
  date: string;
}

export interface MemberOccurrence {
  id: string;
  date: string;
  type: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
  title: string;
  description: string;
}

export interface Member {
  id: string;
  name: string;
  bi: string;
  birthDate: string;
  gender: 'M' | 'F';
  maritalStatus: 'SINGLE' | 'MARRIED' | 'DIVORCED' | 'WIDOW' | 'CONCUBINAGE';
  naturality: string;
  province: string;
  conversionDate: string;
  status: 'active' | 'inactive' | 'transferred' | 'deceased';
  role: string;
  department: string;
  phone: string;
  email: string;
  address: string;
  photoUrl?: string;
  expectedTithe?: number;
  employmentStatus?: 'TRABALHADOR' | 'NEGOCIO' | 'DESEMPREGADO' | 'NAO_TRABALHA';
  occurrences: MemberOccurrence[];
  profession?: string;
  schooling?: string;
  baptismDate?: string;
  fatherName?: string;
  motherName?: string;
  family?: {
    spouse?: string;
    children?: string[];
  };
}

export interface Marriage {
  id: string;
  groomName: string;
  groomIsMember: boolean;
  brideName: string;
  brideIsMember: boolean;
  date: string;
  time: string;
  location: string;
  officiant: string;
  status: 'IN_PROCESS' | 'PERFORMED' | 'CANCELED';
  witnesses?: string;
  documentationStatus?: 'PENDING' | 'COMPLETE';
}

export type TransactionType = 'TITHES' | 'OFFERING' | 'EXPENSE' | 'SPECIAL';

export interface Transaction {
  id: string;
  date: string;
  month: number;
  year: number;
  description: string;
  amount: number;
  type: TransactionType;
  memberId?: string;
  memberName?: string;
  method: 'PIX' | 'CASH' | 'CARD' | 'TRANSFER';
  category: string;
}

export interface Asset {
  id: string;
  code: string;
  name: string;
  category: 'REAL_ESTATE' | 'VEHICLE' | 'EQUIPMENT' | 'FURNITURE';
  purchaseDate: string;
  purchaseValue: number;
  currentValue: number;
  status: 'GOOD' | 'NEED_REPAIR' | 'DAMAGED';
}

export type EventCategory = 'CULT' | 'MEETING' | 'SPECIAL' | 'MARRIAGE' | 'CELL' | 'REHEARSAL' | 'BAPTISM' | 'BIRTHDAY' | 'COMMEMORATIVE';

export interface ChurchEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  category: EventCategory;
  description: string;
  location: string;
  checkInList?: string[];
  invitedMemberIds?: string[];
  responsible?: string;
  participantsCount?: number;
  isRecurring?: boolean;
}

export interface Notification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
}

export interface AppState {
  auth: AuthState;
  members: Member[];
  marriages: Marriage[];
  transactions: Transaction[];
  assets: Asset[];
  events: ChurchEvent[];
  logs: AuditLog[];
  cells: Cell[];
  schoolClasses: SchoolClass[];
  books: LibraryBook[];
  songs: MusicSong[];
  scales: MusicScale[];
  mediaTasks: MediaTask[];
  beneficiaries: SocialBeneficiary[];
  maintenances: MaintenanceRequest[];
  notifications: Notification[];
  churchSettings: ChurchSettings;
}
