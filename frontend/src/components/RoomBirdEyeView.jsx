import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  DoorOpen, 
  Layers, 
  Package, 
  Eye, 
  Info,
  Warehouse
} from 'lucide-react';

// Privzete relativne pozicije za omare v 2D sobi (ptičja perspektiva)
// Ko uporabnik doda več omar, se samodejno razporedijo ob stenah
const SLOT_PRESETS = [
  { id: 0, x: 8, y: 10, w: 26, h: 22, wall: 'Severna stena (Levo)', color: 'from-amber-700 to-amber-900', border: 'border-amber-600' },
  { id: 1, x: 38, y: 10, w: 26, h: 22, wall: 'Severna stena (Desno)', color: 'from-emerald-700 to-emerald-900', border: 'border-emerald-600' },
  { id: 2, x: 74, y: 10, w: 20, h: 36, wall: 'Vzhodna stena (Zgoraj)', color: 'from-blue-700 to-blue-900', border: 'border-blue-600' },
  { id: 3, x: 74, y: 52, w: 20, h: 36, wall: 'Vzhodna stena (Spodaj)', color: 'from-purple-700 to-purple-900', border: 'border-purple-600' },
  { id: 4, x: 8, y: 54, w: 22, h: 36, wall: 'Zahodna stena', color: 'from-orange-700 to-orange-900', border: 'border-orange-600' },
  { id: 5, x: 38, y: 72, w: 28, h: 18, wall: 'Južna stena (Ob vhodu)', color: 'from-teal-700 to-teal-900', border: 'border-teal-600' },
];

