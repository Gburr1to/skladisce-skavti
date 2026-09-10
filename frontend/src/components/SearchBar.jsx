import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { useBorrow } from '../context/BorrowContext';
import { Search, X, Package, MapPin, HandHelping, Loader2 } from 'lucide-react';

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);
  const { openBorrowModal } = useBorrow();

  // Poslušalec za takojšnjo posodobitev artikla v rezultatih
  useEffect(() => {
    const handleArticleUpdate = (e) => {
      const updated = e.detail;
      if (updated && updated._id) {
        setResults(prev => prev.map(a => a._id === updated._id ? { ...a, quantity: updated.quantity } : a));
      }
    };
    window.addEventListener('skavt:article-updated', handleArticleUpdate);
    return () => window.removeEventListener('skavt:article-updated', handleArticleUpdate);
  }, []);

  // Zapri ob kliku izven
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Bližnjica na tipkovnici (Ctrl+K ali /)
  useEffect(() => {
    function handleKeyDown(e) {
      if ((e.ctrlKey && e.key === 'k') || (e.key === '/' && document.activeElement !== inputRef.current)) {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Iskanje z zamikom (debounce)
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const data = await api.searchArticles(query);
        setResults(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Napaka pri iskanju artiklov:', err);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  // Klik na artikel v iskalniku takoj odpre izposojo
  const handleSelectArticleForBorrow = (article) => {
    setIsOpen(false);
    openBorrowModal(article, (updatedArticle) => {
      setResults(prev => prev.map(a => a._id === updatedArticle._id ? { ...a, quantity: updatedArticle.quantity } : a));
    });
  };

  return (
    <div ref={wrapperRef} className="relative w-full max-w-xl">
      {/* Iskalno polje */}
      <div className="relative flex items-center">
        <Search className="absolute left-3 w-4 h-4 text-emerald-800/60 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          placeholder="Išči artikel za izposojo... (Ctrl+K)"
          className="w-full pl-9 pr-14 py-2 bg-emerald-950/20 border border-emerald-700/50 rounded-xl text-xs sm:text-sm text-emerald-950 placeholder-emerald-900/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all shadow-inner"
        />

        <div className="absolute right-2 flex items-center gap-1">
          {loading && <Loader2 className="w-3.5 h-3.5 text-emerald-600 animate-spin" />}
          {query && (
            <button
              onClick={() => {
                setQuery('');
                setResults([]);
                inputRef.current?.focus();
              }}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-md"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Rezultati iskanja - Dropdown */}
      {isOpen && query.trim().length > 0 && (
        <div className="absolute left-0 right-0 mt-1.5 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden z-50 animate-in fade-in duration-150 max-h-[75vh] flex flex-col">
          <div className="px-3.5 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span className="font-bold text-slate-700">Rezultati iskanja ({results.length})</span>
            <span>Klikni za izposojo</span>
          </div>

          <div className="overflow-y-auto divide-y divide-slate-100 max-h-80">
            {loading ? (
              <div className="p-6 text-center text-slate-400 flex flex-col items-center gap-1.5">
                <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
                <span className="text-xs">Iščem...</span>
              </div>
            ) : results.length === 0 ? (
              <div className="p-6 text-center text-slate-500">
                <p className="text-xs font-medium">Ni najdenih artiklov za &quot;{query}&quot;</p>
              </div>
            ) : (
              results.map((article) => {
                const shelfName = article.shelf?.name || 'Polica';
                const closetName = article.shelf?.closet?.name || 'Omara';
                const qty = article.quantity || 0;
                const inStock = qty > 0;

                return (
                  <div
                    key={article._id}
                    onClick={() => handleSelectArticleForBorrow(article)}
                    className="p-3 hover:bg-emerald-50/60 active:bg-emerald-100/50 cursor-pointer transition-colors flex items-center justify-between gap-2.5"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                        <Package className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                            {article.name}
                          </h4>
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full shrink-0 ${
                              inStock
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-700'
                            }`}
                          >
                            {inStock ? `${qty} na zalogi` : 'Ni zaloge'}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
                          <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
                          <span className="truncate text-slate-600">{closetName}</span>
                          <span>&rarr;</span>
                          <span className="truncate text-emerald-700 font-medium">{shelfName}</span>
                        </div>
                      </div>
                    </div>

                    {/* Značka za izposojo */}
                    <div className="shrink-0">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                        inStock
                          ? 'bg-emerald-700 text-white'
                          : 'bg-slate-100 text-slate-400'
                      }`}>
                        <HandHelping className="w-3.5 h-3.5" />
                        <span>{inStock ? 'Izposodi' : 'Ni zaloge'}</span>
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
