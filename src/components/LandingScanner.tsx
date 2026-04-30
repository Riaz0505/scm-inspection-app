import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats, Html5Qrcode } from 'html5-qrcode';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, Image as ImageIcon, QrCode, ArrowRight, Loader2, X, Info, CheckCircle2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { getApiUrl } from '../lib/api';

declare global {
  interface Window {
    Capacitor?: any;
  }
}

interface LandingScannerProps {
  onScanResult: (data: { bundleNo: string; qty: string; styleNo: string }) => void;
  isAdmin: boolean;
  onAdminAction: () => void;
}

export const LandingScanner: React.FC<LandingScannerProps> = ({ onScanResult, isAdmin, onAdminAction }) => {
  const [activeTab, setActiveTab] = useState<'camera' | 'file'>('camera');
  const [loading, setLoading] = useState(false);
  const [isCapacitor] = useState(() => typeof window !== 'undefined' && !!window.Capacitor);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const nativeListenerRef = useRef<any>(null);

  const handleData = (decodedText: string) => {
    if (!decodedText) return;
    const cleanText = decodedText.trim();
    console.log(`[LandingScanner] Scanned: "${cleanText}"`);
    
    try {
      // 1. Handle JSON data
      if (cleanText.startsWith('{')) {
        const data = JSON.parse(cleanText);
        const styleNo = data.styleNo || data['Style No'] || data.style_no || data.StyleNo;
        const bundleNo = data.bundleNo || data['Bundle No'] || data.bundle_no || data.BundleNo;
        const qty = data.qty || data.Qty || data.quantity || data.Quantity;
        
        if (styleNo) {
          onScanResult({ bundleNo: String(bundleNo || ''), qty: String(qty || ''), styleNo: String(styleNo) });
          return;
        }
      }

      // 2. Handle URL data (extract last part or query param)
      if (cleanText.startsWith('http')) {
        try {
          const url = new URL(cleanText);
          const pathParts = url.pathname.split('/').filter(Boolean);
          const idFromQuery = url.searchParams.get('id') || url.searchParams.get('barcode');
          const idFromPath = pathParts[pathParts.length - 1];
          
          if (idFromQuery || idFromPath) {
            onScanResult({ bundleNo: '', qty: '', styleNo: idFromQuery || idFromPath });
            return;
          }
        } catch (e) {
          // Fall through
        }
      }

      // 3. Handle Key:Value pairs or comma separated data
      const parts = cleanText.split(/[,|;\n]/).filter(p => p.trim());
      
      if (parts.length === 1) {
        // Plain text - treat as styleNo/barcode
        onScanResult({ bundleNo: '', qty: '', styleNo: parts[0].trim() });
        return;
      }

      let bundleNo = '', qty = '', styleNo = '';
      let identifiedFields = 0;
      
      parts.forEach(p => {
        const pLower = p.toLowerCase();
        if (pLower.includes('style')) {
           styleNo = p.split(':')[1]?.trim() || p.split('=')[1]?.trim() || '';
           if (styleNo) identifiedFields++;
        }
        if (pLower.includes('bundle')) {
           bundleNo = p.split(':')[1]?.trim() || p.split('=')[1]?.trim() || '';
           if (bundleNo) identifiedFields++;
        }
        if (pLower.includes('qty') || pLower.includes('quantity')) {
           qty = p.split(':')[1]?.trim() || p.split('=')[1]?.trim() || '';
           if (qty) identifiedFields++;
        }
      });

      if (styleNo) {
        onScanResult({ bundleNo, qty, styleNo });
      } else if (identifiedFields === 0) {
        onScanResult({ bundleNo: '', qty: '', styleNo: cleanText });
      } else {
        toast.error('No Style Number detected.');
      }
    } catch (e) {
      onScanResult({ bundleNo: '', qty: '', styleNo: cleanText });
    }
  };

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        await scannerRef.current.clear();
        scannerRef.current = null;
      } catch (err) {
        console.warn('Scanner stop error', err);
      }
    }
    // Also try to stop native just in case it was left running by another component
    try {
      const { BarcodeScanner } = await import('@capacitor-mlkit/barcode-scanning');
      await BarcodeScanner.stopScan();
      document.body.classList.remove('scanner-active-native');
    } catch (e) {}
  }, []);

  const startScanner = useCallback(async () => {
    try {
      await stopScanner(); // Always cleanup first

      const scanner = new Html5Qrcode("landing-qr-reader");
      scannerRef.current = scanner;

      const config = {
        fps: 20,
        qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
          const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
          const size = Math.floor(minEdge * 0.7);
          return { width: size, height: size };
        },
        aspectRatio: 1.0,
      };

      await scanner.start(
        { facingMode: "environment" },
        config,
        (decodedText) => {
          handleData(decodedText);
          stopScanner();
        },
        () => {}
      );
    } catch (err) {
      console.error("Scanner Start Error:", err);
      setCameraError("Could not access camera. Please check permissions.");
    }
  }, [handleData, stopScanner]);

  useEffect(() => {
    if (activeTab === 'camera') {
      const timer = setTimeout(() => {
        startScanner();
      }, 500);
      return () => {
        clearTimeout(timer);
        stopScanner();
      };
    } else {
      stopScanner();
    }
  }, [activeTab, startScanner, stopScanner]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    toast.info('Analyzing image...');
    
    try {
      const html5QrCode = new Html5Qrcode("landing-qr-reader-hidden");
      const decodedText = await html5QrCode.scanFile(file, true);
      handleData(decodedText);
    } catch (err) {
      toast.error('No barcode found in image');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // If we are on a hosted web URL, save it as a potential API fallback for mobile
    if (typeof window !== 'undefined' && !window.location.origin.includes('localhost')) {
      localStorage.setItem('scm_remote_api_url', window.location.origin);
    }
  }, []);

  const [apiStatus, setApiStatus] = useState<'testing' | 'online' | 'offline'>('testing');
  
  useEffect(() => {
    const checkApi = async () => {
      try {
        const url = getApiUrl('/api/categories');
        const resp = await fetch(url);
        if (resp.ok) setApiStatus('online');
        else setApiStatus('offline');
      } catch (e) {
        setApiStatus('offline');
      }
    };
    checkApi();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 pb-24">
      <div className="fixed top-6 left-6 z-[100]">
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full border text-[8px] font-black uppercase tracking-widest ${apiStatus === 'online' ? 'bg-emerald-50 text-emerald-500 border-emerald-100' : apiStatus === 'offline' ? 'bg-rose-50 text-rose-500 border-rose-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
          <div className={`w-1.5 h-1.5 rounded-full ${apiStatus === 'online' ? 'bg-emerald-500 animate-pulse' : apiStatus === 'offline' ? 'bg-rose-500' : 'bg-slate-300'}`} />
          Server: {apiStatus === 'online' ? 'Sync Active' : apiStatus === 'testing' ? 'Connecting...' : 'Offline / Error'}
        </div>
      </div>
      <div id="landing-qr-reader-hidden" className="hidden"></div>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md space-y-8"
      >
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-white rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-xl border border-slate-200">
            <QrCode className="w-8 h-8 text-slate-900" />
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">SCM QC System</h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">
            Scan Bundle QR Code to Start Inspection
          </p>
        </div>

        <Card className="border-none shadow-2xl bg-white rounded-[2.5rem] overflow-hidden ring-8 ring-slate-100">
          <div className="flex bg-slate-100 p-2 gap-2">
            <button 
              onClick={() => setActiveTab('camera')}
              className={`flex-1 h-12 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activeTab === 'camera' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <Camera className="w-4 h-4" />
              Live Camera
            </button>
            <button 
              onClick={() => setActiveTab('file')}
              className={`flex-1 h-12 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activeTab === 'file' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <ImageIcon className="w-4 h-4" />
              Upload Image
            </button>
          </div>

          <CardContent className="p-8">
            <div className="aspect-[4/3] bg-slate-100 rounded-3xl overflow-hidden relative border-4 border-white shadow-2xl">
              {activeTab === 'camera' ? (
                <>
                  <div id="landing-qr-reader" className="w-full h-full" />
                  {cameraError && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-white/90 z-20">
                      <p className="text-xs font-black text-slate-900 uppercase mb-4">{cameraError}</p>
                      <Button onClick={startScanner} className="bg-slate-900 text-white rounded-2xl h-12 px-6 font-black uppercase text-[10px]">
                        Retry Camera
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 gap-4">
                  {loading ? (
                    <div className="flex flex-col items-center gap-4">
                      <RefreshCw className="w-8 h-8 text-primary animate-spin" />
                      <p className="text-[10px] font-black text-slate-900 uppercase">Processing...</p>
                    </div>
                  ) : (
                    <>
                      <div className="w-16 h-16 rounded-full bg-white shadow-sm border border-slate-100 flex items-center justify-center mb-2">
                        <ImageIcon className="w-6 h-6 text-slate-300" />
                      </div>
                      <p className="text-xs font-black text-slate-900 uppercase">Select from Gallery</p>
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        onChange={handleFileChange}
                      />
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="mt-8 p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-4">
               <div className="flex items-start gap-4">
                 <div className="w-8 h-8 rounded-xl bg-slate-900 flex items-center justify-center flex-shrink-0">
                    <Info className="w-4 h-4 text-white" />
                 </div>
                 <div className="space-y-1">
                   <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Expected Data Format</p>
                   <p className="text-[9px] font-bold text-slate-400 leading-relaxed uppercase">QR should contain Bundle No, Qty, and Style No details.</p>
                 </div>
               </div>
            </div>
          </CardContent>
        </Card>

        <div className="pt-4 flex flex-col gap-4">
          <Button 
            variant="ghost" 
            onClick={onAdminAction}
            className="h-14 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-all rounded-2xl"
          >
            Access Admin Center
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

