import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useBorrow } from '../context/BorrowContext';
import { 
  Package, 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Edit3, 
  QrCode, 
  HandHelping, 
  Loader2,
  X,
  Download
} from 'lucide-react';

export default function ShelfPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { openBorrowModal, showToast } = useBorrow();

  const [shelf, setShelf] = useState(null);
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Dodajanje artikla
  const [articleModalOpen, setArticleModalOpen] = useState(false);
  const [artName, setArtName] = useState('');
  const [artDescription, setArtDescription] = useState('');
  const [artQuantity, setArtQuantity] = useState(1);
  const [savingArt, setSavingArt] = useState(false);

  // QR Koda modal
  const [qrModalArticle, setQrModalArticle] = useState(null);

  // Urejanje artikla
  const [editingArticle, setEditingArticle] = useState(null);

  const loadShelfAndArticles = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const [shelfData, articlesData] = await Promise.all([
        api.getShelf(id),
        api.getShelfArticles(id)
      ]);
      setShelf(shelfData);
      setArticles(Array.isArray(articlesData) ? articlesData : []);
    } catch (err) {
      console.error('Napaka pri nalaganju police:', err);
      setError(err.message || 'Polica ni bila najdena.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadShelfAndArticles();
  }, [loadShelfAndArticles]);

  // Poslušalec za takojšnjo osvežitev artikla ob izposoji ali vračilu
  useEffect(() => {
    const handleArticleUpdate = (e) => {
      const updated = e.detail;
      if (updated && updated._id) {
        setArticles(prev => prev.map(a => a._id === updated._id ? { ...a, quantity: updated.quantity } : a));
      }
    };
    window.addEventListener('skavt:article-updated', handleArticleUpdate);
    return () => window.removeEventListener('skavt:article-updated', handleArticleUpdate);
  }, []);

  const handleOpenBorrow = (article) => {
    // Odpremo modal in posredujemo callback za takojšnjo osvežitev elementa
    openBorrowModal(article, (updatedArticle) => {
      setArticles(prev => prev.map(a => a._id === updatedArticle._id ? { ...a, quantity: updatedArticle.quantity } : a));
    });
  };

  const handleAddArticle = async (e) => {
    e.preventDefault();
    if (!artName.trim()) return;

    setSavingArt(true);
    try {
      await api.createArticle({
        name: artName.trim(),
        description: artDescription.trim(),
        quantity: Number(artQuantity) || 1,
        shelf: id
      });
      setArtName('');
      setArtDescription('');
      setArtQuantity(1);
      setArticleModalOpen(false);
      await loadShelfAndArticles();
      showToast('Artikel dodan na polico.');
    } catch (err) {
      alert('Napaka pri dodajanju artikla: ' + err.message);
    } finally {
      setSavingArt(false);
    }
  };

  const handleUpdateArticle = async (e) => {
    e.preventDefault();
    if (!editingArticle) return;

    try {
      const updated = await api.updateArticle(editingArticle._id, {
        name: editingArticle.name,
        description: editingArticle.description,
        quantity: Number(editingArticle.quantity) || 0,
        shelf: id
      });
      setArticles(prev => prev.map(a => a._id === updated._id ? { ...a, ...updated } : a));
      setEditingArticle(null);
      showToast('Artikel posodobljen.');
    } catch (err) {
      alert('Napaka pri posodobitvi: ' + err.message);
    }
  };

  const handleAdjustQuantity = async (article, delta) => {
    const newQty = Math.max(0, (article.quantity || 0) + delta);
    // Takojšnja lokalna posodobitev (optimistično)
    setArticles(prev => prev.map(a => a._id === article._id ? { ...a, quantity: newQty } : a));

    try {
      await api.updateArticle(article._id, {
        name: article.name,
        description: article.description,
        quantity: newQty,
        shelf: id
      });
    } catch (err) {
      // Če spodleti, ponovno naložimo pravo stanje
      loadShelfAndArticles();
      showToast('Napaka pri posodobitvi zaloge: ' + err.message, 'error');
    }
  };

  const handleDeleteArticle = async (articleId, name) => {
    if (!window.confirm(`Ali res želite izbrisati "${name}"?`)) return;

    try {
      await api.deleteArticle(articleId);
      setArticles(prev => prev.filter(a => a._id !== articleId));
      showToast(`Artikel "${name}" izbrisan.`);
    } catch (err) {
      alert('Napaka pri brisanju artikla: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="py-16 flex flex-col items-center justify-center gap-3 text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        <p className="text-xs font-medium">Nalagam artikle...</p>
      </div>
    );
  }

  if (error || !shelf) {
    return (
      <div className="p-6 text-center bg-white rounded-2xl border border-slate-200 max-w-md mx-auto">
        <h2 className="text-base font-bold text-slate-800 mb-1">Polica ni bila najdena</h2>
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

  const closetId = shelf.closet?._id || shelf.closet;
  const closetName = shelf.closet?.name || 'Omara';

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      
      {/* Navigacija nazaj na omaro */}
      <button
        onClick={() => navigate(closetId ? `/omara/${closetId}` : '/')}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-emerald-800 transition-colors py-1"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Nazaj na {closetName}</span>
      </button>

      {/* Glava police */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-2xs">
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
              {closetName} &bull; Polica
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-tight mt-0.5">
              {shelf.name}
            </h1>
            {shelf.description && (
              <p className="text-xs text-slate-500 mt-1">
                {shelf.description}
              </p>
            )}
          </div>

          <button
            onClick={() => setArticleModalOpen(true)}
            className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shrink-0 shadow-2xs"
          >
            <Plus className="w-4 h-4" />
            <span>Nov artikel</span>
          </button>
        </div>
      </div>

      {/* Seznam artiklov */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Artikli na polici ({articles.length})
          </h2>
          <span className="text-[11px] text-slate-400">
            Zaloga se samodejno posodobi ob izposoji
          </span>
        </div>

        {articles.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center">
            <Package className="w-8 h-8 mx-auto text-slate-300 mb-2" />
            <p className="text-xs text-slate-500 mb-3">Na tej polici še ni artiklov.</p>
            <button
              onClick={() => setArticleModalOpen(true)}
              className="px-4 py-2 bg-emerald-700 text-white text-xs font-bold rounded-xl"
            >
              + Dodaj artikel
            </button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {articles.map((article) => {
              const qty = article.quantity || 0;
              const inStock = qty > 0;

              return (
                <div
                  key={article._id}
                  className={`bg-white rounded-2xl border p-4 shadow-2xs transition-all ${
                    inStock ? 'border-slate-200/90' : 'border-slate-200 bg-slate-50/50'
                  }`}
                >
                  {/* Zgornja vrstica: Ime in orodja */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="text-base font-bold text-slate-900 leading-snug">
                        {article.name}
                      </h3>
                      {article.description && (
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                          {article.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {article.qrImage && (
                        <button
                          onClick={() => setQrModalArticle(article)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
                          title="QR Koda"
                        >
                          <QrCode className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => setEditingArticle(article)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
                        title="Uredi"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteArticle(article._id, article.name)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                        title="Izbriši"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Spodnja vrstica: Zaloga in gumb za izposojo */}
                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
                    {/* Zaloga in hitro spreminjanje */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500">Zaloga:</span>
                      <div className="flex items-center bg-slate-100 rounded-lg p-0.5">
                        <button
                          onClick={() => handleAdjustQuantity(article, -1)}
                          disabled={qty <= 0}
                          className="w-7 h-7 flex items-center justify-center bg-white hover:bg-slate-200 active:scale-95 disabled:opacity-30 rounded text-slate-700 font-bold text-xs shadow-2xs"
                        >
                          -
                        </button>
                        <span className={`w-9 text-center font-black text-xs ${inStock ? 'text-slate-900' : 'text-rose-600'}`}>
                          {qty}
                        </span>
                        <button
                          onClick={() => handleAdjustQuantity(article, 1)}
                          className="w-7 h-7 flex items-center justify-center bg-white hover:bg-slate-200 active:scale-95 rounded text-slate-700 font-bold text-xs shadow-2xs"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Glavni gumb za izposojo - takoj onemogočen, če zaloga pade na 0 */}
                    <button
                      onClick={() => handleOpenBorrow(article)}
                      disabled={!inStock}
                      className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs active:scale-95 ${
                        inStock
                          ? 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-emerald-800/15'
                          : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                      }`}
                    >
                      <HandHelping className="w-3.5 h-3.5" />
                      <span>{inStock ? 'Izposodi si' : 'Ni na zalogi'}</span>
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal za dodajanje artikla */}
      {articleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl max-w-md w-full overflow-hidden border border-slate-200 animate-in slide-in-from-bottom-4 duration-150">
            <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
              <h3 className="text-sm font-bold">Nov artikel na polici: {shelf.name}</h3>
              <button onClick={() => setArticleModalOpen(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddArticle} className="p-5 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Naziv artikla *
                </label>
                <input
                  type="text"
                  required
                  placeholder="npr. Sekira Fiskars X10"
                  value={artName}
                  onChange={(e) => setArtName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Opis artikla
                </label>
                <input
                  type="text"
                  placeholder="Opis, stanje ali namen..."
                  value={artDescription}
                  onChange={(e) => setArtDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Začetna količina
                </label>
                <input
                  type="number"
                  min="0"
                  value={artQuantity}
                  onChange={(e) => setArtQuantity(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setArticleModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Prekliči
                </button>
                <button
                  type="submit"
                  disabled={savingArt}
                  className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl disabled:opacity-60"
                >
                  {savingArt ? 'Dodajam...' : 'Dodaj artikel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal za urejanje artikla */}
      {editingArticle && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl max-w-md w-full overflow-hidden border border-slate-200 animate-in slide-in-from-bottom-4 duration-150">
            <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
              <h3 className="text-sm font-bold">Uredi artikel</h3>
              <button onClick={() => setEditingArticle(null)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateArticle} className="p-5 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Naziv artikla
                </label>
                <input
                  type="text"
                  required
                  value={editingArticle.name}
                  onChange={(e) => setEditingArticle({ ...editingArticle, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Opis
                </label>
                <input
                  type="text"
                  value={editingArticle.description}
                  onChange={(e) => setEditingArticle({ ...editingArticle, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Količina
                </label>
                <input
                  type="number"
                  min="0"
                  value={editingArticle.quantity}
                  onChange={(e) => setEditingArticle({ ...editingArticle, quantity: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingArticle(null)}
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

      {/* Modal za QR kodo */}
      {qrModalArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl max-w-xs w-full overflow-hidden border border-slate-200 p-5 text-center">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
                QR koda
              </span>
              <button onClick={() => setQrModalArticle(null)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <h3 className="text-sm font-bold text-slate-900 mb-3 truncate">{qrModalArticle.name}</h3>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 inline-block mb-3">
              <img 
                src={qrModalArticle.qrImage} 
                alt={qrModalArticle.name} 
                className="w-40 h-40 mx-auto"
              />
            </div>

            <p className="font-mono text-[11px] font-bold text-slate-700 mb-3 bg-slate-100 py-1 px-2 rounded-lg">
              {qrModalArticle.qr}
            </p>

            <a
              href={qrModalArticle.qrImage}
              download={`${qrModalArticle.name}-QR.png`}
              className="w-full py-2 bg-slate-900 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Prenesi sliko</span>
            </a>
          </div>
        </div>
      )}

    </div>
  );
}
