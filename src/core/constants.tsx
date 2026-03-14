
import React from 'react';
import { 
  LayoutDashboard, Users, Heart, DollarSign, Package, 
  Calendar, BarChart3, UserCog, Settings, ShieldCheck,
  Network, GraduationCap, Library, FileText, LayoutGrid
} from 'lucide-react';
import { UserRole } from './types';

export const COLORS = {
  primary: '#1e40af',
  secondary: '#f59e0b',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  background: '#f9fafb',
  sidebar: '#1e3a8a'
};

export const MENU_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} />, roles: [UserRole.SUPER_ADMIN, UserRole.PASTOR, UserRole.TREASURER, UserRole.SECRETARY, UserRole.USER] },
  { id: 'members', label: 'Membros', icon: <Users size={20} />, roles: [UserRole.SUPER_ADMIN, UserRole.PASTOR, UserRole.SECRETARY] },
  { id: 'cells', label: 'Células', icon: <Network size={20} />, roles: [UserRole.SUPER_ADMIN, UserRole.PASTOR, UserRole.SECRETARY] },
  { id: 'departments', label: 'Departamentos', icon: <LayoutGrid size={20} />, roles: [UserRole.SUPER_ADMIN, UserRole.PASTOR, UserRole.SECRETARY] },
  { id: 'marriages', label: 'Casamentos', icon: <Heart size={20} />, roles: [UserRole.SUPER_ADMIN, UserRole.PASTOR, UserRole.SECRETARY] },
  { id: 'finance', label: 'Financeiro', icon: <DollarSign size={20} />, roles: [UserRole.SUPER_ADMIN, UserRole.PASTOR, UserRole.TREASURER] },
  { id: 'school', label: 'Escola Dominical', icon: <GraduationCap size={20} />, roles: [UserRole.SUPER_ADMIN, UserRole.PASTOR, UserRole.SECRETARY] },
  { id: 'library', label: 'Biblioteca', icon: <Library size={20} />, roles: [UserRole.SUPER_ADMIN, UserRole.PASTOR, UserRole.SECRETARY, UserRole.USER] },
  { id: 'documents', label: 'Documentos', icon: <FileText size={20} />, roles: [UserRole.SUPER_ADMIN, UserRole.PASTOR, UserRole.SECRETARY] },
  { id: 'assets', label: 'Patrimônio', icon: <Package size={20} />, roles: [UserRole.SUPER_ADMIN, UserRole.PASTOR, UserRole.TREASURER] },
  { id: 'calendar', label: 'Calendário', icon: <Calendar size={20} />, roles: [UserRole.SUPER_ADMIN, UserRole.PASTOR, UserRole.SECRETARY, UserRole.USER] },
  { id: 'reports', label: 'Relatórios', icon: <BarChart3 size={20} />, roles: [UserRole.SUPER_ADMIN, UserRole.PASTOR, UserRole.TREASURER] },
  { id: 'users', label: 'Usuários', icon: <UserCog size={20} />, roles: [UserRole.SUPER_ADMIN] },
  { id: 'audit', label: 'Auditoria', icon: <ShieldCheck size={20} />, roles: [UserRole.SUPER_ADMIN] },
  { id: 'settings', label: 'Configurações', icon: <Settings size={20} />, roles: [UserRole.SUPER_ADMIN, UserRole.PASTOR] },
];
