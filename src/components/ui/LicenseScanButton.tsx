'use client';

import { useState, useRef } from 'react';
import { Camera, Loader2, CheckCircle2, AlertCircle, Upload, Scan, Search } from 'lucide-react';

export interface ScanResult {
  licensePlate?: string;
  manufacturer?: string;
  model?: string;
  year?: string;
  color?: string;
  fuelType?: string;
  chassisNumber?: string;
  ownerName?: string;
  nickname?: string;
  testExpiryDate?: string;
  // New fields from MOT API
  trimLevel?: string;
  engineModel?: string;
}

interface LicenseScanButtonProps {
  onScanResult: (result: ScanResult) => void;
  /** If true, shows a compact version for inline use */
  compact?: boolean;
}

/**
 * Resize image for OCR processing — large phone photos can crash Tesseract.
 */
function resizeImageForOCR(file: File, maxWidth = 1600): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      if (img.width <= maxWidth && img.height <= maxWidth) {
        resolve(URL.createObjectURL(file));
        return;
      }
      const canvas = document.createElement('canvas');
      const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
      canvas.width = Math.round(img.width * ratio);
      canvas.height = Math.round(img.height * ratio);
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('Canvas not supported')); return; }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        if (!blob) { reject(new Error('Failed to resize')); return; }
        resolve(URL.createObjectURL(blob));
      }, 'image/jpeg', 0.85);
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Failed to load image')); };
    img.src = url;
  });
}

/**
 * Extract license plate number from OCR text.
 * Israeli plates are 7-8 digits, possibly with dashes or spaces.
 */
function extractLicensePlate(text: string): string | null {
  // Try multiple patterns for Israeli license plates
  const patterns = [
    /(\d{2,3}[-–\s]?\d{2,3}[-–\s]?\d{2,3})/g,  // 12-345-67 or 123-45-678
    /(\d{7,8})/g,                                   // 1234567 or 12345678
  ];

  for (const pattern of patterns) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      const plate = match[1].replace(/[-–\s]/g, '');
      if (plate.length >= 7 && plate.length <= 8) {
        return plate;
      }
    }
  }
  return null;
}

/**
 * Lookup vehicle data from Ministry of Transport API.
 */
async function lookupVehicleByPlate(plate: string): Promise<ScanResult | null> {
  try {
    const res = await fetch(`/api/vehicles/lookup?plate=${encodeURIComponent(plate)}`);
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.vehicle) return null;

    const v = data.vehicle;
    return {
      licensePlate: v.licensePlate || plate,
      manufacturer: v.manufacturer || undefined,
      model: v.model || undefined,
      year: v.year ? String(v.year) : undefined,
      color: v.color || undefined,
      fuelType: v.fuelType || undefined,
      chassisNumber: v.vin || undefined,
      testExpiryDate: v.testExpiryDate || undefined,
      trimLevel: v.trimLevel || undefined,
      engineModel: v.engineModel || undefined,
      nickname: v.manufacturer && v.model ? `${v.manufacturer} ${v.model}` : undefined,
    };
  } catch {
    return null;
  }
}

