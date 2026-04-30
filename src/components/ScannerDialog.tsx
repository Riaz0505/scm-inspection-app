import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Button } from '@/components/ui/button';
import { X, Camera, Zap, RefreshCw, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

interface ScannerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (barcode: string) => void;
}

declare global {
  interface Window {
    Capacitor?: any;
  }
}

export const ScannerDialog: React.FC<ScannerDialogProps> = ({ isOpen, onClose, onScan }) => {
  const [isCapacitor, setIsCapacitor] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);

  useEffect(() => {
    setIsCapacitor(!!window.Capacitor);
  }, []);

  const stopNativeScan = useCallback(async () => {
    document.body.classList.remove('scanner-active-native');
    try {
      const { BarcodeScanner } = await import('@capacitor-mlkit/barcode-scanning');
      await BarcodeScanner.stopScan();
    } catch (err) {
      console.warn("Native stop scan error", err);
    }
  }, []);

  const startNativeScan = useCallback(async () => {
    setIsInitializing(true);
    try {
      await stopNativeScan(); // Critical cleanup
      
      const { BarcodeScanner } = await import('@capacitor-mlkit/barcode-scanning');
      const status = await BarcodeScanner.requestPermissions();

      if (status.camera === 'granted') {
        setHasPermission(true);
        document.body.classList.add('scanner-active-native');
        
        const listener = await BarcodeScanner.addListener('barcodesScanned', async (result) => {
          if (result.barcodes && result.barcodes.length > 0) {
            onScan(result.barcodes[0].displayValue);
            await stopNativeScan();
            await listener.remove();
            onClose();
          }
        });

        await BarcodeScanner.startScan();
      } else {
        setHasPermission(false);
        toast.error("Camera permission denied.");
      }
    } catch (err) {
      console.error("Native Scan Failed", err);
      setIsCapacitor(false); 
      document.body.classList.remove('scanner-active-native');
    } finally {
      setIsInitializing(false);
    }
  }, [onScan, onClose, stopNativeScan]);

  const startWebScanner = useCallback(async () => {
    setIsInitializing(true);
    try {
      if (html5QrCodeRef.current) {
         await html5QrCodeRef.current.stop().catch(() => {});
      }

      const html5QrCode = new Html5Qrcode("qr-reader");
      html5QrCodeRef.current = html5QrCode;

      const config = { 
        fps: 20,
        qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
            const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
            const size = Math.floor(minEdge * 0.7);
            return { width: size, height: size };
        },
        aspectRatio: 1.0,
      };

      await html5QrCode.start(
        { facingMode: "environment" }, 
        config,
        (decodedText) => {
          onScan(decodedText);
          html5QrCode.stop().then(() => {
            onClose();
          }).catch(() => onClose());
        },
        () => {}
      );
      setHasPermission(true);
    } catch (err) {
      console.error("Web Scanner Error:", err);
      setHasPermission(false);
    } finally {
      setIsInitializing(false);
    }
  }, [onScan, onClose]);

  const stopWebScanner = useCallback(async () => {
    if (html5QrCodeRef.current) {
      try {
        if (html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop();
        }
        await html5QrCodeRef.current.clear();
        html5QrCodeRef.current = null;
      } catch (err) {
        console.warn("Stop scanner error", err);
      }
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      if (isCapacitor) {
        startNativeScan();
      } else {
        const timer = setTimeout(() => {
          startWebScanner();
        }, 300);
        return () => clearTimeout(timer);
      }
    } else {
      if (isCapacitor) {
        stopNativeScan();
      } else {
        stopWebScanner();
      }
    }

    return () => {
      if (isCapacitor) {
        stopNativeScan();
      } else {
        stopWebScanner();
      }
      document.body.classList.remove('scanner-active-native');
    };
  }, [isOpen, isCapacitor, startNativeScan, stopNativeScan, startWebScanner, stopWebScanner]);

  return (
    <>
      <AnimatePresence>
        {isOpen && isCapacitor && (
          <div className="fixed inset-0 z-[3000] flex flex-col pointer-events-none items-center justify-between p-10 scanner-ui-native">
            <div className="w-full flex items-center justify-between pointer-events-auto">
              <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xl">
                <p className="text-slate-900 text-[10px] font-black tracking-widest uppercase">HD SCANNER</p>
              </div>
              <button 
                onClick={() => {
                  stopNativeScan();
                  onClose();
                }}
                className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-900 shadow-xl transition-all pointer-events-auto active:scale-90"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="relative w-72 h-72 border-2 border-white/50 rounded-[3rem] shadow-[0_0_0_1000px_rgba(0,0,0,0.3)]">
              <div className="absolute top-0 left-0 w-16 h-16 border-t-8 border-l-8 border-primary rounded-tl-[3rem]" />
              <div className="absolute top-0 right-0 w-16 h-16 border-t-8 border-r-8 border-primary rounded-tr-[3rem]" />
              <div className="absolute bottom-0 left-0 w-16 h-16 border-b-8 border-l-8 border-primary rounded-bl-[3rem]" />
              <div className="absolute bottom-0 right-0 w-16 h-16 border-b-8 border-r-8 border-primary rounded-br-[3rem]" />
              <div className="absolute top-0 left-0 w-full h-[4px] bg-primary animate-scan-fast shadow-[0_0_20px_#681A28]" />
            </div>

            <div className="w-full max-w-xs space-y-4 pointer-events-auto pb-16">
              <div className="bg-white p-5 rounded-3xl border border-slate-200 text-center shadow-2xl">
                 <p className="text-slate-900 font-extrabold uppercase text-xs tracking-widest">Alignment Active</p>
              </div>
              <Button 
                onClick={() => {
                   stopNativeScan();
                   onClose();
                }}
                className="w-full h-16 bg-slate-900 text-white font-black uppercase tracking-widest rounded-3xl shadow-2xl active:scale-95"
              >
                Close Scanner
              </Button>
            </div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && !isCapacitor && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[3000] flex items-center justify-center p-4 sm:p-8 bg-black/60 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-md rounded-[3rem] overflow-hidden shadow-2xl flex flex-col border border-slate-200"
            >
              <div className="p-8 flex items-center justify-between border-b border-slate-100">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100">
                    <Camera className="w-6 h-6 text-slate-900" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black uppercase tracking-widest text-slate-900 leading-none">SCANNER</h3>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Ready for capture</p>
                  </div>
                </div>
                <button 
                  onClick={onClose}
                  className="w-11 h-11 rounded-2xl bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-500 transition-all active:scale-90"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-8 bg-slate-50 relative aspect-square flex items-center justify-center">
                {isInitializing && (
                   <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm">
                      <RefreshCw className="w-10 h-10 text-primary animate-spin mb-4" />
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Initializing Camera...</p>
                   </div>
                )}

                {hasPermission === false && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-10 text-center bg-white z-20">
                    <AlertCircle className="w-14 h-14 text-rose-500 mb-6 animate-pulse" />
                    <h4 className="text-xl font-black text-slate-900 uppercase">Camera Blocked</h4>
                    <p className="text-[10px] font-bold text-slate-400 uppercase mt-2 tracking-widest">Enable permission in settings</p>
                    <Button onClick={() => window.location.reload()} className="mt-8 bg-slate-900 rounded-2xl px-10 h-14 font-black">
                      Retry
                    </Button>
                  </div>
                )}
                
                <div 
                  id="qr-reader" 
                  className="w-full h-full bg-white rounded-[2.5rem] overflow-hidden border-2 border-slate-100 shadow-inner relative z-10"
                />

                <div className="absolute inset-0 z-10 pointer-events-none p-12">
                   <div className="w-full h-full border-2 border-primary/20 rounded-[2rem] flex items-center justify-center">
                      <div className="w-full h-[2px] bg-primary shadow-[0_0_15px_#681A28] animate-pulse" />
                   </div>
                </div>
              </div>

              <div className="p-8 bg-white flex flex-col gap-6">
                 <div className="flex items-center justify-center gap-3">
                    <Zap className="w-4 h-4 text-emerald-500" />
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Autodetect Enabled</span>
                 </div>
                 <Button 
                   onClick={onClose}
                   className="w-full h-16 bg-slate-900 text-white font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl hover:bg-slate-800 transition-all active:scale-95"
                 >
                   Cancel Scan
                 </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes scan-fast {
          0% { top: 0; }
          100% { top: 100%; }
        }
        .animate-scan-fast {
          animation: scan-fast 1.5s linear infinite;
        }
      `}} />
    </>
  );
};
