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
  MapPin, 
  Warehouse,
  Edit3,
  Trash2,
  Key
} from 'lucide-react';

export default function WarehouseRoomPage() {
  const navigate = useNavigate();

  const [warehouses, setWarehouses] = useState([]);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState('');
  const [closets, setClosets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingClosets, setLoadingClosets] = useState(false);

  // Modal for new closet
  const [closetModalOpen, setClosetModalOpen] = useState(false);
  const [newClosetName, setNewClosetName] = useState('');
  const [newClosetLocation, setNewClosetLocation] = useState('');
  const [creatingCloset, setCreatingCloset] = useState(false);

  // Modal for new warehouse
  const [warehouseModalOpen, setWarehouseModalOpen] = useState(false);
  const [newWarehouseName, setNewWarehouseName] = useState('');
  const [newWarehouseLocation, setNewWarehouseLocation] = useState('');
  const [newWarehouseDescription, setNewWarehouseDescription] = useState('');
  const [creatingWarehouse, setCreatingWarehouse] = useState(false);

  // Modal for editing warehouse
  const [editWarehouseModalOpen, setEditWarehouseModalOpen] = useState(false);
  const [editingWarehouseId, setEditingWarehouseId] = useState('');
  const [editWarehouseName, setEditWarehouseName] = useState('');
  const [editWarehouseLocation, setEditWarehouseLocation] = useState('');
  const [editWarehouseDescription, setEditWarehouseDescription] = useState('');
  const [updatingWarehouse, setUpdatingWarehouse] = useState(false);
  const [deletingWarehouse, setDeletingWarehouse] = useState(false);

  const loadClosetsForWarehouse = useCallback(async (warehouseId) => {
    try {
      setLoadingClosets(true);
      const [closetData, shelfData] = await Promise.all([
        api.getWarehouseClosets(warehouseId),
        api.getShelves()
      ]);

      const closetsArr = Array.isArray(closetData) ? closetData : [];
      const shelvesArr = Array.isArray(shelfData) ? shelfData : [];

      const enriched = closetsArr.map((closet) => {
        const count = shelvesArr.filter((shelf) => {
          const closetRefId = shelf.closet?._id || shelf.closet;
          return String(closetRefId) === String(closet._id);
        }).length;
        return { ...closet, shelvesCount: count };
      });

      setClosets(enriched);
    } catch (err) {
      console.error('Napaka pri nalaganju omar skladišča:', err);
    } finally {
      setLoadingClosets(false);
    }
  }, []);

  const loadInitialData = useCallback(async () => {
    try {
      setLoading(true);
      const warehouseData = await api.getWarehouses();
      const warehouseList = Array.isArray(warehouseData) ? warehouseData : [];
      setWarehouses(warehouseList);

      if (warehouseList.length > 0) {
        let storedId = '';
        try {
          storedId = localStorage.getItem('skavt_selected_warehouse_id') || '';
        } catch (storageErr) {
          console.warn('LocalStorage nedostopen:', storageErr);
        }

        const exists = warehouseList.some((w) => String(w._id) === String(storedId));
        const activeId = exists ? storedId : String(warehouseList[0]._id);

        setSelectedWarehouseId(activeId);
        try {
          localStorage.setItem('skavt_selected_warehouse_id', activeId);
        } catch (storageErr) {
          console.warn('Shranjevanje v LocalStorage ni uspelo:', storageErr);
        }

        await loadClosetsForWarehouse(activeId);
      } else {
        setClosets([]);
      }
    } catch (err) {
      console.error('Napaka pri začetnem nalaganju skladišč:', err);
    } finally {
      setLoading(false);
    }
  }, [loadClosetsForWarehouse]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  const handleSelectWarehouse = async (warehouseId) => {
    try {
      setSelectedWarehouseId(warehouseId);
      try {
        localStorage.setItem('skavt_selected_warehouse_id', warehouseId);
      } catch (storageErr) {
        console.warn('Shranjevanje v LocalStorage ni uspelo:', storageErr);
      }
      await loadClosetsForWarehouse(warehouseId);
    } catch (err) {
      console.error('Napaka pri preklopu skladišča:', err);
    }
  };

  const handleCreateWarehouse = async (e) => {
    e.preventDefault();
    if (!newWarehouseName.trim()) return;

    try {
      setCreatingWarehouse(true);
      const created = await api.createWarehouse({
        name: newWarehouseName.trim(),
        location: newWarehouseLocation.trim(),
        description: newWarehouseDescription.trim()
      });

      setNewWarehouseName('');
      setNewWarehouseLocation('');
      setNewWarehouseDescription('');
      setWarehouseModalOpen(false);

      const warehouseData = await api.getWarehouses();
      const list = Array.isArray(warehouseData) ? warehouseData : [];
      setWarehouses(list);

      const newId = created?._id ? String(created._id) : (list.length > 0 ? String(list[list.length - 1]._id) : '');
      if (newId) {
        setSelectedWarehouseId(newId);
        try {
          localStorage.setItem('skavt_selected_warehouse_id', newId);
        } catch (storageErr) {
          console.warn('Shranjevanje v LocalStorage ni uspelo:', storageErr);
        }
        await loadClosetsForWarehouse(newId);
      }
    } catch (err) {
      alert('Napaka pri ustvarjanju skladišča: ' + err.message);
    } finally {
      setCreatingWarehouse(false);
    }
  };

  const openEditWarehouseModal = (warehouse) => {
    if (!warehouse) return;
    setEditingWarehouseId(warehouse._id);
    setEditWarehouseName(warehouse.name || '');
    setEditWarehouseLocation(warehouse.location || '');
    setEditWarehouseDescription(warehouse.description || '');
    setEditWarehouseModalOpen(true);
  };

  const handleUpdateWarehouse = async (e) => {
    e.preventDefault();
    if (!editWarehouseName.trim() || !editingWarehouseId) return;

    try {
      setUpdatingWarehouse(true);
      await api.updateWarehouse(editingWarehouseId, {
        name: editWarehouseName.trim(),
        location: editWarehouseLocation.trim(),
        description: editWarehouseDescription.trim()
      });

      setEditWarehouseModalOpen(false);

      const warehouseData = await api.getWarehouses();
      const list = Array.isArray(warehouseData) ? warehouseData : [];
      setWarehouses(list);
    } catch (err) {
      alert('Napaka pri posodabljanju skladišča: ' + err.message);
    } finally {
      setUpdatingWarehouse(false);
    }
  };

  const handleDeleteWarehouse = async () => {
    if (!editingWarehouseId) return;
    if (warehouses.length <= 1) {
      alert('Zadnjega skladišča ni mogoče izbrisati.');
      return;
    }

    const confirmed = window.confirm(
      `Ali ste prepričani, da želite izbrisati skladišče "${editWarehouseName}"? Morebitne omare bodo avtomatsko premaknjene v preostalo skladišče.`
    );
    if (!confirmed) return;

    try {
      setDeletingWarehouse(true);
      await api.deleteWarehouse(editingWarehouseId);
      setEditWarehouseModalOpen(false);

      const warehouseData = await api.getWarehouses();
      const list = Array.isArray(warehouseData) ? warehouseData : [];
      setWarehouses(list);

      const fallbackWarehouse = list[0];
      const nextId = fallbackWarehouse ? String(fallbackWarehouse._id) : '';
      setSelectedWarehouseId(nextId);
      try {
        localStorage.setItem('skavt_selected_warehouse_id', nextId);
      } catch (storageErr) {
        console.warn('Shranjevanje v LocalStorage ni uspelo:', storageErr);
      }

      if (nextId) {
        await loadClosetsForWarehouse(nextId);
      } else {
        setClosets([]);
      }
    } catch (err) {
      alert('Napaka pri brisanju skladišča: ' + err.message);
    } finally {
      setDeletingWarehouse(false);
    }
  };

  const handleCreateCloset = async (e) => {
    e.preventDefault();
    if (!newClosetName.trim()) return;

    try {
      setCreatingCloset(true);
      await api.createCloset({
        name: newClosetName.trim(),
        location: newClosetLocation.trim(),
        warehouse: selectedWarehouseId
      });
      setNewClosetName('');
      setNewClosetLocation('');
      setClosetModalOpen(false);
      await loadClosetsForWarehouse(selectedWarehouseId);
    } catch (err) {
      alert('Napaka pri ustvarjanju omare: ' + err.message);
    } finally {
      setCreatingCloset(false);
    }
  };

  const currentWarehouse = warehouses.find((w) => String(w._id) === String(selectedWarehouseId)) || warehouses[0];

  if (loading) {
    return (
      <div className="py-16 flex flex-col items-center justify-center gap-3 text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        <p className="text-xs font-medium">Nalagam skladišča in omare...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      
      {/* Glava strani */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {warehouses.length > 1 ? 'Skladišča' : (currentWarehouse?.name || 'Skladišče')}
            </h1>
            {currentWarehouse && (
              <button
                onClick={() => openEditWarehouseModal(currentWarehouse)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors"
                title="Uredi trenutno skladišče"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          

          <button
            onClick={() => setWarehouseModalOpen(true)}
            className="px-3 py-2 bg-white hover:bg-slate-50 active:scale-95 text-slate-700 border border-slate-300 text-xs font-bold rounded-xl shadow-2xs transition-all flex items-center gap-1.5 shrink-0"
            title="Dodaj novo skladišče"
          >
            <Plus className="w-3.5 h-3.5 text-slate-500" />
            <span>Skladišče</span>
          </button>

          <button
            onClick={() => setClosetModalOpen(true)}
            className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Nova omara</span>
          </button>
        </div>
      </div>

      {/* Preklopnik med skladišči, če obstajata 2 ali več skladišč */}
      {warehouses.length > 1 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar -mx-1 px-1">
          {warehouses.map((warehouse) => {
            const isSelected = String(warehouse._id) === String(selectedWarehouseId);
            return (
              <div key={warehouse._id} className="flex items-center shrink-0">
                <button
                  onClick={() => handleSelectWarehouse(warehouse._id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                    isSelected
                      ? 'bg-emerald-800 text-white shadow-xs'
                      : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
                  }`}
                >
                  <Warehouse className={`w-3.5 h-3.5 ${isSelected ? 'text-emerald-200' : 'text-slate-400'}`} />
                  <span>{warehouse.name}</span>
                  {warehouse.location && (
                    <span className={`text-[10px] font-normal ${isSelected ? 'text-emerald-200' : 'text-slate-400'}`}>
                      ({warehouse.location})
                    </span>
                  )}
                </button>
                {isSelected && (
                  <button
                    onClick={() => openEditWarehouseModal(warehouse)}
                    className="ml-1 p-2 bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-xl transition-all shadow-2xs"
                    title="Uredi to skladišče"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Prikaz trenutnega skladišča, če je samo 1 */}
      {warehouses.length === 1 && currentWarehouse && (
        <div className="bg-white rounded-2xl border border-slate-200/80 px-4 py-3 shadow-2xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-100 flex items-center justify-center shrink-0">
              <Warehouse className="w-4 h-4 text-emerald-700" />
            </div>
            <div className="min-w-0">
              <h2 className="text-xs font-bold text-slate-800 truncate">{currentWarehouse.name}</h2>
              {currentWarehouse.location && (
                <p className="text-[11px] text-slate-500 flex items-center gap-1 truncate">
                  <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                  <span className="truncate">{currentWarehouse.location}</span>
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg">
              {closets.length} {closets.length === 1 ? 'omara' : closets.length === 2 ? 'omari' : 'omar'}
            </span>
            <button
              onClick={() => openEditWarehouseModal(currentWarehouse)}
              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
              title="Uredi skladišče"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Seznam omar za izbrano skladišče */}
      {loadingClosets ? (
        <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-500">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
          <p className="text-xs">Nalagam omare...</p>
        </div>
      ) : closets.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center">
          <Archive className="w-10 h-10 mx-auto text-slate-300 mb-2" />
          <h3 className="text-sm font-bold text-slate-700">Ni še ustvarjenih omar v tem skladišču</h3>
          <p className="text-xs text-slate-500 mt-1 mb-4">
            Dodajte prvo omaro ali regal v skladišče {currentWarehouse?.name ? `"${currentWarehouse.name}"` : ''}.
          </p>
          <button
            onClick={() => setClosetModalOpen(true)}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl"
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

      {/* Modal za dodajanje skladišča */}
      {warehouseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl max-w-md w-full overflow-hidden border border-slate-200 animate-in slide-in-from-bottom-4 duration-150">
            <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Warehouse className="w-4 h-4 text-emerald-400" />
                <span>Novo skladišče</span>
              </h3>
              <button onClick={() => setWarehouseModalOpen(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateWarehouse} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Ime skladišča *
                </label>
                <input
                  type="text"
                  required
                  placeholder="npr. Prebold ali Glavno skladišče"
                  value={newWarehouseName}
                  onChange={(e) => setNewWarehouseName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Lokacija (opcijsko)
                </label>
                <input
                  type="text"
                  placeholder="npr. Klet župnišča ali Ulica 1"
                  value={newWarehouseLocation}
                  onChange={(e) => setNewWarehouseLocation(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Opis (opcijsko)
                </label>
                <input
                  type="text"
                  placeholder="npr. Oprema za vode in tabore"
                  value={newWarehouseDescription}
                  onChange={(e) => setNewWarehouseDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setWarehouseModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Prekliči
                </button>
                <button
                  type="submit"
                  disabled={creatingWarehouse}
                  className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl disabled:opacity-60"
                >
                  {creatingWarehouse ? 'Ustvarjam...' : 'Ustvari skladišče'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal za urejanje skladišča */}
      {editWarehouseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl max-w-md w-full overflow-hidden border border-slate-200 animate-in slide-in-from-bottom-4 duration-150">
            <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-emerald-400" />
                <span>Uredi skladišče</span>
              </h3>
              <button onClick={() => setEditWarehouseModalOpen(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateWarehouse} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Ime skladišča *
                </label>
                <input
                  type="text"
                  required
                  value={editWarehouseName}
                  onChange={(e) => setEditWarehouseName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Lokacija (opcijsko)
                </label>
                <input
                  type="text"
                  placeholder="npr. Klet župnišča"
                  value={editWarehouseLocation}
                  onChange={(e) => setEditWarehouseLocation(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Opis (opcijsko)
                </label>
                <input
                  type="text"
                  placeholder="npr. Glavni skladiščni prostor"
                  value={editWarehouseDescription}
                  onChange={(e) => setEditWarehouseDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-100">
                {warehouses.length > 1 ? (
                  <button
                    type="button"
                    onClick={handleDeleteWarehouse}
                    disabled={deletingWarehouse}
                    className="px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 active:scale-95 rounded-xl flex items-center gap-1.5 transition-all disabled:opacity-60"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{deletingWarehouse ? 'Brišem...' : 'Izbriši skladišče'}</span>
                  </button>
                ) : (
                  <span className="text-[11px] text-slate-400 italic">
                    Zadnjega skladišča ni mogoče izbrisati
                  </span>
                )}

                <div className="flex items-center gap-2 ml-auto">
                  <button
                    type="button"
                    onClick={() => setEditWarehouseModalOpen(false)}
                    className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    Prekliči
                  </button>
                  <button
                    type="submit"
                    disabled={updatingWarehouse}
                    className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl disabled:opacity-60"
                  >
                    {updatingWarehouse ? 'Shranjujem...' : 'Shrani spremembe'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal za dodajanje omare */}
      {closetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl max-w-md w-full overflow-hidden border border-slate-200 animate-in slide-in-from-bottom-4 duration-150">
            <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold">Nova omara</h3>
                <p className="text-[11px] text-slate-400">
                  Skladišče: <span className="text-emerald-400 font-semibold">{currentWarehouse?.name || 'Glavno'}</span>
                </p>
              </div>
              <button onClick={() => setClosetModalOpen(false)} className="text-slate-400 hover:text-white p-1">
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
                  onClick={() => setClosetModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Prekliči
                </button>
                <button
                  type="submit"
                  disabled={creatingCloset}
                  className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl disabled:opacity-60"
                >
                  {creatingCloset ? 'Ustvarjam...' : 'Ustvari omaro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
