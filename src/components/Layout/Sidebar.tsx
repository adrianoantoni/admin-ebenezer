
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { MENU_ITEMS, COLORS } from '../../core/constants';
import { useApp } from '../../context/AppContext';
import { ChevronLeft, ChevronRight, Church } from 'lucide-react';
import AvatarPlaceholder from '../AvatarPlaceholder';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen }) => {
  const { state } = useApp();
  const location = useLocation();
  const userRole = state.auth.user?.role;

  const filteredMenu = MENU_ITEMS.filter(item =>
    userRole && item.roles.includes(userRole)
  );

  return (
    <>
      {/* Mobile Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity md:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsOpen(false)}
      />

      <aside
        className={`fixed top-0 left-0 h-full bg-[#1e3a8a] text-white z-50 sidebar-transition flex flex-col shadow-2xl
          ${isOpen ? 'w-64 translate-x-0' : 'w-20 -translate-x-full md:translate-x-0'}
        `}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-white/10 shrink-0">
          <div className={`flex items-center gap-3 overflow-hidden ${!isOpen && 'md:justify-center w-full'}`}>
            <div className="bg-amber-500 p-1.5 rounded-lg shrink-0">
              <Church size={isOpen ? 24 : 20} className="text-white" />
            </div>
            {isOpen && <span className="font-poppins font-bold text-lg whitespace-nowrap">EclesiaMaster</span>}
          </div>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="hidden md:flex items-center justify-center p-1.5 rounded-full hover:bg-white/10 transition-colors"
          >
            {isOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto overflow-x-hidden p-3 space-y-1 scrollbar-hide mt-4">
          {filteredMenu.map((item) => {
            const isActive = location.pathname === `/${item.id}` || (location.pathname === '/' && item.id === 'dashboard');
            return (
              <NavLink
                key={item.id}
                to={`/${item.id}`}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative
                  ${isActive ? 'bg-amber-500 text-white shadow-lg' : 'hover:bg-white/10 text-blue-100'}
                  ${!isOpen && 'md:justify-center'}
                `}
              >
                <div className={`${isActive ? 'scale-110' : 'group-hover:scale-110'} transition-transform`}>
                  {item.icon}
                </div>
                {isOpen ? (
                  <span className="font-medium whitespace-nowrap">{item.label}</span>
                ) : (
                  <div className="absolute left-full ml-4 px-3 py-1 bg-gray-800 text-white text-sm rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-xl z-[60]">
                    {item.label}
                  </div>
                )}
              </NavLink>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10">
          <div className={`flex items-center gap-3 ${!isOpen && 'md:justify-center'}`}>
            <AvatarPlaceholder
              name={state.auth.user?.name || 'User'}
              id={state.auth.user?.id || 'guest'}
              photoUrl={state.auth.user?.photoUrl}
              className="w-10 h-10 rounded-full border-2 border-white/20"
            />
            {isOpen && (
              <div className="flex flex-col overflow-hidden">
                <span className="text-sm font-semibold truncate">{state.auth.user?.name}</span>
                <span className="text-xs text-blue-300 truncate">{state.auth.user?.role}</span>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
