import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { Key, UserPlus, Trash2, ShieldCheck, Loader2 } from 'lucide-react';

export default function KeyHoldersPage() {
  const [holders, setHolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [adding, setAdding] = useState(false);

  const loadKeyHolders = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getKeyHolders();
      setHolders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Napaka pri pridobivanju imetnikov ključa:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadKeyHolders();
  }, [loadKeyHolders]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;

    setAdding(true);
    try {
      const updated = await api.addKeyHolder(newName.trim());
      setHolders(Array.isArray(updated) ? updated : [...holders, newName.trim()]);
      setNewName('');
    } catch (err) {
      alert('Napaka pri dodajanju: ' + err.message);
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (name) => {
    if (!window.confirm(`Ali ste prepričani, da želite odstraniti "${name}" s seznama imetnikov ključa?`)) return;

    try {
      const updated = await api.removeKeyHolder(name);
      setHolders(Array.isArray(updated) ? updated : holders.filter(h => h !== name));
    } catch (err) {
      alert('Napaka pri brisanju: ' + err.message);
    }
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
    <div className="max-w-3xl mx-auto space-y-6">
      
      {/* Glava */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
          <Key className="w-7 h-7 text-emerald-700" />
          <span>Imetniki ključa skladišča</span>
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Evidenca skavtskih voditeljev, ki imajo fizični ključ do prostora
        </p>
      </div>

      {/* Vnos novega imetnika */}
      <form onSubmit={handleAdd} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex gap-3">
        <input
          type="text"
          required
          placeholder="Ime in priimek novega imetnika ključa..."
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
        />
        <button
          type="submit"
          disabled={adding}
          className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-2 shrink-0 transition-all"
        >
          <UserPlus className="w-4 h-4" />
          <span>{adding ? 'Dodajam...' : 'Dodaj na seznam'}</span>
        </button>
      </form>

      {/* Seznam imetnikov */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs divide-y divide-slate-100">
        {holders.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Key className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="font-semibold text-slate-600 text-sm">Seznam imetnikov ključa je prazen</p>
          </div>
        ) : (
          holders.map((name, index) => (
            <div key={index} className="p-4 flex items-center justify-between hover:bg-slate-50/80 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center font-black text-xs">
                  {index + 1}
                </div>
                <div>
                  <span className="font-bold text-slate-900 block leading-tight text-sm">
                    {name}
                  </span>
                  <span className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    Ima veljaven ključ
                  </span>
                </div>
              </div>

              <button
                onClick={() => handleRemove(name)}
                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                title="Odstrani imetnika"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>

    </div>
  );
}
