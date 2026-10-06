import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { useBorrow } from '../context/BorrowContext';
import { 
  ShoppingCart, 
  Plus, 
  Trash2, 
  Check, 
  CheckCircle2, 
  RotateCcw, 
  AlertTriangle, 
  Loader2, 
  X,
  User
} from 'lucide-react';

export default function ShoppingPage() {
  const { showToast } = useBorrow();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newItemName, setNewItemName] = useState('');
  const [newItemPerson, setNewItemPerson] = useState('');
  const [adding, setAdding] = useState(false);

  // Zavihek: 'pending' (za nakup), 'purchased' (že kupljeno), 'all' (vse)
  const [tab, setTab] = useState('pending');

  // Stanje potrditvenega modala
  // actionType: 'toggle' | 'delete'
  const [confirmModal, setConfirmModal] = useState({
    open: false,
    item: null,
    actionType: null,
    loading: false
  });

  const loadItems = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getShoppingList();
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Napaka pri nalaganju nakupovalnega seznama:', err);
      showToast('Napaka pri nalaganju: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    setAdding(true);
    try {
      await api.createShoppingItem({
        name: newItemName.trim(),
        person: newItemPerson.trim() || 'Skladišče'
      });
      setNewItemName('');
      setNewItemPerson('');
      await loadItems();
      showToast('Artikel uspešno dodan na seznam za nakup.');
    } catch (err) {
      showToast('Napaka pri dodajanju: ' + err.message, 'error');
    } finally {
      setAdding(false);
    }
  };

  const openConfirmToggle = (item) => {
    setConfirmModal({
      open: true,
      item,
      actionType: 'toggle',
      loading: false
    });
  };

  const openConfirmDelete = (item) => {
    setConfirmModal({
      open: true,
      item,
      actionType: 'delete',
      loading: false
    });
  };

  const closeConfirmModal = () => {
    setConfirmModal({
      open: false,
      item: null,
      actionType: null,
      loading: false
    });
  };

  const handleExecuteAction = async () => {
    const { item, actionType } = confirmModal;
    if (!item) return;

    setConfirmModal(prev => ({ ...prev, loading: true }));
    try {
      if (actionType === 'toggle') {
        const nextState = !item.isPurchased;
        await api.togglePurchasedShoppingItem(item._id, nextState);
        setItems(prev => prev.map(i => i._id === item._id ? { ...i, isPurchased: nextState } : i));
        showToast(nextState ? `Artikel "${item.name}" označen kot kupljen.` : `Artikel "${item.name}" vrnjen med nekupljene.`);
      } else if (actionType === 'delete') {
        await api.deleteShoppingItem(item._id);
        setItems(prev => prev.filter(i => i._id !== item._id));
        showToast(`Artikel "${item.name}" odstranjen s seznama.`);
      }
      closeConfirmModal();
    } catch (err) {
      showToast('Napaka: ' + err.message, 'error');
      setConfirmModal(prev => ({ ...prev, loading: false }));
    }
  };

  const pendingItems = items.filter(i => !i.isPurchased);
  const purchasedItems = items.filter(i => i.isPurchased);

  const displayedItems = tab === 'pending'
    ? pendingItems
    : tab === 'purchased'
      ? purchasedItems
      : items;

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      
      {/* Glava */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-emerald-700" />
            <span>Nakupovalni seznam</span>
          </h1>
          <p className="text-xs text-slate-500">
            Evidenca opreme in artiklov, ki jih je potrebno kupiti
          </p>
        </div>

        {/* Zavihki */}
        <div className="flex items-center gap-1 bg-slate-200/70 p-1 rounded-xl text-xs self-start sm:self-auto">
          <button
            onClick={() => setTab('pending')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              tab === 'pending'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Za nakup ({pendingItems.length})
          </button>
          <button
            onClick={() => setTab('purchased')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              tab === 'purchased'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Kupljeno ({purchasedItems.length})
          </button>
          <button
            onClick={() => setTab('all')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              tab === 'all'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Vse ({items.length})
          </button>
        </div>
      </div>

      {/* Obrazec za dodajanje artikla na seznam */}
      <form onSubmit={handleAddItem} className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2.5">
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            required
            placeholder="Artikel za nakup (npr. 10x vrv 8mm, plinska kartuša...)..."
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            className="flex-1 px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
          />
          <input
            type="text"
            placeholder="Kdo predlaga? (npr. Peter)"
            value={newItemPerson}
            onChange={(e) => setNewItemPerson(e.target.value)}
            className="sm:w-44 px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
          />
          <button
            type="submit"
            disabled={adding}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-xs shrink-0"
          >
            {adding ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            <span>Dodaj</span>
          </button>
        </div>
      </form>

      {/* Seznam artiklov */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
          <Loader2 className="w-7 h-7 animate-spin text-emerald-600" />
          <span>Nalagam nakupovalni seznam...</span>
        </div>
      ) : displayedItems.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-10 text-center">
          <ShoppingCart className="w-10 h-10 mx-auto text-slate-300 mb-2" />
          <h3 className="text-sm font-bold text-slate-800">
            {tab === 'pending' 
              ? 'Seznam za nakup je prazen' 
              : tab === 'purchased' 
                ? 'Ni še zabeleženih kupljenih artiklov' 
                : 'Seznam je povsem prazen'}
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Uporabite zgornji obrazec za dodajanje novega artikla.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {displayedItems.map((item) => {
            const isDone = item.isPurchased;

            return (
              <div
                key={item._id}
                className={`bg-white rounded-2xl border p-3.5 shadow-2xs flex items-center justify-between gap-3 transition-all ${
                  isDone 
                    ? 'border-slate-200/60 bg-slate-50/70 opacity-75' 
                    : 'border-slate-200/90'
                }`}
              >
                {/* Leva stran: gumb za potrditev (klukanje) in naziv */}
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    onClick={() => openConfirmToggle(item)}
                    title={isDone ? 'Označi nazaj kot nekupljeno' : 'Označi kot kupljeno'}
                    className={`w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 transition-all ${
                      isDone
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : 'border-slate-300 hover:border-emerald-600 hover:bg-emerald-50 text-transparent hover:text-emerald-700'
                    }`}
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                  </button>

                  <div className="min-w-0">
                    <span className={`text-sm font-bold block leading-tight truncate ${
                      isDone ? 'line-through text-slate-400' : 'text-slate-900'
                    }`}>
                      {item.name}
                    </span>

                    {item.person && (
                      <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <User className="w-3 h-3 text-slate-400" />
                        <span>Predlagal: {item.person}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Desna stran: značka in gumb za izbris */}
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isDone 
                      ? 'bg-emerald-100 text-emerald-800' 
                      : 'bg-amber-100 text-amber-900'
                  }`}>
                    {isDone ? 'Kupljeno' : 'Za kupiti'}
                  </span>

                  <button
                    onClick={() => openConfirmDelete(item)}
                    title="Odstrani artikel"
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal za potrditev akcije (Klukanje ali Brisanje) */}
      {confirmModal.open && confirmModal.item && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl max-w-md w-full overflow-hidden border border-slate-200 animate-in slide-in-from-bottom-4 duration-150 p-5 space-y-4">
            
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                {confirmModal.actionType === 'delete' ? (
                  <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
                    <Trash2 className="w-4 h-4" />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                )}

                <h3 className="text-sm font-bold text-slate-900">
                  {confirmModal.actionType === 'delete' 
                    ? 'Odstrani artikel s seznama' 
                    : confirmModal.item.isPurchased 
                      ? 'Vrni artikel med nekupljene' 
                      : 'Označi artikel kot kupljen'}
                </h3>
              </div>

              <button 
                onClick={closeConfirmModal}
                disabled={confirmModal.loading}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {confirmModal.actionType === 'delete' ? (
                <>
                  Ali ste prepričani, da želite artikel <strong>"{confirmModal.item.name}"</strong> dokončno izbrisati s seznama?
                </>
              ) : confirmModal.item.isPurchased ? (
                <>
                  Ali ste prepričani, da želite artikel <strong>"{confirmModal.item.name}"</strong> vrniti med artikle, ki jih je še potrebno kupiti?
                </>
              ) : (
                <>
                  Ali ste prepričani, da je artikel <strong>"{confirmModal.item.name}"</strong> že kupljen in ga želite označiti kot opravljenega?
                </>
              )}
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={confirmModal.loading}
                onClick={closeConfirmModal}
                className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Prekliči
              </button>

              <button
                type="button"
                disabled={confirmModal.loading}
                onClick={handleExecuteAction}
                className={`px-4 py-2 text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 text-white ${
                  confirmModal.actionType === 'delete'
                    ? 'bg-rose-700 hover:bg-rose-800'
                    : 'bg-emerald-700 hover:bg-emerald-800'
                }`}
              >
                {confirmModal.loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : confirmModal.actionType === 'delete' ? (
                  <Trash2 className="w-4 h-4" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                <span>
                  {confirmModal.actionType === 'delete' 
                    ? 'Da, izbriši' 
                    : confirmModal.item.isPurchased 
                      ? 'Da, vrni med nekupljene' 
                      : 'Da, potrdi nakup'}
                </span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
