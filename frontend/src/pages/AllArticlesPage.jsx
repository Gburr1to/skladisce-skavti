import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { api } from '../services/api';
import { useBorrow } from '../context/BorrowContext';
import { ARTICLE_CATEGORIES, SKAVT_BRANCHES, getBranchColor } from '../constants/skavtData';
import { 
  Package, 
  Search, 
  MapPin, 
  HandHelping, 
  Loader2,
  Download,
  Upload,
  Plus,
  FileSpreadsheet,
  Sparkles,
  Copy,
  Check,
  X,
  Tag,
  Users,
  AlertCircle,
  AlertTriangle,
  Layers
} from 'lucide-react';

export default function AllArticlesPage() {
  const { openBorrowModal, showToast } = useBorrow();

  const [articles, setArticles] = useState([]);
  const [closets, setClosets] = useState([]);
  const [shelves, setShelves] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filtri
  const [filterQuery, setFilterQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Vse');
  const [selectedBranch, setSelectedBranch] = useState('Vse veje');
  const [selectedCloset, setSelectedCloset] = useState('all');
  const [onlyInStock, setOnlyInStock] = useState(false);

  // Modal za dodajanje artikla
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newArtName, setNewArtName] = useState('');
  const [newArtQuantity, setNewArtQuantity] = useState(1);
  const [newArtCategory, setNewArtCategory] = useState('Razno');
  const [newArtBranch, setNewArtBranch] = useState('Vse veje');
  const [selectedClosetId, setSelectedClosetId] = useState('');
  const [newArtShelfId, setNewArtShelfId] = useState('');
  const [newArtDescription, setNewArtDescription] = useState('');
  const [creatingArt, setCreatingArt] = useState(false);

  // Izbira police v omari (novo okno po izbiri omare)
  const [shelfPickerOpen, setShelfPickerOpen] = useState(false);
  const [newShelfQuickName, setNewShelfQuickName] = useState('');
  const [creatingQuickShelf, setCreatingQuickShelf] = useState(false);

  // Modal za uvoz iz Excela / CSV z zaščitnim mehanizmom
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importPreviewItems, setImportPreviewItems] = useState([]);
  const [importFileError, setImportFileError] = useState('');
  const [importErrors, setImportErrors] = useState([]);
  const [importWarnings, setImportWarnings] = useState([]);
  const [importTotalCount, setImportTotalCount] = useState(0);
  const [importing, setImporting] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [artData, closetData, shelfData] = await Promise.all([
        api.getArticles(),
        api.getClosets(),
        api.getShelves()
      ]);
      setArticles(Array.isArray(artData) ? artData : []);
      setClosets(Array.isArray(closetData) ? closetData : []);
      setShelves(Array.isArray(shelfData) ? shelfData : []);
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

  const handleSelectCloset = (closetId) => {
    setSelectedClosetId(closetId);
    setNewArtShelfId('');
    if (closetId) {
      setShelfPickerOpen(true);
    }
  };

  const handleQuickCreateShelf = async (e) => {
    e.preventDefault();
    if (!newShelfQuickName.trim() || !selectedClosetId) return;

    try {
      setCreatingQuickShelf(true);
      const created = await api.createShelf({
        name: newShelfQuickName.trim(),
        closet: selectedClosetId
      });
      setShelves(prev => [...prev, created]);
      setNewArtShelfId(created._id);
      setNewShelfQuickName('');
      setShelfPickerOpen(false);
      showToast(`Polica "${created.name}" ustvarjena in izbrana.`);
    } catch (err) {
      showToast('Napaka pri ustvarjanju police: ' + err.message, 'error');
    } finally {
      setCreatingQuickShelf(false);
    }
  };

  const handleCreateArticle = async (e) => {
    e.preventDefault();
    if (!newArtName.trim()) return;

    try {
      setCreatingArt(true);
      const created = await api.createArticle({
        name: newArtName.trim(),
        quantity: Number(newArtQuantity) || 1,
        category: newArtCategory,
        branch: newArtBranch,
        shelf: newArtShelfId || null,
        description: newArtDescription.trim()
      });

      setArticles(prev => [created, ...prev]);
      setNewArtName('');
      setNewArtQuantity(1);
      setNewArtCategory('Razno');
      setNewArtBranch('Vse veje');
      setSelectedClosetId('');
      setNewArtShelfId('');
      setNewArtDescription('');
      setAddModalOpen(false);
      setShelfPickerOpen(false);
      showToast(`Artikel "${created.name}" uspešno dodan.`);
    } catch (err) {
      alert('Napaka pri ustvarjanju artikla: ' + err.message);
    } finally {
      setCreatingArt(false);
    }
  };

  // Izvoz filtriranih artiklov v Excel
  const handleExportExcel = () => {
    try {
      const exportData = filteredArticles.map(a => ({
        'Naziv': a.name || '',
        'Količina': a.quantity ?? 1,
        'Kategorija': a.category || 'Razno',
        'Veja': a.branch || 'Vse veje',
        'Skladišče': a.shelf?.closet?.warehouse?.name || 'Glavno skladišče',
        'Omara': a.shelf?.closet?.name || '',
        'Polica': a.shelf?.name || '',
        'Opis': a.description || '',
        'QR koda': a.qr || ''
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Artikli');
      XLSX.writeFile(workbook, `skavti_artikli_${new Date().toISOString().slice(0, 10)}.xlsx`);
      showToast('Excel datoteka uspešno izvožena.');
    } catch (err) {
      alert('Napaka pri izvozu v Excel: ' + err.message);
    }
  };

  // Prenos vzorčne predloge za Excel uvoz
  const handleDownloadSampleTemplate = () => {
    try {
      const sampleData = [
        {
          'Naziv': 'Šotorsko krilo',
          'Količina': 10,
          'Kategorija': 'Šotori & tabor',
          'Veja': 'Izvidniki (IV)',
          'Omara': 'Regal A',
          'Polica': 'Polica 1',
          'Opis': 'Zeleno nepremočljivo platno'
        },
        {
          'Naziv': 'Sisal vrvica (50m)',
          'Količina': 5,
          'Kategorija': 'Pionirstvo',
          'Veja': 'Vse veje',
          'Omara': 'Regal A',
          'Polica': 'Polica 2',
          'Opis': 'Vrvica za pionirske objekte'
        },
        {
          'Naziv': 'Vodenke in čopiči',
          'Količina': 20,
          'Kategorija': 'Ustvarjanje',
          'Veja': 'Bobri (BB)',
          'Omara': 'Omara materiali',
          'Polica': 'Barve',
          'Opis': 'Komplet za risanje'
        }
      ];

      const worksheet = XLSX.utils.json_to_sheet(sampleData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Vzorec');
      XLSX.writeFile(workbook, 'vzorec_uvoza_artiklov.xlsx');
    } catch (err) {
      alert('Napaka pri prenosu vzorca: ' + err.message);
    }
  };

  // Branje naložene Excel / CSV datoteke z zaščitnim mehanizmom in zaznavanjem napak
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFileError('');
    setImportErrors([]);
    setImportWarnings([]);
    setImportPreviewItems([]);
    setImportTotalCount(0);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
          setImportFileError('Datoteka ne vsebuje delovnih listov.');
          return;
        }

        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (!json || json.length === 0) {
          setImportFileError('Datoteka je prazna ali ne vsebuje podatkovnih vrstic.');
          return;
        }

        // Preverjanje obveznega stolpca v glavi (ime/naziv artikla)
        const firstRowKeys = Object.keys(json[0]);
        const nameKey = firstRowKeys.find(k => {
          const lower = k.toLowerCase().trim();
          return lower === 'naziv' || lower === 'ime' || lower === 'artikel' || lower === 'name' || lower === 'izdelek';
        });

        if (!nameKey) {
          setImportFileError(
            `Kritična napaka v glavi tabele: Manjka stolpec z nazivom artikla ('Naziv' ali 'Ime'). Najdeni stolpci v datoteki: [${firstRowKeys.join(', ')}]. Prosimo preimenujte ustrezen stolpec ali prenesite vzorčni Excel.`
          );
          return;
        }

        const rowErrors = [];
        const rowWarnings = [];
        const validRows = [];

        json.forEach((row, idx) => {
          const rowNumber = idx + 2; // Vrstica 1 je glava, podatki se začnejo v vrstici 2

          const rawName = row[nameKey];
          const name = rawName !== undefined && rawName !== null ? String(rawName).trim() : '';

          if (!name) {
            rowErrors.push({
              row: rowNumber,
              field: 'Naziv',
              message: 'Manjka naziv artikla (stolpec je prazen).'
            });
            return;
          }

          // Preverjanje veljavnosti količine
          const rawQuantity = row['Količina'] ?? row['kolicina'] ?? row['Kolicina'] ?? row['Quantity'] ?? row['quantity'];
          let quantity = 1;
          if (rawQuantity !== undefined && rawQuantity !== null && String(rawQuantity).trim() !== '') {
            const parsedQty = Number(rawQuantity);
            if (isNaN(parsedQty) || parsedQty < 0) {
              rowErrors.push({
                row: rowNumber,
                field: 'Količina',
                message: `Neveljavna količina "${rawQuantity}". Vpisano mora biti celo število >= 0.`
              });
              return;
            }
            quantity = parsedQty;
          }

          const category = row['Kategorija'] || row['kategorija'] || row['Category'] || row['category'] || 'Razno';
          const branch = row['Veja'] || row['veja'] || row['Branch'] || row['branch'] || 'Vse veje';
          const closetName = row['Omara'] || row['omara'] || row['Closet'] || row['closet'] || '';
          const shelfName = row['Polica'] || row['polica'] || row['Shelf'] || row['shelf'] || '';
          const description = row['Opis'] || row['opis'] || row['Description'] || row['description'] || '';

          if (shelfName && !closetName) {
            rowWarnings.push({
              row: rowNumber,
              message: `Navedena je polica "${shelfName}", vendar ni navedene omare.`
            });
          }

          validRows.push({
            name,
            quantity,
            category: String(category).trim(),
            branch: String(branch).trim(),
            closetName: String(closetName).trim(),
            shelfName: String(shelfName).trim(),
            description: String(description).trim(),
            rowNumber
          });
        });

        setImportTotalCount(json.length);
        setImportErrors(rowErrors);
        setImportWarnings(rowWarnings);
        setImportPreviewItems(validRows);

        if (validRows.length === 0 && rowErrors.length > 0) {
          showToast(`Datoteka vsebuje ${rowErrors.length} napak in nima veljavnih artiklov.`, 'error');
        }
      } catch (parseErr) {
        setImportFileError('Napaka pri branju datoteke: ' + parseErr.message);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Potrditev uvoza artiklov
  const handleConfirmImport = async () => {
    if (importPreviewItems.length === 0) return;

    try {
      setImporting(true);
      const res = await api.batchImportArticles(importPreviewItems);
      showToast(res.message || `Uspešno uvoženih ${res.count || importPreviewItems.length} artiklov.`);
      setImportModalOpen(false);
      setImportPreviewItems([]);
      setImportErrors([]);
      setImportWarnings([]);
      setImportFileError('');
      await loadData();
    } catch (err) {
      alert('Napaka pri uvozu: ' + err.message);
    } finally {
      setImporting(false);
    }
  };

  const aiPromptText = `Pretvori mojo spodnjo tabelo artiklov v tabelo s točnimi stolpci za uvoz v Skavtsko skladišče:
- Naziv (obvezno ime artikla)
- Količina (število kosov, npr. 1, 5)
- Kategorija (ena izmed: Ustvarjanje, Orodje, Šotori & tabor, Kuhinja, Igre & rekviziti, Pionirstvo, Prva pomoč, Tisk & pisarna, Razno)
- Veja (ena izmed: Vse veje, Bobri (BB), Volčiči (VV), Izvidniki (IV), Popotniki (PP), Voditelji (VOD))
- Omara (ime omare ali regala, npr. Regal 1)
- Polica (ime police, npr. Polica A)
- Opis (kratek opis opreme)

Podatki za preureditev:
[Tukaj prilepi svojo tabelo ali besedilo]`;

  const copyAiPrompt = () => {
    try {
      navigator.clipboard.writeText(aiPromptText);
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 2500);
    } catch (copyErr) {
      console.warn('Kopiranje v odložišče ni uspelo:', copyErr);
    }
  };

  const filteredArticles = articles.filter(article => {
    const q = filterQuery.toLowerCase();
    const matchesQuery = !filterQuery || (
      article.name?.toLowerCase().includes(q) ||
      article.description?.toLowerCase().includes(q) ||
      article.category?.toLowerCase().includes(q) ||
      article.branch?.toLowerCase().includes(q) ||
      article.shelf?.name?.toLowerCase().includes(q) ||
      article.shelf?.closet?.name?.toLowerCase().includes(q)
    );

    const matchesCategory = selectedCategory === 'Vse' || article.category === selectedCategory;
    const matchesBranch = selectedBranch === 'Vse veje' || article.branch === selectedBranch;

    const closetId = article.shelf?.closet?._id || article.shelf?.closet;
    const matchesCloset = selectedCloset === 'all' || String(closetId) === String(selectedCloset);
    const matchesStock = !onlyInStock || (article.quantity || 0) > 0;

    return matchesQuery && matchesCategory && matchesBranch && matchesCloset && matchesStock;
  });

  const hasActiveFilters = filterQuery !== '' || selectedCategory !== 'Vse' || selectedBranch !== 'Vse veje' || selectedCloset !== 'all' || onlyInStock;

  const resetFilters = () => {
    setFilterQuery('');
    setSelectedCategory('Vse');
    setSelectedBranch('Vse veje');
    setSelectedCloset('all');
    setOnlyInStock(false);
  };

  if (loading) {
    return (
      <div className="py-16 flex flex-col items-center justify-center gap-3 text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        <p className="text-xs font-medium">Nalagam artikle...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      
      {/* Glava strani */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Package className="w-6 h-6 text-emerald-700" />
            <span>Vsi artikli</span>
          </h1>
        
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Uvozi iz Excela */}
          <button
            onClick={() => setImportModalOpen(true)}
            className="px-3 py-2 bg-white hover:bg-slate-50 active:scale-95 text-slate-700 border border-slate-300 text-xs font-bold rounded-xl shadow-2xs transition-all flex items-center gap-1.5 shrink-0"
            title="Uvozi artikle iz Excel ali CSV datoteke"
          >
            <Upload className="w-3.5 h-3.5 text-slate-500" />
            <span>Uvozi Excel</span>
          </button>

          {/* Izvozi v Excel */}
          <button
            onClick={handleExportExcel}
            className="px-3 py-2 bg-white hover:bg-slate-50 active:scale-95 text-slate-700 border border-slate-300 text-xs font-bold rounded-xl shadow-2xs transition-all flex items-center gap-1.5 shrink-0"
            title="Izvozi trenutne artikle v Excel"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Izvozi</span>
          </button>

          {/* Dodaj nov artikel */}
          <button
            onClick={() => setAddModalOpen(true)}
            className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Nov artikel</span>
          </button>
        </div>
      </div>

      {/* Iskalnik in filtri */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
        {/* Iskalno polje */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Išči po nazivu, opisu, kategoriji ali veji..."
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
          />
        </div>

        {/* Vrstica s filtri */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {/* Filter kategorija */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1 flex items-center gap-1">
              <Tag className="w-3 h-3 text-slate-400" />
              <span>Kategorija</span>
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
            >
              <option value="Vse">Vse kategorije</option>
              {ARTICLE_CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Filter veja */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1 flex items-center gap-1">
              <Users className="w-3 h-3 text-slate-400" />
              <span>Skavtska veja</span>
            </label>
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
            >
              {SKAVT_BRANCHES.map(branch => (
                <option key={branch.id} value={branch.id}>{branch.name}</option>
              ))}
            </select>
          </div>

          {/* Filter omara */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-slate-400" />
              <span>Omara</span>
            </label>
            <select
              value={selectedCloset}
              onChange={(e) => setSelectedCloset(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
            >
              <option value="all">Vse omare</option>
              {closets.map(c => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Spodnja vrstica filtrov */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100 text-xs">
          <label className="flex items-center gap-2 cursor-pointer text-slate-700 font-medium">
            <input
              type="checkbox"
              checked={onlyInStock}
              onChange={(e) => setOnlyInStock(e.target.checked)}
              className="w-4 h-4 rounded text-emerald-600 border-slate-300 focus:ring-emerald-500"
            />
            <span>Samo razpoložljivi artikli (na zalogi)</span>
          </label>

          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="text-[11px] text-slate-500 hover:text-slate-800 underline font-medium"
              >
                Počisti filtre
              </button>
            )}
            <span className="text-[11px] font-bold px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md">
              Zadetki: {filteredArticles.length}
            </span>
          </div>
        </div>
      </div>

      {/* Seznam artiklov */}
      {filteredArticles.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-10 text-center">
          <Package className="w-10 h-10 mx-auto text-slate-300 mb-2" />
          <h3 className="text-sm font-bold text-slate-700">Ni artiklov, ki bi ustrezali iskanju</h3>
          <p className="text-xs text-slate-500 mt-1 mb-4">
            Poskusite spremeniti filter ali dodajte nov artikel.
          </p>
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
            >
              Počisti filtre
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredArticles.map(article => {
            const shelfId = article.shelf?._id || article.shelf;
            const shelfName = article.shelf?.name || 'Polica';
            const closetName = article.shelf?.closet?.name || 'Omara';
            const qty = article.quantity || 0;
            const inStock = qty > 0;
            const branchStyle = getBranchColor(article.branch);

            return (
              <div
                key={article._id}
                className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-300 transition-all"
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
                    <Package className="w-5 h-5 text-emerald-700" />
                  </div>

                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-bold text-slate-900 text-sm leading-tight">
                        {article.name}
                      </span>

                      {/* Zaloga */}
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                          inStock
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-700'
                        }`}
                      >
                        {inStock ? `${qty} kos` : 'Ni zaloge'}
                      </span>

                      {/* Kategorija */}
                      {article.category && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 shrink-0">
                          {article.category}
                        </span>
                      )}

                      {/* Veja */}
                      {article.branch && article.branch !== 'Vse veje' && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${branchStyle}`}>
                          {article.branch}
                        </span>
                      )}
                    </div>

                    {article.description && (
                      <p className="text-xs text-slate-500 line-clamp-1">
                        {article.description}
                      </p>
                    )}

                    {/* Lokacija */}
                    <div className="flex items-center gap-1 text-[11px] text-slate-500">
                      <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                      {article.shelf ? (
                        <>
                          <span className="font-medium text-slate-700">{closetName}</span>
                          <span>&rarr;</span>
                          <Link 
                            to={`/polica/${shelfId}`} 
                            className="text-emerald-700 hover:underline font-semibold"
                          >
                            {shelfName}
                          </Link>
                        </>
                      ) : (
                        <span className="italic text-slate-400">Ni določene police</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  <button
                    onClick={() => handleOpenBorrow(article)}
                    disabled={!inStock}
                    className={`w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      inStock
                        ? 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs active:scale-95'
                        : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                    }`}
                  >
                    <HandHelping className="w-3.5 h-3.5" />
                    <span>{inStock ? 'Izposodi si' : 'Brez zaloge'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal za dodajanje artikla */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl max-w-md w-full overflow-hidden border border-slate-200 animate-in slide-in-from-bottom-4 duration-150">
            <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-400" />
                <span>Nov artikel</span>
              </h3>
              <button onClick={() => setAddModalOpen(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateArticle} className="p-5 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Naziv artikla *
                </label>
                <input
                  type="text"
                  required
                  placeholder="npr. Šotorsko krilo, Žaga, Akrilne barve"
                  value={newArtName}
                  onChange={(e) => setNewArtName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Količina *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={newArtQuantity}
                    onChange={(e) => setNewArtQuantity(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Kategorija
                  </label>
                  <select
                    value={newArtCategory}
                    onChange={(e) => setNewArtCategory(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  >
                    {ARTICLE_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Skavtska veja
                </label>
                <select
                  value={newArtBranch}
                  onChange={(e) => setNewArtBranch(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                >
                  {SKAVT_BRANCHES.map(branch => (
                    <option key={branch.id} value={branch.id}>{branch.name}</option>
                  ))}
                </select>
              </div>

              {/* Izbira lokacije: najprej izbira omare, nato se odpre novo okno za polico */}
              <div className="space-y-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    1. Izbira omare
                  </label>
                  <select
                    value={selectedClosetId}
                    onChange={(e) => handleSelectCloset(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 font-medium"
                  >
                    <option value="">-- Izberite omaro --</option>
                    {closets.map(c => (
                      <option key={c._id} value={c._id}>
                        {c.name} {c.location ? `(${c.location})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedClosetId && (
                  <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-3 flex items-center justify-between gap-2.5">
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold text-emerald-800 uppercase block tracking-wider">
                        Izbrana lokacija
                      </span>
                      <div className="text-xs font-semibold text-slate-900 truncate mt-0.5">
                        <span>{closets.find(c => c._id === selectedClosetId)?.name}</span>
                        <span className="mx-1">&rarr;</span>
                        {newArtShelfId ? (
                          <span className="text-emerald-800 font-bold">
                            {shelves.find(s => s._id === newArtShelfId)?.name || 'Polica izbrana'}
                          </span>
                        ) : (
                          <span className="text-slate-500 italic">
                            Brez police (splošno v omari)
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShelfPickerOpen(true)}
                      className="px-3 py-1.5 bg-white hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-lg border border-emerald-300 shadow-2xs shrink-0 transition-all flex items-center gap-1"
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>{newArtShelfId ? 'Zamenjaj polico' : 'Izberi polico'}</span>
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Opis (opcijsko)
                </label>
                <textarea
                  rows={2}
                  placeholder="Kratek opis stanja ali namena artikla..."
                  value={newArtDescription}
                  onChange={(e) => setNewArtDescription(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Prekliči
                </button>
                <button
                  type="submit"
                  disabled={creatingArt}
                  className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl disabled:opacity-60"
                >
                  {creatingArt ? 'Shranjujem...' : 'Ustvari artikel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal za izbiro police iz izbrane omare (2. korak) */}
      {shelfPickerOpen && selectedClosetId && (
        <div className="fixed inset-0 z-60 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl max-w-md w-full border border-slate-200 p-5 space-y-4 animate-in slide-in-from-bottom-4 duration-150">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
                  2. Korak: Izbira police
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">
                  Katera polica v omari "{closets.find(c => c._id === selectedClosetId)?.name || 'Omara'}"?
                </h3>
              </div>
              <button 
                type="button"
                onClick={() => setShelfPickerOpen(false)} 
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {shelves.filter(s => (s.closet?._id || s.closet) === selectedClosetId).length === 0 ? (
                <div className="p-4 text-center border border-dashed border-slate-200 rounded-xl text-xs text-slate-500">
                  V tej omari še ni ustvarjenih polic. Lahko jo dodate spodaj ali nadaljujete brez police.
                </div>
              ) : (
                shelves
                  .filter(s => (s.closet?._id || s.closet) === selectedClosetId)
                  .map((shelf) => {
                    const isSelected = newArtShelfId === shelf._id;
                    return (
                      <button
                        key={shelf._id}
                        type="button"
                        onClick={() => {
                          setNewArtShelfId(shelf._id);
                          setShelfPickerOpen(false);
                        }}
                        className={`w-full text-left p-3 rounded-xl border flex items-center justify-between transition-all ${
                          isSelected
                            ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold'
                            : 'border-slate-200 hover:border-emerald-500 hover:bg-slate-50 text-slate-800 font-medium'
                        }`}
                      >
                        <div className="min-w-0 pr-2">
                          <span className="text-xs sm:text-sm block truncate">{shelf.name}</span>
                          {(shelf.location || shelf.description) && (
                            <span className="text-[11px] text-slate-500 block truncate font-normal">
                              {shelf.location || shelf.description}
                            </span>
                          )}
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-emerald-600 shrink-0" />}
                      </button>
                    );
                  })
              )}

              <button
                type="button"
                onClick={() => {
                  setNewArtShelfId('');
                  setShelfPickerOpen(false);
                }}
                className="w-full text-center py-2 px-3 rounded-xl border border-dashed border-slate-300 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Brez specifične police (samo v tej omari)
              </button>
            </div>

            {/* Hitro dodajanje nove police */}
            <form onSubmit={handleQuickCreateShelf} className="pt-2 border-t border-slate-100 flex gap-2">
              <input
                type="text"
                placeholder="Nova polica v tej omari..."
                value={newShelfQuickName}
                onChange={(e) => setNewShelfQuickName(e.target.value)}
                className="flex-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
              <button
                type="submit"
                disabled={creatingQuickShelf || !newShelfQuickName.trim()}
                className="px-3 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-xs font-bold rounded-xl shrink-0"
              >
                {creatingQuickShelf ? '...' : '+ Dodaj'}
              </button>
            </form>

            <div className="pt-1 flex justify-end">
              <button
                type="button"
                onClick={() => setShelfPickerOpen(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Zapri
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal za uvoz iz Excela / CSV s podporo za AI navodila */}
      {importModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 animate-in slide-in-from-bottom-4 duration-150">
            <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between sticky top-0 z-10">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                <span>Uvoz podatkov z Excel tabelo (.xlsx / .csv)</span>
              </h3>
              <button 
                onClick={() => {
                  setImportModalOpen(false);
                  setImportPreviewItems([]);
                  setImportErrors([]);
                  setImportWarnings([]);
                  setImportFileError('');
                }} 
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              
              {/* AI Navodila za pripravo podatkov */}
              <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-emerald-900 font-bold text-xs">
                    <Sparkles className="w-4 h-4 text-emerald-700" />
                    <span>Priprava podatkov z AI (ChatGPT / Gemini / Claude)</span>
                  </div>
                  <button
                    onClick={copyAiPrompt}
                    className="px-2.5 py-1 bg-white hover:bg-emerald-100 text-emerald-800 text-[11px] font-bold rounded-lg border border-emerald-300 flex items-center gap-1 transition-all"
                  >
                    {copiedPrompt ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Kopirano!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Kopiraj AI poziv</span>
                      </>
                    )}
                  </button>
                </div>

                <p className="text-xs text-emerald-950 leading-relaxed">
                  Če imate svojo obstoječo Excel tabelo v drugačni obliki, kopirajte spodnji poziv in ga skupaj s svojo tabelo pošljite ChatGPT ali drugemu AI orodju. AI vam bo tabelo nemudoma pretvoril v format, pripravljen za uvoz:
                </p>

                <div className="bg-white/90 p-2.5 rounded-xl border border-emerald-200 font-mono text-[11px] text-slate-700 select-all leading-normal">
                  {aiPromptText}
                </div>
              </div>

              {/* Prenos vzorčne datoteke in izbira datoteke */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Naložite datoteko
                  </span>
                  <button
                    onClick={handleDownloadSampleTemplate}
                    className="text-xs text-emerald-700 hover:text-emerald-900 hover:underline font-semibold flex items-center gap-1"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Prenesi vzorčni Excel (.xlsx)</span>
                  </button>
                </div>

                <div className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-2xl p-6 text-center transition-colors bg-slate-50">
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileUpload}
                    className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-700 file:text-white hover:file:bg-emerald-800 cursor-pointer"
                  />
                  <p className="text-[11px] text-slate-400 mt-2">
                    Podprti formati: .xlsx, .xls ali .csv
                  </p>
                </div>
              </div>

              {/* Kritična napaka v datoteki / glavi */}
              {importFileError && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 text-rose-900 text-xs">
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-bold">Napaka pri branju datoteke</p>
                    <p className="leading-relaxed text-rose-800">{importFileError}</p>
                  </div>
                </div>
              )}

              {/* Seznam napak po posameznih vrsticah */}
              {importErrors.length > 0 && (
                <div className="p-4 bg-rose-50/90 border border-rose-200 rounded-2xl space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-rose-800 font-bold">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <span>Zaznanih {importErrors.length} napak v datoteki (od skupaj {importTotalCount} vrstic):</span>
                  </div>
                  <div className="max-h-36 overflow-y-auto space-y-1 text-[11px] pr-1">
                    {importErrors.map((err, i) => (
                      <div key={i} className="flex items-start gap-1.5 text-rose-900 bg-white/70 p-1.5 rounded-lg border border-rose-100">
                        <span className="font-bold shrink-0">Vrstica {err.row} [{err.field}]:</span>
                        <span>{err.message}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-[11px] text-rose-700 font-medium">
                    {importPreviewItems.length > 0 
                      ? `Za uvoz je na voljo ${importPreviewItems.length} veljavnih artiklov. Napačne vrstice bodo preskočene.` 
                      : 'Noben artikel ni veljaven za uvoz. Popravite napake v datoteki.'}
                  </p>
                </div>
              )}

              {/* Opozorila */}
              {importWarnings.length > 0 && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1 text-xs">
                  <div className="flex items-center gap-1.5 text-amber-900 font-bold text-[11px]">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                    <span>Opozorila ({importWarnings.length}):</span>
                  </div>
                  <div className="max-h-24 overflow-y-auto space-y-1 text-[11px] text-amber-800">
                    {importWarnings.map((warn, i) => (
                      <div key={i}>
                        Vrstica {warn.row}: {warn.message}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Predogled veljavnih uvoženih vrstic */}
              {importPreviewItems.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                    <span>
                      Predogled veljavnih vrstic ({importPreviewItems.length} od {importTotalCount || importPreviewItems.length}):
                    </span>
                    {importErrors.length === 0 && (
                      <span className="text-emerald-700 font-semibold flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" />
                        Vse vrstice so veljavne
                      </span>
                    )}
                  </div>

                  <div className="max-h-56 overflow-y-auto border border-slate-200 rounded-xl text-xs">
                    <table className="w-full text-left">
                      <thead className="bg-slate-100 text-slate-700 sticky top-0 text-[11px] uppercase tracking-wider">
                        <tr>
                          <th className="p-2">Vrstica</th>
                          <th className="p-2">Naziv</th>
                          <th className="p-2">Količina</th>
                          <th className="p-2">Kategorija</th>
                          <th className="p-2">Veja</th>
                          <th className="p-2">Omara</th>
                          <th className="p-2">Polica</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {importPreviewItems.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="p-2 text-slate-400 font-mono text-[11px]">{item.rowNumber || idx + 1}</td>
                            <td className="p-2 font-bold text-slate-800">{item.name}</td>
                            <td className="p-2">{item.quantity}</td>
                            <td className="p-2">{item.category}</td>
                            <td className="p-2">{item.branch}</td>
                            <td className="p-2 text-slate-500">{item.closetName || '-'}</td>
                            <td className="p-2 text-slate-500">{item.shelfName || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setImportModalOpen(false);
                    setImportPreviewItems([]);
                    setImportErrors([]);
                    setImportWarnings([]);
                    setImportFileError('');
                  }}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Prekliči
                </button>
                <button
                  type="button"
                  disabled={importPreviewItems.length === 0 || importing}
                  onClick={handleConfirmImport}
                  className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs disabled:opacity-50 flex items-center gap-1.5"
                >
                  {importing ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Uvažam...</span>
                    </>
                  ) : (
                    <span>
                      {importErrors.length > 0 
                        ? `Uvozi le veljavne artikle (${importPreviewItems.length})` 
                        : `Potrdi uvoz (${importPreviewItems.length})`}
                    </span>
                  )}
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
