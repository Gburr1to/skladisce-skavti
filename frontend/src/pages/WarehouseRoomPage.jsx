import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { 
  Archive, 
  Layers, 
  ArrowRight, 
  Plus, 
  Loader2, 
  X,
  MapPin
} from 'lucide-react';

export default function WarehouseRoomPage() {
  const navigate = useNavigate();

  const [closets, setClosets] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal za novo omaro
  const [modalOpen, setModalOpen] = useState(false);
  const [newClosetName, setNewClosetName] = useState('');
  const [newClosetLocation, setNewClosetLocation] = useState('');
  const [creating, setCreating] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [closetData, shelfData] = await Promise.all([
        api.getClosets(),
        api.getShelves()
      ]);

      const closetsArr = Array.isArray(closetData) ? closetData : [];
      const shelvesArr = Array.isArray(shelfData) ? shelfData : [];

      // Preštejemo police za vsako omaro
      const enriched = closetsArr.map(c => {
        const count = shelvesArr.filter(s => {
          const cId = s.closet?._id || s.closet;
          return String(cId) === String(c._id);
        }).length;
        return { ...c, shelvesCount: count };
      });

      setClosets(enriched);
    } catch (err) {
      console.error('Napaka pri nalaganju omar:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateCloset = async (e) => {
    e.preventDefault();
    if (!newClosetName.trim()) return;

    setCreating(true);
    try {
      await api.createCloset({
        name: newClosetName.trim(),
        location: newClosetLocation.trim()
      });
      setNewClosetName('');
      setNewClosetLocation('');
      setModalOpen(false);
      await loadData();
    } catch (err) {
      alert('Napaka pri ustvarjanju omare: ' + err.message);
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="py-16 flex flex-col items-center justify-center gap-3 text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        <p className="text-xs font-medium">Nalagam omare...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      
      {/* Glava strani */}
      <div className="flex items-center justify-between gap-3 pt-1">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Omare v skladišču
          </h1>
          <p className="text-xs text-slate-500">
            Izberite omaro za ogled polic in artiklov
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Nova omara</span>
        </button>
      </div>

      {/* Seznam omar - minimalistične kartice primerne za telefon */}
      {closets.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center">
          <Archive className="w-10 h-10 mx-auto text-slate-300 mb-2" />
          <h3 className="text-sm font-bold text-slate-700">Ni še ustvarjenih omar</h3>
          <p className="text-xs text-slate-500 mt-1 mb-4">
            Dodajte prvo omaro ali regal v skladišče.
          </p>
          <button
            onClick={() => setModalOpen(true)}
            className="px-4 py-2 bg-emerald-700 text-white text-xs font-bold rounded-xl"
          >
            + Dodaj omaro
          </button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {closets.map((closet) => {
            const count = closet.shelvesCount || 0;
            return (
              <div
                key={closet._id}
                onClick={() => navigate(`/omara/${closet._id}`)}
                className="bg-white active:bg-slate-50 hover:bg-slate-50/80 rounded-2xl border border-slate-200/90 p-4 shadow-2xs transition-all flex items-center justify-between gap-3 cursor-pointer group"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-100 flex items-center justify-center shrink-0">
                    <Archive className="w-5 h-5 text-emerald-700" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-base font-bold text-slate-900 truncate leading-tight group-hover:text-emerald-800 transition-colors">
                      {closet.name}
                    </h2>
                    <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                      {closet.location && (
                        <span className="flex items-center gap-1 truncate max-w-[140px] sm:max-w-none">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{closet.location}</span>
                        </span>
                      )}
                      {closet.location && <span>&bull;</span>}
                      <span className="font-semibold text-emerald-800 flex items-center gap-1 shrink-0">
                        <Layers className="w-3 h-3" />
                        <span>{count} {count === 1 ? 'polica' : count === 2 ? 'polici' : 'polic'}</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-2 text-slate-300 group-hover:text-emerald-700 group-hover:translate-x-0.5 transition-all shrink-0">
                  <ArrowRight className="w-5 h-5" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal za dodajanje omare */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl max-w-md w-full overflow-hidden border border-slate-200 animate-in slide-in-from-bottom-4 duration-150">
            <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
              <h3 className="text-sm font-bold">Nova omara v skladišču</h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCloset} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Ime omare *
                </label>
                <input
                  type="text"
                  required
                  placeholder="npr. Omara za šotore"
                  value={newClosetName}
                  onChange={(e) => setNewClosetName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Lokacija (opcijsko)
                </label>
                <input
                  type="text"
                  placeholder="npr. Severna stena - levo"
                  value={newClosetLocation}
                  onChange={(e) => setNewClosetLocation(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Prekliči
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl disabled:opacity-60"
                >
                  {creating ? 'Ustvarjam...' : 'Ustvari omaro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
