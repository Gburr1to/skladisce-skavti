import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  Settings, 
  Mail, 
  Lock, 
  User, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  ShieldCheck 
} from 'lucide-react';

export default function SettingsModal({ isOpen, onClose }) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('email'); // 'email' | 'password'

  // Podatki o profilu
  const [profileEmail, setProfileEmail] = useState('');
  const [loadingProfile, setLoadingProfile] = useState(false);

  // Obrazec za menjavo e-pošte
  const [newEmail, setNewEmail] = useState('');
  const [emailCurrentPassword, setEmailCurrentPassword] = useState('');
  const [updatingEmail, setUpdatingEmail] = useState(false);

  // Obrazec za menjavo gesla
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);

  // Obvestila
  const [statusMessage, setStatusMessage] = useState(null); // { type: 'success' | 'error', text: '' }

  // Ob odprtju naložimo sveže podatke profila
  useEffect(() => {
    if (!isOpen) return;

    async function loadUserProfile() {
      try {
        setLoadingProfile(true);
        setStatusMessage(null);
        const data = await api.getProfile();
        setProfileEmail(data?.email || '');
        setNewEmail(data?.email || '');
      } catch (err) {
        console.error('Napaka pri branju profila:', err);
      } finally {
        setLoadingProfile(false);
      }
    }

    loadUserProfile();
  }, [isOpen]);

  if (!isOpen) return null;

  // Menjava e-poštnega naslova
  const handleUpdateEmail = async (e) => {
    e.preventDefault();
    if (!newEmail.trim() || !emailCurrentPassword) {
      setStatusMessage({ type: 'error', text: 'Vnesite nov e-poštni naslov in trenutno geslo.' });
      return;
    }

    try {
      setUpdatingEmail(true);
      setStatusMessage(null);
      const res = await api.changeEmail(newEmail.trim(), emailCurrentPassword);
      setProfileEmail(res.email || newEmail.trim());
      setEmailCurrentPassword('');
      setStatusMessage({ type: 'success', text: res.message || 'E-poštni naslov stega je bil uspešno posodobljen.' });
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.message || 'Napaka pri menjavi e-poštnega naslova.' });
    } finally {
      setUpdatingEmail(false);
    }
  };

  // Menjava gesla stega
  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      setStatusMessage({ type: 'error', text: 'Vsa polja so obvezna.' });
      return;
    }

    if (newPassword.length < 4) {
      setStatusMessage({ type: 'error', text: 'Novo geslo mora imeti vsaj 4 znake.' });
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setStatusMessage({ type: 'error', text: 'Novi gesli se ne ujemata.' });
      return;
    }

    try {
      setUpdatingPassword(true);
      setStatusMessage(null);
      const res = await api.changePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setStatusMessage({ type: 'success', text: res.message || 'Geslo stega je bilo uspešno posodobljeno.' });
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.message || 'Napaka pri menjavi gesla.' });
    } finally {
      setUpdatingPassword(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full border border-slate-200 overflow-hidden my-8 animate-in fade-in duration-150">
        
        {/* Glava modala */}
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-bold">Nastavitve profila stega</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Trenutni podatki profila */}
        <div className="bg-slate-50 border-b border-slate-200 px-5 py-3 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-700">
            <User className="w-4 h-4 text-slate-400" />
            <span className="font-bold">{user?.username || 'Stegovski profil'}</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-500">
            <Mail className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-medium truncate max-w-[180px]">
              {loadingProfile ? 'Nalagam...' : (profileEmail || 'Brez e-maila')}
            </span>
          </div>
        </div>

        {/* Zavihki */}
        <div className="flex border-b border-slate-200 bg-white">
          <button
            type="button"
            onClick={() => {
              setActiveTab('email');
              setStatusMessage(null);
            }}
            className={`flex-1 py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors border-b-2 cursor-pointer ${
              activeTab === 'email'
                ? 'border-emerald-700 text-emerald-800 bg-emerald-50/30'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>E-poštni naslov</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('password');
              setStatusMessage(null);
            }}
            className={`flex-1 py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors border-b-2 cursor-pointer ${
              activeTab === 'password'
                ? 'border-emerald-700 text-emerald-800 bg-emerald-50/30'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Geslo stega</span>
          </button>
        </div>

        {/* Vsebina z obvestili */}
        <div className="p-5 space-y-4">
          
          {statusMessage && (
            <div
              className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* TAB 1: Sprememba e-pošte */}
          {activeTab === 'email' && (
            <form onSubmit={handleUpdateEmail} className="space-y-3.5">
              <div className="text-xs text-slate-600 leading-relaxed">
                Ta e-poštni naslov se uporablja za pošiljanje varnostnih kod ob pozabljenem geslu stega.
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nov e-poštni naslov stega
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="npr. steg@skavti.si"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Trenutno geslo stega (za potrditev)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="password"
                    required
                    value={emailCurrentPassword}
                    onChange={(e) => setEmailCurrentPassword(e.target.value)}
                    placeholder="Vnesite trenutno geslo"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Zapri
                </button>
                <button
                  type="submit"
                  disabled={updatingEmail}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 disabled:opacity-60 cursor-pointer"
                >
                  {updatingEmail ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ShieldCheck className="w-4 h-4" />
                  )}
                  <span>Shrani e-pošto</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: Sprememba gesla */}
          {activeTab === 'password' && (
            <form onSubmit={handleUpdatePassword} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Trenutno geslo stega
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="password"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Trenutno geslo"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Novo geslo stega
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Novo geslo (vsaj 4 znaki)"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Ponovi novo geslo
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="password"
                    required
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="Ponovite novo geslo"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Zapri
                </button>
                <button
                  type="submit"
                  disabled={updatingPassword}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 disabled:opacity-60 cursor-pointer"
                >
                  {updatingPassword ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ShieldCheck className="w-4 h-4" />
                  )}
                  <span>Shrani novo geslo</span>
                </button>
              </div>
            </form>
          )}

        </div>

      </div>
    </div>
  );
}
