import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useBorrow } from '../context/BorrowContext';
import SearchBar from './SearchBar';
import BorrowModal from './BorrowModal';
import { 
  Archive, 
  Package, 
  HandHelping, 
  LogOut, 
  CheckCircle2, 
  AlertCircle
} from 'lucide-react';

export default function Layout({ children }) {
  const { logout } = useAuth();
  const { activeBorrows, toastMessage } = useBorrow();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinks = [
    { name: 'Omare', path: '/', icon: Archive },
    { name: 'Artikli', path: '/artikli', icon: Package },
    { 
      name: 'Izposoje', 
      path: '/izposoje', 
      icon: HandHelping, 
      badge: activeBorrows.length > 0 ? activeBorrows.length : null 
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 text-slate-900 pb-16 md:pb-0">
      
      {/* Glavni Header */}
      <header className="sticky top-0 z-40 bg-emerald-900 text-white shadow-xs">
        <div className="max-w-4xl mx-auto px-3 sm:px-6">
          <div className="flex items-center justify-between h-14 gap-2.5">
            
            {/* Logo */}
            <Link 
              to="/" 
              className="flex items-center gap-2 shrink-0 group hover:opacity-95 transition-opacity"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-700 flex items-center justify-center font-black text-emerald-200 text-xs shadow-xs">
                SS
              </div>
              <span className="font-bold tracking-tight text-sm hidden sm:inline-block text-white">
                Skladišče
              </span>
            </Link>

            {/* Iskalnik */}
            <div className="flex-1 max-w-md mx-1">
              <SearchBar />
            </div>

            {/* Navigacija za večje zaslone */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = location.pathname === link.path;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all relative ${
                      isActive
                        ? 'bg-emerald-800 text-white'
                        : 'text-emerald-100 hover:text-white hover:bg-emerald-800/60'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{link.name}</span>
                    {link.badge && (
                      <span className="ml-0.5 px-1.5 py-0.2 text-[10px] font-bold bg-amber-400 text-slate-900 rounded-full">
                        {link.badge}
                      </span>
                    )}
                  </Link>
                );
              })}

              <button
                onClick={handleLogout}
                title="Odjava"
                className="p-1.5 text-emerald-200 hover:text-white hover:bg-emerald-800 rounded-lg ml-1"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </nav>

            {/* Odjava na mobilnih napravah */}
            <button
              onClick={handleLogout}
              title="Odjava"
              className="md:hidden p-1.5 text-emerald-200 hover:text-white rounded-lg shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>

          </div>
        </div>
      </header>

      {/* Toast obvestilo */}
      {toastMessage && (
        <div className="fixed bottom-18 md:bottom-5 right-4 left-4 sm:left-auto sm:right-5 z-50 animate-in slide-in-from-bottom-2 fade-in duration-200">
          <div
            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl shadow-lg text-xs font-semibold border ${
              toastMessage.type === 'error'
                ? 'bg-rose-900 text-rose-100 border-rose-700'
                : 'bg-slate-900 text-white border-slate-700'
            }`}
          >
            {toastMessage.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-300 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            )}
            <span>{toastMessage.message}</span>
          </div>
        </div>
      )}

      {/* Globalni BorrowModal */}
      <BorrowModal />

      {/* Glavna vsebina */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-3 sm:px-6 py-4">
        {children}
      </main>

      {/* Spodnja navigacija za telefon (Mobile Bottom Nav) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 shadow-md flex items-center justify-around h-14">
        {navLinks.map((link) => {
          const Icon = link.icon;
          const isActive = location.pathname === link.path;
          return (
            <Link
              key={link.path}
              to={link.path}
              className={`flex-1 flex flex-col items-center justify-center h-full relative ${
                isActive ? 'text-emerald-700 font-bold' : 'text-slate-500 font-medium'
              }`}
            >
              <div className="relative">
                <Icon className="w-5 h-5" />
                {link.badge && (
                  <span className="absolute -top-1 -right-2 px-1 text-[9px] font-bold bg-amber-500 text-slate-950 rounded-full">
                    {link.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-0.5">{link.name}</span>
            </Link>
          );
        })}
      </nav>

    </div>
  );
}