export default function RoomBirdEyeView({ closets = [], onAddCloset }) {
  const navigate = useNavigate();
  const [hoveredCloset, setHoveredCloset] = useState(null);

  return (
    <div className="w-full bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden flex flex-col">
      
      {/* Glava tlorisa z legendo in navodili */}
      <div className="bg-slate-900 text-white px-6 py-4 flex flex-wrap items-center justify-between gap-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-600/30 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
            <Warehouse className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white tracking-tight">
                Ptičja perspektiva skladišča (2D Tloris)
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Interaktivno
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Kliknite na poljubno omaro v prostoru za vpogled v police in artikle
            </p>
          </div>
        </div>

        {/* Legenda prostora */}
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5 text-slate-300">
            <span className="w-3 h-3 rounded-xs bg-amber-700/80 border border-amber-500"></span>
            <span>Omara / Regal</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-300">
            <span className="w-3 h-3 rounded-xs bg-emerald-950 border border-emerald-500/40"></span>
            <span>Miza za opremo</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-300">
            <DoorOpen className="w-4 h-4 text-emerald-400" />
            <span>Vhod</span>
          </div>
        </div>
      </div>

      {/* 2D Tloris Sobe (Bird's-Eye View Canvas) */}
      <div className="relative w-full aspect-16/10 sm:aspect-16/9 bg-slate-950 p-4 sm:p-8 select-none overflow-hidden">
        
        {/* Ozadje: Mrežna struktura tal (Arhitekturni načrt) */}
        <div 
          className="absolute inset-4 sm:inset-8 rounded-2xl border-4 border-slate-700 bg-slate-900 shadow-inner overflow-hidden"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(51, 65, 85, 0.25) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(51, 65, 85, 0.25) 1px, transparent 1px)
            `,
            backgroundSize: '24px 24px'
          }}
        >
          {/* Kompasna orientacija (sever/jug) */}
          <div className="absolute top-2.5 right-3 text-[10px] font-mono font-bold text-slate-500 tracking-wider flex items-center gap-1">
            <span>SEVER &uarr;</span>
          </div>

          {/* Vhodna vrata (Južna stena) */}
          <div className="absolute bottom-0 left-16 sm:left-24 -translate-x-1/2 flex flex-col items-center">
            {/* Lok vrat */}
            <div className="w-12 h-6 border-t-2 border-l-2 border-dashed border-emerald-400/80 rounded-tl-full -mb-1"></div>
            <div className="bg-emerald-600 text-slate-950 text-[10px] font-bold px-2 py-0.5 rounded-t-md flex items-center gap-1 shadow-md">
              <DoorOpen className="w-3 h-3" />
              <span>Glavni vhod</span>
            </div>
          </div>

          {/* Okno na zahodni steni */}
          <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-2 h-16 bg-sky-400/40 rounded border border-sky-300 flex items-center justify-center">
            <span className="text-[8px] text-sky-200 rotate-90 font-mono">OKNO</span>
          </div>

          {/* Okno na severni steni */}
          <div className="absolute top-0 right-1/4 -translate-y-1/2 w-16 h-2 bg-sky-400/40 rounded border border-sky-300 flex items-center justify-center">
            <span className="text-[8px] text-sky-200 font-mono">OKNO</span>
          </div>

          {/* Sredinska delovna miza za pregled opreme */}
          <div 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[30%] h-[24%] rounded-xl bg-slate-800/90 border-2 border-slate-600 shadow-xl flex flex-col items-center justify-center p-2 text-center pointer-events-none"
          >
            <div className="w-full h-full border border-dashed border-slate-600/70 rounded-lg flex flex-col items-center justify-center">
              <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                Delovna miza
              </span>
              <span className="text-[9px] text-slate-500 hidden sm:block">
                Pregled & pakiranje opreme
              </span>
            </div>
          </div>

          {/* Omare v prostoru */}
          {closets.map((closet, index) => {
            const slot = SLOT_PRESETS[index % SLOT_PRESETS.length];
            const isHovered = hoveredCloset?._id === closet._id;
            const shelfCount = closet.shelvesCount || closet.shelves?.length || 0;
            const articleCount = closet.articlesCount || 0;

            return (
              <div
                key={closet._id}
                onClick={() => navigate(`/omara/${closet._id}`)}
                onMouseEnter={() => setHoveredCloset(closet)}
                onMouseLeave={() => setHoveredCloset(null)}
                style={{
                  left: `${slot.x}%`,
                  top: `${slot.y}%`,
                  width: `${slot.w}%`,
                  height: `${slot.h}%`,
                }}
                className={`absolute cursor-pointer transition-all duration-200 rounded-xl p-1.5 flex flex-col justify-between group shadow-lg ${
                  isHovered 
                    ? 'scale-105 z-30 ring-4 ring-emerald-400 shadow-2xl' 
                    : 'z-10 hover:z-20'
                } bg-gradient-to-br ${slot.color} border-2 ${slot.border}`}
              >
                {/* Notranja struktura omare (police vidne od zgoraj) */}
                <div className="w-full h-full flex flex-col justify-between border border-white/20 rounded-lg p-2 bg-black/20 backdrop-blur-xs relative overflow-hidden">
                  
                  {/* Dekorativne črte polic od zgoraj */}
                  <div className="absolute inset-0 flex flex-col justify-evenly opacity-15 pointer-events-none">
                    <div className="h-0.5 bg-white w-full"></div>
                    <div className="h-0.5 bg-white w-full"></div>
                    <div className="h-0.5 bg-white w-full"></div>
                  </div>

                  {/* Zgornji del: Ime omare */}
                  <div className="relative z-10 flex items-start justify-between gap-1">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1 text-[10px] text-white/80 font-mono">
                        <span>#{(index + 1).toString().padStart(2, '0')}</span>
                        <span className="truncate opacity-75 hidden sm:inline">{closet.location || slot.wall}</span>
                      </div>
                      <h3 className="text-xs sm:text-sm font-black text-white truncate tracking-tight group-hover:text-emerald-300 transition-colors">
                        {closet.name}
                      </h3>
                    </div>

                    <div className="shrink-0 w-6 h-6 rounded-md bg-white/15 flex items-center justify-center text-white/90 group-hover:bg-emerald-400 group-hover:text-slate-950 transition-all">
                      <Eye className="w-3.5 h-3.5" />
                    </div>
                  </div>

                  {/* Spodnji del: Značke polic in artiklov */}
                  <div className="relative z-10 flex items-center gap-1.5 mt-1 flex-wrap">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-black/40 text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
                      <Layers className="w-3 h-3" />
                      <span>{shelfCount} {shelfCount === 1 ? 'polica' : shelfCount === 2 ? 'polici' : 'polic'}</span>
                    </span>

                    {articleCount > 0 && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-black/40 text-amber-300 border border-amber-400/30 flex items-center gap-1 hidden sm:flex">
                        <Package className="w-3 h-3" />
                        <span>{articleCount} art.</span>
                      </span>
                    )}
                  </div>

                </div>

                {/* Indikator ob kliku */}
                <div className="absolute inset-0 rounded-xl bg-emerald-500/0 group-hover:bg-emerald-500/10 transition-colors pointer-events-none"></div>
              </div>
            );
          })}

          {/* Če še ni omar */}
          {closets.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-20">
              <Warehouse className="w-12 h-12 text-slate-600 mb-3" />
              <h3 className="text-base font-bold text-slate-300">V skladišču še ni postavljenih omar</h3>
              <p className="text-xs text-slate-500 max-w-sm mt-1 mb-4">
                Kliknite spodnji gumb in dodajte prvo omaro ali regal v tloris skladišča.
              </p>
              {onAddCloset && (
                <button
                  onClick={onAddCloset}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg transition-all"
                >
                  + Dodaj prvo omaro
                </button>
              )}
            </div>
          )}

        </div>

      </div>

      {/* Spodnji status bar s podrobnostmi izbrane omare */}
      <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-emerald-700 shrink-0" />
          {hoveredCloset ? (
            <span>
              Izbrana omara: <strong className="text-slate-900">{hoveredCloset.name}</strong> 
              {hoveredCloset.location ? ` (${hoveredCloset.location})` : ''} &bull; Kliknite za odprtje polic!
            </span>
          ) : (
            <span>
              Postavite miškin kazalec nad omaro za hiter predogled ali kliknite nanjo za vstop v njeno vsebino.
            </span>
          )}
        </div>

        <span className="font-semibold text-emerald-800">
          Skupaj omar v prostoru: {closets.length}
        </span>
      </div>

    </div>
  );
}
