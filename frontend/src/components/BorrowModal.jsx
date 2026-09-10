import React, { useState, useEffect } from 'react';
import { useBorrow } from '../context/BorrowContext';
import { AlertCircle, X, Check, Loader2 } from 'lucide-react';

export default function BorrowModal({ onBorrowSuccess }) {
  const { modalOpen, selectedArticle, closeBorrowModal, borrowArticle } = useBorrow();

  const [quantity, setQuantity] = useState(1);
  const [person, setPerson] = useState('');
  const [purpose, setPurpose] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (selectedArticle) {
      setQuantity(1);
      setPerson('');
      setPurpose('');
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      setReturnDate(nextWeek.toISOString().split('T')[0]);
      setError('');
    }
  }, [selectedArticle]);

  if (!modalOpen || !selectedArticle) return null;

  const maxQty = selectedArticle.quantity || 0;
  const isOutOfStock = maxQty <= 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!person.trim()) {
      setError('Vnesite ime osebe ali voda.');
      return;
    }
    if (quantity < 1 || quantity > maxQty) {
      setError(`Količina mora biti med 1 in ${maxQty}.`);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const updatedArticle = await borrowArticle({
        article: selectedArticle,
        quantity,
        person: person.trim(),
        purpose: purpose.trim() || 'Tabor / akcija',
        returnDate
      });
      if (onBorrowSuccess) {
        onBorrowSuccess(updatedArticle);
      }
    } catch (err) {
      setError(err.message || 'Napaka pri izposoji.');
    } finally {
      setLoading(false);
    }
  };

  const closetName = selectedArticle.shelf?.closet?.name || 'Omara';
  const shelfName = selectedArticle.shelf?.name || 'Polica';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl max-w-md w-full overflow-hidden border border-slate-200 animate-in slide-in-from-bottom-4 duration-150">
        
        {/* Minimalistična glava */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between">
          <div className="min-w-0 pr-2">
            <h3 className="text-sm font-bold text-white truncate">
              Izposoja: {selectedArticle.name}
            </h3>
            <p className="text-[11px] text-slate-400 truncate mt-0.5">
              {closetName} &rarr; {shelfName}
            </p>
          </div>
          <button
            onClick={closeBorrowModal}
            className="text-slate-400 hover:text-white p-1 rounded-lg shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Obrazec */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-3.5">
          {error && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {isOutOfStock ? (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 text-xs text-center">
              <p className="font-bold text-slate-800">Artikel ni na zalogi</p>
              <p className="mt-0.5 text-slate-500">Vsi kosi so trenutno že izposojeni.</p>
            </div>
          ) : (
            <>
              {/* Zaloga in količina */}
              <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                    Na voljo
                  </span>
                  <span className="text-lg font-black text-slate-900">
                    {maxQty} <span className="text-xs font-normal text-slate-500">kosov</span>
                  </span>
                </div>

                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    className="w-8 h-8 flex items-center justify-center bg-white border border-slate-300 rounded-l-lg hover:bg-slate-100 font-bold text-slate-700 text-sm active:scale-95"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="1"
                    max={maxQty}
                    value={quantity}
                    onChange={(e) => setQuantity(Math.min(maxQty, Math.max(1, parseInt(e.target.value) || 1)))}
                    className="w-12 h-8 text-center border-y border-slate-300 bg-white font-bold text-slate-800 text-sm focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setQuantity(q => Math.min(maxQty, q + 1))}
                    className="w-8 h-8 flex items-center justify-center bg-white border border-slate-300 rounded-r-lg hover:bg-slate-100 font-bold text-slate-700 text-sm active:scale-95"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Prevzemnik */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Kdo si izposoja? *
                </label>
                <input
                  type="text"
                  required
                  placeholder="npr. Luka Novak, Četa, Janez..."
                  value={person}
                  onChange={(e) => setPerson(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              {/* Namen */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Namen / Dogodek
                </label>
                <input
                  type="text"
                  placeholder="npr. Zimovanje Pohorje, Vodovo srečanje..."
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              {/* Datum vračila */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Predviden datum vračila
                </label>
                <input
                  type="date"
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>
            </>
          )}

          {/* Gumbi */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={closeBorrowModal}
              className="px-4 py-2.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Prekliči
            </button>
            {!isOutOfStock && (
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                <span>Potrdi izposojo</span>
              </button>
            )}
          </div>
        </form>

      </div>
    </div>
  );
}
