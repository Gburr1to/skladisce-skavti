import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { api } from '../services/api';

const BorrowContext = createContext(null);

export function BorrowProvider({ children }) {
  const [borrows, setBorrows] = useState(() => {
    try {
      const saved = localStorage.getItem('skavt_borrows');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [lastUpdatedArticle, setLastUpdatedArticle] = useState(null);
  const callbackRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('skavt_borrows', JSON.stringify(borrows));
  }, [borrows]);

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
    if (qtyToBorrow > article.quantity) throw new Error(`Na voljo je le ${article.quantity} kosov.`);

    const newStock = article.quantity - qtyToBorrow;

    // Posodobimo zalogo v bazi
    const updated = await api.updateArticle(article._id, {
      name: article.name,
      description: article.description,
      shelf: article.shelf?._id || article.shelf,
      quantity: newStock
    });

    const finalArticle = {
      ...article,
      ...updated,
      quantity: newStock
    };

    // Zabeležimo izposojo
    const newBorrowRecord = {
      id: 'BORROW-' + Date.now(),
      articleId: article._id,
      articleName: article.name,
      quantity: qtyToBorrow,
      person: person || 'Neznano',
      purpose: purpose || 'Tabor / akcija',
      borrowDate: new Date().toISOString(),
      returnDate: returnDate || '',
      status: 'active'
    };

    setBorrows(prev => [newBorrowRecord, ...prev]);
    setLastUpdatedArticle(finalArticle);

    // Kličemo callback, če obstaja
    if (callbackRef.current) {
      callbackRef.current(finalArticle);
    }

    // Sprožimo še globalni dogodek, da se posodobijo vsi seznami v aplikaciji
    window.dispatchEvent(new CustomEvent('skavt:article-updated', { detail: finalArticle }));

    showToast(`Izposojeno: ${qtyToBorrow}x ${article.name} (${person || 'skavti'}).`);
    closeBorrowModal();
    return finalArticle;
  };

  const returnBorrow = async (borrowId) => {
    const record = borrows.find(b => b.id === borrowId);
    if (!record) return;

    try {
      try {
        const art = await api.getArticle(record.articleId);
        if (art) {
          const newQty = (art.quantity || 0) + record.quantity;
          await api.updateArticle(art._id, {
            name: art.name,
            description: art.description,
            shelf: art.shelf?._id || art.shelf,
            quantity: newQty
          });
          setLastUpdatedArticle({ ...art, quantity: newQty });
          window.dispatchEvent(new CustomEvent('skavt:article-updated', { detail: { ...art, quantity: newQty } }));
        }
      } catch (fetchErr) {
        console.warn('Artikel morda ne obstaja več:', fetchErr.message);
      }

      setBorrows(prev => prev.map(b => b.id === borrowId ? { ...b, status: 'returned', returnedAt: new Date().toISOString() } : b));
      showToast(`Artikel "${record.articleName}" vrnjen v skladišče.`);
    } catch (err) {
      showToast('Napaka pri vračilu: ' + err.message, 'error');
    }
  };

  const deleteBorrowRecord = (borrowId) => {
    setBorrows(prev => prev.filter(b => b.id !== borrowId));
  };

  return (
    <BorrowContext.Provider
      value={{
        borrows,
        activeBorrows: borrows.filter(b => b.status === 'active'),
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
