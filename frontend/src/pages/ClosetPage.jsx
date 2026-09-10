import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { 
  Layers, 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Edit3, 
  MapPin, 
  ArrowRight,
  Loader2,
  X
} from 'lucide-react';

export default function ClosetPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [closet, setCloset] = useState(null);
  const [shelves, setShelves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Dodajanje police
  const [shelfModalOpen, setShelfModalOpen] = useState(false);
  const [shelfName, setShelfName] = useState('');
  const [shelfLocation, setShelfLocation] = useState('');
  const [shelfDescription, setShelfDescription] = useState('');
  const [savingShelf, setSavingShelf] = useState(false);

  // Urejanje omare
  const [editClosetModalOpen, setEditClosetModalOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editLocation, setEditLocation] = useState('');

  const loadClosetAndShelves = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const [closetData, shelvesData] = await Promise.all([
        api.getCloset(id),
        api.getClosetShelves(id)
      ]);
      setCloset(closetData);
      setShelves(Array.isArray(shelvesData) ? shelvesData : []);
      
      setEditName(closetData.name || '');
      setEditLocation(closetData.location || '');
    } catch (err) {
      console.error('Napaka pri nalaganju omare:', err);
      setError(err.message || 'Omara ni bila najdena.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadClosetAndShelves();
  }, [loadClosetAndShelves]);

  const handleAddShelf = async (e) => {
    e.preventDefault();
    if (!shelfName.trim()) return;

    setSavingShelf(true);
    try {
      await api.createShelf({
        name: shelfName.trim(),
        location: shelfLocation.trim(),
        description: shelfDescription.trim(),
        closet: id
      });
      setShelfName('');
      setShelfLocation('');
      setShelfDescription('');
      setShelfModalOpen(false);
      await loadClosetAndShelves();
    } catch (err) {
      alert('Napaka pri ustvarjanju police: ' + err.message);
    } finally {
      setSavingShelf(false);
    }
  };

  const handleUpdateCloset = async (e) => {
    e.preventDefault();
    try {
      const updated = await api.updateCloset(id, {
        name: editName,
        location: editLocation
      });
      setCloset(updated);
      setEditClosetModalOpen(false);
    } catch (err) {
      alert('Napaka pri posodobitvi omare: ' + err.message);
    }
  };

  const handleDeleteCloset = async () => {
    if (!window.confirm(`Ali ste prepričani, da želite izbrisati omaro "${closet.name}"?`)) {
      return;
    }
    try {
      await api.deleteCloset(id);
      navigate('/');
    } catch (err) {
      alert('Napaka pri brisanju omare: ' + err.message);
    }
  };

  const handleDeleteShelf = async (e, shelfId, sName) => {
    e.stopPropagation();
    if (!window.confirm(`Ali ste prepričani, da želite izbrisati polico "${sName}"?`)) {
      return;
    }
    try {
      await api.deleteShelf(shelfId);
      await loadClosetAndShelves();
    } catch (err) {
      alert('Napaka pri brisanju police: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="py-16 flex flex-col items-center justify-center gap-3 text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        <p className="text-xs font-medium">Nalagam police...</p>
      </div>
    );
  }

  if (error || !closet) {
    return (
      <div className="p-6 text-center bg-white rounded-2xl border border-slate-200 max-w-md mx-auto">
        <h2 className="text-base font-bold text-slate-800 mb-1">Omara ni bila najdena</h2>
        <p className="text-slate-500 text-xs mb-4">{error || 'Podatki niso na voljo.'}</p>
        <button 
          onClick={() => navigate('/')} 
          className="px-4 py-2 bg-emerald-700 text-white rounded-xl text-xs font-semibold"
        >
          Nazaj na omare
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      
      {/* Navigacija nazaj */}
      <button
        onClick={() => navigate('/')}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-emerald-800 transition-colors py-1"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Nazaj na vse omare</span>
      </button>

      {/* Glava omare */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-2xs">
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
              Omara
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-tight mt-0.5">
              {closet.name}
            </h1>
            {closet.location && (
              <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                <MapPin className="w-3 h-3 text-slate-400" />
                <span>{closet.location}</span>
              </p>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => setEditClosetModalOpen(true)}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              title="Uredi omaro"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              onClick={handleDeleteCloset}
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
              title="Izbriši omaro"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500">
            {shelves.length} {shelves.length === 1 ? 'polica' : shelves.length === 2 ? 'polici' : 'polic'}
          </span>
          <button
            onClick={() => setShelfModalOpen(true)}
            className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1 shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Dodaj polico</span>
          </button>
        </div>
      </div>

      {/* Seznam polic */}
      <div className="space-y-2">
        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
          Police v tej omari
        </h2>

        {shelves.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center">
            <Layers className="w-8 h-8 mx-auto text-slate-300 mb-2" />
            <p className="text-xs text-slate-500 mb-3">V tej omari še ni nobenih polic.</p>
            <button
              onClick={() => setShelfModalOpen(true)}
              className="px-3.5 py-2 bg-emerald-700 text-white text-xs font-bold rounded-xl"
            >
              + Dodaj prvo polico
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {shelves.map((shelf, idx) => (
              <div
                key={shelf._id}
                onClick={() => navigate(`/polica/${shelf._id}`)}
                className="bg-white active:bg-slate-50 hover:bg-slate-50 rounded-2xl border border-slate-200/90 p-4 shadow-2xs transition-all flex items-center justify-between gap-3 cursor-pointer group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-slate-100 font-bold text-xs text-slate-700 flex items-center justify-center shrink-0">
                    {idx + 1}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-slate-900 truncate leading-tight group-hover:text-emerald-800 transition-colors">
                      {shelf.name}
                    </h3>
                    {(shelf.location || shelf.description) && (
                      <p className="text-xs text-slate-500 truncate mt-0.5">
                        {shelf.location || shelf.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={(e) => handleDeleteShelf(e, shelf._id, shelf.name)}
                    className="p-1.5 text-slate-300 hover:text-rose-600 rounded-lg"
                    title="Izbriši polico"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-700 group-hover:translate-x-0.5 transition-all" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal za dodajanje police */}
      {shelfModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl max-w-md w-full overflow-hidden border border-slate-200 animate-in slide-in-from-bottom-4 duration-150">
            <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
              <h3 className="text-sm font-bold">Nova polica v: {closet.name}</h3>
              <button onClick={() => setShelfModalOpen(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddShelf} className="p-5 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Ime police *
                </label>
                <input
                  type="text"
                  required
                  placeholder="npr. Zgornja polica za sekire"
                  value={shelfName}
                  onChange={(e) => setShelfName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Položaj / Višina (opcijsko)
                </label>
                <input
                  type="text"
                  placeholder="npr. 1. od zgoraj"
                  value={shelfLocation}
                  onChange={(e) => setShelfLocation(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Opis vsebine
                </label>
                <input
                  type="text"
                  placeholder="Kratki opis artiklov na polici..."
                  value={shelfDescription}
                  onChange={(e) => setShelfDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShelfModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Prekliči
                </button>
                <button
                  type="submit"
                  disabled={savingShelf}
                  className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl disabled:opacity-60"
                >
                  {savingShelf ? 'Dodajam...' : 'Dodaj polico'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal za urejanje omare */}
      {editClosetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl max-w-md w-full overflow-hidden border border-slate-200 animate-in slide-in-from-bottom-4 duration-150">
            <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
              <h3 className="text-sm font-bold">Uredi omaro</h3>
              <button onClick={() => setEditClosetModalOpen(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateCloset} className="p-5 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Ime omare
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Lokacija
                </label>
                <input
                  type="text"
                  value={editLocation}
                  onChange={(e) => setEditLocation(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditClosetModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Prekliči
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl"
                >
                  Shrani
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
