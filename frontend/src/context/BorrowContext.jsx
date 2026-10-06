import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../services/api';

const BorrowContext = createContext(null);

const normalizeBorrow = (b) => {
  if (!b) return b;
  return {
    ...b,
    id: b._id || b.id,
    articleName: b.articleName || b.article?.name || 'Artikel'
  };
};

export function BorrowProvider({ children }) {
  const [borrows, setBorrows] = useState([]);
  const [loadingBorrows, setLoadingBorrows] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [lastUpdatedArticle, setLastUpdatedArticle] = useState(null);
  const callbackRef = useRef(null);

  // Naložimo izposoje neposredno iz baze (MongoDB), brez localStorage
  const loadBorrows = useCallback(async () => {
    try {
      setLoadingBorrows(true);
      const data = await api.getBorrows();
      if (Array.isArray(data)) {
        setBorrows(data.map(normalizeBorrow));
      } else {
        setBorrows([]);
      }
    } catch (err) {
      console.error('Napaka pri nalaganju izposoj iz baze:', err);
    } finally {
      setLoadingBorrows(false);
    }
  }, []);

  useEffect(() => {
    loadBorrows();
  }, [loadBorrows]);

  const showToast = (message, type = 'success') => {
    setToastMessage({ message, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const openBorrowModal = (article, onBorrowed = null) => {
    setSelectedArticle(article);
    callbackRef.current = onBorrowed;
    setModalOpen(true);
  };

  const closeBorrowModal = () => {
    setSelectedArticle(null);
    callbackRef.current = null;
    setModalOpen(false);
  };

  const borrowArticle = async ({ article, quantity, person, purpose, returnDate }) => {
    const qtyToBorrow = Number(quantity) || 1;
    if (qtyToBorrow <= 0) throw new Error('Količina mora biti večja od 0.');
    if (qtyToBorrow > (article.quantity || 0)) {
      throw new Error(`Na voljo je le ${article.quantity} kosov.`);
    }

    // Ustvarimo izposojo v bazi preko API (ta avtomatsko posodobi tudi zalogo na artiklu)
    const res = await api.createBorrow({
      articleId: article._id,
      quantity: qtyToBorrow,
      person: person || 'Neznano',
      purpose: purpose || 'Tabor / akcija',
      returnDate: returnDate || null
    });

    const normalizedBorrow = normalizeBorrow(res);
    setBorrows(prev => [normalizedBorrow, ...prev]);

    const finalArticle = res.updatedArticle || {
      ...article,
      quantity: (article.quantity || 0) - qtyToBorrow
    };

    setLastUpdatedArticle(finalArticle);

    // Kličemo callback, če obstaja
    if (callbackRef.current) {
      callbackRef.current(finalArticle);
    }

    // Sprožimo globalni dogodek, da se posodobijo vsi seznami v aplikaciji
    window.dispatchEvent(new CustomEvent('skavt:article-updated', { detail: finalArticle }));

    showToast(`Izposojeno: ${qtyToBorrow}x ${article.name} (${person || 'skavti'}).`);
    closeBorrowModal();
    return finalArticle;
  };

  const returnBorrow = async (borrowId) => {
    try {
      const res = await api.returnBorrow(borrowId);
      const normalizedUpdated = normalizeBorrow(res);

      setBorrows(prev => prev.map(b => (b._id === borrowId || b.id === borrowId) ? normalizedUpdated : b));

      if (res.updatedArticle) {
        setLastUpdatedArticle(res.updatedArticle);
        window.dispatchEvent(new CustomEvent('skavt:article-updated', { detail: res.updatedArticle }));
      }

      showToast(`Artikel "${normalizedUpdated.articleName}" vrnjen v skladišče.`);
      return normalizedUpdated;
    } catch (err) {
      showToast('Napaka pri vračilu: ' + err.message, 'error');
      throw err;
    }
  };

  const deleteBorrowRecord = async (borrowId) => {
    try {
      await api.deleteBorrow(borrowId);
      setBorrows(prev => prev.filter(b => b._id !== borrowId && b.id !== borrowId));
    } catch (err) {
      console.error('Napaka pri brisanju izposoje:', err);
      showToast('Napaka pri brisanju izposoje: ' + err.message, 'error');
    }
  };

  return (
    <BorrowContext.Provider
      value={{
        borrows,
        activeBorrows: borrows.filter(b => b.status === 'active'),
        loadingBorrows,
        loadBorrows,
        openBorrowModal,
        closeBorrowModal,
        borrowArticle,
        returnBorrow,
        deleteBorrowRecord,
        modalOpen,
        selectedArticle,
        toastMessage,
        lastUpdatedArticle,
        showToast
      }}
    >
      {children}
    </BorrowContext.Provider>
  );
}

export function useBorrow() {
  return useContext(BorrowContext);
}
