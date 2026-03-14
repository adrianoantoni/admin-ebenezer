
import React, { useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { Notification } from '../../core/types';

const ToastContainer: React.FC = () => {
  const { state, dispatch } = useApp();

  return (
    <div className="fixed bottom-8 right-8 z-[10000] flex flex-col gap-3 pointer-events-none">
      {state.notifications.map((n) => (
        <ToastItem key={n.id} notification={n} onClose={(id) => dispatch({ type: 'REMOVE_NOTIFICATION', payload: id })} />
      ))}
    </div>
  );
};

interface ToastItemProps {
  notification: Notification;
  onClose: (id: string) => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ notification, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => onClose(notification.id), 5000);
    return () => clearTimeout(timer);
  }, [notification.id, onClose]);

  const styles: Record<Notification['type'], string> = {
    success: 'bg-emerald-600 text-white shadow-emerald-200 border-emerald-500',
    error: 'bg-red-600 text-white shadow-red-200 border-red-500',
    info: 'bg-blue-600 text-white shadow-blue-200 border-blue-500'
  };

  const icons: Record<Notification['type'], React.ReactNode> = {
    success: <CheckCircle2 size={20} />,
    error: <AlertCircle size={20} />,
    info: <Info size={20} />
  };

  return (
    <div className={`pointer-events-auto flex items-center gap-4 px-6 py-4 rounded-2xl shadow-2xl border-2 animate-in slide-in-from-right duration-300 ${styles[notification.type]}`}>
      {icons[notification.type]}
      <p className="text-xs font-black uppercase tracking-widest">{notification.message}</p>
      <button onClick={() => onClose(notification.id)} className="ml-2 hover:bg-white/20 p-1 rounded-lg transition-colors">
        <X size={16} />
      </button>
    </div>
  );
};

export default ToastContainer;
