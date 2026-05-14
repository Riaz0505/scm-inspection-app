import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { getApiUrl } from '../lib/api';

interface GarmentModelProps {
  type: 'tshirt' | 'shorts' | 'combo';
  onPartClick?: (part: string) => void;
  onHeatPointClick?: (part: string) => void;
  selectedParts: string[];
  interactive?: boolean;
  layoutImage?: string;
  frontImageUrl?: string;
  backImageUrl?: string;
  customPoints?: Point[];
  heatMapData?: Record<string, number>;
  heatMapDetails?: Record<string, Record<string, number>>;
  dualView?: boolean;
}

interface Point {
  id: string;
  label: string;
  x: number;
  y: number;
}

export const GarmentModel: React.FC<GarmentModelProps> = ({ 
  type, 
  onPartClick, 
  selectedParts, 
  interactive = true,
  layoutImage,
  frontImageUrl,
  backImageUrl,
  customPoints,
  heatMapData = {},
  heatMapDetails = {},
  onHeatPointClick,
  dualView = false
}) => {
  const [view, setView] = useState<'front' | 'back'>('front');

  const defaultFront = type === 'shorts' 
    ? "https://scmg-assets.s3.amazonaws.com/shorts_front.png" 
    : "https://scmg-assets.s3.amazonaws.com/tshirt_front.png";
  const defaultBack = type === 'shorts' 
    ? "https://scmg-assets.s3.amazonaws.com/shorts_back.png" 
    : "https://scmg-assets.s3.amazonaws.com/tshirt_back.png";

  const getHeatColor = (idOrLabel: string) => {
    const count = (heatMapData[idOrLabel] || 0) as number;
    if (count === 0) return null;
    if (count === 1) return '#fef08a';
    if (count === 2) return '#fde047';
    if (count === 3) return '#fbbf24';
    if (count === 4) return '#f59e0b';
    return '#7f1d1d';
  };

  const getHeatTextColor = (idOrLabel: string) => ((heatMapData[idOrLabel] || 0) as number) >= 3 ? 'white' : '#1e293b';

  const frontPoints: Point[] = [
    { id: 'FL', label: 'FRONT SHOULDER FULL WIDTH', x: 50, y: 12 },
    { id: 'FH', label: 'FRONT NECK WIDTH', x: 35, y: 17.5 },
    { id: 'FB', label: 'FRONT NECK / COLLAR', x: 50, y: 24 },
    { id: 'FI', label: 'FRONT NECK DROP', x: 50, y: 34 },
    { id: 'FA', label: 'FRONT SHOULDER', x: 22.5, y: 19 },
    { id: 'FD', label: 'FRONT ARMHOLE', x: 22.5, y: 45 },
    { id: 'FF', label: 'FRONT CHEST', x: 50, y: 45 },
    { id: 'FK', label: 'FRONT SLEEVE OPENING', x: 89, y: 45 },
    { id: 'FE', label: 'FRONT LEFT SIDE', x: 22.5, y: 67.5 },
    { id: 'FG', label: 'FRONT BOTTOM / HEM', x: 22.5, y: 90 },
    { id: 'FO', label: 'FRONT SWEEP WIDTH', x: 50, y: 91 },
  ];

  const backPoints: Point[] = [
    { id: 'BJ', label: 'BACK NECK DROP', x: 50, y: 14 },
    { id: 'BL', label: 'BACK SHOULDER FULL WIDTH', x: 50, y: 10 },
    { id: 'BA', label: 'BACK SHOULDER', x: 22.5, y: 19 },
    { id: 'BB', label: 'BACK NECK / COLLAR', x: 50, y: 22 },
    { id: 'BE', label: 'BACK LEFT SIDE', x: 22.5, y: 67.5 },
    { id: 'BO', label: 'BACK SWEEP WIDTH', x: 50, y: 91 },
  ];

  const shortsFrontPoints: Point[] = [
    { id: 'FW', label: 'FRONT WAISTBAND', x: 50, y: 10 },
    { id: 'FFR', label: 'FRONT RISE', x: 50, y: 45 },
    { id: 'FLL', label: 'FRONT LEFT LEG', x: 28, y: 75 },
    { id: 'FRL', label: 'FRONT RIGHT LEG', x: 72, y: 75 },
    { id: 'FH', label: 'FRONT HIP', x: 50, y: 25 },
    { id: 'FO', label: 'FRONT LEG OPENING', x: 28, y: 90 },
    { id: 'FS', label: 'FRONT SIDE SEAM', x: 15, y: 50 },
  ];

  const shortsBackPoints: Point[] = [
    { id: 'BW', label: 'BACK WAISTBAND', x: 50, y: 10 },
    { id: 'BBR', label: 'BACK RISE', x: 50, y: 40 },
    { id: 'BP', label: 'BACK POCKET', x: 30, y: 30 },
    { id: 'BS', label: 'BACK SIDE SEAM', x: 15, y: 50 },
  ];

  const hasMultipleSides = customPoints?.some(p => p.id.startsWith('F-')) && customPoints?.some(p => p.id.startsWith('B-'));
  const showToggle = !dualView && ((frontImageUrl && backImageUrl) || (!customPoints && !layoutImage) || hasMultipleSides);

  const getPointStatus = (pt: Point) => {
    const normalizedSelected = selectedParts.map(s => s.trim());
    const idLower = pt.id.trim();
    
    // Check both case-sensitive and case-insensitive for safety, 
    // but primarily use the ID which is now side-specific (FA, BA, etc)
    return {
      isSelected: normalizedSelected.some(s => idLower === s || idLower.toLowerCase() === s.toLowerCase()),
      hasHeat: (heatMapData[pt.id] || heatMapData[pt.label] || 0) > 0
    };
  };

  const totalDefectsCount = (Object.values(heatMapData) as number[]).reduce((a, b) => a + b, 0);

  const renderView = (side: 'front' | 'back', labelOverride?: string) => {
    const img = side === 'front' ? (frontImageUrl || layoutImage) : (backImageUrl || layoutImage);
    const resolved = img || (side === 'front' ? defaultFront : defaultBack);
    
    let sidePoints = customPoints 
      ? customPoints.filter(p => side === 'front' ? (!p.id.startsWith('B-') && !p.id.startsWith('BB') && !p.label.toUpperCase().startsWith('BACK')) : (!p.id.startsWith('F-') && !p.id.startsWith('FF') && !p.label.toUpperCase().startsWith('FRONT')))
      : (type === 'shorts' ? (side === 'front' ? shortsFrontPoints : shortsBackPoints) : (side === 'front' ? frontPoints : backPoints));

    return (
      <div className="flex-1 bg-slate-50 rounded-3xl border border-slate-200 relative overflow-hidden flex flex-col min-h-[400px] shadow-xl">
        <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-black font-mono text-slate-500 uppercase tracking-widest">{labelOverride || side.toUpperCase()}</span>
        </div>
        
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="relative w-full max-w-[450px] aspect-square">
             <AnimatePresence mode="wait">
               <motion.div key={side + resolved} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full h-full relative">
                 <img src={getApiUrl(resolved)} className="w-full h-full object-contain drop-shadow-2xl" alt={side} referrerPolicy="no-referrer" />
                 
                 {sidePoints.map(pt => {
                   const { isSelected, hasHeat } = getPointStatus(pt);
                   const heatColor = getHeatColor(pt.id) || getHeatColor(pt.label);
                   const defectCount = (heatMapData[pt.id] || heatMapData[pt.label] || 0) as number;
                   
                   return (
                     <motion.button
                       key={pt.id + pt.label}
                       whileHover={{ scale: 1.2, zIndex: 100 }}
                       whileTap={{ scale: 0.9 }}
                       onClick={() => onPartClick?.(pt.id)}
                       className={`group absolute -translate-x-1/2 -translate-y-1/2 w-9 h-9 sm:w-10 sm:h-10 rounded-full border-2 flex items-center justify-center transition-all ${
                         isSelected 
                          ? 'bg-primary border-primary text-white scale-110 shadow-lg ring-4 ring-primary/20' 
                          : (heatColor ? 'border-rose-300 shadow-md' : 'bg-white/90 border-slate-300 text-slate-500 shadow-sm')
                       }`}
                       style={{ 
                         left: `${pt.x}%`, 
                         top: `${pt.y}%`, 
                         backgroundColor: isSelected ? undefined : (heatColor || undefined), 
                         color: isSelected ? undefined : getHeatTextColor(pt.id) || getHeatTextColor(pt.label), 
                         zIndex: isSelected || hasHeat ? 60 : 50 
                       }}
                     >
                       <span className="text-[10px] sm:text-[11px] font-black font-mono">{pt.id}</span>
                       
                       {/* Rich Tooltip */}
                       <div className="absolute bottom-full mb-3 hidden group-hover:flex flex-col items-center bg-slate-900/95 text-white text-[9px] font-black font-mono px-3 py-1.5 rounded-xl backdrop-blur-sm min-w-[140px] max-w-[220px] z-[101] shadow-xl uppercase tracking-widest border border-slate-700 animate-in fade-in zoom-in-95 duration-200">
                          <span className="border-b border-white/20 pb-1 mb-1 w-full text-center">{pt.label}</span>
                          {defectCount > 0 && (
                            <div className="w-full space-y-1">
                              <div className="flex justify-between items-center text-rose-400 font-bold mb-1">
                                <span>{defectCount} Defects</span>
                                <span>{Math.round((defectCount / (totalDefectsCount || 1)) * 100)}%</span>
                              </div>
                              {(heatMapDetails[pt.id] || heatMapDetails[pt.label]) && (
                                <div className="flex flex-col gap-0.5 pt-1 border-t border-white/10">
                                  {Object.entries(heatMapDetails[pt.id] || heatMapDetails[pt.label])
                                    .sort(([, aCount], [, bCount]) => (bCount as number) - (aCount as number))
                                    .map(([sub, count]) => (
                                      <div key={sub} className="flex justify-between items-center gap-2">
                                        <span className="text-[7px] text-slate-400 truncate max-w-[80px]">{sub}</span>
                                        <span className="text-white text-[8px] font-bold">{count as number}</span>
                                      </div>
                                    ))}
                                </div>
                              )}
                            </div>
                          )}
                       </div>

                       {defectCount > 0 && !isSelected && (
                         <>
                           <div className="absolute inset-0 rounded-full bg-rose-500/20 animate-ping" />
                           <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-rose-600 text-white text-[9px] font-black flex items-center justify-center border-white border-2 shadow-sm">
                             {defectCount > 9 ? '9+' : defectCount}
                           </div>
                         </>
                       )}
                     </motion.button>
                   );
                 })}
               </motion.div>
             </AnimatePresence>
          </div>
        </div>

        <div className="px-6 py-4 bg-white/50 border-t border-slate-100 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
               <div className="w-2 h-2 rounded-full bg-[#fef08a]" />
               <div className="w-2 h-2 rounded-full bg-[#fde047]" />
               <div className="w-2 h-2 rounded-full bg-[#fbbf24]" />
               <div className="w-2 h-2 rounded-full bg-[#7f1d1d]" />
               <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter ml-1">Density Map</span>
            </div>
            <span className="text-[8px] font-mono text-slate-300">SCM-SYS-v2</span>
          </div>
        </div>
      </div>
    );
  };

  const legendPoints = dualView 
    ? [...(type === 'shorts' ? [...shortsFrontPoints, ...shortsBackPoints] : [...frontPoints, ...backPoints])]
    : (type === 'shorts' ? (view === 'front' ? shortsFrontPoints : shortsBackPoints) : (view === 'front' ? frontPoints : backPoints));

  const displayLegend = customPoints || legendPoints;

  // De-duplicate points for the legend list by id
  const uniqueLegendPoints: Point[] = [];
  const ids = new Set<string>();
  
  displayLegend.forEach(pt => {
    if (!ids.has(pt.id)) {
      ids.add(pt.id);
      uniqueLegendPoints.push(pt);
    }
  });

  uniqueLegendPoints.sort((a, b) => a.id.localeCompare(b.id));

  return (
    <div className={`flex flex-col ${dualView ? 'max-w-7xl' : 'max-w-5xl'} mx-auto w-full gap-6`}>
      <div className="flex flex-col lg:flex-row gap-6">
        <div className={`flex-1 flex flex-col ${dualView ? 'md:flex-row' : ''} gap-6 relative`}>
          {showToggle && (
            <div className="absolute top-4 right-4 flex bg-white/90 backdrop-blur-md p-1 rounded-xl border border-slate-200 z-[60] shadow-sm">
              <button onClick={() => setView('front')} className={`px-4 py-1.5 text-[10px] font-black uppercase rounded-lg ${view === 'front' ? 'bg-primary text-white' : 'text-slate-400'}`}>Front</button>
              <button onClick={() => setView('back')} className={`px-4 py-1.5 text-[10px] font-black uppercase rounded-lg ${view === 'back' ? 'bg-primary text-white' : 'text-slate-400'}`}>Back</button>
            </div>
          )}
          {!dualView ? renderView(view) : (
            <>
              {renderView('front', 'FRONT VIEW')}
              {renderView('back', 'BACK VIEW')}
            </>
          )}
        </div>

        {interactive && (
          <div className={`w-full ${dualView ? 'lg:w-80' : 'lg:w-72'} bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col h-fit sticky top-6`}>
             <div className="flex items-center gap-2 mb-6">
              <Info className="w-4 h-4 text-primary" />
              <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-900">Measure Points</h3>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-1 gap-2 overflow-y-auto max-h-[500px] pr-2 custom-scrollbar">
              {uniqueLegendPoints.map(pt => {
                const { isSelected } = getPointStatus(pt);
                return (
                  <button key={pt.id} onClick={() => onPartClick?.(pt.id)} className={`flex items-center justify-between p-3 rounded-2xl border-2 transition-all ${isSelected ? 'bg-primary/5 border-primary/20' : 'bg-white border-slate-50 hover:border-slate-100'}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black ${isSelected ? 'bg-primary text-white' : 'bg-slate-100 text-slate-400'}`}>{pt.id}</div>
                      <span className={`text-[10px] font-black uppercase ${isSelected ? 'text-primary' : 'text-slate-500'}`}>{pt.label}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
        <div className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest">
          <Info className="w-3 h-3" />
          Click points on the model or the list to select parts
        </div>
        <div className="text-[9px] font-mono text-emerald-500 font-bold uppercase tracking-widest">v2.1.0 // PROD-STABLE</div>
      </div>
    </div>
  );
};
