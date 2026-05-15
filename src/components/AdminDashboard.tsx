import React, { useState } from 'react';
import { DefectCategory } from '../types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Toaster } from '@/components/ui/sonner';
import { motion } from 'motion/react';
import { LayoutDashboard, RefreshCcw, ArrowLeft } from 'lucide-react';

interface AdminDashboardProps {
  categories: DefectCategory[];
  onRefreshCategories: () => void;
  onBackToHome: () => void;
}

export function AdminDashboard({ categories, onRefreshCategories, onBackToHome }: AdminDashboardProps) {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <Toaster position="bottom-right" theme="light" />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
            <LayoutDashboard className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight">Admin Dashboard</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Defect Category Management</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onRefreshCategories} className="h-10 px-4 text-[10px] font-black uppercase tracking-widest rounded-xl">
            <RefreshCcw className="w-3.5 h-3.5 mr-2" />
            Refresh
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
    operators: { email: string, count: number }[]
  } | null>(null);
  const [viewingReport, setViewingReport] = useState<DefectReport | null>(() => {
    const saved = localStorage.getItem('scm_viewingReport');
    if (saved) {
      try { return JSON.parse(saved); } catch(e) { /* ignore */ }
    }
    return null;
  });
  const [styles, setStyles] = useState<Style[]>([]);
  const [newStyle, setNewStyle] = useState<Partial<Style>>({ type: 'tshirt' });
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, targetField: 'layoutImage' | 'frontImageUrl' | 'backImageUrl' = 'layoutImage') => {
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
      setNewStyle(p => ({ ...p, [targetField]: data.imageUrl }));
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
      setNewStyle({ type: 'tshirt' });
      fetchStyles();
    } catch (e) {
      toast.error('Failed to save style');
    }
  };

  const [mapperView, setMapperView] = useState<'front' | 'back'>('front');

  const handlePointAdd = (e: React.MouseEvent<HTMLDivElement>) => {
    const currentImageUrl = mapperView === 'front' ? (newStyle.frontImageUrl || newStyle.layoutImage) : newStyle.backImageUrl;
    if (!currentImageUrl) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Number(((e.clientX - rect.left) / rect.width * 100).toFixed(2));
    const y = Number(((e.clientY - rect.top) / rect.height * 100).toFixed(2));
    
    // Generate next alphabet ID
    const pointCount = newStyle.customPoints?.length || 0;
    const id = String.fromCharCode(65 + (pointCount % 26)) + (pointCount >= 26 ? Math.floor(pointCount / 26) : '');
    const prefix = mapperView === 'back' ? 'B-' : 'F-';
    const finalId = prefix + id;
    const label = `Marker ${finalId}`;
    
    setNewStyle(prev => ({
      ...prev,
      customPoints: [...(prev.customPoints || []), { id: finalId, label, x, y }]
    }));
  };

  const removePoint = (id: string) => {
    setNewStyle(prev => ({
      ...prev,
      customPoints: prev.customPoints?.filter(p => p.id !== id)
    }));
  };

  const updatePointLabel = (id: string, label: string) => {
    setNewStyle(prev => ({
      ...prev,
      customPoints: prev.customPoints?.map(p => p.id === id ? { ...p, label } : p)
    }));
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
      const opCounts: Record<string, number> = {};

      reports.forEach(r => {
        const style = r.styleName || 'Unknown';
        styleCounts[style] = (styleCounts[style] || 0) + (r.defects?.length || 1);
        const opName = r.inspectorName || r.reporterEmail || 'Unknown';
        opCounts[opName] = (opCounts[opName] || 0) + (r.defects?.length || 1);
        
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

      setGlobalStats({
        styles: Object.entries(styleCounts).map(([name, count]) => ({ name, count })).sort((a,b) => b.count - a.count).slice(0, 10),
        parts: Object.entries(partCounts).map(([name, count]) => ({ name, count })).sort((a,b) => b.count - a.count).slice(0, 15),
        operators: Object.entries(opCounts).map(([email, count]) => ({ email, count })).sort((a,b) => b.count - a.count).slice(0, 10)
      });
    }
  };

  useEffect(() => {
    fetchStyles();
    fetchReports();
    fetchHealth();
    // Also keep Firebase listener for true real-time if available
    const unsubscribe = firebaseService.listenToReports((data) => {
      if (data && data.length >= reports.length) {
        const sortedData = [...data].sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setReports(sortedData);
      }
    });

    // Periodic poll for stats
    const interval = setInterval(() => {
      fetchGlobalStats();
    }, 30000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

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
                    (Warnings: Check MongoDB Secret in Settings)
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
        </div>
      </div>

      <Card className="border-slate-200 shadow-xl bg-white rounded-3xl overflow-hidden">
        <CardHeader className="p-6 border-b border-slate-50">
          <CardTitle className="text-sm font-black uppercase tracking-widest">Defect Categories ({categories.length})</CardTitle>
          <CardDescription className="text-[10px] font-bold text-slate-400">Manage inspection categories and sub-categories</CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          {categories.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm font-medium text-slate-400">No categories loaded</p>
            </div>
          ) : (
            categories.map((cat) => (
              <div key={cat.name} className="border border-slate-100 rounded-2xl overflow-hidden">
                <button
                  onClick={() => setExpandedCategory(expandedCategory === cat.name ? null : cat.name)}
                  className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <span className="text-xs font-black text-primary">{cat.icon || cat.name.charAt(0)}</span>
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-black text-slate-900">{cat.name}</p>
                      <p className="text-[10px] font-medium text-slate-400">{cat.subCategories?.length || 0} sub-categories</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[9px] font-black uppercase border-slate-200">
                    {expandedCategory === cat.name ? 'Hide' : 'Show'}
                  </Badge>
                </button>
                {expandedCategory === cat.name && (
                  <div className="px-4 pb-4 pt-0 border-t border-slate-50">
                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {cat.subCategories?.map((sub) => (
                        <div key={sub.name} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                          <div>
                            <p className="text-xs font-bold text-slate-900">{sub.name}</p>
                            <p className="text-[9px] text-slate-400 font-medium uppercase tracking-widest truncate max-w-[200px]">{sub.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))
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

              {/* Operator Leaderboard */}
              <Card className="border-slate-200 shadow-sm">
                <CardHeader className="p-6">
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-blue-500" />
                    <CardTitle className="text-sm font-black uppercase tracking-widest">Inspector Productivity Logs</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-6 pt-0">
                  <div className="rounded-2xl border border-slate-100 overflow-hidden">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 border-b border-slate-100">
                        <tr>
                          <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">Inspector Name / Email</th>
                          <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 text-right">Faults Identified</th>
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
                                <span className="text-[11px] font-bold text-slate-900">{op.email}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <Badge className={op.count > 50 ? "bg-rose-100 text-rose-600 border-none" : "bg-blue-100 text-blue-600 border-none"}>
                                {op.count} LOGS
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default AdminDashboard;
