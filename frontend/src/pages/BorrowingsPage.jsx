import React, { useState, useEffect } from 'react';
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
  Loader2
} from 'lucide-react';

export default function BorrowingsPage() {
  const { 
    activeBorrows, 
    returnBorrow, 
    deleteBorrowRecord, 
    showToast,
    loadingBorrows,
    loadBorrows
  } = useBorrow();

  // Modal za "Odrabljeno / uničeno"
  const [damagedModalRecord, setDamagedModalRecord] = useState(null);
  const [processingDamaged, setProcessingDamaged] = useState(false);

  useEffect(() => {
    if (loadBorrows) {
      loadBorrows();
    }
  }, [loadBorrows]);

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

      // Odstranimo izposojo, saj je artikel uničen/odrabljen in ga ni več v skladišču
      const recId = damagedModalRecord._id || damagedModalRecord.id;
      await deleteBorrowRecord(recId);
      setDamagedModalRecord(null);
    } catch (err) {
      showToast('Napaka: ' + err.message, 'error');
    } finally {
      setProcessingDamaged(false);
    }
  };

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      
      {/* Glava */}
      <div className="flex items-center justify-between gap-3 pt-1">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Izposoje
          </h1>
         
        </div>

        <span className="text-xs font-bold px-2.5 py-1 bg-amber-50 text-amber-900 rounded-lg border border-amber-200">
          Aktivne: {activeBorrows.length}
        </span>
      </div>

      {/* Seznam trenutnih izposoj */}
      {loadingBorrows ? (
        <div className="py-16 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
          <Loader2 className="w-7 h-7 animate-spin text-emerald-600" />
          <span>Nalagam izposoje...</span>
        </div>
      ) : activeBorrows.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-10 text-center">
          <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500 mb-2" />
          <h3 className="text-sm font-bold text-slate-800">
            Trenutno ni aktivnih izposoj
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Vsa oprema je pospravljena v skladišču.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {activeBorrows.map(record => {
            const recordId = record._id || record.id;
            const articleTitle = record.articleName || record.article?.name || 'Artikel';

            return (
              <div
                key={recordId}
                className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs flex flex-col justify-between transition-all"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-900">
                      Izposojeno
                    </span>

                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDate(record.borrowDate)}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Package className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span>{record.quantity}x {articleTitle}</span>
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
                  <button
                    onClick={() => setDamagedModalRecord(record)}
                    className="px-2.5 py-1.5 text-[11px] font-semibold text-rose-700 hover:text-rose-900 hover:bg-rose-50 rounded-xl transition-colors flex items-center gap-1"
                    title="Označi artikel kot odrabljen ali uničen"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Odrabljeno / uničeno</span>
                  </button>

                  <button
                    onClick={() => returnBorrow(recordId)}
                    className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 active:scale-95 transition-all"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Vrni v skladišče</span>
                  </button>
                </div>

              </div>
            );
          })}
        </div>
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
              Artikel <strong>{damagedModalRecord.quantity}x {damagedModalRecord.articleName}</strong> (prevzel: {damagedModalRecord.person}) bo označen kot odrabljen ali uničen in odstranjen iz evidence izposoj.
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
