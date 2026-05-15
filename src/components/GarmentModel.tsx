import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, Info, X } from 'lucide-react';
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
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  const defaultFront = type === 'shorts' 
    ? "https://scmg-assets.s3.amazonaws.com/shorts_front.png" 
    : "https://scmg-assets.s3.amazonaws.com/tshirt_front.png";
  const defaultBack = type === 'shorts' 
    ? "https://scmg-assets.s3.amazonaws.com/shorts_back.png" 
    : "https://scmg-assets.s3.amazonaws.com/tshirt_back.png";

  // Determine images
  const frontImageToUse = frontImageUrl || layoutImage || defaultFront;
  const backImageToUse = backImageUrl || layoutImage || defaultBack;
  
  // Decide if we should show the toggle (only if not in dual view and we have multiple sides)
  const hasMultipleSides = customPoints?.some(p => p.id.startsWith('F-')) && customPoints?.some(p => p.id.startsWith('B-'));
  const showToggle = !dualView && ((frontImageUrl && backImageUrl) || (!customPoints && !layoutImage) || hasMultipleSides);


  // Find max count for normalization
  const heatMapValues = Object.values(heatMapData) as number[];
  const maxCount = heatMapValues.length > 0 ? Math.max(...heatMapValues) : 0;
  const totalDefectsCount = heatMapValues.reduce((a, b) => a + b, 0);

  const measurementPoints: Record<string, string> = {
    A: 'SHOULDER',
    B: 'NECK / COLLAR',
    C: 'RIGHT SIDE',
    D: 'ARMHOLE',
    E: 'LEFT SIDE',
    F: 'CHEST',
    G: 'BOTTOM / HEM',
    H: 'NECK WIDTH',
    I: 'FRONT NECK DROP',
    J: 'BACK NECK DROP',
    K: 'SLEEVE OPENING',
    L: 'SHOULDER FULL WIDTH',
    M: 'ARMHOLE DEPTH',
    N: 'BODY LENGTH (CB)',
    O: 'SWEEP WIDTH',
  };

  const frontPoints: Point[] = [
    { id: 'F-L', label: 'FRONT SHOULDER FULL WIDTH', x: 50, y: 12 },
    { id: 'F-H', label: 'FRONT NECK WIDTH', x: 35, y: 17.5 },
    { id: 'F-B', label: 'FRONT NECK / COLLAR', x: 50, y: 24 },
    { id: 'F-I', label: 'FRONT NECK DROP', x: 50, y: 34 },
    { id: 'F-A', label: 'FRONT SHOULDER', x: 22.5, y: 19 },
    { id: 'F-D', label: 'FRONT ARMHOLE', x: 22.5, y: 45 },
    { id: 'F-F', label: 'FRONT CHEST', x: 50, y: 45 },
    { id: 'F-K', label: 'FRONT SLEEVE OPENING', x: 89, y: 45 },
    { id: 'F-E', label: 'FRONT LEFT SIDE', x: 22.5, y: 67.5 },
    { id: 'F-G', label: 'FRONT BOTTOM / HEM', x: 22.5, y: 90 },
    { id: 'F-O', label: 'FRONT SWEEP WIDTH', x: 50, y: 91 },
  ];

  const backPoints: Point[] = [
    { id: 'B-J', label: 'BACK NECK DROP', x: 50, y: 14 },
    { id: 'B-L', label: 'BACK SHOULDER FULL WIDTH', x: 50, y: 10 },
    { id: 'B-A', label: 'BACK SHOULDER', x: 22.5, y: 19 },
    { id: 'B-B', label: 'BACK NECK / COLLAR', x: 50, y: 22 },
    { id: 'B-E', label: 'BACK LEFT SIDE', x: 22.5, y: 67.5 },
    { id: 'B-O', label: 'BACK SWEEP WIDTH', x: 50, y: 91 },
  ];

  const shortsFrontPoints: Point[] = [
    { id: 'F-W', label: 'FRONT WAISTBAND', x: 50, y: 10 },
    { id: 'F-FR', label: 'FRONT RISE', x: 50, y: 45 },
    { id: 'F-LL', label: 'FRONT LEFT LEG', x: 28, y: 75 },
    { id: 'F-RL', label: 'FRONT RIGHT LEG', x: 72, y: 75 },
    { id: 'F-H', label: 'FRONT HIP', x: 50, y: 25 },
    { id: 'F-O', label: 'FRONT LEG OPENING', x: 28, y: 90 },
    { id: 'F-S', label: 'FRONT SIDE SEAM', x: 15, y: 50 },
  ];

  const shortsBackPoints: Point[] = [
    { id: 'B-W', label: 'BACK WAISTBAND', x: 50, y: 10 },
    { id: 'B-BR', label: 'BACK RISE', x: 50, y: 40 },
    { id: 'B-P', label: 'BACK POCKET', x: 30, y: 30 },
    { id: 'B-S', label: 'BACK SIDE SEAM', x: 15, y: 50 },
  ];

  const getHeatColor = (pt: Point) => {
    const idCount = heatMapData[pt.id] || 0;
    const labelCount = heatMapData[pt.label] || 0;
    const count = idCount + labelCount;
    if (count === 0) return null;
    
    // Gradient: Light Yellow -> Orange -> Red
    if (count === 1) return '#fef08a'; // Yellow 200
    if (count === 2) return '#fde047'; // Yellow 300
    if (count === 3) return '#facc15'; // Yellow 400
    if (count === 4) return '#fbbf24'; // Amber 400
    if (count === 5) return '#f59e0b'; // Amber 500
    if (count === 6) return '#ea580c'; // Orange 600
    if (count === 7) return '#dc2626'; // Red 600
    if (count === 8) return '#b91c1c'; // Red 700
    return '#7f1d1d'; // Red 900
  };

  const getHeatTextColor = (pt: Point) => {
    const idCount = heatMapData[pt.id] || 0;
    const labelCount = heatMapData[pt.label] || 0;
    const count = idCount + labelCount;
    if (count >= 5) return 'white';
    return '#1e293b'; // Slate 900 for lighter heat colors
  };

  const rawPoints = customPoints 
    ? customPoints.filter(pt => {
        const id = pt.id.toUpperCase();
        const label = pt.label.toUpperCase();
        if (view === 'front') return !id.startsWith('B-') && !label.startsWith('BACK');
        if (view === 'back') return !id.startsWith('F-') && !label.startsWith('FRONT');
        return true;
      })
    : (type === 'shorts' 
      ? (view === 'front' ? shortsFrontPoints : shortsBackPoints)
      : (view === 'front' ? frontPoints : backPoints)
    );

  const currentPoints = rawPoints;

  const getPointStatus = (pt: Point) => {
    const normalizedSelected = selectedParts.map(s => s.toLowerCase().trim());
    const labelLower = pt.label.toLowerCase().trim();
    const idLower = pt.id.toLowerCase().trim();
    
    const isSelected = normalizedSelected.some(s => 
      idLower === s || 
      labelLower === s
    );
    
    const idCount = heatMapData[pt.id] || 0;
    const labelCount = heatMapData[pt.label] || 0;
    const hasHeat = (idCount > 0 || labelCount > 0);
    
    return { isSelected, hasHeat };
  };

  const renderSingleView = (side: 'front' | 'back', labelOverride?: string) => {
    const sideImage = side === 'front' ? (frontImageUrl || layoutImage) : (backImageUrl || layoutImage);
    const resolvedSideImage = sideImage || (side === 'front' ? defaultFront : defaultBack);
    
    const sidePoints = customPoints 
      ? customPoints.filter(pt => {
          const id = pt.id.toUpperCase();
          const label = pt.label.toUpperCase();
          if (side === 'front') return !id.startsWith('B-') && !label.startsWith('BACK');
          if (side === 'back') return !id.startsWith('F-') && !label.startsWith('FRONT');
          return true;
        })
      : (type === 'shorts' 
        ? (side === 'front' ? shortsFrontPoints : shortsBackPoints)
        : (side === 'front' ? frontPoints : backPoints)
      );

    return (
      <div 
        className={`flex-1 ${interactive ? (dualView ? 'min-h-[400px] sm:min-h-[500px]' : 'min-h-[450px] sm:min-h-[550px]') : 'min-h-[350px] sm:min-h-[400px]'} bg-slate-50 rounded-2xl sm:rounded-3xl relative flex flex-col ${interactive ? 'pt-8 sm:pt-12' : 'pt-6 sm:pt-8'} border border-slate-200 shadow-xl overflow-hidden`}
        onClick={() => !interactive && setActiveTooltip(null)}
      >
        <div className="absolute top-4 sm:top-6 left-4 sm:left-6 flex items-center gap-2 sm:gap-3 z-10">
          <div className={`w-2 h-2 sm:w-2.5 sm:h-2.5 ${selectedParts.length > 0 && !interactive ? 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]' : 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]'} rounded-full animate-pulse`} />
          <span className="text-[8px] sm:text-[10px] font-black font-mono text-slate-500 uppercase tracking-[0.2em] truncate max-w-[120px] sm:max-w-none">
            {interactive ? (labelOverride || side.toUpperCase()) : 'VISUAL-LOG'} // {side.toUpperCase()}
          </span>
        </div>

        <div className={`flex-1 flex items-center justify-center ${interactive ? 'p-4 sm:p-8' : 'p-4 sm:p-6'}`}>
          <div className={`relative w-full ${interactive ? 'max-w-[400px] sm:max-w-[500px]' : 'max-w-[300px] sm:max-w-[380px]'} aspect-square`}>
            <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
                 style={{ background: 'linear-gradient(90deg, #000 1px, transparent 1px) 0 0 / 20px 20px, linear-gradient(#000 1px, transparent 1px) 0 0 / 20px 20px' }} />
            
            <AnimatePresence mode="wait">
              <motion.div
                key={(sideImage || side) + type}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="w-full h-full relative"
              >
                {sideImage || type === 'shorts' ? (
                  <div className="w-full h-full flex items-center justify-center p-4">
                    <img 
                      key={resolvedSideImage}
                      src={getApiUrl(resolvedSideImage)} 
                      alt={`${side} view`} 
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-contain drop-shadow-[0_20px_40px_rgba(0,0,0,0.1)] transition-all duration-500" 
                    />
                  </div>
                ) : (
                  <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-[0_20px_40px_rgba(0,0,0,0.1)]">
                    <path
                      d={side === 'front' 
                        ? "M40,40 L60,40 L70,35 Q100,55 130,35 L140,40 L160,40 L190,80 L165,100 L155,90 L155,180 Q100,185 45,180 L45,90 L35,100 L10,80 Z"
                        : "M40,40 L60,40 L70,35 Q100,45 130,35 L140,40 L160,40 L190,80 L165,100 L155,90 L155,180 Q100,185 45,180 L45,90 L35,100 L10,80 Z"
                      }
                      fill="white"
                      stroke="#1e293b"
                      strokeWidth="2.5"
                    />
                    <g className="opacity-10 text-slate-900 font-mono">
                      <line x1="100" y1="0" x2="100" y2="200" stroke="currentColor" strokeWidth="0.5" strokeDasharray="4 4" />
                      <line x1="0" y1="90" x2="200" y2="90" stroke="currentColor" strokeWidth="0.5" strokeDasharray="4 4" />
                    </g>
                    <g className="opacity-40">
                      <line x1="45" y1="90" x2="155" y2="90" stroke="#64748b" strokeWidth="1" strokeDasharray="3 3" />
                      <line x1="100" y1="35" x2="100" y2="180" stroke="#64748b" strokeWidth="1" strokeDasharray="3 3" />
                      {side === 'front' && <path d="M70,35 Q100,65 130,35" fill="none" stroke="#64748b" strokeWidth="1" strokeDasharray="3 3" />}
                      {side === 'back' && <path d="M70,35 Q100,45 130,35" fill="none" stroke="#64748b" strokeWidth="1" strokeDasharray="3 3" />}
                    </g>
                  </svg>
                )}

                {sidePoints.map((pt) => {
                  const heatColor = getHeatColor(pt);
                  const { isSelected, hasHeat } = getPointStatus(pt);
                  const idCount = (heatMapData[pt.id] || 0) as number;
                  const labelCount = (heatMapData[pt.label] || 0) as number;
                  const defectCount = idCount + labelCount;
                  const isProminent = isSelected || hasHeat || interactive;
                  
                  // Merge details from both ID and Label for full history
                  const idDetails = heatMapDetails[pt.id] || {};
                  const labelDetails = heatMapDetails[pt.label] || {};
                  const mergedDetails: Record<string, number> = { ...labelDetails };
                  Object.entries(idDetails).forEach(([cat, count]) => {
                    mergedDetails[cat] = (mergedDetails[cat] || 0) + (count as number);
                  });

                  const isTooltipActive = activeTooltip === pt.id;
                  const showTooltipBelow = pt.y < 40; // If point is high up, show tooltip below it

                  return (
                    <motion.button
                      key={pt.id + pt.label}
                      type="button"
                      whileHover={{ scale: 1.25, zIndex: 110 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (interactive) {
                          onPartClick?.(pt.id);
                        } else if (defectCount > 0) {
                          if (activeTooltip === pt.id) {
                            setActiveTooltip(null);
                          } else {
                            setActiveTooltip(pt.id);
                          }
                      onHeatPointClick?.(pt.id);
                    }
                  }}
                  className={`group absolute -translate-x-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 flex items-center justify-center transition-all duration-300 shadow-xl ${
                    isSelected 
                      ? 'bg-primary border-primary text-white scale-110 ring-4 ring-primary/20 shadow-primary/30' 
                      : (heatColor ? 'border-rose-400 ring-2 ring-rose-100' : 'bg-white/90 border-slate-300 text-slate-500 shadow-md')
                  } ${!isProminent ? 'opacity-40 scale-90' : 'opacity-100'}`}
                  style={{ 
                    left: `${pt.x}%`, 
                    top: `${pt.y}%`, 
                    cursor: interactive || (!interactive && defectCount > 0) ? 'pointer' : 'default',
                    backgroundColor: isSelected ? undefined : (heatColor || undefined),
                    color: isSelected ? undefined : getHeatTextColor(pt),
                    zIndex: isSelected || hasHeat || isTooltipActive ? 150 : 10
                  }}
                >
                  <span className={`${isSelected ? 'text-[12px]' : 'text-[11px]'} font-black font-mono tracking-tighter`}>{pt.id}</span>
                  
                  {((interactive || defectCount > 0)) && (
                    <div className={`absolute left-1/2 -translate-x-1/2 flex flex-col items-center bg-white text-slate-900 text-[9px] font-black font-mono px-3 py-2.5 rounded-[20px] shadow-[0_20px_50px_rgba(0,0,0,0.15)] uppercase tracking-widest border border-slate-200 animate-in fade-in zoom-in-95 duration-200 transition-all ${
                      showTooltipBelow ? 'top-full mt-3' : 'bottom-full mb-3'
                    } ${
                      isTooltipActive ? 'flex opacity-100 scale-100 pointer-events-auto' : 'hidden md:group-hover:flex md:pointer-events-none'
                    }`}>
                      {/* Arrow pointing to node */}
                      <div className={`absolute left-1/2 -translate-x-1/2 border-8 border-transparent ${
                        showTooltipBelow ? 'bottom-full border-b-white' : 'top-full border-t-white'
                      }`} />

                      <div className="flex justify-between items-center w-full border-b border-slate-100 pb-2 mb-2">
                        <span className="flex-1 text-center text-[10px] text-slate-900 font-black">{pt.label}</span>
                        {isTooltipActive && (
                          <X className="w-4 h-4 ml-2 cursor-pointer hover:text-rose-500 md:hidden bg-slate-100 rounded-full p-1" onClick={(e) => {
                            e.stopPropagation();
                            setActiveTooltip(null);
                          }} />
                        )}
                      </div>
                      {defectCount > 0 && (
                        <div className="w-full space-y-2.5">
                          <div className="flex justify-between items-center text-rose-600 font-black mb-1 p-1.5 bg-rose-50 rounded-xl border border-rose-100">
                            <span>{defectCount} Defects</span>
                            <Badge className="bg-rose-500 text-white border-none h-4 text-[8px]">{Math.round((defectCount / (totalDefectsCount || 1)) * 100)}%</Badge>
                          </div>
                          
                          <div className="flex flex-col gap-1.5 pt-1">
                            {Object.entries(mergedDetails)
                              .sort(([, aCount], [, bCount]) => (bCount as number) - (aCount as number))
                              .map(([sub, count]) => {
                                const subCount = count as number;
                                return (
                                  <div key={sub} className="flex flex-col gap-1 group/item">
                                    <div className="flex justify-between items-center text-[8px] text-slate-500 font-bold">
                                      <span className="truncate max-w-[100px]">{sub}</span>
                                      <span className="text-primary">{subCount}</span>
                                    </div>
                                    <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                                      <div 
                                        className="h-full bg-primary/40 group-hover/item:bg-primary transition-all" 
                                        style={{ width: `${(subCount / defectCount) * 100}%` }}
                                      />
                                    </div>
                                  </div>
                                );
                              })}
                          </div>
                        </div>
                      )}
                        </div>
                      )}
                      
                      {defectCount > 0 && !isSelected && (
                        <>
                          <div className="absolute inset-0 rounded-full bg-rose-500/30 animate-ping" />
                          <div className={`absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center text-[9px] font-black z-[10] shadow-md ${defectCount >= 3 ? 'bg-rose-900 text-white' : 'bg-rose-600 text-white'}`}>
                            {defectCount > 99 ? '99+' : defectCount}
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

        {!dualView && (
          <div className="p-4 sm:p-6 border-t border-slate-200 bg-white/50 backdrop-blur-sm">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-sm bg-[#fef08a] border border-yellow-200" />
                  <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-sm bg-[#fde047] border border-yellow-300" />
                  <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-sm bg-[#fbbf24] border border-amber-400" />
                  <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-sm bg-[#ea580c] border border-orange-600" />
                  <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-sm bg-[#7f1d1d] border border-red-900" />
                </div>
                <span className="text-[7px] sm:text-[8px] font-black text-slate-400 uppercase tracking-widest text-center sm:text-left">Heat Map: Defect Frequency</span>
              </div>
              <div className="flex items-center gap-3 sm:gap-4">
                <span className="text-[8px] sm:text-[9px] font-bold font-mono text-slate-400 uppercase tracking-widest hidden xs:block">Model: SCM-v2</span>
                <span className="text-[8px] sm:text-[9px] font-bold font-mono text-emerald-500 uppercase tracking-widest animate-pulse">Secure.Link</span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (type === 'tshirt' || type === 'shorts' || layoutImage) {
    const legendPoints = customPoints || (type === 'shorts' ? [...shortsFrontPoints, ...shortsBackPoints] : [...frontPoints, ...backPoints]);

    return (
      <div className={`flex flex-col ${dualView ? 'max-w-7xl' : 'max-w-5xl'} mx-auto w-full gap-6`}>
        <div className={`flex flex-col ${dualView ? 'lg:flex-col' : 'lg:flex-row'} gap-4 sm:gap-6 w-full ${!interactive ? 'justify-center items-center' : ''}`}>
          {/* Models Container */}
          <div className={`flex-1 flex flex-col ${dualView ? 'md:flex-row' : ''} gap-4 sm:gap-6 relative w-full`}>
            {showToggle && (
              <div className="absolute top-4 sm:top-6 right-4 sm:right-6 flex bg-slate-100/80 backdrop-blur-md p-1 rounded-xl border border-slate-200 z-[60] shadow-sm">
                <button 
                  type="button"
                  onClick={() => {
                    setView('front');
                    setActiveTooltip(null);
                  }}
                  className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${view === 'front' ? 'bg-white text-primary shadow-sm border border-slate-100' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  Front
                </button>
                <button 
                  type="button"
                  onClick={() => {
                    setView('back');
                    setActiveTooltip(null);
                  }}
                  className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${view === 'back' ? 'bg-white text-primary shadow-sm border border-slate-100' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  Back
                </button>
              </div>
            )}

            {!dualView ? renderSingleView(view) : (
              <>
                {renderSingleView('front', 'FRONT VIEW')}
                {renderSingleView('back', 'BACK VIEW')}
              </>
            )}
          </div>

          {/* Legend Panel */}
          {interactive && (
            <div className={`w-full ${dualView ? 'lg:w-full' : 'lg:w-72'} bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200 shadow-sm flex flex-col ${dualView ? 'max-h-[500px]' : 'max-h-[400px] lg:max-h-none'}`}>
              <div className="flex items-center gap-2 mb-4 sm:mb-6">
                <Info className="w-3.5 h-3.5 sm:w-4 h-4 text-primary" />
                <h3 className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-slate-900">Measure Points</h3>
              </div>
            
              <div className={`flex-1 grid ${dualView ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4' : 'grid-cols-2 lg:grid-cols-1'} gap-2 overflow-y-auto pr-1 custom-scrollbar pb-2 lg:pb-4`}>
                {legendPoints.sort((a, b) => a.id.localeCompare(b.id)).map((pt) => {
                  const idCount = heatMapData[pt.id] || 0;
                  const labelCount = heatMapData[pt.label] || 0;
                  const count = idCount + labelCount;
                  const { isSelected } = getPointStatus(pt);
                  
                  return (
                    <button
                      key={pt.id + pt.label}
                      onClick={() => onPartClick?.(pt.id)}
                      className={`flex items-center justify-between p-3 rounded-2xl transition-all text-left group border-2 ${
                        isSelected 
                          ? 'bg-primary/5 border-primary/20 shadow-sm' 
                          : 'bg-white border-slate-50 hover:border-slate-200 hover:bg-slate-50/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-black transition-all ${
                          isSelected 
                            ? 'bg-primary text-white scale-110 shadow-md shadow-primary/20' 
                            : 'bg-slate-100 text-slate-400 group-hover:bg-primary/10 group-hover:text-primary'
                        }`}>
                          {pt.id}
                        </div>
                        <span className={`text-[10px] font-black uppercase tracking-wider transition-colors truncate ${
                          isSelected ? 'text-primary' : 'text-slate-500 group-hover:text-slate-900'
                        }`}>
                          {pt.label}
                        </span>
                      </div>
                      {count > 0 && (
                        <Badge variant="secondary" className="bg-rose-500 text-white text-[9px] font-black px-2 h-5 border-none shadow-sm shadow-rose-200">
                          {count}
                        </Badge>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {dualView && (
          <div className="p-4 sm:p-6 border border-slate-200 rounded-3xl bg-white/50 backdrop-blur-sm">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-sm bg-[#fef08a] border border-yellow-200" />
                  <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-sm bg-[#fde047] border border-yellow-300" />
                  <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-sm bg-[#fbbf24] border border-amber-400" />
                  <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-sm bg-[#ea580c] border border-orange-600" />
                  <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-sm bg-[#7f1d1d] border border-red-900" />
                </div>
                <span className="text-[7px] sm:text-[8px] font-black text-slate-400 uppercase tracking-widest text-center sm:text-left">Heat Map: Defect Frequency</span>
              </div>
              <div className="flex items-center gap-3 sm:gap-4">
                <span className="text-[8px] sm:text-[9px] font-bold font-mono text-slate-400 uppercase tracking-widest hidden xs:block">Model: SCM-v2.1</span>
                <span className="text-[8px] sm:text-[9px] font-bold font-mono text-emerald-500 uppercase tracking-widest animate-pulse">Secure.Link // DUAL-MODEL</span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full aspect-square flex items-center justify-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Model for {type} coming soon</p>
    </div>
  );
};
