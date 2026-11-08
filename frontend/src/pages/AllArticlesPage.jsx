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
  Layers,
  Trash2,
  CheckSquare,
  Square,
  ShieldAlert,
  Warehouse,
  Archive,
  Filter,
  ChevronDown
} from 'lucide-react';

export default function AllArticlesPage() {
  const { openBorrowModal, showToast } = useBorrow();

  const [articles, setArticles] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [closets, setClosets] = useState([]);
  const [shelves, setShelves] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filtri
  const [filterQuery, setFilterQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Vse');
  const [selectedBranch, setSelectedBranch] = useState('Vse veje');
  const [selectedWarehouse, setSelectedWarehouse] = useState('all');
  const [selectedCloset, setSelectedCloset] = useState('all');
  const [onlyInStock, setOnlyInStock] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [expandedArticleIds, setExpandedArticleIds] = useState({});

  // Modal za dodajanje artikla
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newArtName, setNewArtName] = useState('');
  const [newArtQuantity, setNewArtQuantity] = useState(1);
  const [newArtCategory, setNewArtCategory] = useState('Razno');
  const [newArtBranch, setNewArtBranch] = useState('Vse veje');
  const [newArtWarehouseId, setNewArtWarehouseId] = useState('');
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
  const [importDefaultWarehouseId, setImportDefaultWarehouseId] = useState('');
  const [importPreviewItems, setImportPreviewItems] = useState([]);
  const [importFileError, setImportFileError] = useState('');
  const [importErrors, setImportErrors] = useState([]);
  const [importWarnings, setImportWarnings] = useState([]);
  const [importTotalCount, setImportTotalCount] = useState(0);
  const [importing, setImporting] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  // Multi-select upravljanje artiklov
  const [selectedArticleIds, setSelectedArticleIds] = useState([]);
  const [bulkEditModalOpen, setBulkEditModalOpen] = useState(false);
  const [bulkLocationAction, setBulkLocationAction] = useState('keep'); // 'keep', 'remove', 'assign'
  const [bulkWarehouseId, setBulkWarehouseId] = useState('');
  const [bulkClosetId, setBulkClosetId] = useState('');
  const [bulkShelfId, setBulkShelfId] = useState('');
  const [bulkBranchAction, setBulkBranchAction] = useState('keep'); // 'keep', 'change'
  const [bulkBranch, setBulkBranch] = useState('Vse veje');
  const [bulkCategoryAction, setBulkCategoryAction] = useState('keep'); // 'keep', 'change'
  const [bulkCategory, setBulkCategory] = useState('Razno');
  const [bulkNewShelfName, setBulkNewShelfName] = useState('');
  const [bulkCreatingShelf, setBulkCreatingShelf] = useState(false);
  const [bulkUpdating, setBulkUpdating] = useState(false);

  // Varnostni mehanizem za brisanje vseh artiklov z obvezno varnostno kopijo
  const [deleteAllModalOpen, setDeleteAllModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deletingAll, setDeletingAll] = useState(false);
  const [backupDownloaded, setBackupDownloaded] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [artData, closetData, shelfData, warehouseData] = await Promise.all([
        api.getArticles(),
        api.getClosets(),
        api.getShelves(),
        api.getWarehouses()
      ]);
      setArticles(Array.isArray(artData) ? artData : []);
      setClosets(Array.isArray(closetData) ? closetData : []);
      setShelves(Array.isArray(shelfData) ? shelfData : []);
      const whList = Array.isArray(warehouseData) ? warehouseData : [];
      setWarehouses(whList);
      if (whList.length > 0) {
        setImportDefaultWarehouseId(prev => prev || whList[0]._id);
      }
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
      setNewArtWarehouseId(warehouses.length === 1 ? warehouses[0]._id : '');
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
        'Skladišče': a.shelf?.closet?.warehouse?.name || (a.shelf?.closet ? 'Glavno skladišče' : ''),
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
          'Skladišče': 'Glavno skladišče',
          'Omara': 'Regal A',
          'Polica': 'Polica 1',
          'Opis': 'Zeleno nepremočljivo platno'
        },
        {
          'Naziv': 'Sisal vrvica (50m)',
          'Količina': 5,
          'Kategorija': 'Pionirstvo',
          'Veja': 'Vse veje',
          'Skladišče': 'Glavno skladišče',
          'Omara': 'Regal A',
          'Polica': 'Polica 2',
          'Opis': 'Vrvica za pionirske objekte'
        },
        {
          'Naziv': 'Vodenke in čopiči',
          'Količina': 20,
          'Kategorija': 'Ustvarjanje',
          'Veja': 'Bobri (BB)',
          'Skladišče': 'Glavno skladišče',
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
          const warehouseName = row['Skladišče'] || row['skladisce'] || row['Skladisce'] || row['Warehouse'] || row['warehouse'] || '';
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
            warehouseName: String(warehouseName).trim(),
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
      const res = await api.batchImportArticles(importPreviewItems, importDefaultWarehouseId);
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
- Skladišče (ime skladišča, npr. Glavno skladišče, Taborišče)
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

    const warehouseId = article.shelf?.closet?.warehouse?._id || article.shelf?.closet?.warehouse;
    const matchesWarehouse = selectedWarehouse === 'all' || String(warehouseId) === String(selectedWarehouse);

    const closetId = article.shelf?.closet?._id || article.shelf?.closet;
    const matchesCloset = selectedCloset === 'all' || String(closetId) === String(selectedCloset);
    const matchesStock = !onlyInStock || (article.quantity || 0) > 0;

    return matchesQuery && matchesCategory && matchesBranch && matchesWarehouse && matchesCloset && matchesStock;
  });

  const hasActiveFilters = filterQuery !== '' || selectedCategory !== 'Vse' || selectedBranch !== 'Vse veje' || selectedWarehouse !== 'all' || selectedCloset !== 'all' || onlyInStock;

  const activeFilterCount = (selectedCategory !== 'Vse' ? 1 : 0) +
    (selectedBranch !== 'Vse veje' ? 1 : 0) +
    (selectedWarehouse !== 'all' ? 1 : 0) +
    (selectedCloset !== 'all' ? 1 : 0) +
    (onlyInStock ? 1 : 0);

  const resetFilters = () => {
    try {
      setFilterQuery('');
      setSelectedCategory('Vse');
      setSelectedBranch('Vse veje');
      setSelectedWarehouse('all');
      setSelectedCloset('all');
      setOnlyInStock(false);
    } catch (err) {
      console.error('Error resetting filters:', err);
    }
  };

  const toggleArticleExpand = (articleId) => {
    try {
      setExpandedArticleIds(prev => ({
        ...prev,
        [articleId]: !prev[articleId]
      }));
    } catch (err) {
      console.error('Error toggling article expansion:', err);
    }
  };

  // Multi-select logic
  const allFilteredSelected = filteredArticles.length > 0 && filteredArticles.every(a => selectedArticleIds.includes(a._id));

  const toggleSelectAll = () => {
    try {
      if (allFilteredSelected) {
        setSelectedArticleIds([]);
      } else {
        setSelectedArticleIds(filteredArticles.map(a => a._id));
      }
    } catch (err) {
      console.error('Error toggling select all articles:', err);
    }
  };

  const toggleSelectArticle = (id) => {
    try {
      setSelectedArticleIds(prev => 
        prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
      );
    } catch (err) {
      console.error('Error toggling article selection:', err);
    }
  };

  // Masovno posodabljanje artiklov (Enoten Bulk Edit)
  const handleBulkUpdate = async (e) => {
    e?.preventDefault();
    if (selectedArticleIds.length === 0) return;

    if (bulkLocationAction === 'assign' && !bulkShelfId) {
      showToast('Za dodelitev lokacije izberite polico ali označite "Brez spremembe".', 'error');
      return;
    }

    if (bulkLocationAction === 'keep' && bulkBranchAction === 'keep' && bulkCategoryAction === 'keep') {
      showToast('Niste izbrali nobene spremembe (vsa polja so označena "Brez spremembe").', 'error');
      return;
    }

    if (bulkLocationAction === 'assign' && !bulkShelfId) {
      showToast('Pri določitvi lokacije morate izbrati polico (ali ustvariti novo).', 'error');
      return;
    }

    const payload = {
      articleIds: selectedArticleIds
    };

    if (bulkLocationAction === 'remove') {
      payload.shelfId = null;
    } else if (bulkLocationAction === 'assign') {
      payload.shelfId = bulkShelfId;
    }

    if (bulkBranchAction === 'change') {
      payload.branch = bulkBranch;
    }

    if (bulkCategoryAction === 'change') {
      payload.category = bulkCategory;
    }

    try {
      setBulkUpdating(true);
      const res = await api.batchUpdateArticles(payload);
      showToast(res.message || `Uspešno posodobljenih ${selectedArticleIds.length} artiklov.`);
      setBulkEditModalOpen(false);
      setSelectedArticleIds([]);
      await loadData();
    } catch (err) {
      showToast('Napaka pri posodabljanju: ' + err.message, 'error');
    } finally {
      setBulkUpdating(false);
    }
  };

  const handleBulkQuickCreateShelf = async (e) => {
    e?.preventDefault();
    if (!bulkNewShelfName.trim() || !bulkClosetId) return;

    try {
      setBulkCreatingShelf(true);
      const created = await api.createShelf({
        name: bulkNewShelfName.trim(),
        closet: bulkClosetId
      });
      setShelves(prev => [...prev, created]);
      setBulkShelfId(created._id);
      setBulkNewShelfName('');
      showToast(`Polica "${created.name}" ustvarjena in izbrana.`);
    } catch (err) {
      showToast('Napaka pri ustvarjanju police: ' + err.message, 'error');
    } finally {
      setBulkCreatingShelf(false);
    }
  };

  // Prenos varnostne kopije pred brisanjem
  const handleDownloadBackupAndConfirmDelete = () => {
    try {
      const exportData = articles.map(a => ({
        'ID': String(a._id),
        'Naziv': a.name || '',
        'Količina': a.quantity ?? 1,
        'Kategorija': a.category || 'Razno',
        'Veja': a.branch || 'Vse veje',
        'Skladišče': a.shelf?.closet?.warehouse?.name || (a.shelf?.closet ? 'Glavno skladišče' : ''),
        'Omara': a.shelf?.closet?.name || '',
        'Polica': a.shelf?.name || '',
        'Opis': a.description || '',
        'QR koda': a.qr || '',
        'Ustvarjeno': a.createdAt ? new Date(a.createdAt).toLocaleDateString('sl-SI') : ''
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Artikli - Backup');
      const dateStr = new Date().toISOString().slice(0, 10);
      XLSX.writeFile(workbook, `Varnostna_kopija_vsi_artikli_${dateStr}.xlsx`);

      setBackupDownloaded(true);
      showToast('Varnostna kopija je bila uspešno prenesena.');
    } catch (err) {
      alert('Napaka pri ustvarjanju varnostne kopije: ' + err.message);
    }
  };

  // Dokončni izbris vseh artiklov
  const handleExecuteDeleteAll = async () => {
    if (!backupDownloaded) {
      showToast('Pred brisanjem morate prenesti varnostno kopijo!', 'error');
      return;
    }
    if (deleteConfirmText.trim().toUpperCase() !== 'IZBRIŠI') {
      showToast('Vpisati morate besedo "IZBRIŠI" za potrditev.', 'error');
      return;
    }

    try {
      setDeletingAll(true);
      const res = await api.deleteAllArticles();
      showToast(res.message || 'Vsi artikli so bili uspešno izbrisani.');
      setDeleteAllModalOpen(false);
      setDeleteConfirmText('');
      setBackupDownloaded(false);
      setSelectedArticleIds([]);
      await loadData();
    } catch (err) {
      showToast('Napaka pri brisanju artiklov: ' + err.message, 'error');
    } finally {
      setDeletingAll(false);
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

          {/* Izbriši vse z obveznim backupom */}
          <button
            onClick={() => {
              setDeleteAllModalOpen(true);
              setDeleteConfirmText('');
              setBackupDownloaded(false);
            }}
            className="px-3 py-2 bg-white hover:bg-rose-50 active:scale-95 text-rose-700 border border-rose-200 text-xs font-bold rounded-xl shadow-2xs transition-all flex items-center gap-1.5 shrink-0"
            title="Izbriši vse artikle z obveznim predhodnim prenosom varnostne kopije"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-500" />
            <span>Počisti bazo</span>
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
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
        {/* Iskalno polje z mobilnim gumbom za filtre */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Išči po nazivu, opisu, kategoriji ali veji..."
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 transition-colors"
            />
          </div>

          {/* Gumb za razširitev/skrčenje filtrov na mobilnih napravah */}
          <button
            type="button"
            onClick={() => setShowMobileFilters(prev => !prev)}
            className={`sm:hidden px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 select-none ${
              showMobileFilters || activeFilterCount > 0
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-2xs'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-300'
            }`}
            aria-label="Prikaži filtre"
          >
            <Filter className="w-3.5 h-3.5 text-emerald-700" />
            <span>Filtri</span>
            {activeFilterCount > 0 && (
              <span className="w-4.5 h-4.5 rounded-full bg-emerald-700 text-white text-[10px] flex items-center justify-center font-bold">
                {activeFilterCount}
              </span>
            )}
            <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-200 ${showMobileFilters ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Filtri - na mobilnem privzeto skrčeni, na sm+ vedno vidni */}
        <div className={`${showMobileFilters ? 'block' : 'hidden'} sm:block space-y-3 pt-1 border-t sm:border-t-0 border-slate-100`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
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

            {/* Filter skladišče */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Warehouse className="w-3 h-3 text-slate-400" />
                <span>Skladišče</span>
              </label>
              <select
                value={selectedWarehouse}
                onChange={(e) => {
                  setSelectedWarehouse(e.target.value);
                  setSelectedCloset('all');
                }}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
              >
                <option value="all">Vsa skladišča</option>
                {warehouses.map(w => (
                  <option key={w._id} value={w._id}>{w.name}</option>
                ))}
              </select>
            </div>

            {/* Filter omara */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Archive className="w-3 h-3 text-slate-400" />
                <span>Omara</span>
              </label>
              <select
                value={selectedCloset}
                onChange={(e) => setSelectedCloset(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
              >
                <option value="all">
                  {selectedWarehouse !== 'all' ? 'Vse omare v tem skladišču' : 'Vse omare'}
                </option>
                {closets
                  .filter(c => selectedWarehouse === 'all' || (c.warehouse?._id || c.warehouse) === selectedWarehouse)
                  .map(c => (
                    <option key={c._id} value={c._id}>
                      {c.name} {selectedWarehouse === 'all' && c.warehouse?.name ? `(${c.warehouse.name})` : ''}
                    </option>
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
                  type="button"
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
          {/* Multi-select orodna vrstica nad seznamom */}
          <div className="flex items-center justify-between px-3.5 py-2 bg-slate-100/90 rounded-xl text-xs text-slate-700">
            <label className="flex items-center gap-2 cursor-pointer select-none font-semibold">
              <input
                type="checkbox"
                checked={allFilteredSelected}
                onChange={toggleSelectAll}
                className="w-4 h-4 rounded text-emerald-600 border-slate-300 focus:ring-emerald-500 cursor-pointer"
              />
              <span>
                {allFilteredSelected ? 'Odznači vse prikazane' : `Izberi vse prikazane (${filteredArticles.length})`}
              </span>
            </label>

            <span className="text-[11px] font-medium text-slate-500">
              Skupaj: {filteredArticles.length}
            </span>
          </div>

          {filteredArticles.map(article => {
            const isSelected = selectedArticleIds.includes(article._id);
            const isExpanded = !!expandedArticleIds[article._id];
            const shelfId = article.shelf?._id || article.shelf;
            const warehouseName = article.shelf?.closet?.warehouse?.name;
            const closetName = article.shelf?.closet?.name || 'Omara';
            const shelfName = article.shelf?.name || 'Polica';
            const qty = article.quantity || 0;
            const inStock = qty > 0;
            const branchStyle = getBranchColor(article.branch);

            return (
              <div
                key={article._id}
                className={`bg-white rounded-2xl border shadow-2xs transition-all ${
                  isSelected 
                    ? 'border-emerald-500 bg-emerald-50/25 ring-1 ring-emerald-500' 
                    : 'border-slate-200/90 hover:border-slate-300'
                }`}
              >
                {/* Kompakten mobilni pogled (klik razširi podrobnosti) */}
                <div
                  onClick={() => toggleArticleExpand(article._id)}
                  className="sm:hidden px-3.5 py-2.5 flex items-center justify-between gap-2.5 cursor-pointer select-none"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center shrink-0"
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectArticle(article._id)}
                        className="w-4 h-4 rounded text-emerald-600 border-slate-300 focus:ring-emerald-500 cursor-pointer"
                      />
                    </div>
                    <span className="font-bold text-slate-900 text-sm truncate">
                      {article.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 text-slate-400">
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                        inStock
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-700'
                      }`}
                    >
                      {qty}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 transition-transform duration-200 ${
                        isExpanded ? 'rotate-180 text-emerald-700' : ''
                      }`}
                    />
                  </div>
                </div>

                {/* Razširjene podrobnosti na mobilnem telefonu */}
                {isExpanded && (
                  <div className="sm:hidden px-3.5 pb-3 pt-1 border-t border-slate-100 space-y-2.5 animate-in fade-in duration-150">
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                          inStock
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-700'
                        }`}
                      >
                        {inStock ? `${qty} kos na zalogi` : 'Ni zaloge'}
                      </span>

                      {article.category && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 shrink-0">
                          {article.category}
                        </span>
                      )}

                      {article.branch && article.branch !== 'Vse veje' && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${branchStyle}`}>
                          {article.branch}
                        </span>
                      )}
                    </div>

                    {article.description && (
                      <p className="text-xs text-slate-600">
                        {article.description}
                      </p>
                    )}

                    <div className="flex items-center gap-1 text-[11px] text-slate-500">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      {article.shelf ? (
                        <div className="flex items-center gap-1 flex-wrap">
                          {warehouseName && (
                            <>
                              <span className="font-semibold text-slate-800">{warehouseName}</span>
                              <span className="text-slate-400">&rarr;</span>
                            </>
                          )}
                          <span className="font-medium text-slate-700">{closetName}</span>
                          <span className="text-slate-400">&rarr;</span>
                          <Link 
                            to={`/polica/${shelfId}`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-emerald-700 hover:underline font-semibold"
                          >
                            {shelfName}
                          </Link>
                        </div>
                      ) : (
                        <span className="italic text-slate-400">Ni določene police</span>
                      )}
                    </div>

                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenBorrow(article);
                        }}
                        disabled={!inStock}
                        className={`w-full py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
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
                )}

                {/* Prikaz za večje zaslone (namizje / sm+) */}
                <div className="hidden sm:flex sm:items-center sm:justify-between p-4 gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="flex items-center h-10 shrink-0">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectArticle(article._id)}
                        className="w-4 h-4 rounded text-emerald-600 border-slate-300 focus:ring-emerald-500 cursor-pointer"
                      />
                    </div>

                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
                      <Package className="w-5 h-5 text-emerald-700" />
                    </div>

                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-bold text-slate-900 text-sm leading-tight">
                          {article.name}
                        </span>

                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                            inStock
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-700'
                          }`}
                        >
                          {inStock ? `${qty} kos` : 'Ni zaloge'}
                        </span>

                        {article.category && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 shrink-0">
                            {article.category}
                          </span>
                        )}

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

                      <div className="flex items-center gap-1 text-[11px] text-slate-500">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        {article.shelf ? (
                          <>
                            {warehouseName && (
                              <>
                                <span className="font-semibold text-slate-800">{warehouseName}</span>
                                <span className="text-slate-400">&rarr;</span>
                              </>
                            )}
                            <span className="font-medium text-slate-700">{closetName}</span>
                            <span className="text-slate-400">&rarr;</span>
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

                  <div className="flex items-center justify-end shrink-0">
                    <button
                      onClick={() => handleOpenBorrow(article)}
                      disabled={!inStock}
                      className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
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

              {/* Izbira lokacije */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Warehouse className="w-3.5 h-3.5 text-slate-500" />
                    <span>Skladišče (filter omar)</span>
                  </label>
                  <select
                    value={newArtWarehouseId}
                    onChange={(e) => {
                      setNewArtWarehouseId(e.target.value);
                      setSelectedClosetId('');
                      setNewArtShelfId('');
                    }}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 font-medium"
                  >
                    <option value="">Vsa skladišča (brez filtra)</option>
                    {warehouses.map(w => (
                      <option key={w._id} value={w._id}>{w.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Archive className="w-3.5 h-3.5 text-slate-500" />
                    <span>Omara</span>
                  </label>
                  <select
                    value={selectedClosetId}
                    onChange={(e) => {
                      const cid = e.target.value;
                      handleSelectCloset(cid);
                      if (cid && !newArtWarehouseId) {
                        const found = closets.find(c => c._id === cid);
                        const whId = found?.warehouse?._id || found?.warehouse;
                        if (whId) setNewArtWarehouseId(String(whId));
                      }
                    }}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 font-medium"
                  >
                    <option value="">-- Izberite omaro --</option>
                    {closets
                      .filter(c => !newArtWarehouseId || String(c.warehouse?._id || c.warehouse) === String(newArtWarehouseId))
                      .map(c => (
                        <option key={c._id} value={c._id}>
                          {c.name} {!newArtWarehouseId && c.warehouse?.name ? `(${c.warehouse.name})` : (c.location ? `(${c.location})` : '')}
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
                        <span className="text-slate-600 font-medium">
                          {warehouses.find(w => String(w._id) === String(newArtWarehouseId))?.name || 'Skladišče'}
                        </span>
                        <span className="mx-1 text-slate-400">&rarr;</span>
                        <span>{closets.find(c => c._id === selectedClosetId)?.name}</span>
                        <span className="mx-1 text-slate-400">&rarr;</span>
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
                  3. Korak: Izbira police
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
                {/* Privzeto skladišče za uvoz */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Warehouse className="w-3.5 h-3.5 text-slate-500" />
                    <span>Privzeto skladišče za uvoz</span>
                  </label>
                  <select
                    value={importDefaultWarehouseId}
                    onChange={(e) => setImportDefaultWarehouseId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  >
                    {warehouses.map(w => (
                      <option key={w._id} value={w._id}>{w.name}</option>
                    ))}
                  </select>
                  <p className="text-[11px] text-slate-400 mt-1">
                    To skladišče bo uporabljeno, če v posamezni vrstici v Excelu stolpec "Skladišče" ni izpolnjen.
                  </p>
                </div>

                <div className="flex items-center justify-between pt-1">
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
                          <th className="p-2">Skladišče</th>
                          <th className="p-2">Omara</th>
                          <th className="p-2">Polica</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {importPreviewItems.map((item, idx) => {
                          const itemWhName = item.warehouseName || warehouses.find(w => String(w._id) === String(importDefaultWarehouseId))?.name || 'Glavno skladišče';
                          return (
                            <tr key={idx} className="hover:bg-slate-50">
                              <td className="p-2 text-slate-400 font-mono text-[11px]">{item.rowNumber || idx + 1}</td>
                              <td className="p-2 font-bold text-slate-800">{item.name}</td>
                              <td className="p-2">{item.quantity}</td>
                              <td className="p-2">{item.category}</td>
                              <td className="p-2">{item.branch}</td>
                              <td className="p-2 text-slate-700 font-medium">{itemWhName}</td>
                              <td className="p-2 text-slate-500">{item.closetName || '-'}</td>
                              <td className="p-2 text-slate-500">{item.shelfName || '-'}</td>
                            </tr>
                          );
                        })}
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

      {/* Plavajoči gumb za masovno urejanje izbranih artiklov - centriran na sredini ekrana */}
      {selectedArticleIds.length > 0 && (
        <div className="fixed bottom-18 md:bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-1.5 p-1.5 bg-slate-900/90 backdrop-blur-md rounded-full shadow-2xl border border-slate-700/80 animate-in slide-in-from-bottom-4 duration-200">
          <button
            type="button"
            onClick={() => {
              try {
                setBulkLocationAction('keep');
                setBulkWarehouseId(warehouses.length === 1 ? warehouses[0]._id : (selectedWarehouse !== 'all' ? selectedWarehouse : ''));
                setBulkClosetId('');
                setBulkShelfId('');
                setBulkBranchAction('keep');
                setBulkBranch('Vse veje');
                setBulkCategoryAction('keep');
                setBulkCategory('Razno');
                setBulkNewShelfName('');
                setBulkEditModalOpen(true);
              } catch (err) {
                console.error('Error opening bulk edit modal:', err);
              }
            }}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs sm:text-sm font-bold rounded-full shadow-md flex items-center gap-2 cursor-pointer transition-all"
          >
            <Layers className="w-4 h-4 shrink-0" />
            <span>Uredi ({selectedArticleIds.length})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              try {
                setSelectedArticleIds([]);
              } catch (err) {
                console.error('Error clearing selection:', err);
              }
            }}
            className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 active:scale-90 rounded-full transition-all cursor-pointer mr-1"
            title="Počisti izbor"
          >
            <X className="w-4 h-4 shrink-0" />
          </button>
        </div>
      )}

      {/* Modal za masovno urejanje izbranih artiklov */}
      {bulkEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full border border-slate-200 p-5 sm:p-6 space-y-5 my-8">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
                  Masovno urejanje
                </span>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 mt-0.5">
                  Urejanje {selectedArticleIds.length} izbranih artiklov
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Spremenila se bodo le polja, ki jih eksplicitno izberete spodaj. Ostala polja bodo ostala nespremenjena.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setBulkEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleBulkUpdate} className="space-y-4">
              {/* 1. Lokacija (Omara & Polica) */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-emerald-700" />
                    <span>Lokacija (Omara & Polica)</span>
                  </label>
                  <select
                    value={bulkLocationAction}
                    onChange={(e) => {
                      setBulkLocationAction(e.target.value);
                      if (e.target.value !== 'assign') {
                        setBulkClosetId('');
                        setBulkShelfId('');
                      }
                    }}
                    className="text-xs font-semibold bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  >
                    <option value="keep">Brez spremembe (Pusti obstoječe)</option>
                    <option value="assign">Določi novo lokacijo</option>
                    <option value="remove">Odstrani lokacijo (brez police)</option>
                  </select>
                </div>

                {bulkLocationAction === 'assign' && (
                  <div className="pt-2 border-t border-slate-200 space-y-2.5">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1 flex items-center gap-1">
                          <Warehouse className="w-3 h-3 text-slate-400" />
                          <span>1. Skladišče (filter):</span>
                        </label>
                        <select
                          value={bulkWarehouseId}
                          onChange={(e) => {
                            const newWhId = e.target.value;
                            setBulkWarehouseId(newWhId);
                            if (newWhId && bulkClosetId) {
                              const found = closets.find(c => c._id === bulkClosetId);
                              const cWhId = found?.warehouse?._id || found?.warehouse;
                              if (String(cWhId) !== String(newWhId)) {
                                setBulkClosetId('');
                                setBulkShelfId('');
                              }
                            }
                          }}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                        >
                          <option value="">Vsa skladišča (brez filtra)</option>
                          {warehouses.map(w => (
                            <option key={w._id} value={w._id}>{w.name}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1 flex items-center gap-1">
                          <Archive className="w-3 h-3 text-slate-400" />
                          <span>2. Omara:</span>
                        </label>
                        <select
                          value={bulkClosetId}
                          onChange={(e) => {
                            const closetId = e.target.value;
                            setBulkClosetId(closetId);
                            setBulkShelfId('');
                            if (closetId && !bulkWarehouseId) {
                              const found = closets.find(c => c._id === closetId);
                              const whId = found?.warehouse?._id || found?.warehouse;
                              if (whId) setBulkWarehouseId(String(whId));
                            }
                          }}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                        >
                          <option value="">-- Izberite omaro --</option>
                          {closets
                            .filter(c => !bulkWarehouseId || String(c.warehouse?._id || c.warehouse) === String(bulkWarehouseId))
                            .map(c => (
                              <option key={c._id} value={c._id}>
                                {c.name} {!bulkWarehouseId && c.warehouse?.name ? `(${c.warehouse.name})` : ''}
                              </option>
                            ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1 flex items-center gap-1">
                          <Layers className="w-3 h-3 text-slate-400" />
                          <span>3. Polica:</span>
                        </label>
                        <select
                          disabled={!bulkClosetId}
                          value={bulkShelfId}
                          onChange={(e) => setBulkShelfId(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 disabled:opacity-40 disabled:bg-slate-100"
                        >
                          <option value="">
                            {!bulkClosetId ? '-- Najprej omaro --' : '-- Izberite polico --'}
                          </option>
                          {shelves
                            .filter(s => (s.closet?._id || s.closet) === bulkClosetId)
                            .map(s => (
                              <option key={s._id} value={s._id}>{s.name}</option>
                            ))}
                        </select>
                      </div>
                    </div>

                    {/* Pregled izbrane lokacije */}
                    {bulkClosetId && (
                      <div className="text-[11px] font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg px-2.5 py-1.5 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="text-slate-500 font-semibold">Izbrana lokacija:</span>
                        <span className="font-bold text-slate-800">
                          {warehouses.find(w => String(w._id) === String(bulkWarehouseId))?.name || closets.find(c => c._id === bulkClosetId)?.warehouse?.name || 'Skladišče'}
                        </span>
                        <span className="text-slate-400">&rarr;</span>
                        <span className="font-bold text-emerald-900">{closets.find(c => c._id === bulkClosetId)?.name}</span>
                        {bulkShelfId && (
                          <>
                            <span className="text-slate-400">&rarr;</span>
                            <span className="font-bold text-emerald-800">{shelves.find(s => s._id === bulkShelfId)?.name}</span>
                          </>
                        )}
                      </div>
                    )}

                    {/* Hitro dodajanje nove police v tej omari */}
                    {bulkClosetId && (
                      <div className="flex items-center gap-1.5 pt-1">
                        <input
                          type="text"
                          placeholder="Ali ustvari novo polico v tej omari..."
                          value={bulkNewShelfName}
                          onChange={(e) => setBulkNewShelfName(e.target.value)}
                          className="flex-1 px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600"
                        />
                        <button
                          type="button"
                          onClick={handleBulkQuickCreateShelf}
                          disabled={bulkCreatingShelf || !bulkNewShelfName.trim()}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shrink-0 cursor-pointer"
                        >
                          {bulkCreatingShelf ? '...' : '+ Dodaj'}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 2. Skavtska veja */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-emerald-700" />
                    <span>Skavtska veja</span>
                  </label>
                  <select
                    value={bulkBranchAction}
                    onChange={(e) => setBulkBranchAction(e.target.value)}
                    className="text-xs font-semibold bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  >
                    <option value="keep">Brez spremembe (Pusti obstoječe)</option>
                    <option value="change">Določi novo vejo</option>
                  </select>
                </div>

                {bulkBranchAction === 'change' && (
                  <div className="pt-2 border-t border-slate-200">
                    <select
                      value={bulkBranch}
                      onChange={(e) => setBulkBranch(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    >
                      {SKAVT_BRANCHES.map(b => (
                        <option key={b.id} value={b.name}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* 3. Kategorija */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Tag className="w-4 h-4 text-emerald-700" />
                    <span>Kategorija</span>
                  </label>
                  <select
                    value={bulkCategoryAction}
                    onChange={(e) => setBulkCategoryAction(e.target.value)}
                    className="text-xs font-semibold bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  >
                    <option value="keep">Brez spremembe (Pusti obstoječe)</option>
                    <option value="change">Določi novo kategorijo</option>
                  </select>
                </div>

                {bulkCategoryAction === 'change' && (
                  <div className="pt-2 border-t border-slate-200">
                    <select
                      value={bulkCategory}
                      onChange={(e) => setBulkCategory(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    >
                      {ARTICLE_CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Gumbi za potrditev */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setBulkEditModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Prekliči
                </button>
                <button
                  type="submit"
                  disabled={bulkUpdating}
                  className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  {bulkUpdating ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Shranjujem...</span>
                    </>
                  ) : (
                    <span>Shrani za {selectedArticleIds.length} artiklov</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal za brisanje vseh artiklov z obvezno varnostno kopijo */}
      {deleteAllModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full border border-rose-200 p-5 sm:p-6 space-y-4 animate-in slide-in-from-bottom-4 duration-150">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-bold text-slate-900 leading-tight">
                  Ali res želite izbrisati VSE artikle?
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  V skladišču je trenutno <span className="font-bold text-slate-800">{articles.length}</span> artiklov. To dejanje bo trajno izpraznilo katalog v bazi podatkov.
                </p>
              </div>
            </div>

            {/* Korak 1: Obvezni prenos varnostne kopije */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
              <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                1. Korak: Varnostna kopija (Obvezno)
              </span>
              <p className="text-xs text-slate-600">
                Pred izbrisom morate prenesti Excel datoteko z vsemi trenutnimi artikli, da podatki ne bodo izgubljeni.
              </p>
              <button
                type="button"
                onClick={handleDownloadBackupAndConfirmDelete}
                className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  backupDownloaded
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs'
                }`}
              >
                {backupDownloaded ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-700" />
                    <span>✓ Varnostna kopija je prenesena</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Prenesi varnostno kopijo (Excel)</span>
                  </>
                )}
              </button>
            </div>

            {/* Korak 2: Vnos potrditvene besede */}
            <div className={`p-3.5 rounded-xl border space-y-2 transition-all ${
              backupDownloaded ? 'border-rose-200 bg-rose-50/50' : 'border-slate-200 bg-slate-50 opacity-40 pointer-events-none'
            }`}>
              <span className="text-[11px] font-bold text-rose-800 uppercase tracking-wider block">
                2. Korak: Potrditev izbrisa
              </span>
              <p className="text-xs text-rose-900">
                Za potrditev trajnega izbrisa vpišite z velikimi črkami: <span className="font-mono font-bold bg-rose-200 px-1 py-0.5 rounded text-rose-950">IZBRIŠI</span>
              </p>
              <input
                type="text"
                disabled={!backupDownloaded}
                placeholder="Vpišite IZBRIŠI..."
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-rose-300 rounded-xl text-xs font-bold text-rose-900 placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-rose-600"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setDeleteAllModalOpen(false);
                  setDeleteConfirmText('');
                  setBackupDownloaded(false);
                }}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Prekliči
              </button>
              <button
                type="button"
                disabled={!backupDownloaded || deleteConfirmText.trim().toUpperCase() !== 'IZBRIŠI' || deletingAll}
                onClick={handleExecuteDeleteAll}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                {deletingAll ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Brišem vse...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Trajno izbriši vse artikle</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
