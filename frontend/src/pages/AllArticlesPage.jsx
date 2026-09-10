import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { useBorrow } from '../context/BorrowContext';
import { 
  Package, 
  Search, 
  MapPin, 
  HandHelping, 
  Loader2
} from 'lucide-react';

export default function AllArticlesPage() {
  const { openBorrowModal } = useBorrow();

  const [articles, setArticles] = useState([]);
  const [closets, setClosets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterQuery, setFilterQuery] = useState('');
  const [selectedCloset, setSelectedCloset] = useState('all');
  const [onlyInStock, setOnlyInStock] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [artData, closetData] = await Promise.all([
        api.getArticles(),
        api.getClosets()
      ]);
      setArticles(Array.isArray(artData) ? artData : []);
      setClosets(Array.isArray(closetData) ? closetData : []);
    } catch (err) {
      console.error('Napaka pri nalaganju artiklov:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Takojšnja osvežitev elementa ob izposoji
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
    openBorrowModal(article, (updatedArticle) => {
      setArticles(prev => prev.map(a => a._id === updatedArticle._id ? { ...a, quantity: updatedArticle.quantity } : a));
    });
  };

  const filteredArticles = articles.filter(article => {
    const matchesQuery = 
      article.name?.toLowerCase().includes(filterQuery.toLowerCase()) ||
      article.description?.toLowerCase().includes(filterQuery.toLowerCase());

    const closetId = article.shelf?.closet?._id || article.shelf?.closet;
    const matchesCloset = selectedCloset === 'all' || String(closetId) === String(selectedCloset);
    const matchesStock = !onlyInStock || (article.quantity || 0) > 0;

    return matchesQuery && matchesCloset && matchesStock;
  });

  if (loading) {
    return (
      <div className="py-16 flex flex-col items-center justify-center gap-3 text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        <p className="text-xs font-medium">Nalagam artikle...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      
      {/* Glava */}
      <div className="flex items-center justify-between gap-3 pt-1">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Vsi artikli
          </h1>
          <p className="text-xs text-slate-500">
            Skupaj {articles.length} artiklov v skladišču
          </p>
        </div>

        <span className="text-xs font-bold px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-100">
          Zadetki: {filteredArticles.length}
        </span>
      </div>

      {/* Iskanje in filtri */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2.5">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Išči po nazivu ali opisu..."
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <select
            value={selectedCloset}
            onChange={(e) => setSelectedCloset(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg font-medium"
          >
            <option value="all">Vse omare</option>
            {closets.map(c => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </select>

          <label className="flex items-center gap-1.5 cursor-pointer text-slate-600">
            <input
              type="checkbox"
              checked={onlyInStock}
              onChange={(e) => setOnlyInStock(e.target.checked)}
              className="rounded text-emerald-600 focus:ring-0"
            />
            <span>Samo na zalogi</span>
          </label>
        </div>
      </div>

      {/* Seznam artiklov */}
      {filteredArticles.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center">
          <Package className="w-8 h-8 mx-auto text-slate-300 mb-2" />
          <p className="text-xs text-slate-500">Ni artiklov, ki bi ustrezali iskanju.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredArticles.map(article => {
            const shelfId = article.shelf?._id || article.shelf;
            const shelfName = article.shelf?.name || 'Polica';
            const closetName = article.shelf?.closet?.name || 'Omara';
            const qty = article.quantity || 0;
            const inStock = qty > 0;

            return (
              <div
                key={article._id}
                className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center shrink-0">
                    <Package className="w-4 h-4 text-emerald-700" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 truncate leading-tight text-sm">
                        {article.name}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full shrink-0 ${
                          inStock
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-700'
                        }`}
                      >
                        {inStock ? `${qty} kos` : 'Ni zaloge'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                      <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
                      <span className="truncate">{closetName}</span>
                      <span>&rarr;</span>
                      <Link 
                        to={shelfId ? `/polica/${shelfId}` : '#'} 
                        className="text-emerald-700 hover:underline font-medium truncate"
                      >
                        {shelfName}
                      </Link>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleOpenBorrow(article)}
                  disabled={!inStock}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 flex items-center gap-1.5 transition-all ${
                    inStock
                      ? 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs active:scale-95'
                      : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                  }`}
                >
                  <HandHelping className="w-3.5 h-3.5" />
                  <span>{inStock ? 'Izposodi si' : 'Ni zaloge'}</span>
                </button>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
