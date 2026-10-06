export const ARTICLE_CATEGORIES = [
  'Ustvarjanje',
  'Orodje',
  'Šotori & tabor',
  'Kuhinja',
  'Igre & rekviziti',
  'Pionirstvo',
  'Prva pomoč',
  'Tisk & pisarna',
  'Razno'
];

export const SKAVT_BRANCHES = [
  { id: 'Vse veje', name: 'Vse veje', color: 'bg-slate-100 text-slate-700 border-slate-200' },
  { id: 'Bobri (BB)', name: 'Bobri (BB)', color: 'bg-amber-100 text-amber-900 border-amber-300' },
  { id: 'Volčiči (VV)', name: 'Volčiči (VV)', color: 'bg-yellow-100 text-yellow-900 border-yellow-300' },
  { id: 'Izvidniki (IV)', name: 'Izvidniki (IV)', color: 'bg-emerald-100 text-emerald-900 border-emerald-300' },
  { id: 'Popotniki (PP)', name: 'Popotniki (PP)', color: 'bg-rose-100 text-rose-900 border-rose-300' },
  { id: 'Voditelji (VOD)', name: 'Voditelji (VOD)', color: 'bg-sky-100 text-sky-900 border-sky-300' }
];

export const getBranchColor = (branchName) => {
  const found = SKAVT_BRANCHES.find(b => b.id === branchName || b.name === branchName);
  return found ? found.color : 'bg-slate-100 text-slate-700 border-slate-200';
};
