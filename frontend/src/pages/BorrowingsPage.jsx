import React, { useState, useEffect, useCallback } from 'react';
import { useBorrow } from '../context/BorrowContext';
import { api } from '../services/api';
import { 
  CheckCircle2, 
  Calendar, 
  User, 
  Package, 
  Clock, 
  RotateCcw,
  AlertTriangle,
  ShoppingCart,
  X,
  Plus
} from 'lucide-react';

export default function BorrowingsPage() {
  const { borrows, activeBorrows, returnBorrow, deleteBorrowRecord, showToast } = useBorrow();
  const [filterTab, setFilterTab] = useState('active'); // 'active', 'all', 'shopping'

  // Modal za "Odrabljeno / uničeno"
  const [damagedModalRecord, setDamagedModalRecord] = useState(null);
  const [processingDamaged, setProcessingDamaged] = useState(false);

  // Nakupovalni seznam
  const [shoppingItems, setShoppingItems] = useState([]);
  const [loadingShopping, setLoadingShopping] = useState(false);
  const [newShoppingName, setNewShoppingName] = useState('');

  const loadShopping = useCallback(async () => {
    try {
      setLoadingShopping(true);
      const data = await api.getShoppingList();
      setShoppingItems(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Napaka pri nalaganju nakupovalnega seznama:', err);
    } finally {
      setLoadingShopping(false);
    }
  }, []);

  useEffect(() => {
    if (filterTab === 'shopping') {
      loadShopping();
    }
  }, [filterTab, loadShopping]);

  const formatDate = (isoStr) => {
    if (!isoStr) return '-';
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString('sl-SI', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return isoStr;
    }
  };

  const handleConfirmDamaged = async (addToShopping) => {
    if (!damagedModalRecord) return;
    setProcessingDamaged(true);

    try {
      if (addToShopping) {
        const itemName = `${damagedModalRecord.quantity > 1 ? damagedModalRecord.quantity + 'x ' : ''}${damagedModalRecord.articleName}`;
        await api.createShoppingItem({
          name: itemName,
          person: damagedModalRecord.person || 'Skladišče'
        });
        showToast(`Dodano na seznam za nakup: ${itemName}`);
      } else {
        showToast(`Izposoja za "${damagedModalRecord.articleName}" odstranjena.`);
      }

      // Odstranimo izposojo, saj je artikel uničen/odrabljen in ga ni več
      deleteBorrowRecord(damagedModalRecord.id);
      setDamagedModalRecord(null);

      if (filterTab === 'shopping') {
        await loadShopping();
      }
    } catch (err) {
      showToast('Napaka: ' + err.message, 'error');
    } finally {
      setProcessingDamaged(false);
    }
  };

  const handleAddDirectShopping = async (e) => {
    e.preventDefault();
    if (!newShoppingName.trim()) return;

    try {
      await api.createShoppingItem({
        name: newShoppingName.trim(),
        person: 'Skladišče'
      });
      setNewShoppingName('');
      await loadShopping();
      showToast('Dodano na nakupovalni seznam.');
    } catch (err) {
      showToast('Napaka pri dodajanju: ' + err.message, 'error');
    }
  };

  const displayedBorrows = filterTab === 'active' 
    ? activeBorrows 
    : borrows;

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      
      {/* Glava */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Izposoje & Nakupi
          </h1>
          <p className="text-xs text-slate-500">
            Pregled izposojene opreme in seznam za nakup novih artiklov
          </p>
        </div>

        {/* Zavihki */}
        <div className="flex items-center gap-1 bg-slate-200/70 p-1 rounded-xl text-xs self-start sm:self-auto">
          <button
            onClick={() => setFilterTab('active')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              filterTab === 'active'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Aktivne ({activeBorrows.length})
          </button>
          <button
            onClick={() => setFilterTab('all')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              filterTab === 'all'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Vse ({borrows.length})
          </button>
          <button
            onClick={() => setFilterTab('shopping')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1 ${
              filterTab === 'shopping'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>Za nakup</span>
          </button>
        </div>
      </div>

      {/* Nakupovalni seznam zavihek */}
      {filterTab === 'shopping' ? (
        <div className="space-y-3">
          {/* Obrazec za hiter vnos artikla za nakup */}
          <form onSubmit={handleAddDirectShopping} className="flex gap-2 bg-white p-2.5 rounded-2xl border border-slate-200 shadow-2xs">
            <input
              type="text"
              required
              placeholder="Nov artikel za nakup (npr. 5x vrv 10m)..."
              value={newShoppingName}
              onChange={(e) => setNewShoppingName(e.target.value)}
              className="flex-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
            <button
              type="submit"
              className="px-3.5 py-2 bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Dodaj</span>
            </button>
          </form>

          {loadingShopping ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              Nalagam nakupovalni seznam...
            </div>
          ) : shoppingItems.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center">
              <ShoppingCart className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              <p className="text-xs text-slate-500">Nakupovalni seznam je prazen.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {shoppingItems.map(item => (
                <div
                  key={item._id}
                  className="bg-white rounded-2xl border border-slate-200/90 p-3.5 shadow-2xs flex items-center justify-between gap-3"
                >
                  <div>
                    <span className="text-sm font-bold text-slate-900 block leading-tight">
                      {item.name}
                    </span>
                    {item.person && (
                      <span className="text-[11px] text-slate-400 mt-0.5 block">
                        Predlagal: {item.person}
                      </span>
                    )}
                  </div>

                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    item.isPurchased ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'
                  }`}>
                    {item.isPurchased ? 'Kupljeno' : 'Potrebno kupiti'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Seznam izposoj */
        displayedBorrows.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center">
            <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 mb-2" />
            <h3 className="text-sm font-bold text-slate-800">
              {filterTab === 'active' ? 'Trenutno ni aktivnih izposoj' : 'Zgodovina je prazna'}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Vsa oprema je pospravljena v skladišču.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {displayedBorrows.map(record => {
              const isActive = record.status === 'active';

              return (
                <div
                  key={record.id}
                  className={`bg-white rounded-2xl border p-4 shadow-2xs flex flex-col justify-between transition-all ${
                    isActive 
                      ? 'border-slate-200/90' 
                      : 'border-slate-200 opacity-70 bg-slate-50/50'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          isActive
                            ? 'bg-amber-100 text-amber-900'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {isActive ? 'Izposojeno' : 'Vrnjeno'}
                      </span>

                      <span className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(record.borrowDate)}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <Package className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span>{record.quantity}x {record.articleName}</span>
                    </h3>

                    <div className="mt-2.5 space-y-1 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>Prevzel: <strong className="text-slate-800">{record.person}</strong></span>
                      </div>

                      {record.purpose && (
                        <div className="text-[11px] text-slate-500 pl-5">
                          Namen: {record.purpose}
                        </div>
                      )}

                      {record.returnDate && (
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>Vračilo: <span className="font-semibold text-slate-700">{formatDate(record.returnDate)}</span></span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Spodnji gumbi za akcijo */}
                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                    {/* Gumb za odrabljeno/uničeno */}
                    <button
                      onClick={() => setDamagedModalRecord(record)}
                      className="px-2.5 py-1.5 text-[11px] font-semibold text-rose-700 hover:text-rose-900 hover:bg-rose-50 rounded-xl transition-colors flex items-center gap-1"
                      title="Označi artikel kot odrabljen ali uničen"
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Odrabljeno / uničeno</span>
                    </button>

                    {isActive ? (
                      <button
                        onClick={() => returnBorrow(record.id)}
                        className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 active:scale-95 transition-all"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Vrni v skladišče</span>
                      </button>
                    ) : (
                      <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Vrnjeno</span>
                      </span>
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        )
      )}

      {/* Modal za vprašanje ob odrabljenem/uničenem artiklu */}
      {damagedModalRecord && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl max-w-md w-full overflow-hidden border border-slate-200 animate-in slide-in-from-bottom-4 duration-150 p-5 space-y-4">
            
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2 text-rose-700">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <h3 className="text-sm font-bold text-slate-900">
                  Odrabljeno ali uničeno
                </h3>
              </div>
              <button 
                onClick={() => setDamagedModalRecord(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Artikel <strong>{damagedModalRecord.quantity}x {damagedModalRecord.articleName}</strong> (prevzel: {damagedModalRecord.person}) bo označen kot odrabljen ali uničen in odstranjen iz evidence.
            </p>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900">
              Ali želite ta artikel samodejno dodati na <strong>nakupovalni seznam</strong> za nakup novega?
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={processingDamaged}
                onClick={() => setDamagedModalRecord(null)}
                className="px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl text-center"
              >
                Prekliči
              </button>
              <button
                type="button"
                disabled={processingDamaged}
                onClick={() => handleConfirmDamaged(false)}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl text-center"
              >
                Samo odstrani
              </button>
              <button
                type="button"
                disabled={processingDamaged}
                onClick={() => handleConfirmDamaged(true)}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs flex items-center justify-center gap-1.5 text-center"
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                <span>Dodaj na seznam za nakup</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