export default function LicenseScanButton({ onScanResult, compact = false }: LicenseScanButtonProps) {
  const [scanning, setScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [scanProgress, setScanProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const processImage = async (file: File) => {
    setScanning(true);
    setScanStatus('loading');
    setScanProgress(10);
    setStatusMessage('מכין תמונה לסריקה...');

    let imageUrl = '';
    try {
      // Step 1: Resize image
      imageUrl = await resizeImageForOCR(file);
      setScanProgress(20);
      setStatusMessage('טוען מנוע זיהוי...');

      // Step 2: Load Tesseract.js and run OCR
      const { createWorker } = await import('tesseract.js');
      setScanProgress(30);
      setStatusMessage('מאתחל סריקה...');

      const worker = await createWorker('heb+eng', undefined, {
        logger: (m: { status: string; progress: number }) => {
          if (m.status === 'recognizing text') {
            const pct = 30 + Math.round(m.progress * 40);
            setScanProgress(pct);
            setStatusMessage(`סורק מסמך... ${Math.round(m.progress * 100)}%`);
          } else if (m.status === 'loading language traineddata') {
            setScanProgress(25 + Math.round(m.progress * 5));
            setStatusMessage('טוען נתוני שפה...');
          }
        },
      });

      const result = await worker.recognize(imageUrl);
      await worker.terminate();
      URL.revokeObjectURL(imageUrl);
      imageUrl = '';

      const ocrText = result.data.text;
      setScanProgress(75);

      if (!ocrText || ocrText.trim().length < 5) {
        setScanStatus('error');
        setStatusMessage('לא זוהה טקסט בתמונה. נסה לצלם שוב עם תאורה טובה.');
        setScanning(false);
        return;
      }

      // Step 3: Extract license plate from OCR text
      const plate = extractLicensePlate(ocrText);

      if (!plate) {
        setScanStatus('error');
        setStatusMessage('לא זוהה מספר רכב בתמונה. נסה לצלם את החלק עם מספר הרכב.');
        setScanning(false);
        return;
      }

      setScanProgress(80);
      setStatusMessage(`זוהה מספר רכב: ${plate}. מחפש פרטים במשרד התחבורה...`);

      // Step 4: Lookup full vehicle data from MOT API
      const vehicleData = await lookupVehicleByPlate(plate);
      setScanProgress(100);

      if (vehicleData) {
        const fieldsFound = Object.values(vehicleData).filter(Boolean).length;
        setScanStatus('success');
        setStatusMessage(`נמצאו ${fieldsFound} פרטים! הנתונים מולאו אוטומטית.`);
        onScanResult(vehicleData);
      } else {
        // Even if MOT lookup fails, return the plate number
        setScanStatus('success');
        setStatusMessage(`זוהה מספר רכב: ${plate}. לא נמצאו פרטים נוספים במשרד התחבורה.`);
        onScanResult({ licensePlate: plate });
      }

      // Reset after delay
      setTimeout(() => {
        setScanStatus('idle');
        setStatusMessage('');
        setScanProgress(0);
      }, 5000);

    } catch (err) {
      console.error('OCR Error:', err);
      if (imageUrl) URL.revokeObjectURL(imageUrl);
      setScanStatus('error');
      const errMsg = err instanceof Error ? err.message : '';
      if (errMsg.includes('memory') || errMsg.includes('allocation')) {
        setStatusMessage('התמונה גדולה מדי. נסה לצלם מקרוב יותר.');
      } else if (errMsg.includes('network') || errMsg.includes('fetch') || errMsg.includes('load')) {
        setStatusMessage('שגיאת רשת. ודא שיש חיבור אינטרנט ונסה שוב.');
      } else {
        setStatusMessage('שגיאה בסריקה. נסה לצלם שוב עם תאורה טובה.');
      }
    }

    setScanning(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setScanStatus('error');
      setStatusMessage('נא לבחור קובץ תמונה בלבד');
      return;
    }
    processImage(file);
    e.target.value = '';
  };

  // Compact version for inline use (e.g. onboarding wizard)
  if (compact) {
    return (
      <div className="space-y-2">
        <div className={`rounded-xl border-2 border-dashed p-3 transition-all ${
          scanStatus === 'loading' ? 'border-teal-400 bg-teal-50' :
          scanStatus === 'success' ? 'border-green-400 bg-green-50' :
          scanStatus === 'error' ? 'border-red-300 bg-red-50' :
          'border-blue-300 bg-blue-50'
        }`}>
          <div className="flex items-center gap-2 mb-2">
            {scanStatus === 'loading' ? (
              <Loader2 size={16} className="text-teal-600 animate-spin" />
            ) : scanStatus === 'success' ? (
              <CheckCircle2 size={16} className="text-green-600" />
            ) : scanStatus === 'error' ? (
              <AlertCircle size={16} className="text-red-500" />
            ) : (
              <Scan size={16} className="text-blue-600" />
            )}
            <span className={`text-xs font-medium ${
              scanStatus === 'success' ? 'text-green-700' :
              scanStatus === 'error' ? 'text-red-700' :
              scanStatus === 'loading' ? 'text-teal-700' :
              'text-blue-700'
            }`}>
              {statusMessage || 'צלם רישיון רכב למילוי אוטומטי'}
            </span>
          </div>

          {scanStatus === 'loading' && (
            <div className="w-full bg-teal-200 rounded-full h-1.5 mb-2 overflow-hidden">
              <div className="bg-teal-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${scanProgress}%` }} />
            </div>
          )}

          {scanStatus !== 'loading' && (
            <div className="flex gap-2">
              <button type="button" onClick={() => cameraInputRef.current?.click()} disabled={scanning}
                className="flex-1 flex items-center justify-center gap-1.5 px-2 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition disabled:opacity-50">
                <Camera size={14} /> צלם
              </button>
              <button type="button" onClick={() => fileInputRef.current?.click()} disabled={scanning}
                className="flex-1 flex items-center justify-center gap-1.5 px-2 py-2 bg-white text-blue-700 border border-blue-300 rounded-lg text-xs font-semibold hover:bg-blue-50 transition disabled:opacity-50">
                <Upload size={14} /> העלה
              </button>
            </div>
          )}
        </div>

        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />
      </div>
    );
  }

  // Full version
  return (
    <div className="space-y-3">
      <div className={`rounded-2xl border-2 border-dashed p-4 transition-all ${
        scanStatus === 'loading' ? 'border-teal-400 bg-teal-50' :
        scanStatus === 'success' ? 'border-green-400 bg-green-50' :
        scanStatus === 'error' ? 'border-red-300 bg-red-50' :
        'border-blue-300 bg-gradient-to-l from-blue-50 to-indigo-50'
      }`}>
        <div className="flex items-center gap-3 mb-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
            scanStatus === 'loading' ? 'bg-teal-100' :
            scanStatus === 'success' ? 'bg-green-100' :
            scanStatus === 'error' ? 'bg-red-100' :
            'bg-blue-100'
          }`}>
            {scanStatus === 'loading' ? (
              <Loader2 size={20} className="text-teal-600 animate-spin" />
            ) : scanStatus === 'success' ? (
              <CheckCircle2 size={20} className="text-green-600" />
            ) : scanStatus === 'error' ? (
              <AlertCircle size={20} className="text-red-500" />
            ) : (
              <Scan size={20} className="text-blue-600" />
            )}
          </div>
          <div className="flex-1">
            <h4 className={`font-bold text-sm ${
              scanStatus === 'success' ? 'text-green-800' :
              scanStatus === 'error' ? 'text-red-800' :
              scanStatus === 'loading' ? 'text-teal-800' :
              'text-blue-800'
            }`}>
              {scanStatus === 'idle' ? 'סריקה חכמה של רישיון רכב' :
               scanStatus === 'loading' ? 'סורק...' :
               scanStatus === 'success' ? 'הסריקה הושלמה!' :
               'שגיאת סריקה'}
            </h4>
            <p className={`text-xs ${
              scanStatus === 'success' ? 'text-green-600' :
              scanStatus === 'error' ? 'text-red-600' :
              scanStatus === 'loading' ? 'text-teal-600' :
              'text-blue-600'
            }`}>
              {statusMessage || 'צלם או העלה תמונה של רישיון הרכב — מספר הרכב יזוהה והפרטים ימולאו ממשרד התחבורה'}
            </p>
          </div>
        </div>

        {/* Progress bar */}
        {scanStatus === 'loading' && (
          <div className="w-full bg-teal-200 rounded-full h-1.5 mb-3 overflow-hidden">
            <div className="bg-teal-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${scanProgress}%` }} />
          </div>
        )}

        {/* Action buttons */}
        {scanStatus !== 'loading' && (
          <div className="flex gap-2">
            <button type="button" onClick={() => cameraInputRef.current?.click()} disabled={scanning}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-50 shadow-sm">
              <Camera size={16} /> צלם רישיון
            </button>
            <button type="button" onClick={() => fileInputRef.current?.click()} disabled={scanning}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-white text-blue-700 border border-blue-300 rounded-xl text-sm font-semibold hover:bg-blue-50 transition disabled:opacity-50">
              <Upload size={16} /> העלה תמונה
            </button>
          </div>
        )}
      </div>

      {/* Hidden file inputs */}
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
      <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />
    </div>
  );
}
