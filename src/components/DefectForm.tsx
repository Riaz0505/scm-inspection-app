import React, { useState } from 'react';
import { DefectCategory, DefectSubCategory, SelectedDefect } from '../types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, CheckCircle2, Trash2, Plus, ClipboardList, Send, AlertCircle, X, Loader2, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';

interface DefectFormProps {
  parts: string[];
  categories: DefectCategory[];
  onSubmit: (selectedDefects: SelectedDefect[], notes: string, operation: string, operatorName: string) => void;
  onCancel: () => void;
  onReset: () => void;
  initialOperation?: string;
  initialOperatorName?: string;
}

export const DefectForm: React.FC<DefectFormProps> = ({ 
  parts, 
  categories, 
  onSubmit, 
  onCancel, 
  onReset,
  initialOperation = '',
  initialOperatorName = ''
}) => {
  const [selectedCategory, setSelectedCategory] = useState<DefectCategory | null>(null);
  const [basket, setBasket] = useState<SelectedDefect[]>([]);
  const [notes, setNotes] = useState('');
  const [operation, setOperation] = useState(initialOperation);
  const [operatorName, setOperatorName] = useState(initialOperatorName);
  const [activePart, setActivePart] = useState<string>(parts[0] || '');
  const [previewSub, setPreviewSub] = useState<DefectSubCategory | null>(null);

  // Keep activePart updated if parts change
  React.useEffect(() => {
    if (parts.length > 0 && !parts.includes(activePart)) {
      setActivePart(parts[0]);
    }
    // Always reset category when switching parts as requested
    setSelectedCategory(null);
  }, [parts, activePart]);

  const handleCategorySelect = (cat: DefectCategory) => {
    setSelectedCategory(cat);
  };

  const [uploadingId, setUploadingId] = useState<string | null>(null);

  const handleDefectImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, part: string, cat: string, sub: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const uploadKey = `${part}-${cat}-${sub}`;
    setUploadingId(uploadKey);

    const formData = new FormData();
    formData.append('image', file);

    try {
      const resp = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await resp.json();
      if (resp.ok) {
        setBasket(prev => prev.map(item => 
          (item.part === part && item.category === cat && item.subCategory === sub)
            ? { ...item, imageUrl: data.imageUrl }
            : item
        ));
        toast.success('Proof photo uploaded');
      }
    } catch (err) {
      toast.error('Failed to upload proof');
    } finally {
      setUploadingId(null);
    }
  };

  const toggleSub = (sub: DefectSubCategory) => {
    if (!selectedCategory || !activePart) {
      if (!activePart && parts.length > 0) setActivePart(parts[0]);
      return;
    }
    
    setBasket(prev => {
      const exists = prev.find(item => 
        item.category === selectedCategory.name && 
        item.subCategory === sub.name && 
        item.part === activePart
      );

      if (exists) {
        // Remove
        return prev.filter(item => 
          !(item.category === selectedCategory.name && item.subCategory === sub.name && item.part === activePart)
        );
      } else {
        // Add
        return [...prev, {
          category: selectedCategory.name,
          subCategory: sub.name,
          imageUrl: sub.imageUrl, // Default placeholder, can be replaced by upload
          part: activePart
        }];
      }
    });
  };

  const removeFromBasket = (catName: string, subName: string, partName: string) => {
    setBasket(prev => prev.filter(item => !(item.category === catName && item.subCategory === subName && item.part === partName)));
  };

  const handleSubmit = () => {
    if (basket.length === 0) {
      toast.error('Please select at least one defect');
      return;
    }
    if (!operation.trim() || !operatorName.trim()) {
      toast.error('Please enter Operation and Operator Name');
      return;
    }
    onSubmit(basket, notes, operation, operatorName);
  };

  const isSubInBasketForActive = (catName: string, subName: string) => {
    if (!activePart) return false;
    return basket.some(item => item.category === catName && item.subCategory === subName && item.part === activePart);
  };

  const isSubInBasketAnywhere = (catName: string, subName: string) => {
    return basket.some(item => item.category === catName && item.subCategory === subName);
  };

  // Logic to display current log grouped by part
  const groupedLog = basket.reduce((acc, item) => {
    if (!acc[item.part]) acc[item.part] = [];
    acc[item.part].push(item);
    return acc;
  }, {} as Record<string, SelectedDefect[]>);

  return (
    <div className="w-full h-full flex flex-col bg-white overflow-hidden relative z-[1000]">
      {/* Target Points Selection Info (Header) - Fixed at top */}
      <div className="px-6 py-5 border-b border-slate-100 bg-white shadow-sm flex-shrink-0 z-[1010] relative">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
               <div className="w-1.5 h-6 bg-primary rounded-full shadow-[0_0_10px_rgba(var(--primary-rgb),0.4)]" />
               <div className="flex flex-col">
                 <h3 className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.2em] text-slate-900 leading-none">Marked Points</h3>
                 <span className="text-[8px] font-bold text-slate-400 mt-0.5">LOCATION FOCUS</span>
               </div>
               <Badge className="bg-slate-100 text-slate-500 border-none text-[9px] px-2 h-5 font-black">{parts.length}</Badge>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={onReset} className="h-9 px-4 text-[9px] font-black uppercase text-rose-500 hover:bg-rose-50 flex items-center gap-2 rounded-xl border border-rose-100/50 transition-all active:scale-95">
                <Trash2 className="w-4 h-4" /> CLEAR
              </Button>
              <Button variant="ghost" size="sm" onClick={onCancel} className="h-10 w-10 p-0 rounded-full hover:bg-slate-100 flex-shrink-0 transition-colors">
                <X className="w-7 h-7 text-slate-400" />
              </Button>
            </div>
          </div>
          
          <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-2 px-2 pt-1">
            {parts.map(p => (
              <button
                key={p}
                onClick={() => setActivePart(p)}
                className={`flex-shrink-0 flex items-center gap-3 px-5 py-3 rounded-2xl border-2 transition-all ${
                  activePart === p 
                    ? 'border-primary bg-primary text-white shadow-[0_10px_30px_rgba(var(--primary-rgb),0.3)] scale-105 z-10' 
                    : 'border-slate-100 bg-slate-50 text-slate-500 hover:border-slate-200'
                }`}
              >
                <div className={`w-2.5 h-2.5 rounded-full flex items-center justify-center font-black text-[10px] ${activePart === p ? 'bg-white text-primary' : 'bg-primary text-white'}`}>
                   {p.charAt(0)}
                </div>
                <span className="text-[13px] font-black uppercase whitespace-nowrap tracking-wider">{p}</span>
                {activePart === p && (
                   <motion.div layoutId="active-indicator" className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                )}
              </button>
            ))}
            {parts.length === 0 && (
              <div className="flex items-center gap-2 text-rose-500 py-2">
                 <AlertCircle className="w-4 h-4 animate-pulse" />
                 <span className="text-[12px] font-black uppercase tracking-widest">Select points...</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Context - Responsive Split */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0 divide-y md:divide-y-0 md:divide-x divide-slate-100 overflow-hidden">
        
        {/* Left: Category & Subcategory Picker - Scrollable */}
        <div className="flex-[3] flex flex-col min-h-0 h-[55%] md:h-full overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 md:p-6 scrollbar-hide -webkit-overflow-scrolling-touch">
            <AnimatePresence mode="wait">
              {!selectedCategory ? (
                <motion.div 
                  key="cats"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 lg:gap-6"
                >
                  {categories.map((cat) => {
                    const countInCat = basket.filter(i => i.category === cat.name).length;
                    return (
                      <button
                        key={cat.name}
                        onClick={() => handleCategorySelect(cat)}
                        className={`flex flex-col items-center p-4 md:p-6 rounded-[2rem] md:rounded-[2.5rem] border-2 transition-all group relative ${
                          countInCat > 0 ? 'border-primary bg-primary/5 shadow-inner' : 'border-slate-50 bg-slate-50/50 hover:border-slate-200 hover:bg-white hover:shadow-xl'
                        }`}
                      >
                        <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl md:rounded-3xl overflow-hidden mb-3 md:mb-4 border-2 border-white bg-white shadow-lg group-hover:scale-110 transition-transform duration-500">
                          <img src={cat.imageUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        </div>
                        <span className="text-[10px] md:text-[11px] font-black uppercase tracking-widest text-slate-900 group-hover:text-primary transition-colors text-center">{cat.name}</span>
                        {countInCat > 0 && (
                          <div className="absolute top-2 right-2 md:top-4 md:right-4 animate-in zoom-in duration-300">
                            <Badge className="bg-primary text-white text-[9px] md:text-[10px] px-1.5 md:px-2 h-5 md:h-6 min-w-[20px] md:min-w-[24px] flex justify-center border-2 border-white shadow-md">{countInCat}</Badge>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </motion.div>
              ) : (
                <motion.div 
                  key="subs"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="space-y-4 md:space-y-6"
                >
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-3">
                      <Button variant="ghost" size="sm" onClick={() => setSelectedCategory(null)} className="h-9 px-3 font-black text-[9px] md:text-[10px] uppercase text-primary hover:bg-primary/10 rounded-xl flex items-center gap-2 bg-primary/5 transition-all">
                        <Plus className="w-3.5 h-3.5 rotate-45" /> ALL MISTAKES
                      </Button>
                      <div className="w-1 h-4 bg-slate-200 rounded-full" />
                      <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-slate-500">{selectedCategory.name}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 gap-2 md:gap-3">
                    {selectedCategory.subCategories.map((sub) => {
                       const isSelected = isSubInBasketForActive(selectedCategory.name, sub.name);
                       const isPartial = isSubInBasketAnywhere(selectedCategory.name, sub.name) && !isSelected;
                       return (
                        <button
                          key={sub.name}
                          disabled={!activePart}
                          onClick={() => setPreviewSub(sub)}
                          className={`flex items-center gap-3 p-3 rounded-2xl border-2 transition-all text-left relative ${
                            isSelected 
                              ? 'border-primary bg-primary text-white shadow-md' 
                              : isPartial 
                                ? 'border-primary/50 bg-primary/5 text-slate-900'
                                : 'border-slate-100 bg-white hover:border-slate-300 opacity-90'
                          } ${!activePart ? 'opacity-30 grayscale cursor-not-allowed' : ''}`}
                        >
                          <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-100 bg-white flex-shrink-0">
                            <img src={sub.imageUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          </div>
                          <div className="flex-1">
                            <p className={`text-[10px] font-black uppercase ${isSelected ? 'text-white' : 'text-slate-800'}`}>{sub.name}</p>
                            <p className={`text-[8px] leading-tight mt-0.5 ${isSelected ? 'text-white/60' : 'text-slate-400'}`}>{sub.description}</p>
                          </div>
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-white" />}
                          {isPartial && <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />}
                        </button>
                       );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right: Consolidated Summary Log - Separately Scrollable */}
        <div className="flex-[2] flex flex-col bg-slate-50/30 min-h-0 h-[45%] md:h-full overflow-hidden md:relative pb-2 md:pb-0">
          <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between flex-shrink-0 bg-white">
            <div className="flex items-center gap-2">
              <ClipboardList className="w-3.5 h-3.5 text-primary" />
              <h4 className="text-[9px] font-black uppercase tracking-widest text-slate-900">Summary Log</h4>
            </div>
            <Badge className="bg-slate-900 text-white border-none h-5 px-2 text-[9px] font-black">{basket.length}</Badge>
          </div>

          <ScrollArea className="flex-1 px-3 md:px-5 py-2 -webkit-overflow-scrolling-touch">
            <div className="space-y-4 pb-4">
              {Object.keys(groupedLog).length > 0 ? (
                (Object.entries(groupedLog) as [string, SelectedDefect[]][]).map(([part, defects]) => (
                  <div key={part} className="space-y-2 animate-in fade-in slide-in-from-top-1">
                    <div className="flex items-center gap-2 mb-1">
                       <span className="text-[8px] font-black text-slate-400 font-mono uppercase tracking-[0.2em]">{part}</span>
                       <div className="h-[1px] flex-1 bg-slate-200/50" />
                    </div>
                    {defects.map((defect) => (
                      <div 
                        key={`${defect.part}-${defect.category}-${defect.subCategory}`}
                        className="flex items-center gap-3 bg-white p-2.5 rounded-2xl border border-slate-100 shadow-sm transition-all hover:shadow-md"
                      >
                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0 text-[10px] relative border border-slate-50">
                          <img src={defect.imageUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          {uploadingId === `${defect.part}-${defect.category}-${defect.subCategory}` && (
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                               <Loader2 className="w-5 h-5 text-white animate-spin" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 overflow-hidden">
                          <p className="text-[10px] font-black uppercase text-slate-800 truncate leading-tight tracking-wide">{defect.subCategory}</p>
                          <div className="flex gap-2 mt-1.5">
                             <label className="cursor-pointer">
                                <input 
                                  type="file" 
                                  className="hidden" 
                                  accept="image/*" 
                                  onChange={(e) => handleDefectImageUpload(e, defect.part, defect.category, defect.subCategory)}
                                />
                                <span className={`px-2 py-1 rounded-lg text-[7px] font-black flex items-center gap-1.5 transition-all ${
                                  defect.imageUrl.includes('picsum') || defect.imageUrl.includes('images.unsplash') || !defect.imageUrl
                                    ? 'bg-primary/10 text-primary hover:bg-primary/20'
                                    : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                                }`}>
                                   <ImageIcon className="w-2.5 h-2.5" />
                                   {defect.imageUrl.includes('picsum') || defect.imageUrl.includes('images.unsplash') || !defect.imageUrl ? 'SNAP PROOF' : 'UPDATE PHOTO'}
                                </span>
                             </label>
                          </div>
                        </div>
                        <button 
                          onClick={() => removeFromBasket(defect.category, defect.subCategory, defect.part)}
                          className="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-colors border-none"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ))
              ) : (
                <div className="h-32 flex flex-col items-center justify-center opacity-30 text-center">
                   <Plus className="w-8 h-8 mb-2 text-slate-400" />
                   <p className="text-[9px] font-black uppercase text-slate-400 leading-relaxed tracking-widest">Select target points<br/>to log defects</p>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Tablet/Desktop Summary Footer */}
          <div className="hidden md:block p-5 lg:p-7 bg-white border-t border-slate-100 space-y-4 flex-shrink-0 mt-auto sticky bottom-0 z-20 shadow-[0_-10px_30px_rgba(0,0,0,0.04)]">
            <div className="grid grid-cols-2 gap-3 md:gap-4">
              <div className="space-y-1">
                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Operation</label>
                <Input 
                  placeholder="EX: SIDE SEAM" 
                  value={operation} 
                  onChange={(e) => setOperation(e.target.value)}
                  className="bg-slate-50 border-none text-[10px] font-black tracking-widest h-11 md:h-12 rounded-xl placeholder:text-slate-300 text-slate-700 focus-visible:ring-primary/20 shadow-inner uppercase"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Operator Name</label>
                <Input 
                  placeholder="WHO DID IT?" 
                  value={operatorName} 
                  onChange={(e) => setOperatorName(e.target.value)}
                  className="bg-slate-50 border-none text-[10px] font-black tracking-widest h-11 md:h-12 rounded-xl placeholder:text-slate-300 text-slate-700 focus-visible:ring-primary/20 shadow-inner uppercase"
                />
              </div>
            </div>
            <Input 
              placeholder="ADDITIONAL NOTES..." 
              value={notes} 
              onChange={(e) => setNotes(e.target.value)}
              className="bg-slate-50 border-none text-[10px] font-black tracking-widest h-11 md:h-12 rounded-xl placeholder:text-slate-300 text-slate-700 focus-visible:ring-primary/20 shadow-inner"
            />
            <Button 
              disabled={basket.length === 0}
              onClick={handleSubmit}
              className="w-full h-14 md:h-16 bg-primary hover:bg-primary/95 text-white font-black uppercase tracking-[0.15em] rounded-2xl shadow-xl shadow-primary/30 transition-all active:scale-95 disabled:bg-slate-200 disabled:shadow-none flex items-center justify-center gap-3 text-[11px] md:text-xs"
            >
              <Send className="w-4 h-4 md:w-5 md:h-5" /> SUBMIT INSPECTION
            </Button>
          </div>
        </div>
      </div>

      {/* Global Mobile Footer - Always visible at bottom of entire form */}
      <div className="md:hidden p-5 bg-white border-t border-slate-100 space-y-4 z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.08)]">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Operation</label>
            <Input 
              placeholder="OPR" 
              value={operation} 
              onChange={(e) => setOperation(e.target.value)}
              className="bg-slate-50 border-none text-[10px] font-black tracking-widest h-12 rounded-xl shadow-inner uppercase"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Operator</label>
            <Input 
              placeholder="NAME" 
              value={operatorName} 
              onChange={(e) => setOperatorName(e.target.value)}
              className="bg-slate-50 border-none text-[10px] font-black tracking-widest h-12 rounded-xl shadow-inner uppercase"
            />
          </div>
        </div>
        <Input 
          placeholder="ADDITIONAL NOTES..." 
          value={notes} 
          onChange={(e) => setNotes(e.target.value)}
          className="bg-slate-50 border-none text-[10px] font-black tracking-widest h-12 rounded-xl shadow-inner"
        />
        <Button 
          disabled={basket.length === 0}
          onClick={handleSubmit}
          className="w-full h-16 bg-primary text-white font-black uppercase tracking-[0.15em] rounded-2xl shadow-xl shadow-primary/30 active:scale-95 disabled:bg-slate-200 flex items-center justify-center gap-3 text-xs"
        >
          <Send className="w-4 h-4" /> SUBMIT INSPECTION
        </Button>
      </div>

      {/* Defect Preview & Confirmation Modal */}
      <AnimatePresence>
        {previewSub && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md"
            onClick={() => setPreviewSub(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-lg bg-white rounded-[2.5rem] overflow-hidden shadow-2xl ring-8 ring-white/10"
              onClick={e => e.stopPropagation()}
            >
              <div className="relative aspect-square sm:aspect-[4/3] bg-slate-100">
                <img 
                  src={previewSub.imageUrl} 
                  className="w-full h-full object-cover" 
                  alt={previewSub.name}
                  referrerPolicy="no-referrer"
                />
                <button 
                  onClick={() => setPreviewSub(null)}
                  className="absolute top-4 right-4 w-10 h-10 bg-black/20 hover:bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white transition-all shadow-lg"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="absolute top-4 left-4">
                  <Badge className="bg-primary text-white border-none text-[8px] font-black tracking-widest px-3 py-1 uppercase shadow-lg">
                    {selectedCategory?.name}
                  </Badge>
                </div>
              </div>

              <div className="p-8 space-y-6">
                <div>
                  <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">{previewSub.name}</h3>
                  <p className="text-sm font-medium text-slate-400 mt-2 leading-relaxed">{previewSub.description}</p>
                </div>

                <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 flex items-center gap-4">
                  <div className="w-10 h-10 bg-primary text-white rounded-xl flex items-center justify-center font-black">
                    {activePart.charAt(0)}
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-primary uppercase tracking-widest leading-none">Marking Point</p>
                    <p className="text-sm font-black text-slate-900 uppercase mt-1">{activePart}</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    onClick={() => setPreviewSub(null)}
                    className="flex-1 h-16 rounded-2xl text-[10px] font-black uppercase tracking-widest border-slate-200"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={() => {
                      toggleSub(previewSub);
                      setPreviewSub(null);
                    }}
                    className={`flex-[2] h-16 rounded-2xl font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 transition-all active:scale-95 ${
                      isSubInBasketForActive(selectedCategory?.name || '', previewSub.name)
                        ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/20'
                        : 'bg-primary hover:bg-primary/95 text-white shadow-primary/20'
                    }`}
                  >
                    {isSubInBasketForActive(selectedCategory?.name || '', previewSub.name) ? (
                      <>
                        <Trash2 className="w-5 h-5" /> REMOVE LOG
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-5 h-5" /> CONFIRM & TICK
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
