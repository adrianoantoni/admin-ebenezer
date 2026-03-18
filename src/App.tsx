
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext.tsx';
import Sidebar from './components/Layout/Sidebar.tsx';
import Header from './components/Layout/Header.tsx';
import ToastContainer from './components/Layout/ToastContainer.tsx';
import SOCAssistant from './components/Layout/SOCAssistant.tsx';
import Home from './pages/Home.tsx';
import Dashboard from './pages/Dashboard.tsx';
import Members from './pages/Members.tsx';
import Finance from './pages/Finance.tsx';
import Patrimony from './pages/Patrimony.tsx';
import CalendarPage from './pages/Calendar.tsx';
import Reports from './pages/Reports.tsx';
import UsersPage from './pages/Users.tsx';
import AuditLogs from './pages/AuditLogs.tsx';
import Login from './pages/Login.tsx';
import Marriages from './pages/Marriages.tsx';
import Cells from './pages/Cells.tsx';
import SundaySchool from './pages/SundaySchool.tsx';
import LibraryPage from './pages/Library.tsx';
import Documents from './pages/Documents.tsx';
import Departments from './pages/Departments.tsx';
import SettingsPage from './pages/Settings.tsx';
import ResetPassword from './pages/ResetPassword.tsx';
import { useApp } from './context/AppContext.tsx';

const PrivateRoute = ({ children }: { children?: React.ReactNode }) => {
  const { state } = useApp();
  if (state.auth.loading) return <div className="h-screen w-screen flex items-center justify-center bg-blue-50 text-blue-900 font-bold italic">Iniciando {state.churchSettings?.nomeIgreja || 'Igreja Baptista da Sapú'}...</div>;
  return state.auth.isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

const MainLayout = ({ children }: { children?: React.ReactNode }) => {
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 768);

  return (
    <div className="flex min-h-screen bg-gray-50 overflow-hidden w-full max-w-full relative touch-none md:touch-auto">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      <div 
        className={`flex-1 flex flex-col min-w-0 w-full ${sidebarOpen ? 'md:ml-64' : 'ml-0 md:ml-20'} transition-all duration-300 relative z-0`}
        style={{ touchAction: 'auto' }}
      >
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-8 scrollbar-hide">
          <div className="max-w-[100vw] overflow-x-hidden">
            {children}
          </div>
        </main>
      </div>
      <ToastContainer />
      <SOCAssistant />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/dashboard" element={<PrivateRoute><MainLayout><Dashboard /></MainLayout></PrivateRoute>} />
          <Route path="/members" element={<PrivateRoute><MainLayout><Members /></MainLayout></PrivateRoute>} />
          <Route path="/cells" element={<PrivateRoute><MainLayout><Cells /></MainLayout></PrivateRoute>} />
          <Route path="/departments" element={<PrivateRoute><MainLayout><Departments /></MainLayout></PrivateRoute>} />
          <Route path="/marriages" element={<PrivateRoute><MainLayout><Marriages /></MainLayout></PrivateRoute>} />
          <Route path="/finance" element={<PrivateRoute><MainLayout><Finance /></MainLayout></PrivateRoute>} />
          <Route path="/school" element={<PrivateRoute><MainLayout><SundaySchool /></MainLayout></PrivateRoute>} />
          <Route path="/library" element={<PrivateRoute><MainLayout><LibraryPage /></MainLayout></PrivateRoute>} />
          <Route path="/documents" element={<PrivateRoute><MainLayout><Documents /></MainLayout></PrivateRoute>} />
          <Route path="/assets" element={<PrivateRoute><MainLayout><Patrimony /></MainLayout></PrivateRoute>} />
          <Route path="/calendar" element={<PrivateRoute><MainLayout><CalendarPage /></MainLayout></PrivateRoute>} />
          <Route path="/reports" element={<PrivateRoute><MainLayout><Reports /></MainLayout></PrivateRoute>} />
          <Route path="/users" element={<PrivateRoute><MainLayout><UsersPage /></MainLayout></PrivateRoute>} />
          <Route path="/audit" element={<PrivateRoute><MainLayout><AuditLogs /></MainLayout></PrivateRoute>} />
          <Route path="/settings" element={<PrivateRoute><MainLayout><SettingsPage /></MainLayout></PrivateRoute>} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </AppProvider>
  );
}
