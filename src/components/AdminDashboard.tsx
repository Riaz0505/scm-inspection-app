import React, { useState, useEffect } from 'react';
import { DefectReport, DefectCategory, Style, GarmentType, GarmentModel as IGarmentModel } from '../types';
import { GarmentModel } from './GarmentModel';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { CheckCircle2, Clock, AlertCircle, User, Tag, MapPin, Layers, Save, Image as ImageIcon, ChevronLeft, Eye, X, ExternalLink, Upload, Loader2, BarChart3, TrendingUp, Users, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip, ResponsiveContainer, Cell } from 'recharts';

import { firebaseService } from '../services/firebaseService';
import { fetchApi, getApiUrl } from '../lib/api';

interface AdminDashboardProps {
  categories: DefectCategory[];
  onRefreshCategories: () => void;
  onBackToHome?: () => void;
}

const DetailModal = ({ 
  report, 
  onClose, 
  onResolve 
}: { 
  report: DefectReport; 
  onClose: () => void;
  onResolve: (id: string) => void;
}) => {
  const [selectedPoint, setSelectedPoint] = useState<string | null>(null);

  const filteredDefects = selectedPoint 
    ? (report.defects || []).filter(d => 
        d.part === selectedPoint || 
        (d as any).label === selectedPoint ||
        (d.part && selectedPoint && d.part.toLowerCase().includes(selectedPoint.toLowerCase())) ||
        (selectedPoint && d.part && selectedPoint.toLowerCase().includes(d.part.toLowerCase()))
      )
    : (report.defects || []);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="bg-slate-900 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between text-white flex-shrink-0">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary/20 rounded-lg sm:rounded-xl flex items-center justify-center border border-white/10">
              <Eye className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            </div>
            <div className="min-w-0">
              <h3 className="text-xs sm:text-sm font-black uppercase tracking-widest truncate">{report.styleName}</h3>
              <p className="text-[8px] sm:text-[10px] font-mono opacity-50">TRK_ID: {(report.reportId || report.id || (report as any)._id || 'N/A')?.substring(0, 8)}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-full transition-colors flex-shrink-0 ml-2">
            <X className="w-4 h-4 sm:w-5 sm:h-5 text-white/60" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-hide -webkit-overflow-scrolling-touch px-4 sm:px-6 py-6 sm:py-8">
          <div className="space-y-6 sm:space-y-8 pb-10">
            {/* Header Info */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-1">
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Marked Points</span>
                <div className="flex flex-wrap gap-1">
                  {report.part?.split(',').map(p => (
                    <Badge key={p} variant="secondary" className="text-[8px] font-black uppercase px-1.5 py-0">
                      {p.trim()}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Checking Inspector</span>
                <p className="text-[11px] font-black text-slate-900 truncate uppercase">{report.inspectorName || 'Unknown'}</p>
              </div>
              <div className="space-y-1">
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Operation</span>
                <p className="text-[11px] font-black text-primary truncate uppercase">{report.operation || 'N/A'}</p>
              </div>
              <div className="space-y-1">
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Fabric Operator</span>
                <p className="text-[11px] font-black text-slate-900 truncate uppercase">{report.operatorName || 'Unknown'}</p>
              </div>
              <div className="space-y-1">
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Inspector Email</span>
                <p className="text-[11px] font-black text-slate-400 truncate text-[9px]">{report.reporterEmail}</p>
              </div>
              <div className="space-y-1">
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Date / Time</span>
                <p className="text-[11px] font-black text-slate-900">{new Date(report.createdAt).toLocaleString()}</p>
              </div>
              <div className="space-y-1 col-span-2 sm:col-span-1">
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Status</span>
                <div>
                  <Badge className={report.status === 'pending' ? 'bg-amber-100 text-amber-600 border-none px-2 text-[9px]' : 'bg-green-100 text-green-600 border-none px-2 text-[9px]'}>
                    {report.status.toUpperCase()}
                  </Badge>
                </div>
              </div>
            </div>

            <Separator className="opacity-50" />

            {/* Visual Map */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest text-primary border-primary/20 bg-primary/5">
                  Click Points to Filter
                </Badge>
                {selectedPoint && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setSelectedPoint(null)}
                    className="h-6 text-[8px] font-black uppercase text-rose-500 hover:bg-rose-50"
                  >
                    Clear Filter
                  </Button>
                )}
              </div>
              <div className="rounded-2xl border-2 border-slate-100 bg-slate-50 p-4 shadow-inner overflow-hidden flex justify-center">
                <div className="w-full max-w-[280px]">
                  <GarmentModel 
                    type={(report.styleName?.toLowerCase().includes('shirt') || report.styleId?.toLowerCase().includes('shirt')) ? 'tshirt' : ((report.styleName?.toLowerCase().includes('short') || report.styleId?.toLowerCase().includes('short')) ? 'shorts' : 'tshirt')} 
                    layoutImage={report.layoutImage}
                    frontImageUrl={report.frontImageUrl}
                    backImageUrl={report.backImageUrl}
                    customPoints={report.customPoints}
                    selectedParts={report.part ? report.part.split(',').map(p => p.trim()) : []} 
                    heatMapData={(report.defects || []).reduce((acc, d) => {
                      if (d.part) acc[d.part] = (acc[d.part] || 0) + 1;
                      return acc;
                    }, {} as Record<string, number>)}
                    onPartClick={(part) => {
                      if (report.part?.includes(part)) {
                        setSelectedPoint(part === selectedPoint ? null : part);
                      }
                    }}
                    interactive={false}
                  />
                </div>
              </div>
            </div>

            <Separator className="opacity-50" />

            {/* Filtered Defects */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-primary" />
                  <h4 className="text-xs font-black uppercase tracking-widest text-slate-900">
                    {selectedPoint ? `Point Details: ${selectedPoint}` : `All Visual Evidence (${report.defects?.length || 0})`}
                  </h4>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredDefects.length > 0 ? (
                  filteredDefects.map((defect, i) => (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      key={i} 
                      className="group relative rounded-2xl border border-slate-100 bg-white overflow-hidden shadow-sm hover:shadow-md transition-all"
                    >
                      <div className="aspect-[4/3] bg-slate-100 overflow-hidden relative">
                        <img 
                          src={defect.imageUrl} 
                          alt={defect.subCategory} 
                          className="w-full h-full object-cover transition-transform group-hover:scale-110" 
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute top-2 right-2 flex gap-1">
                          <Badge className="bg-slate-900/80 backdrop-blur-sm text-white border-none text-[8px] font-black">
                            {defect.category}
                          </Badge>
                        </div>
                      </div>
                      <div className="p-3">
                        <div className="flex items-center gap-1.5 mb-1">
                          <Badge variant="outline" className="text-[7px] h-3.5 border-primary/20 text-primary bg-primary/5 px-1.5 uppercase font-black">
                            ID: {defect.part || 'MAIN'}
                          </Badge>
                        </div>
                        <h5 className="text-[10px] font-black uppercase tracking-wide text-slate-900 leading-tight">{defect.subCategory}</h5>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="col-span-2 py-12 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-100 rounded-3xl bg-slate-50">
                    <AlertCircle className="w-8 h-8 mb-3 opacity-20" />
                    <p className="text-[10px] uppercase font-black tracking-[0.2em]">{selectedPoint ? 'No Detail for this point' : 'Missing detail objects'}</p>
                  </div>
                )}
              </div>
            </div>

            {report.notes && (
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-2">Inspection Notes</span>
                <p className="text-xs text-slate-600 italic leading-relaxed">"{report.notes}"</p>
              </div>
            )}
          </div>
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3 flex-shrink-0">
          <Button 
            variant="outline" 
            onClick={onClose} 
            className="flex-1 h-12 text-[10px] font-black uppercase tracking-widest text-slate-400 rounded-xl"
          >
            Back to Overview
          </Button>
          {report.status === 'pending' && (
            <Button 
              onClick={() => onResolve(report.reportId || report.id || (report as any)._id)}
              className="flex-[2] h-12 bg-primary text-white font-black uppercase tracking-widest rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform"
            >
              Approve & Resolve Faults
            </Button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

const ReportCard = ({ report, onClick }: { report: DefectReport, onClick: () => void }) => {
  const garmentType = (report.styleName?.toLowerCase().includes('shirt') || report.styleId?.toLowerCase().includes('shirt')) 
    ? 'tshirt' 
    : ((report.styleName?.toLowerCase().includes('short') || report.styleId?.toLowerCase().includes('short')) ? 'shorts' : 'tshirt');

  return (
    <Card 
      onClick={onClick}
      className="mb-4 overflow-hidden border-slate-200 bg-white shadow-sm hover:shadow-md transition-all cursor-pointer group"
    >
      <div className="flex">
      <div className={`w-1 sm:w-1.5 transition-all group-hover:w-2 ${report.status === 'pending' ? 'bg-primary' : 'bg-green-500'}`} />
      <div className="flex-1 p-3 sm:p-5">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-3 mb-4">
          <div className="w-full sm:w-auto">
            <div className="flex items-center gap-2 mb-1">
              {report.defects && report.defects.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {report.defects.slice(0, 3).map((d, idx) => (
                    <Badge key={idx} className="bg-primary/10 text-primary border-none text-[9px] font-black uppercase tracking-widest px-2">
                       {d.part}: {d.subCategory}
                    </Badge>
                  ))}
                  {report.defects.length > 3 && (
                    <Badge className="bg-slate-100 text-slate-400 border-none text-[9px] font-black uppercase tracking-widest px-2">
                      +{report.defects.length - 3} MORE
                    </Badge>
                  )}
                </div>
              ) : (
                <Badge className="bg-primary/10 text-primary border-none text-[9px] font-black uppercase tracking-widest px-2">
                  ISSUE: {report.subCategory}
                </Badge>
              )}
            </div>
            <h3 className="font-black text-base sm:text-xl text-slate-900 tracking-tight truncate group-hover:text-primary transition-colors">
              {report.styleName} <span className="text-slate-300 mx-2 font-light">|</span> <span className="text-slate-500 text-sm font-bold uppercase">{report.styleId}</span>
            </h3>
            
            <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-3">
              <Badge variant="secondary" className="text-[8px] sm:text-[10px] bg-slate-100 text-slate-600 uppercase font-black px-2 py-0.5 border-slate-200">
                <MapPin className="w-2.5 h-2.5 sm:w-3 h-3 mr-1.5 text-primary" /> {report.part}
              </Badge>
              <Badge variant="outline" className="text-[8px] sm:text-[10px] text-slate-400 font-mono tracking-widest">
                ID: {(report.reportId || report.id || (report as any)._id || 'N/A')?.substring(0, 8)}
              </Badge>
            </div>
          </div>
          <div className="flex flex-col items-start sm:items-end gap-1 flex-shrink-0">
            <div className="flex items-center gap-1.5 text-[8px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
              <Clock className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
              {new Date(report.createdAt).toLocaleDateString()}
            </div>
            <Badge className={`border-none px-2.5 sm:px-4 py-1 sm:py-1.5 text-[9px] sm:text-[11px] font-black tracking-widest flex items-center gap-2 ${
              report.status === 'pending' 
                ? 'bg-amber-100 text-amber-600' 
                : 'bg-green-100 text-green-600'
            }`}>
              {report.status === 'pending' ? <Clock className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
              {report.status.toUpperCase()}
            </Badge>
          </div>
        </div>
        <Separator className="my-3 sm:my-4 opacity-50" />
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-[8px] sm:text-[10px] font-bold text-slate-400">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <div className="flex items-center">
              <div className="w-5 h-5 sm:w-6 sm:h-6 bg-primary/10 rounded-full flex items-center justify-center mr-2">
                <User className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-primary" />
              </div>
              <span className="truncate max-w-[150px] sm:max-w-none">INSPECTOR: <span className="text-slate-900 font-black uppercase">{report.inspectorName || 'UNKNOWN'}</span></span>
            </div>
            
            <div className="flex items-center border-l border-slate-100 pl-4">
              <Layers className="w-3 h-3 mr-1.5 text-primary" />
              <span>OPR: <span className="text-slate-900 font-black uppercase">{report.operation || 'N/A'}</span></span>
            </div>

            <div className="flex items-center border-l border-slate-100 pl-4">
              <Users className="w-3 h-3 mr-1.5 text-primary" />
              <span>WORKER: <span className="text-slate-900 font-black uppercase">{report.operatorName || 'UNKNOWN'}</span></span>
            </div>
          </div>
          {report.notes && (
            <div className="text-slate-500 italic line-clamp-1 border-l border-slate-100 pl-4">"{report.notes}"</div>
          )}
        </div>
      </div>
    </div>
  </Card>
);
};

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  categories, 
  onRefreshCategories,
  onBackToHome
}) => {
  const [reports, setReports] = useState<DefectReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategoryName, setSelectedCategoryName] = useState<string | null>(null);
  const [editingImages, setEditingImages] = useState<Record<string, string>>({});
  const [globalStats, setGlobalStats] = useState<{
    styles: { name: string, count: number }[],
    parts: { name: string, count: number }[],
    operators: { email: string, count: number }[],
    workerPerformance: { name: string, operation: string, count: number, topDefect: string }[]
  } | null>(null);
  const [viewingReport, setViewingReport] = useState<DefectReport | null>(() => {
    const saved = localStorage.getItem('scm_viewingReport');
    if (saved) {
      try { return JSON.parse(saved); } catch(e) { /* ignore */ }
    }
    return null;
  });
  const [styles, setStyles] = useState<Style[]>([]);
  const [models, setModels] = useState<IGarmentModel[]>([]);
  const [newStyle, setNewStyle] = useState<Partial<Style>>({ type: '' });
  const [newModel, setNewModel] = useState<Partial<IGarmentModel>>({ type: '', customPoints: [] });


  const [uploading, setUploading] = useState(false);
  const [dbStatus, setDbStatus] = useState<{mongo: string, mode: string} | null>(null);

  const fetchHealth = async () => {
    try {
      const data = await fetchApi('/api/health');
      setDbStatus(data);
    } catch (e) {
      console.warn('Health check failed');
    }
  };

  // Persist viewingReport
  useEffect(() => {
    if (viewingReport) {
      localStorage.setItem('scm_viewingReport', JSON.stringify(viewingReport));
    } else {
      localStorage.removeItem('scm_viewingReport');
    }
  }, [viewingReport]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, targetField: 'layoutImage' | 'frontImageUrl' | 'backImageUrl' = 'layoutImage', entity: 'style' | 'model' = 'style') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const data = await fetchApi('/api/upload', {
        method: 'POST',
        body: formData,
      });
      if (entity === 'model') {
        setNewModel(p => ({ ...p, [targetField]: data.imageUrl }));
      } else {
        setNewStyle(p => ({ ...p, [targetField]: data.imageUrl }));
      }
      toast.success(`${targetField.replace('ImageUrl', '').charAt(0).toUpperCase() + targetField.replace('ImageUrl', '').slice(1)} image uploaded`);
    } catch (err: any) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const fetchStyles = async () => {
    try {
      const data = await fetchApi('/api/styles');
      setStyles(data);
    } catch (e) {
      console.error('Failed to fetch styles', e);
    }
  };

  const fetchModels = async () => {
    try {
      const data = await fetchApi('/api/models');
      setModels(data);
    } catch (e) {
      console.error('Failed to fetch models', e);
    }
  };

  const handleSaveModel = async () => {
    if (!newModel.name) {
      toast.error('Model Name is required');
      return;
    }
    
    try {
      await fetchApi('/api/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newModel)
      });
      toast.success('Garment Model saved');
      setNewModel({ type: '', customPoints: [] });
      fetchModels();
    } catch (e) {
      toast.error('Failed to save model');
    }
  };

  const handleSaveStyle = async () => {
    if (!newStyle.barcode || !newStyle.name) {
      toast.error('Barcode and Name are required');
      return;
    }
    
    try {
      const styleData = {
        ...newStyle,
        barcode: newStyle.barcode.toString().trim(),
        customPoints: newStyle.customPoints?.map(({ id, label, x, y }) => ({ id, label, x, y }))
      };
      
      await fetchApi('/api/styles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(styleData)
      });
      toast.success('Style configuration saved');
      setNewStyle({ type: '' });
      fetchStyles();
    } catch (e) {
      toast.error('Failed to save style');
    }
  };

  const [mapperView, setMapperView] = useState<'front' | 'back'>('front');

  const handlePointAdd = (e: React.MouseEvent<HTMLDivElement>, entity: 'style' | 'model' = 'style') => {
    const target = entity === 'model' ? newModel : newStyle;
    const currentImageUrl = mapperView === 'front' ? (target.frontImageUrl || (target as any).layoutImage) : target.backImageUrl;
    if (!currentImageUrl) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Number(((e.clientX - rect.left) / rect.width * 100).toFixed(2));
    const y = Number(((e.clientY - rect.top) / rect.height * 100).toFixed(2));
    
    // Generate next alphabet ID
    const pointCount = target.customPoints?.length || 0;
    const id = String.fromCharCode(65 + (pointCount % 26)) + (pointCount >= 26 ? Math.floor(pointCount / 26) : '');
    const prefix = mapperView === 'back' ? 'B-' : 'F-';
    const finalId = prefix + id;
    const label = `Marker ${finalId}`;
    
    if (entity === 'model') {
       setNewModel(prev => ({
        ...prev,
        customPoints: [...(prev.customPoints || []), { id: finalId, label, x, y }]
      }));
    } else {
      setNewStyle(prev => ({
        ...prev,
        customPoints: [...(prev.customPoints || []), { id: finalId, label, x, y }]
      }));
    }
  };

  const removePoint = (id: string, entity: 'style' | 'model' = 'style') => {
    if (entity === 'model') {
      setNewModel(prev => ({
        ...prev,
        customPoints: prev.customPoints?.filter(p => p.id !== id) || []
      }));
    } else {
      setNewStyle(prev => ({
        ...prev,
        customPoints: prev.customPoints?.filter(p => p.id !== id)
      }));
    }
  };

  const updatePointLabel = (id: string, label: string, entity: 'style' | 'model' = 'style') => {
    if (entity === 'model') {
      setNewModel(prev => ({
        ...prev,
        customPoints: prev.customPoints?.map(p => p.id === id ? { ...p, label } : p) || []
      }));
    } else {
      setNewStyle(prev => ({
        ...prev,
        customPoints: prev.customPoints?.map(p => p.id === id ? { ...p, label } : p)
      }));
    }
  };

  const fetchReports = async () => {
    try {
      setLoading(true);
      // Try local API first (backed by MongoDB)
      const data = await fetchApi('/api/defects');
      const sortedData = [...data].sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      if (reports.length > 0 && sortedData.length > reports.length) {
        const newCount = sortedData.length - reports.length;
        toast.success(`${newCount} New Defect Report${newCount > 1 ? 's' : ''} Received`);
      }
      
      setReports(sortedData);
    } catch (error) {
      console.warn('API fetch failed, trying Firebase fallback:', error);
      try {
        const data = await firebaseService.getReports();
        if (data) {
          setReports([...data].sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
        }
      } catch (fbErr) {
        console.error('Total failure fetching reports:', fbErr);
      }
    } finally {
      setLoading(false);
    }
  };

  const deleteModel = async (id: string) => {
    try {
      await fetchApi(`/api/models/${id}`, { method: 'DELETE' });
      toast.success('Model deleted');
      fetchModels();
    } catch (e) {
      toast.error('Failed to delete model');
    }
  };

  const fetchGlobalStats = async () => {
    try {
      const data = await fetchApi('/api/stats/global');
      if (data && data.styles && data.parts) {
        setGlobalStats(data);
        return;
      }
      
      // Local calculation fallback if API data is incomplete
      calculateLocalStats();
    } catch (e) {
      calculateLocalStats();
    }
  };

  const calculateLocalStats = () => {
    if (reports.length > 0) {
      const styleCounts: Record<string, number> = {};
      const partCounts: Record<string, number> = {};
      const opCounts: Record<string, number> = {}; // Inspector counts
      const workerCounts: Record<string, { operation: string, count: number, defects: Record<string, number> }> = {};

      reports.forEach(r => {
        const style = r.styleName || 'Unknown';
        const defectCount = r.defects?.length || 1;
        
        styleCounts[style] = (styleCounts[style] || 0) + defectCount;
        
        const inspectorName = r.inspectorName || r.reporterEmail || 'Unknown';
        opCounts[inspectorName] = (opCounts[inspectorName] || 0) + defectCount;
        
        // Add Worker/Operator tracking
        if (r.operatorName) {
          const key = `${r.operatorName}-${r.operation || 'N/A'}`;
          if (!workerCounts[key]) {
            workerCounts[key] = { 
              operation: r.operation || 'N/A', 
              count: 0, 
              defects: {} 
            };
          }
          workerCounts[key].count += defectCount;
          
          // Track specific defects for this worker
          if (r.defects && Array.isArray(r.defects)) {
            r.defects.forEach(d => {
              workerCounts[key].defects[d.subCategory] = (workerCounts[key].defects[d.subCategory] || 0) + 1;
            });
          }
        }
        
        if (r.defects && Array.isArray(r.defects)) {
          r.defects.forEach(d => {
            if (d.part) partCounts[d.part] = (partCounts[d.part] || 0) + 1;
          });
        } else if (typeof r.part === 'string') {
          r.part.split(',').forEach(p => {
            const trimmed = p.trim();
            if (trimmed) partCounts[trimmed] = (partCounts[trimmed] || 0) + 1;
          });
        }
      });

      // Find top defect for each worker
      const workerPerformance = Object.entries(workerCounts).map(([nameOperation, data]) => {
        const [name] = nameOperation.split('-');
        const topDefect = Object.entries(data.defects)
          .sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';
          
        return {
          name,
          operation: data.operation,
          count: data.count,
          topDefect
        };
      }).sort((a, b) => b.count - a.count).slice(0, 15);

      setGlobalStats({
        styles: Object.entries(styleCounts).map(([name, count]) => ({ name, count })).sort((a,b) => b.count - a.count).slice(0, 10),
        parts: Object.entries(partCounts).map(([name, count]) => ({ name, count })).sort((a,b) => b.count - a.count).slice(0, 15),
        operators: Object.entries(opCounts).map(([email, count]) => ({ email, count })).sort((a,b) => b.count - a.count).slice(0, 10),
        workerPerformance
      });
    }
  };

  useEffect(() => {
    fetchStyles();
    fetchModels();
    fetchReports();
    fetchHealth();
    
    // Also keep Firebase listener for true real-time if available
    const unsubscribe = firebaseService.listenToReports((data) => {
      if (data && data.length >= reports.length) {
        const sortedData = [...data].sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setReports(sortedData);
      }
    });

    // Periodic poll for stats - more frequent when on analytics tab
    const statsInterval = setInterval(() => {
      fetchGlobalStats();
    }, 15000);

    return () => {
      unsubscribe();
      clearInterval(statsInterval);
    };
  }, []);

  // Recalculate stats when reports change - much more efficient than intervals
  useEffect(() => {
    if (reports.length > 0) {
      calculateLocalStats();
    }
  }, [reports]);

  useEffect(() => {
    // Synchronize local state with server truth whenever categories prop updates
    setEditingImages(prev => {
      const next = { ...prev };
      categories.forEach(cat => {
        const catId = (cat as any)._id || (cat as any).id || cat.name;
        // Always take server value when categories prop is refreshed
        next[`cat-${catId}`] = cat.imageUrl || '';
        
        cat.subCategories.forEach((sub) => {
          next[`sub-${catId}-${sub.name}`] = sub.imageUrl || '';
        });
      });
      return next;
    });
  }, [categories]);

  const handleUpdateCategoryMainImage = async (catId: string) => {
    const rawUrl = editingImages[`cat-${catId}`] || '';
    const newUrl = rawUrl.trim();
    
    if (!newUrl) {
      toast.error('Please enter a valid URL');
      return;
    }
    
    try {
      console.log(`[Admin] Updating Main Image for Category: ${catId} to ${newUrl}`);
      const updatedCat = await fetchApi(`/api/categories/${catId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: newUrl })
      });
      console.log('[Admin] Category Update Success:', updatedCat);

      // Update local state with server truth to ensure persistence is visible
      setEditingImages(prev => ({
        ...prev,
        [`cat-${catId}`]: updatedCat.imageUrl || ''
      }));
      toast.success('Category image updated permanently');
      onRefreshCategories();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update image');
    }
  };

  const handleUpdateCategoryImage = async (catId: string, subName: string) => {
    const rawUrl = editingImages[`sub-${catId}-${subName}`] || '';
    const newUrl = rawUrl.trim();

    if (!newUrl) {
      toast.error('Please enter a valid URL');
      return;
    }

    try {
      const category = categories.find(c => 
        (c as any)._id === catId || 
        (c as any).id === catId || 
        c.name === catId
      );
      if (!category) {
        toast.error('Category not found');
        return;
      }

      const updatedSubCategories = category.subCategories.map(sub => 
        sub.name === subName ? { ...sub, imageUrl: newUrl } : sub
      );

      const updatedCat = await fetchApi(`/api/categories/${catId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subCategories: updatedSubCategories })
      });

      const updatedSub = updatedCat.subCategories.find((s: any) => s.name === subName);
      
      // Update local state with server truth
      setEditingImages(prev => ({
        ...prev,
        [`sub-${catId}-${subName}`]: updatedSub?.imageUrl || ''
      }));
      
      toast.success('Sub-category image updated permanently');
      onRefreshCategories();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update image');
    }
  };

  const handleResolve = async (id: string) => {
    try {
      await fetchApi(`/api/defects/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'resolved' })
      });
      toast.success('Report marked as resolved');
      fetchReports(); // Refresh list
      if (viewingReport?.reportId === id || viewingReport?.id === id || (viewingReport as any)._id === id) {
        setViewingReport(prev => prev ? { ...prev, status: 'resolved' } : null);
      }
    } catch (error) {
      toast.error('Connection error');
    }
  };

  const handleSeedData = async () => {
    try {
      await fetchApi('/api/admin/seed', { method: 'POST' });
      toast.success('System re-seeded successfully');
      onRefreshCategories();
    } catch (e) {
      toast.error('Failed to seed system');
    }
  };

  const pendingReports = reports.filter(r => r.status === 'pending');
  const resolvedReports = reports.filter(r => r.status === 'resolved');

  return (
    <div className="space-y-4 sm:space-y-8">
      <AnimatePresence>
        {viewingReport && (
          <DetailModal 
            report={viewingReport} 
            onClose={() => setViewingReport(null)} 
            onResolve={handleResolve}
          />
        )}
      </AnimatePresence>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm gap-4 transition-all">
        <div className="w-full sm:w-auto">
          <div className="flex items-center gap-4 mb-2 sm:hidden">
             <Button 
                variant="ghost" 
                size="sm" 
                onClick={onBackToHome}
                className="h-8 px-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-primary"
              >
                <ArrowLeft className="w-4 h-4 mr-1" /> EXIT ADMIN
              </Button>
          </div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] text-slate-400">QC Center</h2>
            <div className="flex items-center gap-1 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-100">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[8px] font-bold text-emerald-600 uppercase">Live Feed</span>
            </div>
          </div>
          <p className="text-xl sm:text-3xl font-black text-slate-900 tracking-tighter">Inspection Logs</p>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-[9px] font-mono text-slate-400 uppercase tracking-widest">
              Last Sync: {new Date().toLocaleTimeString()}
            </p>
            {dbStatus && (
              <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 ml-0 sm:ml-2">
                <div className="flex items-center gap-1.5">
                  <div className={`w-1.5 h-1.5 rounded-full ${dbStatus.mongo === 'connected' ? 'bg-green-500' : 'bg-rose-500'} animate-pulse`} />
                  <span className={`text-[8px] font-black uppercase ${dbStatus.mongo === 'connected' ? 'text-green-600' : 'text-rose-600'}`}>
                    DB: {dbStatus.mongo === 'connected' ? 'Atlas Connected' : 'Local Fallback'}
                  </span>
                </div>
                {dbStatus.mongo !== 'connected' && (
                  <span className="text-[7px] font-bold text-rose-400 uppercase tracking-tighter">
                    
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row items-end gap-4 w-full sm:w-auto">
          <Button 
            variant="outline" 
            onClick={onBackToHome}
            className="hidden sm:flex h-11 px-6 rounded-2xl border-slate-200 text-slate-500 font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 hover:text-primary transition-all group"
          >
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            Exit to Home
          </Button>

          <div className="flex gap-4 sm:gap-8 w-full sm:w-auto justify-start sm:justify-end border-t sm:border-t-0 pt-4 sm:pt-0">
            <div className="text-left sm:text-right">
              <p className="text-[8px] sm:text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Pending</p>
              <p className="text-lg sm:text-2xl font-black text-primary">{pendingReports.length}</p>
            </div>
            <div className="h-8 sm:h-10 w-[1px] bg-slate-200 self-center" />
            <div className="text-left sm:text-right">
              <p className="text-[8px] sm:text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Resolved</p>
              <p className="text-lg sm:text-2xl font-black text-green-500">{resolvedReports.length}</p>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="pending" className="w-full flex flex-col">
        <div className="w-full overflow-x-auto scrollbar-hide -webkit-overflow-scrolling-touch mb-6">
          <TabsList className="bg-slate-100 p-1 rounded-xl border border-slate-200 w-max h-11">
            <TabsTrigger value="pending" className="rounded-lg px-4 sm:px-8 py-2 text-[9px] sm:text-xs font-black uppercase tracking-widest whitespace-nowrap h-full">
              Pending ({pendingReports.length})
            </TabsTrigger>
            <TabsTrigger value="resolved" className="rounded-lg px-4 sm:px-8 py-2 text-[9px] sm:text-xs font-black uppercase tracking-widest whitespace-nowrap h-full">
              Resolved ({resolvedReports.length})
            </TabsTrigger>
            <TabsTrigger value="categories" className="rounded-lg px-4 sm:px-8 py-2 text-[9px] sm:text-xs font-black uppercase tracking-widest whitespace-nowrap h-full">
              Categories
            </TabsTrigger>
            <TabsTrigger value="models" className="rounded-lg px-4 sm:px-8 py-2 text-[9px] sm:text-xs font-black uppercase tracking-widest whitespace-nowrap h-full">
              Models
            </TabsTrigger>
            <TabsTrigger value="styles" className="rounded-lg px-4 sm:px-8 py-2 text-[9px] sm:text-xs font-black uppercase tracking-widest whitespace-nowrap h-full">
              Styles
            </TabsTrigger>
            <TabsTrigger value="analytics" className="rounded-lg px-4 sm:px-8 py-2 text-[9px] sm:text-xs font-black uppercase tracking-widest whitespace-nowrap h-full">
              Analytics
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="pending" className="mt-0 outline-none flex-1">
          <div className="h-[500px] sm:h-[calc(100vh-400px)] min-h-[300px] overflow-y-auto scrollbar-hide -webkit-overflow-scrolling-touch">
            <div className="pr-4">
              {pendingReports.length > 0 ? (
                pendingReports.map((report, idx) => (
                  <div key={report.reportId || report.id || (report as any)._id || `pending-${idx}`}>
                    <ReportCard report={report} onClick={() => setViewingReport(report)} />
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-64 text-slate-400 bg-white rounded-2xl border-2 border-dashed border-slate-100">
                  <CheckCircle2 className="w-12 h-12 mb-4 opacity-20" />
                  <p className="text-xs font-bold uppercase tracking-widest">No pending defects</p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="resolved" className="mt-0 outline-none flex-1">
          <div className="h-[500px] sm:h-[calc(100vh-400px)] min-h-[300px] overflow-y-auto scrollbar-hide -webkit-overflow-scrolling-touch">
            <div className="pr-4">
              {resolvedReports.length > 0 ? (
                resolvedReports.map((report, idx) => (
                  <div key={report.reportId || report.id || (report as any)._id || `resolved-${idx}`}>
                    <ReportCard report={report} onClick={() => setViewingReport(report)} />
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-64 text-slate-400 bg-white rounded-2xl border-2 border-dashed border-slate-100">
                  <Clock className="w-12 h-12 mb-4 opacity-20" />
                  <p className="text-xs font-bold uppercase tracking-widest">No resolved reports</p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="categories" className="mt-0 outline-none flex-1">
          <div className="h-[500px] sm:h-[calc(100vh-400px)] min-h-[300px] overflow-y-auto scrollbar-hide -webkit-overflow-scrolling-touch">
            <div className="pr-4">
              {!selectedCategoryName ? (
                <>
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Defect Categories</h3>
                      <p className="text-[9px] text-slate-400 mt-0.5">Select a category to manage its defects and images</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={onRefreshCategories} className="h-7 text-[9px] font-bold uppercase">
                      Refresh Data
                    </Button>
                  </div>
                  
                  {categories && categories.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-10">
                      {categories.map((cat, idx) => {
                        const catId = (cat as any)._id || (cat as any).id || cat.name;
                        return (
                          <motion.div
                            key={catId || idx}
                            whileHover={{ y: -4 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setSelectedCategoryName(cat.name)}
                            className="cursor-pointer"
                          >
                            <Card className="border-slate-200 shadow-sm overflow-hidden hover:border-primary transition-colors h-full">
                              <div className="h-32 bg-slate-100 relative overflow-hidden">
                                <img 
                                  src={cat.imageUrl || ""} 
                                  alt={cat.name} 
                                  className="w-full h-full object-cover" 
                                  referrerPolicy="no-referrer"
                                  crossOrigin="anonymous"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.src = "";
                                  }}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
                                  <Badge className="bg-white/20 backdrop-blur-md text-white border-none text-[8px] uppercase font-bold">
                                    {cat.subCategories.length} Defects
                                  </Badge>
                                </div>
                              </div>
                              <CardHeader className="p-4">
                                <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-900">{cat.name}</CardTitle>
                              </CardHeader>
                            </Card>
                          </motion.div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-64 text-slate-400 bg-white rounded-2xl border-2 border-dashed border-slate-100">
                      <Layers className="w-12 h-12 mb-4 opacity-20" />
                      <p className="text-xs font-bold uppercase tracking-widest">No categories found</p>
                      <div className="flex gap-2 mt-4">
                        <Button variant="link" onClick={onRefreshCategories} className="text-[10px] uppercase font-bold text-slate-400">Try Refreshing</Button>
                        <Button variant="outline" onClick={handleSeedData} className="text-[10px] uppercase font-bold border-primary text-primary hover:bg-primary/5 h-8">Restore Defaults</Button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="pb-10">
                  {(() => {
                    const cat = categories.find(c => c.name === selectedCategoryName);
                    if (!cat) {
                      setSelectedCategoryName(null);
                      return null;
                    }
                    const catId = (cat as any)._id || (cat as any).id || cat.name;
                    
                    return (
                      <div className="space-y-6">
                        <div className="flex items-center gap-4 mb-6">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => setSelectedCategoryName(null)} 
                            className="h-9 px-4 text-[10px] font-black uppercase tracking-widest text-slate-600 border-slate-200 hover:bg-slate-50 rounded-xl shadow-sm transition-all"
                          >
                            <ChevronLeft className="w-4 h-4 mr-2" /> Back to Categories
                          </Button>
                          <div className="h-6 w-[1px] bg-slate-200" />
                          <h3 className="text-base font-black uppercase tracking-widest text-primary">{cat.name}</h3>
                        </div>

                        <Card className="border-slate-200 shadow-sm overflow-hidden">
                          <CardHeader className="p-4 bg-slate-50 border-b border-slate-100">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-lg bg-white border border-slate-200 overflow-hidden flex-shrink-0 bg-[url('https://placehold.co/200x200?text=Error')] bg-cover">
                                  <img 
                                    key={editingImages[`cat-${catId}`]}
                                    src={editingImages[`cat-${catId}`] || cat.imageUrl || ""} 
                                    alt={cat.name} 
                                    className="w-full h-full object-cover" 
                                    referrerPolicy="no-referrer"
                                  />
                                </div>
                                <div>
                                  <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-900">Main Image</CardTitle>
                                  <p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">Category Cover</p>
                                </div>
                              </div>
                              <div className="flex gap-2 items-end w-full sm:w-auto">
                                <div className="flex flex-col gap-1 flex-1 sm:w-64">
                                  <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest pl-1">Image URL Address</label>
                                  <input 
                                    type="text"
                                    value={editingImages[`cat-${catId}`] || ''}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setEditingImages(prev => ({ ...prev, [`cat-${catId}`]: val }));
                                    }}
                                    placeholder="Paste Image URL here..."
                                    className="h-9 px-3 text-[10px] bg-white border-2 border-slate-200 rounded-xl outline-none focus:border-primary transition-all font-medium w-full"
                                  />
                                </div>
                                <Button 
                                  size="sm" 
                                  className="h-9 px-4 bg-primary text-white font-bold text-[10px] uppercase shadow-md hover:scale-105 transition-transform mb-0.5"
                                  onClick={() => handleUpdateCategoryMainImage(catId)}
                                >
                                  <Save className="w-3.5 h-3.5 mr-2" /> Save
                                </Button>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="p-0">
                            <div className="divide-y divide-slate-100">
                              {cat.subCategories.map((sub) => (
                                <div key={sub.name} className="p-4 hover:bg-slate-50/50 transition-colors">
                                  <div className="flex flex-col sm:flex-row gap-4">
                                    <div className="w-full sm:w-32 h-24 rounded-lg bg-white border border-slate-200 overflow-hidden flex-shrink-0 shadow-sm relative group bg-[url('https://placehold.co/400x300?text=No+Image')] bg-cover">
                                      <img 
                                        key={editingImages[`sub-${catId}-${sub.name}`]}
                                        src={editingImages[`sub-${catId}-${sub.name}`] || sub.imageUrl} 
                                        alt={sub.name} 
                                        className="w-full h-full object-cover transition-transform group-hover:scale-110" 
                                        referrerPolicy="no-referrer" 
                                      />
                                    </div>
                                    <div className="flex-1 space-y-3">
                                      <div className="flex items-center justify-between">
                                        <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-wider">{sub.name}</h4>
                                        <Badge variant="outline" className="text-[8px] font-bold text-slate-400 uppercase">Defect Type</Badge>
                                      </div>
                                      <p className="text-[10px] text-slate-500 font-medium leading-relaxed">{sub.description}</p>
                                      <div className="flex gap-2 items-end">
                                        <div className="flex flex-col gap-1 flex-1">
                                          <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest pl-1">Image Link (Paste Below)</label>
                                          <input 
                                            type="text"
                                            value={editingImages[`sub-${catId}-${sub.name}`] || ''}
                                            onChange={(e) => {
                                              const val = e.target.value;
                                              setEditingImages(prev => ({ ...prev, [`sub-${catId}-${sub.name}`]: val }));
                                            }}
                                            placeholder="Paste URL here..."
                                            className="h-9 px-3 text-[10px] bg-white border-2 border-slate-200 rounded-xl outline-none focus:border-primary transition-all font-medium w-full"
                                          />
                                        </div>
                                        <Button 
                                          variant="secondary"
                                          size="sm" 
                                          className="h-9 px-4 font-bold text-[10px] uppercase border-2 border-slate-200 hover:bg-slate-100 transition-colors shadow-sm"
                                          onClick={() => handleUpdateCategoryImage(catId, sub.name)}
                                        >
                                          <Save className="w-3.5 h-3.5 mr-2" /> Save
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>
        </TabsContent>
        <TabsContent value="models" className="mt-0 outline-none flex-1">
          <div className="h-[500px] sm:h-[calc(100vh-450px)] min-h-[400px] overflow-y-auto scrollbar-hide -webkit-overflow-scrolling-touch pb-20">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pr-4">
              {/* Add/Edit Model */}
              <Card className="border-slate-200 shadow-sm border-2">
                <CardHeader className="p-6 bg-slate-50/50">
                  <Badge variant="outline" className="w-fit mb-2 text-[8px] font-black tracking-[0.2em] border-primary text-primary">Templates</Badge>
                  <CardTitle className="text-xl font-black uppercase tracking-tighter">Garment Model Setup</CardTitle>
                  <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">Define baseline markers for categories</p>
                </CardHeader>
                <CardContent className="p-6 space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Garment Model Name (e.g. Round Neck T-Shirt)</label>
                    <Input 
                      placeholder="e.g. Round Neck T-Shirt" 
                      value={newModel.name || ''}
                      onChange={e => {
                        const val = e.target.value;
                        setNewModel(p => ({ 
                          ...p, 
                          name: val,
                          type: val
                        }));
                      }}
                      className="h-10 border-slate-200 focus:border-primary rounded-xl"
                    />
                  </div>


                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5 pt-1">
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center justify-between gap-2">
                        Front Baseline
                        <label className="cursor-pointer">
                          <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'frontImageUrl', 'model')} disabled={uploading} />
                          <span className="text-[8px] font-black text-primary hover:underline flex items-center gap-1">
                            {uploading ? <Loader2 className="w-2 h-2 animate-spin" /> : <Upload className="w-2 h-2" />}
                            UPLOAD
                          </span>
                        </label>
                      </label>
                      <Input 
                        placeholder="Front baseline URL..." 
                        value={newModel.frontImageUrl || ''}
                        onChange={e => setNewModel(p => ({ ...p, frontImageUrl: e.target.value }))}
                        className="h-10 border-slate-200 focus:border-primary rounded-xl text-[10px]"
                      />
                    </div>
                    <div className="space-y-1.5 pt-1">
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center justify-between gap-2">
                        Back Baseline
                        <label className="cursor-pointer">
                          <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'backImageUrl', 'model')} disabled={uploading} />
                          <span className="text-[8px] font-black text-primary hover:underline flex items-center gap-1">
                            {uploading ? <Loader2 className="w-2 h-2 animate-spin" /> : <Upload className="w-2 h-2" />}
                            UPLOAD
                          </span>
                        </label>
                      </label>
                      <Input 
                        placeholder="Back baseline URL..." 
                        value={newModel.backImageUrl || ''}
                        onChange={e => setNewModel(p => ({ ...p, backImageUrl: e.target.value }))}
                        className="h-10 border-slate-200 focus:border-primary rounded-xl text-[10px]"
                      />
                    </div>
                  </div>

                  {(newModel.frontImageUrl || newModel.backImageUrl) && (
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                            Mapping View
                          </label>
                          <div className="flex gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                             <button
                               onClick={() => setMapperView('front')}
                               className={`px-3 py-1 text-[8px] font-black rounded-md transition-all ${mapperView === 'front' ? 'bg-white shadow-sm text-primary' : 'text-slate-400'}`}
                             >
                               FRONT
                             </button>
                             <button
                               onClick={() => setMapperView('back')}
                               className={`px-3 py-1 text-[8px] font-black rounded-md transition-all ${mapperView === 'back' ? 'bg-white shadow-sm text-primary' : 'text-slate-400'}`}
                             >
                               BACK
                             </button>
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-6 text-[8px] font-bold text-red-500"
                          onClick={() => setNewModel(p => ({ ...p, customPoints: [] }))}
                        >
                          Clear Points
                        </Button>
                      </div>
                      
                      <div 
                        className="relative aspect-square bg-slate-100 rounded-2xl border-2 border-dashed border-slate-200 overflow-hidden cursor-crosshair group"
                        onClick={(e) => handlePointAdd(e, 'model')}
                      >
                        <img 
                          key={mapperView === 'front' ? newModel.frontImageUrl : newModel.backImageUrl}
                          src={getApiUrl(mapperView === 'front' ? (newModel.frontImageUrl || '') : (newModel.backImageUrl || ''))} 
                          alt="Layout mapping" 
                          className="w-full h-full object-contain p-4 pointer-events-none select-none"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-primary/2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                          <p className="text-[10px] font-black text-primary bg-white px-3 py-1.5 rounded-full shadow-lg uppercase tracking-widest border border-primary/20">Click to set marker</p>
                        </div>
                        
                        {newModel.customPoints?.map((point) => {
                          const isBackPoint = point.id.startsWith('B-');
                          if (mapperView === 'front' && isBackPoint) return null;
                          if (mapperView === 'back' && !isBackPoint) return null;

                          return (
                            <div
                              key={point.id}
                              className="absolute -translate-x-1/2 -translate-y-1/2 group/point"
                              style={{ left: `${point.x}%`, top: `${point.y}%` }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className={`w-8 h-8 rounded-full ${isBackPoint ? 'bg-rose-500' : 'bg-primary'} text-white text-[10px] font-black flex items-center justify-center shadow-lg border-2 border-white`}>
                                {point.id.replace('F-', '').replace('B-', '')}
                              </div>
                              <button 
                                onClick={() => removePoint(point.id, 'model')}
                                className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover/point:opacity-100 transition-opacity shadow-sm"
                              >
                                <X className="w-2.5 h-2.5" />
                              </button>
                            </div>
                          );
                        })}
                      </div>

                      <div className="space-y-2 max-h-48 overflow-y-auto pr-2 scrollbar-hide">
                         {newModel.customPoints?.map(p => (
                            <div key={p.id} className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
                               <div className="w-6 h-6 rounded bg-primary text-white text-[10px] font-black flex items-center justify-center shrink-0">
                                 {p.id}
                               </div>
                               <Input 
                                 value={p.label}
                                 onChange={(e) => updatePointLabel(p.id, e.target.value, 'model')}
                                 className="h-7 text-[10px] font-bold border-none focus-visible:ring-0 bg-transparent p-0 uppercase"
                                 placeholder="Location name..."
                               />
                            </div>
                         ))}
                      </div>
                    </div>
                  )}

                  <Button 
                    onClick={handleSaveModel}
                    className="w-full h-12 bg-slate-900 text-white font-black uppercase tracking-[0.2em] rounded-xl shadow-lg"
                  >
                    <Save className="w-4 h-4 mr-2" /> Save Model Template
                  </Button>
                </CardContent>
              </Card>

              {/* Model List */}
              <div className="space-y-4">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                  Existing Models <Badge className="bg-slate-100 text-slate-900 border-none h-4 px-1.5 text-[8px]">{models.length}</Badge>
                </h3>
                {models.map(model => (
                  <Card key={model.id || (model as any)._id} className="border-slate-200 shadow-sm hover:border-primary transition-all group overflow-hidden">
                    <div className="p-4 flex items-center gap-4">
                      <div className="w-16 h-16 rounded-lg bg-slate-50 border border-slate-100 flex-shrink-0 overflow-hidden flex items-center justify-center p-1">
                        <img src={getApiUrl(model.frontImageUrl || '')} alt={model.name} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <Badge className="bg-primary/5 text-primary border-none text-[8px] font-black">{model.type.toUpperCase()}</Badge>
                          <span className="text-[10px] font-bold text-slate-400 uppercase">{model.customPoints?.length || 0} Markers</span>
                        </div>
                        <h4 className="font-black text-slate-900 uppercase tracking-tight truncate">{model.name}</h4>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setNewModel(model)}
                          className="h-8 w-8 p-0 rounded-full hover:bg-slate-100"
                        >
                          <Eye className="w-4 h-4 text-slate-400" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => deleteModel(model.id || (model as any)._id)}
                          className="h-8 w-8 p-0 rounded-full hover:bg-red-50 hover:text-red-500"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="styles" className="mt-0 outline-none flex-1">
          <div className="h-[500px] sm:h-[calc(100vh-450px)] min-h-[400px] overflow-y-auto scrollbar-hide -webkit-overflow-scrolling-touch pb-20">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pr-4">
              {/* Add/Edit Section */}
              <Card className="border-slate-200 shadow-sm border-2">
                <CardHeader className="p-6 bg-slate-50/50">
                  <Badge variant="outline" className="w-fit mb-2 text-[8px] font-black tracking-[0.2em] border-primary text-primary">Configuration</Badge>
                  <CardTitle className="text-xl font-black uppercase tracking-tighter">Style Layout Setup</CardTitle>
                  <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">Map custom layouts & images</p>
                </CardHeader>
                <CardContent className="p-6 space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Barcode ID</label>
                      <Input 
                        placeholder="e.g. 123456" 
                        value={newStyle.barcode || ''}
                        onChange={e => setNewStyle(p => ({ ...p, barcode: e.target.value }))}
                        className="h-10 border-slate-200 focus:border-primary rounded-xl"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Style Name</label>
                      <Input 
                        placeholder="e.g. Polo Shirt" 
                        value={newStyle.name || ''}
                        onChange={e => setNewStyle(p => ({ ...p, name: e.target.value }))}
                        className="h-10 border-slate-200 focus:border-primary rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Apply Template Model (Optional)</label>
                    <select 
                      value={newStyle.modelId || ''}
                      onChange={e => {
                        const mid = e.target.value;
                        const model = models.find(m => (m as any)._id === mid || m.id === mid);
                        if (model) {
                          setNewStyle(p => ({ 
                            ...p, 
                            modelId: mid,
                            type: model.type,
                            frontImageUrl: model.frontImageUrl,
                            backImageUrl: model.backImageUrl,
                            customPoints: [...model.customPoints]
                          }));
                          toast.success(`Template "${model.name}" applied`);
                        } else {
                          setNewStyle(p => ({ ...p, modelId: undefined }));
                        }
                      }}
                      className="w-full h-10 border-emerald-200 border-2 rounded-xl px-3 text-[12px] font-black uppercase outline-none focus:border-emerald-500 bg-emerald-50/30"
                    >
                      <option value="">-- No Template (Custom) --</option>
                      {models.map(m => (
                        <option key={m.id || (m as any)._id} value={m.id || (m as any)._id}>
                          {m.name} ({m.customPoints.length} pts)
                        </option>
                      ))}
                    </select>
                  </div>


                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5 pt-1">
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center justify-between gap-2">
                        Front Image
                        <label className="cursor-pointer">
                          <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'frontImageUrl')} disabled={uploading} />
                          <span className="text-[8px] font-black text-primary hover:underline flex items-center gap-1">
                            {uploading ? <Loader2 className="w-2 h-2 animate-spin" /> : <Upload className="w-2 h-2" />}
                            UPLOAD
                          </span>
                        </label>
                      </label>
                      <div className="flex gap-2">
                        {newStyle.frontImageUrl && (
                          <div className="w-10 h-10 rounded-lg border border-slate-200 overflow-hidden flex-shrink-0 bg-white">
                            <img src={getApiUrl(newStyle.frontImageUrl)} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                          </div>
                        )}
                        <Input 
                          placeholder="Front view URL..." 
                          value={newStyle.frontImageUrl || ''}
                          onChange={e => setNewStyle(p => ({ ...p, frontImageUrl: e.target.value }))}
                          className="h-10 border-slate-200 focus:border-primary rounded-xl text-[10px] flex-1"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5 pt-1">
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center justify-between gap-2">
                        Back Image
                        <label className="cursor-pointer">
                          <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'backImageUrl')} disabled={uploading} />
                          <span className="text-[8px] font-black text-primary hover:underline flex items-center gap-1">
                            {uploading ? <Loader2 className="w-2 h-2 animate-spin" /> : <Upload className="w-2 h-2" />}
                            UPLOAD
                          </span>
                        </label>
                      </label>
                      <div className="flex gap-2">
                        {newStyle.backImageUrl && (
                          <div className="w-10 h-10 rounded-lg border border-slate-200 overflow-hidden flex-shrink-0 bg-white">
                            <img src={getApiUrl(newStyle.backImageUrl)} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                          </div>
                        )}
                        <Input 
                          placeholder="Back view URL..." 
                          value={newStyle.backImageUrl || ''}
                          onChange={e => setNewStyle(p => ({ ...p, backImageUrl: e.target.value }))}
                          className="h-10 border-slate-200 focus:border-primary rounded-xl text-[10px] flex-1"
                        />
                      </div>
                    </div>
                  </div>

                  {(newStyle.frontImageUrl || newStyle.backImageUrl || newStyle.layoutImage) && (
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                            Visual Mapper
                          </label>
                          <div className="flex gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                             <button
                               onClick={() => setMapperView('front')}
                               className={`px-3 py-1 text-[8px] font-black rounded-md transition-all ${mapperView === 'front' ? 'bg-white shadow-sm text-primary' : 'text-slate-400'}`}
                             >
                               FRONT
                             </button>
                             <button
                               onClick={() => setMapperView('back')}
                               className={`px-3 py-1 text-[8px] font-black rounded-md transition-all ${mapperView === 'back' ? 'bg-white shadow-sm text-primary' : 'text-slate-400'}`}
                             >
                               BACK
                             </button>
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-6 text-[8px] font-bold text-red-500"
                          onClick={() => setNewStyle(p => ({ ...p, customPoints: [] }))}
                        >
                          Clear All Points
                        </Button>
                      </div>
                      
                      <div 
                        className="relative aspect-square bg-slate-100 rounded-2xl border-2 border-dashed border-slate-200 overflow-hidden cursor-crosshair group"
                        onClick={(e) => handlePointAdd(e, 'style')}
                      >
                        <img 
                          key={mapperView === 'front' ? (newStyle.frontImageUrl || newStyle.layoutImage) : newStyle.backImageUrl}
                          src={getApiUrl(mapperView === 'front' ? (newStyle.frontImageUrl || newStyle.layoutImage || '') : (newStyle.backImageUrl || ''))} 
                          alt="Layout mapping" 
                          className="w-full h-full object-contain p-4 pointer-events-none select-none"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            if (!target.src.includes('broken')) {
                               // toast.error('Image load failed. Link might be restricted.');
                            }
                          }}
                        />
                        <div className="absolute inset-0 bg-primary/2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                          <p className="text-[10px] font-black text-primary bg-white px-3 py-1.5 rounded-full shadow-lg uppercase tracking-widest border border-primary/20">Click anywhere to mark ({mapperView.toUpperCase()})</p>
                        </div>
                        
                        {newStyle.customPoints?.map((point) => {
                          const isBackPoint = point.id.startsWith('B-');
                          // Only show points matching the current view
                          if (mapperView === 'front' && isBackPoint) return null;
                          if (mapperView === 'back' && !isBackPoint) return null;

                          return (
                            <div
                              key={point.id}
                              className="absolute -translate-x-1/2 -translate-y-1/2 group/point"
                              style={{ left: `${point.x}%`, top: `${point.y}%` }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className={`w-8 h-8 rounded-full ${isBackPoint ? 'bg-rose-500' : 'bg-primary'} text-white text-[10px] font-black flex items-center justify-center shadow-lg border-2 border-white`}>
                                {point.id.replace('F-', '').replace('B-', '')}
                              </div>
                              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 whitespace-nowrap bg-slate-900 text-white text-[8px] font-bold px-2 py-0.5 rounded uppercase tracking-widest">
                                {point.label}
                              </div>
                              <button 
                                onClick={() => removePoint(point.id, 'style')}
                                className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover/point:opacity-100 transition-opacity shadow-sm"
                              >
                                <X className="w-2.5 h-2.5" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                      
                      {newStyle.customPoints && newStyle.customPoints.length > 0 && (
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-2 scrollbar-hide border-t border-slate-100 pt-3">
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Click below to rename markers:</p>
                          <div className="grid grid-cols-1 gap-2">
                            {newStyle.customPoints.map(p => (
                              <div key={p.id} className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-100 group/item">
                                <div className="w-6 h-6 rounded bg-primary text-white text-[10px] font-black flex items-center justify-center shrink-0">
                                  {p.id}
                                </div>
                                <Input 
                                  value={p.label}
                                  onChange={(e) => updatePointLabel(p.id, e.target.value, 'style')}
                                  className="h-7 text-[10px] font-bold border-none focus-visible:ring-0 bg-transparent p-0 uppercase"
                                  placeholder="Enter Location Name..."
                                />
                                <button 
                                  onClick={() => removePoint(p.id, 'style')}
                                  className="opacity-0 group-hover/item:opacity-100 transition-opacity p-1 text-slate-400 hover:text-red-500"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <Button 
                    onClick={handleSaveStyle}
                    className="w-full h-12 bg-primary text-white font-black uppercase tracking-[0.2em] rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.01] transition-transform"
                  >
                    <Save className="w-4 h-4 mr-2" /> Save Configuration
                  </Button>
                </CardContent>
              </Card>

              {/* List Section */}
              <div className="space-y-4">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                  Active Configurations <Badge className="bg-slate-100 text-slate-900 border-none h-4 px-1.5 text-[8px]">{styles.length}</Badge>
                </h3>
                {styles.map(style => (
                  <Card key={style.id} className="border-slate-200 shadow-sm hover:border-primary transition-all group overflow-hidden">
                    <div className="p-4 flex items-center gap-4">
                      <div className="w-16 h-16 rounded-lg bg-slate-50 border border-slate-100 flex-shrink-0 overflow-hidden flex items-center justify-center p-1">
                        {style.frontImageUrl || style.layoutImage ? (
                          <img src={getApiUrl(style.frontImageUrl || style.layoutImage || '')} alt={style.name} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                        ) : (
                          <ImageIcon className="w-6 h-6 text-slate-200" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <Badge className="bg-primary/5 text-primary border-none text-[8px] font-black">{style.type.toUpperCase()}</Badge>
                          <span className="text-[10px] font-mono text-slate-400 uppercase">BARCODE: {style.barcode}</span>
                        </div>
                        <h4 className="font-black text-slate-900 uppercase tracking-tight truncate">{style.name}</h4>
                        <div className="flex items-center gap-3 mt-1.5">
                          {(style.frontImageUrl || style.backImageUrl) && (
                            <p className="text-[7.5px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-1 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-100">
                              <CheckCircle2 className="w-2.5 h-2.5" /> DUAL VIEW
                            </p>
                          )}
                          {style.layoutImage && !style.frontImageUrl && !style.backImageUrl && (
                            <p className="text-[7.5px] font-black text-blue-500 uppercase tracking-widest flex items-center gap-1 bg-blue-50 px-1.5 py-0.5 rounded-full border border-blue-100">
                              <ImageIcon className="w-2.5 h-2.5" /> SINGLE LAYOUT
                            </p>
                          )}
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setNewStyle(style)}
                        className="h-8 w-8 p-0 rounded-full hover:bg-slate-100"
                      >
                        <ExternalLink className="w-4 h-4 text-slate-400" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="analytics" className="mt-0 outline-none flex-1">
          <div className="h-[500px] sm:h-[calc(100vh-450px)] min-h-[400px] overflow-y-auto scrollbar-hide -webkit-overflow-scrolling-touch pb-20">
            <div className="space-y-8 pr-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Style Breakdown */}
                <Card className="border-slate-200 shadow-sm">
                  <CardHeader className="p-6">
                    <div className="flex items-center gap-3">
                      <BarChart3 className="w-5 h-5 text-primary" />
                      <CardTitle className="text-sm font-black uppercase tracking-widest">Defects by Style</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="h-[300px] p-6 pt-0">
                    {globalStats?.styles.length ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={globalStats.styles} layout="vertical" margin={{ left: 10, right: 20, top: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.1} />
                          <XAxis type="number" hide />
                          <YAxis 
                            dataKey="name" 
                            type="category" 
                            width={80} 
                            fontSize={8} 
                            fontWeight="bold" 
                            tick={{ fill: '#64748b' }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <ReTooltip 
                            contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', color: 'white' }}
                            itemStyle={{ color: '#fff', fontSize: '10px', fontWeight: 'bold' }}
                            labelStyle={{ display: 'none' }}
                          />
                          <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={20}>
                            {globalStats.styles.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={index === 0 ? '#f43f5e' : '#fb7185'} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-slate-400 text-[10px] font-bold uppercase">No style data available</div>
                    )}
                  </CardContent>
                </Card>

                {/* Part Failure Analysis */}
                <Card className="border-slate-200 shadow-sm">
                  <CardHeader className="p-6">
                    <div className="flex items-center gap-3">
                      <TrendingUp className="w-5 h-5 text-emerald-500" />
                      <CardTitle className="text-sm font-black uppercase tracking-widest">Part Failure Frequencies</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="h-[300px] p-6 pt-0">
                    {globalStats?.parts.length ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={globalStats.parts} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                          <XAxis 
                            dataKey="name" 
                            fontSize={8} 
                            fontWeight="bold" 
                            tick={{ fill: '#64748b' }}
                            axisLine={false}
                            tickLine={false}
                            angle={-45}
                            textAnchor="end"
                            height={60}
                          />
                          <YAxis fontSize={9} fontWeight="bold" tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} />
                          <ReTooltip 
                            contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', color: 'white' }}
                          />
                          <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={24} fill="#6366f1" />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-slate-400 text-[10px] font-bold uppercase">No part data available</div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Operator & Worker Performance Sections */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-20">
                {/* Operator Leaderboard (Existing) */}
                <Card className="border-slate-200 shadow-sm">
                  <CardHeader className="p-6">
                    <div className="flex items-center gap-3">
                      <Users className="w-5 h-5 text-blue-500" />
                      <CardTitle className="text-sm font-black uppercase tracking-widest">Inspector Output</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 pt-0">
                    <div className="rounded-2xl border border-slate-100 overflow-hidden">
                      <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-100">
                          <tr>
                            <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">Inspector</th>
                            <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 text-right">Reports</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {globalStats?.operators.map((op, i) => (
                            <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center">
                                    <User className="w-3.5 h-3.5 text-slate-400" />
                                  </div>
                                  <span className="text-[11px] font-bold text-slate-900 truncate max-w-[120px]">{op.email}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-right">
                                <Badge className="bg-blue-100 text-blue-600 border-none text-[10px]">
                                  {op.count}
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>

                {/* Worker Fault Log (New) */}
                <Card className="border-slate-200 shadow-sm border-rose-100 border-2">
                  <CardHeader className="p-6">
                    <div className="flex items-center gap-3">
                      <AlertCircle className="w-5 h-5 text-rose-500" />
                      <CardTitle className="text-sm font-black uppercase tracking-widest">Worker Defect Logs</CardTitle>
                    </div>
                    <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">High-frequency mistakes by worker & operation</p>
                  </CardHeader>
                  <CardContent className="p-6 pt-0">
                    <div className="rounded-2xl border border-rose-50 overflow-hidden">
                      <table className="w-full text-left">
                        <thead className="bg-rose-50/50 border-b border-rose-100">
                          <tr>
                            <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-rose-800">Worker</th>
                            <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-rose-800">Operation</th>
                            <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-rose-800 text-right">Mistakes</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-rose-50">
                          {globalStats?.workerPerformance?.map((wp, i) => (
                            <tr key={i} className="hover:bg-rose-50/30 transition-colors">
                              <td className="px-4 py-4">
                                <div className="space-y-1">
                                  <span className="text-[11px] font-black text-slate-900 uppercase block">{wp.name}</span>
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Common Defect:</span>
                                    <span className="text-[8px] font-black text-rose-500 uppercase">{wp.topDefect}</span>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-4">
                                <Badge variant="outline" className="text-[9px] font-black text-slate-400 border-slate-200 px-2">
                                  {wp.operation}
                                </Badge>
                              </td>
                              <td className="px-4 py-4 text-right">
                                <span className="text-sm font-black text-rose-600">{wp.count}</span>
                              </td>
                            </tr>
                          ))}
                          {(!globalStats?.workerPerformance || globalStats.workerPerformance.length === 0) && (
                            <tr>
                              <td colSpan={3} className="px-4 py-12 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                No worker mistakes logged yet
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
