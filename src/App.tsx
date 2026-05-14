import * as React from 'react';
import { useState, useEffect } from 'react';
import { GarmentType, Style, SelectedDefect, DefectReport, DefectCategory, UserProfile, StyleStats } from './types';
import { DEFECT_CATEGORIES } from './constants';
import { GarmentModel } from './components/GarmentModel';
import { DefectForm } from './components/DefectForm';
import { AdminDashboard } from './components/AdminDashboard';
import { ScannerDialog } from './components/ScannerDialog';
import { LandingScanner } from './components/LandingScanner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { Scan, Factory, AlertCircle, Lock, User as UserIcon, ClipboardList, ChevronRight, X, LayoutDashboard, History, PenTool, RefreshCcw, Layout, Clock, PlusCircle, ArrowRight, Plus, MapPin, Info, CheckCircle2, Barcode, Layers, Users } from 'lucide-react';
import { getApiUrl, fetchApi } from './lib/api';
import { firebaseService } from './services/firebaseService';
import { auth } from './lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import firebaseConfig from '../firebase-applet-config.json';

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('scm_user');
    if (saved) {
      try { return JSON.parse(saved); } catch(e) { /* ignore */ }
    }
    return { 
      uid: 'guest-employee', 
      name: 'Guest Operator', 
      role: 'employee', 
      email: 'guest@scmgarments.com' 
    };
  });
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(() => {
    return localStorage.getItem('scm_isAdmin') === 'true';
  });
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<'employee' | 'admin'>(() => {
    return (localStorage.getItem('scm_view') as 'employee' | 'admin') || 'employee';
  });
  const [workflowStep, setWorkflowStep] = useState<'landing' | 'setup' | 'marking' | 'summary' | 'history'>(() => {
    return (localStorage.getItem('scm_workflowStep') as any) || 'landing';
  });
  const [scannedBundleData, setScannedBundleData] = useState<{ bundleNo: string; qty: string; styleNo: string } | null>(() => {
    const saved = localStorage.getItem('scm_bundleData');
    return saved ? JSON.parse(saved) : null;
  });
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [barcode, setBarcode] = useState('');
  const [currentStyle, setCurrentStyle] = useState<Style | null>(() => {
    const saved = localStorage.getItem('scm_style');
    if (saved) {
      try { return JSON.parse(saved); } catch(e) { /* ignore */ }
    }
    return null;
  });
  const [selectedParts, setSelectedParts] = useState<string[]>(() => {
    const saved = localStorage.getItem('scm_selectedParts');
    return saved ? JSON.parse(saved) : [];
  });
  const [isReporting, setIsReporting] = useState(() => {
    return localStorage.getItem('scm_isReporting') === 'true';
  });
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [categories, setCategories] = useState<DefectCategory[]>(DEFECT_CATEGORIES);
  const [styleStats, setStyleStats] = useState<StyleStats>({ counts: {}, details: {}, totalReports: 0, totalDefects: 0 });
  const [inspectedPart, setInspectedPart] = useState<string | null>(null);
  const [inspectorName, setInspectorName] = useState<string>(() => {
    return localStorage.getItem('scm_inspector_name') || '';
  });
  const [operation, setOperation] = useState<string>(() => {
    return localStorage.getItem('scm_operation') || '';
  });
  const [operatorName, setOperatorName] = useState<string>(() => {
    return localStorage.getItem('scm_operator_name') || '';
  });
  const [savedInspectors, setSavedInspectors] = useState<string[]>(() => {
    const saved = localStorage.getItem('scm_saved_inspectors');
    return saved ? JSON.parse(saved) : ['Riaz', 'Aijaz']; // Default starters
  });
  const [isDualView, setIsDualView] = useState(true);
  const [showInspectorModal, setShowInspectorModal] = useState(false);
  const [tempInspectorName, setTempInspectorName] = useState('');
  const [historyReports, setHistoryReports] = useState<DefectReport[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyFilter, setHistoryFilter] = useState<'mine' | 'all'>('mine');

  // Handle modal open
  useEffect(() => {
    if (showInspectorModal) {
      setTempInspectorName(inspectorName);
    }
  }, [showInspectorModal]);

  // Initial modal trigger - FORCE if identity missing
  useEffect(() => {
    if (!inspectorName && view === 'employee') {
      setShowInspectorModal(true);
    }
  }, [inspectorName, view]);

  // Persist states to localStorage
  useEffect(() => {
    localStorage.setItem('scm_user', JSON.stringify(user));
    localStorage.setItem('scm_isAdmin', String(isAdminLoggedIn));
    localStorage.setItem('scm_view', view);
    localStorage.setItem('scm_selectedParts', JSON.stringify(selectedParts));
    localStorage.setItem('scm_isReporting', String(isReporting));
    localStorage.setItem('scm_inspector_name', inspectorName);
    localStorage.setItem('scm_operation', operation);
    localStorage.setItem('scm_operator_name', operatorName);
    localStorage.setItem('scm_saved_inspectors', JSON.stringify(savedInspectors));
    localStorage.setItem('scm_workflowStep', workflowStep);
    if (scannedBundleData) localStorage.setItem('scm_bundleData', JSON.stringify(scannedBundleData));
    if (currentStyle) {
      localStorage.setItem('scm_style', JSON.stringify(currentStyle));
    } else {
      localStorage.removeItem('scm_style');
    }
  }, [user, isAdminLoggedIn, view, currentStyle, selectedParts, isReporting, inspectorName, operation, operatorName, savedInspectors, workflowStep, scannedBundleData]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (authUser) => {
      if (authUser) {
        setUser({
          uid: authUser.uid,
          name: authUser.displayName || authUser.email?.split('@')[0] || 'User',
          role: 'employee',
          email: authUser.email || ''
        });
      }
    });

    fetchCategories();
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (currentStyle?.barcode) {
      fetchStyleStats(currentStyle.barcode);
    } else {
      setStyleStats({ counts: {}, details: {} });
    }
  }, [currentStyle]);

  const fetchStyleStats = async (barcode: string) => {
    try {
      const data = await fetchApi(`/api/stats/style/${barcode}`);
      setStyleStats(data || { counts: {}, details: {}, totalReports: 0, totalDefects: 0 });
    } catch (error) {
      console.warn('Style stats fetch failed, will retry later:', error);
    }
  };

  const fetchCategories = async () => {
    // Strategy: Try Local API, then Firebase, then fallback to constants
    let success = false;

    // 1. Try Local API (Express/MongoDB)
    try {
      const apiData = await fetchApi('/api/categories');
      if (apiData && Array.isArray(apiData) && apiData.length > 0) {
        setCategories(apiData);
        success = true;
        console.log('[App] Categories loaded via API');
      }
    } catch (error) {
      console.warn('[App] Local API categories fetch failed, trying Firebase...');
    }

    if (success) return;

    // 2. Try Firebase (only if config is valid)
    const isFirebaseConfigured = !firebaseConfig.apiKey.includes('remixed-');
    if (isFirebaseConfigured) {
      try {
        const fbData = await firebaseService.getCategories();
        if (fbData && Array.isArray(fbData) && fbData.length > 0) {
          setCategories(fbData);
          success = true;
          console.log('[App] Categories loaded via Firebase');
        }
      } catch (error) {
        console.warn('[App] Firebase categories fetch failed, using constants...');
      }
    } else {
      console.log('[App] Firebase not configured (placeholders detected), skipping...');
    }

    if (success) return;

    // 3. Fallback to hardcoded constants
    setCategories(DEFECT_CATEGORIES);
    console.log('[App] Categories loaded via constants (fallback)');
  };

  // Login State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await fetchApi('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      
      if (data.success) {
        setUser({ uid: 'admin-id', ...data.user });
        setIsAdminLoggedIn(true);
        setView('admin');
        setShowAdminLogin(false);
        toast.success('Welcome, Admin');
      } else {
        toast.error(data.message || 'Invalid credentials');
      }
    } catch (error: any) {
      toast.error(error.message || 'Connection error');
    } finally {
      setLoading(false);
    }
  };

  const handleSetInspector = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    
    setInspectorName(trimmed);
    if (!savedInspectors.includes(trimmed)) {
      setSavedInspectors(prev => [trimmed, ...prev].slice(0, 5)); // Keep last 5
    }
    setShowInspectorModal(false);
    toast.success(`Active Inspector: ${trimmed}`);
  };
  const handleLogout = () => {
    setUser({ 
      uid: 'guest-employee', 
      name: 'Guest Operator', 
      role: 'employee', 
      email: 'guest@scmgarments.com' 
    });
    setIsAdminLoggedIn(false);
    setView('employee');
    setWorkflowStep('landing');
    setCurrentStyle(null);
    setScannedBundleData(null);
    localStorage.clear();
    toast.info('Logged out from session');
  };

  const handleScanLanding = async (data: { bundleNo: string; qty: string; styleNo: string }) => {
    // If we only got a styleNo (raw scan), we use it
    const searchCode = (data.styleNo || data.bundleNo || "").trim(); 
    setScannedBundleData(data);
    
    if (!searchCode) {
      toast.error('Scan successful but no data detected');
      return;
    }

    // Call the more robust handleScan function to process this barcode
    await handleScan(searchCode);
  };

  useEffect(() => {
    if (workflowStep === 'history') {
      setHistoryLoading(true);
      const unsubscribe = firebaseService.listenToReports((allReports) => {
        if (historyFilter === 'mine' && inspectorName) {
          const myReports = allReports.filter(r => 
            r.inspectorName?.toLowerCase() === inspectorName.toLowerCase()
          );
          setHistoryReports(myReports);
        } else {
          setHistoryReports(allReports);
        }
        setHistoryLoading(false);
      });
      return () => unsubscribe();
    }
  }, [workflowStep, inspectorName, historyFilter]);

  const handleReturnHome = () => {
    setView('employee');
    setWorkflowStep('landing');
    setCurrentStyle(null);
    setScannedBundleData(null);
  };

  const handleAdminClick = () => {
    if (isAdminLoggedIn) {
      setView('admin');
    } else {
      setShowAdminLogin(true);
    }
  };

  const handleScan = async (scannedBarcode?: string | React.FormEvent) => {
    if (scannedBarcode && typeof scannedBarcode !== 'string') {
      scannedBarcode.preventDefault();
    }
    
    const rawCode = typeof scannedBarcode === 'string' ? scannedBarcode : barcode;
    let codeToSearch = rawCode.trim();
    
    // Help users who might scan URLs by mistake
    if (codeToSearch.startsWith('http')) {
      try {
        const url = new URL(codeToSearch);
        const pathParts = url.pathname.split('/').filter(Boolean);
        const idFromQuery = url.searchParams.get('id') || url.searchParams.get('barcode');
        const idFromPath = pathParts[pathParts.length - 1];
        codeToSearch = idFromQuery || idFromPath || codeToSearch;
      } catch (e) {}
    }

    if (!codeToSearch) return;

    setLoading(true);
    try {
      // 1. Try Local API first (standard path)
      try {
        // We use query parameter to find exact style
        const styles = await fetchApi(`/api/styles?barcode=${encodeURIComponent(codeToSearch)}`);
        
        console.log(`[App] Style Search Results for "${codeToSearch}":`, styles);

        if (styles && Array.isArray(styles) && styles.length > 0) {
          setBarcode(codeToSearch);
          setCurrentStyle(styles[0]);
          toast.success(`Style Found: ${styles[0].name}`);
          setWorkflowStep('marking');
          setIsScannerOpen(false);
          return;
        }
      } catch (apiErr) {
        console.warn("Local API style fetch failed", apiErr);
      }

      // 2. Try Firebase as secondary
      let fbStyle = null;
      try {
        fbStyle = await firebaseService.getStyleByBarcode(codeToSearch);
      } catch (fbErr) {
        console.warn("Firebase style fetch failed:", fbErr);
      }

      if (fbStyle) {
        setBarcode(codeToSearch);
        setCurrentStyle(fbStyle);
        toast.success(`Style Found (Cloud): ${fbStyle.name}`);
        setWorkflowStep('marking');
        setIsScannerOpen(false);
        return;
      }

      // 3. Style not found - ask to find or create
      toast.error(`Style "${codeToSearch}" not found in database.`);
      
      // Optional: Ask user if they want to load a demo or check Admin
      if (confirm(`Style "${codeToSearch}" not found. Would you like to load a demo version?`)) {
        let dummyStyle: Style;
        if (codeToSearch.toUpperCase().includes('SHORTS')) {
          dummyStyle = {
            id: 'demo-shorts',
            barcode: codeToSearch,
            name: 'Flex Shorts (Demo)',
            type: 'shorts',
            frontImageUrl: 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?auto=format&fit=crop&q=80&w=600',
            backImageUrl: 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?auto=format&fit=crop&q=80&w=600&rot=180',
            customPoints: [
              { id: 'F-W', label: 'WAISTBAND', x: 50, y: 15 },
              { id: 'F-L', label: 'LEFT LEG', x: 30, y: 70 },
              { id: 'F-R', label: 'RIGHT LEG', x: 70, y: 70 },
              { id: 'B-P', label: 'BACK POCKET', x: 25, y: 40 },
              { id: 'B-W', label: 'BACK WAIST', x: 50, y: 12 }
            ]
          };
        } else {
          dummyStyle = {
            id: 'demo-tshirt',
            barcode: codeToSearch,
            name: 'Classic White T-Shirt (Demo)',
            type: 'tshirt',
            // Using placeholder SVG images instead of people
            frontImageUrl: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&q=80&w=600&fm=jpg&q=0&blur=1000', // Heavily blurred original or replace
            backImageUrl: '',
            customPoints: [
              { id: 'F-NECK', label: 'NECK / COLLAR', x: 50, y: 24 },
              { id: 'F-CHEST', label: 'CHEST', x: 50, y: 45 },
              { id: 'B-NECK', label: 'BACK NECK', x: 50, y: 22 },
              { id: 'B-BODY', label: 'BACK BODY', x: 50, y: 60 }
            ]
          };
          // Better: Use a reliable clean t-shirt image
          dummyStyle.frontImageUrl = 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?auto=format&fit=crop&q=80&w=600';
          dummyStyle.backImageUrl = 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?auto=format&fit=crop&q=80&w=600&rot=180';
        }
        
        setBarcode(codeToSearch);
        setCurrentStyle(dummyStyle);
        setWorkflowStep('marking');
        setIsScannerOpen(false);
        toast.info('Demo Style Loaded');
      }
    } catch (error) {
      console.error('Scan Error:', error);
      toast.error('Failed to resolve style');
    } finally {
      setLoading(false);
    }
  };

  const handleDefectSubmit = async (selectedDefects: SelectedDefect[], notes: string, op?: string, opName?: string) => {
    if (!currentStyle || selectedDefects.length === 0) return;

    try {
      const finalOp = op || operation;
      const finalOpName = opName || operatorName;

      const report = {
        styleId: currentStyle.barcode,
        styleName: currentStyle.name,
        layoutImage: currentStyle.layoutImage || '',
        frontImageUrl: currentStyle.frontImageUrl || '',
        backImageUrl: currentStyle.backImageUrl || '',
        category: [...new Set(selectedDefects.map(d => d.category))].join(', '), 
        subCategory: selectedDefects.map(d => `${d.part}: ${d.subCategory}`).join(' | '), 
        part: [...new Set(selectedDefects.map(d => d.part))].join(', '), 
        defects: selectedDefects || [],
        customPoints: currentStyle.customPoints || [],
        status: 'pending',
        reporterEmail: user?.email || 'guest@scmgarments.com',
        reporterUid: user?.uid || 'guest',
        inspectorName: inspectorName || 'Unknown Inspector',
        operation: finalOp,
        operatorName: finalOpName,
        notes
      };

      // Submit to Firebase
      const firebaseId = await firebaseService.saveReport(report as any);
      
      // Also submit to API for background log/MongoDB sync
      try {
        await fetchApi('/api/defects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...report, reportId: firebaseId })
        });
      } catch (err) {
        console.warn('API sync failed, but Firebase persisted');
      }

      toast.success(`Inspection completed: ${selectedDefects.length} faults logged`);
      setIsReporting(false);
      setSelectedParts([]);
      setWorkflowStep('summary'); // Move to summary/report page after logging
      if (currentStyle?.barcode) {
        fetchStyleStats(currentStyle.barcode);
      }
    } catch (error) {
      toast.error('Failed to report defects');
    }
  };

  if (showAdminLogin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <Toaster position="bottom-right" theme="light" />
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <Card className="border-slate-200 shadow-2xl bg-white rounded-3xl overflow-hidden">
            <div className="h-2 bg-primary" />
            <CardHeader className="p-8 pb-4 text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Lock className="w-8 h-8 text-primary" />
              </div>
              <CardTitle className="text-3xl font-black tracking-tight">ADMIN ACCESS</CardTitle>
              <CardDescription className="text-xs font-bold uppercase tracking-widest text-slate-400 mt-2">Enter credentials to continue</CardDescription>
            </CardHeader>
            <CardContent className="p-8 pt-4">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <div className="relative">
                    <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input 
                      placeholder="Username" 
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="h-12 pl-12 bg-slate-50 border-slate-200 focus:border-primary rounded-xl"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input 
                      type="password"
                      placeholder="Password" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-12 pl-12 bg-slate-50 border-slate-200 focus:border-primary rounded-xl"
                    />
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button type="button" variant="ghost" onClick={() => setShowAdminLogin(false)} className="flex-1 h-12 text-xs font-bold uppercase tracking-widest text-slate-400 rounded-xl">
                    Back
                  </Button>
                  <Button type="submit" disabled={loading} className="flex-[2] h-12 bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest rounded-xl shadow-lg shadow-primary/20">
                    {loading ? '...' : 'Login'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-primary/30">
      <Toaster position="bottom-right" theme="light" />
      
      {/* Header */}
      <ScannerDialog 
        isOpen={isScannerOpen} 
        onClose={() => setIsScannerOpen(false)} 
        onScan={(code) => handleScan(code)} 
      />
      {/* Header - Hide on landing */}
      {workflowStep !== 'landing' && (
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 px-3 sm:px-6 py-2 sm:py-3 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
            <div className="text-primary font-black tracking-widest text-base sm:text-lg whitespace-nowrap cursor-pointer hover:opacity-80 transition-opacity" onClick={handleReturnHome}>SCM</div>
            <div className="h-5 sm:h-6 w-[1px] bg-slate-200" />
            <div className="flex items-center gap-1 sm:gap-6 font-mono text-[8px] sm:text-[10px] text-slate-400">
              <div className="truncate max-w-[80px] sm:max-w-none">ID: <span className="text-slate-900 font-bold">{currentStyle?.barcode || '---'}</span></div>
              {currentStyle && (
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[7.5px] h-3.5 border-primary/20 text-primary bg-primary/5 uppercase px-1.5">{workflowStep}</Badge>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-1 sm:gap-4">
            <nav className="flex bg-slate-100/50 p-1 rounded-xl border border-slate-200 mr-2">
              <button 
                onClick={() => setWorkflowStep('history')}
                className={`flex items-center gap-2 px-2 sm:px-3 py-1.5 rounded-lg text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all ${workflowStep === 'history' ? 'bg-white text-primary shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <History className="w-3 h-3" />
                <span className="hidden sm:inline">History</span>
              </button>
            </nav>
            <div className="flex bg-slate-100 p-0.5 sm:p-1 rounded-lg border border-slate-200 scale-90 sm:scale-100 origin-right">
              <Button 
                variant={view === 'employee' ? 'secondary' : 'ghost'} 
                size="sm" 
                onClick={() => {
                  setView('employee');
                  setWorkflowStep('landing');
                }}
                className={`h-7 sm:h-8 px-2 sm:px-4 text-[8px] sm:text-[10px] font-black uppercase tracking-widest rounded-md ${view === 'employee' && workflowStep === 'landing' ? 'bg-white text-primary shadow-sm' : 'text-slate-500'}`}
              >
                Scan
              </Button>
              <Button 
                variant={view === 'admin' ? 'secondary' : 'ghost'} 
                size="sm" 
                onClick={handleAdminClick}
                className={`h-7 sm:h-8 px-2 sm:px-4 text-[8px] sm:text-[10px] font-black uppercase tracking-widest rounded-md ${view === 'admin' ? 'bg-white text-primary shadow-sm' : 'text-slate-500'}`}
              >
                Admin
              </Button>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-3 pl-1 sm:pl-4 border-l border-slate-200">
              <div className="text-right">
                <p className="text-[8px] sm:text-[10px] font-black text-slate-900 uppercase tracking-tight truncate max-w-[60px] sm:max-w-none">{inspectorName || user.name}</p>
                {inspectorName && (
                  <button 
                    onClick={() => setShowInspectorModal(true)}
                    className="text-[6px] sm:text-[7px] font-bold text-primary hover:underline uppercase block text-right"
                  >
                    Change
                  </button>
                )}
              </div>
              {isAdminLoggedIn && (
                <Button variant="ghost" size="sm" onClick={handleLogout} className="h-6 w-6 sm:h-8 sm:w-8 p-0 rounded-full hover:bg-slate-100">
                  <Lock className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 text-slate-400" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>
      )}

      <main className={`${workflowStep === 'landing' ? 'p-0' : 'max-w-7xl mx-auto p-4 sm:p-6 pb-24 sm:pb-32'}`}>
        {view === 'admin' ? (
          <AdminDashboard 
            categories={categories} 
            onRefreshCategories={fetchCategories} 
            onBackToHome={handleReturnHome}
          />
        ) : (
          <div className="space-y-6">
            {/* Inspector Navigation Controls - Only show when style is active */}
            {currentStyle && (
              <div className="flex items-center justify-between bg-white px-4 py-2 rounded-2xl shadow-sm border border-slate-200 overflow-x-auto gap-4 no-scrollbar">
                <div className="flex items-center gap-1 p-1 bg-slate-50 rounded-xl border border-slate-100 flex-shrink-0">
                  <button 
                    onClick={() => setWorkflowStep('marking')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${workflowStep === 'marking' ? 'bg-white text-primary shadow-md' : 'text-slate-400'}`}
                  >
                    <PenTool className="w-3.5 h-3.5" />
                    Marking
                  </button>
                  <button 
                    onClick={() => {
                      if (currentStyle?.barcode) fetchStyleStats(currentStyle.barcode);
                      setWorkflowStep('summary');
                    }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${workflowStep === 'summary' ? 'bg-white text-rose-500 shadow-md' : 'text-slate-400'}`}
                  >
                    <Layout className="w-3.5 h-3.5" />
                    Report
                  </button>
                </div>

                <div className="flex items-center gap-3 ml-auto flex-shrink-0">
                  <div className="hidden sm:block text-right">
                    <span className="block text-[8px] font-bold text-slate-400 uppercase leading-none">Active Style</span>
                    <span className="text-[11px] font-black text-slate-900">{currentStyle.name}</span>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => {
                      setCurrentStyle(null);
                      setWorkflowStep('landing');
                    }}
                    className="h-9 px-4 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-primary hover:bg-primary/5 rounded-xl border border-slate-100"
                  >
                    <RefreshCcw className="w-3.5 h-3.5 mr-2" />
                    Switch Style
                  </Button>
                </div>
              </div>
            )}

            {/* Workflow Step Rendering */}
            <AnimatePresence mode="wait">
              {workflowStep === 'landing' && (
                <motion.div key="landing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <LandingScanner 
                    onScanResult={handleScanLanding} 
                    isAdmin={isAdminLoggedIn} 
                    onAdminAction={handleAdminClick}
                  />
                </motion.div>
              )}

              {workflowStep === 'setup' && !currentStyle && (
                <motion.div key="setup" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
                  <Card className="border-slate-200 shadow-xl bg-white rounded-3xl overflow-hidden max-w-2xl mx-auto ring-8 ring-slate-50">
                    <CardHeader className="pb-4 text-center p-8">
                      <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <Factory className="w-8 h-8 text-primary" />
                      </div>
                      <CardTitle className="text-3xl font-black tracking-tight">Inspection Setup</CardTitle>
                      <CardDescription className="text-sm font-medium text-slate-500">Scan style barcode and verify inspector credentials</CardDescription>
                    </CardHeader>
                    <CardContent className="p-8 pt-0">
                      <form onSubmit={(e) => { e.preventDefault(); handleScan(); }} className="space-y-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Style Barcode</label>
                          <div className="relative">
                            <Scan className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <Input 
                              placeholder="SCAN OR ENTER (SCM-SHORTS)" 
                              value={barcode}
                              onChange={(e) => setBarcode(e.target.value)}
                              className="h-14 pl-12 text-lg font-mono bg-slate-50 border-slate-200 focus:border-primary focus:ring-primary rounded-2xl"
                            />
                            <button 
                              type="button"
                              onClick={() => setIsScannerOpen(true)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all"
                            >
                              <Scan className="w-5 h-5" />
                            </button>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Inspector ID/Name</label>
                          <div className="relative">
                            <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <Input 
                              placeholder="YOUR NAME" 
                              value={inspectorName}
                              onChange={(e) => setInspectorName(e.target.value)}
                              className="h-14 pl-12 text-lg font-black bg-slate-50 border-slate-200 focus:border-primary focus:ring-primary rounded-2xl"
                            />
                          </div>
                          {/* Quick Switch in Setup */}
                          <div className="flex flex-wrap gap-2 pt-1">
                            {savedInspectors.map(name => (
                              <button
                                key={name}
                                type="button"
                                onClick={() => setInspectorName(name)}
                                className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all ${inspectorName === name ? 'bg-primary text-white border-primary' : 'bg-white text-slate-400 border-slate-200 hover:border-primary/50'}`}
                              >
                                {name}
                              </button>
                            ))}
                          </div>
                        </div>

                        <Button type="submit" disabled={loading} className="w-full h-14 bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-primary/30 transition-transform active:scale-[0.98]">
                          {loading ? 'Processing...' : 'Start Inspection Session'}
                        </Button>
                      </form>
                      
                      <div className="mt-8 pt-8 border-t border-slate-100">
                        <div className="flex items-center justify-between mb-4">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Quick Styles</p>
                          <button onClick={() => setWorkflowStep('history')} className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-1">
                            My History <ChevronRight className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {['SCM-TSHIRT', 'SCM-SHORTS', '123456'].map(code => (
                            <Button key={code} variant="outline" onClick={() => { setBarcode(code); handleScan(code); }} className="h-12 px-5 text-xs font-bold border-slate-200 hover:bg-slate-50 hover:border-primary text-slate-600 rounded-xl transition-all">
                              {code === '123456' ? 'Sample' : code.split('-')[1] || code}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {workflowStep === 'marking' && currentStyle && (
                <motion.div key="marking" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <div className="lg:col-span-8">
                      <Card className="border-slate-200 shadow-xl bg-white rounded-3xl overflow-hidden ring-1 ring-slate-100">
                        <CardHeader className="p-6 pb-0 border-b border-slate-50">
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-900">Mark Mistakes</CardTitle>
                              <CardDescription className="text-[10px] font-bold text-slate-400">Touch parts of the garment to log issues</CardDescription>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="flex flex-col items-end">
                                <Badge className="bg-primary text-white border-none uppercase text-[8px] tracking-[0.2em] font-black px-2.5 py-1 mb-1">INTERACTIVE</Badge>
                                <span className="text-[9px] font-mono text-slate-300">UID: {currentStyle.barcode}</span>
                              </div>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="p-0 bg-slate-50/50">
                          <div className="min-h-[500px] sm:min-h-[650px] relative flex items-center justify-center py-10 px-4">
                            <GarmentModel 
                              type={currentStyle.type} 
                              layoutImage={currentStyle.layoutImage}
                              frontImageUrl={currentStyle.frontImageUrl}
                              backImageUrl={currentStyle.backImageUrl}
                              customPoints={currentStyle.customPoints}
                              dualView={isDualView}
                              onPartClick={(part) => {
                                setSelectedParts(prev => 
                                  prev.includes(part) ? prev.filter(p => p !== part) : [...prev, part]
                                );
                              }}
                              selectedParts={selectedParts}
                            />
                            
                            {selectedParts.length === 0 && (
                              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                                <motion.div 
                                  initial={{ opacity: 0 }} 
                                  animate={{ opacity: 0.5 }} 
                                  className="text-center space-y-3"
                                >
                                  <div className="w-12 h-12 rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center mx-auto animate-pulse">
                                    <Plus className="w-6 h-6 text-slate-300" />
                                  </div>
                                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 whitespace-nowrap">Click any point to start marking</p>
                                </motion.div>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="lg:col-span-4 space-y-6">
                      <Card className="border-slate-200 shadow-xl bg-white rounded-3xl overflow-hidden sticky top-24 max-h-[calc(100vh-140px)] flex flex-col">
                        <CardHeader className="p-6 flex-shrink-0">
                          <CardTitle className="text-sm font-black uppercase tracking-widest">Inspection Info</CardTitle>
                          <CardDescription className="text-[10px] font-bold text-slate-400">Current active session details</CardDescription>
                        </CardHeader>
                        <CardContent className="p-6 pt-0 space-y-6 flex-1 overflow-y-auto custom-scrollbar">
                          <div className="space-y-4">
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Operating Inspector</p>
                              <p className="text-sm font-black text-slate-900">{inspectorName || 'Unknown Operator'}</p>
                            </div>
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Style Description</p>
                              <p className="text-sm font-black text-slate-900">{currentStyle.name}</p>
                            </div>
                          </div>

                          <div className="pt-6 border-t border-slate-100">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Selections ({selectedParts.length})</p>
                            {selectedParts.length > 0 ? (
                              <div className="flex flex-wrap gap-2">
                                {selectedParts.map(part => (
                                  <Badge key={part} variant="secondary" className="bg-slate-100 text-slate-600 border-none px-3 py-1 text-[9px] font-black uppercase">
                                    {part}
                                    <button onClick={() => setSelectedParts(p => p.filter(x => x !== part))} className="ml-2 hover:text-red-500">
                                      <X className="w-2.5 h-2.5" />
                                    </button>
                                  </Badge>
                                ))}
                              </div>
                            ) : (
                              <div className="text-center py-6 border-2 border-dashed border-slate-100 rounded-2xl">
                                <p className="text-[10px] font-bold text-slate-300 italic">No points marked yet</p>
                              </div>
                            )}
                          </div>

                          <Button 
                            disabled={selectedParts.length === 0}
                            onClick={() => setIsReporting(true)}
                            className="w-full h-16 bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-[0.1em] rounded-2xl shadow-xl shadow-primary/20 flex items-center justify-center gap-3 transition-all active:scale-[0.98] group"
                          >
                            Proceed to Details
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                          </Button>
                          
                          <Button 
                            variant="ghost"
                            onClick={() => {
                              setCurrentStyle(null);
                              setWorkflowStep('landing');
                            }}
                            className="w-full h-12 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-primary rounded-xl"
                          >
                            Switch Style / Cancel
                          </Button>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </motion.div>
              )}

              {workflowStep === 'summary' && currentStyle && (
                <motion.div key="summary" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-8 space-y-8">
                      <Card className="border-rose-100 shadow-2xl bg-white rounded-[2.5rem] overflow-hidden ring-8 ring-rose-50/30">
                        <CardHeader className="p-8 pb-4 border-b border-rose-50 bg-rose-50/50">
                          <div className="flex items-center justify-between">
                            <div className="space-y-2">
                              <Badge className="bg-rose-500 text-white border-none uppercase text-[9px] tracking-[0.2em] font-black px-3 py-1">Pattern Analysis</Badge>
                              <CardTitle className="text-3xl font-black text-slate-900 tracking-tight">Pattern Heat Map</CardTitle>
                              <CardDescription className="text-xs font-bold text-slate-400 uppercase tracking-widest">Aggregate results for this Style</CardDescription>
                            </div>
                            <div className="text-right">
                              <div className="text-[8px] font-black text-rose-400 uppercase tracking-[0.2em] mb-1">Total Reports</div>
                              <div className="text-5xl font-black text-rose-500 tabular-nums leading-none tracking-tighter">
                                {styleStats.totalReports}
                              </div>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="p-8 flex items-center justify-center min-h-[600px] relative bg-slate-50/30">
                          <GarmentModel 
                            type={currentStyle.type} 
                            layoutImage={currentStyle.layoutImage}
                            frontImageUrl={currentStyle.frontImageUrl}
                            backImageUrl={currentStyle.backImageUrl}
                            customPoints={currentStyle.customPoints}
                            selectedParts={[]} 
                            interactive={false} 
                            heatMapData={styleStats.counts}
                            heatMapDetails={styleStats.details}
                            onHeatPointClick={(part) => setInspectedPart(part)}
                          />
                        </CardContent>
                        <div className="bg-white p-6 border-t border-slate-100">
                          <div className="flex items-center gap-4 overflow-x-auto no-scrollbar pb-2">
                            <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl border border-slate-100 whitespace-nowrap">
                              <div className="w-3 h-3 rounded-full bg-rose-500" />
                              <span className="text-[10px] font-black uppercase text-slate-600">{'>'} 10 Faults</span>
                            </div>
                            <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl border border-slate-100 whitespace-nowrap">
                              <div className="w-3 h-3 rounded-full bg-orange-400" />
                              <span className="text-[10px] font-black uppercase text-slate-600">5-10 Faults</span>
                            </div>
                            <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl border border-slate-100 whitespace-nowrap">
                              <div className="w-3 h-3 rounded-full bg-yellow-300" />
                              <span className="text-[10px] font-black uppercase text-slate-600">1-5 Faults</span>
                            </div>
                          </div>
                        </div>
                      </Card>
                    </div>

                    <div className="lg:col-span-4 space-y-6">
                      <AnimatePresence mode="wait">
                        {inspectedPart ? (
                          <motion.div key="part-details" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                            <Card className="border-primary/20 shadow-xl bg-white rounded-3xl overflow-hidden ring-4 ring-primary/5">
                              <CardHeader className="p-6 bg-primary/5 border-b border-primary/10 flex flex-row items-center justify-between">
                                <div>
                                  <CardTitle className="text-sm font-black uppercase tracking-widest text-primary">{inspectedPart}</CardTitle>
                                  <CardDescription className="text-[10px] font-bold text-slate-400">Localized Fault Breakdown</CardDescription>
                                </div>
                                <button onClick={() => setInspectedPart(null)} className="p-2 hover:bg-white rounded-xl transition-colors">
                                  <X className="w-4 h-4 text-slate-400" />
                                </button>
                              </CardHeader>
                              <CardContent className="p-6 space-y-4">
                                {Object.entries(styleStats.details[inspectedPart] || {}).length > 0 ? (
                                  Object.entries(styleStats.details[inspectedPart]).map(([cat, count]) => {
                                    const numCount = count as number;
                                    const totalCount = (styleStats.counts[inspectedPart] || 1) as number;
                                    return (
                                      <div key={cat} className="space-y-2">
                                        <div className="flex justify-between items-center">
                                          <span className="text-[10px] font-black uppercase text-slate-600 truncate mr-2">{cat}</span>
                                          <Badge variant="outline" className="text-xs font-black border-slate-200">{numCount}</Badge>
                                        </div>
                                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                          <motion.div 
                                            initial={{ width: 0 }}
                                            animate={{ width: `${(numCount / totalCount) * 100}%` }}
                                            className="h-full bg-primary"
                                          />
                                        </div>
                                      </div>
                                    );
                                  })
                                ) : (
                                  <div className="text-center py-10 opacity-30 italic">No detailed records</div>
                                )}
                              </CardContent>
                            </Card>
                          </motion.div>
                        ) : (
                          <motion.div key="top-defects" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                            <Card className="border-slate-200 shadow-xl bg-white rounded-3xl overflow-hidden">
                              <CardHeader className="p-6 border-b border-slate-50">
                                <CardTitle className="text-sm font-black uppercase tracking-widest">Failure Rankings</CardTitle>
                                <CardDescription className="text-[10px] font-bold text-slate-400 uppercase">Worst Performing Points</CardDescription>
                              </CardHeader>
                              <CardContent className="p-0">
                                <div className="divide-y divide-slate-50">
                                  {Object.entries(styleStats.counts)
                                    .sort((a, b) => (b[1] as number) - (a[1] as number))
                                    .slice(0, 8)
                                    .map(([part, count], idx) => {
                                      const numCount = count as number;
                                      return (
                                        <button 
                                          key={part} 
                                          onClick={() => setInspectedPart(part)}
                                          className="w-full flex items-center justify-between p-5 hover:bg-slate-50 transition-all text-left group"
                                        >
                                          <div className="flex items-center gap-4">
                                            <div className="text-xs font-black text-slate-300 font-mono">0{idx + 1}</div>
                                            <div>
                                              <p className="text-[11px] font-black uppercase text-slate-900 leading-tight">{part}</p>
                                              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Click for trends</p>
                                            </div>
                                          </div>
                                          <Badge className={`border-none text-[10px] font-black ${numCount > 10 ? 'bg-rose-500 text-white' : 'bg-slate-100 text-slate-600'}`}>{numCount}</Badge>
                                        </button>
                                      );
                                    })}
                                  {Object.keys(styleStats.counts).length === 0 && (
                                    <div className="p-12 text-center opacity-30 uppercase font-black text-xs tracking-widest italic">
                                      No data yet
                                    </div>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>
                        )}
                      </AnimatePresence>
                      
                      <Button 
                        onClick={() => setWorkflowStep('marking')}
                        className="w-full h-14 bg-slate-900 hover:bg-slate-800 text-white font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-3"
                      >
                        <PlusCircle className="w-5 h-5" />
                        Log More Mistakes
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}

               {workflowStep === 'history' && (
                <motion.div key="history" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}>
                  <Card className="border-slate-200 shadow-xl bg-white rounded-3xl overflow-hidden max-w-4xl mx-auto ring-8 ring-slate-50">
                    <CardHeader className="p-8 border-b border-slate-50 flex flex-row items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
                          <History className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-xl font-black tracking-tight">Inspection History</CardTitle>
                          <CardDescription className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                            LOGGED BY: <span className="text-primary">{inspectorName}</span>
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 mr-2">
                          <button 
                            onClick={() => setHistoryFilter('mine')}
                            className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${historyFilter === 'mine' ? 'bg-white text-primary shadow-sm' : 'text-slate-400'}`}
                          >
                            Mine
                          </button>
                          <button 
                            onClick={() => setHistoryFilter('all')}
                            className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${historyFilter === 'all' ? 'bg-white text-primary shadow-sm' : 'text-slate-400'}`}
                          >
                            All
                          </button>
                        </div>
                        <Button 
                          variant="ghost" 
                          onClick={() => setWorkflowStep('landing')} 
                          className="h-10 text-[9px] sm:text-[10px] font-black uppercase text-slate-400 hover:text-primary rounded-xl"
                        >
                          <Plus className="w-3.5 h-3.5 mr-2" /> <span className="hidden sm:inline">New Scan</span>
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="p-0 min-h-[400px]">
                      {historyLoading ? (
                        <div className="flex flex-col items-center justify-center py-32 gap-4">
                          <RefreshCcw className="w-8 h-8 text-primary animate-spin" />
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Synchronizing Logs...</p>
                        </div>
                      ) : historyReports.length > 0 ? (
                        <div className="divide-y divide-slate-50">
                          {historyReports.map((report) => (
                            <div key={report.id} className="p-6 hover:bg-slate-50/50 transition-colors group">
                               <div className="flex items-start justify-between gap-4">
                                 <div className="space-y-3 flex-1">
                                    <div className="flex items-center gap-2">
                                      <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest bg-white border-slate-200">
                                        {report.styleNo}
                                      </Badge>
                                      <span className="text-[9px] font-bold text-slate-300">•</span>
                                      <span className="text-[10px] font-bold text-slate-400">
                                        {report.createdAt ? new Date(report.createdAt).toLocaleDateString() : 'Recent'} 
                                        {report.createdAt ? ' at ' + new Date(report.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                      </span>
                                    </div>
                                    <h4 className="text-sm font-black text-slate-900 uppercase">{report.styleName}</h4>
                                    
                                    <div className="flex flex-wrap gap-4 py-1">
                                      <div className="flex items-center gap-1.5">
                                        <Layers className="w-3 h-3 text-primary" />
                                        <span className="text-[10px] font-black uppercase text-slate-700">OPR: {report.operation || 'N/A'}</span>
                                      </div>
                                      <div className="flex items-center gap-1.5">
                                        <Users className="w-3 h-3 text-primary" />
                                        <span className="text-[10px] font-black uppercase text-slate-700">WORKER: {report.operatorName || 'UNKNOWN'}</span>
                                      </div>
                                    </div>

                                    <div className="flex flex-wrap gap-2">
                                      {report.defects.map((d, i) => (
                                        <div key={i} className="flex items-center gap-1.5 bg-rose-50 text-rose-600 px-2.5 py-1 rounded-lg border border-rose-100 shadow-sm shadow-rose-500/5">
                                          <AlertCircle className="w-3 h-3" />
                                          <span className="text-[9px] font-black uppercase tracking-tight">{d.category}</span>
                                          <span className="w-1 h-1 bg-rose-300 rounded-full" />
                                          <span className="text-[9px] font-bold opacity-80 uppercase">{d.part}</span>
                                        </div>
                                      ))}
                                    </div>
                                 </div>
                                 <div className="flex flex-col items-end gap-2">
                                    <div className="text-right">
                                       <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Quantity</p>
                                       <p className="text-sm font-black text-slate-900">{report.qty || 'N/A'}</p>
                                    </div>
                                    <Badge className="bg-emerald-500/10 text-emerald-600 border-none text-[8px] font-black uppercase tracking-widest px-2 py-1">
                                      Pushed to DB
                                    </Badge>
                                 </div>
                               </div>
                               {report.notes && (
                                 <div className="mt-4 p-3 bg-slate-100/50 rounded-xl border border-slate-100">
                                    <p className="text-[10px] font-medium text-slate-600 italic">"{report.notes}"</p>
                                 </div>
                               )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-20 text-center gap-6">
                          <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center rotate-3 border border-slate-100">
                            <Clock className="w-10 h-10 text-slate-300 -rotate-3" />
                          </div>
                          <div className="space-y-2 px-8">
                             <p className="text-lg font-black text-slate-900 uppercase tracking-tight">No History Found</p>
                             <p className="text-sm font-medium text-slate-400 max-w-sm mx-auto leading-relaxed">
                               We couldn't find any reports logged by <span className="text-primary font-bold">{inspectorName}</span>. 
                               Make sure you use the same name consistently.
                             </p>
                          </div>
                          <Button onClick={() => setWorkflowStep('landing')} className="h-14 px-8 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-xl shadow-slate-900/10">
                            Start First Inspection
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </main>
      
      {/* Mobile Portal for Reporting Form */}
      <AnimatePresence mode="wait">
        {isReporting && selectedParts.length > 0 && (
          <>
            {/* Dark Backdrop */}
            <motion.div
              key="mobile-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[900]"
              onClick={() => setIsReporting(false)}
            />
            
            {/* The Actual Drawer / Modal */}
            <motion.div
              key="mobile-drawer"
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-x-0 bottom-0 lg:inset-0 lg:m-auto lg:max-w-4xl lg:h-[90vh] lg:rounded-[40px] z-[1000] bg-white rounded-t-[40px] h-[95vh] flex flex-col shadow-[0_-20px_60px_rgba(0,0,0,0.4)] overflow-hidden border-t lg:border border-slate-200"
            >
              <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-2 mt-4 flex-shrink-0" />
              <div className="flex-1 min-h-0">
                <DefectForm 
                  parts={selectedParts} 
                  categories={categories}
                  onSubmit={handleDefectSubmit}
                  onCancel={() => setIsReporting(false)}
                  onReset={() => {
                    setIsReporting(false);
                    setSelectedParts([]);
                  }}
                  initialOperation={operation}
                  initialOperatorName={operatorName}
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Footer Status Bar */}
      <AnimatePresence>
        {showInspectorModal && view === 'employee' && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[2000] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-6"
          >
            <Card className="w-full max-w-sm border-none shadow-2xl bg-white rounded-3xl overflow-hidden">
              <div className="h-2 bg-primary" />
              <CardHeader className="text-center p-8 pb-4">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <UserIcon className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-2xl font-black uppercase tracking-tight">Checking Inspector</CardTitle>
                <CardDescription className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Verify who is conducting the audit</CardDescription>
              </CardHeader>
              <CardContent className="p-8 pt-4">
                <form onSubmit={(e) => {
                  e.preventDefault();
                  handleSetInspector(tempInspectorName);
                }} className="space-y-6">
                  <div className="space-y-4">
                    <Input 
                      autoFocus
                      placeholder="INSPECTOR NAME (e.g. Person X)" 
                      value={tempInspectorName}
                      onChange={(e) => setTempInspectorName(e.target.value)}
                      className="h-14 text-center text-lg font-black uppercase tracking-widest bg-slate-50 border-slate-200 rounded-xl"
                    />
                    
                    {/* Quick Switch in Modal */}
                    <div className="space-y-2">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest text-center">Quick Switch Team</p>
                      <div className="flex flex-wrap justify-center gap-2">
                        {savedInspectors.map(name => (
                          <Button
                            key={name}
                            type="button"
                            variant="outline"
                            onClick={() => handleSetInspector(name)}
                            className="h-9 px-4 rounded-xl text-[10px] font-black border-slate-100 bg-slate-50/50 hover:bg-primary/5 hover:text-primary hover:border-primary/20"
                          >
                            {name}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {inspectorName && (
                      <Button 
                        type="button"
                        variant="ghost"
                        onClick={() => setShowInspectorModal(false)}
                        className="flex-1 h-14 font-black uppercase tracking-widest rounded-xl"
                      >
                        Cancel
                      </Button>
                    )}
                    <Button 
                      type="submit"
                      disabled={!tempInspectorName.trim()}
                      className="flex-[2] h-14 bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest rounded-xl shadow-lg shadow-primary/20"
                    >
                      Set Identity
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-slate-200 px-4 py-2 flex items-center justify-between gap-2 z-[60] shadow-[0_-4px_10px_rgba(0,0,0,0.02)] h-10">
        <div className="flex items-center gap-3 sm:gap-6 font-mono text-[8px] sm:text-[10px] w-full sm:w-auto justify-center sm:justify-start">
          <div className="flex items-center gap-1.5 text-green-600 font-bold">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            LIVE
          </div>
          <div className="text-slate-300">|</div>
          <div className="text-slate-400 uppercase font-bold">MODE: PERSISTENT</div>
          <div className="text-slate-300">|</div>
          <div className="text-blue-500 font-bold uppercase">MOBILE: READY</div>
        </div>
        <div className="text-[8px] font-mono text-slate-400 uppercase tracking-widest font-bold">
          SCM_QC_v2.0.0
        </div>
      </footer>
    </div>
  );
}
