import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { api } from '../services/api';
import { useBorrow } from '../context/BorrowContext';
import { 
  Key, 
  UserPlus, 
  Trash2, 
  ShieldCheck, 
  ShieldAlert,
  Lock, 
  Unlock, 
  Loader2, 
  X, 
  Warehouse, 
  Mail, 
  Settings, 
  Check, 
  HelpCircle,
  KeyRound,
  Send,
  RefreshCw
} from 'lucide-react';

export default function KeyHoldersPage() {
  const { showToast } = useBorrow();

  const [holders, setHolders] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter skladišč ('all' ali id skladišča)
  const [selectedWarehouse, setSelectedWarehouse] = useState('all');

  // Varnostna konfiguracija
  const [securityConfig, setSecurityConfig] = useState({ isConfigured: false, recoveryEmailMasked: '' });
  const [sessionPassword, setSessionPassword] = useState('');
  const [isEditUnlocked, setIsEditUnlocked] = useState(false);

  // Vnos novega imetnika
  const [newName, setNewName] = useState('');
  const [newWarehouseId, setNewWarehouseId] = useState('');
  const [newNote, setNewNote] = useState('');
  const [adding, setAdding] = useState(false);

  // Modal: Začetna konfiguracija varnosti
  const [setupModalOpen, setSetupModalOpen] = useState(false);
  const [setupPassword, setSetupPassword] = useState('');
  const [setupConfirmPassword, setSetupConfirmPassword] = useState('');
  const [setupEmail, setSetupEmail] = useState('');
  const [setupLoading, setSetupLoading] = useState(false);

  // Modal: Odklep z geslom
  const [unlockModalOpen, setUnlockModalOpen] = useState(false);
  const [unlockInputPassword, setUnlockInputPassword] = useState('');
  const [unlockLoading, setUnlockLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);

  // Modal: Menjava gesla (ko poznaš trenutno geslo)
  const [changePasswordModalOpen, setChangePasswordModalOpen] = useState(false);
  const [changeCurrentPassword, setChangeCurrentPassword] = useState('');
  const [changeNewPassword, setChangeNewPassword] = useState('');
  const [changeConfirmPassword, setChangeConfirmPassword] = useState('');
  const [changePasswordLoading, setChangePasswordLoading] = useState(false);

  // Modal: Ponastavitev gesla z verifikacijsko kodo na Gmail
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetStep, setResetStep] = useState(1); // 1 = pošlji kodo, 2 = vnesi kodo & novo geslo
  const [resetEmailInput, setResetEmailInput] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');
  const [resetSendingCode, setResetSendingCode] = useState(false);
  const [resetVerifyingCode, setResetVerifyingCode] = useState(false);
  const [devCodeHint, setDevCodeHint] = useState('');

  // Modal: Sprememba Gmail naslova
  const [changeEmailModalOpen, setChangeEmailModalOpen] = useState(false);
  const [changeEmailPassword, setChangeEmailPassword] = useState('');
  const [changeEmailNewEmail, setChangeEmailNewEmail] = useState('');
  const [changeEmailLoading, setChangeEmailLoading] = useState(false);

  // Nalaganje podatkov
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [holdersData, warehousesData, configData] = await Promise.all([
        api.getKeyHolders({ detailed: true }),
        api.getWarehouses(),
        api.getKeyHolderConfig()
      ]);

      setHolders(Array.isArray(holdersData) ? holdersData : []);
      setWarehouses(Array.isArray(warehousesData) ? warehousesData : []);
      setSecurityConfig(configData || { isConfigured: false, recoveryEmailMasked: '' });

      // Če varnost še ni nastavljena, je urejanje privzeto dovoljeno
      if (!configData?.isConfigured) {
        setIsEditUnlocked(true);
      }
    } catch (err) {
      console.error('Napaka pri nalaganju podatkov o imetnikih:', err);
      showToast('Napaka pri nalaganju podatkov: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filtrirani imetniki glede na izbrano skladišče
  const filteredHolders = useMemo(() => {
    if (selectedWarehouse === 'all') {
      return holders;
    }
    return holders.filter(h => {
      const whId = h.warehouse?._id || h.warehouse;
      return whId === selectedWarehouse || !whId;
    });
  }, [holders, selectedWarehouse]);

  // Zahteva za odklep pred izvedbo akcije
  const requireUnlock = (actionCallback) => {
    if (!securityConfig.isConfigured || isEditUnlocked) {
      actionCallback(sessionPassword);
      return;
    }
    setPendingAction(() => actionCallback);
    setUnlockInputPassword('');
    setUnlockModalOpen(true);
  };

  // Potrditev odklepa z geslom
  const handleUnlockSubmit = async (e) => {
    e.preventDefault();
    if (!unlockInputPassword) return;

    try {
      setUnlockLoading(true);
      await api.verifyKeyHolderPassword(unlockInputPassword);
      setIsEditUnlocked(true);
      setSessionPassword(unlockInputPassword);
      setUnlockModalOpen(false);
      showToast('Urejanje seznama je odklenjeno.');

      if (pendingAction) {
        pendingAction(unlockInputPassword);
        setPendingAction(null);
      }
    } catch (err) {
      showToast(err.message || 'Napačno geslo.', 'error');
    } finally {
      setUnlockLoading(false);
    }
  };

  // Zaklep urejanja
  const handleLockEditing = () => {
    setIsEditUnlocked(false);
    setSessionPassword('');
    showToast('Urejanje seznama je zaklenjeno.');
  };

  // Nastavitev začetnega gesla in Gmaila
  const handleSetupSecurity = async (e) => {
    e.preventDefault();
    if (setupPassword !== setupConfirmPassword) {
      alert('Gesli se ne ujemata.');
      return;
    }
    if (!setupEmail.includes('@')) {
      alert('Vnesite veljaven e-poštni naslov (Gmail).');
      return;
    }

    try {
      setSetupLoading(true);
      const res = await api.setupKeyHolderConfig({
        password: setupPassword,
        recoveryEmail: setupEmail
      });

      setSecurityConfig({
        isConfigured: true,
        recoveryEmailMasked: res.recoveryEmailMasked
      });
      setIsEditUnlocked(true);
      setSessionPassword(setupPassword);
      setSetupModalOpen(false);
      setSetupPassword('');
      setSetupConfirmPassword('');
      setSetupEmail('');
      showToast('Varnostno geslo in Gmail uspešno shranjena.');
    } catch (err) {
      showToast(err.message || 'Napaka pri nastavitvi gesla.', 'error');
    } finally {
      setSetupLoading(false);
    }
  };

  // Menjava obstoječega gesla (ko poznaš trenutno geslo)
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (changeNewPassword !== changeConfirmPassword) {
      alert('Novi gesli se ne ujemata.');
      return;
    }

    try {
      setChangePasswordLoading(true);
      await api.changeKeyHolderPassword({
        currentPassword: changeCurrentPassword,
        newPassword: changeNewPassword
      });

      setSessionPassword(changeNewPassword);
      setIsEditUnlocked(true);
      setChangePasswordModalOpen(false);
      setChangeCurrentPassword('');
      setChangeNewPassword('');
      setChangeConfirmPassword('');
      showToast('Geslo za urejanje seznama uspešno posodobljeno.');
    } catch (err) {
      showToast(err.message || 'Napaka pri menjavi gesla.', 'error');
    } finally {
      setChangePasswordLoading(false);
    }
  };

  // Pošiljanje verifikacijske kode na Gmail
  const handleSendResetCode = async (e) => {
    if (e) e.preventDefault();

    try {
      setResetSendingCode(true);
      const res = await api.requestKeyHolderResetCode({
        recoveryEmail: resetEmailInput.trim() || undefined
      });

      setResetStep(2);
      if (res.devCode) {
        setDevCodeHint(res.devCode);
      }
      showToast(res.message || 'Varnostna koda je bila poslana na Gmail.');
    } catch (err) {
      showToast(err.message || 'Napaka pri pošiljanju kode.', 'error');
    } finally {
      setResetSendingCode(false);
    }
  };

  // Ponastavitev gesla z vnosom prejete kode
  const handleResetPasswordWithCode = async (e) => {
    e.preventDefault();
    if (resetNewPassword !== resetConfirmPassword) {
      alert('Novi gesli se ne ujemata.');
      return;
    }
    if (!resetCode.trim()) {
      alert('Vnesite 6-mestno varnostno kodo.');
      return;
    }

    try {
      setResetVerifyingCode(true);
      await api.resetKeyHolderPasswordWithCode({
        code: resetCode.trim(),
        newPassword: resetNewPassword
      });

      setIsEditUnlocked(true);
      setSessionPassword(resetNewPassword);
      setResetModalOpen(false);
      setResetStep(1);
      setResetCode('');
      setResetNewPassword('');
      setResetConfirmPassword('');
      setDevCodeHint('');
      showToast('Geslo uspešno ponastavljeno z verifikacijsko kodo!');
    } catch (err) {
      showToast(err.message || 'Napaka pri ponastavitvi gesla.', 'error');
    } finally {
      setResetVerifyingCode(false);
    }
  };

  // Sprememba Gmail naslova (zahteva trenutno geslo)
  const handleChangeRecoveryEmail = async (e) => {
    e.preventDefault();
    try {
      setChangeEmailLoading(true);
      const res = await api.changeKeyHolderRecoveryEmail({
        password: changeEmailPassword,
        newRecoveryEmail: changeEmailNewEmail
      });

      setSecurityConfig(prev => ({
        ...prev,
        recoveryEmailMasked: res.recoveryEmailMasked
      }));
      setChangeEmailModalOpen(false);
      setChangeEmailPassword('');
      setChangeEmailNewEmail('');
      showToast('Obnovitveni Gmail naslov uspešno posodobljen.');
    } catch (err) {
      showToast(err.message || 'Napaka pri spreminjanju e-pošte.', 'error');
    } finally {
      setChangeEmailLoading(false);
    }
  };

  // Dodajanje imetnika
  const handleAddKeyHolder = (e) => {
    e.preventDefault();
    if (!newName.trim()) return;

    requireUnlock(async (pwd) => {
      try {
        setAdding(true);
        const updated = await api.addKeyHolder({
          name: newName.trim(),
          warehouse: newWarehouseId || null,
          note: newNote.trim(),
          password: pwd
        });

        setHolders(Array.isArray(updated) ? updated : []);
        setNewName('');
        setNewWarehouseId('');
        setNewNote('');
        showToast(`Imetnik "${newName.trim()}" uspešno dodan na seznam.`);
      } catch (err) {
        showToast('Napaka pri dodajanju: ' + err.message, 'error');
      } finally {
        setAdding(false);
      }
    });
  };

  // Odstranitev imetnika
  const handleRemoveKeyHolder = (holder) => {
    const holderId = holder._id || holder.name;
    const holderName = holder.name || 'imetnika';

    if (!window.confirm(`Ali ste prepričani, da želite odstraniti "${holderName}" s seznama imetnikov ključa?`)) {
      return;
    }

    requireUnlock(async (pwd) => {
      try {
        const updated = await api.removeKeyHolder(holderId, pwd);
        setHolders(Array.isArray(updated) ? updated : []);
        showToast(`Imetnik "${holderName}" uspešno odstranjen.`);
      } catch (err) {
        showToast('Napaka pri odstranjevanju: ' + err.message, 'error');
      }
    });
  };

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-500">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-600" />
        <p className="text-sm font-semibold">Nalagam seznam imetnikov ključa...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      
      {/* Glava strani */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Key className="w-6 h-6 text-emerald-700" />
            <span>Imetniki ključa skladišča</span>
          </h1>
          <p className="text-xs text-slate-500">
            Evidenca skavtskih voditeljev s fizičnim ključem do prostorov
          </p>
        </div>

        {/* Status varnosti in orodja */}
        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          {!securityConfig.isConfigured ? (
            <button
              onClick={() => setSetupModalOpen(true)}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-all"
            >
              <ShieldAlert className="w-4 h-4 text-slate-950" />
              <span>Nastavi varnostno geslo</span>
            </button>
          ) : isEditUnlocked ? (
            <div className="flex items-center gap-1.5">
              <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-[11px] font-bold rounded-lg border border-emerald-200 flex items-center gap-1">
                <Unlock className="w-3.5 h-3.5 text-emerald-700" />
                <span>Odklenjeno</span>
              </span>

              {/* Možnost menjave gesla */}
              <button
                onClick={() => {
                  setChangeCurrentPassword(sessionPassword || '');
                  setChangeNewPassword('');
                  setChangeConfirmPassword('');
                  setChangePasswordModalOpen(true);
                }}
                className="px-2.5 py-1 text-slate-600 hover:text-slate-900 hover:bg-slate-200/80 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                title="Menjava gesla"
              >
                <KeyRound className="w-3.5 h-3.5 text-emerald-700" />
                <span>Menjava gesla</span>
              </button>

              <button
                onClick={() => setChangeEmailModalOpen(true)}
                className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded-lg transition-colors"
                title="Spremeni obnovitveni Gmail"
              >
                <Settings className="w-4 h-4" />
              </button>

              <button
                onClick={handleLockEditing}
                className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded-lg transition-colors"
                title="Zakleni urejanje"
              >
                <Lock className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => {
                  setUnlockInputPassword('');
                  setPendingAction(null);
                  setUnlockModalOpen(true);
                }}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-all"
              >
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>Odkleni urejanje</span>
              </button>

              <button
                onClick={() => {
                  setResetStep(1);
                  setResetEmailInput('');
                  setResetCode('');
                  setResetNewPassword('');
                  setResetConfirmPassword('');
                  setResetModalOpen(true);
                }}
                className="px-2.5 py-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 text-xs font-semibold rounded-xl flex items-center gap-1 transition-all"
                title="Ponastavitev z email kodo"
              >
                <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                <span>Pozabljeno geslo?</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Opozorilni banner, če geslo še ni nastavljeno */}
      {!securityConfig.isConfigured && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
          <KeyRound className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900 space-y-1">
            <p className="font-bold">Varnostni mehanizem še ni konfiguriran</p>
            <p className="text-amber-800 leading-relaxed">
              Vodja naj nastavi geslo za spreminjanje seznama imetnikov ključa ter kontaktni Gmail naslov za primer pozabljenega gesla.
            </p>
            <button
              onClick={() => setSetupModalOpen(true)}
              className="mt-1 text-xs font-bold text-amber-900 underline hover:text-amber-950 inline-block"
            >
              Nastavi geslo in Gmail zdaj &rarr;
            </button>
          </div>
        </div>
      )}

      {/* Filter po skladiščih */}
      {warehouses.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          <button
            onClick={() => setSelectedWarehouse('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
              selectedWarehouse === 'all'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
            }`}
          >
            Vsa skladišča ({holders.length})
          </button>

          {warehouses.map((wh) => {
            const count = holders.filter(h => {
              const whId = h.warehouse?._id || h.warehouse;
              return whId === wh._id || !whId;
            }).length;

            return (
              <button
                key={wh._id}
                onClick={() => setSelectedWarehouse(wh._id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                  selectedWarehouse === wh._id
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
                }`}
              >
                <Warehouse className="w-3.5 h-3.5 opacity-70" />
                <span>{wh.name}</span>
                <span className="text-[10px] opacity-80">({count})</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Obrazec za dodajanje imetnika */}
      <form onSubmit={handleAddKeyHolder} className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
          <span>Dodaj novega imetnika ključa</span>
          {securityConfig.isConfigured && !isEditUnlocked && (
            <span className="text-[11px] text-amber-700 font-semibold flex items-center gap-1 lowercase">
              <Lock className="w-3 h-3" />
              ob potrditvi bo zahtevano geslo
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
          <div className="sm:col-span-5">
            <input
              type="text"
              required
              placeholder="Ime in priimek voditelja..."
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>

          <div className="sm:col-span-4">
            <select
              value={newWarehouseId}
              onChange={(e) => setNewWarehouseId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
            >
              <option value="">Vsa skladišča (glavni ključ)</option>
              {warehouses.map((wh) => (
                <option key={wh._id} value={wh._id}>
                  {wh.name}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-3">
            <button
              type="submit"
              disabled={adding}
              className="w-full px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-all h-full"
            >
              {adding ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <UserPlus className="w-4 h-4" />
              )}
              <span>Dodaj</span>
            </button>
          </div>
        </div>
      </form>

      {/* Seznam imetnikov */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs divide-y divide-slate-100">
        {filteredHolders.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Key className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="font-semibold text-slate-600 text-sm">
              Za izbrano skladišče ni evidentiranih imetnikov ključa
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Uporabite zgornji obrazec za vpis voditeljev, ki imajo ključ.
            </p>
          </div>
        ) : (
          filteredHolders.map((holder, index) => {
            const holderName = typeof holder === 'string' ? holder : holder.name;
            const whName = holder.warehouse?.name;

            return (
              <div 
                key={holder._id || index} 
                className="p-3.5 sm:p-4 flex items-center justify-between hover:bg-slate-50/80 transition-colors gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center font-black text-xs shrink-0">
                    {index + 1}
                  </div>
                  
                  <div className="min-w-0">
                    <span className="font-bold text-slate-900 block leading-tight text-sm truncate">
                      {holderName}
                    </span>

                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" />
                        Ima ključ
                      </span>

                      {whName ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800">
                          {whName}
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                          Vsa skladišča
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleRemoveKeyHolder(holder)}
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors shrink-0"
                  title="Odstrani imetnika s seznama"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL 1: Nastavitev gesla in Gmaila za vodjo */}
      {setupModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl max-w-md w-full border border-slate-200 p-5 space-y-4 animate-in slide-in-from-bottom-4 duration-150">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Varnostna nastavitev seznama</h3>
                  <p className="text-[11px] text-slate-500">Nastavite geslo za spreminjanje imetnikov ključa</p>
                </div>
              </div>
              <button onClick={() => setSetupModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSetupSecurity} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Geslo za spreminjanje *
                </label>
                <input
                  type="password"
                  required
                  placeholder="Vnesite geslo..."
                  value={setupPassword}
                  onChange={(e) => setSetupPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Ponovite geslo *
                </label>
                <input
                  type="password"
                  required
                  placeholder="Ponovite geslo..."
                  value={setupConfirmPassword}
                  onChange={(e) => setSetupConfirmPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Gmail vodje (za preverjanje ob pozabljenem geslu) *
                </label>
                <input
                  type="email"
                  required
                  placeholder="npr. vodja.skladišča@gmail.com"
                  value={setupEmail}
                  onChange={(e) => setSetupEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSetupModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Prekliči
                </button>
                <button
                  type="submit"
                  disabled={setupLoading}
                  className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs disabled:opacity-60"
                >
                  {setupLoading ? 'Shranjujem...' : 'Potrdi in shrani'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Odklep urejanja z geslom */}
      {unlockModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl max-w-sm w-full border border-slate-200 p-5 space-y-4 animate-in slide-in-from-bottom-4 duration-150">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Vnos gesla</h3>
                  <p className="text-[11px] text-slate-500">Za spreminjanje seznama vnesite geslo</p>
                </div>
              </div>
              <button onClick={() => setUnlockModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUnlockSubmit} className="space-y-3">
              <div>
                <input
                  type="password"
                  autoFocus
                  required
                  placeholder="Vnesite geslo..."
                  value={unlockInputPassword}
                  onChange={(e) => setUnlockInputPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setUnlockModalOpen(false);
                    setResetStep(1);
                    setResetEmailInput('');
                    setResetCode('');
                    setResetNewPassword('');
                    setResetConfirmPassword('');
                    setResetModalOpen(true);
                  }}
                  className="text-xs text-emerald-800 font-semibold hover:underline flex items-center gap-1"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>Pozabljeno geslo?</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setUnlockModalOpen(false)}
                    className="px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    Prekliči
                  </button>
                  <button
                    type="submit"
                    disabled={unlockLoading}
                    className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs disabled:opacity-60"
                  >
                    {unlockLoading ? 'Preverjam...' : 'Odkleni'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Menjava gesla (ko poznaš trenutno geslo) */}
      {changePasswordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl max-w-md w-full border border-slate-200 p-5 space-y-4 animate-in slide-in-from-bottom-4 duration-150">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Menjava gesla</h3>
                  <p className="text-[11px] text-slate-500">Spremenite obstoječe geslo za urejanje seznama</p>
                </div>
              </div>
              <button onClick={() => setChangePasswordModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Trenutno veljavno geslo *
                </label>
                <input
                  type="password"
                  required
                  placeholder="Vnesite trenutno geslo..."
                  value={changeCurrentPassword}
                  onChange={(e) => setChangeCurrentPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Novo geslo *
                </label>
                <input
                  type="password"
                  required
                  placeholder="Vnesite novo geslo..."
                  value={changeNewPassword}
                  onChange={(e) => setChangeNewPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Ponovite novo geslo *
                </label>
                <input
                  type="password"
                  required
                  placeholder="Ponovite novo geslo..."
                  value={changeConfirmPassword}
                  onChange={(e) => setChangeConfirmPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setChangePasswordModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Prekliči
                </button>
                <button
                  type="submit"
                  disabled={changePasswordLoading}
                  className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs disabled:opacity-60"
                >
                  {changePasswordLoading ? 'Shranjujem...' : 'Spremeni geslo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: Ponastavitev gesla s preverjanjem (kodo) na Gmail */}
      {resetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl max-w-md w-full border border-slate-200 p-5 space-y-4 animate-in slide-in-from-bottom-4 duration-150">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Ponastavitev gesla z e-pošto</h3>
                  <p className="text-[11px] text-slate-500">
                    Preverjanje dostopa do registriranega Gmaila ({securityConfig.recoveryEmailMasked || 'Gmail vodje'})
                  </p>
                </div>
              </div>
              <button onClick={() => setResetModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {resetStep === 1 ? (
              /* KORAK 1: Pošiljanje verifikacijske kode */
              <div className="space-y-4">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-700 leading-relaxed">
                  Za potrditev, da ste pooblaščeni za spreminjanje gesla, bomo na naslov{' '}
                  <strong className="text-slate-900">{securityConfig.recoveryEmailMasked}</strong> poslali enkratno 6-mestno varnostno kodo.
                </div>

                <form onSubmit={handleSendResetCode} className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Potrdite vaš Gmail naslov (opcijsko za dodatno varnost)
                    </label>
                    <input
                      type="email"
                      placeholder="npr. vodja@gmail.com..."
                      value={resetEmailInput}
                      onChange={(e) => setResetEmailInput(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    />
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setResetModalOpen(false)}
                      className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
                    >
                      Prekliči
                    </button>
                    <button
                      type="submit"
                      disabled={resetSendingCode}
                      className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 disabled:opacity-60"
                    >
                      {resetSendingCode ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                      <span>Pošlji kodo na email</span>
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              /* KORAK 2: Vnos kode in nastavitev novega gesla */
              <div className="space-y-4">
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-950 flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                  <p>
                    Varnostna koda je bila poslana na vaš Gmail. Vpišite prejeto kodo in izberite novo geslo.
                  </p>
                </div>

                {devCodeHint && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5 text-[11px] text-amber-900 font-mono flex items-center justify-between">
                    <span>Lokalni testni namig kode: <strong>{devCodeHint}</strong></span>
                    <button 
                      type="button" 
                      onClick={() => setResetCode(devCodeHint)}
                      className="underline font-bold text-amber-950 ml-2"
                    >
                      Vstavi kodo
                    </button>
                  </div>
                )}

                <form onSubmit={handleResetPasswordWithCode} className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      6-mestna koda iz e-pošte *
                    </label>
                    <input
                      type="text"
                      required
                      autoFocus
                      maxLength={6}
                      placeholder="npr. 839210"
                      value={resetCode}
                      onChange={(e) => setResetCode(e.target.value.replace(/\D/g, ''))}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-center text-lg font-mono font-bold tracking-widest focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Novo geslo *
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="Vnesite novo geslo..."
                      value={resetNewPassword}
                      onChange={(e) => setResetNewPassword(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Ponovite novo geslo *
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="Ponovite novo geslo..."
                      value={resetConfirmPassword}
                      onChange={(e) => setResetConfirmPassword(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    />
                  </div>

                  <div className="pt-2 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={handleSendResetCode}
                      disabled={resetSendingCode}
                      className="text-xs text-slate-500 hover:text-emerald-800 underline flex items-center gap-1"
                    >
                      <RefreshCw className={`w-3 h-3 ${resetSendingCode ? 'animate-spin' : ''}`} />
                      <span>Pošlji kodo ponovno</span>
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setResetStep(1)}
                        className="px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
                      >
                        Nazaj
                      </button>
                      <button
                        type="submit"
                        disabled={resetVerifyingCode || !resetCode.trim()}
                        className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs disabled:opacity-60"
                      >
                        {resetVerifyingCode ? 'Preverjam...' : 'Potrdi kodo in shrani'}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 5: Sprememba Gmail naslova (zahteva vpis trenutnega gesla) */}
      {changeEmailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl max-w-md w-full border border-slate-200 p-5 space-y-4 animate-in slide-in-from-bottom-4 duration-150">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center">
                  <Settings className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Spremeni obnovitveni Gmail</h3>
                  <p className="text-[11px] text-slate-500">
                    Trenutno nastavljen: {securityConfig.recoveryEmailMasked || 'Ni nastavljen'}
                  </p>
                </div>
              </div>
              <button onClick={() => setChangeEmailModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleChangeRecoveryEmail} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Trenutno geslo za potrditev *
                </label>
                <input
                  type="password"
                  required
                  placeholder="Vnesite trenutno geslo..."
                  value={changeEmailPassword}
                  onChange={(e) => setChangeEmailPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Novi Gmail naslov *
                </label>
                <input
                  type="email"
                  required
                  placeholder="npr. novi.vodja@gmail.com"
                  value={changeEmailNewEmail}
                  onChange={(e) => setChangeEmailNewEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setChangeEmailModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Prekliči
                </button>
                <button
                  type="submit"
                  disabled={changeEmailLoading}
                  className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs disabled:opacity-60"
                >
                  {changeEmailLoading ? 'Posodabljam...' : 'Posodobi Gmail'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
