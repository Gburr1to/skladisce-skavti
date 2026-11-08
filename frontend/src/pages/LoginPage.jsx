import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { 
  Lock, 
  User, 
  Mail, 
  AlertCircle, 
  ArrowRight, 
  Loader2, 
  Sparkles, 
  UserPlus, 
  ArrowLeft, 
  KeyRound, 
  CheckCircle2, 
  Send, 
  ShieldCheck 
} from 'lucide-react';

export default function LoginPage() {
  // Načini pogleda: 'login', 'setup', 'forgot_request', 'forgot_verify'
  const [mode, setMode] = useState('login');

  // Prijavni in registracijski podatki
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Podatki za ponastavitev pozabljenega gesla
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Stanje začetne nastavitve profila (ko v bazi še ni nobenega uporabnika)
  const [hasUsers, setHasUsers] = useState(true);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  // Ob nalaganju strani preverimo, ali že obstaja profil v bazi
  useEffect(() => {
    async function checkSetup() {
      try {
        const res = await api.getSetupStatus();
        if (res && res.hasUsers === false) {
          setHasUsers(false);
          setMode('setup'); // Če v bazi še ni profila, takoj odpremo prijazno začetno nastavitev
        } else {
          setHasUsers(true);
          setMode('login');
        }
      } catch (err) {
        console.warn('Preverjanje začetnega profila ni uspelo:', err.message);
        setHasUsers(true);
      }
    }
    checkSetup();
  }, []);

  const clearMessages = () => {
    setError('');
    setSuccessMessage('');
  };

  // 1. Običajna prijava
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError('Vnesite uporabniško ime in geslo.');
      return;
    }

    setLoading(true);
    clearMessages();

    try {
      await login(username.trim(), password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Napačno uporabniško ime ali geslo.');
    } finally {
      setLoading(false);
    }
  };

  // 2. Ustvarjanje začetnega stegovskega profila
  const handleCreateInitialProfile = async (e) => {
    e.preventDefault();
    const cleanUsername = username.trim();
    const cleanEmail = email.trim();

    if (!cleanUsername || !password) {
      setError('Uporabniško ime in geslo sta obvezna.');
      return;
    }

    if (password.length < 4) {
      setError('Geslo mora imeti vsaj 4 znake.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Gesli se ne ujemata.');
      return;
    }

    setLoading(true);
    clearMessages();

    try {
      // 1. Ustvarimo začetni profil na backendu
      await api.registerInitialProfile(cleanUsername, password, cleanEmail);
      // 2. Takoj avtomatsko prijavimo uporabnika
      await login(cleanUsername, password);
      setHasUsers(true);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Napaka pri ustvarjanju začetnega profila.');
    } finally {
      setLoading(false);
    }
  };

  // 3. Zahteva za varnostno kodo ob pozabljenem geslu
  const handleRequestPasswordReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    clearMessages();

    try {
      const res = await api.requestPasswordReset(username.trim() || undefined);
      setMaskedEmail(res.emailMasked || 'vaš e-poštni naslov');
      setSuccessMessage(res.message || 'Varnostna koda je bila poslana na vaš e-mail.');
      if (res.devCode) {
        setResetCode(res.devCode);
      }
      setMode('forgot_verify');
    } catch (err) {
      setError(err.message || 'Napaka pri pošiljanju varnostne kode.');
    } finally {
      setLoading(false);
    }
  };

  // 4. Potrditev kode in vnos novega gesla
  const handleResetPasswordWithCode = async (e) => {
    e.preventDefault();
    if (!resetCode.trim() || !newPassword) {
      setError('Vnesite kodo in novo geslo.');
      return;
    }

    if (newPassword.length < 4) {
      setError('Novo geslo mora imeti vsaj 4 znake.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setError('Novi gesli se ne ujemata.');
      return;
    }

    setLoading(true);
    clearMessages();

    try {
      const res = await api.resetPassword(resetCode.trim(), newPassword, username.trim() || undefined);
      setSuccessMessage(res.message || 'Geslo je bilo uspešno spremenjeno.');
      setPassword(newPassword);
      setMode('login');
    } catch (err) {
      setError(err.message || 'Napačna ali potekla varnostna koda.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center px-4 py-8 sm:px-6">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        
        {/* Naslov strani */}
        <div className="text-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Skavtsko skladišče
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {mode === 'setup' && 'Prva postavitev: Ustvarite začetni profil stega'}
            {mode === 'login' && 'Vnesite stegovske poverilnice za vstop'}
            {(mode === 'forgot_request' || mode === 'forgot_verify') && 'Ponastavitev pozabljenega gesla'}
          </p>
        </div>

        {/* Glavna kartica */}
        <div className="bg-white py-6 px-5 sm:px-8 shadow-sm rounded-2xl border border-slate-200">
          
          {/* Obvestilo o uspehu */}
          {successMessage && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Opozorilo o napaki */}
          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* ========================================================= */}
          {/* 1. OBRAZEC ZA PRVI ZAGON (EN STEGOV PROFIL)              */}
          {/* ========================================================= */}
          {mode === 'setup' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-emerald-50/90 border border-emerald-200 rounded-xl text-emerald-900 text-xs leading-relaxed space-y-2">
                <div className="flex items-center gap-2 font-bold text-emerald-800 text-sm">
                  <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Ustvarite EN STEGOV PROFIL</span>
                </div>
                <p>
                  V ta profil se boste za upravljanje skladišča prijavljali <strong>vsi voditelji vašega stega</strong>. 
                  Ko enkrat ustvarite ta račun, nadaljnja registracija ne bo več mogoča. (Boste pa lahko spremenili e-mail povezan z računom in geslo)
                </p>
                <div className="pt-1 flex items-start gap-1.5 text-emerald-700 font-medium text-[11px]">
                  <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
                  <span>
                    Po možnosti vnesite <strong>uradni skavtski e-mail</strong> (npr. <code className="bg-emerald-100/80 px-1 py-0.5 rounded text-emerald-900">steg@skavti.si</code> ali stegovski Gmail), ki bo služil za ponastavitev gesla ob izgubi.
                  </span>
                </div>
              </div>

              <form onSubmit={handleCreateInitialProfile} className="space-y-3.5 pt-1">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Uporabniško ime stega *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      required
                      autoFocus
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="npr. skavt, steg_maribor1..."
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    E-poštni naslov stega (priporočeno)
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="npr. steg.maribor1@skavti.si..."
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Geslo stega *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Geslo stega"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Ponovi geslo *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Ponovite geslo"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-3 bg-emerald-700 hover:bg-emerald-800 active:scale-98 text-white text-sm font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>Ustvari profil in vstopi</span>
                    </>
                  )}
                </button>

                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      clearMessages();
                      setMode('login');
                    }}
                    className="text-xs text-slate-500 hover:text-slate-800 font-medium inline-flex items-center gap-1 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Nazaj na običajno prijavo</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ========================================================= */}
          {/* 2. OBIČAJEN OBRAZEC ZA PRIJAVO                           */}
          {/* ========================================================= */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Uporabniško ime
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    required
                    autoFocus
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Uporabniško ime"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Geslo
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      clearMessages();
                      setMode('forgot_request');
                    }}
                    className="text-xs text-emerald-700 hover:text-emerald-900 hover:underline font-semibold cursor-pointer"
                  >
                    Pozabljeno geslo?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Geslo"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 bg-emerald-700 hover:bg-emerald-800 active:scale-98 text-white text-sm font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Prijava</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Gumb za začetni profil - se prikaže SAMO, če v bazi še ni nobenega profila */}
              {!hasUsers && (
                <div className="pt-3 border-t border-slate-100 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      clearMessages();
                      setMode('setup');
                    }}
                    className="w-full py-2 px-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Prvi zagon? Ustvari začetni profil</span>
                  </button>
                </div>
              )}
            </form>
          )}

          {/* ========================================================= */}
          {/* 3. POZABLJENO GESLO - 1. KORAK: POŠILJANJE KODE NA EMAIL */}
          {/* ========================================================= */}
          {mode === 'forgot_request' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-xs leading-relaxed">
                Vnesite uporabniško ime stega. Na povezani e-poštni naslov vam bomo poslali <strong>enkratno 6-mestno kodo</strong> za ponastavitev gesla.
              </div>

              <form onSubmit={handleRequestPasswordReset} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Uporabniško ime stega
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      autoFocus
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="npr. skavt (ali pustite prazno)"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 active:scale-98 text-white text-sm font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Pošlji kodo na e-mail</span>
                    </>
                  )}
                </button>

                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      clearMessages();
                      setMode('login');
                    }}
                    className="text-xs text-slate-500 hover:text-slate-800 font-medium inline-flex items-center gap-1 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Nazaj na prijavo</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ========================================================= */}
          {/* 4. POZABLJENO GESLO - 2. KORAK: VNOS KODE IN NOVEGA GESLA */}
          {/* ========================================================= */}
          {mode === 'forgot_verify' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 leading-relaxed">
                Koda je bila poslana na <strong className="text-slate-900">{maskedEmail || 'e-mail stega'}</strong>. 
                Vnesite prejeto 6-mestno kodo in določite novo geslo.
              </div>

              <form onSubmit={handleResetPasswordWithCode} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Varnostna koda iz e-pošte
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      required
                      autoFocus
                      maxLength={6}
                      value={resetCode}
                      onChange={(e) => setResetCode(e.target.value)}
                      placeholder="123456"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-base font-bold tracking-widest text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-all"
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
                      placeholder="Novo geslo"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-all"
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
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 active:scale-98 text-white text-sm font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Shrani novo geslo in se prijavi</span>
                    </>
                  )}
                </button>

                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      clearMessages();
                      setMode('login');
                    }}
                    className="text-xs text-slate-500 hover:text-slate-800 font-medium inline-flex items-center gap-1 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Prekliči in nazaj na prijavo</span>
                  </button>
                </div>
              </form>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
