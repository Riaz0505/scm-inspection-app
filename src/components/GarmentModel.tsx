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
  onHeatPointClick
}) => {
  const [view, setView] = useState<'front' | 'back'>('front');

  // Determine current image
  const currentImage = view === 'front' ? (frontImageUrl || layoutImage) : (backImageUrl || layoutImage);
  
  // Decide if we should show the toggle (only if we have back image or layout image + default behavior)
  const showToggle = (frontImageUrl && backImageUrl) || (!customPoints && !layoutImage);

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
    { id: 'L', label: 'SHOULDER FULL WIDTH', x: 50, y: 12 },
    { id: 'H', label: 'NECK WIDTH', x: 35, y: 17.5 },
    { id: 'B', label: 'NECK / COLLAR', x: 50, y: 24 },
    { id: 'I', label: 'FRONT NECK DROP', x: 50, y: 34 },
    { id: 'A', label: 'SHOULDER', x: 22.5, y: 19 },
    { id: 'D', label: 'ARMHOLE', x: 22.5, y: 45 },
    { id: 'F', label: 'CHEST', x: 50, y: 45 },
    { id: 'K', label: 'SLEEVE OPENING', x: 89, y: 45 },
    { id: 'E', label: 'LEFT SIDE', x: 22.5, y: 67.5 },
    { id: 'G', label: 'BOTTOM / HEM', x: 22.5, y: 90 },
    { id: 'O', label: 'SWEEP WIDTH', x: 50, y: 91 },
  ];

  const backPoints: Point[] = [
    { id: 'J', label: 'BACK NECK DROP', x: 50, y: 14 },
    { id: 'L', label: 'SHOULDER FULL WIDTH', x: 50, y: 10 },
    { id: 'A', label: 'SHOULDER', x: 22.5, y: 19 },
    { id: 'B', label: 'NECK / COLLAR', x: 50, y: 22 },
    { id: 'E', label: 'LEFT SIDE', x: 22.5, y: 67.5 },
    { id: 'O', label: 'SWEEP WIDTH', x: 50, y: 91 },
  ];

  const shortsFrontPoints: Point[] = [
    { id: 'W', label: 'WAISTBAND', x: 50, y: 10 },
    { id: 'FR', label: 'FRONT RISE', x: 50, y: 45 },
    { id: 'LL', label: 'LEFT LEG', x: 28, y: 75 },
    { id: 'RL', label: 'RIGHT LEG', x: 72, y: 75 },
    { id: 'H', label: 'HIP', x: 50, y: 25 },
    { id: 'O', label: 'LEG OPENING', x: 28, y: 90 },
    { id: 'S', label: 'SIDE SEAM', x: 15, y: 50 },
  ];

  const shortsBackPoints: Point[] = [
    { id: 'W', label: 'WAISTBAND', x: 50, y: 10 },
    { id: 'BR', label: 'BACK RISE', x: 50, y: 40 },
    { id: 'P', label: 'BACK POCKET', x: 30, y: 30 },
    { id: 'S', label: 'SIDE SEAM', x: 15, y: 50 },
  ];

  const getHeatColor = (label: string) => {
    const count = heatMapData[label] || 0;
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

  const getHeatTextColor = (label: string) => {
    const count = heatMapData[label] || 0;
    if (count >= 5) return 'white';
    return '#1e293b'; // Slate 900 for lighter heat colors
  };

  const rawPoints = customPoints || 
    (type === 'shorts' 
      ? (view === 'front' ? shortsFrontPoints : shortsBackPoints)
      : (view === 'front' ? frontPoints : backPoints)
    );

  const currentPoints = rawPoints;

  const getPointStatus = (pt: Point) => {
    const normalizedSelected = selectedParts.map(s => s.toLowerCase().trim());
    const labelLower = pt.label.toLowerCase().trim();
    const idLower = pt.id.toLowerCase().trim();
    
    // Strict matching only to prevent accidental partial matches
    const isSelected = normalizedSelected.some(s => 
      labelLower === s || 
      idLower === s
    );
    
    const hasHeat = (heatMapData[pt.label] && heatMapData[pt.label] > 0);
    
    return { isSelected, hasHeat };
  };

  if (type === 'tshirt' || type === 'shorts' || layoutImage) {
    return (
      <div className={`flex flex-col lg:flex-row gap-4 sm:gap-6 w-full max-w-5xl mx-auto ${!interactive ? 'justify-center' : ''}`}>
        {/* Model Display */}
        <div className={`flex-1 ${interactive ? 'min-h-[400px] sm:min-h-[500px]' : 'min-h-[350px] sm:min-h-[400px]'} bg-slate-50 rounded-2xl sm:rounded-3xl relative flex flex-col ${interactive ? 'pt-8 sm:pt-12' : 'pt-6 sm:pt-8'} border border-slate-200 shadow-xl overflow-hidden`}>
          <div className="absolute top-4 sm:top-6 left-4 sm:left-6 flex items-center gap-2 sm:gap-3 z-10">
            <div className={`w-2 h-2 sm:w-2.5 sm:h-2.5 ${selectedParts.length > 0 && !interactive ? 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]' : 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]'} rounded-full animate-pulse`} />
            <span className="text-[8px] sm:text-[10px] font-black font-mono text-slate-500 uppercase tracking-[0.2em] truncate max-w-[120px] sm:max-w-none">
              {interactive ? 'INST-TERM' : 'VISUAL-LOG'} // {view.toUpperCase()}
            </span>
          </div>

          {showToggle && (
            <div className="absolute top-4 sm:top-6 right-4 sm:right-6 flex bg-slate-100/80 backdrop-blur-md p-1 rounded-xl border border-slate-200 z-[60] shadow-sm">
              <button 
                type="button"
                onClick={() => setView('front')}
                className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${view === 'front' ? 'bg-white text-primary shadow-sm border border-slate-100' : 'text-slate-400 hover:text-slate-600'}`}
              >
                Front
              </button>
              <button 
                type="button"
                onClick={() => setView('back')}
                className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${view === 'back' ? 'bg-white text-primary shadow-sm border border-slate-100' : 'text-slate-400 hover:text-slate-600'}`}
              >
                Back
              </button>
            </div>
          )}

          <div className={`flex-1 flex items-center justify-center ${interactive ? 'p-6 sm:p-12' : 'p-4 sm:p-6'}`}>
            {/* Aspect Ratio Container for precise mapping */}
            <div className={`relative w-full ${interactive ? 'max-w-[420px] sm:max-w-[520px]' : 'max-w-[300px] sm:max-w-[380px]'} aspect-square`}>
              {/* Technical Grid Background */}
              <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
                   style={{ background: 'linear-gradient(90deg, #000 1px, transparent 1px) 0 0 / 20px 20px, linear-gradient(#000 1px, transparent 1px) 0 0 / 20px 20px' }} />
              
              <AnimatePresence mode="wait">
                <motion.div
                  key={(currentImage || view) + type}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.05 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  className="w-full h-full relative"
                >
                  {currentImage || type === 'shorts' ? (
                    <div className="w-full h-full flex items-center justify-center p-4">
                      <img 
                        key={currentImage || view}
                        src={getApiUrl(currentImage || (view === 'front' ? "https://scmg-assets.s3.amazonaws.com/shorts_front.png" : "https://scmg-assets.s3.amazonaws.com/shorts_back.png"))} 
                        alt="Garment Layout" 
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-contain drop-shadow-[0_20px_40px_rgba(0,0,0,0.1)]" 
                      />
                    </div>
                  ) : (
                    /* T-Shirt SVG Diagram */
                    <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-[0_20px_40px_rgba(0,0,0,0.1)]">
                      {/* T-shirt Outline */}
                      <path
                        d={view === 'front' 
                          ? "M40,40 L60,40 L70,35 Q100,55 130,35 L140,40 L160,40 L190,80 L165,100 L155,90 L155,180 Q100,185 45,180 L45,90 L35,100 L10,80 Z"
                          : "M40,40 L60,40 L70,35 Q100,45 130,35 L140,40 L160,40 L190,80 L165,100 L155,90 L155,180 Q100,185 45,180 L45,90 L35,100 L10,80 Z"
                        }
                        fill="white"
                        stroke="#1e293b"
                        strokeWidth="2.5"
                      />
                      
                      {/* Technical Crosshairs & Guide lines */}
                      <g className="opacity-10 text-slate-900 font-mono">
                        <line x1="100" y1="0" x2="100" y2="200" stroke="currentColor" strokeWidth="0.5" strokeDasharray="4 4" />
                        <line x1="0" y1="90" x2="200" y2="90" stroke="currentColor" strokeWidth="0.5" strokeDasharray="4 4" />
                      </g>

                      {/* Measurement Lines (Visual only) */}
                      <g className="opacity-40">
                        <line x1="45" y1="90" x2="155" y2="90" stroke="#64748b" strokeWidth="1" strokeDasharray="3 3" />
                        <line x1="100" y1="35" x2="100" y2="180" stroke="#64748b" strokeWidth="1" strokeDasharray="3 3" />
                        {view === 'front' && <path d="M70,35 Q100,65 130,35" fill="none" stroke="#64748b" strokeWidth="1" strokeDasharray="3 3" />}
                        {view === 'back' && <path d="M70,35 Q100,45 130,35" fill="none" stroke="#64748b" strokeWidth="1" strokeDasharray="3 3" />}
                      </g>
                    </svg>
                  )}

                    {/* Interactive Nodes */}
                    {currentPoints.map((pt) => {
                      const heatColor = getHeatColor(pt.label);
                      const { isSelected, hasHeat } = getPointStatus(pt);
                      const defectCount = heatMapData[pt.label] || 0;
                      const isProminent = isSelected || hasHeat || interactive;

                      return (
                        <motion.button
                          key={pt.id}
                          type="button"
                          whileHover={{ scale: 1.25, zIndex: 100 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => {
                            if (interactive) {
                              onPartClick?.(pt.label);
                            } else if (defectCount > 0) {
                              onHeatPointClick?.(pt.label);
                            }
                          }}
                          className={`group absolute -translate-x-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 flex items-center justify-center transition-all duration-300 shadow-lg ${
                            isSelected 
                              ? 'bg-primary border-primary text-white scale-110 ring-4 ring-primary/20' 
                              : (heatColor ? 'border-rose-300' : 'bg-white/90 border-slate-300 text-slate-500 shadow-md')
                          } ${!isProminent ? 'opacity-40 scale-90' : 'opacity-100'}`}
                          style={{ 
                            left: `${pt.x}%`, 
                            top: `${pt.y}%`, 
                            cursor: interactive || (!interactive && defectCount > 0) ? 'pointer' : 'default',
                            backgroundColor: isSelected ? undefined : (heatColor || undefined),
                            color: isSelected ? undefined : getHeatTextColor(pt.label),
                            zIndex: isSelected || hasHeat ? 60 : 10
                          }}
                        >
                          <span className={`${isSelected ? 'text-[12px]' : 'text-[11px]'} font-black font-mono tracking-tighter`}>{pt.id}</span>
                          
                          {/* Technical Tooltip */}
                          {(interactive || defectCount > 0) && (
                            <div className="absolute bottom-full mb-3 hidden group-hover:flex flex-col items-center bg-slate-900/95 text-white text-[9px] font-black font-mono px-3 py-1.5 rounded-xl backdrop-blur-sm min-w-[140px] max-w-[220px] z-[101] shadow-xl uppercase tracking-widest border border-slate-700 animate-in fade-in zoom-in-95 duration-200">
                              <span className="border-b border-white/20 pb-1 mb-1 w-full text-center">{pt.label}</span>
                              {defectCount > 0 && (
                                <div className="w-full space-y-1">
                                  <div className="flex justify-between items-center text-rose-400 font-bold mb-1">
                                    <span>{defectCount} Defects</span>
                                    <span>{Math.round((defectCount / (totalDefectsCount || 1)) * 100)}%</span>
                                  </div>
                                  {heatMapDetails[pt.label] && (
                                    <div className="flex flex-col gap-0.5 pt-1 border-t border-white/10">
                                      {Object.entries(heatMapDetails[pt.label])
                                        .sort(([, aCount], [, bCount]) => (bCount as number) - (aCount as number))
                                        .map(([sub, count]) => {
                                          const subCount = count as number;
                                          return (
                                            <div key={sub} className="flex justify-between items-center gap-2">
                                              <span className="text-[7px] text-slate-400 truncate max-w-[80px]">{sub}</span>
                                              <div className="flex items-center gap-1.5">
                                                 <span className="text-white text-[8px] font-bold">{Math.round((subCount / defectCount) * 100)}%</span>
                                                 <span className="text-slate-500 shrink-0">({subCount})</span>
                                              </div>
                                            </div>
                                          );
                                        })}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                          
                          {/* Heat Indicator Dot (if not selected) */}
                          {defectCount > 0 && !isSelected && (
                            <>
                              <div className="absolute inset-0 rounded-full bg-rose-500/30 animate-ping" />
                              <div className={`absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center text-[9px] font-black z-[10] shadow-md ${defectCount >= 3 ? 'bg-rose-900 text-white' : 'bg-rose-600 text-white'}`}>
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
        </div>

        {/* Legend Panel */}
        {interactive && (
          <div className="w-full lg:w-72 bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200 shadow-sm flex flex-col max-h-[400px] lg:max-h-none">
          <div className="flex items-center gap-2 mb-4 sm:mb-6">
            <Info className="w-3.5 h-3.5 sm:w-4 h-4 text-primary" />
            <h3 className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-slate-900">Points</h3>
          </div>
          
            <div className="flex-1 grid grid-cols-2 lg:grid-cols-1 gap-2 overflow-y-auto pr-1 custom-scrollbar pb-2 lg:pb-4">
              {[...currentPoints].sort((a, b) => a.id.localeCompare(b.id)).map((pt) => {
                const count = heatMapData[pt.label] || 0;
                
                const normalizedSelected = selectedParts.map(s => s.toLowerCase().trim());
                const labelLower = pt.label.toLowerCase().trim();
                const idLower = pt.id.toLowerCase().trim();

                const isSelected = normalizedSelected.some(s => 
                  labelLower === s || 
                  idLower === s
                );
                
                return (
                  <button
                    key={pt.id}
                    onClick={() => onPartClick?.(pt.label)}
                    className={`w-full flex items-center justify-between p-3 rounded-2xl transition-all text-left group border-2 ${
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
                      <span className={`text-[10px] font-black uppercase tracking-wider transition-colors ${
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
  );
}

  return (
    <div className="w-full aspect-square flex items-center justify-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Model for {type} coming soon</p>
    </div>
  );
};
